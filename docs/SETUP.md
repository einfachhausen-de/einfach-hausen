# Lokales Setup (Entwicklung)

Stand: 2026-09-10. Gilt für lokale Entwicklung auf dem eigenen Rechner.
Für Produktion siehe `docs/OPERATIONS.md` und `docs/TEST_DEPLOY.md`.

## Voraussetzungen

- Node.js 22 (Deploy und Build verlangen Major 22, siehe `deploy/update-on-oci.sh`)
- npm (Pakete liegen in `package.json`)

## Start

```sh
npm install
npm run dev
```

Die App läuft danach lokal (Standard: `http://localhost:3000`,
siehe `NEXT_PUBLIC_APP_URL` in `.env.example`).

## Umgebungsvariablen

- Vorlage kopieren: `.env.example` → eigene `.env.local` anlegen.
  Niemals echte Werte committen (Schlüssel, Secrets, Tokens).
- Auth-Modus: `AUTH_MODE=supabase` (Standard). `AUTH_MODE=local` ist nur
  für lokale Entwicklung gedacht und wirft in Production einen Fehler
  (fail-closed, siehe `src/lib/auth.ts` → `authMode()`).
- Supabase (Server-Identität): `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL`,
  `SUPABASE_ANON_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  Server-seitig zusätzlich `SUPABASE_SERVICE_ROLE_KEY` (verlässt den Server nie).
- SQLite-Fallback: `DATABASE_PATH=./data/einfach-hausen.db`.
  SQLite ist die App-Datenbank für lokale Entwicklung und Notfall;
  Supabase (GoTrue) bleibt die Server-Identitätsinstanz.
- Optional KI-Gateway: `AI_BASE_URL` (Standard `http://127.0.0.1:20128/v1`),
  `AI_MODEL` (Standard `auto/best-fast`), `AI_API_KEY` oder
  `OMNIROUTE_MASTER_KEY`. Ohne Schlüssel antwortet der KI-Chat mit einer
  ehrlichen Kontingent-Meldung (siehe `docs/QUOTA_MODEL.md`).
- Demo-Phase (befristet, opt-in fail-closed): Nur `DEMO_LOGIN_ENABLED=1` plus
  gesetztes `DEMO_PASSWORD` schalten Demo-Box, Demo-Mapping und Admin-Ausnahme
  an; Default ist aus (siehe `docs/DEMO_ACCOUNTS.md`).

## Nützliche Befehle

```sh
npm run lint
npm run build
npm run test:e2e
```

## Hinweise

- Keine Secrets in Git, keine `.env`-Dateien committen.
- Geschäftsführung: Gina Schulze (Inhaberin/Geschäftsführerin).
  Technische Entwicklung: Jeremy Schulze. Quelle: `docs/COMPANY_IDENTITY.md`.
