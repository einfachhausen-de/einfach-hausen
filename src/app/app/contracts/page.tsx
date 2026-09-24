import '@/components/werkbank-layout.css';
import Link from 'next/link';
import {
  Droplets, FileText, Flame, ShieldCheck,
  Smartphone, Thermometer, Trash2, Wifi, Wrench, Zap,
} from 'lucide-react';
import {
  EHButton, EHEmptyState, EHField, EHFieldGrid, EHFormFeedback, EHFormSection,
  EHInput, EHOwnerSection, EHSelect, EHStatus, EHSubmitButton, EHText, EHTextarea, EHWorkflowForm,
} from '@/design-system';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import { VertraegeTabelle } from '@/components/homeowner/vertraege-tabelle';
import { CompareRail } from '@/components/homeowner/compare-rail';
import { requireUser } from '@/lib/auth';
import { EHPromoBanner } from '@/components/eh-promo-banner';
import { AnlageMenue } from '@/components/homeowner/anlage-menue';
import { VertraegeAnlegeWege } from '@/components/homeowner/anlege-wege';
import { db } from '@/lib/db';
import { euroExact } from '@/lib/format';
import {
  CONTRACT_KIND_KEYS, CONTRACT_KINDS, COST_INTERVAL_KEYS, COST_INTERVALS, SAVINGS_KINDS,
  type ContractKind, cancellationDeadline, contractKindLabel, currentTermEnd,
  deadlineDays, estimateSavings, formatDate, monthlyCents, yearlyCents,
} from '@/lib/contracts';
import { setHouseContractStatusAction, updateHouseContractAction } from '@/app/actions';
import { applyContractFilter, filterIsActive, parseContractFilter } from '@/lib/contract-filter';
import {
  AFFILIATE_CATEGORIES, AFFILIATE_CATEGORY_ACTIONS, AFFILIATE_CATEGORY_HINTS,
  AFFILIATE_CATEGORY_LABELS, resolveAffiliate,
} from '@/lib/affiliate';

/**
 * Verträge & Tarife — Umbau nach dem Muster der Startseite (23.09., Betreiber:
 * 'das aktuelle dort ist veraltet und schlecht'). Kein Tab-Sumpf mehr: ein
 * Fluss aus Kopf, Fokuszeile (nächste Frist), Kartenliste (je Vertrag eine
 * Zeile, aufklappbar zu Fakten + Spar-Check + Bearbeiten), Vergleichs- und
 * Erfassungsbereich. Die rechte Leiste zeigt gestapelte Kennzahlen-Kacheln.
 */

/** Hinweise, mit denen der Weiterleitungs-Endpunkt hierher zurueckkommt. */
const COMPARISON_NOTICES: Record<string, string> = {
  'nicht-verfuegbar': 'Für diese Kategorie ist derzeit kein Vergleichspartner freigegeben. Es wurde nichts geöffnet und nichts übertragen.',
  'einwilligung': 'Ohne deine ausdrückliche Einwilligung wird der Klick nicht gemessen. Der Vergleich wurde deshalb nicht geöffnet.',
  'fehler': 'Die Partnerkonfiguration ist unvollständig. Aus Sicherheitsgründen wurde nichts geöffnet und nichts übertragen.',
};

type ContractRow = {
  id: number; kind: string; provider: string; tariff: string; contract_number: string;
  cost_amount: number | null; cost_interval: string; started_at: string | null;
  term_months: number | null; renewal_months: number | null; cancellation_days: number | null;
  cancellation_deadline: string | null; notice: string; document_title: string;
  document_path: string | null; status: string;
};

const VERGLEICH_HUES: Record<string, string> = { strom: 'sonne', gas: 'himmel', dsl: 'veilchen', mobilfunk: 'rose', versicherung: 'stahl' };

const KIND_ICONS = {
  strom: Zap, gas: Flame, dsl: Wifi, mobilfunk: Smartphone, versicherung: ShieldCheck,
  heizung: Thermometer, wasser: Droplets, abfall: Trash2, wartung: Wrench, sonstiges: FileText,
} as const;

function fristText(row: ContractRow): string {
  const deadline = cancellationDeadline(row);
  if (!deadline) return 'Keine Frist erfasst';
  const days = deadlineDays(deadline) ?? 0;
  if (days < 0) return `Frist verpasst · ${formatDate(deadline)}`;
  if (days === 0) return 'Heute letzter Tag';
  return `Noch ${days} Tage · ${formatDate(deadline)}`;
}

export default async function Contracts({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await requireUser('homeowner');
  const sp = await searchParams;
  const saved = sp.saved === '1';
  const selectedId = Number(sp.vertrag ?? sp.contract);
  const profile = db.prepare('SELECT postcode FROM homeowner_profiles WHERE user_id=?').get(user.id) as { postcode?: string } | undefined;

  const rows = db.prepare(`SELECT * FROM house_contracts WHERE homeowner_id=? ORDER BY CASE status WHEN 'active' THEN 0 WHEN 'cancelled' THEN 1 ELSE 2 END, provider COLLATE NOCASE`).all(user.id) as ContractRow[];
  // Koeder pro Zeile: aktive spaehrende Arten bekommen ihre Spar-Obergrenze
  // mit — die Tabelle verkauft den Klick, das Detail loest ihn ein.
  const sparFor = (row: ContractRow) => row.status === 'active' && SAVINGS_KINDS.includes(row.kind as ContractKind)
    ? estimateSavings({ kind: row.kind, yearlyCents: yearlyCents(row.cost_amount, row.cost_interval), postcode: profile?.postcode || '', householdSize: null, hasLoyaltyBonus: false, switchWilling: true })?.highCents ?? null
    : null;
  const contracts = rows.map((row) => ({ ...row, sparCents: sparFor(row) }));
  const filter = parseContractFilter(sp);
  const visible = applyContractFilter(contracts, filter);
  const selectedRow = Number.isFinite(selectedId) ? visible.find((r) => r.id === selectedId) ?? null : null;
  const active = contracts.filter((c) => c.status === 'active');

  const comparisonNotice = sp.hinweis ? COMPARISON_NOTICES[sp.hinweis] : undefined;

  // Vergleichsbereich: je Kategorie der echte Kontext aus der Hausakte —
  // die Karte spricht in Euro und eigener Rate, nicht in Prosa.
  const sparByKind = new Map<string, number>();
  for (const row of contracts) {
    if (row.status !== 'active' || !SAVINGS_KINDS.includes(row.kind as ContractKind)) continue;
    const e = estimateSavings({ kind: row.kind, yearlyCents: yearlyCents(row.cost_amount, row.cost_interval), postcode: profile?.postcode || '', householdSize: null, hasLoyaltyBonus: false, switchWilling: true });
    if (e) sparByKind.set(row.kind, Math.max(sparByKind.get(row.kind) ?? 0, e.highCents));
  }
  const comparisonRows = AFFILIATE_CATEGORIES.map((category) => ({
    category,
    contract: active.find((row) => row.kind === category) ?? null,
    availability: resolveAffiliate(category, 'vergleichsuebersicht'),
  }));

  return <WerkbankRahmen role="homeowner" active="/app/contracts" rail={<>
    <div className="eh-werkbank-karte">
      <h4>Kosten nach Art</h4>
      {(() => {
        const byKind = new Map<string, number>();
        for (const row of active) byKind.set(contractKindLabel(row.kind), (byKind.get(contractKindLabel(row.kind)) ?? 0) + (monthlyCents(row.cost_amount, row.cost_interval) ?? 0));
        return byKind.size > 0
          ? Array.from(byKind.entries()).sort((a, b) => b[1] - a[1]).map(([kind, cents]) => (
              <div key={kind} className="eh-werkbank-row"><span>{kind}</span><span>{euroExact(cents)}</span></div>
            ))
          : <p className="eh-werkbank-item">Noch kein aktiver Vertrag mit Kosten erfasst.</p>;
      })()}
    </div>
  </>}>

    <h1 className="eh-sr">Verträge &amp; Tarife</h1>

    <EHPromoBanner
      kicker="Neuer Vertrag"
      title="Beleg her. Den Rest liest die KI."
      text="Hochladen, abfotografieren oder zwei Felder selbst ausfüllen — der Spar-Check startet danach von allein."
    >
      <AnlageMenue base="/app/contracts/anlegen" vergleichHref="#vergleiche" />
    </EHPromoBanner>

    {saved && (
      <div className="eh-vdash-gespeichert">
        <EHFormFeedback kind="success">Geschafft. Der Vertrag ist ab sofort im Spar-Check dabei.</EHFormFeedback>
        <Link href="/app/contracts/anlegen" className="eh-werkbank-kopf-cta">Noch einen? Dauert 20 Sekunden</Link>
      </div>
    )}
    {comparisonNotice && <EHFormFeedback kind="info">{comparisonNotice}</EHFormFeedback>}

    <EHOwnerSection title={filterIsActive(filter) ? `Meine Verträge · ${visible.length} von ${contracts.length}` : `Meine Verträge · ${contracts.length}`}>
      <div id="vertraege" />
      {contracts.length === 0
        ? <EHEmptyState title="Noch kein Vertrag erfasst" text="Trag deinen Strom-, DSL- oder Versicherungsvertrag ein. Danach siehst du hier Kosten, Laufzeit und Kündigungsfrist – und ob sich ein Wechsel lohnt." action={<EHButton href="/app/contracts/anlegen">Jetzt Vertrag anlegen</EHButton>} />
        : (
          <>
            <VertraegeTabelle base="/app/contracts" allRows={contracts} rows={visible} filter={filter} selectedId={selectedRow?.id ?? null} icons={KIND_ICONS}>
              {selectedRow && <VertragsDetail row={selectedRow} postcode={profile?.postcode} />}
            </VertraegeTabelle>
            {contracts.length > 0 && contracts.length < 4 && (
              <p className="eh-vdash-nudge">Je mehr Verträge du erfasst, desto genauer dein Spar-Check — auch Gas, Handy, Abo oder Versicherung gehören in die Hausakte. <Link href="/app/contracts/anlegen">Weitersammeln</Link></p>
            )}
          </>
        )}
    </EHOwnerSection>

    <EHOwnerSection title="Vergleichen & Tarife">
      <div id="vergleiche" />
      <EHText muted>Wir zeigen keine eigenen Tarife und keine Rangliste. Der Vergleich läuft beim jeweiligen Partner, dort wird auch abgeschlossen. Deine Vertragsdaten bleiben in der Hausakte und werden nicht an den Partner übertragen.</EHText>
      <CompareRail label="Vergleiche nebeneinander">
        <div className="eh-vergleich-slider">
          {comparisonRows.map(({ category, contract, availability }) => {
            const yearly = contract ? yearlyCents(contract.cost_amount, contract.cost_interval) : null;
            const deadline = contract ? cancellationDeadline(contract) : null;
            const CatIcon = { strom: Zap, gas: Flame, dsl: Wifi, mobilfunk: Smartphone, versicherung: ShieldCheck }[category];
            return (
              <article key={category} id={`vergleich-${category}`} className="eh-vergleich-karte" data-hue={VERGLEICH_HUES[category]}>
                <span className="eh-vergleich-ic" aria-hidden="true"><CatIcon size={18} /></span>
                <span className="eh-vergleich-body">
                  <strong>{AFFILIATE_CATEGORY_LABELS[category]}</strong>
                  <small>{contract
                    ? `Bei deinen ${euroExact(monthlyCents(contract.cost_amount, contract.cost_interval) ?? yearly ?? 0)}/Monat bei ${contract.provider}${(sparByKind.get(category) ?? 0) > 0 ? ` sind bis zu ${euroExact(sparByKind.get(category)!)} pro Jahr drin` : ' — dein Tarif wirkt schon guenstig'}`
                    : AFFILIATE_CATEGORY_HINTS[category]}</small>
                </span>
                <p className="eh-vergleich-kontext">
                  {contract
                    ? deadline ? `Kündigen bis ${formatDate(deadline)}` : 'Keine Frist erfasst · jederzeit prüfbar'
                    : 'Noch kein Vertrag erfasst — der Vergleich nutzt später deine echten Kosten.'}
                </p>
                <span className="eh-vergleich-rechts">
                  {availability.status === 'available'
                    ? <><EHStatus tone="success">Partner freigegeben</EHStatus><EHButton href={`/api/affiliate/${category}`} size="small" arrow>Jetzt vergleichen</EHButton></>
                    : availability.status === 'error'
                      ? <EHStatus tone="error">Konfiguration prüfen</EHStatus>
                      : <EHStatus>Kein Partner freigegeben</EHStatus>}
                </span>
              </article>
            );
          })}
        </div>
      </CompareRail>
    </EHOwnerSection>

    <EHOwnerSection title="Schnellaktionen">
      <VertraegeAnlegeWege base="/app/contracts/anlegen" />
    </EHOwnerSection>

  </WerkbankRahmen>;
}

/** Aufgeklappter Zustand eines Tabellen-Zeile: Fakten, Spar-Check, Bearbeiten
 *  — die Inhalte der alten Karten, jetzt als Detailpanel unter der Tabelle. */
function VertragsDetail({ row, postcode }: { row: ContractRow; postcode?: string }) {
  const end = currentTermEnd(row);
  const estimate = row.status === 'active' && SAVINGS_KINDS.includes(row.kind as ContractKind)
    ? estimateSavings({ kind: row.kind, yearlyCents: yearlyCents(row.cost_amount, row.cost_interval), postcode: postcode || '', householdSize: null, hasLoyaltyBonus: false, switchWilling: true })
    : null;
  const outbound = row.status === 'active' && estimate ? resolveAffiliate(row.kind, 'sparcheck') : null;
  const fakten: [string, string][] = [
    ['Art', contractKindLabel(row.kind)],
    ...(row.tariff ? [['Tarif', row.tariff] as [string, string]] : []),
    ...(row.contract_number ? [['Vertragsnummer', row.contract_number] as [string, string]] : []),
    ...(row.started_at ? [['Beginn', formatDate(new Date(`${row.started_at.slice(0, 10)}T12:00:00`))] as [string, string]] : []),
    ...(end ? [['Laufzeit bis', formatDate(end)] as [string, string]] : []),
    ...(row.cancellation_days ? [['Kündigungsfrist', `${row.cancellation_days} Tage`] as [string, string]] : []),
  ];
  return (
    <div className="eh-vertrag-detail">
      <p className="eh-vertrag-detail-kopf">
        <strong>{row.provider}</strong>
        <span>{row.status === 'active' ? fristText(row) : row.status === 'cancelled' ? 'Gekündigt' : 'Ausgelaufen'}</span>
        <Link href="/app/contracts">Schließen</Link>
      </p>
      <div className="eh-vertrag-fakten">
        {fakten.map(([label, value]) => (
          <span key={label} className="eh-vertrag-fakt"><small>{label}</small><b>{value}</b></span>
        ))}
        {row.document_path && (
          <span className="eh-vertrag-fakt"><small>Beleg</small><b>
            <a href={`/api/house-contracts/${row.id}/document`} target="_blank" rel="noreferrer">{row.document_title || 'Vertragsdokument'}</a>
          </b></span>
        )}
        {row.status === 'active' && !SAVINGS_KINDS.includes(row.kind as ContractKind) && (
          <span className="eh-vertrag-fakt"><small>Spar-Check</small><b>Für {contractKindLabel(row.kind).toLowerCase()} gibt es keine Vergleichsstrecke — der Vertrag bleibt reine Hausakte.</b></span>
        )}
      </div>
      {estimate && (
        <div className="eh-vertrag-spar">
          <span className="eh-vertrag-spar-zahl">
            <b>{euroExact(estimate.lowCents)} – {euroExact(estimate.highCents)}</b>
            <small>möglich pro Jahr · Schätzung {estimate.confidence}</small>
          </span>
          <ul className="eh-vertrag-spar-gruende">
            {estimate.reasons.slice(0, 3).map((reason, i) => <li key={i}>{reason}</li>)}
          </ul>
          {outbound?.status === 'available'
            ? <EHButton href={outbound.entryHref} size="small" arrow>{AFFILIATE_CATEGORY_ACTIONS[outbound.category]}</EHButton>
            : <EHText muted>Ein Klick führt erst zum freigegebenen Partner, sobald einer für {contractKindLabel(row.kind).toLowerCase()} angebunden ist — deine Daten bleiben hier.</EHText>}
          <EHText muted>Sieht dein Hausmanager anders? <Link href="/app/consultation">Kurz mit der KI gegenprüfen lassen</Link> — zwei Fragen, ohne Vertrag damit.</EHText>
        </div>
      )}
      <div className="eh-vertrag-aktionen">
        <EHWorkflowForm action={setHouseContractStatusAction.bind(null, row.id, row.status === 'active' ? 'cancelled' : 'active')}>
          <EHSubmitButton pendingLabel="Wird geändert …">
            {row.status === 'active' ? 'Als gekündigt markieren' : 'Wieder als aktiv markieren'}
          </EHSubmitButton>
        </EHWorkflowForm>
        <details className="eh-vertrag-edit">
          <summary>Vertrag bearbeiten</summary>
          <EHWorkflowForm action={updateHouseContractAction}>
            <input type="hidden" name="id" value={row.id} />
            <EHFormSection title="Vertragsdaten"><EHFieldGrid>
              <EHField id={`kind-${row.id}`} label="Art"><EHSelect id={`kind-${row.id}`} name="kind" defaultValue={row.kind}>{CONTRACT_KIND_KEYS.map((k) => <option key={k} value={k}>{CONTRACT_KINDS[k]}</option>)}</EHSelect></EHField>
              <EHField id={`provider-${row.id}`} label="Anbieter" required><EHInput id={`provider-${row.id}`} name="provider" defaultValue={row.provider} required /></EHField>
              <EHField id={`tariff-${row.id}`} label="Tarif (steht auf deiner Rechnung)"><EHInput id={`tariff-${row.id}`} name="tariff" defaultValue={row.tariff} /></EHField>
              <EHField id={`number-${row.id}`} label="Vertragsnummer"><EHInput id={`number-${row.id}`} name="contractNumber" defaultValue={row.contract_number} /></EHField>
            </EHFieldGrid></EHFormSection>
            <EHFormSection title="Kosten"><EHFieldGrid>
              <EHField id={`cost-${row.id}`} label="Betrag €"><EHInput id={`cost-${row.id}`} name="cost" inputMode="decimal" defaultValue={row.cost_amount != null ? String(row.cost_amount / 100).replace('.', ',') : ''} /></EHField>
              <EHField id={`interval-${row.id}`} label="Zahlweise"><EHSelect id={`interval-${row.id}`} name="costInterval" defaultValue={row.cost_interval}>{COST_INTERVAL_KEYS.map((k) => <option key={k} value={k}>{COST_INTERVALS[k]}</option>)}</EHSelect></EHField>
            </EHFieldGrid></EHFormSection>
            <EHFormSection title="Laufzeit & Kündigung"><EHFieldGrid>
              <EHField id={`start-${row.id}`} label="Vertragsbeginn"><EHInput id={`start-${row.id}`} name="startedAt" type="date" defaultValue={row.started_at?.slice(0, 10) || ''} /></EHField>
              <EHField id={`term-${row.id}`} label="Laufzeit (Monate)"><EHInput id={`term-${row.id}`} name="termMonths" type="number" min="0" defaultValue={row.term_months ?? ''} /></EHField>
              <EHField id={`renewal-${row.id}`} label="Verlängerung (Monate)"><EHInput id={`renewal-${row.id}`} name="renewalMonths" type="number" min="0" defaultValue={row.renewal_months ?? 12} /></EHField>
              <EHField id={`days-${row.id}`} label="Kündigungsfrist (Tage)"><EHInput id={`days-${row.id}`} name="cancellationDays" type="number" min="0" defaultValue={row.cancellation_days ?? 30} /></EHField>
              <EHField id={`deadline-${row.id}`} label="Kündigen bis" hint="Leer lassen, um aus Vertragsbeginn, Laufzeit und Frist zu rechnen."><EHInput id={`deadline-${row.id}`} name="cancellationDeadline" type="date" defaultValue={row.cancellation_deadline?.slice(0, 10) || ''} aria-describedby={`deadline-${row.id}-hint`} /></EHField>
            </EHFieldGrid></EHFormSection>
            <EHFormSection title="Notiz"><EHField id={`notice-${row.id}`} label="Notiz"><EHTextarea id={`notice-${row.id}`} name="notice" rows={3} maxLength={2000} defaultValue={row.notice} /></EHField></EHFormSection>
            <EHSubmitButton pendingLabel="Wird gespeichert …">Änderungen speichern</EHSubmitButton>
          </EHWorkflowForm>
        </details>
      </div>
    </div>
  );
}
