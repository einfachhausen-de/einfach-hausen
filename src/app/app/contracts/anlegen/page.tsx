import '@/components/werkbank-layout.css';
import Link from 'next/link';
import { ArrowLeft, Camera, FileUp, PenLine } from 'lucide-react';
import {
  EHField, EHFieldGrid, EHFileInput, EHFormFeedback, EHFormSection, EHInput,
  EHOwnerSection, EHSelect, EHSubmitButton, EHText, EHWorkflowForm,
} from '@/design-system';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import { VertraegeAnlegeWege } from '@/components/homeowner/anlege-wege';
import { requireUser } from '@/lib/auth';
import { CONTRACT_KIND_KEYS, CONTRACT_KINDS } from '@/lib/contracts';
import { addContractUploadAction, addHouseContractAction } from '@/app/actions';

/**
 * Vertrag hinzufuegen — der Funnel hinter dem "+ Vertrag"-Knopf
 * (Betreiber 24.09.): erst den Weg waehlen, dann ein minimales Formular pro
 * Weg. Kein Feldsumpf auf der Hauptseite; der Nutzer entscheidet in einem
 * Klick, ob die KI lesen soll oder er selbst tippt.
 */
type Weg = 'hochladen' | 'scannen' | 'manuell';

export default async function Anlegen({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  await requireUser('homeowner');
  const sp = await searchParams;
  const weg: Weg | null = sp.weg === 'hochladen' || sp.weg === 'scannen' || sp.weg === 'manuell' ? sp.weg : null;
  const fehlerDatei = sp.fehler === 'datei';

  const kopf = (
    <div className="eh-anlege-kopf">
      <Link href={weg ? '/app/contracts/anlegen' : '/app/contracts'} className="eh-anlege-zurueck">
        <ArrowLeft size={15} aria-hidden="true" /> {weg ? 'Anderer Weg' : 'Zurück zu meinen Verträgen'}
      </Link>
      <h1>Vertrag hinzufügen</h1>
      <EHText muted>{weg
        ? 'Ein Schritt, dann rechnet der Spar-Check.'
        : 'Wie kommt der Vertrag am schnellsten in deine Hausakte?'}</EHText>
    </div>
  );

  return <WerkbankRahmen role="homeowner" active="/app/contracts">
    {kopf}

    {!weg && (
      <EHOwnerSection title="Du hast die Wahl">
        <VertraegeAnlegeWege base="/app/contracts/anlegen" />
        <EHText muted>Dauert in jedem Fall unter einer Minute — und du kannst jederzeit abbrechen, ohne dass etwas verloren geht.</EHText>
      </EHOwnerSection>
    )}

    {(weg === 'hochladen' || weg === 'scannen') && (
      <EHOwnerSection title={weg === 'scannen' ? 'Abfotografieren' : 'Dokument hochladen'}>
        {fehlerDatei
          ? <EHFormFeedback kind="error">Ohne Datei läuft dieser Weg ins Leere — lade ein Foto oder PDF hoch, oder trag die zwei Felder selbst ein.</EHFormFeedback>
          : <EHFormFeedback kind="info">Die KI liest Anbieter, Frist und Titel aus dem Beleg. Den Monatsbetrag hält sie sich aus — die eine Zeile trägst du danach nach, dann rechnet der Spar-Check sofort.</EHFormFeedback>}
        <EHWorkflowForm action={addContractUploadAction}>
          <input type="hidden" name="weg" value={weg} />
          <EHFormSection title={weg === 'scannen' ? 'Ein Foto genügt' : 'Datei reinlassen'}>
            <div className="eh-werkbank-filefield">
              <EHField id="up-doc" label={weg === 'scannen' ? 'Kamera abdrücken' : 'Rechnung oder Vertrag (PDF, Foto)'} hint={weg === 'scannen' ? 'Auf dem Handy öffnet sich die Kamera.' : 'Wir speichern den Beleg privat in deiner Hausakte.'}>
                <EHFileInput
                  id="up-doc"
                  name="document"
                  required
                  accept={weg === 'scannen' ? 'image/*' : 'application/pdf,image/*'}
                  {...(weg === 'scannen' ? { capture: 'environment' as const } : {})}
                  label={weg === 'scannen' ? 'Kamera öffnen' : 'Datei wählen …'}
                />
              </EHField>
            </div>
            <EHFieldGrid>
              <EHField id="up-kind" label="Was ist es? (hilft der KI)"><EHSelect id="up-kind" name="kind" defaultValue="strom">{CONTRACT_KIND_KEYS.map((k) => <option key={k} value={k}>{CONTRACT_KINDS[k]}</option>)}</EHSelect></EHField>
              <EHField id="up-provider" label="Anbieter — wenn du ihn schon weisst" hint="Leer lassen ist ok: Der Beleg steht dann als „Anbieter steht im Dokument“ und die Recherche zeigt ihn."><EHInput id="up-provider" name="provider" placeholder="z. B. Stadtwerke Musterstadt" /></EHField>
            </EHFieldGrid>
            <EHSubmitButton pendingLabel="Beleg wird eingelesen …">{weg === 'scannen' ? 'Foto in die Hausakte' : 'Beleg in die Hausakte'}</EHSubmitButton>
          </EHFormSection>
        </EHWorkflowForm>
      </EHOwnerSection>
    )}

    {weg === 'manuell' && (
      <EHOwnerSection title="Zwei Felder, fertig">
        <EHWorkflowForm action={addHouseContractAction}>
          <EHFormSection title="Was kostet dich der Vertrag?" description="Nur der Anbieter ist Pflicht. Rest gern später — Fristen und Ersparnis rechnen wir aus dem, was fehlt, so gut es geht.">
            <EHFieldGrid>
              <EHField id="new-kind" label="Was ist es?"><EHSelect id="new-kind" name="kind" defaultValue="strom">{CONTRACT_KIND_KEYS.map((k) => <option key={k} value={k}>{CONTRACT_KINDS[k]}</option>)}</EHSelect></EHField>
              <EHField id="new-provider" label="Anbieter" required><EHInput id="new-provider" name="provider" required placeholder="z. B. Stadtwerke Musterstadt" /></EHField>
              <EHField id="new-cost" label="Betrag (€)"><EHInput id="new-cost" name="cost" inputMode="decimal" placeholder="89,90" /></EHField>
              <EHField id="new-interval" label="Zahlweise"><EHSelect id="new-interval" name="costInterval" defaultValue="month">{['month', 'quarter', 'halfyear', 'year'].map((k) => <option key={k} value={k}>{({ month: 'monatlich', quarter: 'vierteljährlich', halfyear: 'halbjährlich', year: 'jährlich' } as Record<string, string>)[k]}</option>)}</EHSelect></EHField>
            </EHFieldGrid>
            <EHSubmitButton pendingLabel="Vertrag wird gespeichert …">Vertrag speichern</EHSubmitButton>
          </EHFormSection>
        </EHWorkflowForm>
        <EHText muted>Mehr Angaben (Vertragsnummer, Laufzeit, Beleg-Foto) findest du später im Vertrag selbst unter „Bearbeiten“.</EHText>
      </EHOwnerSection>
    )}

    {weg && (
      <p className="eh-anlege-wechsel">
        Doch ein anderer Weg?{' '}
        <Link href="/app/contracts/anlegen?weg=hochladen"><FileUp size={13} aria-hidden="true" /> Hochladen</Link>
        <Link href="/app/contracts/anlegen?weg=scannen"><Camera size={13} aria-hidden="true" /> Scannen</Link>
        <Link href="/app/contracts/anlegen?weg=manuell"><PenLine size={13} aria-hidden="true" /> Selbst eintragen</Link>
      </p>
    )}
  </WerkbankRahmen>;
}
