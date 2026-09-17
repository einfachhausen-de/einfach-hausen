import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import {
  EHButton, EHCallout, EHEmptyState, EHField, EHFieldGrid, EHFormFeedback,
  EHFormSection, EHInput, EHList, EHMetricsBar, EHPageHeader, EHRecordList, EHRecordViews,
  EHSelect, EHStatus, EHSubmitButton, EHText,
  EHTextarea, EHWorkSection, EHWorkflowForm, EHWorkflowStack, EHWorkspaceGrid, EHDetailDisclosure,
} from '@/design-system';
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

  // Beide Ansichten hängen in der Seitenleiste (Verträge & Tarife-Gruppe),
  // darum keine Pillen mehr im Inhalt.

  return <WerkbankRahmen role="homeowner" active="/app/contracts">
    <EHWorkflowStack>
      <EHPageHeader
        title="Verträge & Tarife"
        context={`${active.length} aktiv · ${euroExact(monthlyTotal)} pro Monat`}
        actions={<EHButton href="/app/documents" variant="secondary">Alle Dokumente</EHButton>}
      />
      {saved && <EHFormFeedback kind="success">Gespeichert. Deine Hausakte ist aktuell.</EHFormFeedback>}

      {tab === 'vertraege' ? (
        <>
          <EHMetricsBar label="Verträge" items={[
            { id: 'aktiv', label: 'Aktive Verträge', value: String(active.length), hint: `${contracts.length} erfasst` },
            { id: 'kosten', label: 'Kosten pro Monat', value: euroExact(monthlyTotal), hint: 'nur aktive Verträge' },
            { id: 'jahr', label: 'Kosten pro Jahr', value: euroExact(yearlyTotal), hint: 'aus den erfassten Intervallen' },
            { id: 'fristen', label: 'Fristen · 90 Tage', value: String(withDeadline.length), hint: withDeadline.length > 0 ? 'jetzt handeln' : 'nichts offen' },
          ]} />

          <EHWorkspaceGrid main={<>
          {withDeadline.length > 0 && <EHWorkSection title="Jetzt handeln">
            <EHRecordList label="Fristen in den nächsten 90 Tagen" items={withDeadline.map(({ row, state }) => ({
              id: `frist-${row.id}`,
              title: `${contractKindLabel(row.kind)} · ${row.provider}`,
              detail: deadlineLabel(row),
              status: <EHStatus tone={DEADLINE_TONE[state]}>{state === 'overdue' ? 'Verpasst' : 'Bald'}</EHStatus>,
              href: `/app/contracts?tab=sparcheck&contract=${row.id}`,
            }))} />
          </EHWorkSection>}

          <EHWorkSection title={`Alle Verträge · ${contracts.length}`}>
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
          </EHWorkSection>

          {contracts.length > 0 && <EHWorkSection title="Vertrag anpassen">
            {contracts.map((row) => <EHDetailDisclosure key={row.id} id={`vertrag-${row.id}`} title={`${contractKindLabel(row.kind)} · ${row.provider}`} description="Anbieter, Kosten, Laufzeit und Frist ändern">
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
          </EHWorkSection>}

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
          </>} aside={<>
            <EHWorkSection title="Nächste Kündigungsfrist">
              {withDeadline[0] ? <>
                <EHText>{`${contractKindLabel(withDeadline[0].row.kind)} · ${withDeadline[0].row.provider}`}</EHText>
                <EHStatus tone={DEADLINE_TONE[withDeadline[0].state]}>{deadlineLabel(withDeadline[0].row)}</EHStatus>
                <EHButton href={`/app/contracts?tab=sparcheck&contract=${withDeadline[0].row.id}`} variant="secondary" arrow>Spar-Check öffnen</EHButton>
              </> : <EHText muted>Keine Frist in den nächsten 90 Tagen. Sobald eine Kündigungsfrist näher rückt, steht sie hier.</EHText>}
            </EHWorkSection>
            <EHWorkSection title="Kosten nach Sparte">
              <EHRecordList label="Monatskosten nach Sparte" empty="Noch kein aktiver Vertrag mit Kosten erfasst." items={Array.from(monthlyByKind.entries()).sort((a, b) => b[1].cents - a[1].cents).map(([kind, group]) => ({
                id: `sparte-${kind}`,
                title: kind,
                detail: `${group.count} ${group.count === 1 ? 'Vertrag' : 'Verträge'}`,
                value: euroExact(group.cents),
              }))} />
            </EHWorkSection>
            <EHWorkSection title="Spar-Check">
              <EHText muted>Der Spar-Check schätzt aus deinen hinterlegten Kosten eine Ersparnis-Spanne. Möglich ist das für Strom, Gas, DSL und Versicherungen.</EHText>
              <EHButton href="/app/contracts?tab=sparcheck" variant="secondary" arrow>Spar-Check öffnen</EHButton>
            </EHWorkSection>
          </>} />
        </>
      ) : (
        <>
          <EHPageHeader title="Lohnt sich ein Wechsel?" context={selected ? `${contractKindLabel(selected.kind)} · ${selected.provider}` : `${contracts.length} Verträge zur Auswahl`} />
          {contracts.length === 0
            ? <EHEmptyState title="Erst einen Vertrag erfassen" text="Der Spar-Check rechnet mit deinen echten Kosten. Trag dafür im Tab „Laufende Verträge“ den Vertrag ein, den du prüfen willst." action={<EHButton href="/app/contracts?tab=vertraege">Vertrag erfassen</EHButton>} />
            : <>
                <EHWorkSection title="Vertrag auswählen">
                  <EHRecordList label="Verträge für den Spar-Check" items={contracts.map((row) => ({
                    id: `check-${row.id}`,
                    title: `${contractKindLabel(row.kind)} · ${row.provider}`,
                    detail: row.cost_amount != null ? `${euroExact(row.cost_amount)} ${costIntervalLabel(row.cost_interval)}` : 'Keine Kosten hinterlegt',
                    status: SAVINGS_KINDS.includes(row.kind as ContractKind) ? <EHStatus tone="info">Spar-Check möglich</EHStatus> : <EHStatus>Kein Vergleich</EHStatus>,
                    href: `/app/contracts?tab=sparcheck&contract=${row.id}`,
                  }))} />
                </EHWorkSection>

                {selected && <>
                  <EHWorkSection title={`Spar-Check · ${contractKindLabel(selected.kind)} · ${selected.provider}`}>
                    {!estimate && <EHFormFeedback kind="info">Für diese Sparte gibt es noch keine Vergleichsstrecke. Ein Spar-Check ist für Strom, Gas, DSL und Versicherungen möglich.</EHFormFeedback>}
                    {estimate && <>
                      <EHMetricsBar label="Spar-Check" items={[
                        { id: 'ersparnis', label: 'Ersparnis pro Jahr', value: `${euroExact(estimate.lowCents)} – ${euroExact(estimate.highCents)}` },
                        { id: 'ansatz', label: 'Ansatz Jahreskosten', value: `${Math.round(estimate.rateBps / 100)} %` },
                        { id: 'belastbarkeit', label: 'Belastbarkeit', value: estimate.confidence },
                      ]} />
                      <EHText>Diese Spanne beruht auf folgenden Annahmen:</EHText>
                      <EHList label="Annahmen der Einschätzung" items={estimate.reasons.map((reason, index) => ({ id: `grund-${index}`, title: reason }))} />
                    </>}
                  </EHWorkSection>

                  <EHWorkSection title="Nächste Schritte">
                    <EHList label="Nächste Schritte" items={[
                      { id: 'step-1', title: 'Kündigungsfrist prüfen', text: deadlineLabel(selected) },
                      { id: 'step-2', title: 'Angebote einholen', text: outbound ? 'Über unseren Partnerlink – siehe unten.' : 'Aktuell direkt beim Anbieter oder einem Vergleichsportal deiner Wahl.' },
                      { id: 'step-3', title: 'Nach dem Wechsel Vertrag hier aktualisieren', text: 'Neuer Anbieter, neuer Preis, neue Laufzeit – dann stimmt die nächste Frist wieder.' },
                    ]} />
                    {outbound
                      ? <EHButton href={outbound} arrow>Zum Tarifrechner des Partners</EHButton>
                      : <EHCallout title="Noch keine Partnervermittlung"><p>Sobald Affiliate-Partner für {contractKindLabel(selected.kind).toLowerCase()} vertraglich feststehen, führt dieser Weg direkt zum Tarifrechner. Bis dahin bleibt der Spar-Check bewusst eine Einschätzung ohne Ausleitung.</p></EHCallout>}
                  </EHWorkSection>
                </>}
              </>}
        </>
      )}
    </EHWorkflowStack>
  </WerkbankRahmen>;
}
