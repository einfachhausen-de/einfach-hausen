# Native Store-Verteilung — Vorbereitung und Betreiber-Schritte

Stand: 2026-09-21 · `main` = `957eb28` · Betreiberentscheidung: native Verteilung wird
angegangen (vorher: PWA-only).

Diese Datei ersetzt die Annahme des früheren Handoffs `HANDOFF.md` (EH-APP-01), ein
statischer Export sei der Weg zur iOS-Hülle. **Das ist technisch nicht möglich**, siehe
Abschnitt 2. Alles hier als „verifiziert“ Bezeichnete wurde am 2026-09-21 auf dem
Entwicklungsrechner bzw. gegen `main` geprüft, nicht angenommen.

## 1. Verifizierter Ausgangsstand

| Punkt | Stand |
|---|---|
| `capacitor.config.ts` | `appId de.einfachhausen.app`, `appName Einfach Hausen`, `webDir capacitor-www`, `server.url https://einfachhausen.de` |
| Capacitor-Pakete | `@capacitor/cli` 8.5.2, `@capacitor/core`, `@capacitor/keyboard`, `@capacitor/status-bar` |
| `@capacitor/ios`, `@capacitor/android` | **nicht installiert** |
| `ios/`, `android/` | **nicht vorhanden** (kein `cap add` gelaufen) |
| Natives Verhalten im Web-Code | `src/components/NativeInit.tsx` setzt Statusleiste und Tastatur — nur nativ, auf Web wirkungslos |
| Icons | `public/icons/`: `icon-192`, `icon-512`, `icon-maskable-512`, `apple-touch-icon`, `favicon-32`, **`app-store-1024`** (ergänzt 2026-09-21, siehe Abschnitt 7) |
| Splash Screens | **nicht vorhanden** |
| Datenschutzdeklarationen | vorbereitet (siehe Abschnitt 5) |
| Store-Metadaten | **Entwurf fertig** — `docs/brand/appstore/STORE-METADATA.md` |

Der Wert `webDir: "out"` im alten Stand war irreführend: `out/` entsteht nie, weil kein
statischer Export konfiguriert ist. `webDir` zeigt jetzt auf `capacitor-www/`, das
tatsächlich existiert und eine reine Offline-Fallback-Seite ohne Skripte, Cookies und
externe Ressourcen enthält.

**Verifikation:** Der Capacitor-CLI hat die neue Konfiguration selbst geparst
(`npx cap config` in einem Scratch-Verzeichnis) und meldet `appId`, `appName`,
`webDir`, `server.url` und `allowNavigation` genau wie oben.

## 2. Architekturentscheidung: Remote-URL-Wrapper (nicht statischer Export)

Ein statischer Export (`output: 'export'`) ist für diese Anwendung ausgeschlossen.
Belegte Gründe gegen `main`:

- **27 Route-Handler** unter `src/app/api/**` (u. a. `/api/health`,
  `/api/affiliate/[category]`, `/api/stripe/webhook`, `/api/telemetry`, `/api/errors`)
  existieren im statischen Export nicht.
- **Server Actions** (`'use server'` in `src/app/actions.ts`) werden von `output: export`
  nicht unterstützt.
- **Serverseitige Autorisierung über Sitzungs-Cookies** (`cookies()` in `src/lib/auth.ts`,
  `src/lib/admin-auth.ts`): die Sicherheitsgrenze liegt bewusst serverseitig, ein
  statischer Export hätte sie nicht.
- **27 dynamische Routen** (`src/app/**/[param]`).
- Serverseitige SQLite-Zugriffe direkt aus Server Components.

Die native Hülle lädt deshalb die Produktions-Web-App über `server.url`. Das ist die
einzige Variante, die ohne Umbau der Produktarchitektur funktioniert. Der Preis ist
Abschnitt 3.

## 3. Ehrliches Risiko: App Store Review Guideline 4.2

**Das ist der wichtigste Punkt dieser Datei.** Apple lehnt Apps ab, die im Wesentlichen
eine Website in einer Hülle sind (Guideline 4.2 „Minimum Functionality“). Ein reiner
Remote-URL-Wrapper ist genau das. Statusleiste und Tastaturstil (heute das einzige native
Verhalten) genügen dafür üblicherweise **nicht**.

Was das real bedeutet:

- Eine Einreichung in dieser Form hat ein **erhebliches Ablehnungsrisiko**. Ich sage das
  vorab, statt eine Einreichung zu bauen, die scheitert.
- Übliche Wege zu ausreichender Funktionalität: echte Push-Benachrichtigungen, Kamera-
  oder Dateizugriff für Belege und Fotos, Offline-Nutzung, Teilen, Biometrie, Widgets.
  Die meisten davon sind heute **nicht** gebaut.
- **Push ist der naheliegendste und wirksamste Hebel** — und Push ist heute bewusst nicht
  angeboten (Punkt 10 in `docs/EXTERNAL-BLOCKERS.md`). Die Fragen „Push bauen?“ und
  „native Stores?“ hängen damit zusammen: ohne zusätzliche native Funktionen ist der
  Store-Weg riskant.

**Empfehlung:** zuerst Punkt 10 entscheiden (Push), dann einreichen. Google Play bewertet
Wrapper milder, ist aber auch nicht risikofrei.

## 4. Toolchain: was hier fehlt

Geprüft am 2026-09-21 auf dem Entwicklungsrechner:

| Werkzeug | Ergebnis | Konsequenz |
|---|---|---|
| Xcode | **26.5** vorhanden | iOS-Grundlage da |
| iOS-Simulator | Runtime **iOS 18.3** vorhanden | iOS kann lokal getestet werden |
| CocoaPods (`pod`) | **fehlt** | `cap add ios` bzw. `cap sync ios` kann scheitern |
| Java (`java`) | **fehlt** | **Android-Build unmöglich** |
| Android SDK (`ANDROID_HOME`) | **nicht gesetzt** | **Android-Build unmöglich** |

Ich habe deshalb **kein** `cap add ios`/`cap add android` ausgeführt und **kein**
generiertes `ios/`- oder `android/`-Projekt committet: ein halb erzeugtes, nicht baubares
natives Projekt im Repository wäre schlechter als keines. Die Plattformen werden dort
erzeugt, wo die Toolchain vollständig ist.

## 5. Datenschutzdeklarationen (vorbereitet)

Abgeleitet aus der verifizierten Gerätespeicher-Inventur
`docs/privacy/DEVICE_STORAGE_INVENTORY.md`. Die App erhebt **keine** Tracking-Daten und
lädt **keine** Drittanbieter-Skripte.

### iOS `PrivacyInfo.xcprivacy` (Entwurf)

Einzutragen in `ios/App/App/PrivacyInfo.xcprivacy`, sobald das Projekt existiert:

- `NSPrivacyTracking`: **false** — kein Tracking, kein ATT-Dialog nötig.
- `NSPrivacyTrackingDomains`: **leer**.
- `NSPrivacyCollectedDataTypes`: nur die tatsächlich verarbeiteten Kategorien:
  - `NSPrivacyCollectedDataTypeEmailAddress` (Anmeldung, Benachrichtigung) — verknüpft
    mit der Identität, nicht für Tracking, Zweck `AppFunctionality`.
  - `NSPrivacyCollectedDataTypeName` (Anzeigename) — `AppFunctionality`.
  - `NSPrivacyCollectedDataTypePhoneNumber` (nur wenn der WhatsApp-Kanal freigeschaltet
    wird; heute **nicht** aktiv).
  - `NSPrivacyCollectedDataTypeOtherUserContent` (Anfragen, Nachrichten, Dokumente,
    Fotos) — `AppFunctionality`.
  - `NSPrivacyCollectedDataTypePaymentInfo` (nur Betriebstarife über Stripe; Zahlungsdaten
    verarbeitet Stripe, nicht die App).
- `NSPrivacyAccessedAPITypes`: `UserDefaults` (`CA92.1`, App-eigene Einstellungen),
  `FileTimestamp` (`C617.1`, Service-Worker-Cache), `SystemBootTime` (`35F9.1`, Laufzeit).
  **`NSPrivacyAccessedAPITypes` fehlt zu ergänzen, sobald das Projekt erzeugt ist.**

### Google Play — Data Safety (Entwurf)

- Datenerhebung: **ja**; Datenweitergabe: **ja** (Oracle/Infrastruktur, Stripe,
  E-Mail-Versand).
- Verschlüsselung bei Übertragung: **ja** (TLS).
- Löschung durch Nutzer möglich: **ja** (`/app/profile`, Datenexport unter
  `/api/account/export`).
- Standort: **nur Postleitzahl**, keine präzisen Standortdaten, kein Hintergrundzugriff.
- Tracking/Werbung: **nein**.
- Kontakte/Kalender/Gesundheit: **nein**.

Beide Deklarationen sind **vorbereitet, nicht eingereicht** — sie gehören in die
Store-Konsolen und damit in Betreiberhand.

## 6. Was nur der Betreiber tun kann

Reihenfolge nach Wirkung:

1. **Punkt 10 entscheiden: Push bauen?** (siehe Abschnitt 3 — ohne zusätzliche native
   Funktion ist der Store-Weg riskant.)
2. **Apple Developer Program** für Gina Schulze abschließen (Organisation oder
   Einzelperson, 99 €/Jahr) und die **Team-ID** mitteilen.
3. **Bundle-ID bestätigen:** `de.einfachhausen.app` endgültig? Nach der ersten
   Einreichung ist sie praktisch unveränderlich.
4. **IAP oder Stripe** für digitale Güter entscheiden. Apples Regel: in der App verkaufte
   digitale Güter müssen über IAP laufen (15–30 %). **Für die Owner-App ist diese Frage
   seit dem 2026-09-21 beantwortet und entfällt:** die App hat keinen Kauf-Flow, Stripe
   dient ausschließlich realen Dienstleistungen (Betriebsauszahlungen, Rechnungen), und
   reale Dienstleistungen müssen laut Guideline 3.1.3(e)/3.1.5(a) sogar außerhalb von IAP
   abgerechnet werden. Belege in `STORE-METADATA.md` Abschnitt 1 und
   `docs/EXTERNAL-BLOCKERS.md` Punkt 13. **Offen bleibt nur**, ob je eine **Betriebs-App**
   in die Stores soll — deren Tarife wären digitale Güter und müssten über IAP laufen.
5. **CocoaPods installieren** (`brew install cocoapods`) und **JDK + Android SDK**
   (Android Studio) auf der Maschine, die bauen soll.
6. **Splash-Screens erzeugen lassen.** Das App-Store-Icon 1024×1024 ist **erledigt**
   (Abschnitt 7). Splash-Screens fehlen weiterhin; ihre Gestaltung wäre eine Komposition
   und braucht deshalb die Designautorität, nicht nur eine Ableitung.
7. **Store-Metadaten**: Die Entwürfe für Name, Untertitel, Beschreibung, Keywords,
   Support-URL, Datenschutz-URL, Kategorie, Altersfreigabe, Review-Hinweise und
   Screenshot-Liste stehen in `docs/brand/appstore/STORE-METADATA.md` und sind gegen die
   Zeichenlimits geprüft. Es fehlen: die **Freigabe der Texte** durch die Betreiberin, die
   **Screenshot-Aufnahmen**, und der **Review-Testzugang** (Apple verlangt bei Login-Apps
   einen Demo-Account; die Plattform hat bewusst keine festen Demo-Konten, deshalb muss er
   von euch bereitgestellt werden — siehe `STORE-METADATA.md` Abschnitt 2).
8. **Datenschutzerklärung** muss die Store-Links bedienen — sie ist vorhanden und
   inhaltlich aktuell (`/datenschutz`), die juristische Freigabe bleibt offen (Punkt 16).

## 7. Was ich als Nächstes autonom liefern kann

**Erledigt am 2026-09-21:**

- **App-Store-Icon 1024×1024** — `public/icons/app-store-1024.png`. Erzeugt von
  `scripts/generate-store-icons.mjs` aus `public/brand/einfachhausen-app-icon.svg`.
  Das Skript prüft die kanonischen Farben und den Pfad des Hauszeichens und bricht ab,
  wenn sich die Markenquelle ändert; es ist also eine nachvollziehbare Ableitung und
  keine zweite Bildmarke. Abweichend vom kanonischen SVG nur dort, wo die Plattform es
  verlangt: 1024 statt 512, **quadratisch** (iOS maskiert selbst — eine vorgerundete
  Datei hätte dunkle Ecken), und **RGB ohne Alphakanal** (App Store Connect lehnt
  Transparenz ab). Hauszeichen, Strichstärke und beide Markenfarben unverändert.
- **Einreichungstexte** für App Store und Play inklusive Review-Hinweisen und
  Screenshot-Liste — `docs/brand/appstore/STORE-METADATA.md`, gegen die Zeichenlimits
  geprüft (Name 14/30, Untertitel 28/30, Werbebotschaft 141/170, Keywords 85/100,
  Play-Kurzbeschreibung 77/80).
- **IAP-Frage beantwortet** (Abschnitt 6 Punkt 4).

**Weiterhin autonom lieferbar, sobald die Toolchain steht** (CocoaPods, JDK, Android SDK):
Plattformen erzeugen, `PrivacyInfo.xcprivacy` als Datei anlegen, Signierungs- und
TestFlight-/Play-Console-Schritte dokumentieren.

**Nicht autonom:** Splash-Screens (Komposition → Designautorität), Screenshot-Aufnahmen
(zeigen echte Daten), Review-Testzugang (Zugangsdaten), Apple-Konto und Bundle-ID.
