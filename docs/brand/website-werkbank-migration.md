# Website → Werkbank-Komposition (Betreiberentscheidung 2026-09-21)

## Entscheidung

Der Betreiber hat entschieden:

1. **Schrift und Farbpalette werden NICHT geändert.** Inter bleibt, Petrol/Terra/Sand bleiben.
   Die unversionierte Fremdarbeit (Switzer + Satoshi, `tokens.json` 1.0.0 → 2.0.0) wird nicht
   übernommen. Sie liegt in `stash@{0}` und ist **nicht** in Produktion.
2. **Die Website soll aussehen wie die App.** Umbau Seite für Seite auf die
   Werkbank-Komposition. Designsprache und Tokens bleiben, geändert wird die **Komposition**.

## Geprüfter Ist-Stand (Quelle, nicht Behauptung)

- **Schrift/Farbe identisch:** `packages/eh-design/src/tokens.json` → `"Inter, …"`;
  genau eine Schriftdatei im Repo (`src/fonts/InterVariable.woff2`);
  `src/app/globals.css` mappt `--font-sans` auf Inter.
- **Produktion ist aktuell:** OCI-VM `/srv/einfach-hausen` steht auf `c3a2e35` = `main`.
  „Altes Design" ist **kein** Deploy-Problem.
- **Die Website nutzt das Designsystem bereits:** `src/components/marketing/*.tsx` importieren
  ~30 kanonische `EH*`-Bausteine (`EHPageHero`, `EHScope`, `EHPanel`, `EHSection`,
  `EHServiceIndex`, `EHText`, …). `@/design-system` zeigt via tsconfig auf
  `packages/eh-design/src`.

## Der eigentliche Unterschied: die Seitenkomposition

| | Website | App |
|---|---|---|
| eigene CSS-Dateien | 7 (1.699 Zeilen) | 0 eigene |
| Startseiten-Hero | `home-hero.module.css` allein 642 Zeilen | nutzt das gemeinsame Paket |

Website-CSS: `marketing.module.css`, `mkt.module.css`, `home-hero.module.css`,
`premium.module.css`, `app-frames.module.css`, `motion.module.css`, `tokens.css`.
App-CSS: keine — alles aus `packages/eh-design/src/styles.module.css` (2.404 Zeilen).

**Angriffspunkt ist damit die Komposition, nicht die Designsprache.**

## Versiegelung — warum `design:check` rot ist (kein Designbruch)

`npm run design:check` meldet genau vier Dateien:

```
Protected design file changed: src/app/design-system.css
Protected design file changed: src/app/globals.css
Protected design file changed: src/components/marketing/home-hero.tsx
Protected design file changed: src/components/marketing/site-shell.tsx
```

Ursache ist im Repo dokumentiert: nach der letzten Versiegelung `717f4ea` (20.09.) wurden
nur **totes CSS gelöscht** (2 Commits, 691 Zeilen entfernt) und zwei Textstellen geändert
(„Pilotphase"-Links entfernt, ein Fakt-Label). `git diff --stat 717f4ea..HEAD` über die
vier Dateien: `35 insertions(+), 675 deletions(-)`. **Kein neues Design — nur Aufräumen.**
Es wurde nicht neu versiegelt. Commit `5289d1e` notiert das selbst als offenen Punkt.

Zusatzbefund: `scripts/release-gate.mjs` führt `design:check` **nicht** aus und erwähnt
`design-lock` nicht. Deshalb war das Gate grün, obwohl der Designwächter rot ist.
Diese Lücke wurde bewusst **nicht** geschlossen (würde sofort rot und eine Neuversiegelung
erzwingen).

## Reihenfolge des Umbaus

Vorschlag, mit der Startseite als Pilot:

1. `/` — `src/app/page.tsx` + `src/components/marketing/home-hero.tsx` + `home-sections.tsx`
2. `/leistungen` — `EHServiceIndexPage`-Rezept statt eigener Katalogwand
3. `/hausakte`, `/beratung`, `/notfall`, `/versicherung`, `/immobilienverkauf`
4. Restliche Marketing-Unterseiten

Werkbank-Merkmale, die übernommen werden (Vorbild `src/app/app/page.tsx`):

- Kopf in Werkbank-Größe statt Display-Typografie: Adresse/These als `h1` in Zeilengröße,
  kurze Beschreibung, **eine** Aktion rechts (`eh-werkbank-kopf-cta`).
- Eine Kennzahlenzeile (`EHMetricsBar`) statt Kachelwand.
- Dichte Listen (`EHOwnerSection` + `EHRecordList`) statt gleichförmiger Karten.
- Fokuszeile (`eh-werkbank-fokus`) für den wichtigsten nächsten Schritt.
- Kontextspalte (`rail`) statt wiederholter Marketing-Claims.

## Regeln für die Umsetzung

- Keine neue Farbpalette, keine neue Schrift, keine lokale Stilfamilie.
- Vor jeder Seitenmigration `docs/brand/system/COMPOSITION.md` und `DESIGN.md` lesen.
- Backend, Auth, Navigation, Formulare und Server Actions bleiben unangetastet.
- Nach der Migration: `npm run design:check` neu versiegeln (Betreiberfreigabe liegt vor)
  und `scripts/release-gate.mjs` um `design:check` ergänzen.
- Verifikation auf der OCI-VM, nicht auf Mac-M1.

## Offen

- Pilot `/` ist **noch nicht implementiert** — dieser Branch enthält nur Analyse und diese
  Entscheidungsnotiz.
- `stash@{0}` („NICHT UEBERNEHMEN: fremde Schrift/Palette-Aenderung") bleibt liegen.
  Nicht anwenden.
