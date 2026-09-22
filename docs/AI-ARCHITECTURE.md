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

<!-- AI-DOC-INGEST-20260922 -->
## Verbindliche Aktualisierung 2026-09-22 — Laya/Jev/DeepSeek + Dokument-Ingest

Diese Aktualisierung ersetzt bei Widerspruch die ältere Stufenbeschreibung oben. Ziel bleibt: **einfacher Betrieb, kostenlose Standardnutzung, keine stille KI-Halluzination in Fachdaten**.

### Laufzeit-Routing

1. **Laya auf `sin-supabase` ist Standard** für typed decisions (Intent, Routing, Klassifikation, Kandidatenauswahl). Kein Endgeräte-Modell im jetzigen Schritt.
2. **Jev ist ausschließlich elastischer Overflow** für denselben typed-decision-Vertrag, wenn Laya wegen Queue/Last/Timeout nicht zeitnah antwortet. Jev ist kein semantischer „zweiter Versuch“ bei niedriger Confidence.
3. **DeepSeek ist nur für echte generative/visuelle Aufgaben** vorgesehen und läuft hinter dem Credit-/Abo-Gate. Normale Datenabfragen, Navigation, FAQ, Dokumentklassifikation und Standard-OCR dürfen keine generativen Credits verbrauchen.
4. Geschäftslogik, Auth, Ownership und Schreibrechte bleiben deterministisch im Backend. Ein Modell darf niemals selbst eine privilegierte Aktion ausführen.

### Dokument-Upload: ein Pfad, ein Worker, keine Infrastruktur-Explosion

Nutzer müssen PDF, JPG/JPEG, PNG, WebP und HEIC hochladen können. Der Upload antwortet schnell; Verarbeitung läuft asynchron.

```text
Upload
  -> privates Original speichern
  -> document_processing_jobs (SQLite-Queue)
  -> Text im PDF vorhanden?
       -> ja: Text direkt extrahieren
       -> nein/zu wenig Text: OCR auf sin-supabase
  -> Kandidaten aus Text finden
  -> Laya: Dokumenttyp + Zuordnung + Kandidaten auswählen
       -> bei Laya-Überlast: Jev mit gleichem Request
  -> deterministische Validatoren
  -> sicher? automatisch in Hausakte/Fachbereich einordnen
  -> unsicher? Status "Bitte prüfen"; KEIN stiller Fachdaten-Write
```

**Infrastruktur:** eine SQLite-basierte Queue in der vorhandenen DB + genau **ein separater CPU-OCR-Worker** auf `sin-supabase`. Kein Redis, RabbitMQ, Kubernetes oder externer OCR-Dienst. OCR bevorzugt self-hosted PaddleOCR/PP-OCR auf CPU; vor Produktion auf der ARM-Neoverse-N1-VM benchmarken. Der Webprozess darf nicht durch OCR blockiert werden.

### Text-PDF vs. OCR

- Bei maschinenlesbaren PDFs wird vorhandener Text direkt extrahiert; OCR wird übersprungen.
- Bei Scan-/Foto-PDFs und Bildern läuft OCR.
- Bei gemischten PDFs werden nur Seiten ohne ausreichend brauchbaren Text OCR-verarbeitet.
- Originaldatei bleibt unverändert erhalten. Extrahierter Text ist nur ein abgeleitetes Such-/Analyseartefakt.

### Laya darf auswählen, nicht erfinden

Aus OCR/Text werden zuerst Kandidaten gebildet, z. B. alle Beträge, Datumswerte, Rechnungs-/Vertragsnummern, Firmen-/Anbieternamen und Adressen. Laya beantwortet typed questions gegen diese Kandidaten:

- Dokumentart / Fachbereich
- Anbieter/Firma
- Rechnungsbetrag / Abschlag
- Rechnungs-/Vertragsnummer
- Rechnungs-, Leistungs-, Fälligkeits- und Vertragsdaten
- passende Immobilie
- passender vorhandener Auftrag/Handwerker
- Vertrag/Tarif vs. Rechnung/Beleg vs. Haus-Historie vs. allgemeines Hausdokument

Ein extrahierter Wert darf nur persistiert werden, wenn er **im Quelltext belegt** ist. Modellgenerierte neue Beträge, Daten, Vertragsnummern oder Firmennamen sind verboten.

### Ablage in der bestehenden Hausakte

Bestehende Fachmodelle werden wiederverwendet:

- **Auftragsbezogene** Rechnung / Angebot / Bericht / Garantie -> bestehende `documents`-Struktur am passenden `job_id` (`invoice|offer|report|warranty|other`).
- **Vertrag/Tarif/Versicherung/Versorger** -> bestehende `house_contracts` + Dokumentreferenz; strukturierte Felder nur nach Validierung.
- **Durchgeführte Arbeit/Wartung/Haus-Historie** -> `house_history_entries` + `house_history_documents`.
- **Allgemeine Eigentümerdatei ohne passende Fachentität** -> genau eine kleine neue `house_documents`-Tabelle als Hausakte-Inbox/Archiv. Keine Fake-Jobs oder Fake-Historieneinträge erzeugen.

`house_documents` bleibt minimal: owner, optional property, Titel, Kategorie, privater Dateipfad, MIME/Größe/Hash, Processing-Status, erkannter Dokumenttyp, Confidence, extrahierter Text/JSON, created/updated. Spezialtabellen referenzieren dasselbe Original bzw. denselben privaten Pfad; keine unnötigen Dateiduplikate.

`/app/documents` bleibt die zentrale Nutzeransicht und führt Fach-Dokumente + allgemeine `house_documents` zusammen.

### Fehlerfreiheit = keine stillen falschen Daten

100% OCR-Erkennung kann technisch nicht garantiert werden. Die Produktgarantie lautet deshalb: **Unsicherheit wird sichtbar, nicht automatisch als Wahrheit gespeichert.**

Auto-Ablage nur wenn:
- OCR/Text ausreichend sicher,
- Laya-Entscheidung oberhalb kalibrierter Schwelle,
- exakter Quellbeleg für extrahierte Werte vorhanden,
- Datentyp-/Plausibilitätsprüfungen bestehen,
- Ownership/Immobilien-/Auftragszuordnung eindeutig ist.

Sonst -> `review_required`. Die UI zeigt nur die wenigen unsicheren Felder mit Quelle und „Bestätigen / Korrigieren“. Nach Korrektur wird sauber gespeichert. Keine zweite komplexe KI-Kaskade.

DeepSeek Vision darf nur als **generative/visuelle Premium-Stufe** eingesetzt werden (Credit/Abo), wenn der Nutzer eine weitergehende Analyse verlangt oder eine schwierige Datei bewusst mit erweiterter KI prüfen lässt. Auch DeepSeek schreibt nie ungeprüft direkt in Fachtabellen.

### Minimale Statusmaschine

`queued -> extracting -> deciding -> done`

Fehler-/Unsicherheitsausgänge:
- `review_required`
- `failed`

Ein Job ist idempotent; Retry darf keinen doppelten Vertrag, Auftrag oder Historieneintrag erzeugen.

### Akzeptanzkriterien für den laufenden Agenten

- [ ] Upload von PDF + gängigen Bildern ist homeowner-authentifiziert und privat.
- [ ] Digitales Text-PDF beweist den No-OCR-Fastpath.
- [ ] Scan-PDF/Bild beweist den OCR-Pfad.
- [ ] OCR läuft außerhalb des Next.js-Request-Threads über einen Worker.
- [ ] Laya entscheidet Dokumentart/Zuordnung und wählt nur vorhandene Kandidaten.
- [ ] Bei Laya-Überlast kann derselbe Decision-Request an Jev gehen; keine doppelte Fachlogik.
- [ ] Kein externer/generativer Call im normalen Upload-Pfad.
- [ ] Unsichere Werte landen in `review_required`, nie still in Fachtabellen.
- [ ] Sichere Vertragsdatei landet bei `house_contracts`; sichere Jobdatei beim Job; Hausarbeit in History; Rest in `house_documents`.
- [ ] `/app/documents` zeigt alle Kategorien konsistent an.
- [ ] Originaldatei bleibt erhalten; Text/Extraktion sind ableitbare Metadaten.
- [ ] Auth/Ownership-Tests verhindern Fremdzugriff.
- [ ] Retry/Mehrfach-Worker-Verhalten ist idempotent.
- [ ] Fixtures decken mindestens Stromrechnung, Vertrag/Tarif, Handwerkerangebot, Handwerkerrechnung, Garantie, sauberes Scanbild, schlechtes Foto und unbekanntes Dokument ab.
- [ ] Benchmark auf echter `sin-supabase`-CPU dokumentiert Seiten/min, Peak-RAM und Queue-Verhalten; erst danach Kapazitätsgrenzen festlegen.

**Nicht bauen:** Browser-OCR, On-Device-Laya, Redis/BullMQ, Microservice-Flotte, zweites OCR-System, automatische generative Fallback-Kette oder neue allgemeine Agentenplattform. Erst reale Last messen.
