import '@/components/werkbank-layout.css';
import { EHLoadingState } from '@/design-system';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import { getCurrentUser } from '@/lib/auth';

/** Ladezustand im Werkbank-Rahmen: Shell und Navigation bleiben sichtbar,
 *  nur die Mitte zeigt den Lade-Hinweis (wie /app/loading.tsx). Ohne diese
 *  Grenze faellt die Navigation auf die Root-Ladeansicht ohne Shell zurueck
 *  und fuehlt sich wie ein kompletter Seiten-Reload an. */
export default async function NotificationsLoading() {
  const user = await getCurrentUser();
  const role = user?.role === 'provider' ? 'provider' : 'homeowner';
  return (
    <WerkbankRahmen role={role} active="/notifications">
      <EHLoadingState label="Deine Mitteilungen werden geladen." />
    </WerkbankRahmen>
  );
}
