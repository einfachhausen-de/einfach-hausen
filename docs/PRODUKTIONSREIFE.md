# Produktionsreife — was noch fehlt

**Stand:** 15.09.2026, 20:10 · `main` = `0d41664` = `origin/main`, Arbeitsbaum sauber.

> **20:10 — Korrektur: der Deploy war nicht blockiert.** Live steht **`272811e`**
> (Deploy um **16:43 UTC**, `.next/BUILD_ID` 16:39, `uptime_seconds` zurückgesetzt) —
> der Rückstand von 45 Commits ist **aufgeholt**. Die Baselines wurden auf dem
> CI-Runner neu erzeugt (Runs 349/362/371) und stimmen mit dem Deploy-Host überein;
> das Skript kann nicht neu starten, ohne dass der Gate besteht (`update-on-oci.sh:106`,
> kein Bypass). **Mein `hyphens`-Fix war eine Verschlechterung** und ist in `3e5108d`
> zurückgenommen — Belege und Begründung in **`DEPLOY-BLOCKER.md`**.
**Geprüft von:** WorkBuddy, gegen den echten Repo-Stand, die echten CI-Läufe und die
live laufende Produktion. Keine Schätzung — jede Aussage unten hat eine Fundstelle.

**Änderung 18:20:** Die drei Blocker aus der 16:30-Fassung sind **behoben** — ein
parallel arbeitender Agent hat sie zwischen 14:37 und 16:08 gefixt. Abschnitt 2
dokumentiert, was wann behoben wurde und womit es belegt ist. Der Deploy-Abstand
(Abschnitt 3.1) ist in derselben Zeit **größer** geworden.

---

## 1. Was heute belegt steht

| Prüfung | Ergebnis | Beleg |
|---|---|---|
| Produktion erreichbar | ✅ | `https://einfachhausen.de` → 200, Cloudflare → OCI-VM |
| Health | ✅ `ok:true`, `state:ready` | `/api/health`: `database:ready`, `auth_authority:reachable`, `smtp:configured`, `storage:ready` |
| Produktions-Smoke (18 Routen) | ✅ **18/18 PASS** | `node scripts/production-smoke.mjs` |
| Design-Guard auf `main` | ✅ grün | Läufe auf `f1187f8`, `8079f8c`, `136baa5` → success |
| **Browser-Matrix** | ✅ **chromium + webkit + firefox grün** | Lauf `34990360782` auf `f1187f8`, bestätigt im laufenden Lauf `34993069862` auf `136baa5` |
| Quality-Gate, Schritte 1–20 | ✅ grün | Lint, Typecheck, Build, Perf, a11y, Visual (Website + Apps), Responsive, a11y-Apps, a11y-Matrix, Security, Supply-Chain, Fixtures, Domain-Suiten, CRM-Acceptance |

**Die Browser-Matrix war über Wochen rot. Sie ist jetzt in allen drei Engines grün** —
zum zweiten Mal bestätigt. Das ist der härteste Beleg, den dieses Projekt bisher hat.

---

## 2. Die drei Blocker — behoben

### Blocker 1 — E2E-Selektor-Kollision → **behoben** (`e42e129`)

`getByLabel()` matcht **Teilstrings**. Das Label der neuen Kontext-Tabs (`Bereichsseiten`)
kollidierte mit dem Formularfeld `Bereich` (`select#hist-category`) →
`strict mode violation` in allen drei Browsern.

**Gewählter Fix:** Das Label der Kontext-Tabs heißt jetzt **„Kontextnavigation"**
(`src/components/shell.tsx`, `EHRouteTabs label="Kontextnavigation"`). Der Begriff
stammt aus dem Navigationskonzept und enthält „Bereich" nicht mehr.

⚠️ **Das ist die zweite Runde an derselben Stelle.** Commit `2733e16` hatte das Label
schon einmal umbenannt (`Bereich wechseln` → `Bereichsseiten`) und die Kollision damit
nur verschoben, weil „Bereichsseiten" das Wort weiter enthält. Der Test selbst ist
**unverändert** — `scripts/e2e.mjs:705` und `scripts/e2e-architecture.mjs:180` nutzen
weiterhin den Teilstring-Match `getByLabel('Bereich')`.

**Noch offen (nicht dringend):** Der Selektor bleibt eine Landmine. Heute ist er
eindeutig — die einzigen verbleibenden „Bereich"-Namen sind die beiden legitimen
Formularfelder (`history/page.tsx:42`, `house-profile-forms.tsx:42`). Aber jede künftige
Navigation, die das Wort „Bereich" im `aria-label` trägt, bricht beide Skripte wieder.
Robust wäre:
```js
await owner.locator('#hist-category').selectOption({label:'Dach & Fassade'});
```
Das ist eine Zeile — bewusst **nicht** jetzt gepusht, weil ein Push den laufenden
Lauf `34993069862` abbrechen würde (`concurrency: cancel-in-progress`).

### Blocker 2 — Zeitlimit des Quality-Jobs → **behoben** (`8b5c241`)

`timeout-minutes: 20` → **45**. Der Job starb vorher an seinem eigenen Budget (Lauf
`34976646549`: 13:42:15 → 14:02:35 = 20 min 20 s), was Schritt 21 abbrach und die
Schritte 22/23 nie ausführte. Die Begründung im Commit nennt genau das: „At 20 minutes
the job was killed around step 21, which is why architecture acceptance and production
smoke contract had never run at all."

Die Browser-Matrix (eigener Job) hat weiterhin 20 min, der Baseline-Job 30 min.

### Blocker 3 — Architecture acceptance → **in Arbeit, Fix gepusht**

Mit dem größeren Budget läuft der Schritt jetzt wirklich — und fällt **inhaltlich**
(Lauf `34990360782`, Job `104453111092`):
```
Expected text not found: <ownerEmail> | url=…/pro/leads
body-tail: Musterstraße 12, 46325 Borken · Olivia Eigentümer · 160 m² Wohnfläche · …
```
Der Makler sieht nach der Freigabe **den Namen, aber nicht die E-Mail**. Ursache war
kein Testfehler: `db6acb0` (Umstellung auf Design-System-Blöcke) hat `match.email` aus
dem Rendering verloren, während die Query `u.email` weiter selektierte — **eine
freigegebene Anfrage trug damit gar keinen Kontaktkanal, sobald der Eigentümer keine
Telefonnummer hatte.** Das war ein echter Produktfehler.

Behoben in `136baa5` (`src/app/pro/leads/page.tsx`). Der Lauf `34993069862` auf genau
diesem Commit ist in Arbeit; zum Prüfzeitpunkt war der Hauptjob bei Schritt 17, die
Browser-Matrix bereits **dreimal grün**.

**Was danach noch nie gelaufen ist:** Schritte 22 („Browser product acceptance",
`npm run test:e2e`) und 23 („Production smoke contract", `npm run test:smoke`). Sie
werden übersprungen, solange Schritt 21 rot ist — das Zeitproblem ist weg, das
Kettenproblem bleibt. Sie laufen erstmals, sobald `136baa5` durchgeht.

### Nebenbei behoben

- **Datenschutzerklärung** (`0c0eeba`, `464c1bd`) — auf den tatsächlichen Stand gebracht.
  Der Befund aus Abschnitt 3.3 der 16:30-Fassung ist damit erledigt.
- **Architektur-Abnahme gegen die echte Identitäts-Autorität** (`8079f8c`, `f1187f8`).

---

## 3. Was jetzt noch offen ist

### 3.1 Der Code ist weiter als das Produkt — und der Abstand wächst (wichtigster Punkt)

> **Erledigt am 15.09. um 16:43 UTC.** Der Abstand ist **null**: Live steht `272811e`,
> der Gate lief 15/15 durch, der Deploy ist nachweislich erfolgt. Der Abschnitt bleibt
> als Beschreibung des Zustands *vor* dem 15.09. stehen — und als Warnung, dass es
> weiterhin **keinen Deploy-Workflow** gibt: der Abstand kann jederzeit wieder
> entstehen, weil niemand deployt, wenn niemand es anstößt.

Es gibt **keinen Deploy-Workflow**. Deploy ist ein manueller Schritt:
`deploy/update-on-oci.sh` auf der OCI-VM (`APP_DIR=/srv/einfach-hausen`), verlangt
Branch `main`.

**Beleg, dass nicht deployt wurde:** `/api/health` meldet
`uptime_seconds: 91273` ≈ **25,4 Stunden** — der Produktionsprozess läuft seit
**14.09. gegen 16:54** durch, ohne Neustart. In dieser Zeit sind **über 50 Commits** auf
`main` gelandet.

Was davon live fehlt:

| Commit | Was live noch fehlt |
|---|---|
| `13eec58`, `78f2a29` | Navigationsumbau: fünf Bereiche aus einer Quelle, Kontext-Tabs |
| `b005076` | „Verträge & Tarife" (`/app/contracts`) samt Datenmodell |
| `95f6023` | Breadcrumbs auf allen Seiten mit App-Chrome |
| `b0a02a2`, `386110d` | Mobile-Overflow-Fixes |
| `0c0eeba` | **Datenschutzerklärung** |
| `136baa5` | Makler-Leads zeigen die Kontakt-E-Mail wieder |

Das ist der direkte Widerspruch zu Ginas Wunsch: Der Navigationsumbau, die Breadcrumbs
und „Verträge & Tarife" existieren — nur nicht auf der Seite, die sie aufruft. Der
Datenschutztext, der live steht, ist der **alte, inhaltlich falsche**.

**Erster Schritt:** `git log -1` auf der VM gegen `136baa5` vergleichen. Nicht bewiesen,
sondern begründet — der Uptime-Wert ist ein starker Hinweis, kein Beweis.

### 3.2 Rendering und Cache — messbar, nicht theoretisch

Live-Antwort auf `/`:
```
cache-control: private, no-cache, no-store, max-age=0, must-revalidate
cf-cache-status: DYNAMIC
```
Ursache ist `await headers()` in `src/app/layout.tsx:46-47`. **111 von 141 Routen
rendern bei jedem Aufruf neu** — die ganze Marketing-Oberfläche inklusive. Die
Correlation-ID, für die dieser Preis bezahlt wird, ist auf Marketing-Seiten immer leer
(der Proxy läuft nur auf `/app`, `/pro`, `/lexikon`).

**Fix-Skizze:** `headers()` raus, die ID in `/api/errors` direkt aus dem Request-Header
lesen. `/` darf dynamisch bleiben (Session-Redirect). Danach prüfen, ob
`force-static` in den Lexikon-Routen überflüssig wird. **Höchster Hebel für Ladezeit und
Serverlast.**

### 3.3 Betrieb

| Punkt | Stand |
|---|---|
| Freier Plattenplatz auf der Produktions-VM | ⚠️ **16 %** — unverändert, im Auge behalten |
| Offsite-Backup | ❌ Sicherung liegt same-host im Supabase-Bucket; Zweitkopie außerhalb braucht Tenancy-Entscheidung |
| Monitoring / Fehlerlogging | Teil von Issue **#10**, nicht abgeschlossen |
| Supabase-Gateway geteilt | ⚠️ fremde Projekte können Auth-User löschen — eigenes Projekt/Keys empfohlen |

### 3.4 Zwei Design-Entscheidungen, die auf Gina warten

1. **`hyphens: auto`** bricht H1-Wörter mitten im Wort („Anfra-gen"). Preis für den
   Mobile-Overflow-Fix `abf1d8a`. Gewollt?
2. **`overflow-wrap: anywhere` am `.text` des Design-Systems** — löst die
   E-Mail-Overflow-Klasse generisch statt Seite für Seite. Liegt hinter der Design-Lock
   → `generate` + `seal` = Brand-Authority. **Ohne Freigabe nicht anfassen.**

### 3.5 Verteilung und Zugänge

- **Issue #12:** PWA bleibt der Pilot. Native Stores und Push sind unentschieden —
  Entscheidung dokumentieren, dann bauen. Keine Fake-Buttons.
- **Google/Apple-SSO:** ohne echte OAuth-Credentials (Google Cloud + Apple Developer)
  nicht umsetzbar. Externer Blocker.
- **Demo-Konten prüfen:** der GoTrue-Cleanup-Bug kann
  `kunde@demo.einfachhausen.de` / `handwerker@demo.einfachhausen.de` gelöscht haben →
  `node scripts/seed-demo-users.mjs`.
- **Repo-Einstellung:** „Allow GitHub Actions to create and approve pull requests"
  aktivieren (Jeremy, Admin) — sonst kann der Baseline-Job seinen PR nicht anlegen.

### 3.6 Hausakte wirkt noch wie ein Prototyp

Issue **#91** (`EH-MATURE-REFERENCE`): visuelle Abnahme, Integration und Deploy offen.
Referenzkandidat liegt bereit, ist aber nicht global stilfreigegeben.

### 3.7 Lokale Arbeitsumgebung

Der Alt-Klon `dev/einfachhausen-landing-page/` sabotiert `npm run` im aktiven Klon
(Next 16.3.1 vs. 16.3.4 → zwei Modul-Singletons → Build bricht). Auflösen oder den
aktiven Klon nach `dev/einfachhausen/` entnesten. **Bis dahin lokal immer
`./node_modules/.bin/<bin>` direkt aufrufen.**

---

## 3.8 Seitenzustand — vier Prüfteams, Ergebnis

Vier unabhängige Prüfungen aller Oberflächen (je ein Auftrag pro Bereich, gegen den
Quelltext, mit Datei:Zeile-Beleg). **Kernbefund: das Produkt ist überwiegend fertig.**
Die Lücken sind einzeln benennbar, nicht flächig.

| Oberfläche | Urteil |
|---|---|
| Eigentümer-App `/app` (26 Routen) | 20 von 26 fertig. Die Lücken sind fast alle „Backend fehlt", nicht „UI fehlt" |
| Handwerker-App `/pro` (14 Routen) | inhaltlich fertig; Lücken sind **Erreichbarkeit** und Randzustände |
| Öffentliche Website + Auth | Marketing-Seiten echt und konsistent; Schwächen liegen in den **Übergängen** |
| CRM `/admin` (4 Routen) | nachträglich angebaut; nutzt das Design-System für Zustände **gar nicht** |

### Die schwersten Einzelbefunde

1. **Die Anliegen-Eingabe der Startseite geht verloren.** Startseite, Footer-Band und
   `/leistungen` senden ein GET-Feld `request` an `/register`
   (`intake-form.tsx:6`, `request-form.tsx:19`). `/register` liest nur `sp.role`
   (`register/page.tsx:14`). **Der Text, den ein Interessent eintippt, kommt nie an.**
   Das ist der teuerste Einzelfehler im Produkt.
2. **`/register` zeigt keine Serverfehler.** `?error=Konto existiert bereits`,
   Rate-Limit, Supabase-Ausfall werden verworfen (`register/page.tsx:11-14` gegen
   `actions.ts:111,122,133`). Wer scheitert, sieht nichts und hält die Seite für kaputt.
   Dasselbe auf `/login`.
3. **Demo-Zugänge stehen ungeschützt auf der Live-Anmeldeseite** —
   „Eigentümer-Demo starten", `kunde`/`admin` (`LoginForm.tsx:325-341`).
   Vor jeder Präsentation erledigen.
4. **Vier `/pro`-Seiten antworten auf einen legitimen leeren Kontext mit weißem
   Bildschirm** (`return null` statt Zustandskomponente): `orders:15`, `messages:26`,
   `plans:12`, `leads:15`.
5. **Zwei fertige Seiten sind unauffindbar:** `/pro/leads` und `/pro/onboarding` haben
   keinen Navigationseintrag (`nav-config.ts:102`). Eine Seite, die niemand erreicht,
   ist für den Nutzer nicht fertig.
6. **`/pro/invoices` fehlt ganz** — keine Übersicht, obwohl die Navigation sie führt
   (`nav-config.ts:107`).
7. **Sichtbarer Platzhalter:** „Notizen: noch nicht verfügbar" auf `/app/home:77`.
8. **AGB existiert nicht** (`agb/page.tsx:26-30` sagt „in externer Freigabe").
   `/impressum` ist unvollständig (§5 DDG: keine Anschrift, kein Telefon).
9. **Eingeloggte erreichen die öffentliche Website nicht mehr** —
   `src/app/page.tsx:29` schickt jede Session auf `/app` oder `/pro`. Jeder
   `href="/"` wird zum Bounce (`site-shell.tsx:103,214`, `error.tsx:46` u. a.).

### Die systemische Ursache (ein Fix, viele Seiten)

Fast alle Querschnittslücken sind **dieselbe fehlende Konvention**:

- **Erfolgsmeldungen fehlen bei Mutationen app-weit.** `admin/page.tsx:48` rendert nur
  `sp.error`; `crm/actions.ts:81-91`, `actions.ts:564-570`, `:584-590`, `:592-613`
  revalidieren ohne Rückmeldung. Der Nutzer weiß nie, ob es geklappt hat.
- **Stille Validierungsfehler in Server-Actions** — `admin/actions.ts:30`, `:90`,
  `actions.ts:877`, `:604` (`else return;`), `notifications/actions.ts:16`.
- **Kein kanonischer „kein Zugriff"-Zustand.** `EHEmptyState`, `EHLoadingState`,
  `EHErrorState` existieren (`packages/eh-design/src/app.tsx:35-39`), aber
  Berechtigungsfälle improvisieren je Seite.
- **`EHList` hat keinen Leerzustand** (`app.tsx:45-47`) — nur `EHDataTable` hat einen.
  Folge: `app/home/history/page.tsx:70` rendert eine Überschrift ohne Inhalt.
- **Ein Legacy-Cluster** aus der Supabase-Zeit (eigener Datenstack, eigenes Design,
  aus keiner Navigation erreichbar): `/anfrage/*`, `/ansprechpartner`, `/check-email`,
  `/welcome`, `/role`, `/register-owner`, `/register-pro`, `/onboarding/pro/*`.
  Wer ihn entfernt, schließt mehrere Befunde gleichzeitig.

### Reihenfolge nach Nutzen

1. `request` in `/register` ankommen lassen + `error`/`notice` anzeigen — **zwei
   Dateien, repariert den gesamten Einstiegstrichter.**
2. Demo-Zugänge von der Live-Anmeldeseite nehmen.
3. Die vier `return null`-Seiten auf die vorhandene Zustandskomponente umstellen.
4. `/pro/leads` und `/pro/onboarding` in die Navigation, `/pro/invoices`-Übersicht bauen.
5. Ein gemeinsamer Erfolgs-/Fehler-Helfer für Server-Actions, dann auf die
   meistgenutzten anwenden.
6. Legacy-Cluster archivieren und entfernen.
7. AGB und Impressum — extern, blockiert die Bezahl-Tarife.

---

## 4. Empfohlene Reihenfolge

| # | Schritt | Stand am 15.09., 20:10 |
|---|---|---|
| 1 | `hyphens: auto` aus `styles.module.css:84` entfernen | ❌ **zurückgenommen** (`3e5108d`). Gerendert und angesehen: ohne Trennung ist `/hilfe` 4 Zeilen mit Stummelzeile statt 3 mit korrektem Umbruch. Der Gate lief ohne die Änderung durch. |
| 2 | `eh-design-generate` → `eh-design-seal` | entfällt — Zustand wiederhergestellt, `EH_DESIGN_CONSISTENT` |
| 3 | Baselines über den CI-Job neu erzeugen | ✅ erledigt (Runs 349/362/371, vom parallel arbeitenden Agenten) |
| 4 | **Deploy auf die VM** | ✅ **erledigt 15.09. 16:43 UTC** — live ist `272811e` |
| 5 | Anliegen-Eingabe + Fehlermeldungen in `/register` | ✅ `9507789` |
| 6 | Demo-Zugänge von der Live-Anmeldeseite | ⏸ **Entscheidung** — Kill-Switch im UI nicht verdrahtet, drei Suiten (inkl. Browser-Abnahme) fordern die Demo-Tokens |
| 7 | Vier `return null`-Seiten im Partnerbereich | ✅ `84f94a8` |
| 8 | `getByLabel('Bereich')` auf `#hist-category` | ✅ `29a8917` |
| 9 | `headers()` aus dem Root-Layout | ⏸ offen — **größter Hebel für Ladezeit und Serverlast** |
| 10 | Legacy-Cluster entfernen, AGB/Impressum | ⏸ offen / extern |
| 11 | Navigationseintrag für `/pro/leads` | ⏸ **Entscheidung** — ändert das Chrome von `/pro`, die App-Baselines halten es fest |

**Schritt 4 ist erledigt.** Die Punkte mit ⏸ sind keine offenen Reparaturen, sondern
Entscheidungen (Gestaltung, Recht, Umbau) — siehe `FALLEN.md` 27–29.

**Schritt 3 ist der einzige, der Ginas Wunsch direkt erfüllt** — und inzwischen der
einzige, der noch zwischen „grüner CI" und „sichtbarem Produkt" steht.

---

## 5. Was ausdrücklich **nicht** zu tun ist

- **Design-Lock oder Siegel nicht ohne Freigabe anfassen.** `generate` → `seal` ist
  Brand-Authority (Jeremy, @Delqhi).
- **Visual-Baselines nicht lokal erzeugen** — macOS vs. Linux driften schon ohne
  Änderung um bis zu 6,5 % bei 8 % Budget. Nur über den CI-Job.
- **Keinen CI-Lauf abbrechen** — er räumt seine Supabase-Identitäten nicht auf, und
  `concurrency: cancel-in-progress` heißt: ein Push bricht den laufenden Lauf ab.
- **Footer-Redesign nicht wiederbeleben** (verworfen am 14.09.).
- **Keine Rechtstexte erfinden.** Die technische Diskrepanz benennen, die Bewertung
  macht jemand mit Zulassung.
