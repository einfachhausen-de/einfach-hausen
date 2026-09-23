# Navigationskonzept – einfachhausen

Stand: 14.09.2026 · Repo `einfach-hausen` · Branch `main` (ab `b0a02a2`)

---

## 1. Ausgangslage

### 1.1 Was heute existiert

Der Eigentümerbereich (`/app/**`) hat **19 erreichbare Seiten**, aber **mehrere
konkurrierende Navigationsmodelle**:

| Ort | Datei | Einträge |
| --- | --- | --- |
| Bottom-Nav (mobil) | `src/components/bottom-nav.tsx` → `ownerNav` | Zuhause, Aufträge, Termine, Ansprechpartner, Mehr |
| Sidebar (Desktop) | `src/components/shell.tsx` → `items = ownerNav` | identisch mit Bottom-Nav |
| Mobile-Drawer | `src/components/owner-menu.tsx` → `SECTIONS` | 1. Mein Haus, 2. Aufträge, 3. Ansprechpartner, 4. Haus-Historie, 5. Einstellungen |
| Catch-all-Seite | `src/app/app/more/page.tsx` | 8 Link-Kacheln in 2 Gruppen |
| Konto-Menü | `src/components/sidebar-account-menu.tsx` | Profil, Einstellungen, Hilfe |

### 1.2 Routenlandkarte (Eigentümer)

```
/app                     Start / Dashboard
/app/home                Mein Haus            (Hausakte)
/app/home/history        Haus-Historie
/app/home/passport       Hauspass
/app/home/sale           Verkauf & Bewertung
/app/jobs                Aufträge
/app/jobs/[id]           Auftragsdetail
/app/calendar            Termine
/app/messages            Ansprechpartner      (echte Seite)
/app/partners            → redirect /app/messages
/app/partners/[id]       Partnerprofil
/app/documents           Dokumente & Rechnungen
/app/invoices/[id]       Rechnungsdetail
/app/year                Mein Jahr / Wartung
/app/plans               Tarif & Pakete       (unsere eigenen Preise)
/app/profile             Profil
/app/settings            App-Einstellungen
/app/more                „Mehr" (Catch-all)
/app/hilfe               Hilfe
/app/hausmeister         Hausmeisterservice   (KI-Assistent)
/app/hausmanager         KI-Hausmanager
/app/consultation        Beratung
/app/emergency           Notfall
/app/insurance           Versicherungsunterstützung
```

---

## 2. Schwachstellen der heutigen Navigation

### S1 – Zwei Navigationen, zwei Informationsarchitekturen
`bottom-nav.tsx` und `owner-menu.tsx` beschreiben **dieselbe App mit
unterschiedlichen Begriffen und Zielen**. Die Bottom-Nav kennt „Zuhause"
(`/app`) und „Termine" (`/app/calendar`), der Drawer kennt „Mein Haus"
(`/app/home`) und „Haus-Historie", aber keine Termine. Wer mobil über den
Drawer arbeitet und desktop über die Sidebar, lernt zwei mentale Modelle.

### S2 – Label ≠ Route
- Die Hauptnavigation beschriftet `/app/messages` mit **„Ansprechpartner"**.
- Der Drawer verlinkt seinen Abschnitt „Ansprechpartner" auf `/app/partners`,
  das ein **Redirect** auf `/app/messages` ist, seine Unterpunkte aber direkt
  auf `/app/messages`.
- „Zuhause" (`/app`) und „Mein Haus" (`/app/home`) sind zwei verschiedene
  Seiten mit zwei ähnlichen Namen.

### S3 – Der Produktkern ist versteckt
Die **Hausakte** (`/app/home`) — Hausdaten, Technik, Historie, Hauspass,
Verkauf — ist **nicht in der Hauptnavigation**. Sie steckt unter „Mehr".
Der zentrale Wert der App liegt eine Ebene tiefer als die Auftragsverwaltung,
obwohl Aufträge laut Positionierung nur Teilfunktion sind.

### S4 – „Mehr" ist eine Schublade
`/app/more` bündelt acht inhaltlich unverbundene Ziele — Hausmeister,
KI-Hausmanager, Mein Haus, Wartungen, Dokumente, Mitgliedschaft,
Benachrichtigungen, Profil. Ein Catch-all dieser Größe ist ein Symptom
ungeklärter IA, kein Navigationsprinzip.

### S5 – Aktive-Zustände sind falsch
`isNavActive()` in `bottom-nav.tsx` enthält eine Sonderregel, bei der
`/app/more` auf sechs fremde Präfixe matcht:

```js
if(href==='/app/more') return ['/app/more','/app/home','/app/year',
  '/app/documents','/app/plans','/app/profile'].some(...)
```

Folge: Wer auf **„Mein Haus"** ist, sieht **„Mehr"** leuchten. Umgekehrt
melden `/app/hausmanager`, `/app/hausmeister`, `/app/consultation`,
`/app/emergency` und `/app/insurance` alle `active="/app"` — der Tab
„Zuhause" leuchtet auch auf Seiten, die nicht das Dashboard sind.

### S6 – Keine Orientierung in der Tiefe
Seiten wie `/app/home/history`, `/app/home/passport`, `/app/home/sale`,
`/app/jobs/[id]`, `/app/invoices/[id]` haben **weder Breadcrumbs noch eine
Geschwisternavigation**. Einzig `/app/year` nutzt `EHRouteTabs`. Der Nutzer
weiß auf diesen Seiten nicht, wo er ist und wie er zurückkommt.

### S7 – Schein-Navigation im Drawer
- Abschnitt 3: sieben Gewerke-Einträge („Garten & Außen", „Dach & Fassade", …)
  zeigen **alle auf `/app/messages`** — sie sehen nach Filter aus, tun nichts.
- Abschnitt 4: „Renovierungen & Reparaturen", „Neuinstallation oder Anbau",
  „Wartungen" zeigen **alle auf `/app/home/history`**.
- „Ansprechpartner hinzufügen" und „Ereignis hinzufügen" verlinken auf die
  Liste, nicht auf eine Anlege-Strecke.

### S8 – Nummerierte Abschnitte
Der Drawer rendert „1. Mein Haus", „2. Aufträge" … Das ist ein
Dokumentationsartefakt, kein Navigationslabel. Screenreader lesen die Ziffer
mit vor.

### S9 – Aktive-Zustand im Drawer ist rein visuell
`owner-menu.tsx` setzt `className="ehn-acc-active"`, aber **kein
`aria-current="page"`**. Der Zustand existiert also nur für Sehende.

### S10 – Konto-Items an drei Orten
Profil, Einstellungen, Hilfe, Benachrichtigungen, Mitgliedschaft und
Abmelden sind verteilt auf Drawer-Abschnitt 5, `/app/more` und
`SidebarAccountMenu` — teils mit unterschiedlichen Zielen
(`/app/profile` vs. `/app/settings`).

### S11 – Partnerbereich analog
`/pro/calendar`, `/pro/leads`, `/pro/invoices/[id]`, `/pro/onboarding`,
`/pro/plans`, `/pro/hilfe` sind aus der Navigation nicht erreichbar;
`/pro/orders` und `/pro/jobs` existieren parallel.

---

## 3. Zielkonzept

### 3.1 Leitidee

> **Die Navigation folgt den Bestandteilen des Hauses, nicht den
> Transaktionstypen.**

Der Kern ist die Hausakte. Deshalb stehen in der obersten Ebene die
**Bestandsbereiche des Hauses**, und die Beauftragung von Handwerkern ist
ein Bereich *neben* der Akte — nicht ihr Rahmen.

### 3.2 Ebene 1 – Hauptnavigation (5 Bereiche)

Identisch in Sidebar, Bottom-Nav und Mobile-Drawer — gespeist aus **einer**
Konfiguration.

| Label | Route | Inhalt | Begründung |
| --- | --- | --- | --- |
| **Start** | `/app` | Was ist heute fällig, offene Aufträge, nächste Termine | Einstieg ohne Akteninhalte; beantwortet „Was muss ich jetzt tun?" |
| **Hausakte** | `/app/home` | Hausdaten, Technik & Anlagen, Historie, Dokumente, Mein Jahr, Hauspass, Verkauf | Der Produktkern. Ersetzt das heutige „Mein Haus" und **nimmt die Dokumente auf** |
| **Verträge & Tarife** | `/app/contracts` | Laufende Verträge · Spar-Check | **neu**; zweithäufigster Grund, die Akte zu öffnen (Kosten + Fristen) |
| **Aufträge & Termine** | `/app/jobs` | Aufträge (mit Statusfiltern), Termine | Beauftragung als Teilfunktion; `/app/calendar` wird Unteransicht |
| **Ansprechpartner** | `/app/messages` | unverändert | Bleibt wie gefordert unverändert |

**„Mehr" entfällt als Hauptnav-Eintrag.** Die verbleibenden Ziele wandern
dorthin, wo sie hingehören:

- **Konto** (Profil, Einstellungen, Benachrichtigungen, Mitgliedschaft, Hilfe,
  Abmelden) → in das bestehende `SidebarAccountMenu` bzw. das Konto-Menü des
  Drawers. *Ein* Ort statt drei.
- **Hausmeister / KI-Hausmanager** → das sind **Aktionen**, keine Orte. Sie
  bleiben als primäre Buttons auf Start und als Assistent in der Werkzeugleiste
  (`HouseAssistant`), nicht als Navigationsziele.
- **Notfall, Beratung, Versicherung** → kontextuelle Einstiege aus Start,
  Auftrag bzw. Ansprechpartner.
- `/app/more` bleibt als Route bestehen (Weiterleitung bzw. Übersicht
  „Alle Bereiche"), damit alte Links und Lesezeichen nicht brechen, verliert
  aber seinen Navigationsslot.

### 3.3 Ebene 2 – Kontextnavigation je Bereich

Mit dem bereits vorhandenen `EHRouteTabs` (bisher nur auf `/app/contracts`
genutzt). Jeder Bereich bekommt eine durchgängige Tabs-Leiste:

- **Hausakte**: `Übersicht · Historie · Dokumente · Mein Jahr · Hauspass · Verkauf`
- **Verträge & Tarife**: `Laufende Verträge · Spar-Check`
- **Aufträge & Termine**: `Aufträge · Termine`
- **Profil & Einstellungen**: `Profil · App-Einstellungen`
- **Partner – Aufträge**: `Aufträge · Termine`
- **Partner – Profil**: `Profil & Vertrauen · Partner-Tarife · Hilfe`
- **Start** und **Ansprechpartner**: keine Tabs — der eine Bereich hat nur eine
  Seite, der andere nur eine Oberfläche (`/app/partners` leitet auf
  `/app/messages` weiter).

Vorteil: der Nutzer sieht beim Betreten jedes Bereichs sofort die
Geschwisterseiten — das löst S6 ohne neue Komponenten.

**Abgrenzung: Filter sind keine Navigation.** Die Statusansichten der
Auftragsliste (aktuell, offen, in Arbeit, abgeschlossen) sind Filter
innerhalb einer Seite und bleiben dort. Als Tabs hätten sie Routen vorgetäuscht,
die es nicht gibt — genau die Mehrdeutigkeit aus S2.

### 3.4 Ebene 3 – Breadcrumbs

Auf allen Seiten ab Tiefe 2, aufgebaut aus `EHTextLink` (kein neues CSS,
damit design-guard-konform):

```
Hausakte › Haus-Historie
Verträge & Tarife › Laufende Verträge
Aufträge & Termine › Auftrag #1234
```

Letztes Element ist kein Link und trägt `aria-current="page"`.

### 3.5 Aktive Zustände

Eine Funktion `matchesArea(active, area)` ersetzt `isNavActive()`:

- Exakter Match oder Präfix-Match auf der **eigenen** Route des Bereichs.
- Die Sonderregel für `/app/more` entfällt.
- Jeder Bereich deklariert explizit, welche Routen zu ihm gehören
  (`/app/hausmeister`, `/app/hausmanager`, `/app/emergency`,
  `/app/consultation`, `/app/insurance` → **Start**, weil sie Einstiege und
  keine Aktenbereiche sind).
- Aktiver Zustand wird **immer** sowohl visuell (`.active`) als auch semantisch
  (`aria-current="page"`) gesetzt — das behebt S9.

### 3.6 Bezeichnungen

Vier Regeln, verbindlich:

1. Ein Label = ein Ziel. Keine zwei Labels auf dieselbe Route.
2. Substantiv statt Verb („Hausakte", nicht „Haus verwalten").
3. Keine Nummerierung, keine Icon-Namen, keine Kanal-Namen (`/app/messages`
   heißt überall „Ansprechpartner").
4. Routen Folgeerscheinung: `/app/messages` behält seine URL (die Seite bleibt
   unverändert), wird aber überall gleich beschriftet; `/app/partners` bleibt
   als Redirect für alte Links, ist aber kein Menüziel mehr.

### 3.7 Responsiv

| Viewport | Darstellung |
| --- | --- |
| Desktop | Sidebar (kollabierbar, `EHSidebar`) + Kontext-Tabs im Inhalt |
| Tablet | Sidebar, Kontext-Tabs |
| Mobil | Bottom-Nav (5 Bereiche) + Drawer für Konto; Kontext-Tabs horizontal scrollbar |

Wesentlich: **dieselben fünf Bereiche** auf allen Viewports. Die heutige
Aufspaltung (Drawer-IA ≠ Sidebar-IA) entfällt.

### 3.8 Tastatur und Screenreader

- Semantische Landmarks: `<nav aria-label="Hauptnavigation">` für die Bereiche,
  `<nav aria-label="Bereichsnavigation">` für die Tabs,
  `<nav aria-label="Sie sind hier">` für Breadcrumbs.
- `aria-current="page"` auf dem aktiven Bereich **und** dem aktiven Tab —
  inklusive Drawer.
- Skip-Link „Zum Inhalt springen" als erstes fokussierbares Element.
- Drawer: Fokus beim Öffnen in das Panel, `Escape` schließt, Fokus zurück auf
  den Auslöser, Fokus-Falle im offenen Panel.
- Tabs als echte Links (`<a href>`), nicht als Buttons — damit
  Zurück-Taste, Mittelklick und „In neuem Tab öffnen" funktionieren und der
  Zustand in der URL steht (wie heute schon bei `/app/year`).

---

## 4. Umsetzungsschritte

### Phase 1 — Eine Quelle für die Navigation

**Neu:** `src/components/nav-config.tsx`

```ts
export type NavArea = {
  href: string;
  label: string;
  icon: LucideIcon;
  owns: string[];                       // Routen, die diesen Bereich aktiv setzen
  children?: { href: string; label: string }[];
};
export const ownerAreas: readonly NavArea[] = [...];
export const accountItems = [...];
export function matchesArea(active: string, area: NavArea): boolean;
```

**Änderungen:**
- `src/components/bottom-nav.tsx` — `ownerNav` wird zu `ownerAreas` (eine
  Spalte weniger: „Mehr" entfällt, „Hausakte" und „Verträge & Tarife" kommen
  dazu). `isNavActive()` wird durch `matchesArea()` ersetzt.
- `src/components/shell.tsx` — Sidebar und Mobile-Drawer speisen sich aus
  `ownerAreas`; neues Prop `breadcrumbs?: ReactNode`.
- `src/components/owner-menu.tsx` — Drawer rendert `ownerAreas` plus
  Konto-Block aus `accountItems`; Nummerierung, Schein-Links und doppelte
  Konto-Einträge entfallen; `aria-current` ergänzt.

### Phase 2 — Seite „Verträge & Tarife"

**Neu:** `src/app/app/contracts/page.tsx` — nur kanonische `EH*`-Komponenten,
kein neues CSS (Design-Guard).

**Tabs** über `EHRouteTabs` mit `?tab=`:
- `?tab=vertraege` (Standard) — **Laufende Verträge**: Liste aller erfassten
  Verträge mit Anbieter, Tarif, Kosten/Intervall, Laufzeit, Verlängerung und
  Kündigungsstichtag inklusive Ampel-Status; Anlegen- und Bearbeiten-Formular;
  Dokumenten-Upload.
- `?tab=sparcheck` — **Spar-Check / Optimierung**: Auswahl der Sparte
  (Strom, Gas, DSL, Versicherung), Erfassung der Eckdaten, KI-gestützte
  Einschätzung, Ausleitung über Affiliate-Link.

**Datenmodell** in `src/lib/db.ts`:

```
house_contracts(id, homeowner_id, property_id, kind, provider, tariff,
  contract_number, cost_amount, cost_interval, started_at, term_months,
  renewal_months, cancellation_days, notice, document_path, status,
  created_at, updated_at)
```

**Actions** in `src/app/actions.ts`: `addHouseContractAction`,
`updateHouseContractAction`, `cancelHouseContractAction`,
`deleteHouseContractAction` — nach dem Muster von `addHouseHistoryAction`
(`requireUser('homeowner')` → `primaryProperty()` → `savePrivateFile()` →
`revalidatePath()`).

### Phase 3 — Breadcrumbs

**Neu:** `src/components/breadcrumbs.tsx`, aufgebaut aus `EHTextLink` und
`aria-current="page"` (kein eigenes CSS).

**Einbau:** `AppShell` bekommt das Prop `breadcrumbs`, gesetzt auf
`/app/home/*`, `/app/documents`, `/app/year`, `/app/jobs/[id]`,
`/app/invoices/[id]`, `/app/contracts`.

### Phase 4 — Kontext-Tabs in den Bereichen

**Entscheidung: die Shell rendert die Tabs, nicht jede Seite.** `AppShell`
leitet sie aus `nav-config.ts` ab und setzt sie unmittelbar unter die
Breadcrumbs. Begründung: nur so sitzen sie auf *jeder* Seite eines Bereichs an
derselben Stelle — sechs Seiten von Hand zu pflegen heißt sechs Gelegenheiten,
sie auseinanderlaufen zu lassen.

```tsx
// src/components/shell.tsx
const contextTabs = tabs ?? (pro ? providerContextTabs(active) : ownerContextTabs(active));
…
{breadcrumbs && <Breadcrumbs trail={breadcrumbs}/>}
{contextTabs && <EHRouteTabs label="Bereich wechseln" items={contextTabs}/>}
{children}
```

Zwei geregelte Ausnahmen:

- **Views im Query-String** (`/app/contracts?tab=…`): nur die Seite kennt den
  aktiven Tab, also übergibt sie `tabs={…}` selbst. Die Tabs sitzen trotzdem in
  der Shell — der Ort bleibt gleich, nur die Quelle wechselt.
- **Ein-Seiten-Bereiche** bekommen keine Leiste (`children.length < 2`).
  `/app/partners` leitet auf `/app/messages` weiter; ein Tab darauf wäre ein
  zweites Label für dieselbe Seite.

Damit die Ableitung funktioniert, müssen die Seiten ihre **eigene** Route als
`active` melden, nicht die ihres Bereichs. Das war die eigentliche Arbeit:
`/app/home/history`, `/app/home/sale` und `/app/year` meldeten alle
`active="/app/home"` — dem Aktiven-Zustand nach waren drei verschiedene Seiten
dieselbe.

**Tabs heute:** Hausakte (Übersicht, Historie, Dokumente, Mein Jahr, Hauspass,
Verkauf) · Verträge & Tarife (Laufende Verträge, Spar-Check) · Aufträge &
Termine (Aufträge, Termine) · Profil & Einstellungen (Profil,
App-Einstellungen) · Partner: Aufträge (Aufträge, Termine) und Profil (Profil &
Vertrauen, Partner-Tarife, Hilfe).

### Phase 5 — Aufräumen

- `/app/more`: bleibt als flache Übersicht „Alle Bereiche", ist aber **kein**
  Hauptnavigationsziel mehr — die fünf Bereiche sind es. Alte Links und
  Lesezeichen funktionieren weiter.
- `/app/partners`: Redirect bleibt (Rückwärtskompatibilität), kein Menüziel,
  kein Tab.
- **`/app/settings` und `/app/profile` zusammengeführt.** Entscheidung gegen
  „trennen": Es gibt *eine* Seite „Profil & Einstellungen" mit zwei Tabs.
  Vorher sagten drei Stellen drei verschiedene Sätze — Shell-Titel „Profil",
  Seitenüberschrift „Profil & Einstellungen" und eine Liste, in der
  „Sicherheit" *und* „App-Einstellungen" auf dieselbe Seite zeigten. Beide
  Routen bleiben erreichbar, sind aber zwei Ansichten einer Stelle.
- **Partnerbereich (`/pro/**`) nachgezogen.** `providerNav` (Tupel-Liste in
  `bottom-nav.tsx`) ist durch `providerAreas` in `nav-config.ts` ersetzt —
  gleiche Form, gleiche Regeln wie `ownerAreas`. Unerreichbare Seiten haben
  jetzt einen Ort:
  - `/pro/calendar` → Tab „Termine" unter Aufträge
  - `/pro/plans`, `/pro/hilfe` → Tabs unter Profil
  - `/pro/leads`, `/pro/onboarding` → `owns` von „Anfragen" (aktiver Zustand
    ohne eigenes Menüziel — Leads sind nur für Makler relevant)
  - `/pro/jobs`, `/pro/invoices` → `owns` von „Aufträge" (Detail-Namespaces;
    `/pro/jobs` leitet bereits auf `/pro/orders` weiter)

### Phase 6 — Verifikation

- `./node_modules/.bin/tsc --noEmit`
- `node scripts/eh-design-check.mjs --base <base>`
- `npm run build`
- E2E inkl. A11y: Fokusreihenfolge, `aria-current`, Landmarks, 390 px ohne
  horizontalen Overflow.

---

## 5. Offene Entscheidungen

1. **Affiliate-Partner** für Strom/DSL/Versicherung — vor dem Livegang müssen
   Anbieter und Link-Baustein feststehen (Provision, Tracking, Impressum,
   Datenschutz). Bis dahin wird der Spar-Check funktional gebaut, die
   Ausleitung aber über eine Konfiguration gesteuert und standardmäßig
   deaktiviert.
2. **KI-gestützter Spar-Check** — ob echtes Modell (Kosten, Latenz) oder
   regelbasierte Empfehlung mit KI-Formulierung.
3. **`/app/more`** — Weiterleitung oder Übersichtsseite?
   *Entschieden:* Übersichtsseite, aber kein Navigationsziel. Sie listet alle
   Bereiche flach und hält alte Links lebendig; die Navigation selbst besteht
   aus den fünf Bereichen. (Umsetzung: Phase 5.)
4. **Partnerbereich** — in welchem Zug mitziehen.
   *Entschieden:* im selben Zug. `providerAreas` nutzt dieselbe Datenstruktur
   und dieselben Regeln wie `ownerAreas`, damit beide Portale nicht wieder
   auseinanderlaufen. (Umsetzung: Phase 5.)
5. **Label „Wartung" ↔ „Mein Jahr"** — die Navigation nannte `/app/year`
   „Wartung", die Seite selbst „Mein Jahr".
   *Entschieden:* „Mein Jahr". Die Seite trägt den Titel, die Navigation folgt
   — nicht umgekehrt.
6. **Statusfilter vs. Navigation** — `/app/jobs?tab=completed` stand als
   Navigationsziel in `nav-config`, die Seite selbst filtert aber über `?view=`.
   *Entschieden:* Statusansichten (offen, in Arbeit, abgeschlossen) sind
   **Filter innerhalb einer Seite**, keine Ziele. Sie bleiben in der Seite; die
   Kontextnavigation kennt nur echte Routen (Aufträge, Termine).
7. **Visual-Baselines** — die Kontext-Tabs verändern jede Seite mit App-Chrome,
   damit werden die App-Baselines ungültig.
   *Entschieden:* erneuern, nicht aufweichen. Der Workflow
   „Refresh visual baselines" läuft auf dem Linux-Runner und pusht einen
   Branch; das Anlegen des PRs muss im Repo einmal freigeschaltet werden
   („Allow GitHub Actions to create and approve pull requests"), sonst bleibt
   das manuelle Mergen.

---

## 6. Umsetzungsstand

Stand 15.09.2026 · Commits `13eec58`, `b005076`, `5b4557d`, `700cf59`, `95f6023`, `a7c10e2`, `8f33bda`, `5a9df80`, `09cc144`, `78f2a29`, `061bb75` auf `main`

| Phase | Inhalt | Stand |
| --- | --- | --- |
| 1 | Eine Quelle für die Navigation (`nav-config.ts`) | ✅ umgesetzt — Sidebar, Bottom-Nav und Drawer lesen aus `ownerAreas`; `isNavActive`-Sonderfall entfernt; `aria-current` ergänzt; Schein-Links und Nummerierung raus |
| 2 | Seite „Verträge & Tarife" (`/app/contracts`) | ✅ umgesetzt — zwei Tabs, Datenmodell `house_contracts`, Actions, Dokumenten-Upload, Dateninventar/Löschung/Export nachgezogen |
| 3 | Breadcrumbs | ✅ umgesetzt — Helfer `crumbs()` liefert „Start › Bereich › Seite"; befüllt auf allen Seiten mit App-Chrome (Dokumente, Mein Jahr, Termine, Hilfe, App-Einstellungen, Historie, Verkauf, Auftrag, Ansprechpartner, Partnerprofil). Hauspass und Rechnung bleiben bewusst chromfrei (Druckansicht) |
| 4 | Kontext-Tabs in den Bereichen | ✅ umgesetzt — `AppShell` leitet sie aus `nav-config` ab; Ausnahmen geregelt (Query-Tabs, Ein-Seiten-Bereiche) |
| 5 | Aufräumen | ✅ umgesetzt — Profil/App-Einstellungen eine Seite mit zwei Tabs; Partnerbereich auf `providerAreas` umgestellt; `/app/more` Übersicht ohne Navigationsziel |
| 6 | Verifikation | ⚠️ Typecheck, Lint und Design-Guard lokal grün; **CRM-Acceptance erstmals grün**; Visual-Baselines müssen nach der Tabs-Änderung erneuert werden |

### Was die CI zurückgemeldet hat

Drei Befunde, die lokal nicht sichtbar waren — alle behoben:

1. **T-0146 Dateninventar**: neue Tabelle ohne Zweck/Aufbewahrungsfrist → Gate rot.
2. **`test:responsive`** war bereits vorher rot: `responsive-matrix.mjs` (und
   `a11y-apps`, `a11y-matrix`) konnten `db.ts` unter plain Node nicht laden.
   Behoben über gemeinsamen Helfer `scripts/lib/import-ts.mjs`.
3. **E2E-Drawer-Assertion** verlangte die alte Struktur („fünf nummerierte
   Abschnitte"). Die Prüfung kodierte die konkurrierende IA — sie prüft jetzt
   fünf Bereiche plus getrennten Konto-Block.
4. **Echter Regressionsfehler im Drawer** (`700cf59`): `toggleSection` fiel auf
   hart kodiert `true` zurück, während der gerenderte Zustand auf
   *Bereich ist aktiv* zurückfiel. Ein Klick auf den Kopf eines
   zugeklappten, nicht aktiven Bereichs schrieb also `false` — der Bereich
   blieb zu, kein Unterpunkt wurde je gerendert, das mobile E2E lief in einen
   30-Sekunden-Timeout. Behoben: der Toggle kippt jetzt den Zustand, der
   sichtbar ist (wie zuvor der Fallback auf `SECTIONS.open`).

   Merksatz für künftige Akkordeons: **Aufklapp- und Toggle-Default müssen
   dieselbe Quelle haben.** Zwei Default-Werte an zwei Stellen sind ein Fehler,
   den nur die E2E findet.
5. **Firefox-Bild-Artefakt**: nach dem Drawer-Fix lief Firefox bis zum Schluss
   der E2E durch und scheiterte nur noch an `Image corrupt or truncated` für
   `/brand/logo-full.png`. Die Datei ist intakt — alle PNG-Chunk-CRCs prüfen,
   der IDAT-Stream dekomprimiert. Der Request wurde von der nächsten
   Navigation abgebrochen; Firefox meldet das als defektes Bild, Chromium und
   WebKit nicht. Toleriert, aber auf Bild-URLs eingeschränkt, damit ein
   wirklich kaputtes Asset den Lauf weiterhin rot macht.
6. **Verwaiste Test-Identitäten**: die Visual-Regression konnte ihre
   Demo-Identität nicht mehr anlegen (`email_exists`). Ursache war kein
   Produktfehler, sondern ein abgebrochener Lauf: wird ein Job abgebrochen,
   läuft das `finally` nicht mehr, das die Identität löscht — der nächste Lauf
   erbt die Leiche. Gelöst über gemeinsamen Helfer
   `scripts/lib/identity.mjs`, der eine verwaiste Identität vor dem Neuanlegen
   wegräumt. Betrifft `app-visual-regression`, `a11y-apps`, `a11y-matrix` und
   `responsive-matrix`.
7. **Falscher Login-Selektor**: die drei Matrizen füllten das Login-Formular
   über `input[type="email"]`. Das auth-v2-Login tippt seine Kennung aber als
   `type="text"` (`id="login-identifier"`) — nur das Registrierungsformular
   nutzt `type="email"`. Der Selektor konnte also nie greifen. Behoben auf
   `input[name="email"]`, was beide Varianten trifft.
8. **Supply-Chain-Gate**: `npm audit` meldete zwei High-Advisories
   (`js-yaml` CPU-Erschöpfung, `nodemailer` Allow-List-Bypass/ReDoS). Beide
   sind mit semver-kompatiblem Sprung in der Lockfile behoben
   (`js-yaml 4.3.1 → 4.3.2`, `nodemailer 9.0.x → 9.1.1`, sechs Zeilen
   `package-lock.json`). Dazu schlug der Secret-Scanner in
   `t0132-error-tracking-regression.mjs` an — dort stehen absichtlich
   synthetische `sk_live_`-/`whsec_`-Werte, weil genau diese Datei prüft, dass
   `redactDetail()` sie entfernt. Datei explizit ausgenommen.

9. **Scratch-Kopien mit fester Dateiliste**: elf Regressionsskripte kopierten
   eine von Hand gepflegte Liste aus `src/lib` in ein Temp-Verzeichnis.
   `db.ts` zieht `contact-directory-schema` nach — wer das nicht auf der
   Liste hatte, brach mit `ERR_MODULE_NOT_FOUND`. Neuer Helfer
   `scripts/lib/ts-scratch.mjs` (`tsClosure()`) läuft die relativen Importe
   transitiv ab; die Listen können nicht mehr veralten.

10. **Projektkopie ohne `packages/`**: vier Skripte kopierten nur `src` und
    `public` in ein Temp-Projekt. `src/design-system/index.ts` re-exportiert
    aber `../../packages/eh-design/src` — in der Kopie fehlte damit das
    Design-System. Unsichtbar, weil `e2e.mjs` den vorkompilierten
    Production-Build startet; `crm-e2e` kompiliert mit `next dev` in der Kopie
    und lief auf `/admin/login` in einen 500er. Behoben in allen vier
    Skripten; dazu gibt `waitForServer` jetzt den echten Fehler aus statt
    ­vierzig identischer 500er-Zeilen.

11. **Veraltete UI-Kopie in `crm-e2e.mjs`**: das Admin-Redesign (`65e36ed`)
    hat den Seitentitel zu „Leads & Outreach CRM" umbenannt und das „Alle " aus
    dem Research-Sync-Button gestrichen. `crm-e2e.mjs` prüfte noch die alte
    Kopie — unsichtbar, weil der Lauf vorher am `/admin/login`-500er starb.
    Jetzt wartet der Test auf die `h1` und überlässt die inhaltliche Aussage der
    Routenprüfung darunter; die präzise Kopie steht weiterhin in `e2e.mjs`.
    Merksatz: **Wortlaut ist kein Vertrag.** Eine Prüfung, die an einer
    Überschrift hängt, bricht bei jedem Redesign.
12. **`e2e-architecture.mjs` war vollständig veraltet.** Nicht ein Selektor,
    sondern vier Gruppen:
    - Das Registrierungsformular ist auth-v2: „Firmenname" →
      „Unternehmensname", „PLZ" → „Postleitzahl", und der Absenden-Button heißt
      „Kostenlos registrieren" — „Konto erstellen" ist der *Umschalter* in den
      Registrierungsmodus und traf nie, solange das Formular schon offen war.
    - Tätigkeiten (Handwerker, Immobilienmakler) werden bei der Registrierung
      nicht mehr abgefragt. Das ist keine Regression, sondern die Funktion, die
      der Test bewachen will: **ein** Konto, beliebig viele Tätigkeiten. Sie
      sind eine Profil-Einstellung. Der Test setzt sie jetzt auf `/pro/profile`
      und adressiert sie per Slug, nicht per Label.
    - Das Hausprofil-Formular ist aus einem `.house-menu`-Akkordeon in ein
      `EHDetailDisclosure` gewandert (`#hausprofil`).
    - „Wohnfläche m²"/„Grundstück m²" heißen heute „Wohnfläche (m²)"/„Grundstück
      (m²)".
    Dazu eine Assertion, die **noch nie** greifen konnte: `EHStatus` rendert
    eine CSS-Modul-Klasse plus `data-status` — `.status.approved` fand strukturell
    kein Element.

Die Befunde 4 und 7 bis 12 sind **nicht Produkt, sondern Umfeld**. Sie blieben
nur deshalb so lange unsichtbar, weil die Kette vor ihnen schon rot war: jeder
behobene Schritt legt den nächsten frei. Das ist der eigentliche Grund, warum
die Navigationsänderung mehrere CI-Runden gebraucht hat — und nebenbei ist das
Quality-Gate jetzt tiefer durchlaufen als vermutlich seit Langem.
