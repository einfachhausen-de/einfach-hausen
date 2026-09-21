import '@/components/werkbank-layout.css';
import Link from 'next/link';
import { FileSignature } from 'lucide-react';
import {
  EHButton, EHCallout, EHEmptyState, EHField, EHFieldGrid, EHFormFeedback,
  EHFormSection, EHFileInput, EHInput, EHList, EHMetricsBar, EHRecordList, EHRecordViews,
  EHOwnerSection, EHSelect, EHStatus, EHSubmitButton, EHText,
  EHTextarea, EHWorkSection, EHWorkflowForm, EHDetailDisclosure,
} from '@/design-system';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { euroExact } from '@/lib/format';
import {
  CONTRACT_KIND_KEYS, CONTRACT_KINDS, COST_INTERVAL_KEYS, COST_INTERVALS, SAVINGS_KINDS, type ContractKind,
  cancellationDeadline, contractKindLabel, costIntervalLabel, currentTermEnd,
  deadlineDays, deadlineState, estimateSavings, formatDate, monthlyCents, yearlyCents,
} from '@/lib/contracts';
import { addHouseContractAction, setHouseContractStatusAction, updateHouseContractAction } from '@/app/actions';
import {
  AFFILIATE_CATEGORIES, AFFILIATE_CATEGORY_ACTIONS, AFFILIATE_CATEGORY_HINTS,
  AFFILIATE_CATEGORY_LABELS, isAffiliateCategory, resolveAffiliate,
} from '@/lib/affiliate';

/**
 * Hinweise, mit denen der Weiterleitungs-Endpunkt hierher zurueckkommt. Die
 * Texte sagen, dass nichts geoeffnet und nichts uebertragen wurde - ein
 * abgelehnter oder fehlender Partner darf nie wie ein Fehler des Nutzers
 * aussehen.
 */
const COMPARISON_NOTICES: Record<string, string> = {
  'nicht-verfuegbar': 'Für diese Kategorie ist derzeit kein Vergleichspartner freigegeben. Es wurde nichts geöffnet und nichts übertragen.',
  'einwilligung': 'Ohne deine ausdrückliche Einwilligung wird der Klick nicht gemessen. Der Vergleich wurde deshalb nicht geöffnet.',
  'fehler': 'Die Partnerkonfiguration ist unvollständig. Aus Sicherheitsgründen wurde nichts geöffnet und nichts übertragen.',
};


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

export default async function Contracts({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await requireUser('homeowner');
  const sp = await searchParams;
  const tab = sp.tab === 'sparcheck' ? 'sparcheck' : sp.tab === 'vergleichen' ? 'vergleichen' : 'vertraege';
  const saved = sp.saved === '1';
  const profile = db.prepare('SELECT postcode FROM homeowner_profiles WHERE user_id=?').get(user.id) as { postcode?: string } | undefined;

  const contracts = db.prepare(`SELECT * FROM house_contracts WHERE homeowner_id=? ORDER BY CASE status WHEN 'active' THEN 0 WHEN 'cancelled' THEN 1 ELSE 2 END, provider COLLATE NOCASE`).all(user.id) as ContractRow[];
  const active = contracts.filter((c) => c.status === 'active');
  const monthlyTotal = active.reduce((sum, c) => sum + (monthlyCents(c.cost_amount, c.cost_interval) ?? 0), 0);
  // Jahreskosten liest dieselben aktiven Vertraege wie die Monatskennzahl.
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
  // Nur die fünf Vergleichskategorien haben einen Vergleichsweg. Wasser, Abfall,
  // Wartung und sonstige Verträge werden bewusst nicht ausgeleitet.
  const outbound = selected && isAffiliateCategory(selected.kind) ? resolveAffiliate(selected.kind, 'sparcheck') : null;

  // Vergleichsbereich: je Kategorie ein Kontext aus dem tatsächlich erfassten
  // Vertrag. Fehlt der Vertrag, bleibt der Kontext leer statt geschätzt - eigene
  // Tarifdaten und künstliche Rankings gibt es hier bewusst nicht.
  const comparisonRows = AFFILIATE_CATEGORIES.map((category) => ({
    category,
    contract: active.find((row) => row.kind === category) ?? null,
    availability: resolveAffiliate(category, 'vergleichsuebersicht'),
  }));
  const comparisonNotice = isAffiliateCategory(sp.vergleich) && sp.hinweis
    ? COMPARISON_NOTICES[sp.hinweis]
    : null;

  // Die Ansichten haengen in der Seitenleiste (Vertraege & Tarife-Gruppe),
  // darum keine Pillen mehr im Inhalt. Der Spar-Check ist ein Bereich, kein
  // Reiter neben dem Kopf.
  const nextDeadline = withDeadline[0];

  return <WerkbankRahmen role="homeowner" active="/app/contracts" tabs={[
      { href: '/app/contracts?tab=vertraege', label: 'Verträge', active: tab === 'vertraege' },
      { href: '/app/contracts?tab=vergleichen', label: 'Vergleich', active: tab === 'vergleichen' },
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
        <h4>Kosten nach Art</h4>
        {monthlyByKind.size > 0 ? Array.from(monthlyByKind.entries()).sort((a, b) => b[1].cents - a[1].cents).map(([kind, group]) => (
          <div key={kind} className="eh-werkbank-row"><span>{kind} · {group.count} {group.count === 1 ? 'Vertrag' : 'Verträge'}</span><span>{euroExact(group.cents)}</span></div>
        )) : <p className="eh-werkbank-item">Noch kein aktiver Vertrag mit Kosten erfasst.</p>}
      </div>
    </>}>
    
    <header className="eh-werkbank-kopf">
      <div className="eh-werkbank-kopf-copy">
        <h1>Verträge</h1>
        <span>{`${active.length} aktiv · ${euroExact(monthlyTotal)} pro Monat`}</span>
      </div>
    </header>
    {saved && <EHFormFeedback kind="success">Gespeichert. Deine Hausakte ist aktuell.</EHFormFeedback>}

    {tab === 'vertraege' ? (
      <>
        <div className="eh-werkbank-kennzahlen">
          <EHMetricsBar label="Verträge" items={[
            { id: 'aktiv', label: 'Aktive Verträge', value: String(active.length), hint: `${contracts.length} erfasst` },
            { id: 'kosten', label: 'Kosten pro Monat', value: euroExact(monthlyTotal), hint: 'nur aktive Verträge' },
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
            ? <EHEmptyState title="Noch kein Vertrag erfasst" text="Trag unten deinen ersten Vertrag ein. Danach kannst du hier Anbieter, Kosten und Laufzeit ändern." action={<EHButton href="#vertrag-anlegen">Vertrag erfassen</EHButton>} />
            : contracts.map((row) => <EHDetailDisclosure key={row.id} id={`vertrag-${row.id}`} title={`${contractKindLabel(row.kind)} · ${row.provider}`} description="Anbieter, Kosten, Laufzeit und Frist ändern">
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
              <EHWorkflowForm action={setHouseContractStatusAction.bind(null, row.id, row.status === 'active' ? 'cancelled' : 'active')}>
                <EHSubmitButton pendingLabel="Wird geändert …">{row.status === 'active' ? 'Als gekündigt markieren' : 'Wieder als aktiv markieren'}</EHSubmitButton>
              </EHWorkflowForm>
            </EHDetailDisclosure>)}
        </EHOwnerSection>

        <section id="vertrag-anlegen" aria-label="Vertrag anlegen"><EHWorkSection title="Neuer Vertrag">
          <EHWorkflowForm action={addHouseContractAction}>
            <EHFormSection title="Anbieter & Art" description="Pflicht ist nur der Anbieter. Laufzeit und Frist kannst du später ergänzen."><EHFieldGrid>
              <EHField id="new-kind" label="Art"><EHSelect id="new-kind" name="kind" defaultValue="strom">{CONTRACT_KIND_KEYS.map((k) => <option key={k} value={k}>{CONTRACT_KINDS[k]}</option>)}</EHSelect></EHField>
              <EHField id="new-provider" label="Anbieter" required><EHInput id="new-provider" name="provider" required placeholder="z. B. Stadtwerke Musterstadt" /></EHField>
              <EHField id="new-tariff" label="Tarif (steht auf deiner Rechnung)"><EHInput id="new-tariff" name="tariff" placeholder="z. B. Basisstrom 12" /></EHField>
            </EHFieldGrid></EHFormSection>
            <EHFormSection title="Kosten"><EHFieldGrid>
              <EHField id="new-cost" label="Betrag €"><EHInput id="new-cost" name="cost" inputMode="decimal" placeholder="89,90" /></EHField>
              <EHField id="new-interval" label="Zahlweise"><EHSelect id="new-interval" name="costInterval" defaultValue="month">{COST_INTERVAL_KEYS.map((k) => <option key={k} value={k}>{COST_INTERVALS[k]}</option>)}</EHSelect></EHField>
            </EHFieldGrid></EHFormSection>
            <EHFormSection title="Beleg & Notiz">
              <EHFieldGrid>
                <div className="eh-werkbank-filefield"><EHField id="new-doc" label="Foto oder Rechnung"><EHFileInput id="new-doc" name="document" accept="application/pdf,image/*" /></EHField></div>
                <EHField id="new-doctitle" label="Titel des Belegs"><EHInput id="new-doctitle" name="documentTitle" placeholder="z. B. Stromvertrag 2024" /></EHField>
              </EHFieldGrid>
              <EHField id="new-notice" label="Notiz"><EHTextarea id="new-notice" name="notice" rows={3} maxLength={2000} /></EHField>
              <EHSubmitButton pendingLabel="Vertrag wird gespeichert …">In die Hausakte aufnehmen</EHSubmitButton>
            </EHFormSection>
          </EHWorkflowForm>
        </EHWorkSection></section>
      </>
    ) : tab === 'sparcheck' ? (
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
                      <EHMetricsBar label="Spar-Check" items={[
                        { id: 'ersparnis', label: 'Mögliche Ersparnis pro Jahr', value: `${euroExact(estimate.lowCents)} – ${euroExact(estimate.highCents)}` },
                        { id: 'sicherheit', label: 'Wie sicher ist die Schätzung', value: estimate.confidence },
                        { id: 'basis', label: 'Deine Jahreskosten', value: euroExact(yearlyCents(selected.cost_amount, selected.cost_interval)), hint: 'aus dem erfassten Vertrag' },
                      ]} />
                    <EHText>Diese Spanne beruht auf folgenden Annahmen:</EHText>
                    <EHList label="Annahmen der Einschätzung" items={estimate.reasons.map((reason, index) => ({ id: `grund-${index}`, title: reason }))} />
                  </>}
                </EHOwnerSection>

                <EHOwnerSection title="Nächste Schritte">
                  <EHList label="Nächste Schritte" items={[
                    { id: 'step-1', title: 'Kündigungsfrist prüfen', text: deadlineLabel(selected) },
                    { id: 'step-2', title: 'Angebote einholen', text: outbound?.status === 'available' ? 'Über den geprüften Partnervergleich unten bei „Vergleich“.' : 'Aktuell direkt beim Anbieter oder einem Vergleichsportal deiner Wahl.' },
                    { id: 'step-3', title: 'Nach dem Wechsel Vertrag hier aktualisieren', text: 'Neuer Anbieter, neuer Preis, neue Laufzeit – dann stimmt die nächste Frist wieder.' },
                  ]} />
                  {outbound?.status === 'available'
                    ? <EHButton href={outbound.entryHref} arrow>{AFFILIATE_CATEGORY_ACTIONS[outbound.category]}</EHButton>
                    : <EHCallout title="Noch keine Partnervermittlung"><p>Sobald ein Vergleichspartner für {contractKindLabel(selected.kind).toLowerCase()} freigegeben ist, führt dieser Weg direkt zu seinem Tarifrechner. Bis dahin bleibt der Spar-Check bewusst eine Einschätzung ohne Ausleitung.</p></EHCallout>}
                </EHOwnerSection>
              </>}
            </>}
      </>
    ) : (
      <>
        <div className="eh-werkbank-kennzahlen">
          <EHMetricsBar label="Vergleich" items={[
            { id: 'kategorien', label: 'Kategorien', value: String(AFFILIATE_CATEGORIES.length), hint: 'Strom, Gas, Internet, Mobilfunk, Versicherung' },
            { id: 'partner', label: 'Freigegebene Partner', value: String(comparisonRows.filter((row) => row.availability.status === 'available').length), hint: 'nur vertraglich freigegebene Partner' },
            { id: 'eigene', label: 'Eigene Verträge', value: String(comparisonRows.filter((row) => row.contract).length), hint: 'Kategorien mit erfasstem Vertrag' },
          ]} />
        </div>

        {comparisonNotice && <EHFormFeedback kind="info">{comparisonNotice}</EHFormFeedback>}

        <EHCallout title="Wie dieser Bereich arbeitet">
          <p>Wir zeigen keine eigenen Tarife und keine Rangliste. Der Vergleich läuft beim jeweiligen Partner, dort wird auch abgeschlossen. Deine Vertragsdaten bleiben in der Hausakte und werden nicht an den Partner übertragen.</p>
        </EHCallout>

        <EHOwnerSection title="Vergleichen & Wechseln">
          <EHText muted>Fünf Kategorien. Wo ein Partner freigegeben ist, führt der Weg direkt zu seinem Vergleich. Wo keiner freigegeben ist, sagen wir das offen, statt eine Ersatzseite zu erfinden.</EHText>
          <EHRecordList label="Vergleichskategorien" items={comparisonRows.map(({ category, contract, availability }) => {
            const yearly = contract ? yearlyCents(contract.cost_amount, contract.cost_interval) : null;
            const deadline = contract ? cancellationDeadline(contract) : null;
            return {
              id: `vergleich-${category}`,
              title: AFFILIATE_CATEGORY_LABELS[category],
              detail: [
                AFFILIATE_CATEGORY_HINTS[category],
                contract ? `${contract.provider}${yearly != null ? ` · ${euroExact(yearly)} pro Jahr` : ''}` : 'Noch kein Vertrag erfasst',
                deadline ? `Frist: ${formatDate(deadline)}` : null,
              ].filter(Boolean).join(' · '),
              status: availability.status === 'available'
                ? <EHStatus tone="success">Partner freigegeben</EHStatus>
                : availability.status === 'error'
                  ? <EHStatus tone="error">Konfiguration prüfen</EHStatus>
                  : <EHStatus>Kein Partner freigegeben</EHStatus>,
            };
          })} />
        </EHOwnerSection>

        {comparisonRows.every((row) => !row.contract) && <EHEmptyState title="Erst einen Vertrag erfassen" text="Der Vergleich lebt von deinen echten Vertragsdaten: Anbieter, Jahreskosten und Kündigungsfrist. Trag oben unter „Verträge“ deinen ersten Vertrag ein." action={<EHButton href="/app/contracts?tab=vertraege">Vertrag erfassen</EHButton>} />}
      </>
    )}
  </WerkbankRahmen>;
}
