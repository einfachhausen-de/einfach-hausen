import '@/components/werkbank-layout.css';
import Link from 'next/link';
import {
  BarChart3, ChevronRight, Droplets, FileText, FileUp, Flame, ShieldCheck,
  Smartphone, Thermometer, Trash2, Wifi, Wrench, Zap,
} from 'lucide-react';
import {
  EHButton, EHFormFeedback, EHOwnerSection, EHStatus, EHText,
} from '@/design-system';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import { euroExact } from '@/lib/format';
import { VertraegeTabelle } from '@/components/homeowner/vertraege-tabelle';
import styles from '../../eigentuemer-start.module.css';
import { VertraegeAnlegeWege } from '@/components/homeowner/anlege-wege';
import { CompareRail } from '@/components/homeowner/compare-rail';
import { db } from '@/lib/db';
import { applyContractFilter, filterIsActive, parseContractFilter } from '@/lib/contract-filter';
import {
  SAVINGS_KINDS, contractKindLabel, currentTermEnd, cancellationDeadline, deadlineDays,
  estimateSavings, formatDate, monthlyCents, yearlyCents,
} from '@/lib/contracts';
import { AFFILIATE_CATEGORIES, AFFILIATE_CATEGORY_HINTS, AFFILIATE_CATEGORY_LABELS } from '@/lib/affiliate';

/**
 * Schaufenster «Verträge & Tarife» — dasselbe Layout wie /app/contracts
 * (23.09. Umbau nach Startseiten-Muster), aber OHNE Anmeldung, OHNE
 * Datenbank und OHNE Server-Actions: feste Beispielwerte, deren Fristen
 * sich am Besuchsdatum ausrichten, damit alle Zustände (Heute letzter Tag,
 * bald, entspannt, Frist verpasst, gekündigt) immer lebendig aussehen.
 * Ziel: in Vorschau-Umgebungen (Arena-Panel) bareinblicken können, in denen
 * Browser Session-Cookies verwerfen. Editierbare Bereiche sind sichtbar,
 * aber bewusst ohne Formulare — Kennenlern-Hinweis oben.
 */

type FristRow = {
  id: number; kind: string; provider: string; tariff: string; contract_number: string;
  cost_amount: number | null; cost_interval: string; started_at: string | null;
  term_months: number | null; renewal_months: number | null; cancellation_days: number | null;
  cancellation_deadline: string | null; notice: string; document_title: string;
  document_path: string | null; status: string;
};

const iso = (d: Date) => d.toISOString().slice(0, 10);
const inDays = (n: number) => iso(new Date(Date.now() + n * 86_400_000));

function fristText(row: FristRow): string {
  const deadline = cancellationDeadline(row);
  if (!deadline) return 'Keine Frist erfasst';
  const days = deadlineDays(deadline) ?? 0;
  if (days < 0) return `Frist verpasst · ${formatDate(deadline)}`;
  if (days === 0) return 'Heute letzter Tag';
  return `Noch ${days} Tage · ${formatDate(deadline)}`;
}

const VERGLEICH_HUES: Record<string, string> = { strom: 'sonne', gas: 'himmel', dsl: 'veilchen', mobilfunk: 'rose', versicherung: 'stahl' };

const KIND_ICONS = {
  strom: Zap, gas: Flame, dsl: Wifi, mobilfunk: Smartphone, versicherung: ShieldCheck,
  heizung: Thermometer, wasser: Droplets, abfall: Trash2, wartung: Wrench, sonstiges: FileText,
} as const;

function fixtureContracts(): FristRow[] {
  return [
  { id: 901, kind: 'strom', provider: 'Stadtwerke Duisburg', tariff: 'Basis Strom 12', contract_number: 'SWD-4413902', cost_amount: 4190, cost_interval: 'month', started_at: '2025-10-01', term_months: 12, renewal_months: 12, cancellation_days: 0, cancellation_deadline: inDays(0), notice: 'Kündigen heute noch möglich — danach ein Jahr länger gebunden.', document_title: '', document_path: null, status: 'active' },
  { id: 902, kind: 'dsl', provider: 'Telekom', tariff: 'MagentaZuhause XL', contract_number: 'TK-77120931', cost_amount: 4495, cost_interval: 'month', started_at: '2024-10-31', term_months: 24, renewal_months: 12, cancellation_days: 30, cancellation_deadline: inDays(7), notice: 'Router-Miete enthalten; Wechsel prüfen.', document_title: '', document_path: null, status: 'active' },
  { id: 903, kind: 'versicherung', provider: 'HUK24', tariff: 'Hausrat Komfort', contract_number: 'HUK-90221', cost_amount: 12800, cost_interval: 'year', started_at: '2021-11-01', term_months: 12, renewal_months: 12, cancellation_days: 30, cancellation_deadline: inDays(39), notice: 'Wohnfläche nach Umbau anpassen.', document_title: '', document_path: null, status: 'active' },
  { id: 904, kind: 'mobilfunk', provider: 'O2', tariff: 'Mobile M', contract_number: 'O2-3110884', cost_amount: 2999, cost_interval: 'month', started_at: '2025-05-01', term_months: 24, renewal_months: 12, cancellation_days: 30, cancellation_deadline: inDays(221), notice: '', document_title: '', document_path: null, status: 'active' },
  { id: 905, kind: 'gas', provider: 'Fluxio Energie', tariff: 'Fluxio Fix 24', contract_number: 'FLX-55201', cost_amount: 6400, cost_interval: 'month', started_at: '2024-01-15', term_months: 24, renewal_months: 12, cancellation_days: 30, cancellation_deadline: inDays(-14), notice: 'Gekündigt zum Jahresende — Bestätigung liegt in der Hausakte.', document_title: '', document_path: null, status: 'cancelled' },
  ];
}

export default async function ContractsPreview({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  // Echte Demo-Datenbank vor festen Zeilen: wer im Seed etwas aendert, sieht
  // es hier sofort (Betreiber-Wunsch 24.09.: 'richtige db, nicht nur cards').
  let CONTRACTS: FristRow[] = [];
  try {
    const u = db.prepare(`SELECT id FROM users WHERE lower(email)=?`).get('kunde@demo.einfachhausen.de') as { id: number } | undefined;
    if (u) {
      CONTRACTS = db.prepare(`SELECT id, kind, provider, tariff, contract_number, cost_amount, cost_interval, started_at, term_months, renewal_months, cancellation_days, cancellation_deadline, notice, document_title, document_path, status FROM house_contracts WHERE homeowner_id=? ORDER BY CASE status WHEN 'active' THEN 0 WHEN 'cancelled' THEN 1 ELSE 2 END, provider COLLATE NOCASE`).all(u.id) as FristRow[];
    }
  } catch { /* nach Sandbox-Reset kann der Seed fehlen — dann greifen die Demo-Zeilen */ }
  if (CONTRACTS.length === 0) CONTRACTS = fixtureContracts();
  const sparFor = (row: FristRow) => row.status === 'active' && SAVINGS_KINDS.includes(row.kind as (typeof SAVINGS_KINDS)[number])
    ? estimateSavings({ kind: row.kind, yearlyCents: yearlyCents(row.cost_amount, row.cost_interval), postcode: '47055', householdSize: 3, hasLoyaltyBonus: false, switchWilling: true })?.highCents ?? null
    : null;
  const pool = CONTRACTS.map((row) => ({ ...row, sparCents: sparFor(row) }));
  const filter = parseContractFilter(sp);
  const visible = applyContractFilter(pool, filter);
  const selectedId = Number(sp.vertrag);
  const selectedRow = Number.isFinite(selectedId) ? visible.find((r) => r.id === selectedId) ?? null : null;
  const active = CONTRACTS.filter((c) => c.status === 'active');

  const sparByKind = new Map<string, number>();
  for (const row of CONTRACTS) {
    if (row.status !== 'active' || !SAVINGS_KINDS.includes(row.kind as (typeof SAVINGS_KINDS)[number])) continue;
    const e = estimateSavings({ kind: row.kind, yearlyCents: yearlyCents(row.cost_amount, row.cost_interval), postcode: '47055', householdSize: 3, hasLoyaltyBonus: false, switchWilling: true });
    if (e) sparByKind.set(row.kind, Math.max(sparByKind.get(row.kind) ?? 0, e.highCents));
  }
  const comparisonRows = AFFILIATE_CATEGORIES.map((category) => ({
    category,
    contract: active.find((row) => row.kind === category) ?? null,
    // In der Vorschau statisch: zwei Kategorien "freigegeben", Rest offen.
    available: category === 'strom' || category === 'dsl',
  }));

  const byKind = new Map<string, number>();
  for (const row of active) byKind.set(contractKindLabel(row.kind), (byKind.get(contractKindLabel(row.kind)) ?? 0) + (monthlyCents(row.cost_amount, row.cost_interval) ?? 0));

  return <WerkbankRahmen role="homeowner" active="/app/contracts" rail={<>
    <div className="eh-werkbank-karte">
      <h4>Kosten nach Art</h4>
      {Array.from(byKind.entries()).sort((a, b) => b[1] - a[1]).map(([kind, cents]) => (
        <div key={kind} className="eh-werkbank-row"><span>{kind}</span><span>{euroExact(cents)}</span></div>
      ))}
    </div>
  </>}>

    <EHFormFeedback kind="info">
      Öffentliches Schaufenster mit Beispielwerten — keine Anmeldung, keine Speicherung. Die echte Seite ist /app/contracts.
    </EHFormFeedback>

    <section className={styles.quickSection} aria-labelledby="quick-title">
      <p id="quick-title" className={styles.quickLabel}>Schnellaktionen</p>
      <div className="eh-vertrag-quick">
        <Link href="/app/preview/anlegen" className={`${styles.quickCard} ${styles.quickCardPrimary}`}>
          <span className={styles.quickIcon}><FileUp size={20} /></span>
          <strong>Vertrag erfassen</strong>
          <small>Beleg hochladen, abfotografieren oder selbst eintragen &ndash; die KI liest Anbieter, Frist und Titel.</small>
          <span className={styles.quickCardArrow}>Vertrag erfassen <ChevronRight size={16} aria-hidden="true" /></span>
        </Link>
        <Link href="#vergleiche" className={styles.quickCard}>
          <span className={styles.quickIcon}><BarChart3 size={20} /></span>
          <strong>Anbieter vergleichen</strong>
          <small>Strom, Gas, Internet, Mobilfunk oder Versicherungen &ndash; dein Tarif gegen den Markt.</small>
          <span className={styles.quickCardArrow}>Anbieter vergleichen <ChevronRight size={16} aria-hidden="true" /></span>
        </Link>
      </div>
    </section>

    <h1 className="eh-sr">Verträge &amp; Tarife</h1>

    <EHOwnerSection title={filterIsActive(filter) ? `Meine Verträge · ${visible.length} von ${CONTRACTS.length}` : `Meine Verträge · ${CONTRACTS.length}`}>
      <div id="vertraege" />
      <VertraegeTabelle base="/app/preview/vertraege" allRows={pool} rows={visible} filter={filter} selectedId={selectedRow?.id ?? null} icons={KIND_ICONS}>
        {selectedRow && <PreviewDetail row={selectedRow} />}
      </VertraegeTabelle>
      {pool.length > 0 && pool.length < 4 && (
        <p className="eh-vdash-nudge">Je mehr Verträge du erfasst, desto genauer dein Spar-Check — auch Gas, Handy, Abo oder Versicherung gehören in die Hausakte.</p>
      )}
    </EHOwnerSection>

    <EHOwnerSection title="Vergleichen & Tarife">
      <div id="vergleiche" />
      <EHText muted>Wir zeigen keine eigenen Tarife und keine Rangliste. Der Vergleich läuft beim jeweiligen Partner, dort wird auch abgeschlossen. Deine Vertragsdaten bleiben in der Hausakte und werden nicht an den Partner übertragen.</EHText>
      <CompareRail label="Vergleiche nebeneinander">
        <div className="eh-vergleich-slider">
          {comparisonRows.map(({ category, contract, available }) => {
            const yearly = contract ? yearlyCents(contract.cost_amount, contract.cost_interval) : null;
            const deadline = contract ? cancellationDeadline(contract) : null;
            const CatIcon = { strom: Zap, gas: Flame, dsl: Wifi, mobilfunk: Smartphone, versicherung: ShieldCheck }[category];
            return (
              <article key={category} id={`vergleich-${category}`} className="eh-vergleich-karte" data-hue={VERGLEICH_HUES[category]}>
                <span className="eh-vergleich-ic" aria-hidden="true"><CatIcon size={18} /></span>
                <span className="eh-vergleich-body">
                  <strong>{AFFILIATE_CATEGORY_LABELS[category]}</strong>
                  <small>{contract
                    ? `Bei deinen ${euroExact(monthlyCents(contract.cost_amount, contract.cost_interval) ?? yearly ?? 0)}/Monat bei ${contract.provider}${(sparByKind.get(category) ?? 0) > 0 ? ` sind bis zu ${euroExact(sparByKind.get(category)!)} pro Jahr drin` : ' — dein Tarif wirkt schon günstig'}`
                    : AFFILIATE_CATEGORY_HINTS[category]}</small>
                </span>
                <p className="eh-vergleich-kontext">
                  {contract
                    ? deadline ? `Kündigen bis ${formatDate(deadline)}` : 'Keine Frist erfasst · jederzeit prüfbar'
                    : 'Noch kein Vertrag erfasst — der Vergleich nutzt später deine echten Kosten.'}
                </p>
                <span className="eh-vergleich-rechts">
                  {available
                    ? <><EHStatus tone="success">Partner freigegeben</EHStatus><EHButton href="#vergleiche" size="small" arrow>Jetzt vergleichen</EHButton></>
                    : <EHStatus>Kein Partner freigegeben</EHStatus>}
                </span>
              </article>
            );
          })}
        </div>
      </CompareRail>
    </EHOwnerSection>

    <EHOwnerSection title="Vertrag hinzufügen">
      <VertraegeAnlegeWege base="/app/preview/anlegen" />
    </EHOwnerSection>

  </WerkbankRahmen>;
}

/** Detailpanel unter der Tabelle: Fakten + Spar-Check, ohne Formulare
 *  (die echte Hausakte bearbeiten — hier ist es das Schaufenster). */
function PreviewDetail({ row }: { row: FristRow }) {
  const end = currentTermEnd(row);
  const estimate = row.status === 'active' && SAVINGS_KINDS.includes(row.kind as (typeof SAVINGS_KINDS)[number])
    ? estimateSavings({ kind: row.kind, yearlyCents: yearlyCents(row.cost_amount, row.cost_interval), postcode: '47055', householdSize: 3, hasLoyaltyBonus: false, switchWilling: true })
    : null;
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
        <Link href="/app/preview/vertraege">Schließen</Link>
      </p>
      <div className="eh-vertrag-fakten">
        {fakten.map(([label, value]) => (
          <span key={label} className="eh-vertrag-fakt"><small>{label}</small><b>{value}</b></span>
        ))}
        {row.status === 'active' && !SAVINGS_KINDS.includes(row.kind as (typeof SAVINGS_KINDS)[number]) && (
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
        </div>
      )}
      <EHText muted>Bearbeiten, Markieren und Belege sind der echten Hausakte vorbehalten.</EHText>
    </div>
  );
}
