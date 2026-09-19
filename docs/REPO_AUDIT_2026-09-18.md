# Repo-Gesamtpruefung 2026-09-18 (Post-Commit a3b424d)

Vier parallele Tiefen-Reviews (Owner-App, Partner-App, Admin/Infra, Legacy/Dead Code)
plus 24-Shot Muse-Visitaudit (1536px, beide Portale). Grundlage: `main` = `a3b424d`.

## Gesamtbild

**Daten und Auth sind gesund.** In `src/app/app/**` und `src/app/pro/**` gibt es
**keine Mockdaten** — jede Kennzahl und jede Liste kommt aus echten SQLite-Queries.
`requireUser('homeowner'|'provider')` + `requireAdmin()` sind lueckenlos serverseitig
durchgesetzt; `getProviderContext` fail-closed; `canAccessProviderJob` prueft Dispatch
oder Zuweisung. Die T-0168-Grenze (Client = UI-State, Server = Security Boundary) ist
gewahrt — mit einer Ausnahme: den Legacy-Routen.

**Das eigentliche Problem ist die Komposition.** Die App ist in drei verschiedene
Shell-Welten gespalten, und der neue Rahmen hat einen konstruierten Fehler, der auf
fast jeder zweiten Seite eine leere 240-px-Spalte stehen laesst.

## P0 — blockierend

1. **`werkbank-rahmen.tsx`: `.wb-norail` wird nie gesetzt.** `.wb-body` ist immer
   `grid-template-columns:212px 1fr 240px`. `{rail && <aside/>}` blendet nur das Element
   aus, die 240-px-Spalte bleibt stehen und ist **leer**. Live gemessen auf `/pro/calendar`
   (1536px): `.wb-main` rechts=1296, kein `.wb-rail`-Element → 240 px tote Flaeche.
   Betroffen: 7 Werkbank-Seiten ohne rail (documents, emergency, hilfe, home/sale,
   messages, partners/[id], settings, pro/jobs/[id]). `/admin` setzt die Klasse
   korrekt — der Fix ist also bewiesen 1-zeilig.
   *Das ist auch die Ursache des Muse-Befunds „rechte Kontextspalte fehlt komplett".*
2. **`nav-config.ts`: leere Sidebar-Gruppen.** `providerAreas` Anfragen/Nachrichten/Team
   haben `children: []` → beide Shells rendern Gruppen-Ueberschriften ohne Eintraege
   (live auf /pro/orders, /pro/hilfe, /pro, /pro/team, /pro/calendar).
3. **Legacy-Routen auf stillgelegtem Datenmodell.** `/anfrage/neu` schreibt in
   Supabase `anfragen` und leitet dann nach `/app/jobs` weiter — der Datensatz kommt
   dort nie an (bricht die User-Zusage). `/anfrage/[id]`, `/anfragen-pro`,
   `/ansprechpartner`, `/onboarding/pro/*` duplizieren kanonische Flaechen.
   **`/chat/[anfrageId]` ist das hoechste Risiko:** Realtime-Channel ohne pruefbare RLS,
   Supabase-Subject wird ungeprueft mit Application-User-ID gleichgesetzt (T-0168-Verstoß).
   Empfehlung: 5 Routen loeschen, `/ansprechpartner` als Redirect auf `/app/messages`.
4. **`AuthContext.PRIVATE_PREFIXES`:** 9 Phantom-Routen; Guard trifft fast nichts mehr
   (kein Sicherheitsloch — Server autorisiert — aber Totholz, das Schutz vortaeuscht).
5. **`werkbankLayout`-CSS seitenlokal dupliziert, Werte widerspruechlich.** 6 Dateien
   kopieren ~30 Zeilen CSS; `/app`+`/jobs/[id]` nutzen Rohwerte (`10.5px`/`13.5px`),
   `/profile`+`/calendar`+`/contracts` Tokens (`var(--eh-font-*)`). Gleiche Klassen,
   unterschiedliche Werte → `/app` und `/app/profile` sehen nicht gleich aus.
6. **`/pro` (Startseite des Partner-Portals):** im Sperrzustand nur eine Hinweisbox,
   darunter grosse weisse Flaeche — kein Kopf, keine Kennzahlen, kein Leerzustand.
   Im Normalpfad fehlen Kopf-Kontextzeile und Rail; `location` als roher `<p>`.
   **[ERLEDIGT via `08d57ef`** — Pro-Start hat Kopf, Kennzahlen und
   Leerzustand (`src/app/pro/page.tsx`).]
7. **`/app/partners` Redirect verschluckt Query** → Erfolgsmeldung nach
   „Bewertung melden" (`actions.ts:592`) geht verloren.
   **[ERLEDIGT via `0560ffb`** — `reportReviewAction` leitet zurück auf
   `/app/partners/[id]` und gibt Query (`message`/`error`) dorthin weiter.]

## P1 — wichtig

8. **Shell-Spaltung:** `/pro/orders`, `/pro/plans`, `/pro/hilfe`, `/pro/onboarding`
   laufen noch auf der alten `AppShell` (248-px-Sidebar, 80-px-Topbar, eigene Typo)
   statt `WerkbankRahmen` (212 px, 58 px, Markenpille). In /app: 10 Seiten komplett
   Alt, 7 halbfertig (WerkbankRahmen + Alt-Kopf statt `eh-werkbank-kopf`).
9. **Zwei veraltete Test-Suiten (Gates nicht mehr gruen):**
   - `test:api-contract` FAIL — erwartet `role==='ai' ? 'assistant' : 'user'` in
     `src/app/ki-chat/page.tsx`; das ist inzwischen ein reiner Redirect-Stub.
   - `test:crm` FAIL — wartet auf `article`-Lead-Karten; `/admin/crm` rendert
     inzwischen `EHWorkflowForm`/`EHFormSection`.
10. **`/app/hausmeister`** (meistgenutzter Einstieg) haengt komplett am Alt-Layout.
11. **`/pro/profile`: 2 native File-Inputs** („Choose File · No file chosen", englisch),
    native `type="time"` (12h/US-Anzeige „06:00 PM"), native Checkboxen ohne eh-Styling,
    natives `<details>`.
12. **`calendar` + `orders`: stornierte Vorgaenge zaehlen zu „Erledigt"/**
    „Abgeschlossen"** (`DONE_STATUSES` enthaelt `cancelled`).
13. **`/app/more`** ist eine Relikt-Route (selbst so kommentiert), nur vom Drawer-Footer
    verlinkt, und `/hilfe` setzt `active="/app/more"` (falsch). Loeschen + Link umleiten.
14. **Werkbank-Such-Pille ist ein zweiter Notifications-Link** (gleicher Link wie die
    Glocke) — keine echte Suche.
    **[ERLEDIGT via `41d48bf`** (`git log -S WerkbankSuche`: `41d48bf`,
    `d8ebb11`) — die Pille ist eine echte Cmd+K-Palette (`WerkbankSuche`,
    Vorschläge aus `nav-config`); der Pillen-Notifications-Link ist entfallen.]
15. **`thread-client.tsx`: `window.location.reload()`** nach Nachrichtensenden —
    verwirft allen UI-Zustand.
16. **`/app/home`: `appointments` mit `JOIN provider_profiles`** (inner) — Termine ohne
    Profil fallen weg; andere Seiten nutzen `LEFT JOIN`.
    **[ERLEDIGT via `7b839f0`** — jetzt `LEFT JOIN` + Nullwache auf
    `business_name`.]
17. **Zwei Alt-CSS-Leichen:** `homeowner.module.css` (1847 Z.) + `provider-workspace.module.css`
    (1958 Z.) stylen `app-shell-v3`-Markup, das nur noch von `pro/loading.tsx` erzeugt
    wird. `provider-workspace.module.css` enthaelt `.metrics{display:none}` (Falle:
    jedes Element mit Klasse `metrics` im Provider-Scope wird versteckt) und globale
    input/textarea/select-Overrides, die eh-Input-Radii ueberschreiben.
18. **`/onboarding/pro/*`** (3 Seiten) schreiben Profil in Supabase-`user_metadata`
    statt SQLite; kanonisch ist `/pro/onboarding`. Null Inbound-Links.
19. **Dev-DB vs Migration:** 6 Tabellen (`contact_directory_*`, `homeowner_contact_*`,
    `house_contracts`) existieren nur in der Dev-DB, nicht in
    `db/migrations/0001-baseline.sql` — frische Instanzen aus reiner Migration waeren
    unvollständig.
    **[ERLEDIGT via `14ae28c`** — Baseline von JS-Resten befreit, 6 Tabellen
    mit DDL/Indizes/Saatgut/Triggern ergänzt; frische DB = Dev-Stand
    (75 Tabellen, validiert).]
20. **`account-actions.tsx`: zwei Sign-Out-Pfade** (Client `signOut()` + Server
    `logoutAction`).
    **[WIDERLEGT — kein offener Befund:** `account-actions.tsx` enthält weder
    `logoutAction` noch einen zweiten Sign-Out-Pfad, nur Export/Löschen;
    `signOut()` läuft dort nur als Cleanup nach server-seitiger
    Kontolöschung. Einziger Abmeldepfad bleibt Server-`logoutAction`.]
21. **`messages.module.css` (app + pro) fast byte-identisch** (diff = 2 Werte) —
    zusammenfuehren.
    **[ERLEDIGT via `7b839f0`** — gemeinsame
    `src/components/messages-thread.module.css` (token-only), beide
    `thread-client.tsx` importieren sie.]

## P2 — Aufraeumen / Konsistenz

22. **39 unerreichbare Quell-Dateien:** [KORREKTUR: `src/components/ui/*`
    (avatar, breadcrumb, button, collapsible, dialog, dropdown-menu, input,
    separator, sheet, sidebar, skeleton, tooltip — per `ls` verifiziert) ist
    seit `d8ebb11` wieder Sidebar-07-Basis (`werkbank-shell.tsx` importiert
    daraus Sidebar/Provider/Breadcrumb/Separator) und damit erreichbar, nicht
    tot.] Weiter als unerreichbar geführt: `shadcn-studio/*`, `visuals/*`, `marketing/{gateway,security,trust,lazy-image,
    hero-orchestration,FeatureVisual*}`, `Stepper`, `count-up`, `pw-field`, `KiCard`,
    `hausmeister-composer` (alt), `preise/price-ledger`; Libs `utils.ts`,
    `config/design-tokens.ts`, `crm-sync.ts`, `i18n.ts`, `anfragen.ts`,
    `mailer.mailTemplates`.
23. **`globals.css`: 355/700 Klassen ohne Referenz**; `design-system.css`: 70/558 live.
24. **`icons.tsx`: 49/87 Exporte ungenutzt**, zwei Icon-Familien neben `lucide-react`.
    **[ERLEDIGT via `14ae28c`** — 87 → 34 Exporte, 53 ungenutzte entfernt
    (Referenzprüfung über alle `src/`-Dateien).]
25. **Terminologie „Anfrage" vs „Auftrag"** in `pro/page.tsx`, `pro/jobs/[id]`,
    `app/consultation` Metriken, `app/home/sale`.
    **[ERLEDIGT via `08d57ef`** — „Auftrag" in Beratung, Verkauf, Pro-Job
    und Pro-Start (`consultation`, `home/sale`, `pro/jobs/[id]`,
    `pro/page.tsx`).]
26. **Verwaiste Auth-Kette** `/welcome`, `/role`, `/register-owner`, `/register-pro`,
    `/check-email` → Redirects.
27. Kleine Daten-Echtheitsluecken: `partners/[id]` erfindener Beschreibungs-Fallback;
    `/app/home` „Dokumente"-Kennzahl mischt Dokumente + Rechnungen; `home/sale`
    `formatDate` zeitzonensicher machen; `documents/page.tsx` N+1 `fs.statSync`.
28. **Native Inputs auf `/app/home/history`** (3x File-Input, US-Datums-Placeholder),
    schwache rechte Leerzustaende [OFFEN — kein `EHFileInput` im Code
    (`grep EHFileInput` leer); History nutzt `EHInput type="file"`];
    `<progress>`-Teil **[ERLEDIGT via `08d57ef`** — `EHStepProgress` auf
    `/app/onboarding`].
29. `consultation` vs. `hausmeister` Beratungsdopplung; `error.tsx`/`loading.tsx`
    rendern außerhalb des Werkbank-Gerüsts.

## Visuelle Befunde (Muse, 24 Screenshots)

- **ALLES OK:** `/app/jobs`, `/app/settings`, `/pro/messages`, `/pro/plans` —
  Werkbank komplett, Inter, Petrol/Sand/Paper, Kontraste, Leerzustaende korrekt.
- **„schwarzer N-Kreis unten links"** auf fast jedem Shot: das ist der globale
  `assistantLauncher` (bzw. Dev-Badge), kein /pro- oder /app-Bug — nicht verfolgen.
- **Echte visuelle Mängel:** Ueberlappende Avatar-Stacks in der Sidebar unten
  („Eigenheim-Konto ·" abgeschnitten); Bereichs-Kacheln auf `/app/messages` mit
  zweizeilig gebrochenen Labels; `/app/insurance` CTA mit schwarzer Fuellung
  (Kontrast-Fail) + zu heller Disclaimer; `/app/hilfe` Heading-Farben inkonsistent
  (Gold/Oliv vs. Petrol); `/app/hausmeister` rechte Spalte zeigt rohe Technik-Texte
  (401/402/429, API-Key).
- **Korrektur zu Muse:** „Aufträge verwalten AN" ist *nicht* horizontal beschnitten
  (auf 4 Breiten gemessen); die Box rechnet nur bis zur vollen Inhaltsbreite ohne
  sichtbaren Abschluss.

## Gate-Status (aktuell)

- `tsc --noEmit`: 0 Errors
- `eslint .`: 0 Errors, 28 pre-existing Warnings
- `AUTH_MODE=supabase next build`: erfolgreich (143 Seiten)
- `eh-design-check.mjs`: 0 neue Schulden durch meine 3 Seiten
- `npm run test:security / test:supply-chain / test:intake / test:matching /
  test:onboarding / test:notifications / test:review / test:t0168-auth`: PASS
- **`test:api-contract` und `test:crm`: FAIL (veraltete Test-Assertions, nicht
  App-Bugs — aber die Gates sind nicht mehr gruen).**
- `test:e2e:architecture`: lokal nicht lauffähig (braucht Supabase-Produktionskeys).

## Empfohlene Reihenfolge

1. P0-1 (`wb-norail`, 1 Zeile) + P0-2 (leere Sidebar-Gruppen) — sofortiger
   sichtbarer Gewinn auf 11+ Seiten.
2. P0-3 Legacy-Routen loeschen (schließt die T-0168-Luecke).
3. P0-5 `werkbankLayout` in ein gemeinsames CSS-Modul.
4. P1-9 veraltete Tests reparieren (sonst ist „Gates gruen" nicht mehr aussagefaehig).
5. Dann erst die Werkbank-Migration der restlichen 17 Alt-/Halbfertig-Seiten.
