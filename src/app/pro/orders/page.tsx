import { ClipboardList, UserRound } from 'lucide-react';
import { EHButton, EHMetricsBar, EHPageHeader, EHRecordList, EHRecordViews, EHStatus, EHText, EHWorkSection, EHWorkspaceGrid, type EHRecordEntry } from '@/design-system';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import { ProviderAccessBoundary, ProviderState } from '@/components/provider/workspace';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { euroExact, statusLabel } from '@/lib/format';
import { getProviderContext } from '@/lib/provider';

const DONE_STATUSES = new Set(['completed', 'closed']);
// Stornierte Vorgaenge sind kein Erfolg: sie zaehlen nicht zu Abgeschlossen und
// bekommen ihren eigenen Status-Ton und ihre eigene Sektion.
const CANCELLED_STATUS = 'cancelled';

type OrderItem = EHRecordEntry & { _done: boolean; _contact: boolean; _cancelled: boolean; _amount: number | null };

export default async function Orders() {
  const u = await requireUser('provider');
  const ctx = getProviderContext(u.id);

  if (!ctx) {
    return (
      <WerkbankRahmen role="provider" active="/pro/orders">
        <ProviderState
          icon={<ClipboardList size={21} />}
          title="Keinem Unternehmen zugeordnet"
          description="Dein Zugang ist aktuell keinem aktiven Partnerunternehmen zugeordnet. Aufträge und Kontakte können deshalb nicht angezeigt werden."
          action={{ href: '/pro/hilfe', label: 'Hilfe & Kontakt' }}
          tone="unavailable"
        />
      </WerkbankRahmen>
    );
  }

  const rows = ctx.canManageJobs
    ? db.prepare(`SELECT j.*,q.amount,q.status quote_status,a.contact_user_id,cu.first_name contact_first,cu.last_name contact_last
        FROM jobs j
        JOIN job_dispatches d ON d.job_id=j.id AND d.provider_id=?
        LEFT JOIN quotes q ON q.job_id=j.id AND q.provider_id=?
        LEFT JOIN job_assignments a ON a.job_id=j.id LEFT JOIN users cu ON cu.id=a.contact_user_id
        WHERE (j.request_kind='contact' AND d.status='accepted') OR q.id IS NOT NULL
        ORDER BY j.updated_at DESC`).all(ctx.providerId, ctx.providerId) as any[]
    : db.prepare(`SELECT j.*,q.amount,q.status quote_status,a.contact_user_id,cu.first_name contact_first,cu.last_name contact_last
        FROM job_assignments a JOIN jobs j ON j.id=a.job_id LEFT JOIN quotes q ON q.id=j.accepted_quote_id JOIN users cu ON cu.id=a.contact_user_id
        WHERE a.provider_id=? AND a.contact_user_id=? ORDER BY j.updated_at DESC`).all(ctx.providerId, u.id) as any[];

  const toItem = (row: any) => {
    const isContact = row.request_kind === 'contact';
    return {
      id: String(row.id),
      title: String(row.title ?? '').replace(/^Ansprechpartner:\s*/, ''),
      detail: [isContact ? 'Persönlicher Ansprechpartner' : `Angebot ${statusLabel(row.quote_status)}`, row.contact_first ? `${row.contact_first} ${row.contact_last}` : 'Noch nicht zugewiesen'].filter(Boolean).join(' · '),
      value: isContact ? 'Ohne Preis' : euroExact(row.amount),
      status: <EHStatus tone={DONE_STATUSES.has(String(row.status ?? '')) ? 'success' : String(row.status) === CANCELLED_STATUS ? 'warning' : 'neutral'}>{isContact ? 'Kontakt' : statusLabel(row.status)}</EHStatus>,
      icon: isContact ? <UserRound size={20} /> : <ClipboardList size={20} />,
      href: `/pro/jobs/${row.id}`,
      _done: !isContact && DONE_STATUSES.has(String(row.status ?? '')),
      _cancelled: !isContact && String(row.status) === CANCELLED_STATUS,
      _contact: isContact,
      _amount: typeof row.amount === 'number' ? row.amount : null,
    };
  };
  const items: OrderItem[] = rows.map(toItem);
  const activeJobs = items.filter((i) => !i._contact && !i._done && !i._cancelled);
  const contacts = items.filter((i) => i._contact);
  const done = items.filter((i) => i._done);
  const cancelled = items.filter((i) => i._cancelled);
  // Das offene Volumen summiert nur die Angebotsbetraege der aktiven Auftraege;
  // Kontakte tragen bewusst keinen Preis und bleiben deshalb aussen vor.
  const openVolume = activeJobs.reduce((sum, item) => sum + (item._amount ?? 0), 0);
  const withoutQuote = activeJobs.filter((item) => item._amount === null);

  return (
    <WerkbankRahmen role="provider" active="/pro/orders">
      <EHPageHeader title="Aufträge & Kontakte" context={`${items.length} Vorgänge im aktuellen Zugriff`} />

      <ProviderAccessBoundary canManageJobs={ctx.canManageJobs} />

      {items.length > 0 && (
        <EHMetricsBar label="Vorgänge" items={[
          { id: 'aktiv', label: 'Aktive Aufträge', value: activeJobs.length, hint: 'Vorbereiten oder fortführen' },
          { id: 'kontakte', label: 'Kontakte', value: contacts.length, hint: 'Persönliche Ansprechpartner' },
          { id: 'abgeschlossen', label: 'Abgeschlossen', value: done.length, hint: 'Erfolgreich beendet' },
          { id: 'storniert', label: 'Storniert', value: cancelled.length, hint: 'Abgebrochen' },
          { id: 'volumen', label: 'Offenes Volumen', value: euroExact(openVolume), hint: 'Angebotssumme aktiver Aufträge' },
        ]} />
      )}

      <EHWorkspaceGrid main={<>
        {items.length === 0 && (
          <EHWorkSection title="Arbeitsliste · 0 Vorgänge im aktuellen Zugriff.">
            <ProviderState
              icon={<ClipboardList size={21} />}
              title="Noch keine Aufträge oder Kontakte"
              description={ctx.canManageJobs ? 'Sobald ein Kontakt übernommen oder ein Angebot gesendet wurde, bleibt der Vorgang hier bis zum Abschluss nachvollziehbar.' : 'Sobald dir ein Vorgang zugewiesen wurde, erscheint er hier.'}
              action={{ href: '/pro#kundenanfragen', label: 'Offene Anfragen ansehen' }}
            />
          </EHWorkSection>
        )}

        {items.length > 0 && (
          <div id="pro-orders-active">
            <EHWorkSection title={`Aktive Aufträge · ${activeJobs.length}`}>
              {activeJobs.length > 0 ? <EHRecordViews searchLabel="Aktive Aufträge suchen" label="Aktive Aufträge" items={activeJobs} storageKey="pro-auftraege-aktiv" switcherLabel="Aktive Aufträge: Ansicht wechseln" /> : (
                <ProviderState compact icon={<ClipboardList size={21} />} title="Keine aktiven Aufträge" description="Sobald ein Angebot angenommen oder ein Auftrag zugewiesen wurde, erscheint er hier." />
              )}
            </EHWorkSection>
          </div>
        )}

        {items.length > 0 && (
          <div id="pro-orders-contacts">
            <EHWorkSection title={`Kontakte · ${contacts.length}`}>
              {contacts.length > 0 ? <EHRecordViews searchLabel="Kontakte suchen" label="Persönliche Ansprechpartner" items={contacts} storageKey="pro-auftraege-kontakte" /> : (
                <ProviderState compact icon={<ClipboardList size={21} />} title="Keine Kontakte" description="Sobald du einen Kundenkontakt übernimmst, bleibt er hier nachvollziehbar." />
              )}
            </EHWorkSection>
          </div>
        )}

        {items.length > 0 && (
          <div id="pro-orders-done">
            <EHWorkSection title={`Abgeschlossen · ${done.length}`}>
              {done.length > 0 ? <EHRecordViews searchLabel="Abgeschlossene Vorgänge suchen" label="Erledigte Vorgänge" items={done} storageKey="pro-auftraege-erledigt" /> : (
                <ProviderState compact icon={<ClipboardList size={21} />} title="Noch nichts abgeschlossen" description="Erledigte Vorgänge bleiben hier zur Nachvollziehbarkeit erhalten." />
              )}
            </EHWorkSection>
          </div>
        )}
        {items.length > 0 && (
          <div id="pro-orders-cancelled">
            <EHWorkSection title={`Storniert · ${cancelled.length}`}>
              {cancelled.length > 0 ? <EHRecordViews searchLabel="Stornierte Vorgänge suchen" label="Stornierte Vorgänge" items={cancelled} storageKey="pro-auftraege-storniert" /> : (
                <ProviderState compact icon={<ClipboardList size={21} />} title="Nichts storniert" description="Abgebrochene Vorgänge bleiben hier getrennt von den erfolgreichen sichtbar." />
              )}
            </EHWorkSection>
          </div>
        )}
      </>} aside={<>
        <EHWorkSection title="Ohne Angebot">
          {items.length === 0
            ? <EHText muted>Ohne Vorgänge gibt es nichts vorzubereiten. Neue Anfragen erscheinen unter „Offene Anfragen“.</EHText>
            : withoutQuote.length > 0
              ? <EHRecordList label="Aktive Aufträge ohne hinterlegtes Angebot" items={withoutQuote} />
              : <EHText muted>Für alle aktiven Aufträge ist ein Angebot hinterlegt.</EHText>}
        </EHWorkSection>
        <EHWorkSection title="Zuletzt abgeschlossen">
          <EHRecordList label="Zuletzt abgeschlossene Vorgänge" items={done.slice(0, 3)} empty="Noch nichts abgeschlossen." />
        </EHWorkSection>
        <EHButton href="/pro#kundenanfragen" variant="secondary" arrow>Offene Anfragen ansehen</EHButton>
      </>} />
    </WerkbankRahmen>
  );
}
