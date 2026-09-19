import '@/components/werkbank-layout.css';
import Link from 'next/link';
import { EHButton, EHList, EHCallout, EHField, EHInput, EHWorkspaceGrid, EHIdentitySummary, EHWorkflowForm, EHFormSection, EHFieldGrid, EHMetricsBar, EHRecordList, EHStatus, EHSubmitButton, EHText, EHWorkSection, type EHRecordEntry } from '@/design-system';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import { InstallAppCard } from '@/components/install-app-card';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { primaryProperty } from '@/lib/properties';
import { logoutAction,saveProfileAction } from '@/app/actions';

/** Die Angaben, aus denen sich die Vollständigkeit des Profils ergibt. */
type ProfileField = { id: string; label: string; value: string; filled: boolean };

/**
 * Werkbank-Kopf, Kennzahlenzeile und rechte Spalte. Dieselben Token wie /app:
 * Karten, Registerlinie, keine zweite Stilfamilie. Der Balken rechts traegt
 * den Anteil der hinterlegten Angaben, kein Layout.
 */

// Prozent -> fuenf Stufen. Die Breite liegt in der shared CSS, nicht inline
// (design-check: keine unowned inline styles).
function fillStep(pct: number): 'full' | 'three-quarter' | 'half' | 'quarter' | undefined {
  if (pct >= 100) return 'full';
  if (pct >= 75) return 'three-quarter';
  if (pct >= 50) return 'half';
  if (pct >= 25) return 'quarter';
  return undefined;
}

export default async function Profile(){
  const u=await requireUser('homeowner'); const p=db.prepare('SELECT * FROM homeowner_profiles WHERE user_id=?').get(u.id) as any;
  const property=primaryProperty(u.id);
  const initials=`${u.first_name?.[0]||''}${u.last_name?.[0]||''}`.toUpperCase();
  // Kennzahlen und rechte Spalte lesen dieselbe Liste: die Prozentzahl oben und
  // die Eintraege rechts koennen nicht auseinanderlaufen.
  const fields:ProfileField[]=[
    {id:'name',label:'Vor- und Nachname',value:`${u.first_name||''} ${u.last_name||''}`.trim(),filled:!!(u.first_name&&u.last_name)},
    {id:'mobil',label:'Mobilnummer',value:u.phone||'',filled:!!u.phone},
    {id:'strasse',label:'Straße',value:p?.address||'',filled:!!p?.address},
    {id:'plz',label:'PLZ',value:p?.postcode||'',filled:!!p?.postcode},
  ];
  const filled=fields.filter(f=>f.filled).length;
  const complete=filled===fields.length;
  const profilePct=Math.round(filled/fields.length*100);
  // Abgleich Profiladresse gegen die Hausakte: beide werden beim Speichern des
  // Profils zusammengefuehrt, koennen aber getrennt gepflegt worden sein.
  const addressMatch=!!property&&(property.postcode||'')===(p?.postcode||'')&&(property.address||'')===(p?.address||'');
  const fieldItems:EHRecordEntry[]=fields.map(f=>({
    id:f.id,
    title:f.label,
    detail:f.filled?f.value:'Noch nicht hinterlegt',
    status:f.filled?<EHStatus tone="success">Hinterlegt</EHStatus>:<EHStatus tone="warning">Fehlt</EHStatus>,
  }));
  const verificationItems:EHRecordEntry[]=[
    {id:'haus',title:'Hausakte',detail:property?(property.address||'Ohne hinterlegte Adresse'):'Noch nicht angelegt',status:property?<EHStatus tone="success">Verknüpft</EHStatus>:<EHStatus tone="neutral">Fehlt</EHStatus>},
    {id:'abgleich',title:'Profiladresse ↔ Hausakte',detail:!property?'Ohne Hausakte gibt es nichts abzugleichen':addressMatch?'Beide tragen dieselbe Adresse':'Die Adressen weichen voneinander ab',status:!property?<EHStatus tone="neutral">Kein Abgleich</EHStatus>:addressMatch?<EHStatus tone="success">Stimmt überein</EHStatus>:<EHStatus tone="warning">Weicht ab</EHStatus>},
  ];
  return <WerkbankRahmen role="homeowner" active="/app/profile" tabs={[
      { href: '/app/profile', label: 'Profil', active: true },
      { href: '/app/settings', label: 'App-Einstellungen', active: false },
    ]} brandSub={property?.address || p?.address} rail={<>
      <p className="eh-werkbank-rail-h">Kontext dieser Seite</p>
      <div className="eh-werkbank-karte">
        <h4>Profilvollständigkeit{!complete && <span className="eh-werkbank-badge">unvollständig</span>}</h4>
        <div className="eh-werkbank-bar"><i data-fill={fillStep(profilePct)} /></div>
        <div className="eh-werkbank-row"><span>Angaben</span><span>{filled} von {fields.length}</span></div>
        <div className="eh-werkbank-row"><span>Status</span><span>{complete ? 'Alle hinterlegt' : 'Noch Lücken'}</span></div>
        {complete && <Link href="/app/home" className="eh-werkbank-go">Mein Haus öffnen →</Link>}
      </div>
      <div className="eh-werkbank-karte">
        <h4>Verifikation</h4>
        <div className="eh-werkbank-row"><span>Hausakte</span><span>{property ? 'verknüpft' : 'fehlt'}</span></div>
        <div className="eh-werkbank-row"><span>Adressabgleich</span><span>{!property ? 'kein Abgleich' : addressMatch ? 'stimmt überein' : 'weicht ab'}</span></div>
        <p className="eh-werkbank-item">Deine E-Mail-Adresse ist deine Anmeldung. Die Profiladresse wird beim Speichern in die Hausakte übernommen.</p>
      </div>
      <div className="eh-werkbank-karte">
        <h4>Konto &amp; App</h4>
        <div className="eh-werkbank-item"><span><b>Zahlungen &amp; Mitgliedschaft</b><small>aktueller Tarif</small></span><span><Link href="/app/plans">öffnen</Link></span></div>
        <div className="eh-werkbank-item"><span><b>Benachrichtigungen</b><small>Benachrichtigungen verwalten</small></span><span><Link href="/notifications">öffnen</Link></span></div>
        <div className="eh-werkbank-item"><span><b>Hilfe &amp; Support</b><small>direkte Unterstützung</small></span><span><Link href="/app/hilfe">öffnen</Link></span></div>
      </div>
    </>}>
    
    <header className="eh-werkbank-kopf">
      <div className="eh-werkbank-kopf-copy">
        <h1>Profil &amp; Einstellungen</h1>
        <span>{u.email}</span>
      </div>
      <div className="eh-werkbank-kopf-tools">
        <Link className="eh-werkbank-kopf-cta" href="/app/home">Mein Haus</Link>
      </div>
    </header>

    <div className="eh-werkbank-kennzahlen">
      <EHMetricsBar label="Profil & Einstellungen" items={[
        {id:'profil',label:'Profil',value:`${profilePct} %`,hint:`${filled} von ${fields.length} Angaben`},
        {id:'kontakt',label:'Kontakt',value:u.phone?'vollständig':'unvollständig',hint:'Mobilnummer für Rückfragen'},
        {id:'adresse',label:'Adresse',value:p?.address&&p?.postcode?'vollständig':'unvollständig',hint:p?.postcode?`PLZ ${p.postcode}`:'PLZ fehlt'},
        {id:'haus',label:'Hausakte',value:property?'verknüpft':'fehlt',hint:property?(property.postcode?`PLZ ${property.postcode}`:'ohne PLZ'):'kein Haus angelegt'},
      ]} />
    </div>

    <EHWorkspaceGrid main={<EHWorkflowForm action={saveProfileAction}>
      <EHFormSection title="Persönliche Daten" description="So erreichen dich deine Ansprechpartner.">
        <EHFieldGrid>
          <EHField id="profile-first" label="Vorname"><EHInput id="profile-first" name="firstName" autoComplete="given-name" defaultValue={u.first_name}/></EHField>
          <EHField id="profile-last" label="Nachname"><EHInput id="profile-last" name="lastName" autoComplete="family-name" defaultValue={u.last_name}/></EHField>
          <EHField id="profile-phone" label="Mobilnummer" hint="Für direkte Erreichbarkeit; WhatsApp erst nach Freischaltung."><EHInput id="profile-phone" name="phone" type="tel" autoComplete="tel" aria-describedby="profile-phone-hint" defaultValue={u.phone||''} placeholder="+49 …"/></EHField>
          <EHField id="profile-postcode" label="PLZ"><EHInput id="profile-postcode" name="postcode" autoComplete="postal-code" defaultValue={p?.postcode||''}/></EHField>
        </EHFieldGrid>
        <EHField id="profile-address" label="Adresse"><EHInput id="profile-address" name="address" autoComplete="street-address" defaultValue={p?.address||''}/></EHField>
        <EHSubmitButton>Änderungen speichern</EHSubmitButton>
      </EHFormSection>
    </EHWorkflowForm>} aside={<>
      <EHIdentitySummary initials={initials} name={`${u.first_name} ${u.last_name}`} email={u.email} />
      <EHWorkSection title="Profilvollständigkeit">
        <EHStatus tone={complete?'success':'warning'}>{complete?'Alle Angaben hinterlegt':'Noch unvollständig'}</EHStatus>
        <EHText muted>{complete
          ? 'Ansprechpartner sehen Name, Mobilnummer und Adresse, sobald ein Kontakt oder Auftrag es verlangt.'
          : `${filled} von ${fields.length} Angaben sind hinterlegt. Fehlende Angaben ergänzt du im Formular links.`}</EHText>
        <EHRecordList label="Angaben im Profil" items={fieldItems} />
      </EHWorkSection>
      <EHWorkSection title="Verifikation">
        <EHStatus tone={addressMatch?'success':property?'warning':'neutral'}>{addressMatch?'Adresse abgeglichen':property?'Abgleich offen':'Keine Hausakte'}</EHStatus>
        <EHText muted>Deine E-Mail-Adresse ist deine Anmeldung. Die Profiladresse wird beim Speichern in die Hausakte übernommen; stimmen beide überein, arbeiten alle Bereiche mit derselben Adresse.</EHText>
        <EHRecordList label="Abgleich mit der Hausakte" items={verificationItems} />
        <EHButton href="/app/home" variant="secondary" arrow>Mein Haus öffnen</EHButton>
      </EHWorkSection>
    </>}/>

    <EHWorkSection title="Konto & App">
    <EHList label="Profilbereiche" items={[
      { id: 'plans', title: 'Zahlungen & Mitgliedschaft', href: '/app/plans' },
      { id: 'notifications', title: 'Benachrichtigungen', href: '/notifications' },
      { id: 'help', title: 'Hilfe & Support', text: 'Direkte Unterstützung', href: '/app/hilfe' },
    ]} />
    </EHWorkSection>
    <div data-testid="owner-logout-section">
    <EHWorkflowForm action={logoutAction}><EHSubmitButton pendingLabel="Wird abgemeldet …">Ausloggen</EHSubmitButton></EHWorkflowForm>
    <EHWorkflowForm action={logoutAction}><EHButton type="submit" variant="secondary" data-testid="owner-logout-profile" aria-label="Abmelden">Abmelden</EHButton></EHWorkflowForm>
    </div>
    <InstallAppCard/>
    <EHCallout title="WhatsApp ist noch nicht freigeschaltet"><p>In der App kannst du den Hausmeister bereits nutzen. Der WhatsApp-Kanal wird erst angeboten, sobald der Business-Kanal tatsächlich verfügbar ist.</p></EHCallout>
    <EHCallout title="Deine Hausdaten bleiben privat."><p>Partner sehen nur die Informationen, die für einen konkreten Kontakt oder Auftrag notwendig sind.</p></EHCallout>
  </WerkbankRahmen>;
}
