"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import {
  EHActions, EHButton, EHCallout, EHFormFeedback, EHText, EHWorkflowStack,
} from "@/design-system";

// GDPR self-service (EH T-0203): JSON export of the own account and real
// deletion. The server derives the identity from the session; no ids travel
// through the client.
export function AccountActions() {
  const router = useRouter();
  const [busy, setBusy] = useState<"export" | "delete" | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState("");

  async function exportData() {
    setError("");
    setBusy("export");
    try {
      const res = await fetch("/api/account/export", { method: "GET" });
      if (!res.ok) throw new Error("Export fehlgeschlagen.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `einfach-hausen-export-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Export fehlgeschlagen. Bitte später erneut versuchen.");
    } finally {
      setBusy(null);
    }
  }

  async function deleteAccount() {
    setError("");
    setBusy("delete");
    try {
      const res = await fetch("/api/konto-loeschen", { method: "POST" });
      if (!res.ok) throw new Error("Löschen fehlgeschlagen.");
      try { const supabase = await getSupabase(); await supabase.auth.signOut(); } catch {}
      router.replace("/");
    } catch {
      setError("Löschen fehlgeschlagen. Bitte Support kontaktieren.");
      setBusy(null);
    }
  }

  if (confirmOpen) {
    return (
      <div role="alertdialog" aria-label="Konto wirklich löschen?">
        <EHCallout title="Konto wirklich löschen?">
          <EHWorkflowStack>
            <EHText>
              Deine persönlichen Inhalte werden dauerhaft gelöscht und dein Login unwiderruflich beendet.
              Belegdaten wie Rechnungen bleiben aus gesetzlichen Gründen erhalten, ohne deine Identität.
            </EHText>
            {error && <EHFormFeedback kind="error">{error}</EHFormFeedback>}
            <EHActions>
              <EHButton variant="danger" disabled={busy !== null} onClick={deleteAccount}>
                {busy === "delete" ? "Wird gelöscht…" : "Endgültig löschen"}
              </EHButton>
              <EHButton variant="secondary" onClick={() => setConfirmOpen(false)} disabled={busy !== null}>Abbrechen</EHButton>
            </EHActions>
          </EHWorkflowStack>
        </EHCallout>
      </div>
    );
  }

  return (
    <EHWorkflowStack>
      <EHText muted>
        Lade deine gespeicherten Daten als JSON-Datei herunter oder lösche dein Konto und alle persönlichen Inhalte.
      </EHText>
      {error && <EHFormFeedback kind="error">{error}</EHFormFeedback>}
      <EHActions>
        <EHButton variant="secondary" onClick={exportData} disabled={busy !== null}>
          {busy === "export" ? "Wird vorbereitet…" : "Daten exportieren"}
        </EHButton>
        <EHButton variant="danger" onClick={() => setConfirmOpen(true)} disabled={busy !== null}>
          Konto löschen
        </EHButton>
      </EHActions>
    </EHWorkflowStack>
  );
}
