# Owner-Kohärenz 2026-09-13 — Implementierungs-Handoff (kein Deploy, keine Abnahme)

Worktree: /home/ubuntu/orca/workspaces/eh-owner-coherence-20260913
Branch: fix/eh-owner-coherence-20260913 · Basis 33bcf224b98b46119dbaf3da624a83348b180b48 (sauber verifiziert)
Rolle: alleiniger Writer bis zu diesem Bericht; danach keine weiteren Edits ohne Root.

## Root-Vertrag (neuer Stand)

Root liefert COMPLETE-Blöcke; Implementierung exakt, kein Redesign.
Quellkapsel: /tmp/eh-coherence-packet — Inhalt lokal auf Mac:
FULL-SOURCE.md (sha256 1872043d0df369c006444bb6417dfecb602857c84c37272b2683174fc9b1c762),
DIRECTION.md (617b29fe0e7e145f7a9b8b901acda2a4e8cd5531b6d2ad6310a97081d044733a),
AMENDMENTS-01.json (10 exakte old/new-Blöcke, nach FULL-SOURCE genehmigt),
Einzeldateien (siehe Hashes unten). manifest.json beschreibt die Erstfassung;
die vier Routendateien wurden danach durch die Amendments ersetzt (Hashes unten).

Die Sep11-Kompositionen (Owner-Dashboard, Owner-Aufträge) sind durch ausdrückliche
Operator-Korrektur vom 2026-09-13 nur für /app, /app/jobs, /app/calendar,
/app/messages ersetzt. Kein Rebrand anderer Flächen. Original-Logo und
selbst gehostete Inter unverändert (siehe Asset-Hashes).

## Owner-spezifische Komponenten (alle neu/geändert, Pfade)

- packages/eh-design/src/workspace-owner.tsx (NEU): EHOwnerPageHeader,
  EHOwnerSection, EHOwnerRecords (+ Typ EHOwnerRecord), EHOwnerFilters,
  EHOwnerSearch, EHOwnerLinks, EHOwnerWelcome, EHOwnerComposer, EHOwnerContacts.
  Bestehende Primitive unverändert.
- packages/eh-design/src/styles.module.css: einmaliger owner*-Anhang
  (Marker genau 1x). packages/eh-design/src/index.ts: eine Zeile
  `export * from "./workspace-owner";` angehängt (genau 1x).
  Re-Export via src/design-system/index.ts bestätigt.
- src/lib/owner-format.ts (NEU): ownerInstant / ownerDate / ownerMaintenanceState.
- src/app/app/page.tsx, src/app/app/jobs/page.tsx,
  src/app/app/calendar/page.tsx, src/app/app/messages/page.tsx: Vollersatz
  + Amendments (SQL/Filter-Darstellung, UTC-Helfer, gleiche Daten/Auth/Aktionen).
- src/components/shell.tsx, src/components/house-assistant.tsx,
  src/components/homeowner/homeowner-hausmeister-composer.tsx: Vollersatz
  (ein Profileintrag; Toolbar mit Hausmanager + Benachrichtigungen).
- Eigene Tests: scripts/eh-owner-coherence.test.mjs (30 Tests, alle grün),
  registriert als `npm run test:owner-coherence`.
- E2E-Kopieerwartungen in scripts/e2e.mjs an neue Root-Texte angepasst
  (6 Stellen, mit Beleg, keine Abschwächung — Details in GATES.md).

## Tatsächliche Datei-Hashes (Worktree)

- packages/eh-design/src/workspace-owner.tsx: 3423eadf550e3e772cecd2ac624c38ad44265effbcd682917053e3173b5e1afa (= Paket)
- src/lib/owner-format.ts: 45d1d3a6cdc48315e5139b06fe65f8e73d0b3c99d897653c5f43dd1ee8ccea3b (= Paket)
- src/app/app/page.tsx: 5172567b67faf8b290613ff159106b4aceae4597d4b386b88b936350c6db3208 (= amendiertes Paket)
- src/app/app/jobs/page.tsx: a7c2298a8cdfd5192f7d32045314ad71b622b818a61cfbd8bea95e64f64db8be (= amendiertes Paket)
- src/app/app/calendar/page.tsx: 64f4afaec619f8738d2ac157303627e60b3ba977ddc415e045513a7955d11967 (Paket 570c8366… + genau 1 Zeichen Syntax-Fix, siehe unten)
- src/app/app/messages/page.tsx: 280f4c6105ff81b16842661bc05519e04b5067c5cb8b5781ae22ee51856705ed (= amendiertes Paket)
- src/components/shell.tsx: 92351ef3ff52f18d487a4873bc42598b92def0a168672a71c8367d05939e54e8 (= Paket)
- src/components/house-assistant.tsx: 504b6ec0c837d4e834c01b440ae7a989a6ff46c5979bf0bf86e4debba44b4c48 (= Paket)
- src/components/homeowner/homeowner-hausmeister-composer.tsx: 96cffbf4e46473700504dbe5521757c831ed6041f8a4cbbfb5aed7220a22c3e9 (= Paket)
- packages/eh-design/src/styles.module.css: 3f41958b2322cddb4da3d79d2b09a1e0a2cdbde217ddd8ae56d9d5089eeb0637 (Lock a0514756… + Anhang)
- packages/eh-design/src/index.ts: 64d99457189819ce273ef2abd184592becac9fa79bb7964ec2f4bab13f2652ff (Lock a36e270e… + 1 Zeile)

Original-Assets unverändert:
- packages/eh-design/assets/logo-full.png: ca128f0ecfcffc93853f5271453f318be28ed4462850b06072c33afbeb1353cd (= Lock-Prefix ca128f0e)
- packages/eh-design/assets/inter-variable.woff2: 0de3908cf5ef213ab1404cc5da94a976faaa886c3479a274a7d66ad80b37c64a (= Lock-Prefix 0de3908c)

## Minimaler Syntax-Fix mit Begründung (kein Design-Eingriff)

Paket-calendar-page.tsx enthielt eine ungeschlossene JSX-Expression in der
neuen Paginierung: `]} />` ohne schließendes `}` (tsc TS1005, Zeile 38).
Fix: genau ein Zeichen `}` ergänzt (`]} />}`), keine Verhaltenswahl möglich.
Root kann das Veto einlegen; Datei-Hash oben weicht deshalb vom Paket ab.

## Befehle und Ergebnisse (native OCI-Umgebung, keine Secrets im Log)

- tsc --noEmit: EXIT 0 (nach Syntax-Fix; vorher nur TS1005).
- eslint: EXIT 0, 0 Fehler, 35 Warnungen (vorbestehend + 1 Root-Block 'subtitle').
- node scripts/eh-owner-coherence.test.mjs: 30/30 grün.
- node scripts/eh-design-check.mjs: EXIT 1 — erwartet: 4 vorbestehende
  Abweichungen (assistant.tsx, workspace-conversation.tsx, workspace.tsx,
  sidebar-account-menu.module.css stammen aus HEAD-PRs, nicht von uns) plus
  unsere 2 beabsichtigten Dateien. NICHT neu versiegelt.
- next build (Turbopack, Build-Env /etc/einfach-hausen-build.env): EXIT 0.
  Hinweis: node_modules per cp -al aus /srv (kein Shared-Schreiben);
  Symlink scheiterte an Turbopack-Root-Regel; --webpack scheiterte an
  vorbestehendem :global-Selektor (Zeile 1745, aus HEAD, unberührt).
- npm run test:e2e: läuft (PID 573702, /tmp/eh-e2e.log, E2E_KEEP_TEMP=1).
- Screenshots 390x844/736x1024/1536x960 + /pro-Smoke: nach E2E, Belege nach
  /tmp/eh-coherence-after/.

## Task-DB-Blocker (exakt)

Kein .sin-gpt-web/ im Worktree; Taskplan-DB-Zugriff defekt (elterlich
verifiziert). Weder angefasst noch neu erstellt noch aus fremder DB
rekonstruiert. Fortschritt nur über diese Akten + Root-Ziel.

## Lock-Vorschlag an die Autorität (nicht angewendet)

design/design-lock.json, nur diese drei Einträge, Guard-Hash = sha256:
- ADD packages/eh-design/src/workspace-owner.tsx = 3423eadf550e3e772cecd2ac624c38ad44265effbcd682917053e3173b5e1afa
- SET packages/eh-design/src/styles.module.css = 3f41958b2322cddb4da3d79d2b09a1e0a2cdbde217ddd8ae56d9d5089eeb0637
- SET packages/eh-design/src/index.ts = 64d99457189819ce273ef2abd184592becac9fa79bb7964ec2f4bab13f2652ff
Alle übrigen Lock-Einträge bleiben. Freigabe durch Root erforderlich.

## Kein Abschluss/Deploy

Keine Fertigstellungs- oder Deploy-Behauptung. Kein Commit/Push/Merge.
Release-Eigentümer (Root) entscheidet nach Screenshots + Review.

## Finaler Stand (Implementierung abgeschlossen, kein Release)

- AMENDMENTS-02 (Root-autorisiert): styles.module.css 6x
  `:global(.owner-orders-section-heading)` -> `.scope :global(.owner-orders-section-heading)`
  (EHScope-Klasse verifiziert, keine Deklarationsänderung);
  sidebar-account-menu.module.css 1x `box-shadow: ...rgba(16,34,42,.14)` -> `none`
  (Border/Background unverändert). Exakte Counts verifiziert.
- Kalender-Brace-Fix von Root genehmigt (Nachricht release-fix-relay).
- Lock-Audit (48 Einträge): 6 Abweichungen, alle in der 8-Pfad-Allowlist —
  3 eigene (DESIGN.md daaf5ae7…, index.ts 64d99457…, styles ae95bf55…,
  ADD workspace-owner.tsx 3423eadf…), 3 vorbestehende HEAD-identische
  (assistant 6f1d430b…, workspace f690d8fa…, workspace-conversation 24ff523d…).
  0 nicht gelistete Abweichungen. Sidebar hat keinen Lock-Eintrag
  (Bedingung: kein Eintrag anlegen). Lock-Datei NICHT geschrieben.
- Gates final: tsc 0 · eslint 0 Fehler · test:owner-coherence 30/30 ·
  next build (Turbopack) 0 · next build --webpack 0 (Probe) ·
  design-check: Literal-Fehler behoben, nur Allowlist-Diffs ·
  test:e2e GRÜN (Run 5, 15/15 Checks, 0 Pageerrors, E2E-KEPT Temp auf OCI).
- Screenshots: 16/16 in /tmp/eh-coherence-after/ (OCI + Mac-Kopie),
  je Route 390x844/736x1024/1536x960 + Verlauf/Abgeschlossen + 2x /pro;
  alle h1=1, overflow=0. Belege vom Root zu sichten.
- E2E-Anpassungen (belegt, keine Abschwächung): Dashboard-Texte,
  Thread-Ansicht (2x), Onboarding-Banner-Texte (4x), Verzeichnisgruppe
  'Garten & Außen', Abgeschlossen-Ansicht (Selektor + Leak-Regex um
  'Angebotsstatus prüfen' erweitert), Thread-Navigation für Callout-Nachweis.
- Kein Commit/Push/Merge/Deploy. detect-changes vor Commit: Sache des
  Release-Eigentümers (Worktree ist nicht im GitNexus-Index).
- Writer-Rolle endet mit diesem Bericht; keine weiteren Edits ohne Root.

## Finaler Stand 2026-09-13 ~07:40 UTC (AMENDMENTS-03 angewendet, Writer RELEASED)

- AMENDMENTS-03 exakt angewendet (4 old/new je count=1 verifiziert + 2 appends je 1x):
  page.tsx ef5495fb..., workspace-owner.tsx ae2a6b65..., styles.module.css 85219abe...
- design/design-lock.json: genau 7 Eintraege aktualisiert + 1 ADD (alte/neue Paare in /tmp/eh-coherence-final-lock-oldnew.json auf OCI);
  Trio assistant/workspace/workspace-conversation vorab byte-identical HEAD verifiziert. Sidebar ohne Lock-Eintrag unangetastet.
  design-check danach EH_DESIGN_CONSISTENT (EXIT 0). Key-Reihenfolge-Artefakt (version ans Ende) via sort_keys, Metadaten erhalten.
- Gates nativ OCI: tsc 0, eslint 0 Fehler (35 Warnungen vorbestehend), owner-coherence 30/30, Turbopack build 0,
  webpack build 0 (mit exportierter Build-Env, Supabase-Origin im Bundle verifiziert), test:e2e GRUEN (ok:true, 15/15 Checks, 0 Pageerrors).
- Final-Screenshots: 23 PNG + report.json in /tmp/eh-coherence-final-shots (OCI) = durable docs/brand/owner-coherence/final-shots/;
  Quelle: kept green-E2E-Lauf (echte UI-Daten, isolierte Temp-DB) + 3 dokumentierte Fixture-Zeilen (past-Termin, ungelesene Nachricht);
  Prod-Server + echte Supabase-Login-Formulare, Test-Identitaeten danach geloescht (Cleanup in report.json belegt).
  Alle Checks h1=1, kein x-overflow, 44px-Actions, Toolbar/Composer/Hausmanager belegt; Provider-Smoke zeigt aktives Partner-Dashboard (kein Empty-Gate).
- Impact: EHOwnerOverview neu, einziger Consumer src/app/app/page.tsx (grep-belegt); .ownerOverview-CSS rein additiv;
  GitNexus-CLI 1.6.12 hat keine impact/detect-changes-Befehle, Worktree nicht indexiert -> HEAD-grep-Methode wie Baseline, dokumentiert.
- Tooling-Limiten: kein sin/sin-orca-Binaer auf OCI (NO_SIN_BIN) -> sin verify/review und sin-orca review nicht ausfuehrbar;
  unabhaengiges RLM-Review ist naechster Schritt (Root). Kein Commit/Push/Merge/Deploy durch mich.
- Neue Datei scripts/eh-owner-coherence-final-shots.mjs (Shot-Harness, wiederholbar). Keine Dependencies geaendert.
- WRITER-RELEASED: keine weiteren Source-Edits ohne Root. Kein Fertigstellungs-/Live-Claim. Release-Entscheidung bei Root nach Screenshots + Review.

## Doc-finalization 2026-09-13 — AMEND02 approval reconciled (doc-only)
- B1/B2 CLOSED as approved, not unapproved: root AMEND02 (/tmp/eh-coherence-packet/AMENDMENTS-02.json) expressly authorizes the exact six `.scope :global(.owner-orders-section-heading)` fixes (count 6) and the single sidebar `box-shadow: none` line (count 1). Authority is design-system correction only, NOT visual acceptance or deploy approval.
- Sidebar: source changed exactly one line (`src/components/sidebar-account-menu.module.css`); NO design-lock entry changed because no tracked entry exists — per lock_conditions. Not drift, not a missing update.
- Ordering: pure-scope `.scope :global` fixes precede the AMEND03 append (EHOwnerOverview + .ownerOverview). AMEND03 applied exactly once (hashes: page.tsx ef5495fb..., workspace-owner.tsx ae2a6b65..., styles.module.css 85219abe...).
- Code NOT reverted; guards/checks NOT relaxed or resealed.
- Status: final code implemented; root image direction accepted; independent release-acceptor verdict PENDING; deploy PENDING. No 'all done' claim.
- Preserved limits: canonical taskplan absent on OCI worktree (goal dir bootstrap/empty); stale @example.test subjects undeletable (Supabase admin DELETE 500s, test domain only, passwords random/unknown). No production data involved.

## Release-Hinweis 2026-09-13 (Root)
- final-account-390x844.png aus dem Commit entfernt: byte-identisch mit final-app-390x844-full.png (Harness-Kopiefehler), keine eigenstaendige Evidenz. Mobile Konto-Erreichbarkeit bleibt per /app/more belegt (E2E + Review).
- Graph: GitNexus CLI zeigt Summen exakt (15 Dateien / 25-27 Symbole / 28 Flows, CRITICAL durch AppShell mit 34 Aufrufern); Anzeigeliste ist gedeckelt, keine partial/truncated-Flags. Root akzeptiert das Risiko auf Basis von E2E 15/15 + Rollenmatrix.
