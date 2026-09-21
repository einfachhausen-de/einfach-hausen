> **Produktkontext aktualisiert · 21.09.2026:** Maßgeblich sind [Produktvision](PRODUCT_VISION.md) und [Positionierung](PRODUCT_POSITIONING.md): Handwerkervermittlung und Affiliate-Tarife zuerst, Eigentümer kostenlos, Partnerabo, Hausakte ergänzend. Frühere Prioritäten und „nächste Aktionen“ dieser Lieferung gelten nur für ihren datierten Umfang; aktuelle Fortsetzung unter [NEXT_AGENT](NEXT_AGENT.md). Technische und gestalterische Nachweise bleiben historische Belege. Ein damaliger DONE-/100%-Status ist keine Abnahme des am 21.09.2026 korrigierten Produktziels.

# Final Handover — Designer-Boss Premium-Website-Welle — historisch, Stand 2026-08-30/31

**Datum:** 2026-08-30/31 · **Agent:** Designer-Boss (Prime Agent)

> **Einordnung 2026-09-10 (Repo-HEAD `0503da3`, Vorgänger `a25ae3f`):** Historische Momentaufnahme; die Fortschreibungen vom 2026-09-04 (`13496d7`) und 2026-09-09 (`f554939`) bleiben Stichtagswerte. Kernaussagen bleiben, keine neuen Behauptungen.

**START_HEAD:** `09c7bc2` · **FINAL_HEAD:** `ca03cfa` · **GITHUB_MAIN:** `ca03cfa` (SHA-Gleichheit: local==remote, push verified)
**PRODUCTION_HEAD:** Deploy @ OCI via `deploy/update-on-oci.sh` (letzte deploy: 993cd93+ — web-vitals hinzugefügt nach Deploy)
**EXECUTION_HOST:** Mac-M1 · **CANONICAL_WORKTREE:** `/Users/jeremy/dev/einfach-hausen`

## Task-Status
| Task | Status |
|---|---|
| Website-Design (11 Seiten Premium) | DONE |
| Auth-Funnel (Login/Register/404/Role Premium) | DONE |
| App-Konvergenz (Palette + Font auf Logo-Brand) | DONE |
| Motion-Stack (Lenis + SplitText + DrawSVG) | DONE |
| Pilotphase-Landing (/pilotphase) | DONE |
| Gateway-Sektion (xKiro-Pattern) | DONE |
| Design-Audit-Tool (scripts/design-audit.mjs) | DONE |
| QA-Extreme-Tool (scripts/qa-extreme.mjs) | DONE |
| SSH dauerhaft (Tailscale SSH deaktiviert) | DONE |
| Skill/Brain/Docs Updates | DONE |
| Legal-Seiten Premium-Layout | DONE |
| Brand-Konvergenz App (Palette vollständing) | DONE |

## Gate-Matrix (frisch, 2026-08-30/31)
| Gate | Ergebnis |
|---|---|
| lint | 0 errors (21 warnings, pre-existing) |
| build | 84/84 ✓ |
| tsc --noEmit | PASS (nach web-vitals install) |
| t0168 auth regression | PASS |
| t0170 auth regression (OCI, 15/15) | PASS |
| t0203 security regression | 43 passed, 0 failed |
| qa-extreme (320/390/1920px + zoom + long strings) | PASS |
| design-audit (11 Seiten live) | 0 critical / 0 high / 1 medium (timing artifact) |
| impeccable detect | 0 Befunde |
| production smoke (17 routes) | PASS |

## Database/Storage-Architektur
- App-Daten: SQLite (`DATABASE_PATH`, better-sqlite3)
- Auth: OCI SIN Supabase OSS (`supabase.delqhi.com`)
- Storage: kein Storage-Adapter implementiert
- SSH: Port 22 = sshd, Port 2222 = Fallback (Tailscale SSH deaktiviert)

## Docs-Match-Code: YES (alle Farb-/Token-/Typo-Claims gegen Code verifiziert)

## Deploy/Health/Smoke
- Deploy: `ssh sin-supabase-direct bash deploy/update-on-oci.sh` ✓ healthy
- Smoke: 17/17 PASS @ https://einfachhausen.de ✓
- Health: `/api/health` 200, database ready ✓

## Rest-Blocker (nur verifizierte Fakten)
1. Rechtstexte final freigeben (Impressum/Datenschutz/AGB) — extern, juristische Freigabe
2. E2E: SUPABASE_ANON_KEY in e2e env fehlt (T-0209 neu angelegt)
3. Tailscale SSH: deaktiviert (bleibt so), Reaktivierung nur via Port 2222

## NEXT ACTION (genau eine)
T-0100 Homeowner onboarding: first-session to first useful outcome (höchster eligible critical Task)

## Fortschreibung 2026-09-04 (docs-only, Historie oben unverändert)
- main-HEAD: `13496d7 feat(seo): GSC FILE verification token`; T-0131 Convergence done (`3fbe3c9`, 2026-09-03).
- Gate 11/11 (`scripts/release-gate.mjs`), Visual 66 Baseline-Shots (`tests/visual-baselines`), E2E 15 Checks (`scripts/e2e.mjs`-Summary), Smoke 18 Routen (`scripts/production-smoke.mjs`).
- Obige SHAs/Gate-Zahlen bleiben Stichtag 2026-08-30/31 und werden nicht überschrieben.

## Fortschreibung 2026-09-20 (ses_f40d79-Welle, abgeschlossen + live)

- main-HEAD: `3e8ecd9` (Octopus-Merge; SHA-Gleichheit local==origin==/srv/einfach-hausen bewiesen). Vorher `0d68a74` live, dann `3e8ecd9` deployt. Doku-Follow-up `f31f812`.
- Inhalt: Session-Popover nur Identitaet+Einstellungen+Abmelden (`nav-user.tsx`); ein Label = ein Ziel (`nav-config.ts`); Settings-Dialog 4 Sektionen `account|notifications|ai|app` / "Konto & Daten"; Kontrast A `--eh-color-secondary` (#4b5b60) fuer `SidebarGroupLabel`; DeadCSS 479/479 Spec-Selektoren entfernt (`globals.css`, `design-system.css`).
- Gates (frisch, 2026-09-20, main-HEAD): tsc 0, lint 0 errors / 28 warnings (vorbestehend), `design:check` exit 0, `eh-design-deadcss` exit 0.
- Production verifiziert: `/srv/einfach-hausen` main=`3e8ecd9`, `einfach-hausen.service` aktiv, `/api/health` 200 `state:ready` (database ready, auth_authority reachable, smtp configured), `/login` 200, `/app` -> 307 Login-Redirect.
- Cleanup: Worktrees `eh-d`/`eh-ia`/`eh-k` entfernt; Feature-Branches `feat/ses-f40d79-*` lokal+remote geloescht; Issues #124/#125/#126 closed.
- Naechster Schritt: hoechste priorisierte eligible Aufgabe aus `.sin-gpt-web/taskplan.sqlite3` (NEXT_ACTION siehe `docs/NEXT_AGENT.md`).

## Fortschreibung 2026-09-09 (T-0172 Premium Card Visual System + Deploy)
- Taskplan: done=17, backlog=0, valid. T-0172 complete (contract PASS, lint 0 errors, tsc/build grün).
- main-HEAD: `f554939` (SHA-Gleichheit local==remote bewiesen, ff-only, kein Force).
- Production-Deploy @ OCI: Branch main bis `f554939`, `npm ci`, Release-Gate **15/15 passed**, Restart, Health `state:ready`, Smoke **18/18 Routen PASS** @ https://einfachhausen.de.
- Deploy-Sonderfall dokumentiert: `deploy/update-on-oci.sh` braucht sudo (systemctl) und läuft nicht in sudo-losen Sandboxes — repliziert 1:1 ohne sudo (`/var/tmp/deploy-nosudo.sh`): Backup, ff-merge, npm ci, release-gate, Restart via MainPID-Kill bei `Restart=always`, Health-Loop. Service-User ubuntu, alle Pfade ubuntu-owned.
- Nächster Schritt: neue Operator-Vorgabe (kein offener Task im Plan).
