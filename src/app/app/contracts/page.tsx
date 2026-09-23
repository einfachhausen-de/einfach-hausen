import '@/components/werkbank-layout.css';
import Link from 'next/link';
import {
  AlarmClock, ChevronRight, Droplets, FileSignature, FileText, Flame, ShieldCheck,
  Smartphone, Thermometer, Trash2, Wifi, Wrench, Zap,
} from 'lucide-react';
import {
  EHButton, EHEmptyState, EHField, EHFieldGrid, EHFileInput, EHFormFeedback, EHFormSection,
  EHInput, EHOwnerSection, EHSelect, EHStatus, EHSubmitButton, EHText, EHTextarea, EHWorkflowForm,
} from '@/design-system';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import { VertraegeTabelle } from '@/components/homeowner/vertraege-tabelle';
import { CompareRail } from '@/components/homeowner/compare-rail';
import styles from '../eigentuemer-start.module.css';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { euroExact } from '@/lib/format';
import {
  CONTRACT_KIND_KEYS, CONTRACT_KINDS, COST_INTERVAL_KEYS, COST_INTERVALS, SAVINGS_KINDS,
  type ContractKind, cancellationDeadline, contractKindLabel, currentTermEnd,
  deadlineDays, deadlineState, estimateSavings, formatDate, monthlyCents, yearlyCents,
} from '@/lib/contracts';
import { addHouseContractAction, setHouseContractStatusAction, updateHouseContractAction } from '@/app/actions';
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

  const contracts = db.prepare(`SELECT * FROM house_contracts WHERE homeowner_id=? ORDER BY CASE status WHEN 'active' THEN 0 WHEN 'cancelled' THEN 1 ELSE 2 END, provider COLLATE NOCASE`).all(user.id) as ContractRow[];
  const filter = parseContractFilter(sp);
  const visible = applyContractFilter(contracts, filter);
  const selectedRow = Number.isFinite(selectedId) ? visible.find((r) => r.id === selectedId) ?? null : null;
  const active = contracts.filter((c) => c.status === 'active');
  const monthlyTotal = active.reduce((sum, c) => sum + (monthlyCents(c.cost_amount, c.cost_interval) ?? 0), 0);

  // Naechste Frist ueber alle aktiven Vertraege — sie fuehrt die Seite als
  // Fokuszeile, genau wie auf der Startseite der naechste Schritt fuehrt.
  const withDeadline = active
    .map((row) => ({ row, deadline: cancellationDeadline(row), state: deadlineState(cancellationDeadline(row)) }))
    .filter((entry) => entry.state === 'overdue' || entry.state === 'soon')
    .sort((a, b) => (a.deadline?.getTime() ?? 0) - (b.deadline?.getTime() ?? 0));
  const naechsteFrist = withDeadline[0];
  const spaehrende = active.filter((row) => SAVINGS_KINDS.includes(row.kind as ContractKind));
  const focus = naechsteFrist
    ? {
        zahl: naechsteFrist.state === 'overdue' ? '!' : String(deadlineDays(naechsteFrist.deadline) ?? 0),
        strong: naechsteFrist.state === 'overdue' ? 'Kündigungsfrist verpasst' : 'Tage bis zur nächsten Frist',
        sub: `${contractKindLabel(naechsteFrist.row.kind)} · ${naechsteFrist.row.provider} · ${formatDate(naechsteFrist.deadline)}`,
        href: `/app/contracts?vertrag=${naechsteFrist.row.id}`,
      }
    : active.length > 0
      ? {
          zahl: String(spaehrende.length),
          strong: 'Tarife prüfen',
          sub: spaehrende.length > 0
            ? `${spaehrende.length} ${spaehrende.length === 1 ? 'Vertrag' : 'Verträge'} mit Spar-Check · keine Frist in den nächsten 90 Tagen`
            : 'Keine Frist in den nächsten 90 Tagen · erfasste Verträge sind ruhig',
          href: '#vergleiche',
        }
      : null;

  const comparisonNotice = sp.hinweis ? COMPARISON_NOTICES[sp.hinweis] : undefined;

  // Vergleichsbereich: je Kategorie der echte Kontext aus der Hausakte.
  const comparisonRows = AFFILIATE_CATEGORIES.map((category) => ({
    category,
    contract: active.find((row) => row.kind === category) ?? null,
    availability: resolveAffiliate(category, 'vergleichsuebersicht'),
  }));

  return <WerkbankRahmen role="homeowner" active="/app/contracts" rail={<>
    <p className="eh-werkbank-rail-h">Verträge im Blick</p>
    <Link href="#vertraege" className={styles.railStat}>
      <span className={styles.railStatIcon} aria-hidden="true"><FileSignature size={15} /></span>
      <span className={styles.railStatLabel}>Aktive Verträge</span>
      <strong className={styles.railStatValue}>{active.length}</strong>
    </Link>
    <Link href="#vertraege" className={styles.railStat}>
      <span className={styles.railStatIcon} aria-hidden="true"><AlarmClock size={15} /></span>
      <span className={styles.railStatLabel}>Fristen ≤ 90 Tage</span>
      <strong className={styles.railStatValue} data-tone={withDeadline.length > 0 ? 'terra' : undefined}>{withDeadline.length}</strong>
    </Link>
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

    <header className="eh-werkbank-kopf">
      <div className="eh-werkbank-kopf-copy">
        <span>Hausakte</span>
        <h1>Verträge &amp; Tarife</h1>
        <span>{`${active.length} aktiv · ${euroExact(monthlyTotal)} pro Monat`}</span>
      </div>
      <div className="eh-werkbank-kopf-tools">
        <Link href="#vertrag-anlegen" className="eh-werkbank-kopf-cta">+ Vertrag</Link>
      </div>
    </header>

    {saved && <EHFormFeedback kind="success">Gespeichert. Deine Hausakte ist aktuell.</EHFormFeedback>}
    {comparisonNotice && <EHFormFeedback kind="info">{comparisonNotice}</EHFormFeedback>}

    {focus && (
      <Link href={focus.href} className="eh-werkbank-fokus" aria-label={focus.sub}>
        <span className="eh-werkbank-fokus-zahl">{focus.zahl}</span>
        <span className="eh-werkbank-fokus-text">
          <strong>{focus.strong}</strong>
          <span>{focus.sub}</span>
        </span>
        <span className="eh-werkbank-fokus-pfeil" aria-hidden="true"><ChevronRight size={20} /></span>
      </Link>
    )}

    <EHOwnerSection title={filterIsActive(filter) ? `Meine Verträge · ${visible.length} von ${contracts.length}` : `Meine Verträge · ${contracts.length}`} action={{ href: '#vertrag-anlegen', label: '+ Erfassen' }}>
      <div id="vertraege" />
      {contracts.length === 0
        ? <EHEmptyState title="Noch kein Vertrag erfasst" text="Trag deinen Strom-, DSL- oder Versicherungsvertrag ein. Danach siehst du hier Kosten, Laufzeit und Kündigungsfrist – und ob sich ein Wechsel lohnt." action={<EHButton href="#vertrag-anlegen" variant="secondary">Vertrag erfassen</EHButton>} />
        : (
          <VertraegeTabelle base="/app/contracts" allRows={contracts} rows={visible} filter={filter} selectedId={selectedRow?.id ?? null} icons={KIND_ICONS}>
            {selectedRow && <VertragsDetail row={selectedRow} postcode={profile?.postcode} />}
          </VertraegeTabelle>
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
                  <small>{AFFILIATE_CATEGORY_HINTS[category]}</small>
                </span>
                <p className="eh-vergleich-kontext">
                  {contract
                    ? `In deiner Hausakte: ${contract.provider}${yearly != null ? ` · ${euroExact(yearly)} pro Jahr` : ''}${deadline ? ` · Frist ${formatDate(deadline)}` : ''}`
                    : 'Noch kein Vertrag erfasst — der Vergleich nutzt später deine echten Kosten.'}
                </p>
                <span className="eh-vergleich-rechts">
                  {availability.status === 'available'
                    ? <><EHStatus tone="success">Partner freigegeben</EHStatus><EHButton href={`/api/affiliate/${category}`} variant="secondary" size="small" arrow>Jetzt vergleichen</EHButton></>
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

    <section id="vertrag-anlegen" aria-label="Vertrag anlegen">
      <EHOwnerSection title="Neuer Vertrag">
        <EHWorkflowForm action={addHouseContractAction}>
          <EHFormSection title="Anbieter & Art" description="Pflicht ist nur der Anbieter. Laufzeit und Frist kannst du später ergänzen."><EHFieldGrid>
            <EHField id="new-kind" label="Art"><EHSelect id="new-kind" name="kind" defaultValue="strom">{CONTRACT_KIND_KEYS.map((k) => <option key={k} value={k}>{CONTRACT_KINDS[k]}</option>)}</EHSelect></EHField>
            <EHField id="new-provider" label="Anbieter" required><EHInput id="new-provider" name="provider" required placeholder="z. B. Stadtwerke Musterstadt" /></EHField>
            <EHField id="new-tariff" label="Tarif (steht auf deiner Rechnung)"><EHInput id="new-tariff" name="tariff" placeholder="z. B. Basisstrom 12" /></EHField>
          </EHFieldGrid></EHFormSection>
          <EHFormSection title="Kosten"><EHFieldGrid>
            <EHField id="new-cost" label="Betrag €"><EHInput id="new-cost" name="cost" inputMode="decimal" placeholder="89,90" /></EHField>
            <EHField id="new-interval" label="Zahlweise"><EHSelect id="new-interval" name="costInterval" defaultValue="month">{COST_INTERVAL_KEYS.map((k) => <option key={k} value={k}>{COST_INTERVALS[k]}</option>)}</EHSelect></EHField>
          </EHFieldGrid></EHFormSection>
          <EHFormSection title="Beleg & Notiz">
            <EHFieldGrid>
              <div className="eh-werkbank-filefield"><EHField id="new-doc" label="Foto oder Rechnung"><EHFileInput id="new-doc" name="document" accept="application/pdf,image/*" /></EHField></div>
              <EHField id="new-doctitle" label="Titel des Belegs"><EHInput id="new-doctitle" name="documentTitle" placeholder="z. B. Stromvertrag 2024" /></EHField>
            </EHFieldGrid>
            <EHField id="new-notice" label="Notiz"><EHTextarea id="new-notice" name="notice" rows={3} maxLength={2000} /></EHField>
            <EHSubmitButton pendingLabel="Vertrag wird gespeichert …">In die Hausakte aufnehmen</EHSubmitButton>
          </EHFormSection>
        </EHWorkflowForm>
      </EHOwnerSection>
    </section>
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
            ? <EHButton href={outbound.entryHref} variant="secondary" size="small" arrow>{AFFILIATE_CATEGORY_ACTIONS[outbound.category]}</EHButton>
            : <EHText muted>Ein Klick führt erst zum freigegebenen Partner, sobald einer für {contractKindLabel(row.kind).toLowerCase()} angebunden ist — deine Daten bleiben hier.</EHText>}
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
