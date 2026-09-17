import { RefreshCw } from 'lucide-react';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import { crumbs } from '@/components/nav-config';
import { EHButton, EHCheckbox, EHEmptyState, EHField, EHFormSection, EHSelect, EHStepProgress, EHTextarea, EHInput, EHStatus, EHSubmitButton, EHMetricsBar, EHPageHeader, EHRecordList, EHRecordViews, EHText, EHWorkSection, EHWorkflowForm, EHWorkflowStack, EHWorkspaceGrid, type EHRecordEntry } from '@/design-system';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { primaryProperty } from '@/lib/properties';
import { euro } from '@/lib/format';
import { startSaleProcessAction } from '@/app/actions';
import { isBrokerEligibleForProperty } from '@/lib/broker-matching';
import { approveBrokerShareAction, requestPropertyValuationAction, revokeBrokerShareAction, storeExistingValuationAction } from './actions';

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
    return <WerkbankRahmen role="homeowner" active="/app/home/sale" breadcrumbs={crumbs('/app/home','Verkauf & Bewertung')}><EHEmptyState title="Hausprofil fehlt" text="Lege zuerst dein Zuhause an. Danach kannst du Bewertung und Verkauf vorbereitet organisieren." action={<EHButton href="/app/home">Mein Haus einrichten</EHButton>} /></WerkbankRahmen>;
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

  // Kennzahlen und rechte Spalte lesen dieselben Listen, damit die Zahl oben
  // und die Eintraege rechts nicht auseinanderlaufen.
  const activeMatches = matches.filter((match: any) => match.share_status === 'active');
  const latestCompleted = valuations.find((valuation) => valuation.status === 'completed' && valuation.estimated_min != null && valuation.estimated_max != null);
  const lastValuation = valuations[0];
  // Der Orientierungswert kommt aus dem Hausprofil; fehlt er dort, zaehlt die
  // zuletzt gespeicherte Bewertung. Sonst bleibt der Wert ehrlich leer.
  const orientationValue = property.estimated_value_min != null && property.estimated_value_max != null
    ? `${euro(property.estimated_value_min)} – ${euro(property.estimated_value_max)}`
    : latestCompleted ? `${euro(latestCompleted.estimated_min)} – ${euro(latestCompleted.estimated_max)}` : 'Noch nicht hinterlegt';
  const shareItems: EHRecordEntry[] = activeMatches.map((match: any) => ({
    id: `share-${match.id}`,
    title: match.business_name,
    detail: [`Freigabe seit ${formatDate(match.granted_at)}`, permissionLabels(match.permissions_json).join(', ')].filter(Boolean).join(' · '),
    status: <EHStatus tone="success">Freigabe aktiv</EHStatus>,
  }));

  return <WerkbankRahmen role="homeowner" active="/app/home/sale" brandSub={property.address} breadcrumbs={crumbs('/app/home','Verkauf & Bewertung')}>
    <EHWorkflowStack>
    <EHPageHeader title="Verkauf & Bewertung" context={property.address || property.postcode || undefined} />

    <EHMetricsBar label="Verkauf & Bewertung" items={[
      { id: 'object', label: 'Immobilie', value: property.property_type || 'Eigenheim', hint: property.living_area ? `${property.living_area} m²` : 'Hausprofil' },
      { id: 'value', label: 'Orientierungswert', value: orientationValue, hint: property.estimated_value_min != null ? 'aus dem Hausprofil' : latestCompleted ? 'aus der letzten Bewertung' : 'noch keine Grundlage' },
      { id: 'bewertungen', label: 'Bewertungen', value: String(valuations.length), hint: lastValuation ? `zuletzt ${formatDate(lastValuation.created_at)}` : 'noch kein Vorgang' },
      { id: 'makler', label: 'Makler-Vorschläge', value: String(matches.length), hint: activeMatches.length > 0 ? `${activeMatches.length} freigegeben` : 'keine Freigabe erteilt' },
    ]} />

    <EHWorkspaceGrid main={<>
    <EHWorkSection title="Immobilienbewertung">
    <EHFormSection title="Neue Bewertung">
      <EHWorkflowForm action={requestPropertyValuationAction}>
        <EHField id="sale-type" label="Gewünschte Art"><EHSelect id="sale-type" name="valuationType" defaultValue="orientation"><option value="orientation">Orientierungswert</option><option value="expert">Sachverständigenbewertung</option><option value="market">Makler-Marktwert</option></EHSelect></EHField>
        <EHField id="sale-notes" label="Hinweis"><EHTextarea id="sale-notes" name="notes" rows={3} placeholder="Optional: Besonderheiten oder Modernisierungen" /></EHField>
        <EHSubmitButton>Bewertung anfragen</EHSubmitButton>
      </EHWorkflowForm>
    </EHFormSection>
    <EHFormSection title="Vorhandene Einschätzung">
      <EHWorkflowForm action={storeExistingValuationAction}>
        <EHField id="sale-min" label="Von €"><EHInput id="sale-min" name="estimatedMin" type="number" min="0" step="1000" required /></EHField>
        <EHField id="sale-max" label="Bis €"><EHInput id="sale-max" name="estimatedMax" type="number" min="0" step="1000" required /></EHField>
        <EHField id="sale-src" label="Quelle / Art"><EHSelect id="sale-src" name="valuationType" defaultValue="market"><option value="orientation">Orientierungswert</option><option value="expert">Sachverständigenbewertung</option><option value="market">Makler-Marktwert</option></EHSelect></EHField>
        <EHField id="sale-note" label="Hinweis"><EHTextarea id="sale-note" name="notes" rows={3} placeholder="Optional: Quelle, Datum oder Besonderheiten" /></EHField>
        <EHSubmitButton>Vorhandene Bewertung speichern</EHSubmitButton>
      </EHWorkflowForm>
    </EHFormSection>

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
    </EHWorkSection>

    <EHWorkSection title="Ich möchte verkaufen">
    {!lead ? <EHEmptyState title="Passende Makler für dein Haus finden" text="Noch werden keine Kontaktdaten weitergegeben." action={<EHWorkflowForm action={startSaleProcessAction}><EHSubmitButton pendingLabel="Maklerabgleich läuft …">Makler finden</EHSubmitButton></EHWorkflowForm>} /> : <>
      <EHStepProgress steps={saleStages.map(([id, label]) => ({ id, label }))} current={lead.status} />
      <EHText muted>Aktueller Verkaufsstatus: {saleStatusLabels[lead.status] || lead.status} · Aktualisiert am {formatDate(lead.updated_at)}</EHText>
      {lead.status !== 'sold' && <EHWorkflowForm action={startSaleProcessAction}><EHButton type="submit" variant="secondary"><RefreshCw size={16} aria-hidden="true" /> Maklerabgleich aktualisieren</EHButton></EHWorkflowForm>}

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
            ? <EHWorkflowForm action={revokeBrokerShareAction.bind(null, match.id)}><EHButton type="submit" variant="secondary">Freigabe widerrufen</EHButton></EHWorkflowForm>
            : <EHWorkflowForm action={approveBrokerShareAction.bind(null, match.id)}><EHCheckbox name="confirmShare" value="yes" required label={<span>Ich gebe {match.business_name} meine Kontaktdaten und die Objektzusammenfassung ausdrücklich für die Verkaufsanbahnung frei.</span>} /><EHSubmitButton pendingLabel="Freigabe wird erteilt …">Freigabe erteilen</EHSubmitButton></EHWorkflowForm>,
        };
      })} />}
      {matches.length === 0 && <EHEmptyState title="Noch kein passender Makler im Netzwerk" text="Deine Verkaufsabsicht bleibt gespeichert. Ohne passenden aktiven und geprüften Suchprofil-Treffer werden keine Kontaktdaten freigegeben." action={<EHButton href="/app/hausmeister" variant="secondary">Frage zum Verkauf klären</EHButton>} />}
    </>}
    </EHWorkSection>
    </>} aside={<>
      <EHWorkSection title="Verkaufsstand">
        {lead ? <>
          <EHStatus tone={lead.status === 'sold' ? 'success' : 'info'}>{saleStatusLabels[lead.status] || lead.status}</EHStatus>
          <EHText muted>Stand {formatDate(lead.updated_at)} · Schritt {currentStage + 1} von {saleStages.length}</EHText>
          <EHText muted>Die einzelnen Schritte stehen links unter „Ich möchte verkaufen“.</EHText>
        </> : <EHText muted>Noch keine Verkaufsabsicht hinterlegt. Der Abgleich sucht passende Makler, ohne Kontaktdaten freizugeben.</EHText>}
      </EHWorkSection>
      <EHWorkSection title="Letzte Bewertung">
        {lastValuation ? <>
          <EHText>{lastValuation.status === 'completed' && lastValuation.estimated_min != null
            ? `${euro(lastValuation.estimated_min)} – ${euro(lastValuation.estimated_max)}`
            : valuationTypeLabels[lastValuation.valuation_type] || 'Bewertung'}</EHText>
          <EHStatus tone={lastValuation.status === 'completed' ? 'success' : lastValuation.status === 'cancelled' ? 'neutral' : 'info'}>
            {lastValuation.status === 'completed' ? 'Gespeichert' : lastValuation.status === 'cancelled' ? 'Abgebrochen' : 'Anfrage offen'}
          </EHStatus>
          <EHText muted>{valuationTypeLabels[lastValuation.valuation_type] || lastValuation.valuation_type} · {formatDate(lastValuation.created_at)}</EHText>
        </> : <EHText muted>Noch keine Bewertung. Eine Anfrage oder eine vorhandene Einschätzung erscheint hier mit Datum und Art.</EHText>}
      </EHWorkSection>
      <EHWorkSection title="Freigegebene Makler">
        <EHRecordList label="Freigegebene Makler" items={shareItems} empty="Noch keine Kontaktdaten freigegeben. Vorschläge bleiben ohne Freigabe für den Betrieb gesperrt." />
      </EHWorkSection>
      <EHWorkSection title="Fragen zum Verkauf">
        <EHText muted>Unsicher bei Preis, Unterlagen oder Ablauf? Der Hausmeister ordnet dein Thema ein, bevor du etwas freigibst.</EHText>
        <EHButton href="/app/hausmeister" variant="secondary" arrow>Frage zum Verkauf klären</EHButton>
      </EHWorkSection>
    </>} />
    </EHWorkflowStack>
  </WerkbankRahmen>;
}
