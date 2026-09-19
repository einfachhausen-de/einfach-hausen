import { CalendarDays, FileText, MessageSquare } from 'lucide-react';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import {
  EHFormFeedback,
  EHManagerAttention,
  EHManagerAutomations,
  EHMetricsBar,
  EHPageHeader,
  EHRecordList,
  EHWorkSection,
  EHWorkflowStack,
  type EHRecordEntry,
} from '@/design-system';
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

  const threads = db
    .prepare(
      `SELECT t.id, t.updated_at,
        (SELECT COUNT(*) FROM assistant_messages m WHERE m.thread_id = t.id) message_count
      FROM assistant_threads t
      WHERE t.user_id = ? AND t.channel = 'app'
      ORDER BY t.updated_at DESC LIMIT 3`,
    )
    .all(user.id) as { id: number; updated_at: string; message_count: number }[];

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
  const attention = [
    ...dueMaintenance.map((task) => `${task.title} (${dateLabel(task.due_date)})`),
    ...quotedJobs.map((job) => `${job.title}: ${job.quote_count} ${job.quote_count === 1 ? 'Angebot' : 'Angebote'} prüfen`),
  ];
  const threadItems: EHRecordEntry[] = threads.map((thread) => ({
    id: String(thread.id),
    title: `Gespräch vom ${dateLabel(thread.updated_at)}`,
    detail: `${thread.message_count} ${thread.message_count === 1 ? 'Nachricht' : 'Nachrichten'}`,
    href: '/app/hausmeister',
    icon: <MessageSquare aria-hidden="true" size={20} />,
  }));
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
      <EHPageHeader title="Hausmanager" context={houseLabel || undefined} />

      <EHManagerAttention items={attention} actionHref="/app/hausmeister" actionLabel="Ansehen" />

      {sp.prefs === 'saved' && (
        <EHFormFeedback kind="success">Automatisierungen gespeichert.</EHFormFeedback>
      )}

      <EHMetricsBar label="Hausmanager" items={[
        {id:'gespraeche',label:'Letzte Gespräche',value:threads.length},
        {id:'wartung',label:'Wartungen fällig',value:dueMaintenance.length},
        {id:'angebote',label:'Angebote zu prüfen',value:quotedJobs.length},
      ]} />

      <EHWorkSection title="Anstehende Aufgaben">
        <EHRecordList label="Anstehende Aufgaben" items={taskItems} empty="Aktuell nichts fällig. Neue Aufgaben erscheinen hier automatisch." />
      </EHWorkSection>

      <EHWorkSection title="Letzte Gespräche">
        <EHRecordList label="Letzte Gespräche" items={threadItems} empty="Noch keine Gespräche. Starte unten beim Hausmeister." />
      </EHWorkSection>

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
