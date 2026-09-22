# Architektur-Entscheidung: Monorepo + Plugin-Nähte

**Datum:** 2026-09-14 · **Für:** Jeremy · **Von:** WorkBuddy
**Frage:** Alles in einem Repo (Website / Kunden-CRM / Owner-App / Handwerker-App) — oder modular wie das DeepSeek Harness, „alles ein Plugin", super leicht austauschbar? Und evtl. ein eigenes Repo pro Teil?

---

## Kurzantwort

| Idee | Urteil |
|---|---|
| Ein eigenes Repo pro App | ❌ **Nein.** Verschlimmert genau dein aktuelles Problem. |
| „Alles ist ein Plugin" | ❌ **Nein.** Das ist eine Falle — richtig an den Rändern, falsch im Kern. |
| Ein Repo, modular in Pakete geteilt | ✅ **Ja.** Das ist der Weg. |

---

## 1. Warum kein eigenes Repo pro App

**Dein eigenes Vorbild widerlegt die Idee.** Das DeepSeek Harness ist *selbst* ein Monorepo: `packages/`, `apps/`, `vendor/` — ein Repo, pnpm-Workspace, TypeScript. „Everything is a plugin" beschreibt die Struktur *innerhalb* eines Repos, nicht viele Repos.

**Und du lebst den Polyrepo-Schmerz schon.** Genau das ist heute passiert:

- `einfach-hausen-crm` liegt als eigenes Repo — und ist vom Hauptrepo **auseinandergelaufen**. Der lokale Ordner war ein Snapshot, 27 Dateien hinter dem Repo. Nur ein manueller Datei-Vergleich hat das geklärt.
- Der veraltete Klon war **258 Commits** hinter `main`. Bei einem Repo merkst du das beim `git status`. Bei vier Repos merkst du es nie.
- Zehn lokale Kopien. Vier Repos würden daraus dreißig machen.

Was Polyrepo kostet: N× CI-Konfiguration, N× Dependency-Updates, jede app-übergreifende Änderung wird zu N Pull Requests, geteilte Typen driften auseinander, und atomare Refactorings sind unmöglich. Bei einem Team von zwei Menschen plus Agenten ist das reine Reibung.

**Merksatz:** Monorepo ist kein Monolith. Du bekommst die Trennung — nur ohne den Koordinationspreis.

---

## 2. Warum „alles ein Plugin" hier falsch wäre

Plugins lohnen sich an **Nähten, an denen du wirklich zwei oder mehr austauschbare Implementierungen hast** — und sie zur Laufzeit tauschen willst.

Beim Harness ist das der Kern des Problems: es *muss* beliebige LLM-Provider, Tools, Transports und Storage-Backends aufnehmen. Genau deshalb gibt es dort ADRs wie „capability seams" und „twin LLM adapters". Die Notwendigkeit erzeugt die Architektur — nicht umgekehrt.

**Bei dir ist die Notwendigkeit an genau drei Stellen gegeben:**

- E-Mail-Versand (heute `src/lib/mailer.ts` — Provider kann wechseln)
- Zahlungen (`payments.ts`)
- Social-Kanäle / Connectors (schon als Liste fehlender Credentials dokumentiert)
- Datei-Storage, und evtl. der Matching-Algorithmus

**Und an genau einer Stelle nicht: den Apps selbst.** Website, Owner-App, Handwerker-App und CRM sind keine Plugins — das sind **Anwendungen** über einem gemeinsamen Domänenkern. Sie in ein Plugin-Registry zu hängen bringt: mehr Indirektion, schlechtere Typsicherheit, unleserlichere Stacktraces und Debugging über Registrierungspunkte statt über Imports. Und du kannst die App-Shells am Ende sowieso nicht tauschen — du *willst* sie ja behalten.

Der ehrliche Preis: „alles ein Plugin" ist der klassische Weg, drei Monate ein Framework zu bauen und nichts auszuliefern. Du musst Gina aber etwas *zeigen*.

---

## 3. Wie es heute tatsächlich aussieht

Besser als gedacht — das Fundament ist schon da:

- `pnpm-workspace.yaml` existiert
- `packages/eh-design` existiert (Design-System, schon als Paket)
- `src/lib/` hat 53 Dateien Domänenlogik (matching, crm, invoices, payments, mailer, notifications, ai-engine, orchestrator, feature-flags …)
- Die vier Apps leben als Routen in *einer* Next-App: öffentliche Seiten + `/app` + `/mein-haus` (Owner), `/pro` (Handwerker), `/admin` (CRM)

⚠️ **Aber `pnpm-workspace.yaml` ist kaputt** — sie listet gar keine `packages:`. Aktuell steht dort nur `allowBuilds`. Das Workspace-Setup tut also faktisch nichts. Das ist ein kleiner, konkreter Fix mit echtem Nutzen.

---

## 4. Zielstruktur

```
apps/
  web/         öffentliche Website
  owner/       Eigenheimbesitzer-App
  provider/    Handwerker-App
  crm/         internes CRM
packages/
  domain/      Typen, Regeln, Validierung — rein, ohne Framework
  db/          Schema, Migrationen, Repositories
  ui/          eh-design (existiert bereits)
  adapters/    mailer · payments · social · storage   ← hier sind Plugins richtig
```

**Die Regel, die alles zusammenhält:** `apps/*` dürfen von `packages/*` abhängen — aber **niemals umgekehrt, und nie app-zu-app**. Domänenlogik gehört nicht in Route-Dateien.

---

## 5. Der Weg dahin — und was du NICHT tun solltest

**Nicht alles auf einmal umbauen.** Ein großer Restructure jetzt wäre der schlechteste Zug: er kostet Wochen, liefert Gina nichts Sichtbares und macht die Baustelle größer, nicht kleiner.

Reihenfolge:

1. **Jetzt:** Ein Repo, eine Next-App bleibt. Nur *Grenzen ziehen* — Domänenlogik aus Routen nach `src/lib` bzw. `packages/domain` verschieben, app-übergreifende Imports unterbinden.
2. **Klein & sofort:** `pnpm-workspace.yaml` reparieren, damit `packages/*` wirklich als Workspace funktionieren.
3. **Dann:** Eine App nach der anderen herauslösen — und nur die, die wirklich einen eigenen Deploy-Pfad braucht. Das CRM ist der natürliche erste Kandidat (läuft schon auf Cloudflare).
4. **Zuletzt:** Eine Plugin-Naht erst dann einführen, wenn eine zweite Implementierung *konkret in Sicht* ist. Nicht auf Vorrat.

---

## 6. Fazit

Modular ja — aber **innerhalb eines Repos**. Das Harness, auf das du dich berufst, macht genau das: ein Monorepo, in dem die *Nahtstellen* austauschbar sind, nicht die Anwendungen.

Konkret: ein Repo, `packages/` für den Kern, `apps/` für die Oberflächen, `adapters/` als die einzigen echten Plugin-Punkte. Und dann in kleinen Schritten, nicht als Big Bang.
