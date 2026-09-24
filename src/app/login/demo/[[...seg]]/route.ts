import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { DEMO_LOGIN_ENABLED, DEMO_USERS } from '@/lib/demo-accounts';
import { authMode, createSession } from '@/lib/auth';
import { ensureLocalDemoAccounts } from '@/lib/ensure-local-demo-accounts';
import { db } from '@/lib/db';
import { safeNextPath } from '@/lib/safe-redirect';

export const runtime = 'nodejs';

/**
 * /login/demo — Demo-Einstieg OHNE Query-Parameter (ein einziger Sprung,
 * kein ?demo=1 noetig — Vorschau-Adressleisten reichen oft nur Pfade).
 * Route Handler, weil nur dort Cookie-Setzung erlaubt ist. Gleiche
 * Kill-Switches wie /api/auth/demo-start: DEMO_LOGIN_ENABLED=1 +
 * DEMO_PASSWORD gesetzt + AUTH_MODE=local; sonst 404.
 * /login/demo/handwerker -> /pro.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ seg?: string[] }> }) {
  const { seg } = await params;
  const role = seg?.[0] === 'handwerker' ? 'handwerker' : 'kunde';
  const passwordSet = (process.env.DEMO_PASSWORD ?? '').length > 0;
  if (!(DEMO_LOGIN_ENABLED && passwordSet && authMode() === 'local')) {
    return NextResponse.json({ error: 'not-available' }, { status: 404, headers: { 'cache-control': 'no-store' } });
  }
  const target = role === 'handwerker' ? DEMO_USERS.handwerker : DEMO_USERS.kunde;
  ensureLocalDemoAccounts();
  const row = db.prepare('SELECT id, role FROM users WHERE lower(email)=lower(?)').get(target.email) as { id: number; role: string } | undefined;
  if (!row || row.role !== target.role) {
    return NextResponse.json({ error: 'demo-account-missing' }, { status: 404, headers: { 'cache-control': 'no-store' } });
  }
  await createSession(row.id);
  const next = safeNextPath(req.nextUrl.searchParams.get('next'), target.role === 'provider' ? '/pro' : '/app');
  const res = NextResponse.redirect(new URL(next, req.url), { status: 303 });
  res.headers.set('cache-control', 'no-store');
  return res;
}
