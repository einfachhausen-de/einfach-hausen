# Werkbank-Komposition — Gruppen-Steckbriefe (Start nur nach /app-Go durch Jeremy)

Pilot `/app` baut der GPT-Agent auf Branch `v0/werkbank-app-pilot` (eigene
Pilot-Variante des Rahmens, Freigabe 2026-09-17). Diese drei Gruppen starten
parallel, sobald Jeremy den Pilot abgenommen hat. Keine Gruppe fasst `/app`
oder versiegelte Dateien an (Ausnahme nur per neuer Freigabe).

Vorgabe für alle: `docs/brand/werkbank-vergleich/vergleich.html` (lesen, nie
schreiben). Baseline-Screenshots (lokal, gitignored):
`artifacts/werkbank-baseline/*.png`. Designvertrag: `DESIGN.md`.
Verifikation pro Gruppe: `node scripts/eh-design-check.mjs` →
`EH_DESIGN_CONSISTENT`, `./node_modules/.bin/tsc --noEmit` → 0,
`./node_modules/.bin/eslint` (geänderte Dateien) → 0,
`./node_modules/.bin/next build` → ok. Danach Stopp zur visuellen Abnahme.
Keine Commits/Deploys ohne Jeremys Wort. Keine Logik-/Routen-/Textänderungen.

## Gruppe 1 — Owner-App (ohne /app)

Routen: `/app/jobs`, `/app/jobs/[id]`, `/app/documents`, `/app/messages`,
`/app/contracts`, `/app/profile`, `/app/settings`, `/app/calendar`,
`/app/emergency`, `/app/hilfe`, `/app/home/sale`, `/app/invoices/[id]`,
`/app/partners/[id]`.
Soll-Abschnitte: „Aufträge — die Werkbank", „Dokumente — die Ablage",
„Kontakte — die Menschen". Dateien: `src/app/app/**` (ohne `page.tsx` = /app),
`src/components/shell.*` nur lesend (gehört zum Pilot-Rahmen).
Baseline: `artifacts/werkbank-baseline/g1-*.png`.

## Gruppe 2 — Verwaltung

Routen: `/admin`, `/admin/crm`, `/admin/ops` (Login `/admin/login` unangetastet).
Soll-Abschnitt: „Verwaltung — die Warteschlangen".
Dateien: `src/app/admin/page.tsx`, `src/app/admin/crm/page.tsx`,
`src/app/admin/ops/page.tsx` (+ `actions.ts` nur lesend).
Baseline: `artifacts/werkbank-baseline/g2-*.png`.

## Gruppe 3 — Partnerbereich

Routen: `/pro`, `/pro/jobs/[id]`, `/pro/leads`, `/pro/invoices/[id]`,
`/pro/messages`.
Soll-Abschnitt: „Partnerbereich — der Betrieb".
Dateien: `src/app/pro/page.tsx`, `src/app/pro/jobs/[id]/page.tsx`,
`src/app/pro/jobs/[id]/document-form.tsx`, `src/app/pro/leads/page.tsx`,
`src/app/pro/invoices/[id]/page.tsx`, `src/app/pro/messages/page.tsx`.
Baseline: `artifacts/werkbank-baseline/g3-*.png`.

## Ausgeschlossen (separat, nicht Teil dieser Gruppen)

Auth (`src/lib/auth.ts`, `src/lib/admin-auth.ts`, Supabase-Clienten),
Datenlogik/Server-Actions-Verträge, versiegelte Dateien (siehe HANDOFF §4),
`/app` (GPT-Pilot), öffentliche/Onboarding-Seiten (bereits migriert, keine
Kompositions-Vorgabe im Soll).
