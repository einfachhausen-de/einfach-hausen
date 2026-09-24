import { cancellationDeadline, contractKindLabel, monthlyCents } from './contracts';

/**
 * Vertrags-Filterung fuer /app/contracts und das Schaufenster
 * /app/preview/vertraege — reine Funktionen, damit beide Seiten dieselbe
 * Semantik haben und die Logik ohne Browser testbar ist. Status der Filter
 * lives in URL-Params (q, art, status, sort): GET-Formular + Links, kein JS,
 * funktioniert damit auch in cookie-/js-beschraenkten Vorschau-Panels.
 */

export type FilterableContract = {
  kind: string;
  status: string;
  provider: string;
  tariff: string;
  contract_number: string;
  notice: string;
  cost_amount: number | null;
  cost_interval: string;
  cancellation_deadline?: string | null;
  started_at?: string | null;
  term_months?: number | null;
  renewal_months?: number | null;
  cancellation_days?: number | null;
};

export type ContractStatusFilter = 'alle' | 'active' | 'cancelled' | 'expired';
export type ContractSort = 'frist' | 'kosten' | 'name';

export type ContractFilter = {
  q: string;
  kind: string | null;
  status: ContractStatusFilter;
  sort: ContractSort;
  /** 'Alle Spalten': blendet Art + Laufzeit bis zusaetzlich ein. */
  voll: boolean;
};

const DEFAULTS = { status: 'alle' as ContractStatusFilter, sort: 'frist' as ContractSort };

export function parseContractFilter(sp: Record<string, string | undefined>): ContractFilter {
  const raw = (sp.q ?? '').replace(/\s+/g, ' ').trim().slice(0, 80);
  const kind = sp.art && sp.art !== 'alle' ? sp.art : null;
  const status = sp.status === 'active' || sp.status === 'cancelled' || sp.status === 'expired' ? sp.status : DEFAULTS.status;
  const sort = sp.sort === 'kosten' || sp.sort === 'name' ? sp.sort : DEFAULTS.sort;
  return { q: raw, kind, status, sort, voll: sp.ansicht === 'voll' };
}

export function filterIsActive(f: ContractFilter): boolean {
  return f.q !== '' || f.kind !== null || f.status !== DEFAULTS.status || f.sort !== DEFAULTS.sort || f.voll;
}

/** Link-Baustein: uebernehmt den aktuellen Filter, ersetzt einzelne Achsen. */
export function withContractQuery(f: ContractFilter, over?: Partial<ContractFilter>): string {
  const next: ContractFilter = { ...f, ...over };
  const p = new URLSearchParams();
  if (next.q) p.set('q', next.q);
  if (next.kind) p.set('art', next.kind);
  if (next.status !== DEFAULTS.status) p.set('status', next.status);
  if (next.sort !== DEFAULTS.sort) p.set('sort', next.sort);
  if (next.voll) p.set('ansicht', 'voll');
  const s = p.toString();
  return s ? `?${s}` : '';
}

export function applyContractFilter<T extends FilterableContract>(rows: T[], f: ContractFilter): T[] {
  const needle = f.q.toLowerCase();
  const out = rows.filter((r) =>
    (!f.kind || r.kind === f.kind)
    && (f.status === 'alle' || r.status === f.status)
    && (!needle || `${r.provider} ${r.tariff} ${r.contract_number} ${r.notice} ${contractKindLabel(r.kind)}`.toLowerCase().includes(needle)));
  if (f.sort === 'kosten') {
    return [...out].sort((a, b) => (monthlyCents(b.cost_amount, b.cost_interval) ?? 0) - (monthlyCents(a.cost_amount, a.cost_interval) ?? 0));
  }
  if (f.sort === 'name') {
    return [...out].sort((a, b) => a.provider.localeCompare(b.provider, 'de'));
  }
  // frist: aktive zuerst (wie die ungefilterte Liste), dann naechste Frist;
  // ohne Frist ans Ende.
  const dl = (r: T) => cancellationDeadline(r)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  return [...out].sort((a, b) => (Number(b.status === 'active') - Number(a.status === 'active')) || dl(a) - dl(b));
}

/** Art-Pillen nur fuer Arten, die im Bestand wirklich vorkommen. */
export function contractKindCounts<T extends { kind: string }>(rows: T[]): { kind: string; label: string; count: number }[] {
  const map = new Map<string, number>();
  for (const r of rows) map.set(r.kind, (map.get(r.kind) ?? 0) + 1);
  return Array.from(map.entries())
    .map(([kind, count]) => ({ kind, label: contractKindLabel(kind), count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'de'));
}
