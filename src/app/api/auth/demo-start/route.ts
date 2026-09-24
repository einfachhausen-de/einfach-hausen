import { NextRequest, NextResponse } from 'next/server';
import { DEMO_LOGIN_ENABLED, DEMO_USERS } from '@/lib/demo-accounts';
import { authMode, createSession } from '@/lib/auth';
import { ensureLocalDemoAccounts } from '@/lib/ensure-local-demo-accounts';
import { db } from '@/lib/db';
import { safeNextPath } from '@/lib/safe-redirect';

export const runtime = 'nodejs';

/**
 * Serverseitiger Demo-Direkteinstieg fuer die Vorschau (Betreiber-Feedback
 * 23.09.: der Formular-Flow im Preview-iframe blieb haengen — Client-Bundle
 * kennt das Demo-Passwort nicht, Sessions-Rotation und Cookie-Physik im
 * Drittanbieter-Rahmen erschweren den Klickpfad). GET hier setzt die Session
 * wie jeder andere Login (createSession, inklusive Rotation) und leitet per
 * 303 weiter — ein Dokument-Navigationsschritt, ganz ohne Formular-JS.
 *
 * Existiert nur, wenn BOTH Kill-Switches stehen: DEMO_LOGIN_ENABLED=1 und
 * lokaler Auth-Modus. Supabase-Setups und Production erhalten 404.
 */
export async function GET(req: NextRequest) {
  if (!(DEMO_LOGIN_ENABLED && DEMO_PASSWORD_SET() && authMode() === 'local')) {
    return NextResponse.json({ error: 'not-available' }, { status: 404, headers: { 'cache-control': 'no-store' } });
  }
  const wanted = req.nextUrl.searchParams.get('role') === 'handwerker' ? 'handwerker' : 'kunde';
  const target = wanted === 'handwerker' ? DEMO_USERS.handwerker : DEMO_USERS.kunde;
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

function DEMO_PASSWORD_SET(): boolean {
  return (process.env.DEMO_PASSWORD ?? '').length > 0;
}
