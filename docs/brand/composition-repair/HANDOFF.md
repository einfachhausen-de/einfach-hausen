> **Produktkontext aktualisiert · 21.09.2026:** Maßgeblich sind [Produktvision](../../PRODUCT_VISION.md) und [Positionierung](../../PRODUCT_POSITIONING.md): Handwerkervermittlung und Affiliate-Tarife zuerst, Eigentümer kostenlos, Partnerabo, Hausakte ergänzend. Frühere Prioritäten und „nächste Aktionen“ dieser Lieferung gelten nur für ihren datierten Umfang; aktuelle Fortsetzung unter [NEXT_AGENT](../../NEXT_AGENT.md). Technische und gestalterische Nachweise bleiben historische Belege. 

# Ausführbarer Handoff: Atelier-02-Kompositionskorrektur
Datum: 2026-09-07. Zielhost: OCI sin-supabase.
Produkt-Workspace: /home/ubuntu/orca/workspaces/eh-composition-repair-20260907
Produkt-Branch: design/eh-composition-repair-20260907
Basis: design/einfachhausen-brand-atelier-20260906 bei dc70cd6.
Skill-Workspace: /home/ubuntu/orca/workspaces/eh-composition-skills-20260907
Skill-Branch: design/eh-composition-skills-20260907
Skill-Basis: design/eh-brand-skills-v1-20260906 bei f3ada0f.

## Auftrag und Umfang
Jerry hat nach der Screenshotdiagnose ausdrücklich die notwendige Korrektur autorisiert.
Acht neue kanonische Bausteine: EHSectionHeading, EHProductExcerpt, EHProcess, EHProblemNotes, EHCaseStudy, EHBenefitStories, EHEditorialStatement, EHRequestForm.
Startseite und So-funktionierts verwenden die passenden Kompositionen. Alte öffentliche Adapter bleiben kompatibel. Intake bleibt GET /register mit role=homeowner und request, 4–700 Zeichen; Beispiele setzen das echte Eingabefeld. Keine neue Persistenz, keine Beispielbuchung.
Original-Logo, Farben, Fontassets und Navigationspunkte bleiben erhalten. Der zusätzliche Hero-Titel „Was steht bei deinem Haus an?“ wird durch die neue Komposition ersetzt; alte Zusatz-Badges entfallen.
Fachliche Aussagen wurden bei Beispielvorgängen explizit als Beispiele gekennzeichnet. Keine entfernten Präsentationsvideos wieder eingebaut.

## Quellen
docs/brand/system/COMPOSITION.md = verbindliche Auswahl und Regeln.
docs/brand/composition-repair/SOURCE.md = ALLE neuen/geänderten Textdateien vollständig in Codeblöcken.
docs/brand/composition-repair/source-manifest.json = Dateipfade, Größen und SHA256.
skills: shared/skills/sin-eh-design/references/composition.md und composition-source.md.
Kein „Rest analog“, keine Platzhalterimplementierung. Bei Konflikten Änderungen relativ zur genannten Basis nachvollziehen; niemals den ganzen aktiven Worktree ersetzen.

## Nächster Agent
Owner bleibt local-agent auf EH-BRAND-05-WEB / Issue43. Root hat keine laufende Aufgabe übernommen oder beendet.
Genau nächste Aktion: diese Korrektur in den aktiven Migrationsbranch integrieren, anschließend aktuelle Screens prüfen. GitHub ist die Transfergrenze.
Vor Integration git status und aktuellen HEAD aufzeichnen. Bestehende lokale Änderungen separat committen oder in bestehendem Arbeitsstand erhalten. Kein reset/clean/force.
Nur wenn der Zielbranch die gemeinsame Basis enthält und sauber ist: den isolierten Korrekturcommit cherry-picken. Bei Konflikten keine automatische ours/theirs-Auflösung; aktuelle fachliche Inhalte und neue Designkomposition zusammenführen.
Danach:
- npm run typecheck
- npm run lint
- npm run build
- node scripts/eh-design-generate.mjs --check
- node scripts/eh-design-check.mjs
- Betroffene Marketingseiten, Header/Footer-Intake und Sticky-Intake bei 390/736/1440 prüfen.
- Echte Formularnavigation mit Testdaten, Tastatur/Fokus, Fehlzustände, lange Texte und Zoom prüfen.
- Keine Screenshots mit eingeblendeter Dev-Toolbar oder eingefrorenen Sticky-Overlays als Markenreferenz verwenden.
Diese Releaseprüfungen sind ausdrücklich an den lokalen Agenten übergeben.

## Schutz und Freigaben
Der Designkern wurde wegen Jerrys ausdrücklicher Designkorrektur neu versiegelt; Schuldenbaseline und Guardlogik wurden nicht abgeschwächt.
Ein trusted-base-Guard kann diesen autorisierten Designrelease weiterhin blockieren, weil er Kernänderungen generell verbietet. Das ist keine Einladung, Workflow/Siegel in einem normalen Migrations-PR zu ändern. Den bestehenden Designrelease mit Eigentümerfreigabe integrieren.
Keine Behauptung einer Produktionsfreigabe oder eines Merge. Private Free-Branchschutzgrenzen bleiben wie zuvor dokumentiert.

## Ehrliche Evidenz
Zwei reale Routen im separaten Devserver bei 390 und 1440 geladen: HTTP200, kein horizontaler Dokumentüberlauf, alle Bilder geladen. Prozessabschnitte visuell betrachtet; Produktbeispiele enthalten lesbare 15/16px Inhalte und 13px Metadaten. Das ist keine vollständige Website-/App-Abnahme.
GitNexus impact ausgeführt: Section HIGH, 15 erfasste Abhängigkeiten; alter Index 29 Commits zurück. Mehrere neue Symbole UNKNOWN/not found. Neue Worktrees besitzen keinen eigenen Index. detect-changes wird versucht und die Grenze dokumentiert; lokale Regression muss frischen Index verwenden.
Keine umfassende Testsuite durch Root. App-Workflow-Lücken aus APP_COVERAGE_GAPS.md bleiben offen.

Frische Prüfung: TypeScript --noEmit --incremental false EXIT 0. Kanonischer Generator EXIT 0; Designguard EH_DESIGN_CONSISTENT EXIT 0. detect-changes: beide isolierten Worktrees nicht registriert, daher keine Graphfreigabe.

## Integration 2026-09-07
Die Migration des lokalen Agenten ist inzwischen main96ebf03. Ihre zwei Kompositionskonflikte wurden gezielt aufgelöst; alle übrigen Main-Aenderungen bleiben erhalten. Die Doppelüberschrift wurde jetzt in main src/app/so-funktionierts/page.tsx bestätigt: EHHeading plus EHSplitStory mit identischem Titel. EHCaseStudy ersetzt beide.
Mac-i9 Skills installiert:1c8a080, Backup /Users/jeremyschulze/.local/share/eh-design-backups/20260907T025723Z, Codex und OpenCode, bestehende globale Regeln vorhanden.
GitHub Actions starten derzeit wegen einer Kontosperre bei der Abrechnung nicht. Checkannotation: The job was not started because your account is locked due to a billing issue. Keine Checks abgeschwächt oder künstlich auf Erfolg gesetzt.
