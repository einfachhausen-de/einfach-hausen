# Einfachhausen — Projekt-Gedächtnis

**Detail:** `FALLEN.md` (Fallen 0–41), Tageslogs `2026-09-*.md`, Langtexte im Workspace:
`DEPLOY-BLOCKER.md`, `ZUKUNFTSSICHERUNG.md`, `BESTAND-DESIGNREGELN.md`, `INVENTAR-APPSEITEN.md`,
`SEO-AUDIT.md`, `ORTSSEITEN-KONZEPT.md`, `NAVIGATIONSKONZEPT.md`, `PRODUKTIONSREIFE.md`, `AFFILIATE.md`.

## Stand
Arbeitskopie **`/Users/jeremyschulze/dev/einfachhausen-landing-page/einfach-hausen/`** — **außerhalb**
des Workspace. Das **äußere** Verzeichnis ist Alt-Klon (258 Commits zurück) und **aktiv schädlich**
(Falle 4). `main` = **`bc424a5`**, live, Gate 15/15, Health `ready`. **Deploy ist manuell.**
**Gina will sichtbare Ergebnisse** — die schlagen interne Perfektion.
**GitHub-CI steht still** („recent account payments have failed", alle Jobs 0 Steps, auch auf `main`)
→ **keine** automatische Verifikation; lokale Prüfungen sind alles.

## Harte Regeln
- **Suchen nur mit dem Grep-Tool** — Bash-`grep` liefert intermittierend leer. `ps` ist gesperrt.
- **`scripts/eh-design-check.mjs` ist das Gesetz**, nicht tsc/eslint: `literal-color`, `foreign-font`,
  `small-type` (nur px), `unowned-style`, `decorative-effect`, `visual-utility`, `no-important`,
  `raw-value`, `state-class`. **Ungeprüft:** `rem/em/pt`, Schriftstärke, Zeilenhöhe, tote Klassen.
- **`eh-design-seal.mjs` nie ohne Jeremys Freigabe.** `design-debt.json` ist eine **Ratschet**.
  **Designänderungen nur per Push auf `main`, nie per PR** (Falle 38) — **`src/app/**` ist frei.**
  **Versiegelt:** `packages/eh-design/`, `globals.css`, `design-system.css`, `DESIGN.md`.
- **Lokal immer `./node_modules/.bin/<bin>`**, nie `npm run`. **Nie `next dev`** (20),
  **nie `npx tsc --noEmit`** (22). **Nie endgültig löschen** — erst Archiv, dann Papierkorb.
- **Git-Writes sind in der Sandbox stumm blockiert** → `dangerouslyDisableSandbox: true`, vorher
  `rm -f .git/*.lock`, Ergebnis per `git rev-parse` prüfen. `gh`: `/usr/local/bin/gh`.
- **Laufenden CI-Run nie abbrechen** (Supabase-Identitäten bleiben liegen). **Visual-Baselines nur in
  CI** (10). **`next build` scheitert lokal erst am Ende** (37) — `BUILD_EXIT=1` heißt nichts.
- **Zwei `Edit`-Aufrufe auf dieselbe Datei in einer Nachricht können rennen** — einzeln editieren,
  danach per Grep gegenprüfen.

## Deploy
`curl -s https://einfachhausen.de/api/health` → `uptime_seconds` = letzter Deploy.
**Nie zwei Deploys parallel** (zwei `npm ci` zerstören sich). SSH `sin-supabase` (Tailscale), sudo
passwortlos, `/srv/einfach-hausen`, Port 3010. Ablauf: `npm ci` → **Release-Gate (15 Punkte)** →
`systemctl restart` + Health-Check. Scheitert ein Gate nur auf dem Deploy-Host, erst nach der
**CPU-Architektur** fragen (arm64/x64), nicht nach dem Code.
**Sichtbeleg:** `scripts/app-visual-regression.mjs` auf dem Deploy-Host, Chromium-Pfad explizit;
danach `tests/visual-baselines/app` und `.sin-gpt-web/evidence/release-gate/app-visual-actual` löschen.

## Konventionen
- **Ganz Deutschland**, alle Regionen. „Pilotphase" ist **zeitlich** gemeint, nie geografisch.
  Sprache **Deutsch**. Kein Tracking, kein CMP (§25 Abs. 2 TDDDG). **Next 16: nur ein `next dev`.**
- **Kern ist die digitale Hausakte**; Handwerker-Vermittlung ist Teilfunktion.
  Copy-Quelle: `docs/COMPANY_IDENTITY.md`.
- **Design nie als Einzelvorschlag** — zwei bis drei unterscheidbare Varianten. **Nicht als A/B/C im
  Text erklären** (darauf kam „ich bin verwirrt"): **HTML-Vorschau mit markierter Stelle** bauen,
  dann genügt „variante 2". Zeigen statt beschreiben, Zahlen und Fachbegriffe weglassen.
- **Telefon ist der Maßstab.** Gemessen (`/app`, 390 × 844): 1948 px = 2,3 Bildschirme, **22 von 39
  Tippzielen unter 44 × 44 px**. Für Entwürfe: **28 / 20 / 17 / 15 px**, nichts unter 15, Tippziele
  ≥ 44 px, **vier** Bereiche unten. Höhe ist eine Rechnung, keine Geschmacksfrage.
- **Richtung A = Werkbank** ist gesetzt (B = Wohnzimmer, C = Akte — „Werkbank C" existiert nicht),
  Ansichten Liste / Karten / Chronik. Prototyp `vergleich/ziel/a-*.html`.
- **Messung an der laufenden Seite = Deploy-Stand, nicht `main`.** Bei „ist kaputt" zuerst
  `uptime_seconds` gegen `git log -1 origin/main` halten.
- **Mergen tut Jeremy** (PR #116 grün und offen). **Supabase selbst gehostet** (OCI, EU),
  LLM-Standort wählt der Nutzer (BYOK). Monetarisierung → `AFFILIATE.md`.
- **Vorschau-Seiten liegen in `vergleich/`**, nicht im Repo. Prüfwerkzeuge in
  `vergleich/werkbank-vergleich/pruefung/`; Playwright-core **absolut** einbinden (ESM kennt
  `NODE_PATH` nicht). Die Soll-Vorschau ist `vergleich/werkbank-vergleich/vergleich.html`.
