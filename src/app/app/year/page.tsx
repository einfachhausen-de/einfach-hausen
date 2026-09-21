import { EHButton, EHEmptyState, EHMetricsBar, EHPageHeader, EHRecordList, EHStatus, EHSubmitButton, EHText, EHWorkSection, EHWorkspaceGrid, EHWorkflowStack } from '@/design-system';
import { completeMaintenanceTaskAction } from '@/app/actions';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { dateLabel, euroExact } from '@/lib/format';
import { primaryProperty } from '@/lib/properties';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';

type Task = { id: number; title: string; category: string; due_date: string; status: string };
type Job = { id: number; title: string; preferred_date: string; status: string };
type OpenInvoice = { id: number; invoice_number: string; total_gross: number; issue_date: string; due_date: string; title: string; business_name: string | null };
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

  return <WerkbankRahmen role="homeowner" active="/app/year">
    <EHWorkflowStack>
    <EHPageHeader title="Mein Jahr" context={`${view === 'plan' ? 'Plan' : 'Erledigt'} ${year}`} actions={<EHButton href="/app/hausmeister" arrow>Neue Aufgabe planen</EHButton>} />
    <EHMetricsBar label="Mein Jahr" items={view === 'plan' ? [
      { id: 'offen', label: 'Noch offen', value: String(remaining.length), hint: 'Aufgaben in diesem Jahr' },
      { id: 'ueberfaellig', label: 'Überfällig', value: String(overdueCount), hint: overdueCount > 0 ? 'vor heute fällig' : 'nichts überfällig' },
    ] : [
      { id: 'erledigt', label: 'Erledigt', value: String(tasks.length), hint: 'Pflege in diesem Jahr' },
      { id: 'auftraege', label: 'Aufträge erledigt', value: String(jobs.length), hint: 'in diesem Jahr' },
    ]} />
    <nav aria-label="Jahr auswählen">
      <EHRecordList label="Jahr" items={[
        { id: 'dieses', title: `Dieses Jahr · ${currentYear}`, href: `/app/year?view=${view}&year=${currentYear}` },
        ...(year !== currentYear - 1 ? [{ id: 'letztes', title: `Letztes Jahr · ${currentYear - 1}`, href: `/app/year?view=${view}&year=${currentYear - 1}` }] : []),
      ]} />
    </nav>
    <nav aria-label="Jahresansicht">
      <EHRecordList label="Ansicht" items={[
        { id: 'plan', title: `Plan ${year}`, detail: 'Was ansteht', href: `/app/year?view=plan&year=${year}`, status: view === 'plan' ? <EHStatus tone="info">Hier</EHStatus> : undefined },
        { id: 'done', title: `Erledigt ${year}`, detail: 'Was geschafft ist', href: `/app/year?view=history&year=${year}`, status: view !== 'plan' ? <EHStatus tone="info">Hier</EHStatus> : undefined },
      ]} />
    </nav>
    <EHWorkspaceGrid main={<>
      <EHWorkSection title={view === 'plan' ? `Pflege · ${year}` : `Erledigte Pflege · ${year}`}>
        {shownTasks.length > 0
          ? <EHRecordList label={view === 'plan' ? 'Geplante Pflege' : 'Erledigte Pflege'} items={taskItems(shownTasks)} />
          : <EHEmptyState title={view === 'plan' ? 'Keine weiteren Pflegepunkte geplant' : 'Nichts erledigt in diesem Jahr'} text={view === 'plan' ? 'Hinterlege deine Technik in „Mein Haus“ oder plane ein Anliegen über den Hausmeister.' : 'Abgeschlossene Pflege bleibt hier erhalten.'} />}
      </EHWorkSection>
      <EHWorkSection title={view === 'plan' ? `Aufträge · ${year}` : `Erledigte Aufträge · ${year}`}>
        {jobs.length === 0
          ? <EHEmptyState title={view === 'plan' ? 'Keine Aufträge mit Datum in diesem Jahr' : 'Keine abgeschlossenen Aufträge in diesem Jahr'} text="Alle deine Anfragen und Aufträge findest du unabhängig vom Jahr in der Auftragsübersicht." />
          : <EHRecordList label="Aufträge im gewählten Jahr" items={jobs.map(job => ({
              id: String(job.id),
              title: job.title,
              detail: 'Auftrag',
              date: job.preferred_date.slice(0, 10),
              dateLabel: dateLabel(job.preferred_date),
              status: job.status === 'completed' ? <EHStatus tone="success">Erledigt</EHStatus> : undefined,
              href: `/app/jobs/${job.id}`,
            }))} />}
        <EHButton variant="secondary" href="/app/jobs">Alle Aufträge öffnen</EHButton>
      </EHWorkSection>
    </>} aside={<>
      <EHWorkSection title={`Noch zu zahlen · ${year}`}>
        <EHRecordList label={`Noch zu zahlen ${year}`} empty={`Keine offenen Rechnungen mit Rechnungsdatum in ${year}.`} items={openInvoices.map(invoice => ({
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
    </>} />
    </EHWorkflowStack>
  </WerkbankRahmen>;
}
