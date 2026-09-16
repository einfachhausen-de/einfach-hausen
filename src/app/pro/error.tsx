'use client';

import { AlertCircle } from 'lucide-react';

export default function ProError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="provider-error-page" role="alert">
      <div className="provider-state provider-state-error">
        <span className="provider-state-icon"><AlertCircle size={21} /></span>
        <div>
          <strong>Der Partnerbereich konnte nicht geladen werden.</strong>
          <p>Deine Daten wurden nicht verändert. Lade diese Ansicht erneut. Wenn das Problem bleibt, kannst du über den Support weiterarbeiten.</p>
          <button type="button" onClick={reset}>Ansicht erneut laden</button>
        </div>
      </div>
    </div>
  );
}
