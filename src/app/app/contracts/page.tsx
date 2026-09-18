import Link from 'next/link';
import { FileSignature } from 'lucide-react';
import {
  EHButton, EHCallout, EHEmptyState, EHField, EHFieldGrid, EHFormFeedback,
  EHFormSection, EHInput, EHList, EHMetricsBar, EHRecordList, EHRecordViews,
  EHOwnerSection, EHSelect, EHStatus, EHSubmitButton, EHText,
  EHTextarea, EHWorkSection, EHWorkflowForm, EHDetailDisclosure,
} from '@/design-system';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { euroExact } from '@/lib/format';
import {
  CONTRACT_KIND_KEYS, CONTRACT_KINDS, COST_INTERVAL_KEYS, COST_INTERVALS, SAVINGS_KINDS, type ContractKind,
  affiliateLink, cancellationDeadline, contractKindLabel, costIntervalLabel, currentTermEnd,
  deadlineDays, deadlineState, estimateSavings, formatDate, monthlyCents, yearlyCents,
} from '@/lib/contracts';
import { addHouseContractAction, setHouseContractStatusAction, updateHouseContractAction } from '@/app/actions';


type ContractRow = {
  id: number; kind: string; provider: string; tariff: string; contract_number: string;
  cost_amount: number | null; cost_interval: string; started_at: string | null;
  term_months: number | null; renewal_months: number | null; cancellation_days: number | null;
  cancellation_deadline: string | null; notice: string; document_title: string;
  document_path: string | null; status: string;
};

const DEADLINE_TONE = { overdue: 'error', soon: 'warning', planned: 'info', unknown: 'neutral' } as const;

function deadlineLabel(row: ContractRow): string {
  const deadline = cancellationDeadline(row);
  if (!deadline) return 'Keine Frist erfasst';
  const days = deadlineDays(deadline) ?? 0;
  if (days < 0) return `Frist verpasst · ${formatDate(deadline)}`;
  if (days === 0) return 'Heute letzter Tag';
  return `Noch ${days} Tage · ${formatDate(deadline)}`;
}

/**
 * Werkbank-Kopf, Fokus-Karte und rechte Spalte dieser Seite. Ausschliesslich
 * Design-Tokens, keine Rohwerte: der Kopf traegt Titel und Kontext in
 * Zeilengroesse, die Kennzahlen bleiben auf dem Telefon in einer Reihe, und
 * die Karten der rechten Spalte nutzen dieselbe Registerlinie wie /app.
 */
const werkbankLayout = `
.eh-werkbank-rail-h { font-size:var(--eh-font-eyebrow); letter-spacing:var(--eh-track-wide); text-transform:uppercase; color:var(--eh-muted); font-weight:var(--eh-weight-bold); margin:0 0 10px; }
.eh-werkbank-karte { background:var(--eh-color-white); border:1px solid var(--eh-color-line); border-radius:var(--eh-radius-control); padding:13px 14px; margin-bottom:12px; }
.eh-werkbank-karte h4 { margin:0 0 9px; font-size:var(--eh-font-label); display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.eh-werkbank-karte h4 .eh-werkbank-badge { margin-left:auto; }
.eh-werkbank-badge { background:var(--eh-color-terra); color:var(--eh-color-white); border-radius:var(--eh-radius-pill); font-size:var(--eh-font-meta); font-weight:var(--eh-weight-bold); padding:1px 7px; }
.eh-werkbank-item { display:flex; gap:9px; padding:7px 0; border-top:1px solid var(--eh-color-line); font-size:var(--eh-font-meta); align-items:center; }
.eh-werkbank-item:first-of-type { border-top:0; }
.eh-werkbank-item b { display:block; font-weight:var(--eh-weight-semibold); }
.eh-werkbank-item small { color:var(--eh-muted); font-size:var(--eh-font-eyebrow); }
.eh-werkbank-item > :last-child { margin-left:auto; color:var(--eh-muted); text-align:right; }
.eh-werkbank-ic { width:24px; height:24px; display:grid; place-items:center; color:var(--eh-muted); flex:0 0 auto; font-size:var(--eh-font-meta); }
.eh-werkbank-go { display:block; text-align:center; background:var(--eh-color-petrol); color:var(--eh-color-white); border-radius:var(--eh-radius-control); padding:8px; font-weight:var(--eh-weight-semibold); margin-top:10px; text-decoration:none; font-size:var(--eh-font-label); }
.eh-werkbank-bar { height:7px; border-radius:var(--eh-radius-pill); background:var(--eh-color-paper); overflow:hidden; margin:8px 0 6px; }
.eh-werkbank-bar i { display:block; height:100%; background:var(--eh-color-petrol); }
.eh-werkbank-row { display:flex; padding:4px 0; font-size:var(--eh-font-meta); }
.eh-werkbank-row > :last-child { margin-left:auto; color:var(--eh-muted); }
.eh-werkbank-kopf { display:flex; align-items:center; gap:12px; padding-bottom:16px; border-bottom:1px solid var(--eh-rule); }
.eh-werkbank-kopf-copy { flex:1; min-width:0; display:grid; gap:2px; }
.eh-werkbank-kopf-tools { flex:none; display:flex; align-items:center; gap:8px; }
.eh-werkbank-kopf-cta { flex:none; display:inline-flex; align-items:center; gap:8px; background:var(--eh-color-petrol); color:var(--eh-color-white); border-radius:var(--eh-radius-control); padding:10px 18px; font-weight:var(--eh-weight-semibold); text-decoration:none; font-size:var(--eh-font-label); }
.eh-werkbank-kopf-copy h1 { font-size:var(--eh-font-body); font-weight:var(--eh-weight-semibold); line-height:var(--eh-leading-tight); }
.eh-werkbank-kopf-copy span { font-size:var(--eh-font-label); line-height:var(--eh-leading-normal); color:var(--eh-muted); }
.eh-werkbank-kennzahlen > dl { grid-auto-flow:column; grid-template-columns:repeat(3,minmax(0,1fr)); }
.eh-werkbank-kennzahlen > dl > div:nth-child(n) { min-height:76px; padding:12px 14px; border-top:0; }
.eh-werkbank-kennzahlen > dl > div:nth-child(n) + div { border-left:1px solid var(--eh-rule); }
`;

export default async function Contracts({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await requireUser('homeowner');
  const sp = await searchParams;
  const tab = sp.tab === 'sparcheck' ? 'sparcheck' : 'vertraege';
  const saved = sp.saved === '1';
  const profile = db.prepare('SELECT postcode FROM homeowner_profiles WHERE user_id=?').get(user.id) as { postcode?: string } | undefined;

  const contracts = db.prepare(`SELECT * FROM house_contracts WHERE homeowner_id=? ORDER BY CASE status WHEN 'active' THEN 0 WHEN 'cancelled' THEN 1 ELSE 2 END, provider COLLATE NOCASE`).all(user.id) as ContractRow[];
  const active = contracts.filter((c) => c.status === 'active');
  const monthlyTotal = active.reduce((sum, c) => sum + (monthlyCents(c.cost_amount, c.cost_interval) ?? 0), 0);
  // Jahreskosten und Spartenaufteilung lesen dieselben aktiven Vertraege wie
  // die Monatskennzahl: die Zahlen oben und die Eintraege rechts bleiben damit
  // nachvollziehbar, auch wenn ein Intervall nicht monatlich ist.
  const yearlyTotal = active.reduce((sum, c) => sum + (yearlyCents(c.cost_amount, c.cost_interval) ?? 0), 0);
  const monthlyByKind = new Map<string, { count: number; cents: number }>();
  for (const row of active) {
    const label = contractKindLabel(row.kind);
    const group = monthlyByKind.get(label) ?? { count: 0, cents: 0 };
    group.count += 1;
    group.cents += monthlyCents(row.cost_amount, row.cost_interval) ?? 0;
    monthlyByKind.set(label, group);
  }

  const withDeadline = active
    .map((row) => ({ row, deadline: cancellationDeadline(row), state: deadlineState(cancellationDeadline(row)) }))
    .filter((entry) => entry.state === 'overdue' || entry.state === 'soon')
    .sort((a, b) => (a.deadline?.getTime() ?? 0) - (b.deadline?.getTime() ?? 0));

  const selectedId = Number(sp.contract);
  const selected = contracts.find((c) => c.id === selectedId) ?? null;
  const estimate = selected
    ? estimateSavings({
        kind: selected.kind,
        yearlyCents: yearlyCents(selected.cost_amount, selected.cost_interval),
        postcode: profile?.postcode || '',
        householdSize: null,
        hasLoyaltyBonus: false,
        switchWilling: true,
      })
    : null;
  const outbound = selected ? affiliateLink(selected.kind) : undefined;

  // Die Ansichten haengen in der Seitenleiste (Vertraege & Tarife-Gruppe),
  // darum keine Pillen mehr im Inhalt. Der Spar-Check ist ein Bereich, kein
  // Reiter neben dem Kopf.
  const nextDeadline = withDeadline[0];

  return <WerkbankRahmen role="homeowner" active="/app/contracts" tabs={[
      { href: '/app/contracts?tab=vertraege', label: 'Laufende Verträge', active: tab === 'vertraege' },
      { href: '/app/contracts?tab=sparcheck', label: 'Spar-Check', active: tab === 'sparcheck' },
    ]} rail={<>
      <p className="eh-werkbank-rail-h">Kontext dieser Seite</p>
      <div className="eh-werkbank-karte">
        <h4>Nächste Kündigungsfrist{nextDeadline && <span className="eh-werkbank-badge">{nextDeadline.state === 'overdue' ? 'verpasst' : 'bald'}</span>}</h4>
        {nextDeadline ? <>
          <div className="eh-werkbank-item"><span className="eh-werkbank-ic"><FileSignature size={16} /></span><span><b>{contractKindLabel(nextDeadline.row.kind)} · {nextDeadline.row.provider}</b><small>{deadlineLabel(nextDeadline.row)}</small></span></div>
          <Link href={`/app/contracts?tab=sparcheck&contract=${nextDeadline.row.id}`} className="eh-werkbank-go">Spar-Check öffnen →</Link>
        </> : <p className="eh-werkbank-item">Keine Frist in den nächsten 90 Tagen. Sobald eine Kündigungsfrist näher rückt, steht sie hier.</p>}
      </div>
      <div className="eh-werkbank-karte">
        <h4>Kosten nach Sparte</h4>
        {monthlyByKind.size > 0 ? Array.from(monthlyByKind.entries()).sort((a, b) => b[1].cents - a[1].cents).map(([kind, group]) => (
          <div key={kind} className="eh-werkbank-row"><span>{kind} · {group.count} {group.count === 1 ? 'Vertrag' : 'Verträge'}</span><span>{euroExact(group.cents)}</span></div>
        )) : <p className="eh-werkbank-item">Noch kein aktiver Vertrag mit Kosten erfasst.</p>}
      </div>
      <div className="eh-werkbank-karte">
        <h4>Spar-Check</h4>
        <p className="eh-werkbank-item">Der Spar-Check schätzt aus deinen hinterlegten Kosten eine Ersparnis-Spanne. Möglich ist das für Strom, Gas, DSL und Versicherungen.</p>
        <Link href="/app/contracts?tab=sparcheck" className="eh-werkbank-go">Spar-Check öffnen →</Link>
      </div>
    </>}>
    <style>{werkbankLayout}</style>
    <header className="eh-werkbank-kopf">
      <div className="eh-werkbank-kopf-copy">
        <h1>Verträge &amp; Tarife</h1>
        <span>{`${active.length} aktiv · ${euroExact(monthlyTotal)} pro Monat`}</span>
      </div>
      <div className="eh-werkbank-kopf-tools">
        <Link className="eh-werkbank-kopf-cta" href="/app/documents">Alle Dokumente</Link>
      </div>
    </header>
    {saved && <EHFormFeedback kind="success">Gespeichert. Deine Hausakte ist aktuell.</EHFormFeedback>}

    {tab === 'vertraege' ? (
      <>
        <div className="eh-werkbank-kennzahlen">
          <EHMetricsBar label="Verträge" items={[
            { id: 'aktiv', label: 'Aktive Verträge', value: String(active.length), hint: `${contracts.length} erfasst` },
            { id: 'kosten', label: 'Kosten pro Monat', value: euroExact(monthlyTotal), hint: 'nur aktive Verträge' },
            { id: 'jahr', label: 'Kosten pro Jahr', value: euroExact(yearlyTotal), hint: 'aus den erfassten Intervallen' },
            { id: 'fristen', label: 'Fristen · 90 Tage', value: String(withDeadline.length), hint: withDeadline.length > 0 ? 'jetzt handeln' : 'nichts offen' },
          ]} />
        </div>

        {withDeadline.length > 0 && <EHOwnerSection title="Jetzt handeln">
          <EHRecordList label="Fristen in den nächsten 90 Tagen" items={withDeadline.map(({ row, state }) => ({
            id: `frist-${row.id}`,
            title: `${contractKindLabel(row.kind)} · ${row.provider}`,
            detail: deadlineLabel(row),
            status: <EHStatus tone={DEADLINE_TONE[state]}>{state === 'overdue' ? 'Verpasst' : 'Bald'}</EHStatus>,
            href: `/app/contracts?tab=sparcheck&contract=${row.id}`,
          }))} />
        </EHOwnerSection>}

        <EHOwnerSection title={`Alle Verträge · ${contracts.length}`}>
          {contracts.length === 0
            ? <EHEmptyState title="Noch kein Vertrag erfasst" text="Trag deinen Strom-, DSL- oder Versicherungsvertrag ein. Danach siehst du hier Kosten, Laufzeit und Kündigungsfrist – und im Spar-Check, ob sich ein Wechsel lohnt." />
            : <EHRecordViews label="Erfasste Verträge" storageKey="vertraege" defaultView="liste" switcherLabel="Verträge: Ansicht wechseln" items={contracts.map((row) => {
                const end = currentTermEnd(row);
                const started = row.started_at ? formatDate(new Date(`${row.started_at.slice(0, 10)}T12:00:00`)) : '';
                return {
                  id: String(row.id),
                  title: `${contractKindLabel(row.kind)} · ${row.provider}`,
                  detail: [
                    row.tariff,
                    end ? `Laufzeit bis ${formatDate(end)}` : started ? `Seit ${started}` : null,
                    row.notice,
                  ].filter(Boolean).join(' · '),
                  value: row.cost_amount != null ? `${euroExact(row.cost_amount)} ${costIntervalLabel(row.cost_interval)}` : undefined,
                  date: row.started_at?.slice(0, 10),
                  dateLabel: started,
                  status: row.status === 'active'
                    ? <EHStatus tone={DEADLINE_TONE[deadlineState(cancellationDeadline(row))]}>{deadlineLabel(row)}</EHStatus>
                    : <EHStatus tone="neutral">{row.status === 'cancelled' ? 'Gekündigt' : 'Ausgelaufen'}</EHStatus>,
                  action: row.document_path ? <a href={`/api/house-contracts/${row.id}/document`} target="_blank" rel="noreferrer">{row.document_title || 'Vertragsdokument'}</a> : undefined,
                };
              })} />}
        </EHOwnerSection>

        <EHOwnerSection title="Vertrag anpassen">
          {contracts.length === 0
            ? <EHText muted>Noch kein Vertrag erfasst. Erfasse zuerst einen Vertrag, dann kannst du hier Anbieter, Kosten und Laufzeit ändern.</EHText>
            : contracts.map((row) => <EHDetailDisclosure key={row.id} id={`vertrag-${row.id}`} title={`${contractKindLabel(row.kind)} · ${row.provider}`} description="Anbieter, Kosten, Laufzeit und Frist ändern">
              <EHWorkflowForm action={updateHouseContractAction}>
                <input type="hidden" name="id" value={row.id} />
                <EHFormSection title="Vertragsdaten"><EHFieldGrid>
                  <EHField id={`kind-${row.id}`} label="Sparte"><EHSelect id={`kind-${row.id}`} name="kind" defaultValue={row.kind}>{CONTRACT_KIND_KEYS.map((k) => <option key={k} value={k}>{CONTRACT_KINDS[k]}</option>)}</EHSelect></EHField>
                  <EHField id={`provider-${row.id}`} label="Anbieter" required><EHInput id={`provider-${row.id}`} name="provider" defaultValue={row.provider} required /></EHField>
                  <EHField id={`tariff-${row.id}`} label="Tarif"><EHInput id={`tariff-${row.id}`} name="tariff" defaultValue={row.tariff} /></EHField>
                  <EHField id={`number-${row.id}`} label="Vertragsnummer"><EHInput id={`number-${row.id}`} name="contractNumber" defaultValue={row.contract_number} /></EHField>
                </EHFieldGrid></EHFormSection>
                <EHFormSection title="Kosten"><EHFieldGrid>
                  <EHField id={`cost-${row.id}`} label="Betrag €"><EHInput id={`cost-${row.id}`} name="cost" inputMode="decimal" defaultValue={row.cost_amount != null ? String(row.cost_amount / 100).replace('.', ',') : ''} /></EHField>
                  <EHField id={`interval-${row.id}`} label="Intervall"><EHSelect id={`interval-${row.id}`} name="costInterval" defaultValue={row.cost_interval}>{COST_INTERVAL_KEYS.map((k) => <option key={k} value={k}>{COST_INTERVALS[k]}</option>)}</EHSelect></EHField>
                </EHFieldGrid></EHFormSection>
                <EHFormSection title="Laufzeit & Kündigung"><EHFieldGrid>
                  <EHField id={`start-${row.id}`} label="Vertragsbeginn"><EHInput id={`start-${row.id}`} name="startedAt" type="date" defaultValue={row.started_at?.slice(0, 10) || ''} /></EHField>
                  <EHField id={`term-${row.id}`} label="Erste Laufzeit in Monaten"><EHInput id={`term-${row.id}`} name="termMonths" type="number" min="0" defaultValue={row.term_months ?? ''} /></EHField>
                  <EHField id={`renewal-${row.id}`} label="Verlängerung in Monaten"><EHInput id={`renewal-${row.id}`} name="renewalMonths" type="number" min="0" defaultValue={row.renewal_months ?? 12} /></EHField>
                  <EHField id={`days-${row.id}`} label="Kündigungsfrist in Tagen"><EHInput id={`days-${row.id}`} name="cancellationDays" type="number" min="0" defaultValue={row.cancellation_days ?? 30} /></EHField>
                  <EHField id={`deadline-${row.id}`} label="Stichtag" hint="Leer lassen, um aus Vertragsbeginn, Laufzeit und Frist zu rechnen."><EHInput id={`deadline-${row.id}`} name="cancellationDeadline" type="date" defaultValue={row.cancellation_deadline?.slice(0, 10) || ''} aria-describedby={`deadline-${row.id}-hint`} /></EHField>
                </EHFieldGrid></EHFormSection>
                <EHFormSection title="Notiz"><EHField id={`notice-${row.id}`} label="Notiz"><EHTextarea id={`notice-${row.id}`} name="notice" rows={3} maxLength={2000} defaultValue={row.notice} /></EHField></EHFormSection>
                <EHSubmitButton pendingLabel="Wird gespeichert …">Änderungen speichern</EHSubmitButton>
              </EHWorkflowForm>
              <EHWorkflowForm action={setHouseContractStatusAction.bind(null, row.id, row.status === 'active' ? 'cancelled' : 'active')}>
                <EHSubmitButton pendingLabel="Wird geändert …">{row.status === 'active' ? 'Als gekündigt markieren' : 'Wieder als aktiv markieren'}</EHSubmitButton>
              </EHWorkflowForm>
            </EHDetailDisclosure>)}
        </EHOwnerSection>

        <EHOwnerSection title="Vertrag erfassen" action={{ href: '#vertrag-anlegen', label: 'Zum Formular' }}>
          <EHText muted>Pflicht ist nur der Anbieter. Alles andere kannst du später ergänzen.</EHText>
        </EHOwnerSection>
        <section id="vertrag-anlegen" aria-label="Vertrag anlegen"><EHWorkSection title="Vertrag erfassen">
          <EHWorkflowForm action={addHouseContractAction}>
            <EHFormSection title="Anbieter & Sparte" description="Pflicht ist nur der Anbieter. Alles andere kannst du später ergänzen."><EHFieldGrid>
              <EHField id="new-kind" label="Sparte"><EHSelect id="new-kind" name="kind" defaultValue="strom">{CONTRACT_KIND_KEYS.map((k) => <option key={k} value={k}>{CONTRACT_KINDS[k]}</option>)}</EHSelect></EHField>
              <EHField id="new-provider" label="Anbieter" required><EHInput id="new-provider" name="provider" required placeholder="z. B. Stadtwerke Musterstadt" /></EHField>
              <EHField id="new-tariff" label="Tarif"><EHInput id="new-tariff" name="tariff" placeholder="z. B. Basisstrom 12" /></EHField>
              <EHField id="new-number" label="Vertragsnummer"><EHInput id="new-number" name="contractNumber" /></EHField>
            </EHFieldGrid></EHFormSection>
            <EHFormSection title="Kosten"><EHFieldGrid>
              <EHField id="new-cost" label="Betrag €"><EHInput id="new-cost" name="cost" inputMode="decimal" placeholder="89,90" /></EHField>
              <EHField id="new-interval" label="Intervall"><EHSelect id="new-interval" name="costInterval" defaultValue="month">{COST_INTERVAL_KEYS.map((k) => <option key={k} value={k}>{COST_INTERVALS[k]}</option>)}</EHSelect></EHField>
            </EHFieldGrid></EHFormSection>
            <EHFormSection title="Laufzeit & Kündigungsfrist"><EHFieldGrid>
              <EHField id="new-start" label="Vertragsbeginn"><EHInput id="new-start" name="startedAt" type="date" /></EHField>
              <EHField id="new-term" label="Erste Laufzeit in Monaten"><EHInput id="new-term" name="termMonths" type="number" min="0" placeholder="24" /></EHField>
              <EHField id="new-renewal" label="Verlängerung in Monaten"><EHInput id="new-renewal" name="renewalMonths" type="number" min="0" defaultValue={12} /></EHField>
              <EHField id="new-days" label="Kündigungsfrist in Tagen"><EHInput id="new-days" name="cancellationDays" type="number" min="0" defaultValue={30} /></EHField>
              <EHField id="new-deadline" label="Stichtag" hint="Nur ausfüllen, wenn er abweichend feststeht."><EHInput id="new-deadline" name="cancellationDeadline" type="date" aria-describedby="new-deadline-hint" /></EHField>
            </EHFieldGrid></EHFormSection>
            <EHFormSection title="Dokument & Notiz">
              <EHFieldGrid>
                <EHField id="new-doc" label="Vertragsdokument"><EHInput id="new-doc" name="document" type="file" accept="application/pdf,image/*" /></EHField>
                <EHField id="new-doctitle" label="Dokumenttitel"><EHInput id="new-doctitle" name="documentTitle" placeholder="z. B. Stromvertrag 2024" /></EHField>
              </EHFieldGrid>
              <EHField id="new-notice" label="Notiz"><EHTextarea id="new-notice" name="notice" rows={3} maxLength={2000} /></EHField>
              <EHSubmitButton pendingLabel="Vertrag wird gespeichert …">In die Hausakte aufnehmen</EHSubmitButton>
            </EHFormSection>
          </EHWorkflowForm>
        </EHWorkSection></section>
      </>
    ) : (
      <>
        <div className="eh-werkbank-kennzahlen">
          <EHMetricsBar label="Spar-Check" items={[
            { id: 'auswahl', label: 'Zur Auswahl', value: String(contracts.length), hint: selected ? `${contractKindLabel(selected.kind)} · ${selected.provider}` : 'Vertrag wählen' },
            { id: 'moeglich', label: 'Spar-Check möglich', value: String(contracts.filter((row) => SAVINGS_KINDS.includes(row.kind as ContractKind)).length), hint: 'Strom, Gas, DSL, Versicherung' },
            { id: 'monat', label: 'Kosten ausgewählt', value: selected && selected.cost_amount != null ? `${euroExact(selected.cost_amount)} ${costIntervalLabel(selected.cost_interval)}` : '–', hint: selected ? contractKindLabel(selected.kind) : 'kein Vertrag gewählt' },
            { id: 'frist', label: 'Frist ausgewählt', value: selected ? (deadlineLabel(selected).split(' · ')[0]) : '–', hint: selected ? deadlineLabel(selected) : 'kein Vertrag gewählt' },
          ]} />
        </div>

        {contracts.length === 0
          ? <EHEmptyState title="Erst einen Vertrag erfassen" text="Der Spar-Check rechnet mit deinen echten Kosten. Trag dafür im Bereich „Laufende Verträge“ den Vertrag ein, den du prüfen willst." action={<EHButton href="/app/contracts?tab=vertraege">Vertrag erfassen</EHButton>} />
          : <>
              <EHOwnerSection title="Vertrag auswählen">
                <EHRecordList label="Verträge für den Spar-Check" items={contracts.map((row) => ({
                  id: `check-${row.id}`,
                  title: `${contractKindLabel(row.kind)} · ${row.provider}`,
                  detail: row.cost_amount != null ? `${euroExact(row.cost_amount)} ${costIntervalLabel(row.cost_interval)}` : 'Keine Kosten hinterlegt',
                  status: SAVINGS_KINDS.includes(row.kind as ContractKind) ? <EHStatus tone="info">Spar-Check möglich</EHStatus> : <EHStatus>Kein Vergleich</EHStatus>,
                  href: `/app/contracts?tab=sparcheck&contract=${row.id}`,
                }))} />
              </EHOwnerSection>

              {selected && <>
                <EHOwnerSection title={`Spar-Check · ${contractKindLabel(selected.kind)} · ${selected.provider}`}>
                  {!estimate && <EHFormFeedback kind="info">Für diese Sparte gibt es noch keine Vergleichsstrecke. Ein Spar-Check ist für Strom, Gas, DSL und Versicherungen möglich.</EHFormFeedback>}
                  {estimate && <>
                    <div className="eh-werkbank-kennzahlen">
                      <EHMetricsBar label="Spar-Check" items={[
                        { id: 'ersparnis', label: 'Ersparnis pro Jahr', value: `${euroExact(estimate.lowCents)} – ${euroExact(estimate.highCents)}` },
                        { id: 'ansatz', label: 'Ansatz Jahreskosten', value: `${Math.round(estimate.rateBps / 100)} %` },
                        { id: 'belastbarkeit', label: 'Belastbarkeit', value: estimate.confidence },
                      ]} />
                    </div>
                    <EHText>Diese Spanne beruht auf folgenden Annahmen:</EHText>
                    <EHList label="Annahmen der Einschätzung" items={estimate.reasons.map((reason, index) => ({ id: `grund-${index}`, title: reason }))} />
                  </>}
                </EHOwnerSection>

                <EHOwnerSection title="Nächste Schritte">
                  <EHList label="Nächste Schritte" items={[
                    { id: 'step-1', title: 'Kündigungsfrist prüfen', text: deadlineLabel(selected) },
                    { id: 'step-2', title: 'Angebote einholen', text: outbound ? 'Über unseren Partnerlink – siehe unten.' : 'Aktuell direkt beim Anbieter oder einem Vergleichsportal deiner Wahl.' },
                    { id: 'step-3', title: 'Nach dem Wechsel Vertrag hier aktualisieren', text: 'Neuer Anbieter, neuer Preis, neue Laufzeit – dann stimmt die nächste Frist wieder.' },
                  ]} />
                  {outbound
                    ? <EHButton href={outbound} arrow>Zum Tarifrechner des Partners</EHButton>
                    : <EHCallout title="Noch keine Partnervermittlung"><p>Sobald Affiliate-Partner für {contractKindLabel(selected.kind).toLowerCase()} vertraglich feststehen, führt dieser Weg direkt zum Tarifrechner. Bis dahin bleibt der Spar-Check bewusst eine Einschätzung ohne Ausleitung.</p></EHCallout>}
                </EHOwnerSection>
              </>}
            </>}
      </>
    )}
  </WerkbankRahmen>;
}
