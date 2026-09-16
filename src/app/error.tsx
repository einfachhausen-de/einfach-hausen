'use client';

import Link from 'next/link';
import { CircleAlert, RotateCcw } from 'lucide-react';
import { PublicState, stateStyles as styles } from '@/components/marketing/public-state';
import { useErrorReport } from '@/components/error-reporting';

// T-0132 error tracking: every boundary hit reports a structured, PII-scrubbed
// error line to the dedicated error sink with the request correlation id (set by
// proxy as response header) so support can join it with server logs. The shared
// hook is also used by the /app and /pro boundaries, which shadow this one.
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useErrorReport(error);

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
