# Gerätespeicher- und Empfänger-Inventur (Produktion)

Stand: 2026-09-21, verifiziert gegen `main` = `d18e8fd`.
Grundlage: Issue #11, Abnahmepunkt „Produktions-Inventur für Cookies/Storage/Tags/Tracking
durchführen und Datenschutzerklärung darauf finalisieren“.

Diese Datei ist die **technische Bestandsaufnahme** dessen, was die Anwendung im
Browser eines Besuchers oder Eigentümers speichert, und welche Dritten dabei Daten
erhalten. Sie ersetzt keine juristische Bewertung. `docs/privacy/DATA_INVENTORY.json`
deckt ausschließlich **Datenbanktabellen** ab und ist **kein** Ersatz für dieses
Dokument.

Erhebungsmethode: Quelltextsuche nach `cookies()`, `Set-Cookie`, `document.cookie`,
`localStorage`, `sessionStorage`, `indexedDB`, `caches.`, `serviceWorker`,
`next/script`, externen URLs und Analytics-/Fehler-Tracking-Anbietern; Gegenprüfung
über die Content-Security-Policy in `next.config.ts` und über den gebauten
Client-Bundle in `.next/static`.

## 1. Cookies

| Name (Produktion / Dev) | Gesetzt in | Zweck | Attribute | Erforderlich? |
|---|---|---|---|---|
| `__Host-mh_session` / `mh_session` | `src/lib/auth.ts:147`, Optionen `:81-83`, Ablauf `:110` | Anmeldung Eigentümer/Betrieb (opaker 32-Byte-Token) | `httpOnly`, `sameSite=lax`, `secure` (Prod), `path=/`, **Ablauf 30 Tage** | ja |
| `__Host-mh_admin_session` / `mh_admin_session` | `src/lib/admin-auth.ts:95`, Ablauf `:70` | Anmeldung interner Verwaltungsbereich | `httpOnly`, `sameSite=strict`, `secure` (Prod), `path=/`, **Ablauf 12 h** | ja (für `/admin`) |
| `sb-<project-ref>-auth-token` (ggf. `.0`, `.1`, …) | Browser `src/lib/supabase.ts:96`; Server `src/lib/auth.ts:162,196,298` | Supabase-GoTrue-Sitzung (Access-/Refresh-Token) | `path=/`, `sameSite=lax`, `secure` auf https, **nicht `httpOnly`** (muss für den Browser-Client lesbar sein); `Max-Age` nur bei „Angemeldet bleiben“ | ja |
| `sidebar_state` | `src/components/ui/sidebar.tsx:85`, gelesen `src/components/werkbank-rahmen.tsx:58` | Merkt sich ein-/ausgeklappte Seitenleiste | `path=/`, `max-age=604800` (7 Tage), **kein `httpOnly`/`secure`/`sameSite`** | **nein** (reine Bedienpräferenz) |

Weitere Cookies werden nicht gesetzt. Belegsuche:
`rg -n "\.set\(['\"]|document\.cookie|store\.set|jar\.set" src`.

## 2. Browser-Speicher

### localStorage

| Schlüssel | Ort | Inhalt | Zweck |
|---|---|---|---|
| `eh-draft:hausmeister-intake` | `src/components/homeowner/homeowner-hausmeister-composer.tsx:25,38,42,55` | **Freitext der Nutzereingabe** | Entwurf übersteht Reload/Netzverlust; wird nach erfolgreichem Absenden gelöscht |
| `eh-ansicht:<key>` | `packages/eh-design/src/workspace-views.tsx:10,28,59` | Ansichtsmodus (`liste`/`karten`/`chronik`) | Merkt sich die Darstellung je Seite |
| `eh-sidebar-collapsed` | `packages/eh-design/src/workspace-sidebar.tsx:7,16,58` | `"1"`/`"0"` | Zustand der Seitenleiste |

### sessionStorage, IndexedDB, Cache API

- `sessionStorage`: **nicht verwendet**.
- `indexedDB`: **nicht verwendet**.
- `Cache API`: **nur im Service Worker** (siehe Abschnitt 3), nicht aus Seiten-Code.

Belegsuche: `rg -n "localStorage|sessionStorage|indexedDB|CacheStorage|caches\.open" src packages`.

## 3. Service Worker / PWA

- Registrierung: `src/components/pwa-register.tsx:26`, global gemountet in `src/app/layout.tsx:49`.
- Datei: `public/sw.js`, Cache-Name `einfach-hausen-public-shell-v4` (`:1`).
- Zwischengespeichert werden **ausschließlich vier statische Icon-Dateien**
  (`/icons/apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`;
  `:2-7`, Precache `:39-46`).
- **Nicht** zwischengespeichert: authentifizierte HTML-Antworten, API-Antworten,
  Nachrichten, Dokumente, Medien. Navigationen sind network-only; bei Netzausfall wird
  eine erzeugte Offline-Seite (503, `Cache-Control: no-store`) ausgeliefert (`:82-98`).
  Fremdursprünge werden ignoriert (`:71`).
- Kein `next-pwa`/Workbox; der Service Worker ist handgeschrieben.
- Kein `push`-/`notificationclick`-Listener — Browser-Push ist bewusst nicht angeboten
  (`src/app/app/settings/page.tsx:72-90`).

## 4. Netzwerkziele Dritter im Browser

**Ergebnis: es werden keine Skripte, Pixel, Analyse- oder Schriftdienste Dritter im
Browser geladen.** Dreifach belegt:

1. **Quelltext:** Suche nach `google-analytics|googletagmanager|gtag|plausible|posthog|sentry|hotjar|fbq|matomo|umami|clarity|mixpanel|segment|vercel/analytics|cloudflare.*insight|beacon` über `src`, `public`, `next.config.ts`, `package.json` liefert nur Fehltreffer (CSS-Wort „segment“, CRM-Feldwert `facebook_group`, serverseitiges `graph.facebook.com`). Keine `next/script`-/externen `<script src>`-Tags außer Inline-`application/ld+json`.
2. **Content-Security-Policy** (`next.config.ts:11-29`): `default-src 'self'`, `script-src 'self' 'unsafe-inline'` (plus `'unsafe-eval'` nur in Dev), `object-src 'none'`, `frame-ancestors 'none'`; `connect-src 'self'` plus genau der konfigurierte Supabase-Ursprung (`:22`). Das ist der einzige erlaubte Fremdursprung im Browser.
3. **Gebauter Bundle** (`.next/static`): nur Bibliotheks-Dokumentations-URLs aus Source Maps; kein Analyse-/Tracking-Host.

Schriften sind **selbst gehostet** (`src/app/layout.tsx:15-22`, `next/font/local`,
`src/fonts/InterVariable.woff2`); kein `fonts.googleapis.com`/`fonts.gstatic.com`.

Erste-Partei-Messung, ausschließlich **same-origin**, ohne Nutzerbezug:

| Mechanismus | Ort | Ziel | Inhalt |
|---|---|---|---|
| Ladezeitmessung (Core Web Vitals) | `src/components/telemetry/cwv-telemetry.tsx:7,25` | `POST /api/telemetry` → Tabelle `cwv_metrics` | Metrikname, Wert, Bewertung, Pfad |
| Fehlerbericht | `src/app/error.tsx:19` | `POST /api/errors` → Tabelle `error_events` | Fehlermeldung/Stack, Pfad |

`public/google3420d08cbcdd83dc.html` ist eine statische Google-Search-Console-
Verifikationsdatei (kein Skript, kein Cookie).

## 5. Serverseitige Empfänger

| Empfänger | Ort | Übermittelte Datenkategorie |
|---|---|---|
| Supabase (selbst gehostet, EU) | `src/lib/auth.ts`, `src/lib/supabase.ts` | E-Mail, Passwort (Login/Registrierung), Sitzungstoken |
| SMTP-Anbieter | `src/lib/mailer.ts:10-19`, `src/lib/notifications.ts:110` | Empfängeradresse, Name, Auftrags-/Angebotsdetails in transaktionaler Mail |
| Stripe | `src/app/actions.ts`, `src/lib/payments.ts`, `src/app/api/stripe/webhook/route.ts` | E-Mail (`customer_email`), Betrag, Auftragsmetadaten, Stripe-Konto-IDs |
| OpenStreetMap (Nominatim) | `src/lib/geocode.ts:44` | **nur** Postleitzahl + Land, serverseitig, gecacht in `postcode_geo` |
| WhatsApp Business (Meta) | `src/app/api/whatsapp/webhook/route.ts`, `src/lib/whatsapp-media.ts` | Telefonnummer, Nachrichtentext, Medien — **Kanal derzeit nicht freigeschaltet** |
| KI-Gateway (selbst gehostet, Standard) | `src/lib/request-ai.ts:119`, `src/app/api/ki/route.ts` | Nutzerfreitext (Anfrage, Fragen) |
| KI-Anbieter via BYOK (Nutzerentscheidung) | `src/lib/ai-engine.ts:122-124`, `src/app/app/settings/ai-settings.tsx` | Nutzerfreitext; Anbieter kann außerhalb der EU liegen |
| Affiliate-Partner | `src/app/api/affiliate/[category]/route.ts`, `src/lib/affiliate.ts` | Kategorie, Partner-Kennung, zufällige Klickreferenz, Zeitpunkt — **`AFFILIATE_PARTNERS` ist leer, kein Partner aktiv** |

## 6. Was daraus für die Datenschutzerklärung folgt

Die Erklärung `src/app/datenschutz/page.tsx` wurde am 2026-09-21 an diese Inventur
angeglichen. Vorher fehlten oder widersprachen:

- `sidebar_state`-Cookie war nicht genannt (nicht unbedingt erforderlich).
- localStorage war vollständig ungenannt, obwohl ein Schlüssel **Nutzereingaben** enthält.
- Service-Worker-Cache war ungenannt.
- Erste-Partei-Ladezeit- und Fehlermessung war ungenannt, während pauschal „keine
  Reichweitenmessung“ behauptet wurde.
- Affiliate-Klickzählung war ungenannt (derzeit inaktiv).
- Falsch: das Eigentümer-Sitzungs-Cookie sei `sameSite=strict` und laufe „mit der
  Sitzung“ ab — tatsächlich `sameSite=lax` und 30 Tage; nur das Admin-Cookie ist
  `strict` und 12 h.
- Falsch: Sitzungs-Cookies seien `httpOnly` — die Supabase-Auth-Cookies sind bewusst
  nicht `httpOnly`.
- Falsch: „Stripe — Abwicklung kostenpflichtiger Pakete“ — kostenpflichtige
  Eigentümer-Pakete gibt es seit Issue #132 nicht mehr.

## 7. Offen (nicht technisch entscheidbar)

- **Juristische Freigabe** der Datenschutzerklärung, insbesondere Art. 13 Abs. 2 DSGVO,
  Auftragsverarbeitung mit Oracle und die Formulierung zur Drittlandübermittlung bei
  BYOK. Extern (Gina/Jeremy + Rechtsberatung), siehe `docs/EXTERNAL-BLOCKERS.md`.
- **Einwilligungs- oder Informationspflicht** für `sidebar_state` und den
  localStorage-Entwurf ist eine Rechtsfrage, keine Codefrage. Technisch gilt weiterhin
  § 25 Abs. 2 TDDDG für die Sitzungs-Cookies; die Bewertung der beiden
  Präferenzspeicher liegt bei der Rechtsberatung.
