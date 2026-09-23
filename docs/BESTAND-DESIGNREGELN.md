# Bestandsaufnahme · Design-Regeln und ihre Prüfer

**Projekt:** einfachhausen · Arbeitskopie `/Users/jeremyschulze/dev/einfachhausen-landing-page/einfach-hausen`
**Stand:** 16.09.2026 · Branch `fix/fehlergrenzen-melden-und-e2e-wettlauf` · Remote `https://github.com/einfachhausen-de/einfach-hausen.git`
**Art der Arbeit:** reine Bestandsaufnahme. Es wurde keine Datei verändert, kein Siegel-Skript ausgeführt, kein Commit erzeugt.

## Methodik und Belegbarkeit

- Gesucht wurde ausschließlich mit dem Grep-Werkzeug; Zählungen wurden anschließend mit rein lesenden Node-Ausdrücken verifiziert (kein Schreibzugriff, kein `npm run`, kein Siegel-Skript).
- `scripts/eh-design-seal.mjs` wurde **nicht** ausgeführt. Die Prüfsummen in `design/design-lock.json` wurden stattdessen mit `node:crypto` nachgerechnet.
- Alles, was nicht belegt werden konnte, ist im Text als **„nicht belegt“** gekennzeichnet. Nichts ist geschätzt.

---

# Teil 1 · Die Werkzeugkette, Datei für Datei

## 1.1 `scripts/eh-design-check.mjs` — das eigentliche Gesetz (69 Zeilen)

Das ist der einzige inhaltliche Designprüfer. Er exportiert `hash`, `violations`, `scan` und `check` und läuft als CLI mit optionalem `--base <sha>`. `violations()` wendet sechs reguläre Ausdrücke zeichenweise auf den Quelltext an (Zeilen 9–17) — es wird **kein CSS geparst, kein AST gebaut, kein Tailwind-Klassenname aufgelöst**. `check()` führt vier voneinander unabhängige Prüfungen durch: Schuldenvergleich gegen `design-debt.json` (Zeile 36), Prüfsummenvergleich gegen `design-lock.json` (Zeilen 37–42), Schutzpfad-Vergleich gegen die Basis (Zeilen 43–53) und eine Neu-Datei-Prüfung (Zeilen 54–61).

Bewusst geprüft wird nur: wörtliche Farben, acht fremde Schriftfamilien, zu kleine Schrift in px, JSX-Inline-Styles, vier dekorative Effekte und Tailwind-Farbklassen. Bewusst **nicht** geprüft werden: Zeilenhöhen, Schriftstärken, Radius-Werte, Tippziel-Maße, Kontrast, Abstände, semantische Struktur, Bundle-Größe, tote Klassen, und alles außerhalb von `src/`. Das Skript ist absichtlich klein gehalten (69 Zeilen), damit es als vertrauenswürdige Kopie aus der Basis geladen werden kann.

## 1.2 `scripts/eh-design-generate.mjs` — Tokengenerator (25 Zeilen)

Liest `packages/eh-design/src/tokens.json` und erzeugt daraus vier Artefakte: `tokens.css` (`:root`-Variablen `--eh-<gruppe>-<name>`), `tokens.ts` (`EHTokens`), `html.css` (Kopie von `styles.module.css` mit auf `.eh-` präfigierten Klassennamen) und `html-style.mjs` (eingebettete Inter-woff2 als Base64 plus Logo). Mit `--check` vergleicht es statt zu schreiben und wirft `Token drift: <datei>`. Es prüft also **nur** Abweichung zwischen `tokens.json` und den vier Generaten, nicht die inhaltliche Richtigkeit der Tokens und nicht deren Verwendung.

## 1.3 `scripts/eh-design-sync.mjs` — Lieferung an Fremd-Repositories (33 Zeilen)

Kopiert `packages/eh-design/` (src + assets + package.json) in ein anderes Repository nach `vendor/eh-design/` und schreibt dorthin eine Prüfsummenliste `design/eh-design-vendor.json`. Es verweigert das Ziel im eigenen Repository, verlangt einen sauberen Commit-Status der Quelle, lehnt undeclared Dateien ab und bricht bei lokalen Änderungen im Ziel ab (`Local vendor edit`). Mit `--check` prüft es nur. Es prüft keine Designregeln, nur Transport-Integrität.

## 1.4 `scripts/eh-design-seal.mjs` — das Siegel (13 Zeilen, **nicht ausgeführt**)

Erzeugt `design/design-lock.json`: es expandiert die `protected`-Pfade aus `design/design-policy.json` zu einer Dateiliste und schreibt zu jeder Datei den SHA-256. Mit `--initial-debt` schreibt es zusätzlich `design/design-debt.json` neu aus `scan()` — also eine vollständige Neubasierung. Der Dateikopf sagt ausdrücklich: *„Brand-authority release tool. Ordinary agents MUST NOT run this to bypass a failed guard.“* Es prüft nichts; es **setzt** den Maßstab.

## 1.5 `scripts/eh-design-browser.mjs` — Browserabnahme (45 Zeilen)

Startet Chromium (Pfad hart codiert `/home/ubuntu/.local/share/eh-brand-browser/chromium-1234/...`, überschreibbar über `EH_CHROMIUM_PATH`), öffnet `http://127.0.0.1:4190/design-system`, klickt neun Ansichten in drei Viewportbreiten (390/736/1440) und prüft je Ansicht: horizontalen Overflow, Text unter 12 px, Schriftfamilie, axe-core-Verstöße (WCAG 2.0/2.1 A+AA), Tastaturbedienung der Tabs, Suchfilter, Dialog-Fokus und native Formularvalidierung. Es schreibt Screenshots und `docs/brand/evidence/system/browser.json`. **Es ist in keinem Workflow eingehängt** (belegt: kein Treffer in `.github/`), läuft also nur von Hand und gegen einen lokal gestarteten Server auf Port 4190.

## 1.6 `scripts/design-audit.mjs` — visueller Grobaudit (124 Zeilen)

Älteres, unabhängiges Werkzeug („SIN Frontend Design“). Fährt elf Routen gegen `http://localhost:3110` an, scrollt Reveals, und prüft heuristics: leere Grid-Zellen, Abschnitts-Monotonie, Textwände, Textdichte und einen h1/h2-Kontrast-Schnelltest. Es schreibt Kacheln, ein Poster und `/tmp/design-audit/report.json`; Exit-Code 1 bei kritischen Funden. Es gehört **nicht** zum Siegel-System: es kennt `design-policy.json` nicht, läuft in keinem Workflow und prüft eine hart codierte Routenliste.

## 1.7 `design/design-policy.json` — die Schutzliste (33 Zeilen)

Enthält `version`, `protected` (**22 Einträge**) und `ownedStyleFiles` (**4 Einträge**). `protected` ist die Grundlage für zwei verschiedene Dinge: für die Siegel-Dateiliste (`eh-design-seal.mjs`) und für die PR-Sperre (`eh-design-check.mjs` Zeile 51). `ownedStyleFiles` ist die Erlaubnisliste für **neue** CSS-Dateien. Die Datei selbst ist geschützt und versiegelt.

## 1.8 `design/design-debt.json` — die Schuldenliste (59.243 Bytes)

Ein flaches Objekt: `{"<pfad>": {"<regel>\u0000"<fund>": <anzahl>, ...}, ...}`. Es enthält **3585 Einträge in 67 Dateien** (Summe aller Zähler). Der Schlüssel ist nicht die Regel allein, sondern Regel **plus Fundtext** — `#fff` und `#ffffff` sind zwei getrennte Kontingente. Es ist geschützt, versiegelt und in PRs unveränderlich.

## 1.9 `design/design-lock.json` — das Siegel (5.898 Bytes)

`version`, ein `authority`-Satz („Jerry explicitly accepted Atelier 02 … 2026-09-06“) und `files`: **52 Pfade mit SHA-256**. Nachgerechnet am 16.09.2026: **52 von 52 stimmen überein**, 0 Abweichungen, 0 fehlende Dateien. Das Siegel ist also aktuell — zuletzt neu gesetzt am 15.09.2026 23:12, eine Minute nach der letzten `DESIGN.md`-Änderung (23:11).

## 1.10 Tokens und Stilquellen

| Datei | Größe | Rolle |
| --- | --- | --- |
| `packages/eh-design/src/tokens.json` | 1.254 B | Kanonische Werte: `color` (12), `font` (11), `space` (7), `shape` (3), `motion` (2), `slide` (6). **Enthält keine Schriftstärken, keine Zeilenhöhen, keine Tippziel-Maße.** |
| `packages/eh-design/src/tokens.css` | 1.268 B | Generiert. 39 `--eh-*` Variablen in `:root`. |
| `packages/eh-design/src/tokens.ts` | 1.332 B | Generiert. `EHTokens` als `as const`. |
| `packages/eh-design/src/styles.module.css` | 119.739 B | Einzige neue Komponentenstilquelle. Beginnt mit `.scope`, `line-height: 1.65`. |
| `packages/eh-design/src/html.css` | 123.738 B | Generiert. Identisch zu `styles.module.css`, aber alle Klassen auf `.eh-` präfigiert. |

## 1.11 `.github/workflows/eh-design.yml` — der einzige Wächter (43 Zeilen)

Vier Schritte: vertrauenswürdigen Prüfer aus der Basis holen, Designvertrag prüfen, generierte Tokens prüfen, Guard-Tests ausführen. Details in Teil 3.

## 1.12 `DESIGN.md` — das geschriebene Gesetz (26.571 B, 255 Zeilen, geändert 15.09.2026 23:11)

Markenquelle, Komponentenregister, Größentabellen und sieben angehängte Freigabe-Kapitel. Selbst geschützt und versiegelt. Details in Teil 4.

## 1.13 `src/app/globals.css` und `src/app/design-system.css` — Struktur

**`globals.css`** (105.270 B, 853 Zeilen, ~621 Blöcke). Zeile 1 `@import 'tailwindcss';`, Zeile 2 `@import "tw-animate-css";`, Zeile 7 `@theme inline`, Zeile 11 ein kompaktes `:root` mit Legacy-Aliasen (`--green`, `--ink`, `--navy` …), Zeile 13 ein `@layer base`-Block für `a`, danach **621 überwiegend ungeschichtete Blöcke**. Weitere `@layer base` nur in Zeile 548 („Legacy anchor color“) und Zeile 843. Das ist ein gewachsenes Legacy-Stylesheet, kein System.

**`design-system.css`** (155.387 B, 1.185 Zeilen, ~660 Blöcke). Beginnt mit `:root` (Zeile 3), dann `html`/`body` (17–18), dann eine Abfolge von Marketing- und App-Klassen (`.btn`, `.hero-v3`, `.marketing-v3-*`, `.app-shell-v3 …`). **Enthält keine einzige `@layer`-Anweisung** (belegt: Grep ohne Treffer).

**Kaskadenfolge** (`src/app/layout.tsx` Zeilen 3–6): `globals.css` → `packages/eh-design/src/tokens.css` → `design-system.css` → `components/marketing/tokens.css`. Da `globals.css` nur drei kleine `@layer base`-Blöcke besitzt und `design-system.css` gar keine, liegt der überwältigende Teil beider Dateien **ungeschichtet** und gewinnt damit gegen jede geschichtete Regel (insbesondere gegen alle von Tailwind v4 über Zeile 1 eingebrachten Utility-Schichten) — unabhängig von der Importreihenfolge.

---

# Teil 2 · Welche Regeln `eh-design-check.mjs` wirklich prüft

Alle sechs Regeln stammen aus `scripts/eh-design-check.mjs` Zeilen 10–16 und laufen über `walk(root, "src")` — also **ausschließlich über `src/`** (Zeile 20–23; Dateiendungen `.css`, `.ts`, `.tsx`, `.js`, `.jsx`).

## 2.1 Regel `literal-color`

- **Auslöser:** `/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\([^)]*\)/g`
- **Betrifft:** jede Datei unter `src/`, auch Kommentare und Zeichenketten.
- **Im Bestand:** 2657 geduldete Funde. Spitzenreiter `src/app/design-system.css` mit `#fff` ×83, `src/app/globals.css` mit `#fff` ×70 und `#105258` ×26, `src/components/icons.tsx` mit `#105258` ×111.
- **Legale Umgehungen:**
  1. **Moderne Farbfunktionen.** `oklch()` und `color-mix()` enthalten kein `#`, kein `rgb(`, kein `hsl(` → unsichtbar. **Belegt: 62 × `oklch(` allein in `src/app/globals.css`, 18 × `color-mix(` in sieben Dateien** (`auth-shell.css` 10, `design-system.css` 2, `auth-convergence.module.css` 2, `homeowner.module.css` 1, `mkt.module.css` 1, `security-section.module.css` 1, `ui/button.tsx` 1). Zusammen **80 Literalfarben, die die Regel nicht sieht.**
  2. **Benannte Farben.** `white`, `black`, `transparent`, `currentColor` → kein Treffer. **Belegt: 95 Werte `white`/`black` in 5 Dateien**, plus Tailwind `bg-white`/`text-white`/`border-white`/`ring-white`/`fill-white`/`stroke-white` **23 × in 2 Dateien**.
  3. **Tailwind-Arbitrary mit `var()`.** `bg-[var(--eh-ink)]` enthält weder `#` noch `rgb(` → unsichtbar.
  4. **Neunstellige Hexwerte** (`#123456789`) → `{3,8}` plus `\b` findet nichts.

## 2.2 Regel `foreign-font`

- **Auslöser:** `/\b(?:Manrope|Poppins|Geist|Roboto|Montserrat|Playfair|DM Sans)\b/g`
- **Betrifft:** jede Datei unter `src/`.
- **Im Bestand:** **0 geduldete Funde.** Die Regel hat im gesamten Projekt **keine einzige Wirkung**.
- **Legale Umgehungen:** jede Schriftfamilie, die nicht in dieser Achterliste steht. **Belegt:**
  - `font-family:"Snell Roundhand","Brush Script MT",cursive` — **4 ×** (`design-system.css` 462, 542, 651; `globals.css` 436) und `font-family:"Snell Roundhand", cursive` (`globals.css` 654). Eine zweite Schreibschrift, die `DESIGN.md` Zeile 19 ausdrücklich ausschließt („Der handschriftliche Teil des unveränderten Original-Logos bleibt die einzige Schreibschrift“) — von der Regel nicht erfasst.
  - `font-family:Helvetica,Arial,sans-serif` — **3 ×** in `src/lib/mailer.ts` (64, 74) und `src/lib/notifications.ts` (42).
  - `font-family:-apple-system,"SF Pro Text","Avenir Next",Helvetica,Arial,sans-serif` — `globals.css` Zeile 545.
  - Insgesamt **11 verschiedene `font-family`-Werte** im Bestand.

## 2.3 Regel `small-type`

- **Auslöser:** drei Alternativen —
  `/font-size\s*:\s*(?:[0-9]|1[0-2])(?:\.\d+)?px\b/` und `/fontSize\s*:\s*(?:[0-9]|1[0-2])\b/` und `/text-(?:xs|\[(?:[0-9]|1[0-2])px\])/g`
- **Betrifft:** jede Datei unter `src/`.
- **Im Bestand:** 682 geduldete Funde. Größte Posten: `font-size:9px` ×60 und `font-size:8px` ×56 in `design-system.css`, `font-size:10px` ×28 und `font-size:9px` ×28 in `globals.css`, `text-xs` ×34 in `src/app/admin/crm/page.tsx`.
- **Legale Umgehungen:**
  1. **Jede Einheit außer `px`.** Die CSS-Alternative endet auf `px\b`. `font-size:0.6875rem` (= 11 px), `0.7em`, `75 %`, `9pt` → kein Treffer. **Belegt: von 1319 `font-size`-Deklarationen in `src/` liegen 396 unter 12 px Äquivalent** — die Regel sieht davon nur den px-Anteil.
  2. **Groß-/Kleinschreibung in der Einheit.** `font-size:9PX` → `px\b` ist case-sensitive → kein Treffer.
  3. **`fontSize` als Zeichenkette.** Die JS-Alternative erwartet nach `:` eine Ziffer; `style={{fontSize:"11px"}}` beginnt mit einem Anführungszeichen → kein Treffer (nur `unowned-style` greift, siehe 2.4).
  4. **Tailwind-Arbitrary in rem.** Nur `text-[<0-12>px]` zählt; `text-[0.69rem]` → kein Treffer.
  5. **`clamp()`/`calc()`/`min()`** → kein Treffer, auch wenn das Ergebnis 8 px ist.
- **Nebenbefund:** **70 verschiedene numerische `font-size`-Literale** in `src/` (häufigste: `13px` ×146, `12px` ×131, `14px` ×108, `11px` ×97, `9px` ×88, `10px` ×73, `8px` ×71). Die Angabe „120 verschiedene Werte“ aus der Vorarbeit ist hier **nicht belegt** — 70 ist die gemessene Zahl für numerische Literale; 120 ergibt sich vermutlich erst unter Einbezug von `clamp()`-, `var()`- und `calc()`-Ausdrücken.

## 2.4 Regel `unowned-style`

- **Auslöser:** `/\bstyle\s*=\s*\{/g`
- **Betrifft:** jede Datei unter `src/`.
- **Im Bestand:** 27 geduldete Funde. **26 × `style={` im aktuellen Quelltext** in 10 Dateien.
- **Legale Umgehungen:**
  1. **`style="…"` als Zeichenkette.** Kein `{` → kein Treffer. **Belegt: 15 Funde in 2 Dateien — `src/lib/mailer.ts` (10) und `src/lib/notifications.ts` (5)**, dort jeweils mit Inline-Farben und fremder Schrift kombiniert.
  2. `element.style.color = …` in Effekten, `css={{}}`, `sx={{}}`, `<style>`-Blöcke, `styled-jsx`, `dangerouslySetInnerHTML`.
  3. Tailwind-Arbitrary-Werte in `className` (`className="p-[13px] bg-[#fff]"`), die kein `style`-Attribut verwenden.

## 2.5 Regel `decorative-effect`

- **Auslöser:** `/(?:linear|radial|conic)-gradient\s*\(|backdrop-filter\s*:\s*blur|\b(?:shadow-(?:xl|2xl)|rounded-full|backdrop-blur|bg-gradient-)\b/g`
- **Betrifft:** jede Datei unter `src/`.
- **Im Bestand:** 123 geduldete Funde. Spitzenreiter `src/components/marketing/marketing.module.css` mit `linear-gradient(` ×29 und `radial-gradient(` ×17.
- **Legale Umgehungen — die von dir erkannte Lücke ist die Spitze des Eisbergs:**
  1. **`rounded-full` vs. `border-radius:999px`.** Die Regel matcht nur die Klasse, nie den CSS-Wert. **Belegt: 153 Pillen-Radien in 15 Dateien** (`border-radius:999px|9999px|50%`) gegenüber **nur 8 × `rounded-full` in 2 Dateien** — das Verhältnis ist 19:1. Der von dir genannte Fall ist real: **`src/app/design-system.css` Zeile 19: `.btn{border-radius:999px;box-shadow:none;min-height:42px;padding:10px 17px;font-size:13px;font-weight:650;…}`**. Weitere: `premium.module.css` 87/127/172, `mkt.module.css` 492/532/550/590/645, `home-hero.module.css` 31/127/135, `sidebar-account-menu.module.css` 5.
  2. **`box-shadow` als CSS-Eigenschaft ist völlig ungeprüft** — nur die Tailwind-Klassen `shadow-xl`/`shadow-2xl` zählen. **Belegt: 277 × `box-shadow:` in 17 Dateien**, dazu **38 × `shadow-sm|md|lg|xs|2xs` in 8 Dateien**.
  3. **`backdrop-filter` nur, wenn unmittelbar `blur` folgt.** `backdrop-filter:saturate(180%) blur(16px)` → kein Treffer. Ebenfalls unsichtbar: `backdrop-filter:none` (**belegt: 12 Vorkommen, u. a. `design-system.css` 383, 384, 455, 634, 1155; `homeowner.module.css` 90**) — harmlos als Nullwert, beweist aber die Form der Lücke. Die Kombination `saturate(...) blur(...)` ist im Bestand **nicht belegt**.
  4. **`filter: blur()`** ist nicht erfasst (**3 Funde in 2 Dateien**).
  5. **Tailwind-Gradientstopps** `from-*`/`via-*`/`to-*` sind nicht erfasst — im Bestand **0 Funde**, also derzeit theoretisch.
  6. `mix-blend-mode`, `text-shadow` (0 Funde), `transform: skew`, dekorative `::before`-Flächen.

## 2.6 Regel `visual-utility`

- **Auslöser:** `/\b(?:bg|text|border|ring)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/g`
- **Betrifft:** jede Datei unter `src/`.
- **Im Bestand:** 96 geduldete Funde.
- **Legale Umgehungen:**
  1. **Schwarz und Weiß fehlen in der Palettenliste.** `bg-white`, `text-white`, `border-white` → kein Treffer (**23 Funde in 2 Dateien**). `bg-black`/`text-black` → 0 Funde, wären aber ebenfalls frei.
  2. **Nur vier Präfixe.** `fill-*`, `stroke-*`, `from-*`, `via-*`, `to-*`, `divide-*`, `outline-*`, `placeholder-*`, `accent-*`, `caret-*`, `decoration-*` → kein Treffer.
  3. **Zweistellige Zahl ist Pflicht.** `bg-gray-5` (einstellige Stufe) → kein Treffer.
  4. **Arbitrary mit `var()`** (`bg-[var(--x)]`) → weder hier noch bei `literal-color` ein Treffer.

## 2.7 Die strukturellen Lücken — größer als jede einzelne Regex

**A. Der Prüfradius ist `src/` und sonst nichts.** `walk(root, "src")` (Zeile 20). Nicht gescannt werden: `packages/eh-design/src/` (**29 Dateien** — also ausgerechnet die kanonische Bibliothek), `presentation/`, `design/`, `scripts/`, `docs/`. **Belegt: 26 CSS-/TSX-Dateien außerhalb `src/`, die kein einziger Designprüfer je sieht.** Eine neue CSS-Datei unter `presentation/` oder `packages/` ist völlig frei.

**B. Die Ratsche kennt keine verschwundenen Dateien.** `check()` läuft nur über `current` (Zeile 36), nie über `baseline`. Wer eine Datei löscht oder vollständig aufräumt, lässt ihr Kontingent lautlos verfallen. **Belegt: 13 der 67 Baseline-Dateien sind heute nicht mehr im Scan — 11 existieren noch, sind aber inzwischen sauber (u. a. `src/components/auth-v2/LoginForm.tsx`, 143; `LegalModal.tsx`, 58; `AuthShell.tsx`, 59), 2 sind gelöscht (`HeroPanel.tsx`, 39; `Logo.tsx`, 9).** Insgesamt sind so **390 geduldete Verstöße stillschweigend erloschen**, ohne Nachführung der Baseline. Das ist die gewünschte Richtung (Schulden sinken), zeigt aber, dass es keine Summenkontrolle gibt.

**C. Die Schutzpfad- und Neu-Datei-Prüfung läuft nur in Pull Requests.** `if(base)` (Zeile 43). `BASE_SHA` ist `github.event.pull_request.base.sha` und bei `push` leer → Zeilen 43–62 werden dann übersprungen.

**D. Die Policy wird aus dem Arbeitsbaum gelesen, nicht aus der Basis.** Zeile 33 liest `design/design-policy.json` des geprüften Standes. In PRs wird das durch die Schutzpfad-Regel abgefangen (die Datei ist selbst geschützt); bei einem direkten Push auf `main` greift nur noch die Prüfsumme.

**E. Die Neu-UI-Prüfung ist leicht zufriedenzustellen.** Zeile 59 verlangt nur, dass **irgendwo** im Quelltext `from "…design-system…"`, `from "…eh-design…"` oder `from "…components/marketing/ui…"` steht. Ein Kommentar oder ein Importpfad wie `@/components/marketing/ui-helpers` genügt. Sie gilt außerdem nur für **hinzugefügte** (nicht geänderte) `.tsx`-Dateien und nimmt `src/app/api/**` und `src/design-system/**` aus.

**F. Die Neu-CSS-Prüfung gilt nur für hinzugefügte Dateien.** Zeile 56 prüft `--diff-filter=A`. Änderungen an bestehenden CSS-Dateien sind unbegrenzt möglich — und `src/components/marketing/marketing.module.css` (359 Schulden) steht weder auf `protected` noch auf `ownedStyleFiles`.

**G. Kein lokaler Halt.** Es gibt **kein npm-Script** für `eh-design-check.mjs` (belegt: `package.json` Zeilen 5–59, 30 Scripts, kein Designprüfer), **keinen Git-Hook** (belegt: `.git/hooks/` enthält nur `*.sample`), **kein Husky**. Der Prüfer läuft ausschließlich in `eh-design.yml`.

---

# Teil 3 · `eh-design.yml` — was passiert wann, und warum Design nicht per PR geht

## 3.1 Die Auslöser

```yaml
on:
  pull_request:
  push:
    branches: [main, "design/**"]
```

Der Workflow läuft damit auf **jeden** Pull Request und zusätzlich auf direkte Pushes nach `main` und nach jedem Branch, der mit `design/` beginnt.

## 3.2 Der vertrauenswürdige Prüfer (Zeilen 20–29)

`BASE_SHA` ist `${{ github.event.pull_request.base.sha }}` — **leer bei Push-Ereignissen**. Wenn ein Basis-Commit vorliegt und dort `scripts/eh-design-check.mjs` existiert, wird **die Fassung aus der Basis** nach `$RUNNER_TEMP/eh-trusted/check.mjs` kopiert und ausgeführt; sonst die Fassung aus dem Arbeitsbaum. Ein PR kann den Prüfer also nicht durch Mitschicken eines manipulierten Prüfers aushebeln. Danach verlangt Zeile 45 einen vollen 40-Zeichen-SHA — fremder Shell-Text wird nie ausgeführt.

## 3.3 Der Prüflauf (Zeilen 30–39)

- **PR:** `node "$RUNNER_TEMP/eh-trusted/check.mjs" --base "$BASE_SHA"` → es laufen **alle vier** Prüfungen inklusive Schutzpfad-Vergleich.
- **Push:** `node "$RUNNER_TEMP/eh-trusted/check.mjs"` **ohne `--base`** → es laufen nur Schuldenvergleich und Siegelvergleich. Zeilen 43–62 entfallen vollständig.

## 3.4 Die geschützten Pfade — Bestätigung deiner Annahme

Deine Annahme ist **korrekt**. Der Mechanismus steht an zwei Stellen:

1. **`design/design-policy.json`, Schlüssel `protected`, 22 Einträge** (Zeilen 4–25):

   | # | Pfad | # | Pfad |
   | --- | --- | --- | --- |
   | 1 | `packages/eh-design/` | 12 | `DESIGN.md` |
   | 2 | `design/design-policy.json` | 13 | `src/design-system/` |
   | 3 | `design/design-debt.json` | 14 | `src/components/marketing/ui.tsx` |
   | 4 | `design/design-lock.json` | 15 | `src/components/marketing/tokens.css` |
   | 5 | `scripts/eh-design-check.mjs` | 16 | `src/components/marketing/mkt.module.css` |
   | 6 | `scripts/eh-design-check.test.mjs` | 17 | `src/components/marketing/home-hero.tsx` |
   | 7 | `scripts/eh-design-seal.mjs` | 18 | `src/components/marketing/site-shell.tsx` |
   | 8 | `scripts/eh-design-generate.mjs` | 19 | `src/app/globals.css` |
   | 9 | `scripts/eh-design-sync.mjs` | 20 | `src/app/design-system.css` |
   | 10 | `.github/workflows/eh-design.yml` | 21 | `src/app/app/homeowner.module.css` |
   | 11 | `.github/CODEOWNERS` | 22 | `src/app/pro/provider-workspace.module.css` |

   Verzeichnispfade (Endung `/`) wirken als Präfix, alles andere ist ein exakter Pfadvergleich (`eh-design-check.mjs` Zeile 51).

2. **`scripts/eh-design-check.mjs` Zeilen 49–51.** Die Liste kommt **nicht** aus dem geprüften Stand, sondern per `git show <base>:design/design-policy.json` aus der Basis. Jede gegenüber der Basis geänderte Datei, die auf diese Liste passt, erzeugt:

   ```
   Brand authority required; protected path differs from trusted base: <pfad>
   ```

   Zusätzlich Zeile 52: `Debt baseline is immutable in ordinary PRs`, wenn `design/design-debt.json` gegenüber der Basis verändert wurde.

## 3.5 Gibt es eine Ausnahme, einen Override, ein Label?

**Nein.** Belegt durch vollständige Lektüre der 43-zeiligen Workflow-Datei: es gibt keine `if:`-Bedingung, kein Label-Gating, keinen `skip`-Parameter, keine Umgebungsvariable zum Abschalten, keinen `continue-on-error`-Schritt. Zusätzlich verlangt Zeile 45 zwingend einen vollständigen SHA.

Was es gibt, ist **Review, nicht Freischaltung**: `.github/CODEOWNERS` (7 Zeilen) weist `packages/eh-design/`, `DESIGN.md`, `design/design-*.json`, `scripts/eh-design-*`, `.github/workflows/eh-design.yml`, `.github/CODEOWNERS` und `src/design-system/` dem Eigentümer `@Delqhi` zu — mit dem ausdrücklichen Zusatz: *„never treat an agent as a separate owner.“* Ob der Branch-Schutz auf dem Server diese Zuweisung tatsächlich erzwingt, ist **nicht belegt** (`gh` ist auf dieser Maschine nicht installiert, es wurde keine API-Anfrage gestellt). `DESIGN.md` Zeile 142 weist selbst darauf hin, dass verpflichtender Branch-Schutz vom GitHub-Plan abhängt.

## 3.6 Was das für den Umbau von 41 Seiten bedeutet

Die Antwort hängt vollständig davon ab, **welche** Dateien sich ändern:

| Änderung | PR möglich? | Begründung |
| --- | --- | --- |
| `src/app/<route>/page.tsx` (94 Seiten unter `src/app`) | **Ja** | Weder geschützt noch versiegelt. Es gelten nur: Schulden dürfen nicht steigen; eine **neue** `.tsx`-Datei braucht einen kanonischen Import. |
| Neue `.css`-Datei unter `src/` | **Nein** | Zeile 56: `New page styling forbidden; compose canonical components` — es sei denn, der Pfad steht in `ownedStyleFiles` (nur 4 Einträge). |
| `src/app/globals.css`, `src/app/design-system.css` | **Nein** | Geschützt (Nr. 19/20) **und** versiegelt (Prüfsummen im Lock). Ein PR wird rot, selbst wenn der Prüfsummenvergleich durch mitgeliefertes Lock bestanden würde — die Schutzpfad-Regel schlägt vorher an. |
| `packages/eh-design/**`, `DESIGN.md`, `design/*.json`, `scripts/eh-design-*` | **Nein** | Geschützt und versiegelt. |
| `.github/workflows/quality.yml` | **Ja** | Nicht geschützt, nicht versiegelt (nur `eh-design.yml` ist es). |

**Der einzige Weg für geschützte Designpfade ist ein direkter Push auf `main` oder auf einen `design/**`-Branch, nachdem der Eigentümer das Siegel erneuert hat.** Auf diesem Weg ist `BASE_SHA` leer, die Schutzpfad-Prüfung entfällt, und der mitgelieferte, neu gesiegelte `design-lock.json` besteht den Prüfsummenvergleich. Genau das ist das gewollte „Brand authority“-Modell — und genau deshalb darf `eh-design-seal.mjs` nur auf ausdrückliche Anweisung laufen.

Für 41 Seiten heißt das praktisch: **Seiteninhalte und Kompositionen sind per PR machbar; alles, was `globals.css` oder `design-system.css` anfasst, ist es nicht.** Da die angestrebte Konsolidierung (eine Schriftskalierung, einheitliche Radien, Tippziele) zwangsläufig in diese beiden Dateien eingreift, führt der Weg über einen `design/**`-Branch plus Neuversiegelung — oder über eine vorherige, vom Eigentümer genehmigte Anpassung von `design-policy.json` und Lock.

## 3.7 Die beiden restlichen Schritte

- **Zeile 41:** `node scripts/eh-design-generate.mjs --check` — Token-Drift.
- **Zeile 43:** `node --test scripts/eh-design-check.test.mjs scripts/eh-design-html.test.mjs` — sieben Guard-Tests auf temporären Fixtures (Schuldenanstieg, Neubasierung, Siegel-Umgehung, nicht verbundene neue UI) sowie zwei Escaping-Tests des HTML-Adapters.

**Wichtig:** `.github/workflows/quality.yml` (260 Zeilen, 45 Minuten, über 20 Schritte) enthält **keinen** Designprüfer. Die Designregeln und die Produktqualität laufen in zwei getrennten, unabhängigen Workflows.

---

# Teil 4 · Was in `DESIGN.md` veraltet ist

## 4.1 Kapitel, die den heutigen Zustand korrekt beschreiben

| Kapitel | Zeilen | Beleg |
| --- | --- | --- |
| **1. Autorität und Geltungsbereich** | 5–11 | Deckt sich mit `design-policy.json`, `design-lock.json` und `CODEOWNERS`. |
| **3. Eine einzige Markenquelle** (Tabelle) | 25–42 | Alle genannten Pfade existieren und sind versiegelt: `tokens.json`, `tokens.css`, `tokens.ts`, `styles.module.css`, `primitives/blocks/app/recipes.tsx`, `src/design-system/index.ts`, `src/app/design-system/`, `src/components/marketing/ui.tsx`, `src/components/marketing/tokens.css`, `design/design-lock.json`. |
| **Farben** | 44–58 | Deckungsgleich mit `tokens.json → color` (paper, petrol, deep, ink, secondary, line, sand, terra, white, error, success, focus). |
| **Schrift (selbst gehostet, keine Google-Fonts)** | 60–62 | `src/fonts/InterVariable.woff2` vorhanden; `packages/eh-design/assets/inter-variable.woff2` vorhanden und versiegelt. |
| **Schriftgrößen-Tabelle** | 64–75 | Weitgehend durch `tokens.json → font` gedeckt: body 1,0625 rem = 17 px, app 1 rem, label 0,9375 rem = 15 px, meta 0,8125 rem = 13 px, eyebrow 0,75 rem = 12 px, input 1 rem, display `clamp(3.5rem,7.8vw,7rem)` = 56–112 px, page `clamp(2rem,5vw,4.25rem)` = 32–68 px, appTitle `clamp(2rem,3vw,2.75rem)` = 32–44 px. |
| **Die H1-Untergrenze 32 px (15.09.2026)** | 77 | Jüngste Änderung am Dokument, konsistent mit `tokens.json`. |
| **7. Schutz vor unbeabsichtigter Änderung** | 133–144 | Alle vier genannten Befehle existieren; die technische Grenzbetrachtung in Zeile 144 ist zutreffend. |
| **Native HTML / Worker** | 156–158 | `html.mjs`, `html.css`, `html-style.mjs` vorhanden und versiegelt. |

## 4.2 Kapitel, die etwas beschreiben, das es so nicht mehr gibt

| Kapitel | Zeilen | Befund |
| --- | --- | --- |
| **Owner-Dashboard-Komposition 2026-09-11** | 176–196 | Die sechs als „kanonisch“ bezeichneten Bausteine `EHOwnerDashboardHeader`, `…TopGrid`, `…Status`, `…Overview`, `…Composer`, `…UtilityGrid` (Zeile 191) werden **in keiner Datei unter `src/` referenziert**. Das Kapitel beschreibt eine freigegebene Komposition, die im Produktcode nicht ankommt. |
| **Owner-Aufträge 2026-09-11** | 198–227 | Dieselben Befund für `EHOwnerOrdersHero`, `…Stats`, `…List`, `…Support` (Zeilen 218–221): **alle vier ungenutzt**. |
| **Owner-Kohärenz 2026-09-13** | 230–238 | Eingefrorene Momentaufnahme („Abnahme und Deploy ausstehend“). `EHOwnerContacts` (Zeile 236) ist ebenfalls **ungenutzt**. |
| **Ansprechpartner · Gina-Korrektur 2026-09-13** | 242–254 | `EHDirectoryEditor` und die zugehörigen `EHDirectory*`-Bausteine sind **ungenutzt** (nur `EHContactWorkspace` wird verwendet). |
| **4. Komponentenregister** | 87–101 | Acht der gelisteten Bausteine werden in `src/` **nie referenziert**: `EHDataTable`, `EHComposer`, `EHDocumentList`, `EHArticleHeader`, `EHContents`, `EHMediaStory`, `EHArticleLayout`, `EHContainer`. Insgesamt **26 der 142 exportierten `EH*`-Symbole sind in `src/` ungenutzt**. |
| **5. Seiten individuell zusammensetzen** | 103–118 | Die Tabelle nennt **8** Vorlagen. Der Code enthält **16** `EH*Page`-Exporte: zusätzlich `EHAccessPage`, `EHBillingPage`, `EHGlossaryEntryPage`, `EHJobDetailPage`, `EHMessageThreadPage`, `EHSensitiveServicePage`, `EHSettingsPage`, `EHAppointmentsPage`. Die Tabelle ist unvollständig. |
| **„49 Basisbausteine“** (Edition 2) | 163 | Tatsächlich **142 exportierte `EH*`-Symbole** in `packages/eh-design/src/*.tsx`. Die Zahl 49 ist veraltet. |
| **6. Präsentationen** | 120–131 | Die „13 Schema-Typen“ und „25 Remotion-Geschichten“ liegen im externen Repository `einfachhausen-de/einfachhausen-presentation-generator` — **hier nicht belegt**. Gleichzeitig existiert im Arbeitsverzeichnis ein eigenes `presentation/`-Verzeichnis mit eigener `package.json` und **201 eingecheckten Dateien**, das `DESIGN.md` mit keinem Wort erwähnt und das von keinem Prüfer erfasst wird. |
| **7. — Befehlszeile 138** | 138 | `node scripts/eh-design-browser.mjs` ist in **keinem** Workflow eingehängt und läuft gegen einen hart codierten Linux-Pfad und Port 4190. |

## 4.3 Verbindliche Festlegungen, die fehlen

1. **Zeilenhöhen-Skala — fehlt vollständig.** Kein Treffer für „Zeilenhöhe“ oder „line-height“ im ganzen Dokument. `styles.module.css` setzt pauschal `line-height: 1.65`. **Im Bestand: 38 verschiedene `line-height`-Werte.** `tokens.json` enthält kein einziges Zeilenhöhen-Token.
2. **Schriftstärken-Skala — fehlt vollständig.** `tokens.json` kennt keine `font`-Gewichte. **Im Bestand: 32 verschiedene `font-weight`-Werte** (300, 400, 450, 460, 500, 520, 530, 535, 540, 550, 560, 570, 580, 590, 600, 610, 620, 630, 640, 650, 660, 680, 700, 720, 740, 750, 760, 780, 790, 800, 850, 900). Die Zwischenwerte (450, 460, 520, 530, 535, 570, 610, 660, 790 …) sind historisch gewachsen und nirgends legitimiert.
3. **Schriftgrößen-Skala — nur teilweise vorhanden.** Die Tabelle in Zeilen 64–75 nennt Anwendungsfälle, aber **keine geschlossene Liste erlaubter Werte** und vor allem **keine Vorschrift, dass ausschließlich `var(--eh-font-*)` zu verwenden ist**. Ergebnis: **70 verschiedene numerische `font-size`-Literale** in `src/`. Es fehlt die Festlegung „jede Schriftgröße kommt aus `tokens.json`, alles andere ist ein Verstoß“.
4. **Tippziel-Mindestmaße — gefordert, aber nicht geprüft und nachweislich verletzt.** Zeile 83 fordert „Touch-Ziele mindestens 44×44 px, reguläre Buttons 48 px hoch“. **Beleg der Verletzung in einer versiegelten Datei: `src/app/design-system.css` Zeile 19 — `.btn{… min-height:42px …}`.** Weitere Zählung: **78 Höhen unter 44 px in `design-system.css`, 44 in `globals.css`, 24 in `marketing.module.css`, 21 in `lexikon.module.css`, 14 in `home-hero.module.css`, 12 in `mkt.module.css`, 9 in `provider-workspace.module.css`, 8 in `homeowner.module.css`.** Kein Prüfer, kein Test und kein Workflow kennt diese Regel — sie steht nur in Prosa.
5. **Karten vs. Listen — nur erzählerisch geregelt.** Zeile 20 („Keine beliebige Sammlung gleichförmiger Karten“), Zeile 193 („klare Reihenfolge statt einer Dashboard-Kachelwand“), Zeile 209 („kompakte horizontale Arbeitsliste, nicht als große Kachelwand“), Zeile 248 („Keine Emoji- oder Initialen-Kachelwand“). Es fehlt eine **Entscheidungsregel**: wann ist eine Liste zu verwenden, wann eine Karte, ab wie vielen Einträgen kippt die Darstellung, und wer entscheidet das. Für 41 Seiten ist das die am häufigsten gebrauchte und am schlechtesten definierte Regel.
6. **Layering / Kaskade — vollständig ungeregelt.** `DESIGN.md` enthält **keinen** Treffer für „`@layer`“ oder „Kaskade“; „Reihenfolge“ erscheint nur inhaltlich (Zeilen 9, 193). Die Realität widerspricht der naiven Erwartung: `src/app/layout.tsx` importiert `globals.css` → `tokens.css` → `design-system.css` → `marketing/tokens.css`, aber **`globals.css` besitzt nur drei kleine `@layer base`-Blöcke** (Zeilen 13, 548, 843) und **`design-system.css` gar keinen**. Der überwältigende Teil beider Dateien liegt damit **ungeschichtet** und gewinnt gegen jede geschichtete Regel — einschließlich aller über `@import 'tailwindcss'` (Zeile 1) eingebrachten Tailwind-Schichten — **unabhängig von der Importreihenfolge**. `DESIGN.md` schreibt das weder fest noch widerspricht es ihm; es schweigt. Genau diese Lücke macht jede Aussage der Form „die kanonische Bibliothek überschreibt das Legacy-CSS“ unbeweisbar.
7. **Es fehlt eine Festlegung, was außerhalb `src/` gilt.** `packages/eh-design/`, `presentation/` und `docs/` liegen außerhalb jedes Prüfradius; `DESIGN.md` behandelt sie teils als kanonisch, teils gar nicht.

---

# Teil 5 · Wird die Ratsche tatsächlich erzwungen?

## 5.1 Ja — aber nur an genau einer Stelle

Erzwungen wird sie in **`.github/workflows/eh-design.yml`, Schritt „Verify design contract“ (Zeilen 30–39)** über `scripts/eh-design-check.mjs` Zeile 36:

```js
if(count > (baseline[path]?.[key] ?? 0)) errors.push(… "new " + … );
```

Verglichen wird pro **Datei** und pro **Regel-und-Fund-Schlüssel**. Diese Prüfung läuft auf **jedem** Ereignis (PR und Push), weil sie nicht am `if(base)`-Block hängt.

Zusätzlich in PRs (Zeile 52): `design/design-debt.json` darf gegenüber der Basis nicht verändert werden (`Debt baseline is immutable in ordinary PRs`) — eine Neubasierung per PR ist damit ausgeschlossen.

## 5.2 Nein — an allen anderen Stellen

- **Kein npm-Script.** `package.json` (Zeilen 5–59) enthält 30 Scripts; `eh-design-check.mjs` kommt in keinem vor.
- **Kein Git-Hook.** `.git/hooks/` enthält ausschließlich `*.sample`. Kein Husky, kein `pre-commit`, kein `pre-push`.
- **Kein Test gegen das echte Schuldenregister.** `scripts/eh-design-check.test.mjs` arbeitet durchweg mit temporären Fixtures (`mkdtempSync`), nie mit dem realen `design/design-debt.json`. Es beweist die Mechanik, nicht den Zustand.
- **`quality.yml` prüft Design nicht.** Der 45-Minuten-Workflow mit über 20 Schritten ruft den Designprüfer an keiner Stelle auf.
- **Lokal passiert nichts.** Wer nie einen PR öffnet und direkt auf einen Feature-Branch pusht, löst keinen Design-Check aus.

## 5.3 Der Ist-Zustand der Ratsche (nachgerechnet am 16.09.2026)

| Kennzahl | Wert |
| --- | --- |
| Einträge in der Baseline | **3585 in 67 Dateien** |
| Aktueller Scan | **3195 in 54 Dateien** |
| Schlüssel über der Baseline (würden heute scheitern) | **0** |
| Zusätzlich noch geduldete Verstöße (freier Spielraum) | **8** |
| Baseline-Dateien, die aus dem Scan gefallen sind | **13** (11 aufgeräumt, 2 gelöscht) → **390 Kontingente lautlos erloschen** |
| Prüfsummen im Siegel | **52 von 52 identisch**, 0 Abweichungen |

Der Check ist heute **grün**. Die Schulden sind seit der Basierung um 390 Funde gesunken (Stand 15.09., auth-v2-Bereich aufgeräumt), ohne dass die Baseline nachgeführt wurde — was die Regel erlaubt, weil nur Erhöhungen geprüft werden.

## 5.4 Die fünf Dateien mit den höchsten Zahlen

| Rang | Datei | Geduldete Verstöße | Davon verschiedene Token | Größte Posten |
| --- | --- | --- | --- | --- |
| 1 | `src/app/design-system.css` | **1011** | 398 | `#fff` ×83, `font-size:9px` ×60, `font-size:8px` ×56, `font-size:11px` ×49, `font-size:12px` ×48, `font-size:10px` ×41 |
| 2 | `src/app/globals.css` | **828** | 287 | `#fff` ×70, `font-size:10px` ×28, `font-size:9px` ×28, `#105258` ×26, `font-size:12px` ×25, `#dcebec` ×22 |
| 3 | `src/components/marketing/marketing.module.css` | **359** | 171 | `linear-gradient(` ×29, `#fff` ×27, `radial-gradient(` ×17, `#105258` ×13, `#ffffff` ×9, `font-size:12px` ×9 |
| 4 | `src/components/icons.tsx` | **179** | 18 | `#105258` ×111, `#1c2129` ×26, `#8a9aa0` ×14, `#fff` ×6, `#e2543e` ×4 |
| 5 | `src/app/admin/crm/page.tsx` | **167** | 26 | `#e4e2dc` ×38, `text-xs` ×34, `#10222a` ×16, `#105258` ×15, `#4b5b60` ×12, `text-[11px]` ×12 |

Verteilung auf die Regeln: `literal-color` **2657**, `small-type` **682**, `decorative-effect` **123**, `visual-utility` **96**, `unowned-style` **27**, `foreign-font` **0**.

**Bemerkenswert:** Rang 3 (`marketing.module.css`, 359 Schulden) steht **weder** auf der Schutzliste **noch** auf der Erlaubnisliste für neue Stildateien — es ist eine ungeschützte Datei mit einem sehr großen, eingefrorenen Regelverstoß. Rang 1 und 2 (`design-system.css`, `globals.css`) sind geschützt und versiegelt; dort ist eine Bereinigung ohne Neuversiegelung unmöglich.

---

# Anhang · Gemessene Zahlen auf einen Blick

| Kennzahl | Wert | Quelle |
| --- | --- | --- |
| Geduldete Verstöße / Dateien | 3585 / 67 | `design/design-debt.json` |
| Aktuelle Verstöße / Dateien | 3195 / 54 | `scan()` |
| Prüfsummen im Siegel | 52 / 52 identisch | `design/design-lock.json` |
| Geschützte Pfade | 22 | `design/design-policy.json` |
| Erlaubte Stildateien | 4 | ebenda |
| Regeln im Prüfer | 6 | `eh-design-check.mjs` 10–16 |
| Seiten unter `src/app` | 94 | Verzeichniszählung |
| CSS-Dateien unter `src` | 34 | Verzeichniszählung |
| CSS-/TSX-Dateien außerhalb `src` (nie geprüft) | 26 | Verzeichniszählung |
| Dateien in `packages/eh-design/src` (nie geprüft) | 29 | Verzeichniszählung |
| `font-size`-Deklarationen / davon unter 12 px Äquivalent | 1319 / 396 | Quelltextzählung |
| Verschiedene numerische `font-size`-Literale | 70 | Quelltextzählung |
| Verschiedene `font-weight`-Werte | 32 | Quelltextzählung |
| Verschiedene `line-height`-Werte | 38 | Quelltextzählung |
| Verschiedene `font-family`-Werte | 11 | Quelltextzählung |
| Pillen-Radien in CSS (`999px`/`9999px`/`50%`) vs. Klasse `rounded-full` | 153 : 8 | Quelltextzählung |
| `box-shadow:`-Deklarationen | 277 in 17 Dateien | Quelltextzählung |
| `oklch(` + `color-mix(` (für `literal-color` unsichtbar) | 80 | Quelltextzählung |
| Benannte `white`/`black`-Werte | 95 in 5 Dateien | Quelltextzählung |
| `style="…"` (für `unowned-style` unsichtbar) | 15 in 2 Dateien | Quelltextzählung |
| Exportierte `EH*`-Symbole / davon in `src` ungenutzt | 142 / 26 | Paketzählung |
| `EH*Page`-Exporte vs. in `DESIGN.md` §5 gelistet | 16 vs. 8 | Paketzählung |

**Ausdrücklich nicht belegt:** Branch-Protection-Einstellungen auf GitHub (`gh` nicht verfügbar); die „13 Schema-Typen“ und „25 Remotion-Geschichten“ des Präsentationsgenerators (externes Repository); die Angabe „120 verschiedene `font-size`-Werte“ (gemessen: 70 numerische Literale); die Angabe „78 % totes CSS“ (hier nicht nachgemessen — es wurde kein Dead-CSS-Scan ausgeführt).
