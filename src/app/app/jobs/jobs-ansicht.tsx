'use client';

import Link from 'next/link';
import {
  EHDataTable,
  EHEmptyState,
  EHStatus,
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
  if (!rows.length) return <EHEmptyState title={emptyTitle} text={emptyText} />;

  // Bewusst genau eine Ansicht: eine ruhige Tabelle. Karten und Chronik
  // zeigten dieselben Aufträge nur anders an und verwirrten.
  return (
    <div className="eh-werkbank-tbl">
      <EHDataTable
        caption={label}
        columns={[
          { key: 'auftrag', label: 'Auftrag' },
          { key: 'betrieb', label: 'Betrieb' },
          { key: 'status', label: 'Status' },
          { key: 'betrag', label: 'Betrag', numeric: true },
        ]}
        rows={rows.map((row) => ({
          id: row.id,
          cells: {
            auftrag: (
              <>
                <Link href={row.href}>{row.title}</Link>
                <small>{row.numberLine}</small>
              </>
            ),
            betrieb: row.business,
            status: <EHStatus tone={row.tone}>{row.statusLabel}</EHStatus>,
            betrag: row.amount,
          },
        }))}
      />
    </div>
  );
}
