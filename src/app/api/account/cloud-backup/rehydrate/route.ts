import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { checkRateLimit, consumeRateLimitAttempt } from '@/lib/security/rate-limit';
import { pendingRehydrates, requestRehydrate, restoreArchivedFile } from '@/lib/byos-archive';

// Rückholung aus der Nutzer-Cloud:
// - GET: offene Rückholaufträge für die App (Auto-Restore im Hintergrund).
// - POST JSON {stored_path}: Auftrag anlegen (Web/KI/Öffnen fordern an).
// - POST multipart (stored_path + file): Original wiederherstellen.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return NextResponse.json({ pending: pendingRehydrates(user.id) }, { headers: { 'cache-control': 'no-store' } });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const key = `u:${user.id}`;
  if (!checkRateLimit('account_mutation', key).allowed) {
    return NextResponse.json({ error: 'Zu viele Versuche. Bitte später erneut.' }, { status: 429 });
  }
  consumeRateLimitAttempt('account_mutation', key);
  const contentType = req.headers.get('content-type') || '';
  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData();
    const storedPath = String(form.get('stored_path') || '');
    const file = form.get('file');
    if (!storedPath || !(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
    }
    const outcome = await restoreArchivedFile(user.id, storedPath, new Uint8Array(await file.arrayBuffer()));
    if (outcome !== 'restored') return NextResponse.json({ error: outcome }, { status: 400 });
    return NextResponse.json({ restored: true }, { headers: { 'cache-control': 'no-store' } });
  }
  let body: { stored_path?: unknown } = {};
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid_body' }, { status: 400 }); }
  const storedPath = typeof body.stored_path === 'string' ? body.stored_path : '';
  if (!storedPath || !requestRehydrate(user.id, storedPath)) {
    return NextResponse.json({ error: 'unknown_file' }, { status: 404 });
  }
  return NextResponse.json({ requested: true }, { headers: { 'cache-control': 'no-store' } });
}
