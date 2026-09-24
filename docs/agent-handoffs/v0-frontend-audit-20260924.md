# v0-Frontend-Audit 2026-09-24 — Public-Site-Neubau (Merge 223a835)

Adressat: v0 (Opus 4.5) und alle Folge-Agenten. Der Audit ändert **keinen Code** — reiner Befund.
Geprüft: Merge `223a835` (v0-Branch `d22ae8c`, 123 Dateien), Stand main, Arbeitsbaum sauber.
Maßstab: `DESIGN.md` (Atelier 02, Stand 2026-09-22), Skill `sin-eh-design`, Public-Finish-Vertrag aus AGENTS.md.
Gates zum Audit-Zeitpunkt: tsc 0, eslint 0 Errors, test:ai 67/67, test:public-site PASS,
test:public-nav ok:true, build ok, design:check EH_DESIGN_CONSISTENT.

## Urteil in einem Satz

Handwerklich stark (kein KI-Slop in Code/Copy-Systematik), aber **ein harter Rot-Befund bei den
Beispiel-Fotos** und mehrere gelbe Wahrheits-/Regelklärungen. v0 bleibt ausdrücklich der führende
Frontend-Agent — die Regeln unten sind Leitplanken, kein Misstrauen.

## ROT — muss vor Deploy/Abnahme behoben werden

### R1: Erfundene Handwerker-Firma auf Beispiel-Fotos (DESIGN §2)
- `public/images/site/avatar-heizung.png`: Porträt mit lesbarer Stickerei
  **„FISCHER HEIZUNGSTECHNIK – MEISTERBETRIEB"**.
- `public/images/site/avatar-elektro.png`: Stickerei „FISCHER ELEKTROTECHNIK" plus Namensschild
  **„Sarah F. – Elektrikerin"**.
- `public/images/site/avatar-dach.png`: Stickerei **„FISCHER DACHDECKER MEISTERBETRIEB"**.
- Verwendung u.a. in `src/components/site/home/hero.tsx` direkt neben dem Claim
  „3 geprüfte Betriebe in der Nähe" — dort **ohne jede Beispiel-Kennzeichnung**.
- Zusätzlich widerspricht der Bildtext dem Kartentext: `craftsmen-feature.tsx` zeigt dieselben
  Gesichter unter den frei erfundenen Firmennamen „Bauer Haustechnik", „Wärme Kern",
  „Heiztechnik Weber" (mit Sterne-Ratings 4,9/4,7/4,8 und Badge „Meine Empfehlung").
- Das ist genau das verbotene Muster aus DESIGN §2 („keine erfundenen Mitarbeiter") plus
  Gina-Regel (keine Kachelwand aus Behauptungen). Die `ExampleNote` in der Tarif-/Handwerker-
  Sektion („illustrative Betriebe, Preise und Bewertungen") heilt den Hero-Einsatz nicht.
- **Regel für v0:** Keine lesbaren Firmen-/Personennamen auf Beispielbildern. Entweder neutrale
  Motive (Werkzeug, Transporter, Rückenansicht, Hände bei der Arbeit — ohne Marken) oder jedes
  Beispiel **sichtbar** als Beispiel kennzeichnen (nicht nur sr-only). Bildtext und Kartentext
  müssen zusammenpassen oder das Bild bleibt namenlos.

## GELB — Wahrheits- und Regelklärungen (kein Slop, aber nachschärfen)

### G1: Telefon-Mockups nur für Screenreader als Beispiel gekennzeichnet
`PhoneFrame` (`src/design-system/site.tsx:161`) trägt die Beispiel-Kennzeichnung nur als
`sr-only`-figcaption. Sichtbare Nutzer lesen „Guten Morgen, Julia / Lindenweg 7"
(`owner-app-screen.tsx`) ohne Hinweis. Musterlösung existiert bereits im selben Code:
sichtbares Badge „Beispielansicht" wie in `craftsmen-feature.tsx:68`. Auf alle PhoneFrames übertragen.

### G2: Absolute KI-Versprechen vs. Produktwahrheit
- „beantwortet jede Frage" (`app-bento.tsx:77`), „KI-Hausmanager, der an alles denkt"
  (Hero), „KI-Hausmanager rund um die Uhr" (`comparison.tsx:15`) — das Produkt hat bewusst eine
  Confidence-Schwelle mit Rückfrage (Laya-Router) und eine separate Notfall-Seite mit Grenzen
  (`/notfall`). Chat-Verfügbarkeit ≠ Notfall-Abdeckung.
- **Regel für v0:** „immer erreichbar" statt „rund um die Uhr"; Können beschreiben, nicht
  Allwissenheit („Fragen rund um Haus & Verträge"); Notfall-Grenzen verlinken statt verschweigen.

### G3: „Automatisch" ohne Freigabe-Kontext
„Automatischer Spar-Alarm", „prüft deine Verträge automatisch", „Rechnung und Garantie landen
automatisch in deiner Hausakte" — gleichzeitig verspricht `promises.tsx` (stark!): „Nichts
passiert ohne dich … keine Weitergabe ohne ausdrückliche Freigabe." Das Freigabe-Prinzip in
jede „automatisch"-Formulierung tragen („meldet sich bei dir — du gibst frei").

### G4: Sparrechner ohne Quellen, Öl-Fall verschwindet still
`Sparrechner`-Konstanten (540 € Gas etc.) sind unbelegt; `HEAT_SAVING.oel = 0` + `.filter(value > 0)`
lässt die Gas-Zeile bei Öl-Heizung kommentarlos verschwinden. Hinweis ergänzen
(„Richtwerte, Quelle …; Öl/Sonstiges: Strom/Versicherung/Internet fließen ein, Heizanteil auf Anfrage").

### G5: Radien außerhalb des Token-Vokabulars — Guard sieht Tailwind-Klassen nicht
`rounded-2xl/3xl`, `rounded-[1.75rem]`, PhoneFrame `rounded-[2.9rem]/[2.4rem]` — DESIGN kennt nur
6 px / 8 px / Pille / Hauskante. Der Prüfer löst keine Tailwind-Klassennamen auf (DESIGN §11),
das ist eine **Guard-Lücke, kein Freibrief**. Erschwerend widerspricht sich die Regel selbst:
DESIGN-Prosa sagt „keine Pille mehr", das `pill`-Token existiert und wird gelebt.
**An die Designautorität, nicht an v0:** Pille/Radien-Vokabular entscheiden; bis dahin 6/8 px,
Pille, Hauskante bevorzugen, Geräte-Mock-Radien dokumentieren statt verbieten.

### G6: font-extrabold (800) außerhalb des Gewichts-Vokabulars (15×, guard-blind wie G5)
Zielwortschatz: 400/500/600/700. Auf 700 zurückführen oder Vokabular per Designautorität erweitern.

### G7: Versionszählung — „Designsystem 1.1" (site.tsx-Kopf) vs. DESIGN.md 1.0
`tokens.json` steht auf 1.1.0 (rein additiv, vorbildlich). Die zweite Versionszählung im
Dateikopf stiftet Verwirrung — umbenennen in „Website-Baukasten zu Tokens 1.1.0".

### G8: /partner nennt Preise nicht
„Fester Monatsbeitrag" ohne 19,90/39,90-Anker aus /preise. Beträge oder /preise-Link ergänzen.

### G9: Hero-Collage als fiktive Benachrichtigung
„Wechsel vorbereitet … spart 34 € im Monat" + KI-Zitat („Heizung ist 14 Jahre alt …") wirken wie
echte Produkt-Events. Beispiel-Badge oder als Deko klar secondary halten.

## GRÜN — ausdrücklich weiter so (nicht einschränken)

- **Null KI-Slop-Signale:** 0 Emojis, 0 Gradients/Glow/Glass, 0 Dauerschleifen, 0 Lorem/TODO/FIXME,
  0 englische Fragmente, 0 tote Links (alle hrefs führen auf echte Routen/Downloads).
- **Token-Disziplin vorbildlich:** `@theme`-Aliase in `globals.css` mappen 1:1 auf `--eh-*`
  (brand→petrol, cream→paper, coral→terra, save→success …), Inter-only, keine zweite Palette —
  das Gegenmodell zum verbotenen 2.0.0-Versuch (Switzer/Satoshi, seither im Stash geblockt).
- **Ehrlichkeits-Blöcke:** Pilotphase-Bekenntnis + „keine erfundenen Bewertungen" (promises.tsx),
  „Beispielrechnung"/„Anbieternamen und Preise sind illustrativ. Kein Wechsel ohne deine
  Bestätigung." (tariff-feature), „Beispielansicht mit illustrativen Betrieben …" (craftsmen).
- **Echte Funktion statt Attrappe:** Hero-Suche sind echte GET-Formulare mit Register-Prefill
  (kein Fake-Search); Sparrechner rechnet wirklich + Disclaimer; Vergleichstabelle nennt keine
  namentlichen Konkurrenten; Freigabe-Sprache durchgehend („Kein Wechsel ohne deine Freigabe").
- **A11y-Handwerk:** fieldset/legend, aria-pressed, Tabellen-Captions, sichtbare Fokus-Ringe,
  sr-only-Beschriftungen, Hauskante als Komponente (`houseEdgeClass`, nur an Bildflächen).
- Alte `home-sections` bleiben von Unterseiten genutzt — kein Dead-Code-Bruch; neue `site/`-Familie
  ist dokumentierte Operator-Order (kein stiller Parallelbau).

## Kompakt-Regeln für v0 (Leitplanken, bewusst eng gefasst)

1. Keine erfundenen Menschen, Firmen, Namen, Sterne — weder im Bild noch im Text; Beispiele immer
   **sichtbar** als Beispiel labeln (Badge-Komponente `ExampleNote`/„Beispielansicht" existiert).
2. Keine absoluten Versprechen (jede / automatisch / garantiert / rund um die Uhr ohne Abgrenzung);
   Freigabe-Prinzip in jede Leistungsbeschreibung tragen.
3. Farben/Schrift/Radien/Schatten nur über Token(-Aliase); was das Vokabular nicht hergibt, als
   Bedarf an die Designautorität melden statt selbst erfinden (G5/G6-Muster).
4. Schätzungen als Schätzung labeln (Annahmen + Quelle/Hinweis); Guard-Blindheit (Tailwind-Klassen)
   ist kein Freibrief.
5. Alles andere — Komposition, Dramaturgie, Dichte, Interaktion — bleibt v0s Stärke: weiter entscheiden.

## Nachweis (Audit-Methode, kein Code geändert)

- `git status` vor/nach: sauber (nur dieser Handoff + NEXT_AGENT-Eintrag neu).
- Scans: Emoji (0), Gradient/Glow/Glass (0), Lorem/TODO (0), Englisch-Fragmente (0),
  Garantie-/Auto-Claims (8 Stellen, oben zitiert), Zahlen-Claims (Sparrechner verifiziert),
  href-Inventar (alle echt), Bild-Sichtung (4/6 PNGs visuell: Soja-Sofa ok, 3 Avatare ROT).
- Offene Restprüfung (nicht blockierend): `test:e2e`/Visual auf OCI-VM (Supabase-Keys nötig),
  visuelle Jeremy-Abnahme (Pflicht vor Deploy).
