import Link from 'next/link';
import { ArrowRight, ArrowUp, ChevronsUpDown, ListFilter, Search, Table2 } from 'lucide-react';
import {
  cancellationDeadline, contractKindLabel, currentTermEnd, deadlineDays, deadlineState, formatDate,
} from '@/lib/contracts';
import { filterIsActive, withContractQuery, type ContractFilter, type ContractStatusFilter } from '@/lib/contract-filter';
import type { LucideIcon } from 'lucide-react';

/**
 * Vertragstabelle nach dem Muster, das der Betreiber am 24.09. gezeigt hat:
 * flache Zeilen, feine Trennlinien, Toolbar mit Suchfeld, Status-UmSchalter
 * und Spalten-Toggle — unsere Farben, unsere Daten, keine externen Links.
 * Serverseitig gerendert: Filter und Sortierung leben ausschliesslich in
 * URL-Params, ein einziges Sortieren/Filtern braucht kein JavaScript.
 */

export type TabellenZeile = {
  id: number;
  kind: string;
  provider: string;
  tariff: string;
  contract_number: string;
  cost_amount: number | null;
  cost_interval: string;
  started_at: string | null;
  term_months: number | null;
  renewal_months: number | null;
  cancellation_days: number | null;
  cancellation_deadline: string | null;
  notice: string;
  status: string;
  document_title?: string;
  document_path?: string | null;
  /** Obergrenze des Schaetzers in Cent, nur fuer aktive spaehrende Arten —
   *  der Koeder in der Liste: 'bis zu X € /Jahr'. */
  sparCents?: number | null;
};

const STATUS_CYCLE: ContractStatusFilter[] = ['alle', 'active', 'cancelled', 'expired'];
const STATUS_LABEL: Record<ContractStatusFilter, string> = {
  alle: 'Alle', active: 'Aktiv', cancelled: 'Gekündigt', expired: 'Ausgelaufen',
};
const INTERVAL_SHORT: Record<string, string> = { month: '/Monat', quarter: '/Quartal', halfyear: '/Halbjahr', year: '/Jahr' };

function euro(cents: number): string {
  return `${(cents / 100).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

function fristZelle(row: TabellenZeile): { text: string; tone: 'ok' | 'warn' | 'danger' | 'muted' } {
  if (row.status === 'cancelled') return { text: 'Gekündigt', tone: 'muted' };
  if (row.status === 'expired') return { text: 'Ausgelaufen', tone: 'muted' };
  const deadline = cancellationDeadline(row);
  if (!deadline) return { text: 'Keine Frist erfasst', tone: 'ok' };
  const days = deadlineDays(deadline) ?? 0;
  const state = deadlineState(deadline);
  if (state === 'overdue') return { text: days === 0 ? 'Heute letzter Tag' : `Frist verpasst · ${formatDate(deadline)}`, tone: 'danger' };
  if (state === 'soon') return { text: `Noch ${days} Tage · ${formatDate(deadline)}`, tone: days <= 7 ? 'danger' : 'warn' };
  return { text: `Entspannt · ${formatDate(deadline)}`, tone: 'ok' };
}

export function VertraegeTabelle({
  base, allRows, rows, filter, icons,
}: {
  base: string;
  allRows: TabellenZeile[];
  rows: TabellenZeile[];
  filter: ContractFilter;
  icons: Partial<Record<string, LucideIcon>>;
}) {
  const statusIdx = STATUS_CYCLE.indexOf(filter.status);
  const nextStatus = STATUS_CYCLE[(statusIdx + 1) % STATUS_CYCLE.length];
  /** Detail als eigene Route (Betreiber 24.09.: kein Aufklapper mehr). */
  const detailHref = (id: number) => `${base}/${id}`;
  const sortHead = (key: ContractFilter['sort'], label: string, extra = '') => (
    <th scope="col" className={key === filter.sort ? 'is-sorted' : undefined} {...(key === filter.sort ? { 'aria-sort': 'ascending' as const } : {})}>
      <Link href={`${base}${withContractQuery(filter, { sort: key })}`}>
        {label}{extra}
        {key === filter.sort ? <ArrowUp size={13} aria-hidden="true" /> : <ChevronsUpDown size={13} aria-hidden="true" className="eh-vtbl-sort-idle" />}
      </Link>
    </th>
  );

  return (
    <div className="eh-vtbl">
      <div className="eh-vtbl-tool">
        <form method="get" action={base} className="eh-vtbl-suche" role="search">
          <Search size={15} aria-hidden="true" />
          <input type="search" name="q" defaultValue={filter.q} placeholder="Anbieter, Tarif, Nummer oder Notiz filtern …" aria-label="Verträge filtern" />
          <button type="submit" className="eh-vtbl-suche-btn" aria-label="Suchen"><ArrowRight size={14} aria-hidden="true" /></button>
          <input type="hidden" name="status" value={filter.status} />
          <input type="hidden" name="sort" value={filter.sort} />
          {filter.kind && <input type="hidden" name="art" value={filter.kind} />}
          {filter.voll && <input type="hidden" name="ansicht" value="voll" />}
        </form>
        <Link className="eh-vtbl-btn" href={`${base}${withContractQuery(filter, { status: nextStatus })}`}>
          <ListFilter size={14} aria-hidden="true" /> Status: {STATUS_LABEL[filter.status]}
        </Link>
        <Link className="eh-vtbl-btn" href={`${base}${withContractQuery(filter, { voll: !filter.voll })}`}>
          <Table2 size={14} aria-hidden="true" /> {filter.voll ? 'Weniger Spalten' : 'Alle Spalten'}
        </Link>
      </div>

      {filterIsActive(filter) && (
        <p className="eh-vtbl-treffer">{rows.length} von {allRows.length} Verträgen · <Link href={base}>Alles zurücksetzen</Link></p>
      )}

      <table className="eh-vtbl-table">
        <thead>
          <tr>
            {sortHead('name', 'Anbieter')}
            {filter.voll && <th scope="col">Art</th>}
            {filter.voll && <th scope="col">Laufzeit bis</th>}
            {sortHead('frist', 'Frist')}
            <th scope="col" className="eh-vtbl-zahlen">{sortHeadInline(filter, base, 'kosten', 'Kosten')}</th>
            <th scope="col">Spar-Check</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={filter.voll ? 7 : 5} className="eh-vtbl-leer">Kein Vertrag passt zu Filter oder Suche. <Link href={base}>Alle zeigen</Link></td></tr>
          )}
          {rows.map((row) => {
            const Icon = icons[row.kind];
            const frist = fristZelle(row);
            const end = currentTermEnd(row);
            return (
              <tr key={row.id}>
                <td className="eh-vtbl-anbieter">
                  <Link href={detailHref(row.id)}>{Icon ? <Icon size={15} aria-hidden="true" /> : null}<b>{row.provider}</b></Link>
                  {(row.tariff || row.notice) && <small>{row.tariff || row.notice}</small>}
                </td>
                {filter.voll && <td>{contractKindLabel(row.kind)}</td>}
                {filter.voll && <td className="eh-vtbl-zahlen">{end ? formatDate(end) : '—'}</td>}
                <td className="eh-vtbl-frist" data-tone={frist.tone}>{frist.text}</td>
                <td className="eh-vtbl-zahlen eh-vtbl-kosten">
                  {row.cost_amount != null ? <><b>{euro(row.cost_amount)}</b><small>{INTERVAL_SHORT[row.cost_interval] ?? ''}</small></> : '—'}
                </td>
                <td>
                  {row.sparCents != null && row.sparCents > 0
                    ? <span className="eh-vtbl-spar">bis zu {euro(row.sparCents)} /Jahr</span>
                    : <span className="eh-vtbl-spar-leer">—</span>}
                </td>
                <td>
                  <span className="eh-vtbl-badge" data-tone={row.status === 'active' ? 'ok' : 'muted'}>
                    {row.status === 'active' ? 'Aktiv' : row.status === 'cancelled' ? 'Gekündigt' : 'Ausgelaufen'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Kosten-Spalte: sortierbarer Header, rechtsbuendig — kleiner Helfer, damit die Zelle im thead nicht haesslich verschachtelt. */
function sortHeadInline(filter: ContractFilter, base: string, key: ContractFilter['sort'], label: string) {
  return (
    <Link href={`${base}${withContractQuery(filter, { sort: key })}`} className="eh-vtbl-sortlink">
      {label}{key === filter.sort ? <ArrowUp size={13} aria-hidden="true" /> : <ChevronsUpDown size={13} aria-hidden="true" className="eh-vtbl-sort-idle" />}
    </Link>
  );
}
