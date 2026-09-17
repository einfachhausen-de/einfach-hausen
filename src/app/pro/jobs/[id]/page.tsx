import { notFound } from 'next/navigation';
import {
  CalendarDays,
  MapPin,
  MessageSquare,
  Phone,
  ReceiptText,
  UserRound,
  XCircle,
} from 'lucide-react';
import { AppShell } from '@/components/shell';
import {
  ProviderAccessBoundary,
  ProviderNextStep,
  ProviderState,
} from '@/components/provider/workspace';
import { JobMedia } from '@/components/job-media';
import { mediaKindFromPath } from '@/lib/intake-media';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  acceptContactRequestAction,
  assignJobContactAction,
  declineDispatchAction,
  markCompleteAction,
  markInProgressAction,
  sendMessageAction,
  sendSavedContactMessageAction,
  submitQuoteAction,
} from '@/app/actions';
import { dateLabel, euro, statusLabel } from '@/lib/format';
import { canAccessProviderJob, getProviderMembers } from '@/lib/provider';
import { DocumentForm } from './document-form';
import { InvoiceForm } from './invoice-form';
import { invoiceStatusLabel } from '@/lib/invoices';
import { SubmitButton } from '@/components/ui/submit-button';
import { EHErrorState, EHList, EHCallout, EHStatus, EHQuoteForm, EHAssignmentForm, EHJobMessageForm, EHAttachmentPanel, EHWorkspaceGrid, EHWorkSection, EHPageHeader, EHRecordList, EHText, EHButton, EHMetricsBar, type EHRecordEntry } from '@/design-system';

export default async function ProJob({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const u = await requireUser('provider');
  const { id } = await params;
  const sp = await searchParams;
  const jobId = Number(id);
  const ctx = canAccessProviderJob(u.id, jobId);
  if (!ctx) notFound();

  const access = db.prepare(`SELECT d.status dispatch_status,d.distance_km,d.match_score,j.*,h.address,h.postcode homeowner_postcode,hu.first_name homeowner_first,hu.last_name homeowner_last,hu.phone homeowner_phone,(SELECT id FROM job_photos x WHERE x.job_id=j.id LIMIT 1) photo_id,(SELECT path FROM job_photos x WHERE x.job_id=j.id LIMIT 1) photo_path
    FROM job_dispatches d JOIN jobs j ON j.id=d.job_id JOIN homeowner_profiles h ON h.user_id=j.homeowner_id JOIN users hu ON hu.id=j.homeowner_id
    WHERE d.job_id=? AND d.provider_id=?`).get(jobId, ctx.providerId) as any;
  if (!access) notFound();

  const isContact = access.request_kind === 'contact';
  const quote = isContact
    ? null
    : db.prepare('SELECT * FROM quotes WHERE job_id=? AND provider_id=?').get(access.id, ctx.providerId) as any;
  const isAccepted = isContact
    ? access.dispatch_status === 'accepted'
    : quote?.status === 'accepted' || access.dispatch_status === 'accepted';

  if (!ctx.canManageJobs && !isAccepted) notFound();

  const assignment = isAccepted
    ? db.prepare(`SELECT a.*,u.first_name,u.last_name,u.phone,u.email,m.job_title FROM job_assignments a JOIN users u ON u.id=a.contact_user_id JOIN provider_members m ON m.user_id=a.contact_user_id WHERE a.job_id=?`).get(access.id) as any
    : null;

  if (!ctx.canManageJobs && assignment?.contact_user_id !== u.id) notFound();

  const members = ctx.canManageJobs ? getProviderMembers(ctx.providerId) : [];
  const prefs = db.prepare('SELECT * FROM provider_preferences WHERE provider_id=?').get(ctx.providerId) as any;
  const docs = !isContact && isAccepted
    ? db.prepare('SELECT * FROM documents WHERE job_id=? AND provider_id=? ORDER BY created_at DESC').all(access.id, ctx.providerId) as any[]
    : [];
  const invoices = !isContact && isAccepted
    ? db.prepare('SELECT * FROM invoices WHERE job_id=? AND provider_id=? ORDER BY created_at DESC').all(access.id, ctx.providerId) as any[]
    : [];
  const claim = !isContact && isAccepted
    ? db.prepare('SELECT * FROM claims WHERE job_id=?').get(access.id) as any
    : null;
  const messages = assignment?.contact_user_id === u.id
    ? (isContact
        ? db.prepare('SELECT * FROM contact_messages WHERE homeowner_id=? AND contact_user_id=? ORDER BY created_at').all(access.homeowner_id, u.id)
        : db.prepare('SELECT * FROM messages WHERE job_id=? ORDER BY created_at').all(access.id)) as any[]
    : [];
  const mine = assignment?.contact_user_id === u.id;

  const statusText = isContact ? (isAccepted ? 'Verbunden' : 'Kontakt gesucht') : statusLabel(access.status);
  // Der naechste Schritt haengt am Vorgangsstand und an der Rolle im Betrieb; die
  // Formulare selbst bleiben in der Hauptspalte.
  const nextStep: { text: string; href?: string; label?: string } = !isAccepted
    ? ctx.canManageJobs
      ? access.status === 'completed'
        ? { text: 'Dieser Vorgang ist abgeschlossen. Es ist keine Aktion mehr offen.' }
        : isContact
          ? { text: 'Ansprechpartner auswählen und den Kontakt übernehmen.' }
          : { text: 'Angebot senden: Preis, frühesten realistischen Termin und Leistungsumfang festlegen.' }
      : { text: 'Nur die Betriebsleitung kann diesen Vorgang annehmen.' }
    : !assignment
      ? { text: 'Ansprechpartner festlegen, damit die weitere Bearbeitung eindeutig ist.' }
      : !mine
        ? { text: 'Dieser Vorgang liegt bei einem anderen Ansprechpartner des Betriebs.' }
        : isContact
          ? { text: 'Eigentümer direkt anschreiben und die fachliche Frage klären.', href: `/pro/messages?homeowner=${access.homeowner_id}`, label: 'Nachricht öffnen' }
          : access.status === 'accepted'
            ? { text: 'Arbeit starten, sobald Termin und Ausführung mit dem Kunden abgestimmt sind.' }
            : access.status === 'in_progress'
              ? { text: 'Auftrag abschließen, wenn die vereinbarte Leistung vollständig erledigt ist.' }
              : access.status === 'completed'
                ? { text: 'Rechnung erstellen und dem Eigentümer senden.' }
                : { text: 'Für diesen Vorgang ist kein nächster Schritt hinterlegt.' };
  const glance: EHRecordEntry[] = [
    { id: 'status', title: statusText, detail: 'Status' },
    { id: 'bereich', title: access.category || 'Ohne Bereich', detail: 'Bereich' },
    { id: 'ort', title: isAccepted && access.address ? access.address : access.postcode, detail: 'Ort', icon: <MapPin size={20} /> },
    ...(!isContact ? [{ id: 'termin', title: dateLabel(access.preferred_date), detail: 'Wunschtermin', icon: <CalendarDays size={20} /> }] : []),
    ...(!isContact ? [{
      id: 'richtpreis',
      title: access.budget_min && access.budget_max
        ? `${euro(access.budget_min)} – ${euro(access.budget_max)}`
        : euro(access.budget_max),
      detail: 'Richtpreis',
      icon: <ReceiptText size={20} />,
    }] : []),
  ];

  return (
    <AppShell
      role="provider"
      active={isAccepted ? '/pro/orders' : '/pro'}
      title={isContact ? 'Kontaktanfrage' : isAccepted ? 'Auftrag' : 'Anfrage'}
      subtitle={access.category}
    >
      {sp.error && <EHErrorState text={sp.error} />}

      <EHMetricsBar label="Stand des Vorgangs" items={[
        { id: 'status', label: 'Status', value: statusText, hint: [access.category, Number.isFinite(access.distance_km) ? `${access.distance_km.toFixed(1)} km entfernt` : null].filter(Boolean).join(' · ') },
        { id: 'angebot', label: 'Eigenes Angebot', value: isContact ? 'Ohne Preis' : quote ? euro(quote.amount) : 'offen', hint: isContact ? 'Kontaktanfrage ohne Auftragswert' : quote ? (quote.available_at ? `Verfügbar ${dateLabel(quote.available_at)}` : 'Termin nach Abstimmung') : 'Preis und Termin noch offen' },
        { id: 'nachrichten', label: 'Nachrichten', value: messages.length, hint: mine ? `mit ${access.homeowner_first}` : assignment ? 'bei einem anderen Ansprechpartner' : 'noch kein Kundenkontakt' },
        { id: 'unterlagen', label: 'Unterlagen', value: docs.length + invoices.length, hint: isAccepted ? `${invoices.length} Rechnungen · ${docs.length} Nachweise` : 'erst nach Annahme' },
      ]} />

      <EHWorkspaceGrid main={<>
      <EHPageHeader
        title={access.title.replace(/^Ansprechpartner:\s*/, '')}
        context={[statusText, access.category].filter(Boolean).join(' · ')}
      />
      <EHWorkSection title="Anliegen">
        <EHText>{access.description || 'Keine Beschreibung hinterlegt.'}</EHText>
        {access.photo_id && (
          <JobMedia
            src={`/api/job-media/${access.photo_id}`}
            alt="Foto, Video oder Sprachnachricht zum Thema"
            kind={mediaKindFromPath(access.photo_path)}
          />
        )}
      </EHWorkSection>
</>} aside={<>
      <EHWorkSection title="Nächster Schritt">
        <EHText muted={!nextStep.href}>{nextStep.text}</EHText>
        {nextStep.href && <EHButton href={nextStep.href} arrow>{nextStep.label}</EHButton>}
      </EHWorkSection>
      <EHWorkSection title="Auf einen Blick">
        <EHRecordList label="Auftrag auf einen Blick" items={glance} />
      </EHWorkSection>
      <EHWorkSection title="Kunde">
        <EHRecordList label="Kundendaten" items={[
          { id: 'name', title: `${access.homeowner_first} ${access.homeowner_last}`.trim() || 'Ohne Namen', detail: 'Eigentümer' },
          { id: 'ort', title: access.address || access.postcode || 'Kein Ort hinterlegt', detail: 'Ort' },
          { id: 'telefon', title: mine ? (access.homeowner_phone || 'Keine Nummer hinterlegt') : 'Erst nach Zuweisung sichtbar', detail: 'Telefon' },
        ]} />
      </EHWorkSection>
</>} />

      <ProviderAccessBoundary canManageJobs={ctx.canManageJobs} />

      {!isAccepted && ctx.canManageJobs && access.status !== 'completed' && isContact && (
        <>
          <EHCallout title="Nur persönlicher Ansprechpartner gesucht">
            <p>Der Eigentümer möchte zunächst einen fachlichen Menschen sprechen. Es wird noch kein Auftrag und kein Preis vereinbart.</p>
          </EHCallout>
          <ProviderNextStep description="Konkreten Ansprechpartner auswählen und den Kontakt übernehmen.">
            <EHAssignmentForm
              id="provider-accept-contact"
              action={acceptContactRequestAction.bind(null, access.id)}
              mode="accept-contact"
              contacts={members.map((member) => ({ id: member.user_id, label: `${member.first_name} ${member.last_name}${member.user_id === u.id ? ' · Ich' : ''} · ${member.job_title || 'Ansprechpartner'}` }))}
              selectedId={u.id}
            />
          </ProviderNextStep>
          <form action={declineDispatchAction.bind(null, access.id)} className="decline-form">
            <SubmitButton className="btn ghost pro-ghost wide" pendingLabel="Wird abgelehnt…"><XCircle size={16} />Kontaktanfrage ablehnen</SubmitButton>
          </form>
        </>
      )}

      {!isAccepted && ctx.canManageJobs && access.status !== 'completed' && !isContact && (
        <>
          {access.urgency === 'emergency' && (
            <div className="pro-emergency-note" role="status">
              <strong>🚨 Notfallanfrage</strong>
              <p>
                {Number.isFinite(access.distance_km) ? `${access.distance_km.toFixed(1)} km entfernt · ` : ''}
                {prefs?.emergency_mode === '24_7' ? '24/7-Bereitschaft aktiv' : `deine Bereitschaft ${prefs?.emergency_start || '–'}–${prefs?.emergency_end || '–'} Uhr`}
                {prefs?.emergency_markup_bps ? ` · maximal ${(prefs.emergency_markup_bps / 100).toFixed(0)} % Notfallzuschlag` : ' · kein hinterlegter Notfallzuschlag'}.
                Gib im Angebot den tatsächlichen Gesamtpreis und den frühesten realistischen Termin an.
              </p>
            </div>
          )}
          <ProviderNextStep
            title={access.urgency === 'emergency' ? 'Notfall beantworten' : 'Nächster Schritt'}
            description="Preis, frühesten realistischen Termin und Leistungsumfang als Angebot senden."
          >
            <EHQuoteForm
              id="provider-quote"
              action={submitQuoteAction.bind(null, access.id)}
              amountCents={quote?.amount}
              availableAt={quote?.available_at || ''}
              message={quote?.message || ''}
              updating={Boolean(quote)}
            />
          </ProviderNextStep>
          {!quote && (
            <form action={declineDispatchAction.bind(null, access.id)} className="decline-form">
              <SubmitButton className="btn ghost pro-ghost wide" pendingLabel="Wird abgelehnt…"><XCircle size={16} />Anfrage ablehnen</SubmitButton>
            </form>
          )}
        </>
      )}

      {isAccepted && (
        <>
          <div role="status">
            <EHStatus tone="success">{isContact ? 'Du bist mit dem Eigentümer verbunden. Noch kein Auftrag.' : `Kunde hat den Auftrag bei ${ctx.businessName} gebucht.`}</EHStatus>
          </div>

          <EHWorkSection title="Ansprechpartner">
            <EHRecordList label="Ansprechpartner" items={[{
              id: 'ansprechpartner',
              title: assignment ? `${assignment.first_name} ${assignment.last_name}` : 'Noch nicht zugewiesen',
              detail: assignment?.job_title || 'Bitte Ansprechpartner auswählen',
              status: mine ? <EHStatus tone="success">Du</EHStatus> : undefined,
              icon: <UserRound size={20} />,
            }]} />
          </EHWorkSection>

          {ctx.canManageJobs && !assignment && (
            <ProviderNextStep description="Einen konkreten Ansprechpartner festlegen, damit die weitere Bearbeitung eindeutig ist.">
              <EHAssignmentForm
                id="provider-assign-contact"
                action={assignJobContactAction.bind(null, access.id)}
                mode="assign"
                contacts={members.map((member) => ({ id: member.user_id, label: `${member.first_name} ${member.last_name}${member.user_id === u.id ? ' · Ich' : ''} · ${member.job_title || 'Ansprechpartner'}` }))}
                selectedId={u.id}
              />
            </ProviderNextStep>
          )}

          {ctx.canManageJobs && assignment && (
            <details className="provider-disclosure">
              <summary>Ansprechpartner ändern</summary>
              <EHAssignmentForm
                id="provider-reassign-contact"
                action={assignJobContactAction.bind(null, access.id)}
                mode="reassign"
                contacts={members.map((member) => ({ id: member.user_id, label: `${member.first_name} ${member.last_name}${member.user_id === u.id ? ' · Ich' : ''} · ${member.job_title || 'Ansprechpartner'}` }))}
                selectedId={assignment.contact_user_id}
              />
            </details>
          )}

          {mine && isContact && (
            <ProviderNextStep description="Eigentümer direkt anschreiben und die fachliche Frage klären.">
              <a className="provider-primary-action" href={`/pro/messages?homeowner=${access.homeowner_id}`}>
                Nachricht öffnen <MessageSquare size={16} />
              </a>
            </ProviderNextStep>
          )}

          {mine && !isContact && access.status === 'accepted' && (
            <ProviderNextStep description="Arbeit starten, sobald Termin und Ausführung mit dem Kunden abgestimmt sind.">
              <form action={markInProgressAction.bind(null, access.id)}>
                <SubmitButton className="btn light" pendingLabel="Wird gestartet…">Arbeit starten</SubmitButton>
              </form>
            </ProviderNextStep>
          )}

          {mine && !isContact && access.status === 'in_progress' && (
            <ProviderNextStep description="Auftrag abschließen, wenn die vereinbarte Leistung vollständig erledigt ist.">
              <form action={markCompleteAction.bind(null, access.id)}>
                <SubmitButton className="btn light" pendingLabel="Wird gespeichert…">Als erledigt markieren</SubmitButton>
              </form>
            </ProviderNextStep>
          )}

          {mine && !isContact && access.status === 'completed' && (
            <ProviderNextStep description="Rechnung prüfen, erstellen und dem Eigentümer senden.">
              <InvoiceForm
                  buyer={`${access.homeowner_first} ${access.homeowner_last}`.trim()}
                  job={access.title}
                jobId={access.id}
                defaultAmount={quote?.amount || access.budget_max || 0}
                primary
                open
              />
            </ProviderNextStep>
          )}

          {mine && (
            <>
              <EHWorkSection title="Kundenkontakt">
              <div className="direct-contact-actions">
                {!isContact && (
                  <a className="btn ghost pro-ghost" href={`/pro/messages?homeowner=${access.homeowner_id}`}>
                    <MessageSquare size={16} />Direkt schreiben
                  </a>
                )}
                {access.homeowner_phone && (
                  <a className="btn ghost pro-ghost" href={`tel:${access.homeowner_phone}`}>
                    <Phone size={16} />Anrufen
                  </a>
                )}
              </div>
              <div className="partner-job-note">
                <strong>{access.homeowner_first} {access.homeowner_last}</strong>
                <p>
                  {isContact
                    ? 'Du bist der persönliche Ansprechpartner für dieses Thema. Beantworte Fragen direkt. Falls daraus Arbeit entsteht, entscheidet der Kunde separat, ob ein Auftrag organisiert werden soll.'
                    : 'Du bist der persönliche Ansprechpartner. Stimme Termin und Rückfragen direkt mit dem Kunden ab. Einfach Hausen bleibt für Vermittlung, Hausakte und Servicefälle im Hintergrund verfügbar.'}
                </p>
              </div>

              <div className="chat pro-chat">
                {messages.length === 0 && (
                  <div className="contact-chat-intro">
                    <MessageSquare />
                    <p>Noch keine Nachricht in diesem Vorgang. Nutze den Kundenkontakt nur für konkrete Rückfragen oder Absprachen.</p>
                  </div>
                )}
                {messages.map((message: any) => (
                  <div className={message.sender_id === u.id ? 'msg mine' : 'msg'} key={message.id}>
                    <small>{message.sender_id === u.id ? 'Du' : access.homeowner_first}</small>
                    <p>{message.body}</p>
                  </div>
                ))}
                <EHJobMessageForm
                  id="provider-job-message"
                  action={isContact
                    ? sendSavedContactMessageAction.bind(null, u.id, access.homeowner_id)
                    : sendMessageAction.bind(null, access.id, access.homeowner_id)}
                />
              </div>
              </EHWorkSection>
            </>
          )}

          {claim && (
            <div className="claim-notice pro-claim" role="status">
              <div>
                <strong>Servicefall · {statusLabel(claim.status)}</strong>
                <p>{claim.description}</p>
                {claim.admin_note && <small>Plattform-Rückmeldung: {claim.admin_note}</small>}
              </div>
            </div>
          )}

          {mine && !isContact && (
            <>
              <EHWorkSection title={`Rechnungen · ${invoices.length}`}>
              {invoices.length > 0 ? (
                <EHList label="Rechnungen" items={invoices.map((invoice) => ({
                  id: String(invoice.id),
                  title: `${invoice.invoice_number} · ${euro(invoice.total_gross)}`,
                  text: `${invoiceStatusLabel(invoice.status)} · fällig ${dateLabel(invoice.due_date)}`,
                  href: `/pro/invoices/${invoice.id}`,
                }))} />
              ) : (
                <ProviderState
                  compact
                  icon={<ReceiptText size={20} />}
                  title="Noch keine Rechnung"
                  description="Erstelle die Rechnung, sobald die Leistung und der abzurechnende Umfang feststehen."
                />
              )}
              {access.status !== 'completed' && (
                <InvoiceForm
                  buyer={`${access.homeowner_first} ${access.homeowner_last}`.trim()}
                  job={access.title}
                  jobId={access.id}
                  defaultAmount={quote?.amount || access.budget_max || 0}
                />
              )}

              <EHAttachmentPanel files={docs.map((document) => ({id: String(document.id), name: document.title, kind: document.kind, detail: 'Unterlage zum Auftrag', href: `/api/documents/${document.id}`}))} upload={<DocumentForm jobId={access.id} />} />
              </EHWorkSection>
            </>
          )}
        </>
      )}
    </AppShell>
  );
}
