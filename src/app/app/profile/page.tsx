import '@/components/werkbank-layout.css';
import Link from 'next/link';
import { EHButton, EHCallout, EHField, EHInput, EHIdentitySummary, EHWorkflowForm, EHFormSection, EHFieldGrid, EHRecordList, EHStatus, EHSubmitButton, EHText } from '@/design-system';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import { WerkbankAbschnitt, WerkbankRaster } from '@/components/werkbank-seite';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { primaryProperty } from '@/lib/properties';
import { logoutAction,saveProfileAction } from '@/app/actions';

/** Die Angaben, aus denen sich die Vollständigkeit des Profils ergibt. */
type ProfileField = { id: string; label: string; value: string; filled: boolean };

/**
 * Werkbank-Kopf, Kennzahlenzeile und rechte Spalte. Dieselben Token wie /app:
 * Karten, Registerlinie, keine zweite Stilfamilie. Der Fortschrittsbalken war
 * hier zusaetzlich in der rechten Spalte doppelt (Betreiber-Order 2026-09-23:
 * raus) — die Vollstaendigkeit steht nur noch im Seiteninhalt selbst.
 */

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
  // Abgleich Profiladresse gegen die Hausakte: beide werden beim Speichern des
  // Profils zusammengefuehrt, koennen aber getrennt gepflegt worden sein.
  const addressMatch=!!property&&(property.postcode||'')===(p?.postcode||'')&&(property.address||'')===(p?.address||'');
  const fieldItems = fields.map(f => ({
    id: f.id,
    title: f.label,
    detail: f.filled ? f.value : 'Noch nicht hinterlegt',
    status: f.filled ? <EHStatus tone="success">Hinterlegt</EHStatus> : <EHStatus tone="warning">Fehlt</EHStatus>,
  }));
  return <WerkbankRahmen role="homeowner" active="/app/profile" tabs={[
      { href: '/app/profile', label: 'Profil', active: true },
      { href: '/app/settings', label: 'App-Einstellungen', active: false },
    ]} brandSub={property?.address || p?.address} rail={<>
      <p className="eh-werkbank-rail-h">Kontext dieser Seite</p>
      <div className="eh-werkbank-karte">
        <h4>Konto &amp; App</h4>
        <div className="eh-werkbank-item"><span><b>Benachrichtigungen</b><small>Benachrichtigungen verwalten</small></span><span><Link href="/notifications">öffnen</Link></span></div>
        <div className="eh-werkbank-item"><span><b>Hilfe &amp; Support</b><small>direkte Unterstützung</small></span><span><Link href="/app/hilfe">öffnen</Link></span></div>
      </div>
    </>}>
    
    <header className="eh-werkbank-kopf">
      <div className="eh-werkbank-kopf-copy">
        <h1>Profil</h1>
        <span>{u.email}</span>
      </div>
      <div className="eh-werkbank-kopf-tools">
        <Link className="eh-werkbank-kopf-cta" href="/app/home">Mein Haus</Link>
      </div>
    </header>

    <WerkbankRaster main={<EHWorkflowForm action={saveProfileAction}>
      <EHFormSection title="Persönliche Daten" description="So erreichen dich deine Ansprechpartner.">
        <EHFieldGrid>
          <EHField id="profile-first" label="Vorname"><EHInput id="profile-first" name="firstName" autoComplete="given-name" defaultValue={u.first_name}/></EHField>
          <EHField id="profile-last" label="Nachname"><EHInput id="profile-last" name="lastName" autoComplete="family-name" defaultValue={u.last_name}/></EHField>
          <EHField id="profile-phone" label="Mobilnummer" hint="Für direkte Erreichbarkeit."><EHInput id="profile-phone" name="phone" type="tel" autoComplete="tel" aria-describedby="profile-phone-hint" defaultValue={u.phone||''} placeholder="+49 …"/></EHField>
          <EHField id="profile-postcode" label="PLZ"><EHInput id="profile-postcode" name="postcode" autoComplete="postal-code" defaultValue={p?.postcode||''}/></EHField>
        </EHFieldGrid>
        <EHField id="profile-address" label="Adresse"><EHInput id="profile-address" name="address" autoComplete="street-address" defaultValue={p?.address||''}/></EHField>
        <EHSubmitButton>Änderungen speichern</EHSubmitButton>
      </EHFormSection>
    </EHWorkflowForm>} aside={<>
      <EHIdentitySummary initials={initials} name={`${u.first_name} ${u.last_name}`} email={u.email} />
      <WerkbankAbschnitt title={complete ? 'Profil vollständig' : 'Noch unvollständig'}>
        <EHText muted>{complete
          ? 'Ansprechpartner sehen Name, Mobilnummer und Adresse, sobald ein Kontakt oder Auftrag es verlangt.'
          : `${filled} von ${fields.length} Angaben sind hinterlegt. Fehlende Angaben ergänzt du im Formular links.`}</EHText>
        <EHRecordList label="Angaben im Profil" items={fieldItems} />
      </WerkbankAbschnitt>
      <WerkbankAbschnitt title="Passt die Adresse?">
        <EHStatus tone={addressMatch ? 'success' : property ? 'warning' : 'neutral'}>{!property ? 'Noch kein Haus angelegt' : addressMatch ? 'Passt alles' : 'Adressen weichen ab'}</EHStatus>
        <EHText muted>{!property
          ? 'Lege dein Haus an, dann übernehmen wir die Adresse von hier.'
          : addressMatch
            ? 'Profil und Hausakte tragen dieselbe Adresse.'
            : 'Profil und Hausakte tragen verschiedene Adressen. Speichere das Formular links, um die Profiladresse zu übernehmen.'}</EHText>
        <EHButton href="/app/home" variant="secondary" arrow>Mein Haus öffnen</EHButton>
      </WerkbankAbschnitt>
    </>}/>

    <div data-testid="owner-logout-section">
    <EHWorkflowForm action={logoutAction}><EHButton type="submit" variant="secondary" data-testid="owner-logout-profile" aria-label="Abmelden">Abmelden</EHButton></EHWorkflowForm>
    </div>
    <EHCallout title="Deine Hausdaten bleiben privat."><p>Partner sehen nur die Informationen, die für einen konkreten Kontakt oder Auftrag notwendig sind.</p></EHCallout>
  </WerkbankRahmen>;
}
