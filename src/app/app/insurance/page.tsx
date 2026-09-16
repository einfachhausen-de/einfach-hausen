import { AppShell } from '@/components/shell';
import { HausmeisterAssistant } from '@/components/homeowner/hausmeister-assistant';
import { createInsuranceSupportAction } from '@/app/actions';
import { requireUser } from '@/lib/auth';
import { EHButton, EHEmptyState, EHErrorState, EHField, EHFormFeedback, EHMetricsBar, EHPageHeader, EHRecordViews, EHStatus, EHSubmitButton, EHTextarea, type EHRecordEntry } from '@/design-system';
import { db } from '@/lib/db';

type InsuranceJob = {
  id: number;
  title: string;
  status: string;
  business_name: string;
  claim_id: number | null;
  claim_status: string | null;
};

function claimStatus(value: string | null) {
  return value === 'reviewing' ? 'In Prüfung' : value === 'resolved' ? 'Gelöst' : value === 'rejected' ? 'Abgeschlossen' : 'Offen';
}

const claimTone = (value: string | null) => value === 'resolved' ? 'success' as const : value === 'reviewing' ? 'info' as const : 'neutral' as const;

export default async function InsuranceSupport({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await requireUser('homeowner');
  const sp = await searchParams;
  const jobs = db.prepare(`
    SELECT j.id,j.title,j.status,p.business_name,c.id claim_id,c.status claim_status
    FROM jobs j
    JOIN quotes q ON q.id=j.accepted_quote_id
    JOIN provider_profiles p ON p.user_id=q.provider_id
    LEFT JOIN claims c ON c.job_id=j.id AND c.homeowner_id=j.homeowner_id
    WHERE j.homeowner_id=? AND j.request_kind='service' AND j.status IN ('accepted','in_progress','completed')
    ORDER BY j.updated_at DESC,j.id DESC
  `).all(user.id) as InsuranceJob[];
  const successId = Number(sp.success);
  const submitted = Number.isSafeInteger(successId) && jobs.some(job => job.id === successId);
  const items: EHRecordEntry[] = jobs.map(job => (job.claim_id
    ? {
        id: String(job.id),
        title: `${job.title} · ${job.business_name}`,
        detail: `Auftrag #${job.id}`,
        note: 'Zu diesem Auftrag existiert bereits ein Servicefall. Er wird nicht durch eine zweite Versicherungsanfrage überschrieben.',
        status: <EHStatus tone={claimTone(job.claim_status)}>Servicefall: {claimStatus(job.claim_status)}</EHStatus>,
        href: `/app/jobs/${job.id}`,
      }
    : {
        id: String(job.id),
        title: `${job.title} · ${job.business_name}`,
        detail: `Auftrag #${job.id}`,
        action: (
          <form action={createInsuranceSupportAction.bind(null, job.id)}>
            <EHField id={`ins-desc-${job.id}`} label="Was soll für den Schadenfall geklärt werden?"><EHTextarea id={`ins-desc-${job.id}`} name="description" rows={4} minLength={20} maxLength={4000} required placeholder="Zum Beispiel: Nach dem Wasserschaden brauche ich eine nachvollziehbare Zusammenfassung der ausgeführten Arbeiten und möchte wissen, welche Unterlagen bereits im Auftrag liegen."/></EHField>
            <p>Mit dem Absenden wird ein interner Servicefall erstellt. Es wird weder ein neuer Handwerkerauftrag erzeugt noch automatisch ein Versicherer angeschrieben.</p>
            <EHSubmitButton>Servicefall an Einfach Hausen übergeben</EHSubmitButton>
          </form>
        ),
      }));

  return <AppShell role="homeowner" active="/app" title="Versicherungsunterstützung" subtitle="Schadenfall sauber vorbereiten und weitergeben">
    <EHPageHeader title="Unterstützung bei einem Schadenfall." context={`${jobs.length} beauftragte ${jobs.length === 1 ? 'Auftrag' : 'Aufträge'}`} />
    {sp.error && <EHErrorState text={sp.error} />}
    {submitted && <EHFormFeedback kind="success">Servicefall übernommen. Einfach Hausen und der zuständige Partner sehen den Vorgang jetzt im bestehenden Auftragskontext. Deine Versicherung wurde dadurch nicht automatisch kontaktiert.</EHFormFeedback>}

    {jobs.length === 0 ? (
      <EHEmptyState title="Noch kein passender Auftrag vorhanden" text="Versicherungsunterstützung lässt sich hier nur an einen eigenen, bereits angenommenen Auftrag hängen. So werden keine fremden Vorgänge oder losen Schadendaten zugeordnet."  action={<><EHButton href="/app/jobs">Aufträge ansehen</EHButton><EHButton href="/app/consultation" variant="secondary">Erst Ansprechpartner fragen</EHButton></>} />
    ) : (
      <>
        <EHMetricsBar label="Versicherungsunterstützung" items={[
          { id: 'auftraege', label: 'Beauftragte Aufträge', value: String(jobs.length) },
          { id: 'servicefaelle', label: 'Servicefälle', value: String(jobs.filter(job => job.claim_id).length) },
        ]} />
        <EHRecordViews label="Aufträge mit Versicherungsunterstützung" storageKey="versicherung" defaultView="liste" switcherLabel="Versicherung: Ansicht wechseln" items={items} />
      </>
    )}

    <HausmeisterAssistant/>
  </AppShell>;
}
