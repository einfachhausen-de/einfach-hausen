import { EHEmptyState, EHField, EHFieldGrid, EHFormFeedback, EHFormSection, EHInput, EHMetricsBar, EHPageHeader, EHRecordList, EHRecordViews, EHSelect, EHStatus, EHSubmitButton, EHText, EHTextarea, EHWorkSection, EHWorkspaceGrid, EHWorkflowForm, EHWorkflowStack, EHButton } from '@/design-system';
import { AppShell } from '@/components/shell';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { addHouseHistoryAction,createHouseTransferAction } from '@/app/actions';
import { euroExact } from '@/lib/format';
import { HOUSE_TRANSFER_TTL_DAYS,houseTransferExpiresAt,houseTransferLifecycleStatus,primaryProperty } from '@/lib/properties';

// An e-mail address is one unbreakable token: at 390px a long one sets the
// column's min-content width and pushes the whole page into horizontal
// overflow (Firefox measured 413 against 390 here, 449 on /pro/team). A
// zero-width space marks the natural break opportunities of an address without
// changing what is read out or copied. It has to be plain text, not markup:
// a record entry takes title and detail as strings, and the design guard
// forbids both a new page stylesheet and inline styles.
function breakableEmail(email: string): string {
  return String(email).replace(/([-@])/g, '$1\u200B');
}

function day(value: string | null | undefined): string {
  return value ? new Date(value.length === 10 ? value + 'T12:00:00' : value).toLocaleDateString('de-DE') : '';
}

/** Vergleichstag in Berliner Zeit, damit eine Garantie am richtigen Tag endet. */
const berlinDay = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' });

export default async function HouseHistory({searchParams}:{searchParams:Promise<Record<string,string>>}){
  const user=await requireUser('homeowner'); const sp=await searchParams; const property=primaryProperty(user.id);
  if (!property) return <AppShell role="homeowner" active="/app/home/history" title="Haus-Historie">
    <EHPageHeader title="Haus-Historie" />
    <EHEmptyState title="Keine aktive Hausakte" text="Lege zuerst dein Zuhause an. Danach kannst du frühere Arbeiten, Wartungen und Dokumente hier sammeln." action={<EHButton href="/app/home">Mein Haus einrichten</EHButton>} />
  </AppShell>;
  const entries=db.prepare(`SELECT h.*,p.business_name linked_business,(SELECT COUNT(*) FROM house_history_documents d WHERE d.entry_id=h.id) document_count FROM house_history_entries h LEFT JOIN provider_profiles p ON p.user_id=h.provider_id WHERE h.property_id=? ORDER BY h.performed_at DESC,h.id DESC`).all(property.id) as any[];
  const invites=db.prepare(`SELECT * FROM provider_invites WHERE property_id=? AND status='pending' ORDER BY created_at DESC`).all(property.id) as any[];
  const transfers=db.prepare(`SELECT * FROM house_transfers WHERE property_id=? ORDER BY created_at DESC LIMIT 5`).all(property.id) as any[];
  const ownerships=db.prepare(`SELECT o.*,u.first_name,u.last_name FROM property_ownerships o JOIN users u ON u.id=o.homeowner_id WHERE o.property_id=? ORDER BY o.started_at DESC,o.id DESC`).all(property.id) as any[];
  // Kennzahlen und rechte Spalte lesen denselben Bestand wie die Chronik in der
  // Hauptspalte: dokumentierte Arbeiten, ihre Kosten, hinterlegte Garantien und
  // die Zahl der Eigentuemerwechsel in der Akte.
  const today=berlinDay.format(new Date());
  const costTotal=entries.reduce((sum,e)=>sum+(typeof e.cost_amount==='number'?e.cost_amount:0),0);
  const costEntryCount=entries.filter(e=>typeof e.cost_amount==='number'&&e.cost_amount>0).length;
  const costTotals=new Map<string,number>();
  for(const e of entries){
    if(typeof e.cost_amount!=='number'||e.cost_amount<=0)continue;
    const key=e.category||'Sonstiges';
    costTotals.set(key,(costTotals.get(key)??0)+e.cost_amount);
  }
  const costByCategory=Array.from(costTotals).sort((a,b)=>b[1]-a[1]).map(([category,sum])=>({id:`kosten-${category}`,title:category,value:euroExact(sum)}));
  const guaranteeEntries=entries.filter(e=>e.guarantee_until);
  const activeGuarantees=guaranteeEntries.filter(e=>String(e.guarantee_until).slice(0,10)>=today).length;
  const careItems=entries.filter(e=>e.guarantee_until||e.maintenance_due).map(e=>({
    id:String(e.id), title:e.title,
    detail:[e.guarantee_until?`Garantie bis ${day(e.guarantee_until)}`:null,e.maintenance_due?`Wartung ${day(e.maintenance_due)}`:null].filter(Boolean).join(' · '),
    date:String(e.guarantee_until||e.maintenance_due).slice(0,10),
    dateLabel:day(e.guarantee_until||e.maintenance_due),
    status:e.guarantee_until&&String(e.guarantee_until).slice(0,10)>=today?<EHStatus tone="success">Garantie aktiv</EHStatus>:undefined,
  }));
  // Der erste Eintrag der Eigentuemerhistorie ist kein Wechsel.
  const ownerChanges=Math.max(0,ownerships.length-1);
  return <AppShell role="homeowner" active="/app/home/history" title="Haus-Historie">
    <EHWorkflowStack>
    <EHPageHeader title="Haus-Historie" context={`${entries.length} ${entries.length === 1 ? 'dokumentierte Arbeit' : 'dokumentierte Arbeiten'}`} actions={<EHButton href="#historie-anlegen" arrow>Arbeit dokumentieren</EHButton>} />
    <EHMetricsBar label="Haus-Historie" items={[
      { id: 'arbeiten', label: 'Arbeiten', value: entries.length, hint: 'dokumentiert in der Akte' },
      { id: 'kosten', label: 'Kosten', value: costEntryCount > 0 ? euroExact(costTotal) : '–', hint: costEntryCount > 0 ? `aus ${costEntryCount} ${costEntryCount === 1 ? 'Eintrag' : 'Einträgen'}` : 'keine Kosten erfasst' },
      { id: 'garantien', label: 'Garantien', value: guaranteeEntries.length, hint: guaranteeEntries.length === 0 ? 'keine hinterlegt' : `${activeGuarantees} noch gültig` },
      { id: 'wechsel', label: 'Eigentümerwechsel', value: ownerChanges, hint: ownerships.length > 1 ? `${ownerships.length} Eigentümer erfasst` : 'kein Wechsel erfasst' },
    ]} />
    {sp.transfer&&<EHFormFeedback kind="success">Übergabelink erstellt. Nur die angegebene Käufer-E-Mail kann ihn innerhalb von {HOUSE_TRANSFER_TTL_DAYS} Tagen annehmen.</EHFormFeedback>}
    <EHWorkSection title="Dokumentierte Arbeiten">
    {entries.length > 0 && <EHRecordViews label="Haus-Historie" storageKey="historie" defaultView="chronik" items={entries.map(e=>({ id: String(e.id), title: e.title,
      detail: [e.category, e.company_name||'Eigenleistung / unbekannt', e.contact_name, e.cost_amount!=null?euroExact(e.cost_amount):'', e.guarantee_until?`Garantie bis ${day(e.guarantee_until)}`:'', e.maintenance_due?`Wartung ${day(e.maintenance_due)}`:'', e.job_id?'Über Einfach Hausen dokumentiert':'Manuell eingetragen', e.notes].filter(Boolean).join(' · '),
      date: String(e.performed_at).slice(0, 10), dateLabel: day(e.performed_at),
      status: e.provider_id?<EHStatus tone="success">Partner verbunden</EHStatus>:e.contact_email?<EHStatus>Einladung vorgemerkt</EHStatus>:undefined,
      action: (e.before_photo||e.after_photo||e.document_count>0)?<span>{e.before_photo&&<a href={`/api/house-history-files/${e.id}/before`} target="_blank" rel="noreferrer">Vorher</a>}{e.after_photo&&<span> · </span>}{e.after_photo&&<a href={`/api/house-history-files/${e.id}/after`} target="_blank" rel="noreferrer">Nachher</a>}{e.document_count>0&&(db.prepare(`SELECT id,title FROM house_history_documents WHERE entry_id=?`).all(e.id) as any[]).map(d=><a key={d.id} href={`/api/house-history-documents/${d.id}`} target="_blank" rel="noreferrer"> · {d.title}</a>)}</span>:undefined }))} />}
    {entries.length===0&&<EHEmptyState title="Noch keine Historie" text="Trag frühere Sanierungen, Wartungen, Technik oder Gartenarbeiten ein. Abgeschlossene Aufträge bleiben zusätzlich in deinen Aufträgen und Dokumenten nachvollziehbar." />}
    </EHWorkSection>

    <section id="historie-anlegen" aria-label="Frühere Arbeit eintragen"><EHWorkflowForm action={addHouseHistoryAction}>
      <EHFormSection title="Arbeit & Zeitpunkt" description="Was wurde gemacht und wann? Alle weiteren Angaben sind optional."><EHFieldGrid>
        <EHField id="hist-category" label="Bereich"><EHSelect id="hist-category" name="category" defaultValue="Haus & Allgemein"><option>Haus & Allgemein</option><option>Garten & Außen</option><option>Dach & Fassade</option><option>Elektro</option><option>Sanitär & Heizung</option><option>Fenster & Türen</option><option>Reinigung & Pflege</option><option>Technik & Energie</option><option>Renovierung & Innenausbau</option><option>Sonstiges</option></EHSelect></EHField>
        <EHField id="hist-date" label="Datum" required><EHInput id="hist-date" name="performedAt" type="date" required/></EHField>
        <EHField id="hist-title" label="Was wurde gemacht?" required><EHInput id="hist-title" name="title" required placeholder="z. B. Dach komplett saniert"/></EHField>
      </EHFieldGrid></EHFormSection>
      <EHFormSection title="Betrieb & Kosten"><EHFieldGrid>
        <EHField id="hist-company" label="Firma"><EHInput id="hist-company" name="companyName" placeholder="z. B. Müller Dach GmbH"/></EHField>
        <EHField id="hist-cost" label="Kosten €"><EHInput id="hist-cost" name="cost" type="number" min="0" step="0.01"/></EHField>
        <EHField id="hist-cname" label="Ansprechpartner"><EHInput id="hist-cname" name="contactName"/></EHField>
        <EHField id="hist-cemail" label="E-Mail Handwerker" hint="Ist der Betrieb noch nicht dabei, wird die Verknüpfung für eine spätere Registrierung vorgemerkt."><EHInput id="hist-cemail" name="contactEmail" type="email" aria-describedby="hist-cemail-hint"/></EHField>
        <EHField id="hist-cphone" label="Telefon"><EHInput id="hist-cphone" name="contactPhone" type="tel"/></EHField>
      </EHFieldGrid></EHFormSection>
      <EHFormSection title="Garantie & nächste Wartung"><EHFieldGrid>
        <EHField id="hist-guar" label="Garantie bis"><EHInput id="hist-guar" name="guaranteeUntil" type="date"/></EHField>
        <EHField id="hist-maint" label="Nächste Wartung"><EHInput id="hist-maint" name="maintenanceDue" type="date"/></EHField>
      </EHFieldGrid></EHFormSection>
      <EHFormSection title="Notizen & Nachweise" description="Ergänze Fotos und Unterlagen zu dieser Arbeit.">
        <EHField id="hist-notes" label="Notizen"><EHTextarea id="hist-notes" name="notes" rows={4} maxLength={3000}/></EHField>
      <EHFieldGrid>
        <EHField id="hist-before" label="Foto vorher"><EHInput id="hist-before" name="beforePhoto" type="file" accept="image/*"/></EHField>
        <EHField id="hist-after" label="Foto nachher"><EHInput id="hist-after" name="afterPhoto" type="file" accept="image/*"/></EHField>
        <EHField id="hist-doc" label="Rechnung / Dokument"><EHInput id="hist-doc" name="document" type="file" accept="application/pdf,image/*"/></EHField>
        <EHField id="hist-doctitle" label="Dokumenttitel"><EHInput id="hist-doctitle" name="documentTitle" placeholder="z. B. Rechnung Dachsanierung 2025"/></EHField>
      </EHFieldGrid>
      <EHSubmitButton pendingLabel="Arbeit wird gespeichert …">In Hausakte speichern</EHSubmitButton>
      </EHFormSection></EHWorkflowForm></section>

    {invites.length>0&&<EHWorkSection title="Vorgemerkte Betriebe"><EHRecordList label="Vorgemerkte Betriebe" items={invites.map(i=>({ id: String(i.id), title: i.company_name||breakableEmail(i.email), detail: i.company_name?breakableEmail(i.email):undefined, href: `/partner-invite/${i.token}` }))} /></EHWorkSection>}

    <EHWorkSection title="Eigentümerhistorie"><EHRecordViews label="Eigentümerhistorie" storageKey="historie-eigentum" defaultView="chronik" items={ownerships.map(o=>({ id: String(o.id), title: `${o.first_name} ${o.last_name}`, detail: o.active?'heute':o.ended_at?`bis ${day(o.ended_at)}`:'beendet', date: String(o.started_at).slice(0, 10), dateLabel: day(o.started_at), status: o.active?<EHStatus tone="success">Aktuell</EHStatus>:undefined }))} /></EHWorkSection>

    <EHWorkspaceGrid main={<EHWorkSection title="Hausakte an Käufer übergeben">
      <EHText>Es wird dieselbe Immobilie mit ihrer Historie weitergeführt. Hausprofil, Anlagen, offene Wartungen und hausbezogene Ansprechpartner gehen mit. Private alte Nachrichten, Zahlungen und Aufträge bleiben beim bisherigen Eigentümer.</EHText>
      <EHFormFeedback kind="info">Der Übergabelink ist {HOUSE_TRANSFER_TTL_DAYS} Tage gültig. Nur die angegebene Käufer-E-Mail kann ihn annehmen. Danach wird die Freigabe automatisch ungültig.</EHFormFeedback>
      <EHButton href="/app/home/passport" variant="secondary">Hauspass ansehen</EHButton>
    </EHWorkSection>} aside={<>
      <EHWorkSection title="Kosten nach Bereich">
        <EHRecordList label="Kosten nach Bereich" items={costByCategory} empty="Noch keine Kosten erfasst." />
      </EHWorkSection>
      <EHWorkSection title="Garantien & Wartungen">
        <EHRecordList label="Garantien und nächste Wartungen" items={careItems} empty="Keine Garantie und keine Wartung hinterlegt." />
      </EHWorkSection>
      <EHWorkflowForm action={createHouseTransferAction}>
      <EHFormSection title="Übergabe vorbereiten" description="Die Hausakte wechselt erst nach Annahme durch den Käufer den Eigentümer.">
        <EHField id="hist-targetemail" label="E-Mail des Käufers" required><EHInput id="hist-targetemail" name="targetEmail" type="email" required placeholder="käufer@example.de" /></EHField>
        <EHSubmitButton pendingLabel="Übergabe wird vorbereitet …">Übergabe vorbereiten</EHSubmitButton>
      </EHFormSection>
    </EHWorkflowForm>
    </>} />
    {transfers.length>0&&<EHWorkSection title="Übergabe-Verlauf"><EHRecordList label="Übergabe-Verlauf" items={transfers.map(t=>{const lifecycle=houseTransferLifecycleStatus(t);const expiresAt=houseTransferExpiresAt(t.created_at);const label=lifecycle==='accepted'?'Übergeben':lifecycle==='expired'?'Abgelaufen':lifecycle==='revoked'?'Widerrufen':'Bereit';return { id: String(t.id), title: breakableEmail(t.target_email), detail: lifecycle==='active'&&expiresAt?`gültig bis ${expiresAt.toLocaleDateString('de-DE')}`:undefined, date: String(t.created_at).slice(0, 10), status: <EHStatus tone={lifecycle==='accepted'?'success':lifecycle==='active'?'info':'neutral'}>{label}</EHStatus> };})} /></EHWorkSection>}
    </EHWorkflowStack>
  </AppShell>;
}
