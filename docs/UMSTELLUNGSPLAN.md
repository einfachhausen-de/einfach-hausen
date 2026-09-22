# Umstellungsplan — App-Design auf die Werkbank (Richtung A)

Stand 17.09.2026, 03:0x. Grundlage: verifizierter Ist-Stand, `DESIGN.md` 1.0,
`design/design-lock.json`, `scripts/eh-design-check.mjs`, `ZUKUNFTSSICHERUNG.md`.

---

## 1. Ist-Stand (belegt, nicht behauptet)

| Prüfung | Befund |
|---|---|
| Live `einfachhausen.de/api/health` | `state: ready`, alle Pflicht-Checks grün, `uptime` 2546 s → Start ~01:54 |
| `origin/main` | **`8f20654`** (02:05) — „Hauptmenue als eigene Zeile, Unterpunkte in die Seitenleiste, rechte Spalte" |
| Verhältnis | Commit ist **11 min jünger** als der Live-Prozessstart → **`8f20654` ist nicht live** |
| Live läuft | der Revert-Stand `957b57d`/`715dd16` — gesund |
| Zukunftssicherung §4 Schichtung | **steht** — `globals.css:1` `@layer eh-tokens, …, eh-pages` |
| Zukunftssicherung §1.2 Whitelist | **steht** — `RAW_PROPS`/`RAW_OK` in `eh-design-check.mjs:14-17` |
| Zukunftssicherung §2 Ratsche | **steht** — `design-debt.json` + `debtCap` (8314 → **0 bis 30.04.2027**) |
| Tot-Liste §3B | Datei vorhanden: `design/design-deadcss.json` (59 KB) |

**Die vier in `ZUKUNFTSSICHERUNG.md` als blockierend bezeichneten Punkte sind damit erledigt.**
Der Seitenumbau ist nicht mehr blockiert — mit einer Ausnahme (siehe §2).

## 2. Die harte Grenze

`design/design-lock.json` versiegelt **54 Dateien** per SHA-256. Daraus folgt für jeden Subagenten:

| Bereich | Status | Konsequenz |
|---|---|---|
| `packages/eh-design/**` (AppShell `workspace.tsx`, `styles.module.css`, `tokens.*`) | **versiegelt** | Nur über `eh-design-generate` → `eh-design-seal`, **und nur mit Jeremys Freigabe** |
| `DESIGN.md` | **versiegelt** | dito |
| `design/design-*.json` | **versiegelt** | Ratsche: nur über `design:debt:sync` |
| `src/app/globals.css`, `src/app/design-system.css` | **versiegelt** | nicht anfassen |
| `src/app/app/homeowner.module.css`, `src/app/pro/provider-workspace.module.css` | **versiegelt** | nicht anfassen |
| `src/components/marketing/**`, `src/design-system/` | **versiegelt** | nicht anfassen |
| **`src/app/app/**/page.tsx`**, **`src/app/pro/**/page.tsx`**, **`src/app/admin/**`** | **frei** | hier findet der Umbau statt |
| `src/components/shell.tsx`, `shell.module.css`, `nav-config.ts` | **frei** | hier auch |

**Weitere harte Regeln für Subagenten:**

1. **Keine neuen `.css`-Dateien.** `eh-design-check.mjs:119` lässt nur `ownedStyleFiles` zu.
2. **Neue `.tsx` müssen die kanonische Bibliothek importieren** (`design-system|eh-design|components/marketing/ui`), sonst `eh-design-check.mjs:122`.
3. **Neun Regeln einhalten:** kein Hex/rgb, kein Fremd-Font, keine `font-size` < 13 px, kein `style={`, kein Gradient/`backdrop-filter`/`shadow-xl`/`rounded-full`, keine Tailwind-Farbklassen, kein `!important`, keine Rohwerte in `font-size|font-weight|color|background|border-*|border-radius|box-shadow|letter-spacing|line-height`, **keine Zustandsklassen** (`active|selected|is-active|current|open` im `className`) — Zustand gehört in ARIA.
4. **Ratsche darf nicht steigen** — ein neuer Verstoß bricht den Check.
5. **Kein Deploy, kein Push auf `main`, kein `git push` überhaupt** ohne Freigabe.
6. **`next build` lokal scheitert erst am Ende** (Falle 37) — `BUILD_EXIT=1` allein heißt nichts.
7. **Nie `next dev`** (Falle 20). Lokal immer `./node_modules/.bin/<bin>`, nie `npm run`.

## 3. Ziel

Richtung **A = Werkbank** ist gesetzt. Vier Unterschiede, die die neue Struktur ausmachen:

1. Hauptmenü **oben** in der Topbar, mittig, aktiver Punkt als petrolfarbene Pille
2. Seitenleiste **links** mit den Unterpunkten der *aktuellen* Seite, gruppiert
3. **Rechte Spalte** mit Inhalt, der zur Seite gehört — nicht überall dasselbe
4. **Vier Kennzahlen** unter dem Kopf

Kanonische Vorlage: `vergleich/ziel/a-{liste,karten,chronik}.html`.
Beleg-Dokument: `vergleich/werkbank-vergleich/vergleich.html` (repariert 17.09.).

## 4. Wellen

### Welle 0 — Sichtbeleg `8f20654` (blockierend, Freigabe nötig)

`8f20654` liegt ungeprüft auf `main`. Vor jeder Seitenarbeit muss belegt sein, dass die neue
AppShell hält — **echter Server-Screenshot, nicht `next build`**.

- Subagent `w0-beleg`: Screenshots `/app`, `/app/jobs`, `/pro`, `/admin` bei 390 / 736 / 1536 px.
- Werkzeug: Skill `eh-app-sichtpruefung`.
- **Abbruch:** Überlappt das Hauptmenü die Adresse (Symptom vom 17.09.), wird `8f20654` nicht
  Grundlage der Umstellung, sondern zuerst repariert.
- **Grenze:** Ein Deploy auf die VM ist Freigabe-Sache. Ohne Freigabe nur lokaler Beleg.

### Welle A — Bestandsaufnahme (lesend, kein Risiko)

Drei Subagenten parallel, je ein Bereich. Reine Analyse, **keine Schreibzugriffe**.

- `wA-owner` → `src/app/app/**` (21 Routen)
- `wA-provider` → `src/app/pro/**` (12 Routen)
- `wA-admin` → `src/app/admin/**` (4 Routen)

Je Route liefern: Datei, importierte EH-Komponenten, Vorhandensein der vier Strukturmerkmale,
Verstöße gegen die neun Regeln, Abstand zur Zielvorlage. Ergebnis: eine Rangliste
„nächste Seite mit dem größten Effekt".

### Welle B — Umbau in Scheiben (freie Dateien)

Reihenfolge nach Welle A. **Pro Subagent genau eine Seite**, damit ein Fehlgriff nie mehr als
eine Seite kostet. Je Seite:

1. Vorher-Screenshot
2. Umbau auf die vier Strukturmerkmale, kanonische Komponenten
3. `./node_modules/.bin/…` — Designcheck + Typprüfung
4. Nachher-Screenshot, Vergleich gegen die Zielvorlage
5. Erst bei grünem Check und sichtbarem Beleg: nächste Seite

**Abbruch je Scheibe:** steigt die Ratsche, bricht der Check, oder weicht der Screenshot von der
Zielvorlage ab → Scheibe zurücknehmen, melden, nicht weiterbauen.

### Welle C — Abnahme (Jeremy)

Screenshots aller umgestellten Routen, `design:check` grün, PR offen. **Mergen tut Jeremy.**

## 5. Was dieser Plan ausdrücklich nicht tut

- Er fasst `packages/eh-design/**` nicht an. Braucht der Umbau eine Änderung an der AppShell,
  ist das ein **eigener Auftrag mit Freigabe** (Seal).
- Er deployt nicht.
- Er ändert `DESIGN.md` nicht — obwohl genau das die offene Frage vom 17.09. war („design.md und
  alles und komponenten vorlagen erstmal fixen"). `DESIGN.md` ist versiegelt; die Vorlagenfrage
  wird über `docs/NEXT_AGENT.md` gelöst, das frei ist.

---

## Ergebnis (17.09.2026, 08:40)

**Durchgeführt.** Branch `design/werkbank-umstellung-20260917`, **34 Dateien, +1976/−619**.
11 Subagenten (DeepSeek V4.1 Flash), jeder mit klar begrenztem Dateisatz, gebrieft über die
Skill `eh-werkbank-seitenumbau`.

| Prüfung | Ergebnis |
|---|---|
| `tsc --noEmit` (mit `--max-old-space-size=6144`) | **0 Fehler** |
| Versiegelte Dateien geändert | **0** |
| Designcheck `eh-design-check.mjs` | **rot — 27× `debt baseline is stale`** |

**Umgestellt:** alle `/app`-Routen (21), alle `/pro`-Routen (12) und `/admin` page/ops/crm (3).
Je Seite vier echte Kennzahlen + seitenspezifische rechte Spalte.

**Bewusst ausgenommen** (keine Werkbank-Struktur nötig): `app/invoices/[id]`, `app/home/passport`,
`app/documents/[jobId]/receipt`, `pro/invoices/[id]` (Beleg-/Druckansichten mit `EHDocumentFrame`),
`admin/login` (Anmeldeseite), `app/partners` und `pro/jobs` (reine Redirects).

**Was die zentrale Typprüfung fand, was kein Subagent gemeldet hätte:** 5 Typfehler in
`app/messages/page.tsx` (Union-Typ, Feld nur in einem Zweig) und ein Syntaxfehler in
`app/home/history/page.tsx`, der vier Folgefehler verdeckte. Beide behoben. **Lehre: Subagents ohne
eigenen `tsc`-Lauf melden „sauber", obwohl es nicht kompiliert.**

**Der eine offene Schritt — braucht deine Freigabe:**

```
node scripts/eh-design-debt-sync.mjs   # senkt die Baseline um ~166 Punkte
node scripts/eh-design-seal.mjs        # die Baseline steht im Lock
```

Beides fasst `design/design-debt.json` an, eine **versiegelte** Datei. Der Sync-Kommentar sagt
selbst: „laeuft das nur mit Markenautoritaet auf main". Deshalb auf dem Branch **nicht** ausgeführt —
`design/` ist unverändert. Ohne diesen Schritt bleibt der Check rot und der Branch nicht mergefähig.

**Ebenfalls offen:** Welle 0 (Sichtbeleg). `8f20654` ist weiterhin nicht live, und der Umbau selbst
ist nur typgeprüft, nicht gesehen — Screenshots gehen nur auf dem Deploy-Host
(Skill `eh-app-sichtpruefung`).

---

## Abschluss (17.09.2026, 11:35)

**Sync und Seal sind ausgeführt.** `design-debt.json`: 6240 → **6074 Punkte in 71 Dateien**.
Der Seal hat **genau einen** Hash geändert (`design-debt.json`) — die 53 übrigen Lock-Einträge
blieben gleich, es wurde also nichts mit-legalisiert.

**Endstand der Prüfkette:**

| Prüfung | Ergebnis |
|---|---|
| `eh-design-check.mjs` | **`EH_DESIGN_CONSISTENT`**, Exit 0 |
| `tsc --noEmit` | **0 Fehler** |
| `eslint` (alle geänderten Dateien) | **0 Errors** |
| Versiegelte Dateien aus `packages/eh-design` | **0 geändert** |
| Schuldenpunkte | 6074 / Cap 8314 bis 31.10. |

**Commit `59479ca`** auf `design/werkbank-umstellung-20260917` (36 Dateien), **gepusht**.
`origin/main` bleibt bei `8f20654`.

**Drei echte Fehler fand erst die zentrale Prüfung** — kein Subagent hatte sie gemeldet:
5 Typfehler in `app/messages` (Union-Typ), ein Syntaxfehler in `app/home/history`, der vier
Folgefehler verdeckte, und ein ESLint-`react-hooks/purity`-Error in `app/jobs` (`Date.now()` im
Renderpfad). Alle behoben.

### Zwei Blocker, die jetzt gelten

**1. Ein PR würde scheitern.** Simuliert mit `--base 8f20654…`:
```
Brand authority required; protected path differs from trusted base: design/design-debt.json
Brand authority required; protected path differs from trusted base: design/design-lock.json
Debt baseline is immutable in ordinary PRs
```
Die Baseline ist in normalen PRs unveränderlich (Falle 38). Der Branch ist deshalb **nicht per PR
mergebar** — der Sync gehört per direktem Push auf `main` mit Markenautorität, so wie `8f20654` es
gemacht hat. **Nicht selbst ausgeführt**, weil das Mergen bei dir liegt.

**2. Die CI läuft überhaupt nicht mehr.** `gh run view` auf den Branch-Run:
> „The job was not started because recent account payments have failed or your spending limit needs
> to be increased."

Alle Jobs `steps=0` nach 3–5 s — auch die letzten drei auf `main`. **Es gibt derzeit keine
automatische Verifikation.** Die lokalen Prüfungen oben sind alles, was es gibt. Das Billing-Problem
liegt bei dir.

---

## Ausgeliefert (17.09.2026, 11:55)

**`main` ist `16eb35a` und live.**

1. **Merge nach `main`** per direktem Push (Fast-Forward `8f20654` → `59479ca`). Kein PR möglich,
   weil die Baseline dort unveränderlich ist. Im Commit geprüft: **0 Löschungen**.
2. **Deploy** über `deploy/update-on-oci.sh` — **Release-Gate 15/15**, Production build PASS,
   axe a11y PASS, visual canonicals PASS, Performance-Budgets PASS (CLS 0.0000, 1150 KB, 921 ms).
   Health: `state: ready`.
3. **Sichtbeleg** per `app-visual-regression.mjs` auf dem Deploy-Host: **`APP VISUAL PASS`**,
   30 Bilder (16 owner / 10 provider / 4 admin, mobil + Desktop). Aufräumen danach: Baum wieder
   sauber (`?? public/uploads`).

**Der Sichtbeleg fand sofort, was das Gate nicht sieht:** `/app` hatte nur **drei** Kennzahlen. Die
vierte war in Zeile 88 bereits abgefragt (`unread`), wurde aber nie gerendert. Fix in `16eb35a`,
erneut deployt, erneut belegt: „Termine 1 | Dokumente 0 | Aufträge 1 | **Ungelesen 1**".

**Was der Beleg außerdem zeigt — offen, nicht gefixt:**

- `/app/jobs` und `/pro` tragen die Werkbank-Struktur sauber: vier Kennzahlen, Segment-Umschalter
  Liste/Karten/Chronik, Unterpunkte in der Seitenleiste, rechte Spalte mit „Nächster Termin".
- **`/admin` ist per Screenshot nicht prüfbar:** die Aufnahmen zeigen die Login-Seite, byte-identisch
  mit den alten. Für den Verwaltungsbereich braucht es eine Admin-Session.

---

## Nachtrag (17.09.2026, 12:10)

**Zwei der drei Befunde sind behoben — Commit `d227eb1`, deployt, erneut belegt**
(`APP VISUAL PASS`, Gate 15/15):

1. **`/app`: doppelter Werkzeugkopf weg.** Suche und Glocke kamen zweimal — in der AppShell-Topbar
   (`src/components/shell.tsx:79`) und nochmal im Objektkopf der Seite. Der Objektkopf trägt jetzt
   nur noch Adresse und Name; die damit tote CSS-Regel `.eh-werkbank-kopf-tools` ist mit entfernt.
   Im Screenshot bestätigt.
2. **`/pro`: Marketingkopf weg.** `EHAppHeader` (Eyebrow, großer Titel, Erklärtext) → `EHPageHeader`
   mit Titel und Betriebsname. Eyebrow und Erklärtext sind verschwunden.

**Der dritte Befund braucht deine Entscheidung — er ist systemisch.**

Der Seitentitel ist auf **allen** App-Seiten zu groß. Ursache:

```
packages/eh-design/src/styles.module.css:2338
.pageTitle { font-size: var(--eh-font-section); … }

packages/eh-design/src/tokens.css:18
--eh-font-section: clamp(2rem, 3.6vw, 3.25rem);   /* 32–52 px */
```

Zum Vergleich: Der eigene Kopf der Startseite nutzt `--eh-font-body` (**17 px**) und wirkt wie ein
Werkzeug. Die Zielvorlage `a-liste.png` zeigt dort ~20 px.

`--eh-font-section` steht nur **4×** in der Datei: Zeile 39 (`EHHeading scale="section"`, Marketing),
713, 2098 (`.managerHero h1`) und **2338 (`.pageTitle`, das App-Problem)**. Die anderen drei sind
bewusst groß — es geht also um **eine Zeile**.

**Aber:** `styles.module.css` ist versiegelt, und das ist eine **Designänderung**, nicht nur eine
Baseline-Nachziehung. Deshalb nicht allein entschieden. Drei unterscheidbare Varianten:

| | Änderung | Wirkung |
|---|---|---|
| **A** | `.pageTitle` → `var(--eh-font-body)` (17 px) | exakt wie der Startseiten-Kopf, maximal werkzeugartig, deutlichster Bruch zum jetzigen Bild |
| **B** | neuer Token `--eh-font-title: 1.375rem` (22 px) für `.pageTitle` | eigene Ebene zwischen Body und Section, näher an der Zielvorlage, ein Token mehr |
| **C** | `.pageTitle` → `clamp(1.25rem, 1.6vw, 1.5rem)` (20–24 px) | responsiv, bleibt bei schmalen Viewports lesbar, ohne neuen Token |

Alle drei brauchen `eh-design-seal.mjs` (Freigabe) und einen Deploy.




