import Link from 'next/link';
import { AppShell } from '@/components/shell';
import { HausmeisterAssistant } from '@/components/homeowner/hausmeister-assistant';
import { createConsultationAction } from '@/app/actions';
import { requireUser } from '@/lib/auth';
import { EHPageHeader, EHPanel, EHErrorState, EHField, EHTextarea, EHInput, EHSubmitButton, EHFormFeedback } from '@/design-system';
import { db } from '@/lib/db';

export default async function Consultation({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await requireUser('homeowner');
  const sp = await searchParams;
  const successId = Number(sp.success);
  const created = Number.isSafeInteger(successId) && successId > 0
    ? db.prepare(`SELECT id FROM jobs WHERE id=? AND homeowner_id=? AND request_kind='contact'`).get(successId, user.id) as { id: number } | undefined
    : undefined;

  return <AppShell role="homeowner" active="/app" title="Beratung">
    <EHPageHeader title="Beratung" />
    {sp.error && <EHErrorState text={sp.error} />}
    {created && <EHFormFeedback kind="success">Kontaktanfrage angelegt. Es wurde kein Auftrag und kein Preis erstellt. <Link href={`/app/jobs/${created.id}`}>Anfrage ansehen</Link></EHFormFeedback>}
    <EHPanel title="Beratungs-Anfrage">
    <form action={createConsultationAction}>
      <EHField id="con-desc" label="Wobei brauchst du Rat?"><EHTextarea id="con-desc" name="description" rows={6} minLength={4} maxLength={8000} required placeholder="Zum Beispiel: Mein Dach ist an einer Stelle feucht. Was könnte die Ursache sein?"/></EHField>
      <EHField id="con-photo" label="Foto oder Video (optional)" hint="JPEG, PNG, WebP oder HEIC bis 8 MB; MP4, WebM, MOV oder M4V bis 25 MB."><EHInput id="con-photo" type="file" name="photo" accept="image/jpeg,image/png,image/webp,image/heic,video/mp4,video/webm,video/quicktime,video/x-m4v"/></EHField>
      <EHSubmitButton>Ansprechpartner finden</EHSubmitButton>
    </form>
    </EHPanel>
    <HausmeisterAssistant showConsultationLink={false}/>
  </AppShell>;
}
