> **Produktkontext aktualisiert · 21.09.2026:** Maßgeblich sind [Produktvision](../../PRODUCT_VISION.md) und [Positionierung](../../PRODUCT_POSITIONING.md): Handwerkervermittlung und Affiliate-Tarife zuerst, Eigentümer kostenlos, Partnerabo, Hausakte ergänzend. Frühere Prioritäten und „nächste Aktionen“ dieser Lieferung gelten nur für ihren datierten Umfang; aktuelle Fortsetzung unter [NEXT_AGENT](../../NEXT_AGENT.md). Technische und gestalterische Nachweise bleiben historische Belege. 

# EH-OWNER-ORDERS-20260911 · Handoff

## Ziel

Die Eigentümer-Auftragsübersicht `/app/jobs` folgt der am 11.09.2026 ausdrücklich freigegebenen professionellen Referenz.

## Branch

`design/owner-dashboard-20260911`

## Visuelle Referenz

1536×876 Owner-Aufträge-Mockup.

Verbindlich:

- Auftrags-Hero
- zweizeilige Hauptheadline
- Hausbild
- echte Objektadresse
- Suchfeld
- vier Übersichtsflächen
- kompakte horizontale Auftragsliste
- klarer Details-Zugang
- unterer Hilfebereich

## Fachliche Wahrheit

Keine Referenzdaten wurden als Produktdaten übernommen.

Die Beispielwerte im Bild wie:

- 3 offene Aufträge
- 1 in Bearbeitung
- 12 abgeschlossen
- konkrete Beispielaufträge
- konkrete Termine

sind ausschließlich Layoutreferenz.

Im Produkt werden alle Werte aus der echten Eigentümer-Datenbank erzeugt.

## Daten

Service-Aufträge:

`jobs.request_kind='service'`

Zähler:

- Offen = open + quoted + accepted
- In Bearbeitung = in_progress
- Abgeschlossen = completed

Termine:

1. bestätigter Appointment, falls vorhanden;
2. sonst `preferred_date`;
3. sonst `Termin noch offen`.

## Medien

Das erste echte `job_photos`-Medium darf als Thumbnail verwendet werden, sofern `mediaKindFromPath(...) === 'image'`.

Abruf ausschließlich über:

`/api/job-media/[id]`

Keine direkten privaten Dateipfade.

## Nicht verändert

- Auth
- Jobs-Lifecycle
- Quote-Lifecycle
- Matching
- Appointments
- Job-Detail
- Hausmeister-Intake
- private Media ACL
- globale Owner-AppShell

## Mobile

Desktopreferenz wird nicht auf 390 px gequetscht.

Bei schmalen Viewports stapeln sich:

- Hero
- Kennzahlen
- Zeilenmetadaten
- Detailaktion

Alle Informationen bleiben erhalten.

## Abnahme

Pflicht:

- 390
- 736
- 1536

Kein horizontaler Overflow.

Technische Gates allein sind kein visueller Beweis.


## Abschluss-Evidenz 2026-09-11

- TypeScript: PASS
- ESLint auf Dashboard/Orders/Design-Dateien: PASS
- Design-Generator: EH_TOKENS_VALID
- Design-Guard: EH_DESIGN_CONSISTENT
- Design-Guard-Test: 7/7 PASS
- App-A11y: PASS, 0 serious/critical Findings auf den geprüften App-Routen
- Responsive-Matrix: 63 Checks, 0 Failures
- Security-Regressions: 133/133 PASS + 43/43 PASS
- Security-Fuzz: 6/6 PASS; optionaler Route-Probe lokal übersprungen, weil der Fuzz-eigene Server nicht healthy wurde
- Demo-Binding-Regression: GREEN
- Browser-Evidence: 390 / 736 / 1536 für /app und /app/jobs ohne horizontalen Overflow
- Funktionale /app/jobs Browserprüfung: 19/19 PASS
- Production-Build: PASS

Erzeugte Evidenz:
- `evidence/jobs-390.png`
- `evidence/jobs-736.png`
- `evidence/jobs-1536.png`
- `evidence/functional-checks.json`

Kein Merge nach `main` und kein Deploy in diesem Auftrag.


## GitNexus-Abschluss

`detect-changes --scope all` und Vergleich gegen die tatsächliche Branch-Basis `origin/main` melden 14 geänderte Dateien, 19 Symbole, 8 betroffene Flows und Risk Level `high`.

Die betroffenen Flows sind ausschließlich die erwarteten `Dashboard`-/`Jobs`-Ketten bis zu AuthMode/Jar/Demo-/Ownership-Hilfsfunktionen. Auth-, Session-, Ownership- und Transfer-Code selbst wurde nicht verändert; die vollständigen Security-, A11y-, TypeScript- und Build-Gates sind grün.

Ein Vergleich gegen den lokalen Ref `main` ist auf diesem Mac nicht aussagekräftig, weil dieser Checkout historisch stark von `origin/main` divergiert. Der Arbeitsbranch wurde von `origin/main` erstellt; deshalb ist `origin/main` die korrekte Vergleichsbasis.


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
