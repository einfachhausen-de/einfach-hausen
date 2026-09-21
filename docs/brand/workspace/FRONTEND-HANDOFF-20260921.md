> **Betreiberkorrektur 21.09.2026 — Geschäftsmodell und Frontend-Priorität:** [PRODUCT_VISION.md](../../PRODUCT_VISION.md) und [PRODUCT_POSITIONING.md](../../PRODUCT_POSITIONING.md) korrigieren den Schwerpunkt auf Handwerkervermittlung und Affiliate-Tarife. Diese Übergabe dokumentiert bereits gelieferte Bedienkorrekturen; sie ist keine Gesamtabnahme der neuen Produktpriorität.

# App-Frontend · Handoff 21.09.2026

Repository: `einfachhausen-de/einfach-hausen`
Branch: `feat/app-frontend-completion-20260921`
Basis: `c3a2e35de246794da4cb7ebec45fa5d57f3a6197`
Quellcommit: [`04348fb0a9ad8eb46b883fc5cce82a271e55e20d`](https://github.com/einfachhausen-de/einfach-hausen/commit/04348fb0a9ad8eb46b883fc5cce82a271e55e20d)
Workspace: `/workspace/scratch/3ed5c0c7857f/eh-frontend-followup` (ausgewählte Dateien, kein vollständiger Checkout).
Taskplan/Arbeitsnachweis: [TASKPLAN_FRONTEND_20260921.md](../../TASKPLAN_FRONTEND_20260921.md).

## Gelieferte Bedienung

- EHRecordViews erhält eine ausdrücklich aktivierbare Suche. Sie durchsucht Titel, Details, Betrag, Notiz und Datumsfelder der geladenen Einträge; mehrere Wörter müssen alle vorkommen. React-Status-/Action-Knoten werden nicht als Suchtext interpretiert. Suchtext bleibt beim Ansichtswechsel bestehen; die Speicherung der gewählten Ansicht bleibt erhalten.
- Keine Treffer hat eine eigene Rückmeldung; Zurücksetzen stellt die Liste wieder her und fokussiert das Suchfeld. Eine gespeicherte, für den Verbraucher nicht angebotene Ansicht fällt auf eine erlaubte Ansicht zurück.
- Owner: Verträge, dokumentierte Arbeiten und Wartungen/Aufträge im gewählten Jahr erhalten die Suche.
- Partner: Anfragen, aktive/abgeschlossene/stornierte Vorgänge, Kontakte und die fünf Termingruppen erhalten sie. Kontakte und abgeschlossene/stornierte Vorgänge verwenden ebenfalls den bestehenden Ansichtsumschalter.
- /pro zeigte bisher nur fünf von bis zu 30 geladenen Anfragen. Jetzt sind alle geladenen Einträge zugänglich; das Limit steht im UI. „Aufträge & Kontakte“ benennt das tatsächliche Linkziel. Die beiden „Offene Anfragen“-Links in /pro/orders führen zu /pro#kundenanfragen statt zum Maklerbereich /pro/leads.
- EHFileInput ruft den Verbraucher-Handler auf und bildet danach die native Auswahl ab. Mehrfachauswahl nennt Anzahl und Dateinamen. Ein nicht verhinderter Formular-Reset setzt auch den sichtbaren Dateinamen zurück; native Auswahl, Validierung und FormData bleiben maßgeblich.
- EHQuoteForm erlaubt Cent-Schritte bei unverändertem Mindestbetrag. /pro/calendar liefert YYYY-MM-DD für die Chronik und „Termin noch offen“ für ein ungültiges Datum. /pro/leads verwendet die bereits vorhandenen deutschen Statuslabels.

## Vollständige versionierte Quelldateien

Diese Links zeigen die vollständigen Dateien des unveränderlichen Quellcommits, keine unversionierten Ausschnitte:

- [`packages/eh-design/src/app.tsx`](https://github.com/einfachhausen-de/einfach-hausen/blob/04348fb0a9ad8eb46b883fc5cce82a271e55e20d/packages/eh-design/src/app.tsx)
- [`packages/eh-design/src/job-forms.tsx`](https://github.com/einfachhausen-de/einfach-hausen/blob/04348fb0a9ad8eb46b883fc5cce82a271e55e20d/packages/eh-design/src/job-forms.tsx)
- [`packages/eh-design/src/workspace-views.tsx`](https://github.com/einfachhausen-de/einfach-hausen/blob/04348fb0a9ad8eb46b883fc5cce82a271e55e20d/packages/eh-design/src/workspace-views.tsx)
- [`src/app/app/contracts/page.tsx`](https://github.com/einfachhausen-de/einfach-hausen/blob/04348fb0a9ad8eb46b883fc5cce82a271e55e20d/src/app/app/contracts/page.tsx)
- [`src/app/app/home/history/page.tsx`](https://github.com/einfachhausen-de/einfach-hausen/blob/04348fb0a9ad8eb46b883fc5cce82a271e55e20d/src/app/app/home/history/page.tsx)
- [`src/app/app/year/page.tsx`](https://github.com/einfachhausen-de/einfach-hausen/blob/04348fb0a9ad8eb46b883fc5cce82a271e55e20d/src/app/app/year/page.tsx)
- [`src/app/pro/calendar/page.tsx`](https://github.com/einfachhausen-de/einfach-hausen/blob/04348fb0a9ad8eb46b883fc5cce82a271e55e20d/src/app/pro/calendar/page.tsx)
- [`src/app/pro/leads/page.tsx`](https://github.com/einfachhausen-de/einfach-hausen/blob/04348fb0a9ad8eb46b883fc5cce82a271e55e20d/src/app/pro/leads/page.tsx)
- [`src/app/pro/orders/page.tsx`](https://github.com/einfachhausen-de/einfach-hausen/blob/04348fb0a9ad8eb46b883fc5cce82a271e55e20d/src/app/pro/orders/page.tsx)
- [`src/app/pro/page.tsx`](https://github.com/einfachhausen-de/einfach-hausen/blob/04348fb0a9ad8eb46b883fc5cce82a271e55e20d/src/app/pro/page.tsx)

Keine Asset-/Token-/CSS-Änderung:
- `packages/eh-design/assets/inter-variable.woff2`: unverändert, Git-Blob `55cc2e439f8beade479e6c96434e98d0e01aa3f9`.
- `public/brand/logo-full.png`: unverändert, Git-Blob `4283c123c85889c19e330c25f0235beac1218b63`.

## Quellprüfung und Grenzen

Direkt gelesen: aktuelle AGENTS.md, DESIGN.md, PRODUCT_VISION.md, NEXT_AGENT.md, Workspace-Übergabe sowie betroffene Komponenten und Verbraucher. Vor dem Schreiben war main weiterhin auf der Basis oben; es wurden keine fremden Änderungen überkopiert. EHRecordViews bleibt für nicht aktivierte Verbraucher ohne Suchoberfläche. EHQuoteForm ist im Partner-Auftragsdetail angebunden; EHFileInput wird unter anderem von Haus-Historie, Verträgen und Partner-Dokumentformular verwendet. Geteilte Komponenten erfordern die normale lokale Übernahme.

Nur Dateilesen und Diff-/Quellvergleich; **keine Tests, kein Build, keine Browserprüfung** auf ausdrücklichen Operator-Auftrag. Kein bestandenes Gate, kein Deployment und keine vollständige App-Abnahme behauptet. GitNexus/SQLite standen hier nicht bereit; die bereits erlaubte direkte Quellprüfung und Markdown-Übergabe ersetzen keinen behaupteten Graph-/Taskdatenbanknachweis.

Die drei geänderten Paketkomponenten gehören zum geteilten Designsystem. Keine neue Gestaltung, keine Palette und kein Stylesheet; bestehende Bausteine wiederverwendet. Design-Lock, Guards und Baselines wurden nicht geändert oder neu versiegelt.

## Übernahme der bereits gelieferten Bedienkorrekturen

Lokaler Agent übernimmt diesen Branch in den aktuellen main-Stand und führt seine bestehende Übernahme durch. Bei Konflikten nur die hier dokumentierten Frontend-Deltas integrieren; nie komplette ältere Dateien über neue Quellen kopieren. Besondere Bedienpunkte: Anfrage Nr. 6–30 erreichbar; Suche/Zurücksetzen/Ansichtswechsel; Dateiauswahl und Formular-Reset; Cent-Angebot; Termin ohne gültiges Datum.

PR #166 (Dokumentenbrowser) ist eine separate, noch offene Lieferung und wurde hier nicht integriert; bei der letzten Abfrage war sie nicht konfliktfrei mergebar. Keine Aussagen aus ihrer früheren Testabnahme auf diesen Frontend-Branch übertragen. Host-seitiges unversioniertes Design-WIP bleibt außerhalb dieser Lieferung.

## Genau nächste Frontend-Aktion nach Betreiberkorrektur

Eigentümer-Einstieg anhand der bestehenden Komponenten vereinfachen: Auftrag einstellen und Tarif vergleichen unmittelbar erreichbar, aktuelle Angebote/Vorgänge mit klarer nächster Handlung. Hausakte ergänzend erhalten. Danach den vorhandenen Handwerkerablauf vom Angebot/Kostenvoranschlag bis zur Rechnung vereinfachen. Keine weitere Such-/Listenwelle als Ersatz für diesen Kernauftrag.

Die Produktdokumentation ist korrigiert; Screens, Aboregeln und Freischaltungen wurden in diesem Dokumentationsschritt nicht geändert. Kein Test-/Build-/Releaseaufwand für den Frontend-Agenten.
