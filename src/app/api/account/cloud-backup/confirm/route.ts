import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { checkRateLimit, consumeRateLimitAttempt } from '@/lib/security/rate-limit';
import { logSecurityEvent } from '@/lib/security/audit';
import { confirmArchiveUploads, normalizeArchiveProvider } from '@/lib/byos-archive';

// Bestätigung byte-identischer Archivkopien. Nur Einträge mit passendem
// SHA-256 werden ausgedünnt; alles andere bricht fail-closed ab.
// Wichtig: Bei voller Nutzer-Cloud ruft die App hier gar nicht erst an —
// dann bleibt das Server-Original unangetastet. Nichts verschwindet von allein.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const key = `u:${user.id}`;
  if (!checkRateLimit('account_mutation', key).allowed) {
    return NextResponse.json({ error: 'Zu viele Versuche. Bitte später erneut.' }, { status: 429 });
  }
  consumeRateLimitAttempt('account_mutation', key);
  let body: { provider?: unknown; uploads?: unknown } = {};
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid_body' }, { status: 400 }); }
  const provider = normalizeArchiveProvider(body.provider);
  if (!provider || !Array.isArray(body.uploads)) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  const results = await confirmArchiveUploads(user.id, provider, body.uploads as Array<{ stored_path: string; archive_ref: string; sha256: string }>);
  const ok = results.filter((r) => r.ok).length;
  logSecurityEvent('account_export', `user:${user.id} byos-confirm ok=${ok}/${results.length}`);
  return NextResponse.json({ ok, total: results.length, results }, { headers: { 'cache-control': 'no-store' } });
}
