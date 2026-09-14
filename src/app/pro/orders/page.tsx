import { ClipboardList } from 'lucide-react';
import { EHWorkMetrics, EHWorkSection, EHOrderList } from '@/design-system';
import { AppShell } from '@/components/shell';
import { ProviderAccessBoundary, ProviderPageIntro, ProviderSectionHeader, ProviderState } from '@/components/provider/workspace';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { euroExact, statusLabel } from '@/lib/format';
import { getProviderContext } from '@/lib/provider';

const DONE_STATUSES = new Set(['completed', 'cancelled', 'closed']);

export default async function Orders() {
  const u = await requireUser('provider');
  const ctx = getProviderContext(u.id);
  if (!ctx) return null;

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
    const nextAction = isContact
      ? 'Kundenkontakt öffnen'
      : row.status === 'accepted'
        ? 'Auftrag vorbereiten'
        : row.status === 'in_progress'
          ? 'Auftrag fortführen'
          : 'Vorgang öffnen';
    return {
      id: String(row.id),
      title: String(row.title ?? '').replace(/^Ansprechpartner:\s*/, ''),
      kind: isContact ? 'Kontakt' : 'Auftrag',
      status: isContact ? 'Kontakt' : statusLabel(row.status),
      contact: row.contact_first ? `${row.contact_first} ${row.contact_last}` : 'Noch nicht zugewiesen',
      amount: isContact ? 'Ohne Preis' : euroExact(row.amount),
      detail: isContact ? 'Persönlicher Ansprechpartner' : `Angebot ${statusLabel(row.quote_status)}`,
      action: nextAction,
      href: `/pro/jobs/${row.id}`,
      _done: !isContact && DONE_STATUSES.has(String(row.status ?? '')),
      _contact: isContact,
    };
  };
  const items = rows.map(toItem);
  const activeJobs = items.filter((i) => !i._contact && !i._done);
  const contacts = items.filter((i) => i._contact);
  const done = items.filter((i) => i._done);

  return (
    <AppShell role="provider" active="/pro/orders" title="Aufträge" subtitle={ctx.canManageJobs ? 'Betrieb · Kontakte und laufende Arbeiten' : 'Deine zugewiesenen Themen'}>
      <ProviderPageIntro
        eyebrow="Arbeit"
        title="Aufträge & Kontakte"
        description={ctx.canManageJobs ? 'Vom gesendeten Angebot bis zur laufenden Arbeit: jeder Vorgang zeigt den aktuellen Stand und genau den nächsten sinnvollen Schritt.' : 'Du siehst ausschließlich Vorgänge, bei denen du als Ansprechpartner zugewiesen bist.'}
      />

      <ProviderAccessBoundary canManageJobs={ctx.canManageJobs} />

      {items.length > 0 && (
        <EHWorkMetrics items={[
          { label: 'Aktive Aufträge', value: activeJobs.length, href: '#pro-orders-active', hint: 'Vorbereiten oder fortführen' },
          { label: 'Kontakte', value: contacts.length, href: '#pro-orders-contacts', hint: 'Persönliche Ansprechpartner' },
          { label: 'Abgeschlossen', value: done.length, href: '#pro-orders-done', hint: 'Erledigt oder storniert' },
        ]} />
      )}

      {items.length === 0 && (
        <EHWorkSection title="Arbeitsliste · 0 Vorgänge im aktuellen Zugriff.">
          <ProviderState
            icon={<ClipboardList size={21} />}
            title="Noch keine Aufträge oder Kontakte"
            description={ctx.canManageJobs ? 'Sobald ein Kontakt übernommen oder ein Angebot gesendet wurde, bleibt der Vorgang hier bis zum Abschluss nachvollziehbar.' : 'Sobald dir ein Vorgang zugewiesen wurde, erscheint er hier.'}
            action={{ href: '/pro/leads', label: 'Offene Anfragen ansehen' }}
          />
        </EHWorkSection>
      )}

      {items.length > 0 && (
        <div id="pro-orders-active">
          <EHWorkSection title={`Aktive Aufträge · ${activeJobs.length}`}>
            <ProviderSectionHeader title="Jetzt bearbeiten" description="Aufträge mit offenem nächsten Schritt, nach Aktualität sortiert." />
            {activeJobs.length > 0 ? <EHOrderList items={activeJobs} /> : (
              <ProviderState compact icon={<ClipboardList size={21} />} title="Keine aktiven Aufträge" description="Sobald ein Angebot angenommen oder ein Auftrag zugewiesen wurde, erscheint er hier." />
            )}
          </EHWorkSection>
        </div>
      )}

      {items.length > 0 && (
        <div id="pro-orders-contacts">
          <EHWorkSection title={`Kontakte · ${contacts.length}`}>
            <ProviderSectionHeader title="Persönliche Ansprechpartner" description="Übernommene Kontakte ohne Angebotsbetrag — der nächste Schritt ist das Gespräch." />
            {contacts.length > 0 ? <EHOrderList items={contacts} /> : (
              <ProviderState compact icon={<ClipboardList size={21} />} title="Keine Kontakte" description="Sobald du einen Kundenkontakt übernimmst, bleibt er hier nachvollziehbar." />
            )}
          </EHWorkSection>
        </div>
      )}

      {items.length > 0 && (
        <div id="pro-orders-done">
          <EHWorkSection title={`Abgeschlossen · ${done.length}`}>
            <ProviderSectionHeader title="Erledigt" description="Abgeschlossene oder stornierte Vorgänge zur Nachvollziehbarkeit." />
            {done.length > 0 ? <EHOrderList items={done} /> : (
              <ProviderState compact icon={<ClipboardList size={21} />} title="Noch nichts abgeschlossen" description="Erledigte Vorgänge bleiben hier zur Nachvollziehbarkeit erhalten." />
            )}
          </EHWorkSection>
        </div>
      )}
    </AppShell>
  );
}
