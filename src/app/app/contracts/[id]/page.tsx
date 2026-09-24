import '@/components/werkbank-layout.css';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  EHButton, EHField, EHFieldGrid, EHFormSection, EHInput, EHOwnerSection, EHSelect,
  EHSubmitButton, EHText, EHTextarea, EHWorkflowForm,
} from '@/design-system';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import type { TabellenZeile } from '@/components/homeowner/vertraege-tabelle';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { euroExact } from '@/lib/format';
import {
  CONTRACT_KIND_KEYS, CONTRACT_KINDS, COST_INTERVAL_KEYS, COST_INTERVALS, SAVINGS_KINDS,
  type ContractKind, cancellationDeadline, contractKindLabel, currentTermEnd, deadlineDays,
  estimateSavings, formatDate, yearlyCents,
} from '@/lib/contracts';
import { setHouseContractStatusAction, updateHouseContractAction } from '@/app/actions';
import { AFFILIATE_CATEGORY_ACTIONS, resolveAffiliate } from '@/lib/affiliate';

/**
 * Vertrags-Blatt als eigene Seite (Betreiber 24.09.: »ganz anders« — nichts
 * mehr von Aufklappern an oder unter der Tabelle). Die Route ist das Detail:
 * Zurueck-Pille im Sektionskopf, Fakten als Kacheln, Spar-Check mit
 * Partner-Klick, Markieren und Bearbeiten in Ruhe und voller Breite.
 */

function fristText(row: TabellenZeile): string {
  const deadline = cancellationDeadline(row);
  if (!deadline) return 'Keine Frist erfasst';
  const days = deadlineDays(deadline) ?? 0;
  if (days < 0) return `Frist verpasst · ${formatDate(deadline)}`;
  if (days === 0) return 'Heute letzter Tag';
  return `Noch ${days} Tage · ${formatDate(deadline)}`;
}

export default async function VertragDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const num = Number(id);
  if (!Number.isInteger(num) || num <= 0) redirect('/app/contracts');
  const user = await requireUser();
  const row = db.prepare(
    'SELECT id, kind, provider, tariff, contract_number, cost_amount, cost_interval, started_at, term_months, renewal_months, cancellation_days, cancellation_deadline, notice, document_title, document_path, status FROM house_contracts WHERE id=? AND homeowner_id=?',
  ).get(num, user.id) as TabellenZeile | undefined;
  if (!row) redirect('/app/contracts');
  const profile = db.prepare('SELECT postcode FROM homeowner_profiles WHERE user_id=?').get(user.id) as { postcode?: string } | undefined;
  const end = currentTermEnd(row);
  const estimate = row.status === 'active' && SAVINGS_KINDS.includes(row.kind as ContractKind)
    ? estimateSavings({ kind: row.kind, yearlyCents: yearlyCents(row.cost_amount, row.cost_interval), postcode: profile?.postcode || '', householdSize: null, hasLoyaltyBonus: false, switchWilling: true })
    : null;
  const outbound = row.status === 'active' && estimate ? resolveAffiliate(row.kind, 'sparcheck') : null;
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
    <WerkbankRahmen role="homeowner" active="/app/contracts">
      <EHOwnerSection
        title={row.provider}
        text={[statusText, row.tariff || null].filter(Boolean).join(' · ')}
        action={{ href: '/app/contracts', label: 'Alle Verträge' }}
      >
        <div className="eh-vertrag-fakten">
          {fakten.map(([label, value]) => (
            <span key={label} className="eh-vertrag-fakt"><small>{label}</small><b>{value}</b></span>
          ))}
          {row.document_path && (
            <span className="eh-vertrag-fakt"><small>Beleg</small><b>
              <a href={`/api/house-contracts/${row.id}/document`} target="_blank" rel="noreferrer">{row.document_title || 'Vertragsdokument'}</a>
            </b></span>
          )}
          {row.status === 'active' && !SAVINGS_KINDS.includes(row.kind as ContractKind) && (
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
            {outbound?.status === 'available'
              ? <EHButton href={outbound.entryHref} size="small" arrow>{AFFILIATE_CATEGORY_ACTIONS[outbound.category]}</EHButton>
              : <EHText muted>Ein Klick führt erst zum freigegebenen Partner, sobald einer für {contractKindLabel(row.kind).toLowerCase()} angebunden ist — deine Daten bleiben hier.</EHText>}
            <EHText muted>Sieht dein Hausmanager anders? <Link href="/app/consultation">Kurz mit der KI gegenprüfen lassen</Link> — zwei Fragen, ohne Vertrag damit.</EHText>
          </div>
        )}
        <div className="eh-vertrag-aktionen">
          <EHWorkflowForm action={setHouseContractStatusAction.bind(null, row.id, row.status === 'active' ? 'cancelled' : 'active')}>
            <EHSubmitButton pendingLabel="Wird geändert …">
              {row.status === 'active' ? 'Als gekündigt markieren' : 'Wieder als aktiv markieren'}
            </EHSubmitButton>
          </EHWorkflowForm>
          <details className="eh-vertrag-edit">
            <summary>Vertrag bearbeiten</summary>
            <EHWorkflowForm action={updateHouseContractAction}>
              <input type="hidden" name="id" value={row.id} />
              <EHFormSection title="Vertragsdaten"><EHFieldGrid>
                <EHField id={`kind-${row.id}`} label="Art"><EHSelect id={`kind-${row.id}`} name="kind" defaultValue={row.kind}>{CONTRACT_KIND_KEYS.map((k) => <option key={k} value={k}>{CONTRACT_KINDS[k]}</option>)}</EHSelect></EHField>
                <EHField id={`provider-${row.id}`} label="Anbieter" required><EHInput id={`provider-${row.id}`} name="provider" defaultValue={row.provider} required /></EHField>
                <EHField id={`tariff-${row.id}`} label="Tarif (steht auf deiner Rechnung)"><EHInput id={`tariff-${row.id}`} name="tariff" defaultValue={row.tariff} /></EHField>
                <EHField id={`number-${row.id}`} label="Vertragsnummer"><EHInput id={`number-${row.id}`} name="contractNumber" defaultValue={row.contract_number} /></EHField>
              </EHFieldGrid></EHFormSection>
              <EHFormSection title="Kosten"><EHFieldGrid>
                <EHField id={`cost-${row.id}`} label="Betrag €"><EHInput id={`cost-${row.id}`} name="cost" inputMode="decimal" defaultValue={row.cost_amount != null ? String(row.cost_amount / 100).replace('.', ',') : ''} /></EHField>
                <EHField id={`interval-${row.id}`} label="Zahlweise"><EHSelect id={`interval-${row.id}`} name="costInterval" defaultValue={row.cost_interval}>{COST_INTERVAL_KEYS.map((k) => <option key={k} value={k}>{COST_INTERVALS[k]}</option>)}</EHSelect></EHField>
              </EHFieldGrid></EHFormSection>
              <EHFormSection title="Laufzeit & Kündigung"><EHFieldGrid>
                <EHField id={`start-${row.id}`} label="Vertragsbeginn"><EHInput id={`start-${row.id}`} name="startedAt" type="date" defaultValue={row.started_at?.slice(0, 10) || ''} /></EHField>
                <EHField id={`term-${row.id}`} label="Laufzeit (Monate)"><EHInput id={`term-${row.id}`} name="termMonths" type="number" min="0" defaultValue={row.term_months ?? ''} /></EHField>
                <EHField id={`renewal-${row.id}`} label="Verlängerung (Monate)"><EHInput id={`renewal-${row.id}`} name="renewalMonths" type="number" min="0" defaultValue={row.renewal_months ?? 12} /></EHField>
                <EHField id={`days-${row.id}`} label="Kündigungsfrist (Tage)"><EHInput id={`days-${row.id}`} name="cancellationDays" type="number" min="0" defaultValue={row.cancellation_days ?? 30} /></EHField>
                <EHField id={`deadline-${row.id}`} label="Kündigen bis" hint="Leer lassen, um aus Vertragsbeginn, Laufzeit und Frist zu rechnen."><EHInput id={`deadline-${row.id}`} name="cancellationDeadline" type="date" defaultValue={row.cancellation_deadline?.slice(0, 10) || ''} aria-describedby={`deadline-${row.id}-hint`} /></EHField>
              </EHFieldGrid></EHFormSection>
              <EHFormSection title="Notiz"><EHField id={`notice-${row.id}`} label="Notiz"><EHTextarea id={`notice-${row.id}`} name="notice" rows={3} maxLength={2000} defaultValue={row.notice} /></EHField></EHFormSection>
              <EHSubmitButton pendingLabel="Wird gespeichert …">Änderungen speichern</EHSubmitButton>
            </EHWorkflowForm>
          </details>
        </div>
      </EHOwnerSection>
    </WerkbankRahmen>
  );
}
