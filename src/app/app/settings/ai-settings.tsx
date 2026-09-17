"use client";

import {
  EHActions, EHButton, EHField, EHFieldGrid, EHFormFeedback, EHInput,
  EHLoadingState, EHText, EHWorkflowStack,
} from "@/design-system";
import { uiToast } from "@/components/ui-toast";
import { useEffect, useState } from "react";

// EH T-0207: AI access settings — BYOK (own OpenAI-compatible key), freemium
// quota display and rewarded-ad credit grant. The key is stored encrypted
// server-side and never rendered back.
//
// Befund 6: no ad SDK is wired, so the settings UI cannot produce a signed
// receipt. The button stays disabled until the SDK completion callback posts
// { receipt, signature } (contract: docs/OPERATIONS.md). The server verifies
// receipts fail-closed and is never loosened from the client.
// Befund 7: success is only shown after a confirmed server result; 401/429
// and network errors are surfaced and the local BYOK state is preserved.
// Befund 8: all inputs are labelled (EHField/EHInput with stable ids). No
// "unlimited" promise: the user's own provider limits and costs apply.
type Quota = { byok: boolean; freemiumAllowed: number; freemiumUsed: number; freemiumRemaining: number; credits: number };

function statusMessage(status: number, fallback: string): string {
  if (status === 401) return "Bitte melde dich an, um die KI-Einstellungen zu sehen.";
  if (status === 429) return "Zu viele Versuche — bitte warte kurz und lade erneut.";
  return fallback;
}

export function AiSettings() {
  const [quota, setQuota] = useState<Quota | null>(null);
  const [byok, setByok] = useState<{ enabled: boolean; masked: string | null; baseUrl: string; model: string } | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [model, setModel] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true); setLoadError("");
    try {
      const qRes = await fetch("/api/ki");
      if (!qRes.ok) throw new Error(statusMessage(qRes.status, "KI-Kontingent konnte nicht geladen werden."));
      setQuota(await qRes.json());
      const bRes = await fetch("/api/ai/byok");
      if (!bRes.ok) throw new Error(statusMessage(bRes.status, "BYOK-Status konnte nicht geladen werden."));
      setByok(await bRes.json());
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Laden fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const qRes = await fetch("/api/ki");
        if (!qRes.ok) throw new Error(statusMessage(qRes.status, "KI-Kontingent konnte nicht geladen werden."));
        const q = await qRes.json();
        const bRes = await fetch("/api/ai/byok");
        if (!bRes.ok) throw new Error(statusMessage(bRes.status, "BYOK-Status konnte nicht geladen werden."));
        const b = await bRes.json();
        if (!cancelled) { setQuota(q); setByok(b); }
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Laden fehlgeschlagen.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function saveKey() {
    setError(""); setMessage(""); setBusy(true);
    try {
      const res = await fetch("/api/ai/byok", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ apiKey, baseUrl, model }) });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error((data && data.error) || statusMessage(res.status, "Speichern fehlgeschlagen."));
      uiToast("Key verschlüsselt gespeichert.", { kind: "success" });
      setApiKey("");
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Fehler."); } finally { setBusy(false); }
  }

  async function disableKey() {
    setError(""); setMessage(""); setBusy(true);
    try {
      const res = await fetch("/api/ai/byok", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ disable: true }) });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error((data && data.error) || statusMessage(res.status, "Deaktivieren fehlgeschlagen — der Key bleibt aktiv."));
      await load();
      uiToast("BYOK deaktiviert.", { kind: "info" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler.");
    } finally { setBusy(false); }
  }

  if (loading && !quota && !byok) {
    return <EHLoadingState label="KI-Einstellungen werden geladen …" />;
  }

  return (
    <EHWorkflowStack>
      {loadError && <>
        <EHFormFeedback kind="error">{loadError}</EHFormFeedback>
        <EHActions>
          <EHButton variant="secondary" onClick={load} disabled={busy}>Erneut versuchen</EHButton>
        </EHActions>
      </>}
      {quota && (
        <EHText muted>
          KI-Kontingent: {quota.freemiumRemaining} von {quota.freemiumAllowed} frei · {quota.credits} Bonus-Aktionen
        </EHText>
      )}
      {message && <EHFormFeedback kind="success">{message}</EHFormFeedback>}
      {error && <EHFormFeedback kind="error">{error}</EHFormFeedback>}

      {byok?.enabled ? <>
        <EHText muted>Eigener Key aktiv ({byok.masked}) — Anfragen laufen über dein eigenes Anbieter-Konto. Dessen Limits und Kosten gelten.</EHText>
        <EHActions>
          <EHButton variant="secondary" onClick={disableKey} disabled={busy}>BYOK deaktivieren</EHButton>
        </EHActions>
      </> : <>
        <EHText muted>
          Power-User: hinterlege deinen eigenen API-Key (OpenAI-kompatibel, z. B. Google AI Studio oder OpenRouter).
          Die KI läuft dann über dein eigenes Anbieter-Konto — dessen Limits und Kosten gelten. Der Key wird verschlüsselt gespeichert.
        </EHText>
        <EHFieldGrid>
          <EHField id="eh-byok-key" label="API-Key" hint="Mindestens 16 Zeichen. Wird nur verschlüsselt gespeichert und nie angezeigt.">
            <EHInput id="eh-byok-key" type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} autoComplete="off" required minLength={16} placeholder="sk-…" />
          </EHField>
          <EHField id="eh-byok-base-url" label="Basis-URL (optional)" hint="Nur https-Adressen. Leer lassen für den Standard-Endpunkt.">
            <EHInput id="eh-byok-base-url" type="url" inputMode="url" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} autoComplete="off" placeholder="https://openrouter.ai/api/v1" />
          </EHField>
          <EHField id="eh-byok-model" label="Modell (optional)" hint="Leer lassen für das Standard-Modell.">
            <EHInput id="eh-byok-model" value={model} onChange={(e) => setModel(e.target.value)} autoComplete="off" placeholder="z. B. google/gemini-flash-1.5" />
          </EHField>
        </EHFieldGrid>
        <EHActions>
          <EHButton variant="secondary" onClick={saveKey} disabled={busy || apiKey.length < 16}>Key verschlüsselt speichern</EHButton>
        </EHActions>
      </>}

      <EHActions>
        <EHButton variant="secondary" type="button" data-testid="watch-ad-button" disabled={true} aria-disabled="true" aria-label="Werbeclip ansehen noch nicht verfügbar" title="Werbeclips sind noch nicht angebunden — aktuell kein Guthaben über diese Schaltfläche.">Werbeclip ansehen: +10 KI-Aktionen (noch nicht verfügbar)</EHButton>
      </EHActions>
      <EHText muted>Werbeclips sind noch nicht verfügbar. Solange bleibt diese Schaltfläche deaktiviert — es wird kein Guthaben gebucht und keine Anfrage gesendet.</EHText>
    </EHWorkflowStack>
  );
}
