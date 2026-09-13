import { EHOwnerPageHeader, EHOwnerSearch, EHOwnerContacts, EHOwnerLinks, EHConversation, EHWorkflowForm, EHSubmitButton, EHFormFeedback, EHEmptyState, EHErrorState, EHCallout, EHButton, EHField, EHSelect, EHInput } from '@/design-system';
import { AppShell } from '@/components/shell';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { updateContactCategoryAction } from '@/app/actions';
import { groupContactsByCategory, normalizeContactCategory, STANDARD_CONTACT_CATEGORIES } from '@/lib/contact-categories';
import { OwnerMessageComposer } from './thread-client';

type ThreadMessage = {
  source: 'direct' | 'job';
  id: number;
  sender_id: number;
  body: string;
  read_at: string | null;
  created_at: string;
  context_title: string | null;
  job_id: number | null;
};

export default async function Messages({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const u = await requireUser('homeowner');
  const sp = await searchParams;
  const contacts = db.prepare(`SELECT hc.*,u.first_name,u.last_name,u.phone,u.email,m.job_title,p.business_name,j.title last_job_title,
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
    WHERE hc.homeowner_id=? ORDER BY hc.updated_at DESC`).all(u.id) as any[];
  const requestedId = Number(sp.contact);
  const hasRequestedContact = Boolean(sp.contact);
  const selected = hasRequestedContact
    ? contacts.find((contact) => Number.isSafeInteger(requestedId) && contact.contact_user_id === requestedId)
    : contacts[0];
  const selectedCategory = selected ? normalizeContactCategory(selected.category || '') : '';
  const messages = hasRequestedContact && selected
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
          selected.provider_id,
          selected.contact_user_id,
          u.id,
          selected.provider_id,
          selected.contact_user_id,
          u.id,
          selected.contact_user_id,
          selected.contact_user_id,
          u.id,
        ) as ThreadMessage[]
    : [];
  const unreadCount = selected ? Number(selected.unread_count || 0) : 0;
  const rawQuery = typeof sp.q === 'string' ? sp.q : '';
  const query = rawQuery.trim().toLowerCase();
  const activeArea = typeof sp.bereich === 'string' ? sp.bereich : '';
  const returnParams = new URLSearchParams();
  if (rawQuery) returnParams.set('q', rawQuery);
  if (activeArea) returnParams.set('bereich', activeArea);
  const directoryHref = `/app/messages${returnParams.size ? `?${returnParams}` : ''}`;
  const contactHref = (id: number) => {
    const params = new URLSearchParams(returnParams);
    params.set('contact', String(id));
    return `/app/messages?${params}`;
  };
  const directoryContacts = contacts.filter((contact: any) => {
    const area = normalizeContactCategory(contact.category || '');
    if (activeArea && area !== activeArea) return false;
    if (!query) return true;
    const haystack = `${contact.first_name || ''} ${contact.last_name || ''} ${contact.business_name || ''} ${contact.job_title || ''} ${contact.last_job_title || ''} ${area}`.toLowerCase();
    return haystack.includes(query);
  });
  const directoryGrouped = groupContactsByCategory(directoryContacts);
  const areas = [...new Set(contacts.map((contact: any) => normalizeContactCategory(contact.category || '')))].sort((a,b) => a.localeCompare(b,'de'));

  return <AppShell role="homeowner" active="/app/messages" title="Ansprechpartner" subtitle="Dein persönliches Netzwerk fürs Haus">
    <EHOwnerPageHeader title="Deine Ansprechpartner" text="Deine bestehenden Kontakte. Direkt schreiben, anrufen und Absprachen wiederfinden." action={{href:"/app/hausmeister",label:"Ansprechpartner finden"}} />
    {contacts.length === 0 ? <EHEmptyState title="Noch keine Ansprechpartner" text="Beschreibe im Hausmanager, wen du suchst, und wähle „Ansprechpartner finden“. Nach der Vermittlung bleibt der Kontakt hier erhalten." action={<EHButton href="/app/hausmeister" arrow>Ansprechpartner finden</EHButton>} /> : <>
      {!(hasRequestedContact && selected) && (
      <>
        <EHOwnerSearch action="/app/messages" query={rawQuery} placeholder="Name, Betrieb oder Auftrag" areas={areas} area={activeArea} />
        {directoryGrouped.length === 0 ? <EHEmptyState title="Keine passenden Ansprechpartner" text="Ändere den Suchbegriff oder wähle einen anderen Bereich." action={<EHButton href="/app/messages" variant="secondary">Filter zurücksetzen</EHButton>} /> : <EHOwnerContacts groups={directoryGrouped.map(([category,rows]) => ({title:category,contacts:(rows as any[]).map((contact:any)=>({id:String(contact.contact_user_id),name:`${contact.first_name} ${contact.last_name}`,company:contact.business_name,role:contact.job_title || undefined,context:contact.last_job_title || undefined,href:contactHref(contact.contact_user_id),phone:contact.phone || undefined,unread:Number(contact.unread_count || 0)}))}))} />}
        <EHOwnerLinks items={[{href:'/app/hausmeister',title:'Ein weiterer Kontakt fehlt?',text:'Beschreibe dein Anliegen im Hausmanager und suche einen passenden Betrieb.'}]} />
      </>
      )}
      {hasRequestedContact && !selected && <EHErrorState text="Dieser Ansprechpartner ist nicht mehr verfügbar. Wähle einen Kontakt aus deiner Liste." />}
      {hasRequestedContact && selected ? (
      <>
      <EHButton href={directoryHref} variant="quiet">Zurück zu deinen Ansprechpartnern</EHButton>
        {selected&&<EHConversation role="owner" name={`${selected.first_name} ${selected.last_name}`} detail={`${selected.job_title||'Ansprechpartner'} · ${selected.business_name} · ${selectedCategory}`} phone={selected.phone}
          messages={messages.map(message=>({id:`${message.source}-${message.id}`,mine:message.sender_id===u.id,author:`${message.sender_id===u.id?'Du':selected.first_name}${message.source==='job'&&message.context_title?` · Auftrag: ${message.context_title}`:''}`,body:message.body}))}
          composer={<OwnerMessageComposer contactUserId={selected.contact_user_id} peerName={selected.first_name} unreadCount={unreadCount}/>}
          settings={<>
            {sp.category==='saved'&&<EHFormFeedback kind="success">Bereich gespeichert.</EHFormFeedback>}
            <details><summary>Bereich ändern</summary><EHWorkflowForm action={updateContactCategoryAction.bind(null,selected.contact_user_id)}>
              <EHField id="contact-category" label="Standardbereich"><EHSelect id="contact-category" name="category" defaultValue={STANDARD_CONTACT_CATEGORIES.includes(selectedCategory as any)?selectedCategory:'Haus & Allgemein'}>{STANDARD_CONTACT_CATEGORIES.map(category=><option value={category} key={category}>{category}</option>)}</EHSelect></EHField>
              <EHField id="contact-custom" label="Eigener Bereich (optional)" hint="Ein eigener Bereich ersetzt den Standardbereich."><EHInput id="contact-custom" name="customCategory" aria-describedby="contact-custom-hint" maxLength={60} placeholder={STANDARD_CONTACT_CATEGORIES.includes(selectedCategory as any)?'z. B. Pool & Sauna':selectedCategory}/></EHField>
              <EHSubmitButton>Bereich speichern</EHSubmitButton>
            </EHWorkflowForm></details>
          </>}/>} 
      </>
      ) : null}
      {hasRequestedContact && selected && <EHCallout title="Bestehende Kundenbeziehung"><p>Dieser Kontakt bleibt Teil deiner Hausakte. Für direkte Folgearbeiten ist keine neue Partnervermittlung nötig.</p></EHCallout>}
    </>}
  </AppShell>;
}
