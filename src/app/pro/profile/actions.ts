'use server';

import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { saveProfileAction } from '@/app/actions';
import { privateRoot } from '@/lib/security/private-files';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { closePendingProviderDispatches } from '@/lib/partner-config';
import { getProviderContext } from '@/lib/provider';
import { logAdminAudit } from '@/lib/security/audit';

const MAX_VERIFICATION_FILE_BYTES = 12 * 1024 * 1024;
const VERIFICATION_MIME_EXTENSIONS: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function text(fd: FormData, key: string) {
  return String(fd.get(key) ?? '').trim();
}

async function saveVerificationFile(file: File) {
  const ext = VERIFICATION_MIME_EXTENSIONS[file.type];
  if (!ext || file.size === 0 || file.size > MAX_VERIFICATION_FILE_BYTES) {
    throw new Error('invalid_verification_file');
  }
  const name = `${Date.now()}-${randomUUID()}.${ext}`;
  const directory = path.join(privateRoot(), 'verification');
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, name), Buffer.from(await file.arrayBuffer()), { mode: 0o600 });
  return `verification/${name}`;
}

function sortedUnique(values: string[]) {
  return [...new Set(values)].sort();
}

function sameValues(a: string[], b: string[]) {
  const left = sortedUnique(a);
  const right = sortedUnique(b);
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

export async function saveProviderProfileLifecycleAction(fd: FormData) {
  const user = await requireUser('provider');
  const ctx = getProviderContext(user.id);
  if (!ctx) redirect('/login');

  const beforeProfile = db.prepare(`SELECT business_name,trades,verified FROM provider_profiles WHERE user_id=?`)
    .get(ctx.providerId) as { business_name: string; trades: string; verified: number } | undefined;
  const beforeCategories = (db.prepare(`SELECT category_slug FROM provider_category_assignments WHERE provider_id=?`)
    .all(ctx.providerId) as Array<{ category_slug: string }>).map((row) => row.category_slug);
  const beforeServices = (db.prepare(`SELECT service_slug FROM provider_service_offerings WHERE provider_id=? AND active=1`)
    .all(ctx.providerId) as Array<{ service_slug: string }>).map((row) => row.service_slug);

  await saveProfileAction(fd);

  if (ctx.canManageJobs && beforeProfile) {
    const nextBusinessName = text(fd, 'businessName') || beforeProfile.business_name;
    const nextTrades = text(fd, 'trades') || beforeProfile.trades;
    const availableCategories = new Set((db.prepare(`SELECT slug FROM provider_categories WHERE active=1`).all() as Array<{ slug: string }>).map((row) => row.slug));
    const nextCategories = fd.get('providerCategoriesPresent')
      ? fd.getAll('providerCategory').map(String).filter((slug) => availableCategories.has(slug))
      : beforeCategories;
    const normalizedCategories = nextCategories.length ? nextCategories : ['handwerk'];
    const availableServices = new Set((db.prepare(`SELECT slug FROM service_catalog WHERE active=1`).all() as Array<{ slug: string }>).map((row) => row.slug));
    const nextServices = fd.get('serviceProfilePresent')
      ? fd.getAll('serviceSlug').map(String).filter((slug) => availableServices.has(slug))
      : beforeServices;

    const changed: string[] = [];
    if (beforeProfile.business_name !== nextBusinessName) changed.push('business_name');
    if (beforeProfile.trades !== nextTrades) changed.push('trades');
    if (!sameValues(beforeCategories, normalizedCategories)) changed.push('categories');
    if (!sameValues(beforeServices, nextServices)) changed.push('offerings');

    if (changed.length > 0) {
      let contractSuspended = false;
      let closedDispatches = 0;
      db.transaction(() => {
        db.prepare('UPDATE provider_profiles SET verified=0 WHERE user_id=?').run(ctx.providerId);
        db.prepare(`UPDATE verification_requests
          SET status='pending',reviewed_at=NULL,admin_note='',submitted_at=CURRENT_TIMESTAMP
          WHERE provider_id=?`).run(ctx.providerId);
        contractSuspended = db.prepare(`UPDATE partner_contracts
          SET status='suspended',updated_at=CURRENT_TIMESTAMP
          WHERE provider_id=? AND status='active'`).run(ctx.providerId).changes > 0;
        closedDispatches = closePendingProviderDispatches(ctx.providerId);
        logAdminAudit(
          `provider:${user.id}`,
          'provider_profile_verification_invalidated',
          `provider:${ctx.providerId}`,
          `changed=${changed.join(',')};was_verified=${beforeProfile.verified ? 1 : 0};contract_suspended=${contractSuspended ? 1 : 0};dispatches_closed=${closedDispatches}`,
        );
      })();
      revalidatePath('/admin');
      revalidatePath('/pro');
      revalidatePath('/pro/profile');
      redirect('/pro/profile?profile=review');
    }
  }

  revalidatePath('/pro');
  revalidatePath('/pro/profile');
  redirect('/pro/profile?profile=saved');
}

export async function submitProviderVerificationAction(fd: FormData) {
  const user = await requireUser('provider');
  const ctx = getProviderContext(user.id);
  if (!ctx?.isOwner) redirect('/pro/profile?verification=owner');

  const file = fd.get('document');
  if (!(file instanceof File) || file.size === 0) redirect('/pro/profile?verification=file');

  let saved: string;
  try {
    saved = await saveVerificationFile(file);
  } catch {
    redirect('/pro/profile?verification=file');
  }

  const previous = db.prepare(`SELECT id,status FROM verification_requests WHERE provider_id=?`).get(ctx.providerId) as
    | { id: number; status: string }
    | undefined;
  let closedDispatches = 0;
  let contractSuspended = false;
  db.transaction(() => {
    db.prepare(`INSERT INTO verification_requests(
        provider_id,document_path,status,provider_note,submitted_at,reviewed_at,admin_note
      ) VALUES(?,?,'pending',?,CURRENT_TIMESTAMP,NULL,'')
      ON CONFLICT(provider_id) DO UPDATE SET
        document_path=excluded.document_path,
        status='pending',
        provider_note=excluded.provider_note,
        submitted_at=CURRENT_TIMESTAMP,
        reviewed_at=NULL,
        admin_note=''`).run(ctx.providerId, saved, text(fd, 'note').slice(0, 1000));
    db.prepare('UPDATE provider_profiles SET verified=0 WHERE user_id=?').run(ctx.providerId);
    const suspended = db.prepare(`UPDATE partner_contracts
      SET status='suspended',updated_at=CURRENT_TIMESTAMP
      WHERE provider_id=? AND status='active'`).run(ctx.providerId).changes;
    contractSuspended = suspended > 0;
    closedDispatches = closePendingProviderDispatches(ctx.providerId);
    const request = db.prepare('SELECT id FROM verification_requests WHERE provider_id=?').get(ctx.providerId) as { id: number };
    logAdminAudit(
      `provider:${user.id}`,
      'verification_submit',
      `provider:${ctx.providerId}`,
      `request=${request.id};previous=${previous?.status || 'none'};contract_suspended=${contractSuspended ? 1 : 0};dispatches_closed=${closedDispatches}`,
    );
  })();

  revalidatePath('/pro/profile');
  revalidatePath('/pro');
  revalidatePath('/admin');
  redirect('/pro/profile?verification=submitted');
}
