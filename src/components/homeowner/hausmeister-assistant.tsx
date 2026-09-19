import { Mail, MessageCircle, Phone, UserRound } from 'lucide-react';
import { EHButton } from '@/design-system';
import { getSupportContacts } from '@/config/contacts';

export function HausmeisterAssistant({
  showConsultationLink = true,
}: {
  showConsultationLink?: boolean;
}) {
  const contacts = getSupportContacts();
  const hasDirectChannel = Boolean(contacts.email || contacts.phone || contacts.whatsapp);

  return (
    <section className="claim-form" aria-labelledby="human-handoff-title">
      <div>
        <strong id="human-handoff-title">Lieber mit einem Menschen sprechen?</strong>
        <p>
          Über „Ansprechpartner finden“ entsteht nur eine Kontaktanfrage. Ein Auftrag, Angebot oder Preis wird dadurch nicht ausgelöst.
        </p>
      </div>
      {showConsultationLink && (
        <EHButton href="/app/consultation">
          <UserRound size={16} aria-hidden="true" /> Ansprechpartner finden
        </EHButton>
      )}
      {hasDirectChannel ? (
        <div className="direct-contact-actions" aria-label="Direkte Support-Kanäle">
          {contacts.whatsapp && (
            <a className="btn ghost" href={contacts.whatsapp.href} target="_blank" rel="noreferrer">
              <MessageCircle size={16} aria-hidden="true" /> WhatsApp
            </a>
          )}
          {contacts.email && (
            <a className="btn ghost" href={contacts.email.href}>
              <Mail size={16} aria-hidden="true" /> E-Mail
            </a>
          )}
          {contacts.phone && (
            <a className="btn ghost" href={contacts.phone.href}>
              <Phone size={16} aria-hidden="true" /> Anrufen
            </a>
          )}
        </div>
      ) : (
        <p className="muted" role="status">
          Telefon, E-Mail und WhatsApp werden hier erst angezeigt, wenn dafür echte Support-Kontaktdaten hinterlegt sind. Die Kontaktanfrage in der App ist bereits verfügbar.
        </p>
      )}
    </section>
  );
}
