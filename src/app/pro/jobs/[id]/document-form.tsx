import { uploadDocumentAction } from '@/app/actions';
import { EHField, EHFileInput, EHInput, EHSelect, EHSubmitButton, EHText } from '@/design-system';
import { WerkbankAbschnitt } from '@/components/werkbank-seite';

export function DocumentForm({ jobId }: { jobId: number }) {
  return <form action={uploadDocumentAction.bind(null, jobId)}>
    <WerkbankAbschnitt title="Dokument hinzufügen">
      <EHText muted>PDF oder Bild zum Auftrag sicher hinterlegen.</EHText>
      <EHField id="document-kind" label="Dokumenttyp"><EHSelect id="document-kind" name="kind" defaultValue="invoice">
        <option value="invoice">Rechnung</option><option value="report">Leistungsnachweis</option><option value="warranty">Garantie</option><option value="other">Sonstiges</option>
      </EHSelect></EHField>
      <EHField id="document-title" label="Titel"><EHInput id="document-title" name="title" maxLength={160} placeholder="z. B. Wartungsnachweis" required /></EHField>
      <div className="eh-werkbank-filefield"><EHField id="document-file" label="Datei"><EHFileInput id="document-file" name="document" accept="application/pdf,image/*" required /></EHField></div>
      <EHSubmitButton pendingLabel="Wird hochgeladen …">Dokument hochladen</EHSubmitButton>
    </WerkbankAbschnitt>
  </form>;
}
