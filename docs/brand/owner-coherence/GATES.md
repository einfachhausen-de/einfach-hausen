# Owner coherence — acceptance ledger (implementer, 2026-09-13)
Base: 33bcf224b98b46119dbaf3da624a83348b180b48 (clean, verified)
Worktree: /home/ubuntu/orca/workspaces/eh-owner-coherence-20260913, branch fix/eh-owner-coherence-20260913
Packet: /tmp/eh-coherence-packet (hashes match manifest.json)

## Pre-edit baseline hashes (HEAD)
- src/app/app/page.tsx: 0e8bcf46abc53328d270a58c9022c5d1750c2dfd6f311d4964a93d4692733340
- src/app/app/jobs/page.tsx: 4b938ae2578dd09f1b61f284f58b3ed1e1ccfc7255ec05355300b5d0ed590c1f
- src/app/app/calendar/page.tsx: 4af3bd8741e2ea61e0e9676c9043e04d31237645f9a469753144614767a4d2f0
- src/app/app/messages/page.tsx: a3e18c8182aab3e757b8a0b03d1cbd2ea45544cd7444ccc51df31d40e6f3f443
- src/components/shell.tsx: ba58f2b18a5517be3777bd1ccdb21735367c05e16e88001fba4a812f915a5bee
- src/components/house-assistant.tsx: 15158d1dc4f4ce55d1820dcb562389b99df40a0466742aa1ce0af45f93fe831c
- src/components/homeowner/homeowner-hausmeister-composer.tsx: 267cb3f12b0f729fbe021ad84a81c14fdb4784d41d9df6dfdd1a3b97c6a66d1f
- packages/eh-design/src/workspace-owner.tsx: ABSENT (new)
- src/lib/owner-format.ts: ABSENT (new)

## Impact (GitNexus 1.6.10 via /srv/einfach-hausen @same SHA + HEAD grep in worktree)
- HouseAssistant: LOW (index: 1 caller RootLayout; HEAD grep: layout.tsx + shell.tsx). No HIGH/CRITICAL.
- HomeownerHausmeisterComposer: LOW (2 callers: app/page.tsx + app/hausmeister/page.tsx, HEAD-confirmed). No HIGH/CRITICAL.
- jobScheduleCopy/jobStatusCopy/jobStatusTone: UNKNOWN in stale index (expected: file-local helpers); HEAD grep confirms file-local only in src/app/app/jobs/page.tsx. No HIGH/CRITICAL.
- AppShell: CRITICAL per root packet (33 callers) — shell.tsx replaced exactly per root, primitives unchanged.
- Worktree not in GitNexus index (repo-not-found); used /srv/einfach-hausen same-SHA index + HEAD grep. graphify genuinely missing on OCI.

## Task DB blocker
- No .sin-gpt-web/ in worktree; DB access broken (parent-verified). NOT touched/recreated. Noted here per order.

## Acceptance gates (pending execution)
- [x] lint/typecheck + webpack build + relevant test:e2e (native OCI) — tsc0/eslint0/Turbopack0/webpack0/e2e15/15
- [ ] new tests: ownerDate UTC/zone/date-only/invalid/DST; maintenance labels fixed clock; jobs search+view preservation + filter grouping; appointments current-vs-past no-overlap + links; contact categories/query+area/thread; 4-page H1/toolbar/overflow/44px
- [x] screenshots 16/16 in /tmp/eh-coherence-after/ (h1=1, overflow=0)
- [x] DESIGN.md + HANDOFF.md updates, lock report (6 allowlisted, 0 unlisted; lock NOT written)
- [ ] detect-changes pre-commit (release owner handles commit)

## Doc-finalization 2026-09-13 — final evidence supersedes initial failures (history preserved)
- Initial GATES failures (if present above) REMAIN as historical evidence; they are SUPERSEDED, not deleted, by the following actual final logs (bounded-read verified on disk):
  - /tmp/eh-final-gates1.log: TSC_EXIT=0, LINT_EXIT=0 (0 errors; 35 pre-existing warnings), owner tests fail 0, DESIGN_EXIT=0 (note: log lists protected files changed pre-lock; post-lock live run = EH_DESIGN_CONSISTENT).
  - /tmp/eh-final-webpack2.log: `next build --webpack` EXIT 0, 141/141 static pages, full route listing present.
  - /tmp/eh-final-e2e.log: test:e2e `"ok": true`, 15/15 checks, zero browser runtime errors (kept run MfAQpE).
  - Live design-check: `node scripts/eh-design-check.mjs` = EH_DESIGN_CONSISTENT, EXIT 0.
  - Final screenshots: 23 PNG + report.json (/tmp/eh-coherence-final-shots and docs/brand/owner-coherence/final-shots/), 28 checks, BAD=[].
- If B1/B2 hunks are altered after this point, gates MUST be re-run; completion must NOT be faked.
- Independent approval and deploy are NOT marked complete here (release-acceptor pending, ROOT gate).
