import { CalendarDays, ClipboardList, MessageCircle, Wrench } from 'lucide-react';
import { AppShell } from '@/components/shell';
import { crumbs } from '@/components/nav-config';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { dateLabel, euroExact, statusLabel } from '@/lib/format';
import { EHButton, EHCallout, EHMetricsBar, EHPageHeader, EHRecordList, EHStatus, EHText, EHWorkSection, EHWorkflowStack, EHWorkspaceGrid, type EHRecordEntry } from '@/design-system';

const NEXT_STEPS: EHRecordEntry[] = [
  { id: 'request', title: 'Anliegen beschreiben', href: '/app/hausmeister', icon: <Wrench size={20} /> },
  { id: 'order', title: 'Auftrag prüfen', href: '/app/jobs', icon: <ClipboardList size={20} /> },
  { id: 'appointment', title: 'Termin nachsehen', href: '/app/calendar', icon: <CalendarDays size={20} /> },
  { id: 'contact', title: 'Absprache wiederfinden', href: '/app/messages', icon: <MessageCircle size={20} /> },
];

type OpenJob = { id: number; title: string; status: string; created_at: string };
type OpenInvoice = { id: number; invoice_number: string; total_gross: number; due_date: string; business_name: string | null };

export default async function HilfePage() {
  const user = await requireUser('homeowner');

  // Die vier Kennzahlen sind der ehrliche Stand des Kontos: sie zeigen, wo
  // gerade etwas offen ist - genau die Stellen, an denen Hilfe gebraucht wird.
  const openJobs = db.prepare(`SELECT id,title,status,created_at FROM jobs WHERE homeowner_id=? AND status IN ('open','quoted','accepted','in_progress') ORDER BY created_at DESC`).all(user.id) as OpenJob[];
  const upcomingAppointments = (db.prepare(`SELECT COUNT(*) c FROM appointments WHERE homeowner_id=? AND status!='cancelled' AND datetime(start_at)>=datetime('now')`).get(user.id) as { c: number }).c;
  const unreadMessages = (db.prepare('SELECT COUNT(*) c FROM messages WHERE recipient_id=? AND read_at IS NULL').get(user.id) as { c: number }).c;
  const openInvoices = db.prepare(`SELECT i.id,i.invoice_number,i.total_gross,i.due_date,p.business_name FROM invoices i JOIN jobs j ON j.id=i.job_id LEFT JOIN provider_profiles p ON p.user_id=i.provider_id WHERE i.homeowner_id=? AND i.status='sent' ORDER BY i.due_date`).all(user.id) as OpenInvoice[];
  const openTotal = openInvoices.reduce((sum, invoice) => sum + (Number.isFinite(invoice.total_gross) ? invoice.total_gross : 0), 0);

  const openJobItems: EHRecordEntry[] = openJobs.slice(0, 4).map(job => ({
    id: String(job.id),
    title: job.title,
    detail: 'Laufender Vorgang',
    date: String(job.created_at).slice(0, 10),
    dateLabel: dateLabel(job.created_at),
    status: <EHStatus tone={job.status === 'open' ? 'info' : 'success'}>{statusLabel(job.status)}</EHStatus>,
    href: `/app/jobs/${job.id}`,
  }));

  return (
    <AppShell role="homeowner" active="/app/more" title="Hilfe" breadcrumbs={crumbs(null,'Hilfe & Kontakt')}>
      <EHWorkflowStack>
      <EHPageHeader title="Hilfe & Kontakt" context={openJobs.length > 0 ? `${openJobs.length} ${openJobs.length === 1 ? 'Vorgang' : 'Vorgänge'} in Bearbeitung` : 'Alles abgeschlossen'} />
      <EHMetricsBar label="Dein Stand" items={[
        { id: 'auftraege', label: 'Offene Aufträge', value: String(openJobs.length), hint: 'laufende Vorgänge' },
        { id: 'termine', label: 'Anstehende Termine', value: String(upcomingAppointments), hint: 'vereinbart' },
        { id: 'nachrichten', label: 'Ungelesen', value: String(unreadMessages), hint: 'Nachrichten in Absprachen' },
        { id: 'rechnungen', label: 'Offene Rechnungen', value: String(openInvoices.length), hint: openInvoices.length > 0 ? `${euroExact(openTotal)} offen` : 'nichts offen' },
      ]} />
      <EHWorkspaceGrid main={<>
        <EHCallout title="Lebensgefahr, Brand oder Gasgeruch?">
          <p>Sofort <a href="tel:112">112</a> anrufen. Bei Gasgeruch: Fenster öffnen, keine Schalter betätigen, Gebäude verlassen. Einfach Hausen ersetzt keinen öffentlichen Notruf.</p>
        </EHCallout>
        <EHWorkSection title="Dein nächster Schritt">
          <EHRecordList label="Dein nächster Schritt" items={NEXT_STEPS} />
        </EHWorkSection>
      </>} aside={<>
        <EHWorkSection title="Deine offenen Vorgänge">
          <EHRecordList label="Deine offenen Vorgänge" items={openJobItems} empty="Zurzeit ist nichts offen. Neue Anliegen landen nach der Beschreibung hier." />
          <EHButton href="/app/jobs" variant="secondary" arrow>Alle Aufträge ansehen</EHButton>
        </EHWorkSection>
        <EHWorkSection title="Offene Rechnungen">
          <EHRecordList label="Offene Rechnungen" empty="Keine offene Rechnung. Bezahlte Belege liegen in den Dokumenten." items={openInvoices.map(invoice => ({
            id: String(invoice.id),
            title: `Rechnung ${invoice.invoice_number}`,
            detail: [invoice.business_name, `fällig ${dateLabel(invoice.due_date)}`].filter(Boolean).join(' · '),
            value: euroExact(invoice.total_gross),
            date: String(invoice.due_date).slice(0, 10),
            dateLabel: dateLabel(invoice.due_date),
            status: <EHStatus tone="warning">Offen</EHStatus>,
            href: `/app/invoices/${invoice.id}`,
          }))} />
          {openInvoices.length > 0 && <EHText muted>{openInvoices.length} {openInvoices.length === 1 ? 'Rechnung' : 'Rechnungen'} · {euroExact(openTotal)} noch offen.</EHText>}
        </EHWorkSection>
        <EHWorkSection title="Im Notfall">
          <EHText muted>Bei Lebensgefahr, Brand oder Gasgeruch gilt allein der öffentliche Notruf 112. Für dringende, aber nicht lebensgefährliche Schäden melde den Notfall in der App.</EHText>
          <EHButton href="/app/emergency" variant="secondary" arrow>Notfall melden</EHButton>
        </EHWorkSection>
      </>} />
      </EHWorkflowStack>
    </AppShell>
  );
}
