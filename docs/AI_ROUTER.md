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
PDF-OCR und automatische Dokumentkategorisierung bleiben absichtlich außerhalb des Chat-Text-Routers in `document-intelligence.ts`. Sie verwenden denselben lokalen Laya-Dienst mit einer einzelnen begrenzten `document_kind`-Choice-Frage; normaler Dokumentinhalt wird dafür nicht an Jev oder einen generativen Cloud-Provider geschickt. Details: [LAYA_OWNER_INTELLIGENCE.md](LAYA_OWNER_INTELLIGENCE.md).

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

## Messung am installierten Dienst
2026-09-22, OCI CPU unter paralleler Build-Last: 18 isolierte Modellfragen, 11 rohe Entscheidungen korrekt, 8 mit Confidence >= 0.9, darunter 1 falsche. Latenz nach Warmup 1055–1377 ms. Der reine Modelllauf ist damit ausdrücklich kein bestandener Qualitätstest. Im kombinierten Router waren 17 explizite Befehle korrekt; die verbleibende unklare Frage wird durch die Confidence-Schwelle zur Rückfrage. Der erste kalte Request lag bei 3473 ms; der normale Router begrenzt die Wartezeit auf 3000 ms.
Systemd-Start erreicht vorübergehend das 4-GiB-Limit (Speicherreclaim/Swap), aber keinen OOM/Neustart; resident nach Start ca. 1.9 GiB plus 0.7 GiB Swap. Diese Messung begründet keine Parallelkapazitätszusage. Health trennt `busy` (aktuelle Belegung) und `busy_rejections` (Zähler).

## Produktionsnachweis der Dokument-Entscheidung
Fix `786d560` erweitert den Laya-HTTP-Vertrag sicher von hart verdrahtetem `route` auf genau **eine** benannte Choice-Frage. Mehrfachfragen bleiben 400; Auth, Body-/State-/Criteria-Grenzen bleiben bestehen. Dokumentkontext wird clientseitig auf 4000 Zeichen begrenzt.

Auf der ARM-OCI-VM wurde der echte Pfad mit Wegwerf-DB und privaten Temp-Dateien verifiziert: digitales PDF → `pdftotext` → Laya, PNG → Tesseract → Laya und iPhone-HEIC → `heif-convert` → Tesseract → Laya. Der Laya-`completed`-Zähler stieg für jeden Lauf exakt mit; Rechnung, Wartung und Garantie wurden korrekt klassifiziert. Garantie-/Gewährleistungs-Enddaten werden seit `77942d4` als prüfbare Erinnerungsdaten erkannt. Jev- und DeepSeek-Betreiberkeys waren beim Abschluss weiterhin nicht konfiguriert.
