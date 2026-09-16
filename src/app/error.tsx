'use client';

import Link from 'next/link';
import { CircleAlert, RotateCcw } from 'lucide-react';
import { PublicState, stateStyles as styles } from '@/components/marketing/public-state';
import { useEffect } from 'react';

// T-0132 error tracking hook: every boundary hit reports a structured,
// PII-scrubbed error line to the dedicated error sink with the request correlation
// id (set by proxy as response header) so support can join it with server
// logs. The server applies the canonical redaction policy before persistence.
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    try {
      const correlationId =
        typeof document !== 'undefined'
          ? document.documentElement.getAttribute('data-correlation-id') || undefined
          : undefined;
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          source: 'client',
          error_class: 'internal',
          digest: error?.digest ?? '',
          message: String(error?.message ?? 'unknown').slice(0, 160),
          path: typeof window !== 'undefined' ? window.location.pathname : '',
          correlation_id: correlationId ?? '',
        }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // Error reporting must never throw from the boundary.
    }
  }, [error]);

  return (
    <PublicState
      role="alert"
      icon={<CircleAlert size={22} />}
      title="Das hat gerade nicht geklappt."
      text="Deine Eingaben werden nicht automatisch als Auftrag übernommen. Versuch die Seite noch einmal oder geh zurück zur Startseite."
    >
      <div className={styles.stateActions}>
        <button type="button" className={styles.btnPrimary} onClick={reset}><RotateCcw size={16} aria-hidden="true" /> Erneut versuchen</button>
        <Link className={styles.btnGhost} href="/">Zur Startseite</Link>
      </div>
    </PublicState>
  );
}
