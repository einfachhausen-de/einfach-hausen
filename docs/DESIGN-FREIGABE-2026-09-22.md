# Design-Freigabe 2026-09-22: eigene Gestaltung der Eigentümer-Startseite

**Entscheidung des Inhabers.** Die Startseite `/app` und das Schaufenster
`/app/preview` tragen die eigene Gestaltung: Schnellaktionen als Karten mit
Symbolkachel, Verträge & Vergleiche als Chip-Reihe, Haus-Historie in zwei
Spalten (breit Vergangenes links, schmal Anstehendes zuerst), Vorschläge als
Karte mit Blätterknöpfen und flache Kennzahlen-Karten in der Schiene.

## Umfang der Freigabe

* Eigene Seite-CSS: `src/app/app/eigentuemer-start.module.css`.
  Sie steht in `design/design-policy.json` unter `ownedStyleFiles`, damit der
  PR-Check neue Seite-CSS nicht mehr ablehnt.
* `src/components/werkbank-layout.css` trägt die Haus-Regeln aller Chip-Reihen
  (Hover, Fokus, Rand).
* `design/design-lock.json` ist mit `node scripts/eh-design-seal.mjs`
  versiegelt, weil die Policy selbst unter Schutz steht.

## Regeln, die für diese Dateien gelten

* Keine Rohwerte: Farbe, Schriftgrösse, -gewicht, Radius, Schatten, Laufweite
  und Zeilenhöhe nur als `var(--eh-…)` (DESIGN.md §10).
* Keine Verläufe: die Regel `decorative-effect` blockt `radial-gradient(…)`.
* Jede Klasse muss benutzt werden; Zustand reist in ARIA
  (`[aria-current="page"]`), nicht in Klassennamen.

## Schnellaktionen

Optik der früheren Fassung, ausschliesslich aus Tokens:

* Ruhe: Petrolfläche (`--eh-color-petrol`), Schatten Petrol 22 %.
* Hover: dunkler Haus-Ton (`--eh-color-deep`), Schatten Petrol 28 %.
* Weisse Karten: Petrolrahmen und Petrol 10 % im Hover.

## Verträge & Vergleiche

Die Chips bleiben in **einer** Reihe und wandern seitlich statt umzubrechen –
bedient mit denselben runden Pfeilknöpfen wie der Vorschlags-Slider
(`src/components/homeowner/compare-rail.tsx`, Client-Komponente, nimmt die
fertigen Chips als children). Die Pfeile erscheinen nur, wenn die Reihe
wirklich breiter ist als ihr Platz, und sind am jeweiligen Ende abgeschaltet.

Neun Kategorien: Strom, Gas, Internet, Versicherung, Mobilfunk, Photovoltaik,
Heizung, Smart Home, Wallbox. Eigene Anker tragen nur die fünf Kategorien, die
`src/lib/affiliate.ts` freigibt – so zeigt kein Link ins Leere.

## Hinweisbox ist neutral

`EHCallout` trägt statt der Sandfläche mit Terra-Kante links jetzt
`border: 1px solid var(--eh-rule)` und den Panel-Radius; der Ton `sand` ist aus
`blocks.tsx` entfernt und wird im Marketing-Adapter auf `paper` abgebildet.
`--eh-color-sand` bleibt als Akzentfarbe im Wortschatz (Button-Hover,
Hervorhebungen, Rechnungsübersicht).

## KI-Schritte (`EHActivity`)

Der Kundenberater legt seinen Ablauf offen: `EHActivity` in
`packages/eh-design/src/blocks.tsx` zeigt eine Zeile je Schritt, den Zustand in
`data-stand`, die Details nativ aufklappbar (`<details>`) und die Wiederholung
nur auf der letzten fehlgeschlagenen Zeile. Die Gestaltung steht in
`packages/eh-design/src/styles.module.css`; die Flaechen entstehen ueber
`color-mix` in eigenen Variablen, damit in der Deklaration kein Rohwert steht.
Die Zahl im Ring ist die Position des laufenden Schrittes, kein Zaehler.

`src/lib/assistant-service.ts` meldet die echten Schritte: erkannter Bereich und
Einstufung, gelesene eigene Daten samt uebermittelter Zeichenzahl, Modell und
Kontingent, Fehlerursache samt Entlastung. `/api/ki?stream=1` liefert sie als
Ereignisstrom; ohne Streaming bleibt es beim JSON mit denselben `steps`. Die
schwebende Website-Karte bleibt unveraendert und zeigt keine Schritte - das
entscheidet `placement="panel"`. `scripts/assistant-service.test.mjs` sichert
Ablauf und Live-Meldung ab.

`design/design-lock.json` ist erneut mit `node scripts/eh-design-seal.mjs`
versiegelt.

## PR-Check

Der PR-Job (`eh-design.yml`) vergleicht geschützte Pfade mit der Basis und
meldet für diese Änderung zwangsläufig
`Brand authority required; protected path differs from trusted base`.
Auf einem direkten Push nach `main` läuft `npm run design:check` ohne `--base`
und bleibt grün.

## Entwicklungshilfen (nur Dev, nicht Produktion)

`next.config.ts` erlaubt im Dev-Betrieb die Vorschau-Origins (`*.e2b.app`) und
setzt für `/_next/static/(.*)` `no-store`. Beides gilt nur solange
`NODE_ENV === "development"`; Produktion bleibt unberührt. Ohne die
Origin-Freigabe blockiert Next.js Dev-Ressourcen (HMR, Schriften) cross-origin,
und der Browser bleibt auf einer alten, ungestylten Fassung stehen.
