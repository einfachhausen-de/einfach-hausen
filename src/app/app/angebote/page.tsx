import '@/components/werkbank-layout.css';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import { AngebotsListe } from '@/components/homeowner/angebote-liste';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { SAVINGS_KINDS, type ContractKind, cancellationDeadline, estimateSavings, yearlyCents } from '@/lib/contracts';
import { AFFILIATE_CATEGORIES, resolveAffiliate } from '@/lib/affiliate';
import { baueAngebote } from '@/lib/angebote';

/**
 * Angebote (Betreiber 24.09.): die "Alle ansehen"-Seite der Verträge-Sektion —
 * Unterpunkt von 'Verträge & Tarife'. Aufbau nach dem CHECK24-Dealz-Muster
 * (Suche, Kategoriechips, Sortierung, Zahlzeile, Deal-Karten), Optik im
 * versiegelten Designkern. Zahlen und Filterlogik teilt sie sich mit der Rail
 * ueber src/lib/angebote — kein zweiter Zahlensumpf.
 */
type ContractRow = {
  kind: string; provider: string; cost_amount: number | null; cost_interval: string;
  started_at: string | null; term_months: number | null; renewal_months: number | null;
  cancellation_days: number | null; cancellation_deadline: string | null; status: string;
};

export default async function Angebote({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await requireUser('homeowner');
  const sp = await searchParams;
  const profile = db.prepare('SELECT postcode FROM homeowner_profiles WHERE user_id=?').get(user.id) as { postcode?: string } | undefined;
  const rows = db.prepare(`SELECT kind, provider, cost_amount, cost_interval, started_at, term_months, renewal_months, cancellation_days, cancellation_deadline, status FROM house_contracts WHERE homeowner_id=? ORDER BY CASE status WHEN 'active' THEN 0 ELSE 1 END, provider COLLATE NOCASE`).all(user.id) as ContractRow[];
  const active = rows.filter((r) => r.status === 'active');

  const sparByKind = new Map<string, number>();
  for (const row of active) {
    if (!SAVINGS_KINDS.includes(row.kind as ContractKind)) continue;
    const e = estimateSavings({ kind: row.kind, yearlyCents: yearlyCents(row.cost_amount, row.cost_interval), postcode: profile?.postcode || '', householdSize: null, hasLoyaltyBonus: false, switchWilling: true });
    if (e) sparByKind.set(row.kind, Math.max(sparByKind.get(row.kind) ?? 0, e.highCents));
  }
  const angebote = baueAngebote({
    categories: AFFILIATE_CATEGORIES,
    contractFuer: (k) => active.find((r) => r.kind === k) ?? null,
    fristFuer: (k) => { const r = active.find((row) => row.kind === k); return r ? cancellationDeadline(r) : null; },
    sparFuer: (k) => sparByKind.get(k) ?? 0,
    statusFuer: (k) => resolveAffiliate(k, 'vergleichsuebersicht').status,
    outbound: true,
  });

  return <WerkbankRahmen role="homeowner" active="/app/angebote" rail={<div className="eh-werkbank-karte"><h4>Woher die Zahlen kommen</h4><p className="eh-werkbank-item">Das Sparpotenzial rechnet der Spar-Check aus deinen erfassten Kosten, PLZ und Wechselbereitschaft — als Spanne, nicht als Angebot im rechtlichen Sinn.</p><p className="eh-werkbank-item">Abgeschlossen wird beim Partner; deine Vertragsdaten bleiben in der Hausakte.</p></div>}>
    <AngebotsListe base="/app/angebote" sp={sp} alle={angebote} />
  </WerkbankRahmen>;
}
