import '@/components/werkbank-layout.css';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import { AngebotsListe } from '@/components/homeowner/angebote-liste';
import { EHButton, EHText } from '@/design-system';
import { db } from '@/lib/db';
import { SAVINGS_KINDS, type ContractKind, cancellationDeadline, estimateSavings, yearlyCents } from '@/lib/contracts';
import { AFFILIATE_CATEGORIES } from '@/lib/affiliate';
import { baueAngebote } from '@/lib/angebote';
import { PREVIEW_RECHNUNG, previewVertraege, type PreviewFristRow } from '@/lib/preview-fixtures';

/**
 * Angebote-Schaufenster (oeffentlich, ohne Login/Actions): dieselbe Liste wie
 * /app/angebote, aber mit Hinweis statt Affiliate-Klick. Demo-Zahlen aus
 * src/lib/preview-fixtures bzw. der lokalen Seed-DB.
 */
export default async function AngebotePreview({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  let CONTRACTS: PreviewFristRow[] = [];
  try {
    const u = db.prepare('SELECT id FROM users WHERE lower(email)=?').get('kunde@demo.einfachhausen.de') as { id: number } | undefined;
    if (u) CONTRACTS = db.prepare(`SELECT id, kind, provider, tariff, contract_number, cost_amount, cost_interval, started_at, term_months, renewal_months, cancellation_days, cancellation_deadline, notice, document_title, document_path, status FROM house_contracts WHERE homeowner_id=? ORDER BY CASE status WHEN 'active' THEN 0 WHEN 'cancelled' THEN 1 ELSE 2 END, provider COLLATE NOCASE`).all(u.id) as PreviewFristRow[];
  } catch { /* nach Sandbox-Reset kann der Seed fehlen — dann greifen die Demo-Zeilen */ }
  if (CONTRACTS.length === 0) CONTRACTS = previewVertraege();
  const active = CONTRACTS.filter((c) => c.status === 'active');

  const sparByKind = new Map<string, number>();
  for (const row of active) {
    if (!SAVINGS_KINDS.includes(row.kind as ContractKind)) continue;
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

  return <WerkbankRahmen role="homeowner" active="/app/preview/vertraege">
    <AngebotsListe base="/app/preview/angebote" sp={sp} alle={angebote} />
    <EHButton href="/app/preview/vertraege" variant="outline">zurück zu Verträge & Tarife</EHButton>
    <EHText muted>Kennenlern-Ansicht: echte Rechenlogik, feste Demo-Werte, keine Klicks nach draußen.</EHText>
  </WerkbankRahmen>;
}
