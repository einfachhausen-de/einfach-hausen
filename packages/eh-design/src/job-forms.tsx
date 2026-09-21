import type {ComponentProps} from "react";
import {EHField, EHInput, EHSelect, EHTextarea, EHEmptyState} from "./app";
import {EHWorkflowForm, EHFormSection, EHFieldGrid, EHFormFeedback} from "./workflow-layouts";
import {EHSubmitButton} from "./submit-button";
type ServerAction = ComponentProps<"form">["action"];

export function EHQuoteForm({action, id, amountCents, availableAt = "", message = "", updating = false, error}: {
  action: ServerAction; id: string; amountCents?: number; availableAt?: string; message?: string; updating?: boolean; error?: string;
}) {
  return <EHWorkflowForm action={action}><EHFormSection title={updating ? "Angebot aktualisieren" : "Dein Angebot"}>
    {error && <EHFormFeedback kind="error">{error}</EHFormFeedback>}
    <EHFieldGrid>
      <EHField id={id+"-amount"} label="Gesamtpreis (€)" required><EHInput id={id+"-amount"} name="amount" type="number" min="1" step="0.01" inputMode="decimal" required defaultValue={amountCents === undefined ? "" : amountCents/100}/></EHField>
      <EHField id={id+"-available"} label="Verfügbar ab"><EHInput id={id+"-available"} name="availableAt" type="datetime-local" defaultValue={availableAt.slice(0,16)}/></EHField>
    </EHFieldGrid>
    <EHField id={id+"-message"} label="Leistungsumfang" required hint="Beschreibe Leistung, Material, Entsorgung und mögliche Ausschlüsse.">
      <EHTextarea id={id+"-message"} name="message" required defaultValue={message} aria-describedby={id+"-message-hint"}/>
    </EHField>
    <EHSubmitButton pendingLabel="Angebot wird gesendet …">{updating ? "Angebot aktualisieren" : "Angebot senden"}</EHSubmitButton>
  </EHFormSection></EHWorkflowForm>;
}

export function EHAssignmentForm({action, id, contacts, selectedId, mode = "assign", error}: {
  action: ServerAction; id: string; contacts: readonly {id: number; label: string}[]; selectedId?: number;
  mode?: "accept-contact" | "assign" | "reassign"; error?: string;
}) {
  if (!contacts.length) return <EHEmptyState title="Kein Ansprechpartner verfügbar" text="Für diese Zuweisung ist ein aktiver Ansprechpartner erforderlich."/>;
  const label = mode === "accept-contact" ? "Kontakt übernehmen" : mode === "reassign" ? "Zuweisung speichern" : "Ansprechpartner festlegen";
  return <EHWorkflowForm action={action}><EHFormSection title="Verantwortlicher Ansprechpartner">
    {error && <EHFormFeedback kind="error">{error}</EHFormFeedback>}
    <EHField id={id+"-contact"} label="Ansprechpartner" required>
      <EHSelect id={id+"-contact"} name="contactUserId" required defaultValue={selectedId ?? ""}>
        <option value="" disabled>Bitte auswählen</option>
        {contacts.map(contact=><option key={contact.id} value={contact.id}>{contact.label}</option>)}
      </EHSelect>
    </EHField>
    <EHSubmitButton pendingLabel="Wird gespeichert …">{label}</EHSubmitButton>
  </EHFormSection></EHWorkflowForm>;
}

export function EHJobMessageForm({action, id, error}: {action: ServerAction; id: string; error?: string}) {
  return <EHWorkflowForm action={action}><EHFormSection title="Nachricht an deinen Kunden">
    {error && <EHFormFeedback kind="error">{error}</EHFormFeedback>}
    <EHField id={id+"-body"} label="Nachricht" required hint="Für konkrete Rückfragen und Absprachen zu diesem Vorgang.">
      <EHInput id={id+"-body"} name="body" required aria-describedby={id+"-body-hint"}/>
    </EHField>
    <EHSubmitButton pendingLabel="Nachricht wird gesendet …">Nachricht senden</EHSubmitButton>
  </EHFormSection></EHWorkflowForm>;
}
