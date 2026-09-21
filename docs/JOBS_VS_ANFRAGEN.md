> **Terminologie und Einordnung · 21.09.2026:** Kundeninserat/Anfrage bezeichnet den Vorgang vor verbindlicher Beauftragung. Angebot/Kostenvoranschlag ist die Antwort des Betriebs; erst die ausdrückliche Auswahl/Beauftragung macht daraus beauftragte Arbeit. Die Tabelle `jobs` bleibt ein technischer Name und wird deshalb nicht umbenannt. Der Bestand unten ist vom 03.09.2026, kein aktueller Migrationsauftrag. Fachliches Ziel: PRODUCT_VISION.md.

# Jobs-vs-Anfragen — Bestand + Migrationsskizze (2026-09-03)

**Entscheidung dieser Welle: KEIN Zusammenführen.** Nur Bestandsaufnahme +
Skizze. Zwei Anfrage-Welten koexistieren; die alte ist stillgelegt, die neue
ist produktiv.

## Bestand

- **Produktiv (SQLite-App-Modell):** `jobs` (+ `job_photos`, `job_dispatches`,
  `job_assignments`), `quotes`, `messages` (per `job_id`), `appointments`,
  `payments`, `reviews`. Intake über Server Actions (`createJobAction`,
  `submitQuoteAction`, `acceptQuoteAction`, … in `src/app/actions.ts`),
  Orchestrierung in `src/lib/orchestrator.ts`. Referenzen in ~19 Dateien.
- **Legacy (Supabase-`anfragen`-Welt, stillgelegt 2026-09-03):** Tabellen
  `anfragen`, `angebote`, `messages` (per `anfrage_id`) — existieren weder in
  `src/lib/db.ts` noch in einem Supabase-Migrationsordner im Repo
  (Herkunft/Schema/RLS unprüfbar). Verbraucher:
  - `src/app/actions.ts`
  - `src/app/anfrage/[id]/page.tsx`
  - `src/app/anfrage/neu/page.tsx`
  - `src/app/anfragen-pro/page.tsx`
  - `src/app/api/hooks/neue-anfrage/route.ts`
  - `src/app/api/hooks/neues-angebot/route.ts`
  - `src/app/api/whatsapp/webhook/route.ts`
  - `src/app/app/home/sale/page.tsx`
  - `src/app/chat/[anfrageId]/page.tsx`
  - `src/app/kontakt/page.tsx`
  - `src/app/pro/leads/page.tsx`
  - `src/app/pro/profile/page.tsx`
  - `src/app/register/page.tsx`
  - `src/app/sitemap.ts`
  - `src/components/AuthContext.tsx`
  - `src/lib/anfragen.ts`

  `angebote`-Referenzen zusätzlich in 6 Dateien (u.a. `src/lib/anfragen.ts`,
  `src/app/chat/[anfrageId]/page.tsx`, `src/app/anfrage/…`).
- **Stillgelegte Hooks:** `src/app/api/hooks/neue-anfrage/route.ts` und
  `src/app/api/hooks/neues-angebot/route.ts` antworten seit 2026-09-03 `410
  decommissioned` (401 bei falschem `x-webhook-secret` bleibt — Fuzz-Gate
  T-0120). Kein Dispatch, keine Service-Role-Reads mehr.

## Migrationsskizze (nicht umgesetzt — eigene Entscheidung nötig)

1. Entscheiden: `jobs`/`quotes` als einzige Quelle festschreiben (Empfehlung:
   ja — sie tragen Dispatch, Billing, Reviews, Historie).
2. Legacy-Leser (`src/lib/anfragen.ts`, `chat/[anfrageId]`, `anfrage/…`,
   `anfragen-pro/…`, `pro/leads`) auf `jobs`/`quotes`-Queries umstellen oder
   Routen entfernen; Supabase-Realtime-Chat (`chat/[anfrageId]`) braucht
   eingecheckte RLS-Policies, sonst Datenleck-Risiko (Audit-Punkt 3c — offen).
3. Falls Supabase-Tabellen `anfragen`/`angebote` in Cloud-Projekten noch
   existieren: Export → Import in SQLite-`jobs`/`quotes` (Feldmapping
   dokumentieren) → Tabellen dort droppen + Hooks-Routen ganz löschen.
4. Erst danach diese Datei als "migriert" aktualisieren.
