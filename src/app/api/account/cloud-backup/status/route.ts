import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { archiveStatusFor, normalizeProviderSetting, setCloudLink } from '@/lib/byos-archive';

// BYOS-Backup-Status: gewählte Nutzer-Cloud, Auto-Rückholung, Zähler.
// GET = lesen, POST = verknüpfen/entknüpfen + Zustimmung speichern.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return NextResponse.json(await archiveStatusFor(user.id), { headers: { 'cache-control': 'no-store' } });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  let body: { provider?: unknown; auto_restore?: unknown } = {};
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid_body' }, { status: 400 }); }
  const provider = normalizeProviderSetting(body.provider);
  if (!provider) return NextResponse.json({ error: 'invalid_provider' }, { status: 400 });
  setCloudLink(user.id, provider, body.auto_restore !== false);
  return NextResponse.json(await archiveStatusFor(user.id), { headers: { 'cache-control': 'no-store' } });
}
