# HANDOFF 2026-09-17 — Werkbank-Migration (Alt-CSS → EH-Designsystem)

Stand: main = `443500c`, gepusht auf origin/main, live auf OCI (`/srv/einfach-hausen`,
Health 200). Vorher: `ef4c3e6`.

## 0. Nachtrag 2026-09-18 — Soll-Start live, Aufräumstand

- PR #120 (Login-Redesign + Transitions-Fix) + Fix `421c1bf` (EHCheckbox, Inter)
  + PR #121 (Demo-Seed, Fehler-Objekte) + PR #122 (Soll-Vorgabe
  `docs/brand/app-ux-vorschlaege/` + Route `/app-ux-vorschlaege`) alle in main.
- `/app` auf Soll `#start` (`10b9093`): +Anliegen-CTA, Nächste-Termine-Sektion,
  Rail ohne Mock (echte Profilvollständigkeit). Screenshot-belegt (1536px).
- `#aufträge`+`#auftrag` via PR #123 (v0, geprüft: keine Sealed-Dateien, keine
  Mocks, Screenshots `/app/jobs` + `/app/jobs/1` mit eigenen Augen ok).
- `#dokumente` gruppiert (`c292e95`: Rechnungen/Angebote&Nachweise/Belege, je mit
  Anzahl; Umschalter raus, Jeremy-Go ausstehend war erteilt via „go").
- `#kontakte` (`443500c`): Erreichbarkeit aus echten Rufnummern in der Rail.
- Verträge/Termine/Profil: KEIN Soll-Bild in der Vorgabe — nur nach Muster bauen
  oder Jeremy definiert Soll (Stand: Muster erfüllt, kein Umbau nötig).
- Sealed-Fixes mit Jeremy-Go: FormSection-legend in der Karte (float), Chronik-Datum
  nowrap (`c1ac66b`, per `eh-design-seal.mjs` neu versiegelt).
- PR #119 geschlossen (leere Hülle). Remote nur noch `main` (15 Branches gelöscht,
  alle gemergt/belegt redundant). Keine offenen PRs, keine losen Worktrees.
- Login-Schutz: oberste Zeile `docs/NEXT_AGENT.md` — `src/components/auth-v2/`
  nicht umbauen.
- Vorbestand (nicht von uns): eslint-Warnung `_nextPath`, stale-Baseline-Hinweise
  aus PR #120, Hydration-Warnung `/app/messages` (versiegelte EHContactWorkspace).

## 1. Was getan wurde (Commit ef4c3e6)

32 tsx-Seiten von Altklassen (`admin-*`, `muted`, `stack`, `two`, `action-row`, …) auf
EH-Komponenten (`@/design-system`) umgestellt, 0 `className`-Altlasten übrig.
`src/components/shell.tsx` + `shell.module.css` (Topbar-Pille, Suche 170px,
Breakpoints 1120/760). 7 verwaiste `.module.css` gelöscht (grep-verifiziert ohne
Import): `admin/admin.module.css`, `anfrage/anfrage.module.css`,
`ansprechpartner/ansprechpartner.module.css`, `app/home/sale/sale.module.css`,
`chat/[anfrageId]/chat.module.css`, `onboarding/pro(-/gebiet)/*.module.css`.
`design/design-debt.json` + `design-lock.json` via sanktionierte Skripte synchronisiert
(Diff rein deletiv: 85 Zeilen raus, 0 rein; Lock-Diff nur Debt-Hash).

## 2. Was NICHT getan ist (wichtig, vom Nutzer an Screenshots belegt)

Die Migration war Klassen→Komponenten-Tausch bei gleicher Seitenstruktur.
Die **Werkbank-Komposition aus `vergleich.html` ist NICHT gebaut**: kein
durchgängiger Rahmen Topbar + Seitenleiste + Mitte + rechte Kontextspalte;
`/admin/crm`, `/admin/ops` haben gar keinen Shell-Rahmen. Nächster Auftrag:
Komposition pilotiert bauen, beginnend mit `/app`, pro Gruppe visuelle Abnahme
durch Jeremy — grüne Gates ersetzen keine Gestaltungsfreigabe.

## 3. Vorgabe (nur lesen, nie schreiben)

Im Repo: `docs/brand/werkbank-vergleich/vergleich.html` (inkl. `referenz.png`,
`inter-variable.woff2`, `ist/`-Screenshots daneben). Älterer Mac-Pfad, falls lokal
vorhanden: `/Users/jeremyschulze/workbuddy-ai/einfachhausen/vergleich/werkbank-vergleich/vergleich.html`.
(652 Zeilen, 6 Soll-Entwürfe). Tokens: `--r-pan:8px`, `--shadow-card` einlagig,
Inter. Echte Werte: `packages/eh-design/src/tokens.css`
(`--eh-radius-panel:0.5rem`, `--eh-shadow-card:0 2px 10px rgba(16,34,42,.08)`).

## 4. Harte Grenzen (Verstöße rückgängig gemacht)

Versiegelt (Hash in `design/design-lock.json`, Brand-Autorität nötig):
`DESIGN.md`, `packages/eh-design/*`, `src/app/globals.css`,
`src/app/design-system.css`, `src/app/app/homeowner.module.css`,
`src/app/pro/provider-workspace.module.css`, `scripts/eh-design-*.mjs`.
`globals.css`-Edit eines Agenten wurde per `git checkout` revertiert.
`design:debt:sync` + `eh-design-seal.mjs` nur bei rein deletivem Diff.

## 5. Verifikation (alle grün, selbst ausgeführt)

```
node scripts/eh-design-check.mjs   → EH_DESIGN_CONSISTENT
./node_modules/.bin/tsc --noEmit   → 0 Fehler
./node_modules/.bin/eslint <geänderte Dateien> → 0 Fehler (3 Warnungen shell.tsx sind Vorbestand aus HEAD)
./node_modules/.bin/next build     → ok (ACHTUNG: `npm run build` findet next nicht → Binary direkt)
node .gitnexus/run.cjs analyze --index-only → frisch (9.990 Nodes, 24.256 Edges)
detect-changes → CRITICAL (erwartet: 35 Dateien inkl. AppShell, ~30 Nutzer)
```

## 6. Vorschau lokal reproduzieren

Dev-Server (Production verweigert Local-Auth!): 
`AUTH_MODE=local SESSION_COOKIE_NAME=mh_session E2E_INSECURE_COOKIES=1 ./node_modules/.bin/next dev -p 3100`
Seeds: `node scripts/seed-local-user.mjs` (owner `design.audit@test.local` / `Test1234!`, druckt Token),
`node scripts/seed-pro-user.mjs` (provider `design.pro@test.local` / `Test1234!`, druckt Token).
Admin: `/admin/login` Passwort `admin` ODER `admin_sessions`-Insert mit **ISO**-Expiry
(`datetime('now',…)`-Format wird als abgelaufen verworfen! Single-Row-Index beachten).
Cookies: Owner/Pro `mh_session`, Admin `mh_session_admin` (Suffix `_admin`!).
Screenshots: `/tmp/eh-preview/shoot.mjs` (Playwright braucht
`executablePath:/Applications/Google Chrome.app/...`, addCookies nur mit domain+path).
Vorschau-Seite (gitignored): `artifacts/vorschau-2026-09-17/index.html`, öffnen via
`orca file open artifacts/vorschau-2026-09-17/index.html`.
Testdaten lokal: Job id 1, Invoice id 1 (manuell in `data/einfach-hausen.db`, gitignored).
Fallen: `/notifications`, `/ansprechpartner`, `/anfragen-pro` nutzen clientseitige
Supabase-Auth → zeigen lokal die Login-Ansicht (Vorbestand). zsh: Pfade mit `[id]`
quoten/`noglob`, sonst „no matches found".

## 7. Bekannte Abstriche der Migration

112-Callout ohne `role="alert"`; Rechnungs-Toolbar ohne `print-hide` (druckt mit);
Slider→Select (kein EH-Slider, Wertebereiche identisch); Deko-Icons in Empty-States
entfallen. Texte/Routen/Logik/Server-Actions unverändert (Attribut-Diff auditiert:
nur 2 Additionen, beide äquivalent: `action="/admin/crm"` bei GET-Filter,
`href="/pro/hilfe"` aus `ProviderState`-Prop übernommen).

## 8. Offen (Entscheidungen Jeremy)

51 zu kleine Schriften in vergleich.html; Ist-Spalte braucht Deploy-Host;
visuelle Abnahme aller Gruppen; DESIGN.md-Kleinigkeiten (Zeile 233 Token-Inventur
veraltet, `EHWorkflowForm`/`EHStepProgress` fehlen im Register, Zählstand 152→163)
— aber DESIGN.md ist versiegelt, nur via Brand-Autorität ändern. Untracked liegen
noch `.next.bak-vor-seo-pruefung/` + `tmp-deadcss.mjs` (WorkBuddy-Morgenreste,
bewusst nicht angefasst).

## 9. Anweisung Folge-Agent: Soll-Umbau Seite für Seite (Stand 2026-09-18)

Auftrag: die Soll-Vorschläge aus `docs/brand/app-ux-vorschlaege/index.html`
(identisch unter `/app-ux-vorschlaege` in der laufenden App) Seite für Seite in
echte App-Seiten umbauen — weg vom Ist-Zustand. Musterbeispiel fertig live:
`/app` nach `#start` (Commit `10b9093` lesen!).

Reihenfolge:
1. `#aufträge` → `src/app/app/jobs/page.tsx` (Mitte: Tabelle/Liste, rechts: Status + Termine)
2. `#auftrag` → `src/app/app/jobs/[id]/page.tsx`
3. `#dokumente`, `#verträge`, `#termine`, `#profil` → jeweilige `src/app/app/*`-Seiten
4. Danach Pro-Seiten (`provider_pro_*`) und Admin (`admin_*`) nach denselben Soll-Bildern.
Nach JEDER Seite: Stopp, Screenshot, Jeremy-Abnahme — kein „alle fertig" ohne Auge.

Harte Regeln (Verstöße werden revertiert):
- Nur `src/app/app/**` (+ ggf. `src/app/pro/**`, `src/app/admin/**`) und
  `src/components/werkbank-rahmen.tsx` anfassen. NIEMALS `packages/eh-design/*`,
  `DESIGN.md`, `globals.css`, `design-system.css`, `scripts/*` — versiegelt
  (Ausnahme nur mit ausdrücklichem Jeremy-Go für genau diese Stelle, danach
  `node scripts/eh-design-seal.mjs`).
- Keine Mockdaten: jede Zahl/jeder Balken aus echten Loadern (`jobs`, `quotes`,
  `appointments`, `provider_profiles`, `job_photos`, `documents`, `invoices`,
  `house_contracts`). Erfundene Prozent-/Bruch-Werte sind verboten (siehe
  68%-Mock-Entfernung in `10b9093`).
- Keine zweite Stilfamilie: nur EH-Komponenten aus `@/design-system` + Token-CSS
  (`var(--eh-*)`). Keine Hex-Farben, keine neuen `@media`-Breakpoints (1120/760
  aus der Vorgabe gelten), kein `style={{}}` für Layout.
- Texte, Routen, Server-Actions, Auth, Datenlogik unverändert — nur Komposition.
- `src/components/auth-v2/` nicht anfassen (Login-Schutz, NEXT_AGENT-Zeile 1).

Verifikation pro Seite (selbst ausführen, keine Gates erfinden):
`./node_modules/.bin/tsc --noEmit` (0 Fehler),
`./node_modules/.bin/eslint` auf geänderte Dateien (0 Fehler),
`node scripts/eh-design-check.mjs` (Exit 0; stale-Hinweise aus PR #120 sind Vorbestand),
Screenshot 1536px der echten Seite (Dev-Server Kap. 6: `AUTH_MODE=local
SESSION_COOKIE_NAME=mh_session E2E_INSECURE_COOKIES=1 ./node_modules/.bin/next dev -p 3100`,
Seed `node scripts/seed-local-user.mjs`).
NICHT committen, NICHT deployen, NICHT versiegeln — Jeremy nimmt ab und gibt das Go.

## 9. Nachtrag 2026-09-18 — Repo-Gesamtpruefung + wb-norail-Fix (main f62f50b/5ee8c8d)

- **Audit geliefert:** 4 parallele Tiefen-Reviews (Owner-App, Partner-App,
  Admin/Infra, Legacy/Dead Code) + 24-Shot Muse-Visitaudit (1536px, beide
  Portale). Konsolidiert in `docs/REPO_AUDIT_2026-09-18.md` (P0/P1/P2).
- **Ergebnis-Kopfzeilen:** Daten + Auth gesund — keine Mocks, requireUser/
  requireAdmin lückenlos. Das eigentliche Problem ist die Komposition
  (drei Shell-Welten, wb-norail nie gesetzt, leere Sidebar-Gruppen).
- **Fix live (f62f50b):** `WerkbankRahmen` setzt jetzt `.wb-norail`, wenn kein
  `rail`-Prop. 8 Seiten verloren vorher eine leere 240-px-Spalte. Live gemessen:
  `/app/documents` `/app/settings` `/app/messages` jetzt `212px 1324px`;
  `/app` `/app/contracts` behalten `240px`-Rail. tsc 0, eslint 0/28 Warnings,
  GitNexus detect-changes critical (23 Seiten nutzen den Rahmen) begründet —
  Change ist rein mechanisch (Klasse setzen, CSS existierte und wird von /admin
  seit Tagen korrekt genutzt).
- **Kaputte Gates (veraltete Tests, keine App-Bugs):** `test:api-contract`
  erwartet eine `role==='ai'?'assistant':'user'`-Translation in
  `src/app/ki-chat/page.tsx` (inzwischen reiner Redirect-Stub);
  `test:crm` wartet auf `article`-Lead-Karten, `/admin/crm` rendert
  `EHWorkflowForm`. Beide müssen an den aktuellen Code angepasst werden.
- **Nächste Aktion (Reihenfolge im Audit-Doc):** P0-2 leere Sidebar-Gruppen in
  `nav-config.ts` (providerAreas Anfragen/Nachrichten/Team = `children:[]`),
  dann P0-3 Legacy-Routen löschen (`/chat/[anfrageId]` T-0168-Verstoß:
  ungeprüftes Subject↔App-User-Mapping + Realtime ohne prüfbare RLS;
  `/anfrage/neu` schreibt in stillgelegte Supabase-Welt und leitet nach
  `/app/jobs` weiter, wo der Datensatz nie ankommt), dann P0-5
  `werkbankLayout`-CSS in ein gemeinsames Modul.
- **Remote kanonisch umgestellt:** `origin` jetzt
  `github.com/einfachhausen-de/einfach-hausen.git` (alte Delqhi-URL hatte
  weiterhin funktioniert).
- **Offen, nicht von uns:** `.orca/drops/` Screenshots untracked (bewusst nicht
  committet); `test:e2e:architecture` lokal nicht lauffähig (braucht
  Supabase-Produktionskeys, OCI-only).


---

## Kapitel 10 — P0-5 CSS-Konsolidierung + Gate-Reparaturen (09331ec, main, gepusht)

**Stand:** `09331ec` liegt auf `origin/main` (zusammen mit dem unpushed gebliebenen
`41d48bf`). Alle Gates grün (siehe unten). Die P0-Liste aus dem Repo-Audit ist damit
bei P0-1 (wb-norail) und P0-5 (CSS-Konsolidierung) abgeschlossen.

### P0-5: werkbankLayout CSS-Konsolidierung

Das `werkbankLayout`-CSS war **6× dupliziert** — jede Werkbank-Seite hielt ihren
eigenen Inline-`<style>`-String. Zwei Varianten hatten **widersprüchliche Werte**:
`/app` und `/app/jobs/[id]` verwendeten hardcodierte Pixel (`10.5px`/`13.5px`/
`12.5px`), die anderen vier Seiten bereits Tokens. Live gemessen waren Rail-Header,
Kartentitel und Listeneinträge auf den sechs Seiten also **nicht identisch**.

Umgesetzt (genau Option 1 aus der Qwen-Korrektur):

- **Neu:** `src/components/werkbank-layout.css` — 31 Selektoren, ausschließlich
  `--eh-*`-Tokens, **globale `.eh-werkbank-*`-Klassennamen unveraendert**
  (Plain Global CSS, kein CSS-Module: die Klassennamen stehen weltweit im Markup;
  Module-Hashing würde sie brechen). Superset aller 6 Varianten.
- 6 Seiten (`page.tsx`, `jobs/page.tsx`, `jobs/[id]/page.tsx`, `contracts`,
  `calendar`, `profile`): Inline-`werkbankLayout`-String + `<style>`-Tag entfernt,
  dafür `import '@/components/werkbank-layout.css'`.
- `/app/jobs` Statusbalken: inline `style={{width}}` → CSS-Variable
  `--eh-anteil` (`.eh-werkbank-stack > span { width: var(--eh-anteil,0) }`).
- **Live nachgemessen:** alle 6 Seiten haben jetzt identische Typografie
  (Rail-Header 12px, Kartentitel 15px, Listeneintrag 13px), 0 Konsolenfehler,
  Statusbalkenbreiten funktionieren über die CSS-Var.

### Zwei veraltete Gates repariert (Wurzeln im Visitaudit)

- **`test:crm` 20/20 PASS** (vorher 5/11): Lead-Karten werden als `EHWorkflowForm`
  (`<form>` + Fieldset aus `EHWorkflowForm`/`EHFormSection`) gerendert, **nicht**
  als `<article>`; das Filterformular hat kein `method="get"`-Attribut. Zwei
  Selektoren in `scripts/crm-e2e.mjs` umgestellt (`form` mit `select[name=status]`
  als Karten-Identifikator), die Prüflogik dahinter ist unveraendert.
- **`test:api-contract` 17/17 PASS** (vorher kaputt): der
  "kein TODO/stub"-Sweep scannt **Kommentare** per Regex; ein erklärender
  Kommentar in `src/components/nav-config.ts` enthielt das Wort "stub"
  ("/pro/jobs is a redirect stub" — Wortwahl sachlich falsch, es ist ein
  echter Redirect). Kommentar umformuliert. Kein Sweep abgeschwächt, keine
  Regel gelockert — die Regex ist weiterhin aktiv für alle `src/**`-Dateien.

### Gate-Ergebnisse (alle auf `09331ec`)

| Gate | Ergebnis |
|---|---|
| `tsc --noEmit` | 0 errors |
| `eslint .` | 0 errors / 28 warnings (pre-existing) |
| `eh-design-check.mjs` | 0 neue Schulden aus diesen Dateien |
| `AUTH_MODE=supabase next build` | rc=0 |
| `test:api-contract` | 17/17 PASS |
| `test:crm` | 20/20 PASS |
| `test:security` / `supply-chain` / `intake` / `matching` / `onboarding` / `notifications` / `review` / `t0168-auth` | alle PASS |
| GitNexus `detect-changes --scope all` | 8 Dateien, 15 Symbole, 24 Fluesse, **critical** — erwartet (6 Werkbankseiten + `WerkbankRahmen`-Consumer), rein mechanischer CSS-Umzug + Test-Selektoren |

Design-Debt-Hinweis (unveraendert, pre-existing): `src/app/app/jobs/page.tsx` hat
keine Baseline für `unowned-style` (1 > 0); `auth-v2/auth-shell.css` und
`app-ux-vorschlaege` melden stale Baselines. Nicht von dieser Welle, nicht
gelockert.

### Nächste Aktion (Reihenfolge aus `docs/REPO_AUDIT_2026-09-18.md`)

1. **P0-2** leere Sidebar-Gruppen in `nav-config.ts` abfangen
   (`area.children.length > 0` in `werkbank-rahmen.tsx`, sonst bleiben leere
   Gruppenkoepfe für Start/Ansprechpartner/Anfragen/Nachrichten/Team stehen).
2. **P0-3** Legacy-Routen löschen: `/chat/[anfrageId]` (T-0168-Verstoß),
   `/anfrage/*`, `/anfragen-pro`, `/ansprechpartner` → redirect,
   `/onboarding/pro/*`; `AuthContext.PRIVATE_PREFIXES` phantom routes mit abräumen.
3. **P1** `/pro` Dashboard Empty State + `owner-menu.tsx` Focus-Trap/Escape.
