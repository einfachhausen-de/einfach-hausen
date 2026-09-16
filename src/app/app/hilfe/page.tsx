import { CalendarDays, ClipboardList, MessageCircle, Wrench } from 'lucide-react';
import { AppShell } from '@/components/shell';
import { crumbs } from '@/components/nav-config';
import { requireUser } from '@/lib/auth';
import { EHPageHeader, EHRecordList, EHWorkSection, type EHRecordEntry } from '@/design-system';

const NEXT_STEPS: EHRecordEntry[] = [
  { id: 'request', title: 'Anliegen beschreiben', href: '/app/hausmeister', icon: <Wrench size={20} /> },
  { id: 'order', title: 'Auftrag prüfen', href: '/app/jobs', icon: <ClipboardList size={20} /> },
  { id: 'appointment', title: 'Termin nachsehen', href: '/app/calendar', icon: <CalendarDays size={20} /> },
  { id: 'contact', title: 'Absprache wiederfinden', href: '/app/messages', icon: <MessageCircle size={20} /> },
];

export default async function HilfePage() {
  await requireUser('homeowner');

  return (
    <AppShell role="homeowner" active="/app/more" title="Hilfe" breadcrumbs={crumbs(null,'Hilfe & Kontakt')}>
      <EHPageHeader title="Hilfe & Kontakt" />
      <div className="alert emergency-112" role="alert">
        <strong>Lebensgefahr, Brand oder Gasgeruch?</strong>
        <span>Sofort <a href="tel:112">112</a> anrufen. Bei Gasgeruch: Fenster öffnen, keine Schalter betätigen, Gebäude verlassen. Einfach Hausen ersetzt keinen öffentlichen Notruf.</span>
      </div>
      <EHWorkSection title="Dein nächster Schritt">
        <EHRecordList label="Dein nächster Schritt" items={NEXT_STEPS} />
      </EHWorkSection>
    </AppShell>
  );
}
