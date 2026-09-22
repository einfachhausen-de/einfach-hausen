# Einfachhausen · Designsystem 1.0

**Verbindlich seit 6. September 2026.** Jerry hat Atelier 02 ausdrücklich angenommen: „omg das ist MEGA!“ Diese Freigabe ersetzt den früheren Status „noch nicht visuell freigegeben“. Die drei alten Stilproben aus PR40 sind verworfen. Der angenommene Entwurf und seine ursprüngliche Begutachtung bleiben unter `design/brand-atelier/` und `docs/brand/ATELIER_02.md` als historische Referenz erhalten.

## 1. Autorität und Geltungsbereich

Dieses Dokument und `packages/eh-design/` definieren die Marke für Website, Unterseiten, Hausakte, Owner-App, Handwerker-App, CRM, Portalhub und Präsentationen. **Andere Agenten dürfen das Design nicht eigenständig verändern.** Der Auftrag, eine neue Seite zu bauen, ist keine Erlaubnis, Farben, Schrift, Logo, Radien, Effekte oder eine eigene Komponentenfamilie zu erfinden. Nur eine ausdrückliche Anweisung von Jerry zum Markendesign autorisiert eine neue Designversion. Ein fehlender Baustein wird als Bedarf dokumentiert; bis zur Entscheidung wird eine bestehende passende Komposition verwendet.

Inhalt, Reihenfolge, Seitenstruktur, echte Bilder, fachliche Daten, erlaubte Komponentenvarianten und bestehende Aktionen dürfen passend zum Thema kombiniert werden. Unterschiedliche Seiten sollen unterschiedlich aufgebaut sein. Einheitlichkeit bedeutet gemeinsame Gestaltungssprache, nicht identische Seiten.

Bei widersprüchlichen alten Dokumenten gilt diese angenommene Version. Historische Freigaben, Screenshots und Aufgaben bleiben nachvollziehbar, dürfen aber nicht als heutige Gestaltungsanweisung wiederverwendet werden.

Eine Abnahme einer Komposition ist kein Freibrief für die Technik dahinter. Kaskade, Wortschatz und Ratsche (§9 bis §12) gelten für jede neue Zeile, auch innerhalb einer freigegebenen Komposition.

## 2. Das Eigene an Einfachhausen

**Zuhause, mit Überblick.** Die Marke verbindet ein persönliches Zuhause mit klarer, nachvollziehbarer Ordnung. Die Gestaltung fühlt sich warm und entschieden an. Sie zeigt echte Inhalte und Beziehungen: Menschen, Unterlagen, Arbeiten, Termine und Hausgeschichte.

- **Hauskante:** genau eine bewusst geschnittene 45°-Ecke an großen Bildflächen und Aktenumschlägen. Keine abgeschnittenen Eingabefelder oder Schaltflächen. Wichtige Gesichter und Bildaussagen bleiben sichtbar. Interaktive Elemente liegen nicht im abgeschnittenen Bereich.
- **Hauslinie:** feine, funktionale Linien gliedern Register, Abläufe, Listen, Vergleiche und Chroniken. Nummern geben Orientierung. Keine zufälligen farbigen Streifen als Dekoration.
- **Wortbild:** kräftige, eng gesetzte Inter-Überschriften mit ruhigem Fließtext. Keine zweite Displayschrift. Der handschriftliche Teil des unveränderten Original-Logos bleibt die einzige Schreibschrift.
- **Rhythmus:** helle Arbeitsflächen und Lesestrecken, dunkle Kapitel oder Aktenumschläge. Sand setzt inhaltlich begründete Flächen ab. Keine beliebige Sammlung gleichförmiger Karten.
- **Fotografie:** glaubwürdige Wohnsituationen und persönliche Zusammenarbeit. Keine erfundenen Kunden, Mitarbeiter, Bewertungen oder Erfolgszahlen. Illustrative Bilder werden entsprechend bezeichnet. Bilder nie pauschal so beschneiden, dass Köpfe verschwinden.

Verboten sind neue Verläufe, Glow, Glassmorphism, schwebende Kugeln, dekorative Dauerschleifen, beliebige Pillen, nachgebaute Logos und autonome „Verbesserungen“ der Marke.

## 3. Eine einzige Markenquelle

| Quelle | Aufgabe |
| --- | --- |
| `packages/eh-design/src/tokens.json` | Kanonische, versionierte Werte — der einzige Ort, an dem Rohwerte legal sind |
| `packages/eh-design/src/tokens.css` und `tokens.ts` | Daraus generierte CSS- und TypeScript-Ausgaben |
| `packages/eh-design/src/styles.module.css` | Einzige neue Komponentenstilquelle |
| `packages/eh-design/src/primitives.tsx` | Grundlagen |
| `packages/eh-design/src/blocks.tsx` | Inhaltsblöcke |
| `packages/eh-design/src/app.tsx` | Interaktive und funktionale App-Komponenten |
| `packages/eh-design/src/recipes.tsx` | Vollständige, ausführbare Seitenvorlagen |
| `src/design-system/index.ts` | Importstelle der Website |
| `src/app/design-system/` | Browserbibliothek unter /design-system; noindex |
| `src/components/marketing/ui.tsx` | Kompatible Adapter für vorhandene Unterseiten |
| `src/components/marketing/tokens.css` | Alte Namen als Aliase, keine zweite Palette |
| `design/design-lock.json` | Prüfsummen des geschützten Designkerns |
| `design/design-policy.json` | Schutzpfade, erlaubte Stildateien, Stufenplan der Schuld |
| `design/design-debt.json` | Schulden-Baseline |
| `design/design-deadcss.json` und `design/design-budgets.json` | Eingefrorene Tot-Listen und Zähler |
| `scripts/eh-design-check.mjs` und `scripts/eh-design-deadcss.mjs` | Die Prüfer |

Andere Repositories erhalten eine identische, versionierte Kopie nach `vendor/eh-design/` und eine Prüfsummenliste unter `design/eh-design-vendor.json`. Diese Kopie wird niemals lokal umgestaltet.

### Farben

| Rolle | Wert | Verwendung |
| --- | --- | --- |
| Papier | #faf8f4 | Grundfläche |
| Petrol | #105258 | Primäre Aktion, Orientierung |
| Tiefes Petrol | #0a3539 | Aktenumschlag, Kapitel, Abschluss |
| Tinte | #10222a | Fließtext und Überschriften |
| Sekundärtext | #4b5b60 | Lesbare Metadaten |
| Linie | #e4e2dc | Gliederung auf hellen Flächen |
| Sand | #ecdfc9 | Hinweise und sachliche Hervorhebungen |
| Terra | #a84d29 | Kleine Registersignale und begründete Hinweise |
| Weiß | #ffffff | Eingaben und funktionale Arbeitsflächen |

Statusfarben `error` und `success` gehören ebenfalls zu den kanonischen Tokens. Status braucht immer Text; Farbe alleine ist keine Information. Dunkle Flächen verwenden Papier als Textfarbe und Sand als Sekundärtext.

Geschrieben wird keine Farbe, sondern `var(--eh-color-*)`.

### Schrift und Lesbarkeit

Inter Variable wird selbst gehostet. Originaldatei: `src/fonts/InterVariable.woff2`; identische Paketkopie: `packages/eh-design/assets/inter-variable.woff2`. Keine externen Google-Font-Anfragen.

| Verwendung | Mindestwert / Skala |
| --- | --- |
| Website-Fließtext | 17–18 px; lesende Artikel 18 px |
| App-Fließtext | 16 px |
| Beschriftungen und Aktionen | 15 px; bestehende Übergangsflächen mindestens 14 px |
| Metadaten und Bildunterschriften | 13 px |
| Kurze, nicht entscheidende Großbuchstabenregister | 12 px |
| Input, Select, Textarea | 16 px, auch mobil |
| Startseiten-Display | 56–112 px, responsive |
| Unterseiten-H1 | 32–68 px, responsiv: `clamp(2rem, 5vw, 4.25rem)` |
| App-H1 | 32–44 px |
| Präsentation bei 1920×1080 | Bild-/Fußtexte mindestens 24 px, Inhalt 32–36 px, Titel 56–88 px |

Die Untergrenze der Unterseiten-H1 liegt seit 15.09.2026 bei 32 px statt 44 px. Grund: Die Titel mehrerer Leistungsseiten sind 60 Zeichen und länger; auf 390 px brachen sie dadurch auf sechs Zeilen um, und der Hero nahm die gesamte Bildschirmhöhe ein, bevor der erste Inhalt sichtbar wurde. Die Obergrenze von 68 px bleibt unverändert, die Skala wächst weiterhin mit 5 vw und erreicht 44 px ab etwa 880 px Breite. Jerry hat diese Senkung ausdrücklich freigegeben. Die Ursache bleibt zusätzlich der zu lange Titel — er wird inhaltlich gekürzt, die Schriftgröße ist nur die zweite Hälfte der Antwort.

Geschrieben wird keine Schriftgröße, kein Schriftgewicht und keine Zeilenhöhe, sondern `var(--eh-font-*)`, `var(--eh-weight-*)` und `var(--eh-leading-*)`. Zeilenhöhen sind `tight` 1,2 · `snug` 1,35 · `body` 1,55.

Eine überladene Folie wird inhaltlich aufgeteilt. Text wird nicht bis zur Unlesbarkeit verkleinert oder abgeschnitten. Numerische Schritte bleiben ungebrochen. Absätze haben kurze, sinnvolle Leselängen; lange Fachtexte kommen in `EHProse`.

### Form, Abstand und Bewegung

Eingaben und Schaltflächen: 6 px Radius. Funktionale Panels: 8 px. Fotografien und Aktenumschläge: die kanonische Hauskante. Touch-Ziele mindestens 44×44 px, reguläre Buttons 48 px hoch. Sichtbarer Fokus mit 3-px-Kontur und Abstand, keine Entfernung ohne gleichwertigen Ersatz.

Geschrieben wird kein Radius, sondern `var(--eh-shape-*)`. Eine Pille (`border-radius:999px`) entsteht nicht mehr.

Bewegung unterstützt einen Zustand oder einen Wechsel. Kurze endliche Übergänge; keine Typewriter-Platzhalter, Hintergrunddrifts oder erzwungenen Scroll-Animationen. `prefers-reduced-motion` zeigt den vollständigen Endzustand. Keine Animation darf den Inhalt für Tastatur- oder Screenreader-Nutzer verbergen.

## 4. Komponentenregister

| Familie | Kanonische Komponenten |
| --- | --- |
| Grundlagen | EHScope, EHLogo, EHContainer, EHSection, EHEyebrow, EHHeading, EHText, EHButton, EHTextLink, EHActions, EHImageFrame, EHRecordCover, EHStatus, EHDivider |
| Einstieg und Erzählung | EHPageHero, EHPromiseRow, EHSplitStory, EHMediaStory, EHClosing |
| Leistung und Erklärung | EHFeatureRows, EHSteps, EHTimeline, EHFacts, EHComparison, EHFAQ, EHCallout, EHServiceIndex, EHPricing |
| Lesen und Navigation | EHProse, EHArticleHeader, EHArticleLayout, EHContents, EHRelated |
| Arbeitsflächen | EHAppHeader, EHPanel, EHList, EHDataTable, EHDocumentList |
| Eingaben | EHField, EHInput, EHTextarea, EHSelect, EHCheckbox, EHComposer |
| Interaktion und Zustände | EHTabs, EHDialog, EHEmptyState, EHLoadingState, EHErrorState |

Der Bestand richtet sich nach den Exporten von `packages/eh-design`; am 16.09.2026 waren es 152 exportierte `EH*`-Symbole (gezählt über `export const|function|class EH…` in `packages/eh-design/src/`). Ein Registereintrag ist kein Nachweis der Verwendung: Wer einen Baustein einsetzt, prüft vorher, ob er im Produktcode tatsächlich ankommt.

Die vollständigen TypeScript-Props sind die API-Referenz; sie stehen mit dem vollständigen Code in der Quellkapsel. Keine zusätzlichen `style`- oder `className`-Schlupflöcher an den neuen öffentlichen Komponenten. Bestehende Adapter behalten ihre bisherigen Schnittstellen, damit Unterseiten nicht brechen.

`EHField` verknüpft Label und Eingabe über dieselbe ID. Hinweise und Fehler werden mit `aria-describedby` verbunden; Fehlerzustand über `aria-invalid`. `EHTabs` unterstützt Links/Rechts, Home/End und deaktivierte Einträge. `EHDialog` nutzt den nativen modalen Dialog, Fokusbindung und Escape. Datenlisten behalten eindeutige IDs. Tabellen haben Caption und Spaltenköpfe; auf kleinen Bildschirmen ist ausschließlich der Tabellenbereich horizontal scrollbar.

## 5. Seiten individuell zusammensetzen

| Inhalt | Vollständige Vorlage | Schwerpunkt |
| --- | --- | --- |
| Startseite | EHHomePage | Starkes Wortbild, Fotografie, Versprechen, Hausakte, Ablauf |
| Leistungsdetail | EHServicePage | Bedarf, Leistungsumfang, Entscheidung, Fragen |
| Ratgeber / Fachartikel | EHArticlePage | Inhaltsverzeichnis, Lesespalte, Zwischenüberschriften, verwandte Themen |
| Leistungsübersicht | EHServiceIndexPage | Themenregister und konkrete nächste Wege |
| Kontakt | EHContactPage | Persönlicher Kontext, vollständiges Formular, tatsächliche Kontaktdaten |
| Preise / Umfang | EHPricingPage | Klarer Leistungsumfang, gültige Preise, Bedingungen |
| Owner-App | EHOwnerPage | Hausakte, Unterlagen, Menschen, Chronik, Anliegen |
| Handwerker-App | EHProviderPage | Anfragen, Bearbeitungsstatus, Termine |
| Auftragsdetail | EHJobDetailPage | Vorgang, Verlauf, Dokumente, nächster Schritt |
| Termine | EHAppointmentsPage | Zeitraum, Gruppen, primäre Aktion |
| Nachrichtenverlauf | EHMessageThreadPage | Verlauf, Antwort, Kontext, Rückweg |
| Rechnungen und Belege | EHBillingPage | Belege mit Vorgang und Dokument verknüpft |
| Einstellungen | EHSettingsPage | Gruppen, Speichern, Sicherheitsaktion |
| Zugang | EHAccessPage | Formular, Hilfe, Rechtliches |
| Lexikon-Eintrag | EHGlossaryEntryPage | Begriff, Definition, Abschnitte, Verwandtes |
| Sensible Leistung | EHSensitiveServicePage | Hinweis, Umfang, behutsamer nächster Schritt |

Die acht Grundrezepte liegen in `packages/eh-design/src/recipes.tsx`, die acht Fachrezepte in `packages/eh-design/src/domain-recipes.tsx`.

Die Vorlagen nehmen Inhalte und echte Handler als Props entgegen. Datenzugriff, Authentifizierung, Routing, Speicherung und Beauftragung werden aus dem bestehenden Produkt angebunden. Die Browserbibliothek enthält gekennzeichnete Vorschauhandlungen und Beispieldaten; sie sind keine produktiven Endpunkte. Keine Vorschau-Antwort oder Beispieladresse wird in eine echte App übernommen.

Eine neue Seite beginnt mit der passenden vollständigen Vorlage. Fachlich begründete Umstellungen mit vorhandenen Blöcken sind erlaubt. Eine neue Seitenfarbe, Schrift oder lokale Komponentenfamilie ist es nicht.

**Kein neues Seiten-CSS.** Eine neue `*.css` unter `src/` ist verboten; der PR-Check lehnt sie ab (`New page styling forbidden; compose canonical components`). Ausgenommen sind genau die vier Einträge in `ownedStyleFiles` (`design/design-policy.json`): `src/components/marketing/tokens.css`, `src/components/marketing/mkt.module.css`, `src/app/app/homeowner.module.css`, `src/app/pro/provider-workspace.module.css`. Alles andere komponiert aus `packages/eh-design` bzw. `@/design-system`. Eine neue `.tsx` mit UI muss aus der kanonischen Bibliothek importieren; sonst scheitert der Prüfer mit `New UI must consume the canonical library`.

## 6. Präsentationen

Kanonischer Verbraucher: `einfachhausen-de/einfachhausen-presentation-generator`.

- Die 13 Schema-Typen bleiben kompatibel: title, section, bullets, cards, comparison, steps, stats, quote, timeline, chart, image, split, closing.
- Die 25 vorhandenen Remotion-Geschichten behalten ihre Inhalte, Aufrufwege und fachlichen Einschränkungen.
- Beide Renderer lesen dieselben vendorten Tokens; Logo und Inter kommen aus den unveränderten Paketassets.
- Karten werden als lesbare Registereinträge gestaltet. Aktenpanels verwenden die Hauskante.
- Der historische API-Name `Phone` bleibt erhalten; sein Inhalt wird als lesbare Hausakte dargestellt.
- Keine zweite Palette, kein nachgebautes Wortzeichen, keine zusätzliche Schrift.
- Diagramme bilden tatsächlich übergebene Zahlen ab. Beispielzahlen sind keine Belege.
- Remotion bleibt im Generator. Die früher entfernten Website-Präsentationsbereiche werden durch diese Arbeit nicht wieder eingeführt.

(Zahl der Schema-Typen und der Remotion-Geschichten: im externen Repository, hier **nicht belegt**.)

## 7. Schutz vor unbeabsichtigter Änderung

`node scripts/eh-design-generate.mjs --check` verhindert Abweichungen generierter Tokens.
`node scripts/eh-design-check.mjs` (auch `npm run design:check`) prüft die versiegelten Kerndateien und die Schulden-Baseline.
`node scripts/eh-design-deadcss.mjs` (auch `npm run design:deadcss`) prüft totes CSS und die drei Zähler.
`node --test scripts/eh-design-check.test.mjs` beweist Positiv- und Negativfälle.
`node scripts/eh-design-browser.mjs` prüft die echte Bibliothek auf responsives Verhalten, WCAG-Meldungen, Lesbarkeit und Bedienung — von Hand, gegen einen lokal gestarteten Server; es ist in keinem Workflow eingehängt.

`design:check` und `design:deadcss` laufen in `.github/workflows/quality.yml`, unmittelbar nach Lint. `design:debt:sync` führt die Schulden-Baseline nach, `design:report` schreibt `design/design-report.json`; der monatliche Cron-Workflow `eh-design-report.yml` veröffentlicht ihn.

Vorhandene Altlasten stehen präzise pro Datei und Fundtyp in `design/design-debt.json`. Sie dürfen abnehmen, aber nicht durch eine neue Baseline versteckt werden. Neue CSS-Dateien und UI-Dateien ohne kanonischen Import scheitern im PR-Check. Ein Umbruch oder Verschieben von Zeilen schafft kein neues Kontingent für Verstöße.

Der GitHub-Check verwendet gewöhnliche, unprivilegierte PR-Jobs mit Leserechten. Er verwendet weder fremden Code mit Produktionsgeheimnissen noch einen Produktionsrunner. Der öffentliche Haupt-Repository kann GitHub-Actions-Prüfungen ohne bezahlten Bot verwenden. Bei privaten Organisations-Repositories hängt verpflichtender Branch-Schutz vom vorhandenen GitHub-Plan ab.

**Technische Grenze:** Prüfungen können definierte Abweichungen blockieren und Review erzwingen; sie beurteilen nicht automatisch jede gestalterische Qualität. Agenten mit denselben Administratorrechten wie der Eigentümer sind keine separat absperrbare Identität. Kein Dokument oder kostenloser CI-Check rechtfertigt das Versprechen, ein Administrator könne das System niemals umgehen. Ein Agent darf deshalb weder Schutzregeln lockern noch den Designkern neu versiegeln, um seinen eigenen fehlgeschlagenen Check grün zu machen.

## 8. Übergabe und Änderung

Pflichtreihenfolge: `AGENTS.md` → `DESIGN.md` → `NEXT_AGENT.md` → konkrete Aufgabe → `sin-eh-design` → passende vollständige Recipe-Datei → tatsächlicher betroffener Code.

Vor Änderungen an geteilten Funktionen: GitNexus-Auswirkung und echte Aufrufer prüfen. UNKNOWN bedeutet nicht unbenutzt. PageHero, LinkButton, MarketingShell und der Präsentationsrenderer haben große Auswirkung; Schnittstellen bleiben stabil.

Jede Übergabe enthält Repository, Branch, Basis-Commit, absolute Workspace-Pfade, vollständigen neuen/geänderten Quelltext, unveränderte Assets mit Hash, exakte Befehle, Prüfergebnisse, tatsächliche Restarbeit und nächste Aufgabe. Keine Ellipsen, „den Rest analog“, TODO-Komponenten oder erfundenen Freigaben.

Die aktuellen vollständigen Quellkapseln und Prüfsummen liegen unter `docs/brand/system/`. Die alte Atelier-Quellkapsel bleibt unverändert historisch erhalten. Neue Freigaben werden mit ihrer tatsächlichen Aussage in Aufgaben, Handoff und den verfügbaren Memory-Systemen fortgeschrieben.

## Native HTML / Worker

CRM verwendet denselben Vertrag ohne React-Umbau: packages/eh-design/src/html.mjs, html.css und html-style.mjs. Der Generator erzeugt diese aus den kanonischen CSS-Modulen und Original-Assets. html-style.mjs enthält Schrift und Logo eingebettet. Vollständige datenabhängige CRM-Komposition: docs/brand/system/CRM_RECIPE.mjs. Ausschließlich dokumentierte HTML-Slots dürfen bereits sicher gerendertes HTML enthalten; Daten werden escaped, URLs validiert. Keine zweite Palette oder lokale Komponenten-Kopie.

## 9. Kaskade und Schichtung

Die gesamte Kaskadenreihenfolge der Anwendung steht in **einer Zeile** — Zeile 1 von `src/app/globals.css`, vor allen `@import`:

```css
@layer eh-tokens, eh-reset, eh-base, theme, base, eh-legacy, components, utilities, eh-blocks, eh-pages;
@import 'tailwindcss';
```

Die Schichtreihenfolge wird durch das erste Vorkommen festgelegt. Tailwinds eigene `@layer theme, base, components, utilities;` kann sie deshalb nicht mehr verschieben — unabhängig davon, wer später was in welcher Reihenfolge importiert.

| Schicht | Inhalt |
| --- | --- |
| `eh-tokens` | `packages/eh-design/src/tokens.css`, `src/components/marketing/tokens.css` |
| `eh-reset` | `box-sizing`, Margin-Reset |
| `eh-base` | Element-Defaults: `a`, `button`, `input`, `h1`–`h6` |
| `theme` | Tailwind — Custom Properties aus `@theme inline` |
| `base` | Tailwind Preflight (`h1{font-size:inherit}`, Button-/Input-Resets) |
| `eh-legacy` | Altbestand aus `src/app/globals.css`, `src/app/design-system.css`, `src/components/auth-v2/auth-shell.css` |
| `components`, `utilities` | Tailwind |
| `eh-blocks` | `packages/eh-design/src/styles.module.css`, `html.css`, alle Komponentenmodule |
| `eh-pages` | Seitenmodule `src/app/**/*.module.css` |

Der entscheidende Zug ist die Position von `eh-legacy`: **zwischen** `base` und `components`. Damit gewinnen neue Bausteine und Utilities gegen den Altbestand — gleichzeitig verlieren Preflight-Resets nicht mehr gegen den Altbestand, weil `base` davor liegt. Eine Schichtposition vor `base` (frühere Fassung) ließ Preflight die Klassenregeln `.wl-title`, `.arena-*` und Co. trotz höherer Spezifität überschreiben — Login und Welcome brachen visuell. Vor der Schichtung überhaupt lag der Altbestand ungeschichtet und schlug alles — unabhängig von der Importreihenfolge in `src/app/layout.tsx`. Das ist der Grund für die 112 `!important`.

Eine neue Regel in einer der vier globalen Dateien (`src/app/globals.css`, `src/app/design-system.css`, `src/components/marketing/tokens.css`, `src/components/auth-v2/auth-shell.css`) gehört in eine `eh-*`-Schicht. Ausnahmen: `@font-face`, `@keyframes`, `@media`-Hüllen. Wer eine Überschreibung braucht, korrigiert die Schicht — nicht das Ausrufezeichen.

## 10. Wortschatz statt Rohwerte

**Ein Ort, an dem Rohwerte legal sind:** `packages/eh-design/src/tokens.json`. Überall sonst in `src/` gilt die Regel `raw-value`.

Für Schriftgröße, Schriftgewicht, Farbe, Hintergrundfarbe, Rahmenfarbe, Radius, Schatten, Laufweite und Zeilenhöhe ist in `.css`, `.tsx` und `.jsx` **nur** erlaubt:

- `var(--eh-…)`
- `inherit`, `initial`, `unset`, `revert`, `currentColor`, `transparent`, `none`, `0`, `0px`, `0%`, `auto`, `100%`, `normal`, `bold`, `bolder`, `lighter`

Alles andere ist ein Fehler — auch `oklch(0.5 0 0)`, auch `font-size:13px`, auch `font-weight:650`, auch `border-radius:999px`, auch `box-shadow: 0 1px 2px #000`, auch `style={{fontSize:13}}`.

**Whitelist, nicht Blacklist.** Eine Blacklist kann nicht funktionieren, weil die Liste der Rohwerte offen ist. Belegt (Bestandsaufnahme 16.09.2026): `small-type` griff nur bei `px`, nie bei `rem`, `em` oder `%`; `literal-color` sah `oklch(` (62) und `color-mix(` (18) nicht; `decorative-effect` matchte die Klasse `rounded-full` (8), nicht den Wert `border-radius:999px` (153 Vorkommen); `box-shadow` (277 Deklarationen) war vollständig ungeprüft. Die Whitelist schließt alle vier Lücken auf einmal.

**Zielwortschatz:** 8 Schriftgrößen, 4 Schriftgewichte (400/500/600/700), 3 Schatten, 4 Radien, 3 Zeilenhöhen, 2 Laufweiten.

**Heute gelebt:** 174 verschiedene Schriftgrößen und 32 Schriftgewichte (`design/design-report.json`, 16.09.2026, postcss über `src/**/*.css` und `packages/**/*.css`). `tokens.json` enthält heute `weight` 400/550/650, `leading` 3, `shape` 3 — Schatten- und Laufweiten-Tokens fehlen.

Ein neues Schrift-Token entsteht nicht nebenbei: `packages/eh-design/` ist ein geschützter Pfad, und `eh-design-generate.mjs --check` prüft, dass `tokens.css`, `tokens.ts`, `html.css` und `html-style.mjs` exakt zu `tokens.json` passen. **Eine Obergrenze für die Zahl der Schrift-Tokens ist heute nicht eingerichtet** — das ist eine offene Lücke, keine erlaubte Freiheit.

## 11. Die neun Regeln

Erzwungen von `scripts/eh-design-check.mjs` und `scripts/eh-design-deadcss.mjs`, beide in `.github/workflows/quality.yml`. Geprüft wird zeichenweise über `src/` (`.css`, `.ts`, `.tsx`, `.js`, `.jsx`); es wird kein CSS geparst und kein Tailwind-Klassenname aufgelöst.

| Regel | Auslöser |
| --- | --- |
| `literal-color` | wörtliche Hex-, `rgb()`-, `hsl()`-Farben |
| `foreign-font` | Manrope, Poppins, Geist, Roboto, Montserrat, Playfair, DM Sans |
| `small-type` | `font-size` unter 13 px, `fontSize` unter 13, `text-xs`, `text-[…px]` |
| `unowned-style` | `style={` im Markup |
| `decorative-effect` | Gradienten, `backdrop-filter: blur`, `shadow-xl/2xl`, `rounded-full`, `bg-gradient-` |
| `visual-utility` | Tailwind-Farbklassen `bg-/text-/border-/ring-<palette>-<zahl>` |
| `raw-value` | §10 — Rohwert, wo ein Token hingehört |
| `no-important` | `!important` (nur in `.css`) |
| `state-class` | `active`, `selected`, `is-active`, `current`, `open` in einem `className` (nur in `.tsx`/`.jsx`) |

Bewusst **nicht** geprüft werden: Tippziel-Maße, Kontrast, Abstände, semantische Struktur, Bundle-Größe — und alles außerhalb `src/`. `packages/eh-design/src/`, `presentation/`, `design/`, `scripts/` und `docs/` liegen außerhalb des Prüfradius; eine neue CSS-Datei unter `packages/` oder `presentation/` sieht kein Prüfer. Diese Lücke besteht fort.

## 12. Die Ratsche

**`design/design-debt.json` muss dem Ist-Zustand exakt entsprechen — in beide Richtungen.** Der Prüfer meldet nicht nur neue Verstöße, sondern auch `debt baseline is stale`, wenn eine Datei sauberer ist als eingetragen. Wer aufräumt, muss mit `npm run design:debt:sync` nachziehen, sonst bleibt der Prüfer rot. Wer einen Verstoß auf null bringt, verschwindet aus dem Scan und darf ohne Nachziehen nicht unbemerkt wieder auferstehen — deshalb wird auch jeder verschwundene Schlüssel gemeldet.

**Stufenplan** in `design/design-policy.json`, Schlüssel `debtCap`:

| Bis | Höchstschuld |
| --- | --- |
| 31.10.2026 | 8314 |
| 30.11.2026 | 6500 |
| 31.12.2026 | 4500 |
| 31.01.2027 | 2800 |
| 28.02.2027 | 1500 |
| 31.03.2027 | 600 |
| 30.04.2027 | 0 |

Eine verfehlte Stufe ist ein roter Build. Niemand muss sich an ein Datum erinnern.

**Stand 16.09.2026:** der Scan liefert **8314 Punkte in 71 Dateien** — `raw-value` 4991, `literal-color` 2425, `small-type` 627, `no-important` 112, `decorative-effect` 111, `unowned-style` 26, `state-class` 16, `visual-utility` 6. `design/design-debt.json` stand am selben Tag noch bei 3585 Punkten in 67 Dateien; die Nachführung mit `design:debt:sync` steht aus.

**Totes CSS.** 633 tote Klassennamen in den globalen Dateien (`design/design-report.json`) und 757 in CSS Modules (`design/design-deadcss.json`) sind eingefroren. Die Listen dürfen **nur schrumpfen**; eine neue tote Klasse ist ein Baufehler, eine alte zu löschen ist jederzeit erlaubt. Zur Laufzeit gemessen: 5697 geladene Regeln, davon greifen rund 1248.

**Drei Zähler als Ratsche** in `design/design-budgets.json` (16.09.2026): `!important` 112, in mehreren der vier globalen Dateien definierte Top-Level-Selektoren 45, Zustandsklassen 16. Jeder darf nur sinken; wer einen senkt, zieht mit `node scripts/eh-design-deadcss.mjs --sync` nach.

**Sechs dynamische Klassenstellen** stehen in `design/design-dynamic-classes.json` — dort steht der Klassenname nicht als Wort im Quelltext (`styles[size]`, `eh-toast-${kind}` …). Eine siebte Stelle anzulegen heißt, diese geschützte Datei zu ändern.

## 13. Telefon zuerst

Eine Hausakte wird auf dem Handy benutzt. Der Telefonbildschirm ist der Maßstab, nicht der Desktop — und nicht der Geschmack. Für App-Entwürfe gilt verbindlich:

- **vier Schriftgrößen: 28 / 20 / 17 / 15 px**. Nichts unter 15 px.
- **jedes Tippziel mindestens 44 × 44 px**
- **vier** Bereiche in der unteren Leiste; eine Beschriftung darf nicht umbrechen
- **Höhe ist eine Rechnung**, keine Geschmacksfrage: gerechnet wird gegen 844 px. Was unten halb abgeschnitten endet, ist ein Fehler, kein Stil.

**Gemessener Ist-Zustand** (16.09.2026, `/app` bei 390 × 844, laufender Build):

| Messung | `/app` | `/app/home` |
| --- | --- | --- |
| Seitenhöhe | 1948 px = 2,3 Bildschirme | 4045 px = 4,8 Bildschirme |
| Tippziele gesamt | 39 | 59 |
| davon unter 44 × 44 px | 22 | 31 |
| verschiedene Schriftgrößen auf einem Schirm | 6 (10–17 px) | 6 |

Tippziel-Maße und die vier Schriftgrößen sind **nicht maschinell geprüft** — kein Prüfer, kein Test und kein Workflow kennt sie. Sie gelten trotzdem verbindlich; die Abnahme erfolgt am Gerät.

## 14. Gattung: die App ist kein Dokument

Die App darf nicht aussehen wie ein Dokument und nicht wie eine Marketingseite. Drei Symptome, jedes für sich ein Rückschritt:

1. ein Marketingkopf mit 44-px-`h1`;
2. ein erklärender Fließtextblock unter der Überschrift — eine App erklärt sich nicht, sie zeigt Zustand;
3. alles in Karten, insbesondere eine Wand gleichförmiger, gleichgewichteter Kacheln.

**Richtung A „Werkbank" ist gesetzt:** Aufgaben zuerst, dichte Listen, viel Information pro Bildschirm, wenig Dekoration. Statt einer Kachelwand eine Werkzeugleiste; statt vier großer Kacheln eine Kennzahlenzeile.

Dieselbe Vorgangsliste ist in **drei umschaltbaren Ansichten** darzustellen: **Liste / Karten / Chronik**. Drei Darstellungen eines Bestands, nicht drei Seiten mit je eigener Logik. Die Liste ist der Standard. Eine Karte ist gerechtfertigt, wenn jedes Element ein eigenes, eigenständiges Ziel mit eigenem Bild ist — nicht als Verpackung einer Liste.

## 15. Navigation und Zustand

Zustand reist in ARIA, nicht in eine Klasse. Der aktive Navigationspunkt wird ausschließlich mit `aria-current="page"` markiert. `className` trägt Identität, nicht Zustand.

Echt ist `.workspaceNav a[aria-current="page"]` (`packages/eh-design/src/styles.module.css:344`, `packages/eh-design/src/html.css:344`). Die alte `.sidebar-nav` in `src/app/design-system.css` existiert im DOM **nicht** — kein Treffer in einer `.tsx` unter `src/`. Sie ist Altbestand in `eh-legacy` und wird nicht neu geschrieben.

Wer `className="active"` setzt, erzeugt eine Klasse ohne Wirkung — eine tote Klasse, die `design:deadcss` fängt, und einen Verstoß gegen `state-class`.

## Fachliche Kompositionen · Edition 2

Acht weitere festgelegte Seitenkompositionen in packages/eh-design/src/domain-recipes.tsx ergänzen die acht Grundrezepte. Verbindliche Auswahl, Daten-/Formularslots, vollständiger Code und lokaler Übernahmeauftrag: docs/brand/system/DOMAIN_RECIPES_HANDOFF.md. Keine neuen Farben, Styles oder Grundkomponenten; der Bausteinbestand richtet sich nach den Exporten von `packages/eh-design`, insgesamt 16 Seitenkompositionen. Neue Rendering-/Verhaltensprüfung und Verteilung sind an lokale Agenten delegiert.

## Verbindliche Komposition (7. September 2026)

Siehe `docs/brand/system/COMPOSITION.md` und `packages/eh-design/src/composition.tsx`. Vollständige Abschnitte statt vermischter Legacy-Layouts. EHProcess trennt Text/Medien; EHCaseStudy besitzt genau einen Abschnittskopf; EHProductExcerpt ist ein gekennzeichnetes Marketingbeispiel, keine echte App. Bestehende EHSteps bleiben reine Textschritte.

## Kontrastentscheidung 2026-09-07
Badge-Text auf Sand nutzt Ink; Terra nur als ergänzender Icon-Akzent. Verbindlicher Umfang und Nachweis: docs/brand/contrast/DECISION.md. Kein offener Brand-Blocker für pillTerra/Lexikon-Badges.

## App-Komposition 2026-09-08: bisherige gestalterische Abnahme zurückgewiesen
Jerry verlangt professionellen Neuaufbau innerhalb Atelier02. Verbindlicher Kandidat und Beweisgrenzen: docs/brand/workspace/NEXT_AGENT.md. Technische Gates und EH-Imports beweisen keine Produktgestaltung; keine neue visuelle Baseline ohne Begutachtung.

## Owner-Kohärenz 2026-09-13 — verbindlich für die vier Eigentümer-Routen

Der Operator hat am 13.09.2026 die Korrektur der vier Eigentümer-Routen `/app`, `/app/jobs`, `/app/calendar` und `/app/messages` angeordnet. Alle übrigen Flächen behalten ihre bisherigen Freigaben. Der Stand ist live: `/app`, `/app/jobs` und `/app/calendar` sind mit diesen Bausteinen gebaut, und die Telefonmessung vom 16.09.2026 zeigt genau diesen Kopf.

Leitlinien: gemeinsamer linker Blattrand, maximal 1320 px Inhaltsbreite, ein geteilter Owner-Kopf (44 px Desktop- / 32 px Mobile-H1, kurze Beschreibung, Aktion rechts), ein Profileintrag in der Sidebar, Benachrichtigungen plus Hausmanager in der Toolbar aller vier Routen. Inhalte stammen aus echten `jobs`, `quotes`, `appointments`, `provider_profiles`, `job_photos`, `homeowner_contacts` und Nachrichten; keine Mockdaten im Produkt.

Kanonische Bausteine in `packages/eh-design/src/workspace-owner.tsx` (bestehende Primitive unverändert): `EHOwnerPageHeader`, `EHOwnerSection`, `EHOwnerRecords` (+ Typ `EHOwnerRecord`), `EHOwnerFilters`, `EHOwnerSearch`, `EHOwnerLinks`, `EHOwnerWelcome`, `EHOwnerComposer`. Export über `packages/eh-design/src/index.ts` (`export * from "./workspace-owner"`), Styles als einmaliger `owner*`-Anhang in `packages/eh-design/src/styles.module.css`. Datums- und Wartungsdarstellung in `src/lib/owner-format.ts` (`ownerInstant` liest SQLite-Zeitstempel als UTC, `ownerDate` formatiert nach Europe/Berlin, `ownerMaintenanceState` vergleicht Kalendertage).

Diese Korrektur erlaubt die Aktualisierung des versiegelten Designkerns ausschließlich für die hier dokumentierten Owner-Bausteine. Design-Guard, Debt-Baseline, übrige Lock-Einträge und Prüfskripte bleiben unverändert.

## Ansprechpartner · Gina-Korrektur 2026-09-13 — neue Referenz

Gina Schulze hat über den Operator die bisherige App-Gestaltung als nicht zeitgemäß zurückgewiesen und eine konkrete Ansprechpartner-Hierarchie vorgegeben. Für `/app/messages` ist diese Referenz verbindlich; historische Freigaben verworfener Ansichten sind keine Abnahme dieses Entwurfs. Eine Übertragung der neuen Referenz auf alle App-Routen erfolgt nicht stillschweigend.

Die Bedienung führt ausschließlich über 17 Hauptkategorien → Unterkategorien → Kontakte. Die erste Ebene enthält keine vorgezogenen Kontakte, Unterkategorien, Zählerwand oder Illustration. „Kontakte verwalten“ ist ein separater Verwaltungsweg, damit auch noch nicht zugeordnete Bestandskontakte erreichbar bleiben. Alle 110 Unterkategorien stehen vollständig in `docs/brand/contact-directory/TAXONOMY.md` und `src/lib/contact-directory-taxonomy.ts`. Nur ausdrücklich genannte Vorgaben sind als Gina-Vorgaben gekennzeichnet; Ergänzungen sind keine behauptete Einzelabnahme. Marketing-Katalog und Partner-Matching werden nicht umbenannt.

Neue Arbeitsgrammatik: kompakte Inter-Überschrift mit Gewicht 650 und maximal 38 px, klare Textzeilen in einer gemeinsamen weißen Navigationsfläche, 16-px-Nutztext, zurückhaltende Konturen, erkennbare native Controls und ein eindeutiger nächster Schritt. Keine Emoji- oder Initialen-Kachelwand, kein dekorativer Bild-Hero, keine Statistikboxen, keine übergroßen Marketingüberschriften. Hauptkategorien stehen auf Desktop in drei, auf Tablet in zwei und mobil in einer Spalte; Unterkategorien maximal in zwei. Jede Zeile bleibt ein echtes Link-Ziel. Die originale Wortbildmarke, selbst gehostete Inter, Palette und bestehende AppShell bleiben unverändert. Dies ist keine neue globale Farbwelt.

`EHContactWorkspace` und `EHDirectoryEditor` in `packages/eh-design/src/workspace-contact-directory.tsx` sind die vollständigen kanonischen Bausteine. Ihre explizit gescopten `directory*`-Styles liegen ausschließlich als Zusatz in `packages/eh-design/src/styles.module.css`. `EHConversation` und der bestehende Nachrichten-Composer werden unverändert weiterverwendet; nur der doppelte Gesprächskopf wird innerhalb des neuen Detail-Slots ausgeblendet, Kontaktdaten bleiben im Detail sichtbar. Keine route-lokale CSS-Kopie.

Ein persönlicher Kontakt ist ein Datensatz mit eigenen Zuordnungszeilen. Beim Anlegen reicht die ursprünglich gewählte Unterkategorie. Weitere Checkboxen desselben Hauptbereichs sind optional. Bestehende Kontakte werden wiederverwendet, nicht für jede Leistung kopiert. Zuordnungen bleiben bearbeitbar; Änderungen an einer Gruppe lassen andere Gruppen unberührt. Namensgleichheit ist kein Identitätsbeweis. Unklare Altbereiche bleiben gespeichert und werden nicht automatisch zu konkreten Leistungsbehauptungen. Freie Kontakte besitzen keine künstlichen Partner- oder Auth-Konten und keinen vorgetäuschten App-Chat.

Der Root liefert sämtliche UI-Quellen und genauen Austauschblöcke. Implementer dürfen keine eigene Gestaltungsinterpretation ergänzen. Für dieses konkrete Paket ist ausschließlich eine dokumentierte Aktualisierung der Prüfsummen von `DESIGN.md`, `packages/eh-design/src/index.ts` und `packages/eh-design/src/styles.module.css` nach Root-Prüfung autorisiert; die neue Quelldatei wird gegebenenfalls mit ihrem exakten Hash aufgenommen. Guard, Workflow, Debt-Baseline, Tokens und sonstige Lock-Einträge bleiben unverändert. Grüne Tests beweisen Verhalten, keine visuelle Zustimmung von Gina.

## Kopf-Menüleiste 2026-09-22 — verbindlich für die Werkbank-Kopfzeile

Jerry hat am 22.09.2026 die Referenz-Menüleiste (21st.dev-Menü als Vorbild: schlanke Bar, reine Icon-Reihen in den Dropdowns) als verbindliche Kopfzeile angeordnet und dafür ausdrücklich Abweichungen von den bisherigen Regeln freigegeben. Für die Werkbank-Kopfzeile gilt diese Referenz; historische Freigaben anderer Kopf-Varianten sind keine Abnahme dieses Entwurfs.

Komposition in `src/components/header-menu.tsx` (Consumer-Code, keine versiegelten Dateien): Suchen (öffnet die Bereichssuche), Aufträge (Menü: Neuer Auftrag — direkt oder über einen der 12 Bereiche aus `SERVICE_CATEGORIES` ins passende Hausmeister-Thema via `?topic=`-Hinweis —, laufende Aufträge, Alle Aufträge, Alle Termine), Benachrichtigung (neueste Mitteilungen, Alle ansehen). Zahlen nur aus echten `jobs`, `appointments` und `notifications` (offen, bestätigt-bevorstehend, ungelesen); keine Mock-Zähler im Produkt. Neuer Menüpunkt Kalender existiert nicht; „Alle Termine“ lebt im Aufträge-Menü.

Ausdrücklich freigegebene Abweichungen nur für diese Komponente: 40-px-Ziele statt des 44-px-Touch-Floors aus § Form/Abstand, `font-medium` statt `semibold` in der Leiste, schlankere Zeilenabstände. Farben, Schrift, Radien und Schatten bleiben Token (`ink`, `paper`, `line`, Panel-Radius/Schatten) — keine zweite Palette, keine Slate-Werte im Produkt. Guard, Debt-Baseline, Token und versiegelter Kern bleiben unverändert; die Prüfskripte melden für diese Komponente keinen neuen Verstoß. Grüne Tests beweisen Verhalten, keine visuelle Zustimmung.
