import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { checkRateLimit, consumeRateLimitAttempt } from '@/lib/security/rate-limit';
import { buildArchiveManifest } from '@/lib/byos-archive';

// Manifest für die App: alle eigenen Dateien mit Integritäts-Hashes.
// Die App lädt fehlende Originale über fetch_path, sichert sie in die
// Nutzer-Cloud und bestätigt sie per /confirm (erst dann wird ausgedünnt).
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const key = `u:${user.id}`;
  if (!checkRateLimit('account_mutation', key).allowed) {
    return NextResponse.json({ error: 'Zu viele Versuche. Bitte später erneut.' }, { status: 429 });
  }
  consumeRateLimitAttempt('account_mutation', key);
  const manifest = await buildArchiveManifest(user.id);
  return NextResponse.json(manifest, { headers: { 'cache-control': 'no-store' } });
}
