import { AppShell } from '@/components/shell';
import { crumbs } from '@/components/nav-config';
import { EHAppHeader, EHWorkSection, EHScheduleList, EHRouteTabs, EHList, EHEmptyState, EHButton, EHActions, EHStatus, EHSubmitButton } from '@/design-system';
import { completeMaintenanceTaskAction } from '@/app/actions';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { dateLabel } from '@/lib/format';
import { primaryProperty } from '@/lib/properties';

type Task = { id: number; title: string; category: string; due_date: string; status: string };
type Job = { id: number; title: string; preferred_date: string; status: string };
const berlinDay = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' });
const monthFmt = new Intl.DateTimeFormat('de-DE', { month: 'short', timeZone: 'Europe/Berlin' });

export default async function YearPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser('homeowner');
  const property = primaryProperty(user.id);
  const sp = await searchParams;
  const view = sp.view === 'history' ? 'history' : 'plan';
  const today = berlinDay.format(new Date());
  const currentYear = Number(today.slice(0, 4));
  const requestedYear = typeof sp.year === 'string' && /^\d{4}$/.test(sp.year) ? Number(sp.year) : NaN;
  const year = Number.isInteger(requestedYear) && requestedYear >= 1900 && requestedYear <= 9998 ? requestedYear : currentYear;
  const start = `${year}-01-01`;
  const end = `${year + 1}-01-01`;
  const tasks = property ? db.prepare(`
    SELECT id,title,category,due_date,status FROM maintenance_tasks
    WHERE property_id=? AND homeowner_id=? AND status=? AND due_date>=? AND due_date<?
    ORDER BY due_date
  `).all(property.id, user.id, view === 'plan' ? 'open' : 'completed', start, end) as Task[] : [];
  const overdue = view === 'plan' ? tasks.filter(task => task.due_date.slice(0, 10) < today) : [];
  const remaining = view === 'plan' ? tasks.filter(task => task.due_date.slice(0, 10) >= today) : [...tasks].reverse();
  const jobs = (view === 'plan'
    ? db.prepare(`SELECT id,title,preferred_date,status FROM jobs WHERE homeowner_id=? AND request_kind='service' AND status IN ('accepted','in_progress') AND preferred_date>=? AND preferred_date<? ORDER BY preferred_date`)
    : db.prepare(`SELECT id,title,updated_at preferred_date,status FROM jobs WHERE homeowner_id=? AND request_kind='service' AND status='completed' AND updated_at>=? AND updated_at<? ORDER BY updated_at DESC`)
  ).all(user.id, start, end) as Job[];

  const taskItems = (rows: Task[]) => rows.map(task => ({
    id: String(task.id),
    title: task.title,
    text: `${task.category} · Fällig ${dateLabel(task.due_date)}`,
    meta: task.status === 'completed'
      ? <EHStatus tone="success">Erledigt</EHStatus>
      : task.due_date.slice(0, 10) < today ? <EHStatus tone="error">Überfällig</EHStatus> : undefined,
    action: task.status === 'open' ? (
      <form action={completeMaintenanceTaskAction.bind(null, task.id)} aria-label={`${task.title} abschließen`}>
        <EHSubmitButton pendingLabel="Wird abgeschlossen …">Als erledigt markieren</EHSubmitButton>
      </form>
    ) : undefined,
  }));

  return <AppShell role="homeowner" active="/app/home" title="Mein Jahr" subtitle="Wartung, Termine und Hausaufgaben" breadcrumbs={crumbs('/app/home','Mein Jahr')}>
    <EHAppHeader eyebrow={String(year)} title="Mein Jahr" text="Wartungen und Aufträge für dein Zuhause. Wähle ein Jahr und behalte offene Aufgaben im Blick." actions={<EHButton href="/app/hausmeister" arrow>Neue Aufgabe planen</EHButton>} />
    <nav aria-label="Jahr auswählen">
      <EHActions>
        {year > 1900 && <EHButton variant="secondary" href={`/app/year?view=${view}&year=${year - 1}`}>← {year - 1}</EHButton>}
        <EHButton variant="secondary" href={`/app/year?view=${view}&year=${currentYear}`}>Aktuelles Jahr · {currentYear}</EHButton>
        {year < 9998 && <EHButton variant="secondary" href={`/app/year?view=${view}&year=${year + 1}`}>{year + 1} →</EHButton>}
      </EHActions>
    </nav>
    <EHRouteTabs label="Jahresansicht" items={[
      { href: `/app/year?view=plan&year=${year}`, label: 'Plan', active: view === 'plan' },
      { href: `/app/year?view=history&year=${year}`, label: 'Historie', active: view === 'history' },
    ]} />
    {overdue.length > 0 && <EHWorkSection title={`Überfällige Wartungen · ${year}`}>
      <EHList label="Überfällige Wartungen im gewählten Jahr" items={taskItems(overdue)} />
    </EHWorkSection>}
    <EHWorkSection title={view === 'plan' ? `Weitere Wartungen · ${year}` : `Erledigte Wartungen · ${year}`}>
      {view === 'history' && <p>Nach ursprünglichem Fälligkeitsdatum geordnet. Ein gesondertes Abschlussdatum wird bisher nicht erfasst.</p>}
      {remaining.length > 0
        ? <EHList label={view === 'plan' ? 'Geplante Wartungen' : 'Erledigte Wartungen'} items={taskItems(remaining)} />
        : <EHEmptyState title={view === 'plan' ? 'Keine weiteren Wartungen geplant' : 'Keine erledigten Wartungen in diesem Fälligkeitsjahr'} text={view === 'plan' ? 'Hinterlege deine Technik in „Mein Haus“ oder plane ein Anliegen über den Hausmeister.' : 'Abgeschlossene Wartungen bleiben hier erhalten. Prüfe bei Bedarf ein anderes Jahr.'} />}
    </EHWorkSection>
    <EHWorkSection title={view === 'plan' ? `Aufträge · ${year}` : `Erledigte Aufträge · ${year}`}>
      {view === 'history' && <p>Nach der letzten Aktualisierung des abgeschlossenen Auftrags geordnet.</p>}
      {jobs.length === 0
        ? <EHEmptyState title={view === 'plan' ? 'Keine Aufträge mit geplantem Datum in diesem Jahr' : 'Keine abgeschlossenen Aufträge in diesem Jahr'} text="Alle deine Anfragen und Aufträge findest du unabhängig vom Jahr in der Auftragsübersicht." />
        : <EHScheduleList label="Aufträge im gewählten Jahr" items={jobs.map(job => {
          const d = new Date(job.preferred_date.length === 10 ? `${job.preferred_date}T12:00:00Z` : job.preferred_date.replace(' ', 'T'));
          return {
            id: String(job.id), day: new Intl.DateTimeFormat('de-DE', { day: '2-digit', timeZone: 'Europe/Berlin' }).format(d),
            month: monthFmt.format(d).replace('.', '').toUpperCase(), dateLabel: dateLabel(job.preferred_date),
            title: job.title, detail: 'Auftrag', href: `/app/jobs/${job.id}`,
            status: job.status === 'completed' ? 'Erledigt' : undefined,
            tone: job.status === 'completed' ? 'success' as const : undefined,
          };
        })} />}
      <EHActions><EHButton variant="secondary" href="/app/jobs">Alle Aufträge öffnen</EHButton></EHActions>
    </EHWorkSection>
  </AppShell>;
}
