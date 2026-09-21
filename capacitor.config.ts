import type { CapacitorConfig } from "@capacitor/cli";

// Architektur: die native Hülle lädt die Produktions-Web-App (Remote-URL-Wrapper).
//
// Ein statischer Export (`output: 'export'`) ist für diese Anwendung NICHT möglich:
// sie hängt an 27 Route-Handlern (`src/app/api/**`), an Server Actions, an
// serverseitigen Sitzungs-Cookies (`cookies()` in `src/lib/auth.ts`) und an 27
// dynamischen Routen. `webDir` zeigt deshalb nicht auf einen Export, sondern auf
// `capacitor-www/` mit einer reinen Offline-Fallback-Seite.
//
// Voraussetzung für einen echten Build: `npx cap add ios` bzw. `cap add android`
// auf einer Maschine mit vollständiger Toolchain (Xcode + CocoaPods bzw. JDK +
// Android SDK). Geprüft am 2026-09-21 auf dem Entwicklungsrechner: Xcode 26.5 und
// ein iOS-18.3-Simulator sind vorhanden, **CocoaPods, Java und das Android SDK
// nicht**. Details und die vollständige Checkliste:
// `docs/brand/appstore/STORE-READINESS.md`.
const config: CapacitorConfig = {
  appId: "de.einfachhausen.app",
  // Anzeigename im App Store / Play Store. Vorher "einfachhausen" (Kleinschreibung);
  // da noch kein natives Projekt erzeugt wurde, ist jetzt der richtige Zeitpunkt.
  appName: "Einfach Hausen",
  webDir: "capacitor-www",
  server: {
    // Über CAP_SERVER_URL auf eine andere Umgebung umstellbar (z. B. ein
    // Preview-Deployment). Standard ist die Produktionsdomain.
    url: process.env.CAP_SERVER_URL ?? "https://einfachhausen.de",
    androidScheme: "https",
    iosScheme: "https",
    // Navigationen dürfen nur innerhalb der eigenen Domain bleiben. Der Ursprung
    // der selbst betriebenen Anmeldung (Supabase) muss hier ergänzt werden, sobald
    // ein Login im nativen Kontext über eine echte Navigation läuft — der genaue
    // Host steht in der Produktionsumgebung (`AUTH_*` in /etc/einfach-hausen.env).
    allowNavigation: ["einfachhausen.de", "*.einfachhausen.de"],
  },
};

export default config;
