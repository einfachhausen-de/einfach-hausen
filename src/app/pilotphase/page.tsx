import { redirect } from 'next/navigation';

// Die Pilotphase mit 15-%-Dauer-Vorteil auf kostenpflichtige Pakete gibt es
// nicht mehr: Eigentuemer nutzen einfachhausen kostenlos (Issue #132). Ein
// oeffentliches Versprechen eines Paketrabatts waere jetzt unwahr, deshalb
// bleibt die Route nur als Ziel alter Links erhalten und fuehrt auf /preise.
export default function PilotphasePage() {
  redirect('/preise');
}
