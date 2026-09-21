# Aktuelle Übergabe · Produktkontext 21.09.2026

Die aktive Produktkorrektur steht in [PRODUCT_VISION.md](PRODUCT_VISION.md) / [PRODUCT_POSITIONING.md](PRODUCT_POSITIONING.md). Handwerkervermittlung und Affiliate-Tarife sind der Kern; Eigentümer kostenlos, Partnerabo, Hausakte ergänzend.

**Nächste Frontend-Aktion:** Eigentümer-Einstieg auf Auftrag einstellen, Tarifvergleich und aktuelle Angebote ausrichten. Details und Grenzen: [NEXT_AGENT.md](NEXT_AGENT.md). Die neue UI-Priorität ist noch nicht umgesetzt.

PR #168 enthält die bisherigen Frontend-Korrekturen und diesen Dokumentationsabgleich. [Arbeitsnachweis](TASKPLAN_FRONTEND_20260921.md) · [Frontend-Lieferung](brand/workspace/FRONTEND-HANDOFF-20260921.md) · [Brain-/Memory-/Taskplan-Synchronisierung](PRODUCT_CONTEXT_SYNC.md). Externe Systeme sind wegen offline gemeldeter Hosts ausdrücklich noch nicht aktualisiert.

## Historischer Betriebs-Handoff vom 20.09.2026

Die folgende abgeschlossene Welle bleibt unverändert nachvollziehbar. Ihre SHAs, Gates und Folgeaktionen gelten nur für den damaligen Umfang.

# Handover — ses_f40d79-Welle — Stand 2026-09-20

**HEAD:** `3e8ecd9` (main, local == origin == `/srv/einfach-hausen`) · **Docs-Follow-up:** `f31f812`
**Produktion:** OCI `sin-supabase`, `einfach-hausen.service` aktiv, `/api/health` 200 `state:ready`
**Vorheriger Stand:** `0d68a74` (2026-09-20 16:19 UTC)

## Auftrag und Abschluss

Die vorherige opencode-Session `ses_f40305f4cffeFMCW3bHY7uwHKm` (SIN-Zeus, sin-supabase) übernahm den abgebrochenen Job
`ses_f40d79` (sin-vm2) und endete selbst abgebrochen, als der Subagent "Re-integration merge deploy" nach
41 min mit `Task cancelled` beendet wurde. Merge `3e8ecd9` war bereits gepusht; Deploy-Verifikation und Cleanup
standen aus. Diese Welle wurde hier zu Ende geführt.

## Inhalt von `3e8ecd9` (Octopus aus drei disjunkten Branches)

| Block | Branch/SHA | Issue | Inhalt |
|---|---|---|---|
| D | `feat/ses-f40d79-dialog-block3` @ `5e492f6` | #126 | Settings-Dialog 6→4 Sektionen; `Konto & Daten`; `SETTINGS_SECTION_IDS` = `account\|notifications\|ai\|app`; dead Imports raus |
| K | `feat/ses-f40d79-kontrast-deadcss` @ `929bc91` | #124 | `SidebarGroupLabel` auf `var(--eh-color-secondary, #4b5b60)`; 479/479 Spec-Selektoren + 458 EXCL-Regeln + 9 SHARED-Trims entfernt |
| IA | `feat/ses-f40d79-ia-navuser-sidebar-docs` @ `234aec3` | #125 | `nav-user.tsx` ersetzt (nur Identität+Einstellungen+Abmelden); `nav-config.ts` ein Label = ein Ziel; `app-sidebar.tsx`/`nav-projects.tsx` entschlackt |

## Gates (frisch, gegen main `3e8ecd9`)

| Gate | Ergebnis |
|---|---|
| `npx tsc --noEmit` | exit 0 |
| `npm run lint` | 0 errors, 28 warnings (vorbestehend, keine in geänderten Dateien) |
| `npm run design:check` | exit 0 |
| `node scripts/eh-design-deadcss.mjs` | exit 0 |
| `--report` | 578 unreferenced global classes / 66 tote Modul-Klassen (Altbestand, Out-of-Scope) |

## Acceptance

- **A1** ein Label = ein Ziel: `Profil` → `/app/profile`, `Einstellungen` → `/app/settings` (belegt in `nav-config.ts`)
- **A2** Session-Popover: nur Identität + `Einstellungen` (via `openSettingsDialog('account')`) + `Abmelden`; keine `Profil`-Zeile
- **A3** `SETTINGS_SECTION_IDS` = `["account","notifications","ai","app"]`; `parseSettingsSection` nur diese 4
- **A4** DeadCSS: 479/479 Spec-Zeilen aus `/tmp/deadcss-authority-spec.md` nicht mehr im CSS; `eh-design-deadcss` exit 0

## Produktion verifiziert

- `/srv/einfach-hausen` main = `3e8ecd9` (Service aktiv seit 2026-09-20 19:05:34 UTC)
- `/api/health` → 200 `{"ok":true,"state":"ready", database ready, auth_authority reachable, smtp configured}`
- `/login` 200 · `/app` 307 → Login-Redirect (T-0168-konform)
- Deploy-Pfad: `deploy/update-on-oci.sh` (benötigt sudo für systemctl); Health-Port `3010`

## Cleanup

- Worktrees `/home/ubuntu/dev/eh-d`, `eh-ia`, `eh-k` entfernt (alle clean, gemerged)
- `feat/ses-f40d79-dialog-block3`, `feat/ses-f40d79-kontrast-deadcss`, `feat/ses-f40d79-ia-navuser-sidebar-docs` lokal + remote gelöscht
- Issues #124 / #125 / #126 geschlossen

## Bekannte Reste (nicht blockierend)

1. `design:check` meldet Debt-Baseline stale für `globals.css` (erwartet — DeadCSS hat Inhalte entfernt); `npm run design:debt:sync` nachziehen, wenn die Baseline wieder kanonisch sein soll.
2. 28 vorbestehende `no-unused-vars`-Warnings (keine in geänderten Dateien).
3. `design/design-dynamic-classes.json` referenziert zwei nicht mehr existierende Dateien (`CardVisual.tsx`, `Stepper.tsx`) — Showmitteilung des deadcss-Gates, nicht blockierend.
4. Untracked `.orca/drops/`-Screenshots und `public/uploads` in `/srv` (Runtime-Artefakt).

## Nächste Aktion (genau eine)

Höchste priorisierte eligible Aufgabe aus `.sin-gpt-web/taskplan.sqlite3` — Einstieg `docs/NEXT_AGENT.md`.
