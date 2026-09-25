import Link from 'next/link';
import { createConsultationAction } from '@/app/actions';
import { requireUser } from '@/lib/auth';
import { EHPageHeader, EHErrorState, EHField, EHTextarea, EHFileInput, EHSubmitButton, EHFormFeedback, EHRecordList, EHStatus, EHText, EHWorkSection, EHWorkspaceGrid, EHWorkflowStack, type EHRecordEntry } from '@/design-system';
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

  // Eine Beratung ist ausdruecklich kein Auftrag und traegt keinen Preis.
  const requests = db.prepare(`SELECT id,title,status,created_at,updated_at FROM jobs WHERE homeowner_id=? AND request_kind='contact' ORDER BY created_at DESC`).all(user.id) as ContactRequest[];
  const requestItems: EHRecordEntry[] = requests.slice(0, 5).map(request => ({
    id: String(request.id),
    title: request.title,
    detail: 'Beratung · kostenlos, kein Auftrag',
    date: String(request.created_at).slice(0, 10),
    dateLabel: dateLabel(request.created_at),
    status: <EHStatus tone={request.status === 'open' ? 'info' : request.status === 'cancelled' ? 'neutral' : 'success'}>{statusLabel(request.status)}</EHStatus>,
    href: `/app/jobs/${request.id}`,
  }));

  return <WerkbankRahmen role="homeowner" active="/app" pageLabel="Beratung">
    <EHWorkflowStack>
    <EHPageHeader title="Beratung" context={requests.length === 0 ? 'Stell deine erste Frage' : `${requests.length} ${requests.length === 1 ? 'Frage' : 'Fragen'} gestellt`} />
    <EHWorkspaceGrid main={<>
      {sp.error && <EHErrorState text={sp.error} />}
      {created && <EHFormFeedback kind="success">Notiert. Ein Mensch meldet sich bei dir — Auftrag und Preis entstehen erst, wenn du das ausdrücklich willst. <Link href={`/app/jobs/${created.id}`}>Ansehen</Link></EHFormFeedback>}
      <EHWorkSection title="Wobei brauchst du Rat?">
      <form action={createConsultationAction}>
        <EHField id="con-desc" label="Deine Frage"><EHTextarea id="con-desc" name="description" rows={6} minLength={4} maxLength={8000} required placeholder="Zum Beispiel: Mein Dach ist an einer Stelle feucht. Was könnte die Ursache sein?"/></EHField>
        <div className="eh-werkbank-filefield"><EHField id="con-photo" label="Foto dazu (optional)"><EHFileInput id="con-photo" name="photo" accept="image/jpeg,image/png,image/webp,image/heic,video/mp4,video/webm,video/quicktime,video/x-m4v"/></EHField></div>
        <EHText muted>Kostenlos und unverbindlich. Erst wenn du danach einen Auftrag willst, sprechen wir über Termin und Preis.</EHText>
        <EHSubmitButton>Ansprechpartner finden</EHSubmitButton>
      </form>
      </EHWorkSection>
      <EHText muted>Lieber erst mit dem Hausmeister sprechen? <Link href="/app/hausmeister">Hier geht es zum Chat</Link>.</EHText>
    </>} aside={<>
      <EHWorkSection title="Deine Fragen">
        <EHRecordList label="Deine Fragen" items={requestItems} empty="Noch keine Frage gestellt. Beschreibe links dein Thema." />
      </EHWorkSection>
      <EHWorkSection title="So geht es weiter">
        <EHText muted>Wir suchen einen passenden Menschen für deine Frage. Auftrag und Preis entstehen erst, wenn du das danach ausdrücklich willst.</EHText>
      </EHWorkSection>
    </>} />
    </EHWorkflowStack>
  </WerkbankRahmen>;
}
