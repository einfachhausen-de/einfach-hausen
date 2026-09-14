# Einfach Hausen — visuelle Produktlinie

> **Historisch seit 2026-09-11 (EH-DOC-CONVERGENCE):** Die einzige verbindliche visuelle Quelle ist [`DESIGN.md`](../DESIGN.md) zusammen mit `packages/eh-design/`. Diese Datei beschreibt die frühere Visionslinie der Kunden-App und bleibt als Hintergrund erhalten. Änderungen am Design erfolgen ausschließlich über `DESIGN.md` und die Designautorität.

Diese Datei beschreibt die verbindliche visuelle Richtung der Kunden-App. Referenz ist das von der Familie gelieferte Mobile-App-Board vom 21.08.2026.

## Leitidee

Einfach Hausen soll wie ein hochwertiges, ruhiges Consumer-Produkt für Eigenheimbesitzer wirken — nicht wie ein KI-Demo-Tool und nicht wie ein ERP.

Priorität der Oberfläche:

1. Kundennutzen und nächster sinnvoller Schritt
2. persönlicher Ansprechpartner und Vertrauen
3. Angebote, Termine, Aufträge und Hauswissen
4. technische Assistenz im Hintergrund

## Primäre Kunden-Screens

- `/app` — Startseite mit Schnellaktionen, nächstem Termin und offenen Angeboten
- `/app/hausmeister` — fokussierter Hausservice-Chat
- `/app/jobs/[id]` — Angebotsvergleich bzw. Auftragsdetail
- `/app/home` — Mein Haus / digitale Hausakte
- `/app/year` — Mein Jahr / Wartungs- und Aufgabenplan
- `/app/plans` — Mitgliedschaften und Premium-/Jahrespakete
- `/app/jobs` — aktive, geplante und abgeschlossene Aufträge
- `/app/partners/[id]` — öffentliches Profil eines geprüften Partnerbetriebs
- `/app/profile` — Profil und Einstellungen

## Mobile Navigation

Kunden sehen bewusst nur vier feste Primärziele:

- Start
- Mein Haus
- Aufträge
- Profil

Hausservice, Kontakte, Jahr, Pakete und Partnerprofile sind kontextuelle Unterseiten. Dadurch bleibt die Navigation ruhig und eindeutig.

## Farben

> **Brand-Konvergenz (2026-08-30):** Die Markenidentität ist mit dem neuen Logo auf Petrol-Teal `#105258` kalibriert (siehe `DESIGN.md` §3). Die App-Oberflächen nutzen die gleiche Palette — die unten dokumentierten Grüns sind die historische Referenz und nicht mehr aktiv.

- Dunkelgrün: `#075531`
- Primärgrün: `#0A6A3C`
- Helles Grün/Mint: `#EEF6ED`
- Weiß: `#FFFFFF`
- Text: `#111512`
- Sekundärtext: `#69716B`
- Linien: `#E4E6E2`

## Stil

- viel Weißraum
- kleine, leichte Schatten statt "SaaS-Glow"
- Karten mit 14–18 px Radius
- klare Hierarchie und große, ruhige Headlines
- grüne Akzente nur für Aktion, Status und Vertrauen
- keine unnötigen Gradients oder dekorative KI-Elemente
- 44 px+ Touch-Ziele
- mobile-first, aber auf Desktop ohne Phone-Frame

## Produktprinzip in der UI

Eine normale Frage erzeugt keinen Auftrag. Nach der Einordnung entscheidet der Kunde bewusst zwischen:

- **Ansprechpartner finden** — persönlicher Kontakt, noch kein Auftrag
- **Auftrag organisieren** — Angebote, Termin und Ausführung

Der persönliche Ansprechpartner bleibt dauerhaft in der Hausakte.
