import '@/components/werkbank-layout.css';
import Link from 'next/link';
import {
  AlarmClock, ChevronRight, Droplets, FileSignature, FileText, Flame, ShieldCheck,
  Smartphone, Thermometer, Trash2, Wifi, Wrench, Zap,
} from 'lucide-react';
import {
  EHButton, EHField, EHFieldGrid, EHFormFeedback, EHFormSection, EHInput,
  EHOwnerSection, EHSelect, EHStatus, EHText, EHTextarea,
} from '@/design-system';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import styles from '../../eigentuemer-start.module.css';
import { euroExact } from '@/lib/format';
import {
  CONTRACT_KINDS, CONTRACT_KIND_KEYS, COST_INTERVALS, COST_INTERVAL_KEYS, SAVINGS_KINDS,
  contractKindLabel, currentTermEnd, cancellationDeadline, deadlineDays, deadlineState,
  estimateSavings, formatDate, monthlyCents, yearlyCents,
} from '@/lib/contracts';
import { AFFILIATE_CATEGORIES, AFFILIATE_CATEGORY_ACTIONS, AFFILIATE_CATEGORY_HINTS, AFFILIATE_CATEGORY_LABELS } from '@/lib/affiliate';

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

const INTERVAL_SHORT: Record<string, string> = { month: '/Monat', quarter: '/Quartal', halfyear: '/Halbjahr', year: '/Jahr' };

const KIND_ICONS = {
  strom: Zap, gas: Flame, dsl: Wifi, mobilfunk: Smartphone, versicherung: ShieldCheck,
  heizung: Thermometer, wasser: Droplets, abfall: Trash2, wartung: Wrench, sonstiges: FileText,
} as const;

const FRIST_STATE = { overdue: 'overdue', soon: 'soon', planned: 'planned', unknown: 'unknown' } as const;

const CONTRACTS: FristRow[] = [
  { id: 901, kind: 'strom', provider: 'Stadtwerke Duisburg', tariff: 'Basis Strom 12', contract_number: 'SWD-4413902', cost_amount: 4190, cost_interval: 'month', started_at: '2025-10-01', term_months: 12, renewal_months: 12, cancellation_days: 0, cancellation_deadline: inDays(0), notice: 'Kündigen heute noch möglich — danach ein Jahr länger gebunden.', document_title: '', document_path: null, status: 'active' },
  { id: 902, kind: 'dsl', provider: 'Telekom', tariff: 'MagentaZuhause XL', contract_number: 'TK-77120931', cost_amount: 4495, cost_interval: 'month', started_at: '2024-10-31', term_months: 24, renewal_months: 12, cancellation_days: 30, cancellation_deadline: inDays(7), notice: 'Router-Miete enthalten; Wechsel prüfen.', document_title: '', document_path: null, status: 'active' },
  { id: 903, kind: 'versicherung', provider: 'HUK24', tariff: 'Hausrat Komfort', contract_number: 'HUK-90221', cost_amount: 12800, cost_interval: 'year', started_at: '2021-11-01', term_months: 12, renewal_months: 12, cancellation_days: 30, cancellation_deadline: inDays(39), notice: 'Wohnfläche nach Umbau anpassen.', document_title: '', document_path: null, status: 'active' },
  { id: 904, kind: 'mobilfunk', provider: 'O2', tariff: 'Mobile M', contract_number: 'O2-3110884', cost_amount: 2999, cost_interval: 'month', started_at: '2025-05-01', term_months: 24, renewal_months: 12, cancellation_days: 30, cancellation_deadline: inDays(221), notice: '', document_title: '', document_path: null, status: 'active' },
  { id: 905, kind: 'gas', provider: 'Fluxio Energie', tariff: 'Fluxio Fix 24', contract_number: 'FLX-55201', cost_amount: 6400, cost_interval: 'month', started_at: '2024-01-15', term_months: 24, renewal_months: 12, cancellation_days: 30, cancellation_deadline: inDays(-14), notice: 'Gekündigt zum Jahresende — Bestätigung liegt in der Hausakte.', document_title: '', document_path: null, status: 'cancelled' },
];

export default function ContractsPreview() {
  const active = CONTRACTS.filter((c) => c.status === 'active');
  const monthlyTotal = active.reduce((sum, c) => sum + (monthlyCents(c.cost_amount, c.cost_interval) ?? 0), 0);

  const withDeadline = active
    .map((row) => ({ row, deadline: cancellationDeadline(row), state: deadlineState(cancellationDeadline(row)) }))
    .filter((entry) => entry.state === 'overdue' || entry.state === 'soon')
    .sort((a, b) => (a.deadline?.getTime() ?? 0) - (b.deadline?.getTime() ?? 0));
  const naechsteFrist = withDeadline[0];
  const focus = naechsteFrist
    ? {
        zahl: naechsteFrist.state === 'overdue' ? '!' : String(deadlineDays(naechsteFrist.deadline) ?? 0),
        strong: naechsteFrist.state === 'overdue' ? 'Kündigungsfrist verpasst' : 'Tage bis zur nächsten Frist',
        sub: `${contractKindLabel(naechsteFrist.row.kind)} · ${naechsteFrist.row.provider} · ${formatDate(naechsteFrist.deadline)}`,
        href: '#vertraege',
      }
    : null;

  const comparisonRows = AFFILIATE_CATEGORIES.map((category) => ({
    category,
    contract: active.find((row) => row.kind === category) ?? null,
    // In der Vorschau statisch: zwei Kategorien "freigegeben", Rest offen.
    available: category === 'strom' || category === 'dsl',
  }));

  const byKind = new Map<string, number>();
  for (const row of active) byKind.set(contractKindLabel(row.kind), (byKind.get(contractKindLabel(row.kind)) ?? 0) + (monthlyCents(row.cost_amount, row.cost_interval) ?? 0));

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
      {Array.from(byKind.entries()).sort((a, b) => b[1] - a[1]).map(([kind, cents]) => (
        <div key={kind} className="eh-werkbank-row"><span>{kind}</span><span>{euroExact(cents)}</span></div>
      ))}
    </div>
  </>}>

    <EHFormFeedback kind="info">
      Öffentliches Schaufenster mit Beispielwerten — keine Anmeldung, keine Speicherung. Die echte Seite ist /app/contracts.
    </EHFormFeedback>

    <header className="eh-werkbank-kopf">
      <div className="eh-werkbank-kopf-copy">
        <span>Hausakte · Vorschau</span>
        <h1>Verträge &amp; Tarife</h1>
        <span>{`${active.length} aktiv · ${euroExact(monthlyTotal)} pro Monat`}</span>
      </div>
      <div className="eh-werkbank-kopf-tools">
        <Link href="#vertrag-anlegen" className="eh-werkbank-kopf-cta">+ Vertrag</Link>
      </div>
    </header>

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

    <EHOwnerSection title={`Meine Verträge · ${CONTRACTS.length}`} action={{ href: '#vertrag-anlegen', label: '+ Erfassen' }}>
      <div id="vertraege" />
      <div className="eh-vertrag-list">{CONTRACTS.map((row) => {
        const Icon = KIND_ICONS[row.kind as keyof typeof KIND_ICONS] ?? FileText;
        const state = row.status === 'active' ? deadlineState(cancellationDeadline(row)) : 'unknown';
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
          <details key={row.id} id={`vertrag-${row.id}`} className="eh-vertrag" data-past={row.status !== 'active' || undefined}>
            <summary>
              <span className="eh-vertrag-ic" aria-hidden="true"><Icon size={16} /></span>
              <span className="eh-vertrag-body">
                <strong>{row.provider}</strong>
                <small>{row.notice || `Keine Notiz · Frist prüfen und ggf. ${fristText(row).toLowerCase()}`}</small>
              </span>
              <span className="eh-vertrag-rechts">
                {row.cost_amount != null && (
                  <span className="eh-vertrag-cost"><b>{euroExact(row.cost_amount)}</b><small>{INTERVAL_SHORT[row.cost_interval] ?? ''}</small></span>
                )}
                <span className="eh-vertrag-frist" data-state={FRIST_STATE[state as keyof typeof FRIST_STATE]}>
                  {row.status === 'active' ? fristText(row) : row.status === 'cancelled' ? 'Gekündigt' : 'Ausgelaufen'}
                </span>
              </span>
            </summary>
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
                <EHButton href="#vergleiche" variant="secondary" size="small" arrow>{AFFILIATE_CATEGORY_ACTIONS[row.kind as keyof typeof AFFILIATE_CATEGORY_ACTIONS] ?? 'Jetzt vergleichen'}</EHButton>
              </div>
            )}
            <EHText muted>Bearbeiten, Markieren und Belege sind der echten Hausakte vorbehalten.</EHText>
          </details>
        );
      })}</div>
    </EHOwnerSection>

    <EHOwnerSection title="Vergleichen & Tarife">
      <div id="vergleiche" />
      <EHText muted>Wir zeigen keine eigenen Tarife und keine Rangliste. Der Vergleich läuft beim jeweiligen Partner, dort wird auch abgeschlossen. Deine Vertragsdaten bleiben in der Hausakte und werden nicht an den Partner übertragen.</EHText>
      <div className="eh-vergleich-list">
        {comparisonRows.map(({ category, contract, available }) => {
          const yearly = contract ? yearlyCents(contract.cost_amount, contract.cost_interval) : null;
          const deadline = contract ? cancellationDeadline(contract) : null;
          const CatIcon = { strom: Zap, gas: Flame, dsl: Wifi, mobilfunk: Smartphone, versicherung: ShieldCheck }[category];
          return (
            <div key={category} id={`vergleich-${category}`} className="eh-vergleich-zeile">
              <span className="eh-vergleich-ic" aria-hidden="true"><CatIcon size={16} /></span>
              <span className="eh-vergleich-body">
                <strong>{AFFILIATE_CATEGORY_LABELS[category]}</strong>
                <small>{AFFILIATE_CATEGORY_HINTS[category]}</small>
                <small className="eh-vergleich-kontext">
                  {contract
                    ? `Dein Vertrag: ${contract.provider}${yearly != null ? ` · ${euroExact(yearly)} pro Jahr` : ''}${deadline ? ` · Frist ${formatDate(deadline)}` : ''}`
                    : 'Noch kein Vertrag erfasst — der Vergleich nutzt später deine echten Kosten.'}
                </small>
              </span>
              <span className="eh-vergleich-rechts">
                {available
                  ? <><EHStatus tone="success">Partner freigegeben</EHStatus><EHButton href="#vergleiche" variant="secondary" size="small" arrow>Jetzt vergleichen</EHButton></>
                  : <EHStatus>Kein Partner freigegeben</EHStatus>}
              </span>
            </div>
          );
        })}
      </div>
    </EHOwnerSection>

    <section id="vertrag-anlegen" aria-label="Vertrag anlegen (Vorschau)">
      <EHOwnerSection title="Neuer Vertrag">
        <EHFormSection title="Anbieter & Art" description="Pflicht ist nur der Anbieter. Laufzeit und Frist kannst du später ergänzen."><EHFieldGrid>
          <EHField id="pv-kind" label="Art"><EHSelect id="pv-kind" name="kind" defaultValue="strom" disabled>{CONTRACT_KIND_KEYS.map((k) => <option key={k} value={k}>{CONTRACT_KINDS[k]}</option>)}</EHSelect></EHField>
          <EHField id="pv-provider" label="Anbieter" required><EHInput id="pv-provider" name="provider" placeholder="z. B. Stadtwerke Musterstadt" disabled /></EHField>
          <EHField id="pv-tariff" label="Tarif (steht auf deiner Rechnung)"><EHInput id="pv-tariff" name="tariff" placeholder="z. B. Basisstrom 12" disabled /></EHField>
        </EHFieldGrid></EHFormSection>
        <EHFormSection title="Kosten"><EHFieldGrid>
          <EHField id="pv-cost" label="Betrag €"><EHInput id="pv-cost" name="cost" inputMode="decimal" placeholder="89,90" disabled /></EHField>
          <EHField id="pv-interval" label="Zahlweise"><EHSelect id="pv-interval" name="costInterval" defaultValue="month" disabled>{COST_INTERVAL_KEYS.map((k) => <option key={k} value={k}>{COST_INTERVALS[k]}</option>)}</EHSelect></EHField>
        </EHFieldGrid></EHFormSection>
        <EHFormSection title="Beleg & Notiz">
          <EHField id="pv-notice" label="Notiz"><EHTextarea id="pv-notice" name="notice" rows={3} placeholder="In der Vorschau ohne Speicherung — in der echten Hausakte landet der Vertrag hier." disabled /></EHField>
        </EHFormSection>
      </EHOwnerSection>
    </section>
  </WerkbankRahmen>;
}
