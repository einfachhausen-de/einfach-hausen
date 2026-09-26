import { CalendarDays, ClipboardList, MessageCircle, PhoneCall, Wrench } from 'lucide-react';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import { WerkbankAbschnitt, WerkbankKennzahlen, WerkbankKopf, WerkbankRaster } from '@/components/werkbank-seite';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { dateLabel, euroExact, statusLabel } from '@/lib/format';
import { EHButton, EHCallout, EHRecordList, EHStatus, EHText, EHWorkflowStack, type EHRecordEntry } from '@/design-system';

const NEXT_STEPS: EHRecordEntry[] = [
  { id: 'request', title: 'Anliegen beschreiben', href: '/app/hausmeister', icon: <Wrench size={20} /> },
  { id: 'order', title: 'Aufträge ansehen', href: '/app/jobs', icon: <ClipboardList size={20} /> },
  { id: 'appointment', title: 'Termin nachsehen', href: '/app/calendar', icon: <CalendarDays size={20} /> },
  { id: 'contact', title: 'Nachricht suchen', href: '/app/messages', icon: <MessageCircle size={20} /> },
  { id: 'emergency', title: 'Notfall melden', href: '/app/emergency', icon: <PhoneCall size={20} /> },
];

type OpenJob = { id: number; title: string; status: string; created_at: string };
type OpenInvoice = { id: number; invoice_number: string; total_gross: number; due_date: string; business_name: string | null };

export default async function HilfePage() {
  const user = await requireUser('homeowner');

  // Die zwei Kennzahlen sind der ehrliche Stand: wo gerade etwas offen ist -
  // genau die Stellen, an denen Hilfe gebraucht wird.
  const openJobs = db.prepare(`SELECT id,title,status,created_at FROM jobs WHERE homeowner_id=? AND status IN ('open','quoted','accepted','in_progress') ORDER BY created_at DESC`).all(user.id) as OpenJob[];
  const openInvoices = db.prepare(`SELECT i.id,i.invoice_number,i.total_gross,i.due_date,p.business_name FROM invoices i JOIN jobs j ON j.id=i.job_id LEFT JOIN provider_profiles p ON p.user_id=i.provider_id WHERE i.homeowner_id=? AND i.status='sent' ORDER BY i.due_date`).all(user.id) as OpenInvoice[];
  const openTotal = openInvoices.reduce((sum, invoice) => sum + (Number.isFinite(invoice.total_gross) ? invoice.total_gross : 0), 0);

  const openJobItems: EHRecordEntry[] = openJobs.slice(0, 4).map(job => ({
    id: String(job.id),
    title: job.title,
    detail: 'Läuft gerade',
    date: String(job.created_at).slice(0, 10),
    dateLabel: dateLabel(job.created_at),
    status: <EHStatus tone={job.status === 'open' ? 'info' : 'success'}>{statusLabel(job.status)}</EHStatus>,
    href: `/app/jobs/${job.id}`,
  }));

  return (
    <WerkbankRahmen role="homeowner" active="/app/hilfe">
      <EHWorkflowStack>
      <WerkbankKopf title="Hilfe & Kontakt" context={openJobs.length > 0 ? `${openJobs.length} ${openJobs.length === 1 ? 'Auftrag' : 'Aufträge'} in Bearbeitung` : 'Alles erledigt'} />
      <WerkbankKennzahlen label="Dein Stand" items={[
        { id: 'auftraege', label: 'Offene Aufträge', value: String(openJobs.length), hint: 'laufende Aufträge' },
        { id: 'rechnungen', label: 'Offene Rechnungen', value: String(openInvoices.length), hint: openInvoices.length > 0 ? `${euroExact(openTotal)} offen` : 'nichts offen' },
      ]} />
      <WerkbankRaster main={<>
        <EHCallout title="Lebensgefahr, Brand oder Gasgeruch?">
          <p>Sofort <a href="tel:112">112</a> anrufen. Bei Gasgeruch: Fenster öffnen, keine Schalter betätigen, Gebäude verlassen. Einfach Hausen ersetzt keinen öffentlichen Notruf.</p>
        </EHCallout>
        <WerkbankAbschnitt title="Dein nächster Schritt">
          <EHRecordList label="Dein nächster Schritt" items={NEXT_STEPS} />
        </WerkbankAbschnitt>
      </>} aside={<>
        <WerkbankAbschnitt title="Deine offenen Aufträge">
          <EHRecordList label="Deine offenen Aufträge" items={openJobItems} empty="Zurzeit ist nichts offen. Neue Anliegen landen nach der Beschreibung hier." />
          <EHButton href="/app/jobs" variant="secondary" arrow>Alle Aufträge ansehen</EHButton>
        </WerkbankAbschnitt>
        <WerkbankAbschnitt title="Offene Rechnungen">
          {openInvoices.length === 0
            ? <EHText muted>Keine offene Rechnung. Bezahlte Belege liegen in den Dokumenten.</EHText>
            : <><EHText>{openInvoices.length} {openInvoices.length === 1 ? 'Rechnung' : 'Rechnungen'} · {euroExact(openTotal)} noch offen.</EHText><EHButton href="/app/documents" variant="secondary" arrow>Zu den Dokumenten</EHButton></>}
        </WerkbankAbschnitt>
      </>} />
      </EHWorkflowStack>
    </WerkbankRahmen>
  );
}
