import '@/components/werkbank-layout.css';
import Link from 'next/link';
import {
  Droplets, FileText, Flame, ShieldCheck,
  Smartphone, Thermometer, Trash2, Wifi, Wrench, Zap,
} from 'lucide-react';
import {
  EHActionTiles, EHOfferCard, EHFormFeedback, EHOwnerSection, EHText,
} from '@/design-system';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import { euroExact } from '@/lib/format';
import { VertraegeTabelle } from '@/components/homeowner/vertraege-tabelle';
import { VertraegeAnlegeWege } from '@/components/homeowner/anlege-wege';
import { CompareRail } from '@/components/homeowner/compare-rail';
import { baueAngebote, sortiereVorschlaege } from '@/lib/angebote';
import { PREVIEW_RECHNUNG, previewVertraege, type PreviewFristRow } from '@/lib/preview-fixtures';
import { db } from '@/lib/db';
import { applyContractFilter, filterIsActive, parseContractFilter } from '@/lib/contract-filter';
import {
  SAVINGS_KINDS, contractKindLabel, currentTermEnd, cancellationDeadline, deadlineDays,
  estimateSavings, formatDate, monthlyCents, yearlyCents,
} from '@/lib/contracts';
import { AFFILIATE_CATEGORIES } from '@/lib/affiliate';

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


function fristText(row: PreviewFristRow): string {
  const deadline = cancellationDeadline(row);
  if (!deadline) return 'Keine Frist erfasst';
  const days = deadlineDays(deadline) ?? 0;
  if (days < 0) return `Frist verpasst · ${formatDate(deadline)}`;
  if (days === 0) return 'Heute letzter Tag';
  return `Noch ${days} Tage · ${formatDate(deadline)}`;
}

const KIND_ICONS = {
  strom: Zap, gas: Flame, dsl: Wifi, mobilfunk: Smartphone, versicherung: ShieldCheck,
  heizung: Thermometer, wasser: Droplets, abfall: Trash2, wartung: Wrench, sonstiges: FileText,
} as const;


export default async function ContractsPreview({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  // Echte Demo-Datenbank vor festen Zeilen: wer im Seed etwas aendert, sieht
  // es hier sofort (Betreiber-Wunsch 24.09.: 'richtige db, nicht nur cards').
  let CONTRACTS: PreviewFristRow[] = [];
  try {
    const u = db.prepare(`SELECT id FROM users WHERE lower(email)=?`).get('kunde@demo.einfachhausen.de') as { id: number } | undefined;
    if (u) {
      CONTRACTS = db.prepare(`SELECT id, kind, provider, tariff, contract_number, cost_amount, cost_interval, started_at, term_months, renewal_months, cancellation_days, cancellation_deadline, notice, document_title, document_path, status FROM house_contracts WHERE homeowner_id=? ORDER BY CASE status WHEN 'active' THEN 0 WHEN 'cancelled' THEN 1 ELSE 2 END, provider COLLATE NOCASE`).all(u.id) as PreviewFristRow[];
    }
  } catch { /* nach Sandbox-Reset kann der Seed fehlen — dann greifen die Demo-Zeilen */ }
  if (CONTRACTS.length === 0) CONTRACTS = previewVertraege();
  const sparFor = (row: PreviewFristRow) => row.status === 'active' && SAVINGS_KINDS.includes(row.kind as (typeof SAVINGS_KINDS)[number])
    ? estimateSavings({ kind: row.kind, yearlyCents: yearlyCents(row.cost_amount, row.cost_interval), postcode: PREVIEW_RECHNUNG.postcode, householdSize: PREVIEW_RECHNUNG.householdSize, hasLoyaltyBonus: false, switchWilling: true })?.highCents ?? null
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
    const e = estimateSavings({ kind: row.kind, yearlyCents: yearlyCents(row.cost_amount, row.cost_interval), postcode: PREVIEW_RECHNUNG.postcode, householdSize: PREVIEW_RECHNUNG.householdSize, hasLoyaltyBonus: false, switchWilling: true });
    if (e) sparByKind.set(row.kind, Math.max(sparByKind.get(row.kind) ?? 0, e.highCents));
  }
  const angebote = baueAngebote({
    categories: AFFILIATE_CATEGORIES,
    contractFuer: (k) => active.find((r) => r.kind === k) ?? null,
    fristFuer: (k) => { const r = active.find((row) => row.kind === k); return r ? cancellationDeadline(r) : null; },
    sparFuer: (k) => sparByKind.get(k) ?? 0,
    statusFuer: (k) => (k === 'strom' || k === 'dsl' ? 'available' : 'unavailable'),
    outbound: false,
  });

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

      <div className="eh-akt-abstand">
        <EHActionTiles
          ariaLabel="Schnellaktionen"
          tiles={[
            {
              label: 'Vertrag erfassen',
              hint: 'Beleg rein — die KI liest Anbieter, Frist, Titel',
              icon: 'file-up',
              menuLabel: 'Weg zum Vertrag auswählen',
              items: [
                { label: 'Hochladen', href: '/app/preview/anlegen?weg=hochladen', icon: 'file-up' },
                { label: 'Scannen', href: '/app/preview/anlegen?weg=scannen', icon: 'camera' },
                { label: 'Selbst eintragen', href: '/app/preview/anlegen?weg=manuell', icon: 'pen' },
              ],
            },
            {
              label: 'Anbieter vergleichen',
              hint: 'Fünf Kategorien, Vergleich beim Partner',
              icon: 'compare',
              menuLabel: 'Kategorie zum Vergleichen auswählen',
              items: [
                { label: 'Strom', href: '#vergleich-strom', icon: 'bolt' },
                { label: 'Gas', href: '#vergleich-gas', icon: 'flame' },
                { label: 'Internet & Festnetz', href: '#vergleich-dsl', icon: 'wifi' },
                { label: 'Mobilfunk', href: '#vergleich-mobilfunk', icon: 'phone' },
                { label: 'Versicherungen', href: '#vergleich-versicherung', icon: 'shield' },
              ],
            },
          ]}
        />
      </div>

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

    <EHOwnerSection title="Angebote in deiner Nähe" action={{ href: '/app/preview/angebote', label: 'Alle ansehen' }}>
      <div id="vergleiche" />
      <EHText muted>Wir zeigen keine eigenen Tarife und keine Rangliste. Der Vergleich läuft beim jeweiligen Partner, dort wird auch abgeschlossen. Deine Vertragsdaten bleiben in der Hausakte und werden nicht an den Partner übertragen.</EHText>
      <CompareRail label="Angebote nebeneinander">
        <div className="eh-vergleich-slider">
          {sortiereVorschlaege(angebote).map((a) => (
            <EHOfferCard key={a.category} id={a.id} hue={a.hue} icon={a.icon} title={a.title} badge={a.badge} brand={a.brand} text={a.text} meta={a.meta} note={a.note} />
          ))}
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
function PreviewDetail({ row }: { row: PreviewFristRow }) {
  const end = currentTermEnd(row);
  const estimate = row.status === 'active' && SAVINGS_KINDS.includes(row.kind as (typeof SAVINGS_KINDS)[number])
    ? estimateSavings({ kind: row.kind, yearlyCents: yearlyCents(row.cost_amount, row.cost_interval), postcode: PREVIEW_RECHNUNG.postcode, householdSize: PREVIEW_RECHNUNG.householdSize, hasLoyaltyBonus: false, switchWilling: true })
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
