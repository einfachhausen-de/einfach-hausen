> **Aktueller Designvertrag · 2026-09-06:** Jerry hat Atelier 02 ausdrücklich freigegeben. Verbindlich sind DESIGN.md, packages/eh-design und der Skill SIN-EH-design. Eigenständige Änderungen am Markenstil sind verboten. Vollständige Übergabe: docs/brand/system/HANDOFF.md; kompletter Quelltext: docs/brand/system/SOURCE.md. Frühere Statusangaben zu noch offenen Stilentscheidungen sind historisch. Restmigration: EH-BRAND-05-WEB, -APPS, -CRM, -HUB. Unternehmensidentität bleibt docs/COMPANY_IDENTITY.md (Gina Inhaberin/Geschäftsführerin, Jeremy Entwickler).

# Einfach Hausen — Production Handover and Continuation Runbook

**Canonical company identity:** `docs/COMPANY_IDENTITY.md` — **Gina Schulze** ist Inhaberin und Geschäftsführerin. **Jeremy Schulze** ist ausschließlich Developer / technische Entwicklung. Diese Rollen gelten für Impressum, Legal-Modals, Dokumentation und generierte Inhalte. Keine unbestätigten Rechts-/Registerdaten erfinden.

## Repository checkpoint — Public Website Finish (2026-09-05)

Der lokale `main` enthält den operator-freigegebenen Public-Website-Finish. Er ändert **nicht** die Produktionsinfrastruktur und **nicht** die App-Informationsarchitektur; er vertieft die öffentliche Website innerhalb des bestehenden Design-Systems. Enthalten sind das Leistungen-Megamenü, 12 echte Service-Unterseiten, `/beratung`, `/notfall`, `/versicherung`, `/immobilienverkauf`, Discovery-/SEO-Finish und erweiterte Browser-/Visual-Gates.

Lokale Release-Evidence vor Push/Deploy: Next.js Production Build **115/115**, `test:public-site` PASS, `test:public-nav` PASS, Full E2E PASS, Visual **72/72**, Lint 0 Fehler und `git diff --check` PASS. Diese Evidence ersetzt **keine** OCI-Live-Verifikation. Vor Deployment weiterhin den kanonischen OCI-Deploypfad und anschließend Public Smoke/Health ausführen; niemals lokale `.next`-Artefakte auf Produktion kopieren.

**Status snapshot:** 2026-08-31 — **Production runs `b74876a` on OCI (`/srv/einfach-hausen`), deployed through the mandatory unified release gate (T-0157, 10/10 green) with live smoke 200 on `/`, `/preise`, `/login`, `/admin/login`, `/api/health`. Product Final Acceptance Website/Homeowner/Partner (T-0160/T-0161/T-0162) passed with evidence on 2026-08-31 (evidence dir `.sin-gpt-web/evidence/acceptance-20260831/`). SIN Supabase OSS on OCI remains the production auth/data authority. Self-hosted HA/PITR/failover must be re-proven on the actual OCI stack before being described as active.**

**Execution boundary:** complete the one-time verified Mac-M1 → GitHub handoff, then run `einfach-hausen` engineering and Prime Agent Luna on **OCI-VM**. GitHub is the only transfer boundary; do not copy a dirty Mac working tree directly to OCI. Supabase Cloud is not part of the target architecture.

This document is the canonical **production operations** continuation point. Repository/agent continuation starts at [`NEXT_AGENT.md`](NEXT_AGENT.md). All agents share one engineering goal and one transactional taskplan; remaining release-wide work is strictly T-0042 Final Acceptance followed by T-0043 Final Convergence/Handover unless acceptance creates a canonical remediation task.

### T-0165 visual/presentation contract

Presentation work follows **Notion App Design → `DESIGN.md` → `docs/PRESENTATION_BRAND.md` → `presentation/premium/brand.config.json` → `presentation/premium/deck.html`**. Notion is a visual reference, not automatic product truth. The presentation uses the repository's real logo asset unchanged, keeps Owner and Pro on the same light visual foundation, uses a 3px phone frame (5px maximum), and treats dark slides as targeted accents. Any future app-design change must be checked through this chain before a new deck export.

## 0. Latest continuation checkpoint — 2026-08-25

**Canonical next-agent entry:** [`NEXT_AGENT.md`](NEXT_AGENT.md).

### Current code/worktree

- Production release remains `dcd53ca1f463e9d64ee3fc6838d1cdb3fb2bb557` from T-0041.
- Local Mac `main` at the 2026-08-25 coordination checkpoint is `16fad400812c5fe4299e163396809a45fbf17714`, one local commit ahead of `origin/main` (`dcd53ca1f463e9d64ee3fc6838d1cdb3fb2bb557`). Final T-0043 convergence must fetch and re-verify all three states instead of assuming equality.
- The local worktree currently contains documentation/Archify coordination changes plus generated runtime/cache paths. Preserve and classify them; do not blindly reset/clean.
- Production intentionally retains only the two runtime media links `data/private -> /var/lib/einfach-hausen/private` and `public/uploads -> /var/lib/einfach-hausen/uploads` as untracked paths. `deploy/update-on-oci.sh` permits only these verified paths and still fails closed on every other tracked/untracked change.
- T-0040 independent gauntlet, T-0044 integration/push and T-0041 production deployment are complete. **T-0042 is the sole current execution target, followed by T-0043.** Use `sin-gpt-web-state` as the only authority for task changes.

### Deployment contract — production verified

Two deployment edge cases were found and fixed before acceptance. Commit `cf56a824` permits only the canonical persistent runtime symlinks during the clean-tree gate. Commit `dcd53ca1` prepends the validated Node 22 directory to `PATH`, because npm uses `#!/usr/bin/env node`; this prevents npm lifecycle/Next.js workers from silently falling back to `/usr/bin/node` 20.20.2. The successful production build and runtime both used Node `v22.23.0` and the build used a disposable `/tmp` SQLite path rather than production data.

### Persistent storage checkpoint

- Database: `/var/lib/einfach-hausen/einfach-hausen.db`
- Private files: `/var/lib/einfach-hausen/private`
- Upload persistence: `/var/lib/einfach-hausen/uploads`
- Verified pre-deploy backup: `/var/backups/einfach-hausen/einfach-hausen-20260824T220100Z` (manifest + SQLite + private/upload archives; restore dry-run PASS)

Do not overwrite or delete these paths during deployment.

## 1. Current state in one minute

| Area | State | Evidence / next action |
|---|---|---|
| Repository | Release deployed | `main`, `origin/main`, and OCI all matched `dcd53ca1f463e9d64ee3fc6838d1cdb3fb2bb557` |
| Production runtime | Healthy | `einfach-hausen.service`, Kestra proxy socket and backup timer active; local and Kestra-path health returned `ok=true`, `database=ready` |
| Production app URL | Live | `https://einfachhausen.de` serves the new release; `/sicherheit`, `/app/settings`, `/app/insurance`, `/partner`, `/impressum`, `/datenschutz` all returned HTTP 200 |
| Cloudflare tunnel | Healthy | `cloudflared` active; DNS, QUIC, HTTP/2 and Cloudflare API prechecks PASS |
| Cloudflare zone / DNS | Active publicly | 1.1.1.1 and 8.8.8.8 returned `aaron.ns.cloudflare.com` + `josephine.ns.cloudflare.com`; canonical HTTPS works through Cloudflare |
| `www` | Healthy | `https://www.einfachhausen.de/` resolves to final `https://einfachhausen.de/` with HTTP 200 |
| Old temporary route | Healthy fallback | `einfach-hausen.delqhi.com/api/health` still returned HTTP 200 during acceptance; retain until final release handover decides removal |
| Mail DNS | Verified live | MX, DMARC, DKIM selector, autodiscover SRV and autoconfig CNAME all match the intended STRATO configuration |
| Stripe | Verified live | `sin-stripe ready` PASS; doctor reports charges/payouts enabled and canonical live webhook present, enabled and subscribed to required events |

## 2. Target architecture

```text
GitHub verified release SHA
  -> OCI-VM canonical engineering/runtime host
      -> Next.js application
      -> SIN Supabase OSS on OCI
          -> Auth
          -> Postgres
          -> Storage
          -> Pooler/Supavisor as deployed

Internet
  -> Cloudflare zone: einfachhausen.de
      -> Cloudflare security/TLS
      -> Cloudflare Tunnel: sin-kestra
      -> 127.0.0.1:3010
      -> systemd: einfach-hausen.service
      -> Next.js application
```

Mac-M1 is source/release/recovery only after this handoff. OCI work starts from a Git commit, never from a copied Mac working tree.

The app must remain loopback-only. Do **not** expose port `3010` directly to the Internet.

### Runtime locations

- Code: `/srv/einfach-hausen`
- Environment: `/etc/einfach-hausen.env` (mode `0600`, never commit)
- Database: `/var/lib/einfach-hausen/einfach-hausen.db`
- Private media: `/var/lib/einfach-hausen/private`, bind-mounted to `/srv/einfach-hausen/data/private`
- Legacy/public upload area: `/var/lib/einfach-hausen/uploads`, bind-mounted to `/srv/einfach-hausen/public/uploads`
- Verified local backups: `/var/backups/einfach-hausen`
- Service: `einfach-hausen.service`
- Tunnel: `sin-kestra`
- Health endpoint: `/api/health`

The existing Kestra health path remains private:

`172.28.50.1:3010 -> systemd-socket-proxyd -> 127.0.0.1:3010`

## 3. Domain cutover status

### Desired Cloudflare nameservers

- `aaron.ns.cloudflare.com`
- `josephine.ns.cloudflare.com`

The STRATO nameserver change has propagated publicly. During T-0041, both 1.1.1.1 and 8.8.8.8 returned the two Cloudflare nameservers above, and the canonical HTTPS routes were served successfully through the active Cloudflare tunnel. A direct `a.nic.de` short query returned no lines in that specific probe, so public resolver + working HTTPS/tunnel evidence is retained rather than inventing registrar output.

### Required Cloudflare records

- `einfachhausen.de` → Cloudflare Tunnel target for `sin-kestra`
- `www.einfachhausen.de` → same tunnel/application, then redirect to apex

At the last local inspection, the tunnel target was:

`818df379-5d51-4f83-9cd9-d0f5d327b438.cfargotunnel.com`

Do not create duplicate A records pointing at the OCI host. The tunnel is the intended public ingress.

## 4. Cloudflare security baseline

Prepared settings:

- SSL/TLS mode: **Full (strict)**
- Always Use HTTPS: enabled
- Minimum TLS: **1.2**
- TLS 1.3: enabled
- HTTP/3: enabled
- Browser Integrity Check: enabled
- Cloudflare security level: Medium
- `www` intended to redirect to the apex domain

After activation, verify these settings through Cloudflare/API instead of relying only on this document. Enable DNSSEC only after the zone is active and follow Cloudflare's exact registrar/DS instructions; do not guess a DS record.

## 5. Mail DNS that must survive the cutover

Before replacing the authoritative DNS, the active STRATO DNS exposed:

- MX: `5 smtpin.rzone.de.`
- DMARC: `v=DMARC1;p=reject;`
- DKIM selector: `strato-dkim-0002._domainkey`
- Autodiscover SRV: `_autodiscover._tcp` → `0 100 443 autoconfigure.strato.de.`
- Autoconfig: `autoconfig` → `autoconfigure.strato.de.`

The exact DKIM public key is intentionally not duplicated here; read it from current DNS/Cloudflare and compare against STRATO before changes.

**Post-cutover requirement:** query the active Cloudflare-authoritative zone and compare MX, DMARC, DKIM and autoconfig/autodiscover with the intended STRATO mail configuration before declaring mail migration complete.

## 6. Production environment contract

```text
NEXT_PUBLIC_APP_URL=https://einfachhausen.de
DATABASE_PATH=/var/lib/einfach-hausen/einfach-hausen.db
STRIPE_SECRET_KEY=<runtime secret>
STRIPE_WEBHOOK_SECRET=<runtime secret>
STRIPE_CURRENCY=eur
ADMIN_PASSWORD=<runtime secret>
```

Secrets are canonical in SIN-Infisical where applicable and must never be copied into Git, screenshots, chat output, evidence files or documentation.

## 6a. Produktions-Auth-Grenze — T-0168 Deep Research

Für die nächste Produktionskonvergenz gilt zusätzlich:

- Supabase ist die serverseitige Identity Authority für geschützte Owner-/Provider-Flächen.
- `mh_session`/SQLite darf nur in einem expliziten Local-Dev-Modus verwendet werden; ein solcher Modus muss in Produktion fail-closed sein.
- Es gibt keinen stillen Fallback von Supabase auf lokale Auth.
- `AuthContext` ist keine Sicherheitsgrenze; geschützte Server Components, Route Handler und Server Actions autorisieren serverseitig.
- Die Zuordnung von Supabase-Subject zu bestehender App-User-ID muss vor Migration oder Schemaänderung explizit nachgewiesen werden.
- Finale T-0168-Acceptance benötigt frische authentifizierte Round-3-Evidence unter `.sin-gpt-web/evidence/T-0168/round3/` sowie grüne Security/Auth/Visual/TypeScript/Build/Diff/GitNexus-Gates.

Vollständiger Entscheidungsstand: [`T0168_DEEP_RESEARCH.md`](T0168_DEEP_RESEARCH.md).

## 7. Stripe cutover

Canonical intended endpoint:

`https://einfachhausen.de/api/stripe/webhook`

Relevant application routes derive their origin from `NEXT_PUBLIC_APP_URL`.

After DNS activation:

```bash
cd /Users/jeremy/dev/wow-my-zsh
shared/skills/sin-stripe/scripts/sin-stripe ready --project einfach-hausen
shared/skills/sin-stripe/scripts/sin-stripe doctor --project einfach-hausen \
  --webhook-url https://einfachhausen.de/api/stripe/webhook
```

Inspect the live Stripe endpoint and ensure its signing secret matches the OCI runtime. Do not create duplicate endpoints unnecessarily. Never charge a real customer merely as a health check.

## 8. Immediate continuation checklist

### A. Check registry propagation

```bash
for r in a.nic.de 1.1.1.1 8.8.8.8; do
  echo "@$r"
  dig +short NS einfachhausen.de @$r
done
```

Success requires the two Cloudflare nameservers consistently.

### B. Confirm Cloudflare zone is active

Verify through the existing Cloudflare account/API. Credentials are outside Git; never print tokens.

### C. Verify public DNS and HTTPS

```bash
dig +short CNAME einfachhausen.de
curl -fsSI https://einfachhausen.de
curl -fsS https://einfachhausen.de/api/health
curl -fsSI https://www.einfachhausen.de
```

Expected: valid certificate, health JSON with `"ok":true`, and `www` ending at the apex domain.

### D. Verify mail records

```bash
dig +short MX einfachhausen.de
dig +short TXT _dmarc.einfachhausen.de
dig +short TXT strato-dkim-0002._domainkey.einfachhausen.de
dig +short SRV _autodiscover._tcp.einfachhausen.de
dig +short CNAME autoconfig.einfachhausen.de
```

### E. Verify Stripe

Run `sin-stripe doctor`, then inspect webhook delivery status and event coverage.

### F. Keep the fallback until acceptance is complete

Do not remove `einfach-hausen.delqhi.com` until the new domain, health endpoint, HTTPS, redirect, mail records and Stripe endpoint all pass.

## 9. Deployment and recovery

Deploy on OCI as the `ubuntu` application owner (the script elevates only the privileged filesystem/systemd steps itself):

```bash
/srv/einfach-hausen/deploy/update-on-oci.sh
```

Sequence: `verify clean main + Node 22 -> prepare persistent paths -> copy-only legacy media migration -> pre-deploy online backup when DB exists -> git fetch -> fast-forward main -> npm ci -> disposable-DB build -> systemd reload/restart -> local DB-aware health check`. The script does not use `git reset --hard` and does not delete or overwrite production data.

Diagnostics:

```bash
sudo systemctl status einfach-hausen.service --no-pager
sudo journalctl -u einfach-hausen.service -n 120 --no-pager
curl -fsS http://127.0.0.1:3010/api/health
```

A previous restart loop was caused by a missing production `.next` build. A complete build followed by service restart restored health. Inspect the journal first; do not delete persistent data as a first response.

Backups:

- timer: `einfach-hausen-backup.timer`
- local retention: seven days by default
- private bucket: `einfach-hausen-backups`
- canonical helper: `scripts/backup-einfach-hausen.sh`
- method: SQLite online backup + `PRAGMA integrity_check`, private/upload archives, SHA-256 manifest before upload
- recovery proof: `scripts/restore-einfach-hausen.sh BACKUP_DIR --dry-run` validates checksums, SQLite integrity and private/upload file counts in a temporary directory; it has no production-overwrite mode

## 10. Verification baseline already achieved

Release verification retained from the independent convergence gauntlet and refreshed in production:

- `npm run lint` passed on the accepted application tree
- production `npm ci` reported 0 vulnerabilities
- production `npm run build` passed on Node `v22.23.0` and generated all 60 pages
- focused security suite: **133 passed, 0 failed**
- T-0003 webhook/private-media suite: **43 passed, 0 failed**
- pre-deploy backup `einfach-hausen-20260824T220100Z` passed non-destructive restore dry-run
- pre-/post-deploy SQLite `PRAGMA integrity_check`: `ok`; table count 59 -> 59, users 4 -> 4, jobs 0 -> 0
- local and Kestra-path health both returned `ok=true` with `database=ready`
- public canonical routes and `www` redirect passed; old fallback health remained HTTP 200
- Stripe readiness/doctor passed for the canonical live webhook without issuing a real charge

## 10a. Technical product-completion v2 + HA (2026-08-27) — historischer Planungsstand

Baseline `dcd53ca1` bleibt Rollback-Punkt. Die 2026-08-27 geplante **HA-Produktion** (T-0100..T-0131 + T-0166 Supabase HA-Migration + T-0167 Capacitor Release) wurde **nie ausgeführt**: Der laufende Production-Code (Stand 2026-08-29, oci/t0169) nutzt SQLite (`DATABASE_PATH`) als App-Datenbank, SIN Supabase OSS ausschließlich als Auth-Autorität, und es existiert kein Storage-Adapter. Verifizierter Runtime-/Deploy-Pfad: `deploy/update-on-oci.sh` (rsync persistenter Symlinks, Node 22, Build, Backup, systemd-Restart, Health-Check). Externe Blocker: siehe `docs/EXTERNAL-BLOCKERS.md`.

## 11. Repository hygiene and in-progress work

After T-0041, tracked release work is committed. The Mac controller still has local generated coordination/cache directories (`.sin-gpt-teamwork/`, `scripts/__pycache__/`) to classify in final convergence. Production intentionally has only the two canonical untracked runtime symlinks described above. **Do not run `git reset --hard` or `git clean -fd` blindly.**

Primary continuation documents:

- `docs/PRODUCTION_HANDOVER.md` — this handover
- `docs/OPERATIONS.md` — OCI operations
- `deploy/README.md` — deployment paths
- `docs/ARCHITECTURE.md` — application architecture
- `docs/PRODUCT_VISION.md` — binding product model
- `AGENTS.md` — mandatory workflow

## 12. Completion definition

The migration is complete only when all are true:

- [x] public resolvers return `aaron.ns.cloudflare.com` and `josephine.ns.cloudflare.com`
- [x] Cloudflare-backed canonical HTTPS is active and tunnel prechecks pass
- [x] `https://einfachhausen.de` loads
- [x] `/api/health` returns OK publicly with `database=ready`
- [x] `www` redirects to apex
- [x] active Cloudflare tunnel transport checks pass
- [x] STRATO mail DNS is verified live
- [x] canonical Stripe live webhook is present/enabled and Stripe readiness/doctor pass
- [x] old fallback remained available through production acceptance
- [x] DNSSEC was not guessed or changed without an exact Cloudflare/registrar DS workflow

T-0041 production cutover is complete. Any optional DNSSEC enablement or fallback retirement is an explicit post-release operator hardening action, not an unreported application deployment gap.

<!-- SIN-GPT-WEB-HANDOVER:BEGIN -->
## SIN GPT Web completion / handover sync

- Last synchronized task: `T-0167`
- Canonical taskplan: `.sin-gpt-web/taskplan.sqlite3`
- Canonical repo goal: Einfach Hausen vollständig fertigstellen — Owner-App/Website auf Produktionsqualität konvergiert (Notion-Original-Referenzen), Auth via self-hosted SIN Supabase, App-Daten SQLite
- Resume rule: read/validate the canonical taskplan (.sin-gpt-web/taskplan.sqlite3) and continue its highest-priority eligible task
- Taskplan sync: `pass`
- Synchronized at: `2026-08-27T00:00:00+00:00`
- Contract: `sin-gpt-web-completion-handover-v1`
<!-- SIN-GPT-WEB-HANDOVER:END -->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0100
updated: 2026-08-31T20:52:50+00:00
actor: local-agent
evidence-sha256: f42a70c09249785cee78d453593730b02e462563c2ea52dd3f96ff13d447e5a6
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0101
updated: 2026-08-31T20:52:50+00:00
actor: local-agent
evidence-sha256: ad159f2cc950ebf498af6d9f88b455def41b635fe25d5b965a5a13b3ca89b222
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0102
updated: 2026-08-31T20:52:51+00:00
actor: local-agent
evidence-sha256: 2e7357efbd529ac1f58e185753fb74a4020585d1823d89156e4b2506b6f36dc2
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0103
updated: 2026-08-31T20:52:52+00:00
actor: local-agent
evidence-sha256: 9f513f7079d3261f78b90b6bd9147004c81eee2c312db6be84f3df048cbcd64a
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0104
updated: 2026-08-31T20:52:52+00:00
actor: local-agent
evidence-sha256: baeb3b5cc21ca5732de76caf6600b1e9e796a5df3a459eb6ee6aa3c10927d7e1
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0105
updated: 2026-08-31T20:53:01+00:00
actor: local-agent
evidence-sha256: 8f8c2cb7dbb63a32f95b7554a3432704679483f51eb02ca0a1876028014cadc5
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0106
updated: 2026-08-31T20:53:02+00:00
actor: local-agent
evidence-sha256: 28e3a69bfc9528cee8757764023da67b82126fb41f50201e9db1a69ef64db976
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0107
updated: 2026-08-31T20:53:02+00:00
actor: local-agent
evidence-sha256: a4d0746af463ce97c8c6bfd1c870936634047e723fc48a76bca188862de4567d
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0108
updated: 2026-08-31T20:52:52+00:00
actor: local-agent
evidence-sha256: 8b95638cc3257cbeb6b6c700584c9d1c131e195a1a2cdb0831b6d5633cfb338f
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0109
updated: 2026-08-31T20:53:03+00:00
actor: local-agent
evidence-sha256: b7ba6dde2f1cca415fa54b2d0c4f96699805deca3a08c09163dee092774c63f6
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0110
updated: 2026-08-31T20:52:53+00:00
actor: local-agent
evidence-sha256: a73593c023c7d82fc6306ea2fce3f45eaac6fe94ff94c60589a048581736f648
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0164
updated: 2026-08-31T20:52:58+00:00
actor: local-agent
evidence-sha256: 6e808dd8296359a6ed71a9bc0233622843628ce933fabc8f2bd6be9c18a06087
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0165
updated: 2026-08-31T20:52:59+00:00
actor: local-agent
evidence-sha256: 35e2db2bb0dd5858f605cfd6057a51bd5a2cc1733437cbe03b37f501140d5259
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0167
updated: 2026-08-31T20:53:05+00:00
actor: local-agent
evidence-sha256: fbb81df390757352fa4b5eef8a9d588c872e51e967bf063af55523cd0790203a
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0168
updated: 2026-08-31T20:53:05+00:00
actor: local-agent
evidence-sha256: cddef743ddcbea9daa1ac14e2f401c5e68470280862077bedb48542798d521e3
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0169
updated: 2026-08-31T20:53:06+00:00
actor: local-agent
evidence-sha256: 9e54c89cf783fdec3bfac2b296c5cf87812231375dc96e2f9f25c4b4aa627210
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0173
updated: 2026-08-31T20:53:06+00:00
actor: local-agent
evidence-sha256: 3b42e8e7560437f09e36c1c1afc42223cc10fc5140880d68b9edab0e386d9c4d
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0170
updated: 2026-08-31T20:53:08+00:00
actor: local-agent
evidence-sha256: 3301600a2ffff136c37ca355c7a51268296d9f2959e02ab5de8480a77935685f
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0171
updated: 2026-08-31T20:53:08+00:00
actor: local-agent
evidence-sha256: fd8973c6f65fbc9de171997c767818934e0bcd1b2dd47cb00d312955bb498efa
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0140
updated: 2026-08-31T20:52:55+00:00
actor: local-agent
evidence-sha256: 9a98b49675963b2ea908a68a789931a1ce3a120c18862d3fba049bda0fb087c7
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0141
updated: 2026-08-31T20:52:55+00:00
actor: local-agent
evidence-sha256: d2ac93b376b977a7e8c1e97fa78f2e3cc4a6fa132413259427293fa43456d185
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0172
updated: 2026-08-31T20:53:09+00:00
actor: local-agent
evidence-sha256: dcd867da25695f1168a7f176d082ca52bdc934dcb9e40f949e46251cbed16821
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0174
updated: 2026-08-31T20:53:07+00:00
actor: local-agent
evidence-sha256: e1e1520308294faa680b6bcbe176f96dc1d6131f95d218cc19ab176a39d3e9e9
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0175
updated: 2026-08-31T20:53:07+00:00
actor: local-agent
evidence-sha256: da531fc298590aed92dd381b806c51d629170dc0414b589bddcdb3ac7a92d208
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0176
updated: 2026-08-31T20:53:09+00:00
actor: local-agent
evidence-sha256: 48a6469d9986ed404e1e7aeabe1156491db410f54682f13015cd57bb8a212e48
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0177
updated: 2026-08-31T20:52:59+00:00
actor: local-agent
evidence-sha256: 9b8b11fb86f4f29f8111ff8159cfd63f0d8147ad9c9fe8172abe609087578c9e
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0148
updated: 2026-08-31T20:52:56+00:00
actor: local-agent
evidence-sha256: 4ef622af886af3eec0fcee15e0c9b6f3701562e2b54c557679f7865d0015c705
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0149
updated: 2026-08-31T20:52:56+00:00
actor: local-agent
evidence-sha256: ee7dd33a827a4186797e2e9fd11b46d1d34b100736afd7c3edb1ecccd9661465
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0150
updated: 2026-08-31T20:52:57+00:00
actor: local-agent
evidence-sha256: 8408674ed32c856ac5fa4c249f081c989efe634068d4e1c18a36080b76426a4d
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0158
updated: 2026-08-31T20:52:57+00:00
actor: local-agent
evidence-sha256: 1334808461c1eefcd702dde2d78c41249acef0f3a9ad16fb200938bea3b44d16
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0159
updated: 2026-08-31T20:52:58+00:00
actor: local-agent
evidence-sha256: 4f805b7450d7a6291c49d70fbd741f091ce1c5cbd8e5e3de65e85b8daa1590aa
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0135
updated: 2026-08-31T20:52:54+00:00
actor: local-agent
evidence-sha256: 8cc3663b0397c2fbcef390d333845930ad753ab448184830a67735e6b2b43ac0
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0004
updated: 2026-08-22T16:24:18+00:00
actor: local-agent
evidence-sha256: 4aaa04f685e833bd81528668f15ce9ca3bd1e3e37227af5d8e2fb1df720a513a
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0005
updated: 2026-08-22T17:06:16+00:00
actor: local-agent
evidence-sha256: fa183425e21f31b54cdc90edc511fb1218cf517590a404b9fb51fd05e56fb6da
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0200
updated: 2026-08-30T04:10:43+00:00
actor: local-agent
evidence-sha256: 425e861d61478080b23cc52ad6b64973eb901e909bbe35dd7fb24a555e299358
-->
<!-- SIN-GPT-WEB-HANDOVER
task: T-0201
updated: 2026-08-30T04:29:48+00:00
actor: local-agent
evidence-sha256: c5758386de9a32943594941ee15b2faf7dd48bcd822565e0419448383e33c180
-->
<!-- SIN-GPT-WEB-HANDOVER
task: T-0202
updated: 2026-08-30T04:39:54+00:00
actor: local-agent
evidence-sha256: 0bc75649da580b92e8c385c0ce01f150f9b48f18b1ac0d2c9ee40525373e504f
-->
<!-- SIN-GPT-WEB-HANDOVER
task: T-0203
updated: 2026-08-30T04:59:52+00:00
actor: local-agent
evidence-sha256: b734c3298856af57db7cbd01c11010da44ffcc25472c8142ae1011378a1a4699
-->
<!-- SIN-GPT-WEB-HANDOVER
task: T-0204
updated: 2026-08-30T12:37:24+00:00
actor: local-agent
evidence-sha256: 26d2c37b44b0e2ecdd412fa38e9987742b09de7fdb3d65324b840eee1997f5d8
-->
<!-- SIN-GPT-WEB-HANDOVER
task: T-0205
updated: 2026-08-30T12:37:24+00:00
actor: local-agent
evidence-sha256: f1288185ef3bec19c87d3ccaf8e935f8a33480e8db7f734bae58d6874f3a4d43
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0042
updated: 2026-08-31T20:52:48+00:00
actor: local-agent
evidence-sha256: b0522c720f2d26ef171afa4f8b0bd77eb82cd987694ae7791144c8df2c9124fd
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0043
updated: 2026-08-31T20:52:48+00:00
actor: local-agent
evidence-sha256: 7690208a2287a2d7d24bc2b266c299ac0cdbdaac3e76839323fb142c4ea23138
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0049
updated: 2026-08-31T20:52:49+00:00
actor: local-agent
evidence-sha256: 0d6781d978ed15bc779a17b686785e5efe3810adb2563c2731c51acc8f2f82c7
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0157
updated: 2026-08-31T21:16:05+00:00
actor: local-agent
evidence-sha256: 7f99e3ef8bfd11d211e6dbda80fa766914a185971e4f6883515209aba957fb5f
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0160
updated: 2026-08-31T22:25:51+00:00
actor: local-agent
evidence-sha256: a0374312071e4a6d50a86e2706a720cb563cff292dd03c20102c6c0ac8b63098
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0161
updated: 2026-08-31T22:54:54+00:00
actor: local-agent
evidence-sha256: 8347892ea96120456d7b66b9aba1440561a66d689fce427bda41928e3e8003b4
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0162
updated: 2026-08-31T22:54:54+00:00
actor: local-agent
evidence-sha256: ff5ccd0484ed2266c6ce264e4b9f21b41f1bd97f7e8c73ff4c98e9216edf19cd
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0163
updated: 2026-08-31T22:56:47+00:00
actor: local-agent
evidence-sha256: fb1882e2df32385413315728fdb2731a84376c39873250aa2cf0335a2c913c98
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0154
updated: 2026-09-01T00:56:58+00:00
actor: local-agent
evidence-sha256: 83e5ed487aff86dee8b825d9f06d859654d292349ec6538442ac1f725c3dbe1b
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0152
updated: 2026-09-01T01:03:10+00:00
actor: local-agent
evidence-sha256: 75fc109f1509113951e589eae987093b5e6ae117d9fd29e758a6c673897685d3
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0153
updated: 2026-09-01T01:03:10+00:00
actor: local-agent
evidence-sha256: 08da5c23cd9a4bb84512af6dc432989154d9da35f011f18bf9ef15fb7a650193
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0155
updated: 2026-09-01T01:47:14+00:00
actor: local-agent
evidence-sha256: 02c7cb988ff4f3990fdd17d9a4772d50152245ab2becbbd66f768202ec391bc8
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0156
updated: 2026-09-01T03:30:24+00:00
actor: local-agent
evidence-sha256: 994ea2169cfa09d65fa7fa4e2b29c4f8e02de905c613b7d24ebd946ec7c7d4b0
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0115
updated: 2026-09-01T03:30:25+00:00
actor: local-agent
evidence-sha256: ef7edcae3cf6bd3ad470c34205fa815916c109e4709b0298ac4f0a4068e48968
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0111
updated: 2026-09-01T12:44:55+00:00
actor: local-agent
evidence-sha256: 87e072d5e2c574dbf26ce3c530c85fb1d6a5a871034892d6adf8dc40ec8a3ae9
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0112
updated: 2026-09-01T12:44:55+00:00
actor: local-agent
evidence-sha256: f193fa11049f920c888558209118f7b7592a95a4e86ace0c92274995b906db8d
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0138
updated: 2026-09-01T13:24:20+00:00
actor: local-agent
evidence-sha256: 0ab111892a30d55ad46e7f6232b32f64656dee72cc4b9937613c3f2a3d9c925a
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0142
updated: 2026-09-01T13:24:20+00:00
actor: local-agent
evidence-sha256: bceab63e963dd389c859027e3e4221a6a50386a99dfad656912ed9445f0038fe
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0113
updated: 2026-09-01T13:55:36+00:00
actor: local-agent
evidence-sha256: 07b6275707f950b590ed96ec928ab841e01791e4761d591f616d20f0fc5e80cc
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0114
updated: 2026-09-01T13:57:24+00:00
actor: local-agent
evidence-sha256: db6e60f478405d43372683fbf7d760ddb32ef5fb7c5c608ca152e3115cca052b
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0116
updated: 2026-09-01T17:55:42+00:00
actor: local-agent
evidence-sha256: cfbef8fb88b67a309e81fa923357ecfc6f2a6808005e9d697e457401171f9ce5
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0117
updated: 2026-09-01T17:55:42+00:00
actor: local-agent
evidence-sha256: 32b178026b6612aa0bc5ea8813b094a8e7b84293e8c9f8a5706a02435767ed03
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0136
updated: 2026-09-01T18:06:52+00:00
actor: local-agent
evidence-sha256: 766040d87c6e2dbae195442af395ea3b2fddc2c114f4fbe4a7963f3a4d6463ea
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0147
updated: 2026-09-01T19:19:57+00:00
actor: local-agent
evidence-sha256: 4149908d9dda7f1397ce06f9aadccce2ae5c038d469a1adeb8e1e3f02d0a2ff9
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0118
updated: 2026-09-01T20:51:22+00:00
actor: local-agent
evidence-sha256: c55fee22cf93a7578d26053014ef8e42b4a7534775e5e1a5d1fd60053eb1d405
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0119
updated: 2026-09-01T22:14:14+00:00
actor: local-agent
evidence-sha256: 0acd76be267c23dd81333e674d9c0eee29d42c3f07154718697fae9f793a26b6
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0210
updated: 2026-09-02T23:18:15+00:00
actor: local-agent
evidence-sha256: 80f9aad504a029dbe80faed7a0cf4c152de5bf88a4b1880edf60f754211dea51
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0211
updated: 2026-09-02T23:18:41+00:00
actor: local-agent
evidence-sha256: 60f232b4e4d8bb71c603011e8a96ba47b0b2b4f04b45106ed5ab759dbc9d69a0
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0120
updated: 2026-09-02T23:49:07+00:00
actor: local-agent
evidence-sha256: 73903ba5ee89d8c893c1f1fd2a10d42aeeba247966ba2045494555aa353d28e5
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0121
updated: 2026-09-02T23:56:26+00:00
actor: local-agent
evidence-sha256: 01f5f6cb64432cac1825787493c591f7d4d2c263eff4860738564f29f1259336
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0122
updated: 2026-09-03T00:15:44+00:00
actor: local-agent
evidence-sha256: dca081a3188c1676492cf6cfd60f6b5d044444af48a818ae6173c43636c209fb
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0131
updated: 2026-09-03T12:19:04+00:00
actor: local-agent
evidence-sha256: 95b14cf53c5f2030d04c08f2b5dd9dfbb343623139fc5ce9e720d09533c6be38
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0123
updated: 2026-09-03T00:23:19+00:00
actor: local-agent
evidence-sha256: d05fdcb413b5af3832a99bb11e2726eab2c7c3682e25b7c74203edb5e4bd3544
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0124
updated: 
actor: local-agent
evidence-sha256: 7b56927949e37e438aa734d75f4b3eed9bd85a667118aa51838decfaccecfcb7
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0129
updated: 
actor: local-agent
evidence-sha256: a2028224c451c9d493976891e8e4061d8fbe7cbe6e5155f21be5f251a13b16be
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0130
updated: 
actor: local-agent
evidence-sha256: db4bfd0327fb8cd3dcc011d26631b8b064c1a6b0952880d4fbb8d34877b61b84
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0125
updated: 
actor: local-agent
evidence-sha256: 24ead3c1a5c517e9724996338b7426ad3e8e2c18cd519e08d1f683f72f4d788b
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0126
updated: 
actor: local-agent
evidence-sha256: 1acbbc8c9d9ec3b87035c8d0521fa2c3622fa697e6d719310f61795b15fda6e8
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0127
updated: 
actor: local-agent
evidence-sha256: 0640af1175d4cd871685513652419379eec835cf543aed5dfc69b0bfcadc4a29
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0128
updated: 
actor: local-agent
evidence-sha256: 52a6748748dfe2d958322ba6584bcd9e8cd8284ed731054bf7f3d48948bf4d4a
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0132
updated: 2026-09-03T13:48:49+00:00
actor: local-agent
evidence-sha256: 7e0b781bd511bf7c78d504be2551763dc8d69cb587488ebbb271c6ea9297cc0b
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0134
updated: 2026-09-03T14:38:08+00:00
actor: local-agent
evidence-sha256: 3ad2590c9c31b9a8bcfe0e7212d85d446458c4690bf1ff152b848245aa2ab81c
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0137
updated: 2026-09-03T14:57:29+00:00
actor: local-agent
evidence-sha256: 73bd2d6844b5aeaef8c0a753fb3ffc143ba55ec8b8a6ea80d0937f17d8d01123
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0143
updated: 2026-09-03T15:20:03+00:00
actor: local-agent
evidence-sha256: d669bf8aeac2f37f703094ffd9db570e6d658293f99d7995729a5420ac2b89c7
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0144
updated: 2026-09-03T16:36:34+00:00
actor: local-agent
evidence-sha256: 765f10be899bb7edd6395df543b8cdc5f0d0ef9c4670d5dc185d848f11bbcb39
-->

<!-- SIN-GPT-WEB-HANDOVER
task: EH-BRAND-01
updated: 2026-09-06T00:46:30+00:00
actor: prime-agent
evidence-sha256: aa823be75191650b55367801543a3d6f9565f6acc4023427e89de00885b7ab9b
-->

<!-- SIN-GPT-WEB-HANDOVER
task: EH-BRAND-02
updated: 2026-09-06T00:46:30+00:00
actor: prime-agent
evidence-sha256: aa823be75191650b55367801543a3d6f9565f6acc4023427e89de00885b7ab9b
-->

<!-- SIN-GPT-WEB-HANDOVER
task: EH-BRAND-03
updated: 2026-09-06T08:05:25+00:00
actor: chatgpt-web
evidence-sha256: 4507a81925e57caf5947f5cf5489e0d59dc2921fba11a6902bf52d2baf09c4f4
-->

<!-- SIN-GPT-WEB-HANDOVER
task: EH-BRAND-04
updated: 2026-09-06T20:09:19+00:00
actor: chatgpt-web
evidence-sha256: 5114f14401e6e23ddd983775a51c5a8e1db89c2d6092a28b3304c59c45dd65ae
-->

<!-- SIN-GPT-WEB-HANDOVER
task: EH-BRAND-APP-COVERAGE
updated: 2026-09-06T22:40:19+00:00
actor: local-agent
evidence-sha256: 5ade9dc3a11113a69057f1a7fd3d37828c6dffa092c335a17ec41dc127fba1dc
-->

<!-- SIN-GPT-WEB-HANDOVER
task: EH-BRAND-04-R2
updated: 2026-09-06T22:58:55+00:00
actor: local-agent
evidence-sha256: 5297533580034decc51d043ff1cc0c19fd189e3b8666af8eca66a56d7fe78106
-->

<!-- SIN-GPT-WEB-HANDOVER
task: EH-BRAND-05-APPS
updated: 2026-09-07T09:46:06+00:00
actor: local-agent
evidence-sha256: aa25baaa016bcf64563c1194b16402bbf2f70099674c2fed3050e31cad982da5
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0145
updated: 2026-09-07T15:40:44+00:00
actor: local-agent
evidence-sha256: 8a0d123d7986ce23d4b44a81962d5c80f660962912df8aa6ca3a80d4fb971ff1
-->

<!-- SIN-GPT-WEB-HANDOVER
task: EH-BRAND-05-WEB
updated: 2026-09-07T15:42:00+00:00
actor: local-agent
evidence-sha256: 5d479d537dc1a308fb33c559a4ebed39b7d29eb42929fcec65af97e584a85625
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0133
updated: 2026-09-07T16:11:04+00:00
actor: local-agent
evidence-sha256: bf8f5935018f755d0889723675beae705dcbf68623bb749f02ea254b258714e1
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0139
updated: 2026-09-07T16:22:19+00:00
actor: local-agent
evidence-sha256: 46135bd1f7765e7da6d9c33f49df38f730beb056f428a98d8d598e7ae3239275
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0146
updated: 2026-09-07T16:33:33+00:00
actor: local-agent
evidence-sha256: 1bc3466f4209a88e0e08b805d40e1ea395406db8d735bae99df68e6a25e4aae0
-->

<!-- SIN-GPT-WEB-HANDOVER
task: EH-BRAND-05-HUB
updated: 2026-09-07T16:56:33+00:00
actor: local-agent
evidence-sha256: 904cd87db9d3e5092e50dc56992e8758987a4477a8153ade6eed0f1985389888
-->

<!-- SIN-GPT-WEB-HANDOVER
task: T-0151
updated: 2026-09-07T17:11:32+00:00
actor: local-agent
evidence-sha256: 1aff41d46d74a7fadab58ab6f600da298c53f5177c45bb9dff7cd4b077055aaa
-->

<!-- SIN-GPT-WEB-HANDOVER
task: EH-BRAND-05-CRM
updated: 2026-09-07T18:57:23+00:00
actor: local-agent
evidence-sha256: f05b5cb9a79e1d9a720fb63db01722b1fa2fb1103f5d916d9e79e42e72ba1567
-->

<!-- SIN-GPT-WEB-HANDOVER
task: EH-BRAND-05
updated: 2026-09-07T18:57:39+00:00
actor: local-agent
evidence-sha256: 75d41828db93f7f1cf0319cb62b4555505145aa7e350e3f76b5e54e3998e980b
-->

<!-- SIN-GPT-WEB-HANDOVER
task: EH-BRAND-06
updated: 2026-09-07T19:04:42+00:00
actor: local-agent
evidence-sha256: 5f22e53b7db61e188b5dc47f904485e0d6871007582380be638be5b78ce4a5ab
-->


<!-- SIN-GPT-WEB-HANDOVER
task: DOCS-01
updated: 2026-09-08T06:23:19+00:00
actor: local-agent
evidence-sha256: 02422d9cea1ac470342ae2bebe52c003e7a9e35672373bbd6aa7497a7503833e
-->

<!-- SIN-GPT-WEB-HANDOVER
task: DOCS-02
updated: 2026-09-08T06:23:20+00:00
actor: local-agent
evidence-sha256: 02422d9cea1ac470342ae2bebe52c003e7a9e35672373bbd6aa7497a7503833e
-->

<!-- SIN-GPT-WEB-HANDOVER
task: DOCS-03
updated: 2026-09-08T06:23:21+00:00
actor: local-agent
evidence-sha256: 02422d9cea1ac470342ae2bebe52c003e7a9e35672373bbd6aa7497a7503833e
-->

<!-- SIN-GPT-WEB-HANDOVER
task: EH-BRAND-07-WORKSPACE
updated: 2026-09-10T08:16:13+00:00
actor: local-agent
evidence-sha256: 33de7bf2a603bb0ec77dc854170363bd7ca513213ea229a19b541ae04cc2baa1
-->

<!-- SIN-GPT-WEB-HANDOVER
task: EH-BRAND-08-ASSISTANT
updated: 2026-09-10T08:16:26+00:00
actor: local-agent
evidence-sha256: 015d0d2ceaa4d632f31ebbea1137fa73741c36e2bf71d15e38f5dd4d4c398489
-->
