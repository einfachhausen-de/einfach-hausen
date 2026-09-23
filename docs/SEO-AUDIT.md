# SEO-Audit einfachhausen.de

Gemessen am 15.09.2026, ~22:40 GMT+2 — gegen die **Live-Domain** (curl + `node -e` auf dem
ausgelieferten HTML) und gegen den **Quellcode** im Repo bei `36eaa7c`.
Kein Werkzeug-Versprechen: alles hier Genannte ist an einer konkreten Antwort oder
Codezeile belegt. Wo etwas ungeprüft ist, steht das dabei.

---

## Kurzfassung

Das technische Fundament ist besser als bei den meisten Seiten in dieser Größe: Canonicals,
Sitemap, robots.txt, strukturierte Daten, eindeutige Titel je Seite. Zwei site-weite Mängel
gab es, einer ist behoben, einer braucht eine Freigabe. Der größte ungenutzte Hebel ist
**lokal** (keine Ortsseiten), der größte Link-Hebel liegt **im eigenen Produkt**
(die Handwerker) — beide in eigenen Dokumenten.

| | Befund | Status |
|---|---|---|
| B1 | `og:image` fehlte auf **jeder** Seite | **behoben** |
| B2 | Zwei `<h1>` und zwei `<main>` auf jeder Seite | offen — braucht Brand-Freigabe |
| B3 | Keine Orts-/Regionalseiten (62 URLs, kein Ort) | offen → `ORTSSEITEN-KONZEPT.md` |
| B4 | `sitemap.xml` setzt `lastmod` auf die Buildzeit | offen, 20 Minuten |
| B5 | `changeFrequency`/`priority` werden von Google ignoriert | kein Fehler, nur wissen |
| B6 | App-Icon und Design-Tokens nutzen verschiedene Grüntöne | offen, Marke nicht SEO |

---

## Was belegt gut ist

| Prüfpunkt | Befund | Beleg |
|---|---|---|
| Betrieb | `ok/ready`, DB `ready`, SMTP konfiguriert | `/api/health` |
| `robots.txt` | `Allow: /`, `Disallow` für `/app`, `/admin`, `/api`, Sitemap verlinkt | Live-Abruf |
| `sitemap.xml` | 62 URLs, **generiert** aus `SERVICE_PATHS`, `BLOG_POSTS`, `LEXIKON_*` | `src/app/sitemap.ts` |
| Canonical | je Seite die eigene URL — **kein** Leck aus dem Layout | 9 Routen geprüft |
| Titel | je Seite eindeutig und konkret | 9 Routen geprüft |
| `description` | überall gesetzt, keine Duplikate gesehen | Live-HTML |
| Sprache | `<html lang="de">` | Live-HTML |
| JSON-LD | `Organization` + `WebSite` im Root-Layout, `BreadcrumbList` und `HomeAndConstructionBusiness`/`Service` auf den Leistungen | `src/lib/seo.ts` |
| Search Console | Verifizierungsdatei liegt aus | `public/google3420d08cbcdd83dc.html` |
| Datenschutz | kein Tracking, kein CMP — und damit kein Consent-Ballast im Renderpfad | Projektentscheidung |

Die JSON-LD-Bausteine sind außerdem ehrlich gehalten: `areaServed` verspricht keine
Bundesweite Verfügbarkeit, es gibt keine erfundenen Bewertungen und keine Preise im Schema.
Das ist der richtige Weg — erfundene Auszeichnungen sind ein Risiko, kein Ranking.

---

## B1 — `og:image` fehlte überall (behoben)

**Vorher.** `openGraph` in `src/app/layout.tsx` hatte kein `images`, `twitter.card` stand
auf `summary_large_image` — ohne Bild. Ergebnis: jeder geteilte Link auf WhatsApp, LinkedIn,
Slack, X oder Facebook zeigte eine leere Karte.

Das ist nicht nur Kosmetik. Ein Backlink, der in einer WhatsApp-Gruppe landet, wird ohne
Vorschau seltener angeklickt — und Klicks sind das, was einen Link für Google wertvoll macht.
Die fehlenden Bilder haben also genau den Kanal entwertet, über den die Zielgruppe
(Eigenheimbesitzer, Handwerker) tatsächlich teilt.

**Behoben.** Sieben Motive, erzeugt aus den echten Design-Tokens:

- `scripts/eh-og-image.mjs` liest `packages/eh-design/src/tokens.json` (dieselbe Farbquelle
  wie `tokens.css`) und rendert 1200×630-PNGs nach `public/og/`.
  Motive: `default`, `leistungen`, `lexikon`, `blog`, `partner`, `hilfe`, `preise`.
- `src/lib/seo.ts`: `ogImages(motiv)` und `ogBlock({...})`.
- Verdrahtet in `layout.tsx` und **11 Seiten** (12 Stellen insgesamt).

**Warum kein `opengraph-image.tsx`.** Satori/ImageResponse braucht Inline-Styles mit
Literalfarben. Der Design-Check verbietet `#hex`, `rgb()` und `style={...}` unter `src/`
und vergleicht gegen `design/design-debt.json` — ein solcher Generator würde das Gesetz
brechen. Der Umweg über ein Skript in `scripts/` hält die Regel ein **und** hält die
Vorschau automatisch an den Tokens: ändert sich die Marke, ändert sich das Bild.

**Die Falle, die dabei fast zugeschnappt wäre.** Next merged Metadata nur **flach**: eine
Seite mit eigenem `openGraph`-Block ersetzt den des Layouts **komplett** — inklusive
`images`. Es reichte also nicht, das Bild einmal im Layout zu setzen; jede der 12 Stellen
brauchte das Feld. `ogBlock()` setzt deshalb auch `locale` und `siteName` neu, weil die
sonst stillschweigend verschwunden wären.

**Verifiziert — nicht nur typgeprüft.** Produktions-Build (`BUILD_ID PMTvpYsyIWUX_HoEt_AOo`,
142/142 Seiten) und `next start`, dann gegen das gerenderte HTML geprüft:

| Route | `og:image` |
|---|---|
| `/` | `/og/default.png` |
| `/leistungen` | `/og/leistungen.png` |
| `/preise` | `/og/preise.png` |
| `/lexikon` | `/og/lexikon.png` |
| `/blog` | `/og/blog.png` |
| `/partner` | `/og/partner.png` |
| `/hilfe` | `/og/hilfe.png` |
| `/lexikon/waermepumpe` | `/og/lexikon.png` (Bereichsbild) |
| `/blog/heizung-wartung-kosten` | `/og/blog.png` (Bereichsbild) |
| `/leistungen/heizung` | `/og/leistungen.png` (Bereichsbild) |

Alle zehn Routen HTTP 200. Vollständiger Tagsatz vorhanden: `og:image` mit `:width` 1200,
`:height` 630 und `:alt`, dazu `og:type`, `og:locale de_DE`, `og:site_name` — und
**`twitter:image` inklusive `alt`/`width`/`height`**. Next fällt also wie erwartet von
`twitter` auf `openGraph.images` zurück, `twitter.images` musste nicht gesetzt werden.
Die URLs sind über `metadataBase` absolut aufgelöst (`https://einfachhausen.de/og/…`), und
die Dateien werden korrekt ausgeliefert (`200`, `image/png`, 40–52 KB).

**Nach dem Deploy nachprüfen:**
```
curl -s https://einfachhausen.de/ | grep -o 'og:image[^>]*'
curl -s https://einfachhausen.de/partner | grep -o 'og:image[^>]*'
```

---

## B2 — Zwei `<h1>` und zwei `<main>` auf jeder Seite (offen)

**Beleg.** Neun Routen abgerufen (`/`, `/leistungen`, `/preise`, `/lexikon`, `/blog`,
`/hilfe`, `/partner`, `/impressum`, `/leistungen/heizung`) — auf **allen** `h1=2`. Die
Startseite liefert `2× <main>`, `2× <h1>`, `1× <footer>`:

```
<h1>Seite wird geladen</h1>            ← Fallback
<p>Wir bereiten die Inhalte gerade für dich vor.</p>
…
<h1>Dein Haus.Einfachgeregelt.</h1>    ← echte Seite
```

**Ursache.** `src/app/loading.tsx` ist der Root-Suspense-Fallback und rendert
`PublicState` — und `PublicState` bringt ein eigenes `<main>` und ein `<h1>` mit
(`src/components/marketing/public-state.tsx:20-24`). Weil `layout.tsx` `headers()` aufruft,
ist **jede** Route dynamisch; der Fallback wird deshalb bei jedem Aufruf mitgestreamt.

**Wie schlimm ist das wirklich.** Ehrlich: begrenzt. Google führt JS aus und sieht am Ende
nur den richtigen H1. Der Schaden sitzt woanders — **Bing, Ecosia und alle Social-Scraper
rendern kein JavaScript.** Die sehen eine Seite, deren Überschrift „Seite wird geladen"
lautet und deren Text „Wir bereiten die Inhalte gerade für dich vor." ist. Für Bing ist die
Seite damit inhaltlich leer.

**Fix-Skizze.** `PublicState` bekommt eine Option, den Titel nicht als `h1` zu rendern
(und den Fallback ohne `<main>` auszuliefern). Der Ladezustand ist eine Statusmeldung, keine
Seitenüberschrift — `role="status"` ist die richtige Semantik, nicht `h1`.

**Blocker — deshalb hier bewusst nicht angefasst.** `.stateCard h1` steht in
`src/components/marketing/mkt.module.css`. Diese Datei ist **design-locked** (Hash in
`design/design-lock.json`) **und** in `design/design-policy.json` als `protected` gelistet.
Jede Änderung daran braucht Brand-Autorität, und `scripts/eh-design-seal.mjs` darf laut
eigener Regel nicht benutzt werden, um ein Gate zu umgehen. Ein Umbau, der ohne
CSS-Änderung auskommt, ändert zwangsläufig das Aussehen des Ladezustands — und das ist eine
Markenentscheidung, keine technische. **@Delqhi entscheidet.**

---

## B3 — Keine Ortsseiten

62 URLs: 13 × `/leistungen`, 26 × `/lexikon`, 4 × `/blog`, Rest Einzelseiten.
**Kein einziger Ort, keine Region, keine Stadt.** Für eine Plattform, deren Angebot
laut eigener Aussage regional ist („Verfügbarkeit hängt vom aktiven Partnernetz vor Ort ab"),
ist das die größte Lücke im ganzen Aufbau. Konzept: `ORTSSEITEN-KONZEPT.md`.

Randnotiz: Die Pilotregion ist **nirgends im Code oder in den Dokumenten benannt** — weder
Stadt noch PLZ-Kreis. `src/lib/geocode.ts` kennt alle 95 PLZ-Regionen als grobe Zentroide,
aber nicht, wo das Partnernetz tatsächlich steht. Das ist Entscheidung 1 im Ortsseiten-Konzept.

---

## B4 — `lastModified` ist die Buildzeit

`src/app/sitemap.ts:47-52` setzt für **alle** 62 URLs `lastModified: new Date()`. Nach jedem
Build sind damit alle Seiten „gerade eben geändert". Google erkennt dieses Muster und
ignoriert `lastmod` dann vollständig — die Angabe ist also nicht falsch, sondern wirkungslos.

**Fix:** echte Daten verwenden. Für den Cluster gibt es sie schon:
`CLUSTER_DATE_MODIFIED` aus `src/lib/seo-cluster.ts`, dazu die Änderungsdaten der
Lexikon-Einträge. Aufwand: eine halbe Stunde, kein Risiko, kein Designkontakt.

---

## B5 — `changeFrequency` und `priority` sind wirkungslos

Google wertet beide Felder seit Jahren nicht aus. Sie sind kein Fehler, kosten aber
Pflegeaufwand ohne Gegenwert. **Empfehlung: stehen lassen, nicht weiter pflegen** — und
nicht als Stellschraube missverstehen, wenn eine Seite nicht rankt.

---

## B6 — Zwei verschiedene Grüntöne

| Quelle | Farbe |
|---|---|
| `public/brand/einfachhausen-app-icon.svg` | `#064b38` + `#a8d779` |
| `public/brand/einfachhausen-mark.svg` | `#9fce72` |
| `packages/eh-design/src/tokens.json` | `--eh-color-petrol: #105258` |

App-Icon und Website sind also nicht derselbe Grünton. Für SEO irrelevant, für
Wiedererkennung nicht — und das App-Icon ist das, was auf dem Homescreen landet. Die neuen
OG-Bilder nutzen bewusst die Tokens, nicht das Icon.

---

## Achtung: PR #115 ist rot — und zwar nicht wegen der SEO-Arbeit

Beim Schreiben dieses Audits lag die Design-Arbeit noch uncommittet im Arbeitsbaum. Inzwischen
ist sie committet und als **PR #115** (`fix/nav-hero-mobile` → `main`) offen. Der Branch
enthält zwei Commits:

| Commit | Inhalt | Design-Gate |
|---|---|---|
| `822bf25` | `fix(ui): mobile Hauptnavigation und Hero wirklich benutzbar machen` | **rot** |
| `00f4d76` | `feat(seo): echte Social-Vorschaubilder fuer alle Marketingseiten` | grün |

Der Lauf `35023687011` bricht ab mit:

```
Brand authority required; protected path differs from trusted base: design/design-lock.json
Brand authority required; protected path differs from trusted base: packages/eh-design/src/app.tsx
… (9 Pfade insgesamt, alle aus 822bf25)
```

Nachgeprüft: `00f4d76` berührt **0** geschützte Pfade, legt **keine** `.css` unter `src/` an
und fasst `design/design-debt.json` nicht an — dieser Commit würde das Gate allein bestehen.
Die neun genannten Pfade stammen ausschließlich aus dem Navigations-Commit.

**Warum das so ist:** `eh-design.yml` zieht den Guard aus dem Base-Commit und läuft bei Pull
Requests mit `--base`. Jeder geänderte Pfad aus `design-policy.json` → `protected` ist dann
ein harter Fehler, auch wenn das Siegel lokal korrekt gesetzt wurde
(`EH_DESIGN_CONSISTENT` ist hier grün, `eh-design-generate.mjs --check` meldet
`EH_TOKENS_VALID`). Der vorgesehene Weg für Designänderungen ist ein **Push auf `main` oder
`design/**`** (dort läuft der Check ohne `--base`) — nicht ein PR.

**Konsequenz:** PR #115 lässt sich so nicht mergen. Entweder die Design-Änderungen aus dem
PR herausnehmen und getrennt auf `main` bringen, oder die SEO-Arbeit in einen eigenen Branch
über `main` legen.

### Der zweite rote Job kommt aus derselben Ursache

`lint, build, security and browser acceptance` bricht am Schritt
**Visual regression (website)** ab: **44 pass, 28 fail** — u. a. `partner` 25,61 %,
`ueber-uns` 27,42 %, `so-funktionierts` 16,71 % geänderte Pixel bei 8 % Budget.

Das ist die Folge der Token-Änderung in `822bf25`
(`--eh-font-page: clamp(2.75rem …)` → `clamp(2rem …)`): sie verschiebt das Rendering
**jeder** Seite. Dass es nicht an der SEO-Arbeit liegt, sieht man an den betroffenen
Seiten — `agb`, `datenschutz`, `impressum`, `kontakt`, `sicherheit` und `ueber-uns` stehen
in der Fehlerliste, obwohl `00f4d76` sie überhaupt nicht angefasst hat. Die og:image-Arbeit
ändert nur `<head>`-Ausgaben und Assets, kein einziges Pixel.

Die Baselines müssen laut Projektregel **in CI** neu erzeugt werden
(`update_baselines=true`) — lokal erzeugte sind sofort wieder rot. Der Job
`refresh visual baselines` steht im Lauf auf `skipping`, wurde also nicht ausgelöst.

**Gute Nachricht aus demselben Lauf:** der Build selbst läuft durch — der Job scheitert erst
danach am visuellen Vergleich, und `browser acceptance` besteht auf chromium, firefox und
webkit. Die SEO-Änderung kompiliert und rendert also in CI.

**Zusatzbefund zum lokalen Bauen:** Der erste `next build` brach früh ab — Turbopack wollte
seinen eigenen Cache aufräumen und lief in den Massen-Löschschutz des Shims
(`SAFE_DELETE_BULK_CONFIRM_REQUIRED`, 50 Dateien). Deshalb wurde `.next` nach
`.next.bak-vor-seo-pruefung` umbenannt (nicht gelöscht) und erneut gebaut.

Der zweite Lauf kam durch: `✓ Compiled successfully in 2.0min` →
`Finished TypeScript in 10.3min` → `✓ Generating static pages (142/142) in 14.1s`. Danach
meldete Next erneut `BUILD_EXIT=1` — diesmal beim Aufräumen von `.next/export-detail.json`,
also **nachdem `BUILD_ID` geschrieben war**. Der Build war damit vollständig und mit
`next start` benutzbar; genau so wurde die Verifikation oben gefahren.

**Merksatz:** `BUILD_EXIT=1` heißt in dieser Umgebung nicht „Build kaputt". Erst prüfen, ob
`.next/BUILD_ID` existiert und *welcher* Schritt abgebrochen ist. `.next.bak-vor-seo-pruefung`
kann weg.


---

## Reihenfolge

1. ~~`og:image`~~ — erledigt, wartet auf den nächsten Deploy
2. **B4** Sitemap-`lastmod` — 30 Minuten, kein Risiko
3. **B2** Doppel-H1 — Freigabe für `mkt.module.css` einholen, dann umbauen
4. **Ortsseiten** — erst Entscheidung (Region), dann bauen
5. **Backlink-Akquise** — läuft unabhängig vom Code, kann sofort starten

## Was dieses Audit nicht beantwortet

- **Keine Rankings, keine Impressionen.** Dafür braucht es Search Console; die
  Verifizierungsdatei liegt aus, ein Blick in „Abdeckung" und „Leistung" wäre der nächste
  sinnvolle Schritt. Ohne diese Zahlen ist jede Priorisierung eine begründete Vermutung.
- **Keine Core-Web-Vitals-Messung.** Es gibt `CwvTelemetry` im Layout, ausgewertet wurde
  sie hier nicht.
- **Kein Backlink-Profil.** Dazu bräuchte es ein Tool (Ahrefs/Semrush/Search Console);
  mit curl ist das nicht zu erheben.
