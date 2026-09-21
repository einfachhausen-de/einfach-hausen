import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';

// Hauseigentuemer nutzen einfachhausen kostenlos. Es gibt keine
// Eigentuemer-Mitgliedschaft und keine kostenpflichtigen Einzelpakete mehr,
// deshalb auch keine Tarif-, Upgrade- oder Wechsel-Oberflaeche. Die Route
// bleibt als Ziel alter Links und Lesezeichen erhalten und fuehrt in die
// Einstellungen; die Datenbanktabellen bleiben fuer die Nachvollziehbarkeit
// historischer Zahlungen bestehen.
export default async function PlansIndex() {
  await requireUser('homeowner');
  redirect('/app/settings');
}
