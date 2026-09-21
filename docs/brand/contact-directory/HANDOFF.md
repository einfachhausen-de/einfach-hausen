> **Produktkontext aktualisiert · 21.09.2026:** Maßgeblich sind [Produktvision](../../PRODUCT_VISION.md) und [Positionierung](../../PRODUCT_POSITIONING.md): Handwerkervermittlung und Affiliate-Tarife zuerst, Eigentümer kostenlos, Partnerabo, Hausakte ergänzend. Frühere Prioritäten und „nächste Aktionen“ dieser Lieferung gelten nur für ihren datierten Umfang; aktuelle Fortsetzung unter [NEXT_AGENT](../../NEXT_AGENT.md). Technische und gestalterische Nachweise bleiben historische Belege. 

# EH Gina Addressbook 2026-09-13 — Implementierungs-Handoff (kein Deploy, keine Gina-Abnahme)

Branch: `feat/eh-gina-addressbook-20260913` · Basis `59789ff1b570ec0350b3eb24e9b59e140139c44c`
Repo: Delqhi/einfach-hausen. Writer: OCI-Worktree `/home/ubuntu/orca/workspaces/eh-owner-coherence-20260913`.

## Root-Vertrag
Ginas Vorgabe ersetzt die bisherige Kontaktansicht: 17 Hauptkategorien zuerst
(keine Kontakte/Unterkategorien auf Ebene 1), dann Unterkategorie, dann Kontakt.
Ein Kontakt = ein Datensatz mit Mehrfach-Zuordnungen. Paket aus
/tmp/eh-gina-root-packet (Mac) exakt materialisiert: 6/6 Base-Hashes + account-deletion
byte-identisch verifiziert. Kein Redesign, keine fremden main-Änderungen.

## Dateien (Diff vs main: 34 Dateien, +2826/-88)
- Neu: contact-directory-taxonomy/store/schema/helpers, directory-actions,
  workspace-contact-directory.tsx, Regression + TS-Hook, TAXONOMY/DIRECTION/ACCEPTANCE,
  shots-Matrix-Skript + 11 PNG + report.json
- Ersetzt: messages/page.tsx, export/route.ts (+allBoth-Fix), DATA_INVENTORY.json,
  account-deletion.ts (+3 DELETEs + Provider-Unlink)
- Einfügungen: db.ts (2 Blöcke), DESIGN.md-Anhang, styles-Anhang, index-Export
- Tests: e2e-Messages auf Verzeichnis-Vertrag, t0144-Setup um neue Module,
  Regression 2 Paket-Testfehler minimal gefixt, E2E-Setup Kurzfrist-Toggle

## Gates (OCI, Node 22, Belege auf Host)
- tsc --noEmit: EXIT 0 · eslint: 0 Fehler (37 Warnungen, vorbestehend)
- contact-directory-regression: 20/20 · data-inventory: PASS (73 Tabellen)
- t0144-deletion: 6/6 · design-check: EH_DESIGN_CONSISTENT (Lock eng aktualisiert, s.u.)
- next build --webpack: EXIT 0 · test:e2e: ok:true, 15/15, 0 Pageerrors (/tmp/eh-e2e-final.log)
- Shots-Matrix: 11/11 (categories/sub/contacts/detail/new implizit/manage/assign/error;
  1536 + 390/736 für root/detail), je h1=1, kein Overflow (report.json)
- Vorbestehend belegt (Basis-Gegenlauf 59789ff identisch rot): T-0203 1/2 (c.kind fehlt
  im Schema), api-contract (/ki-chat-Regex). E2E-3b-Kurzfrist-Ausschluss war
  Kalender-Effekt (So statt Fr), per Setup-Toggle behoben, kein Produktfehler.

## Graph (GitNexus, frischer Index)
- Messages (Route): UNKNOWN per Konstruktion, per Routen-Grep geschlossen
- deleteAccountData: LOW (1 Aufrufer konto-loeschen POST)
- detect-changes compare vs main: 23 Dateien, 14 Symbole, 6 Flüsse, HIGH
  (Design-Abschnitte + Export-GET; kein CRITICAL; AppShell unberührt)
- Review (read-only, Diff): PASS — Export owner-gefiltert, Löschung im Transaktions-
  Block, db-Init nicht-destruktiv, kein Auth-/Token-/Partner-Matching-Eingriff

## Lock (autorisiert eng, kein Reseal)
- SET DESIGN.md daaf5ae7→084e9ce3 · SET index.ts 64d99457→19e8a415
- SET styles.module.css 85219abe→8e9cf19c · ADD workspace-contact-directory ece42aec
- Guard/Policy/Baseline/Tokens unverändert. Paare in /tmp/eh-lock-oldnew.json (OCI).

## Offen (kein Merge/Deploy ohne Freigabe)
- PR öffnen, GitHub-CI abwarten (Runner-Dispatch historisch rot — nicht umgehen)
- Gina-Visumabnahme der neuen Referenz anhand docs/brand/contact-directory/shots/
- Danach: Merge → OCI-Deploy (update-on-oci.sh) → Live-Smoke
