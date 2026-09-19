import '@/components/werkbank-layout.css';
import { EHLoadingState } from '@/design-system';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';

/** Ladezustand im Werkbank-Rahmen: Shell und Navigation bleiben sichtbar,
 *  nur die Mitte zeigt den Lade-Hinweis. */
export default function HomeownerLoading() {
  return (
    <WerkbankRahmen role="homeowner" active="/app">
      <EHLoadingState label="Dein Bereich wird geladen." />
    </WerkbankRahmen>
  );
}
