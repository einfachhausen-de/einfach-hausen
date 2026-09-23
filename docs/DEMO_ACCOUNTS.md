# Demo-Accounts (BEFRISTET — Demo-Phase)

| Zugang | Benutzername | Passwort | Wohin |
| --- | --- | --- | --- |
| Kunden-App | `kunde` | `DEMO_PASSWORD` (ENV) | `/login` → `/app` |
| Handwerker-App | `handwerker` | `DEMO_PASSWORD` (ENV) | `/login` → `/pro` |
| CRM/Admin | — (nur Passwortfeld) | `DEMO_PASSWORD` (ENV) | `/admin/login` |

Die Login-Seite zeigt die Demo-Box mit Ein-Klick-Buttons nur wenn Demo explizit an ist; Benutzernamen gehen auch per Hand (ohne `@` → Demo-Mapping).

## Technik
- Direkt-Einstieg ohne Formular: `/login/demo` (Eigentümer) bzw. `/login/demo/handwerker` — Pfad statt Query
  (Vorschau-Adressleisten übernehmen oft nur Pfade); alternativ `/login?demo=1`. Leitet serverseitig auf
  `/api/auth/demo-start` (Eigentümer) bzw. `/login?demo=handwerker` — leitet serverseitig auf
  `/api/auth/demo-start` (Session via `createSession`, 303 nach `/app` bzw. `/pro`). Existiert nur bei
  `AUTH_MODE=local` + `DEMO_LOGIN_ENABLED=1`; Supabase-Setups bekommen 404.
- Supabase-User `kunde@demo.einfachhausen.de` + `handwerker@demo.einfachhausen.de` (Passwort aus `DEMO_PASSWORD`, confirmed). Anlegen: `node scripts/seed-demo-users.mjs` (braucht Service-Key).
- App-Zeilen entstehen beim ersten Login automatisch (`ensureDemoAppRow`, feste Rollen).
- CRM: Ausnahme in `adminPasswordMatches` (nur wenn Demo an).

## Demo-Inhalte (Produktions-DB, OCI)
Gesetzt per `/tmp/demo-seed.sql`-Muster direkt in `/var/lib/einfach-hausen/einfach-hausen.db`:
- Kunde (id 7): Adresse Ahornweg 12, 86150; Jobs 9001-9003 (2 offen, 1 quoted mit Demo-Angebot 180 €); Wartung 9001 (+6 Tage).
- Handwerker (id 8): Demo-Betrieb (verifiziert, aktiver Vertrag); Dispatches auf 9001-9003.
Ids 9001+ sind Demo-reserviert (INSERT OR IGNORE, Re-Run sicher).

## Kill-Switch (opt-in, fail-closed seit 88431f0)
Nur `DEMO_LOGIN_ENABLED=1` UND gesetztes `DEMO_PASSWORD` schalten Box/Mapping/Admin-Ausnahme an. Jeder andere Zustand (Default) → aus. Für Produktion nichts setzen.

## Entfernung nach der Demo-Phase
1. `DEMO_LOGIN_ENABLED` unset/`0` lassen bzw. entfernen (sofort wirksam nach Deploy, Default ist aus).
2. Supabase-Demo-User deaktivieren/löschen.
3. Löschen: `src/lib/demo-accounts.ts`, Login-Box + `?demo=`-Zweig in `src/app/login/page.tsx`, `src/app/api/auth/demo-start/`, Ausnahme in `src/lib/admin-auth.ts`, `scripts/seed-demo-users.mjs`, diese Datei.
