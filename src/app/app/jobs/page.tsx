import { AppShell } from '@/components/shell';
import { EHEmptyState, EHOwnerPageHeader, EHOwnerSection, EHOwnerRecords, EHOwnerFilters, EHOwnerSearch } from '@/design-system';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { statusLabel } from '@/lib/format';
import { ownerDate, ownerInstant } from '@/lib/owner-format';
import { mediaKindFromPath } from '@/lib/intake-media';

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

  return <AppShell role="homeowner" active="/app/jobs" title="Aufträge">
    <EHOwnerPageHeader title="Deine Aufträge" text="Angebote prüfen, Arbeiten verfolgen und abgeschlossene Aufträge wiederfinden." action={{href:'/app/hausmeister',label:'Anliegen beschreiben'}} />
    <EHOwnerSearch action="/app/jobs" query={firstParam(params.q)} placeholder="Auftrag, Gewerk oder Betrieb" hidden={currentView === 'current' ? undefined : {name:'view',value:currentView}} />
    <EHOwnerFilters label="Aufträge filtern" items={[
      {href:filterHref('current'),label:'Aktuell',active:currentView==='current'},
      {href:filterHref('open'),label:'Offen',count:openJobs.length,active:currentView==='open'},
      {href:filterHref('in_progress'),label:'In Arbeit',count:inProgressJobs.length,active:currentView==='in_progress'},
      {href:filterHref('completed'),label:'Abgeschlossen',count:completedJobs.length,active:currentView==='completed'},
    ]} />
    <EHOwnerSection title={viewTitle} text={`${filteredJobs.length} ${filteredJobs.length === 1 ? 'Auftrag' : 'Aufträge'}${query ? ' für deine Suche' : ''}`}>
      {filteredJobs.length ? <EHOwnerRecords label={viewTitle} items={filteredJobs.map(job => ({
        id:String(job.id),href:`/app/jobs/${job.id}`,title:job.title.replace(/^Ansprechpartner:\s*/,''),
        detail:[job.category,job.accepted_business].filter(Boolean).join(' · '),meta:jobScheduleCopy(job),
        status:jobStatusCopy(job),tone:jobStatusTone(job.status),action:job.status==='quoted'?'Angebot prüfen':'Auftrag öffnen',
        media:job.photo_id && mediaKindFromPath(job.photo_path)==='image' ? {src:`/api/job-media/${job.photo_id}`,alt:`Foto zum Auftrag ${job.title}`} : undefined,
      }))} /> : <EHEmptyState title={query ? 'Keine passenden Aufträge' : 'Keine Aufträge in dieser Ansicht'} text={query ? 'Ändere deine Suche oder wähle einen anderen Status.' : 'Neue Anliegen kannst du oben beschreiben. Bereits vorhandene Aufträge findest du über die Statusfilter.'} />}
    </EHOwnerSection>
  </AppShell>;
}
