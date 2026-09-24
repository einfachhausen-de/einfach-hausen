import '@/components/werkbank-layout.css';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import {
  EHField, EHFieldGrid, EHFileInput, EHFormFeedback, EHFormSection, EHInput,
  EHOwnerSection, EHSelect, EHText,
} from '@/design-system';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import { VertraegeAnlegeWege } from '@/components/homeowner/anlege-wege';
import { CONTRACT_KIND_KEYS, CONTRACT_KINDS } from '@/lib/contracts';

/**
 * Schaufenster des Anlege-Funnels — dieselben Weg-Karten und Formulare wie
 * /app/contracts/anlegen, aber sichtbar ohne Anmeldung und ohne Aktionen:
 * alle Felder deaktiviert, damit das Panel die Fuhrung zeigen kann.
 */
type Weg = 'hochladen' | 'scannen' | 'manuell';

const INTERVALS: Record<string, string> = { month: 'monatlich', quarter: 'vierteljährlich', halfyear: 'halbjährlich', year: 'jährlich' };

export default async function AnlegenPreview({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const weg: Weg | null = sp.weg === 'hochladen' || sp.weg === 'scannen' || sp.weg === 'manuell' ? sp.weg : null;

  return <WerkbankRahmen role="homeowner" active="/app/contracts">
    <div className="eh-anlege-kopf">
      <Link href={weg ? '/app/preview/anlegen' : '/app/preview/vertraege'} className="eh-anlege-zurueck">
        <ArrowLeft size={15} aria-hidden="true" /> {weg ? 'Anderer Weg' : 'Zurück zur Vertrags-Vorschau'}
      </Link>
      <h1>Vertrag hinzufügen — so läuft er</h1>
      <EHText muted>Schaufenster ohne Anmeldung: Weg wählen, Formular ansehen — gespeichert wird hier nichts.</EHText>
    </div>

    {!weg && (
      <EHOwnerSection title="Du hast die Wahl">
        <VertraegeAnlegeWege base="/app/preview/anlegen" />
        <EHText muted>In der echten Hausakte führt jede Karte direkt ins Formular — ein Klick und die KI liest mit.</EHText>
      </EHOwnerSection>
    )}

    {(weg === 'hochladen' || weg === 'scannen') && (
      <EHOwnerSection title={weg === 'scannen' ? 'Abfotografieren' : 'Dokument hochladen'}>
        <EHFormFeedback kind="info">In der echten Hausakte liest die KI hier Anbieter, Frist und Titel aus dem Beleg; du ergänkst danach nur den Monatsbetrag.</EHFormFeedback>
        <EHFormSection title={weg === 'scannen' ? 'Ein Foto genügt' : 'Datei reinlassen'}>
          <div className="eh-werkbank-filefield">
            <EHField id="ppv-doc" label={weg === 'scannen' ? 'Kamera abdrücken' : 'Rechnung oder Vertrag (PDF, Foto)'}>
              <EHFileInput id="ppv-doc" name="document" disabled label="In der Vorschau inaktiv" />
            </EHField>
          </div>
          <EHFieldGrid>
            <EHField id="ppv-kind" label="Was ist es? (hilft der KI)"><EHSelect id="ppv-kind" name="kind" defaultValue="strom" disabled>{CONTRACT_KIND_KEYS.map((k) => <option key={k} value={k}>{CONTRACT_KINDS[k]}</option>)}</EHSelect></EHField>
            <EHField id="ppv-provider" label="Anbieter — wenn du ihn schon weisst"><EHInput id="ppv-provider" name="provider" placeholder="z. B. Stadtwerke Musterstadt" disabled /></EHField>
          </EHFieldGrid>
        </EHFormSection>
      </EHOwnerSection>
    )}

    {weg === 'manuell' && (
      <EHOwnerSection title="Zwei Felder, fertig">
        <EHFormSection title="Was kostet dich der Vertrag?" description="Nur der Anbieter ist Pflicht — hier in der Vorschau als Ansichtsmodell.">
          <EHFieldGrid>
            <EHField id="ppv-kind" label="Was ist es?"><EHSelect id="ppv-kind" name="kind" defaultValue="strom" disabled>{CONTRACT_KIND_KEYS.map((k) => <option key={k} value={k}>{CONTRACT_KINDS[k]}</option>)}</EHSelect></EHField>
            <EHField id="ppv-provider" label="Anbieter"><EHInput id="ppv-provider" name="provider" placeholder="z. B. Stadtwerke Musterstadt" disabled /></EHField>
            <EHField id="ppv-cost" label="Betrag (€)"><EHInput id="ppv-cost" name="cost" inputMode="decimal" placeholder="89,90" disabled /></EHField>
            <EHField id="ppv-interval" label="Zahlweise"><EHSelect id="ppv-interval" name="costInterval" defaultValue="month" disabled>{Object.entries(INTERVALS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</EHSelect></EHField>
          </EHFieldGrid>
        </EHFormSection>
      </EHOwnerSection>
    )}

    {weg && <p className="eh-anlege-wechsel">Anderen Weg ansehen? <Link href="/app/preview/anlegen?weg=hochladen">Hochladen</Link><Link href="/app/preview/anlegen?weg=scannen">Scannen</Link><Link href="/app/preview/anlegen?weg=manuell">Selbst eintragen</Link></p>}
  </WerkbankRahmen>;
}
