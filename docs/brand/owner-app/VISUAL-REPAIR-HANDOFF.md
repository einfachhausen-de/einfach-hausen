> **Produktkontext aktualisiert · 21.09.2026:** Maßgeblich sind [Produktvision](../../PRODUCT_VISION.md) und [Positionierung](../../PRODUCT_POSITIONING.md): Handwerkervermittlung und Affiliate-Tarife zuerst, Eigentümer kostenlos, Partnerabo, Hausakte ergänzend. Frühere Prioritäten und „nächste Aktionen“ dieser Lieferung gelten nur für ihren datierten Umfang; aktuelle Fortsetzung unter [NEXT_AGENT](../../NEXT_AGENT.md). Technische und gestalterische Nachweise bleiben historische Belege. 

# Owner-App Visual Repair - Handoff 2026-09-11

## Befund (Bildbeleg + Live-Messung)
- /app/jobs zeigte ein 697x1219px Hochformatfoto (live auf Produktion vermessen), das den Arbeitsinhalt verdraengte.
- Ursache (belegt): `.ownerOrdersHeroBody { grid-template-columns: minmax(0,.95fr) minmax(420px,1.3fr); }` ohne Hoehenbegrenzung + `img { height:100%; min-height:250px; object-fit:cover; }`. Kein Build-/Import-/CSS-Ladefehler: Regeln waren aktiv, Komposition falsch.
- Dashboard (/app) entsprach bereits der Referenz (Bild 2) - kein Umbau noetig.

## Korrektur (gezielt, kanonische Tokens, keine neue Designsprache)
- packages/eh-design/src/styles.module.css: Medien-Spalte `minmax(0,.72fr)`, Figur `max-height:360px + aspect-ratio 16/10`, img `min-height:0`, `object-position:center 30%` (Gesichter sichtbar). Mobil: `max-height:230px + 16/9`.
- Ergebnis live vermessen: Figur 505x316. Titel, Suche, Stats, Liste und CTA in der ersten Ansicht.
- design-lock.json exakt neu versiegelt (nur styles.module.css-Hash).

## Erhaltene Funktionen (Fixture-Nachweis /tmp/eh-repair-test.db)
- Suche: Treffer/kein-Treffer/Reset; Completed-Filter; Detailnavigation (6 Links, Detail 200 + H1).
- Erstellung, Hausmeister-CTA, Ownership-/Rollenpruefungen, Statuslogik, ?view=completed: Code unberuehrt.
- Termine (/app/calendar), Ansprechpartner (-> /app/messages), Hausakte (/app/home), Rest: je 200, genau 1 H1, overflow 0 (390).

## Abnahme
- Shots 390/736/1536 angesehen: docs/brand/owner-app/shots/ (jobs) + /tmp/eh-rep-*.png.
- Gates: tsc/eslint/design/build + release-gate (prod-stand) gruen.
- Deploy: main <SHA>, Backup <TS>, Restart ohne sudo, Health ok/ready, Prod-Spots.

## Grenzen
- Bildquelle hero-homeowner.jpg unveraendert (keine neuen Bilder generiert).
- Dashboard unveraendert (war referenzkonform).
- Systemische Launcher-Ueberlappung bleibt Design-Entscheidung (EH-ASSISTANT-OVERLAP-SYSTEM).
