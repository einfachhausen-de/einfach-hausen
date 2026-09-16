'use client';

import { useEffect } from 'react';

/**
 * T-0132: every error boundary reports exactly one PII-scrubbed event to the
 * error sink, so support can join a user report with the server log of the
 * request that produced it. The server applies the canonical redaction policy
 * before persistence.
 *
 * The correlation id is read from the `data-correlation-id` attribute the root
 * layout writes onto <html> from the proxy's response header. It is empty
 * wherever the proxy does not run (every marketing route) — that is expected,
 * not a bug.
 *
 * Boundaries MUST use this hook. A boundary that renders its own fallback
 * without it shadows the root boundary, and the error is then never recorded
 * at all. `scripts/t0132-error-tracking-regression.mjs` enforces that.
 */
export function useErrorReport(error: (Error & { digest?: string }) | undefined) {
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
}
