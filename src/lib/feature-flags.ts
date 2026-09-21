// T-0125 minimal typed feature-flag service: server-authoritative evaluation,
// environment/default safety, bounded rollout targeting, audit trail.
//
// Design contract (T-0125 acceptance):
// - Server-authoritative: evaluation only reads DB state; no client input can
//   flip a flag. Writes go exclusively through setFeatureEnabled, which is
//   reachable only from the admin ops surface behind requireAdmin().
// - Environment/default safety: FLAG_DEFAULTS define the known flag universe.
//   Unknown keys evaluate to their default (fail-safe false) and are never
//   creatable ad hoc; in production the default wins over any DB value unless
//   the flag is explicitly marked production-toggleable.
// - Bounded rollout targeting: a flag may carry a rollout percent (0-100); a
//   subject (stable pseudonymous id) is included via a deterministic hash, so
//   evaluation is stable per subject and never random per request.
// - Audit trail: every write appends to admin_audit_log with actor and detail.
// - Flags never bypass authorization: they only gate behavior that is already
//   authorization-checked elsewhere.
import { createHash } from 'node:crypto';
import { db } from './db';
import { logAdminAudit } from './security/audit';

export type FlagDefinition = {
  /** Safe default when the flag is unknown to the DB or the whole service. */
  default: boolean;
  /** Whether this flag may be turned on in production at all. */
  productionToggleable: boolean;
  /** Human-readable purpose, kept in one place. */
  description: string;
  /** Accountable owner (role from docs/COMPANY_IDENTITY.md, not a person alias). */
  owner: 'engineering' | 'operations' | 'product';
  /** Lifecycle gate (T-0139): the flag must be removed or re-dated by this date. */
  expiresAt: string;
};

/**
 * Known flag universe. Adding a flag = adding a definition here.
 * ki_chat: gates the AI assistant surface (default off; DB may enable).
 * Lifecycle: scripts/feature-flag-lifecycle.mjs (release gate Layer 1) fails
 * when a flag lacks owner/expiry, its expiry passed while enabled, or the DB
 * carries rows for a flag that is no longer defined. Removal after rollout is
 * part of the release process (docs/OPERATIONS.md, "Feature-Flag lifecycle").
 */
export const FLAG_DEFAULTS: Record<string, FlagDefinition> = {
  ki_chat: { default: false, productionToggleable: true, description: 'KI-Assistent Chat-Fläche', owner: 'product', expiresAt: '2026-12-31' },
};

export type FlagDecision = {
  key: string;
  enabled: boolean;
  /** 'default' when no DB row exists, 'database' when a row decided, 'rollout' when percent targeting decided. */
  source: 'default' | 'database' | 'rollout';
};

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production' && process.env.E2E_INSECURE_COOKIES !== '1';
}

/** Deterministic 0-99 bucket for stable percent rollout targeting. */
function subjectBucket(subject: string): number {
  const digest = createHash('sha256').update(`eh-flag:${subject}`).digest();
  return digest[0] % 100;
}

export function isFeatureEnabled(key: string, subject?: string): boolean {
  return evaluateFlag(key, subject).enabled;
}

export function evaluateFlag(key: string, subject?: string): FlagDecision {
  try {
    const definition = FLAG_DEFAULTS[key];
    if (!definition) return { key, enabled: false, source: 'default' };

    const row = db.prepare('SELECT enabled,rollout_percent FROM feature_flags WHERE key=?').get(key) as
      | { enabled: number; rollout_percent: number | null }
      | undefined;

    // Environment safety: in production a non-toggleable flag always evaluates
    // to its hardcoded default, regardless of DB state.
    if (isProduction() && !definition.productionToggleable) {
      return { key, enabled: definition.default, source: 'default' };
    }

    if (!row) return { key, enabled: definition.default, source: 'default' };

    const baseEnabled = Boolean(row.enabled);
    if (!baseEnabled) return { key, enabled: false, source: 'database' };

    // Bounded rollout: percent 0-100; missing/null = 100 (fully rolled out).
    const percent = row.rollout_percent;
    if (percent === null || percent === undefined || percent >= 100) {
      return { key, enabled: true, source: 'database' };
    }
    if (percent <= 0) return { key, enabled: false, source: 'rollout' };
    if (subject === undefined || subject === '') {
      // No targeting identity available: fail safe to disabled for partial rollout.
      return { key, enabled: false, source: 'rollout' };
    }
    const enabled = subjectBucket(subject) < percent;
    return { key, enabled, source: 'rollout' };
  } catch {
    // Fail safe: any storage error means off.
    return { key, enabled: false, source: 'default' };
  }
}

export function setFeatureEnabled(
  key: string,
  enabled: boolean,
  updatedBy: string,
  options: { rolloutPercent?: number } = {},
): void {
  const definition = FLAG_DEFAULTS[key];
  if (!definition) throw new Error(`unknown flag key: ${key}`);
  if (isProduction() && !definition.productionToggleable) {
    throw new Error(`flag ${key} is not production-toggleable`);
  }
  const rolloutPercent: number | null = options.rolloutPercent ?? null;
  if (rolloutPercent !== null) {
    if (!Number.isSafeInteger(rolloutPercent) || rolloutPercent < 0 || rolloutPercent > 100) {
      throw new Error('rolloutPercent must be an integer 0-100');
    }
  }
  const previous = db.prepare('SELECT enabled FROM feature_flags WHERE key=?').get(key) as { enabled: number } | undefined;
  db.prepare(`INSERT INTO feature_flags(key,enabled,rollout_percent,updated_by,updated_at) VALUES(?,?,?,?,CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET enabled=excluded.enabled, rollout_percent=excluded.rollout_percent, updated_by=excluded.updated_by, updated_at=CURRENT_TIMESTAMP`)
    .run(key, enabled ? 1 : 0, rolloutPercent, updatedBy);
  // Audit trail: append-only record of who changed what (never the flag value
  // alone - the transition direction matters for incident forensics).
  logAdminAudit(
    updatedBy,
    'feature-flag',
    key,
    `transition ${previous ? (previous.enabled ? 'on' : 'off') : 'unset'} -> ${enabled ? 'on' : 'off'}${rolloutPercent !== null ? ` rollout=${rolloutPercent}%` : ''}`,
  );
}
