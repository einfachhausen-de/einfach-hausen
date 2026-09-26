import { MessageSquare } from 'lucide-react';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import { WerkbankAbschnitt, WerkbankKennzahlen, WerkbankKopf, WerkbankRaster } from '@/components/werkbank-seite';
import { ProviderAccessBoundary, ProviderState } from '@/components/provider/workspace';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { getProviderContext } from '@/lib/provider';
import { EHInbox, EHContactGroup, EHConversation, EHFormFeedback, EHButton, EHRecordList, EHText } from '@/design-system';
import { ProviderMessageComposer } from './thread-client';

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
  const u = await requireUser('provider');
  const ctx = getProviderContext(u.id);

  if (!ctx) {
    return (
      <WerkbankRahmen role="provider" active="/pro/messages">
        <ProviderState
          icon={<MessageSquare size={21} />}
          title="Keinem Unternehmen zugeordnet"
          description="Dein Zugang ist aktuell keinem aktiven Partnerunternehmen zugeordnet. Nachrichten an Kunden können deshalb nicht angezeigt werden."
          action={{ href: '/pro/hilfe', label: 'Hilfe & Kontakt' }}
          tone="unavailable"
        />
      </WerkbankRahmen>
    );
  }

  const sp = await searchParams;

  const customers = db.prepare(`SELECT hc.*,hu.first_name,hu.last_name,hu.phone,hu.email,h.address,h.postcode,j.title last_job_title,
      ((SELECT COUNT(*) FROM contact_messages cm
        WHERE cm.homeowner_id=hc.homeowner_id AND cm.provider_id=hc.provider_id AND cm.contact_user_id=hc.contact_user_id
          AND cm.sender_id<>hc.contact_user_id AND cm.read_at IS NULL)
       + (SELECT COUNT(*) FROM messages jm
          JOIN jobs jj ON jj.id=jm.job_id AND jj.homeowner_id=hc.homeowner_id
          JOIN job_assignments ja ON ja.job_id=jm.job_id AND ja.provider_id=hc.provider_id AND ja.contact_user_id=hc.contact_user_id
          WHERE jm.recipient_id=hc.contact_user_id AND jm.sender_id=hc.homeowner_id AND jm.read_at IS NULL)) unread_count
    FROM homeowner_contacts hc
    JOIN users hu ON hu.id=hc.homeowner_id AND hu.role='homeowner'
    JOIN homeowner_profiles h ON h.user_id=hc.homeowner_id
    LEFT JOIN jobs j ON j.id=hc.last_job_id
    WHERE hc.provider_id=? AND hc.contact_user_id=? ORDER BY hc.updated_at DESC`).all(ctx.providerId, u.id) as any[];
  const requestedId = Number(sp.homeowner);
  const hasRequestedHomeowner = Boolean(sp.homeowner);
  const selected = hasRequestedHomeowner
    ? customers.find((customer) => Number.isSafeInteger(requestedId) && customer.homeowner_id === requestedId)
    : customers[0];
  const selectedId = selected?.homeowner_id;
  const messages = selected
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
          selected.homeowner_id,
          ctx.providerId,
          u.id,
          selected.homeowner_id,
          ctx.providerId,
          u.id,
          selected.homeowner_id,
          u.id,
          u.id,
          selected.homeowner_id,
        ) as ThreadMessage[]
    : [];
  const unreadCount = selected ? Number(selected.unread_count || 0) : 0;
  const unreadTotal = customers.reduce((total, customer) => total + Number(customer.unread_count || 0), 0);
  // Kennzahlen und rechte Spalte lesen denselben Kundenbestand wie die Inbox in
  // der Hauptspalte: Kontakte, ungelesene Nachrichten und der gewaehlte Verlauf.
  const unreadContacts = customers.filter((customer) => Number(customer.unread_count || 0) > 0).length;
  const jobMessages = messages.filter((message) => message.source === 'job').length;

  return (
    <WerkbankRahmen role="provider" active="/pro/messages">
      <WerkbankKopf title="Nachrichten" context={`${customers.length} Kunden · ${unreadTotal} ungelesen`} />

      <ProviderAccessBoundary canManageJobs={ctx.canManageJobs} />

      <WerkbankKennzahlen label="Kundenkontakte" items={[
        { id: 'kunden', label: 'Kunden', value: customers.length, hint: 'direkte Kontakte des Betriebs' },
        { id: 'ungelesen', label: 'Ungelesen', value: unreadTotal, hint: unreadContacts > 0 ? `${unreadContacts} Kontakte warten auf Antwort` : 'alle Nachrichten gelesen' },
        { id: 'verlauf', label: 'Im Verlauf', value: messages.length, hint: selected ? `mit ${selected.first_name} ${selected.last_name}` : 'kein Kontakt gewählt' },
        { id: 'auftraege', label: 'Auftragsnachrichten', value: jobMessages, hint: 'aus laufenden Aufträgen' },
      ]} />

      <WerkbankRaster main={
        customers.length === 0 ? (
        <ProviderState
          icon={<MessageSquare size={21} />}
          title="Noch keine direkten Kontakte"
          description="Sobald dir eine Kontaktanfrage oder ein Auftrag zugewiesen wurde, kann daraus ein direkter Kundenkontakt entstehen."
        />
      ) : (
        <EHInbox contacts={<EHContactGroup title={`Kunden · ${customers.length}`} contacts={customers.map(customer=>({id:String(customer.homeowner_id),href:`/pro/messages?homeowner=${customer.homeowner_id}`,name:`${customer.first_name} ${customer.last_name}`,detail:`${customer.address||customer.postcode} · ${customer.last_job_title||customer.category||'Hausservice'}`,active:customer.homeowner_id===selectedId,unread:Number(customer.unread_count||0)}))}/>}>
          {hasRequestedHomeowner&&!selected?<EHFormFeedback kind="error">Dieser Kundenkontakt ist nicht mehr verfügbar. Wähle einen Kontakt aus deiner Liste.</EHFormFeedback>:selected?<EHConversation role="provider" name={`${selected.first_name} ${selected.last_name}`} detail={`${selected.address||selected.postcode}${selected.last_job_title?` · Letzter Auftrag: ${selected.last_job_title}`:' · Bestehender Kunde'}`} phone={selected.phone}
            messages={messages.map(message=>({id:`${message.source}-${message.id}`,mine:message.sender_id===u.id,author:`${message.sender_id===u.id?'Du':selected.first_name}${message.source==='job'&&message.context_title?` · Auftrag: ${message.context_title}`:''}`,body:message.body}))}
            composer={<ProviderMessageComposer homeownerId={selected.homeowner_id} peerName={selected.first_name} unreadCount={unreadCount}/>}/>:null}
        </EHInbox>
      )} aside={<>
        <WerkbankAbschnitt title="Nächster Schritt">
          {selected
            ? unreadCount > 0
              ? <><EHText>{`${unreadCount} ungelesene ${unreadCount === 1 ? 'Nachricht' : 'Nachrichten'} von ${selected.first_name} ${selected.last_name}.`}</EHText><EHButton href={`/pro/messages?homeowner=${selected.homeowner_id}`} arrow>Kontakt öffnen</EHButton></>
              : <><EHText muted>{`Bei ${selected.first_name} ${selected.last_name} ist alles beantwortet.`}</EHText>{selected.phone && <EHButton href={`tel:${selected.phone}`} variant="secondary">Anrufen</EHButton>}</>
            : <EHText muted>Wähle links einen Kundenkontakt aus.</EHText>}
        </WerkbankAbschnitt>
        <WerkbankAbschnitt title="Kunde">
          {selected ? <EHRecordList label="Kundendaten" items={[
            { id: 'name', title: `${selected.first_name} ${selected.last_name}`, detail: 'Kunde' },
            { id: 'ort', title: selected.address || selected.postcode || 'Kein Ort hinterlegt', detail: 'Ort' },
            { id: 'telefon', title: selected.phone || 'Keine Nummer hinterlegt', detail: 'Telefon' },
            { id: 'auftrag', title: selected.last_job_title || 'Kein Auftrag hinterlegt', detail: 'Letzter Auftrag' },
          ]} /> : <EHText muted>Kein Kontakt ausgewählt.</EHText>}
        </WerkbankAbschnitt>
        <WerkbankAbschnitt title="Gut zu wissen">
          <EHText muted>Der direkte Kundenkontakt ist für Rückfragen und Absprachen da. Angebote und Rechnungen laufen über den jeweiligen Auftrag.</EHText>
          <EHButton href="/pro/orders" variant="secondary" arrow>Aufträge ansehen</EHButton>
        </WerkbankAbschnitt>
      </>} />
    </WerkbankRahmen>
  );
}
