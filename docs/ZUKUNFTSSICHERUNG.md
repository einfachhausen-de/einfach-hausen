# Zukunftssicherung — Konzept

**Leitsatz:** Was durch Disziplin verhindert werden muss, wird nicht verhindert.

Jede Maßnahme unten hat genau eine von zwei Eigenschaften:

- **B — Bau-Blocker.** Der falsche Wert existiert nicht mehr. Er kann nicht geschrieben werden.
- **C — Check-in-Blocker.** CI lehnt ab. Ohne Ausnahme, ohne `--no-verify`, ohne „nur diesmal".

Maßnahmen ohne B oder C stehen nicht in diesem Dokument.

**Messgrundlage.** Alle Zahlen sind am 2026-09-16 in der Arbeitskopie
`/Users/jeremyschulze/dev/einfachhausen-landing-page/einfach-hausen` nachgemessen, nicht übernommen.
Wo meine Messung von der Schadensliste abweicht, steht meine Zahl mit Messmethode:

| Schaden | gemessen | Methode |
| --- | --- | --- |
| Schuldenpunkte gesamt | **3585** in **67** Dateien | Summe über `design/design-debt.json` |
| Spitzenreiter | `design-system.css` **1011**, `globals.css` **828**, `marketing.module.css` **359** | dto. |
| Klassennamen in den vier App-CSS-Dateien | **1055** | Union aller `.name` in globals/design-system/homeowner/provider-workspace |
| davon ohne Referenz im Quellcode | **590** (**55,9 %**), **565** auch in keiner anderen CSS-Datei | Suche über `src/**` + `packages/**`, nur `.ts/.tsx/.js/.jsx/.mjs` |
| `!important` | **112** Vorkommen in `src/**/*.css`, davon **67** in `design-system.css` (auf 25 Zeilen) | Vorkommen, nicht Regeln |
| Verschiedene `font-size`-Werte | **179** | `src/` + `packages/`, alle `.css` |
| Verschiedene `font-weight`-Werte | **33** | dto. |
| `box-shadow`-Deklarationen | **283** | dto. |
| Selektoren in ≥2 der vier Dateien | **36** (`.btn`, `.btn:hover`, `.auth-page`, `.bottom-nav`, …) | Top-Level-Selektoren |
| Globale CSS-Dateien | **4** (`globals.css`, `design-system.css`, `marketing/tokens.css`, `auth-v2/auth-shell.css`), dazu **30** `*.module.css` | `find` |
| App-Seiten | **40** unter `src/app/app` + `src/app/pro`, **94** unter `src/app` | `find -name page.tsx` |

---

## 1. Ein Wortschatz, keine Rohwerte

### Mechanik

**1.1 Ein Ort, an dem Rohwerte legal sind.** `packages/eh-design/src/tokens.json`. Gemessen:
nur `tokens.css`, `tokens.json`, `tokens.ts` tragen die 12 Markenfarben; `styles.module.css` hat 2 Hex-Treffer.
Das Paket ist heute schon sauber. Der Rest des Projekts ist es nicht. Das ist die Ausgangslage, keine Ausrede.

**1.2 Von der Blacklist zur Whitelist — das ist der entscheidende Umbau.** Die heutigen sechs Regeln
(`scripts/eh-design-check.mjs:9-16`) verbieten *bestimmte* Rohwerte. Das kann nicht funktionieren, weil die Liste
der Rohwerte offen ist. Belegt:

- `small-type` greift nur bei `px`, nicht bei `rem`, `em`, `pt`, `%`.
- `literal-color` sieht `oklch(` (**62**) und `color-mix(` (**41**) nicht.
- `decorative-effect` matcht `rounded-full`, aber nicht `border-radius:999px` (**78**).
- `box-shadow` (**283** Deklarationen) ist vollständig ungeprüft.

Neue Regel `raw-value`: für `font-size`, `font-weight`, `color`, `background*`, `border*color`, `border-radius`,
`box-shadow`, `letter-spacing`, `line-height` ist **nur** erlaubt, was in dieser Liste steht:

```
var(--eh-…), inherit, initial, unset, revert, currentColor, transparent, none, 0, auto, 100%, normal, bold, bolder, lighter
```

Alles andere ist ein Fehler. Damit sind die vier Lücken oben geschlossen, ohne eine neue Regex pro Einheit. **B + C.**

**1.3 Fehlende Token-Gruppen nachziehen.** Heute existieren Tokens für Farbe, Schriftgröße, Abstand, Form, Bewegung
(`tokens.json`). Es fehlen: Schriftstärke (**33** Werte im CSS), Schatten (**283**), Radius, Zeilenhöhe, Laufweite.
Neu: `--eh-weight-regular|medium|semibold|bold` (400/500/600/700), `--eh-shadow-none|panel|card` (3 Stück),
`--eh-radius-control|panel|pill|cut`, `--eh-leading-tight|normal|loose`, `--eh-track-normal|wide`.

**1.4 Den Wortschatz festnageln.** `scripts/eh-design-generate.mjs --check` schlägt fehl, sobald `tokens.font`
mehr als **8** Einträge hat oder eine neue Gruppe auftaucht. Zweites Schloss: `packages/eh-design/` ist ein
geschützter Pfad (`design/design-policy.json`), ein gewöhnlicher PR kann kein Token hinzufügen. **B.**

### Wie viele Schrift-Tokens?

Heute 10 in `tokens.json`. Gemessen werden 179 verschiedene `font-size`-Werte gelebt.
Ziel: **8**. Die 10 werden zu 8, indem zwei Doppelte verschwinden:

- `app: 1rem` = `input: 1rem` (beide 16px) → eines davon weg.
- `appTitle: clamp(2rem,3vw,2.75rem)` ≈ `section: clamp(2rem,3.6vw,3.25rem)` → `appTitle` weg.

Bleiben: `display`, `page`, `section` (Kopf) + `body`, `label`, `meta`, `eyebrow`, `input` (Text).

**Wie Nummer sechs verhindert wird:** Ein elfter Wert entsteht nicht als Token, sondern als Rohwert in einer Datei.
Dort fängt ihn 1.2, bevor jemand über Tokens diskutiert. Kommt er trotzdem bis `tokens.json`, blockieren zwei
unabhängige Schlösser (1.4). Es gibt keinen Weg, der nur an Disziplin hängt.

### Prüfkriterium

- `node scripts/eh-design-check.mjs` wird rot bei `font-size: 13px`, `font-weight: 650`, `color: oklch(0.5 0 0)`,
  `box-shadow: 0 1px 2px #000`, `border-radius: 999px`, `text-[13px]`, `style={{fontSize:13}}`.
- `node scripts/eh-design-generate.mjs --check` wird rot beim 9. `font`-Token.
- Neue Testfälle in `scripts/eh-design-check.test.mjs` für jeden der sieben Werte oben.
- Monatszahl: verschiedene `font-size`-Werte **179 → ≤ 10**; `font-weight` **33 → 4**.

### Dateien

`packages/eh-design/src/tokens.json`, `tokens.css`, `tokens.ts`, `styles.module.css`, `html.css`,
`scripts/eh-design-generate.mjs`, `scripts/eh-design-check.mjs`, `scripts/eh-design-check.test.mjs`.

### Aufwand

Regelerweiterung 1.2: **1–2 Tage**. Token-Nachziehen 1.3 (283 Schatten auf 3 Tokens): **nicht bezifferbar** —
das ist Handarbeit mit Screenshot-Vergleich pro Deklaration, und ich habe nicht gemessen, wie viele der 283
Deklarationen nur Duplikate weniger Werte sind.

---

## 2. Die Ratsche, die wirklich beißt

### Heute

`design/design-debt.json` wird **ausschließlich** in `.github/workflows/eh-design.yml` erzwungen.
Kein npm-Script (alle 44 Scripts in `package.json` geprüft), kein Git-Hook (`.git/hooks` ist leer, keine husky),
kein Test gegen die echte Datei. `quality.yml` prüft Design nicht.

### Mechanik

**2.1 npm-Script + quality.yml. (C)** `"design:check": "node scripts/eh-design-check.mjs"` in `package.json`,
ein Schritt in `quality.yml` direkt nach *Lint*. Damit hängt die Ratsche am selben Job wie Build, a11y und E2E.

**2.2 Baseline = Ist-Zustand, exakt. (C)** Heute gilt nur „nicht schlechter als der Höchststand"
(`scripts/eh-design-check.mjs:36`). Wer fünf Verstöße aufräumt, behält den alten Spielraum und kann später fünf
neue einbauen, ohne dass CI meckert. Neu: `design/design-debt.json` muss `scan(root)` **exakt** entsprechen.
Einziger Weg, die Datei zu ändern: `npm run design:debt:sync`. Effekt: jede Bereinigung wird dauerhaft
festgeschrieben, Spielraum kommt nie zurück.

**2.3 Stufenplan mit Datum. (C)** `design/design-policy.json` bekommt:

```json
"debtCap": [
  {"until":"2026-10-31","max":3585},
  {"until":"2026-11-30","max":2600},
  {"until":"2026-12-31","max":1800},
  {"until":"2027-01-31","max":900},
  {"until":"2027-02-28","max":0}
]
```

CI vergleicht die Summe gegen die aktive Stufe. Verfehlte Stufe = roter Build. Niemand muss sich an ein Datum erinnern.

**2.4 Anfass-Regel. (C)** Ein PR, der Datei F anfasst, muss F's Schulden um ≥10 % senken (mindestens 1 Punkt).
Der Mechanismus ist vorhanden: `check()` liest schon `git diff --name-only base` (Zeile 50).
Das verteilt die Arbeit, ohne den Betrieb anzuhalten — gezahlt wird nur, wo gearbeitet wird.
2.3 setzt die Frist, 2.4 verteilt die Last. Wenn nur eines: **2.3**.

**2.5 Neue Dateien starten bereits bei null.** Nachgemessen: `check()` rechnet `baseline[path]?.[key] ?? 0`,
jeder Verstoß in einer Datei, die nicht in der Baseline steht, schlägt sofort fehl (bewiesen durch
`scripts/eh-design-check.test.mjs:24-27`). Die behauptete Lücke „neue Datei startet mit Schulden" existiert
**nicht**. Die echte Lücke ist: jemand trägt die neue Datei in `design-debt.json` ein. Die ist dreifach geschlossen —
geschützter Pfad (`design-policy.json`), „Debt baseline is immutable in ordinary PRs" (Zeile 52) und 2.2.

**2.6 Git-Hook. (C, zweiter Riegel)** `scripts/eh-design-install-hooks.mjs` schreibt `.githooks/pre-commit`
und setzt `core.hooksPath` über `postinstall`. Inhalt: `npm run design:check`. Das spart die CI-Wartezeit,
trägt aber nicht: `--no-verify` existiert. Deshalb muss 2.1 stehen.

### Prüfkriterium

- `npm run design:check` endet lokal mit Exit 1, wenn man `color:#fff` in eine Datei schreibt.
- CI rot, wenn `design-debt.json` ≠ `scan()`. Neuer Testfall, der den heutigen Fall
  `scripts/eh-design-check.test.mjs:32-34` umdreht („Aufgeräumt, aber nicht nachgezogen" = Fehler).
- Monatszahl: **3585 → 0** bis 2027-02-28.

### Dateien

`package.json`, `.github/workflows/quality.yml`, `.github/workflows/eh-design.yml`,
`scripts/eh-design-check.mjs`, `scripts/eh-design-check.test.mjs`, `scripts/eh-design-install-hooks.mjs` (neu),
`design/design-policy.json`, `design/design-debt.json`.

### Aufwand

2.1 + 2.2 + 2.3: **1 Tag**. 2.6: **0,5 Tage**, plus Laufzeitmessung über 94 Seiten und 33 CSS-Dateien —
ob der Hook unter 2 Sekunden bleibt, habe ich **nicht gemessen**.

---

## 3. Totes CSS wird vom Bau gelöscht

Zwei verschiedene Probleme, zwei verschiedene Mechaniken.

### 3A. CSS Modules (30 Dateien) — statisch entscheidbar, harter Fehler

`styles.foo` ist ein benannter Zugriff; CSS Modules erzeugen den Hash selbst. Eine Klasse in einer
`*.module.css` ohne `styles.x` / `s.x` / destrukturierten Import ist tot. Keine Baseline, sofort Fehler. **C.**

Die Ausnahmen sind messbar genau **6 Stellen**, an denen ein Klassenname nicht als Wort im Quelltext steht:

| Datei | Zeile | Konstrukt |
| --- | --- | --- |
| `src/components/visuals/CardVisual.tsx` | 33 | `styles[size]` |
| `src/components/ui-toast.tsx` | 23 | `eh-toast-${kind}` |
| `src/components/provider/workspace.tsx` | 114 | `provider-state-${tone}` |
| `src/components/invoice-view.tsx` | 7 | `status ${invoice.status}` (datengetrieben) |
| `src/components/ActionCard.tsx` | 17 | `${variant}` (`tint\|bordered\|plain`) |
| `src/components/Stepper.tsx` | 12–13 | `${state}` (`done\|active\|todo`) |

Mechanik: `design/design-dynamic-classes.json` mit Datei, Zeile und erlaubter Wertemenge.
Eine 7. Stelle anzulegen heißt, einen geschützten Pfad zu ändern. **B + C.**

### 3B. Globale CSS (4 Dateien) — statisch *korrekt, aber nicht vollständig*

Ehrliche Antwort auf die Frage „Ist das zuverlässig?": Für CSS Modules ja, bis auf die 6 Stellen.
Für globale Dateien **nein**, aus zwei belegten Gründen:

1. **Der Korpus entscheidet.** Eine naive Suche über das ganze Repository meldet „0 tot" — weil `docs/` und
   `presentation/` (49 bzw. 37 Einträge) die Namen erwähnen. Erst mit quellcode-only-Korpus kommen die
   **590 von 1055** (55,9 %) heraus. Der Prüfer muss den Korpus festschreiben: `src/**` + `packages/**`,
   nur `.ts/.tsx/.js/.jsx/.mjs` + die anderen CSS-Dateien.
2. **Regex über Rohtext erzeugt Phantomklassen.** Die Extraktion lieferte `bottom-nav-Regel` — das steht in
   einem deutschen Kommentar in `globals.css:14-16`, nicht in einem Selektor. Deshalb: CSS **parsen**.
   `postcss` liegt in `node_modules` (über `@tailwindcss/postcss`) und muss als explizite devDependency
   eingetragen werden; `lightningcss` ist ebenfalls vorhanden.

Mechanik für globale Dateien daher: **keine neue tote Klasse**. Heutige 590 Namen in
`design/design-deadcss.json` einfrieren, die Liste darf nur schrumpfen. Eine neue Klasse ohne Referenz ist ein
Baufehler; eine alte löschen ist jederzeit erlaubt. Damit liefert die Prüfung **keine falschen Treffer** bei
Altbestand und beißt trotzdem sofort bei Neuzugang. **C.**

### 3C. Laufzeitmessung monatlich — die einzige Wahrheit

Statik sieht nicht, dass eine Klasse im Quelltext steht, der Zweig aber nie rendert. Das misst nur der Browser:
`document.styleSheets` durchgehen, pro Regel `document.querySelector(sel)` — genau das Muster aus
`tmp-deadcss.mjs:34-48`. Heute: **5697 Regeln geladen, 1248 aktiv, 78 % tot**. Monatlich über die 40 App-Routen,
Ergebnis in `design/design-report.json`, Ratsche: Tot-Quote darf den Vormonat nicht übersteigen.

### Prüfkriterium

- `.fooNeu{display:grid}` in einer `*.module.css` ohne `styles.fooNeu` → Baufehler.
- Neue unreferenzierte Klasse in `design-system.css` → Baufehler. `pdx-*` (65), `wz-*` (58) löschen → grün.
- Monatszahl: Tot-Quote **78 % → < 30 %**, Alarm ab 55 %.

### Dateien

`scripts/eh-design-deadcss.mjs` (neu), `design/design-deadcss.json` (neu),
`design/design-dynamic-classes.json` (neu), `package.json` (postcss devDep), `.github/workflows/quality.yml`,
`.github/workflows/eh-design-report.yml` (neu).

### Aufwand

Prüfer: **2 Tage**. Das Löschen der 590 toten Klassen: **nicht bezifferbar** — es hängt daran, wie viele der
40 Seiten gleichzeitig neu gebaut werden (siehe Reihenfolge).

---

## 4. Schichtung

### Heute

`src/app/layout.tsx:3-6` importiert in dieser Reihenfolge: `globals.css` → `packages/eh-design/src/tokens.css`
→ `design-system.css` → `marketing/tokens.css`. `globals.css:1` ist `@import 'tailwindcss'`, und Tailwind v4
erzeugt als erste Zeile `@layer theme, base, components, utilities;` (nachgewiesen in
`node_modules/tailwindcss/index.css:1`). Alles danach ist **ungeschichtet** und steht damit über allen vier
Tailwind-Layern. Ergebnis: `globals.css` gewinnt gegen alles, unabhängig von der Importreihenfolge;
`design-system.css` gewinnt gegen `globals.css` nur, weil es später importiert wird. Die zwei kleinen
`@layer base`-Blöcke (`globals.css:548` und `:843`) sind der Beleg, dass das Problem bekannt ist und punktuell
schon repariert wurde — sie liegen unter allem Ungeschichteten.

### Mechanik

**4.1 Eine `@layer`-Zeile ganz oben in `globals.css`, vor dem `@import`.** Das ist zulässig: die Cascade-Spezifikation
erlaubt `@layer`-Anweisungen vor `@import`.

```css
@layer eh-tokens, eh-reset, eh-base, eh-legacy, theme, base, components, utilities, eh-blocks, eh-pages;
@import 'tailwindcss';
@import 'tw-animate-css';
```

Die Schichtreihenfolge wird durch das erste Vorkommen festgelegt. Tailwinds eigene
`@layer theme, base, components, utilities;` kann daran nichts mehr ändern. Damit steht die gesamte
Kaskadenreihenfolge der Anwendung in **einer Zeile in einer Datei** — unabhängig davon, wer später was
in welcher Reihenfolge importiert. **B.**

**4.2 Was in welche Schicht gehört:**

| Schicht | Inhalt |
| --- | --- |
| `eh-tokens` | `packages/eh-design/src/tokens.css`, `components/marketing/tokens.css` |
| `eh-reset` | `box-sizing`, Margin-Reset aus `globals.css` |
| `eh-base` | Element-Defaults: `a`, `button`, `input`, `h1`–`h6` |
| `eh-legacy` | **der komplette heutige Inhalt von `globals.css` und `design-system.css`** |
| `theme`, `base`, `components`, `utilities` | Tailwind, an dieser Stelle fixiert |
| `eh-blocks` | `packages/eh-design/src/styles.module.css`, `html.css`, alle Komponenten-Module |
| `eh-pages` | Seiten-Module `src/app/**/*.module.css` |

Der entscheidende Zug ist `eh-legacy`: die heutigen 828 + 1011 Schuldenpunkte landen in der **niedrigsten** neuen
Schicht. Jeder neue Baustein gewinnt gegen sie, ohne dass eine alte Zeile angefasst wird. Kein Big-Bang-Refaktor.

**4.3 CSS Modules nicht über Schichten priorisieren, sondern über Eindeutigkeit.** Ein per JS importiertes
`*.module.css` kann man keiner Schicht zuweisen. Deshalb: Schichten für die 4 globalen Dateien,
**Selektor-Eindeutigkeit** für alles andere (§5). Beides zusammen ergibt eine deterministische Reihenfolge.

**4.4 Ungeschichtet = Fehler.** Neue Regel: jede Regel in einer globalen CSS-Datei muss in einer `eh-*`-Schicht
liegen. Ausnahmen: `@font-face`, `@keyframes`, `@media`-Hüllen. **C.**

### Prüfkriterium

- **Sonde:** `.eh-probe{color:rgb(1,2,3)}` in `globals.css`, `.eh-probe{color:rgb(4,5,6)}` in `styles.module.css`
  einfügen. Das gerenderte Element muss `rgb(4,5,6)` sein — unabhängig von der Importreihenfolge in `layout.tsx`.
  Als Playwright-Test festschreiben (`playwright-core` 1.62.1 ist da, `scripts/eh-design-browser.mjs` als Vorlage).
- Statisch: `npm run design:check` wird rot bei jeder Regel außerhalb einer Schicht in den 4 globalen Dateien.
- `npm run test:visual` und `npm run test:visual:apps` müssen nach dem Umschichten grün bleiben — die Baselines
  sind das Sicherheitsnetz, weil eine Schichtänderung jede Überschreibung verschieben kann.

### Dateien

`src/app/globals.css`, `src/app/design-system.css`, `src/components/marketing/tokens.css`,
`src/components/auth-v2/auth-shell.css`, `src/app/layout.tsx`, `scripts/eh-design-check.mjs`,
`scripts/eh-design-layers.test.mjs` (neu).

### Aufwand

Umschichten: **1 Tag**. Sichtprüfung über die visuellen Baselines: **nicht bezifferbar** — ich habe nicht gemessen,
wie viele der Baseline-Bilder eine Schichtänderung berührt.

---

## 5. Ein Mechanismus pro Begriff

### Heute

`src/components/bottom-nav.tsx:12` und `src/components/shell.tsx:28` setzen **beides**:
`className={on?'active':''}` **und** `aria-current={on?'page':undefined}`.
`src/components/owner-menu.tsx:83,105,126` setzt **nur** `aria-current`. Ein Begriff, zwei Mechaniken.

### Mechanik

**5.1 Zustand reist in ARIA, nicht in einer Klasse.** `aria-current="page"` ist die einzige Art, den aktiven
Navigationpunkt zu markieren. `className` trägt Identität, nicht Zustand. **B.**

**5.2 Das CSS folgt:** `.eh-nav a[aria-current="page"]` in `eh-blocks`. `.bottom-nav a.active` und jede andere
`.active`-Regel fliegt raus. Wer danach `className="active"` schreibt, erzeugt eine Klasse ohne Wirkung —
eine tote Klasse, die §3A/§3B fängt. Zwei Mechaniken, dasselbe Ergebnis.

**5.3 Sperre:** neue Regel `state-class` — `active`, `selected`, `is-active`, `current`, `open` sind als
Klassennamen im Markup verboten, Ausnahmen in `design/design-state-allowlist.json`. **C.**

**5.4 `!important`: eigene Regel, ja.** **112** Vorkommen (67 in `design-system.css`, 16 in
`provider-workspace.module.css`, 11 in `auth-convergence.module.css`). Regel `no-important`: Baseline bei 112
eingefroren, darf nur sinken; neue Dateien: 0. Die Begründung ist mechanisch: sobald §4 steht, ist jedes
`!important` eine Überschreibung in der falschen Schicht — der richtige Fix ist die Schichtzeile, nicht das Ausrufezeichen. **C.**

**5.5 Doppelte Selektoren: eigene Regel, ja.** Gemessen **36** Top-Level-Selektoren, die in ≥2 der vier
CSS-Dateien stehen (`.btn`, `.btn:hover`, `.btn.primary`, `.auth-page`, `.bottom-nav`, … alle in
`globals.css` **und** `design-system.css`). Regel `unique-selector`: ein Selektor wird in genau einer Datei
definiert. Das ist zugleich die Mechanik, die Priorität für CSS Modules ohne Schichten deterministisch macht (§4.3).
Baseline bei 36 eingefroren, nur sinkend, neue Duplikate = Fehler. **C.**

Braucht jeder der drei Punkte eine eigene Regel? Ja — weil jeder eine eigene Zahl im Monatsbericht wird (§6).
Was man nicht zählt, kann man nicht deckeln.

### Prüfkriterium

- `npm run design:check` gibt `!important`-Anzahl, Duplikat-Anzahl und `active`-Klassen-Anzahl aus; jede muss
  ≤ Vormonat sein.
- Test: Fixture mit `[aria-current]`-Styling ist grün; dasselbe Fixture mit `.active` ist rot.
- Null `!important` in jeder Datei, die nach dem 2026-09-16 entsteht.
- Monatszahlen: `!important` **112 → 0**, Duplikate **36 → 0**.

### Dateien

`src/components/bottom-nav.tsx`, `src/components/shell.tsx`, `src/components/owner-menu.tsx`,
`src/app/globals.css`, `src/app/design-system.css`, `scripts/eh-design-check.mjs`,
`design/design-state-allowlist.json` (neu).

### Aufwand

Drei Regeln: **1 Tag**. Navigation umschreiben: **0,5 Tage**.

---

## 6. Das Monatsbudget

Neuer Workflow `.github/workflows/eh-design-report.yml`, `schedule: cron "0 6 1 * *"`,
führt `node scripts/eh-design-report.mjs` aus, schreibt `design/design-report.json` und stellt einen PR
(genau wie die visuellen Baselines in `quality.yml`). Jede Kennzahl ist eine Ratsche: aktueller Wert ≤ gespeicherter
Wert bzw. ≤ Stufe des Monats.

| Kennzahl | Quelle | heute | Ziel | Alarm |
| --- | --- | --- | --- | --- |
| Tot-Quote CSS (geladen vs. treffend) | Playwright, 40 App-Routen (Muster `tmp-deadcss.mjs:34-48`) | **78 %** | < 30 % | > 55 % |
| Schuldenpunkte gesamt | `design/design-debt.json` | **3585** | 0 bis 2027-02-28 | > Monatsstufe |
| Dateien mit Schulden | dto. | **67** | 0 | > Vormonat |
| Verschiedene `font-size`-Werte | postcss über `src`+`packages` | **179** | ≤ 10 | > 20 |
| Verschiedene `font-weight`-Werte | dto. | **33** | 4 | > 6 |
| `!important` | dto. | **112** | 0 | > 0 in neuen Dateien |
| Selektoren in ≥2 Dateien | dto. | **36** | 0 | > Vormonat |
| Klassennamen ohne Referenz | §3B | **590** | 0 | > Vormonat |
| Regeln außerhalb einer Schicht | §4 | nicht gemessen | 0 | > 0 in den 4 globalen Dateien |
| Neue globale CSS-Dateien | `git log --diff-filter=A -- '*.css'` (ohne `*.module.css`) | – | 0 | ≥ 1 |
| CSS-Bytes pro Route (First View) | CDP/Playwright | **nicht gemessen** | – | – |

Zwei Felder sind absichtlich leer: „Regeln außerhalb einer Schicht" und „CSS-Bytes pro Route" habe ich nicht
gemessen. Der erste Reportlauf liefert die Basiswerte; Schwellwerte werden danach gesetzt, nicht geraten.

**Veröffentlichen** ist Teil der Maßnahme: Job-Summary **und** PR mit `design/design-report.json`. Ein Wert, den
man erst im CI-Log findet, wird nicht gelesen. Bei Rückschritt öffnet der Job automatisch ein Issue (`gh issue create`).

### Prüfkriterium

- Der Cron-Job läuft am 1. des Monats. Der Report zeigt 11 Zahlen. Jede ist ≤ Vormonat.
- Rückschritt → automatisches Issue, nicht stilles Wachstum.

### Dateien

`.github/workflows/eh-design-report.yml` (neu), `scripts/eh-design-report.mjs` (neu),
`design/design-report.json` (neu).

### Aufwand

**1 Tag**.

---

## Reihenfolge

Gefragt war: was muss **vor** dem Umbau der 41 Seiten stehen. Antwort: alles, was **verhindert**.
Was **aufräumt**, kommt danach — Aufräumen an einer Datei, die nächste Woche neu gebaut wird, ist verschwendete Arbeit.

### Vor dem Seitenumbau (blockierend)

1. **§4 Schichtung.** 1 Tag. Grund: es ist die einzige Maßnahme, die vor 41 neuen Seiten fast kostenlos ist und
   danach teuer. Jede Seite, die vor der Schichtzeile entsteht, ist eine weitere Seite, deren Überschreibungen
   von der heutigen Zufallsreihenfolge abhängen.
2. **§1 Wortschatz, Regel 1.2 (Whitelist).** 1–2 Tage. Grund: die 41 Seiten sind der Ort, an dem die nächsten
   179 Schriftgrößen entstehen. Sind Rohwerte beim Start noch legal, vervielfacht der Umbau den Schaden planmäßig.
   Es muss vorher nur die **Regel** stehen, nicht die Token-Migration der alten Dateien.
3. **§2.1 + 2.2 + 2.3 (npm-Script, Baseline = Ist, Stufenplan).** 1 Tag. Grund: die Ratsche muss geschlossen sein,
   bevor 41 Seiten in die Baseline wandern. Neue Dateien sind heute schon schuldenfrei durch Konstruktion, aber nur,
   solange sie niemand in `design-debt.json` einträgt — mit 41 neuen Seiten ist der Druck dazu maximal.
4. **§3B gefrorene Tot-Liste.** 1 Tag. Grund: heute billig (590 Namen in eine Datei), später unmöglich, weil man
   neuen toten Code nicht mehr von altem unterscheiden kann.

### Parallel, nicht blockierend

5. **§5 (state-class, no-important, unique-selector).** Der Navigationsfix gehört in den Umbau — die Seiten bekommen
   ohnehin eine neue Navigation. Die drei Zähler können einen Monat später starten.
6. **§6 Monatsbudget.** Der erste Lauf muss **vor** dem Umbau passieren, damit es eine Vorher-Zahl gibt.
   Die 78 % existieren, zehn andere Zahlen nicht.

### Nach dem Seitenumbau

7. **§3A + Löschen der 590.** Alte Klassen löschen, während Seiten neu geschrieben werden, heißt doppelte Arbeit
   und Merge-Konflikte.
8. **§1.3 Token-Nachziehen (Schriftstärke, Schatten, Radius).** 283 Schatten auf 3 Tokens abbilden ist visuelle
   Arbeit mit Screenshot-Vergleich — an den neuen Seiten, nicht an den alten.
9. **§2.6 Git-Hook.** Sinnvoll, sobald `design:check` schnell genug ist. Für die Sicherheit nicht nötig, CI trägt sie.

---

## Was wir uns nicht leisten sollten

Drei naheliegende Maßnahmen, die viel Arbeit machen und nichts verhindern.

**1. Stylelint mit einer großen Regelbatterie einführen.**
Kosten: neue Toolchain, eigene Konfiguration, ein zweiter Prüfer neben `scripts/eh-design-check.mjs`.
Nutzen: null Zusatz. Eine Whitelist-Regel in 30 Zeilen prüft exakt dasselbe. Es entsteht ein zweiter Ort,
an dem die Wahrheit steht — und zwei Orte heißt: einer veraltet.

**2. Ein Design-Review durch eine Person oder einen Agenten vor jedem Merge.**
Das ist Disziplin. Unter Zeitdruck wird es zur Formalität, genau wie 3585 Verstöße zur Formalität wurden.
Es ist nicht messbar, nicht ratschenfähig und liefert keine Zahl für den Monatsbericht. Ein Review darf
**zusätzlich** passieren. Es darf nie die einzige Sperre sein.

**3. Alles auf Tailwind-Utility-Klassen umstellen und die CSS-Dateien abschaffen.**
Klingt nach „keine Rohwerte mehr", ist das Gegenteil: `text-[13px]`, `bg-[#fff]`,
`shadow-[0_1px_2px_rgba(0,0,0,.05)]` sind Rohwerte, nur kürzer geschrieben. Die Schuldenliste zeigt es heute schon:
84 × `text-xs`, 15 × `text-[..px]`, 69 × `text-slate*`, 11 × `bg-stone*`. Das Problem verschwindet nicht, es wandert:
statt 78 % totem CSS gäbe es ungenutzte Klassen im Markup — und die sind schwerer statisch zu prüfen, weil der
Klassenname nicht mehr in einer CSS-Datei steht, sondern über 94 TSX-Dateien verteilt.

**Nachtrag, falls er gebraucht wird: ein „CSS-Cleanup"-Sprint ohne vorherige Sperre.**
Der dreht die 78 % auf 30 % — und in sechs Monaten stehen sie wieder bei 60 %, weil nichts beim Bau blockiert.
Erst die Sperre, dann der Sprint. Nie umgekehrt.

---

## Kurzfassung der Aufwände

| Maßnahme | Aufwand | bezifferbar |
| --- | --- | --- |
| §1.2 Whitelist-Regel | 1–2 Tage | ja |
| §1.3 Token-Nachziehen (Schatten, Stärke, Radius) | – | **nein** (283 Schatten-Deklarationen, Handarbeit) |
| §2.1–2.3 npm-Script, Baseline=Ist, Stufenplan | 1 Tag | ja |
| §2.6 Git-Hook | 0,5 Tage + Laufzeitmessung | teilweise (Laufzeit **nicht gemessen**) |
| §3 Prüfer totes CSS | 2 Tage | ja |
| §3 Löschen der 590 | – | **nein** (hängt an dem Seitenumbau) |
| §4 Umschichten | 1 Tag | ja |
| §4 Sichtprüfung Baselines | – | **nein** (Zahl der betroffenen Bilder **nicht gemessen**) |
| §5 drei Regeln + Navigation | 1,5 Tage | ja |
| §6 Monatsbericht | 1 Tag | ja |
