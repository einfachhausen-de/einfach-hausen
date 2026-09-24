import { AFFILIATE_CATEGORY_HINTS, AFFILIATE_CATEGORY_LABELS } from './affiliate';
import { euroExact } from './format';
import { deadlineDays, formatDate, monthlyCents, yearlyCents } from './contracts';

/**
 * Angebots-Modell (Betreiber 24.09.): dieselben Zahlen fuettern die Rail auf
 * den Verträge-Seiten UND die Angebote-Liste (/app/angebote, CHECK24-Dealz-
 * Muster: Suche, Filter, Ersparnis-Sortierung). Ein Angebot existiert je
 * Kategorie; ein Vorschlag ist es nur, wenn die Spar-Rechnung ueber dem
 * erfassten eigenen Tarif liegt — decided by sparCents, not by prose.
 */

export const VERGLEICH_HUES: Record<string, string> = { strom: 'sonne', gas: 'himmel', dsl: 'veilchen', mobilfunk: 'rose', versicherung: 'stahl' };
export const VERGLEICH_ICONS = { strom: 'bolt', gas: 'flame', dsl: 'wifi', mobilfunk: 'phone', versicherung: 'shield' } as const;
export type VergleichsIcon = (typeof VERGLEICH_ICONS)[keyof typeof VERGLEICH_ICONS];

export type Angebot = {
  id: string;
  category: string;
  hue: string;
  icon: VergleichsIcon | 'compare';
  title: string;
  brand?: string;
  text: string;
  /** Pille auf der Rail-Kachel: nur bei Vorschlag. */
  badge?: string;
  /** Kurztext fuer die Liste: 'bis zu 1.909,44 € pro Jahr'. */
  sparText?: string;
  rateText?: string;
  fristKurz?: string;
  meta: { icon?: 'clock'; label: string }[];
  action?: { href: string; label: string };
  note?: string;
  vorschlag: boolean;
  sparCents: number;
  rateCents: number | null;
};

export type AngebotsContract = {
  provider: string;
  cost_amount: number | null;
  cost_interval: string;
} | null;

export function baueAngebote(o: {
  categories: readonly string[];
  contractFuer: (kategorie: string) => AngebotsContract;
  /** Erofeterte Kuendigungsfrist oder null — nur gesetzt, wenn ein Vertrag da ist. */
  fristFuer: (kategorie: string) => Date | null;
  /** Jaeliches Sparergebnis in Cent (0 = kein Vorschlag). */
  sparFuer: (kategorie: string) => number;
  statusFuer: (kategorie: string) => 'available' | 'unavailable' | 'error';
  /** false in der Vorschau: keine Affiliate-Klicke, dafuer Hinweis. */
  outbound: boolean;
}): Angebot[] {
  return o.categories.map((category) => {
    const contract = o.contractFuer(category);
    const spar = o.sparFuer(category);
    const yearly = contract ? yearlyCents(contract.cost_amount, contract.cost_interval) : null;
    const monthly = contract ? monthlyCents(contract.cost_amount, contract.cost_interval) ?? yearly : null;
    const frist = contract ? o.fristFuer(category) : null;
    const status = o.statusFuer(category);
    const tage = frist ? deadlineDays(frist) ?? 0 : null;
    return {
      id: `vergleich-${category}`,
      category,
      hue: VERGLEICH_HUES[category] ?? 'stahl',
      icon: VERGLEICH_ICONS[category as keyof typeof VERGLEICH_ICONS] ?? 'compare',
      title: AFFILIATE_CATEGORY_LABELS[category as keyof typeof AFFILIATE_CATEGORY_LABELS] ?? category,
      brand: contract?.provider,
      text: contract ? `Aktuell ${euroExact(monthly ?? 0)} pro Monat` : AFFILIATE_CATEGORY_HINTS[category as keyof typeof AFFILIATE_CATEGORY_HINTS] ?? 'Noch kein Vertrag erfasst.',
      badge: spar > 0 ? `Bis zu ${euroExact(spar)} pro Jahr drin` : undefined,
      sparText: spar > 0 ? `bis zu ${euroExact(spar)} pro Jahr` : undefined,
      rateText: monthly != null ? `${euroExact(monthly)} pro Monat` : undefined,
      fristKurz: frist == null || tage == null
        ? undefined
        : tage < 0 ? 'Frist verpasst' : tage === 0 ? 'Frist heute' : `Frist in ${tage} Tagen`,
      meta: contract
        ? [{ icon: 'clock' as const, label: frist ? `Kündigen bis ${formatDate(frist)}` : 'Keine Frist erfasst · jederzeit prüfbar' }]
        : [{ label: 'Sobald du den Tarif erfasst, rechnen wir mit deinen echten Kosten' }],
      action: o.outbound && status === 'available' ? { href: `/api/affiliate/${category}`, label: 'Jetzt vergleichen' } : undefined,
      note: !o.outbound
        ? status === 'available' ? 'Vergleich läuft in der echten Hausakte' : 'Kein Partner freigeschaltet'
        : status === 'available' ? undefined : status === 'error' ? 'Konfiguration prüfen' : 'Noch kein Partner freigeschaltet',
      vorschlag: spar > 0,
      sparCents: spar,
      rateCents: monthly ?? null,
    };
  });
}

/** Vorschlaege zuerst, sonst Erfassungsreihenfolge (stabil). */
export function sortiereVorschlaege(list: Angebot[]): Angebot[] {
  return list
    .map((angebot, i) => ({ angebot, i, rang: angebot.vorschlag ? 0 : 1 }))
    .sort((a, b) => a.rang - b.rang || a.i - b.i)
    .map(({ angebot }) => angebot);
}

/** Liste-Filter der Angebote-Seite: Suche, Kategorie, Vorschlags-Modus, Sortierung. */
export function filtereAngebote(
  list: Angebot[],
  sp: { q?: string; art?: string; nur?: string; sort?: string },
): { sichtbar: Angebot[]; aktiv: boolean } {
  const q = (sp.q ?? '').trim().toLowerCase();
  const nur = sp.nur === '1';
  const aktiv = q.length > 0 || !!sp.art || nur;
  let sichtbar = list.filter((a) => {
    if (sp.art && a.category !== sp.art) return false;
    if (nur && !a.vorschlag) return false;
    if (q) {
      const hay = `${a.title} ${a.brand ?? ''} ${a.text}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  sichtbar = sp.sort === 'name'
    ? [...sichtbar].sort((a, b) => a.title.localeCompare(b.title, 'de'))
    : [...sichtbar].sort((a, b) => b.sparCents - a.sparCents || (b.rateCents ?? 0) - (a.rateCents ?? 0));
  return { sichtbar, aktiv };
}
