import '@/components/werkbank-layout.css';
import { EHLoadingState } from '@/design-system';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';

/** Ladezustand im Werkbank-Rahmen: Shell und Navigation bleiben sichtbar,
 *  nur die Mitte zeigt den Lade-Hinweis. */
export default function ProLoading() {
  return (
    <WerkbankRahmen role="provider" active="/pro">
      <EHLoadingState label="Partnerbereich wird geladen." />
    </WerkbankRahmen>
  );
}
