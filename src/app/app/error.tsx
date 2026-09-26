'use client';

import { WerkbankFehler } from '@/components/werkbank-zustand';

export default function HomeownerError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <WerkbankFehler
      title="Diese Ansicht konnte nicht geladen werden."
      text="Deine Daten wurden dadurch nicht verändert. Versuch die Ansicht noch einmal zu laden."
      retryLabel="Erneut versuchen"
      onRetry={reset}
      homeHref="/app"
      homeLabel="Zur Übersicht"
    />
  );
}
