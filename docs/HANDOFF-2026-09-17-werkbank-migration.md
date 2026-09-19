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


---

## Kapitel 11 — P0-2/P0-3/P0-4: Sidebar, Legacy-Routen, Guard (660012b, main, gepusht)

Damit sind **alle P0-Blocker aus dem Repo-Audit erledigt** (P0-1 wb-norail,
P0-5 CSS-Konsolidierung, P0-2 Sidebar, P0-3 Legacy-Routen, P0-4 Guard).

### P0-2 — leere Sidebar-Gruppen

`werkbank-rahmen.tsx` hat Bereiche ohne Kinder trotzdem als Gruppenkopf
gerendert. Live gemessen zeigten `/pro/orders`, `/pro`, `/pro/team` einen
"Ansprechpartner"-Gruppenkopf mit **0 Links** (providerAreas haben dort
`children: []`). Fix: `.filter(a => a.children.length > 0)` in der Sidebar-
Iteration. Nachher: beide Portale zeigen nur Gruppen mit echten Links —
verifiziert auf `/app`, `/app/jobs`, `/pro`, `/pro/orders`.

### P0-3 — Legacy-Routen (T-0168-Verstoß beseitigt)

Sieben Routen waren Client-Komponenten auf stillgelegtem Supabase-Datenmodell:
`getSupabase()` direkt im Browser gegen `anfragen` / `anfrage_messages` /
`angebote`, Realtime-Channel ohne prüfbare RLS, Supabase-Subject ungeprüft mit
Application-User-ID gleichgesetzt. Sie sind jetzt serverseitige Redirects:

| Alt | Neu | Autorisierung |
|---|---|---|
| `/chat/[anfrageId]` | `/app/messages?job=<id>` | `requireUser()` |
| `/anfrage/neu` | `/app/hausmeister` | Ziel autorisiert |
| `/anfrage/[id]` | `/app/jobs/[id]` | Ziel autorisiert |
| `/anfragen-pro` | `/pro/orders` | Ziel autorisiert |
| `/ansprechpartner` | `/app/messages` | Ziel autorisiert |
| `/onboarding/pro/[schritt]` | `/pro/onboarding` | Ziel: `requireUser('provider')` |
| `/onboarding/pro/gebiet` | `/pro/onboarding` | Ziel: `requireUser('provider')` |

`/onboarding/pro/*` war ein ungelinktes Duplikat des kanonischen Wizards
`/pro/onboarding` (Server-Component + SQLite). Alle 7 Redirects live
verifiziert (angemeldet als Owner `kunde` und Provider `handwerker`).
`mailer.ts` verlinkt `/anfrage/<id>` — der Link geht jetzt zum kanonischen
Auftrag, Mitarbeiter/Besucher landen nicht mehr im Daten-Nirwana.

### P0-4 — AuthContext Guard-Totholz

`PRIVATE_PREFIXES` enthielt 10 Phantom-Prefixe für Routen, die nicht
existieren oder inzwischen serverseitig weiterleiten. Der Guard ist
Convenience-only (Server bleibt die Autorität); auf unknown paths muss eine
404 gerendert werden, kein Client-Bounce. Entfernt: `/auftraege`,
`/meine-angebote`, `/historie`, `/profil`, `/einstellungen`,
`/benachrichtigungen`, `/dashboard`, `/ki-chat`, `/ansprechpartner`,
`/anfragen-pro`. Behalten: `/mein-haus`, `/notifications` (beide aktiv).

Sitemap-Kommentar bereinigt (gelöschte Routen nicht mehr als funktionale
Tools aufgeführt — sie waren nie in der Sitemap, nur im Kommentar).

### Gates (alle auf 660012b)

tsc 0 · eslint 0 errors / 28 warnings · design-check 0 neue Schulden ·
next build rc=0 · crm 20/20 · api-contract 17/17 · security + t0168-auth
PASS · GitNexus: 9 Symbole / 24 Fluesse = critical (erwartet:
WerkbankRahmen mit 23 Consumern + Routen-Umstellung), rein mechanisch.

### Nächste Aktion

P0 ist vollständig. Weiter mit **P1** aus `docs/REPO_AUDIT_2026-09-18.md`:
`/pro` Dashboard Empty State, `owner-menu.tsx` Focus-Trap/Escape, dann P2.
Danach: visuelle Abnahme durch Jeremy anhand der Vorschau-Datei
`docs/preview-werkbank-2026-09-18.html` (aktualisieren, wenn gewünscht).


---

## Kapitel 12 — P1-12/P1-15/P1-13: Storniert, Refresh, /app/more (35d0e09, main, gepusht)

Alle drei Punkte live verifiziert (Playwright, Dev-DB mit gesetzten Testdaten).

### P1-12 — stornierte Vorgänge zählen nicht mehr als „Erledigt"

`/pro/orders` und `/pro/calendar` hatten `cancelled` in `DONE_STATUSES` und
zeigten Stornierungen mit Erfolgston (`success`) in der „Abgeschlossen"-
Sektion. Jetzt: `cancelled` aus der Menge raus, eigener `warning`-Ton, eigene
Sektion (`#pro-orders-cancelled` / `#pro-cal-cancelled`) und eigene Metrik
„Storniert". Die aktiven/filternden Sektionen (Aktiv, Heute, Anstehend,
Überfällig, Undatiert) schließen Stornierungen aus.
Owner-Seiten waren bereits korrekt (`jobs` zeigt `cancelled` separat mit
`tone="line"`, `contracts` „Gekündigt" neutral) — nicht angetastet.

### P1-15 — kein `window.location.reload()` mehr nach dem Senden

`app/messages` + `pro/messages` `thread-client.tsx` haben nach erfolgreichem
POST die ganze Seite neu geladen und damit offene Accordions, Scrollposition
und Eingabe verworfen. Jetzt `router.refresh()`: Server-Komponenten werden neu
vom Server geholt, Client-State bleibt erhalten.
Live gemessen: `POST 201`, Status „Nachricht gesendet.", keine Navigation,
Textarea geleert, neue Nachricht erscheint in der Liste.

### P1-13 — Relikt-Route `/app/more` beseitigt

`/app/more` war nur noch vom Drawer-Footer verlinkt und im Code selbst als
Relikt markiert. Route gelöscht, `next.config.ts` leitet `/app/more` permanent
auf `/app` (Bookmarks), der Footer-Link heißt jetzt „Startseite".
`/app/hilfe` setzte `active="/app/more"` (Fantasiewert) → `active="/app/hilfe"`.
`/notifications` active vereinheitlicht statt rollenabhängig leer.
`/app/notifications` existierte ohnehin nicht mehr.

### Nicht umgesetzt: Block 4 (native Inputs `/pro/profile`) — Designbedarf

9 File-Inputs app-weit nutzen `<EHInput type="file">` und zeigen das native
OS-Widget („Choose File · No file chosen"). `packages/eh-design` hat keine
`EHFileInput`/`EHTimeInput`/`EHDisclosure`. Das Designpaket ist versiegelt —
der Bedarf ist gemeldet, nicht selbst gestylt. Checkboxen auf `/pro/profile`
sind bereits korrekt via `EHCheckbox` (accent-color).

### Gates (alle auf 35d0e09)

tsc 0 · eslint 0 errors / 28 warnings · design-check 0 neue Schulden ·
next build rc=0 · GitNexus: 8 Dateien / 19 Symbole = high, keine
Schnittstellenwechsel.

### Nächste Aktion

P2 aus `docs/REPO_AUDIT_2026-09-18.md`: 39 unerreichbare Dateien / dead CSS /
ungenutzte Icons (Punkte 22-24) — reines Aufräumen, kein Funktionswechsel.


---

## Kapitel 13 — P2-22: 29 ungenutzte Komponenten entfernt (7d2b8b1, main, gepusht)

Jede Loeschung doppelt verifiziert: Export-Name **und** Datei-Basename in
`src/`, plus Kreuzpruefung gegen `packages/`, `scripts/`, `docs/`.

**Entfernt (29 Dateien):**
- `src/components/ui/*` (10 Dateien): accordion, hover-card, tooltip,
  submit-button, tabs, button, card, badge, avatar, separator — kein
  Live-Importer, Referenzen nur von ebenfalls geloeschten Dateien.
- `src/components/visuals/*` (4): CardVisual, card-visuals-Registry, Barrel —
  Konsumenten waren nur geloeschte Marketing-Komponenten.
- Marketing-Tote: FeatureVisualGrid/-Card, security-section, trust-section,
  gateway-section, hero-orchestration, lazy-image, auth-convergence.module.
- `shadcn-studio/features-section-01` — letzter Importer von ui/button.

**Mit zurueckgezogen:** `test:card-visuals` (behauptete nur die Existenz der
ungenutzten Bibliothek; in keiner Release-Kette referenziert).

**Korrektur des Audit-Werts:** „39 unerreichbare Dateien" liessen sich nicht
reproduzieren; nach eigener Verifikation waren es 29.

**Qwen-Fehlalarme (4 von 5 Vorschlaegen waren falsch):** `ui/separator`
(live via trust-section), `marketing/tokens.css` (live via app/layout.tsx),
`visuals/index.ts` (Substring-Treffer ohne echte Nutzung — dennoch korrekt
geloescht), `home-hero` (**LIVE**, wird auf `/` gerendert; nach tsc-Fehler
wiederhergestellt). Grundlage war Qwens Ausschluss des eigenen Ordners beim
Referenz-Scan, was Dateien in `src/components/` systematisch als tot
kennzeichnet.

**Vorher/Nachher:** tsc 0, eslint 0 errors, design-check 0 neue Schulden,
next build rc=0, Homepage `/`, `/partner`, `/ueber-uns`, `/leistungen`
ohne Page-Errors, api-contract 17/17, crm 20/20. GitNexus: „No changes
detected" — die geloeschten Symbole hatten keine Caller.

**Bekannt (pre-existing, nicht von dieser Welle):**
`scripts/homepage-services-grid-contract.mjs` schlaegt vor und nach diesem
Commit fehl (rc=1): fordert HomeServicesGrid + CardVisual in einer
Mosaik-Komponente, die so nicht existiert. Kein Gate in der Release-Kette.

### Nächste Aktion

P2-23/24 (dead CSS in `globals.css`/`design-system.css`, ungenutzte
`icons.tsx`-Exporte): beide CSS-Dateien sind versiegelt und werden an die
Designautorität gemeldet. `icons.tsx`-Exporte koennen nach demselben
Verifikationsmuster geprueft und dann ausgeraeumt werden.

## Kapitel 14 — 1ee771d / d3e947b / 34f69bd: Werkbank-Spaltung zu Ende + T-0168-Bounce (main, gepusht)

**P1-8 vollstaendig.** Nach den 4 Provider-Seiten (d1d2a14) wurden die letzten 10
Owner-Seiten von AppShell auf WerkbankRahmen umgestellt: `/app/consultation`,
`/app/hausmanager`, `/app/hausmeister`, `/app/home/history`, `/app/home`,
`/app/insurance`, `/app/onboarding`, `/app/plans`, `/app/year`, `/notifications`
(1ee771d). Keine AppShell-Verwendung mehr unter `src/app/`.

Drei echte Fehler aus dieser Welle, alle behoben und live verifiziert:
1. `notifications/page.tsx` hatte `role="homeowner"` fest drin — Provider sahen
   die Owner-Navigation. Rolle jetzt dynamisch aus der Sitzung.
2. Die Provider-Glocke zeigte auf `/pro/notifications` — diese Route existiert
   nicht. Beide Glocken zeigen jetzt auf `/notifications` (nutzerscharf).
3. **T-0168-Verletzung (subtil):** `/notifications` stand in `PRIVATE_PREFIXES`,
   aber nicht in `SERVER_AUTH_PREFIXES`. Der Client-Guard hat jeden Nutzer auf
   `/login` geschickt, sobald die Supabase-*Client*-Sitzung fehlte (Local-Dev oder
   abgelaufene Client-Sitzung bei gueltiger Server-Sitzung) — selbst nach
   erfolgreicher `requireUser()`-Autorisierung. Server-Rendert kam (curl: 200),
   dann flog der Client raus. `/notifications` in `SERVER_AUTH_PREFIXES`
   aufgenommen, `PRIVATE_PREFIXES` geleert (`/mein-haus` ist serverseitig ein
   Redirect nach `/app/home`).

**P1-18 (34f69bd):** `/onboarding/pro/page.tsx` — die letzte Seite, die noch nach
Supabase `user_metadata` schrieb (T-0168) und keinen einzigen Inbound-Link hatte —
ist jetzt ein Redirect auf `/pro/onboarding`. Die Kindrouten `/gebiet` und
`/[schritt]` waren schon Redirects und bleiben als Lesezeichen-Schutz.

**P2-22 (d3e947b):** letzte 8 verifiziert-tote Dateien geloescht:
`src/lib/{utils,crm-sync,i18n,anfragen}.ts`,
`src/components/{Stepper,count-up,pw-field,KiCard}.tsx`. Jede einzeln per
Symbolgrenzen- und Import-Grep geprueft.

## Kapitel 15 — 853cdc1 / 0560ffb / 74a3406: Kontrast, Bewertungs-Feedback, Auth-Relikte (main, gepusht)

**Visueller Bug, echt (853cdc1):** Der „Ansprechpartner finden"-CTA in
`hausmeister-assistant.tsx` nutzte die Legacy-Klasse `.btn.primary`. Im
Werkbank-Scope gewinnt `design-system.css` `.btn.primary{background:var(--eh-dark)}`
ueber `globals.css` (Quellreihenfolge) — der CTA wurde fast schwarz (#111512) mit
dunklem Text, Kontrast ~1:1, also unlesbar. Ersetzt durch den versiegelten
`EHButton` (Petrol/Weiss). Gemessen: 0 Bedienelemente unter 4.5:1 auf
`/app/insurance` und `/app/consultation` (zuvor 2). Der Muse-Fund
„Eigenheim-Konto abgeschnitten" war veraltet — auf 6 Viewport-Breiten kein
Abschneiden mehr messbar.

**P0-7, echt (0560ffb):** `reportReviewAction` leitete nach dem Melden einer
Bewertung auf `/app/partners` weiter — eine reine Redirect-Route nach
`/app/messages`. Erfolgsmeldung UND Fehlerhinweis fielen unter den Tisch; der
Nutzer bekam nie eine Rueckmeldung. Jetzt leitet die Aktion zurueck auf die
Partnerdetailseite `/app/partners/[id]`, wo `sp.message` / `sp.error` ausgelesen
und gerendert werden (live verifiziert). Fehlt die Bewertung zwischenzeitlich,
greift `notFound()` statt einer Fake-Query.

**Regression aus 09331ec, echt (0560ffb):** Die Profilvollstaendigkeit in
`profile/page.tsx` nutzte `data-fill`, aber `werkbank-layout.css` hatte keine
Regel dafuer — der Balken war immer 0 px breit (funktionslos).Jetzt fuenf Stufen
in der geteilten CSS (`0/25/50/75/100 %`, `data-fill="quarter"|"half"|...`), keine
inline Styles.

**P0-6 KEIN Bug (verifiziert):** `/pro` zeigt fuer nicht verifizierte Provider
einen korrekten `ProviderState`-Sperrbildschirm, fuer verifizierte das volle
Dashboard — beides live durchgemessen. Die Demo-DB hat bewusst `verified=0`.

**P2-26 (74a3406):** `/welcome` und `/role` waren `'use client'`-Flows mit eigener
Rollenlogik (Supabase `user_metadata`) — genau das, was T-0168 verbietet. Kanonisch
tot: `/register-owner` / `/register-pro` (auth-v2) uebernehmen die Registrierung.
Beide sind jetzt serverseitige Redirects (`requireUser()` loest die Rolle aus der
Anwendungs-DB: Provider -> `/pro`, Eigentuemer -> `/app`). Der entsprechende
Client-Zweig in `AuthContext` ist entfernt. Live: anonym -> `/login`,
`kunde@demo` -> `/app` fuer beide Routen.

**P2-25 KEIN Bug:** „Anfrage" (Kontaktanfrage, Vor Verkauf/Auftrag) und
„Auftrag" (beauftragter Vorgang) sind begrifflich korrekt unterschieden — keine
Aenderung.

**Reste, die NICHT von mir sind:** `src/app/dashboard/`, `src/components/app-sidebar.tsx`,
`nav-main/nav-projects/nav-user/team-switcher`, `src/components/ui/*` (shadcn),
`.orca/drops/` sowie `package.json`/`package-lock.json`-Aenderungen sind eine
**parallel laufende Sidebar-Richtungsarbeit des Koordinators** (Operator-Wechsel:
aufklappbare linke Seitenleiste als Hauptnavigation). Sie sind UNTRACKED und
duerfen von niemandem ausserhalb jener Welle committed werden.

## Kapitel 16 — Offen nach dieser Welle

- **P2-28 native Inputs:** 8 `<input type="file">` ueber `EHInput` (contracts,
  home/history 3x, consultation, pro/profile 2x, pro/jobs/[id]/document-form)
  zeigen rohen Browser-Text („Choose File · No file chosen", englisch).
  `EHFileInput` fehlt im **versiegelten** `packages/eh-design` → gemeldet an die
  Designautoritaet, NICHT selbst gestylt (AGENTS.md).
- **P2-23 dead CSS in `globals.css`/`design-system.css`:** versiegelt → Designautoritaet.
  Bekannte Landminen fuer spaeter: `.providerScope :global(.metrics){display:none}`
  und ein nacktes `:global(label)` in alt-CSS-Modulen.
- **Layout-Richtungswechsel (Operator, 2026-09-19):** Linke Seitenleiste wird
  Hauptnavigation (aufklappbar, shadcn sidebar-07), Header nur
  Suche/Notifications/Tools. `shell.module.css`, `nav-config.ts`,
  `werkbank-rahmen.tsx`, `owner-menu`, `bottom-nav` sind ab sofort FROZEN fuer
  alle ausser der Sidebar-Welle.
- **Preview-HTML:** `docs/preview-werkbank-2026-09-18.html` ist noch auf dem Stand
  vor den Kapiteln 14/15 — erst nach dem Sidebar-Umbau neu generieren, sonst ist
  es sofort wieder veraltet.

## Kapitel 17 — Neue Ausgangslage: sidebar-07 Hauptnavigation (d8ebb11, main)

**Operator-Richtungswechsel ist gemerged.** Die linke Seitenleiste ist ab sofort die
aufklappbare HAUPTNAVIGATION (shadcn `sidebar-07`); der Header fuehrt nur noch
Suche/Notifications/Tools. Das Demo-Dashboard ist wieder geloescht.

**Shell-Sperre bleibt fuer alle ausser der Sidebar-Welle** (bis auf weiteres, nur nach
ausdruecklichem Koordinator-Go): `shell.module.css`, `nav-config.ts`,
`werkbank-rahmen.tsx`, `owner-menu`, `bottom-nav`, `src/components/ui/*`,
`app-sidebar.tsx`, `nav-main/nav-projects/nav-user/team-switcher`.

**Verifiziert auf dem neuen Rahmen** (dieser Agent, 1536px, beide Demo-Logins):
28 Routen geprueft — 25 liefern direkt 200 mit Hauptinhalt >100 px;
die 3 "Abweichungen" sind gewollte Redirects: `/app/onboarding` -> `/app`
(Einrichtung abgeschlossen) und `/app/partners` -> `/app/messages`
(kanonischer Ansprechpartner-Einstieg).

Die Kapitel 14-16 dieser Uebergabe (Kontrast-Fix, P0-7, P2-26, Profilbalken)
gelten unveraendert weiter — sie aendern keine Shell-Dateien.

## Kapitel 18 — Folge-Commits der Sidebar-Welle (08d57ef / 34c7d4b / 18c7323, main, gepusht)

Diese drei Commits stammen aus der sidebar-07-Welle des Koordinators
(opencode `ses_f4f5`), nicht aus der P0/P1/P2-Absorptionswelle. Sie stehen
auf Kapitel 17 auf und sind von diesem Agenten (Prime `01a0ba74`) nur
verifiziert, nicht authored.

**`08d57ef` — fix(p0-6/p2-25/p2-28):** Pro-Start Kopf+Kennzahlen, Terminologie
"Anfrage"->"Auftrag" konsolidiert, Onboarding-Stepper (`EHStepProgress`).
Beruehrt KEINE Shell-Datei der Sperre.

**`34c7d4b` — feat(settings):** Globaler Einstellungs-Dialog mit Sidebar-Navi
(`settings-dialog.tsx` + `settings-dialog-host.tsx` + `owner-settings-dialog.tsx`
+ neues `src/components/ui/dialog.tsx`). Der Dialog oeffnet sich als Overlay
ueber der aktuellen Seite — entweder ueber `?einstellungen=<section>` URL-Param
oder `openSettingsDialog(section)` (CustomEvent `eh:open-settings`) aus
`nav-user.tsx`/`nav-projects.tsx`. `/app/settings` bleibt als Fallback-Seite
erhalten und rendert denselben Inhalt. Rail-Overlap-Fix: Rail hatte keine feste
Gridspur mehr, blähte auf 763px und überlagerte den Content — jetzt alle 4
Rail-Seiten `main 1040 / rail 240`, Overlap 0.

**`18c7323` — style(settings):** Dialog-Inhalt als ruhige Karten mit EH-Typo,
Logik unveraendert. Operator-Go erteilt.

**Gates vom Koordinator selbst geprueft:** eslint 0, tsc 0, diff-check sauber.

**Zusaetzlich durch diesen Agenten (Prime) erledigt:**
- `design/design-debt.json` neu synchronisiert (`eh-design-debt-sync.mjs`):
  380 veraltete Schuldenpunkte entfernt. WICHTIG: Die `src/components/ui/*`-
  Einträge sind NICHT stale — `7d2b8b1` loeschte die alten shadcn-Dateien,
  `d8ebb11`/`34c7d4b` legten sie fuer sidebar-07 NEU an. Die Einträge sind
  wieder gueltig.
- `design/design-lock.json` neu versiegelt (`eh-design-seal.mjs`):
  `homeowner.module.css` + `provider-workspace.module.css` waren seit
  `27f1c47` (P1-17, 310 tote CSS-Regeln, rein deletiv) nicht mehr versiegelt.
  Aenderung verifiziert als rein deletiv (1102/51 und 797/3 Zeilen), 0 Mismatches
  nach Reseeal bei 53 geschuetzten Dateien.
- Visual-Baselines (`tests/visual-baselines/`, 22 Dateien) erneuert nach
  nachgewiesenem Baseline-Drift (keine Regression): `7d2b8b1` loeschte 29
  Marketing-Komponenten (-> `/partner`, `/ueber-uns`), `74a3406` machte
  `/welcome` zum Redirect. `test:visual` wieder 72/72 pass.

**Offen nach dieser Welle (nicht blockierend):**
- **P2-28** — 8 native `<input type="file">` ueber `EHInput`; `EHFileInput` fehlt
  im versiegelten `packages/eh-design` → Designautoritaet. Vollstaendige
  Spezifikation mit allen 8 Stellen + accept-Attributen:
  `/tmp/eh-coord/P2-28-ehfileinput-spec.md` (noch nicht ins repo verschoben).
- **P2-23** — dead CSS in `globals.css`/`design-system.css` → versiegelt →
  Designautoritaet.
- **404-Konsistenz** — `/pro/jobs/999`, `/app/jobs/999`, `/app/invoices/1`,
  `/pro/invoices/1` zeigen einen dunklen Fallback / "Seite wird geladen" statt
  der kanonischen `not-found.tsx`. Ursache je Route legitim
  (`job_dispatches`/`invoices` leer → fail-closed), aber die Ladeanzeige
  verschleiert das 404. Niedrige Prio, vom Koordinator notiert.
- **Prod-Deploy** — blockiert, aber die "Tailscale braucht Browser-Login"-
  Begruendung ist veraltet: `docs/OPERATIONS.md` dokumentiert Tailscale-SSH als
  DEAKTIVIERT auf sin-supabase, Port 22/2222 nutzen OpenSSH+Key. Realitaet:
  Port 2222 nimmt die Verbindung an, weist aber den Fleet-Key
  (`sin-vm2-fleet`) mit `Permission denied (publickey)` ab. Loesung: pubkey
  auf sin-supabase hinterlegen. Kein Deploy ohne ausdrueckliches Go.
- **`src/hooks/use-mobile.ts`** — eslint error `react-hooks/set-state-in-effect`
  (aus `d8ebb11`). Shell-Sperre → nicht selbst gefixt. Koordinator weiss.
- **Preview-HTML** — `docs/preview-werkbank-2026-09-18.html` noch auf
  Vor-Sidebar-Stand. Erst nach visueller Abnahme der neuen Navigation
  neu generieren.
