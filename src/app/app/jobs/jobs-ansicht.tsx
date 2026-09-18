'use client';

import Link from 'next/link';
import {
  EHDataTable,
  EHEmptyState,
  EHRecordCards,
  EHRecordTimeline,
  EHStatus,
  EHViewSwitcher,
  useEHRecordView,
  type EHRecordEntry,
} from '@/design-system';

export type JobAnsichtRow = {
  id: string;
  href: string;
  title: string;
  numberLine: string;
  business: string;
  statusLabel: string;
  tone: 'neutral' | 'info' | 'success' | 'warning';
  amount: string;
  detail: string;
  date?: string;
  dateLabel?: string;
  note?: string;
};

function asRecords(rows: readonly JobAnsichtRow[]): EHRecordEntry[] {
  return rows.map((row) => ({
    id: row.id,
    href: row.href,
    title: row.title,
    detail: row.detail,
    value: row.amount === '–' ? undefined : row.amount,
    date: row.date,
    dateLabel: row.dateLabel,
    note: row.note,
    status: <EHStatus tone={row.tone}>{row.statusLabel}</EHStatus>,
  }));
}

export function JobsAnsichtSwitcher() {
  const [view, setView] = useEHRecordView('auftraege', 'liste');
  return <EHViewSwitcher label="Aufträge: Ansicht wechseln" value={view} onChange={setView} />;
}

export function JobsAnsicht({
  label,
  rows,
  emptyTitle,
  emptyText,
}: {
  label: string;
  rows: readonly JobAnsichtRow[];
  emptyTitle: string;
  emptyText: string;
}) {
  const [view] = useEHRecordView('auftraege', 'liste');
  if (!rows.length) return <EHEmptyState title={emptyTitle} text={emptyText} />;

  const records = asRecords(rows);
  if (view === 'karten') return <EHRecordCards label={label} items={records} />;
  if (view === 'chronik') return <EHRecordTimeline label={label} items={records} />;

  return (
    <div className="eh-werkbank-tbl">
      <EHDataTable
        caption={label}
        columns={[
          { key: 'vorgang', label: 'Vorgang' },
          { key: 'betrieb', label: 'Betrieb' },
          { key: 'stand', label: 'Stand' },
          { key: 'betrag', label: 'Betrag', numeric: true },
        ]}
        rows={rows.map((row) => ({
          id: row.id,
          cells: {
            vorgang: (
              <>
                <Link href={row.href}>{row.title}</Link>
                <small>{row.numberLine}</small>
              </>
            ),
            betrieb: row.business,
            stand: <EHStatus tone={row.tone}>{row.statusLabel}</EHStatus>,
            betrag: row.amount,
          },
        }))}
      />
    </div>
  );
}
