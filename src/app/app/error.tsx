'use client';

import { useEffect, useRef } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default function HomeownerError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const stateRef = useRef<HTMLElement>(null);

  useEffect(() => {
    stateRef.current?.focus();
  }, []);

  return (
    <main
      ref={stateRef}
      className="owner-route-state"
      role="alert"
      aria-labelledby="owner-error-title"
      tabIndex={-1}
    >
      <div className="owner-state-icon"><AlertCircle aria-hidden="true" /></div>
      <span className="owner-state-kicker">Das hat nicht geklappt</span>
      <h1 id="owner-error-title">Diese Ansicht konnte nicht geladen werden.</h1>
      <p>Deine Daten wurden dadurch nicht verändert. Versuch die Ansicht noch einmal zu laden.</p>
      <button className="owner-state-action" type="button" onClick={reset}>
        <RotateCcw aria-hidden="true" /> Erneut versuchen
      </button>
    </main>
  );
}
