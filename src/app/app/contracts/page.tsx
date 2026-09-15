import { AppShell } from '@/components/shell';
import {
  EHAppHeader, EHButton, EHCallout, EHEmptyState, EHFacts, EHField, EHFieldGrid, EHFormFeedback,
  EHFormSection, EHInput, EHList, EHSelect, EHStatus, EHSubmitButton, EHText,
  EHTextarea, EHWorkSection, EHWorkflowForm, EHWorkflowStack, EHDetailDisclosure,
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

  const trail = tab === 'sparcheck'
    ? [{ href: '/app', label: 'Start' }, { href: '/app/contracts', label: 'Verträge & Tarife' }, { label: 'Spar-Check' }]
    : [{ href: '/app', label: 'Start' }, { label: 'Verträge & Tarife' }];

  // Both views live on the same route, so only the page knows which one is
  // active - it passes its own tabs instead of letting the shell derive them.
  const tabs = [
    { href: '/app/contracts?tab=vertraege', label: 'Laufende Verträge', active: tab === 'vertraege' },
    { href: '/app/contracts?tab=sparcheck', label: 'Spar-Check', active: tab === 'sparcheck' },
  ];

  return <AppShell role="homeowner" active="/app/contracts" title="Verträge & Tarife" subtitle="Laufende Verträge, Fristen und Sparpotenzial" breadcrumbs={trail} tabs={tabs}>
    <EHWorkflowStack>
      <EHAppHeader
        eyebrow="Hausakte"
        title="Verträge & Tarife"
        text="Strom, DSL, Versicherungen und alles, was regelmäßig Geld kostet – mit den Fristen, die sonst im Briefkasten untergehen."
        actions={<EHButton href="/app/documents" variant="secondary">Alle Dokumente</EHButton>}
      />
      {saved && <EHFormFeedback kind="success">Gespeichert. Deine Hausakte ist aktuell.</EHFormFeedback>}

      {tab === 'vertraege' ? (
        <>
          {active.length > 0 && <EHFacts items={[
            { value: String(active.length), label: 'Aktive Verträge' },
            { value: euroExact(monthlyTotal), label: 'Kosten pro Monat' },
            { value: withDeadline.length ? String(withDeadline.length) : '0', label: 'Fristen in den nächsten 90 Tagen' },
          ]} />}

          {withDeadline.length > 0 && <EHWorkSection title="Jetzt handeln">
            <EHList label="Fristen in den nächsten 90 Tagen" items={withDeadline.map(({ row, state }) => ({
              id: `frist-${row.id}`,
              title: `${contractKindLabel(row.kind)} · ${row.provider}`,
              text: deadlineLabel(row),
              meta: <EHStatus tone={DEADLINE_TONE[state]}>{state === 'overdue' ? 'Verpasst' : 'Bald'}</EHStatus>,
              href: `/app/contracts?tab=sparcheck&contract=${row.id}`,
            }))} />
          </EHWorkSection>}

          <EHWorkSection title={`Alle Verträge · ${contracts.length}`}>
            {contracts.length === 0
              ? <EHEmptyState title="Noch kein Vertrag erfasst" text="Trag deinen Strom-, DSL- oder Versicherungsvertrag ein. Danach siehst du hier Kosten, Laufzeit und Kündigungsfrist – und im Spar-Check, ob sich ein Wechsel lohnt." />
              : <EHList label="Erfasste Verträge" items={contracts.map((row) => {
                  const end = currentTermEnd(row);
                  const parts = [
                    row.tariff,
                    row.cost_amount != null ? `${euroExact(row.cost_amount)} ${costIntervalLabel(row.cost_interval)}` : null,
                    end ? `Laufzeit bis ${formatDate(end)}` : row.started_at ? `Seit ${formatDate(new Date(`${row.started_at.slice(0, 10)}T12:00:00`))}` : null,
                    deadlineLabel(row),
                    row.notice,
                  ].filter(Boolean).join(' · ');
                  return {
                    id: String(row.id),
                    title: `${contractKindLabel(row.kind)} · ${row.provider}`,
                    text: parts,
                    meta: row.status === 'active'
                      ? <EHStatus tone={DEADLINE_TONE[deadlineState(cancellationDeadline(row))]}>{deadlineLabel(row)}</EHStatus>
                      : <EHStatus tone="neutral">{row.status === 'cancelled' ? 'Gekündigt' : 'Ausgelaufen'}</EHStatus>,
                    action: <>{row.document_path && <a href={`/api/house-contracts/${row.id}/document`} target="_blank" rel="noreferrer">{row.document_title || 'Vertragsdokument'}</a>}</>,
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
        </>
      ) : (
        <>
          <EHAppHeader eyebrow="Optimierung" title="Lohnt sich ein Wechsel?" text="Wähle einen Vertrag. Die Einschätzung rechnet mit deinen hinterlegten Kosten und nennt die Annahmen, auf denen sie beruht." />
          {contracts.length === 0
            ? <EHEmptyState title="Erst einen Vertrag erfassen" text="Der Spar-Check rechnet mit deinen echten Kosten. Trag dafür im Tab „Laufende Verträge“ den Vertrag ein, den du prüfen willst." action={<EHButton href="/app/contracts?tab=vertraege">Vertrag erfassen</EHButton>} />
            : <>
                <EHWorkSection title="Vertrag auswählen">
                  <EHList label="Verträge für den Spar-Check" items={contracts.map((row) => ({
                    id: `check-${row.id}`,
                    title: `${contractKindLabel(row.kind)} · ${row.provider}`,
                    text: row.cost_amount != null ? `${euroExact(row.cost_amount)} ${costIntervalLabel(row.cost_interval)} · ${contractKindLabel(row.kind)}` : 'Keine Kosten hinterlegt',
                    meta: SAVINGS_KINDS.includes(row.kind as ContractKind) ? <EHStatus tone="info">Spar-Check möglich</EHStatus> : <EHStatus>Kein Vergleich</EHStatus>,
                    href: `/app/contracts?tab=sparcheck&contract=${row.id}`,
                  }))} />
                </EHWorkSection>

                {selected && <>
                  <EHWorkSection title={`Spar-Check · ${contractKindLabel(selected.kind)} · ${selected.provider}`}>
                    {!estimate && <EHFormFeedback kind="info">Für diese Sparte gibt es noch keine Vergleichsstrecke. Ein Spar-Check ist für Strom, Gas, DSL und Versicherungen möglich.</EHFormFeedback>}
                    {estimate && <>
                      <EHFacts items={[
                        { value: `${euroExact(estimate.lowCents)} – ${euroExact(estimate.highCents)}`, label: 'Mögliche Ersparnis pro Jahr' },
                        { value: `${Math.round(estimate.rateBps / 100)} %`, label: 'Ansatz auf die Jahreskosten' },
                        { value: estimate.confidence, label: 'Belastbarkeit' },
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
  </AppShell>;
}
