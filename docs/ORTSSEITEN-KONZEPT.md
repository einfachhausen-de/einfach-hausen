# Ortsseiten-Konzept — einfachhausen.de

Stand 16.09.2026 (Fassung 2 — Geltungsbereich auf **deutschlandweit** korrigiert).
Grundlage: `SEO-AUDIT.md` (Befund B3), Live-Abruf der Sitemap, Quellcode bei `a91a44d`.

**Was sich gegenüber Fassung 1 geändert hat:** Der Auftrag lautet „alle Regionen, erstmal
Deutschland, später pro Land" — nicht eine Pilotregion. Der damalige Blocker („welche
Region?") ist damit weg, aber die Skalierung wird zum eigentlichen Problem. Die
Schwellenregel wurde entsprechend von einer Partner-Verfügbarkeits-Regel auf eine
**Substanz-Regel** umgestellt, und es gibt zwei neue Abschnitte: die Wahl zwischen Gemeinde-
und Landkreis-Ebene sowie die Länderfestigkeit der URL.

---

## Die Lücke

62 URLs im Sitemap, davon 13 Leistungen, 26 Lexikon-Begriffe, 4 Ratgeber.
**Kein einziger Ort.** Dabei ist das Produkt selbst regional: „Verfügbarkeit hängt vom
regional aktiven Partnernetz ab" steht in der eigenen FAQ.

Was ein Eigenheimbesitzer tatsächlich sucht, ist fast nie die Leistung allein, sondern
die Leistung **plus Ort**:

- „Handwerker Regensburg"
- „Heizung wartung Kosten Landshut"
- „Dachdecker in der Nähe" (deren Ranking entscheidet sich über lokale Signale)
- „Sanitär Notdienst Passau"

Gegen „Wärmepumpe" gewinnt man gegen Wikipedia, Heise und Hersteller nie. Gegen
„Wärmepumpe Regensburg" gewinnt man gegen die halbe Republik, weil dort fast nur
Handwerker-Websites aus der Region stehen — und die haben meistens keine strukturierte
Seite zu dem Thema. **Das ist der einzige Teil des Suchraums, in dem ein neues Portal
gegen MyHammer und Check24 überhaupt eine Chance hat.**

Der Lexikon-Cluster deckt den überregionalen Teil schon gut ab (26 Begriffe).
Es fehlt die zweite Achse: der Ort. Und zwar — anders als in Fassung 1 angenommen —
**nicht nur in einer Pilotregion, sondern überall dort, wo Menschen wohnen.**

---

## Geltungsbereich: deutschlandweit — und warum das schwerer ist, nicht leichter

Einfach Hausen bedient **alle Regionen Deutschlands**; weitere Länder sind später geplant.
Der Blocker aus der ersten Fassung dieses Dokuments („welche Pilotregion?") ist damit
beantwortet: keine einzelne — alle.

**Das macht die Aufgabe aber nicht kleiner, sondern größer.** Solange eine Region geplant
war, war die Seitenzahl von selbst begrenzt. Deutschlandweit lautet die naheliegende
Rechnung jetzt:

> 13 Leistungen × 10.700 Gemeinden = **139.100 Seiten**

10.700 ist die Zahl der politischen Gemeinden in Deutschland. Das ist keine Übertreibung,
und es ist der schnellste Weg, die Domain zu beschädigen.

---

## Die Falle, in die man hier zwangsläufig läuft

Google hat zwei Policies, die beide genau passen:

- **Doorway Pages** — Seiten, die nur existieren, um für ähnliche Suchanfragen zu ranken
  und Nutzer auf ein Ziel zu leiten, ohne eigenen Inhalt.
- **Scaled Content Abuse** (seit März 2024) — massenhaft erzeugte Seiten, die keinen
  eigenen Wert beitragen. Adressiert ausdrücklich das Muster „Stadtname austauschen,
  Rest identisch".

Dazu kommt ein Problem, das nichts mit Google zu tun hat: **eine Zusage, die die Seite
nicht halten kann.** „Dachdecker in <Ort>" ist erst dann wahr, wenn vor Ort auch ein Betrieb
anspringt. Die eigene FAQ sagt: „Verfügbarkeit hängt vom regional aktiven Partnernetz ab."
Deutschlandweit zu **arbeiten** heißt nicht, überall gleich gut zu **sein**.

Daraus folgen zwei Regeln:

1. Eine Ortsseite braucht Substanz, die es **nur für diesen Ort** gibt. Immer. Ohne Ausnahme.
2. Eine Seite, die ein Gewerk bewirbt, für das vor Ort kein Betrieb da ist, sagt das —
   oder sie wird nicht gebaut.

---

## Die Skalierungsentscheidung: Gemeinde oder Landkreis?

Deutschland hat ~10.700 Gemeinden und ~400 Landkreise. Der Unterschied ist die ganze Frage.

| Ebene | Anzahl | Urteil |
|---|---|---|
| Gemeinde / Stadt | ~10.700 | Nur für Orte mit echtem Suchvolumen. **Nie vollständig.** |
| Landkreis | ~400 | **Die richtige Ebene für die Fläche.** 400 Seiten sind machbar, 10.700 nicht |
| Bundesland | 16 | Zu grob für „Handwerker in der Nähe" |

**Empfehlung: zwei Ebenen.**

- **Städte** mit eigenem Suchvolumen (grob die Top 100–150 Haushaltszahlen) bekommen eine
  eigene Seite: `/handwerker/<stadt>`.
- **Alles andere** bekommt eine Seite je **Landkreis**: `/handwerker/<landkreis>`, die die
  Städte und Gemeinden darin nennt und verlinkt. Wer „Dachdecker in <kleiner Ort>" sucht,
  landet dort und findet die Nachbarorte.

Das ist ehrlich, weil es der Realität entspricht: Ein Betrieb in Landshut bedient die ganze
Region, nicht die Stadtgrenze. Und es hält die Seitenzahl bei **~500 statt 139.000** — bei
etwa gleicher Abdeckung.

**Achtung, doppelte Ortsnamen.** Deutschland hat mehrere „Neustadt", „Berg", „Kirchheim",
„Sankt Johann". Ein Slug aus dem Namen allein ist **nicht eindeutig**. Deshalb braucht jeder
Ort einen amtlichen Schlüssel in den Daten — den Gemeindeschlüssel (AGS, z. B. `09162000`
für München). In der URL reicht PLZ + Name, der lesbar und trotzdem eindeutig ist:
`/handwerker/84034-landshut`. **AGS intern, PLZ+Name nach außen.**

---

## URL-Struktur

Empfehlung: **`/handwerker/<ort>`**

| Variante | Bewertung |
|---|---|
| `/handwerker/<ort>` | **Empfehlung.** Trifft die Suchanfrage wörtlich, ein Pfad pro Ort, keine Kombinatorik |
| `/regionen/<ort>` | Markensprachlich reiner („Ansprechpartner", nicht „Handwerker"), Keyword schwächer |
| `/leistungen/<leistung>/<ort>` | Führt genau in die 139.000-Seiten-Falle. Nicht bauen |
| `/<ort>` | Kollidiert mit bestehenden Routen, nicht skalierbar |

`/ansprechpartner/<ort>` scheidet aus: `/ansprechpartner` ist bereits eine **funktionale
App-Route**, steht bewusst nicht im Sitemap und trägt `noindex` (`src/app/ansprechpartner/layout.tsx`).
Zwei Dinge unter demselben Pfadpräfix — eines davon unsichtbar — ist eine Verwechslung, die
später jemand debuggt.

Slug-Format: Kleinschreibung, keine Umlaute im Pfad (`/handwerker/luebeck`, nicht
`/handwerker/lübeck`) — der Sitemap-Generator macht das über `encodeURI` schon richtig.

### Länderfest bauen — jetzt entscheiden, nicht später

„Später pro Land" klingt wie ein Zukunftsthema, ist aber eine **Entscheidung von heute**.
Sobald Ortsseiten unter `/handwerker/<ort>` indexiert sind, kostet ein nachträgliches
Länder-Segment (`/de/handwerker/<ort>`) eine **Migration aller Orts-URLs**: Redirects, neues
Crawling, Wochen verlorenes Ranking.

| Variante | Deutschland heute | Zusatzland später | Migration? |
|---|---|---|---|
| `/handwerker/<ort>` auf `einfachhausen.de` | kurz und sauber | eigenes Land auf eigener Domain/Subdomain (`at.einfachhausen.de`) | **nein** |
| `/de/handwerker/<ort>` | ein Segment mehr | `/at/handwerker/<ort>` | nein, aber DE-URLs unnötig lang |
| später `/de/…` nachrüsten | kurz | — | **ja, teuer** |

**Empfehlung: `/handwerker/<ort>` beibehalten.** Die Domain `einfachhausen.de` *ist* das
Länderkennzeichen; ein zusätzliches `/de/` wäre Redundanz. Weitere Länder bekommen eine
eigene Domain oder Subdomain je Land plus `hreflang` — das ist ohnehin sauberer als ein
Pfadsegment, weil jedes Land eigene Rechtstexte, eigene Währung und eigene Partnerverträge
braucht.


---

## Was eine Ortsseite enthalten muss

Die Prüffrage ist nicht „ist der Stadtname drin?", sondern **„könnte diese Seite auch für
eine andere Stadt existieren?"** Wenn ja, ist sie eine Doorway-Page.

Inhalt, in dieser Reihenfolge:

1. **H1 mit Ort und Nutzen**, nicht mit Keyword-Stapel.
   Gut: „Dein Ansprechpartner fürs Haus in Landshut". Schlecht: „Handwerker Landshut — Sanitär, Heizung, Elektro".
2. **Ein ehrlicher Absatz zur Lage vor Ort**: welche Gewerke aktuell im Netz sind, wie
   schnell jemand reagiert, was noch fehlt. Genau hier trennt sich die Seite von jeder
   generierten Variante.
3. **Abgedeckte Gebiete, konkret** — Stadtteile und PLZ, nicht „Umgebung".
4. **Was vor Ort typisch ist**: Gebäudebestand, Baujahre, häufige Anliegen.
   In einer Stadt mit viel Nachkriegsbestand sind Heizungstausch und Schimmel andere
   Themen als in einer mit Neubaugebieten (Wallbox, PV, Smart Home).
5. **Regionale Kostenrahmen** — siehe „Der eigentliche Hebel" unten.
6. **Lokale Fakten**, die man nachschlagen muss: zuständige Handwerkskammer, regionaler
   Entsorger, Sperrmüll-Regeln, Besonderheiten bei Genehmigungen. Diese Fakten sind
   überprüfbar — und ihre Prüfung ist die Arbeit, die eine Doorway-Page nicht leistet.
7. **FAQ mit echten lokalen Fragen** („Kommt ihr auch nach <Stadtteil>?", „Wie lange
   dauert die Anfahrt nach <Nachbarort>?").
8. **Brotkrumen** und interne Links zum passenden Leistungs- und Lexikon-Cluster.

**Ein Abschnitt, der ehrlich sein muss:** Wenn ein Gewerk vor Ort nicht besetzt ist, steht
das auf der Seite — „Für Dachdecker in Landshut suchen wir noch Betriebe". Das ist
erstens wahr, zweitens besser als eine Zusage, die man nicht halten kann, und drittens
**das beste Vertriebsmaterial für die Partner-Akquise**: Die Seite zeigt einem Betrieb
schwarz auf weiß, dass in seiner Region eine Lücke ist. Siehe `BACKLINK-AKQUISE.md`.

---

## Die Schwellenregel (der Schutz gegen Doorway-Pages)

Fassung 1 hatte hier eine **Partner-Verfügbarkeits-Regel** („mind. 3 Betriebe vor Ort").
Die funktioniert nur, solange man eine Pilotregion hat. Deutschlandweit würde sie fast
jede Seite verbieten — und damit das Produkt dort klein halten, wo es gerade wachsen soll.

Die Regel muss deshalb am **Inhalt** hängen, nicht an der Verfügbarkeit. Eine Ortsseite geht
**nur** online, wenn alle drei Bedingungen erfüllt sind:

- mindestens **zwei Abschnitte mit Inhalt, den es ausschließlich für diesen Ort gibt** —
  echte Daten aus dem eigenen System oder nachgeschlagene lokale Fakten (siehe unten),
- eine **belastbare Stichprobe** für den Kostenindex dieser Zelle (sonst ist der Bereich
  Zufall und keine Information),
- ein **ehrlicher Verfügbarkeitshinweis**: welches Gewerk vor Ort besetzt ist und welches
  nicht. Die Lücke wird benannt, nicht verschwiegen.

Der dritte Punkt ersetzt die alte Partner-Schwelle. Er ist die bessere Regel: Er verbietet
nichts, er zwingt zur Wahrheit. „Sanitär in <Ort>: 6 Betriebe im Netz. Dachdecker suchen wir
dort noch." ist eine Seite, die einem Menschen hilft — und genau das, was eine Doorway-Page
nie liefert.

Diese Regel muss **als Code prüfbar** sein, nicht als Vorsatz: Der Sitemap-Generator liest
die Ortsliste aus einer Datenquelle, und ein Ort ohne zwei ortsfremde Abschnitte kommt gar
nicht erst in die Liste. **Kein `noindex` als Notnagel** — Seiten, die man baut und dann
versteckt, sind der Beweis, dass man sie nicht hätte bauen sollen.

---

## Umfang und Reihenfolge

| Phase | Umfang | Bedingung |
|---|---|---|
| 1 | **Top-Städte** (~20–40), die das Suchvolumen hergeben | Schwellenregel erfüllt |
| 2 | Rest der **Top 100–150 Städte** | Datenlage je Stadt reicht |
| 3 | **Landkreise** (~400) für die Fläche | Städte laufen, Muster steht |
| 4 | Gewerke vertiefen — **als Abschnitt auf derselben Seite, nicht als eigene URL** | Nachfrage-Daten belegen es |

Phase 4 bewusst als **Abschnitt statt Unterseite**: `#heizung` auf der Ortsseite hat
denselben Suchintent-Effekt bei einem Bruchteil des Risikos. Eine eigene URL erst, wenn
ein Abschnitt so groß wird, dass er die Seite sprengt.

**Was nicht passiert:** Gemeinden unterhalb der Landkreis-Ebene bekommen keine eigene Seite.
Wer „Dachdecker in <Dorf>" sucht, findet die Landkreisseite — und dort die Nachbarorte.
Das ist für den Suchenden in Ordnung und für die Domain überlebenswichtig.

Plus eine Übersichtsseite `/handwerker`, die alle aktiven Orte verlinkt. Sie ist der
Einstieg für Crawler und für Menschen — ohne sie hängen die Ortsseiten in der Luft.

---

## Structured Data

Die vorhandenen Bausteine in `src/lib/seo.ts` sind dafür schon richtig gebaut und werden
nur erweitert:

- **Erst korrigieren, dann erweitern.** `areaServed` lautet heute wörtlich „Regionale
  Pilotgebiete in Deutschland — konkrete Verfügbarkeit hängt vom aktiven Partnernetz vor
  Ort ab" (`src/lib/seo.ts:82-83`, `:12` in `service-detail-page.tsx`). Wenn das Angebot
  **deutschlandweit** gilt, untertreibt dieser Satz nicht nur, er widerspricht dem
  Geschäft. Richtig ist eine ehrliche Zweiteilung:
  ```json
  { "@type": "Country", "name": "Deutschland" }
  ```
  als `areaServed` auf der Ebene des Anbieters — plus der Hinweis auf die Verfügbarkeit im
  Fließtext, nicht im Schema. Die **Pilotphase** bleibt wahr („die ersten 1.000 Haushalte"),
  aber sie ist eine *zeitliche* Aussage, keine *geografische*. Beides zu vermischen war der
  Fehler. `src/lib/seo.ts` ist nicht design-geschützt und kann das direkt tragen.
- Pro Ortsseite ein `Service`-Block mit `areaServed: <City>`:
  ```json
  { "@type": "City", "name": "Landshut", "containedInPlace": { "@type": "State", "name": "Bayern" } }
  ```
  Der Anbieter bleibt derselbe (`provider: { "@id": "<site>#organisation" }`), nur das
  Gebiet ist lokal. Das ist genau die Aussage, die stimmt: **ein Anbieter, deutschlandweit,
  mit regional unterschiedlicher Verfügbarkeit.**
- `BreadcrumbList` mit drei Stufen: Start → Handwerker → Ort.
- **Kein `LocalBusiness` mit erfundener Adresse.** Ein virtueller Sitz darf nicht als
  Filiale ausgegeben werden. Wenn es keine Geschäftsstelle vor Ort gibt, gibt es kein
  lokales `LocalBusiness` — die Ehrlichkeit der bestehenden Bausteine ist hier der
  Maßstab, nicht das Maximum an Auszeichnung.

---

## Internes Verlinken

Die Ortsseiten dürfen nicht nur von der Übersichtsseite aus hängen:

- Von `/leistungen` aus auf die Orte verlinken, wo die Leistung tatsächlich verfügbar ist.
- Von jedem Lexikon-Begriff mit lokalem Bezug (Heizung, Schimmel, Energieausweis) auf die
  passenden Ortsseiten.
- Von den Ortsseiten zurück ins Lexikon und in den Ratgeber — der Ort ist die Tür, das
  Wissen ist das Ziel.
- **Kein Link aus der Hauptnavigation.** Ortsseiten sind Ziel, nicht Struktur; in der
  Navigation würden sie die Hauptseiten verwässern.

---

## Der eigentliche Hebel: der regionale Kostenindex

Das ist der Teil, der aus „wir haben auch Ortsseiten" einen Vorsprung macht.

**Einfach Hausen sitzt auf Daten, die sonst niemand hat.** Jede Anfrage über die Plattform
enthält Leistung, PLZ und den tatsächlichen Kostenrahmen, den ein Betrieb genannt hat.
`src/lib/seo-cluster.ts` sagt es selbst: „Kostenrahmen = Orientierung aus Anfrageverläufen,
kein Angebot". Diese Daten sind regional verschieden — Handwerkerpreise unterscheiden sich
zwischen Stadt und Land, zwischen Ballungsraum und ländlichem Kreis teils erheblich.

Daraus wird der **regionale Kostenindex**: pro Region und Gewerk ein Bereich
(„Heizungswartung in der Region Landshut: 90–180 €, Stand Q3 2026"), mit Methodik und
Stichprobengröße offengelegt.

Warum das dreifach wirkt:

1. **Es ist einzigartiger Inhalt.** Kein Wettbewerber kann ihn kopieren, ohne die Daten zu
   haben. Genau das ist es, was Google „eigenen Wert" nennt.
2. **Es ist lokal** — und zwar in der Sache, nicht nur im Stadtnamen.
3. **Es wird verlinkt.** Kostenrechner und Preisindizes sind das, was Menschen von sich aus
   verlinken: Foren, Reddit, lokale Zeitungen, Verbraucherportale. Das ist der Link, den
   `BACKLINK-AKQUISE.md` sucht — nur dass er freiwillig kommt.

**Und er ist der Grund, warum die deutschlandweite Skalierung überhaupt vertretbar ist.**
Ohne ihn wären hundert Ortsseiten hundert Variationen desselben Textes — genau das Muster,
das Google als „scaled content abuse" adressiert. Mit ihm hat jede Stadt Zahlen, die es
nur für sie gibt: was Handwerker dort tatsächlich nennen, wie viele Betriebe antworten, wie
schnell. **Der Kostenindex ist nicht die Kür, er ist die Lizenz zum Skalieren.**

Wer die Ortsseiten ohne ihn baut, baut eine Doorway-Farm. Wer ihn vorher baut, baut ein
Verzeichnis.

Zwei Bedingungen: **Mindeststichprobe** pro Zelle (sonst ist der Bereich Zufall) und
**Aggregation statt Einzelfall** (keine Rückschlüsse auf einzelne Betriebe oder Anfragen).
Beides gehört vorher mit dem Datenschutzkonzept abgeglichen — die Seite ist DSGVO-kritisch
genug, dass eine Zahl ohne Stichprobengröße hier ein Eigentor wäre.

Wenn nur eine Sache aus diesem Dokument umgesetzt wird, dann diese.

---

## Technik

- Ortsseiten kommen aus einer **Datenliste**, nicht aus handgeschriebenen Dateien:
  `src/app/handwerker/[ort]/page.tsx` + eine Quelle in `src/lib/`. Sonst pflegt niemand
  zwölf Seiten konsistent.
- Der Sitemap-Generator liest dieselbe Liste — Schwelle wird dort erzwungen.
- `generateMetadata` pro Ort: eigener Titel, eigene Beschreibung, eigener Canonical,
  **eigenes OG-Bild**. Für die Bilder reicht der bestehende Generator
  (`scripts/eh-og-image.mjs`): ein Motiv `ort-<slug>` je Ortsseite ergänzen, mit dem
  Ortsnamen in der Kopfzeile.
- **Kein neues CSS.** Neue Seiten konsumieren die bestehende Bibliothek — das erzwingt der
  Design-Check ohnehin (`New UI must consume the canonical library`), und neue
  `.css`-Dateien unter `src/` sind ohne Aufnahme in `design-policy.json` verboten.

---

## Messung

- **Search Console**, pro Ortsseite: Impressionen für „handwerker <ort>" und
  „<gewerk> <ort>". Vorher/nachher, 8 Wochen.
- **Eigene Kennzahl, die näher am Geschäft ist:** Anfragen je PLZ-Region pro Monat.
  Eine Ortsseite, die rankt aber keine Anfragen bringt, hat das falsche Versprechen.
- **Kontrollgruppe:** die Regionen ohne Ortsseite. Ohne die kann man nicht unterscheiden,
  ob die Seite gewirkt hat oder die Saison.

---

## Aufwand, ehrlich gerechnet

Eine Ortsseite **von Hand** zu recherchieren kostet 2–3 Stunden: Handwerkskammer, Entsorger,
Sperrmüll-Regeln, Gebäudebestand. Für zwanzig Städte ist das machbar. Für hundert ist es
ein halbes Jahr — und für vierhundert Landkreise unmöglich.

**Deshalb ist die entscheidende Einsicht dieses Dokuments, dass die Ortsseite nicht von Hand
entsteht, sondern aus Daten.** Was eine Stadtseite orts-spezifisch macht, kommt aus dem
eigenen System:

| Baustein | Quelle | Aufwand |
|---|---|---|
| Anzahl Betriebe je Gewerk | Partnernetz (DB) | null, Abfrage |
| Regionale Kostenrahmen | eigene Anfrageverläufe | null, Abfrage (Stichprobe prüfen) |
| Reaktionszeit vor Ort | eigene Vorgangsdaten | null, Abfrage |
| Nachfrage je Gewerk | eigene Anfragen | null, Abfrage |
| Gebäudebestand, Baujahre | offene Daten (Zensus) | einmalig, dann je Ort automatisch |
| Handwerkskammer, Entsorger, Sperrmüll | offene Daten / Handarbeit | **die einzige echte Handarbeit** |

Sechs von sieben Bausteinen sind Datenbankabfragen. Der siebte ist der Grund, warum die
Seiten nicht in zwei Tagen generiert werden können — und genau der Grund, warum sie
funktionieren.

**Der ehrliche Trade-off:** Die 139.000-Seiten-Variante wäre in zwei Tagen generiert und
würde die Domain riskieren. Die ~500-Seiten-Variante braucht ein Datenmodell und eine
Recherche-Pipeline, dafür trägt sie sich danach selbst.

---

## Nächster Schritt

Kein Blocker mehr — der Geltungsbereich ist geklärt. Drei Aufgaben, in dieser Reihenfolge:

1. **Ortsdatenmodell anlegen.** Liste der deutschen Städte (Top 100–150) und Landkreise
   (~400) mit AGS, PLZ-Spanne, Einwohnerzahl. Offene Quellen (Destatis, Zensus) reichen.
   Das ist die Grundlage für Slug, Sitemap und die Zählung.
2. **Auswertung fahren, nicht schätzen.** Anfragen je PLZ-Region der letzten 90 Tage,
   Betriebe je Gewerk und Region, Stichprobengröße je Kostenindex-Zelle. Daraus fällt die
   Reihenfolge der ersten 20–40 Städte **als Rechnung heraus**, nicht als Diskussion.
3. **Eine Stadtseite bauen und ansehen.** Eine einzige, vollständig, mit allen Abschnitten —
   bevor irgendetwas skaliert wird. Wenn sie ohne die Ortsdaten genauso aussähe, ist sie
   eine Doorway-Page, und dann stimmt das Datenmodell nicht.

