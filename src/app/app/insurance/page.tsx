import { createInsuranceSupportAction } from '@/app/actions';
import { requireUser } from '@/lib/auth';
import { EHButton, EHEmptyState, EHErrorState, EHField, EHFormFeedback, EHRecordList, EHStatus, EHSubmitButton, EHText, EHTextarea, EHWorkflowStack, type EHRecordEntry } from '@/design-system';
import { db } from '@/lib/db';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import { WerkbankAbschnitt, WerkbankKennzahlen, WerkbankKopf, WerkbankRaster } from '@/components/werkbank-seite';

type InsuranceJob = {
  id: number;
  title: string;
  status: string;
  business_name: string;
  claim_id: number | null;
  claim_status: string | null;
};

function claimStatus(value: string | null) {
  return value === 'reviewing' ? 'In Prüfung' : value === 'resolved' ? 'Erledigt' : value === 'rejected' ? 'Abgeschlossen' : 'Gemeldet';
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
  // Die Kennzahlen zaehlen die vorhandenen Vorgaenge: so bleibt die Zahl oben
  // gleich, egal ob gerade eine Anfrage offen ist.
  const openClaims = jobs.filter(job => job.claim_id);
  const withoutClaim = jobs.filter(job => !job.claim_id);
  const reviewingClaims = jobs.filter(job => job.claim_status === 'reviewing');
  const nextJob = withoutClaim[0];
  // Ein Auftrag, ein Formular: Der Nutzer waehlt zuerst den Auftrag, dann
  // erscheint genau ein Formular. Keine Textarea in jeder Zeile mehr.
  const focusId = Number(sp.auftrag);
  const focusJob = Number.isSafeInteger(focusId) ? withoutClaim.find(job => job.id === focusId) ?? null : null;
  const items: EHRecordEntry[] = jobs.map(job => (job.claim_id
    ? {
        id: String(job.id),
        title: `${job.title} · ${job.business_name}`,
        detail: `Auftrag #${job.id}`,
        note: 'Zu diesem Auftrag läuft bereits eine Hilfe-Anfrage. Eine zweite wird nicht angelegt.',
        status: <EHStatus tone={claimTone(job.claim_status)}>Hilfe: {claimStatus(job.claim_status)}</EHStatus>,
        href: `/app/jobs/${job.id}`,
      }
    : {
        id: String(job.id),
        title: `${job.title} · ${job.business_name}`,
        detail: focusJob?.id === job.id ? 'Ausgewählt – Formular unten ausfüllen.' : 'Auftrag wählen, dann unten beschreiben.',
        href: `/app/insurance?auftrag=${job.id}#schadenfall`,
      }));

  return <WerkbankRahmen role="homeowner" active="/app" pageLabel="Versicherung">
    <EHWorkflowStack>
    <WerkbankKopf title="Versicherung" context={`${jobs.length} beauftragte ${jobs.length === 1 ? 'Auftrag' : 'Aufträge'}`} />
    {sp.error && <EHErrorState text={sp.error} />}
    {submitted && <EHFormFeedback kind="success">Übernommen. Einfach Hausen sieht den Vorgang jetzt im bestehenden Auftrag. Deine Versicherung wurde dadurch nicht automatisch kontaktiert.</EHFormFeedback>}

    <WerkbankKennzahlen label="Versicherung" items={[
      { id: 'auftraege', label: 'Beauftragte Aufträge', value: String(jobs.length) },
      { id: 'hilfe', label: 'Hilfe gemeldet', value: String(openClaims.length), hint: `${reviewingClaims.length} in Prüfung` },
    ]} />

    <WerkbankAbschnitt title="Deine drei Möglichkeiten">
      <EHText muted>Tarif prüfen, Mensch fragen oder Schaden zu einem Auftrag melden. Nichts davon schreibt automatisch einen Versicherer an, und nichts gibt deine Daten ohne deine Zustimmung weiter.</EHText>
      <EHRecordList label="Wege auf dieser Seite" items={[
        {
          id: 'weg-tarif',
          title: 'Tarif prüfen',
          detail: 'Deine Versicherungskosten vergleichen. Abgeschlossen wird beim Partner, nicht hier.',
          href: '/app/contracts#vergleiche',
        },
        {
          id: 'weg-ansprechpartner',
          title: 'Mensch fragen',
          detail: 'Eine Person bei Einfach Hausen klärt deine Frage.',
          status: <EHStatus tone="info">Persönlich</EHStatus>,
          href: '/app/consultation',
        },
        {
          id: 'weg-schaden',
          title: 'Schaden zu Auftrag melden',
          detail: 'Unterlagen zu einem bereits beauftragten Auftrag zusammenstellen.',
          status: <EHStatus tone="neutral">{openClaims.length} gemeldet</EHStatus>,
          href: '#schadenfall',
        },
      ]} />
    </WerkbankAbschnitt>

    <div id="schadenfall" />
    <WerkbankRaster main={<WerkbankAbschnitt title="Schaden zu Auftrag melden">
      <EHText muted>Hier entsteht nur eine interne Notiz an einem deiner beauftragten Aufträge. Ein Versicherer wird nicht angeschrieben.</EHText>
      {jobs.length === 0 ? (
      <EHEmptyState title="Noch kein passender Auftrag vorhanden" text="Eine Meldung lässt sich nur an einen eigenen, bereits angenommenen Auftrag hängen." action={<><EHButton href="/app/jobs">Aufträge ansehen</EHButton><EHButton href="/app/consultation" variant="secondary">Erst Mensch fragen</EHButton></>} />
    ) : (
      <>
      <EHRecordList label="Deine Aufträge" items={items} />
      {focusJob ? (
        <form action={createInsuranceSupportAction.bind(null, focusJob.id)}>
          <EHField id="ins-desc" label={`Was soll zu „${focusJob.title}“ geklärt werden?`}><EHTextarea id="ins-desc" name="description" rows={4} minLength={20} maxLength={4000} required placeholder="Zum Beispiel: Nach dem Wasserschaden brauche ich eine Zusammenfassung der Arbeiten für meine Versicherung."/></EHField>
          <p>Mit dem Absenden wird eine interne Notiz erstellt. Es wird weder ein neuer Auftrag erzeugt noch automatisch ein Versicherer angeschrieben.</p>
          <EHSubmitButton>An Einfach Hausen übergeben</EHSubmitButton>
        </form>
      ) : <EHText muted>Wähle oben einen Auftrag, dann erscheint hier das Formular.</EHText>}
      </>
    )}
    </WerkbankAbschnitt>} aside={<>
      <WerkbankAbschnitt title="Laufende Hilfe">
        <EHRecordList label="Hilfe zu deinen Aufträgen" empty="Zu keinem Auftrag läuft gerade eine Hilfe-Anfrage." items={openClaims.map(job => ({
          id: `fall-${job.id}`,
          title: job.title,
          detail: job.business_name,
          status: <EHStatus tone={claimTone(job.claim_status)}>{claimStatus(job.claim_status)}</EHStatus>,
          href: `/app/jobs/${job.id}`,
        }))} />
      </WerkbankAbschnitt>
      <WerkbankAbschnitt title="Wie geht es weiter">
        {nextJob
          ? <><EHText>{`Für „${nextJob.title}“ ist noch nichts gemeldet.`}</EHText><EHButton href={`/app/jobs/${nextJob.id}`} arrow>Auftrag öffnen</EHButton></>
          : jobs.length === 0
            ? <EHText muted>Sobald ein Auftrag angenommen ist, lässt sich hier eine Meldung daran hängen.</EHText>
            : <EHText muted>Jeder beauftragte Auftrag hat eine Meldung. Neues entsteht im jeweiligen Auftrag.</EHText>}
      </WerkbankAbschnitt>
    </>} />

    <EHText muted>Frage zum Hausmeister? <a href="/app/hausmeister">Hier geht es zum Chat</a>.</EHText>
    </EHWorkflowStack>
  </WerkbankRahmen>;
}
