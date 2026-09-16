import Link from 'next/link';
import { Building2, MessageCircle, RefreshCw, UserRound } from 'lucide-react';
import { AppShell } from '@/components/shell';
import { crumbs } from '@/components/nav-config';
import { EHEmptyState, EHField, EHSelect, EHTextarea, EHInput, EHStatus, EHSubmitButton, EHPanel, EHMetricsBar, EHPageHeader, EHRecordViews, EHWorkSection } from '@/design-system';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { primaryProperty } from '@/lib/properties';
import { euro } from '@/lib/format';
import { startSaleProcessAction } from '@/app/actions';
import { isBrokerEligibleForProperty } from '@/lib/broker-matching';
import { approveBrokerShareAction, requestPropertyValuationAction, revokeBrokerShareAction, storeExistingValuationAction } from './actions';
import styles from './sale.module.css';

const valuationTypeLabels: Record<string, string> = {
  orientation: 'Orientierungswert',
  expert: 'Sachverständigenbewertung',
  market: 'Makler-Marktwert',
};

const saleStages = [
  ['interested', 'Verkaufsinteresse'],
  ['matched', 'Passende Makler'],
  ['contact_released', 'Kontakt freigegeben'],
  ['inspection', 'Besichtigung'],
  ['mandate', 'Maklerauftrag'],
  ['sold', 'Verkauft'],
] as const;

const saleStatusLabels = Object.fromEntries(saleStages) as Record<string, string>;

function formatDate(value: string | null | undefined) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('de-DE');
}

function permissionLabels(value: string | null | undefined) {
  let permissions: string[] = [];
  try { permissions = JSON.parse(value || '[]'); } catch {}
  const labels: Record<string, string> = {
    property_summary: 'Objektzusammenfassung',
    owner_contact: 'Kontaktdaten',
  };
  return permissions.map((permission) => labels[permission] || permission);
}

export default async function Sale() {
  const user = await requireUser('homeowner');
  const property = primaryProperty(user.id);
  if (!property) {
    return <AppShell role="homeowner" active="/app/home/sale" breadcrumbs={crumbs('/app/home','Verkauf & Bewertung')}><div className="empty owner-empty-action"><Building2 aria-hidden="true" /><strong>Hausprofil fehlt</strong><p>Lege zuerst dein Zuhause an. Danach kannst du Bewertung und Verkauf vorbereitet organisieren.</p><Link className="btn primary" href="/app/home">Mein Haus einrichten</Link></div></AppShell>;
  }

  const valuations = db.prepare(`SELECT * FROM property_valuations WHERE property_id=? AND homeowner_id=? ORDER BY created_at DESC LIMIT 10`).all(property.id, user.id) as any[];
  const lead = db.prepare(`SELECT * FROM sale_leads WHERE property_id=? AND homeowner_id=? AND status!='cancelled' ORDER BY id DESC LIMIT 1`).get(property.id, user.id) as any;
  const rawMatches = lead ? db.prepare(`SELECT m.*,p.business_name,p.rating,p.rating_count,
      s.status share_status,s.permissions_json,s.granted_at,s.revoked_at
    FROM broker_lead_matches m
    JOIN provider_profiles p ON p.user_id=m.provider_id
    LEFT JOIN property_shares s ON s.id=(
      SELECT ps.id FROM property_shares ps
      WHERE ps.property_id=? AND ps.provider_id=m.provider_id AND ps.purpose='sale' AND ps.status='active'
      ORDER BY ps.id DESC LIMIT 1
    )
    WHERE m.sale_lead_id=?
    ORDER BY m.match_score DESC,m.id ASC`).all(property.id, lead.id) as any[] : [];
  const matches = rawMatches
    .map((match) => ({ ...match, eligibleNow: isBrokerEligibleForProperty(match.provider_id, property) }))
    .filter((match) => match.share_status === 'active' || (match.status !== 'revoked' && match.eligibleNow));

  const currentStage = lead ? Math.max(0, saleStages.findIndex(([status]) => status === lead.status)) : -1;

  return <AppShell role="homeowner" active="/app/home/sale" title="Verkauf & Bewertung" breadcrumbs={crumbs('/app/home','Verkauf & Bewertung')}>
    <EHPageHeader title="Verkauf & Bewertung" context={property.address || property.postcode || undefined} />

    <EHMetricsBar label="Immobilie" items={[
      { id: 'object', label: 'Immobilie', value: property.property_type || 'Eigenheim', hint: property.living_area ? `${property.living_area} m²` : undefined },
      { id: 'value', label: 'Orientierungswert', value: property.estimated_value_min != null && property.estimated_value_max != null ? `${euro(property.estimated_value_min)} – ${euro(property.estimated_value_max)}` : 'Noch nicht hinterlegt' },
    ]} />

    <EHWorkSection title="Immobilienbewertung">
    <EHPanel title="Neue Bewertung">
      <form action={requestPropertyValuationAction}>
        <EHField id="sale-type" label="Gewünschte Art"><EHSelect id="sale-type" name="valuationType" defaultValue="orientation"><option value="orientation">Orientierungswert</option><option value="expert">Sachverständigenbewertung</option><option value="market">Makler-Marktwert</option></EHSelect></EHField>
        <EHField id="sale-notes" label="Hinweis"><EHTextarea id="sale-notes" name="notes" rows={3} placeholder="Optional: Besonderheiten oder Modernisierungen" /></EHField>
        <EHSubmitButton>Bewertung anfragen</EHSubmitButton>
      </form>
    </EHPanel>
    <EHPanel title="Vorhandene Einschätzung">
      <form action={storeExistingValuationAction}>
        <EHField id="sale-min" label="Von €"><EHInput id="sale-min" name="estimatedMin" type="number" min="0" step="1000" required /></EHField>
        <EHField id="sale-max" label="Bis €"><EHInput id="sale-max" name="estimatedMax" type="number" min="0" step="1000" required /></EHField>
        <EHField id="sale-src" label="Quelle / Art"><EHSelect id="sale-src" name="valuationType" defaultValue="market"><option value="orientation">Orientierungswert</option><option value="expert">Sachverständigenbewertung</option><option value="market">Makler-Marktwert</option></EHSelect></EHField>
        <EHField id="sale-note" label="Hinweis"><EHTextarea id="sale-note" name="notes" rows={3} placeholder="Optional: Quelle, Datum oder Besonderheiten" /></EHField>
        <EHSubmitButton>Vorhandene Bewertung speichern</EHSubmitButton>
      </form>
    </EHPanel>

    <EHPanel title={`Bewertungsverlauf · ${valuations.length} ${valuations.length === 1 ? 'Vorgang' : 'Vorgänge'}`}>
    {valuations.length > 0 && <EHRecordViews label="Bewertungsverlauf" storageKey="verkauf" defaultView="chronik" items={valuations.map((valuation) => {
      const completed = valuation.status === 'completed' && valuation.estimated_min != null && valuation.estimated_max != null;
      return {
        id: String(valuation.id),
        title: completed ? `${euro(valuation.estimated_min)} – ${euro(valuation.estimated_max)}` : valuation.status === 'cancelled' ? 'Bewertung abgebrochen' : 'Bewertung angefragt',
        detail: [valuationTypeLabels[valuation.valuation_type] || valuation.valuation_type, valuation.notes].filter(Boolean).join(' · '),
        date: String(valuation.created_at).slice(0, 10),
        dateLabel: formatDate(valuation.created_at),
        status: <EHStatus tone={completed ? 'success' : valuation.status === 'cancelled' ? 'neutral' : 'info'}>{completed ? 'Gespeichert' : valuation.status === 'cancelled' ? 'Abgebrochen' : 'Anfrage offen'}</EHStatus>,
      };
    })} />}
    {valuations.length === 0 && <EHEmptyState title="Noch keine Bewertung" text="Eine Anfrage und eine bereits vorhandene Einschätzung werden getrennt im Verlauf dokumentiert." />}
    </EHPanel>
    </EHWorkSection>

    <EHWorkSection title="Ich möchte verkaufen">
    {!lead ? <EHEmptyState title="Passende Makler für dein Haus finden" text="Noch werden keine Kontaktdaten weitergegeben." action={<form action={startSaleProcessAction}><button className="btn primary">Makler finden</button></form>} /> : <>
      <section className={styles.lifecycle} aria-labelledby="sale-status-title">
        <div className={styles.lifecycleHead}><div><small id="sale-status-title">Aktueller Verkaufsstatus</small><strong>{saleStatusLabels[lead.status] || lead.status}</strong><span>Aktualisiert am {formatDate(lead.updated_at)}</span></div>{lead.status !== 'sold' && <form action={startSaleProcessAction}><button className="btn ghost"><RefreshCw size={16} aria-hidden="true" /> Maklerabgleich aktualisieren</button></form>}</div>
        <ol>{saleStages.map(([status, label], index) => <li key={status} data-state={index < currentStage ? 'done' : index === currentStage ? 'current' : 'next'}><span>{index + 1}</span><div><strong>{label}</strong>{index === currentStage && <small>Aktueller Schritt</small>}</div></li>)}</ol>
      </section>

      {matches.length > 0 && <EHRecordViews label="Vorgeschlagene Makler" storageKey="verkauf-makler" items={matches.map((match: any) => {
        const activeShare = match.share_status === 'active';
        const permissions = permissionLabels(match.permissions_json);
        const grade = match.rating_count ? `${Number(match.rating).toFixed(1)} ★` : 'neu im Netzwerk';
        return {
          id: String(match.id),
          title: match.business_name,
          value: `${Math.round(match.match_score)} % Passung`,
          detail: ['Geprüfter Partner', grade,
            activeShare ? `Zweck: Verkaufsanbahnung` : '',
            activeShare ? `freigegeben: ${permissions.length ? permissions.join(', ') : 'keine Berechtigungen'}` : '',
            activeShare ? `seit ${formatDate(match.granted_at)}` : '',
            activeShare && !match.eligibleNow ? 'Derzeit nicht für neue Makler-Matches freigegeben. Deine bestehende Freigabe bleibt sichtbar, damit du sie widerrufen kannst.' : '',
          ].filter(Boolean).join(' · '),
          status: <EHStatus tone={activeShare ? 'success' : 'neutral'}>{activeShare ? 'Freigabe aktiv' : 'Vorschlag'}</EHStatus>,
          action: activeShare
            ? <form action={revokeBrokerShareAction.bind(null, match.id)}><button className="btn ghost">Freigabe widerrufen</button></form>
            : <form action={approveBrokerShareAction.bind(null, match.id)} className={styles.approvalForm}><label><input type="checkbox" name="confirmShare" value="yes" required /><span>Ich gebe {match.business_name} meine Kontaktdaten und die Objektzusammenfassung ausdrücklich für die Verkaufsanbahnung frei.</span></label><button className="btn primary">Freigabe erteilen</button></form>,
        };
      })} />}
      {matches.length === 0 && <div className="empty owner-empty-action"><UserRound aria-hidden="true" /><strong>Noch kein passender Makler im Netzwerk</strong><p>Deine Verkaufsabsicht bleibt gespeichert. Ohne passenden aktiven und geprüften Suchprofil-Treffer werden keine Kontaktdaten freigegeben.</p><Link className="btn ghost" href="/app/hausmeister"><MessageCircle size={16} aria-hidden="true" /> Frage zum Verkauf klären</Link></div>}
    </>}
    </EHWorkSection>
  </AppShell>;
}
