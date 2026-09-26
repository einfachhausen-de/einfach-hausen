import { CalendarDays, FileText } from 'lucide-react';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import { WerkbankAbschnitt, WerkbankKopf } from '@/components/werkbank-seite';
import { EHFormFeedback, EHManagerAutomations, EHRecordList, EHWorkflowStack, type EHRecordEntry } from '@/design-system';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { dateLabel } from '@/lib/format';
import { AUTOMATION_STARTERS, getAutomationPrefs } from '@/lib/hausmanager';
import { updateAutomationPrefsAction } from '@/app/actions';
import { primaryProperty } from '@/lib/properties';

export default async function Hausmanager({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const user = await requireUser('homeowner');
  const sp = await searchParams;
  const property = primaryProperty(user.id);
  const houseLabel = property?.address || '';

  const quotedJobs = db
    .prepare(
      `SELECT j.id, j.title,
        (SELECT COUNT(*) FROM quotes q WHERE q.job_id = j.id AND q.status = 'pending') quote_count
      FROM jobs j
      WHERE j.homeowner_id = ? AND j.status = 'quoted'
      ORDER BY j.updated_at DESC LIMIT 3`,
    )
    .all(user.id) as { id: number; title: string; quote_count: number }[];

  const dueMaintenance = (property
    ? db
        .prepare(
          `SELECT id, title, due_date FROM maintenance_tasks
          WHERE property_id = ? AND status = 'open'
          ORDER BY date(due_date) ASC LIMIT 3`,
        )
        .all(property.id)
    : []) as { id: number; title: string; due_date: string }[];

  const prefs = getAutomationPrefs(user.id);
  const taskItems: EHRecordEntry[] = [
    ...dueMaintenance.map((task) => ({
      id: `maintenance-${task.id}`,
      title: task.title,
      detail: `Fällig ${dateLabel(task.due_date)}`,
      href: '/app/year',
      icon: <CalendarDays aria-hidden="true" size={20} />,
    })),
    ...quotedJobs.map((job) => ({
      id: `quote-${job.id}`,
      title: job.title,
      detail: `${job.quote_count} ${job.quote_count === 1 ? 'Angebot' : 'Angebote'} prüfen`,
      href: `/app/jobs/${job.id}`,
      icon: <FileText aria-hidden="true" size={20} />,
    })),
  ];

  return (
    <WerkbankRahmen
      role="homeowner"
      active="/app/hausmanager"
    >
      <EHWorkflowStack>
      <WerkbankKopf title="Hausmanager" context={houseLabel || undefined} />

      {sp.prefs === 'saved' && (
        <EHFormFeedback kind="success">Erinnerungen gespeichert.</EHFormFeedback>
      )}

      <WerkbankAbschnitt title="Anstehende Aufgaben">
        <EHRecordList label="Anstehende Aufgaben" items={taskItems} empty="Aktuell nichts fällig. Neue Aufgaben erscheinen hier automatisch." />
      </WerkbankAbschnitt>

      <EHManagerAutomations
        items={AUTOMATION_STARTERS.map((starter) => ({
          slug: starter.slug,
          title: starter.title,
          text: starter.text,
          tier: starter.tier,
          on: prefs[starter.slug] ?? starter.defaultOn,
          disabled: starter.tier !== 'free',
        }))}
        action={updateAutomationPrefsAction}
        saved={false}
      />
      </EHWorkflowStack>
    </WerkbankRahmen>
  );
}
