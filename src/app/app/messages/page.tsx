import { randomUUID } from 'node:crypto';
import { notFound } from 'next/navigation';
import { EHContactWorkspace, EHConversation, EHCallout, type EHDirectoryMode } from '@/design-system';
import { AppShell } from '@/components/shell';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { CONTACT_DIRECTORY_CATEGORIES, contactDirectoryCategory, contactDirectorySubcategory } from '@/lib/contact-directory-taxonomy';
import { createContactDirectoryStore } from '@/lib/contact-directory-store';
import { OwnerMessageComposer } from './thread-client';
import { submitDirectoryAction, submitDirectoryShortcut } from './directory-actions';

type ActiveContact = { contact_user_id: number; provider_id: number; first_name: string; last_name: string; business_name: string; job_title: string; phone: string | null; email: string; unread_count: number };
type ThreadMessage = { source: 'direct' | 'job'; id: number; sender_id: number; body: string; read_at: string | null; created_at: string; context_title: string | null; job_id: number | null };

export default async function Messages({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const u = await requireUser('homeowner');
  const params = await searchParams;
  const text = (key: string) => typeof params[key] === 'string' ? params[key] as string : '';
  const positiveId = (raw: string) => /^\d+$/.test(raw) && Number.isSafeInteger(Number(raw)) && Number(raw) > 0 ? Number(raw) : undefined;
  const store = createContactDirectoryStore(db);
  const stored = store.list(u.id);
  if (!stored.ok) throw new Error('Contact directory unavailable');
  const rawSub = text('sub');
  const sub = contactDirectorySubcategory(rawSub);
  if (rawSub && !sub) notFound();
  const rawMain = text('main');
  const main = contactDirectoryCategory(rawMain || sub?.mainId);
  if (rawMain && !main || sub && main?.id !== sub.mainId) notFound();
  let entryId = positiveId(text('entry'));
  if (text('entry') && !entryId) notFound();
  // Preserve existing notification, job and provider links: contact= is a platform user ID,
  // never an address-book entry ID. No manual ID is sent to the message API.
  if (text('contact')) {
    const platformId = positiveId(text('contact'));
    if (!platformId) notFound();
    const linked = store.findByPlatformUserId(u.id, platformId);
    if (!linked.ok || entryId && entryId !== linked.value.id) notFound();
    entryId = linked.value.id;
  }
  const entry = entryId ? stored.value.find(item => item.id === entryId) : undefined;
  if (entryId && !entry) notFound();
  const requestedMode = text('mode');
  if (requestedMode && !['manage', 'new', 'assign', 'edit'].includes(requestedMode)) notFound();
  if (requestedMode === 'new' && (!main || !sub) || (requestedMode === 'assign' || requestedMode === 'edit') && !entry) notFound();
  if (requestedMode === 'edit' && entry?.platformUserId !== null) notFound();
  if (requestedMode === 'assign' && !main) notFound();
  if (requestedMode === 'assign' && !entry) notFound();
  const mode: EHDirectoryMode = requestedMode as EHDirectoryMode || (entry ? 'detail' : sub ? 'contacts' : main ? 'subcategories' : 'categories');
  const activeContacts = db.prepare(`SELECT hc.*,u.first_name,u.last_name,u.phone,u.email,m.job_title,p.business_name,j.title last_job_title,
      ((SELECT COUNT(*) FROM contact_messages cm
        WHERE cm.homeowner_id=hc.homeowner_id AND cm.provider_id=hc.provider_id AND cm.contact_user_id=hc.contact_user_id
          AND cm.sender_id<>hc.homeowner_id AND cm.read_at IS NULL)
       + (SELECT COUNT(*) FROM messages jm
          JOIN jobs jj ON jj.id=jm.job_id AND jj.homeowner_id=hc.homeowner_id
          JOIN job_assignments ja ON ja.job_id=jm.job_id AND ja.provider_id=hc.provider_id AND ja.contact_user_id=hc.contact_user_id
          WHERE jm.recipient_id=hc.homeowner_id AND jm.sender_id=hc.contact_user_id AND jm.read_at IS NULL)) unread_count
    FROM homeowner_contacts hc
    JOIN users u ON u.id=hc.contact_user_id AND u.role='provider'
    JOIN provider_members m ON m.user_id=hc.contact_user_id AND m.provider_id=hc.provider_id AND m.active=1
    JOIN provider_profiles p ON p.user_id=hc.provider_id
    LEFT JOIN jobs j ON j.id=hc.last_job_id
    WHERE hc.homeowner_id=? ORDER BY hc.updated_at DESC`).all(u.id) as ActiveContact[];

  const activeById = new Map(activeContacts.map(contact => [contact.contact_user_id, contact]));
  const contacts = stored.value.map(contact => {
    const profile = contact.platformUserId ? activeById.get(contact.platformUserId) : undefined;
    return profile ? { ...contact, name: `${profile.first_name} ${profile.last_name}`.trim(), company: profile.business_name || '', phone: profile.phone || '', email: profile.email || '', unreadCount: Number(profile.unread_count || 0) } : contact;
  });
  const active = entry?.platformUserId ? activeById.get(entry.platformUserId) : undefined;
  const messages = mode === 'detail' && active
    ? db.prepare(`SELECT 'direct' source,cm.id,cm.sender_id,cm.body,cm.read_at,cm.created_at,NULL context_title,NULL job_id
        FROM contact_messages cm
        WHERE cm.homeowner_id=? AND cm.provider_id=? AND cm.contact_user_id=?
        UNION ALL
        SELECT 'job' source,jm.id,jm.sender_id,jm.body,jm.read_at,jm.created_at,j.title context_title,jm.job_id
        FROM messages jm
        JOIN jobs j ON j.id=jm.job_id AND j.homeowner_id=?
        JOIN job_assignments ja ON ja.job_id=jm.job_id AND ja.provider_id=? AND ja.contact_user_id=?
        WHERE (jm.sender_id=? AND jm.recipient_id=?) OR (jm.sender_id=? AND jm.recipient_id=?)
        ORDER BY created_at,id`).all(
          u.id,
          active.provider_id,
          active.contact_user_id,
          u.id,
          active.provider_id,
          active.contact_user_id,
          u.id,
          active.contact_user_id,
          active.contact_user_id,
          u.id,
        ) as ThreadMessage[]
    : [];

  const conversation = active ? <EHConversation role="owner" name={`${active.first_name} ${active.last_name}`} detail={active.business_name} phone={active.phone || undefined}
    messages={messages.map(message => ({ id: `${message.source}-${message.id}`, mine: message.sender_id === u.id, author: `${message.sender_id === u.id ? 'Du' : active.first_name}${message.source === 'job' && message.context_title ? ` · Auftrag: ${message.context_title}` : ''}`, body: message.body }))}
    composer={<OwnerMessageComposer contactUserId={active.contact_user_id} peerName={active.first_name} unreadCount={Number(active.unread_count || 0)} />} />
    : entry?.platformUserId ? <EHCallout title="Aktuell keine aktive Nachrichtenverbindung"><p>Der gespeicherte Kontakt und seine Zuordnungen bleiben erhalten. Ein App-Chat ist nur bei einer aktiven Partnerverbindung verfügbar.</p></EHCallout> : undefined;
  return <AppShell role="homeowner" active="/app/messages" title="Ansprechpartner" subtitle="Dein persönliches Netzwerk fürs Haus">
    <EHContactWorkspace categories={CONTACT_DIRECTORY_CATEGORIES} contacts={contacts} mode={mode} mainId={main?.id} subcategoryId={sub?.id} entryId={entryId} query={text('q').slice(0, 200)} requestId={randomUUID()} notice={text('saved') === '1' ? 'Gespeichert. Dein Kontakt und alle Zuordnungen sind aktuell.' : undefined} action={submitDirectoryAction} shortcutAction={submitDirectoryShortcut} conversation={mode === 'detail' ? conversation : undefined} />
  </AppShell>;
}
