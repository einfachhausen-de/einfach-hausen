import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { db } from './db';
import { DEMO_LOGIN_ENABLED, DEMO_PASSWORD } from './demo-accounts';

const DEV_COOKIE = 'mh_admin_session';
const PROD_COOKIE = '__Host-mh_admin_session';

function cookieName(): string {
  // Test seam: E2E serves the production build over http://127.0.0.1 where
  // Chromium rejects __Host- prefixed cookies. Production default stays __Host-.
  const override = process.env.SESSION_COOKIE_NAME;
  if (override) return override.startsWith('__Host-') ? override : `${override}_admin`;
  return process.env.NODE_ENV === 'production' ? PROD_COOKIE : DEV_COOKIE;
}

// Exported for deterministic security regressions; mirrors createAdminSession().
export function adminCookiePolicy() {
  return {
    name: cookieName(),
    options: { httpOnly: true, sameSite: 'strict' as const, secure: process.env.NODE_ENV === 'production' && process.env.E2E_INSECURE_COOKIES !== '1', path: '/', expires: new Date() },
  };
}

function sha256(value: string): Buffer {
  return createHash('sha256').update(value, 'utf8').digest();
}

// Constant-shape comparison: both sides are hashed to fixed 32-byte digests
// before timingSafeEqual, so timing never leaks input or secret length.
export function adminPasswordMatches(input: string): boolean {
  // Demo-Phase (befristet): CRM-Login mit dem Demo-Passwort nur bei explizitem
  // Opt-in (DEMO_LOGIN_ENABLED=1 + DEMO_PASSWORD gesetzt). Ohne Flag fail-closed.
  if (DEMO_LOGIN_ENABLED && DEMO_PASSWORD.length > 0 && input === DEMO_PASSWORD) return true;
  const expected = process.env.ADMIN_PASSWORD || '';
  const match = timingSafeEqual(sha256(input), sha256(expected));
  return expected.length >= 12 && match;
}

async function jar(): Promise<{ get(k: string): { value: string } | undefined; set(k: string, v: any, o?: any): void; delete(k: string): void }> {
  const { cookies } = await import('next/headers');
  return await cookies() as any;
}
async function navigateTo(url: string): Promise<never> {
  const { redirect } = await import('next/navigation');
  redirect(url);
  throw new Error('unreachable');
}

export function pruneExpiredAdminSessions(): void {
  db.prepare('DELETE FROM admin_sessions WHERE expires_at<=?').run(new Date().toISOString());
}

// Rotation: at most one live admin session; every new login invalidates the rest.
export function rotateAdminSessions(): void {
  db.prepare('DELETE FROM admin_sessions').run();
}

export function issueAdminSessionToken(): { token: string; expires: Date } {
  const token = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 12);
  db.prepare('INSERT INTO admin_sessions(token,expires_at,issued_at) VALUES(?,?,?)')
    .run(token, expires.toISOString(), new Date().toISOString());
  return { token, expires };
}

// Atomic rotation core: at most one live admin session exists because the
// DELETE+INSERT pair is a single IMMEDIATE transaction AND the single-row
// unique index (idx_admin_sessions_single) enforces the invariant in SQL.
export function rotateAndIssueAdminSession(): { token: string; expires: Date } {
  return db.transaction(() => {
    pruneExpiredAdminSessions();
    rotateAdminSessions();
    return issueAdminSessionToken();
  }).immediate();
}

// __Host- cookies must never be sent without Secure over http; skip them when
// the runtime cannot emit a valid __Host- attribute set (Firefox logs a console
// error for rejected prefixes, which fails the browser acceptance matrix).
async function clearLegacyCookies(current: string): Promise<void> {
  const store = await jar();
  const secure = process.env.NODE_ENV === 'production' && process.env.E2E_INSECURE_COOKIES !== '1';
  const expired = { httpOnly: true, sameSite: 'strict' as const, secure, path: '/', expires: new Date(0) };
  for (const name of [DEV_COOKIE, PROD_COOKIE]) {
    if (name === current) continue;
    if (name.startsWith('__Host-') && !secure) continue;
    try { store.set(name, '', expired); } catch {}
  }
}

export async function createAdminSession() {
  const { token, expires } = rotateAndIssueAdminSession();
  const name = cookieName();
  const store = await jar();
  store.set(name, token, { httpOnly: true, sameSite: 'strict' as const, secure: process.env.NODE_ENV === 'production' && process.env.E2E_INSECURE_COOKIES !== '1', path: '/', expires });
  await clearLegacyCookies(name);
}

export async function destroyAdminSession() {
  const store = await jar(); const name = cookieName(); const token = store.get(name)?.value;
  if (token) db.prepare('DELETE FROM admin_sessions WHERE token=?').run(token);
  try { store.delete(name); } catch {}
  await clearLegacyCookies(name);
}

export async function isAdmin() {
  const store = await jar(); const name = cookieName(); const token = store.get(name)?.value; if (!token) return false;
  const row = db.prepare('SELECT token FROM admin_sessions WHERE token=? AND expires_at>?').get(token, new Date().toISOString());
  if (!row) {
    db.prepare('DELETE FROM admin_sessions WHERE token=?').run(token);
    try { store.delete(name); } catch {}
    return false;
  }
  return true;
}

export async function requireAdmin() { if (!(await isAdmin())) await navigateTo('/admin/login'); }
