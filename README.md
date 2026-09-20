> **Aktueller Designvertrag · 2026-09-06:** Jerry hat Atelier 02 ausdrücklich freigegeben. Verbindlich sind DESIGN.md, packages/eh-design und der Skill SIN-EH-design. Eigenständige Änderungen am Markenstil sind verboten. Vollständige Übergabe: docs/brand/system/HANDOFF.md; kompletter Quelltext: docs/brand/system/SOURCE.md. Frühere Statusangaben zu noch offenen Stilentscheidungen sind historisch. Restmigration: EH-BRAND-05-WEB, -APPS, -CRM, -HUB. Unternehmensidentität bleibt docs/COMPANY_IDENTITY.md (Gina Inhaberin/Geschäftsführerin, Jeremy Entwickler).

# Einfach Hausen

<p align="left"><img src="public/brand/logo-full.png" alt="einfachhausen Logo" width="220" /></p>

> **Ein Ansprechpartner für alles rund ums Eigenheim.**
>
> **Du sagst, was dein Haus braucht. Wir kümmern uns um den Rest.**

Einfach Hausen ist die zentrale Anlaufstelle für Eigenheimbesitzer. Der Kunde beschreibt ein Problem und entscheidet selbst: **nur einen konkreten menschlichen Ansprechpartner sprechen** oder **einen echten Auftrag organisieren lassen**. Kontakte, Hausdaten, Termine und Dokumente bleiben dauerhaft beim Haus. Die KI arbeitet im Hintergrund als Assistenz- und Organisationsschicht, ist aber nicht das eigentliche Kundenversprechen.

Die verbindliche Produktdefinition steht in [`docs/PRODUCT_VISION.md`](docs/PRODUCT_VISION.md). Die strategische Positionierung als **persönlicher Hausmanager / Betriebszentrale für das eigene Zuhause** steht in [`docs/PRODUCT_POSITIONING.md`](docs/PRODUCT_POSITIONING.md). Das langlebige Daten- und Berechtigungsmodell steht in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Unternehmensrollen (kanonisch)

- **Gina Schulze** ist Inhaberin und Geschäftsführerin von Einfach Hausen.
- **Jeremy Schulze** ist Developer / technische Entwicklung und nicht Inhaber oder Geschäftsführer.

Verbindliche Rollenquelle: [`docs/COMPANY_IDENTITY.md`](docs/COMPANY_IDENTITY.md).

## Agenten & kanonischer Arbeitsstand

Alle Agents arbeiten in diesem Repository **am selben Ziel**. Es gibt keinen zweiten Engineering-Taskplan in README, Issues oder Worker-Reports. Der verbindliche Einstieg ist [`docs/NEXT_AGENT.md`](docs/NEXT_AGENT.md); der transaktionale Taskstatus liegt in `.sin-gpt-web/taskplan.sqlite3` und wird nach `.sin-gpt-web/TASKPLAN.md` gerendert.

Aktueller Stand (verifiziert 2026-09-20): **Repo-HEAD `3e8ecd9` (main)** — ses_f40d79-Welle abgeschlossen: Sidebar-07-Hauptnavigation, Session-Popover nur Identität+Einstellungen+Abmelden, ein Label = ein Ziel, Settings-Dialog 4 Sektionen, Kontrast A + DeadCSS (479/479 Spec-Selektoren entfernt). Details: Abschnitt `App-Rahmen` unten; Belege: `git log` (`3e8ecd9`, `929bc91`, `234aec3`, `ee7dcb9`, `5e492f6`). Historisch: T-0131 Convergence (2026-09-03, `3fbe3c9`) → `13496d7`; UI-Wellen A-E, Supabase-App-Schema + RLS, Demo-Logins, GSC-Verifikation sowie Blog/Lexikon-Cluster waren deren Stichtagswerte. Bereits erledigte oder abgelöste Wellen werden nicht erneut begonnen. Neue Implementierungsarbeit entsteht nur aus einem reproduzierbaren Acceptance-Fehler und wird als kanonischer Remediation-Task erfasst.

### Public Website Finish — Stand 2026-09-05

Die öffentliche Website ist zusätzlich auf den freigegebenen Premium-Zielzustand konvergiert, **ohne Rebranding** und weiterhin innerhalb von `DESIGN.md` / `--eh-*`:

- bestehende Top-Level-Navigation beibehalten, aber `Leistungen` als Desktop-Megamenü + Mobile-Disclosure vertieft;
- 12 Leistungsbereiche aus einem zentralen Service-Katalog mit echten Detailrouten;
- öffentliche Erklärseiten `/beratung`, `/notfall`, `/versicherung`, `/immobilienverkauf`;
- stärkere Discovery auf Startseite, Leistungen, Hilfe, Hausakte, Eigenheimbesitzer, Ablauf und Partnerseite;
- Sitemap/Metadata/Structured-Data aus derselben Content-Quelle;
- Release-Gates: Public-Site-Vertrag, echter Chrome-Navigationstest, vollständiges Produkt-E2E und 72 Visual Canonicals (390 / Tablet / 1320).

Implementierungs- und Designentscheidungen: `docs/superpowers/specs/2026-09-05-public-website-finish-design.md` und `docs/superpowers/plans/2026-09-05-public-website-finish.md`.

## Systemübersicht

![Einfach Hausen Plattformarchitektur](docs/diagrams/platform-architecture.svg)

[Interaktive Architektur öffnen](docs/diagrams/platform-architecture.html) · Detailansichten: [Eigentümer-Serviceflow](docs/diagrams/homeowner-service-flow.html), [Partner-/Auftrags-Lifecycle](docs/diagrams/partner-job-lifecycle.html), [Hausakte & Datenschutz](docs/diagrams/property-privacy-dataflow.html), [Zahlungen](docs/diagrams/payment-lifecycle.html), [CRM & Outreach](docs/diagrams/crm-outreach-flow.html), [Production & Recovery](docs/diagrams/production-recovery-flow.html).


## Live Produktion (HA)

- App: `https://einfachhausen.de`
- Runtime: OCI `sin-supabase`
- Cloudflare: `sin-kestra` tunnel
- Process supervisor: systemd (`einfach-hausen.service`)
- **App-Datenbank: SQLite** (`better-sqlite3`, `DATABASE_PATH`) — bewährter Single-Node-Betrieb mit Backup-Pflicht
- **Auth: SIN Supabase OSS (self-hosted, `https://supabase.delqhi.com`)** — serverseitig autoritative Identität (`auth_subject`); Supabase ist **nicht** die App-Datenbank
- **Ziel-Storage: Supabase Storage** für `private/` und `uploads/` (Fotos, Dokumente, Rechnungen, Haus-Historie) — `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_STORAGE_BUCKET` (Adapter **nicht implementiert**, siehe `docs/OPERATIONS.md` Z.23)
- **Fallback/Local Dev: SQLite + WAL via `better-sqlite3`** (`DATABASE_PATH=./data/einfach-hausen.db`) nur für lokale Entwicklung und als Offline-Fallback, nicht mehr als Produktions-Primary
- **Mobile HA: Capacitor 6** — Next.js App wird als native iOS/Android Hülle ausgeliefert (siehe `Mobile App / Capacitor`)
- Scheduled health checks: Kestra

Produktion ist ein **Multi-User-Betrieb** auf Single-Node-Basis: App-Daten in SQLite (persistenter Pfad + Backup), Auth gegen den self-hosted SIN-Supabase-Stack (Autorität serverseitig verifiziert). **Ist-Storage: persistente lokale Verzeichnisse** `private/`/`uploads/` (Supabase-Storage-Adapter nicht implementiert). Historische HA-/Postgres-Migrationsplanung (T-0166) wurde nie ausgeführt und ist nicht Teil des aktuellen Taskplans. Siehe `docs/OPERATIONS.md` und `docs/ARCHITECTURE.md`.

## Kernablauf

1. Kunde schreibt, spricht oder lädt ein Foto hoch.
2. Der KI-Hausmeister beantwortet und ordnet das Thema ein; **noch entsteht weder Vermittlung noch Auftrag**.
3. Der Kunde entscheidet: **Ansprechpartner finden** oder **Auftrag organisieren**.
4. Beim Ansprechpartner-Weg wird ein passender geprüfter Betrieb angefragt. Ein konkreter Mensch kann übernehmen, ohne Angebot und ohne Buchung.
5. Beim Auftrags-Weg fragt die KI nur fehlende Auftragsdaten ab, ermittelt eine Preisorientierung und disponiert passende Partner.
6. Angebote werden nach Preis, Termin, Entfernung und Qualität verglichen.
7. Der Kunde bucht bewusst.
8. Ein konkreter Ansprechpartner des Partnerbetriebs wird spätestens jetzt zugewiesen.
9. Kunde und Ansprechpartner können direkt schreiben, anrufen und Termine abstimmen.
10. Der KI-Hausmeister bleibt parallel für Fragen, Hausakte, Organisation, Erinnerungen und Servicefälle verfügbar.
11. Ein bereits verbundener Ansprechpartner bleibt in der Hausakte und kann später ohne neue Suche kontaktiert werden.
12. Aus einer reinen Kontaktanfrage kann der Kunde später separat einen Auftrag machen.

## Visuelles Produktdesign

Die verbindliche UI-Richtung steht in [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md). Die Kunden-App ist mobile-first und folgt der Referenz: Startseite, Hausservice, Angebotsvergleich, Auftragsdetail, Mein Haus, Mein Jahr, Pakete, Aufträge, Partnerprofil und Einstellungen.

Für T-0165 gilt zusätzlich die Präsentations-Source-of-Truth-Kette: **Notion App Design → `DESIGN.md` → [`docs/PRESENTATION_BRAND.md`](docs/PRESENTATION_BRAND.md) → `presentation/premium/brand.config.json` → `presentation/premium/deck.html`**. Notion liefert visuelle Evidence, nicht automatisch fachliche Produktspezifikation. Änderungen am App-Design müssen deshalb immer auch auf Presentation Brand und Deck geprüft werden.

## Kunden-App

- Startseite mit Schnellaktionen, Terminen, Angeboten und Hausstatus
- fokussierter Hausservice unter `/app/hausmeister`
- Freitext, Foto und Spracheingabe
- echte Hausfragen zuerst beantworten, ohne automatisch einen Auftrag anzulegen
- klare Auswahl **Ansprechpartner finden** oder **Auftrag organisieren**
- mehrstufige Rückfragen nur bei fehlenden Daten des gewählten Wegs
- optionaler OpenAI-kompatibler KI-Gateway, mit deterministischem Fallback
- Richtpreise
- regionales Qualitätsmatching
- Angebotsvergleich: Empfehlung / günstigster Preis / schnellster Termin
- Ein-Klick-Buchung
- persönlicher Ansprechpartner auch ohne Buchungszwang
- Kontaktanfrage ohne Angebot/Preis und spätere Umwandlung in einen Auftrag
- direkter Chat / Telefon / Terminabstimmung
- „Meine Ansprechpartner“ für dauerhafte Kundenbeziehungen
- digitale Hausakte „Mein Haus“
- „Mein Jahr“ als Jahres-, Wartungs- und Aufgabenplan
- geprüfte Partnerprofile direkt aus dem Angebotsvergleich
- Anlagenregister für Heizung, Wärmepumpe, PV, Speicher, Wallbox, Dach, Garten und Smart Home
- wiederkehrender Wartungs- und Hausjahresplan
- private Rechnungen, Nachweise und Belege
- direkte Handwerker-Rechnungen in der App mit Positionen, MwSt., Zahlungsziel und optionaler Stripe-Zahlung
- großer Notfall-Einstieg mit Bereitschafts-/Entfernungs-/Qualitätsmatching
- eigener Beratungsweg ohne automatischen Auftrag
- Ansprechpartner nach Bereichen gruppiert, inklusive eigener Kategorien
- lebenslange Haus-Historie mit früheren Arbeiten, Kosten, Garantien, Fotos und Dokumenten
- digitaler Hauspass und übertragbare Immobilie mit Eigentümerhistorie
- Immobilienbewertung, Verkaufsinteresse und datenschutzgesteuertes Makler-Matching
- Bewertungen
- Service-/Problemfälle
- Benachrichtigungen
- WhatsApp Cloud API mit demselben Modell: KI zuerst, danach `ANSPRECHPARTNER` oder `AUFTRAG`
- PWA-Manifest

## App-Rahmen · Stand main `3e8ecd9` (2026-09-20)

- Hauptnavigation: shadcn `sidebar-07` als aufklappbare linke Seitenleiste (`src/components/app-sidebar.tsx`, `nav-main.tsx`, `nav-projects.tsx`, `nav-user.tsx`, `team-switcher.tsx`; `d8ebb11`).
- Header nur Tools: Trigger, Breadcrumb, Suche, Glocke, Avatar (`src/components/werkbank-shell.tsx`: `SidebarTrigger`, `Breadcrumb`, `WerkbankSuche`, `/notifications`, Profil-Avatar).
- Globaler Einstellungs-Dialog als Overlay über der aktuellen Seite (`src/components/settings-dialog-host.tsx`, `src/app/app/settings/owner-settings-dialog.tsx`; `34c7d4b`, Stil `18c7323`). Bereiche: Konto & Daten, Benachrichtigungen, KI-Assistent, App & Offline. Fallback-Route `/app/settings` bleibt bestehen.
- ses_f40d79 (2026-09-20, `3e8ecd9`): Session-Popover entschlackt (`nav-user.tsx` — nur Identität, Einstellungen, Abmelden; keine Profil-Zeile); ein Label = ein Ziel (`nav-config.ts`: Profil -> `/app/profile`, Einstellungen -> `/app/settings`); Settings-Dialog 4 Sektionen `account|notifications|ai|app` mit `Konto & Daten` (`owner-settings-dialog.tsx`); Kontrast A `--eh-color-secondary` (#4b5b60) für `SidebarGroupLabel` (`sidebar.tsx`); DeadCSS: 479/479 Spec-Selektoren aus `globals.css`/`design-system.css` entfernt. Gates: tsc 0, lint 0 errors, design:check 0, deadcss 0. Prod verifiziert: Health 200 ready, `/login` 200, `/app` -> Login-Redirect.
- Erledigt: P0-6 Pro-Start Kopf + Kennzahlen + Leerzustand (`src/app/pro/page.tsx`, `08d57ef`); P0-7 Bewertungs-Meldung zurück auf `/app/partners/[id]` (`0560ffb`); P2-25 Terminologie Auftrag statt Anfrage (Beratung, Verkauf, Pro-Job, `08d57ef`); P2-28 `EHStepProgress` statt nativem `<progress>` (`src/app/app/onboarding/page.tsx`, `08d57ef`).
- Erledigt: P1-14 Suche als Cmd+K-Palette (`WerkbankSuche`, `41d48bf`); P1-16 Termine mit `LEFT JOIN` (`7b839f0`); P1-19 Schema-Baseline repariert (`14ae28c`); P1-20 kein `logoutAction`-Zweitpfad in `account-actions.tsx` (nur Export/Löschen); P1-21 gemeinsame `messages-thread.module.css` (`7b839f0`); P2-22 Cleanup (29 Dateien `7d2b8b1` + 8 Dateien `d3e947b`); P2-24 53 ungenutzte Icon-Exporte entfernt (`14ae28c`).

## Mobile App / Capacitor (iOS + Android) + PWA

Die Next.js-Anwendung ist die **Produktions-App für Web + iOS + Android**. Auslieferung erfolgt als:

- **Web:** Next.js direkt auf `https://einfachhausen.de` (PWA bleibt für Browser/Installierbarkeit)
- **iOS / Android:** **Capacitor 6** native Hülle (`@capacitor/core`, `@capacitor/ios`, `@capacitor/android`) um dieselbe Next.js-Build — keine zweite Codebase, kein Flutter/React-Native Rewrite

Enthalten (Web + nativ identisch):

- `manifest.webmanifest` mit App-Icons und Shortcuts
- Apple-Touch-Icon und `appleWebApp`-Metadaten
- Service Worker für Installierbarkeit und sichere Offline-Hinweise
- **keine privaten Auftrags-, Nachrichten- oder Hausdaten im Service-Worker-Cache**
- Safe-Area-Unterstützung für iPhone-Notch/Home-Indikator
- mobile Bottom-Navigation rendert aus `nav-config` (`src/components/bottom-nav.tsx`); `/app/more` existiert nicht mehr (Redirect `/app/more` → `/app` per `next.config.ts`, P1-13)
- 44px+-Touch-Ziele und 16px-Formfelder gegen iOS-Auto-Zoom
- `capacitor.config.ts` mit AppId `de.einfachhausen.app`, native Push (`@capacitor/push-notifications`), Camera/Filesystem via Supabase Storage
- App-Store Verteilung: App Store + Play Store sind **ab sofort aktiver Produktionspfad** (kein externer Blocker mehr), siehe `docs/ARCHITECTURE.md`

## Kunden-Tarife

| Tarif | Preis | Kernnutzen |
|---|---:|---|
| FREE | 0 €/Monat | Hausmeisterservice, Aufträge, Angebote, Ansprechpartner, Hausakte |
| PLUS | 19,90 €/Monat | Wartungsplanung, Hausjahresplan, Erinnerungen, Dokumente, Prioritätsservice |
| PREMIUM | 39,90 €/Monat | höchste Servicepriorität, jährlicher Hauscheck, automatische Wartungsorganisation, erweiterte Betreuung |

Jahrespakete sind zusätzlich möglich und erzeugen konkrete Aufgaben im Hausjahresplan.

## CRM & Leadgewinnung

Das dedizierte Akquise-/Outreach-Control-Plane liegt im separaten Repository `einfach-hausen-crm` und wird standalone unter `https://crm.einfachhausen.de` betrieben. Cloudflare Worker + D1 übernehmen dort Dedupe, Queue/Claims, Contact-History, Inbox/Replies und Follow-ups. Generic Research/Outreach bleibt in den gemeinsamen SIN-Fähigkeiten; es wird nicht in diesem Repo dupliziert.

Die Hauptanwendung enthält weiterhin `/admin/crm` und das SQLite-Leadmodell als ursprüngliche plattformintegrierte Operator-/Konvertierungsoberfläche und als Quellbestand für die erste verifizierte D1-Migration. Beide dürfen **nicht als zwei konkurrierende CRMs** weiterentwickelt werden. Recherchierte Betriebe bleiben zunächst Leads und werden **nicht** künstlich als registrierte Partner angelegt.

- Projektneutrale Handwerker-/Hausmeister-Recherche über `SIN-Business-Research`
- Deutschlandweiter Overture-Import mit E-Mail, Telefon, Website, Social-Links
  und Quellen-Provenienz soweit öffentlich vorhanden
- Pipeline von `Gesammelt` bis `Konvertiert`, plus `Nicht kontaktieren`
- Kontaktfreigabe/Einwilligung getrennt vom Vertriebsstatus
- Filter nach Leadtyp, Status, Gewerk, Firma, Ort und PLZ
- öffentliche Bedarfssignale (`public_intent`) aus kostenlosen RSS-/Forum-Quellen
  getrennt von identifizierten Eigentümer-Leads
- nicht-personenbezogene Objektchancen (`property`) aus offenen Geodaten
- manuelle Eigentümer-Leads aus Website, Empfehlung, Facebook-Gruppen, Foren,
  Communities und Kampagnen
- ein idempotenter Research-Sync importiert Betriebe, Intent-Signale und Objektchancen
- keine automatische Social-Profil-Ernte, Deanonymisierung oder Massen-DMs

Betrieb und Datenmodell: [`docs/CRM.md`](docs/CRM.md).

## Partner-App

Ein Unternehmen wird erst nach Unternehmensprüfung und aktivem Partnervertrag disponiert. Professionelle Anbieter verwenden **ein gemeinsames Konto**. Darin können mehrere Tätigkeiten gleichzeitig aktiviert werden, z. B. Handwerk, Dienstleistung, Immobilienmakler, Gutachter, Energieberatung oder Hausverwaltung. Tätigkeiten und konkrete Leistungsprofile sind getrennte Daten und später erweiterbar.

Makler können zusätzlich ein Suchprofil für Regionen, Immobilientypen, Preis- und Flächenbereiche pflegen. Freigegebene Immobilien-Leads erscheinen im selben Partnerzugang unter `/pro/leads`; Eigentümerkontaktdaten werden erst nach ausdrücklicher Freigabe sichtbar.

### Ansprechpartnermodell

Eine Firma hat 1–X Ansprechpartner mit eigenem Login. Es gibt bewusst nur eine fachliche Berechtigung:

**Aufträge verwalten AN/AUS**

AN bedeutet: neue Anfragen sehen, Angebot senden, annehmen/ablehnen und gebuchte Aufträge zuweisen.  
AUS bedeutet: nur eigene zugewiesene Aufträge sehen, Kundenkontakt, Termin, Status, Dokumente und Abschluss.

Keine ERP-Rollenmatrix.

## Partner-Tarife

| Tarif | Preis | Provision |
|---|---:|---:|
| FREE | 0 €/Monat | 0 % |
| START | 29 €/Monat | 0 % |
| PRO | 79 €/Monat | 0 % |
| PREMIUM | 199 €/Monat | 0 % |

START/PRO/PREMIUM haben 60 Tage Testphase. Der Partner-Tarif beeinflusst **nicht** das Qualitätsmatching.

## Matching

Berücksichtigt werden unter anderem:

- Gewerk / Fachgebiet
- Qualifikation und Vertragsstatus
- Entfernung
- Verfügbarkeit
- aktuelle Kapazität
- Bewertungen
- Preis / tatsächliches Angebot
- bestehende Kundenbeziehung
- bereits bekannter Ansprechpartner

## Zahlungen

- Stripe Checkout für Kunden-Mitgliedschaften
- Stripe Checkout für Partner-Tarife
- Stripe Checkout für Jahrespakete
- Stripe Connect für Auftragszahlungen
- **0 % Plattformprovision pro Auftrag**
- signierter Stripe-Webhook

Der konkrete rechtliche, steuerliche und haftungsrechtliche Aufbau muss vor kommerziellem Livebetrieb fachlich geprüft werden.

## KI-Gateway

Optional laufen sowohl die freie Hausfrage als auch die Anfrageextraktion über einen OpenAI-kompatiblen Gateway. Auf der OCI-Installation wird dafür OmniRoute lokal genutzt. Ohne Gateway bleibt die strukturierte Auftrags-/Kontaktlogik deterministisch funktionsfähig; die freie Hausfrage fällt auf eine kurze sichere Orientierung zurück.

```env
AI_BASE_URL=http://127.0.0.1:20128/v1
AI_MODEL=auto/best-fast
AI_API_KEY=
# Alternativ wird OMNIROUTE_MASTER_KEY gelesen.
```

Ohne Gateway bleibt die Kernfunktion über einen deterministischen Parser funktionsfähig.

## Stack (Produktion HA)

- Next.js 16 / React 19 / TypeScript
- **Supabase (Auth, self-hosted OSS)** — `AUTH_MODE=supabase`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`; App-Daten via `DATABASE_PATH` (SQLite)
- **SQLite + WAL via `better-sqlite3` nur Fallback/Local Dev** (`DATABASE_PATH`)
- **Capacitor 6** für iOS + Android (native Hülle um Next.js)
- HttpOnly Sessions + bcrypt
- Stripe / Stripe Connect
- OpenAI-kompatibler KI-Gateway
- serverseitige Actions
- PLZ-Geocoding + Distanzmatching
- Playwright E2E

## Lokal starten

```bash
cp .env.example .env.local
npm install
npm run dev
```

## Authentifizierung: Produktionsgrenze

Die Zielarchitektur für die geschützten Owner-/Provider-Flächen ist **Supabase serverautoritativ**. Lokale SQLite-/`mh_session`-Authentifizierung ist ausschließlich als expliziter Development-Fallback zulässig und darf in Produktion nicht stillschweigend greifen. Details, Testmatrix und T-0168-Visual-Acceptance: [`docs/T0168_DEEP_RESEARCH.md`](docs/T0168_DEEP_RESEARCH.md).

## Qualitätschecks

```bash
npm run lint
npm run build
E2E_ADMIN_PASSWORD='<lokales-testpasswort>' npm run test:e2e
E2E_ADMIN_PASSWORD='<lokales-testpasswort>' npm run test:e2e:architecture
npm run test:crm
```

## Aktueller technischer Vervollständigungsplan

Der kanonische `.sin-gpt-web/taskplan.sqlite3` enthält die aktuelle OCI-Convergence-Kette (T-0170 Auth, T-0169/T-0005 Notion-Visual, T-0171 Final Convergence). Historische Roadmap-Prosa (T-0100..T-0131, T-0166/T-0167) beschreibt frühere Planungsstände, nie ausgeführte Migrations-Tasks sind aus dem Plan gefallen. Der README ist nur ein Wegweiser; Status, Akzeptanz und Abhängigkeiten bleiben ausschließlich im kanonischen Taskplan (`sin-gpt-web-state --repo . summary`).

Nächster kanonischer Task: siehe `sin-gpt-web-state --repo . next`. Externe Blocker: siehe `docs/EXTERNAL-BLOCKERS.md` (nur verifizierte Fakten).

## Produktion (HA)

Die Produktion läuft auf OCI `sin-supabase` hinter Cloudflare Tunnel (Loopback-only, TLS nur via Cloudflare).

- **Supabase Postgres** als primärer DB-Cluster (HA) + **Supabase Storage** für private Dateien — Secrets in Infisical (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `SUPABASE_STORAGE_BUCKET`)
- **Lokaler Fallback** SQLite `/var/lib/einfach-hausen/einfach-hausen.db` nur für Dev/Notfall, nicht mehr Primary
- systemd-Dienst mit automatischem Restart
- Cloudflare Tunnel
- Admin-Passwort außerhalb von Git
- KI-Gateway-Key außerhalb von Git
- Stripe-/WhatsApp-Secrets außerhalb von Git
- Stripe-Betrieb über `wow-my-zsh/shared/skills/sin-stripe`; Secrets in Infisical, injiziert in OCI-Runtime
- **Capacitor iOS/Android Builds** aus selbem Next.js Artefakt (`npx cap sync` + `npx cap open ios/android`)

## Repository

GitHub: `Delqhi/einfach-hausen`

## Repository intelligence

This repository uses the fleet-wide Graphify architecture graph from `wow-my-zsh`. The graph is derived locally and kept out of Git.

```bash
npm run graph:install
npm run graph:update
npm run graph:check
graphify query "where is partner assignment handled?"
```

The local Graphify post-commit and post-checkout hooks keep `graphify-out/graph.json` current for agent architecture queries. Product truth remains `docs/PRODUCT_VISION.md`; Graphify is a technical code/dependency graph, not product or customer data storage.

<!-- SIN-GPT-WEB-HANDOVER:BEGIN -->
## SIN GPT Web completion / handover sync

- Last synchronized task: `T-0171`
- Canonical taskplan: `.sin-gpt-web/taskplan.sqlite3`
- Canonical repo goal: Einfach Hausen vollständig fertigstellen und vor allem App und Website auf Produktionsqualität verbessern
- Resume rule: read/validate the canonical taskplan and continue its highest-priority eligible task; do not create a competing roadmap.
- State 2026-08-29: DONE T-0170/T-0004/T-0169/T-0005/T-0171 (main=2307493, production bdebe9f, Smoke 17/17); open: T-0006 e2e modernization
- Taskplan sync: `pass`
- Synchronized at: `2026-08-29T18:59:08+00:00`
- Contract: `sin-gpt-web-completion-handover-v1`
<!-- SIN-GPT-WEB-HANDOVER:END -->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0100
updated: 2026-08-31T20:52:50+00:00
actor: local-agent
evidence-sha256: f42a70c09249785cee78d453593730b02e462563c2ea52dd3f96ff13d447e5a6
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0101
updated: 2026-08-31T20:52:50+00:00
actor: local-agent
evidence-sha256: ad159f2cc950ebf498af6d9f88b455def41b635fe25d5b965a5a13b3ca89b222
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0102
updated: 2026-08-31T20:52:51+00:00
actor: local-agent
evidence-sha256: 2e7357efbd529ac1f58e185753fb74a4020585d1823d89156e4b2506b6f36dc2
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0103
updated: 2026-08-31T20:52:52+00:00
actor: local-agent
evidence-sha256: 9f513f7079d3261f78b90b6bd9147004c81eee2c312db6be84f3df048cbcd64a
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0104
updated: 2026-08-31T20:52:52+00:00
actor: local-agent
evidence-sha256: baeb3b5cc21ca5732de76caf6600b1e9e796a5df3a459eb6ee6aa3c10927d7e1
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0105
updated: 2026-08-31T20:53:01+00:00
actor: local-agent
evidence-sha256: 8f8c2cb7dbb63a32f95b7554a3432704679483f51eb02ca0a1876028014cadc5
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0106
updated: 2026-08-31T20:53:02+00:00
actor: local-agent
evidence-sha256: 28e3a69bfc9528cee8757764023da67b82126fb41f50201e9db1a69ef64db976
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0107
updated: 2026-08-31T20:53:02+00:00
actor: local-agent
evidence-sha256: a4d0746af463ce97c8c6bfd1c870936634047e723fc48a76bca188862de4567d
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0108
updated: 2026-08-31T20:52:52+00:00
actor: local-agent
evidence-sha256: 8b95638cc3257cbeb6b6c700584c9d1c131e195a1a2cdb0831b6d5633cfb338f
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0109
updated: 2026-08-31T20:53:03+00:00
actor: local-agent
evidence-sha256: b7ba6dde2f1cca415fa54b2d0c4f96699805deca3a08c09163dee092774c63f6
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0110
updated: 2026-08-31T20:52:53+00:00
actor: local-agent
evidence-sha256: a73593c023c7d82fc6306ea2fce3f45eaac6fe94ff94c60589a048581736f648
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0164
updated: 2026-08-31T20:52:58+00:00
actor: local-agent
evidence-sha256: 6e808dd8296359a6ed71a9bc0233622843628ce933fabc8f2bd6be9c18a06087
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0165
updated: 2026-08-31T20:52:59+00:00
actor: local-agent
evidence-sha256: 35e2db2bb0dd5858f605cfd6057a51bd5a2cc1733437cbe03b37f501140d5259
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0167
updated: 2026-08-31T20:53:05+00:00
actor: local-agent
evidence-sha256: fbb81df390757352fa4b5eef8a9d588c872e51e967bf063af55523cd0790203a
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0168
updated: 2026-08-31T20:53:05+00:00
actor: local-agent
evidence-sha256: cddef743ddcbea9daa1ac14e2f401c5e68470280862077bedb48542798d521e3
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0169
updated: 2026-08-31T20:53:06+00:00
actor: local-agent
evidence-sha256: 9e54c89cf783fdec3bfac2b296c5cf87812231375dc96e2f9f25c4b4aa627210
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0173
updated: 2026-08-31T20:53:06+00:00
actor: local-agent
evidence-sha256: 3b42e8e7560437f09e36c1c1afc42223cc10fc5140880d68b9edab0e386d9c4d
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0170
updated: 2026-08-31T20:53:08+00:00
actor: local-agent
evidence-sha256: 3301600a2ffff136c37ca355c7a51268296d9f2959e02ab5de8480a77935685f
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0171
updated: 2026-08-31T20:53:08+00:00
actor: local-agent
evidence-sha256: fd8973c6f65fbc9de171997c767818934e0bcd1b2dd47cb00d312955bb498efa
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0140
updated: 2026-08-31T20:52:55+00:00
actor: local-agent
evidence-sha256: 9a98b49675963b2ea908a68a789931a1ce3a120c18862d3fba049bda0fb087c7
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0141
updated: 2026-08-31T20:52:55+00:00
actor: local-agent
evidence-sha256: d2ac93b376b977a7e8c1e97fa78f2e3cc4a6fa132413259427293fa43456d185
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0172
updated: 2026-09-09T01:36:03+00:00
actor: local-agent
evidence-sha256: daaa73300e8e73e245696aebf9a87df6fcda45e85b2000a58c1213f2145d5d71
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0174
updated: 2026-08-31T20:53:07+00:00
actor: local-agent
evidence-sha256: e1e1520308294faa680b6bcbe176f96dc1d6131f95d218cc19ab176a39d3e9e9
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0175
updated: 2026-08-31T20:53:07+00:00
actor: local-agent
evidence-sha256: da531fc298590aed92dd381b806c51d629170dc0414b589bddcdb3ac7a92d208
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0176
updated: 2026-08-31T20:53:09+00:00
actor: local-agent
evidence-sha256: 48a6469d9986ed404e1e7aeabe1156491db410f54682f13015cd57bb8a212e48
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0177
updated: 2026-08-31T20:52:59+00:00
actor: local-agent
evidence-sha256: 9b8b11fb86f4f29f8111ff8159cfd63f0d8147ad9c9fe8172abe609087578c9e
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0148
updated: 2026-08-31T20:52:56+00:00
actor: local-agent
evidence-sha256: 4ef622af886af3eec0fcee15e0c9b6f3701562e2b54c557679f7865d0015c705
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0149
updated: 2026-08-31T20:52:56+00:00
actor: local-agent
evidence-sha256: ee7dd33a827a4186797e2e9fd11b46d1d34b100736afd7c3edb1ecccd9661465
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0150
updated: 2026-08-31T20:52:57+00:00
actor: local-agent
evidence-sha256: 8408674ed32c856ac5fa4c249f081c989efe634068d4e1c18a36080b76426a4d
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0158
updated: 2026-08-31T20:52:57+00:00
actor: local-agent
evidence-sha256: 1334808461c1eefcd702dde2d78c41249acef0f3a9ad16fb200938bea3b44d16
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0159
updated: 2026-08-31T20:52:58+00:00
actor: local-agent
evidence-sha256: 4f805b7450d7a6291c49d70fbd741f091ce1c5cbd8e5e3de65e85b8daa1590aa
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0135
updated: 2026-08-31T20:52:54+00:00
actor: local-agent
evidence-sha256: 8cc3663b0397c2fbcef390d333845930ad753ab448184830a67735e6b2b43ac0
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0004
updated: 2026-08-22T16:24:18+00:00
actor: local-agent
evidence-sha256: 4aaa04f685e833bd81528668f15ce9ca3bd1e3e37227af5d8e2fb1df720a513a
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0005
updated: 2026-08-22T17:06:16+00:00
actor: local-agent
evidence-sha256: fa183425e21f31b54cdc90edc511fb1218cf517590a404b9fb51fd05e56fb6da
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0200
updated: 2026-08-30T04:10:43+00:00
actor: local-agent
evidence-sha256: 425e861d61478080b23cc52ad6b64973eb901e909bbe35dd7fb24a555e299358
-->
<!-- SIN-GPT-WEB-HANDOVER
task: T-0201
updated: 2026-08-30T04:29:48+00:00
actor: local-agent
evidence-sha256: c5758386de9a32943594941ee15b2faf7dd48bcd822565e0419448383e33c180
-->
<!-- SIN-GPT-WEB-HANDOVER
task: T-0202
updated: 2026-08-30T04:39:54+00:00
actor: local-agent
evidence-sha256: 0bc75649da580b92e8c385c0ce01f150f9b48f18b1ac0d2c9ee40525373e504f
-->
<!-- SIN-GPT-WEB-HANDOVER
task: T-0203
updated: 2026-08-30T04:59:52+00:00
actor: local-agent
evidence-sha256: b734c3298856af57db7cbd01c11010da44ffcc25472c8142ae1011378a1a4699
-->
<!-- SIN-GPT-WEB-HANDOVER
task: T-0204
updated: 2026-08-30T12:37:24+00:00
actor: local-agent
evidence-sha256: 26d2c37b44b0e2ecdd412fa38e9987742b09de7fdb3d65324b840eee1997f5d8
-->
<!-- SIN-GPT-WEB-HANDOVER
task: T-0205
updated: 2026-08-30T12:37:24+00:00
actor: local-agent
evidence-sha256: f1288185ef3bec19c87d3ccaf8e935f8a33480e8db7f734bae58d6874f3a4d43
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0042
updated: 2026-08-31T20:52:48+00:00
actor: local-agent
evidence-sha256: b0522c720f2d26ef171afa4f8b0bd77eb82cd987694ae7791144c8df2c9124fd
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0043
updated: 2026-08-31T20:52:48+00:00
actor: local-agent
evidence-sha256: 7690208a2287a2d7d24bc2b266c299ac0cdbdaac3e76839323fb142c4ea23138
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0049
updated: 2026-08-31T20:52:49+00:00
actor: local-agent
evidence-sha256: 0d6781d978ed15bc779a17b686785e5efe3810adb2563c2731c51acc8f2f82c7
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0157
updated: 2026-08-31T21:16:05+00:00
actor: local-agent
evidence-sha256: 7f99e3ef8bfd11d211e6dbda80fa766914a185971e4f6883515209aba957fb5f
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0160
updated: 2026-08-31T22:25:51+00:00
actor: local-agent
evidence-sha256: a0374312071e4a6d50a86e2706a720cb563cff292dd03c20102c6c0ac8b63098
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0161
updated: 2026-08-31T22:54:54+00:00
actor: local-agent
evidence-sha256: 8347892ea96120456d7b66b9aba1440561a66d689fce427bda41928e3e8003b4
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0162
updated: 2026-08-31T22:54:54+00:00
actor: local-agent
evidence-sha256: ff5ccd0484ed2266c6ce264e4b9f21b41f1bd97f7e8c73ff4c98e9216edf19cd
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0163
updated: 2026-08-31T22:56:47+00:00
actor: local-agent
evidence-sha256: fb1882e2df32385413315728fdb2731a84376c39873250aa2cf0335a2c913c98
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0154
updated: 2026-09-01T00:56:58+00:00
actor: local-agent
evidence-sha256: 83e5ed487aff86dee8b825d9f06d859654d292349ec6538442ac1f725c3dbe1b
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0152
updated: 2026-09-01T01:03:10+00:00
actor: local-agent
evidence-sha256: 75fc109f1509113951e589eae987093b5e6ae117d9fd29e758a6c673897685d3
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0153
updated: 2026-09-01T01:03:10+00:00
actor: local-agent
evidence-sha256: 08da5c23cd9a4bb84512af6dc432989154d9da35f011f18bf9ef15fb7a650193
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0155
updated: 2026-09-01T01:47:14+00:00
actor: local-agent
evidence-sha256: 02c7cb988ff4f3990fdd17d9a4772d50152245ab2becbbd66f768202ec391bc8
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0156
updated: 2026-09-01T03:30:24+00:00
actor: local-agent
evidence-sha256: 994ea2169cfa09d65fa7fa4e2b29c4f8e02de905c613b7d24ebd946ec7c7d4b0
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0115
updated: 2026-09-01T03:30:25+00:00
actor: local-agent
evidence-sha256: ef7edcae3cf6bd3ad470c34205fa815916c109e4709b0298ac4f0a4068e48968
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0111
updated: 2026-09-01T12:44:55+00:00
actor: local-agent
evidence-sha256: 87e072d5e2c574dbf26ce3c530c85fb1d6a5a871034892d6adf8dc40ec8a3ae9
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0112
updated: 2026-09-01T12:44:55+00:00
actor: local-agent
evidence-sha256: f193fa11049f920c888558209118f7b7592a95a4e86ace0c92274995b906db8d
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0138
updated: 2026-09-01T13:24:20+00:00
actor: local-agent
evidence-sha256: 0ab111892a30d55ad46e7f6232b32f64656dee72cc4b9937613c3f2a3d9c925a
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0142
updated: 2026-09-01T13:24:20+00:00
actor: local-agent
evidence-sha256: bceab63e963dd389c859027e3e4221a6a50386a99dfad656912ed9445f0038fe
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0113
updated: 2026-09-01T13:55:36+00:00
actor: local-agent
evidence-sha256: 07b6275707f950b590ed96ec928ab841e01791e4761d591f616d20f0fc5e80cc
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0114
updated: 2026-09-01T13:57:24+00:00
actor: local-agent
evidence-sha256: db6e60f478405d43372683fbf7d760ddb32ef5fb7c5c608ca152e3115cca052b
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0116
updated: 2026-09-01T17:55:42+00:00
actor: local-agent
evidence-sha256: cfbef8fb88b67a309e81fa923357ecfc6f2a6808005e9d697e457401171f9ce5
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0117
updated: 2026-09-01T17:55:42+00:00
actor: local-agent
evidence-sha256: 32b178026b6612aa0bc5ea8813b094a8e7b84293e8c9f8a5706a02435767ed03
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0136
updated: 2026-09-01T18:06:52+00:00
actor: local-agent
evidence-sha256: 766040d87c6e2dbae195442af395ea3b2fddc2c114f4fbe4a7963f3a4d6463ea
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0147
updated: 2026-09-01T19:19:57+00:00
actor: local-agent
evidence-sha256: 4149908d9dda7f1397ce06f9aadccce2ae5c038d469a1adeb8e1e3f02d0a2ff9
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0118
updated: 2026-09-01T20:51:22+00:00
actor: local-agent
evidence-sha256: c55fee22cf93a7578d26053014ef8e42b4a7534775e5e1a5d1fd60053eb1d405
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0119
updated: 2026-09-01T22:14:14+00:00
actor: local-agent
evidence-sha256: 0acd76be267c23dd81333e674d9c0eee29d42c3f07154718697fae9f793a26b6
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0210
updated: 2026-09-02T23:18:15+00:00
actor: local-agent
evidence-sha256: 80f9aad504a029dbe80faed7a0cf4c152de5bf88a4b1880edf60f754211dea51
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0211
updated: 2026-09-02T23:18:41+00:00
actor: local-agent
evidence-sha256: 60f232b4e4d8bb71c603011e8a96ba47b0b2b4f04b45106ed5ab759dbc9d69a0
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0120
updated: 2026-09-02T23:49:07+00:00
actor: local-agent
evidence-sha256: 73903ba5ee89d8c893c1f1fd2a10d42aeeba247966ba2045494555aa353d28e5
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0121
updated: 2026-09-02T23:56:26+00:00
actor: local-agent
evidence-sha256: 01f5f6cb64432cac1825787493c591f7d4d2c263eff4860738564f29f1259336
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0122
updated: 2026-09-03T00:15:44+00:00
actor: local-agent
evidence-sha256: dca081a3188c1676492cf6cfd60f6b5d044444af48a818ae6173c43636c209fb
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0131
updated: 2026-09-03T12:19:04+00:00
actor: local-agent
evidence-sha256: 95b14cf53c5f2030d04c08f2b5dd9dfbb343623139fc5ce9e720d09533c6be38
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0123
updated: 2026-09-03T00:23:19+00:00
actor: local-agent
evidence-sha256: d05fdcb413b5af3832a99bb11e2726eab2c7c3682e25b7c74203edb5e4bd3544
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0124
updated: 
actor: local-agent
evidence-sha256: 7b56927949e37e438aa734d75f4b3eed9bd85a667118aa51838decfaccecfcb7
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0129
updated: 
actor: local-agent
evidence-sha256: a2028224c451c9d493976891e8e4061d8fbe7cbe6e5155f21be5f251a13b16be
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0130
updated: 
actor: local-agent
evidence-sha256: db4bfd0327fb8cd3dcc011d26631b8b064c1a6b0952880d4fbb8d34877b61b84
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0125
updated: 
actor: local-agent
evidence-sha256: 24ead3c1a5c517e9724996338b7426ad3e8e2c18cd519e08d1f683f72f4d788b
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0126
updated: 
actor: local-agent
evidence-sha256: 1acbbc8c9d9ec3b87035c8d0521fa2c3622fa697e6d719310f61795b15fda6e8
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0127
updated: 
actor: local-agent
evidence-sha256: 0640af1175d4cd871685513652419379eec835cf543aed5dfc69b0bfcadc4a29
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0128
updated: 
actor: local-agent
evidence-sha256: 52a6748748dfe2d958322ba6584bcd9e8cd8284ed731054bf7f3d48948bf4d4a
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0132
updated: 2026-09-03T13:48:49+00:00
actor: local-agent
evidence-sha256: 7e0b781bd511bf7c78d504be2551763dc8d69cb587488ebbb271c6ea9297cc0b
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0134
updated: 2026-09-03T14:38:08+00:00
actor: local-agent
evidence-sha256: 3ad2590c9c31b9a8bcfe0e7212d85d446458c4690bf1ff152b848245aa2ab81c
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0137
updated: 2026-09-03T14:57:29+00:00
actor: local-agent
evidence-sha256: 73bd2d6844b5aeaef8c0a753fb3ffc143ba55ec8b8a6ea80d0937f17d8d01123
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0143
updated: 2026-09-03T15:20:03+00:00
actor: local-agent
evidence-sha256: d669bf8aeac2f37f703094ffd9db570e6d658293f99d7995729a5420ac2b89c7
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0144
updated: 2026-09-03T16:36:34+00:00
actor: local-agent
evidence-sha256: 765f10be899bb7edd6395df543b8cdc5f0d0ef9c4670d5dc185d848f11bbcb39
-->

<!-- SIN-GPT-WEB-HANDOVER
task: EH-BRAND-01
updated: 2026-09-06T00:46:30+00:00
actor: prime-agent
evidence-sha256: aa823be75191650b55367801543a3d6f9565f6acc4023427e89de00885b7ab9b
-->

<!-- SIN-GPT-WEB-HANDOVER
task: EH-BRAND-02
updated: 2026-09-06T00:46:30+00:00
actor: prime-agent
evidence-sha256: aa823be75191650b55367801543a3d6f9565f6acc4023427e89de00885b7ab9b
-->

<!-- SIN-GPT-WEB-HANDOVER
task: EH-BRAND-03
updated: 2026-09-06T08:05:25+00:00
actor: chatgpt-web
evidence-sha256: 4507a81925e57caf5947f5cf5489e0d59dc2921fba11a6902bf52d2baf09c4f4
-->

<!-- SIN-GPT-WEB-HANDOVER
task: EH-BRAND-04
updated: 2026-09-06T20:09:19+00:00
actor: chatgpt-web
evidence-sha256: 5114f14401e6e23ddd983775a51c5a8e1db89c2d6092a28b3304c59c45dd65ae
-->

<!-- SIN-GPT-WEB-HANDOVER
task: EH-BRAND-APP-COVERAGE
updated: 2026-09-06T22:40:19+00:00
actor: local-agent
evidence-sha256: 5ade9dc3a11113a69057f1a7fd3d37828c6dffa092c335a17ec41dc127fba1dc
-->

<!-- SIN-GPT-WEB-HANDOVER
task: EH-BRAND-04-R2
updated: 2026-09-06T22:58:55+00:00
actor: local-agent
evidence-sha256: 5297533580034decc51d043ff1cc0c19fd189e3b8666af8eca66a56d7fe78106
-->

<!-- SIN-GPT-WEB-HANDOVER
task: EH-BRAND-05-APPS
updated: 2026-09-07T09:46:06+00:00
actor: local-agent
evidence-sha256: aa25baaa016bcf64563c1194b16402bbf2f70099674c2fed3050e31cad982da5
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0145
updated: 2026-09-07T15:40:44+00:00
actor: local-agent
evidence-sha256: 8a0d123d7986ce23d4b44a81962d5c80f660962912df8aa6ca3a80d4fb971ff1
-->

<!-- SIN-GPT-WEB-HANDOVER
task: EH-BRAND-05-WEB
updated: 2026-09-07T15:42:00+00:00
actor: local-agent
evidence-sha256: 5d479d537dc1a308fb33c559a4ebed39b7d29eb42929fcec65af97e584a85625
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0133
updated: 2026-09-07T16:11:04+00:00
actor: local-agent
evidence-sha256: bf8f5935018f755d0889723675beae705dcbf68623bb749f02ea254b258714e1
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0139
updated: 2026-09-07T16:22:19+00:00
actor: local-agent
evidence-sha256: 46135bd1f7765e7da6d9c33f49df38f730beb056f428a98d8d598e7ae3239275
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0146
updated: 2026-09-07T16:33:33+00:00
actor: local-agent
evidence-sha256: 1bc3466f4209a88e0e08b805d40e1ea395406db8d735bae99df68e6a25e4aae0
-->

<!-- SIN-GPT-WEB-HANDOVER
task: EH-BRAND-05-HUB
updated: 2026-09-07T16:56:33+00:00
actor: local-agent
evidence-sha256: 904cd87db9d3e5092e50dc56992e8758987a4477a8153ade6eed0f1985389888
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0151
updated: 2026-09-07T17:11:32+00:00
actor: local-agent
evidence-sha256: 1aff41d46d74a7fadab58ab6f600da298c53f5177c45bb9dff7cd4b077055aaa
-->

<!-- SIN-GPT-WEB-HANDOVER
task: EH-BRAND-05-CRM
updated: 2026-09-07T18:57:23+00:00
actor: local-agent
evidence-sha256: f05b5cb9a79e1d9a720fb63db01722b1fa2fb1103f5d916d9e79e42e72ba1567
-->

<!-- SIN-GPT-WEB-HANDOVER
task: EH-BRAND-05
updated: 2026-09-07T18:57:39+00:00
actor: local-agent
evidence-sha256: 75d41828db93f7f1cf0319cb62b4555505145aa7e350e3f76b5e54e3998e980b
-->

<!-- SIN-GPT-WEB-HANDOVER
task: EH-BRAND-06
updated: 2026-09-07T19:04:42+00:00
actor: local-agent
evidence-sha256: 5f22e53b7db61e188b5dc47f904485e0d6871007582380be638be5b78ce4a5ab
-->
=======
task: EH-01
updated: 2026-09-05T02:00:41+00:00
actor: chatgpt-web
evidence-sha256: 223ddabf850fcb56047dafd0834c4648fe0356286d14630d790002d451660459
-->

<!-- SIN-GPT-WEB-HANDOVER
task: EH-02
updated: 2026-09-05T02:19:47+00:00
actor: chatgpt-web
evidence-sha256: d3169b9afa465be4ab22588b73903be33178b28010810633f5fb6546dc51f563
-->

<!-- SIN-GPT-WEB-HANDOVER
task: EH-03
updated: 2026-09-05T04:33:10+00:00
actor: local-agent
evidence-sha256: b9300da9b1e348fc386da08fda11e75c105f6db589d60a0f190ae0af25041437
-->

<!-- SIN-GPT-WEB-HANDOVER
task: EH-04
updated: 2026-09-05T06:26:03+00:00
actor: chatgpt-web
evidence-sha256: 0bf6db00102a87441e641b95f92d629df17ac5aa3144da80eeb67f83cab48460
-->

<!-- SIN-GPT-WEB-HANDOVER
task: EH-05
updated: 2026-09-05T09:09:00+00:00
actor: chatgpt-web
evidence-sha256: e072648f313eb7d38b0daa3a917b5f8b9cfbee90f62754f8cef486aa6b258c03
-->

## EH-BRAND — Operator-Auftrag vom 06.09.2026

Die eigenständige einfachhausen-Markenstudie wird auf einem isolierten Branch entwickelt. Sie umfasst drei vergleichbare Richtungen, vollständige Quellpakete und visuelle Evidenz. Sie ist keine bereits ausgewählte oder produktiv veröffentlichte neue Marke.

- Spezifikation: `docs/superpowers/specs/2026-09-06-einfachhausen-brand-system-design.md`
- Ausführungsplan: `docs/superpowers/plans/2026-09-06-einfachhausen-brand-system.md`
- Handoff: `docs/brand/HANDOFF.md`
- Vollständiger Zielquelltext: `docs/brand/SOURCE_PACKET.md`
- Tasks: EH-BRAND-01 bis EH-BRAND-06; vorhandenes T-0151 und Issue #33 berücksichtigen.
- Ausführung: `/home/ubuntu/orca/workspaces/einfach-hausen-brand-system-20260906`, Branch `design/einfachhausen-brand-system-20260906`, Node 22.23.0.


## EH-BRAND — Korrektur: Atelier 02 (2026-09-06)

Der Nutzer hat die drei Stilproben aus PR #40 ausdrücklich verworfen. Deren technische 27/27-Prüfung ist keine visuelle Freigabe. Root Codex gestaltet und implementiert die neue Richtung persönlich; keinen weiteren Prime/bai-Dispatch aus alten Abschnitten ableiten. Neuer Arbeitsstand: `design/einfachhausen-brand-atelier-20260906`, Workspace `/home/ubuntu/orca/workspaces/einfach-hausen-brand-atelier-20260906`. Konzept, vollständige Nutzerkorrektur und Plan: `docs/brand/ATELIER_02.md`; aktuelle Übergabe: `docs/brand/HANDOFF.md`; vollständige Quellen: `docs/brand/ATELIER_02_SOURCE.md`; bedienbare Vollansicht: `design/brand-atelier/preview.html`. EH-BRAND-03 bleibt in Arbeit, die neue Richtung wurde noch nicht vom Nutzer bewertet. Genau nächste Markenaktion: diese neue Vollansicht besprechen und tatsächliches Nutzerfeedback dokumentieren. EH-BRAND-04..06 folgen erst der Richtungsentscheidung; kein Merge/Deploy. Ältere Empfehlungen/Dispatch-Anweisungen sind für diese Markenwelle historisch. Andere laufende Arbeitswellen bleiben erhalten.

<!-- SIN-GPT-WEB-HANDOVER
task: T-0007
updated: 2026-08-29T20:22:56+00:00
actor: local-agent
evidence-sha256: 9fced8fc1fea3a24766fb348dd92b1dafe1ce6cbdbc5e0178ebdaade6dd01a05
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0207
updated: 2026-08-31T05:02:48+00:00
actor: local-agent
evidence-sha256: 1017a920b7cf8fe652672b1af34f77f91dc83e95bebdfd52e9a57ff31d931235
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0006
updated: 2026-08-30T19:51:22+00:00
actor: local-agent
evidence-sha256: c06a0c08dd4aed8815e9506b2ece8b5ac94fae69f2372ca33649c3a92f9bbed0
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0206
updated: 2026-08-31T03:37:41+00:00
actor: local-agent
evidence-sha256: 027117d24fef4b17a77dddd236c195d9b40586c3bc282dfd5c0aec2f9b5e54ee
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0208
updated: 2026-08-31T15:17:38+00:00
actor: local-agent
evidence-sha256: 3c5ff2bd506025e42f53ea35964b6be662f201604fdd2d490f55ac7573da8fcb
-->


## Owner-Dashboard · 11.09.2026

Die Eigentümer-Startseite `/app` verwendet die ausdrücklich freigegebene professionelle Dashboard-Komposition aus `DESIGN.md`. Sie verbindet reale Hausdaten, offene Entscheidungen, Wartungen, den bestehenden Hausmeister-Composer, Hausakte und Jahresübersicht in einer ruhigen Arbeitsoberfläche.

Kanonische UI-Bausteine:
`EHOwnerDashboardHeader`,
`EHOwnerDashboardTopGrid`,
`EHOwnerDashboardStatus`,
`EHOwnerDashboardOverview`,
`EHOwnerDashboardComposer`,
`EHOwnerDashboardUtilityGrid`.

Die Umsetzung verändert keine Auth-, Datenbank-, Matching-, Upload- oder Server-Action-Verträge.
