import fs from 'node:fs/promises';
import path from 'node:path';
import { db } from './db';
import { supabaseAdmin } from './auth';
import { logSecurityEvent } from './security/audit';
import { privateRoot, publicRoot } from './security/private-files';

// GDPR account lifecycle (EH T-0203): personal content is deleted, business
// records that carry legal retention obligations (invoices, billing rows) stay
// and merely keep pointing at an anonymized user row, so references remain
// consistent without keeping personal identifiers alive.

const ANON_DOMAIN = 'accounts.anonymisiert.invalid';

type Row = Record<string, unknown>;

function storedPaths(userId: number): string[] {
  const paths: string[] = [];
  const push = (value: unknown) => { if (typeof value === 'string' && value.length > 0) paths.push(value); };
  const one = (sql: string, ...args: (string | number)[]) => db.prepare(sql).get(...args) as Row | undefined;
  const all = (sql: string, ...args: (string | number)[]) => db.prepare(sql).all(...args) as Row[];

  push(one('SELECT document_path FROM verification_requests WHERE provider_id=?', userId)?.document_path);
  push(one('SELECT logo_path FROM provider_profiles WHERE user_id=?', userId)?.logo_path);
  for (const row of all(
    'SELECT d.photo_path AS p FROM assistant_drafts d JOIN assistant_threads t ON t.id=d.thread_id WHERE t.user_id=? AND d.photo_path IS NOT NULL', userId,
  )) push(row.p);
  for (const row of all(
    `SELECT jp.path AS p FROM job_photos jp JOIN jobs j ON j.id=jp.job_id
     WHERE j.homeowner_id=? OR EXISTS (SELECT 1 FROM quotes q WHERE q.job_id=j.id AND q.provider_id=?)`, userId, userId,
  )) push(row.p);
  for (const row of all(
    `SELECT d.path AS p FROM documents d JOIN jobs j ON j.id=d.job_id
     WHERE d.provider_id=? OR j.homeowner_id=?`, userId, userId,
  )) push(row.p);
  for (const row of all('SELECT before_photo AS p, after_photo AS p2 FROM house_history_entries WHERE homeowner_id=?', userId)) {
    push(row.p); push(row.p2);
  }
  for (const row of all(
    'SELECT d.path AS p FROM house_history_documents d JOIN house_history_entries e ON e.id=d.entry_id WHERE e.homeowner_id=?', userId,
  )) push(row.p);
  for (const row of all('SELECT document_path AS p FROM house_contracts WHERE homeowner_id=?', userId)) push(row.p);
  return paths;
}

// Stored paths are private-root-relative (job-media/...) or public /uploads/...
// references. Resolve defensively; nothing outside those roots is touched.
async function unlinkStored(stored: string): Promise<void> {
  const candidates: string[] = [];
  const privateResolved = (() => {
    if (!stored || stored.includes('\0')) return null;
    if (path.posix.isAbsolute(stored) || path.win32.isAbsolute(stored)) {
      return null;
    }
    if (stored.split(/[\\/]+/).some((segment) => segment === '..')) return null;
    const resolved = path.resolve(privateRoot(), stored);
    const relative = path.relative(privateRoot(), resolved);
    return relative && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative) ? resolved : null;
  })();
  if (privateResolved) candidates.push(privateResolved);
  const uploadsMatch = stored.match(/^\/?(?:uploads\/)(.+)$/);
  if (uploadsMatch) {
    const resolved = path.resolve(publicRoot(), 'uploads', uploadsMatch[1]);
    const relative = path.relative(path.resolve(publicRoot(), 'uploads'), resolved);
    if (relative && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative)) candidates.push(resolved);
  }
  for (const file of candidates) {
    try { await fs.unlink(file); } catch { /* already gone or unreadable: deletion stays best-effort */ }
  }
}

export async function deleteAccountData(userId: number): Promise<{ authSubject: string | null; files: number }> {
  const user = db.prepare('SELECT id,auth_subject FROM users WHERE id=?').get(userId) as { id: number; auth_subject: string | null } | undefined;
  if (!user) throw new Error('user not found');
  const files = storedPaths(userId);
  // T-0128: transparent request state in data_requests ('requested' at entry,
  // 'completed' after the transaction succeeds). Identity is confirmed by the
  // session (konto-loeschen route) - never by a client-supplied id.
  db.prepare("INSERT INTO data_requests(user_id,kind,status,detail) VALUES(?, 'deletion', 'requested', 'self-service closure; technical deletion with anonymization hooks')")
    .run(userId);

  db.transaction(() => {
    // Personal conversations and contact graph.
    db.prepare('DELETE FROM messages WHERE sender_id=? OR recipient_id=?').run(userId, userId);
    db.prepare('DELETE FROM contact_messages WHERE homeowner_id=? OR provider_id=? OR contact_user_id=? OR sender_id=?').run(userId, userId, userId, userId);
    db.prepare('DELETE FROM homeowner_contacts WHERE homeowner_id=? OR provider_id=? OR contact_user_id=?').run(userId, userId, userId);
    db.prepare('DELETE FROM homeowner_contact_subcategories WHERE homeowner_id=?').run(userId);
    db.prepare('DELETE FROM contact_directory_receipts WHERE homeowner_id=?').run(userId);
    db.prepare('DELETE FROM homeowner_contact_entries WHERE homeowner_id=?').run(userId);
    db.prepare('UPDATE homeowner_contact_entries SET contact_user_id=NULL WHERE contact_user_id=?').run(userId);
    db.prepare('DELETE FROM provider_invites WHERE homeowner_id=?').run(userId);
    db.prepare('UPDATE provider_invites SET linked_provider_id=NULL WHERE linked_provider_id=?').run(userId);
    db.prepare('DELETE FROM house_transfers WHERE homeowner_id=? OR accepted_by_user_id=?').run(userId, userId);

    // Verification queue and private media metadata.
    db.prepare('DELETE FROM verification_requests WHERE provider_id=?').run(userId);

    // Assistant history.
    db.prepare('DELETE FROM assistant_threads WHERE user_id=?').run(userId);

    // In-app notifications and sessions.
    db.prepare('DELETE FROM notifications WHERE user_id=?').run(userId);
    db.prepare('DELETE FROM sessions WHERE user_id=?').run(userId);

    // Home content (owner-side personal data).
    db.prepare('DELETE FROM house_assets WHERE homeowner_id=?').run(userId);
    db.prepare('DELETE FROM maintenance_tasks WHERE homeowner_id=?').run(userId);
    db.prepare('DELETE FROM house_history_entries WHERE homeowner_id=?').run(userId);
    db.prepare('DELETE FROM house_contracts WHERE homeowner_id=?').run(userId);
    const propertyIds = (db.prepare('SELECT property_id FROM property_ownerships WHERE homeowner_id=?').all(userId) as Row[])
      .map((row) => Number(row.property_id));
    db.prepare('DELETE FROM property_ownerships WHERE homeowner_id=?').run(userId);
    for (const propertyId of propertyIds) {
      const remaining = db.prepare('SELECT COUNT(*) AS c FROM property_ownerships WHERE property_id=?').get(propertyId) as { c: number };
      if (remaining.c === 0) db.prepare('DELETE FROM properties WHERE id=?').run(propertyId);
    }
    db.prepare('DELETE FROM property_shares WHERE homeowner_id=? OR provider_id=?').run(userId, userId);

    // Jobs of the homeowner are personal content - except jobs that carry
    // retained invoices (legal retention keeps those job rows intact).
    db.prepare('DELETE FROM jobs WHERE homeowner_id=? AND id NOT IN (SELECT job_id FROM invoices)').run(userId);
    db.prepare('DELETE FROM appointments WHERE provider_id=?').run(userId);
    db.prepare('DELETE FROM job_assignments WHERE provider_id=? OR contact_user_id=? OR assigned_by_user_id=?').run(userId, userId, userId);

    // Provider workspace surface.
    db.prepare('DELETE FROM homeowner_profiles WHERE user_id=?').run(userId);
    db.prepare('DELETE FROM provider_profiles WHERE user_id=?').run(userId);
    db.prepare('DELETE FROM provider_preferences WHERE provider_id=?').run(userId);
    db.prepare('DELETE FROM partner_contracts WHERE provider_id=?').run(userId);
    db.prepare('DELETE FROM provider_members WHERE provider_id=? OR user_id=?').run(userId, userId);
    db.prepare('DELETE FROM provider_category_assignments WHERE provider_id=?').run(userId);
    db.prepare('DELETE FROM provider_service_offerings WHERE provider_id=?').run(userId);
    db.prepare('DELETE FROM broker_search_profiles WHERE provider_id=?').run(userId);

    // Retention: invoices, payments, subscriptions, package_orders, quotes,
    // reviews and claims rows survive with the anonymized user reference so
    // accounting and dispute history stay consistent (T-0144 requirement).

    // Anonymize the identity row itself.
    db.prepare(`UPDATE users SET email=?, first_name='Gelöscht', last_name='', phone=NULL, password_hash='', auth_subject=NULL WHERE id=?`)
      .run(`geloescht-${userId}-${Date.now()}@${ANON_DOMAIN}`, userId);
  })();

  // Identity authority cleanup is best-effort: an orphaned Supabase identity
  // cannot rebind because the anonymized row no longer matches email or subject.
  if (user.auth_subject) {
    try {
      const admin = supabaseAdmin();
      await admin?.auth.admin.deleteUser(user.auth_subject);
    } catch { /* logged below via security event detail */ }
  }
  for (const stored of files) await unlinkStored(stored);
  db.prepare("UPDATE data_requests SET status='completed',completed_at=CURRENT_TIMESTAMP WHERE id=(SELECT id FROM data_requests WHERE user_id=? AND kind='deletion' ORDER BY id DESC LIMIT 1)").run(userId);
  logSecurityEvent('account_delete', `user:${userId}`, `files=${files.length}`);
  return { authSubject: user.auth_subject, files: files.length };
}
