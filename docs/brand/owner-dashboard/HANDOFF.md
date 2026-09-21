> **Produktkontext aktualisiert · 21.09.2026:** Maßgeblich sind [Produktvision](../../PRODUCT_VISION.md) und [Positionierung](../../PRODUCT_POSITIONING.md): Handwerkervermittlung und Affiliate-Tarife zuerst, Eigentümer kostenlos, Partnerabo, Hausakte ergänzend. Frühere Prioritäten und „nächste Aktionen“ dieser Lieferung gelten nur für ihren datierten Umfang; aktuelle Fortsetzung unter [NEXT_AGENT](../../NEXT_AGENT.md). Technische und gestalterische Nachweise bleiben historische Belege. 

# EH-OWNER-DASHBOARD-20260911 · Handoff

## Auftrag

Die Eigentümer-Startseite `/app` wird exakt nach dem am 11.09.2026 ausdrücklich freigegebenen professionellen Dashboard-Mockup umgesetzt.

Die Referenz ist keine Einladung zu einer alternativen Interpretation. Informationshierarchie, ruhige Flächen, Statusübersicht, Composer-Arbeitsbereich und dreigeteilte untere Orientierung sind verbindlich.

## Repository

`Delqhi/einfach-hausen`

## Branch

`design/owner-dashboard-20260911`

## Kanonische Quellen

- `AGENTS.md`
- `DESIGN.md`
- `packages/eh-design/src/tokens.json`
- `packages/eh-design/src/workspace.tsx`
- `packages/eh-design/src/styles.module.css`
- `src/app/app/page.tsx`
- `src/components/homeowner/homeowner-hausmeister-composer.tsx`

## Datenverträge

Unverändert erhalten:

- `requireUser('homeowner')`
- `homeowner_profiles`
- `primaryProperty`
- `appointments`
- `jobs`
- `quotes`
- `maintenance_tasks`
- `sendHausmeisterAction`

## Interaktionsverträge

Unverändert erhalten:

- Hausmeister-Draft in LocalStorage
- Medienupload
- Spracheingabe
- Offline-Erkennung
- Submit-Fehlerzustand
- Next.js Redirect Control Flow
- Sidebar-Navigation
- Bottom-Navigation
- Hausassistent in der Toolbar
- Benachrichtigungen

## Neue kanonische Komponenten

- `EHOwnerDashboardHeader`
- `EHOwnerDashboardTopGrid`
- `EHOwnerDashboardStatus`
- `EHOwnerDashboardOverview`
- `EHOwnerDashboardComposer`
- `EHOwnerDashboardUtilityGrid`

Keine Consumer-lokale CSS-Familie wurde eingeführt.

## Responsives Ziel

Desktop:
Status links, Next-Overview rechts; Composer mit Beispielspalte; drei Utility-Bereiche.

Tablet:
Status und Overview untereinander; Utility-Bereiche dürfen zweispaltig umbrechen.

Mobile:
eine Spalte; Statusinformationen untereinander; Composer-Aktionen umbrechen; Send-Aktion volle Breite; Bottom-Navigation bleibt benutzbar.

Pflichtbreiten:
- 390 px
- 736 px
- 1536 px

Kein horizontaler Overflow.

## Designgrenzen

Weiterhin verboten:

- neue Farbpalette
- Gradients
- Glassmorphism
- dekorative Glow-Effekte
- frei erfundene Schatten
- zweite Schriftfamilie
- lokales Rebranding
- nachgebautes Logo

## Design-Lock

`DESIGN.md`, `packages/eh-design/src/workspace.tsx` und `packages/eh-design/src/styles.module.css` sind bewusst geschützte Designquellen.

Der Operator hat diese konkrete Änderung ausdrücklich autorisiert. Deshalb darf `scripts/eh-design-seal.mjs` nach vollständiger Umsetzung und Prüfung einmal ausgeführt werden, um die freigegebene neue Designversion zu versiegeln.

Das ist keine Erlaubnis, Design-Guard oder Debt-Baseline zu lockern.

## Noch vor Commit nachweisen

- TypeScript
- gezieltes ESLint
- Token-Generator-Check
- Design-Guard
- Design-Guard-Test
- App-A11y
- Build
- GitNexus detect-changes
- git diff --check
- reale Browseransichten 390 / 736 / 1536

## Release

Kein Deploy in diesem Auftrag ohne erneute Operator-Anweisung.


## Abschluss-Evidenz 2026-09-11

- Browser-Evidence: 390 / 736 / 1536 ohne horizontalen Overflow
- Responsive-Matrix: PASS
- A11y: PASS, keine serious/critical Blocking Findings auf den geprüften App-Routen
- TypeScript / ESLint / Design-Guard / Build: PASS

Erzeugte Evidenz:
- `evidence/dashboard-390.png`
- `evidence/dashboard-736.png`
- `evidence/dashboard-1536.png`

Kein Merge nach `main` und kein Deploy in diesem Auftrag.


## Live-Deploy 2026-09-11

Operator-Freigabe zum Merge und Produktionsdeploy wurde erteilt.

Release:
- App-Release-SHA: `05675c6f7cd3f74089c2173d2b7234534737f84f`
- Branch `design/owner-dashboard-20260911` fast-forward nach `main`
- Produktion auf `/srv/einfach-hausen` auf denselben App-Release-Stand aktualisiert
- Pre-Deploy-Backup: `/var/backups/einfach-hausen/einfach-hausen-20260911T165236Z`
- Production Node: `v22.23.0`
- Release-Gate: `15/15 PASS`
- Production-Smoke: `18/18 PASS`
- SQLite `PRAGMA integrity_check`: `ok`
- lokaler und öffentlicher `/api/health`: `ok=true`, `database=ready`
- `/app` und `/app/jobs` erzwingen unauthentifiziert weiterhin Login-Redirect
- `www.einfachhausen.de` endet korrekt auf dem Apex
- Service nach neuem Build kontrolliert neu gestartet; neuer MainPID bestätigt

Hinweis zum Deploy-Gate:
Der Security-Fuzz benötigt `WEBHOOK_SECRET` als temporären Gate-Fixture-Wert, obwohl die Produktion bewusst ohne diesen Legacy-Secret fail-closed läuft. Der erste Beobachtungslauf war deshalb 14/15; der maßgebliche Lauf mit ausschließlich prozesslokalem Fixture-Secret war 15/15. Die Produktions-Environment wurde dafür nicht verändert.
