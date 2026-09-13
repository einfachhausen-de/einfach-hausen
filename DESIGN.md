# Einfachhausen · Designsystem 1.0

**Verbindlich seit 6. September 2026.** Jerry hat Atelier 02 ausdrücklich angenommen: „omg das ist MEGA!“ Diese Freigabe ersetzt den früheren Status „noch nicht visuell freigegeben“. Die drei alten Stilproben aus PR40 sind verworfen. Der angenommene Entwurf und seine ursprüngliche Begutachtung bleiben unter `design/brand-atelier/` und `docs/brand/ATELIER_02.md` als historische Referenz erhalten.

## 1. Autorität und Geltungsbereich

Dieses Dokument und `packages/eh-design/` definieren die Marke für Website, Unterseiten, Hausakte, Owner-App, Handwerker-App, CRM, Portalhub und Präsentationen. **Andere Agenten dürfen das Design nicht eigenständig verändern.** Der Auftrag, eine neue Seite zu bauen, ist keine Erlaubnis, Farben, Schrift, Logo, Radien, Effekte oder eine eigene Komponentenfamilie zu erfinden. Nur eine ausdrückliche Anweisung von Jerry zum Markendesign autorisiert eine neue Designversion. Ein fehlender Baustein wird als Bedarf dokumentiert; bis zur Entscheidung wird eine bestehende passende Komposition verwendet.

Inhalt, Reihenfolge, Seitenstruktur, echte Bilder, fachliche Daten, erlaubte Komponentenvarianten und bestehende Aktionen dürfen passend zum Thema kombiniert werden. Unterschiedliche Seiten sollen unterschiedlich aufgebaut sein. Einheitlichkeit bedeutet gemeinsame Gestaltungssprache, nicht identische Seiten.

Bei widersprüchlichen alten Dokumenten gilt diese angenommene Version. Historische Freigaben, Screenshots und Aufgaben bleiben nachvollziehbar, dürfen aber nicht als heutige Gestaltungsanweisung wiederverwendet werden.

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
| `packages/eh-design/src/tokens.json` | Kanonische, versionierte Werte |
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
| Unterseiten-H1 | 44–68 px |
| App-H1 | 32–44 px |
| Präsentation bei 1920×1080 | Bild-/Fußtexte mindestens 24 px, Inhalt 32–36 px, Titel 56–88 px |

Eine überladene Folie wird inhaltlich aufgeteilt. Text wird nicht bis zur Unlesbarkeit verkleinert oder abgeschnitten. Numerische Schritte bleiben ungebrochen. Absätze haben kurze, sinnvolle Leselängen; lange Fachtexte kommen in `EHProse`.

### Form, Abstand und Bewegung

Eingaben und Schaltflächen: 6 px Radius. Funktionale Panels: 8 px. Fotografien und Aktenumschläge: die kanonische Hauskante. Touch-Ziele mindestens 44×44 px, reguläre Buttons 48 px hoch. Sichtbarer Fokus mit 3-px-Kontur und Abstand, keine Entfernung ohne gleichwertigen Ersatz.

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

Die Vorlagen nehmen Inhalte und echte Handler als Props entgegen. Datenzugriff, Authentifizierung, Routing, Speicherung und Beauftragung werden aus dem bestehenden Produkt angebunden. Die Browserbibliothek enthält gekennzeichnete Vorschauhandlungen und Beispieldaten; sie sind keine produktiven Endpunkte. Keine Vorschau-Antwort oder Beispieladresse wird in eine echte App übernommen.

Eine neue Seite beginnt mit der passenden vollständigen Vorlage. Fachlich begründete Umstellungen mit vorhandenen Blöcken sind erlaubt. Eine neue Seitenfarbe, Schrift oder lokale Komponentenfamilie ist es nicht.

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

## 7. Schutz vor unbeabsichtigter Änderung

`node scripts/eh-design-generate.mjs --check` verhindert Abweichungen generierter Tokens.
`node scripts/eh-design-check.mjs` prüft die versiegelten Kerndateien und neue Verstöße.
`node --test scripts/eh-design-check.test.mjs` beweist Positiv- und Negativfälle.
`node scripts/eh-design-browser.mjs` prüft die echte Bibliothek auf responsives Verhalten, WCAG-Meldungen, Lesbarkeit und Bedienung.

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


## Fachliche Kompositionen · Edition 2

Acht weitere festgelegte Seitenkompositionen in packages/eh-design/src/domain-recipes.tsx ergänzen die acht Grundrezepte. Verbindliche Auswahl, Daten-/Formularslots, vollständiger Code und lokaler Übernahmeauftrag: docs/brand/system/DOMAIN_RECIPES_HANDOFF.md. Keine neuen Farben, Styles oder Grundkomponenten; 49 Basisbausteine, insgesamt 16 Seitenkompositionen. Neue Rendering-/Verhaltensprüfung und Verteilung sind an lokale Agenten delegiert.

## Verbindliche Komposition (7. September 2026)

Siehe `docs/brand/system/COMPOSITION.md` und `packages/eh-design/src/composition.tsx`. Vollständige Abschnitte statt vermischter Legacy-Layouts. EHProcess trennt Text/Medien; EHCaseStudy besitzt genau einen Abschnittskopf; EHProductExcerpt ist ein gekennzeichnetes Marketingbeispiel, keine echte App. Bestehende EHSteps bleiben reine Textschritte.

## Kontrastentscheidung 2026-09-07
Badge-Text auf Sand nutzt Ink; Terra nur als ergänzender Icon-Akzent. Verbindlicher Umfang und Nachweis: docs/brand/contrast/DECISION.md. Kein offener Brand-Blocker für pillTerra/Lexikon-Badges.

## App-Komposition 2026-09-08: bisherige gestalterische Abnahme zurückgewiesen
Jerry verlangt professionellen Neuaufbau innerhalb Atelier02. Verbindlicher Kandidat und Beweisgrenzen: docs/brand/workspace/NEXT_AGENT.md. Technische Gates und EH-Imports beweisen keine Produktgestaltung; keine neue visuelle Baseline ohne Begutachtung.


## Owner-Dashboard-Komposition 2026-09-11 — visuell freigegeben

Jerry hat die neue Eigentümer-Startseite anhand des konkreten Desktop-Mockups ausdrücklich mit „Perfekt. Genauso“ freigegeben. Diese Freigabe erweitert Atelier 02 ausschließlich um die Komposition der Owner-Startseite `/app`; sie ist keine allgemeine Erlaubnis für autonome Rebrandings anderer Routen.

Die freigegebene Hierarchie ist verbindlich:

1. ruhiger App-Kopf mit Register `ÜBERSICHT`, persönlicher Begrüßung, realer Objektadresse und einer zurückhaltend beschnittenen vorhandenen Hausfotografie;
2. erste Arbeitsebene aus großem `Hausstatus` und schmalem `Dein nächster Überblick`;
3. `Hausstatus` bündelt genau die wesentlichen nächsten Entscheidungen in einer gemeinsamen Fläche statt vieler gleichgewichteter Kacheln;
4. der bestehende Hausmeister-Composer erhält eine eigene große Arbeitsfläche mit Foto-, Sprach- und Sendeaktion; rechts stehen ruhige Beispiele für Anliegen;
5. die nachgelagerte Orientierung besteht aus den Bereichen `Für dein Zuhause`, `Deine Hausakte` und `Mein Jahr`;
6. echte Backenddaten, Rollenlogik, Navigation, Uploads, Sprache, Draft-Persistenz und Serveraktionen bleiben erhalten.

Die Gestaltung bleibt innerhalb der kanonischen Tokens: Papier, Weiß, Petrol, tiefes Petrol, Tinte, Sekundärtext und Linie. Keine neue Palette, keine Verläufe, kein Glassmorphism, keine dekorativen Schatten, keine frei erfundenen Radien und keine lokale CSS-Familie im Consumer.

Für diese Komposition sind `EHOwnerDashboardHeader`, `EHOwnerDashboardTopGrid`, `EHOwnerDashboardStatus`, `EHOwnerDashboardOverview`, `EHOwnerDashboardComposer` und `EHOwnerDashboardUtilityGrid` die kanonischen Bausteine in `packages/eh-design/src/workspace.tsx`. Die visuelle Umsetzung liegt ausschließlich in `packages/eh-design/src/styles.module.css`.

Die Desktop-Referenz zeigt eine klare Reihenfolge statt einer Dashboard-Kachelwand. Auf kleineren Viewports darf die Reihenfolge responsiv untereinander fließen; Inhalte, Aktionen und fachliche Priorität dürfen dabei nicht verschwinden. Horizontales Seiten-Scrolling ist nicht zulässig.

Diese Freigabe erlaubt die Aktualisierung des versiegelten Designkerns ausschließlich für die hier dokumentierten Owner-Dashboard-Bausteine. Sie erlaubt nicht, Design-Guard, Debt-Baseline oder andere geschützte Regeln abzuschwächen.


## Owner-Aufträge 2026-09-11 — visuell freigegeben

Jerry hat die neue Eigentümer-Auftragsübersicht anhand des konkreten 1536×876-Referenzbildes ausdrücklich zur exakten Umsetzung freigegeben.

Die Freigabe erweitert die Owner-App-Komposition innerhalb Atelier 02. Sie erlaubt keine zweite Palette und keine abweichende AppShell.

Verbindliche Informationshierarchie von `/app/jobs`:

1. ruhiger Auftrags-Hero mit Register `AUFTRÄGE`, zweizeiliger Hauptaussage, kurzer Erklärung, bestehender Hausfotografie und echter Objektadresse;
2. funktionale Suche nach vorhandenen Aufträgen;
3. vier gleich hohe Übersichtsflächen für `Offene Aufträge`, `In Bearbeitung`, `Abgeschlossen` und `Neuen Auftrag erstellen`;
4. aktuelle Aufträge als kompakte horizontale Arbeitsliste, nicht als große Kachelwand;
5. reale Auftragsmedien dürfen als kleines Thumbnail erscheinen; ohne echtes Bild bleibt die Darstellung neutral;
6. jede Zeile zeigt Titel, fachliche Kategorie, tatsächlichen Status, vorhandenen Termin oder Wunschtermin und einen eindeutigen `Details`-Zugang;
7. abschließender Hilfebereich führt zurück zum bestehenden Hausmeister-Intake.

Zahlen werden ausschließlich aus realen `jobs` berechnet. Statische Demo-Zähler, erfundene Termine, erfundene Anbieter oder künstliche Auftragsbilder sind in der Produktansicht verboten.

Die kanonischen Bausteine liegen in `packages/eh-design/src/workspace-records.tsx`:

- `EHOwnerOrdersHero`
- `EHOwnerOrdersStats`
- `EHOwnerOrdersList`
- `EHOwnerOrdersSupport`

Ihre Styles liegen ausschließlich in `packages/eh-design/src/styles.module.css`.

Die bestehende globale Owner-Shell bleibt unabhängig davon kanonisch. Das Aufträge-Referenzbild darf nicht benutzt werden, um pro Route unterschiedliche Sidebars oder Topbars zu erfinden.

Desktop priorisiert die horizontale, ruhige Listenstruktur. Tablet und Mobile dürfen die Informationen stapeln, ohne Inhalte oder Aktionen zu entfernen. Horizontaler Seiten-Overflow ist nicht zulässig.


## Owner-Kohärenz 2026-09-13 — Operator-Korrektur, Abnahme und Deploy ausstehend

Der Operator hat am 13.09.2026 eine Korrektur der vier Eigentümer-Routen `/app`, `/app/jobs`, `/app/calendar` und `/app/messages` angeordnet. Sie ersetzt die Kompositionen aus „Owner-Dashboard-Komposition 2026-09-11“ und „Owner-Aufträge 2026-09-11“ ausschließlich für diese vier Routen; alle übrigen Flächen behalten ihre bisherigen Freigaben. Weder eine visuelle Abnahme noch ein Deploy sind bisher erfolgt; Screenshots und Review stehen aus.

Leitlinien der Korrektur: gemeinsamer linker Blattrand, maximal 1320 px Inhaltsbreite, ein geteilter Owner-Kopf (44 px Desktop- / 32 px Mobile-H1, kurze Beschreibung, Aktion rechts), ein Profileintrag in der Sidebar, Benachrichtigungen plus Hausmanager in der Toolbar aller vier Routen. Inhalte stammen aus echten `jobs`, `quotes`, `appointments`, `provider_profiles`, `job_photos`, `homeowner_contacts` und Nachrichten; keine Mockdaten im Produkt.

Kanonische Bausteine in `packages/eh-design/src/workspace-owner.tsx` (neue Datei, bestehende Primitive unverändert): `EHOwnerPageHeader`, `EHOwnerSection`, `EHOwnerRecords` (+ Typ `EHOwnerRecord`), `EHOwnerFilters`, `EHOwnerSearch`, `EHOwnerLinks`, `EHOwnerWelcome`, `EHOwnerComposer`, `EHOwnerContacts`. Export über `packages/eh-design/src/index.ts` (`export * from "./workspace-owner"`), Styles als einmaliger `owner*`-Anhang in `packages/eh-design/src/styles.module.css`. Datums- und Wartungsdarstellung in `src/lib/owner-format.ts` (`ownerInstant` liest SQLite-Zeitstempel als UTC, `ownerDate` formatiert nach Europe/Berlin, `ownerMaintenanceState` vergleicht Kalendertage).

Diese Korrektur erlaubt die Aktualisierung des versiegelten Designkerns ausschließlich für die hier dokumentierten Owner-Bausteine. Design-Guard, Debt-Baseline, übrige Lock-Einträge und Prüfskripte bleiben unverändert; die notwendige Lock-Aktualisierung (drei Einträge) wird der Designautorität als Vorschlag vorgelegt, nicht selbst versiegelt.
