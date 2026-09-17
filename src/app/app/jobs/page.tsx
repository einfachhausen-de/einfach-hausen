import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import { EHEmptyState, EHButton, EHMetricsBar, EHPageHeader, EHOwnerFilters, EHOwnerSearch, EHOwnerSection, EHRecordList, EHRecordViews, EHStatus, EHText, EHWorkSection, EHWorkspaceGrid } from '@/design-system';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { statusLabel } from '@/lib/format';
import { ownerDate, ownerInstant } from '@/lib/owner-format';

type SearchParams = Record<string, string | string[] | undefined>;

type JobRow = {
  id: number;
  title: string;
  description: string;
  category: string;
  postcode: string;
  preferred_date: string | null;
  preferred_time: string | null;
  status: string;
  request_kind: string;
  accepted_quote_id: number | null;
  created_at: string;
  updated_at: string;
  quotes: number;
  accepted_business: string | null;
  appointment_start: string | null;
  appointment_status: string | null;
  photo_id: number | null;
  photo_path: string | null;
};

function firstParam(
  value: string | string[] | undefined,
): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

function jobStatusTone(
  status: string,
): 'neutral' | 'info' | 'success' | 'warning' {
  if (status === 'completed') return 'success';
  if (status === 'in_progress') return 'info';
  if (status === 'quoted') return 'warning';
  return 'neutral';
}

function jobStatusCopy(
  job: JobRow,
): string {
  if (job.status === 'quoted') {
    return job.quotes > 0
      ? job.quotes === 1
        ? 'Angebot liegt vor'
        : `${job.quotes} Angebote liegen vor`
      : 'Angebotsstatus prüfen';
  }

  return statusLabel(job.status);
}

function jobScheduleCopy(job: JobRow): string {
  if (job.appointment_start) {
    const date = ownerInstant(job.appointment_start);
    const label = date && date.getTime() < Date.now() ? 'Vergangener Termin' : 'Bestätigter Termin';
    return `${label}: ${ownerDate(job.appointment_start)}`;
  }
  if (job.preferred_date) return `Wunschtermin (nicht bestätigt): ${ownerDate(job.preferred_date)}`;
  return job.status === 'completed' ? 'Auftrag abgeschlossen' : 'Noch kein Termin vereinbart';
}

// Naechster anstehender Termin. Steht bewusst ausserhalb des Renderpfads: im
// Component-Body gilt Date.now() als unreine Funktion (react-hooks/purity),
// hier - wie in jobScheduleCopy - ist der Aufruf unproblematisch.
function nextUpcomingAppointment(jobs: JobRow[]): JobRow | undefined {
  const nowMs = Date.now();
  return jobs
    .filter((job) => job.appointment_start && (ownerInstant(job.appointment_start)?.getTime() ?? 0) >= nowMs)
    .sort((a, b) => (ownerInstant(a.appointment_start)?.getTime() ?? 0) - (ownerInstant(b.appointment_start)?.getTime() ?? 0))[0];
}

export default async function Jobs({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireUser('homeowner');
  const params = await searchParams;

  const query = firstParam(params.q).trim().toLocaleLowerCase('de-DE');
  const view = firstParam(params.view);

  const jobs = db
    .prepare(
      `SELECT
        j.*,
        COUNT(DISTINCT CASE WHEN q.status='pending' THEN q.id END) AS quotes,
        ap.business_name AS accepted_business,
        (
          SELECT a.start_at
          FROM appointments a
          WHERE a.job_id=j.id
            AND a.homeowner_id=j.homeowner_id
            AND a.status='confirmed'
          ORDER BY datetime(a.start_at) ASC
          LIMIT 1
        ) AS appointment_start,
        (
          SELECT a.status
          FROM appointments a
          WHERE a.job_id=j.id
            AND a.homeowner_id=j.homeowner_id
          ORDER BY datetime(a.start_at) DESC
          LIMIT 1
        ) AS appointment_status,
        (
          SELECT p.id
          FROM job_photos p
          WHERE p.job_id=j.id
          ORDER BY p.id ASC
          LIMIT 1
        ) AS photo_id,
        (
          SELECT p.path
          FROM job_photos p
          WHERE p.job_id=j.id
          ORDER BY p.id ASC
          LIMIT 1
        ) AS photo_path
      FROM jobs j
      LEFT JOIN quotes q
        ON q.job_id=j.id
      LEFT JOIN quotes aq
        ON aq.id=j.accepted_quote_id
      LEFT JOIN provider_profiles ap
        ON ap.user_id=aq.provider_id
      WHERE j.homeowner_id=?
        AND j.request_kind='service'
      GROUP BY j.id
      ORDER BY
        CASE j.status
          WHEN 'quoted' THEN 0
          WHEN 'in_progress' THEN 1
          WHEN 'accepted' THEN 2
          WHEN 'open' THEN 3
          WHEN 'completed' THEN 4
          ELSE 5
        END,
        datetime(j.updated_at) DESC`,
    )
    .all(user.id) as JobRow[];

  const openJobs = jobs.filter((job) =>
    ['open', 'quoted', 'accepted'].includes(job.status),
  );

  const inProgressJobs = jobs.filter(
    (job) => job.status === 'in_progress',
  );

  const completedJobs = jobs.filter(
    (job) => job.status === 'completed',
  );

  const currentJobs = view === 'completed' ? completedJobs
    : view === 'in_progress' ? inProgressJobs
    : view === 'open' ? openJobs
    : jobs.filter(job => !['completed', 'cancelled'].includes(job.status));
  const currentView = ['open','in_progress','completed'].includes(view) ? view : 'current';
  const viewTitle = currentView === 'completed' ? 'Abgeschlossene Aufträge' : currentView === 'in_progress' ? 'Aufträge in Arbeit' : currentView === 'open' ? 'Offene Aufträge' : 'Aktuelle Aufträge';
  const filterHref = (nextView: string) => {
    const next = new URLSearchParams();
    if (nextView !== 'current') next.set('view',nextView);
    if (query) next.set('q',firstParam(params.q));
    return `/app/jobs${next.size ? `?${next}` : ''}`;
  };

  const filteredJobs = query
    ? currentJobs.filter((job) =>
        [
          job.title,
          job.category,
          job.description,
          job.accepted_business ?? '',
          statusLabel(job.status),
        ]
          .join(' ')
          .toLocaleLowerCase('de-DE')
          .includes(query),
      )
    : currentJobs;

  // Kennzahlen und rechte Spalte lesen dieselbe Auftragsliste wie die Filter.
  // Die Zahlen zaehlen ueber alle Auftraege, nicht nur ueber die sichtbare
  // Ansicht - sonst waere "In Arbeit" vom Filter abhaengig.
  const quotedJobs = jobs.filter((job) => job.status === 'quoted');
  const nextAppointment = nextUpcomingAppointment(jobs);
  const byCategory = new Map<string, number>();
  for (const job of jobs) {
    const label = job.category?.trim() || 'Ohne Gewerk';
    byCategory.set(label, (byCategory.get(label) ?? 0) + 1);
  }
  const jobTitle = (job: JobRow) => job.title.replace(/^Ansprechpartner:\s*/, '');

  return <WerkbankRahmen role="homeowner" active="/app/jobs">
    <EHPageHeader title="Deine Aufträge" context={`${jobs.length} ${jobs.length === 1 ? 'Auftrag' : 'Aufträge'}`} actions={<EHButton href="/app/hausmeister" arrow>Anliegen beschreiben</EHButton>} />
    <EHMetricsBar label="Aufträge" items={[
      { id: 'gesamt', label: 'Aufträge gesamt', value: String(jobs.length), hint: 'in deiner Akte' },
      { id: 'offen', label: 'Offen', value: String(openJobs.length), hint: quotedJobs.length > 0 ? `${quotedJobs.length} mit Angebot` : 'noch ohne Angebot' },
      { id: 'arbeit', label: 'In Arbeit', value: String(inProgressJobs.length), hint: 'beauftragt und laufend' },
      { id: 'fertig', label: 'Abgeschlossen', value: String(completedJobs.length), hint: 'erledigte Aufträge' },
    ]} />
    <EHOwnerSearch action="/app/jobs" query={firstParam(params.q)} placeholder="Auftrag, Gewerk oder Betrieb" hidden={currentView === 'current' ? undefined : {name:'view',value:currentView}} />
    <EHOwnerFilters label="Aufträge filtern" items={[
      {href:filterHref('current'),label:'Aktuell',active:currentView==='current'},
      {href:filterHref('open'),label:'Offen',count:openJobs.length,active:currentView==='open'},
      {href:filterHref('in_progress'),label:'In Arbeit',count:inProgressJobs.length,active:currentView==='in_progress'},
      {href:filterHref('completed'),label:'Abgeschlossen',count:completedJobs.length,active:currentView==='completed'},
    ]} />
    <EHWorkspaceGrid main={
    <EHOwnerSection title={viewTitle} text={`${filteredJobs.length} ${filteredJobs.length === 1 ? 'Auftrag' : 'Aufträge'}${query ? ' für deine Suche' : ''}`}>
      {filteredJobs.length ? <EHRecordViews label={viewTitle} storageKey="auftraege" defaultView="liste" switcherLabel="Aufträge: Ansicht wechseln" items={filteredJobs.map(job => ({
        id:String(job.id),href:`/app/jobs/${job.id}`,title:jobTitle(job),
        detail:[job.category,job.accepted_business].filter(Boolean).join(' · '),
        date:(job.appointment_start||job.preferred_date||job.updated_at).slice(0,10),
        dateLabel:ownerDate(job.appointment_start||job.preferred_date||job.updated_at),
        note:jobScheduleCopy(job),
        status:<EHStatus tone={jobStatusTone(job.status)}>{jobStatusCopy(job)}</EHStatus>,
        action:<span>{job.status==='quoted'?'Angebot prüfen':'Auftrag öffnen'}</span>,
      }))} /> : <EHEmptyState title={query ? 'Keine passenden Aufträge' : 'Keine Aufträge in dieser Ansicht'} text={query ? 'Ändere deine Suche oder wähle einen anderen Status.' : 'Neue Anliegen kannst du oben beschreiben. Bereits vorhandene Aufträge findest du über die Statusfilter.'} />}
    </EHOwnerSection>
    } aside={<>
      <EHWorkSection title="Nächster Termin">
        {nextAppointment ? <>
          <EHText>{ownerDate(nextAppointment.appointment_start)}</EHText>
          <EHText muted>{nextAppointment.accepted_business || nextAppointment.category || 'Betrieb im Auftrag'}</EHText>
          <EHButton href={`/app/jobs/${nextAppointment.id}`} variant="secondary" arrow>{jobTitle(nextAppointment)}</EHButton>
        </> : <EHText muted>Kein bestätigter Termin in deinen Aufträgen. Ein Wunschtermin steht in der Zeile des jeweiligen Auftrags.</EHText>}
      </EHWorkSection>
      <EHWorkSection title="Angebote prüfen">
        <EHRecordList label="Aufträge mit offenem Angebot" empty="Gerade liegt kein Angebot zur Prüfung vor." items={quotedJobs.map(job => ({
          id: String(job.id),
          title: jobTitle(job),
          detail: [job.quotes > 0 ? `${job.quotes} ${job.quotes === 1 ? 'Angebot' : 'Angebote'}` : 'Angebotsstatus prüfen', job.category].filter(Boolean).join(' · '),
          date: job.updated_at.slice(0, 10),
          dateLabel: ownerDate(job.updated_at),
          href: `/app/jobs/${job.id}`,
        }))} />
      </EHWorkSection>
      <EHWorkSection title="Aufträge nach Gewerk">
        <EHRecordList label="Aufträge nach Gewerk" empty="Noch kein Gewerk erfasst." items={Array.from(byCategory.entries()).sort((a, b) => b[1] - a[1]).map(([category, count]) => ({
          id: `gewerk-${category}`,
          title: category,
          detail: `${count} ${count === 1 ? 'Auftrag' : 'Aufträge'}`,
        }))} />
      </EHWorkSection>
    </>} />
  </WerkbankRahmen>;
}
