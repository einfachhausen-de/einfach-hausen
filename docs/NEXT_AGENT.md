> **EINFACH-WELLE 2026-09-21 (gebaut, Gates grün, NICHT gepusht/deployed):** Alle 16 Owner-Seiten radikal vereinfacht (Betreiber-Vorgabe: nichts Überflüssiges, alles selbsterklärend). contracts 410→342 (Rail-Doppel raus, Kennzahlen 4→2, Neu-Formular 14→8 Felder, „Direkter Weg“-Dopplung raus, Labels: Art/Zahlweise/Kündigen bis), insurance 168→138 (Tarif-/Ansprechpartner-Sektionen raus, N Inline-Formulare→1 nach Auftragswahl, „Servicefall“→„Hilfe“), consultation (Chat-Einbettung + Metrics raus, einheitlich „Beratung“), messages (Taxonomie-Aside + Metrics 4→2, „Anrufen“), profile 144→116 (Doppel-Logout, Metrics, Verifikations-Doppel, Install/WhatsApp-Callouts raus), hausmeister 129→97 (Limit-Absätze→1 Zeile, Aktivitäts-/Hausakte-Asides raus), jobs 318→251 + jobs-ansicht (Ansicht-Umschalter→1 Tabelle, Rail-Status/Termine raus, Chips 4→3), emergency/hilfe/calendar/home/year/documents/hausmanager/onboarding (Metrics halbiert, Doppel-Sektionen raus, Jargon ersetzt: Sparte→Art, Stichtag→Kündigen bis, Intervall→Zahlweise, Servicefall→Hilfe, Ablage→Dokumente, Wartungen→Pflege, Historie→Erledigt). Keine Backend-/Auth-/Designsystem-Änderung, nur Labels/Struktur mit bestehenden EH-Komponenten. Gates: tsc 0, lint 0, build 143/143, fixtures ok, byos 8/8, export 7/7, deletion 6/6, api-contract 17/17. NICHT lauffähig hier: test:e2e (braucht SUPABASE-Keys, nur OCI-VM), test:visual (Baselines ändern sich beabsichtigt → `test:visual:update` auf OCI-VM mit Browser nötig). Nächste Aktion: E2E + Visual auf OCI-VM, dann visuelle Jeremy-Abnahme (Pflicht vor Deploy), dann Push/Deploy.
> **BYOS-BACKUP 2026-09-21 (mit main gemergt, NICHT deployed):** "Hausakte-Backup in deiner Cloud" (WhatsApp-Modell) gebaut: `src/lib/byos-archive.ts` (Manifest, SHA-256-geschütztes Confirm+Thin-out, Rehydrate-Aufträge, Status, DSGVO-Purge), 4 Routen `src/app/api/account/cloud-backup/` (status|manifest|confirm|rehydrate, im Build), 4 Datei-Routen melden `409 archive_rehydrate_needed` statt 404 bei ausgedünnten Originalen, `src/lib/cloud-backup-bridge.ts` (Plattform-Erkennung, Backup-Runden, Auto-Restore 60s), `CloudBackupCard` als neue "Cloud-Backup"-Sektion im App-Tab des Settings-Dialogs (nur EH-Komponenten). Metadaten/Miniatur/Liste/KI bleiben immer serverseitig; Cloud-voll/ausgeloggt löscht nichts (kein Confirm = kein Thin-out). Gates: tsc 0, lint 0 errors, build ok, test:byos-backup 8/8, export 7/7, deletion 6/6. GitNexus detect-changes: Risk HIGH (erwartet: auth-geschützte Datei-Routen + account-deletion berührt; Auth-Checks unverändert, Deletion-Änderung rein additiv). Offen: natives `EHCloudBackup`-Plugin (Drive-OAuth/iCloud-Container, Store-Credentials; vgl. EH-APP-01 Apple-Developer/Bundle-ID), kein Prod-Deploy. Taskplan-Hinweis: `.sin-gpt-web/taskplan.sqlite3` existiert in diesem Checkout NICHT (Verzeichnis gitignored, nur evidence/ vorhanden) — kein neues DB-Init angelegt, Sync auf OCI-VM nachholen.
> **ABNAHMESCHICHT IST BREIT ROT — am 2026-09-21 auf der OCI-VM gemessen (kanonischer Host). Das Release-Gate deckt diese Suiten NICHT ab und ist deshalb kein Beleg fuer sie.** Der Befund ist wichtiger als jeder Einzelfix: das Gate meldet 16/16, waehrend die eigentliche Abnahme rot ist. Gemessen mit `sudo bash -c "set -a; . /etc/einfach-hausen.env; set +a; export PATH=/home/ubuntu/.nvm/versions/node/v22.23.0/bin:\$PATH; export PLAYWRIGHT_BROWSERS_PATH=/home/ubuntu/.cache/ms-playwright; cd /srv/einfach-hausen && npm run <suite>"`:
> | Suite | Stand | Ursache |
> |---|---|---|
> | `test:public-site` | **PASS** | — |
> | `test:public-nav` | **GRUEN** | Zwei echte Ursachen. (1) Die Browser-Aufloesung war macOS-only und ist in `0ad0083` behoben — die Suite lief auf der VM gar nicht, ihr Rot war bisher nicht messbar. (2) Die Geometrie-Zusicherung forderte ein Trust-Panel >= 820 px, also ein Vollbreiten-Grid, das die Auth-Seite nicht mehr ist; ihre Schwester mass `.arena-auth`, das nur die Viewportbreite ist. Sie beschreibt jetzt die zentrierte ~1000-px-Karte (Kartenbreite, Zentrierung, Zugehoerigkeit des Panels zur Karte, kein horizontaler Overflow) — `d4777e0`, lokal gruen inkl. `wide-auth-layout`. **Kein Designautoritaetsfall:** die Zusicherung kodierte ein Layout, das es nicht mehr gibt. |
> | `test:auth-design` | **GRUEN** | Der Vertrag kodierte die Vor-2026-09-17-Architektur: er verlangte `EHScope`/`EHPageHero`/`EHPanel` in der Shell und verbot genau die Datei, auf der die Shell gebaut ist, und er verlangte Client-Supabase (`getSupabase`/`signInWithPassword`) im Formular — im Widerspruch zu T-0168 und zur in `NEXT_AGENT.md` als geschuetzt markierten `arena`-Edition. Der Vertrag beschreibt jetzt die geschuetzte Umsetzung und ist **strenger** als vorher: eine Shell, ein Formular, Server-Actions, keine fremde Klassenfamilie (strukturiert geprueft, nicht als Token-Suche), Demo-Backdoors fail-closed in beiden Handlern. `d4777e0`. **Kein Designautoritaetsfall.** |
> | `test:e2e` | **GRUEN** | Veraltet nach der Designsystem-Migration (`ef4c3e6`, 32 Seiten auf `packages/eh-design`) und den Auth-Route-Redirects (`74a3406`). Re-Basiert in `515d696`, `0ad0083`, `3558fdc`, `28c709f`, `941a7c4`. Jede Zusicherung wurde vorher gegen den Quellbaum geprueft und durch eine staerkere auf das aktuelle Verhalten ersetzt. Wichtigster Befund: `/app` und `/pro` rendern `WerkbankRahmen` -> `WerkbankShell`; die alten `<details class="mobile-menu">`-Drawer kommen in **keiner** Route mehr vor (`AppShell` und `OwnerMobileMenu` werden von nichts mehr gemountet). Die neue Zusicherung prueft den Sidebar-Trigger, die echten Navigationsziele im Sheet und das Schliessen nach Navigation — der alte Selektor mass nur die Abwesenheit einer toten Komponente. |
> | `test:e2e:architecture` | **GRUEN** | Re-Basiert in `941a7c4`: Registrierungs-CTA `Konto erstellen`, Admin-Partnerkarten als `<fieldset><legend>` statt `.admin-card`, und der zitierte Handoff-Absatz auf `/app/home/sale` existiert nicht mehr — ersetzt durch eine strengere Freigabe-Grenze (Maklerabgleich allein darf keine `Freigabe aktiv` erzeugen). |
> **Konsequenz fuer den naechsten Agenten:** Ein gruenes Release-Gate bedeutet NICHT, dass die Abnahme gruen ist. Vor jedem "fertig" die Suiten einzeln laufen lassen. Die Re-Basierung von `test:e2e`/`test:e2e:architecture` ist **T-0006** und war grosse, klar umrissene Arbeit (Selektoren + Texte nach der Designsystem-Migration). **Die beiden zuvor als Designautoritaetsfaelle markierten Punkte sind aufgeloest:** beide Zusicherungen kodierten eine Architektur, die durch eine spaetere, dokumentierte und geschuetzte Entscheidung ersetzt wurde (Auth-Edition `50f7162`, Server-Actions, T-0168). Massgeblich ist `DESIGN.md` und die dort geschuetzte Umsetzung, nicht ein Waechter, der sie nicht mitgezogen hat. Regel fuer die Zukunft: wenn ein Waechter und eine dokumentierte, geschuetzte Architekturentscheidung sich widersprechen, ist der Waechter zu aktualisieren — und die neue Zusicherung muss staerker sein als die alte, nicht schwaecher.
> **Toter Code (Befund, keine Aenderung):** `src/components/shell.tsx` (`AppShell`) und `src/components/owner-menu.tsx` (`OwnerMobileMenu`) werden von keiner Route mehr gemountet; die E2E-Suite hat sie bis `d4777e0` noch geprueft. Ebenso exportiert `packages/eh-design/src/workspace-owner.tsx` `EHOwnerComposer` ohne Aufrufer. Das ist versiegelter bzw. Design-Paket-Code und wurde **nicht** angetastet — als Aufraeumkandidat vermerkt, nicht im Rahmen von T-0006 geloescht.
> **ABNAHMESCHICHT IST GRUEN — am 2026-09-21 auf der OCI-VM gemessen (kanonischer Host), nachdem die veralteten Zusicherungen re-basiert wurden.** Belege: `test:public-site` EXIT=0, `test:public-nav` EXIT=0 (inkl. `wide-auth-layout`), `test:auth-design` EXIT=0, `test:e2e:architecture` EXIT=0, `test:e2e` EXIT=0 (vollstaendiger Produktdurchlauf, 15 Checks, `"ok": true`, `skippedViewTransitions: 3`). Release-Gate auf der VM: **16/16 PASS, EXIT=0**. Commits der Welle: `d4777e0`, `3558fdc`, `28c709f`, `941a7c4`, `5062ef5`, `73132f4`, `f65abcb`, `c1e018e`, `bd7a079`, `a04210f`, `fef608a`, `434480b`, `22d76df`, `3863bc8`, `d0e5b07`, `5132da6`, `2ca6a08`.
> **Gate-Befund behoben (`2ca6a08`):** `test:security` war auf dem Host rot, waehrend alle Abnahmesuiten gruen waren — die Sonde in `scripts/t0120-security-fuzz.mjs` leitete die erwartete Ablagewurzel selbst ab (`resolve(process.cwd(),'data','private')`) statt sie bei der Implementierung zu erfragen. `privateRoot()` gibt `PRIVATE_ROOT` Vorrang, und der ist auf der VM `/var/lib/einfach-hausen/private` (verifiziert). Kein Security-Befund: die harmlose Datei wurde korrekt innerhalb der echten Wurzel aufgeloest. Die Sonde nutzt jetzt `privateRoot()`; die Zusicherung bleibt gleich streng. Zusaetzlich meldete das Gate als Ursache die letzten 400 Zeichen des Ausgabestroms (Node schreibt Warnungen danach auf stderr) — `failureReason()` nennt jetzt die fehlschlagenden Zeilen.
> **OFFEN UND NICHT VON MIR — zwei Designbefunde, die eine Autoritaetsentscheidung brauchen.** Ich habe hier **nichts** committet und **nichts** geaendert; der Arbeitsbaum ist bewusst so belassen.
> 1. **Unversionierte, unabgestimmte Designarbeit im Arbeitsbaum (7 versiegelte Dateien + 5 neue Assets).** Geaendert: `packages/eh-design/src/tokens.json` (Version `1.0.0` -> `2.0.0`, neue Palette inkl. `rainbow`/`rainbowSoft`-Gradienten), `tokens.ts`, `tokens.css`, `html-style.mjs`, `src/components/marketing/{site-shell.tsx,tokens.css,mkt.module.css}` sowie `src/app/layout.tsx`. Neu: `packages/eh-design/assets/{satoshi,switzer}-variable.woff2`, `src/fonts/{Satoshi,Switzer}-Variable.woff2`, `src/fonts/FFL.txt`. Inhalt: die **oeffentliche Website wechselt von der festgelegten selbst gehosteten Inter auf Switzer + Satoshi** als eigene Stilfamilie. `design:check` meldet dafuer korrekt `Protected design file changed`. Das widerspricht der Designautoritaet („Keine eigene Farbpalette, Schrift ... lokale Stilfamilie"), ist aber **keine** Entscheidung, die ein Agent treffen darf: entweder wird die Arbeit verworfen, oder die Designautoritaet gibt sie frei und versiegelt neu. Bis dahin **nicht committen**.
> 2. **Die Versiegelung ist bereits bei HEAD stale — unabhaengig von Punkt 1.** Fuer `src/app/globals.css`, `src/app/design-system.css` und `src/components/marketing/home-hero.tsx` stimmt der Inhalt von **HEAD** nicht mit `design/design-lock.json` ueberein (die Sperrdatei selbst ist unversioniert unveraendert). Diese drei wurden also in einem frueheren Commit geaendert, ohne neu zu versiegeln. `npm run design:check` ist damit **schon vor** jeder neuen Arbeit rot (EXIT=1, 10 Meldungen).
> 3. **Warum das niemandem aufgefallen ist:** `scripts/release-gate.mjs` referenziert `design-lock` **nicht** und fuehrt `design:check` **nicht** aus. Das Gate ist 16/16 gruen, waehrend der Designwaechter rot ist. Das ist eine echte Luecke in der Abdeckung — **ich habe sie bewusst nicht selbst geschlossen**, weil ein Gate-Eintrag sofort rot waere und damit faktisch eine Neuversiegelung erzwingt. Das ist die Entscheidung der Designautoritaet, nicht meine.
> **DEPLOY 2026-09-21 LIVE (`1c275d6`, Prod-Head verifiziert):** Native Store-Vorbereitung, soweit ohne Betreiberentscheidung moeglich (Issue #12). **Neu:** `public/icons/app-store-1024.png` — 1024×1024, quadratisch, RGB ohne Alphakanal, live erreichbar (HTTP 200, `image/png`, 1024×1024 RGB). Erzeugt von `scripts/generate-store-icons.mjs` aus `public/brand/einfachhausen-app-icon.svg`; das Skript prueft Markenfarben und Hauszeichen-Pfad und bricht bei Aenderung der Quelle ab, damit keine zweite Bildmarke entsteht. Abweichungen nur plattformbedingt: 1024 statt 512, quadratisch (iOS maskiert selbst), ohne Alpha (App Store Connect lehnt Transparenz ab); Hauszeichen, Strichstaerke und Farben unveraendert. Regeneration byte-identisch (`sha256 e609bae…`). **Neu:** `docs/brand/appstore/STORE-METADATA.md` — Einreichungstexte fuer App Store und Play, Review-Hinweise, Screenshot-Liste an echte Routen gebunden, gegen die Zeichenlimits geprueft (Name 14/30, Untertitel 28/30, Werbebotschaft 141/170, Keywords 85/100, Play-Kurzbeschreibung 77/80). **Offene Betreiberfrage beantwortet:** IAP entfaellt fuer die Owner-App (kein Kauf-/Abo-Flow; Stripe nur fuer reale Dienstleistungen — Betriebsauszahlungen und Rechnungen —, die Apple 3.1.3(e)/3.1.5(a) sogar ausserhalb von IAP verlangt). Fuer eine spaetere **Betriebs-App** gilt das **nicht** (Tarife = digitale Gueter). Weitere verifizierte Review-Fakten: Konto-Loeschung in der App vorhanden (5.1.1(v)), kein Social-/Drittanbieter-Login (4.8 greift nicht), kein Tracking/Werbe-SDK (kein ATT, `NSPrivacyTracking` bleibt false). **Harter Blocker (Betreiberin):** Apple verlangt einen funktionierenden Review-Zugang; die Plattform hat bewusst keine festen Demo-Konten, und Zugangsdaten duerfen nicht erfunden werden. Verifikation: Release-Gate **16/16** lokal **und** auf der OCI-VM, Prod-Smoke **18/18**, `/api/health` `ready`, `NRestarts=0`, `design:check` unveraendert gegenueber HEAD (in separatem Worktree auf HEAD gegengeprueft, Exit 0), Icon ausserhalb des Design-Locks.
> **Bekannter Flake (nicht Produktfehler, bewusst nicht "repariert"):** Die Security-Kette des Release-Gates meldete in einem von zwei Laeufen `FAILED`, obwohl alle vier Teilskripte einzeln mit Exit 0 gruen liefen (`security-regression.mjs` 133/0, `t0003`, `t0120` 6/0, `demo-binding-regression` GREEN) und der unmittelbare zweite Gate-Lauf 16/16 ergab. Ursache ist der lastabhaengige Test „parallel first-boot workers all succeed" in `scripts/security-regression.mjs`: sechs Worker bootstrappen gleichzeitig eine frische DB. Die Anwendung ist dagegen bereits abgesichert (`busy_timeout = 5000`, WAL, `execWithRetry` mit 10 begrenzten Versuchen in `src/lib/db.ts`) — `db.ts` ist sicherheitsrelevant und wurde deshalb **nicht** angetastet. Bei einem roten Security-Gate also zuerst die vier Teilskripte einzeln laufen lassen, bevor ein echter Fehler angenommen wird.
> **DEPLOY 2026-09-21 LIVE (`4181071`, Prod-Head verifiziert):** Backup-Retention gegen unbegrenztes Wachstum. **Befund:** `/var/backups/einfach-hausen` hielt **81 Backups / 13 GB** ohne Konsolidierung — es fehlte keine Rotation, sondern `deploy/backup-to-supabase.sh` raeumte selbst mit `find -mtime +7` auf: eine reine Altersgrenze ohne Zusammenfassung, also ein vollstaendiger Satz pro Deploy **plus** der Nacht-Satz, rund acht Tage lang (`-mtime +7` greift real erst ab Alter 8, der Alterstag wird abgerundet). Bei ~1,4 GB/Tag und 27 GB freiem Speicher waere die VM in ~18 Tagen vollgelaufen — ein Produktionsausfall durch reines Backup-Wachstum. **Behoben:** `scripts/prune-einfach-hausen-backups.sh` mit GFS-lite-Aufbewahrung (neuester immer; alles juenger als 48 h; neuester je UTC-Tag fuer 14 Tage; neuester je ISO-Woche fuer 8 Wochen), aufgerufen am Ende von `scripts/backup-einfach-hausen.sh` — damit greift es im Deploy-Pfad **und** im Nacht-Pfad. Die widersprechende Ad-hoc-Regel in `backup-to-supabase.sh` ist entfernt: sie haette genau die Tages-/Wochenstaende geloescht, die die Konsolidierung bewahren soll. **Ergebnis auf der Produktion (Betreiber-Go):** 81 → 37 Artefakte, 13 GB → 5,1 GB, **freier Speicher 27 GB → 34 GB** (`free_disk_percent` 13 → 18); die letzten 48 h sind vollstaendig erhalten, aeltere Tage als Tagesstand, Legacy-`.db`-Dateien und Fremdeintraege bewusst unberuehrt. Neuester Backup geprueft: `PRAGMA integrity_check` ok, Manifest-`sha256` vorhanden, 11 Nutzer / 6 Auftraege. **Off-Host-Sicherung intakt:** Bucket `einfach-hausen-backups` mit 32 Objekten, neuestes vom Nacht-Lauf `20260920T033122Z` (03:31 UTC). **Nachweis:** `scripts/backup-retention-regression.mjs` (17 Checks, inkl. Waechter gegen eine zweite Aufraeumregel und Verweigerung gemeinsamer Pfade) als neues Gate in Layer 1; Release-Gate **16/16** lokal und auf der OCI-VM; Prod-Smoke **18/18**; `/api/health` `ready`. **Nebenbefund behoben:** `npm ci` brach beim ersten Deploy-Versuch mit `EEXIST`/„corrupted tarball" ab — der npm-Cache auf der VM war beschaedigt; `npm cache clean --force` behoben, danach Deploy gruen. Der Dienst lief waehrend des Fehlversuchs ununterbrochen weiter (kein Restart vor dem Gate).
> **DEPLOY 2026-09-21 LIVE (`c8e974f`, Prod-Head verifiziert):** Dokumenten-Ablage aufgeraeumt. `/app/documents` zeigt Rechnungen, Nachweise und Belege jetzt in **einem** Ordner "Ablage · n" mit Ansichtswechsel **Liste/Karten/Chronik** (vorhandener `EHRecordViews` mit `storageKey="dokumente"`, kein neuer Baustein); der Ordner ist die fuehrende Angabe jeder Zeile und bestimmt das Symbol. Die drei getrennten Sektionen (Rechnungen / Angebote & Nachweise / Zahlungsbelege) entfallen. **Echter Fehler behoben:** `storedSizes()` rief `readdirSync` auf den **Dateipfad** auf (`resolvePrivatePath` liefert eine Datei, kein Verzeichnis); der Wurf landete in einem leeren `catch`, sodass jede vorhandene Datei still als **0 Byte** gezaehlt wurde — inklusive der Gesamtgroesse in der Seitenleiste. Jetzt `statSync` pro Dokument wie in `documentFacts` (`src/app/app/page.tsx`). Verifikation: Release-Gate **15/15** lokal **und** auf der OCI-VM, tsc 0, eslint 0, Laufzeit-Render gegen Wegwerf-DB (4096-Byte-Datei -> "4 KB", fehlende Datei -> "0 B"), Prod-Smoke **18/18**, `/api/health` `ready` (database ready, auth_authority reachable, smtp `sandbox_sender`), `/app/documents` -> 307 Login-Redirect. **Offen fuer die Designautoritaet:** ein kanonischer **Ordnerbaustein** fehlt im versiegelten `packages/eh-design`; bis dahin ist der Ordner als fuehrende `detail`-Angabe umgesetzt (Antrag **DA-2026-09-21-03** in `docs/brand/design-authority-requests.md`). Kein Design-Re-Seal ohne ausdrueckliche Designautoritaet. **Notion-Sync nicht ausgefuehrt:** die SIN-Notion-Integration ist in dieser Session nicht verbunden (nur die Host-Werkzeuge sind erreichbar), und diese Welle stammt aus einer Betreiber-Anweisung, nicht aus einem GitHub-Issue — es gibt daher kein Issue, in dem ein Retry-Vermerk hinterlassen werden koennte. Naechster Agent mit Notion-Zugang: falls ein Notion-Task zur Dokumentenablage existiert, auf `Erledigt` setzen und `c8e974f` als Nachweis eintragen.
> **UMGEBUNGSHINWEIS (lokal, Mac):** `~/.zshenv` setzt `PATH` hart neu und loescht damit den `node_modules/.bin`-Vorsatz von npm. `npm run <script>` scheitert dadurch mit `zsh:1: command not found: next|eslint`. Workaround ohne dauerhafte Konfigurationsaenderung: `npm_config_script_shell=/bin/sh npm run <script>` (bzw. direkt `./node_modules/.bin/<bin>`). Zusaetzlich braucht das Release-Gate lokal `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/Users/jeremyschulze/Library/Caches/ms-playwright/chromium-1187/chrome-mac/Chromium.app/Contents/MacOS/Chromium`.
> **DEPLOY 2026-09-21 LIVE (Prod-Head verifiziert, aktueller Commit unten):** Vier Wellen abgeschlossen. **#127–#130 (Affiliate/Vergleiche)** als `45a6af3`. **#132 (Eigentuemer dauerhaft kostenlos)** als `5289d1e`. **Privacy/Docs/Lint-Welle** als `69c21aa`: `docs/privacy/DEVICE_STORAGE_INVENTORY.md` neu (vier Cookies, drei localStorage-Schluessel, Service-Worker-Cache, keine Drittanbieter-Skripte — dreifach belegt ueber Quelltext, CSP und gebauten Bundle), `src/app/datenschutz/page.tsx` auf diese Inventur korrigiert (drei Falschaussagen behoben), README und `docs/PRODUCT_VISION.md` von falschen Store-/Push-/Capacitor-Aussagen befreit, Lint von 28 Warnungen auf **0**. **E-Mail-Welle** als `957eb28`: transaktionale E-Mail fuer Angebote und neue Anfragen aktiviert, aber **fail-closed** — `mailDeliverability()` erkennt die Resend-Sandbox-Absenderdomain und reiht dann keine Mail ein; `/api/health` meldet ehrlich `smtp: sandbox_sender`. Produktionsbeleg: `{smtp:sandbox_sender,smtp_reason:sandbox-sender-domain}`. **Native-Vorbereitung**: `capacitor.config.ts` auf Remote-URL-Wrapper korrigiert (vom Capacitor-CLI selbst geparst), `capacitor-www/index.html` als Fallback, `docs/brand/appstore/STORE-READINESS.md` neu. Verifikation: Release-Gate 15/15 lokal **und** auf der OCI-VM, `test:notifications` 37/37, `test:visual` 72/72, lint 0 Probleme. Produktion: Backup-`sha256` stimmt exakt mit `manifest.json`, `PRAGMA integrity_check` ok, Restore-Dry-run liest 11 Nutzer / 6 Auftraege / 1 Subscription; `einfachhausen.de` 200 auf `/`, `/api/health`, `/login`, `/preise`, `/datenschutz`.
> **NAECHSTE AKTION (genau eine):** Betreiber-Schritte aus **Punkt 9** in `docs/EXTERNAL-BLOCKERS.md` umsetzen (Resend-Domain verifizieren, SPF/DKIM setzen, `MAIL_FROM` umstellen). Danach versendet das System E-Mails **ohne Codeaenderung**; heute ist der Versand fail-closed und im Healthcheck sichtbar. Parallel zu beantworten: **Punkt 10** (Push bauen? — haengt direkt am Store-Risiko Guideline 4.2) sowie die Betreiber-Vorleistungen aus **Punkt 11** (Apple-Konto, Bundle-ID, **Review-Testzugang**, CocoaPods + JDK/SDK). **Punkt 13 (IAP) ist fuer die Owner-App erledigt** — kein IAP noetig, siehe `docs/brand/appstore/STORE-METADATA.md` Abschnitt 1. Offen: #91 (visuelle Abnahme Jeremy), #12, #11, #10; geschlossen: #33, #132, #127–#130. **Kein Design-Re-Seal ohne ausdrueckliche Designautoritaet** (`docs/brand/design-authority-requests.md`). **Betriebshinweis (erledigt 2026-09-21):** Der damals bei 14 stehende `free_disk_percent` war die Folge fehlender Backup-Konsolidierung; Retention ist seit `4181071` eingebaut, der Wert liegt nach dem Aufraeumen bei 17–18 (34 GB frei).
> **HISTORISCH — ueberholt, nicht mehr handlungsleitend:** Die folgende Zeile beschreibt den Stand *vor* der E-Mail-Welle. Sie ist hier nur als Verlauf erhalten; gueltig ist ausschliesslich die **NAECHSTE AKTION** in der Zeile darueber. (Damals war der E-Mail-Versand noch nicht aktiviert; inzwischen ist er aktiviert und **fail-closed**, siehe die E-Mail-Welle oben.)
> **NAECHSTE AKTION (Stand 2026-09-21, ueberholt):** Antwort auf **Punkt 9** in `docs/EXTERNAL-BLOCKERS.md` einholen (transaktionale E-Mail aktivieren?). Adapter, Vorlagen und Outbox stehen fertig; es fehlt nur der Aufruf `enqueueNotification({…, channel:'email'})` fuer Angebote (Eigentuemer) und neue Anfragen (Betrieb). Bewusst **nicht** stillschweigend aktiviert: SMTP ist in Produktion konfiguriert, ein Versand waere sofort real und nicht rueckholbar. Danach die Punkte 10–18 abarbeiten. Offen: #91 (visuelle Abnahme Jeremy), #12 (Punkte 10–15), #11 (Punkte 16–17), #10 (Notion-Retry); #33 und #132 und #127–#130 sind geschlossen. **Kein Design-Re-Seal ohne ausdrueckliche Designautoritaet** (`docs/brand/design-authority-requests.md`).
> **DEPLOY 2026-09-20 LIVE (3e8ecd9, Prod-Head verifiziert):** Welle ses_f40d79 vollstaendig (vorherige Session endete abgebrochen, Re-Integration lief hier zu Ende). Octopus-Merge von feat/ses-f40d79-dialog-block3 (@5e492f6, #126), feat/ses-f40d79-kontrast-deadcss (@929bc91, #124), feat/ses-f40d79-ia-navuser-sidebar-docs (@234aec3, #125). Inhalt: NavUser-Popover nur Identitaet+Einstellungen+Abmelden (keine Profil-Zeile), ein Label = ein Ziel (Profil -> /app/profile, Einstellungen -> /app/settings), Settings-Dialog 4 Sektionen (account|notifications|ai|app, "Konto & Daten"), SidebarGroupLabel Kontrast var(--eh-color-secondary, #4b5b60), DeadCSS: 479/479 Spec-Selektoren entfernt. Gates: tsc 0, lint 0 errors/28 warnings (vorbestehend), design:check 0, deadcss 0. Prod verifiziert: /srv/einfach-hausen main=3e8ecd9, Service aktiv 19:05:34 UTC, /api/health 200 ready (database ready, auth_authority reachable, smtp configured), /login 200, /app -> 307 Login-Redirect. Cleanup: Worktrees eh-d/eh-ia/eh-k entfernt, 3 Feature-Branches lokal+remote geloescht, Issues #124/#125/#126 closed. Aufruf: naechste priorisierte Aufgabe aus .sin-gpt-web/taskplan.sqlite3.
> **DEPLOY 2026-09-20 LIVE (0d68a74, Prod-Head verifiziert):** Settings-Dialog-Nav = Sidebar-Konto (ba92391, Dialog 1024px), Shell-Residuals 44px (41e74e0), Sidebar-Grau+Zuklapp-Fix (0d68a74, data-active-Präsenzbug + Collapsible-key). Gate 15/15, Health ok/ready. Perf-Messung: KEINE Full-Reloads (7 Routen client-side), Public-TTFB ~0.1s, Gateway ~0.1s; langsam fühlt sich der Shell-Neuaufbau + Skeleton pro Nav an (Shell liegt in Pages statt Layout) + Auth-Retry-Bursts möglich. Offen: DeadCSS-234 (versiegelt → Spec /tmp/deadcss-authority-spec.md), Kontrast :404 (Dossier /tmp/kontrast-404-authority-request.md), Shell-ins-Layout-Welle.

> **DEPLOY 2026-09-20 LIVE (7a3788e, Prod-Head verifiziert):** Kein Altstand mehr — Produktion läuft `7a3788e` (Gate 15/15, Health ok/ready, /login 200, /app → Login-Redirect). Enthalten: P0-Demo-fail-closed (88431f0), Shell-44px (bb678ce), turbopackIgnore-Buildfix (1f95f7c), 30 OCI-Baselines (7a3788e). Gate unterwegs repariert: `.next`-Stale + fs.realpath-Turbopack + Login/Welcome-Baselines (Demo-Box raus, Shot-Beleg). Offen: DeadCSS-234, Shell-Residuals (sm/badge/collapsed), Kontrast :404 (Designsperre).

> **VISUELLE ABNAHME SIDEBAR-07 ABGESCHLOSSEN 2026-09-19 (25cd0e7, main):** 28 Routen ausgemessen (5 Subagents + eigene Nachmessung): Layout sauber und produktionsreif — Sidebar 255/256px konstant, kein Rail-Ueberlapp, kein Ueberlauf Desktop+Mobile, kein abgeschnittener Text, Aufklappen funktioniert. `use-mobile.ts` eslint-error repariert (useSyncExternalStore) — eslint jetzt 0 errors. **2 Restpunkte NUR DOKUMENTIERT (Handoff Kap. 19), nicht gebaut:** (1) Kontrast Gruppenlabels "Navigation"/"Konto" 3.63:1 vs WCAG AA 4.5:1 — `src/components/ui/sidebar.tsx:404` GESPERRT -> Designautoritaet; (2) Rail-Weissflaeche auf langen Seiten (/app/settings 43%, /pro/calendar -635px). Vollstaendige Doku: Handoff Kapitel 19. Befunddateien /tmp/visual-acceptance/FINAL-*.md.

> **FOLGE-COMMITS + DESIGN-HYGIENE 2026-09-19 (18c7323, main, gepusht):** Sidebar-07-Welle des Koordinators gemerged: `08d57ef` (P0-6/P2-25/P2-28: Pro-Start, Terminologie, Stepper), `34c7d4b` (globaler Einstellungs-Dialog + Rail-Overlap-Fix, Dialog oeffnet via `?einstellungen=<section>` oder CustomEvent `eh:open-settings`), `18c7323` (Dialog-Restyle, Operator-Go erteilt). Dieser Agent (Prime) hat dazu geliefert: `design-debt.json` sync (380 veraltete Punkte raus, ACHTUNG `src/components/ui/*`-Eintraege sind NICHT stale — `7d2b8b1` loeschte alt, `d8ebb11`/`34c7d4b` legten sie neu an), `design-lock.json` reseeealt (`homeowner.module.css`+`provider-workspace.module.css` seit `27f1c47` unversiegelt, rein deletiv, 0 Mismatches bei 53 Dateien), 22 Visual-Baselines nach nachgewiesenem Baseline-Drift erneuert (`test:visual` wieder 72/72). Gates: tsc 0, eslint 0 (bis auf bekannten `use-mobile.ts`-Error aus d8ebb11), api-contract 17/17, crm 20/20, security gruen, build gruen. Vollstaendige Doku: Handoff Kapitel 18.

> **AUDIT-ABSORPTION 2026-09-19 (74a3406, main, gepusht):** Alle P0/P1 aus `docs/REPO_AUDIT_2026-09-18.md` sind erledigt. Letzte Welle: P1-8 (letzte 10 Owner-Seiten + 4 Provider-Seiten auf WerkbankRahmen, AppShell unter src/app zu 100% weg), P1-18 (`/onboarding/pro` Legacy-Wizard stillgelegt), P2-26 (`/welcome`+`/role` sind serverseitige Redirects, T-0168-konform), P0-7 (Bewertungs-Meldung kommt wieder auf der Partnerdetailseite an — vorher wurde die Erfolgsmeldung vom `/app/partners`-Redirect geschluckt), visueller Kontrast-Bug „Ansprechpartner finden" (fast schwarzer CTA durch Legacy-`.btn.primary` im Werkbank-Scope → versiegelter `EHButton`), Profilbalken-Regression (data-fill ohne CSS-Regel → immer 0 px). P2-22 (8 tote Dateien), P1-17 (310 tote CSS-Regeln), P2-24 (53 Icon-Exports), P1-19 (Schema-Baseline repariert: Fresh-DB == Dev-DB) ebenfalls erledigt. **P0-6/P2-25 KORRIGIERT (08d57ef):** Diese waren KEINE korrekten Verhaltensweisen, sondern echte Bugs — `/pro`-Start zeigte im Sperrzustand nur eine Hinweisbox auf weisser Flaeche (kein Kopf, keine Kennzahlen), und die Anfrage/Auftrag-Terminologie war inkonsistent. Beides in `08d57ef` behoben (Kopf+Kennzahlen+Rail, "Anfrage"->"Auftrag" konsolidiert). Vollstaendige Doku: Handoff Kap. 14/15/16.
> **SETTINGS-WELLE ERLEDIGT (34c7d4b + 18c7323, main, gepusht):** Globaler Einstellungs-Dialog mit Sidebar-Navi (`settings-dialog.tsx` / `settings-dialog-host.tsx` / `owner-settings-dialog.tsx` / neues `src/components/ui/dialog.tsx`). Der Dialog oeffnet sich als Overlay ueber der aktuellen Seite via `?einstellungen=<section>` URL-Param oder `openSettingsDialog(section)` (CustomEvent `eh:open-settings`) aus `nav-user.tsx`/`nav-projects.tsx`; `/app/settings` bleibt Fallback-Seite. Zusaetzlich Rail-Overlap-Fix (Rail ohne feste Gridspur blaehte auf 763px -> jetzt `main 1040 / rail 240`, Overlap 0). Operator-Go fuer `18c7323` (Dialog-Restyle) erteilt. Gates vom Koordinator: eslint 0, tsc 0. Details: Handoff Kapitel 18.

> **NEUE AUSGANGSLAGE 2026-09-19 — SIDEBAR-07 LIVE (d8ebb11, main):** Der Operator-Richtungswechsel steht: shadcn `sidebar-07` ist die HAUPTNAVIGATION (aufklappbare linke Seitenleiste), der Header ist auf Suche/Notifications/Tools reduziert. Shell-Sperre fuer alle ausser der Sidebar-Welle bleibt bis auf weiteres: `shell.module.css`, `nav-config.ts`, `werkbank-rahmen.tsx`, `owner-menu`, `bottom-nav`, `src/components/ui/*`, `app-sidebar.tsx` und `nav-*` — NUR nach ausdruecklichem Go des Koordinators. Verifiziert auf dem neuen Rahmen: 28 Owner- + Provider-Routen (25 direkt 200, `/app/onboarding`->`/app` und `/app/partners`->`/app/messages` sind gewollte Redirects).

> **OFFEN (alles nicht-blockierend):** P2-28 — **nur teilweise erledigt:** `08d57ef` hat den Onboarding-Stepper (`EHStepProgress`) gebracht, aber die 8 nativen `<input type="file">` ueber `EHInput` zeigen weiterhin rohen Browser-Text ("Choose File · No file chosen"); `EHFileInput` fehlt noch im **versiegelten** `packages/eh-design` → Designautoritaet. Spezifikation mit allen 8 Stellen: `/tmp/eh-coord/P2-28-ehfileinput-spec.md`. P2-23 — dead CSS in `globals.css`/`design-system.css` → versiegelt → Designautoritaet. `docs/preview-werkbank-2026-09-18.html` ist VOR dem Sidebar-Umbau bewusst nicht erneuert worden (sonst sofort veraltet).

> **REPO-AUDIT + WERKBANK-NORAIL 2026-09-18 (f62f50b, main):** Gesamtrecht: 4 parallele Tiefen-Reviews (Owner/Pro/Admin+Infra/Legacy) + 24-Shot Muse-Visitaudit. Ergebnis: Daten + Auth gesund (keine Mocks, requireUser/requireAdmin lückenlos). Die App ist kompositorisch gespalten. Fix live: WerkbankRahmen setzt `.wb-norail`, wenn kein rail-Prop — 8 Seiten verloren bisher eine leere 240-px-Spalte (live gemessen: /app/documents /app/settings /app/messages jetzt 212px 1324px). Vollständige P0/P1/P2-Liste: `docs/REPO_AUDIT_2026-09-18.md`. Beide Gates repariert und grün (09331ec, main, gepusht): test:api-contract 17/17, test:crm 20/20 — siehe Handoff Kap. 10. P0-2/P0-3/P0-4 erledigt (660012b): Sidebar filtert leere Gruppen, 7 Legacy-Routen sind serverseitige Redirects (T-0168 beseitigt), Guard-Phantome entfernt — ALLE P0 aus dem Audit erledigt. P1-1..P1-5, P1-12/13/15 erledigt (35d0e09): Storniert-Trennung, router.refresh statt reload, /app/more-Relikt weg. P2-22 erledigt (7d2b8b1): 29 ungenutzte Komponenten-Dateien entfernt, test:card-visuals zurückgezogen. Nächste Aktion: ungenutzte icons.tsx-Exporte (P2-24), dead CSS (P2-23) ist versiegelt → Designautorität, dann P1-8 Shell-Spaltung (/chat, /anfrage/*, /anfragen-pro, /ansprechpartner, /onboarding/pro/*) löschen — /chat verstößt gegen T-0168 (ungeprüftes Subject↔App-User-Mapping, Realtime ohne prüfbare RLS).

> **SOLL-WELLE 2026-09-18 LIVE (443500c, Prod-Health 200):** `#start` (`/app`), `#aufträge`+`#auftrag` (PR #123: `/app/jobs`, `/app/jobs/[id]`, `jobs-ansicht.tsx` — v0, geprüft: keine Sealed-Dateien, keine Mocks), `#dokumente` (`c292e95`: Rechnungen/Angebote/Belege gruppiert, Umschalter raus), `#kontakte` (`443500c`: Erreichbarkeit aus echten Rufnummern). Sealed-Fixes live: legend-in-Karte, Chronik-nowrap. PR #119 zu, Remote nur main, 0 offene PRs. Nächste Aktion: `#verträge`/`#termine`/`#profil` haben KEINE Soll-Bilder — nur nach `#start`-Muster bauen oder Jeremy definiert Soll. Details + Folge-Anweisung: Handoff Kap. 0/9.
>
> **SOLL-START 2026-09-18 LIVE (10b9093, Gate 15/15, Prod-Health 200):** `/app` steht auf der Soll-Komposition aus `docs/brand/app-ux-vorschlaege/index.html#start` (PR #122 gemergt: Vorgabe + `/app-ux-vorschlaege`-Route im Repo): Kopf mit +Anliegen-CTA, 4 Kennzahlen, Wartet/Hausakte-Sektionen, neue Nächste-Termine-Sektion (echte confirmed-Termine), Rail mit echter Profilvollständigkeit (68%-Mock + erfundene 4/6-3/5-2/4 ersatzlos raus). Versiegelte Sealed-Fixes live: FormSection-legend in der Karte, Chronik-Datum nowrap (c1ac66b, neu versiegelt). PR #119 geschlossen (leere Hülle, Inhalt in main). Remote nur noch main (15 alte Branches gelöscht, alle gemergt/belegt redundant). Nächste Aktion: `#aufträge`-Soll (`/app/jobs`) — Anweisung für den Folge-Agenten steht im Handoff Kap. 8.
>
> **LOGIN 2026-09-17 GESCHÜTZT (PR #120 gemergt, Fix live in Arbeit):** Neue Login-Seite = `src/components/auth-v2/` (`AuthShell`, `LoginForm`, `auth-shell.css`), Routen `/login` `/register` `/register-owner` `/register-pro` — NICHT umbauen, NICHT neu erfinden, KEINE eigene Checkbox-/Font-Familie (kanonisch: `EHCheckbox` aus `@/design-system`, Inter via `.arena-auth`). Alte Login-Seiten existieren nicht mehr (alle 4 Routen nutzen `AuthShell`, verifiziert 2026-09-17). Wer Auth anfasst: erst diese Zeile + `docs/HANDOFF-2026-09-17-werkbank-migration.md` Kap. 6 lesen, danach visuelle Abnahme durch Jeremy.
>
> **WERKBANK-MIGRATION 2026-09-17 LIVE (ef4c3e6, main gepusht):** 32 App-Seiten Alt-CSS→EH-Komponenten, shell-Topbar/Breakpoints, 7 CSS-Module gelöscht, Debt-sync rein deletiv. Gates: EH_DESIGN_CONSISTENT, tsc/eslint/build grün, GitNexus frisch indexiert. BEKANNT UNFERTIG: Werkbank-Komposition (vergleich.html-Soll) ist nicht gebaut — Screenshots belegen alte Struktur ohne Rahmen. Nächste Aktion: Komposition pilotiert ab `/app`, pro Gruppe visuelle Jeremy-Abnahme. Vollständige Übergabe: `docs/HANDOFF-2026-09-17-werkbank-migration.md`.

> **COUNTS+ICONS 2026-09-14 LIVE (136fbf1, PR #107):** Alle 17 Bereiche mit Lucide-Icon + echter Anzahl. Gate 15/15, Smoke 18/18. Branch geraeumt.

> **CMD-PALETTE 2026-09-14 LIVE (55a1861, PR #106):** Suche ist Command-Menue (Cmd+K/Cmd+S, Pfeile+Enter, Esc). Gate 15/15, Smoke 18/18. Branch geraeumt.

> **TAGESABSCHLUSS 2026-09-14 ALLES LIVE:** PRs #103/#104/#105 gemergt+deployed, GitHub nur main, 4 Hosts je 1 Worktree, Reste als archive-Tags, Tests 20/20. Offen: Gina-Abnahmen, Issues #10/#11/#12/#33, Runner.

> **DEPLOY 60951f4 2026-09-14 — LIVE (PRs #103 + #104):** Owner-Finish (badce26: Kalender-Kurztext, Dokumente-Titel + sent-only Offen-Summe) + Partner-Polish (3ca06b2: gruppierte Aufträge/Kalender + euroExact) nach main 60951f4 gemergt und per deploy/update-on-oci.sh auf OCI /srv/einfach-hausen deployed. Gates: GitNexus-Analyze 9183 Nodes, Impact UNKNOWN begründet (Routen-Seiten), Detect-Changes HIGH begründet, ESLint 0, TSC sauber, Build 0. Release-Gate 15/15 + Prod-Smoke 18/18 grün. Stolpersteine: orca-NoNewPrivs blockt sudo (Deploy per Tailscale-SSH), root-gehörende /tmp-Gate-DBs + node_modules (chown/rm als ubuntu). Remote nur main (Rest als archive/*-Tags), Worktrees/Branches auf allen 4 Hosts bereinigt. Offen: Gina-Visumabnahme (#91), Ansprechpartner-Pinned/Suche/Notfall bauen (Vorschläge /tmp/eh-pinned-emergency-proposal.md + /tmp/eh-command-block.tsx auf sin-vm2), Issues #10/#11/#12/#33, Runner-Infra.

> **OWNER-KOHÄRENZ 2026-09-13 — IMPLEMENTIERUNG LÄUFT (Branch fix/eh-owner-coherence-20260913, Basis 33bcf22):** Root-Blöcke + 10 Amendments exakt materialisiert (9 Dateien + owner-Styles/index-Export), 1-Zeichen-JSX-Fix Kalender mit Beleg, 30/30 neue Tests grün, tsc/eslint/build grün, E2E-Kopieerwartungen belegt angepasst, test:e2e läuft (OCI). Weder abgenommen noch deployed; kein Commit. Stand: docs/brand/owner-coherence/HANDOFF.md.

> **KI-HAUSMANAGER 2026-09-12 - ERLEDIGT (PR97 + deployed):** Eigene `/app/hausmanager` Seite (echte Threads/Aufgaben/Automationen, 3 Starter mit Free/Abo-Kennzeichnung), Widget retitelt Hausassistent→Hausmanager, Mehr-Link + Hausmeister-Link. Rebase auf main 53b725a (Konflikt index.ts: beide Exporte), 2 Fixes (Grid-Wrapper aus Designsystem statt globaler Klassen, Mehr-Gruppierung). Gates typecheck/lint/build grün, Release-Gate Prod 15/15, deployed main 2227015 (Health ready, Migration automation_prefs live belegt, Release-Gate 15/15). Live-Login-Test Demo-Kunde gruen (alle Marker, null Pageerrors, Prefs-Speichern `?prefs=saved`, Mehr-Link). Handoff `docs/brand/hausmanager/HANDOFF.md`. Pi-Session-Rest `eh-hausmanager-20260912` als Branch gesichert.

> **Owner-Visual-Repair 2026-09-11 - ERLEDIGT (Bildbeleg + deployed):** /app/jobs Riesenfoto (697x1219 live) auf 505x316 begrenzt (Raster + aspect + object-position, Lock neu versiegelt). Dashboard entsprach Referenz (kein Umbau). Alle 12 Owner-Routen + Suche/Filter/Detail belegt. Demo-Daten gesetzt (Termine/Nachrichten/Historie, nur Demo-IDs). Gates 15/15, deployed main 2f6cf7a (Backup T204615Z, Restart ohne sudo, Health ok/ready). Task EH-OWNER-APP-VISUAL-REPAIR done. Handoff docs/brand/owner-app/VISUAL-REPAIR-HANDOFF.md.

> **OWNER-AUFTRÄGE 2026-09-11 — REFERENZ FREIGEGEBEN:** `/app/jobs` wird auf demselben Branch wie das neue Owner-Dashboard exakt nach der freigegebenen professionellen Aufträge-Referenz umgesetzt. Die globale Owner-AppShell bleibt aus der vorherigen Freigabe bestehen. Hero, Objektadresse, vier DB-basierte Auftragskennzahlen, kompakte aktuelle Auftragsliste, echte Job-Medien und der abschließende Hausmeister-CTA bilden die neue kanonische Seitenkomposition. Keine Mock-Aufträge oder statischen Zahlen. Kein Merge/Deploy allein aufgrund technischer Gates.

> **OWNER-DASHBOARD 2026-09-11 — VISUELLES ZIEL FREIGEGEBEN:** Die Eigentümer-Startseite `/app` wird auf Branch `design/owner-dashboard-20260911` exakt nach dem vom Operator freigegebenen professionellen Dashboard-Mockup aufgebaut. Die Komposition ist jetzt Bestandteil von `DESIGN.md`; keine autonome Stilinterpretation. Bestehende Auth-, DB-, Hausmeister-, Upload-, Sprach-, Draft- und Server-Action-Logik bleibt erhalten. Die neue kanonische UI lebt in `packages/eh-design/src/workspace.tsx` + `styles.module.css`. Kein Merge/Deploy allein aufgrund grüner technischer Gates; reale Browseransicht 390/736/1536 und visueller Zielvergleich sind Pflicht.

> **LIVE-DEPLOY 2026-09-11 - Team-Review live:** PR90-Referenz + Launcher-Toolbar auf Operator-Anweisung deployed (main 9b7c9d7, Backup einfach-hausen-20260910T105531Z, Restart ohne sudo, Health ok/ready). Fremde Skill-Arbeit geprueft (GitNexus-Automatisierung, kein Human-WIP) und als chore/gitnexus committet; /srv-Divergenz damit aufgeloest. Release-Gate 15/15 am Prod-Stand. Prod-Spots: Public-Routen 200, Preise 19,90/39,90 live, Rollen kunde->/app + handwerker->/pro. Task EH-MATURE-REFERENCE done. Team schaut live mit.

> **Full-E2E GRUEN 2026-09-11:** test:e2e Exit 0 auf aktuellem Tree (integ/eh-e2e-20260911, main 7a9e242): alle Suites inkl. turnContact->clarify. Suite an akzeptierte Redesigns angepasst (Hausakte-Disclosures, Plans-Texte; keine Abschwaechung) + E2E_KEEP_TEMP-Env fuers Debugging. Task EH-E2E-CLARIFY-FLOW done. Naechste E2E-Grenze: keine bekannt.
> **PR90 Reifere Referenz 2026-09-11 - INTEGRIERT, FREIGABE AUSSTEHEND:** design/eh-mature-reference-20260911 (EH-MATURE-REFERENCE) nach main a5f7b39 gemergt, NICHT deployed (Prod laeuft weiter a8b3327). Lock-Integritaet verifiziert (5 Eintraege stimmen); Launcher-Toolbar aus fremder WIP uebernommen (nur assistant.tsx+styles.module.css neu versiegelt). Gates: tsc/eslint/design/build + release-gate 15/15. Fixture-Abnahme: /app/home 1 H1 + Toolbar statisch + Wartung abschliessbar + Validierung sichtbar; /hausakte 1 H1, overflow 0 (390/736/1536). Jerry: visuelle Freigabe anhand docs/brand/mature-reference/*.png + /tmp/eh-mat-*.png erbeten. Task EH-MATURE-REFERENCE in_progress; EH-ASSISTANT-OVERLAP-SYSTEM (systemische Ueberlappung) backlog.

> **Assistant-Launcher + E2E-Klaerung 2026-09-11 - Launcher-Fix deployed, E2E-Schritt offen:** Fixierter Launcher-Bubble verdeckte auf /app/onboarding die Ueberspringen-Buttons (E2E-Beleg). Fix: Launcher rendert nicht auf /app/onboarding (Consumer, sealed Core unberuehrt). tsc/eslint gruen, deployed Prod-SHA a8b3327 (Restart ohne sudo, Health ok/ready). Systemische Ueberlappung auf anderen /app/*-Seiten (per Screenshot auf /app/jobs/[id] belegt) braucht Design-Entscheidung - gemeldet, nicht still geaendert. Full-E2E scheitert weiter an Schritt 510 (turnContact->clarify ohne Redirect, kein Server-Fehler); Server-Action-Pfad per Fixture als gesund belegt; Task EH-E2E-CLARIFY-FLOW (backlog) mit Analyse + Instrumentierungs-Beleg angelegt. Tasks: EH-ASSISTANT-OVERLAP done.

> **AKTUELL 2026-09-11 – EH-MATURE-REFERENCE:** Zuerst `docs/brand/mature-reference/HANDOFF.md` lesen und die Referenzen /hausakte + /app/home auf `design/eh-mature-reference-20260911` visuell prüfen. Kein Produktionsdeploy und keine globale Designfreigabe behaupten. Nachstehende frühere Lieferungen sind historischer Kontext; deren Done-Status bleibt bestehen.

> **Discovery-Pages 2026-09-10 - ERLEDIGT (PR integriert + deployed):** /leistungen + /so-funktionierts (chatgpt-web-Lieferung EH-DISCOVERY-PAGES) nach main 3e3a798 gemergt, Prod live 20:50 UTC. Abnahme: 12 Leistungsrouten + 6 request-Prefills belegt, Anker gesetzt, SEO-JSON-LD erhalten, overflow 0. Public-Gates test:public-site + test:public-nav wieder gruen nach Vertragspflege (IntakeForm EHRequestForm, arena-Auth-Geometrie) - Pruefstaerke unveraendert. Task EH-DISCOVERY-PAGES done.

> **Follow-up-Welle 2 2026-09-10 - ERLEDIGT (PR85/86/88 + Billing-Fix):** Alle drei ChatGPT-Lieferungen integriert, abgenommen und deployed. Prod-SHA 93b104f (Merge der integ-Branches), docs HEAD dynamisch. /preise: DB-Preise euroExact (19,90/39,90 belegt), kanonisches Layout, /preise-Visual-Baseline erneuert, Steuerkennzeichnung bewusst NICHT ergaenzt (Geschaeftsentscheidung offen). /app/plans: Status aus gespeicherter Subscription, past_due+checkout=success keine falsche Erfolgsmeldung, Pilot 16,92/33,92 belegt, Free-Wechsel-Checkbox serverseitig geprueft. /hausakte: Nutzen-Einstieg live, overflow 0. Chat: /ki-chat leitet mit Entwurfs-Vorschlag nach /app/hausmeister, kein Auto-Send, Verwerfen erhaelt Entwurf. EH-BILLING-CANCEL-TRUTH (Issue #87) Backend-Fix umgesetzt: Free-Pfade (Homeowner+Partner) stufen bei fehlender Stripe-Bestaetigung NICHT lokal ab; Fixture belegt active|sub_FIXTURE bleibt erhalten; Stripe-Erfolgspfad ohne echtes Abo nicht live getestet (offen dokumentiert). Gates 15/15 (integ+prod). Backup einfach-hausen-20260910T190821Z, Restart 19:08 UTC ohne sudo, Health ok/ready.

> **Besucherführung 2026-09-10:** /leistungen und /so-funktionierts neu komponiert, Branch fix/eh-discovery-pages-20260910. Nächste Aktion dieser Lieferung: docs/brand/discovery-pages/HANDOFF.md abnehmen; Vollcode und Browsernachweise daneben. Keine laufenden Pricing-/Billing-/Chat-/Hausakte-Aufgaben als erledigt betrachten.

> **Pro-Profil Designsystem-Migration 2026-09-10 - ERLEDIGT (Operator-Befund):** /pro/profile Mein-Profil-Formular auf kanonische EH-Bausteine migriert (EHWorkflowForm/EHFormSection/EHFieldGrid/EHField/EHInput/EHTextarea/EHSelect/EHCheckbox/EHSubmitButton/EHFormFeedback/EHStatus), rohe Checkboxen/Inputs/Selects/Legacy-Klassen entfernt. FormData-Namen und Server-Action-Vertraege unveraendert. Ohne Provider-Kontext Zugangszustand statt leerer Seite. Fixture-Abnahme mit Save-round-trip + DB-Beleg; Gates 15/15; deployed main 1005fb5, Prod live 17:55 UTC. Shots docs/brand/pro-profile-ds/shots/. Task EH-PRO-PROFILE-DS done.

> **PR86 Folgeausbau Kontotarife:** Zuerst docs/brand/pricing-clarity/ACCOUNT-FOLLOWUP.md lesen. Konkrete nächste Aktion: kritischen Task EH-BILLING-CANCEL-TRUTH beheben und danach aktualisierten PR86-Head samt Kontoseite abnehmen. UI-Bestätigung ersetzt keine bestätigte Stripe-Kündigung.

> **Preise und Geschäftsmodell 2026-09-10:** Nutzer priorisiert ausdrücklich /preise. Nächste Aktion: docs/brand/pricing-clarity/HANDOFF.md am Branch fix/eh-pricing-clarity-20260910 abarbeiten; neue Preisoberfläche und Centkorrektur integrieren, Steuerkennzeichnung/Leistungsumfang vor Veröffentlichung klären. BUSINESS-MODEL.md trennt belegten Iststand von Empfehlungen. Keine automatischen Änderungen bestehender Abos. Chat-Folgekorrektur PR85 separat prüfen (docs/brand/chat-convergence/HANDOFF.md); Kalender PR84 ist unabhängig.

> **Hausakte-Nutzenseite 2026-09-10:** Expliziter Nutzerauftrag /hausakte. Branch fix/eh-hausakte-benefits-20260910; docs/brand/hausakte-benefits/HANDOFF.md mit vollständiger Quelle und Browsernachweisen. Nächste Aktion dieser Lieferung: lokale Inhalts-/Browserabnahme, danach Integration. Offene Preis-/Billing-Tasks und PR85/86 bleiben unabhängig bestehen.

> **Partner-Kalender-Follow-up 2026-09-10 - ERLEDIGT (lokal integriert, abgenommen, deployed):** PR #84 via integ/eh-followups-20260910 nach main 7582154 gemergt; Prod live seit 16:01 UTC (health ok/ready). Fixture-Abnahme: Zugangszustand statt leerer Seite, Hilfe-Link /pro/hilfe erreichbar, Termine mit Europe/Berlin (00:30 MEZ 16.01. / 10:45 MESZ 02.07., Tageswechsel korrekt), 390/736/1536 ohne Overflow (docs/brand/calendar-recovery/shots/). Mitglieds-Sicht (nur zugewiesene Termine) unveranderter BestandSQL, code-gepruft. Offen: Legacy /ki-chat (Foto-/Sprachbuttons ohne Handler, Auto-Prompt beim Mount) als eigener Folgebefund.

> **Konvergenz 2026-09-10 (OCI sin-supabase, local-agent):** 6 PRs (#78 ceo-fixes, #82 owner-sweep, #81 pro-sweep, #79 backend-sweep, #80 docs-refresh, #77 docs-appstore) via `integ/eh-sweep-converge-20260910` nach main **4fef0f4** gemergt und deployed. Prod-SHA 4fef0f4 (Restart 13:16 UTC ohne sudo), Health ok/ready lokal+public, Routen 200 (/ /login /notfall), Rollen kunde->/app + handwerker->/pro. Gates: tsc 0, eslint 0 errors, eh-design-check CONSISTENT, build ok, release-gate 15/15 (integ + prod), Browser-Spots Login/Owner-Logout/Hausmeister-Hints/Ad-Button/Pro-Team, Shots /tmp/eh-converge-*.png. Alle 6 PRs MERGED + kommentiert (superseded-Vermerk, Main-SHA). Taskplan: EH-FIX-01 + EH-SWEEP-OWNER/PRO/BACKEND/DOCS done (Events + Ledger + render + validate, integrity ok). ChatGPT-Review 13:15 UTC zu EH-SWEEP-OWNER (Jahresplan-Luecken, fix/eh-year-20260910) ist als Follow-up im Task beschrieben, nicht Teil dieser Konvergenz.
>
> **Naechste Aktion (genau eine):** Hoechste priorisierte eligible Aufgabe aus `.sin-gpt-web/taskplan.sqlite3` aufnehmen — aktuell **EH-APP-01** (backlog/high, iOS App Store; offene Entscheidungen Gina: Apple Developer/Bundle-ID, T-0206 B7 Notion-Login, IAP-vs-Stripe).

> **Jahresplan-Nachbesserung 2026-09-10 - ERLEDIGT (lokal integriert, abgenommen, deployed):** fix/eh-year-20260910 (PR #83) via integ-Branch nach main gemergt; Prod live seit 16:01 UTC. Abnahme mit Testdaten: Jahresfilter 2025/2026/2027 streng, erledigte Wartung in Historie per Faelligkeitsjahr, Abschluss-Action klickbar mit genau einer Wiederholung (+12 Monate), ?year=abc/99999 faellt aufs aktuelle Jahr, 390/736/1536 ohne Overflow (docs/brand/year-workflow/shots/). Gates 15/15 (integ + prod-stand; prod-gate benoetigt WEBHOOK_SECRET im Gate-Env, sonst skippt/failt der T-0120-Hook-Check - Produktion selbst laeuft bewusst ohne WEBHOOK_SECRET, Hooks antworten 503 fail-closed).

> **iOS App Store 2026-09-10:** Task **EH-APP-01** (Capacitor-Hülle + TestFlight-Pipeline,
> backlog/high, local-agent) angelegt. Docs-Branch `docs/eh-appstore-20260910`,
> Handoff: `docs/brand/appstore/HANDOFF.md`. Code-Track parallel auf
> `feat/eh-appstore-ios-20260910` (eigener Agent/Worktree, Taskplan für ihn read-only).
> Offene Entscheidungen: Apple Developer/Bundle-ID (Gina), T-0206 B7 Notion-Login, IAP-vs-Stripe.
> Folge-Build nur via GitHub-Transfergrenze (xcodebuild braucht macOS/Xcode).

> **Integration 2026-09-10 Finisher-2: main=a25ae3f deployed** - REVIEW-20260910 1-8 integriert, PR76-Launcher, Gates 15/15, Health ok/ready. Stash in /srv: superseded Auth-WIP, wiederherstellbar.  Naechste Aktion (genau eine): PR #76 als superseded schliessen und EH-BRAND-07/08 mit Evidence formal completen.

> **Audit 10.09: zuerst `docs/brand/assistant/REVIEW-20260910.md` lesen.** Zusätzliche belegte Auth-/Cookie-/Notfall-/KI-Settings-Befunde. Aufgaben EH-BRAND-07-WORKSPACE und EH-BRAND-08-ASSISTANT; laufende Produktions-WIP erhalten, keine Testlockerung.

> **Neuer Kunden-Chat-Einstieg 2026-09-10:** `docs/brand/assistant/HANDOFF.md` lesen. Isolierte Lieferung auf feat/eh-assistant-launcher-20260910, bestehendes /api/ki, keine Login-Reparatur oder Backendänderung. Fullcode/Screenshots daneben; Integration/Liveabnahme offen.

> **PR75 erweitert:** `docs/brand/team-workspace/HANDOFF.md` zuerst lesen. Zusätzlich Team-Arbeitsbereich und zwei kanonische Label-/Checkbox-Vererbungsfixes. Aktuellen gesamten PR-Head integrieren; frühere Aussage „keine Stiländerung“ gilt nur für die erste Hausakte-Lieferung. Kein paralleler Deploy.

> **Neue Frontend-Lieferung 2026-09-09:** `docs/brand/house-workspace/HANDOFF.md` enthält Hausakte/Hausgeschichte, vollständige Quellen und lokale Integrationsschritte. Produktionsblocker aus früheren Notizen sind seit direkter Prüfung 18:32 UTC überholt: e45812e, Health200/ready. Gesamtprodukt nicht vollständig abgenommen.

> **Abschlussintegration 2026-09-09:** docs/brand/workspace/FINAL-DOCUMENTS.md lesen. Dokumente verwenden EHDocumentFrame, EHLogo und euroExact; Centbeträge nicht runden. Produktivzustand/Authentifizierungsblocker separat prüfen.

> **Aktuelle Integration 2026-09-09:** docs/brand/workspace/DETAIL-INTEGRATION.md; Branch fix/eh-detail-integration-20260909. Lokaler Agent integriert in seine laufende Arbeit; kein paralleler Produktionsdeploy.

> **Aktuelle Nutzerkorrektur 2026-09-08:** App-Komposition gestalterisch nicht bestanden. Aktiver Übernahmeauftrag: docs/brand/workspace/NEXT_AGENT.md. Ältere Vollständigkeitsangaben unten sind keine aktuelle Design-Abnahme.

> **Designkorrektur 2026-09-07:** Vor jeder Seitenmigration `docs/brand/system/COMPOSITION.md` lesen und `packages/eh-design/src/composition.tsx` verwenden. Vollständiger Code: `docs/brand/composition-repair/SOURCE.md`. Keine Produktillustration in einen Text-Slot stecken; Abschnittsüberschrift genau einmal; echte App-Bedienung nicht durch Marketingbeispiele ersetzen. Technische Prüfungen ersetzen keine visuelle Begutachtung.

> **Stand 2026-09-07 (Welle 3 — TASKPLAN KONVERGIERT):** 130/130 Tasks done/abgeschlossen, 0 backlog, 0 in_progress, 0 blocked.
> - **EH-BRAND-05-CRM:** PR #5 (einfach-hausen-crm) gemerged — native UI auf kanonischem Markenframe (Original-Logo/Inter/Atelier-02), npm check/test/cf:dry-run + Browser-Render verifiziert. Die ChatGPT-web-Vendor-WIP wurde vorher faithful committiert (91a6451).
> - **EH-BRAND-06:** completed — vollstaendige Regression auf OCI mit echtem Chromium 151: Release-Gate 15/15, Website-Visual 72/72, Hub 24 Shots, CRM 390/1440, A11y PASS, Responsive 390/640/1440 (640: kein user-sichtbarer Overflow, nur content-visibility-Quirk), Keyboard geprueft.
> - **Verbleibend (extern, EXTERNAL-BLOCKERS.md):** (1) GitHub-Actions-Billing auf Delqhi (Jerry) — CI laeuft seit 2026-09-06 nicht; (2) Production-Deploy der gemergten Welle (root: bash deploy/update-on-oci.sh in /srv); (3) T-0151-CI-Teil folgt aus (1).
> - **Naechste Aktion (genau eine):** Deploy ausfuehren (root), dann `gh run rerun` der offenen Checks nach Billing-Freigabe.

**Status 2026-09-03 ~15:21 UTC · main = e414cec (Produktion = 3fbe3c9, Deploy-Rückstand: T-0143-Export + DR-Runbook-Doku) · T-0120..T-0134, T-0137, T-0143 abgeschlossen**
> **Aktueller Designvertrag · 2026-09-06:** Jerry hat Atelier 02 ausdrücklich freigegeben. Verbindlich sind DESIGN.md, packages/eh-design und der Skill SIN-EH-design. Eigenständige Änderungen am Markenstil sind verboten. Vollständige Übergabe: docs/brand/system/HANDOFF.md; kompletter Quelltext: docs/brand/system/SOURCE.md. Frühere Statusangaben zu noch offenen Stilentscheidungen sind historisch. Restmigration: EH-BRAND-05-WEB, -APPS, -CRM, -HUB. Unternehmensidentität bleibt docs/COMPANY_IDENTITY.md (Gina Inhaberin/Geschäftsführerin, Jeremy Entwickler).


> **Docs-Strategie (Analyse in docs/DOCS_ANALYSIS.md):** Zwei getrennte Docs-Stränge — (1) Entwickler-Docs auf docs.einfachhausen.de (statisch aus docs/*.md, admin-gated), (2) User-Guides in den Apps (/app/hilfe + /pro/hilfe, EH-Komponenten, keine Tech-Docs). Phase 1: /app/hilfe + /pro/hilfe. Phase 2: docs-Route. Phase 3: Tooltips.
# NEXT AGENT — Handoff & Handback

> **Stand 2026-09-07 (Welle 2, nach Dispatcher-Fix + Browser-Durchbruch):**
> - **Produktions-Fix:** PR #55 (`75bca45`) repariert `einfach-hausen-dispatch.service` (Zustellung + Retention-Sweep standen seit 2026-09-06 19:47 UTC still). Timer seit 15:37 UTC grün.
> - **Neu abgeschlossen:** T-0133 (Produktmetriken & SLOs — PR #57, live 7/7 Probes ok, Business-Raten in Kestra-Zeitreihe), T-0139 (Feature-Flag Lifecycle Gate — PR #58, in Release-Gate Layer 1), T-0146 (Datenschutz-Dateninventar + Gate — PR #59), **EH-BRAND-05-HUB** (portalhub PR #1, inkl. echter 390/736/1440-Abnahme: 24 Shots, 3 Overflow-Bugs gefunden+behoben, `b779122`), EH-BRAND-05-WEB.
> - **Browser-Durchbruch:** Playwright-Chromium 151 läuft auf OCI (`playwright-core` install → ~/.cache). test:visual 72/72 PASS gegen Produktions-Build. Der frühere „kein Browser"-Blocker ist entfallen.
> - **Weiterhin extern blockiert:** GitHub-CI auf `Delqhi/einfach-hausen` (Actions-Billing, Issue #33 — nur Jerry), 05-CRM (ChatGPT web, Mac i9). T-0151 bleibt solange blockiert (CI-Teil; Runner+Baselines laufen lokal/Deploy im Release-Gate).
> - **Nächste Aktion (genau eine):** EH-BRAND-05-CRM, sobald ChatGPT web Zugang hat — oder auf Operator-Anweisung hin durch lokalen Agenten übernehmen (CRM-Worktree enthält unveröffentlichte Vendor-Sync-Änderungen von ChatGPT web; vorher abstimmen, nicht überschreiben).


**Stand:** 2026-09-05 (Abend)
**Kanonischer Abschlussstand:** Public Website Finish auf `main`; EH-01..EH-05 abgeschlossen. **Offen: Branch `feat/lexikon-enterprise-redesign` → PR → Merge nach Repo-Verifikation auf OCI-VM.**

## 0. Aktueller Kontinuationspunkt (zuerst lesen)

**Stand 2026-09-07 (Admin-Familie / 05-HUB Welle):**

- **EH-BRAND-05-HUB (portalphub):** Code-Migration abgeschlossen — PR https://github.com/einfachhausen-de/portalhub/pull/1 (CI grün). Siegel auf Edition-2-Vendor (`0efea86`) konsolidiert; `/brand`-Assets byte-identisch ausgeliefert. Offen: visuelle Abnahme 390/736/1440 (blockiert, kein funktionsfähiger Browser auf OCI — identisch zu `docs/brand/live-audit`).
- **Admin-Familie (dieses Repo):** Branch `design/eh-admin-family-20260907` → PR #53. Login via `EHAccessPage`, Ops/Admin/CRM-Köpfe via `EHAppHeader`, Status-Chips via `EHStatus`. Typecheck/Lint/Build/Design-Gate grün; E2E-Smoke gegen Prod-Build mit echter DB (Probezeile, entfernt). Gleiche Browser-Blockade für Screenshots.
- **Rest:** EH-BRAND-05-CRM (ChatGPT web, Mac i9-Zugang), EH-BRAND-06 Final-Gates (nach 05 komplett), Lexikon-Branch-Finish (unten).

Operator-Anforderung (2026-09-05): „Lexikon-Seite und Unterseiten wirken nicht enterprise/überzeugend; Pro-Designer-Modus, kräftiges Motion-Design, fehlende Seiten ergänzen, Docs + Handoff.“

Umgesetzt auf Branch **`feat/lexikon-enterprise-redesign`** (Details: `docs/LEXIKON.md`):

- `/lexikon` → Explorer-Archetyp: Hero mit Wort-Stagger + Parallax-Kartenstapel, Suche (`/`-Shortcut, Synonyme), Sticky-Register (7 Bereiche + A–Z), Layout-animiertes Raster, Bereichs-Bento, „So nutzt du das Lexikon“.
- `/lexikon/[begriff]` → Entscheidungs-Archetyp: Lesefortschritt, Breadcrumb inkl. Kategorie, Relevanz-Badge, sticky „Auf einen Blick“-Panel (Kennzahlen + Gauges + Wann handeln), Scroll-Spy-TOC, nummerierte Blöcke, gescrubbte Ablauf-Timeline, abhakbare Prüfpunkte mit Anliegen-CTA, verwandte Begriffe, Vor/Zurück-Navigator.
- **Neue Seiten:** `/lexikon/kategorie/[kategorie]` (7 Stück) und `src/app/lexikon/not-found.tsx`.
- **Inhalt:** 4 → 18 Einträge, 7 Kategorien, neues Modell `src/lib/lexikon.ts` (Relevanz, Stufen, Kennzahlen, Synonyme, Verknüpfungen) mit Build-Zeit-Integritätsprüfung.
- Sitemap erweitert; JSON-LD `DefinedTermSet` / `DefinedTerm` / `ItemList` ergänzt.
- Design-System unangetastet: nur `--eh-*`-Tokens, CSS-Module, kein neuer Token-Satz, keine Gradients/Glas/Stripes. `motion/react` (bereits Dependency) ergänzt die GSAP-Schicht für Zustands-/Layout-Motion.

**Verifiziert (Sandbox/Klon):** `tsc` PASS, `eslint` PASS (inkl. `react-hooks/set-state-in-effect`), `next build` PASS (18 Begriffs- + 7 Kategorieseiten SSG), SSR-Smoke 200/404 inkl. Umlaut-Slug `lüftungsanlage`.

**Noch NICHT ausgeführt (fehlende Native-Deps in der Sandbox):** `npm run build` im Repo-Kontext, `test:public-site`, `test:visual`, `test:a11y`, `test:responsive`, `test:e2e`.

### Nächste Aktion (genau eine)

Auf OCI-VM: Branch auschecken → `npm ci && npm run lint && npm run build` → `npm run test:public-site && npm run test:public-nav` → `npm run test:visual:update` (Lexikon-Baselines bewusst neu) → `npm run test:visual && npm run test:a11y && npm run test:responsive` → PR mergen. Bei einem Fehler: Evidenz in den PR schreiben, nicht neu designen.

Danach gilt wieder: keinen weiteren Website-Redesign-Track ohne reproduzierbaren Acceptance-Fehler oder explizite Operator-Anforderung starten.

## 1. Was ist fertig und frisch verifiziert? (Stand main, 2026-09-05)

- Public Website: bestehendes Design-System beibehalten, kein Rebranding.
- Desktop-Megamenü + mobile Leistungs-Disclosure mit allen 12 Leistungsbereichen.
- 12 Service-Detailrouten aus `service-catalog.tsx` + gemeinsamem `ServiceDetailPage`-Archetyp.
- Produkt-Erklärseiten: `/beratung`, `/notfall`, `/versicherung`, `/immobilienverkauf`.
- Discovery-Finish auf Startseite, Hilfe, Hausakte, Eigenheimbesitzer, So funktioniert's und Partner.
- Sitemap/Metadata/Structured Data für die neuen öffentlichen Flächen.
- `npm run build`: PASS, 115/115 statische Seiten (main). Mit Lexikon-Branch: +14 Begriffe, +7 Kategorien.
- `npm run test:public-site`: PASS (main).
- `npm run test:public-nav`: PASS (main).
- `npm run test:e2e`: PASS mit zero browser runtime errors (main).
- `npm run test:visual`: 72/72 PASS (main) — **Lexikon-Baselines werden durch den Branch absichtlich ungültig.**
- `npm run lint`: 0 Fehler (24 bestehende Warnungen).

## 2. Source of truth

- Unternehmensrollen: `docs/COMPANY_IDENTITY.md` — Gina Schulze ist Inhaberin/Geschäftsführerin; Jeremy Schulze ist ausschließlich Developer/technische Entwicklung.
- Design: `DESIGN.md` + `src/components/marketing/tokens.css`.
- **Lexikon:** `docs/LEXIKON.md` + `src/lib/lexikon.ts` (Inhalt) + `src/components/marketing/lexikon/` (UI).
- Website-Spec: `docs/superpowers/specs/2026-09-05-public-website-finish-design.md`.
- Implementierungsplan: `docs/superpowers/plans/2026-09-05-public-website-finish.md`.
- Service-Katalog: `src/components/marketing/service-catalog.tsx`.
- Kanonischer Taskstatus: `.sin-gpt-web/taskplan.sqlite3` / `.sin-gpt-web/TASKPLAN.md`.

## 3. Nächster Schritt

Siehe Abschnitt 0. Erst `sin-gpt-web-state --repo . next` prüfen; den Lexikon-Branch als kanonischen Task erfassen, falls noch nicht geschehen (Operator-Anforderung vom 2026-09-05). Produktion/Deploy nur nach `docs/PRODUCTION_HANDOVER.md` und frischer Live-Verifikation.

<!-- SIN-GPT-WEB-HANDOVER
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
<!-- SIN-GPT-WEB-HANDOVER
task: EH-06 (Lexikon Enterprise Redesign, Branch feat/lexikon-enterprise-redesign)
updated: 2026-09-05T18:00:00+00:00
actor: claude-sandbox-agent
evidence: docs/LEXIKON.md §6 · PR-Beschreibung · tsc/eslint/build PASS in Sandbox
-->

## EH-BRAND — Operator-Auftrag vom 06.09.2026

Zusätzlicher paralleler Operator-Auftrag: vollständige Markenbefunde und Delegation. Der bestehende Handoff oben bleibt als historische/andere Arbeitswelle erhalten; seinen Stand vor Wiederaufnahme live verifizieren. Für EH-BRAND ist die nächste Aktion exakt: Handoff lesen und die aktuelle Studie mit Prime Agent bai/glm-5.3-flash auf sinsupabase ausführen bzw. anhand des Worker-Reports fortsetzen. Keine abgeschlossenen Lexikon- oder Präsentationsaufgaben ungeprüft wiederholen.

- Spezifikation: `docs/superpowers/specs/2026-09-06-einfachhausen-brand-system-design.md`
- Ausführungsplan: `docs/superpowers/plans/2026-09-06-einfachhausen-brand-system.md`
- Handoff: `docs/brand/HANDOFF.md`
- Vollständiger Zielquelltext: `docs/brand/SOURCE_PACKET.md`
- Tasks: EH-BRAND-01 bis EH-BRAND-06; vorhandenes T-0151 und Issue #33 berücksichtigen.
- Ausführung: `/home/ubuntu/orca/workspaces/einfach-hausen-brand-system-20260906`, Branch `design/einfachhausen-brand-system-20260906`, Node 22.23.0.
- Stand 2026-09-06 (prime-agent, sinsupabase): EH-BRAND-01/02 done — verify pass 27/27, Commit 4a33e4cc, Draft-PR #40, Issue #39 kommentiert. Nächste Aktion: sichtbare Richtungsentscheidung an den drei Studien (EH-BRAND-03, Design-Lead/User), kein Merge/Deploy vorher. Operator 2026-09-06: bai-Pfad tot — dispatch_prime.py nie mehr nutzen, alles in der Operator-Session selbst ausführen.


## EH-BRAND — Korrektur: Atelier 02 (2026-09-06)

<!-- SIN-GPT-WEB-HANDOVER
task: T-0127
updated: 2026-09-03T00:51:39+00:00
actor: local-agent
evidence-sha256: 0640af1175d4cd871685513652419379eec835cf543aed5dfc69b0bfcadc4a29
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0128
updated: 2026-09-03T00:54:04+00:00
actor: local-agent
evidence-sha256: 52a6748748dfe2d958322ba6584bcd9e8cd8284ed731054bf7f3d48948bf4d4a
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0131
updated: 2026-09-03T12:19:04+00:00
actor: local-agent
evidence-sha256: 95b14cf53c5f2030d04c08f2b5dd9dfbb343623139fc5ce9e720d09533c6be38
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
Der Nutzer hat die drei Stilproben aus PR #40 ausdrücklich verworfen. Deren technische 27/27-Prüfung ist keine visuelle Freigabe. Root Codex gestaltet und implementiert die neue Richtung persönlich; keinen weiteren Prime/bai-Dispatch aus alten Abschnitten ableiten. Neuer Arbeitsstand: `design/einfachhausen-brand-atelier-20260906`, Workspace `/home/ubuntu/orca/workspaces/einfach-hausen-brand-atelier-20260906`. Konzept, vollständige Nutzerkorrektur und Plan: `docs/brand/ATELIER_02.md`; aktuelle Übergabe: `docs/brand/HANDOFF.md`; vollständige Quellen: `docs/brand/ATELIER_02_SOURCE.md`; bedienbare Vollansicht: `design/brand-atelier/preview.html`. EH-BRAND-03 bleibt in Arbeit, die neue Richtung wurde noch nicht vom Nutzer bewertet. Genau nächste Markenaktion: diese neue Vollansicht besprechen und tatsächliches Nutzerfeedback dokumentieren. EH-BRAND-04..06 folgen erst der Richtungsentscheidung; kein Merge/Deploy. Ältere Empfehlungen/Dispatch-Anweisungen sind für diese Markenwelle historisch. Andere laufende Arbeitswellen bleiben erhalten.
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
task: T-0115
updated: 2026-09-01T03:30:25+00:00
actor: local-agent
evidence-sha256: ef7edcae3cf6bd3ad470c34205fa815916c109e4709b0298ac4f0a4068e48968
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
task: T-0123
updated: 2026-09-03T00:23:19+00:00
actor: local-agent
evidence-sha256: d05fdcb413b5af3832a99bb11e2726eab2c7c3682e25b7c74203edb5e4bd3544
-->
<!-- SIN-GPT-WEB-HANDOVER
task: T-0124
updated: 2026-09-03T00:32:12+00:00
actor: local-agent
evidence-sha256: 7b56927949e37e438aa734d75f4b3eed9bd85a667118aa51838decfaccecfcb7
-->
<!-- SIN-GPT-WEB-HANDOVER
task: T-0125
updated: 2026-09-03T00:40:53+00:00
actor: local-agent
evidence-sha256: 24ead3c1a5c517e9724996338b7426ad3e8e2c18cd519e08d1f683f72f4d788b
-->
<!-- SIN-GPT-WEB-HANDOVER
task: T-0126
updated: 2026-09-03T00:45:23+00:00
actor: local-agent
evidence-sha256: 1acbbc8c9d9ec3b87035c8d0521fa2c3622fa697e6d719310f61795b15fda6e8
-->
<!-- SIN-GPT-WEB-HANDOVER
task: T-0135
updated: 2026-08-31T20:52:54+00:00
actor: local-agent
evidence-sha256: 8cc3663b0397c2fbcef390d333845930ad753ab448184830a67735e6b2b43ac0
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
task: T-0138
updated: 2026-09-01T13:24:20+00:00
actor: local-agent
evidence-sha256: 0ab111892a30d55ad46e7f6232b32f64656dee72cc4b9937613c3f2a3d9c925a
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
task: T-0142
updated: 2026-09-01T13:24:20+00:00
actor: local-agent
evidence-sha256: bceab63e963dd389c859027e3e4221a6a50386a99dfad656912ed9445f0038fe
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
task: T-0154
updated: 2026-09-01T00:56:58+00:00
actor: local-agent
evidence-sha256: 83e5ed487aff86dee8b825d9f06d859654d292349ec6538442ac1f725c3dbe1b
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
task: T-0157
updated: 2026-08-31T21:16:05+00:00
actor: local-agent
evidence-sha256: 7f99e3ef8bfd11d211e6dbda80fa766914a185971e4f6883515209aba957fb5f
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
task: T-0172
updated: 2026-09-09T01:36:03+00:00
actor: local-agent
evidence-sha256: daaa73300e8e73e245696aebf9a87df6fcda45e85b2000a58c1213f2145d5d71
-->
<!-- SIN-GPT-WEB-HANDOVER
task: T-0173
updated: 2026-08-31T20:53:06+00:00
actor: local-agent
evidence-sha256: 3b42e8e7560437f09e36c1c1afc42223cc10fc5140880d68b9edab0e386d9c4d
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
task: T-0004
updated: 2026-08-29T05:56:51+00:00
actor: local-agent
evidence-sha256: 4aaa04f685e833bd81528668f15ce9ca3bd1e3e37227af5d8e2fb1df720a513a
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0005
updated: 2026-08-29T08:50:05+00:00
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
task: T-0007
updated: 2026-08-29T20:22:56+00:00
actor: local-agent
evidence-sha256: 9fced8fc1fea3a24766fb348dd92b1dafe1ce6cbdbc5e0178ebdaade6dd01a05
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0205
updated: 2026-08-30T12:37:24+00:00
actor: local-agent
evidence-sha256: f1288185ef3bec19c87d3ccaf8e935f8a33480e8db7f734bae58d6874f3a4d43
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


## Live-Deploy 2026-09-11

Operator-Freigabe zum Merge und Produktionsdeploy wurde erteilt.

Release:
- App-Release-SHA: `05675c6f7cd3f74089c2173d2b7234534737f84f`
- Branch `design/owner-dashboard-20260911` fast-forward nach `main`
- Produktion auf `/srv/einfach-hausen` auf denselben App-Release-Stand aktualisiert
- Pre-Deploy-Backup: `/var/backups/einfach-hausen/einfach-hausen-20260911T165236Z`
- Production Node: `v22.23.0`
- Release-Gate: `15/15 PASS`
- Production-Smoke: `18/18 PASS`
- SQLite `PRAGMA integrity_check`: `ok`
- lokaler und öffentlicher `/api/health`: `ok=true`, `database=ready`
- `/app` und `/app/jobs` erzwingen unauthentifiziert weiterhin Login-Redirect
- `www.einfachhausen.de` endet korrekt auf dem Apex
- Service nach neuem Build kontrolliert neu gestartet; neuer MainPID bestätigt

Hinweis zum Deploy-Gate:
Der Security-Fuzz benötigt `WEBHOOK_SECRET` als temporären Gate-Fixture-Wert, obwohl die Produktion bewusst ohne diesen Legacy-Secret fail-closed läuft. Der erste Beobachtungslauf war deshalb 14/15; der maßgebliche Lauf mit ausschließlich prozesslokalem Fixture-Secret war 15/15. Die Produktions-Environment wurde dafür nicht verändert.

> **EH-OWNER-COHERENCE 2026-09-13 doc-finalized (no deploy):** AMEND02 root approval reconciled — six `.scope :global` fixes + one sidebar `box-shadow:none` line are approved design corrections (sidebar: no lock entry changed, per conditions); AMEND03 append applied once. Final gates green (tsc 0 / eslint 0 errors / owner 30/30 / webpack 0 / e2e ok 15/15 / design-check CONSISTENT, logs /tmp/eh-final-*). Code implemented, root image direction accepted, independent release-acceptor PENDING, deploy PENDING. Taskplan absent + @example.test cleanup-500 limits preserved. Next: acceptor verdict, then ROOT-only release commands (/tmp/eh-coherence-release-commands.md).

## App-IA: Ein Thema, ein Owner (2026-09-21)
Jedes Thema hat genau eine Owner-Flaeche (einzige Stelle mit Inhalt/Logik). Alle anderen Flaechen sind reine Einstiegspunkte mit identischem Label und identischem Ziel.
| Thema | Owner | Einstiege (Deep-Links) |
|---|---|---|
| Identitaet & Session | Popover unten links (nav-user.tsx) | – |
| Profil | Route /app/profile (Sidebar "Konto") | – |
| Inbox + Badge | Route /notifications | Glocke Header, Sidebar "Konto" |
| Mitgliedschaft & Pakete | Route /app/plans (Sidebar "Konto") | – |
| Hilfe & Kontakt | Route /app/hilfe (Sidebar "Konto") | – |
| Einstellungen (Konto & Daten, Benachrichtigungen, KI, App/Offline) | Einstellungs-Dialog | Sidebar "Einstellungen" (/app/settings), Popover "Einstellungen", ?einstellungen=<section> |
Regeln: Dialog enthaelt keine Link-Hubs zu Routen. Sidebar enthaelt keine Einstellungen-Inhalte. Badge nur an Glocke + Sidebar-Eintrag "Benachrichtigungen". Neues Thema: erst Owner bestimmen, dann Einstiege – nie Inhalt duplizieren.
