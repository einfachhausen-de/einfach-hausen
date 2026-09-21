import { HausmeisterAssistant } from '@/components/homeowner/hausmeister-assistant';
import { createInsuranceSupportAction } from '@/app/actions';
import { requireUser } from '@/lib/auth';
import { EHButton, EHEmptyState, EHErrorState, EHField, EHFormFeedback, EHMetricsBar, EHPageHeader, EHRecordList, EHRecordViews, EHStatus, EHSubmitButton, EHText, EHTextarea, EHWorkSection, EHWorkspaceGrid, EHWorkflowStack, type EHRecordEntry } from '@/design-system';
import { db } from '@/lib/db';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import { AFFILIATE_CATEGORY_ACTIONS, resolveAffiliate } from '@/lib/affiliate';

type InsuranceJob = {
  id: number;
  title: string;
  status: string;
  business_name: string;
  claim_id: number | null;
  claim_status: string | null;
};

function claimStatus(value: string | null) {
  return value === 'reviewing' ? 'In Prüfung' : value === 'resolved' ? 'Gelöst' : value === 'rejected' ? 'Abgeschlossen' : 'Offen';
}

const claimTone = (value: string | null) => value === 'resolved' ? 'success' as const : value === 'reviewing' ? 'info' as const : 'neutral' as const;

export default async function InsuranceSupport({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await requireUser('homeowner');
  const sp = await searchParams;
  const jobs = db.prepare(`
    SELECT j.id,j.title,j.status,p.business_name,c.id claim_id,c.status claim_status
    FROM jobs j
    JOIN quotes q ON q.id=j.accepted_quote_id
    JOIN provider_profiles p ON p.user_id=q.provider_id
    LEFT JOIN claims c ON c.job_id=j.id AND c.homeowner_id=j.homeowner_id
    WHERE j.homeowner_id=? AND j.request_kind='service' AND j.status IN ('accepted','in_progress','completed')
    ORDER BY j.updated_at DESC,j.id DESC
  `).all(user.id) as InsuranceJob[];
  const successId = Number(sp.success);
  const submitted = Number.isSafeInteger(successId) && jobs.some(job => job.id === successId);
  // Die Kennzahlen zaehlen die vorhandenen Vorgaenge, nicht die Formulare:
  // so bleibt die Zahl oben gleich, egal ob gerade eine Anfrage offen ist.
  const openClaims = jobs.filter(job => job.claim_id);
  const withoutClaim = jobs.filter(job => !job.claim_id);
  const reviewingClaims = jobs.filter(job => job.claim_status === 'reviewing');
  const resolvedClaims = jobs.filter(job => job.claim_status === 'resolved');
  const nextJob = withoutClaim[0];
  // Der Tarifvergleich laeuft ueber dieselbe zentrale Partnerkonfiguration wie
  // der Vertragsbereich. Ohne freigegebenen Partner bleibt der Weg sichtbar,
  // aber ohne Ausleitung - und ohne erfundene Empfehlung.
  const comparison = resolveAffiliate('versicherung', 'vergleichsuebersicht');
  const items: EHRecordEntry[] = jobs.map(job => (job.claim_id
    ? {
        id: String(job.id),
        title: `${job.title} · ${job.business_name}`,
        detail: `Auftrag #${job.id}`,
        note: 'Zu diesem Auftrag existiert bereits ein Servicefall. Er wird nicht durch eine zweite Versicherungsanfrage überschrieben.',
        status: <EHStatus tone={claimTone(job.claim_status)}>Servicefall: {claimStatus(job.claim_status)}</EHStatus>,
        href: `/app/jobs/${job.id}`,
      }
    : {
        id: String(job.id),
        title: `${job.title} · ${job.business_name}`,
        detail: `Auftrag #${job.id}`,
        action: (
          <form action={createInsuranceSupportAction.bind(null, job.id)}>
            <EHField id={`ins-desc-${job.id}`} label="Was soll für den Schadenfall geklärt werden?"><EHTextarea id={`ins-desc-${job.id}`} name="description" rows={4} minLength={20} maxLength={4000} required placeholder="Zum Beispiel: Nach dem Wasserschaden brauche ich eine nachvollziehbare Zusammenfassung der ausgeführten Arbeiten und möchte wissen, welche Unterlagen bereits im Auftrag liegen."/></EHField>
            <p>Mit dem Absenden wird ein interner Servicefall erstellt. Es wird weder ein neuer Handwerkerauftrag erzeugt noch automatisch ein Versicherer angeschrieben.</p>
            <EHSubmitButton>Servicefall an Einfach Hausen übergeben</EHSubmitButton>
          </form>
        ),
      }));

  return <WerkbankRahmen role="homeowner" active="/app">
    <EHWorkflowStack>
    <EHPageHeader title="Versicherung" context={`${jobs.length} beauftragte ${jobs.length === 1 ? 'Auftrag' : 'Aufträge'}`} />
    {sp.error && <EHErrorState text={sp.error} />}
    {submitted && <EHFormFeedback kind="success">Servicefall übernommen. Einfach Hausen und der zuständige Partner sehen den Vorgang jetzt im bestehenden Auftragskontext. Deine Versicherung wurde dadurch nicht automatisch kontaktiert.</EHFormFeedback>}

    <EHMetricsBar label="Versicherungsunterstützung" items={[
      { id: 'auftraege', label: 'Beauftragte Aufträge', value: String(jobs.length), hint: 'mit Versicherungsbezug' },
      { id: 'servicefaelle', label: 'Servicefälle', value: String(openClaims.length), hint: `${reviewingClaims.length} in Prüfung` },
      { id: 'offen', label: 'Ohne Vorgang', value: String(withoutClaim.length), hint: 'noch übergebbar' },
      { id: 'geloest', label: 'Gelöst', value: String(resolvedClaims.length), hint: 'abgeschlossen' },
    ]} />

    <EHWorkSection title="Drei Wege – bewusst getrennt">
      <EHText muted>Tarifvergleich, persönlicher Ansprechpartner und Schadenfall sind hier absichtlich drei getrennte Wege. Keiner davon schreibt automatisch einen Versicherer an, und keiner gibt deine Daten ohne ausdrückliche Zustimmung weiter.</EHText>
      <EHRecordList label="Wege auf dieser Seite" items={[
        {
          id: 'weg-tarif',
          title: 'Tarifvergleich',
          detail: 'Deine Versicherungskosten mit einem Vergleichspartner prüfen. Abgeschlossen wird beim Partner, nicht hier.',
          status: comparison.status === 'available'
            ? <EHStatus tone="success">Partner freigegeben</EHStatus>
            : <EHStatus>Noch kein Partner freigegeben</EHStatus>,
          href: '/app/contracts?tab=vergleichen',
        },
        {
          id: 'weg-ansprechpartner',
          title: 'Ansprechpartner Versicherung & Finanzen',
          detail: 'Eine Person bei Einfach Hausen klärt deine Frage. Eine Vermittlung entsteht erst, wenn du ausdrücklich zustimmst.',
          status: <EHStatus tone="info">Persönlich</EHStatus>,
          href: '/app/consultation',
        },
        {
          id: 'weg-schaden',
          title: 'Schadenfall dokumentieren',
          detail: 'Unterlagen zu einem bereits beauftragten Auftrag zusammenstellen. Der Versicherer wird dadurch nicht kontaktiert.',
          status: <EHStatus tone="neutral">{openClaims.length} {openClaims.length === 1 ? 'Servicefall' : 'Servicefälle'}</EHStatus>,
          href: '#schadenfall',
        },
      ]} />
    </EHWorkSection>

    <EHWorkSection title="Tarifvergleich">
      {comparison.status === 'available'
        ? <>
            <EHText>{comparison.disclosure}</EHText>
            {comparison.needsConsent && !comparison.untrackedAllowed
              ? <>
                  <EHText muted>Für diesen Partner messen wir den Klick nur mit deiner ausdrücklichen Zustimmung. Ohne Zustimmung öffnet sich der Vergleich nicht.</EHText>
                  <EHButton href={comparison.consentEntryHref ?? comparison.entryHref} arrow>{AFFILIATE_CATEGORY_ACTIONS.versicherung} – Klickmessung erlauben</EHButton>
                </>
              : <>
                  {comparison.needsConsent && <EHText muted>Der Vergleich wird ohne Klickmessung geöffnet. Deine Vertragsdaten gehen nicht mit.</EHText>}
                  <EHButton href={comparison.entryHref} arrow>{AFFILIATE_CATEGORY_ACTIONS.versicherung}</EHButton>
                </>}
          </>
        : <><EHText muted>Für Versicherungen ist noch kein Vergleichspartner freigegeben. Wir zeigen deshalb bewusst keine eigene Tarifliste und keine Rangfolge. Vergleiche bis dahin direkt bei deinem Versicherer oder über ein Vergleichsportal deiner Wahl.</EHText><EHButton href="/app/contracts?tab=vergleichen" variant="secondary">Zum Vergleichsbereich</EHButton></>}
    </EHWorkSection>

    <EHWorkSection title="Ansprechpartner Versicherung & Finanzen">
      <EHText muted>Wenn du eine Einschätzung brauchst, statt selbst zu vergleichen: Stelle die Frage an Einfach Hausen. Der Weg führt bewusst nicht über ein Formular bei einem Versicherer, sondern über eine Person, die den Vorgang mit dir klärt.</EHText>
      <EHButton href="/app/consultation" variant="secondary" arrow>Ansprechpartner fragen</EHButton>
    </EHWorkSection>

    <div id="schadenfall" />
    <EHWorkspaceGrid main={<EHWorkSection title="Schadenfall dokumentieren">
      <EHText muted>Hier entsteht nur eine interne Dokumentation an einem deiner beauftragten Aufträge. Ein Versicherer wird nicht angeschrieben und keine Unterlage automatisch übermittelt.</EHText>
      {jobs.length === 0 ? (
      <EHEmptyState title="Noch kein passender Auftrag vorhanden" text="Versicherungsunterstützung lässt sich hier nur an einen eigenen, bereits angenommenen Auftrag hängen. So werden keine fremden Vorgänge oder losen Schadendaten zugeordnet."  action={<><EHButton href="/app/jobs">Aufträge ansehen</EHButton><EHButton href="/app/consultation" variant="secondary">Erst Ansprechpartner fragen</EHButton></>} />
    ) : (
      <EHRecordViews label="Aufträge mit Versicherungsunterstützung" storageKey="versicherung" defaultView="liste" switcherLabel="Versicherung: Ansicht wechseln" items={items} />
    )}
    </EHWorkSection>} aside={<>
      <EHWorkSection title="Laufende Servicefälle">
        <EHRecordList label="Servicefälle zu deinen Aufträgen" empty="Zu keinem Auftrag läuft gerade ein Servicefall." items={openClaims.map(job => ({
          id: `fall-${job.id}`,
          title: job.title,
          detail: job.business_name,
          status: <EHStatus tone={claimTone(job.claim_status)}>{claimStatus(job.claim_status)}</EHStatus>,
          href: `/app/jobs/${job.id}`,
        }))} />
      </EHWorkSection>
      <EHWorkSection title="Nächster Schritt">
        {nextJob
          ? <><EHText>{`Für „${nextJob.title}“ ist noch kein Vorgang angelegt.`}</EHText><EHButton href={`/app/jobs/${nextJob.id}`} arrow>Auftrag öffnen</EHButton></>
          : jobs.length === 0
            ? <EHText muted>Sobald ein Auftrag angenommen ist, lässt sich hier eine Versicherungsanfrage daran hängen.</EHText>
            : <EHText muted>Jeder beauftragte Auftrag hat einen Vorgang. Neue Unterstützung entsteht im jeweiligen Auftrag.</EHText>}
      </EHWorkSection>
      <EHWorkSection title="Zuständigkeit">
        <EHText muted>Den Vorgang koordiniert Einfach Hausen im bestehenden Auftragskontext. Ein Versicherer wird dadurch nicht automatisch kontaktiert.</EHText>
      </EHWorkSection>
    </>} />

    <HausmeisterAssistant/>
    </EHWorkflowStack>
  </WerkbankRahmen>;
}
