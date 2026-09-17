# HANDOFF 2026-09-17 — Werkbank-Migration (Alt-CSS → EH-Designsystem)

Stand: main = `ef4c3e6`, gepusht auf origin/main. Vorher: `bc424a5`.

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

`/Users/jeremyschulze/workbuddy-ai/einfachhausen/vergleich/werkbank-vergleich/vergleich.html`
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
