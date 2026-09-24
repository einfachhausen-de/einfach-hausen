import '@/components/werkbank-layout.css';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { EHOwnerSection, EHText } from '@/design-system';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import type { TabellenZeile } from '@/components/homeowner/vertraege-tabelle';
import { PREVIEW_RECHNUNG, previewVertraege } from '@/lib/preview-fixtures';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { euroExact } from '@/lib/format';
import {
  SAVINGS_KINDS, cancellationDeadline, contractKindLabel, currentTermEnd, deadlineDays,
  estimateSavings, formatDate, yearlyCents,
} from '@/lib/contracts';

/**
 * Schaufenster-Blatt zum Vertrag: eigene Seite statt Aufklapper (wie echt,
 * Betreiber 24.09. »ganz anders«) — nur ohne Schreibrechte und ohne
 * Partner-Klick. Daten zuerst aus der echten Hausakte, sonst Demo-Zeilen;
 * gerechnet wird immer mit der festen Preview-Rechnung.
 */

function fristText(row: TabellenZeile): string {
  const deadline = cancellationDeadline(row);
  if (!deadline) return 'Keine Frist erfasst';
  const days = deadlineDays(deadline) ?? 0;
  if (days < 0) return `Frist verpasst · ${formatDate(deadline)}`;
  if (days === 0) return 'Heute letzter Tag';
  return `Noch ${days} Tage · ${formatDate(deadline)}`;
}

export default async function PreviewVertragDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const num = Number(id);
  if (!Number.isInteger(num)) redirect('/app/preview/vertraege');
  let rows: TabellenZeile[] = [];
  try {
    const user = await requireUser();
    rows = db.prepare(
      'SELECT id, kind, provider, tariff, contract_number, cost_amount, cost_interval, started_at, term_months, renewal_months, cancellation_days, cancellation_deadline, notice, status FROM house_contracts WHERE homeowner_id=?',
    ).all(user.id) as TabellenZeile[];
  } catch { /* nach Sandbox-Reset kann der Zugriff fehlen — dann Demo-Zeilen */ }
  if (rows.length === 0) rows = previewVertraege() as unknown as TabellenZeile[];
  const row = rows.find((r) => r.id === num);
  if (!row) redirect('/app/preview/vertraege');
  const end = currentTermEnd(row);
  const estimate = row.status === 'active' && SAVINGS_KINDS.includes(row.kind as (typeof SAVINGS_KINDS)[number])
    ? estimateSavings({ kind: row.kind, yearlyCents: yearlyCents(row.cost_amount, row.cost_interval), postcode: PREVIEW_RECHNUNG.postcode, householdSize: PREVIEW_RECHNUNG.householdSize, hasLoyaltyBonus: false, switchWilling: true })
    : null;
  const statusText = row.status === 'active' ? fristText(row) : row.status === 'cancelled' ? 'Gekündigt' : 'Ausgelaufen';
  const fakten: [string, string][] = [
    ['Art', contractKindLabel(row.kind)],
    ...(row.tariff ? [['Tarif', row.tariff] as [string, string]] : []),
    ...(row.contract_number ? [['Vertragsnummer', row.contract_number] as [string, string]] : []),
    ...(row.started_at ? [['Beginn', formatDate(new Date(`${row.started_at.slice(0, 10)}T12:00:00`))] as [string, string]] : []),
    ...(end ? [['Laufzeit bis', formatDate(end)] as [string, string]] : []),
    ...(row.cancellation_days ? [['Kündigungsfrist', `${row.cancellation_days} Tage`] as [string, string]] : []),
  ];
  return (
    <WerkbankRahmen role="homeowner" active="/app/preview/vertraege">
      <EHOwnerSection
        title={row.provider}
        text={[statusText, row.tariff || null].filter(Boolean).join(' · ')}
        action={{ href: '/app/preview/vertraege', label: 'Alle Verträge' }}
      >
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
        <EHText muted>Bearbeiten, Markieren und Belege sind der <Link href="/app/contracts">echten Hausakte</Link> vorbehalten.</EHText>
      </EHOwnerSection>
    </WerkbankRahmen>
  );
}
