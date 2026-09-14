import { EHAppHeader, EHWorkSection, EHWorkspaceGrid, EHWorkflowStack, EHWorkflowForm, EHFormSection, EHFieldGrid, EHSubmitButton, EHFormFeedback, EHText, EHList, EHEmptyState, EHButton, EHStatus, EHField, EHInput, EHSelect, EHTextarea } from '@/design-system';
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
// EHList types title and text as strings, and the design guard forbids both a
// new page stylesheet and inline styles.
function breakableEmail(email: string): string {
  return String(email).replace(/([-@])/g, '$1\u200B');
}

export default async function HouseHistory({searchParams}:{searchParams:Promise<Record<string,string>>}){
  const user=await requireUser('homeowner'); const sp=await searchParams; const property=primaryProperty(user.id);
  if (!property) return <AppShell role="homeowner" active="/app/home" title="Haus-Historie">
    <EHAppHeader title="Haus-Historie" text="Die Geschichte deines Zuhauses." />
    <EHEmptyState title="Keine aktive Hausakte" text="Lege zuerst dein Zuhause an. Danach kannst du frühere Arbeiten, Wartungen und Dokumente hier sammeln." action={<EHButton href="/app/home">Mein Haus einrichten</EHButton>} />
  </AppShell>;
  const entries=db.prepare(`SELECT h.*,p.business_name linked_business,(SELECT COUNT(*) FROM house_history_documents d WHERE d.entry_id=h.id) document_count FROM house_history_entries h LEFT JOIN provider_profiles p ON p.user_id=h.provider_id WHERE h.property_id=? ORDER BY h.performed_at DESC,h.id DESC`).all(property.id) as any[];
  const invites=db.prepare(`SELECT * FROM provider_invites WHERE property_id=? AND status='pending' ORDER BY created_at DESC`).all(property.id) as any[];
  const transfers=db.prepare(`SELECT * FROM house_transfers WHERE property_id=? ORDER BY created_at DESC LIMIT 5`).all(property.id) as any[];
  const ownerships=db.prepare(`SELECT o.*,u.first_name,u.last_name FROM property_ownerships o JOIN users u ON u.id=o.homeowner_id WHERE o.property_id=? ORDER BY o.started_at DESC,o.id DESC`).all(property.id) as any[];
  return <AppShell role="homeowner" active="/app/home" title="Haus-Historie" subtitle="Die Geschichte deines Hauses">
    <EHWorkflowStack>
    <EHAppHeader eyebrow="Lebenslange Hausakte" title="Was wurde wann am Haus gemacht?" text="Auch Arbeiten aus der Zeit vor Einfach Hausen gehören hier hinein – mit Kosten, Garantie, Dokumenten und Ansprechpartnern." actions={<EHButton href="#historie-anlegen" arrow>Arbeit dokumentieren</EHButton>} />
    {sp.transfer&&<EHFormFeedback kind="success">Übergabelink erstellt. Nur die angegebene Käufer-E-Mail kann ihn innerhalb von {HOUSE_TRANSFER_TTL_DAYS} Tagen annehmen.</EHFormFeedback>}
    <EHWorkSection title="Dokumentierte Arbeiten">
    <EHList label="Haus-Historie" items={entries.map(e=>({ id: String(e.id), title: `${new Date(e.performed_at+'T12:00:00').getFullYear()} · ${e.title}`, text: `${e.category} · ${e.company_name||'Eigenleistung / unbekannt'}${e.contact_name?` · ${e.contact_name}`:''}${e.cost_amount!=null?` · ${euroExact(e.cost_amount)}`:''}${e.guarantee_until?` · Garantie bis ${new Date(e.guarantee_until+'T12:00:00').toLocaleDateString('de-DE')}`:''}${e.maintenance_due?` · Wartung ${new Date(e.maintenance_due+'T12:00:00').toLocaleDateString('de-DE')}`:''} · ${e.job_id?'Über Einfach Hausen dokumentiert':'Manuell eingetragen'}${e.notes?` — ${e.notes}`:''}`, meta: e.provider_id?<EHStatus tone="success">Partner verbunden</EHStatus>:e.contact_email?<EHStatus>Einladung vorgemerkt</EHStatus>:null, action: (e.before_photo||e.after_photo||e.document_count>0)?<span>{e.before_photo&&<a href={`/api/house-history-files/${e.id}/before`} target="_blank" rel="noreferrer">Vorher</a>}{e.after_photo&&<span> · </span>}{e.after_photo&&<a href={`/api/house-history-files/${e.id}/after`} target="_blank" rel="noreferrer">Nachher</a>}{e.document_count>0&&(db.prepare(`SELECT id,title FROM house_history_documents WHERE entry_id=?`).all(e.id) as any[]).map(d=><a key={d.id} href={`/api/house-history-documents/${d.id}`} target="_blank" rel="noreferrer"> · {d.title}</a>)}</span>:null }))} />
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

    {invites.length>0&&<EHWorkSection title="Vorgemerkte Betriebe"><EHList label="Vorgemerkte Betriebe" items={invites.map(i=>({ id: String(i.id), title: i.company_name||breakableEmail(i.email), text: `${breakableEmail(i.email)} · wird automatisch verbunden, sobald sich der Betrieb registriert.`, href: `/partner-invite/${i.token}` }))} /></EHWorkSection>}

    <EHWorkSection title="Eigentümerhistorie"><EHList label="Eigentümerhistorie" items={ownerships.map(o=>({ id: String(o.id), title: `${o.first_name} ${o.last_name}`, text: `${new Date(o.started_at).toLocaleDateString('de-DE')} – ${o.active?'heute':o.ended_at?new Date(o.ended_at).toLocaleDateString('de-DE'):'beendet'}`, meta: o.active?<EHStatus tone="success">Aktuell</EHStatus>:null }))} /></EHWorkSection>

    <EHWorkspaceGrid main={<EHWorkSection title="Hausakte an Käufer übergeben">
      <EHText>Es wird dieselbe Immobilie mit ihrer Historie weitergeführt. Hausprofil, Anlagen, offene Wartungen und hausbezogene Ansprechpartner gehen mit. Private alte Nachrichten, Zahlungen und Aufträge bleiben beim bisherigen Eigentümer.</EHText>
      <EHFormFeedback kind="info">Der Übergabelink ist {HOUSE_TRANSFER_TTL_DAYS} Tage gültig. Nur die angegebene Käufer-E-Mail kann ihn annehmen. Danach wird die Freigabe automatisch ungültig.</EHFormFeedback>
      <EHButton href="/app/home/passport" variant="secondary">Hauspass ansehen</EHButton>
    </EHWorkSection>} aside={<EHWorkflowForm action={createHouseTransferAction}>
      <EHFormSection title="Übergabe vorbereiten" description="Die Hausakte wechselt erst nach Annahme durch den Käufer den Eigentümer.">
        <EHField id="hist-targetemail" label="E-Mail des Käufers" required><EHInput id="hist-targetemail" name="targetEmail" type="email" required placeholder="käufer@example.de" /></EHField>
        <EHSubmitButton pendingLabel="Übergabe wird vorbereitet …">Übergabe vorbereiten</EHSubmitButton>
      </EHFormSection>
    </EHWorkflowForm>} />
    {transfers.length>0&&<EHList label="Übergabe-Verlauf" items={transfers.map(t=>{const lifecycle=houseTransferLifecycleStatus(t);const expiresAt=houseTransferExpiresAt(t.created_at);const label=lifecycle==='accepted'?'Übergeben':lifecycle==='expired'?'Abgelaufen':lifecycle==='revoked'?'Widerrufen':'Bereit';return { id: String(t.id), title: breakableEmail(t.target_email), text: lifecycle==='active'&&expiresAt?`gültig bis ${expiresAt.toLocaleDateString('de-DE')}`:label, meta: <EHStatus tone={lifecycle==='accepted'?'success':lifecycle==='active'?'info':'neutral'}>{label}</EHStatus> };})} />}
    </EHWorkflowStack>
  </AppShell>;
}
