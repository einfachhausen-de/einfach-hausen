import type { CSSProperties } from 'react';
import '@/components/werkbank-layout.css';
import Link from 'next/link';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import { EHOwnerSearch } from '@/design-system';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { euroExact, statusLabel } from '@/lib/format';
import { ownerDate, ownerInstant } from '@/lib/owner-format';
import { JobsAnsicht, JobsAnsichtSwitcher, type JobAnsichtRow } from './jobs-ansicht';

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
  amount: number | null;
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

function shortDay(value: string): string {
  const raw = String(value);
  const isDay = /^\d{4}-\d{2}-\d{2}$/.test(raw);
  const instant = isDay ? new Date(`${raw}T12:00:00Z`) : ownerInstant(raw);
  if (!instant) return raw.slice(0, 10);
  return new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', day: '2-digit', month: '2-digit' }).format(instant);
}

function appointmentParts(value: string): { day: string; time: string } {
  const instant = ownerInstant(value);
  if (!instant) return { day: ownerDate(value), time: '' };
  return {
    day: new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', weekday: 'short', day: '2-digit', month: '2-digit' }).format(instant),
    time: new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit' }).format(instant),
  };
}

function upcomingAppointments(jobs: JobRow[]): JobRow[] {
  const nowMs = Date.now();
  return jobs
    .filter((job) => job.appointment_start && (ownerInstant(job.appointment_start)?.getTime() ?? 0) >= nowMs)
    .sort((a, b) => (ownerInstant(a.appointment_start)?.getTime() ?? 0) - (ownerInstant(b.appointment_start)?.getTime() ?? 0));
}

/**
 * Rechte Spalte und Kopf dieser Seite. Dieselben Token wie auf /app:
 * Karten, Registerlinie, keine zweite Stilfamilie. Die Balkenbreite ist der
 * Anteil, kein Layout.
 */

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
        ) AS photo_path,
        (
          SELECT q2.amount
          FROM quotes q2
          WHERE q2.job_id=j.id
            AND q2.status IN ('pending','accepted')
          ORDER BY CASE WHEN j.accepted_quote_id IS NOT NULL AND q2.id=j.accepted_quote_id THEN 0 ELSE 1 END, q2.amount ASC
          LIMIT 1
        ) AS amount
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

  const quotedJobs = jobs.filter((job) => job.status === 'quoted');
  const upcoming = upcomingAppointments(jobs);
  const jobTitle = (job: JobRow) => job.title.replace(/^Ansprechpartner:\s*/, '');
  const total = jobs.length;
  const statusParts = [
    { id: 'quoted', label: 'Braucht dich', count: quotedJobs.length, tone: 'terra' },
    { id: 'progress', label: 'In Arbeit', count: inProgressJobs.length, tone: 'petrol' },
    { id: 'done', label: 'Abgeschlossen', count: completedJobs.length, tone: 'ok' },
    { id: 'open', label: 'Offen', count: jobs.filter((job) => job.status === 'open').length, tone: 'line' },
    { id: 'accepted', label: statusLabel('accepted'), count: jobs.filter((job) => job.status === 'accepted').length, tone: 'petrol' },
    { id: 'cancelled', label: statusLabel('cancelled'), count: jobs.filter((job) => job.status === 'cancelled').length, tone: 'line' },
  ].filter((part) => part.count > 0);
  const filters = [
    { href: filterHref('current'), label: 'Aktuell', active: currentView === 'current' },
    { href: filterHref('open'), label: 'Offen', count: openJobs.length, active: currentView === 'open' },
    { href: filterHref('in_progress'), label: 'In Arbeit', count: inProgressJobs.length, active: currentView === 'in_progress' },
    { href: filterHref('completed'), label: 'Abgeschlossen', count: completedJobs.length, active: currentView === 'completed' },
  ];

  const rows: JobAnsichtRow[] = filteredJobs.map((job) => ({
    id: String(job.id),
    href: `/app/jobs/${job.id}`,
    title: jobTitle(job),
    numberLine: `Nr. ${job.id} · ${shortDay(job.created_at)}`,
    business: job.accepted_business || '–',
    statusLabel: jobStatusCopy(job),
    tone: jobStatusTone(job.status),
    amount: typeof job.amount === 'number' ? euroExact(job.amount) : '–',
    detail: [job.category, job.accepted_business].filter(Boolean).join(' · '),
    date: (job.appointment_start || job.preferred_date || job.updated_at).slice(0, 10),
    dateLabel: ownerDate(job.appointment_start || job.preferred_date || job.updated_at),
    note: jobScheduleCopy(job),
  }));

  return <WerkbankRahmen role="homeowner" active="/app/jobs" searchLabel="Auftrag oder Betrieb" rail={<>
      <p className="eh-werkbank-rail-h">Kontext dieser Seite</p>
      <div className="eh-werkbank-karte">
        <h4>Status</h4>
        {total > 0 && (
          <div className="eh-werkbank-stack" aria-hidden="true">
            {statusParts.map((part) => (
              <span
                key={part.id}
                className={`eh-werkbank-anteil-${part.tone}`}
                style={{ '--eh-anteil': `${(part.count / total) * 100}%` } as CSSProperties}
              />
            ))}
          </div>
        )}
        {statusParts.map((part) => (
          <div key={part.id} className="eh-werkbank-row"><span>{part.label}</span><span>{part.count}</span></div>
        ))}
        {total === 0 && <p className="eh-werkbank-leer">Noch keine Aufträge.</p>}
      </div>
      <div className="eh-werkbank-karte">
        <h4>Nächste Termine</h4>
        {upcoming.length ? upcoming.map((job) => {
          const parts = appointmentParts(job.appointment_start as string);
          return (
            <Link key={`${job.id}-${job.appointment_start}`} href={`/app/jobs/${job.id}`} className="eh-werkbank-item">
              <span><b>{parts.day}</b><small>{parts.time}</small></span>
              <span>{job.accepted_business || jobTitle(job)}</span>
            </Link>
          );
        }) : <p className="eh-werkbank-leer">Kein bestätigter Termin in deinen Aufträgen. Ein Wunschtermin steht in der Zeile des jeweiligen Auftrags.</p>}
      </div>
    </>}>
    
    <header className="eh-werkbank-kopf">
      <div className="eh-werkbank-kopf-copy">
        <h1>Aufträge</h1>
        <span>{`${jobs.length} ${jobs.length === 1 ? 'Auftrag' : 'Aufträge'}`}</span>
      </div>
      <div className="eh-werkbank-kopf-tools">
        <JobsAnsichtSwitcher />
        <Link className="eh-werkbank-kopf-cta" href="/app/hausmeister">+ Anliegen</Link>
      </div>
    </header>
    <EHOwnerSearch action="/app/jobs" query={firstParam(params.q)} placeholder="Auftrag, Gewerk oder Betrieb" hidden={currentView === 'current' ? undefined : {name:'view',value:currentView}} />
    <nav className="eh-werkbank-chips" aria-label="Aufträge filtern">
      {filters.map((item) => (
        <Link key={item.href} href={item.href} className="eh-werkbank-chip" aria-current={item.active ? 'page' : undefined}>
          {item.label}
          {'count' in item && item.count !== undefined && <span className="eh-werkbank-chip-n">{item.count}</span>}
        </Link>
      ))}
    </nav>
    <JobsAnsicht
      label={viewTitle}
      rows={rows}
      emptyTitle={query ? 'Keine passenden Aufträge' : 'Keine Aufträge in dieser Ansicht'}
      emptyText={query ? 'Ändere deine Suche oder wähle einen anderen Status.' : 'Neue Anliegen kannst du oben beschreiben. Bereits vorhandene Aufträge findest du über die Statusfilter.'}
    />
  </WerkbankRahmen>;
}
