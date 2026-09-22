# Laya Router Implementation Plan
> Ausführung inline mit superpowers:executing-plans. main ist ausdrücklich autorisiert.
**Goal:** Laya-first in beiden bestehenden Gesprächstypen mit sicheren App-Tools.
**Architecture:** DecisionRouter → feste Capability → Eigentümer-Tool oder generative Antwort. Separater schlanker Python-Modellprozess; Jev HTTP-Adapter.
**Tech Stack:** vorhandenes TypeScript/Next/SQLite, Python/Laya, native HTTP.
**Spec:** docs/superpowers/specs/2026-09-22-laya-router-design.md
## Constraints
Kein UI-Redesign, kein neuer Branch, keine beliebigen Modell-Tools, keine bezahlten Testaufrufe, keine neuen Abo-Preise. Bestehende Uploads erhalten.
## Review Focus
- Laya-Timeout darf Inferenzkapazität nicht vorzeitig freigeben.
- Eigentümer A darf nie Daten von B erhalten.
- Fehler/BYOK dürfen Betreiberkontingent nicht verbrauchen.
- Unsichere Entscheidung darf nicht kostenpflichtig eskalieren.
- Alle bisherigen Gesprächseingänge verwenden denselben Pfad.
## Task 1: Router
- [x] scripts/ai-router.test.mjs zuerst ausführen (fehlender Router = RED).
- [x] src/lib/ai-router.ts: DecisionRouter.decide(text, signal), validierte Auswahl, timeouts, bounded overflow.
- [x] node --experimental-strip-types --experimental-loader ./scripts/contact-directory-ts-hook.mjs --test scripts/ai-router.test.mjs (GREEN).
## Task 2: Tools und Integration
- [x] scripts/ai-tools.test.mjs: getrennte Test-DB, zwei Nutzer, echte Datensätze, Kontingent.
- [x] src/lib/ai-tools.ts: executeAssistantTool(userId, capability, text) mit festen read-only SQL-Abfragen.
- [x] src/lib/assistant-service.ts: answerAssistant(userId, messages, signal), nur generativ verbraucht Credits.
- [x] src/app/api/ki/route.ts und src/lib/orchestrator.ts auf gemeinsamen Dienst umstellen.
- [x] src/lib/request-ai.ts: reine Auftragsextraktion deterministisch halten, unbegrenzte Cloud-Bypässe entfernen.
## Task 3: Modellbetrieb
- [x] services/laya/test_server.py: Auth, Validation, Busy/Health mit fake predictor, ohne Modellkosten.
- [x] services/laya/server.py + requirements.txt + deploy/laya.service: bounded Loopback-Inferenz.
- [x] scripts/ai-evaluate.mjs: reproduzierbare deutsche Routerfragen gegen echte VM, getrennte Messung von Confidence/Qualität/Latenz.
## Task 4: Abschluss
- [x] Router-/Tool-/Service-Tests, tsc, lint, build, E2E/Smoke und GitNexus.
- [x] Dokumentation und NEXT_AGENT aktualisieren; main commit/push.
- [x] OCI mit Git-Stand installieren, Readiness/Health prüfen; fehlende Provider-Keys als offen ausweisen.
## Arbeitsnachweis
Start: main 2339d76. Mac sauber, VM nur public/uploads untracked. Lokale taskplan.sqlite3 hat keine Tabellen; kein künstliches Neuinitialisieren. GitNexus hat HIGH für answerHausmeisterQuestion gemeldet; Nutzer informiert.

Ruling: Modelltest 16 deutsche Fragen zeigte trotz hoher Confidence falsche Auswahl (Stromkosten→Tarifwechsel, Textentwurf→Auftrag). Eindeutige Produktbefehle werden deshalb deterministisch geroutet; freie Formulierungen weiterhin Laya/Jev. Modellschwelle 0.9; unsicher = Rückfrage. Risiko bleibt Modellfehler bei freien Formulierungen, keine autonome Mutation.

Final review: unabhängiger Reviewer fand einen wichtigen Kalenderfehler (ISO-T vs. SQLite-Zeitvergleich). Regression zeigte vergangene heutige Termine; Fix normalisiert mit datetime. BYOK und Abbruch/Erstattung zusätzlich geprüft.

Deployment/Abschluss: KI-/OCR-Code bis `77942d4` auf OCI verifiziert. Release-Gate 17/17, öffentlicher Smoke 18/18, Node-KI 35/35 und Laya-Service 3/3 grün. Echte Wegwerf-Dateien beweisen Text-PDF → Laya, PNG → Tesseract → Laya und iPhone-HEIC → heif-convert → Tesseract → Laya; Laya-Health-Zähler stiegen passend, keine echten Nutzerdaten wurden für den Test verändert. `JEV_API_KEY`/`TYPESAFE_API_KEY` und `DEEPSEEK_API_KEY` fehlen weiterhin; Laya-Key ist eingerichtet. Parallele UI-Commits dürfen den Main-/Prod-Head nach diesem Nachweis weiterbewegen und sind separat zu verifizieren.
