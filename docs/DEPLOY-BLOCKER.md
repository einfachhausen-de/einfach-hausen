# Der Deploy-Blocker vom 14.–15.09. — Ursache, Auflösung, Korrektur

**Erste Untersuchung:** 15.09.2026, 18:20–19:05 · **Korrektur:** 15.09.2026, 19:30 · **Von:** WorkBuddy

> ## ⚠️ Korrektur zur ersten Fassung
>
> Die erste Fassung dieses Dokuments endete mit „der Deploy ist blockiert, der Fix ist
> `hyphens: auto` entfernen". **Beides ist überholt.**
>
> 1. **Der Deploy war nicht mehr blockiert.** Um **16:43 UTC am 15.09.** ist ein
>    vollständiger Deploy durchgelaufen. Live steht `272811e`, nicht mehr `136fbf1` —
>    der Rückstand von 45 Commits ist **aufgeholt**. Belege: `.next/BUILD_ID` vom
>    15.09. 16:39, `systemctl show -p ActiveEnterTimestamp` → 16:43:02 UTC,
>    `/api/health` → `uptime_seconds` zurückgesetzt.
> 2. **Mein vorgeschlagener Fix war eine Verschlechterung** und wurde in `3e5108d`
>    zurückgenommen. Begründung in Abschnitt 4.
>
> Die Ursachenanalyse unten ist trotzdem gültig — sie erklärt, *warum* es zwei Tage
> lang klemmte. Nur die Schlussfolgerung war falsch.

---

## 1. Was tatsächlich passiert ist

| Frage | Antwort | Beleg |
|---|---|---|
| Was lief live (14.09.)? | `136fbf1` (Merge PR #107) | `git log -1` auf der VM |
| Wie weit war `main` voraus? | **45 Commits** | `git rev-list --count` |
| Seit wann kein Deploy? | 14.09. 14:56:54 UTC | `systemctl show -p ActiveEnterTimestamp` |
| **Was läuft jetzt live?** | **`272811e`**, gesund | VM-HEAD, `.next/BUILD_ID`, `/api/health` |
| Seit wann? | **15.09. 16:43:02 UTC** | `journalctl -u einfach-hausen` |

Der Neustart um 16:43 ist der harte Beweis für einen erfolgreichen Deploy:
`deploy/update-on-oci.sh` kann den Dienst **nicht** neu starten, ohne dass der
Release-Gate vorher besteht — bei Fehlschlag steht in Zeile 106 ein `exit 1`, und es
gibt **keinen Bypass-Schalter**. Das Skript ist an dieser Stelle stur, und das ist gut
so.

---

## 2. Warum es zwei Tage klemmte

**Eine von 15 Prüfungen.** Layer 3, die visuelle Abnahme:

```
FAIL  visual canonicals — partner: 20.01% pixels changed (budget 8%)
                         hilfe:   13.15% pixels changed (budget 8%)
```

Der Unterschied war **ein Zeilenumbruch**:

| | Überschrift |
|---|---|
| **Baseline** | „Passende Anfra-**gen.** Persönlicher Kundenkontakt. 0 % Provision." — 4 Zeilen |
| **Deploy-Host** | „Passende **Anfragen.** …" — 5 Zeilen |

Eine Zeile mehr verschiebt alles darunter → das Differenzbild ist die ganze Seite als
roter Block. Kein kaputtes Element, eine verschobene Seite.

### Die Ursache

`packages/eh-design/src/styles.module.css:84`

```css
.heroCopy .heading { max-width: 16ch; overflow-wrap: anywhere; hyphens: auto; }
```

**`hyphens: auto` ist maschinenabhängig.** Ob getrennt wird, hängt davon ab, ob der
Browser ein deutsches Silbentrennungswörterbuch mitbringt. Gegenproben:

- `hyphen-de` auf der VM installiert → Zahlen **unverändert** auf die Hundertstel.
  Der Playwright-Chromium nutzt Systemwörterbücher nicht.
- Direkter Test auf der VM: `hyphens:auto`, `lang="de"`, Box 120 px,
  „Verantwortungsgemeinschaft" → **1 Zeile, 233 px** (läuft über, statt zu trennen).
- macOS-Chrome auf der Live-Seite → **4 Zeilen, mit Trennung „Anfra-"**, also wie die
  Baseline.

### Warum es *diesen* Zeitpunkt hatte

```
14.09.  PR #107 deployt          → Gate 15/15 grün
14.09.  f15f152 (Run 338)        → Baselines auf dem CI-Runner neu erzeugt
        ────────────────────────  ← ab hier kam kein Deploy mehr durch
```

Die Baselines kodierten die Silbentrennung **eines bestimmten Rechners**. Der
Workflow-Kommentar benennt das Problem selbst: „Regenerating them anywhere else bakes
in that machine's font rasterisation and antialiasing." Die Abhilfe war also
**prozedural**, nicht gestalterisch.

---

## 3. Wie es aufgelöst wurde — nicht von mir

Ein parallel arbeitender Agent hat die Baselines **auf dem CI-Runner** neu erzeugt
(`4b83c44` Run 349, `8f33bda` Run 362, `527dd0e` Run 371) und damit CI und Deploy-Host
zur Deckung gebracht. Danach lief der Gate 15/15 durch, und um 16:43 war der Stand
live. Das ist der richtige Fix: nicht die Gestaltung ändern, sondern die Messung
reproduzierbar machen.

**Regel für die Zukunft:** Baselines entstehen **nur** über den CI-Job
(`gh workflow run quality.yml --ref main -f update_baselines=true`). Lokal erzeugte
Baselines sind sofort wieder rot.

---

## 4. Mein Fix war falsch — und warum

Ich hatte `hyphens: auto` entfernt (Commit `b9a7621`), mit dem Argument, das mache das
Layout maschinenunabhängig. Der CI-Lauf auf genau diesem Commit gab mir recht
(Schritt 11 rot, `/hilfe` 13,15 %), aber er zeigte auch: **es war nicht mehr nötig.**

Dann habe ich die beiden Varianten gerendert und angesehen (Chrome, Live-Seite, H1 mit
`hyphens: auto` und mit `hyphens: none`):

| `/hilfe` — H1 „Klare Antworten, bevor du irgendetwas beauftragst." | |
|---|---|
| **mit** `hyphens: auto` | 3 Zeilen, 214 px hoch — „irgendet-**was**", typografisch korrekt |
| **ohne** | 4 Zeilen, 286 px hoch — Stummelzeile „bevor du", Hero 72 px höher |

**Die Silbentrennung sieht besser aus, nicht schlechter.** Der Preis, den `hyphens: auto`
verlangt, war die maschinenabhängige Messung — und die ist seit Abschnitt 3 durch den
CI-Job bezahlt. Damit blieb von meinem Fix nur die Verschlechterung.

Zusätzlich: `/partner` und `/hilfe` ändern sich auf macOS **gar nicht** (0 px), auf dem
CI-Runner aber um 20 % bzw. 13 %. Genau das ist die Plattformabhängigkeit — und genau
deshalb ist ein Pixel-Baseline kein Ort für eine Eigenschaft, die der Rechner entscheidet.
Das bleibt ein echter Befund, nur ist die Antwort „Baselines nur in CI", nicht „Eigenschaft
entfernen".

**Zurückgenommen in `3e5108d`.** Der gesiegelte Design-Zustand ist wiederhergestellt
(`EH_DESIGN_CONSISTENT`), `styles.module.css:84` steht wieder wie zuvor.

**Offen für Jeremy/Gina** (`PRODUKTIONSREIFE.md` §3.4): Wenn „Passende Anfra-gen." nicht
gewollt ist, ist die saubere Lösung nicht `hyphens` entfernen, sondern
`max-width: 16ch` auf der betroffenen Block-Klasse weiten — dann bricht die Zeile an der
Wortgrenze, ganz ohne Trennung. Das ist eine Design-Entscheidung hinter dem Siegel.

---

## 5. Nebenbefund: Versionsdrift bei Playwright

| Ort | `playwright-core` |
|---|---|
| `package.json` | `^1.62.1` (Caret-Range) |
| Lokal (macOS) | **1.63.0** |
| Deploy-Host | **1.62.1** |
| CI | lädt den Browser mit `npx playwright@1.62.1`, installiert das Paket aber aus der Lockfile |

Drei Stellen entscheiden über die Browser-Version, eine davon über eine Range. Das ist
eine zweite Quelle für „gleicher Code, anderes Rendering". Sauber wäre: exakt pinnen und
überall denselben Stand benutzen.

---

## 6. Was ich auf dem Produktions-Host verändert habe

| Änderung | Wirkung | Rückgängig |
|---|---|---|
| `hyphen-de` installiert (apt) | **keine** — der Browser nutzt es nachweislich nicht | `sudo apt-get remove hyphen-de` |
| `/tmp/eh-deploy.log`, `/tmp/hyph-probe.mjs` | keine (letztere wieder entfernt) | löschen |

Nicht verändert: kein Paket des Projekts, keine Datei im Repo, kein Dienst, keine
Datenbank. Der abgebrochene Deploy-Versuch kam **vor** dem Neustart zum Stehen.

---

## 7. Die echte Ursache: die CPU-Architektur

> **Korrektur vom 15.09., 20:40.** Eine frühere Fassung dieses Abschnitts hieß „Der Beweis,
> dass es nie die Maschine war". **Diese Schlussfolgerung war falsch.** Der Deploy ist am
> 15.09. um 18:04 auf der VM erneut am visuellen Gate gescheitert — mit **wortgleichen
> Zahlen**. Was hier stand, ist unten richtiggestellt.

### Was tatsächlich passiert

Der Deploy von `be0557d` auf die VM am 15.09. um 18:04 UTC:

```
FAIL  visual canonicals (20 shots, mobile+desktop, pixel budget)
      partner: 20.01% pixels changed (budget 8%)
      hilfe:   13.15% pixels changed (budget 8%)
Release gate: 14/15 passed
Release gate failed — deployment aborted.
```

Dieselben zwei Routen und dieselben Zahlen wie beim „Blocker" — **auf dem Deploy-Host**,
mit einem Baum, dessen Baselines und Stylesheet byte-identisch mit dem laufenden `272811e`
sind. Damit ist die Zustandsdifferenz-Erklärung widerlegt: gleicher Stand, gleiche
Baselines, anderes Ergebnis.

### Der Sehtest

`.sin-gpt-web/evidence/release-gate/visual-actual/hilfe.png` der VM gegen
`tests/visual-baselines/hilfe.png`:

- **Baseline:** „Klare Antworten, / bevor du irgendet**-** / **was** beauftragst." — 3 Zeilen
- **VM:** „Klare Antworten, / bevor du / irgendetwas / beauftragst." — 4 Zeilen

Dazu die Dateigrößen, die die VM-Aufnahme in die Nähe der **Baseline ohne Silbentrennung**
(`cba0c2d`) rücken, nicht in die Nähe der committeten:

| Bild | Baseline (`272811e`) | VM gerendert | `cba0c2d` |
|---|---|---|---|
| `partner.png` | 121484 | **90840** | 90864 |
| `hilfe@desktop.png` | 116628 | **102524** | 102521 |

### Die Messung

Ein Probe-Skript auf der VM, gestartet mit **genau dem Browser, den das Gate benutzt**
(`chromium-1234/chrome-linux/chrome`, über `playwright-core` 1.62.1), rendert denselben
Hero-Fall mit und ohne `hyphens: auto`:

```
hyphens: auto    -> 4 Zeilen, computed hyphens: auto
hyphens: manual  -> 4 Zeilen
=> SILBENTRENNUNG WIRKT NICHT (gleiche Zeilenzahl)
```

Die Eigenschaft wird als `auto` **berechnet**, hat aber **keine Wirkung**.

### Der Grund

| | Architektur | Chromium | `hyphens: auto` |
|---|---|---|---|
| CI-Runner (`ubuntu-latest`) | **x64 / x86_64** | 151.0.7922.34 (v1234) | **wirkt** |
| Deploy-Host (OCI-VM) | **aarch64 / arm64** | 151.0.7922.34 (v1234) | **wirkungslos** |

**Gleiche Browserversion, gleiche Revision, verschiedene CPU-Architektur.** Der arm64-Build
von Blink bringt keine Silbentrennungs-Implementierung mit: `ldd` und `strings` auf
`chrome-linux/chrome` finden **keine** Referenz auf `libhyphen`, obwohl
`/lib/aarch64-linux-gnu/libhyphen.so.0` installiert ist. `hyphen-de` und ein
`de_DE.UTF-8`-Locale ändern daran nichts — beides wurde geprüft.

**Deshalb war es so lange unsichtbar:** man vergleicht die Browserversion, nicht die
Architektur. Und deshalb ist „dieselbe Maschine, anderes Ergebnis" die falsche Frage —
richtig ist: **„rendert diese CPU-Architektur überhaupt gleich?"**

### Warum die vier Messpunkte trotzdem stimmen

| Commit | Stylesheet | Baselines | CI-Quality |
|---|---|---|---|
| `272811e` (live) | mit Silbentrennung | mit Silbentrennung | **grün** |
| `b9a7621` | ohne Silbentrennung | mit Silbentrennung | rot (×2) |
| `6242c69` (Wegwerf-Branch) | ohne Silbentrennung | ohne Silbentrennung | **grün** |
| `cba0c2d` | mit Silbentrennung | ohne Silbentrennung | rot |

Die Tabelle ist korrekt, ihre **Deutung** war es nicht. Sie zeigt nicht „es war nie die
Maschine", sondern: **CI rendert mit Silbentrennung.** Nur so erklärt sich, dass `cba0c2d`
(ohne-Trennung-Baselines) auf CI rot wird — CI trennt, die Baseline nicht. Und auf der VM
ist es genau umgekehrt: die VM trennt nicht, die Baseline schon. **Dieselben Zahlen aus
entgegengesetzter Richtung sind der Beweis für den Maschinenunterschied, nicht dagegen.**


### `be0557d` ist baumgleich mit `0d41664`

```
0d41664 tree: 4ba0754600c687a191dcde7b33225cf20c77c8f6
be0557d tree: 4ba0754600c687a191dcde7b33225cf20c77c8f6   => identisch
```

`git diff 0d41664 be0557d` ist leer. `be0557d` ist damit **inhaltlich derselbe Stand**,
der in CI-Lauf `35001122180` bis Schritt 13 bestanden hat — und inzwischen **vollständig
belegt**:

**CI-Lauf `35003126145` auf `be0557d`: `completed / success`, Hauptjob 27/27 Schritte,
Browser-Abnahme auf chromium, firefox und webkit — alle drei `success`.** Enthalten:
Lint, Typecheck, Production-Build, Performance-Budgets, axe, beide visuellen Stufen,
Responsive-Matrix, Accessibility-Matrix, Security, Supply-Chain, Fixtures, alle
Domänen-Suiten, CRM-Abnahme, Architektur-Abnahme und Produktions-Smoke.

**Der Code ist also vollständig grün. Es fehlt ausschließlich der Deploy — und der scheitert
an einer Eigenschaft der CPU-Architektur des Zielhosts, nicht am Code.**

**Reparatur:** `be0557d` nimmt `cba0c2d` zurück und stellt exakt den Inhalt von `0d41664`
wieder her. Kein Design-Eingriff, kein `seal`, keine Entscheidung.

---

## 7a. Der Deploy am 16:43 war keiner

Eine frühere Fassung dieses Dokuments begründete „der Deploy lief 16:43 grün durch" mit
`deploy/update-on-oci.sh:106` — das Skript kann ohne bestandenes Gate nicht neu starten,
also müsse das Gate bestanden haben. **Die Prämisse war falsch: der Neustart kam nicht vom
Skript.**

```
$ sudo journalctl --since "2026-09-15 00:00" | grep "COMMAND=/usr/bin/systemctl" | grep einfach
(leer)
```

Es gab am 15.09. **kein** `sudo systemctl restart einfach-hausen.service`. Das Skript lief
zwar — das sudo-Journal zeigt um 16:36:35–16:37:15 seine Vorbereitungsschritte (`install -d`,
beide `rsync`, `backup-einfach-hausen.sh`) und um 16:37:16 den Fast-forward auf `272811e` —
aber es erreichte die Neustart-Zeilen nie. **Das Gate ist gescheitert.** Der Neustart um
16:43:02 kam auf einem anderen Weg (direkt als root, ohne `sudo`).

Das erklärt auch, warum live trotzdem `272811e` läuft: das Gate **baut vor** dem visuellen
Layer. Ein gescheitertes Gate hinterlässt also einen frischen Build in `.next` — ein
Neustart von außen bringt ihn live, ohne dass das Gate ihn freigegeben hätte.

**Nebenwirkung, die man kennen muss:** `systemctl show` sagt `Restart=always`. Ein
gescheitertes Gate lässt `.next` **neuer** als den laufenden Prozess zurück. Ein Crash
würde diesen ungeprüften Build automatisch übernehmen. Am 15.09. wurde `.next` deshalb
nach dem fehlgeschlagenen Deploy aus `272811e` neu gebaut, damit Platte und Prozess
wieder übereinstimmen.

---

## 7b. Die Entscheidung — getroffen und ausgeliefert

`hyphens: auto` kann **nicht** Teil eines Pixel-Vertrags sein, der auf zwei
CPU-Architekturen läuft. Es gibt vier Wege:

| # | Weg | Kosten |
|---|---|---|
| **A** | `hyphens: auto` entfernen, dazu die Baselines ohne Trennung übernehmen (genau der Zustand, der in Lauf `34999852427` auf `6242c69` **CI-grün** war) | `/hilfe`-Hero wird 4 Zeilen mit Stummelzeile („bevor du"), `/partner` verschiebt sich. **Berührt das Design-Siegel → Freigabe nötig.** |
| **B** | `hyphens: auto` behalten, einen **zweiten Baseline-Satz für arm64** erzeugen und das Gate auf dem Deploy-Host dagegen prüfen lassen | Zwei Baseline-Sätze zu pflegen; Gate-Logik ändern |
| **C** | `hyphens: auto` behalten und die Umbruchstelle per **weichem Trennzeichen** (`&shy;`) in den Text setzen | Bester Kompromiss: schöner Umbruch **und** deterministisch auf jeder Architektur. Erfordert Textänderungen im Siegel, pro betroffener Zeichenkette |
| **D** | Gate auf dem Deploy-Host in einem x86_64-Container fahren | Langsam, schwer, fragil — nicht empfohlen |

**Empfehlung: A jetzt** (entsperrt den Deploy heute, ist als CI-grün belegt), **C danach**,
wenn der dreizeilige Umbruch erhalten bleiben soll. **B** ist architektonisch ehrlich, kostet
aber dauerhaft Pflege. **D** nicht.

**Nicht empfohlen:** das visuelle Gate im Deploy-Pfad abzuschwächen oder zu überspringen.
Es ist die letzte Prüfung vor der Produktion.

### Entschieden und ausgeliefert (15.09., abends)

Jeremy hat **A** gewählt. Umgesetzt über PR #114, Branch `fix/hero-hyphens-reapply`,
gemergt als **`36eaa7c`**:

- `git revert 3e5108d` holt CSS **und** Siegel gemeinsam zurück →
  `eh-design-check.mjs` meldet `EH_DESIGN_CONSISTENT`. **`eh-design-seal.mjs` musste
  nicht laufen** — das Siegel ist der Stand von `b9a7621`.
- Die Baselines wurden **auf dem Branch** erzeugt
  (`gh workflow run quality.yml --ref fix/hero-hyphens-reapply -f update_baselines=true`,
  Run 389, 15 PNGs), **nicht** über `main`. So blieb `main` durchgehend grün; der alte Weg
  (Fix nach `main`, Baselines hinterher) macht `main` absichtlich rot und lädt genau den
  Revert-Reflex ein, der hier zweimal zugeschlagen hat.
- CI auf dem Branch: `35008247103` = `completed/success`, alle Stufen, alle drei Browser.

**Der Deploy, zweimal gemessen — der sauberste Beleg dieser Seite:**

```
auf fbddf94 (ohne Fix):  Release gate: 14/15 — Layer 3 partner 20,01 % / hilfe 13,15 %
                         Release gate failed — deployment aborted.  (Produktion unangetastet)
auf 36eaa7c (mit Fix):   Release gate: 15/15 passed
                         Einfach Hausen deployment healthy on Node v22.23.0.
```

Health danach: `ok=true`, `state=ready`, `database`/`auth_authority`/`storage` = `ready`.
Im ausgelieferten CSS steht **keine** `hyphens`-Deklaration mehr.

**Der wichtigste Satz dieser Seite:** Es gibt **zwei** unabhängige Fehlerquellen, und beide
müssen zugleich stimmen — die **Architektur** (arm64 vs x64) *und* die **Paarung
Stylesheet↔Baselines**. `b9a7621` (nur CSS) und `cba0c2d` (nur Baselines) sind **beide**
rot, auf **beiden** Architekturen. Grün ist nur die Paarung. Wer nur eine Hälfte ändert,
misst eine Zustandsdifferenz und hält sie für einen Maschineneffekt.

**C bleibt offen** — als bewusste gestalterische Nachbesserung, nicht als Reparatur.

**Merksatz:** Bei einer Pixel-Abweichung ist die erste Frage nicht „was ist kaputt",
sondern **„stammen Baseline und Rendering aus demselben Stand?"** — und die zweite
„welcher Commit hat die Baseline erzeugt, und welches Stylesheet liegt daneben?".

## 8. Was der Deploy tatsächlich trägt

> **Stand nach dem Deploy:** live läuft `36eaa7c`. Die folgende Analyse beschreibt den
> Delta, der bis dahin aufgelaufen war (live `272811e` → `be0557d`), und gilt unverändert
> für alles, was inhaltlich ausgeliefert wurde — hinzu kommt die Paarung aus §7b
> (`hyphens: auto` entfernt + Baselines ohne Trennung).

Der Abstand zwischen dem, was live lief (`272811e`), und `be0557d` beträgt **8 Commits,
13 Dateien, +115/−12 Zeilen** — und berührt **keine einzige** Design- oder Baseline-Datei:

```
$ git diff --stat 272811e..be0557d -- packages/eh-design design/design-lock.json \
      tests/visual-baselines src/design-system
(leer)
```

Beide Revert-Paare (`b9a7621`↔`3e5108d`, `cba0c2d`↔`be0557d`) heben sich exakt auf. Was
bleibt, ist reine Funktion:

| Bereich | Dateien | Wirkung |
|---|---|---|
| Einstiegstrichter | `login/page.tsx`, `register/page.tsx`, `AuthShell.tsx`, `LoginForm.tsx`, `auth-shell.css` | Anliegen-Text und Servermeldungen kommen beim Nutzer an; `.arena-notice` additiv, ohne Meldung kein Rendering |
| Partnerbereich | `pro/orders`, `pro/messages`, `pro/plans`, `pro/leads` | statt `return null` (weiße Seite) jetzt `AppShell` + `ProviderState`, Aktion auf `/pro/hilfe` |
| Navigation | `nav-config.ts` | `/pro/invoices` aus `owns` entfernt (es existiert nur `/pro/invoices/[id]`) |
| Besitzerbereich | `app/home/page.tsx` | sichtbarer Platzhalter „noch nicht verfügbar" entfernt |
| Tests | `e2e.mjs`, `e2e-architecture.mjs` | „Bereich"-Feld über `#hist-category` statt über den Label-Text |

`/login` liegt im visuellen Gate der VM (`GATE_ROUTES`). Die Änderung dort ist rein
additiv: ohne Query-Parameter sind `notice` und `error` `undefined`, `.arena-notice` wird
nicht gerendert, und der Anfangszustand des Formulars ist unverändert `null`. Pixelgleich
per Konstruktion.
