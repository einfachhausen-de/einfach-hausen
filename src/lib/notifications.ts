import { db } from './db';
import { sendMail, mailDeliverability } from './mailer';
import { structuredLog, newCorrelationId } from './observability';

// Transactional email is reserved for the two events where the message itself is
// the product value: a quote arriving for the owner, and a new request reaching a
// provider. Everything else stays in-app so the mailbox does not become noise.
// The decision lives at this single choke point, which every domain event already
// goes through, so no call site can silently opt an event in or out.
// Operator decision: item 9 in docs/EXTERNAL-BLOCKERS.md.
export const EMAIL_EVENT_KINDS: ReadonlySet<string> = new Set(['quote', 'dispatch']);

export function createNotification(userId: number, title: string, body: string, href: string, kind = 'info') {
  const row = db
    .prepare('INSERT INTO notifications(user_id,kind,title,body,href) VALUES(?,?,?,?,?)')
    .run(userId, kind, title, body.slice(0, 800), href);
  if (EMAIL_EVENT_KINDS.has(kind) && mailDeliverability().deliverable) {
    // The email gets its own outbox row. In-app views read channel='in_app' rows
    // only, so the two deliveries of one event never appear twice in the app.
    // A missing SMTP configuration makes this row retry and dead-letter instead
    // of pretending it was delivered.
    enqueueNotification({ userId, title, body, href, kind, channel: 'email' });
  }
  return row;
}

export function markNotificationRead(userId: number, notificationId: number): boolean {
  const result = db
    .prepare('UPDATE notifications SET read_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=? AND read_at IS NULL')
    .run(notificationId, userId);
  return result.changes === 1;
}

export function markNotificationUnread(userId: number, notificationId: number): boolean {
  const result = db
    .prepare('UPDATE notifications SET read_at=NULL WHERE id=? AND user_id=? AND read_at IS NOT NULL')
    .run(notificationId, userId);
  return result.changes === 1;
}

export function markAllNotificationsRead(userId: number): number {
  return db
    .prepare('UPDATE notifications SET read_at=CURRENT_TIMESTAMP WHERE user_id=? AND read_at IS NULL')
    .run(userId).changes;
}

// --- Email channel (EH T-0201) ---------------------------------------------
// Recipient resolution stays server-side: notifications reference app users,
// never raw addresses, so the outbox cannot leak or spoof arbitrary targets.
function userEmail(userId: number): string | null {
  const row = db.prepare('SELECT email FROM users WHERE id=?').get(userId) as { email?: string } | undefined;
  return row?.email ?? null;
}

function emailHtml(title: string, body: string, href: string): string {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://einfachhausen.de').replace(/\/$/, '');
  const link = href ? `${appUrl}${href.startsWith('/') ? href : `/${href}`}` : appUrl;
  return `<div style="font-family:Helvetica,Arial,sans-serif;max-width:520px;margin:auto">
    <h2 style="color:#105258">${title}</h2>
    ${body ? `<p style="color:#33484f">${body}</p>` : ''}
    <a href="${link}" style="display:inline-block;background:#105258;color:#fff;padding:12px 24px;border-radius:14px;text-decoration:none;font-weight:700;margin-top:8px">In der App ansehen</a>
    <p style="color:#9aa9ad;font-size:12px;margin-top:24px">Diese E-Mail wurde dir von einfachhausen gesendet.</p>
  </div>`;
}

// --- Durable outbox (EH T-0104) -------------------------------------------
// Domain events are recorded first; notifications materialize from them with
// an explicit delivery lifecycle: pending -> sent, with retry + dead-letter
// for channels that fail. In-app is delivered by the row insert itself.

export const MAX_NOTIFICATION_RETRIES = 3;
export const NOTIFICATION_RETRY_BASE_SECONDS = 30;

export function recordDomainEvent(eventType: string, payload: Record<string, unknown> = {}): number {
  const info = db
    .prepare('INSERT INTO notification_events(event_type,payload_json) VALUES(?,?)')
    .run(eventType.slice(0, 100), JSON.stringify(payload).slice(0, 4000));
  return Number(info.lastInsertRowid);
}

export function markDomainEventProcessed(eventId: number): void {
  db.prepare('UPDATE notification_events SET processed_at=CURRENT_TIMESTAMP WHERE id=? AND processed_at IS NULL').run(eventId);
}

export type EnqueueNotificationInput = {
  userId: number;
  title: string;
  body?: string;
  href?: string;
  kind?: string;
  channel?: 'in_app' | 'email';
  priority?: number;
  eventId?: number;
};

export function enqueueNotification(input: EnqueueNotificationInput): number {
  const priority = Math.max(1, Math.min(9, Math.round(input.priority ?? 5)));
  const eventId = input.eventId ?? recordDomainEvent(`notification.${input.kind || 'info'}`, { userId: input.userId, title: input.title });
  const info = db
    .prepare("INSERT INTO notifications(user_id,kind,title,body,href,channel,priority,status,event_id) VALUES(?,?,?,?,?,?,?,'pending',?)")
    .run(
      input.userId,
      (input.kind || 'info').slice(0, 40),
      input.title.slice(0, 200),
      (input.body || '').slice(0, 800),
      input.href || '',
      input.channel || 'in_app',
      priority,
      eventId,
    );
  return Number(info.lastInsertRowid);
}

// --- Channel adapters (EH T-0106) ------------------------------------------
// Each channel delivers one message and reports success or failure. In-app is
// delivered by the row itself; external channels register adapters here as
// they become available. Unknown channels fail honestly so retries stay real.
// Adapters may be async; the dispatcher awaits them so retries stay real.
export type ChannelAdapter = (message: { userId: number; title: string; body: string; href: string; kind: string }) => Promise<'sent' | 'failed'> | 'sent' | 'failed';

const channelAdapters = new Map<string, ChannelAdapter>([
  ['in_app', () => 'sent'],
  ['email', async ({ userId, title, body, href }) => {
    const to = userEmail(userId);
    if (!to) return 'failed';
    return (await sendMail(to, title, emailHtml(title, body, href))) ? 'sent' : 'failed';
  }],
]);

export function registerChannelAdapter(channel: string, adapter: ChannelAdapter): void {
  channelAdapters.set(channel, adapter);
}

export function knownChannel(channel: string): boolean {
  return channelAdapters.has(channel);
}

function recordReceipt(notificationId: number, channel: string, state: 'sent' | 'failed' | 'dead', detail: string): void {
  db.prepare('INSERT INTO notification_receipts(notification_id,channel,state,detail) VALUES(?,?,?,?)').run(notificationId, channel, state, detail.slice(0, 300));
}

export function deliveryReceipts(notificationId: number): Array<{ channel: string; state: string; detail: string; created_at: string }> {
  return db.prepare('SELECT channel,state,detail,created_at FROM notification_receipts WHERE notification_id=? ORDER BY created_at ASC, id ASC').all(notificationId) as any;
}

export function requeueDeadNotification(notificationId: number, actor: string): boolean {
  // Safe retry (T-0126): a dead notification re-enters the normal pending
  // lifecycle (retry_count reset so it gets fresh attempts). Caller must be
  // admin; every requeue is auditable via the receipt trail.
  const info = db.prepare("UPDATE notifications SET status='pending',retry_count=0,next_retry_at=NULL WHERE id=? AND status='dead'").run(notificationId);
  if (info.changes) {
    recordReceipt(notificationId, 'ops', 'sent', `requeued by ${actor.slice(0, 80)}`);
    return true;
  }
  return false;
}

// Deliver every due pending notification through its channel adapter.
// Async so channel adapters (e.g. SMTP email) can await real delivery results;
// the outbox transactionality lives in the database, not in this loop.
export async function dispatchDueNotifications(nowMs: number = Date.now()): Promise<{ sent: number; retried: number; dead: number }> {
  const correlationId = newCorrelationId();
  const due = db
    .prepare("SELECT id,user_id,kind,title,body,href,channel,retry_count FROM notifications WHERE status='pending' AND (next_retry_at IS NULL OR next_retry_at<=?) ORDER BY priority ASC, created_at ASC LIMIT 200")
    .all(new Date(nowMs).toISOString()) as Array<{ id: number; user_id: number; kind: string; title: string; body: string; href: string; channel: string; retry_count: number }>;
  let sent = 0;
  let retried = 0;
  let dead = 0;
  for (const row of due) {
    const adapter = channelAdapters.get(row.channel);
    const outcome = adapter ? await adapter({ userId: row.user_id, title: row.title, body: row.body, href: row.href, kind: row.kind }) : 'failed';
    if (outcome === 'sent') {
      db.prepare("UPDATE notifications SET status='sent' WHERE id=? AND status='pending'").run(row.id);
      recordReceipt(row.id, row.channel, 'sent', 'delivered');
      structuredLog.info('internal', 'outbox delivered', { correlation_id: correlationId, event_id: row.id });
      sent++;
      continue;
    }
    const attempts = row.retry_count + 1;
    if (attempts >= MAX_NOTIFICATION_RETRIES) {
      db.prepare("UPDATE notifications SET status='dead',retry_count=?,next_retry_at=NULL WHERE id=?").run(attempts, row.id);
      recordReceipt(row.id, row.channel, 'dead', `no adapter for channel after ${attempts} attempts`);
      structuredLog.error('internal', 'outbox dead-lettered', { correlation_id: correlationId, event_id: row.id });
      dead++;
    } else {
      const backoffSeconds = NOTIFICATION_RETRY_BASE_SECONDS * 2 ** (attempts - 1);
      const nextRetry = new Date(nowMs + backoffSeconds * 1000).toISOString();
      db.prepare("UPDATE notifications SET retry_count=?,next_retry_at=? WHERE id=? AND status='pending'").run(attempts, nextRetry, row.id);
      recordReceipt(row.id, row.channel, 'failed', adapter ? 'adapter reported failure' : 'no adapter registered');
      structuredLog.warn('internal', 'outbox retry scheduled', { correlation_id: correlationId, event_id: row.id });
      retried++;
    }
  }
  return { sent, retried, dead };
}
