import { randomBytes } from 'node:crypto';
import { cache } from 'react';
import { db } from './db';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { DEMO_LOGIN_ENABLED, DEMO_USERS, isDemoEmail } from './demo-accounts';

/**
 * Demo-Phase: binds the two fixed public demo identities to the current
 * verified Supabase subjects. An existing demo row may be rebound only when
 * its server-controlled role still matches the fixed demo role. Role/email or
 * subject collisions remain fail-closed.
 */
export function ensureDemoAppRow(email: string, authSubject: string): void {
  const demo = (Object.values(DEMO_USERS) as Array<{ email: string; role: string; firstName: string; lastName: string }>).find(
    (u) => u.email === email.trim().toLowerCase(),
  );
  if (!demo) return;
  const existing = db.prepare('SELECT id,role,auth_subject FROM users WHERE lower(email)=lower(?)').get(demo.email) as { id: number; role: string; auth_subject: string | null } | undefined;
  if (existing) {
    if (existing.role !== demo.role || existing.auth_subject === authSubject) return;
    db.prepare('UPDATE OR IGNORE users SET auth_subject=? WHERE id=? AND role=?').run(authSubject, existing.id, demo.role);
    return;
  }
  db.prepare(
    'INSERT OR IGNORE INTO users(email,password_hash,role,first_name,last_name,phone,auth_subject) VALUES(?,?,?,?,?,?,?)',
  ).run(demo.email, 'demo-supabase-only', demo.role, demo.firstName, demo.lastName, null, authSubject);
}

// Resolved once per call: the Supabase gateway is the production identity
// authority. Anonymous URL/key are public-by-design and safe to expose to the
// browser bundle; the service-role key never leaves the server.
export function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  const configured = Boolean(url && anon) && !url.includes('your-project.supabase.co');
  return { url, anon, configured };
}

// Server-side admin client for identity lifecycle operations (registration
// binding, account deletion). Returns null when unconfigured so callers fail
// closed instead of silently bypassing the identity authority.
export function supabaseAdmin() {
  const { url, configured } = supabaseConfig();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!configured || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
}

export type CurrentUser = {
  id: number; email: string; role: 'homeowner' | 'provider'; first_name: string; last_name: string; phone: string | null;
};

export type AuthMode = 'supabase' | 'local';
export function authMode(): AuthMode {
  const mode = process.env.AUTH_MODE || 'supabase';
  if (mode === 'local' && process.env.NODE_ENV === 'production') throw new Error('Local auth is disabled in production');
  return mode === 'local' ? 'local' : 'supabase';
}

const DEV_COOKIE = 'mh_session';
// __Host- requires Secure+Path=/+no Domain; valid only over HTTPS production.
const PROD_COOKIE = '__Host-mh_session';

function cookieName(): string {
  // Test seam: the production build serves E2E over http://127.0.0.1, where
  // Chromium rejects __Host- prefixed cookies. Production default stays __Host-.
  const override = process.env.SESSION_COOKIE_NAME;
  if (override) return override;
  return process.env.NODE_ENV === 'production' ? PROD_COOKIE : DEV_COOKIE;
}

// Exported for deterministic security regressions; mirrors createSession().
export function sessionCookiePolicy() {
  return {
    name: cookieName(),
    options: cookieOptions(new Date()),
  };
}

function cookieOptions(expires: Date) {
  // Vorschau-Umgebungen (Arena-/IDE-iframe) laden die Seite cross-site —
  // ein Lax-Cookie wird dort vom Browser verworfen, die App wirft trotz
  // erfolgreichem Login zurueck auf /login. Mit SESSION_COOKIE_SAMESITE=none (nur
  // ueber https sinnvoll) wird das Session-Cookie auf None+Secure gestellt;
  // Standard bleibt bewusst Lax, die Sicherheits-Tests pruefen diesen Pfad.
  const crossSite = process.env.SESSION_COOKIE_SAMESITE === 'none';
  // CHIPS ('partitioned') war hier zeitweise an — im Arena-Panel bewies der
  // leere Cookie-Jar direkt NACH Set-Cookie das Gegenteil: Chrome verwarf den
  // partitionierten Cookie in diesem Rahmen vollstaendig, das unpartitionierte
  // None+Secure funktionierte dagegen (Voll-Render /app/contracts, 122 ms).
  // Deshalb ist Partitioned jetzt Opt-in (SESSION_COOKIE_PARTITIONED=1) fuer
  // Browser, die ohne CHIPS blocken — Standard im None+Secure-Pfad.
  const partitioned = crossSite && process.env.SESSION_COOKIE_PARTITIONED === '1';
  return { httpOnly: true, sameSite: crossSite ? ('none' as const) : ('lax' as const), secure: crossSite || (process.env.NODE_ENV === 'production' && process.env.E2E_INSECURE_COOKIES !== '1'), ...(partitioned ? { partitioned: true } : {}), path: '/', expires };
}

// Lazily resolved so this module stays importable outside Next's request context.
async function jar(): Promise<{ get(k: string): { value: string } | undefined; getAll?: () => Array<{ name: string; value: string }>; set(k: string, v: any, o?: any): void; delete(k: string): void }> {
  const { cookies } = await import('next/headers');
  return await cookies() as any;
}
async function navigateTo(url: string): Promise<never> {
  const { redirect } = await import('next/navigation');
  redirect(url);
  throw new Error('unreachable');
}

// Session rotation: a user holds at most one active session; every new auth
// invalidates all previous tokens for that user. Invalidate+issue run in one
// transaction, and the UNIQUE(user_id) index enforces the invariant in SQL
// even across concurrent workers.
export function invalidateUserSessions(userId: number): void {
  db.prepare('DELETE FROM sessions WHERE user_id=?').run(userId);
}

export function pruneExpiredSessions(): void {
  db.prepare('DELETE FROM sessions WHERE expires_at<=?').run(new Date().toISOString());
}

export function issueSessionToken(userId: number): { token: string; expires: Date } {
  const token = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  db.prepare('INSERT INTO sessions(token,user_id,expires_at,issued_at) VALUES(?,?,?,?)')
    .run(token, userId, expires.toISOString(), new Date().toISOString());
  return { token, expires };
}

// Atomic rotation core: prune expired rows, invalidate prior sessions, and
// insert the new token inside a single IMMEDIATE transaction (deferred BEGIN
// lock upgrades lose writes under concurrent workers).
export function rotateAndIssueUserSession(userId: number): { token: string; expires: Date } {
  return db.transaction(() => {
    pruneExpiredSessions();
    invalidateUserSessions(userId);
    return issueSessionToken(userId);
  }).immediate();
}

// Best-effort expiry of pre-__Host- cookie names so upgraded clients stop
// carrying dead legacy cookies. __Host- names are only cleared when the
// secure flag can actually be sent (https or explicit E2E exception); a
// Secure-less Set-Cookie for a __Host- name is rejected by browsers and
// logs a console error on Firefox (T-0160 acceptance).
async function clearLegacyCookies(current: string): Promise<void> {
  const store = await jar();
  const secure = process.env.NODE_ENV === 'production' && process.env.E2E_INSECURE_COOKIES !== '1';
  const expired = cookieOptions(new Date(0));
  for (const name of [DEV_COOKIE, PROD_COOKIE]) {
    if (name === current) continue;
    if (name.startsWith('__Host-') && !secure) continue;
    try { store.set(name, '', expired); } catch {}
  }
}

export async function createSession(userId: number) {
  const { token, expires } = rotateAndIssueUserSession(userId);
  const name = cookieName();
  const store = await jar();
  store.set(name, token, cookieOptions(expires));
  await clearLegacyCookies(name);
}

export async function destroySession() {
  const store = await jar();
  const mode = authMode();

  if (mode === 'supabase') {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
    if (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project.supabase.co')) {
      const client = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        { cookies: { getAll: () => store.getAll ? store.getAll() : [], setAll: (items) => { for (const item of items) { try { store.set(item.name, item.value, item.options); } catch {} } } } }
      );
      const { error } = await client.auth.signOut();
      if (error) throw error;
    }

    // Defense in depth: make the browser stop presenting any chunk of the
    // Supabase SSR auth cookie even if its storage format changes or is chunked.
    for (const cookie of store.getAll ? store.getAll() : []) {
      if (cookie.name.startsWith('sb-') && cookie.name.includes('-auth-token')) {
        try { store.delete(cookie.name); } catch {}
      }
    }
  }

  const name = cookieName();
  const token = store.get(name)?.value;
  if (token) db.prepare('DELETE FROM sessions WHERE token=?').run(token);
  try { store.delete(name); } catch {}
  await clearLegacyCookies(name);
}

async function loadCurrentUser(): Promise<CurrentUser | null> {
  if (authMode() === 'local') return getLocalUser();
  const store = await jar();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project.supabase.co')) {
    console.error('[auth-debug] getCurrentUser null: supabase env missing at runtime');
    return null;
  }
  const client = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    { cookies: { getAll: () => store.getAll ? store.getAll() : [DEV_COOKIE, PROD_COOKIE].flatMap((name) => { const c = store.get(name); return c ? [{ name, value: c.value }] : []; }), setAll: (items) => { for (const item of items) { try { store.set(item.name, item.value, item.options); } catch {} } } } }
  );
  // The gateway (Kong/tunnel path) intermittently answers 502/503 under burst
  // load. A single transient rejection must never log a user out, so transient
  // failures are retried; hard auth failures stay fail-closed immediately.
  // Bounded hard: 3 attempts and at most ~0.75s of waiting (250ms + 500ms).
  // An auth outage must fail fast and visibly instead of stalling a whole
  // request for a minute (this loader runs on every app page render).
  const maxAttempts = 3;
  const maxTotalBackoffMs = 2000;
  let waitedMs = 0;
  let identity: any = null;
  let lastError: { message?: string; status?: number } | null = null;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { data, error } = await client.auth.getUser();
    if (!error && data.user) { identity = data.user; break; }
    lastError = error as any;
    const status = (error as any)?.status;
    const transient = !status || status === 408 || status === 429 || status >= 500 || /fetch failed|bad gateway|gateway time-?out|network/i.test(String(error?.message ?? ''));
    if (!transient) break;
    const remainingMs = maxTotalBackoffMs - waitedMs;
    if (attempt === maxAttempts - 1 || remainingMs <= 0) break;
    const delay = Math.min(250 * 2 ** attempt, remainingMs);
    waitedMs += delay;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  if (!identity) {
    // Quantify WHY an authenticated request was rejected (missing cookie vs
    // gateway error) without logging any token material.
    const cookieNames = store.getAll ? store.getAll().map((c) => c.name) : [];
    console.error('[auth-debug] getCurrentUser rejected:', lastError?.message ?? 'no identity', '| cookies:', JSON.stringify(cookieNames));
    return null;
  }
  // Roles are application authority, never mutable Supabase user_metadata.
  // A verified subject must map to an existing server-controlled application row.
  let row = db.prepare('SELECT id,email,role,first_name,last_name,phone FROM users WHERE auth_subject=?').get(identity.id) as CurrentUser | undefined;
  // Demo-Phase: Demo-Identitaeten bekommen ihre App-Zeile beim ersten Login
  // automatisch (feste Rollen, keine freien Registrierungen). Danach laeuft
  // die normale Bindung; Rollenkonflikte fallen weiterhin fail-closed.
  if (!row && DEMO_LOGIN_ENABLED && isDemoEmail(identity.email || '')) {
    ensureDemoAppRow(identity.email || '', identity.id);
    row = db.prepare('SELECT id,email,role,first_name,last_name,phone FROM users WHERE auth_subject=?').get(identity.id) as CurrentUser | undefined;
  }
  if (!row) console.error('[auth-debug] no app row for subject:', identity.id, '| email-match fallback next');
  // One-time, explicit migration bridge: email is only used to bind an existing
  // application account to the verified Supabase subject. Future requests require auth_subject.
  if (!row) {
    // Email is a one-time migration key only. It must identify exactly one
    // existing account; mismatched roles and collisions fail closed.
    const matches = db.prepare('SELECT id,email,role,first_name,last_name,phone,auth_subject FROM users WHERE lower(email)=lower(?)').all(identity.email || '') as Array<CurrentUser & { auth_subject: string | null }>;
    if (matches.length !== 1 || matches[0].auth_subject !== null) {
      console.error('[auth-debug] email-match bind rejected:', JSON.stringify({ matches: matches.length, existing_subject: matches[0]?.auth_subject ?? null }));
      return null;
    }
    const candidate = matches[0];
    const updated = db.prepare('UPDATE users SET auth_subject=? WHERE id=? AND auth_subject IS NULL').run(identity.id, candidate.id);
    if (updated.changes !== 1) return null;
    row = db.prepare('SELECT id,email,role,first_name,last_name,phone FROM users WHERE auth_subject=?').get(identity.id) as CurrentUser | undefined;
  }
  if (!row) { console.error('[auth-debug] getCurrentUser null: no app row after bind attempt'); return null; }
  return row || null;
}

// Request-scoped memoization (React `cache`): a page render resolves the
// identity several times (requireUser() plus AppShell), and every call used to
// re-run the Supabase getUser() round trip — under a gateway outage that was
// minutes of retries per request and the page never flushed. `cache()` keys on
// the request, so the loader body runs exactly once per request; outside a
// request scope it degrades to a plain call, keeping non-React callers working.
// Signature is unchanged: () => Promise<CurrentUser | null>.
export const getCurrentUser = cache(loadCurrentUser);

async function getLocalUser(): Promise<CurrentUser | null> {
  // Must read the same cookie name createSession() writes (respects the
  // SESSION_COOKIE_NAME test seam); a hardcoded DEV_COOKIE silently logged
  // local-mode users out whenever the override was active.
  const name = cookieName();
  const store = await jar(); const token = store.get(name)?.value;
  if (!token) return null;
  const row = db.prepare(`SELECT u.id,u.email,u.role,u.first_name,u.last_name,u.phone FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires_at > ?`).get(token, new Date().toISOString()) as CurrentUser | undefined;
  if (!row) { db.prepare('DELETE FROM sessions WHERE token=?').run(token); try { store.delete(name); } catch {} return null; }
  return row;
}

export async function requireUser(role?: CurrentUser['role']) {
  const user = await getCurrentUser();
  if (!user) await navigateTo('/login');
  if (role && user!.role !== role) await navigateTo(user!.role === 'provider' ? '/pro' : '/app');
  return user!;
}

// Establish a real Supabase SSR session for a user who just registered via the
// server action. The browser never sees the credentials; the server signs in
// with the freshly created identity and persists the sb-* cookies so the
// middleware gate and getCurrentUser() accept the request immediately.
export async function establishSupabaseSession(email: string, password: string): Promise<boolean> {
  const { url, anon, configured } = supabaseConfig();
  if (!configured) return false;
  const store = await jar();
  const client = createServerClient(url, anon, {
    cookies: {
      getAll: () => (store.getAll ? store.getAll() : []),
      setAll: (items) => { for (const item of items) { try { store.set(item.name, item.value, item.options); } catch {} } },
    },
  });
  // GoTrue's /token endpoint can answer transiently - cold start, short-lived
  // rate limiting, a dropped keep-alive socket. A single failure used to make
  // registerAction() redirect a brand new account to
  // /login?notice=Konto%20erstellt, which the browser matrix reported as
  // "registration never reached /pro" (scripts/e2e.mjs:331). The account is
  // already created at this point, so retry briefly before giving up, and log
  // the real reason instead of collapsing it into a bare boolean.
  const attempts = 3;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    if (attempt > 1) await new Promise((resolve) => setTimeout(resolve, 200 * attempt));
    try {
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (!error) return true;
      if (attempt === attempts) console.error('[auth] establishSupabaseSession failed:', error.message);
    } catch (error) {
      if (attempt === attempts) console.error('[auth] establishSupabaseSession threw:', error instanceof Error ? error.message : String(error));
    }
  }
  return false;
}
