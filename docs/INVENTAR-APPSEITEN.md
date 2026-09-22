# Inventar aller App-Seiten — einfachhausen

Stand: 2026-09-16 · Arbeitskopie `/Users/jeremyschulze/dev/einfachhausen-landing-page/einfach-hausen`
Reine Bestandsaufnahme. Es wurde **keine** Datei verändert, gelöscht, verschoben oder committet.

---

## 0. Wie gezählt wurde (Belege, keine Schätzungen)

| Prüfung | Befehl / Quelle | Ergebnis |
|---|---|---|
| Alle `page.tsx` unter `src/app` | `find src/app -name "page.tsx"` | 94 Dateien gesamt |
| davon unter `src/app/app/**` | `find src/app/app -name page.tsx` | **27** — deine Zahl ist **korrekt und vollständig** |
| davon unter `src/app/pro/**` | `find src/app/pro -name page.tsx` | **13** — deine Zahl ist **korrekt und vollständig** |
| Zeilenzahlen | `wc -l` je `page.tsx` | siehe Spalte „Zeilen" |
| Gemeinsame Hülle | `grep -lw AppShell` über alle 41 App-Routen | **35 von 41** |
| Komponentennutzung | `grep -lw <Komponente>` über dieselben 41 Dateien | siehe Abschnitt 3 |

Referenzliste der 41 App-Routen (Grundmenge für alle Zählungen in diesem Dokument):
`src/app/app/**` (27) + `src/app/pro/**` (13) + `src/app/notifications/page.tsx` (1).

---

## 1. Vollständige Routenliste

### 1a. Kern-App: 41 Routen (davon 39 gerendert, 2 reine Redirects)

| # | Route | Datei |
|---|---|---|
| 1 | `/app` | `src/app/app/page.tsx` |
| 2 | `/app/calendar` | `src/app/app/calendar/page.tsx` |
| 3 | `/app/consultation` | `src/app/app/consultation/page.tsx` |
| 4 | `/app/contracts` | `src/app/app/contracts/page.tsx` |
| 5 | `/app/documents` | `src/app/app/documents/page.tsx` |
| 6 | `/app/documents/[jobId]/receipt` | `src/app/app/documents/[jobId]/receipt/page.tsx` |
| 7 | `/app/emergency` | `src/app/app/emergency/page.tsx` |
| 8 | `/app/hausmanager` | `src/app/app/hausmanager/page.tsx` |
| 9 | `/app/hausmeister` | `src/app/app/hausmeister/page.tsx` |
| 10 | `/app/hilfe` | `src/app/app/hilfe/page.tsx` |
| 11 | `/app/home` | `src/app/app/home/page.tsx` |
| 12 | `/app/home/history` | `src/app/app/home/history/page.tsx` |
| 13 | `/app/home/passport` | `src/app/app/home/passport/page.tsx` |
| 14 | `/app/home/sale` | `src/app/app/home/sale/page.tsx` |
| 15 | `/app/insurance` | `src/app/app/insurance/page.tsx` |
| 16 | `/app/invoices/[id]` | `src/app/app/invoices/[id]/page.tsx` |
| 17 | `/app/jobs` | `src/app/app/jobs/page.tsx` |
| 18 | `/app/jobs/[id]` | `src/app/app/jobs/[id]/page.tsx` |
| 19 | `/app/messages` | `src/app/app/messages/page.tsx` |
| 20 | `/app/more` | `src/app/app/more/page.tsx` |
| 21 | `/app/onboarding` | `src/app/app/onboarding/page.tsx` |
| 22 | `/app/partners` | `src/app/app/partners/page.tsx` — **Redirect** |
| 23 | `/app/partners/[id]` | `src/app/app/partners/[id]/page.tsx` |
| 24 | `/app/plans` | `src/app/app/plans/page.tsx` |
| 25 | `/app/profile` | `src/app/app/profile/page.tsx` |
| 26 | `/app/settings` | `src/app/app/settings/page.tsx` |
| 27 | `/app/year` | `src/app/app/year/page.tsx` |
| 28 | `/notifications` | `src/app/notifications/page.tsx` |
| 29 | `/pro` | `src/app/pro/page.tsx` |
| 30 | `/pro/calendar` | `src/app/pro/calendar/page.tsx` |
| 31 | `/pro/hilfe` | `src/app/pro/hilfe/page.tsx` |
| 32 | `/pro/invoices/[id]` | `src/app/pro/invoices/[id]/page.tsx` |
| 33 | `/pro/jobs` | `src/app/pro/jobs/page.tsx` — **Redirect** |
| 34 | `/pro/jobs/[id]` | `src/app/pro/jobs/[id]/page.tsx` |
| 35 | `/pro/leads` | `src/app/pro/leads/page.tsx` |
| 36 | `/pro/messages` | `src/app/pro/messages/page.tsx` |
| 37 | `/pro/onboarding` | `src/app/pro/onboarding/page.tsx` |
| 38 | `/pro/orders` | `src/app/pro/orders/page.tsx` |
| 39 | `/pro/plans` | `src/app/pro/plans/page.tsx` |
| 40 | `/pro/profile` | `src/app/pro/profile/page.tsx` |
| 41 | `/pro/team` | `src/app/pro/team/page.tsx` |

### 1b. Deine sechs Vermutungen — einzeln geprüft

| Bereich | Gehört zur App? | Beleg / Begründung |
|---|---|---|
| `src/app/mein-haus/` | **Nein — keine Seite.** | `mein-haus/page.tsx` ist 6 Zeilen: `redirect('/app/home')`. Kommentar im Code: „Legacy-Duplikat von /app/home (kanonische Hausakte) — Redirect, kein Delete." Das `layout.tsx` setzt nur `robots: noindex`. **Umbau-Aufwand: 0.** |
| `src/app/hausakte/` | **Nein — öffentliche Website.** | Verwendet `MarketingShell` (`@/components/marketing/site-shell`) und `EHSection`/`EHProductIntroduction`/`EHProductScreenshot`/`EHFAQ` — dieselben Marketing-Bausteine wie `/preise`, `/partner`, `/ueber-uns`. Hat `canonical('/hausakte')` und SEO-Description. Es ist eine **Produkt-Landingpage**, keine App-Seite. Verlinkt auf `/app/home` („Meine Hausakte öffnen"). |
| `src/app/notifications/` | **Ja — vollwertige App-Seite.** | Nutzt `AppShell` + `requireUser()` + `EHList` mit 25 Einträgen pro Seite. Rollen-agnostisch: `role={u.role}` — sie bedient Eigentümer **und** Partner aus einer Datei. Einzige App-Route außerhalb von `/app` und `/pro`. |
| `src/app/chat/[anfrageId]/` | **App-artig, aber Alt-Stack.** | `"use client"`, Supabase-Realtime (`getSupabase()`, `postgres_changes`), eigenes `chat.module.css`, **kein** `AppShell`, **kein** `@/design-system`. Hängt am alten `anfragen`/`anfrage_messages`-Schema. Gehört zum Legacy-Strang (siehe 1c). |
| `src/app/onboarding/pro/**` | **App-artig, aber Alt-Stack — und doppelt vorhanden.** | 3 Routen (`/onboarding/pro`, `/onboarding/pro/[schritt]`, `/onboarding/pro/gebiet`), alle `"use client"` + Supabase + eigene CSS-Module. **Achtung:** es existiert *zusätzlich* die neue, serverseitige Einrichtung `/pro/onboarding` auf Design-System-Basis. Zwei parallele Pro-Onboardings. |
| `src/app/transfer/[token]/` | **Keine App-Seite — Einzelkarte.** | 10 Zeilen, eine Zeile Markup. Nutzt `<main className="auth-page"><div className="auth-card wide-card">`, `getCurrentUser()` (optional, nicht `requireUser`). Eine Übergabe-Annahme-Karte im Auth-Layout — bewusst außerhalb der App-Hülle. |

### 1c. Weitere app-artige Bereiche außerhalb `/app` und `/pro`

| Bereich | Routen | Einordnung |
|---|---|---|
| `src/app/admin/**` | 4 (`/admin`, `/admin/login`, `/admin/ops`, `/admin/crm`) | **Internes Betriebs-Werkzeug**, nicht Teil der Kunden-App. `requireAdmin()`. Nutzt `EHAppHeader` und `@/design-system`, aber **kein** `AppShell` — eigenes `admin.module.css` mit `.admin-page`/`.admin-panel`/`.admin-card`. `/admin/login` ist eine `EHAccessPage`. Empfehlung: **nicht** in den App-Umbau ziehen, aber im Blick behalten (`/admin/crm` ist 313 Zeilen). |
| `src/app/anfrage/**`, `src/app/anfragen-pro/` | 3 (`/anfrage/neu`, `/anfrage/[id]`, `/anfragen-pro`) | **Legacy-Supabase-Anfragefluss.** `"use client"`, `getSupabase()`, globale Klassen (`ob-page`, `cat-tile`, `subcat-item`). `/anfrage/neu` schreibt in Tabelle `anfragen` — ein **anderes Schema** als `jobs`. |
| `src/app/ki-chat/` | 1 | Reiner Redirect auf `/app/hausmeister`. 14 Zeilen. |
| `src/app/welcome/`, `src/app/role/` | 2 | Onboarding-/Auth-Marketingseiten im „Handy-App"-Look (`safe-top`, `home-indicator`), aber öffentlich. Nutzen `auth-convergence.module.css`. |

**Zwischensumme:** 41 Kern-App-Routen + 4 Admin + 3 Legacy-Pro-Onboarding + 3 Legacy-Anfrage + 1 Legacy-Chat = **52 app-artige Routen**, davon **41 im eigentlichen Umbau-Scope** (davon 39 gerendert).

---

## 2. Pro Route eine Zeile

### Abkürzungen Spalte „CSS"
Alle Routen erben über `src/app/layout.tsx` (Zeilen 3–6) vier globale Dateien:
**G** = `globals.css` (852 Z. / 105 KB) · **D** = `design-system.css` (1184 Z. / 155 KB) · **T** = `packages/eh-design/src/tokens.css` (38 Z.) + `@/components/marketing/tokens.css` (156 Z.)

Zusätzlich je Route:
**S** = `packages/eh-design/src/styles.module.css` (2321 Z. / 120 KB) — wird von **39 der 41** Routen transitiv über `@/design-system` gezogen (Ausnahmen: die zwei Redirects)
**H** = `src/app/app/homeowner.module.css` (1875 Z. / 46 KB) — über `src/app/app/layout.tsx`, gilt für alle 27 `/app/**`
**P** = `src/app/pro/provider-workspace.module.css` (1958 Z. / 50 KB) — über `src/app/pro/layout.tsx`, gilt für alle 13 `/pro/**`
Eigene Module: `sale.module.css` (212 Z.), `settings.module.css` (1 Z.), `account-forms.module.css` (12 Z.), `messages.module.css` (23 Z.)

### `/app/**` — Eigentümerbereich

| Route | Datei | Zeilen | CSS | Geteilte Komponenten | Dokument oder App? | Anmerkung |
|---|---|---|---|---|---|---|
| `/app` | `app/page.tsx` | 43 | G,D,T,S,H | AppShell, EHOwnerWelcome, EHOwnerPageHeader, EHOwnerOverview, EHOwnerSection, EHOwnerRecords, EHOwnerComposer, EHOwnerLinks, EHCallout, EHButton | **gemischt** — App-Rahmen und zweispaltige Overview mit Zeilen; der Kopf ist ein großer `h1` mit Erklär-Satz (`EHOwnerPageHeader`) plus Begrüßungsbild (`EHOwnerWelcome`), also Dokument-Kopf auf App-Körper. | Kleine Datei, aber 7 `EHOwner*`-Spezialbausteine, die **sonst keine andere Seite nutzt**. |
| `/app/calendar` | `app/calendar/page.tsx` | 45 | G,D,T,S,H | AppShell, EHOwnerPageHeader, EHOwnerFilters, EHOwnerSection, EHOwnerRecords, EHEmptyState | **App** — filterbare Terminliste, Zeilen fester Struktur, Monatsgruppen, Zähler im Kopf («N Termine»). | Einzige Seite mit `EHOwnerFilters` für Blättern; 50er-Pagination nur in der Vergangenheits-Ansicht. |
| `/app/consultation` | `app/consultation/page.tsx` | 32 | G,D,T,S,H | AppShell, EHAppHeader, EHPanel, EHField, EHTextarea, EHInput, EHSubmitButton, HausmeisterAssistant | **Dokument** — `h1` + zwei Sätze Erklärtext, drei Icon-Versprechen (`consultation-points`), darunter ein Panel mit einem Formular. | Ist im Grunde nur ein Formular; `consultation-points` ist eine globale Klasse aus `design-system.css`, kein Modul. |
| `/app/contracts` | `app/contracts/page.tsx` | 235 | G,D,T,S,H | AppShell, EHAppHeader, EHFacts, EHList, EHWorkSection, EHDetailDisclosure, EHWorkflowForm/Stack, EHFormSection, EHFieldGrid, EHInput, EHSelect, EHTextarea, EHCheckbox, EHStatus | **gemischt** — Kennzahlenleiste (`EHFacts`: 3 Werte) und Fristenliste sind App; der Erklär-Satz unter dem `h1` und je ein **vollständiges Bearbeitungsformular pro Vertragszeile** sind Dokument. | **Drittgrößte Seite.** Zwei Ansichten in einer Route (`?tab=vertraege`/`?tab=sparcheck`), eigene `tabs`-Prop an AppShell (einzige Seite neben `/app/plans`, die das braucht). Rechenlogik in `src/lib/contracts`. |
| `/app/documents` | `app/documents/page.tsx` | 28 | G,D,T,S,H | AppShell, EHAppHeader, EHDossierList, EHWorkSection, EHEmptyState, EHStatus, EHButton | **App** — drei Dossier-Listen mit Betrag, Status-Chip und offener Summe. | Einzige Seite mit `EHDossierList`. Sehr kleine Datei, weil alles in der Komponente steckt. |
| `/app/documents/[jobId]/receipt` | `app/documents/[jobId]/receipt/page.tsx` | 13 | G,D,T,S | EHDocumentFrame, EHLogo, PrintButton | **Dokument** (Druckdokument) — keine App-Hülle, Beleg-Layout mit `receipt-page`/`receipt-grid`/`receipt-total`, `print-hide`-Werkzeugleiste. | **Kein AppShell** — absichtlich: soll druckbar sein. Nutzt globale Klassen, kein Modul. |
| `/app/emergency` | `app/emergency/page.tsx` | 22 | G,D,T,S,H | AppShell, EHAppHeader, EHPanel, EHField, EHSelect, EHTextarea, EHSubmitButton | **Dokument** — Warnblock („Lebensgefahr? 112"), drei Vertrauens-Chips (`emergency-trust`), ein Formular. | Rein sequenziell gestapelt; keine Kennzahlen, keine Liste. |
| `/app/hausmanager` | `app/hausmanager/page.tsx` | 136 | G,D,T,S,H | AppShell, EHManagerHero, EHManagerAttention, EHManagerGrid, EHManagerThreads, EHManagerTasks, EHManagerWide, EHManagerAutomations, EHFormFeedback | **App** — echtes Dashboard: Hero, Aufmerksamkeitsleiste, mehrspaltiges Raster (`EHManagerGrid`) mit drei Karten fester Rolle, Automatisierungs-Schalter. | Einzige Seite mit dem kompletten `EHManager*`-Satz. Die `EHManager*`-Bausteine existieren nur für diese eine Route. |
| `/app/hausmeister` | `app/hausmeister/page.tsx` | 54 | G,D,T,S,H | AppShell, EHAppHeader, EHPanel, EHErrorState, HomeownerHausmeisterComposer (199 Z.), HausmeisterQuotaStatus | **gemischt** — Chat-Arbeitsfläche (`agent-chat`, Nachrichtenzeilen, Composer) ist App; darüber stehen Erklär-Satz und Kontingent-Panel mit vier Hinweis-Paragraphs, also Dokument. | Nutzt globale Legacy-Klassen (`housemaster-panel`, `resolution-actions`, `trust-strip`) direkt im Markup. |
| `/app/hilfe` | `app/hilfe/page.tsx` | 77 | G,D,T,S,H | AppShell, EHAppHeader, EHWorkspaceGrid, EHWorkSection, EHPanel, EHList, EHDetailDisclosure, EHButton | **Dokument** — vier aufklappbare Textabschnitte mit je einer Linkliste; kein Zustand, keine Kennzahlen. | Reine Text-/Navigationsseite. Statisch, kein DB-Zugriff. |
| `/app/home` | `app/home/page.tsx` | 80 | G,D,T,S,H | AppShell, EHAppHeader, EHPropertyOverview, EHWorkMetrics, EHWorkspaceGrid, EHWorkSection, EHList, EHDetailDisclosure, EHServiceDirectory, HouseProfileForm, HouseAssetForm | **App** — Faktenleiste zum Objekt (Baujahr/Wohnfläche/Grundstück/Technik), drei Kennzahlen (`EHWorkMetrics`), zweispaltiges Raster, Technik- und Wartungslisten. | Einzige Seite mit `EHPropertyOverview`. Anker-Navigation (`#technik`). |
| `/app/home/history` | `app/home/history/page.tsx` | 85 | G,D,T,S,H | AppShell, EHAppHeader, EHWorkSection, EHList, EHWorkflowForm, EHFormSection, EHFieldGrid, EHWorkspaceGrid, EHStatus, EHSubmitButton | **gemischt** — Historienliste, Eigentümer-Historie und Übergabe-Verlauf sind App; ein 25-Zeilen-Erfassungsformular und zwei Erklärblöcke sind Dokument. | Stärkster Sonderfall: enthält eine `breakableEmail()`-Hilfsfunktion, die mit `\u200B` Zeilenumbrüche in E-Mails erzwingt, weil `EHList` nur Strings akzeptiert. |
| `/app/home/passport` | `app/home/passport/page.tsx` | 16 | G,D,T,S | EHDocumentFrame, EHLogo, PrintButton | **Dokument** (Druckdokument) — `passport-page`/`house-passport`, Abschnitte Technik & Historie, `print-hide`-Leiste. | **Kein AppShell.** Einzeiliges Markup in Zeile 15 — schwer zu warten. |
| `/app/home/sale` | `app/home/sale/page.tsx` | 128 | G,D,T,S,H, `sale.module.css` (212 Z.) | AppShell, SectionTitle, EHAppHeader, EHPanel, EHList, EHEmptyState, EHField, EHSelect, EHInput, EHTextarea, EHStatus, EHSubmitButton | **gemischt** — Copilot-Objektzeile, Verkaufsstatus-Treppe (`styles.lifecycle`) und Makler-Trefferliste mit Passungs-Prozent sind App; zwei Bewertungsformulare und drei Datenschutz-Erklärblöcke sind Dokument. | Einzige App-Seite mit eigenem CSS-Modul nennenswerter Größe (212 Z.). Nutzt `isBrokerEligibleForProperty`. |
| `/app/insurance` | `app/insurance/page.tsx` | 60 | G,D,T,S,H | AppShell, EHAppHeader, EHPanel, EHEmptyState, EHErrorState, EHField, EHTextarea, EHSubmitButton, HausmeisterAssistant | **Dokument** — `h1` + dreizeiliger Erklärtext mit juristischen Klarstellungen, dann je Auftrag ein Panel mit Formular. | Erzeugt pro Auftrag ein Panel — wiederholt sich, aber ohne Liste/Kennzahlen. |
| `/app/invoices/[id]` | `app/invoices/[id]/page.tsx` | 16 | G,D,T,S | EHDocumentFrame, EHErrorState, InvoiceView, PrintButton | **Dokument** (Druckdokument) — `invoice-page`, Werkzeugleiste mit Bezahlen-Button, dann Rechnungsansicht. | **Kein AppShell.** Teilt `InvoiceView` mit `/pro/invoices/[id]`. |
| `/app/jobs` | `app/jobs/page.tsx` | 200 | G,D,T,S,H | AppShell, EHOwnerPageHeader, EHOwnerSearch, EHOwnerFilters, EHOwnerSection, EHOwnerRecords, EHEmptyState | **App** — Suche + Statusfilter mit Zählwerten + Auftragsliste mit Medien-Thumbnail und Status-Chip. | **Achtung bei der Aufwandsschätzung:** von 200 Zeilen sind ~120 eine einzige SQL-Abfrage (Zeilen 82–140). Echte Komplexität deutlich niedriger als die Zeilenzahl. |
| `/app/jobs/[id]` | `app/jobs/[id]/page.tsx` | 98 | G,D,T,S,H | AppShell, SectionTitle, EHAppHeader, EHPanel, EHWorkspaceGrid, EHWorkSection, EHStatus, EHEmptyState, EHErrorState, EHFormFeedback, JobMedia, SubmitButton | **gemischt** — zweispaltige Arbeitsfläche, Angebotsvergleich mit Badges (Empfehlung/günstigster/schnellster) und Chat sind App; drei Erklärblöcke (`ai-summary`, `claim-form`, `review-card`) sind Dokument. | Zwei völlig verschiedene Seiten in einer Datei: `request_kind==='contact'` (Zeilen 37–53) und Service-Fall (ab Zeile 54). 8 Server Actions. |
| `/app/messages` | `app/messages/page.tsx` | 110 | G,D,T,S,H, `messages.module.css` (23 Z.) | AppShell, EHContactWorkspace, EHConversation, EHCallout, OwnerMessageComposer (110 Z.) | **App** — Master-Detail-Adressbuch: Kategorien → Unterkategorien → Kontakte → Unterhaltung, mit Unread-Zählern. | Einzige Seite mit `EHContactWorkspace`. Vier `notFound()`-Pfade allein für die Query-Parameter-Validierung. |
| `/app/more` | `app/more/page.tsx` | 31 | G,D,T,S,H | AppShell, EHAppHeader, EHServiceDirectory, EHCallout | **Dokument** — flaches Navigationsverzeichnis in drei Gruppen plus ein Hinweisblock. | Laut Code-Kommentar bewusst nur noch für alte Lesezeichen behalten. |
| `/app/onboarding` | `app/onboarding/page.tsx` | 57 | G,D,T,S,H | AppShell, EHPanel, EHField, EHInput, EHSelect, EHCheckbox, EHSubmitButton, EHButton, EHErrorState | **Dokument** — Dreischritt-Formular mit Fortschrittsbalken, je Schritt Panel + Erklär-Satz + Formular. | Kompakter Wizard; eigene `actions.ts` (90 Z.). |
| `/app/partners` | `app/partners/page.tsx` | 10 | — | keine (Redirect) | **n/a** | `redirect('/app/messages')`. Kein Markup, keine CSS, keine Komponenten. |
| `/app/partners/[id]` | `app/partners/[id]/page.tsx` | 40 | G,D,T,S,H | AppShell, EHAppHeader, EHPanel, EHList, EHEmptyState, EHErrorState, EHField, EHInput, EHSubmitButton, EHFormFeedback, EHButton | **Dokument** — großes `h1` mit Bewertungssatz, Logo-Hero (`partner-profile-hero`), zwei Fakten-Listen, Bewertungspanel. | Nutzt `partner-profile-hero`/`partner-tags` als globale Klassen; DB-Filter verlangt `verified=1` **und** aktiven Vertrag. |
| `/app/plans` | `app/plans/page.tsx` | 85 | G,D,T,S,H | AppShell, EHAppHeader, EHPanel, EHList, EHWorkspaceGrid, EHWorkSection, EHStatus, EHText, EHButton, EHCheckbox, EHSubmitButton, EHEmptyState, EHErrorState, EHFormFeedback | **Dokument** — Status-Panel + je Tarif ein Panel mit Preis, Beschreibung, Leistungsliste und Abschluss-Button; viel Fließtext. | Sechs verschiedene `searchParams`-Zustände (`checkout=success/processing/cancelled/unavailable`, `switch=done`, `error`). |
| `/app/profile` | `app/profile/page.tsx` | 46 | G,D,T,S,H | AppShell, EHAppHeader, EHWorkspaceGrid, EHIdentitySummary, EHWorkflowForm, EHFormSection, EHFieldGrid, EHField, EHInput, EHWorkSection, EHList, EHCallout, EHSubmitButton, InstallAppCard | **gemischt** — zweispaltig mit Identitätskarte (`EHIdentitySummary`) = App; darunter Formular und drei Hinweisblöcke = Dokument. | Einzige Seite mit `EHIdentitySummary`. Zwei Logout-Formulare (Tests erwarten `data-testid="owner-logout-profile"`). |
| `/app/settings` | `app/settings/page.tsx` | 61 | G,D,T,S,H, `settings.module.css`, `account-forms.module.css` | AppShell, EHAppHeader, EHPanel, EHList, EHButton, PwaSettingsStatus (60 Z.), AiSettings (150 Z.), AccountActions (82 Z.), InstallAppCard | **Dokument** — vier Panels mit je einem Erklär-Absatz; zwei Schalter sind bewusst deaktiviert (`styles.disabledSetting`). | **Seite ist ein Container:** 61 Zeilen Seite, aber 292 Zeilen in drei lokalen Komponenten. Der Umbau betrifft überwiegend diese. |
| `/app/year` | `app/year/page.tsx` | 93 | G,D,T,S,H | AppShell, EHAppHeader, EHWorkSection, EHScheduleList, EHRouteTabs, EHActions, EHList, EHEmptyState, EHButton, EHStatus, EHSubmitButton | **App** — Jahresumschalter, Reiter Plan/Historie, Terminliste mit Datums-Chips (`EHScheduleList`, Zeilen fester Höhe), Erledigt-Buttons. | Einzige Seite mit Jahr-Navigation (1900–9998) und `EHScheduleList` im Eigentümerbereich. |

### `/notifications`

| Route | Datei | Zeilen | CSS | Geteilte Komponenten | Dokument oder App? | Anmerkung |
|---|---|---|---|---|---|---|
| `/notifications` | `notifications/page.tsx` | 45 | G,D,T,S | AppShell, EHAppHeader, EHList, EHEmptyState, EHButton, EHStatus | **App** — Liste mit 25 Zeilen/Seite, Unread-Zähler im Untertitel, Status-Chip, Gelesen/Ungelesen-Aktion pro Zeile. | **Rollen-agnostisch:** eine Datei für Eigentümer *und* Partner (`role={u.role}`). Liegt außerhalb `/app` und `/pro`, bekommt deshalb **weder H noch P**. Nutzt klassen `<nav className="pager">` und `.btn ghost` global. |

### `/pro/**` — Partnerbereich

| Route | Datei | Zeilen | CSS | Geteilte Komponenten | Dokument oder App? | Anmerkung |
|---|---|---|---|---|---|---|
| `/pro` | `pro/page.tsx` | 136 | G,D,T,S,P | AppShell, EHAppHeader, EHWorkMetrics, EHWorkspaceGrid, EHWorkSection, EHPriorityAction, EHRequestList, EHList, ProviderAccessBoundary, ProviderState | **App** — Begrüßung mit Uhrzeit, **vier Kennzahlen**, „Als Nächstes"-Aktion, zweispaltig: Anfrageliste + Terminvorschau. | Drei verschiedene Zustands-Varianten bevor überhaupt Inhalt kommt (kein Betrieb / nicht verifiziert / Vertrag inaktiv). |
| `/pro/calendar` | `pro/calendar/page.tsx` | 135 | G,D,T,S,P | AppShell, EHWorkMetrics, EHWorkSection, EHScheduleList, ProviderPageIntro, ProviderSectionHeader, ProviderState, ProviderAccessBoundary | **App** — vier Kennzahlen (Heute/Anstehend/Überfällig/Erledigt), vier Terminlisten mit Ankern, Zeilen fester Höhe. | Aufwändigste Filterlogik im Pro-Bereich: fünf Zeitraum-Buckets mit `berlinDayKey()`. |
| `/pro/hilfe` | `pro/hilfe/page.tsx` | 84 | G,D,T,S,P | AppShell, EHAppHeader, EHPanel, EHText, EHTextLink, EHWorkflowStack | **Dokument** — `h1` + Erklär-Satz, dann zehn Text-Panels mit je einem Absatz und ein bis zwei Links. | Reine Texthilfe, kein DB-Zugriff. Enthält `\uXXXX`-Escapes im Quelltext (schwer lesbar). |
| `/pro/invoices/[id]` | `pro/invoices/[id]/page.tsx` | 45 | G,D,T,S | EHDocumentFrame, InvoiceView, PrintButton, ProviderAccessBoundary | **Dokument** (Druckdokument) — `invoice-page pro-invoice-page`, Werkzeugleiste mit Stornieren, dann Rechnung. | **Kein AppShell.** Teilt `InvoiceView` mit `/app/invoices/[id]`. |
| `/pro/jobs` | `pro/jobs/page.tsx` | 6 | — | keine (Redirect) | **n/a** | `redirect('/pro/orders')`. Kein Markup. |
| `/pro/jobs/[id]` | `pro/jobs/[id]/page.tsx` | 375 | G,D,T,S,P | AppShell, EHAppHeader, EHPanel, EHList, EHCallout, EHStatus, EHQuoteForm, EHAssignmentForm, EHJobMessageForm, EHAttachmentPanel, EHWorkspaceGrid, EHWorkSection, EHErrorState, JobMedia, SubmitButton, ProviderAccessBoundary, ProviderNextStep, ProviderSectionHeader, ProviderState | **gemischt** — Arbeitsfläche mit Statusmaschine, Angebotsformular, Zuweisung, Chat, Anhänge, Rechnungsliste = App; Erklärblöcke zu Notfall, Servicefall und Kundenkontakt = Dokument. | **Größte Seite der gesamten App.** Siehe Abschnitt 4. |
| `/pro/leads` | `pro/leads/page.tsx` | 88 | G,D,T,S,P | AppShell, EHPanel, EHCallout, EHField, EHSelect, ProviderPageIntro, ProviderSectionHeader, ProviderState | **Dokument** — Intro + Datenschutz-Hinweis + je Lead ein Panel mit **einem langen Fließtext-Absatz** (Adresse, Name, E-Mail, Telefon, Fläche, Preisspanne) und einem Status-Dropdown. | Keine Liste, keine Kennzahlen — die Leads sind Panels mit Prosa. Zwei Zugangs-Hürden (Betrieb zugeordnet, Makler-Kategorie aktiv). |
| `/pro/messages` | `pro/messages/page.tsx` | 112 | G,D,T,S,P, `messages.module.css` (23 Z.) | AppShell, EHInbox, EHContactGroup, EHConversation, EHFormFeedback, ProviderPageIntro, ProviderAccessBoundary, ProviderMessageComposer (110 Z.) | **App** — Postfach mit Kontaktliste links und Unterhaltung rechts, Unread-Zähler. | Einzige Seite mit `EHInbox`. Nutzt `styles` aus dem Modul, aber der Composer ist die einzige sichtbare Verwendung. |
| `/pro/onboarding` | `pro/onboarding/page.tsx` | 103 | G,D,T,S,P | AppShell, EHAppHeader, EHWorkflowStack, EHWorkflowForm, EHWorkflowHeading, EHStepProgress, EHFormSection, EHFieldGrid, EHField, EHInput, EHSelect, EHTextarea, EHCheckbox, EHFormFeedback, EHSubmitButton, EHActions, EHPanel, EHEmptyState, EHTextLink | **Dokument** — Vier-Schritt-Wizard: Schrittanzeige, Überschrift, Formularabschnitte, Abschluss-Panel. | Die **neue** Pro-Einrichtung (SQL/`db`, Server Actions) — nicht verwechseln mit `src/app/onboarding/pro/**` (Supabase, siehe 1b). |
| `/pro/orders` | `pro/orders/page.tsx` | 133 | G,D,T,S,P | AppShell, EHWorkMetrics, EHWorkSection, EHOrderList, ProviderPageIntro, ProviderSectionHeader, ProviderState, ProviderAccessBoundary | **App** — drei Kennzahlen (Aktive Aufträge / Kontakte / Abgeschlossen) und drei Auftragslisten mit Betrag, Status, Kontakt und nächster Aktion pro Zeile. | Einzige Seite mit `EHOrderList`. Zwei verschiedene SQL-Abfragen je nach `canManageJobs`. |
| `/pro/plans` | `pro/plans/page.tsx` | 26 | G,D,T,S,P | AppShell, SectionTitle, EHPanel, EHList, EHErrorState, EHCallout, ProviderPageIntro, ProviderState | **Dokument** — Intro, Hinweisblock, aktueller Tarif, je Tarif ein Panel mit Beschreibung und Leistungsliste. | Klein, aber fünf `searchParams`-Zustände. |
| `/pro/profile` | `pro/profile/page.tsx` | 200 | G,D,T,S,P | AppShell, SectionTitle, EHPanel, EHList, EHErrorState, EHStatus, EHText, EHActions, EHWorkflowForm, EHFormSection, EHFieldGrid, EHField, EHInput, EHTextarea, EHSelect, EHCheckbox, EHSubmitButton, EHFormFeedback, ProviderPageIntro, ProviderState, ProviderAccessBoundary, InstallAppCard | **Dokument** — Intro + ein **einziges riesiges Formular** (~60 Felder inkl. Makler-Suchprofil) plus dazwischen Textpanels. | **Zweitgrößte Seite, aber reines Formular.** Siehe Abschnitt 4. |
| `/pro/team` | `pro/team/page.tsx` | 68 | G,D,T,S,P | AppShell, EHAppHeader, EHWorkspaceGrid, EHWorkSection, EHStatus, EHButton, EHField, EHInput, EHCheckbox, EHWorkflowStack, EHWorkflowForm, EHFormSection, EHFormFeedback, EHSubmitButton, EHText, EHEmptyState | **gemischt** — zweispaltig, Mitgliederliste mit Status-Chips und je Mitglied ein Inline-Formular (App) + Erklärpanel zu Berechtigungen (Dokument). | Enthält einen `<wbr />`-Workaround für lange E-Mails (analog `/app/home/history`). Berechtigung `canManageJobs` schaltet Felder `disabled`. |

---

## 3. Die gemeinsamen Bausteine

### 3a. Es gibt eine gemeinsame Hülle — und sie sitzt an genau einer Stelle

**`src/components/shell.tsx` → `AppShell` (56 Zeilen) — verwendet von 35 der 41 App-Routen.**

Die Kette ist vierstufig und an jeder Stelle **einmal** änderbar:

```
src/components/shell.tsx  (AppShell, 56 Z.)
   └── EHWorkspaceFrame  (packages/eh-design/src/workspace.tsx, Zeile 6)
         ├── EHSidebar        (workspace-sidebar.tsx, 87 Z.)
         ├── .workspaceTop    (Kopfzeile)
         ├── EHRouteTabs      (Kontextnavigation)
         ├── Breadcrumbs      (src/components/breadcrumbs.tsx, 30 Z.)
         └── BottomNav        (src/components/bottom-nav.tsx, 18 Z.)
```

**Beleg aus `packages/eh-design/src/styles.module.css` — das ist ein echter App-Rahmen mit festen Maßen:**

| Zeile | Regel | Bedeutung |
|---|---|---|
| 327 | `.workspace { display:grid; grid-template-columns:**248px** minmax(0,1fr); min-height:100dvh; }` | feste 248px-Seitenleiste |
| 328 | `.workspaceSidebar { position:sticky; top:0; **height:100dvh**; overflow-y:auto; }` | Seitenleiste in fester Höhe |
| 351 | `.workspaceTop { **height:80px**; display:flex; align-items:center; justify-content:space-between; padding:0 40px; }` | Kopfzeile mit **fester Höhe 80px** |
| 355 | `.workspaceContent { max-width:1320px; padding:40px; display:grid; **gap:32px**; }` | Arbeitsfläche, **32px** Blockabstand |
| 357–358 | `.workspaceMobile,.workspaceBottom { display:none }` / `.workspaceGrid { grid-template-columns:minmax(0,1.65fr) minmax(280px,1fr); gap:32px }` | untere Leiste + zweispaltiges Raster |
| 394–395 | `@media(max-width:1199px) { .workspace { grid-template-columns:minmax(0,1fr) } .workspaceSidebar,.workspaceContext { display:none } }` | Umbruch auf Mobil |

**Antwort auf deine entscheidende Frage: Es gibt eine gemeinsame Hülle.** Der Aufwand ist **einmal**, nicht 40-mal. 35 von 41 Routen hängen an `AppShell`; die restlichen 6 sind 4 Druckdokumente und 2 Redirects, die bewusst keine Hülle tragen.

Die **6 Routen ohne AppShell** — absichtlich, nicht vergessen:
`app/documents/[jobId]/receipt`, `app/home/passport`, `app/invoices/[id]`, `pro/invoices/[id]` (alle vier: `EHDocumentFrame`, druckbar) sowie `app/partners`, `pro/jobs` (Redirects).

Navigation und Bereichslisten liegen zentral in **`src/components/nav-config.ts` (215 Zeilen)** — `ownerAreas`, `providerAreas`, `ownerContextTabs`, `providerContextTabs`, `ownerAccountTabs`, `crumbs()`. Elf Routen greifen darauf zu.

### 3b. Nutzungszählung über die 41 App-Routen

Gezählt mit `grep -lw` über dieselbe 41er-Liste (Wortgrenzen, damit `EHField` nicht `EHFieldGrid` mitzählt):

| Baustein | Datei | von 41 Routen |
|---|---|---|
| **AppShell** (Hülle: Seitenleiste, Kopfzeile, Reiter, Brotkrume, untere Leiste) | `src/components/shell.tsx` | **35** |
| EHAppHeader | `packages/eh-design/src/app.tsx` | 23 |
| EHPanel | `packages/eh-design/src/blocks.tsx` | 18 |
| EHList | `packages/eh-design/src/app.tsx` | 16 |
| EHEmptyState | `packages/eh-design/src/app.tsx` | 16 |
| EHSubmitButton | `packages/eh-design/src/submit-button.tsx` | 15 |
| EHButton | `packages/eh-design/src/primitives.tsx` | 15 |
| EHWorkSection | `packages/eh-design/src/workspace.tsx` | 14 |
| EHField | `packages/eh-design/src/app.tsx` | 13 |
| EHStatus | `packages/eh-design/src/primitives.tsx` | 12 |
| EHFormFeedback | `packages/eh-design/src/workflow-layouts.tsx` | 12 |
| EHWorkspaceGrid (zweispaltig) | `packages/eh-design/src/workspace.tsx` | 9 |
| EHInput | `packages/eh-design/src/app.tsx` | 10 |
| EHText / EHCallout | `primitives.tsx` / `blocks.tsx` | je 8 |
| ProviderState (Leer-/Fehlerzustand) | `src/components/provider/workspace.tsx` | 8 |
| ProviderAccessBoundary (Rechte-Banner) | `src/components/provider/workspace.tsx` | 7 |
| EHWorkflowStack / EHWorkflowForm / EHFormSection | `packages/eh-design/src/workflow-layouts.tsx` | je 6 |
| ProviderPageIntro | `src/components/provider/workspace.tsx` | 6 |
| EHWorkMetrics (Kennzahlenleiste) | `packages/eh-design/src/workspace.tsx` | 4 |
| **EHDocumentFrame** (Druckhülle) | `packages/eh-design/src/documents.tsx` | 4 |
| EHManagerGrid / EHManagerHero (nur `/app/hausmanager`) | `workspace-hausmanager.tsx` | 1 |
| EHContactWorkspace (nur `/app/messages`) | `workspace-contact-directory.tsx` | 1 |
| EHInbox (nur `/pro/messages`) | `workspace-conversation.tsx` | 1 |
| EHOrderList (nur `/pro/orders`) | `workspace-records.tsx` | 1 |
| EHRequestList (nur `/pro`) | `workspace-records.tsx` | 1 |
| EHOwnerPageHeader / EHOwnerRecords / EHOwnerSection | `workspace-owner.tsx` | je 3 |
| EHScheduleList (Zeilen fester Höhe) | `workspace-records.tsx` | 2 |
| EHConversation (Chat) | `workspace-conversation.tsx` | 2 |
| EHServiceDirectory | `workspace.tsx` | 2 |
| EHRouteTabs | `blocks.tsx` | 2 |
| EHDetailDisclosure | `blocks.tsx` | 3 |

### 3c. Was das für den Umbau bedeutet

- **Der Rahmen ist zentral.** Seitenleiste (248px), Kopfzeile (80px), untere Leiste, Kontext-Reiter und Brotkrume änderst du in `shell.tsx` + `workspace.tsx` + `workspace-sidebar.tsx` + `styles.module.css` Zeilen 327–400. **Ein Eingriff, 35 Seiten.**
- **Der Inhalt ist es nicht.** Was Jeremy als „Dokument" sieht, entsteht im Innenbereich: `EHAppHeader` ist ein `<h1>` mit Erklär-Absatz (`styles.module.css` Zeile 169–170: `padding-bottom:32px; border-bottom:1px solid; margin-bottom:32px`), und `EHWorkflowStack` (Zeile 307) stapelt einfach `display:grid; gap:24px`. Zusammen mit dem 32px-Rasterabstand entsteht eine lange, ruhige Textspalte — genau der Dokument-Eindruck.
- **Kandidat für den größten Hebel:** `EHAppHeader` (23 von 41 Routen) und `EHWorkflowStack` (6 Routen) sind die beiden Bausteine, die den Dokument-Charakter erzeugen. Wer die umbaut, verändert das Bild auf 23 Seiten gleichzeitig.
- **Achtung Sonderfall CSS:** `app/homeowner.module.css` (1875 Z.) und `pro/provider-workspace.module.css` (1958 Z.) bestehen fast nur aus **`.ownerScope :global(...)`** — 420 bzw. 447 `:global`-Regeln, die Legacy-Klassennamen (`app-shell-v3`, `desktop-sidebar`, `topbar-v3`, …) stylen. Davon sind nur **4 Klassen lokal** (`ownerScope`, `skipLink`, `mainAnchor`, `mainAnchor:focus`). Sehr wahrscheinlich ein großer Teil totes CSS — vor dem Umbau prüfen, sonst schleppst du 3800 Zeilen Altlast mit.

---

## 4. Die drei dicksten Brocken

### 1. `/pro/jobs/[id]` — `src/app/pro/jobs/[id]/page.tsx`, **375 Zeilen**

Größte `page.tsx` der gesamten Anwendung (zum Vergleich: `/admin/crm` hat 313, `/app/contracts` 235).

- **Vier Zustände in einer Datei:** `request_kind==='contact'` vs. Service-Auftrag × angenommen vs. offen. Der Code verzweigt mehrfach (`isContact`, `isAccepted`, `mine`, `ctx.canManageJobs`) — faktisch vier verschiedene Seiten.
- **8 Server Actions** importiert: `acceptContactRequestAction`, `assignJobContactAction`, `declineDispatchAction`, `markCompleteAction`, `markInProgressAction`, `sendMessageAction`, `sendSavedContactMessageAction`, `submitQuoteAction`.
- **Eigene Unterkomponenten:** `document-form.tsx` (17 Z.), `invoice-form.tsx` (12 Z.) — die Rechnungserstellung steckt zusätzlich in `InvoiceForm` mit 10 Parametern.
- **Sonderfälle:** Notfallzuschlag-Berechnung mit `emergency_markup_bps`, Rechte-Kaskade (`canAccessProviderJob` → `notFound()` an drei Stellen), eigenes Rechnungspanel, Servicefall-Anzeige, Anhang-Panel, Chat.
- **Warum schwer:** Wer das neu baut, muss vier Zustände und eine Rechte-Matrix gleichzeitig richtig hinbekommen.

### 2. `/pro/profile` — `src/app/pro/profile/page.tsx`, **200 Zeilen**

Nicht die längste, aber die **formular schwerste** Seite.

- **Ein einziges Formular** (`saveProviderProfileLifecycleAction`) mit rund **60 Feldern**: persönliche Angaben, Firmendaten, Logo-Upload, Gewerke, Anschrift, PLZ/Radius, Steuer- und USt-ID, Beschreibung, Kategorien, Leistungskatalog (aus DB), Anfragen-Einstellungen, Notfall-Bereitschaft (Modell, Uhrzeiten, sieben Wochentage, Zuschlag, Sofortbuchung, Kapazität) und ein **Makler-Suchprofil mit weiteren acht Feldern**.
- **Dynamische Listen:** Kategorien, Leistungen und Notfalltage werden aus der Datenbank erzeugt — das Formular ist datengetrieben, nicht statisch.
- **10 Feedback-Zustände** über `searchParams` (`verification=submitted/file/owner`, `profile=saved/review`, `stripe=ready/incomplete/missing/owner`).
- **Eigene Logik:** `pro/profile/actions.ts` (163 Zeilen) — die längste lokale Action-Datei im Pro-Bereich.
- **Warum schwer:** Jede Änderung am Formular-Layout betrifft ~60 Felder und vier verschachtelte `EHFormSection`-Blöcke.

### 3. `/app/contracts` — `src/app/app/contracts/page.tsx`, **235 Zeilen**

- **Zwei komplette Ansichten in einer Route** (`?tab=vertraege` und `?tab=sparcheck`) — faktisch zwei Seiten.
- **Kennzahlen + Fristenlogik:** drei `EHFacts`, Fristenberechnung über vier Zustände (`overdue`/`soon`/`planned`/`unknown`) mit eigener `DEADLINE_TONE`-Map und `deadlineLabel()`-Hilfsfunktion.
- **Ein Bearbeitungsformular pro Vertragszeile:** `EHDetailDisclosure` enthält für **jeden** Vertrag ein vollständiges Formular mit 14 Feldern, dazu ein Status-Umschalt-Formular. Bei 20 Verträgen rendert die Seite 20 Formulare.
- **Dritter Block:** ein Anlegen-Formular mit weiteren 20 Feldern inkl. Datei-Upload.
- **Externe Logik:** `src/lib/contracts.ts` (`cancellationDeadline`, `currentTermEnd`, `estimateSavings`, `affiliateLink`, …).
- **Sonderfall:** übergibt als eine von zwei Seiten eigene `tabs` an `AppShell`, weil beide Ansichten auf derselben Route liegen.
- **Warum schwer:** drei Blöcke (Kennzahlen, Liste, 2× Formular) plus eine Sparrechnung — der höchste Anteil echter Geschäftslogik aller Seiten.

### Ehrende Erwähnung — nicht in den Top 3, aber erwähnenswert

| Seite | Zeilen | Warum trotzdem relevant |
|---|---|---|
| `/app/jobs` | 200 | **Zeilenzahl trügt:** Zeilen 82–140 sind eine einzige SQL-Abfrage. Realer Umbau-Aufwand deutlich niedriger als `/pro/profile`. |
| `/admin/crm` | 313 | Größer als alle drei oben, aber **Admin-Werkzeug**, nicht Teil des Kunden-App-Umbaus. |
| `/app/settings` | 61 | Kleine Seite, **292 Zeilen** in lokalen Komponenten (`ai-settings.tsx` 150, `account-actions.tsx` 82, `pwa-settings-status.tsx` 60). Zeilenzahl der `page.tsx` unterschätzt den Aufwand um Faktor 5. |
| `/app/messages`, `/pro/messages` | 110 / 112 | Je 110 Zeilen lokaler `thread-client.tsx`; getrennte Implementierungen für Eigentümer und Partner mit **nahezu identischer SQL-Logik** — Zusammenlegung möglich. |
| `/app/home/sale` | 128 | Einzige App-Seite mit eigenem CSS-Modul von Gewicht (`sale.module.css`, 212 Z.). |

---

## 5. Zusammenfassung der Klassifikation

Jede Route ist genau **einer** Klasse zugeordnet (abgeleitet aus den Einzelbegründungen in Abschnitt 2):

| Klasse | Anzahl | Routen |
|---|---|---|
| **App** | **12** | `/app/calendar`, `/app/documents`, `/app/hausmanager`, `/app/home`, `/app/jobs`, `/app/messages`, `/app/year`, `/notifications`, `/pro`, `/pro/calendar`, `/pro/messages`, `/pro/orders` |
| **gemischt** | **9** | `/app`, `/app/contracts`, `/app/hausmeister`, `/app/home/history`, `/app/home/sale`, `/app/jobs/[id]`, `/app/profile`, `/pro/jobs/[id]`, `/pro/team` |
| **Dokument** | **14** | `/app/consultation`, `/app/emergency`, `/app/hilfe`, `/app/insurance`, `/app/more`, `/app/onboarding`, `/app/partners/[id]`, `/app/plans`, `/app/settings`, `/pro/hilfe`, `/pro/leads`, `/pro/onboarding`, `/pro/plans`, `/pro/profile` |
| **Druckdokument** (eigene Klasse, kein AppShell) | **4** | `/app/documents/[jobId]/receipt`, `/app/home/passport`, `/app/invoices/[id]`, `/pro/invoices/[id]` |
| **Redirect** (kein Markup) | **2** | `/app/partners`, `/pro/jobs` |
| **Gesamt** | **41** | 12 + 9 + 14 + 4 + 2 |

**Ehrliche Einordnung:** 23 der 41 Routen tragen in der Substanz Dokument-Charakter (14 klar Dokument + 9 gemischt mit Dokument-Kopf). Nur 12 zeigen durchgehend echten App-Zustand. Das deckt sich mit Jeremys Urteil — **mit einer wichtigen Einschränkung: der Rahmen ist bereits eine echte App-Hülle** (feste 248px-Seitenleiste, 80px-Kopfzeile, untere Leiste). Was wie ein Dokument wirkt, ist der Innenbereich: `EHAppHeader` als `h1` + Erklär-Absatz über einem 24–32px-Raster aus gestapelten Blöcken. Der Umbau ist damit kein Neubau von 40 Hüllen, sondern ein Umbau von **zwei Inhalts-Bausteinen** (`EHAppHeader`, `EHWorkflowStack`) plus den 14 Seiten, die inhaltlich wirklich Textseiten sind.

## 6. Offene Punkte / nicht belegt

- **„Wie viele Zeilen CSS sind tatsächlich tot?"** — nicht belegt. `homeowner.module.css` (1875 Z.) und `provider-workspace.module.css` (1958 Z.) enthalten 420 bzw. 447 `:global`-Regeln für Legacy-Klassen (`app-shell-v3`, `desktop-sidebar`, `topbar-v3`). Ob diese Klassen im heutigen Markup überhaupt noch vorkommen, habe ich **nicht** flächendeckend geprüft. Das wäre eine eigene Untersuchung (es liegt bereits ein `tmp-deadcss.mjs` im Projektverzeichnis, das darauf hindeutet, dass daran schon gearbeitet wurde).
- **Anteil der `page.tsx`-Zeilen, die SQL sind** — für alle Seiten nicht einzeln gemessen, nur für `/app/jobs` (~120 von 200) und `/pro/jobs/[id]` abgeschätzt. Zeilenzahlen sind deshalb als Aufwandsmaß nur bedingt belastbar.
- **`src/app/onboarding/pro/**` vs. `/pro/onboarding`** — ich habe **nicht** geprüft, welcher der beiden Stränge produktiv genutzt wird. Es existieren beide; vor dem Umbau muss geklärt werden, ob der Supabase-Strang noch traffic hat.
