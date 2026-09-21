# Offene Anträge an die Designautorität

Diese Datei sammelt konkrete, belegte Bedarfe an die Einfachhausen-Designautorität
(`docs/brand/system/`, `DESIGN.md`, `design/design-lock.json`). Regelgrundlage:
`AGENTS.md` → „EH-DESIGN-AUTHORITY-V1“ — *Guard/Baseline/Workflow niemals zum
Bestehen eines eigenen Checks abschwächen oder neu versiegeln*. Kein Agent führt
die hier beschriebenen Re-Seals selbst aus.

---

## DA-2026-09-21-01 — `design:check`: geschützte Dateien und Rohwert-Debtbasis

**Antrag:** Entscheidung über ein Re-Seal von `design/design-lock.json` und
`design/design-debt.json`, oder über die Rücknahme der unten gelisteten
Quelländerungen.

**Stand:** offen. `npm run design:check` schlägt fehl. Das ist **nicht** durch den
Release-Gate blockiert (`scripts/release-gate.mjs` liest `design:check` nicht), aber
der Designvertrag ist damit verletzt.

### Vorbestehend auf `main` (nicht aus der aktuellen Welle)

Bereits vor der Welle #127–#132 rot, identisch reproduziert am Commit `45a6af3`:

```
Protected design file changed: src/app/design-system.css
Protected design file changed: src/app/globals.css
src/components/nav-user.tsx: new small-type (1 > 0)
src/components/ui/sidebar.tsx: new literal-color (1 > 0)
src/components/ui/sidebar.tsx: new unowned-style (4 > 3)
src/app/globals.css: debt baseline is stale for raw-value (0 < 1); run design:debt:sync
```

Beleg: `git worktree add /tmp/eh-prewave 45a6af3 && node scripts/eh-design-check.mjs`.

`globals.css` und `design-system.css` sind gegenüber `45a6af3` **byte-identisch**
(sha256 `0d6a67f5…` bzw. `4256606e…`), weichen aber vom Versiegelungsstand ab:

| Datei | `design-lock.json` | `45a6af3` = aktuell |
|---|---|---|
| `src/app/globals.css` | `31d47270…` | `0d6a67f5…` |
| `src/app/design-system.css` | `a089ed0d…` | `4256606e…` |

Das Lock ist also älter als der heutige `main`-Stand dieser beiden Dateien.

### Neu aus der Welle #127–#132 (Commit `ed7c3aa`)

```
Protected design file changed: src/components/marketing/home-hero.tsx
Protected design file changed: src/components/marketing/site-shell.tsx
```

Beide Änderungen sind **ausschließlich Text-/Linkinhalt**, keine Gestaltung — sie
folgen der Produktentscheidung „Eigentümer dauerhaft kostenlos“ (Issue #132):

| Datei | Lock | `45a6af3` | jetzt |
|---|---|---|---|
| `home-hero.tsx` | `8fef8ff8…` | `8fef8ff8…` | `11a6016f…` |
| `site-shell.tsx` | `fa9bf21c…` | `fa9bf21c…` | `27638b42…` |

- `home-hero.tsx`: EHFacts-Eintrag `15 % / „Dauer-Vorteil für die ersten 1.000
  Pilot-Haushalte“` → `0 € / „Hauskonto für Eigentümer – dauerhaft kostenlos“`.
  Der Pilotrabatt existiert nicht mehr; das alte Versprechen wäre unwahr.
- `site-shell.tsx`: zwei Navigations-/Footer-Einträge `['Pilotphase', '/pilotphase']`
  entfernt. `/pilotphase` ist jetzt ein Redirect auf `/preise`.

Kein Layout, keine Farbe, kein Token, keine Typografie, kein neuer Baustein. Die
Änderungen sind in `5289d1e` begründet und in `ed7c3aa` dokumentiert.

**Nicht getan:** kein `design:seal`, kein `design:sync`, kein `design:debt:sync`.

---

## DA-2026-09-21-02 — `design:deadcss`: Zähler und Budgets

**Antrag:** Entscheidung über `--sync` der Budgets und über die Ursache des
`stateClasses`-Anstiegs.

**Stand:** offen, **vollständig vorbestehend** — am Commit `45a6af3` identisch
reproduziert:

```
importantDeclarations: Budget ist veraltet (81 < 95) - --sync ausfuehren
duplicateTopLevelSelectors: Budget ist veraltet (35 < 45) - --sync ausfuehren
stateClasses: 20 > 16 - der Zaehler darf nur sinken
```

`design/design-budgets.json` (nicht versiegelt) hält
`{"importantDeclarations":95,"duplicateTopLevelSelectors":45,"stateClasses":16}`,
während die Zähler 81/35/20 messen. Ein `--sync` würde die Budgets **erhöhen** und
damit den Guard abschwächen; ein Absenken von `stateClasses` von 20 auf 16 verlangt
eine echte Codeänderung. Beides ist eine Designautoritäts-Entscheidung.

Zusätzlich meldet der Lauf **66 tote CSS-Klassen** (u. a. 12 `gateway*` in
`src/components/marketing/marketing.module.css`, 23 in
`src/components/marketing/home-hero.module.css`). Die `gateway*`-Klassen sind seit
`7d2b8b1` („29 ungenutzte Komponenten-Dateien entfernt“) tot, also vorbestehend.

`design/design-dynamic-classes.json` referenziert außerdem zwei nicht existierende
Dateien (`CardVisual.tsx`, `Stepper.tsx`) und erzeugt dadurch eine dauerhafte
Meldung.

**Nicht getan:** kein `--sync`, kein Löschen der toten Klassen.

---

## DA-2026-09-21-03 — Fehlender Ordnerbaustein für die Dokumentenablage

**Antrag:** Aufnahme eines kanonischen **Ordner-/Ablage-Bausteins** in
`packages/eh-design` (und damit ein Re-Seal von `design/design-lock.json`, da
`packages/eh-design/src/documents.tsx` versiegelt ist).

**Stand:** offen, **nicht blockierend**. `/app/documents` gruppiert Rechnungen,
Angebote/Nachweise und Zahlungsbelege seit `c8e974f` in einem gemeinsamen Ordner
„Ablage“ mit dem Ansichtswechsel **Liste/Karten/Chronik** (`EHRecordViews`, bereits
vorhanden, kein neuer Baustein). Der **Ordner je Dokumentart** ist dort als
führende Angabe der Zeile (`detail`) und über das Symbol der Zeile umgesetzt.

**Warum das ein Antrag ist:** `COMPOSITION.md` verlangt, fehlende Exporte zu
melden statt eine eigene Stilfamilie zu erfinden. Ein echter Ordner-/
Gruppierungsbaustein existiert weder in `packages/eh-design/src` noch in
`DESIGN.md`; `documents.tsx` exportiert nur `EHDocumentFrame`. Die aktuelle
Umsetzung kommt ohne Änderung an versiegelten Dateien aus und ist ausdrücklich
eine Zwischenlösung, bis die Designautorität entscheidet:

1. eigener Ordnerbaustein (z. B. `EHRecordFolders` mit Ordnerkopf, Anzahl und
   aufklappbaren Gruppen) — dann wird `EHRecordViews` in der Ablage ersetzt, oder
2. Beibehaltung der flachen, chronologisch gemischten Liste mit Ordner als
   führender Zeilenangabe — dann entfällt dieser Antrag.

**Nicht getan:** kein neuer Baustein, kein Re-Seal, keine Änderung an
`packages/eh-design`.
