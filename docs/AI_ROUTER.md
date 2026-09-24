# Hausmanager: Laya / Jev / DeepSeek
Stand 2026-09-22. Operator-Auftrag: simpel, auf main, VM zuerst.

## Ein Antwortpfad
`/api/ki` und `answerHausmeisterQuestion` (App/WhatsApp/Intake) verwenden `src/lib/assistant-service.ts`.
Eindeutige Befehle werden deterministisch zugeordnet, freie Formulierungen von Laya multilingual auf OCI.
Jev übernimmt ausschließlich bei Busy/429/502/503/504/Netzfehler/Timeout. Kleine lokale Circuit-Pause 2 s, maximal 4 parallele Jev-Aufrufe je App-Prozess. Der zentrale Laya-Prozess erlaubt eine Inferenz, keine Warteschlange, höchstens 8 HTTP-Threads.
Laya/Jev-Confidence unter 0.9, unbekannte Fähigkeiten oder fehlerhafte Antworten führen zu Rückfragen, nicht zu kostenpflichtiger Generierung. Kein Modell darf SQL, Nutzer-IDs, URLs oder Mutationen bestimmen.

## Fähigkeiten
Aufträge, Angebote, Vertragsanbieter/Kosten/Laufzeit/Kündigungsfrist, Dokument-Metadaten/Rechnungen, Ansprechpartner, Termine, Hausdaten, Pflege.
Handwerker finden/Auftrag erstellen/Tarifvergleich/Hilfe liefern den bestehenden Workflow als Einstieg. Sie verschicken, beauftragen, buchen und kündigen nichts.
Jeder Datenzugriff prüft Eigentümerrolle und Eigentümerschaft; keine Dateipfade oder fremden Dokumente im Modellkontext.
Freie Antworten und unterstützte privat hochgeladene JPG/PNG/WebP-Bilder verwenden DeepSeek bzw. ausdrücklich aktiviertes BYOK. Bildzugriff prüft die Verknüpfung zum eigenen Gespräch und die private Dateigrenze.
PDF-OCR und automatische Dokumentkategorisierung gehören nicht zum Text-Router; es gibt hier keine vorgetäuschte PDF-Analyse. Bestehende Ablage bleibt unverändert.

## Kosten
Laya und deterministische Tools verbrauchen keine generativen Credits. Jev ist Betreiber-Overflow und ebenfalls kein Nutzer-Credit.
Generative Anfragen reservieren atomar zuerst das vorhandene Freikontingent (20/Monat), dann bestehende Credits. Fehler/Timeout/leere Antwort erstatten. BYOK verwendet wirklich den persönlichen Gateway/Schlüssel und verbraucht keine Betreiber-Credits.
Credits-Kaufpreis und KI-Abo sind noch nicht entschieden. Keine erfundenen Checkout-Angebote, kein Unlimited. Kernfunktionen der Eigentümer-App bleiben kostenlos.

## Konfiguration
| Variable | Bedeutung |
|---|---|
| LAYA_URL | Loopback, Standard http://127.0.0.1:8097 |
| LAYA_API_KEY | interner Zugangsschlüssel, mindestens 32 Zeichen |
| LAYA_TIMEOUT_MS | Standard 3000, 100..15000 |
| JEV_API_KEY / TYPESAFE_API_KEY | optionaler TypeSafe-Schlüssel |
| JEV_MODEL | Standard jev-latest |
| JEV_MAX_CONCURRENT | Standard 4, maximal 32 je Prozess |
| DEEPSEEK_API_KEY | Betreiber-Generierung; ohne Schlüssel 503 ohne Abbuchung |
| DEEPSEEK_MODEL | Standard deepseek-flash |

Jev: https://api.typesafe.ai/v1/systemone ; dokumentiert https://docs.typesafe.ai/introduction/quickstart .
DeepSeek: https://api.deepseek.com/chat/completions ; Modellnamen https://api-docs.deepseek.com/quick_start/pricing/ .
Laya SDK: https://github.com/NandhaKishorM/laya ; Paket 0.3.5, multilingual-Checkpoint.

## Betrieb
Nach main-Synchronisation auf OCI: `bash deploy/install-laya.sh`.
Installiert isoliertes venv und systemd-Service, hält Schlüssel ausschließlich in /etc. Das Skript übernimmt den bereits heruntergeladenen Modell-Snapshot als lokalen Pfad. Vorhandene Provider-Schlüssel bleiben unverändert.
`curl -fsS http://127.0.0.1:8097/health` zeigt Readiness, Busy und aggregierte Zähler ohne Nutzerdaten.
`journalctl -u einfach-hausen-laya.service` zeigt nur technische Modellzustände.
App-Routing wird ohne Nachrichtentexte als provider/capability über die vorhandene structuredLog-Infrastruktur protokolliert.
Ressourcen: 2 CPU-Kerne, 4 GiB RAM-Obergrenze, Loopback-only, kein zusätzlicher öffentlicher Endpoint.
Nach Modell-Upgrade deutsche Evaluation wiederholen; erst danach Modellpfad ändern.

## Tests und Modellgrenzen
`npm run test:ai`: lokale HTTP-Fixtures/temporäre SQLite-Datenbanken, keine bezahlten Anbieter.
`python3 -m unittest discover -s services/laya -p 'test_*.py'`: Zugriffsschutz/Busy/Health.
`node --experimental-strip-types scripts/ai-evaluate.mjs`: explizite Befehle + echter lokaler Modellpfad; `--model-only` isoliert den Modellvergleich. Schlüssel über Umgebung, niemals CLI-Argument oder Log.
Erste isolierte Modellmessung (16 deutsche Fragen): ungefähr 0.74–0.95 s je Frage auf OCI CPU; mehrere Fehler, darunter hohe Confidence bei Stromkosten→Tarifwechsel. Daher explizite Befehle plus konservative Rückfrage. Diese kleine Stichprobe ist kein allgemeiner Qualitäts- oder 10.000-Nutzer-Kapazitätsnachweis.
## Verbleibende Betreiberkonfiguration
Bei Start dieser Welle waren weder Jev- noch DeepSeek-Schlüssel in der App-Umgebung vorhanden. Keine Konten aufgeladen, keine bezahlten Testaufrufe. Live-Status und Release-SHA stehen in NEXT_AGENT.md.
