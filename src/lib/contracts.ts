// Contracts and tariffs of the house file. Costs are stored in cents, matching
// the rest of the app (invoices, house history).

export const CONTRACT_KINDS = {
  strom: 'Strom',
  gas: 'Gas',
  dsl: 'DSL & Festnetz',
  mobilfunk: 'Mobilfunk',
  versicherung: 'Versicherung',
  heizung: 'Heizung & Wärme',
  wasser: 'Wasser & Abwasser',
  abfall: 'Abfall & Entsorgung',
  wartung: 'Wartungsvertrag',
  sonstiges: 'Sonstiges',
} as const;

export type ContractKind = keyof typeof CONTRACT_KINDS;
export const CONTRACT_KIND_KEYS = Object.keys(CONTRACT_KINDS) as ContractKind[];

export const COST_INTERVALS = {
  month: 'monatlich',
  quarter: 'vierteljährlich',
  halfyear: 'halbjährlich',
  year: 'jährlich',
} as const;

export type CostInterval = keyof typeof COST_INTERVALS;
export const COST_INTERVAL_KEYS = Object.keys(COST_INTERVALS) as CostInterval[];

export const CONTRACT_STATUSES = {
  active: 'Aktiv',
  cancelled: 'Gekündigt',
  expired: 'Ausgelaufen',
} as const;

const INTERVAL_MONTHS: Record<CostInterval, number> = { month: 1, quarter: 3, halfyear: 6, year: 12 };

export function contractKindLabel(kind: string): string {
  return CONTRACT_KINDS[kind as ContractKind] || 'Sonstiges';
}

export function costIntervalLabel(interval: string): string {
  return COST_INTERVALS[interval as CostInterval] || 'monatlich';
}

export function isCostInterval(value: string): value is CostInterval {
  return value in COST_INTERVALS;
}

export function isContractKind(value: string): value is ContractKind {
  return value in CONTRACT_KINDS;
}

export function monthlyCents(costAmount: number | null, interval: string): number | null {
  if (costAmount == null) return null;
  const months = INTERVAL_MONTHS[interval as CostInterval] || 1;
  return Math.round(costAmount / months);
}

export function yearlyCents(costAmount: number | null, interval: string): number | null {
  if (costAmount == null) return null;
  const months = INTERVAL_MONTHS[interval as CostInterval] || 1;
  return Math.round((costAmount / months) * 12);
}

export function parseDateInput(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(date: Date | null): string {
  return date ? date.toLocaleDateString('de-DE') : '—';
}

export function addMonths(base: Date, months: number): Date {
  const next = new Date(base.getTime());
  next.setMonth(next.getMonth() + months);
  return next;
}

export function addDays(base: Date, days: number): Date {
  return new Date(base.getTime() + days * 86400000);
}

/**
 * End of the currently running term. A contract that started in the past is
 * rolled forward by its renewal period until the end date lies in the future.
 */
export function currentTermEnd(row: { started_at?: string | null; term_months?: number | null; renewal_months?: number | null }): Date | null {
  const start = parseDateInput(row.started_at);
  if (!start) return null;
  const initial = row.term_months && row.term_months > 0 ? row.term_months : row.renewal_months || 12;
  const renewal = row.renewal_months && row.renewal_months > 0 ? row.renewal_months : initial;
  let end = addMonths(start, initial);
  const now = new Date();
  let guard = 0;
  while (end < now && guard < 1200) {
    end = addMonths(end, renewal);
    guard += 1;
  }
  return end;
}

/**
 * The date by which notice has to arrive. An explicitly stored deadline wins;
 * otherwise it is derived from the end of the term minus the notice period.
 */
export function cancellationDeadline(row: {
  cancellation_deadline?: string | null;
  started_at?: string | null;
  term_months?: number | null;
  renewal_months?: number | null;
  cancellation_days?: number | null;
}): Date | null {
  const explicit = parseDateInput(row.cancellation_deadline);
  if (explicit) return explicit;
  const end = currentTermEnd(row);
  if (!end) return null;
  return addDays(end, -(row.cancellation_days && row.cancellation_days >= 0 ? row.cancellation_days : 30));
}

export type DeadlineState = 'overdue' | 'soon' | 'planned' | 'unknown';

export function deadlineState(deadline: Date | null, today = new Date()): DeadlineState {
  if (!deadline) return 'unknown';
  const days = Math.round((deadline.getTime() - today.getTime()) / 86400000);
  if (days < 0) return 'overdue';
  if (days <= 90) return 'soon';
  return 'planned';
}

export function deadlineDays(deadline: Date | null, today = new Date()): number | null {
  if (!deadline) return null;
  return Math.round((deadline.getTime() - today.getTime()) / 86400000);
}

// --- Spar-Check -------------------------------------------------------------

export const SAVINGS_KINDS: readonly ContractKind[] = ['strom', 'gas', 'dsl', 'versicherung'];

export type SavingsInput = {
  kind: string;
  yearlyCents: number | null;
  postcode: string;
  householdSize: number | null;
  hasLoyaltyBonus: boolean;
  switchWilling: boolean;
};

export type SavingsEstimate = {
  lowCents: number;
  highCents: number;
  rateBps: number;
  reasons: string[];
  confidence: 'hoch' | 'mittel' | 'gering';
};

/**
 * Deliberately rule-based and therefore explainable: a switching recommendation
 * that cannot name its reasons is worth nothing to a homeowner. The band is a
 * planning aid, not a quote.
 */
export function estimateSavings(input: SavingsInput): SavingsEstimate | null {
  if (input.kind === 'strom' || input.kind === 'gas') {
    const base = input.yearlyCents ?? 150000;
    let bps = 1200;
    const reasons: string[] = [];
    if (input.yearlyCents == null) {
      reasons.push('Ohne Jahreskosten gerechnet – mit Verbrauch wird die Spanne enger.');
    } else if (base > 180000) {
      bps += 400;
      reasons.push('Überdurchschnittliche Jahreskosten – hier liegt meist das größte Sparpotenzial.');
    }
    if (input.hasLoyaltyBonus) {
      bps -= 300;
      reasons.push('Boni und Neukundenrabatte sind eingerechnet und fallen im zweiten Jahr oft weg.');
    }
    if (input.switchWilling) {
      bps += 200;
      reasons.push('Ein Anbieterwechsel ist eingeplant – das hebt die Spanne an.');
    }
    reasons.push('Grundannahme: Wechsel vom Grundversorgungstarif in einen günstigen Tarif mit Preisgarantie.');
    return {
      lowCents: Math.round((base * bps) / 10000),
      highCents: Math.round((base * (bps + 800)) / 10000),
      rateBps: bps,
      reasons,
      confidence: input.yearlyCents == null ? 'gering' : 'mittel',
    };
  }
  if (input.kind === 'dsl') {
    const base = input.yearlyCents ?? 60000;
    const reasons = [
      'Wechselgrund ist meist der Preis nach Ablauf der Mindestvertragslaufzeit, nicht die Leistung.',
      'Verfügbarkeit hängt von der Leitung ab – die Spanne ist deshalb bewusst breit.',
    ];
    if (input.yearlyCents == null) reasons.push('Ohne Jahreskosten gerechnet – mit Betrag wird die Spanne enger.');
    return {
      lowCents: Math.round((base * 1000) / 10000),
      highCents: Math.round((base * 2200) / 10000),
      rateBps: 1500,
      reasons,
      confidence: input.yearlyCents == null ? 'gering' : 'mittel',
    };
  }
  if (input.kind === 'versicherung') {
    const base = input.yearlyCents ?? 45000;
    const reasons = [
      'Bei Sachversicherungen zählt der Leistungsumfang mehr als der Preis – erst vergleichen, dann wechseln.',
      'Ein Wechsel ist meist zum Ende des Versicherungsjahres möglich.',
    ];
    if (input.householdSize && input.householdSize > 2) reasons.push('Größerer Haushalt: Prüfe, ob die Deckungssumme noch passt.');
    if (input.yearlyCents == null) reasons.push('Ohne Jahresbeitrag gerechnet – mit Beitrag wird die Spanne enger.');
    return {
      lowCents: Math.round((base * 800) / 10000),
      highCents: Math.round((base * 2000) / 10000),
      rateBps: 1200,
      reasons,
      confidence: 'gering',
    };
  }
  return null;
}

// Affiliate comparison partners live in src/lib/affiliate.ts. That module is the
// single source of truth: the partner list, the availability contract and the
// outgoing URL are all resolved there and validated again on the server before
// any redirect. There is deliberately no second partner list here.
