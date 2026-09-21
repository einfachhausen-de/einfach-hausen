> **Produktkontext aktualisiert · 21.09.2026:** Maßgeblich sind [Produktvision](PRODUCT_VISION.md) und [Positionierung](PRODUCT_POSITIONING.md): Handwerkervermittlung und Affiliate-Tarife zuerst, Eigentümer kostenlos, Partnerabo, Hausakte ergänzend. Frühere Prioritäten und „nächste Aktionen“ dieser Lieferung gelten nur für ihren datierten Umfang; aktuelle Fortsetzung unter [NEXT_AGENT](NEXT_AGENT.md). Technische und gestalterische Nachweise bleiben historische Belege. Ein damaliger DONE-/100%-Status ist keine Abnahme des am 21.09.2026 korrigierten Produktziels.

# Einfach Hausen — Final Acceptance — historisch, Stand 2026-08-25 (T-0042, Release `dcd53ca1`)

> **Einordnung 2026-09-10 (Repo-HEAD `0503da3`):** Historische Momentaufnahme der T-0042-Abnahme vom 2026-08-25. Kernaussagen bleiben; SHAs und Taskstände sind Stichtagswerte, keine aktuellen Behauptungen.

**Acceptance date:** 2026-08-25
**Canonical task:** T-0042 — Acceptance: map and close product-issue gaps with evidence
**Reviewed tree:** local `main` at `16fad400812c5fe4299e163396809a45fbf17714` plus the already classified documentation/Archify working changes; production application release remains `dcd53ca1f463e9d64ee3fc6838d1cdb3fb2bb557`.
**Verdict:** **ACCEPT — no unresolved Critical/Major technical or binding-product gap found.**

This document is the final acceptance matrix required by T-0042. It does not replace the transactional taskplan in `.sin-gpt-web/taskplan.sqlite3`, the production runbook, or external legal/business approvals.

## Acceptance method

Acceptance uses four evidence layers:

1. **Current implementation:** concrete route/source files in the current repository tree.
2. **Focused and full verification:** completion reports T-0034 through T-0040 plus remediations T-0045 through T-0048.
3. **Independent review:** T-0040 records `FINAL VERDICT ACCEPT`, zero unresolved Critical/Major findings, and a separate issue-by-issue PASS for GitHub issues #1-#6.
4. **Production proof:** T-0041 records the backup-first production deploy of `dcd53ca1`, database integrity and no-loss checks, public route health, Cloudflare transport, mail DNS and Stripe live-webhook readiness.

A criterion is PASS only when the current implementation and the recorded verification agree. External operator/legal facts are separated below and are not disguised as code failures.

## GitHub issues #1-#6

Fresh `gh issue view` checks on 2026-08-25 show all six issues in state **CLOSED**. Their product requirements are independently covered below; issue closure alone was not treated as acceptance evidence.

| Issue | Status | Acceptance | Current implementation / route evidence | Verification evidence |
| --- | --- | --- | --- | --- |
| **#1 — korrekturen**: do not market the product primarily as “AI”; sell the house service / benefit first | CLOSED | **PASS** | `src/app/page.tsx` leads with **“Ein Ansprechpartner für alles rund ums Eigenheim.”**; `src/app/layout.tsx`, `src/app/ueber-uns/page.tsx`, `src/app/eigenheimbesitzer/page.tsx`; `docs/PRODUCT_VISION.md` explicitly defines AI as the unobtrusive assistance layer rather than the public value proposition | T-0040 independent issue review: PASS; full production-style E2E in T-0039; live public multipage release in T-0041 |
| **#2 — beratungs button**: provider can offer consultation; homeowner can choose advice/contact without creating an order | CLOSED | **PASS** | `/app/consultation` in `src/app/app/consultation/page.tsx`; explicit contact-only fork in `src/app/app/hausmeister/page.tsx`; `createConsultationAction` / contact lifecycle in `src/app/actions.ts`; provider `acceptsConsultation` in `src/app/register/page.tsx` and `src/app/pro/profile/page.tsx`; contact-only job UI in `src/app/app/jobs/[id]/page.tsx` | T-0034: scoped consultation/private-media browser journey PASS, lint/build/security PASS; T-0036: contact-only messaging PASS; T-0039 full E2E PASS; T-0040 issue PASS |
| **#3 — anmeldeprozess handwerker**: simple provider entry, services/region/contact availability, consultation/emergency, multiple contacts and understandable job handling | CLOSED | **PASS** | provider registration in `src/app/register/page.tsx`; profile/services/preferences in `src/app/pro/profile/page.tsx`; multi-contact team with the single **Aufträge verwalten AN/AUS** permission in `src/app/pro/team/page.tsx`; request/order workspace in `/pro`, `/pro/orders`, `/pro/jobs/[id]`; provider public profile in `/app/partners/[id]` | T-0038 portable architecture/browser regression PASS; T-0039 full homeowner-partner-admin E2E PASS; T-0040 independent issue PASS; production `/partner` HTTP 200 in T-0041 |
| **#4 — notfallbutton**: nearby qualified help, 24/7 or configured readiness, availability/surcharge and choice rather than blindly choosing the most expensive emergency service | CLOSED | **PASS** | homeowner `/app/emergency` in `src/app/app/emergency/page.tsx`; emergency creation/matching in `src/lib/orchestrator.ts`; provider emergency opt-in, mode, days, time window and maximum surcharge in `src/app/pro/profile/page.tsx`; emergency quote handling in `src/app/pro/jobs/[id]/page.tsx`; matching remains quality-based and plan-neutral | T-0039 full E2E includes consultation/emergency PASS; T-0040 independent issue PASS and zero Critical/Major findings; matching suites referenced by T-0040: 23/23 + 18/18 PASS |
| **#5 — homebildschirm**: calm homeowner home, immediate emergency/advice, next action/appointments, personal contacts and simple navigation | CLOSED | **PASS** | quiet homeowner home in `src/app/app/page.tsx`; immediate `/app/emergency`; house/next-maintenance overview; personal contacts in `/app/messages`; appointments in `/app/calendar`; compact bottom navigation in `src/components/bottom-nav.tsx`; deeper house functions under `/app/home` and `/app/more` | T-0039 verifies mobile public/app journey at 390 px and keyboard behavior with zero browser runtime errors; T-0040 issue PASS; Lighthouse: 91 Performance / 100 Accessibility / 100 Best Practices / 100 SEO |
| **#6 — digitale Hausakte**: lifelong property history, old work, documents, guarantees, maintenance, providers and controlled handover on sale/ownership change | CLOSED | **PASS** | house history in `src/app/app/home/history/page.tsx`; property/asset overview in `src/app/app/home/page.tsx`; maintenance/year in `/app/year`; private house-history files through authenticated API routes; provider invitations via `/partner-invite/[token]`; controlled ownership transfer via `/transfer/[token]` and transfer actions in `src/app/actions.ts`; public explanation at `/hausakte` | T-0039 full E2E covers house history/maintenance/ownership-transfer privacy; T-0045 preserves prior-owner private-message access; T-0047 atomically revokes active broker-sale shares on transfer; architecture/full E2E PASS; T-0040 issue PASS |

**Issue matrix result: 6/6 PASS.** No failed issue criterion requires a canonical remediation task.

## Binding PRODUCT_VISION capability matrix

| Binding capability | Acceptance | Route / implementation evidence | Verification / production evidence |
| --- | --- | --- | --- |
| **One digital entrance; free text/photo/voice before categories** | **PASS** | `/app/hausmeister`, `src/components/homeowner/homeowner-hausmeister-composer.tsx`, private `/api/job-media/[id]`, WhatsApp `/api/whatsapp/webhook` | T-0039 full E2E; T-0046 authenticated provider media remediation; T-0048 collision-safe WhatsApp identity + 43/43 security regression |
| **Explicit choice: human contact vs. real order** | **PASS** | `src/app/app/hausmeister/page.tsx` exposes separate **Ansprechpartner finden** and **Auftrag organisieren** paths; `src/lib/orchestrator.ts`; contact-only UI can later convert explicitly in `src/app/app/jobs/[id]/page.tsx` | T-0034 consultation browser proof; T-0036 contact-only messaging; T-0039 complete lifecycle |
| **Price orientation + quality/regional matching; paid tier does not buy ranking** | **PASS** | `src/lib/orchestrator.ts`, partner activation/matching config, `src/app/app/jobs/[id]/page.tsx`; partner/public copy states tariff-neutral matching | T-0038 matching 23/23 + 18/18; T-0040 independent gauntlet ACCEPT |
| **Offer comparison and conscious booking** | **PASS** | `/app/jobs/[id]` renders multiple quotes, price/date/provider standards and recommendation context; booking actions in `src/app/actions.ts` | T-0039 matching/quote/booking/assignment E2E PASS; T-0040 product-truth review ACCEPT |
| **Concrete personal contact before or after booking; durable relationship** | **PASS** | `/app/messages`, contact-only `/app/jobs/[id]`, assignments in `src/app/actions.ts`; relationship remains after completed work | T-0036 cross-role messaging 38/38; T-0039 lifecycle PASS |
| **Digital house record, history, assets, documents, maintenance and year plan** | **PASS** | `/app/home`, `/app/home/history`, `/app/home/passport`, `/app/documents`, `/app/year`; house-history private API routes | T-0039 history/maintenance E2E; T-0045/T-0047 transfer privacy remediations; T-0040 ACCEPT |
| **Consultation without automatic order** | **PASS** | `/app/consultation`, `createConsultationAction`, provider consultation preference | T-0034 focused mobile browser PASS and no accidental job; T-0039 PASS |
| **Emergency help with readiness, distance/qualification and surcharge metadata** | **PASS** | `/app/emergency`, `createEmergencyJob` flow in `src/lib/orchestrator.ts`, provider emergency preferences in `/pro/profile`, emergency quote UI in `/pro/jobs/[id]` | T-0039 emergency E2E; matching regressions; T-0040 ACCEPT |
| **Invoices from executing partner; optional Stripe Connect payment; 0% platform commission** | **PASS** | partner invoice form `/pro/jobs/[id]`; homeowner `/app/invoices/[id]` and `/app/documents`; `src/components/invoice-view.tsx`; checkout metadata uses `platformCommissionBps:'0'`; `src/lib/payments.ts` | T-0039 invoice + truthful unavailable-payment flow; T-0041 `sin-stripe ready` + doctor PASS and live webhook enabled |
| **Property is durable identity; controlled ownership transfer without private-message/payment leakage** | **PASS** | property transfer actions in `src/app/actions.ts`; `/transfer/[token]`; house-scoped vs private records separated | T-0039 ownership-transfer privacy; T-0045 prior-owner private messages preserved; T-0047 broker shares revoked atomically; architecture/full E2E PASS |
| **One professional account can carry multiple activities, including broker search profile** | **PASS** | `/pro/profile` categories/services plus broker regions/property/price/area criteria; `/app/home/sale` matching path | T-0035 isolated broker runtime PASS + 15/15 sale/share invariants; T-0040 ACCEPT |
| **Valuation and sale lifecycle with explicit owner data release** | **PASS** | `/app/home/sale`, `src/app/app/home/sale/actions.ts`; lifecycle `Verkaufsinteresse → passende Makler → Kontakt freigegeben → Besichtigung → Maklerauftrag → verkauft`; purpose-limited share/revoke | T-0035 lint/build/security + broker runtime + invariants PASS; T-0047 transfer revocation; T-0040 ACCEPT |
| **Verified contracted partner network, not open lead market** | **PASS** | `/pro/profile`, `src/lib/partner-config.ts`, `/admin`; verification, insurance, qualification, contract and quality gates | T-0039 provider verification/contract E2E; T-0040 independent gauntlet ACCEPT |
| **Company with 1-X contacts and only the key `Aufträge verwalten` permission** | **PASS** | `/pro/team`, `src/components/provider/workspace.tsx`, provider access helpers; managers see requests/assignment while non-managers see assigned work | T-0039 AN/AUS lifecycle E2E; T-0040 ACCEPT |
| **Customer/partner plans and 0% job commission** | **PASS** | `/preise`, `/app/plans`, `/pro/plans`, seeded plan data in `src/lib/db.ts`; partner plans explicitly do not affect quality ranking | T-0039 payment/truth flows; T-0040 product-truth ACCEPT; T-0041 Stripe readiness |
| **Mobile-first/PWA, private documents, messaging, admin, notifications and auditability** | **PASS** | manifest/PWA routes; authenticated document/media APIs; `/app/messages`, `/pro/messages`; `/admin`; notifications and job events | T-0038 portable architecture/browser harness; T-0039 complete E2E incl. PWA/offline + zero browser runtime errors; T-0040 Lighthouse/security evidence |

**Binding product result:** no failed Critical/Major product capability was found. No remediation task is warranted by T-0042.

## Fresh consolidated verification evidence

The final accepted implementation has already been exercised by the following completed canonical tasks:

- **T-0034:** consultation/private media/human handoff/insurance flow; full lint + build; security **133/133**; mobile browser journey PASS.
- **T-0035:** real-estate valuation, broker matching and purpose-limited sharing; broker runtime PASS; sale/share invariants **15/15**; lint/build/security PASS.
- **T-0036:** relationship-scoped cross-role messaging; isolated mobile browser suite **38/38 PASS**.
- **T-0037:** DB-aware health, Node-22 deployment contract, persistent storage, online backup, checksum/integrity validation and non-destructive restore proof.
- **T-0038:** portable isolated regression harness; architecture E2E PASS; CRM **20/20**; intake **23/23**; security **133/133 + 38/38**; matching **23/23 + 18/18**; lint/build/diff-check PASS.
- **T-0039:** full isolated production-style homeowner/partner/admin lifecycle PASS, including 390/1320 layouts, PWA/offline, verification/contract, contact-only→service, matching/quote/booking, messaging, invoice, house history/maintenance, consultation/emergency, admin/CRM and ownership-transfer privacy; **zero browser runtime errors**.
- **T-0040:** independent skeptical gauntlet **FINAL VERDICT ACCEPT**, zero unresolved Critical/Major findings; issue-by-issue review **6/6 PASS**; Lighthouse mobile **91 / 100 / 100 / 100**.
- **T-0045/T-0047:** ownership-transfer privacy and broker-share revocation remediations PASS in architecture/full E2E.
- **T-0046:** provider request media served only through the authenticated private route; full E2E PASS.
- **T-0048:** collision-safe WhatsApp homeowner resolution; security/webhook regression **43/43 PASS** and full E2E PASS.

## Production acceptance

T-0041 provides the live release proof for `dcd53ca1f463e9d64ee3fc6838d1cdb3fb2bb557`:

- pre-deploy verified backup: `/var/backups/einfach-hausen/einfach-hausen-20260824T220100Z`;
- restore dry-run PASS;
- production build/runtime Node `v22.23.0`;
- SQLite `PRAGMA integrity_check = ok` before and after deploy;
- database structure/data invariants preserved: **59 tables → 59, 4 users → 4, 0 jobs → 0**;
- `einfach-hausen.service`, Kestra proxy and backup timer active;
- `/api/health` reports database ready;
- `/sicherheit`, `/app/settings`, `/app/insurance`, `/partner`, `/impressum`, `/datenschutz` return HTTP 200;
- canonical `www` redirects to apex;
- Cloudflare DNS/tunnel QUIC/HTTP2/API prechecks PASS;
- STRATO mail MX/DMARC/DKIM/autodiscover/autoconfig verified;
- Stripe readiness/doctor PASS with canonical live webhook enabled;
- no production data loss observed.

The local commit `16fad400812c5fe4299e163396809a45fbf17714` and the current documentation/Archify working changes are post-release repository work. They are **not claimed as deployed application code**; T-0043 owns final repository convergence and must re-verify whether any application-affecting change requires a production deploy.

## External-authority and credential separation

The technical/product acceptance above does **not** invent facts that only business, legal, tax, privacy or external providers can authorize.

`docs/EXTERNAL-BLOCKERS.md` remains authoritative for external launch facts. In particular, the repository cannot fabricate:

- exact final operator/company/legal-form and representative identity;
- official service/legal address and publication contact channel;
- register/chamber/supervisory/tax-identifier applicability and values;
- consumer-dispute participation details;
- final GDPR controller/vendor/legal-basis/retention/DSR/consent assessment;
- final legally approved customer/partner AGB and consumer notices;
- optional guarantees, certifications or seals without documentary authority.

These are **external launch/legal approvals, not unresolved Critical/Major implementation defects**. Public legal pages intentionally avoid invented values.

Third-party social/marketing connector credentials likewise remain connector-specific runtime dependencies. They do not change the acceptance of the core website/homeowner/partner application and must not be reported as healthy unless actually configured and verified.

## GitHub ↔ Notion governance check

The repository rule requires Notion status updates only when a GitHub item has an **unambiguous matching Notion task**. A fresh read-only Notion search on 2026-08-25 found:

- no exact task result for the issue wording `korrekturen`;
- no exact issue-task match for `beratungs button`;
- no exact result for `notfallbutton` or `homebildschirm`;
- searches for `Beratung`, `Notfall` and `Hausakte` within the configured canonical Aufgaben page did not yield an unambiguous matching issue task;
- `Handwerker` returned generic business tasks such as Handwerker-Akquise/Content/Kampagne, not a 1:1 mapping to GitHub issue #3.

Therefore **no unrelated Notion business/marketing/legal task was marked Erledigt by assumption**. This preserves the repo governance rule instead of manufacturing a false mapping. The six GitHub issues themselves are already CLOSED and their technical criteria are independently accepted above.

## T-0042 remediation decision

**No canonical remediation task is created.**

Reason: every GitHub issue #1-#6 and every major binding `PRODUCT_VISION` capability mapped above has implementation evidence plus focused/full-E2E or independent-gauntlet evidence. T-0040 already reached `FINAL VERDICT ACCEPT` after T-0047/T-0048 remediations, and no fresh evidence in this T-0042 review contradicts that verdict.

## Final T-0042 verdict

- GitHub issues #1-#6: **6/6 PASS**
- major binding PRODUCT_VISION capabilities: **PASS**
- independent Critical/Major findings: **0 unresolved**
- production application release: **verified live at `dcd53ca1`**
- external legal/operator facts: **explicitly separated, not fabricated**
- ambiguous Notion mappings: **not mutated**
- required remediation tasks: **none**

**T-0042 acceptance verdict: ACCEPT.** The next canonical action is T-0043 final repository convergence/handover after T-0042 is transactionally completed through `sin-gpt-web-state`.
