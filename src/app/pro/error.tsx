'use client';

import { WerkbankFehler } from '@/components/werkbank-zustand';

export default function ProError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <WerkbankFehler
      title="Der Partnerbereich konnte nicht geladen werden."
      text="Deine Daten wurden nicht verändert. Lade diese Ansicht erneut. Wenn das Problem bleibt, kannst du über den Support weiterarbeiten."
      retryLabel="Ansicht erneut laden"
      onRetry={reset}
      homeHref="/pro"
      homeLabel="Zum Partnerbereich"
    />
  );
}
