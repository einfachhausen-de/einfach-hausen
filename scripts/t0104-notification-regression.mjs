import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { stripTypeScriptTypes } from 'node:module';
import { tsClosure } from './lib/ts-scratch.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'eh-t0104-src-'));
const dbDir = fs.mkdtempSync(path.join(os.tmpdir(), 'eh-t0104-db-'));
process.env.DATABASE_PATH = path.join(dbDir, 'regression.db');
process.chdir(dbDir);
fs.symlinkSync(path.join(root, 'node_modules'), path.join(scratch, 'node_modules'), 'dir');
for (const rel of tsClosure(root, ['src/lib/db.ts', 'src/lib/observability.ts', 'src/lib/mailer.ts', 'src/lib/notifications.ts'])) {
  const src = fs.readFileSync(path.join(root, rel), 'utf8');
  const stripped = stripTypeScriptTypes(src).replace(/(from\s*['"])(\.\.?\/[^'"]+)(['"])/g, (_m, a, s, b) => `${a}${s}.mjs${b}`);
  const dest = path.join(scratch, rel.replace(/\.ts$/, '.mjs'));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, stripped);
}

let passed = 0;
const failures = [];
function check(name, condition, detail = '') {
  if (condition) { passed++; console.log(`  ok  ${name}`); }
  else { failures.push(`${name}${detail ? ` :: ${detail}` : ''}`); console.error(`FAIL  ${name}${detail ? ` :: ${detail}` : ''}`); }
}

try {
  const { db } = await import(pathToFileURL(path.join(scratch, 'src/lib/db.mjs')).href);
  const n = await import(pathToFileURL(path.join(scratch, 'src/lib/notifications.mjs')).href);
  const m = await import(pathToFileURL(path.join(scratch, 'src/lib/mailer.mjs')).href);

  db.prepare("INSERT INTO users(email,password_hash,role,first_name,last_name) VALUES('t0104@example.test','x','homeowner','T','E')").run();
  const userId = Number(db.prepare("SELECT id FROM users WHERE email='t0104@example.test'").get().id);

  // Domain events are durable and processable.
  const eventId = n.recordDomainEvent('job.quoted', { jobId: 42 });
  const event = db.prepare('SELECT * FROM notification_events WHERE id=?').get(eventId);
  check('domain event persisted with payload', !!event && event.event_type === 'job.quoted' && JSON.parse(event.payload_json).jobId === 42 && !event.processed_at);
  n.markDomainEventProcessed(eventId);
  check('domain event can be marked processed', !!db.prepare('SELECT processed_at FROM notification_events WHERE id=?').get(eventId).processed_at);

  // Outbox enqueue starts pending with normalized priority and links the event.
  const nid = n.enqueueNotification({ userId, title: 'Angebot bereit', body: 'Bitte prüfen', href: '/app/jobs/1', kind: 'quote', priority: 99, eventId });
  const queued = db.prepare('SELECT * FROM notifications WHERE id=?').get(nid);
  check('enqueued notification is pending in_app', queued.status === 'pending' && queued.channel === 'in_app');
  check('priority clamps to 1..9', queued.priority === 9 && queued.event_id === eventId);

  // Dispatch delivers in-app immediately and exactly once.
  let result = await n.dispatchDueNotifications();
  check('in-app dispatch sends', result.sent === 1);
  result = await n.dispatchDueNotifications();
  check('dispatch is idempotent (nothing double-sent)', result.sent === 0);
  check('sent row exists once', db.prepare("SELECT COUNT(*) c FROM notifications WHERE status='sent' AND id=?").get(nid).c === 1);

  // Read-state transitions stay idempotent.
  check('first mark-read wins', n.markNotificationRead(userId, nid) === true);
  check('second mark-read is a no-op', n.markNotificationRead(userId, nid) === false);
  check('unread toggle works', n.markNotificationUnread(userId, nid) === true);

  // Unknown channel: retry with backoff, then dead-letter. ('sms' has no
  // adapter on purpose; 'email' now has a real SMTP-backed one, EH T-0201.)
  const badId = n.enqueueNotification({ userId, title: 'extern', kind: 'info', channel: 'in_app' });
  db.prepare("UPDATE notifications SET channel='sms' WHERE id=?").run(badId);
  let r = await n.dispatchDueNotifications(Date.now());
  check('failed attempt schedules retry', r.retried === 1);
  const attempt1 = db.prepare('SELECT retry_count,next_retry_at FROM notifications WHERE id=?').get(badId);
  check('retry counter incremented', attempt1.retry_count === 1 && attempt1.next_retry_at > new Date().toISOString());
  r = await n.dispatchDueNotifications(Date.now());
  check('not due yet -> untouched', r.retried === 0 && r.dead === 0);
  const dueAt = db.prepare('SELECT next_retry_at FROM notifications WHERE id=?').get(badId).next_retry_at;
  r = await n.dispatchDueNotifications(new Date(dueAt).getTime() + 1000);
  check('second failure retries again', r.retried === 1);
  const attempt2 = db.prepare('SELECT retry_count,next_retry_at FROM notifications WHERE id=?').get(badId);
  check('backoff grows exponentially', attempt2.retry_count === 2 && attempt2.next_retry_at > attempt1.next_retry_at);
  const dueAt2 = db.prepare('SELECT next_retry_at FROM notifications WHERE id=?').get(badId).next_retry_at;
  r = await n.dispatchDueNotifications(new Date(dueAt2).getTime() + 1000);
  check('third failure dead-letters', r.dead === 1 && db.prepare("SELECT status,retry_count FROM notifications WHERE id=?").get(badId).status === 'dead');
  r = await n.dispatchDueNotifications(Date.now());
  check('dead letters are never re-dispatched', r.dead === 0 && r.sent === 0 && r.retried === 0);

  // Channel adapters + delivery receipts (EH T-0106).
  const sentReceipts = n.deliveryReceipts(nid);
  check('successful delivery writes a receipt', sentReceipts.length === 1 && sentReceipts[0].state === 'sent' && sentReceipts[0].channel === 'in_app');
  const failedHistory = n.deliveryReceipts(badId);
  check('every failed attempt is receipted in order', failedHistory.length === 3
    && failedHistory[0].state === 'failed' && failedHistory[1].state === 'failed' && failedHistory[2].state === 'dead');
  check('failure receipts explain the cause', failedHistory.every(r => r.detail.includes('adapter')));
  check('unknown channel is detectable', n.knownChannel('sms') === false && n.knownChannel('email') === true && n.knownChannel('in_app') === true);
  const seen = [];
  n.registerChannelAdapter('test_channel', () => { seen.push(1); return 'sent'; });
  const testId = n.enqueueNotification({ userId, title: 'adapter test', kind: 'info', channel: 'in_app' });
  db.prepare("UPDATE notifications SET channel='test_channel' WHERE id=?").run(testId);
  const r2 = await n.dispatchDueNotifications(Date.now());
  check('registered adapter delivers its channel', r2.sent === 1 && seen.length === 1);
  check('custom adapter delivery leaves a sent receipt', n.deliveryReceipts(testId)[0]?.state === 'sent');

  // Legacy createNotification keeps working on top of the unified stack.
  n.createNotification(userId, 'Legacy', 'body', '/app');
  check('legacy insert still delivered', db.prepare("SELECT COUNT(*) c FROM notifications WHERE title='Legacy' AND status='sent'").get().c === 1);

  // --- Transactional email fan-out (Issue #12) ------------------------------
  // Only the two events where the message is the product value carry email:
  // a quote arriving for the owner, and a new request reaching a provider.
  check('email is reserved for the quote and dispatch kinds', n.EMAIL_EVENT_KINDS.has('quote') && n.EMAIL_EVENT_KINDS.has('dispatch') && !n.EMAIL_EVENT_KINDS.has('message') && !n.EMAIL_EVENT_KINDS.has('info'));

  // A sandbox sender must not enqueue mail at all: it would dead-letter forever
  // while the health check reported success (verified against Resend, which only
  // accepts the account owner's own mailbox for @resend.dev senders).
  process.env.SMTP_HOST = 'smtp.example.test';
  process.env.MAIL_FROM = 'Einfach Hausen <onboarding@resend.dev>';
  check('a sandbox sender is reported as undeliverable', m.mailDeliverability().deliverable === false && m.mailDeliverability().reason === 'sandbox-sender-domain');
  n.createNotification(userId, 'Sandbox', 'body', '/app', 'quote');
  check('no email row is created while the sender cannot deliver', db.prepare("SELECT COUNT(*) c FROM notifications WHERE user_id=? AND kind='quote' AND channel='email'").get(userId).c === 0);
  check('the in-app row is still delivered while email is blocked', db.prepare("SELECT COUNT(*) c FROM notifications WHERE user_id=? AND title='Sandbox' AND channel='in_app' AND status='sent'").get(userId).c === 1);

  process.env.MAIL_FROM = 'Einfach Hausen <noreply@einfachhausen.de>';
  check('a verified sender domain is deliverable', m.mailDeliverability().deliverable === true);

  const inAppBefore = db.prepare("SELECT COUNT(*) c FROM notifications WHERE user_id=? AND channel='in_app'").get(userId).c;
  const emailBefore = db.prepare("SELECT COUNT(*) c FROM notifications WHERE user_id=? AND channel='email'").get(userId).c;
  n.createNotification(userId, 'Neues Vergleichsangebot', 'Für „Heizung“ ist ein weiteres Angebot eingetroffen.', '/app/jobs/7', 'quote');
  const quoteInApp = db.prepare("SELECT id,status FROM notifications WHERE user_id=? AND kind='quote' AND channel='in_app'").all(userId);
  const quoteEmail = db.prepare("SELECT id,status,title,body,href FROM notifications WHERE user_id=? AND kind='quote' AND channel='email'").all(userId);
  const inAppAfter = db.prepare("SELECT COUNT(*) c FROM notifications WHERE user_id=? AND channel='in_app'").get(userId).c;
  const emailAfter = db.prepare("SELECT COUNT(*) c FROM notifications WHERE user_id=? AND channel='email'").get(userId).c;
  check('quote adds exactly one in-app row and one email row', inAppAfter === inAppBefore + 1 && emailAfter === emailBefore + 1 && quoteEmail.length === 1);
  check('in-app row is delivered on insert, email row waits in the outbox', quoteInApp[0].status === 'sent' && quoteEmail[0].status === 'pending');
  check('the email row carries the same message as the in-app row', quoteEmail[0].title === 'Neues Vergleichsangebot' && quoteEmail[0].href === '/app/jobs/7' && quoteEmail[0].body.includes('Heizung'));

  n.createNotification(userId, 'Neue Anfrage in deinem Gebiet', 'Heizung in 50667 Köln', '/pro/jobs/7', 'dispatch');
  check('dispatch also fans out to email', db.prepare("SELECT COUNT(*) c FROM notifications WHERE user_id=? AND kind='dispatch' AND channel='email'").get(userId).c === 1);

  n.createNotification(userId, 'Neue Nachricht', 'kurz', '/app/jobs/7', 'message');
  check('an event outside the allowlist sends no email', db.prepare("SELECT COUNT(*) c FROM notifications WHERE user_id=? AND kind='message' AND channel='email'").get(userId).c === 0);

  // In-app views must never show the email delivery as a second entry.
  // 'sms' and 'test_channel' are the two synthetic rows from the adapter tests.
  const inAppOnly = db.prepare("SELECT COUNT(*) c FROM notifications WHERE user_id=? AND channel='in_app'").get(userId).c;
  const allRows = db.prepare('SELECT COUNT(*) c FROM notifications WHERE user_id=?').get(userId).c;
  const emailRows = db.prepare("SELECT COUNT(*) c FROM notifications WHERE user_id=? AND channel='email'").get(userId).c;
  check('in-app reads exclude the email deliveries', emailRows === 2 && inAppOnly === allRows - emailRows - 2, `in_app=${inAppOnly} all=${allRows} email=${emailRows}`);

  // With no SMTP configured the email must fail honestly and retry, never
  // report success. This is the guarantee that matters in production.
  delete process.env.SMTP_HOST;
  const dispatchResult = await n.dispatchDueNotifications(Date.now());
  const quoteEmailAfter = db.prepare("SELECT status,retry_count FROM notifications WHERE id=?").get(quoteEmail[0].id);
  check('unconfigured SMTP retries the email instead of claiming delivery', dispatchResult.sent === 0 && dispatchResult.retried >= 1 && quoteEmailAfter.status === 'pending' && quoteEmailAfter.retry_count >= 1);
  const emailReceipts = n.deliveryReceipts(quoteEmail[0].id);
  check('the failed email attempt is auditable in the receipt trail', emailReceipts.some(r => r.channel === 'email' && r.state === 'failed'));
} catch (error) {
  failures.push(`module load failed :: ${error.message}`);
  console.error(error);
}

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
