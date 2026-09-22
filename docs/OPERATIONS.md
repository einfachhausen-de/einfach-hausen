# Einfach Hausen — OCI operations

## Visueller Deploy- und Recovery-Flow

![Production, Backup und Recovery](diagrams/production-recovery-flow.svg)

[Interaktiven Deploy-/Recovery-Flow öffnen](diagrams/production-recovery-flow.html)

## Production contract — OCI + SIN Supabase OSS

Produktion läuft als Next.js Service hinter Cloudflare Tunnel auf OCI. **SIN Supabase OSS auf OCI** ist die Auth-Autorität (`AUTH_MODE=supabase`); die App-Datenbank ist SQLite (`DATABASE_PATH`). Supabase Cloud ist nicht Teil der Zielarchitektur. Aussagen wie HA/PITR/Failover gelten nur nach frischem Betriebsnachweis für die tatsächlich betriebene Konfiguration (aktuell nicht nachgewiesen):

`Internet -> Cloudflare -> sin-kestra tunnel -> 127.0.0.1:3010 -> einfach-hausen.service -> SQLite (persistenter Pfad) + SIN Supabase OSS (Auth)`

Nach dem verifizierten Mac→GitHub-Release ist **OCI-VM der kanonische Engineering-/Prime-Agent-Host**. GitHub ist die einzige Code-Transfergrenze; ein Dirty-Working-Tree wird niemals direkt vom Mac nach OCI kopiert.

Canonical runtime paths:

- code: `/srv/einfach-hausen`
- environment: `/etc/einfach-hausen.env` (`0600`, never committed) — enthält `AUTH_MODE=supabase`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `DATABASE_PATH`
- **App-Datenbank (Produktion): SQLite** `/var/lib/einfach-hausen/einfach-hausen.db` (`DATABASE_PATH`, `better-sqlite3`) — Single Node mit Backup-Pflicht
- **Auth-Autorität: SIN Supabase OSS (self-hosted)** `https://supabase.delqhi.com` — serverseitige Session-Verifikation (`@supabase/ssr`); Supabase ist nicht die App-Datenbank
- **Storage: kein Supabase-Storage-Adapter implementiert** (`src/lib/storage.ts` existiert nicht); `private/`/`uploads/` sind persistente lokale Verzeichnisse per Symlink (`/var/lib/einfach-hausen/...`)
- local verified backups: `/var/backups/einfach-hausen`
- service: `einfach-hausen.service`
- public health: `/api/health` (prüft die SQLite-Datenbank; 200 nur wenn `users`-Schema ready)

Die App adressiert `private/`/`uploads/` über das lokale Dateisystem (persistente Verzeichnisse + Symlinks, siehe `deploy/update-on-oci.sh`). Ein Supabase-Storage-Adapter ist nicht Teil des laufenden Codes.

## Node 22 requirement

Production build and runtime require Node **22.x**. The systemd unit and `deploy/update-on-oci.sh` use `/home/ubuntu/.nvm/versions/node/v22.23.0/bin`; the deployment script aborts unless the detected major version is exactly 22. Because npm itself uses `#!/usr/bin/env node`, the deploy script also prepends this validated Node 22 directory to `PATH` before `npm ci`/build so lifecycle workers cannot fall back to `/usr/bin/node` 20. Do not work around native-module failures by downgrading `better-sqlite3` or building with Node 20.

Safe probes:

```bash
/home/ubuntu/.nvm/versions/node/v22.23.0/bin/node --version
systemctl cat einfach-hausen.service | grep '/node/v22\|/npm\|DATABASE_PATH\|BindPaths'
```

## Health contract (HA)

`GET /api/health` performs a bounded read against the **SQLite** app database (`users` table via `sqlite_schema`). HTTP 200 nur wenn die Datenbank bereit ist, sonst 503. JSON enthält nur service, state, database category, timestamp — keine Pfade/Secrets. `no-store`.

Local service probe:

```bash
curl -fsS http://127.0.0.1:3010/api/health
```

Expected shape includes `"ok":true` and `"database":"ready"`.

## Persistent storage bootstrap

Vor Installation/Restart:

```bash
sudo install -d -o ubuntu -g ubuntu -m 0750 \
  /var/lib/einfach-hausen \
  /var/lib/einfach-hausen/private \
  /var/lib/einfach-hausen/uploads \
  /var/backups/einfach-hausen
```

Produktion schreibt `private/`/`uploads/` in die persistenten lokalen Verzeichnisse; die Symlinks `data/private -> /var/lib/einfach-hausen/private` und `public/uploads -> /var/lib/einfach-hausen/uploads` sind der verifizierte Runtime-Mechanismus (siehe `deploy/update-on-oci.sh`). Ein Supabase-Storage-Cutover ist nicht implementiert.

## Backup (HA)

Primär: SQLite-Online-Backup vor jedem Deploy (`deploy/update-on-oci.sh`) nach `/var/backups/einfach-hausen` + `scripts/backup-einfach-hausen.sh`; `private`/`uploads` via tar. Ein Supabase-PITR-Pfad ist nicht Teil des betriebenen Stacks (historische HA-Planung, nie ausgeführt). Notfall-Dump:

```bash
sudo SUPABASE_DB_URL="$DATABASE_URL" \
  PRIVATE_ROOT=/var/lib/einfach-hausen/private \
  UPLOAD_ROOT=/var/lib/einfach-hausen/uploads \
  BACKUP_ROOT=/var/backups/einfach-hausen \
  /srv/einfach-hausen/scripts/backup-einfach-hausen.sh
```

Backup-Pfad: `/var/backups/einfach-hausen` (+ `scripts/backup-einfach-hausen.sh`). Die SQLite-Datenbank wird vor jedem Deploy online gesichert; `private.tar`/`uploads.tar` sichern Medien. Restore-Proof erfolgt gegen eine Kopie, nie gegen die Produktions-DB.

Nightly-Sicherung: `einfach-hausen-backup.timer` (03:25 UTC) bündelt SQLite+private+uploads und lädt das Bundle in den Supabase-Bucket `einfach-hausen-backups` (`deploy/backup-to-supabase.sh`). Zweitkopie außerhalb der VM: siehe `docs/EXTERNAL-BLOCKERS.md`.

### Retention / Rotation (seit 2026-09-21)

`scripts/prune-einfach-hausen-backups.sh` begrenzt das Wachstum von
`/var/backups/einfach-hausen`. Es läuft am Ende von
`scripts/backup-einfach-hausen.sh`, also **vor jedem Deploy und bei jeder
Nacht-Sicherung**; ein Retention-Fehler bricht die Sicherung nicht ab (der neue
Backup existiert zu diesem Zeitpunkt bereits), wird aber laut auf stderr gemeldet.

Aufbewahrung (GFS-lite, absichtlich klein):

1. der neueste Backup bleibt immer erhalten,
2. alles jünger als `BACKUP_KEEP_ALL_HOURS` (Standard **48**) bleibt erhalten,
3. der neueste Backup je UTC-Tag für `BACKUP_KEEP_DAILY_DAYS` (Standard **14**),
4. der neueste Backup je ISO-Woche für `BACKUP_KEEP_WEEKLY_WEEKS` (Standard **8**).

Nichts jünger als das Keep-All-Fenster wird entfernt, damit ein laufender Deploy
seinen eigenen Backup nicht verlieren kann. Nur Artefakte, die dieses Repository
selbst erzeugt (`einfach-hausen-<UTC-Stempel>` als Verzeichnis oder `.tar.gz`),
werden angefasst; Symlinks und fremde Einträge bleiben unberührt, und ein
gemeinsamer Pfad (`/`, `/var`, `/var/lib`, …) wird verweigert.

```bash
# Trockenlauf (ändert nichts)
sudo env BACKUP_PRUNE_DRY_RUN=1 /srv/einfach-hausen/scripts/prune-einfach-hausen-backups.sh

# anwenden
sudo /srv/einfach-hausen/scripts/prune-einfach-hausen-backups.sh
```

Der Grund für dieses Skript ist belegt: am 2026-09-21 lagen **79 Backups mit
13,7 GB** ohne jede Rotation in `/var/backups/einfach-hausen` (der Deploy-Backup
und die Nacht-Sicherung addierten je einen vollständigen Satz). Bei ~1,4 GB/Tag
und 26 GB freiem Speicher wäre die VM in etwa 18 Tagen vollgelaufen — ein
Produktionsausfall durch reines Backup-Wachstum. Die Entscheidung ist in
`scripts/backup-retention-regression.mjs` abgesichert und läuft als Gate in
Layer 1 des Release-Gates.

Restore-Drill (verifiziert 2026-08-30): `scripts/restore-einfach-hausen.sh BACKUP_DIR --dry-run` prüft Checksummen, SQLite-`integrity_check` und Archive; `--stage DIR` extrahiert ohne Produktionskontakt. Beweis inkl. RPO/RTO: `docs/evidence/T-0204-restore-drill-20260830.md`.

Notification-Dispatcher: `einfach-hausen-dispatch.timer` (alle 5 Min) liefert fällige Outbox-Einträge über die Channel-Adapter (in_app, E-Mail via SMTP/Resend) mit Retry/Dead-Letter (`scripts/dispatch-notifications.mjs`).

Environment-Dateien (T-0200/T-0201): `/etc/einfach-hausen.env` enthält zusätzlich `AUTH_MODE`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SMTP_*`, `MAIL_FROM`. Build-Zeit-Variablen (`NEXT_PUBLIC_*`) liegen in `/etc/einfach-hausen-build.env` (ubuntu-lesbar) und werden von `deploy/update-on-oci.sh` vor `npm run build` gesourcet - ohne sie verliert der Client-Bundle die Supabase-Gateway-Origin und die CSP bricht den Login.

## KI-Ad-Credits (T-0207, gehärtet 2026-09-03)

`POST /api/ai/credits` und `PUT /api/ki` vergeben Bonus-KI-Aktionen nur noch
gegen signierten Werbenachweis (`src/lib/ad-receipt.ts`): Body
`{ receipt, signature }`, wobei `receipt` JSON `{ provider, nonce, ts }` ist
und `signature` HMAC-SHA256 darüber (hex, optional `sha256=`-Präfix).
Secret: `AD_RECEIPT_SECRET` (Fallback `WEBHOOK_SECRET`), 10-Minuten-Skew,
Single-Use via `grantAdCreditsOnce()` (exakte `rewarded-ad:<provider>:<nonce>`-
Quelle, Replay → 409). Ohne konfiguriertes Secret: Production fail-closed
(503), außerhalb Production Dev-Bypass (`ALLOW_UNSIGNED_AD_CREDITS=1` oder
Nicht-Production). Bis ein Rewarded-Ad-SDK verdrahtet ist, sendet die
Einstellungs-UI nur `{}` — der Server lehnt in Produktion ehrlich ab.

Legacy-Supabase-Hooks `POST /api/hooks/neue-anfrage` und
`POST /api/hooks/neues-angebot` sind stillgelegt (410, Details in
`docs/JOBS_VS_ANFRAGEN.md`); falsches `x-webhook-secret` antwortet weiter 401.

## Non-destructive restore proof (HA)

Nie Prod-DB direkt ersetzen. Dry-run gegen Staging-DB:

```bash
/srv/einfach-hausen/scripts/restore-einfach-hausen.sh \
  /var/backups/einfach-hausen/einfach-hausen-YYYYMMDDTHHMMSSZ \
  --dry-run --target staging
```

Historischer HA-Restore-Proof (Supabase PITR/`pg_dump`) ist nie implementiert worden und beschreibt nicht den betriebenen Stack. Geltender Restore-Pfad: Backup aus `/var/backups/einfach-hausen` gegen eine Kopie der SQLite-DB einspielen und verifizieren, nie direkt gegen die Produktions-DB.

## Reproducible service, tunnel, and Kestra probes

Run these without printing `/etc/einfach-hausen.env`:

```bash
systemctl is-active einfach-hausen.service
systemctl is-active einfach-hausen-kestra-proxy.socket
systemctl is-active einfach-hausen-backup.timer
curl -fsS http://127.0.0.1:3010/api/health
curl -fsS http://172.28.50.1:3010/api/health
systemctl status cloudflared --no-pager
cloudflared tunnel info sin-kestra
```

The first curl proves the app/service path. The second proves the private systemd socket proxy used by Kestra. `cloudflared tunnel info sin-kestra` proves the named tunnel connector state without exposing credentials.

Kestra flow: `einfach.hausen/einfach_hausen_health` (`deploy/kestra/einfach-hausen-health.yml`) requests `http://172.28.50.1:3010/api/health` every ten minutes. Inspect recent executions in the existing Kestra UI/API and require successful `app_health` executions; do not expose Kestra tokens in shell output or evidence.

## Deployment

Run the deployment as the `ubuntu` application owner; the script elevates only its filesystem/systemd operations:

```bash
/srv/einfach-hausen/deploy/update-on-oci.sh
```

The deployment script requires `main` with no changes except the two verified runtime media links, verifies and activates Node 22 for npm and child processes, prepares persistent directories, performs copy-only legacy-media migration, creates a pre-deploy online backup when the persistent DB already exists, fast-forwards to `origin/main`, builds against a disposable `/tmp` SQLite path, reloads systemd, restarts the service, and requires local health success. It does not use `git reset --hard` and does not delete production data.

## Failure handling

If health fails, inspect service logs before changing data:

```bash
sudo systemctl status einfach-hausen.service --no-pager
sudo journalctl -u einfach-hausen.service -n 120 --no-pager
```

Do not delete SQLite, WAL/SHM files, private media, or uploads as a troubleshooting step. Do not remove the old public fallback until the canonical domain/tunnel/Stripe/mail acceptance in `PRODUCTION_HANDOVER.md` is complete.

## Post-convergence production live check — historisch, Stand 2026-08-25 (Task T-0003)

> **Stand-Hinweis 2026-09-10 (Repo-HEAD `0503da3`):** Der Abschnitt unten ist eine historische Momentaufnahme vom 2026-08-25 (Release `dcd53ca1`, Konvergenz-Commit `f0198ee`). OCI `/srv/einfach-hausen` steht lesend verifiziert ebenfalls auf `0503da3` („Finisher-2 Integration 2026-09-10“). Live-Aussagen vor Wiederverwendung frisch gegen `/api/health` und Smoke prüfen.

Verified live state after repository convergence to `f0198ee`:

- `/api/health` returned HTTP 200 with `ok=true`, `database=ready` (public via Cloudflare and loopback on OCI).
- All documented public routes returned HTTP 200: `/`, `/leistungen`, `/preise`, `/so-funktionierts`, `/sicherheit`, `/eigenheimbesitzer`, `/partner`, `/impressum`, `/datenschutz`, `/agb`, `/barrierefreiheit`, `/kontakt`, `/ueber-uns`, `/hilfe`, `/login`, `/register`.
- Deployed commit on OCI (`/srv/einfach-hausen` `git rev-parse HEAD`) is `dcd53ca1f463e9d64ee3fc6838d1cdb3fb2bb557`, exactly the verified release. Runtime process runs Node `v22.23.0` from the validated nvm path; service `active`.
- No redeploy required for convergence commit `f0198ee`: `git diff --name-only dcd53ca1..f0198ee` contains no paths under `src/`, `deploy/`, package manifests, `next.config.ts` or middleware — the diff is docs/tooling only.
- Login page reachable; the platform has no fixed demo accounts by design (E2E creates random credentials), so no demo login check applies.
- Access path used: SSH relayed through the trusted fleet Mac; direct non-interactive SSH from this agent host to sin-supabase is not provisioned.

## SSH-Zugang OCI (dauerhaft, kein Tailscale-Check)

Tailscale SSH wurde auf sin-supabase deaktiviert (2026-09-01) weil der
Check-Mode periodisch eine Browser-Auth erzwang und Deployments blockierte.

- Port 22: normaler sshd (openssh), keine Tailscale SSH-Interception mehr
- Port 2222: zweiter sshd als Fallback
- SSH-Config-Alias: `sin-supabase` (Port 22) + `sin-supabase-direct` (Port 2222)
- Auth: SSH-Key (id_ed25519) - kein Tailscale Browser-Login mehr nötig
- Wenn Tailscale SSH wieder aktiviert werden soll: `sudo tailscale set --ssh=true`
  (ACHTUNG: nur über Port 2222 verbinden, sonst Session-Abbruch)

## SLO probes and alerting (T-0123)

`scripts/t0123-slo-probes.mjs` (`npm run test:slo`) runs five component-local probes and emits one JSON line per probe plus a summary line, each carrying a `correlation_id` for joining with app logs:

| Probe | Component | Target |
|---|---|---|
| `web_health` | App + SQLite | `/api/health` 200 `ok:true` with `database=ready` within 3s |
| `web_homepage` | Landing render | `/` returns 200 within 5s |
| `auth_authority` | SIN Supabase OSS | GoTrue answers (<500) within 3s |
| `dispatch_fresh` | Notification outbox dispatcher | run evidence within 15 min (journald) or timer active |
| `backup_fresh` | Backup pipeline | newest backup evidence within 48h |

Exit code is non-zero when any probe breaches. `SLO_BASE_URL` retargets the run (default `http://127.0.0.1:3010`).

### Business SLOs (T-0133)

Since 2026-09-07 the probe suite additionally measures the product SLOs from real rows (read-only SQLite aggregate over a rolling 30-day window, same SQL as `src/lib/metrics.ts`):

| Probe | Definition | Target | Window |
|---|---|---|---|
| `api_latency` | observed latency of the health and homepage probes | both within their probe targets | per run |
| `business_metrics.booking` | confirmed/completed appointments vs all appointments | ≥ 0.60 | 30 days |
| `business_metrics.matching` | dispatches reaching quote/acceptance vs all dispatches | ≥ 0.40 | 30 days |
| `business_metrics.notif_delivery` | `sent` receipts vs all finalized receipts | ≥ 0.95 | 30 days |

A window with zero eligible rows reports the rate as `no-data` and does not fail the probe — an empty platform must never look like a perfect one. Below a minimum sample of 10 rows per window the rate is reported with a `(low-sample)` marker instead of alerting; thresholds enforce only from n ≥ 10. Denominators and rates are printed in the probe JSON line, so the Kestra/journald history is the time series. In-process reuse of the same aggregates: `computeBusinessMetrics()` in `src/lib/metrics.ts`.

Alert path without a new platform: `deploy/kestra/einfach-hausen-slo*.yml` schedules the probes every 15 minutes through the existing Kestra instance; a breach fails the Kestra execution (visible in execution history/API) and the probe JSON lines land in the Kestra task logs with the failing component name and correlation id. On the host, the same evidence is in journald, so `journalctl -u einfach-hausen-dispatch` and probe lines share correlation ids.

## Backup/restore drill (T-0124)

`scripts/t0124-backup-drill.sh` (`npm run test:backup-drill`, wöchentlich via `deploy/einfach-hausen-drill.{service,timer}`, So 03:00) führt die nicht-destruktive Übung aus: neuestes Backup unter `/var/backups/einfach-hausen` wählen, RPO (Backup-Alter) berechnen, `restore-einfach-hausen.sh BACKUP --stage TMPDIR` (Checksums, SQLite-Integrität, Archive), `PRAGMA integrity_check` auf der wiederhergestellten DB, Nachweis der `private/`-Wiederherstellung, RTO messen. Eine JSON-Evidence-Zeile je Lauf geht an `/var/lib/einfach-hausen/drill-evidence.jsonl`. Fehlende Archive/DB, SQLite-Korruption oder fehlgeschlagene Verifikation brechen laut mit Exit 1.

Einrichtung (einmalig): `sudo cp deploy/einfach-hausen-drill.{service,timer} /etc/systemd/system/ && sudo systemctl daemon-reload && sudo systemctl enable --now einfach-hausen-drill.timer`. Der Service ruft das Skript per sudo auf (Backups sind root:0700 aus Datenschutzgründen); dafür ist eine sudoers-Regel nötig: `ubuntu ALL=(root) NOPASSWD: /srv/einfach-hausen/scripts/t0124-backup-drill.sh` in `/etc/sudoers.d/eh-backup-drill`. Solange die Regel fehlt, läuft der Drill manuell per `sudo npm run test:backup-drill`.

### Cloudflare 1033 (Tunnel offline) — Diagnose

Der Cloudflare-Fehler 1033 bedeutet: die Cloudflare-Edge findet keinen verbundenen Tunnel-Connector für den Hostnamen. Auf dieser Host zwei getrennte Tunnel beachten:

- **Produktion** (`einfachhausen.de`): Tunnel `sin-kestra` (`cloudflared-sin-kestra.service`). Probe: `curl -s -o /dev/null -w '%{http_code}' https://einfachhausen.de/api/health` → 200 heißt gesund. Bei 1033: `systemctl status cloudflared-sin-kestra` + `cloudflared tunnel info sin-kestra`.
- **Preview/Test-Hosts** (`einfach-hausen-preview.delqhi.com`, `napp.delqhi.com`): Tunnel `d81a6644` (`cloudflared-eh-preview.service`), seit 2026-09-02 absichtlich deaktiviert (T-0210-Abschluss). Diese Hostnames liefern dauerhaft 1033/530, bis der Tunnel wieder aktiviert wird — kein Incident.

Einzelner 1033 im Log bei sonst 200-Antworten ist ein transienter Edge-Event (z. B. Connector-Rotation während eines Deploys) und kein Handlungsanlass; andauernde 1033 auf der Produktionsdomain erst.

## Disaster Recovery (T-0137)

Reproduzierbare Wiederherstellungsabläufe für DB-Verlust, korrupte Releases und fehlerhafte Migrationen: **docs/DISASTER_RECOVERY_RUNBOOK.md**. Verifiziert gegen T-0136/T-0124 (gleicher Restore-Kern: Checksummen → integrity_check → Stage). Recovery-Ziele (Betriebsnachweis): RPO = Backup-Alter (stündliche Backups), RTO < 15 min produktiv (Drill misst 5s für Verify+Stage).

## Infrastruktur-Kostenbasis & Forecast (2026-09)

Einfache, transparente monatliche Kostenbasis ohne FinOps-Overhead (Stand: September 2026, Anforderung aus Issue #10):

| Dienst / Komponente | Typ | Kosten / Monat | Anmerkung |
|---|---|---|---|
| **Oracle Cloud (OCI)** | VM (Always Free / Ampere A1) | 0,00 € | 4 OCPU, 24 GB RAM, persistent block storage |
| **Cloudflare** | DNS & Argo Tunnel Ingress | 0,00 € | Free Tier / Standard Tunnel ausreichend |
| **STRATO** | Domain & Mail-Routing (MX/SPF/DKIM) | ~4,00 € | Jährliche Abrechnung umgelegt |
| **Stripe** | Zahlungsabwicklung / Connect | Variabel (~1,5 % + 0,25 €) | Nur bei Transaktionen; 0 % Plattformprovision |
| **Gesamte Fixkosten** | | **~4,00 € / Monat** | Extrem schlanke, wartungsarme Kostenstruktur |

**Forecast & Skalierungspfad:**
- Bis 1.000 aktive Nutzer/Monat verbleiben die Infrastrukturkosten stabil unter 10,00 €/Monat.
- Bei Überschreiten der OCI Free-Tier-Grenzen (z. B. Backup-Speicher > 100 GB) skaliert Block-Storage mit ~0,025 €/GB/Monat.
- Transaktionskosten tragen sich über die gebuchten Partner-Tarife und Vergütungen aus dem freiwilligen Vergleichsbereich selbst. Eigentümer zahlen nichts: es gibt keine Mitgliedschaft und keine kostenpflichtigen Pakete für Eigentümer (Issue #132).

## Feature-Flag lifecycle (T-0139)

Flags are defined in `src/lib/feature-flags.ts` (`FLAG_DEFAULTS`) and each definition carries `owner` (role from `docs/COMPANY_IDENTITY.md`) and `expiresAt` (ISO date). `scripts/feature-flag-lifecycle.mjs` (`npm run test:flags`, release-gate Layer 1) fails the release when:

1. a definition lacks `owner` or a parseable `expiresAt`,
2. a flag's expiry passed while it is still enabled in the DB,
3. the DB contains rows for a flag that is no longer defined (orphaned rows),
4. a non-production-toggleable flag is enabled.

**Removal after rollout** is part of the release process: delete the flag gates in code, remove the definition, delete the DB row (`DELETE FROM feature_flags WHERE key = '...'`), note the removal in the release PR — the lifecycle check verifies no rows remain. `--simulate-expired` exercises the expired-enabled branch without waiting for real dates.

## Data inventory (T-0146)

`docs/privacy/DATA_INVENTORY.json` is the machine-readable record of every table (purpose, retention key, personal flag). `npm run test:inventory` (release-gate Layer 1) keeps it in sync: every table must be classified, personal tables need purpose + retention from the legend, and any new column matching sensitive patterns inside a **non-personal** table fails the gate until classified. Retention execution lives in T-0145 (`src/lib/retention.ts`, dispatcher) and the deletion workflow in T-0144.


## Laya-Router — 2026-09-22
Gemeinsamer Assistentenpfad für API und Hausmanager mit eigentümergebundenen Lese-Tools, Laya-Entscheidungen, Jev nur bei Überlast/Transportfehler und DeepSeek/BYOK ausschließlich hinter dem bestehenden generativen Kontingent. Architektur, Grenzen, Tests und Installation: [AI_ROUTER.md](AI_ROUTER.md).
26 JS-Regressionen und 2 Python-Service-Tests bestanden; Kalender-Review-Fund behoben. Modellmessung führte zu expliziten Produktrouten und Rückfrage bei Confidence < 0.9. Jev-/DeepSeek-Betreiberkeys fehlen bislang. Installation/Deployment wird separat mit tatsächlichem Ergebnis nachgetragen. Keine Änderung an Dokument-OCR in dieser Welle.
