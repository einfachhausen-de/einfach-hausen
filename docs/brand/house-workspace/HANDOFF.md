> **Produktkontext aktualisiert · 21.09.2026:** Maßgeblich sind [Produktvision](../../PRODUCT_VISION.md) und [Positionierung](../../PRODUCT_POSITIONING.md): Handwerkervermittlung und Affiliate-Tarife zuerst, Eigentümer kostenlos, Partnerabo, Hausakte ergänzend. Frühere Prioritäten und „nächste Aktionen“ dieser Lieferung gelten nur für ihren datierten Umfang; aktuelle Fortsetzung unter [NEXT_AGENT](../../NEXT_AGENT.md). Technische und gestalterische Nachweise bleiben historische Belege. 

# Hausakte und Hausgeschichte · Frontend-Lieferung 2026-09-09

Host: OCI sin-supabase. Repo: Delqhi/einfach-hausen. Worktree: /home/ubuntu/orca/workspaces/eh-house-workspace-20260909. Branch: fix/eh-house-workspace-20260909. Basis: e45812e29a786d233727d89599e46bacac7afdf4. Kanonischer Task: EH-BRAND-07-WORKSPACE; kein zweiter Taskplan.

## Geliefert

- /app/home: EHRecordCover, klare nächste Schritte, drei echte Bestandszahlen, Technikbestand und Erfassung in einem Arbeitsbereich; Hausprofil in Feldgruppen; fachlich gruppierte Navigation. Deutsche Techniknamen. Bestehende Notiz-Ankündigung bleibt als nicht verfügbare Funktion erkennbar.
- src/components/homeowner/house-profile-forms.tsx: wiederverwendbare HouseProfileForm und HouseAssetForm aus EH-Komponenten, native Action-Props, unveränderte Formularnamen, EHSubmitButton-Pendingzustände. Kein neues Designpaket, CSS oder Token.
- /app/home/history: vier konkrete Formulargruppen, kanonische Datei-Controls, verbundenes Hinweislabel, Pflichtfelder, Pending, getrennter Übergabebereich mit geltenden Einschränkungen. Historienkosten mit euroExact. Existierende Datenabfragen, Backend-Aktionen, Autorisierung, private Downloadlinks und Übergabelebenzyklus erhalten.
- Screenshots und technische Rendernachweise: design/workspace-preview/house/. Zwei echte Routen bei 390/736/1536. Daten sind isolierte lokale Fixtures, keine Produktionskonten.

## Tatsächliche Prüfung

ESLint der drei Produktdateien: PASS. npm run typecheck: PASS. Sechs Browseransichten: eine h1, alle sichtbaren Eingaben beschriftet und 16px, kein Seitenoverflow. Desktop-Ausschnitt der Hausgeschichte und Desktop/Mobile-Hausakte visuell begutachtet. Keine vollständige Zustands- oder produktive Rollenabnahme behaupten.

Die installierte wiederverwendete Dependency-Kopie meldet Next 16.3.1, package.json fordert ^16.3.4. Daher ersetzt diese Prüfung nicht npm ci und den Releasebuild mit dem aktuellen Lockfile. Keine Dependencies oder Lockfiles geändert.

Design-Guard scheitert bereits an der übernommenen Basis: Protected design file changed: src/app/design-system.css. Ursprung ist der mobile Drawer-Fix aus 3c0cab3, nicht diese Lieferung. Kein Siegel/Guard/Baseline verändert. Lokaler Agent muss die berechtigte kanonische Integration dieses Fixes klären; nicht einfach Schutz abschalten. Auf dem mobilen Screenshot zeigt der bestehende Drawer zusätzlich ein natives Dreieck über dem Menü-Icon; als gesonderter Shell-Befund prüfen, nicht diese Hausakte zurückbauen.

GitNexus impact wurde für MyHome und HouseHistory ausgeführt: UNKNOWN, Index veraltet. detect-changes meldet im registrierten älteren Index keine Änderungen und ist deshalb kein Nachweis für diesen neuen Worktree. Direkter Git-Diff und die tatsächlichen Aktionsverbraucher wurden geprüft; keine gemeinsame Backend-Funktion geändert.

## Aktuelle Produktion – frühere Blocker überholt

2026-09-09T18:32:54Z direkt gelesen: /srv/einfach-hausen HEAD e45812e; /api/health HTTP200, state ready, auth_authority reachable, database/storage ready. Vorherige Aussagen f554939/HTTP503 sind historische Befunde. Keine Anmeldung oder vollständige Live-Abnahme durch diesen Renderlauf belegt.

## Genau nächste Integration durch laufenden lokalen Agenten

1. Aktuellen eigenen Branch/Status prüfen, fremde Dateien erhalten. Diesen Branch regulär integrieren; kein reset/clean/force oder blindes Überschreiben. Er berührt keine Shell-/Backend-Dateien.
2. Integrierten Stand mit npm ci, typecheck, lint, Build, Design-Guard und bestehenden relevanten E2E prüfen. Den Basis-Guard-Befund fachgerecht beheben.
3. Isolierte Owner-Fixtures prüfen: Hausprofil speichern und wiederladen; Gerät hinzufügen samt Wartung; Wartung abschließen; historische Arbeit mit/ohne Fotos/PDF speichern; geschützte Downloads; Pflicht-/Fehler-/Pendingzustände; lange Inhalte und leere Akte. Hausübergabe nur mit Wegwerfkonten durchspielen, niemals reale Eigentümerschaft für QA ändern. Keine echten Benachrichtigungen versenden.
4. Mobilen Drawer-Marker und Fokus separat kontrollieren. Aktuelle Screenshots mit sichtbarem Viewport und echter Schriftdarstellung prüfen. Alte Full-page-Bilder fixierter Navigation nicht als Positionsbeweis verwenden.
5. Erst nach Integration und Prüfungen über den vorhandenen Standardprozess releasen. Produktionscommit, Health und Rollenansichten belegen. Verbleibende Familien aus NEXT-AGENT-CURRENT.md bleiben offen, solange keine aktuelle Evidenz vorliegt.

## Reproduzierbare Frontend-Vorschau

Nur gegen eigenen lokalen Devserver auf 127.0.0.1:4199 mit AUTH_MODE=local und separater DATABASE_PATH. Fixture-JSON enthält sessions.owner. Datei privat halten, nie einchecken. Keine Produktionssession kopieren.

```bash
cd /home/ubuntu/orca/workspaces/eh-house-workspace-20260909
export PATH="/home/ubuntu/.nvm/versions/node/v22.23.0/bin:$PATH"
EH_REVIEW_FIXTURE=/tmp/eh-final-review-fixture.json node scripts/eh-house-visual-review.mjs
```

Vollständiger versionierter Code einschließlich dieser Anleitung und Screenshot-Hashes: SOURCE.md und source-manifest.json in diesem Verzeichnis. Git-Integration ist maßgeblich; Codeblöcke erklären den kompletten Stand, ersetzen aber keinen Dreiwege-Merge.
