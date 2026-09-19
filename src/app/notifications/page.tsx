import { CheckCheck } from 'lucide-react';
import { AppShell } from '@/components/shell';
import { requireUser } from '@/lib/auth';
import { EHPageHeader, EHList, EHEmptyState, EHButton, EHStatus, EHActions, EHText } from '@/design-system';
import { db } from '@/lib/db';
import { setNotificationReadStateAction, markAllNotificationsReadForCurrentUserAction } from './actions';

const PAGE_SIZE = 25;

export default async function Notifications({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const u = await requireUser();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const unreadTotal = (db.prepare('SELECT COUNT(*) c FROM notifications WHERE user_id=? AND read_at IS NULL').get(u.id) as { c: number }).c;
  const total = (db.prepare('SELECT COUNT(*) c FROM notifications WHERE user_id=?').get(u.id) as { c: number }).c;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const rows = db.prepare('SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?').all(u.id, PAGE_SIZE, (safePage - 1) * PAGE_SIZE) as any[];
  return <AppShell role={u.role} active="/notifications" title="Updates" subtitle={unreadTotal ? `${unreadTotal} ungelesen` : 'Alles gelesen'}>
    <EHPageHeader title="Updates" context="Mitteilungen" actions={unreadTotal > 0 && <form action={markAllNotificationsReadForCurrentUserAction}><EHButton><CheckCheck size={15}/>Alle gelesen</EHButton></form>} />
    <EHList label="Updates" items={rows.map(n => {
        const isUnread = !n.read_at;
        return {
          id: String(n.id),
          title: `${n.title}${isUnread ? ' · ungelesen' : ''}`,
          text: `${n.body} — ${new Date(n.created_at + 'Z').toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}`,
          href: n.href || '#',
          meta: isUnread ? <EHStatus>ungelesen</EHStatus> : null,
          action: <form action={setNotificationReadStateAction}>
            <input type="hidden" name="id" value={n.id}/>
            {isUnread
              ? <EHButton type="submit" name="read" value="1" size="small" variant="secondary" aria-label={`Als gelesen markieren: ${n.title}`}>Gelesen</EHButton>
              : <EHButton type="submit" name="read" value="0" size="small" variant="secondary" aria-label={`Als ungelesen markieren: ${n.title}`}>Ungelesen</EHButton>}
          </form>,
        };
      })} />
      {rows.length === 0 && <EHEmptyState title="Noch keine Benachrichtigungen" text="Wichtige Änderungen erscheinen hier automatisch." />}
      {pageCount > 1 && <EHActions>
        {safePage > 1 && <EHButton href={`/notifications?page=${safePage - 1}`} variant="secondary" size="small">Zurück</EHButton>}
        <EHText size="meta">Seite {safePage} von {pageCount}</EHText>
        {safePage < pageCount && <EHButton href={`/notifications?page=${safePage + 1}`} variant="secondary" size="small">Weiter</EHButton>}
      </EHActions>}
  </AppShell>;
}
