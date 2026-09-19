import Link from 'next/link';
import { HausmeisterAssistant } from '@/components/homeowner/hausmeister-assistant';
import { createConsultationAction } from '@/app/actions';
import { requireUser } from '@/lib/auth';
import { EHButton, EHPageHeader, EHPanel, EHErrorState, EHField, EHTextarea, EHFileInput, EHSubmitButton, EHFormFeedback, EHMetricsBar, EHRecordList, EHStatus, EHText, EHWorkSection, EHWorkspaceGrid, EHWorkflowStack, type EHRecordEntry } from '@/design-system';
import { db } from '@/lib/db';
import { dateLabel, statusLabel } from '@/lib/format';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';

type ContactRequest = { id: number; title: string; status: string; created_at: string; updated_at: string };

export default async function Consultation({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await requireUser('homeowner');
  const sp = await searchParams;
  const successId = Number(sp.success);
  const created = Number.isSafeInteger(successId) && successId > 0
    ? db.prepare(`SELECT id FROM jobs WHERE id=? AND homeowner_id=? AND request_kind='contact'`).get(successId, user.id) as { id: number } | undefined
    : undefined;

  // Kennzahlen und rechte Spalte zaehlen dieselben Kontaktanfragen - eine
  // Beratung ist ausdruecklich kein Auftrag und traegt keinen Preis.
  const requests = db.prepare(`SELECT id,title,status,created_at,updated_at FROM jobs WHERE homeowner_id=? AND request_kind='contact' ORDER BY created_at DESC`).all(user.id) as ContactRequest[];
  const openCount = requests.filter(request => request.status === 'open').length;
  const inContactCount = requests.filter(request => request.status !== 'open' && request.status !== 'cancelled').length;
  const lastRequest = requests[0];
  const requestItems: EHRecordEntry[] = requests.slice(0, 5).map(request => ({
    id: String(request.id),
    title: request.title,
    detail: 'Kontaktauftrag · kein Auftrag, kein Preis',
    date: String(request.created_at).slice(0, 10),
    dateLabel: dateLabel(request.created_at),
    status: <EHStatus tone={request.status === 'open' ? 'info' : request.status === 'cancelled' ? 'neutral' : 'success'}>{statusLabel(request.status)}</EHStatus>,
    href: `/app/jobs/${request.id}`,
  }));

  return <WerkbankRahmen role="homeowner" active="/app">
    <EHWorkflowStack>
    <EHPageHeader title="Beratung" context={lastRequest ? `Letzter Auftrag ${dateLabel(lastRequest.created_at)}` : 'Noch kein Auftrag'} />
    <EHMetricsBar label="Beratung" items={[
      { id: 'anfragen', label: 'Aufträge', value: String(requests.length), hint: 'seit Beginn' },
      { id: 'offen', label: 'Offen', value: String(openCount), hint: openCount > 0 ? 'warten auf Antwort' : 'nichts offen' },
      { id: 'kontakt', label: 'In Absprache', value: String(inContactCount), hint: 'mit einem Ansprechpartner' },
      { id: 'letzte', label: 'Letzter Auftrag', value: lastRequest ? dateLabel(lastRequest.created_at) : '–', hint: lastRequest ? statusLabel(lastRequest.status) : 'noch keine' },
    ]} />
    <EHWorkspaceGrid main={<>
      {sp.error && <EHErrorState text={sp.error} />}
      {created && <EHFormFeedback kind="success">Kontaktauftrag angelegt. Es wurde kein Auftrag und kein Preis erstellt. <Link href={`/app/jobs/${created.id}`}>Auftrag ansehen</Link></EHFormFeedback>}
      <EHPanel title="Beratungs-Auftrag">
      <form action={createConsultationAction}>
        <EHField id="con-desc" label="Wobei brauchst du Rat?"><EHTextarea id="con-desc" name="description" rows={6} minLength={4} maxLength={8000} required placeholder="Zum Beispiel: Mein Dach ist an einer Stelle feucht. Was könnte die Ursache sein?"/></EHField>
        <EHField id="con-photo" label="Foto oder Video (optional)" hint="JPEG, PNG, WebP oder HEIC bis 8 MB; MP4, WebM, MOV oder M4V bis 25 MB."><EHFileInput id="con-photo" name="photo" accept="image/jpeg,image/png,image/webp,image/heic,video/mp4,video/webm,video/quicktime,video/x-m4v"/></EHField>
        <EHSubmitButton>Ansprechpartner finden</EHSubmitButton>
      </form>
      </EHPanel>
      <HausmeisterAssistant showConsultationLink={false}/>
    </>} aside={<>
      <EHWorkSection title="Deine letzten Aufträge">
        <EHRecordList label="Deine letzten Aufträge" items={requestItems} empty="Noch kein Beratungsauftrag. Beschreibe links dein Thema – daraus entsteht kein Auftrag und kein Preis." />
        <EHButton href="/app/jobs" variant="secondary" arrow>Alle Vorgänge ansehen</EHButton>
      </EHWorkSection>
      <EHWorkSection title="So geht es weiter">
        <EHText muted>Wir suchen einen passenden Ansprechpartner. Erst wenn du danach ausdrücklich einen Auftrag möchtest, entstehen Termin und Preis.</EHText>
        <EHText muted>Deine Beschreibung bleibt als Auftrag erhalten und ist jederzeit auffindbar.</EHText>
        <EHButton href="/app/hausmeister" variant="secondary" arrow>Auftrag organisieren</EHButton>
      </EHWorkSection>
    </>} />
    </EHWorkflowStack>
  </WerkbankRahmen>;
}
