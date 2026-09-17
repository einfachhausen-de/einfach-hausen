import { AppShell } from '@/components/shell';
import { crumbs } from '@/components/nav-config';
import { EHActions, EHButton, EHEmptyState, EHMetricsBar, EHPageHeader, EHRecordList, EHRecordViews, EHRouteTabs, EHStatus, EHSubmitButton, EHText, EHWorkSection, EHWorkspaceGrid } from '@/design-system';
import { completeMaintenanceTaskAction } from '@/app/actions';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { dateLabel, euroExact } from '@/lib/format';
import { primaryProperty } from '@/lib/properties';

type Task = { id: number; title: string; category: string; due_date: string; status: string };
type Job = { id: number; title: string; preferred_date: string; status: string };
type OpenInvoice = { id: number; invoice_number: string; total_gross: number; issue_date: string; due_date: string; title: string; business_name: string | null };
type LastJob = { id: number; title: string; completed_at: string };
const berlinDay = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' });

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
  const remaining = view === 'plan' ? tasks.filter(task => task.due_date.slice(0, 10) >= today) : [...tasks].reverse();
  const shownTasks = view === 'plan' ? tasks : remaining;
  const jobs = (view === 'plan'
    ? db.prepare(`SELECT id,title,preferred_date,status FROM jobs WHERE homeowner_id=? AND request_kind='service' AND status IN ('accepted','in_progress') AND preferred_date>=? AND preferred_date<? ORDER BY preferred_date`)
    : db.prepare(`SELECT id,title,updated_at preferred_date,status FROM jobs WHERE homeowner_id=? AND request_kind='service' AND status='completed' AND updated_at>=? AND updated_at<? ORDER BY updated_at DESC`)
  ).all(user.id, start, end) as Job[];

  // Offene Posten des Jahres: Kennzahl und rechte Spalte lesen dieselbe Liste,
  // damit die Zahl oben und die Eintraege rechts nicht auseinanderlaufen.
  const openInvoices = db.prepare(`
    SELECT i.id,i.invoice_number,i.total_gross,i.issue_date,i.due_date,j.title,p.business_name
    FROM invoices i JOIN jobs j ON j.id=i.job_id LEFT JOIN provider_profiles p ON p.user_id=i.provider_id
    WHERE i.homeowner_id=? AND i.status='sent' AND i.issue_date>=? AND i.issue_date<?
    ORDER BY i.due_date
  `).all(user.id, start, end) as OpenInvoice[];
  const openTotal = openInvoices.reduce((sum, invoice) => sum + (Number.isFinite(invoice.total_gross) ? invoice.total_gross : 0), 0);

  // Ueberfaellig zaehlt ueber das ganze Jahr, nicht ueber die gerade sichtbare
  // Liste: in der Historie waeren offene Wartungen sonst systematisch null.
  const overdueCount = property ? (db.prepare(`
    SELECT COUNT(*) c FROM maintenance_tasks
    WHERE property_id=? AND homeowner_id=? AND status='open' AND due_date>=? AND due_date<? AND due_date<?
  `).get(property.id, user.id, start, end, today) as { c: number }).c : 0;

  // Der letzte abgeschlossene Vorgang des Jahres ist der Anker der rechten
  // Spalte - im Plan wie in der Historie derselbe Begriff.
  const lastJob = db.prepare(`
    SELECT id,title,updated_at completed_at FROM jobs
    WHERE homeowner_id=? AND request_kind='service' AND status='completed' AND updated_at>=? AND updated_at<?
    ORDER BY updated_at DESC LIMIT 1
  `).get(user.id, start, end) as LastJob | undefined;

  const taskItems = (rows: Task[]) => rows.map(task => ({
    id: String(task.id),
    title: task.title,
    detail: task.category,
    date: task.due_date.slice(0, 10),
    dateLabel: dateLabel(task.due_date),
    status: task.status === 'completed'
      ? <EHStatus tone="success">Erledigt</EHStatus>
      : task.due_date.slice(0, 10) < today ? <EHStatus tone="error">Überfällig</EHStatus> : undefined,
    action: task.status === 'open' ? (
      <form action={completeMaintenanceTaskAction.bind(null, task.id)} aria-label={`${task.title} abschließen`}>
        <EHSubmitButton pendingLabel="Wird abgeschlossen …">Als erledigt markieren</EHSubmitButton>
      </form>
    ) : undefined,
  }));

  return <AppShell role="homeowner" active="/app/year" title="Mein Jahr" subtitle="Wartung, Termine und Hausaufgaben" breadcrumbs={crumbs('/app/home','Mein Jahr')}>
    <EHPageHeader title="Mein Jahr" context={`${view === 'plan' ? 'Plan' : 'Historie'} ${year}`} actions={<EHButton href="/app/hausmeister" arrow>Neue Aufgabe planen</EHButton>} />
    <EHMetricsBar label="Mein Jahr" items={[
      { id: 'wartungen', label: 'Wartungen', value: String(tasks.length), hint: view === 'history' ? 'nach Fälligkeit' : 'offen im gewählten Jahr' },
      { id: 'auftraege', label: 'Aufträge', value: String(jobs.length), hint: view === 'history' ? 'nach letzter Aktualisierung' : 'mit Datum im Jahr' },
      { id: 'ueberfaellig', label: 'Überfällig', value: String(overdueCount), hint: overdueCount > 0 ? 'vor heute fällig' : 'nichts überfällig' },
      { id: 'offen', label: 'Offene Posten', value: String(openInvoices.length), hint: openInvoices.length > 0 ? `${euroExact(openTotal)} offen` : 'nichts offen' },
    ]} />
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
    <EHWorkspaceGrid main={<>
      <EHWorkSection title={view === 'plan' ? `Wartungen · ${year}` : `Erledigte Wartungen · ${year}`}>
        {shownTasks.length > 0
          ? <EHRecordViews label={view === 'plan' ? 'Geplante Wartungen' : 'Erledigte Wartungen'} storageKey="jahr-wartung" defaultView={view === 'history' ? 'chronik' : 'liste'} switcherLabel="Wartungen: Ansicht wechseln" items={taskItems(shownTasks)} />
          : <EHEmptyState title={view === 'plan' ? 'Keine weiteren Wartungen geplant' : 'Keine erledigten Wartungen in diesem Fälligkeitsjahr'} text={view === 'plan' ? 'Hinterlege deine Technik in „Mein Haus“ oder plane ein Anliegen über den Hausmeister.' : 'Abgeschlossene Wartungen bleiben hier erhalten. Prüfe bei Bedarf ein anderes Jahr.'} />}
      </EHWorkSection>
      <EHWorkSection title={view === 'plan' ? `Aufträge · ${year}` : `Erledigte Aufträge · ${year}`}>
        {jobs.length === 0
          ? <EHEmptyState title={view === 'plan' ? 'Keine Aufträge mit geplantem Datum in diesem Jahr' : 'Keine abgeschlossenen Aufträge in diesem Jahr'} text="Alle deine Anfragen und Aufträge findest du unabhängig vom Jahr in der Auftragsübersicht." />
          : <EHRecordViews label="Aufträge im gewählten Jahr" storageKey="jahr-auftraege" defaultView={view === 'history' ? 'chronik' : 'liste'} switcherLabel="Aufträge im Jahr: Ansicht wechseln" items={jobs.map(job => ({
              id: String(job.id),
              title: job.title,
              detail: 'Auftrag',
              date: job.preferred_date.slice(0, 10),
              dateLabel: dateLabel(job.preferred_date),
              status: job.status === 'completed' ? <EHStatus tone="success">Erledigt</EHStatus> : undefined,
              href: `/app/jobs/${job.id}`,
            }))} />}
        <EHActions><EHButton variant="secondary" href="/app/jobs">Alle Aufträge öffnen</EHButton></EHActions>
      </EHWorkSection>
    </>} aside={<>
      <EHWorkSection title={`Letzter Vorgang · ${year}`}>
        {lastJob ? <>
          <EHText>{dateLabel(lastJob.completed_at)}</EHText>
          <EHStatus tone="success">Erledigt</EHStatus>
          <EHButton href={`/app/jobs/${lastJob.id}`} variant="secondary" arrow>{lastJob.title}</EHButton>
        </> : <EHText muted>In {year} wurde kein Auftrag abgeschlossen. Laufende Vorgänge stehen unter Aufträge.</EHText>}
      </EHWorkSection>
      <EHWorkSection title={`Offene Posten · ${year}`}>
        <EHRecordList label={`Offene Posten ${year}`} empty={`Keine offenen Rechnungen mit Rechnungsdatum in ${year}.`} items={openInvoices.map(invoice => ({
          id: String(invoice.id),
          title: `Rechnung ${invoice.invoice_number}`,
          detail: [invoice.business_name, invoice.title, `fällig ${dateLabel(invoice.due_date)}`].filter(Boolean).join(' · '),
          value: euroExact(invoice.total_gross),
          date: invoice.issue_date.slice(0, 10),
          dateLabel: dateLabel(invoice.issue_date),
          status: <EHStatus tone="warning">Offen</EHStatus>,
          href: `/app/invoices/${invoice.id}`,
        }))} />
        {openInvoices.length > 0 && <EHText muted>{openInvoices.length} {openInvoices.length === 1 ? 'Rechnung' : 'Rechnungen'} · {euroExact(openTotal)} noch offen.</EHText>}
      </EHWorkSection>
      <EHWorkSection title="Hausakte">
        <EHText muted>Frühere Arbeiten, Wartungen und Nachweise zu deinem Zuhause sammelt die Haus-Historie – unabhängig vom gewählten Jahr.</EHText>
        <EHButton href="/app/home/history" variant="secondary" arrow>Zur Haus-Historie</EHButton>
      </EHWorkSection>
    </>} />
  </AppShell>;
}
