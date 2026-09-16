import { CalendarClock, Settings, UserCheck } from 'lucide-react';
import { AppShell } from '@/components/shell';
import { requireUser } from '@/lib/auth';
import { EHPageHeader, EHRecordList, EHWorkSection, EHWorkflowStack, type EHRecordEntry } from '@/design-system';

/**
 * Die Bereiche, die auf dieser Seite nicht schon in der Seitenleiste oder in
 * den Tabs des Profil-Bereichs stehen. Alles andere wäre eine zweite
 * Beschriftung für dasselbe Ziel.
 */
const AREAS: EHRecordEntry[] = [
  { id: 'termine', title: 'Termine', icon: <CalendarClock size={20} />, href: '/pro/calendar' },
  { id: 'leads', title: 'Freigegebene Kontakte', icon: <UserCheck size={20} />, href: '/pro/leads' },
  { id: 'onboarding', title: 'Einrichtung', icon: <Settings size={20} />, href: '/pro/onboarding' },
];

export default async function ProHilfe() {
  await requireUser('provider');
  return (
    <AppShell role="provider" active="/pro/hilfe" title="Hilfe">
      <EHWorkflowStack>
        <EHPageHeader title="Hilfe" />
        <EHWorkSection title="Weitere Bereiche">
          <EHRecordList label="Weitere Bereiche" items={AREAS} />
        </EHWorkSection>
      </EHWorkflowStack>
    </AppShell>
  );
}
