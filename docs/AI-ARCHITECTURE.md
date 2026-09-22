# KI-3-Stufen-Architektur (EH T-0207)

**Stand:** 2026-08-31 · **Ziel:** maximale KI-Fähigkeit bei ~0 € Betriebskosten, ohne Nutzer-Fallen.

## Stufen

### 1. Lokale Intent-Engine („Needle-Ansatz", ~0 €)
`src/lib/ai-engine.ts` — `classifyLocally(text)`: deterministische Regel-Engine (Gewerk-Keywords, Dringlichkeit, Modus, PLZ-Extraktion, Konfidenz). Entfernungen/Entscheidungen, die Struktur brauchen, laufen ohne Cloud.
- `needsCloud=false` → lokale Antwort/Routing (`localAssistantReply` im Orchestrator, Intake nutzt `parseRequest` lokal bei hoher Konfidenz ≥ 0.5).
- `needsCloud=true` → Stufe 2/3.
- Regression: 8/8 Checks (Trade-Match, Notfall, offene Frage, No-Match, Kontingent, Block, Ad-Credits, BYOK-Flag).

**Dokumentierte Abweichung:** „Needle 2 auf dem Endgerät" ist hier eine modellfreie Engine im Serverprozess der App (gleiche Runtime, kein Modell-Download). Für die App-Client-Seite verhält es sich identisch (keine KI-Kosten, sofortige Antwort). Ein echtes On-Device-LLM ist mit der heutigen Web-App (PWA) nicht sinnvoll auslieferbar; Capacitor (T-0167, planning-only) wäre der spätere Pfad.

### 2. BYOK (Bring Your Own Key, 0 € für den Betreiber)
- Einstellungen → KI-Assistent: eigener OpenAI-kompatibler Key (Google AI Studio, OpenRouter, …), optional Basis-URL + Modell.
- Speicherung: **verschlüsselt at rest** (`src/lib/security/secret-box.ts`, AES-256-GCM, Schlüssel aus `EH_DATA_KEY` oder `DATABASE_PATH`). Response enthält nur maskierte Vorschau.
- Nutzung: `/api/ki` entschlüsselt serverseitig je Request; Key wird **nie geloggt** oder an den Client zurückgegeben. Unbegrenzt für den Nutzer, kein Kontingent-Verbrauch.

### 3. Freemium + Rewarded Ad
- `ai_usage` trackt Cloud-Aktionen je Nutzer/Monat. Default-Kontingent: **20/Monat** (`FREEMIUM_MONTHLY`).
- Erschöpfung → HTTP 402 mit klarer UX und Optionen (Ad / Kauf / BYOK) — kein Dark Pattern.
- `ai_credits` + `POST /api/ai/credits`: +10 Aktionen nach Werbeclip (`AD_CREDIT_GRANT`); signierte Ad-Receipts werden serverseitig fail-closed geprüft und Single-Use eingelöst (siehe `docs/OPERATIONS.md`).
- Gateway: OmniRoute (`AI_BASE_URL`/`AI_MODEL`/`AI_API_KEY|OMNIROUTE_MASTER_KEY`), `stream:false`.

## Endpunkte
- `POST /api/ki` — Chat (3-Stufen-Logik, liefert `quota`, bei Erschöpfung 402 + `options`)
- `GET /api/ki` — Quota-Snapshot (Settings)
- `PUT /api/ki` — kompatibler Rewarded-Ad-Grant mit derselben signierten Receipt-Prüfung wie `/api/ai/credits`
- `POST /api/ai/credits` — Rewarded-Ad-Grant (+10)
- `GET/POST /api/ai/byok` — BYOK speichern/abfragen/deaktivieren

## Sicherheit
- Alle Endpunkte session-authentifiziert + Rate-Limits (`ki_chat`, `account_mutation`).
- Keys: AES-GCM at rest, nur serverseitige Entschlüsselung, keine Plaintext-Logs/Responses.
- Fail-closed: ohne Operator-Gateway und ohne BYOK keine Cloud-Aktion (honest message).

## Nachweis
- Engine-Regression 8/8; API-E2E 7/7 (Quota, 402-Flow, Ad-Grant, BYOK-Store/GET masked, At-Rest-Encryption); t0200 9/9; t0202 3/3; t0203 14/14; t0104 24/24; Full-Flow-E2E ok:true.

## Aktueller Betriebsstand 2026-09-22
Die produktive Laya/Jev/DeepSeek-Routing-Schicht ist in [AI_ROUTER.md](AI_ROUTER.md) beschrieben. Die darauf aufbauenden Eigentümer-Fähigkeiten, Dokument-Queue, OCR, automatische Hausakten-Einordnung, Erinnerungen und Tarifpartner-Grenzen stehen in [LAYA_OWNER_INTELLIGENCE.md](LAYA_OWNER_INTELLIGENCE.md).

Der frühere Dokument-Ingest-Entwurfsblock wurde nach der Implementierung bewusst nicht als zweite Spezifikation weitergeführt. Source of Truth ist die gebaute, getestete einfache Pipeline: vorhandenen PDF-Text direkt lesen, sonst lokales OCR, Laya nur für eine begrenzte typed-choice-Klassifikation, unsichere Ergebnisse sichtbar prüfen lassen und keine generative Cloud-Kaskade für normale Dokumente.
