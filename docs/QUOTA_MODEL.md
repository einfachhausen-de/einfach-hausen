> **Abgrenzung zur Produktentscheidung 21.09.2026:** Diese Datei dokumentiert die technische KI-Nutzung zum genannten Stand. KI-Kontingente sind keine Eigentümer-Mitgliedschaft und dürfen nicht zur Voraussetzung für Inserat, Angebotsauswahl oder Tarifvergleich werden. Der kostenlose Eigentümer-Kern und das Partnerabo folgen PRODUCT_VISION.md; ein technischer Kauf-/Freemium-Verweis autorisiert keinen neuen Eigentümer-Tarif. Backend-Limits werden durch diese Dokumentationskorrektur nicht geändert.

# KI-Kontingente (Quota-Modell)

Stand: 2026-09-10. Belegt im Code: `src/lib/ai-engine.ts`,
`src/lib/orchestrator.ts`, `src/app/api/ki/route.ts`,
`src/app/api/ai/credits/route.ts`, `src/app/api/ai/byok/route.ts`.

## Drei Stufen (Reihenfolge aus `src/app/api/ki/route.ts`, Kommentar „EH T-0207“)

1. **BYOK (eigener Schlüssel):** Wer in den Einstellungen einen eigenen
   OpenAI-kompatiblen API-Schlüssel hinterlegt, nutzt sein eigenes
   Anbieter-Konto. Diese Aufrufe werden vom Betreiber **nicht gezählt**;
   es gelten Limits und Kosten des eigenen Anbieters.
   - Speicherung: `POST /api/ai/byok` (Schlüssel verschlüsselt in
     `user_settings`, nur maskierte Vorschau per `GET /api/ai/byok`).
   - Der Schlüssel erscheint nie in Logs oder Antworten.
   - Standard-Gateway ohne eigene URL: `https://api.openai.com/v1`,
     Standard-Modell `gpt-4o-mini` (`byokGateway()` in `src/lib/ai-engine.ts`).
   - Abschaltung: `POST /api/ai/byok` mit `{ "disable": true }`.
2. **Freemium (Betreiber-Kontingent):** Ohne eigenen Schlüssel laufen
   Cloud-Aufrufe über das Betreiber-Gateway (`AI_API_KEY` oder
   `OMNIROUTE_MASTER_KEY`, `AI_BASE_URL`, `AI_MODEL`).
   - Kostenlos: **20 Aktionen pro Monat** (`FREEMIUM_MONTHLY = 20`,
     `src/lib/ai-engine.ts`). Gezählt wird zuerst das Monatskontingent,
     danach Guthaben (`consumeCloudAction()`: erst Freemium, dann Credits).
   - Ist das Kontingent aufgebraucht, antwortet der Chat ehrlich, z. B.:
     „Dein kostenloses KI-Kontingent (20 pro Monat) ist aufgebraucht.“
     (`EXHAUSTED` in `src/app/api/ki/route.ts`).
3. **Guthaben per Werbeanzeige:** Über `POST /api/ai/credits` lassen sich
   **10 weitere Aktionen** freischalten (`AD_CREDIT_GRANT = 10`).
   Der Werbenachweis wird Server-seitig geprüft (Signatur, Aktualität,
   Einmal-Einlösung; Vertrag: `docs/OPERATIONS.md`, „KI-Ad-Credits“).
   Doppelte Einlösung gibt Fehler 409.

## Ehrliche Limits (für Hilfe-Texte und Support)

- Der Assistent hilft beim **Organisieren** (Fragen klären, Aufgaben planen,
  nächsten Schritt vorschlagen). Er gibt **keine Garantien**.
- Zusätzlich schützt ein Rate-Limit vor Missbrauch („Du hast gerade sehr
  viele Fragen gestellt. Bitte versuch es später erneut.“).
- Lokale Einordnung ohne Cloud-Kosten bleibt möglich
  (`classifyLocally` in `src/lib/ai-engine.ts`); Cloud-Nachdenken
  verbraucht Kontingent (`consumeCloudAction`).
- Kontostand einsehbar über `aiQuotaSnapshot()` (Freemium-Anteil,
  Guthaben, BYOK-Status).

## Im Code nicht verifiziert

- Konkrete Euro-Preise für Guthaben-Pakete: im Code nicht verifiziert.
  Es steht nur die Werbeanzeige-Gutschrift (10 Aktionen) belegt fest.
