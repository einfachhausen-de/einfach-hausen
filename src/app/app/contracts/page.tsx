import '@/components/werkbank-layout.css';
import Link from 'next/link';
import {
  Droplets, FileText, Flame, ShieldCheck,
  Smartphone, Thermometer, Trash2, Wifi, Wrench, Zap,
} from 'lucide-react';
import {
  EHActionTiles, EHButton, EHOfferCard, EHEmptyState, EHFormFeedback, EHOwnerSection,
} from '@/design-system';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import { VertraegeTabelle, type TabellenZeile } from '@/components/homeowner/vertraege-tabelle';
import { CompareRail } from '@/components/homeowner/compare-rail';
import { baueAngebote, sortiereVorschlaege } from '@/lib/angebote';
import { requireUser } from '@/lib/auth';
import { VertraegeAnlegeWege } from '@/components/homeowner/anlege-wege';
import { db } from '@/lib/db';
import { euroExact } from '@/lib/format';
import {
  SAVINGS_KINDS, type ContractKind, cancellationDeadline, contractKindLabel,
  estimateSavings, monthlyCents, yearlyCents,
} from '@/lib/contracts';
import { applyContractFilter, filterIsActive, parseContractFilter } from '@/lib/contract-filter';
import { AFFILIATE_CATEGORIES, resolveAffiliate } from '@/lib/affiliate';

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

/** Vertragstyp = Tabellenzeile — Detail und Tabelle teilen sich eine Form. */
type ContractRow = TabellenZeile;

const KIND_ICONS = {
  strom: Zap, gas: Flame, dsl: Wifi, mobilfunk: Smartphone, versicherung: ShieldCheck,
  heizung: Thermometer, wasser: Droplets, abfall: Trash2, wartung: Wrench, sonstiges: FileText,
} as const;

export default async function Contracts({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await requireUser('homeowner');
  const sp = await searchParams;
  const saved = sp.saved === '1';
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
  const angebote = baueAngebote({
    categories: AFFILIATE_CATEGORIES,
    contractFuer: (k) => active.find((r) => r.kind === k) ?? null,
    fristFuer: (k) => { const r = active.find((row) => row.kind === k); return r ? cancellationDeadline(r) : null; },
    sparFuer: (k) => sparByKind.get(k) ?? 0,
    statusFuer: (k) => resolveAffiliate(k, 'vergleichsuebersicht').status,
    outbound: true,
  });

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
                { label: 'Hochladen', href: '/app/contracts/anlegen?weg=hochladen', icon: 'file-up' },
                { label: 'Scannen', href: '/app/contracts/anlegen?weg=scannen', icon: 'camera' },
                { label: 'Selbst eintragen', href: '/app/contracts/anlegen?weg=manuell', icon: 'pen' },
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

    {saved && (
      <div className="eh-vdash-gespeichert">
        <EHFormFeedback kind="success">Geschafft. Der Vertrag ist ab sofort im Spar-Check dabei.</EHFormFeedback>
        <Link href="/app/contracts/anlegen" className="eh-werkbank-kopf-cta">Noch einen? Dauert 20 Sekunden</Link>
      </div>
    )}
    {comparisonNotice && <EHFormFeedback kind="info">{comparisonNotice}</EHFormFeedback>}

    <EHOwnerSection title={filterIsActive(filter) ? `Meine Verträge · ${visible.length} von ${contracts.length}` : `Meine Verträge · ${contracts.length}`} action={{ href: '/app/angebote', label: 'Alle ansehen' }}>
      <div id="vertraege" />
      {contracts.length === 0
        ? <EHEmptyState title="Noch kein Vertrag erfasst" text="Trag deinen Strom-, DSL- oder Versicherungsvertrag ein. Danach siehst du hier Kosten, Laufzeit und Kündigungsfrist – und ob sich ein Wechsel lohnt." action={<EHButton href="/app/contracts/anlegen">Jetzt Vertrag anlegen</EHButton>} />
        : (
          <>
            <VertraegeTabelle base="/app/contracts" allRows={contracts} rows={visible} filter={filter} icons={KIND_ICONS} />
            {contracts.length > 0 && contracts.length < 4 && (
              <p className="eh-vdash-nudge">Je mehr Verträge du erfasst, desto genauer dein Spar-Check — auch Gas, Handy, Abo oder Versicherung gehören in die Hausakte. <Link href="/app/contracts/anlegen">Weitersammeln</Link></p>
            )}
          </>
        )}
    </EHOwnerSection>

    <EHOwnerSection title="Angebote in deiner Nähe" action={{ href: '/app/angebote', label: 'Alle ansehen' }}>
      <div id="vergleiche" />
      <CompareRail label="Angebote nebeneinander">
        <div className="eh-vergleich-slider">
          {sortiereVorschlaege(angebote).map((a) => (
            <EHOfferCard key={a.category} id={a.id} hue={a.hue} icon={a.icon} title={a.title} badge={a.badge} brand={a.brand} text={a.text} meta={a.meta} action={a.action} note={a.note} />
          ))}
        </div>
      </CompareRail>
    </EHOwnerSection>

    <EHOwnerSection title="Vertrag hinzufügen">
      <VertraegeAnlegeWege base="/app/contracts/anlegen" />
    </EHOwnerSection>

  </WerkbankRahmen>;
}

/** Aufgeklappter Zustand eines Tabellen-Zeile: Fakten, Spar-Check, Bearbeiten
 *  — die Inhalte der alten Karten, jetzt als Detailpanel unter der Tabelle. */
