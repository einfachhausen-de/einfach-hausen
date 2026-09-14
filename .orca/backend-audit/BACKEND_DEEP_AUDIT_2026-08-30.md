# Backend & Supabase Deep-Audit — einfach-hausen
**Datum:** 2026-08-30 (UTC) · **Scope:** Nur Backend der Apps (Owner/Partner/Admin) + Supabase/Infra — kein Frontend
**Basis:** Production `/srv/einfach-hausen` @ 63d3de4 (= GitHub main), Live-DB `/var/lib/einfach-hausen/einfach-hausen.db`, Live-Stack `/opt/sin-supabase` (alle Aussagen mit Live-Evidence geprüft, read-only)

## Executive Summary
Der Stand „abgeschlossen, deployed, Smoke 17/17" gilt nur für öffentliche Website-Seiten + /api/health.
**Die App-Backend-Kette (Auth → Daten → Benachrichtigung → Bezahlung → Kanäle) ist in Produktion ganz überwiegend nicht funktionsfähig oder nie aktiviert worden.** Kernbefunde:

1. **CRITICAL — Production-Auth ist derzeit unbenutzbar** (3 unabhängige Beweise, s. A).
2. **CRITICAL — Supabase war nie für einfach-hausen konfiguriert** (SITE_URL=fremdes Projekt, Placeholder-SMTP, keine App-Tabellen, 0 Identitäts-Bindungen).
3. **HIGH — E-Mail/Notification-Kette doppelt tot** (keine SMTP-Keys + kein Dispatcher-Trigger + kein E-Mail-Adapter + Fake-Domain in Templates).
4. **HIGH — Business-Daten in Production = 0** (jobs/quotes/invoices/payments/messages/documents/webhook_events alle 0; uploads leer). Die Plattform hat nie einen echten Auftrag/Bezahlvorgang verarbeitet.
5. **HIGH — /api/ki ist unauthentifiziert** und ignoriert die konfigurierte OmniRoute-Env (hardcodet api.openai.com).
6. **HIGH — GDPR-Selbstlöschung bewusst deaktiviert** (konto-loeschen → 410), Ersatz nie gebaut (T-0144 backlog).
7. **MEDIUM — Backup nur same-host** (Supabase-Storage auf derselben Platte), kein Restore-Drill (T-0136 blocked), toter Cron-Eintrag.
8. **MEDIUM — Legacy-Duplikat-Routen** (/dashboard, /profil, /historie, …) ohne serverseitige Auth (nur UI-State) — Räumung/Verifikation nötig.
9. **PROCESS — Repo-Zustand widerspricht „converged"**: uncommitete Auth-WIP im kanonischen Worktree; Dev-Worktree hinter origin; Smoke-Tests decken echte Auth nicht ab.

---

## A) Production-Auth — CRITICAL
Code-Fakten (63d3de4 = Production):
- `src/lib/auth.ts`: `authMode()` defaultet auf `'supabase'` (AUTH_MODE ist NICHT in `/etc/einfach-hausen.env`); `local`-Mode wirft in Production. `getCurrentUser()` braucht Runtime-Env `NEXT_PUBLIC_SUPABASE_URL`/`SUPABASE_URL` + Anon-Key — **beide fehlen** → return `null`.
- `src/lib/supabase.ts` (Client): ohne URL/Key → Dummy-Proxy-Client; Login-Button liefert „Supabase nicht konfiguriert".
- **Beweis 1:** `grep -r 'supabase.delqhi.com' /srv/einfach-hausen/.next/{static,server}` → 0 Treffer. Kein Supabase-URL-String im gesamten Production-Bundle (Client UND Server).
- **Beweis 2:** Live-CSP-Header: `connect-src 'self'` — der von T-0004 behobene CSP-Defekt ist im Live-Build wieder aktiv; der Browser dürfte den Supabase-Call selbst bei korrektem Bundle nicht senden. (`next.config.ts:22` macht connect-src env-abhängig → Build ohne Env.)
- **Beweis 3:** App-DB: `users_with_auth_subject = 0` (kein einziger User je serverseitig an Supabase gebunden); Supabase `auth.users` = 15, **letzter Sign-in 2026-08-04**.
- **Register-Flow hybrid tot:** `registerAction` (src/app/actions.ts:100–151) speichert bcrypt-Hash in SQLite + `createSession()` (mh_session-Cookie). In Supabase-Mode ignoriert `getCurrentUser()` mh_session → Nutzer läuft nach Registrierung in den Login-Loop. `loginAction` (bcrypt, Zeile 154) ist **totcode** — keine Referenz mehr im UI.
- Sessions in DB: 5 Stück, letzte Ausstellung 2026-08-28 (E2E-Testdaten, keine echten Logins seitdem).
- Session-Rotation selbst ist solide (ein aktiver Token pro User, IMMEDIATE-Transaction, UNIQUE(user_id)) — nur erreicht sie keinen realen Login-Pfad.

## B) Supabase-Infra (/opt/sin-supabase, 13 Container, healthy, up 7 weeks)
- **GoTrue v2.184.0.** `.env`: `SMTP_HOST=smtp.example.com`, `SMTP_USER=user` (Placeholder) → **Recovery/Invite/E-Mail-Change unmöglich**. `ENABLE_EMAIL_AUTOCONFIRM=true` maskiert das beim Signup.
- `ENABLE_ANONYMOUS_USERS=true`, `ENABLE_PHONE_SIGNUP=true`, `ENABLE_PHONE_AUTOCONFIRM=true` — unnötige Angriffsfläche ohne dokumentierte Entscheidung.
- **`SITE_URL=https://shopsin.delqhi.com`**, `ADDITIONAL_REDIRECT_URLS=https://shopsin.delqhi.com/**` — die Instanz ist für das SIN-Projekt „shopsin" konfiguriert, nicht für einfach-hausen. Verify/Recovery-Redirects für einfachhausen.de würden von GoTrue abgewiesen.
- Keine GOTRUE-Härtungs-Keys in `.env` (Rate-Limits, MFA, Password-Policy, Captcha) → alles Defaults; kein Captcha/Ratelimit vor Signup (App-seitige Limits decken nur App-Endpunkte, nicht die GoTrue-API).
- **Postgres: einfach-hausen hat KEINE Tabellen in Supabase.** Public-Schema (41 Tabellen, 40 mit RLS) gehört SIN-Plattform-Projekten (agents, telegram, publish_jobs, …). `.env.example`-Behauptung „Supabase Postgres + Storage (HA Primary)" ist DOC-DRIFT — `src/lib/db.ts` ist better-sqlite3, kein Postgres-Adapter im Code.
- Storage-Buckets: nur `social-staging` + `einfach-hausen-backups`. Der geplante Content-Bucket `einfach-hausen` (`.env.example: SUPABASE_STORAGE_BUCKET`) existiert nicht.
- Gateway `supabase.delqhi.com` antwortet (401 ohne apikey = alive). Rate-Limit am Edge: nicht konfiguriert gefunden.
- Host teilt sich mit ~20 weiteren Containern (n8n, honcho, openviking, epic_kilby, opensin, …) — Co-Tenancy-Risiko ohne Ressourcen-Isolation dokumentiert.
- System-Postgres lauscht auf `0.0.0.0:5432`; UFW zeigt keine Regeln — externe Erreichbarkeit hängt an OCI-NSG/iptables, **verifizieren**.
- Kestra (v1.3.30): Flow `einfach.hausen|einfach_hausen_health` existiert (Health-Proxy). **Keine** Dispatcher-/Backup-/Maintenance-Flows für die App.

## C) Daten & Datenmodell (SQLite Production-DB, 139 MB)
- 63 Tabellen, Schema umfassend (users, jobs, quotes, invoices, subscriptions, house_*, crm_*, broker_*, security_events, webhook_events, …). WAL-Modus aktiv (-wal 4 MB, -shm da).
- **Inhalt: 6 User (Aug 21–26, E2E-Testdaten), 5 Sessions, sonst jobs/quotes/invoices/payments/messages/documents/notifications = 0.** Production wurde nie real genutzt.
- E2E-Testdaten landen direkt in der **Production-DB** (keine Test-Isolation) — Test-/Produktionsgrenze verletzt.
- Multi-User-Concurrency: better-sqlite3 (synchron) im Next-Server; bei echtem Traffic Blockier-Risiko + keine Lesereplik. Für Launch-Traffic ok, ist aber eine bewusste Grenze, die nirgends als Betriebsregel dokumentiert ist (DOC-DRIFT zur „HA-Primary"-Erzählung).
- Uploads: `/var/lib/einfach-hausen/private` + `/uploads` (leer). Partner-Logos landen in `public/uploads` (öffentlich ausgeliefert, kein Cleanup/Quota).

## D) Notifications / E-Mail — HIGH (mehrfach tot)
- `src/lib/notifications.ts`: Outbox mit Retry/Dead-Letter **gut designed**, aber:
  1. `dispatchDueNotifications()` hat **keinen Production-Caller** (nur Regression-Script t0104). Kein Cron, kein Timer, kein Kestra-Flow, keine Route.
  2. Einziger Channel-Adapter: `in_app`. **E-Mail-Adapter nie registriert** (`mailer.ts` existiert, wird nicht angeschlossen).
  3. `mailer.ts` braucht `SMTP_HOST/USER/PASS` — **nie in Production-Env vorhanden** (auch nicht in der Env-Historie vom 20.08.).
  4. Mail-Templates verlinken `https://app.deine-domain.de/...` — Fake-Domain hartkodiert (`src/lib/mailer.ts`).
- In-App-Notifications selbst funktionieren (Tabelle leer, weil keine Nutzung). Push (Capacitor) nie gebaut (T-0167 planning-only).

## E) Payments — MEDIUM-HIGH
- Stripe-Keys in Production-Env vorhanden. Webhook-Route sauber: Signaturprüfung (Stripe SDK), Idempotenz (`webhook_events`), checkout.session + subscription.updated/deleted + Connect account.updated.
- **Aber: `webhook_events = 0`** → nie ein echter Webhook in Production verarbeitet. Connect-Onboarding (Partner-Payouts), memberships/packages-Success-Routen (nur Redirect) und der gesamte Payment-State-Machine sind **produktiv nie bewiesen**.
- Kein `invoice.paid/payment_failed`/Refund/Dispute-Handling (Dunning fehlt). Invoice-Status-Maschine manuell (draft/sent/paid/cancelled), keine PDF-Erzeugung sichtbar.
- EXTERNAL-BLOCKERS.md #3: Live-Scharfschaltung = externe Geschäftsfreigabe (korrekt gehandhabt).

## F) Kanäle: WhatsApp & KI
- **WhatsApp** (webhook/route.ts): Signaturprüfung fail-closed (`verifyMetaSignature`, META_APP_SECRET fehlt → 403), Idempotenz via webhook_events, Phone-Resolution collision-safe (T-0048). Aber Env (`WHATSAPP_ACCESS_TOKEN/VERIFY_TOKEN/PHONE_NUMBER_ID/META_APP_SECRET`) fehlt komplett → **Kanal inert**. Antworten (`sendWhatsApp`) fail-soft ohne Token.
- **KI-Anfrage-Analyse** (`request-ai.ts`): nutzt OmniRoute (`AI_BASE_URL/AI_MODEL/OMNIROUTE_MASTER_KEY`) → **funktionsfähig konfiguriert**.
- **KI-Chat `/api/ki`: CRITICAL-HIGH** — kein Auth-Check (public POST), hardcoded `api.openai.com` + `OPENAI_API_KEY` (fehlt → antwortet „nicht konfiguriert"), ignoriert die vorhandene OmniRoute-Config. Sobald jemand OPENAI_API_KEY setzt: offener LLM-Proxy ohne Rate-Limit (Kosten-Missbrauch).

## G) GDPR / Datenschutz — HIGH
- `/api/konto-loeschen`: bewusst 410 „legacy endpoint disabled" — **keine funktionierende Selbstlöschung**. T-0144 (Löschworkflow: Zustände, Retention, Anonymisierung, Audit) backlog, unassigned.
- Kein Datenexport für Nutzer. Consent-Records implizit (crm), Löschkonzept für `public/uploads`/private-Files ungeklärt.
- Rechtstexte juristisch nicht freigegeben (EXTERNAL-BLOCKERS #2, korrekt dokumentiert).

## H) Ops / Backup / Monitoring
- **Backup gut & verifiziert:** systemd-Timer 03:25 UTC → SQLite + private + uploads als tar.gz in Supabase-Bucket `einfach-hausen-backups`; 8 Bundles nachweisbar, letzter 2026-08-29T03:26Z, Run status=SUCCESS.
- **Aber:** nur same-host (gleiche Platte wie App UND wie die Supabase-DB — Single-Disk-Event killt beide), lokalen 7-Tage-Retention, kein Offsite/Immunity. **Restore-Drill nie ausgeführt** (T-0136 blocked seit 26.08., RPO/RTO nie dokumentiert).
- Toter Cron: `/home/ubuntu/backup-dbs.sh` existiert nicht, cron wirft jede Nacht „not found" (backup.log).
- `/api/health` prüft nur SQLite. Keine Dependency-Checks (T-0134 backlog). Kein Error-Tracking/Korrelation (T-0132 backlog), keine strukturierten Logs (T-0122 backlog), kein externes Monitoring/Alerting für App+Supabase gefunden.

## I) Repo-/Prozess-State
- GitHub main = Production = 63d3de4 (Website-Brand-/Hero-Waves NACH dem T-0171-Handover deployed — NEXT_AGENT „Production @ bdebe9f" ist veraltet).
- Dev-Worktree `/home/ubuntu/dev/einfach-hausen` liegt hinter origin (d83abf4).
- **Kanonischer Worktree `/home/ubuntu/einfach-hausen-oci-handoff` hat uncommitete WIP:** M actions.ts, M admin/actions.ts, M login/page.tsx, M scripts/e2e.mjs, untracked `src/app/login/login-form.tsx` + `src/app/api/auth/local-login/route.ts` (T-0006-Anlauf, nie fertig/commitet).
- Smoke 17/17 deckt echte Auth-Flows nicht (sonst wäre A) aufgefallen).

## J) Planungslücken (aus historischem Taskplan + Produktableitung)
**Planned-but-open (Auswahl, alle unassigned/backlog/blocked):** T-0136 Restore-Drill · T-0144 Datenschutz-Löschworkflow · T-0122 Observability · T-0132 Error-Tracking · T-0134 Health/Dependency-Checks · T-0120 Adversarial-Fuzz-Wave · T-0121 Supply-Chain-Gates · T-0124 Backup/Restore-RPO/RTO · T-0116 A11y-Matrix · T-0129/130/131 E2E/Visual/Completion v2 · T-0157 Release-Gates · T-0160–T-0163 Final-Acceptance-Wellen · T-0147 Browser-E2E (in_progress, verwaist) · T-0162 Partner-Acceptance (in_progress, verwaist).
**Nie geplant/ausgeführt:** E-Mail-Aktivierung End-to-End (SMTP + GoTrue-Recovery + Templates) · Notification-Dispatcher-Scheduling (Betriebsaufgabe) · Push/Capacitor (T-0167 planning-only) · Supabase-Auth-Betriebskonfig für einfach-hausen (SITE_URL/Redirects/SMTP) · KI-Chat-Auth+Kostendeckel · Test/Prod-DB-Isolation · Offsite-Backup · Legacy-Routen-Räumung.

## Nicht-Befunde (bewährt sauber)
App-seitige Rate-Limits (login/register/admin) · Stripe-Webhook-Signatur+Idempotenz · Meta-Signatur fail-closed · Admin-Auth getrennt (`isAdmin`, __Host-Cookie, Audit-Log) · Private-File-Routen mit Auth + Path-Traversal-Schutz (`resolvePrivatePath`) · Session-Rotation/Invalidierung · fail-closed-Defaults (AUTH_MODE, Local-Auth-Production-Sperre, konto-loeschen) · RLS auf 40/41 Public-Tabellen · Backup-Mechanik selbst.

## Empfohlene Reihenfolge (Vorschlag für kanonische Tasks)
1. **Auth-Kette produktiv machen:** Env (SUPABASE_URL/ANON in Runtime+Build), CSP-Fix real deployen, GoTrue SITE_URL/Redirects auf einfachhausen.de, einen echten User E2E binden, Auth-Smoke in Production-Suite aufnehmen. (A+B)
2. **E-Mail & Notifications aktivieren:** SMTP-Keys, GoTrue-SMTP, E-Mail-Adapter, Dispatcher-Trigger (systemd-Timer oder Kestra), Fake-Domain fixen, E2E „Notification ankommen".
3. **KI-Chat: Auth + OmniRoute-Anbindung + Rate-Limit/Kostendeckel.**
4. **GDPR: Löschworkflow (T-0144) + Export.**
5. **Ops: Restore-Drill (T-0136), Offsite-Backup, toten Cron entfernen, Health/Dependency-Checks (T-0134), Basis-Monitoring.**
6. **Payments-Beweis:** Stripe-Testwebhook gegen Production-Endpoint, Connect-Onboarding-Flow E2E (vor Live-Freigabe).
7. **Hygiene:** Legacy-Routen löschen (dashboard/dashboard-pro/profil/historie/auftraege/notfall/chat/meine-angebote/einstellungen/benachrichtigungen), Test-/Prod-DB-Isolation, WIP im Handoff-Worktree either finishen oder verwerfen, NEXT_AGENT-Prod-SHA korrigieren.
