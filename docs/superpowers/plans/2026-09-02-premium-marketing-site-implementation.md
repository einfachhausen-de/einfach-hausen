# Einfach Hausen Premium Marketing Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the complete public Einfach Hausen website into a premium consumer-brand experience with image-led art direction, stronger chapter rhythm, and a clear intake-first conversion path while preserving all existing backend, auth, API, route, and business behavior.

**Architecture:** Keep the existing Next.js App Router and backend integration. Replace the marketing presentation layer with focused visual-role components and a consolidated design-token layer, then migrate the homepage first and every public/auth route second. New visual assets live under a dedicated public brand-asset namespace; existing technical regression gates remain mandatory and a redesign-specific visual contract is added.

**Tech Stack:** Next.js App Router, React, TypeScript, CSS Modules, Lucide React where appropriate, existing GSAP/Lenis motion primitives, existing Node-based regression scripts, existing Playwright/browser screenshot tooling used by the repository.

**Spec:** `docs/superpowers/specs/2026-09-01-einfach-hausen-premium-consumer-redesign-design.md`

## Global Constraints

- Canonical pre-redesign baseline is commit `aa84ee2` (`main == origin/main` at the verified checkpoint).
- Never use `git reset --hard`, `git clean`, force-push, destructive history rewrites, or deletion of unrelated worktrees.
- `main` remains untouched during evaluation; implementation happens on `design/premium-consumer-v1` in an isolated worktree.
- Preserve existing backend, auth, APIs, data models, business logic, route semantics, and working frontend-to-backend flows.
- Do not invent reviews, customer counts, partner counts, press logos, awards, certifications, or security claims.
- Product UI remains part of the visual language but must no longer be the dominant visual anchor in every section.
- Wide desktop must be deliberately composed at 1440px and 1920px; mobile must be separately composed, not merely stacked.
- Public website is Wave 1 and the homepage is the visual acceptance reference before other public pages migrate.

---

## File Structure Map

**Create**
- `docs/superpowers/specs/2026-09-01-einfach-hausen-premium-consumer-redesign-design.md` — approved design spec persisted in repo.
- `docs/superpowers/plans/2026-09-02-premium-marketing-site-implementation.md` — this plan.
- `src/components/marketing/premium/consumer-hero.tsx` — image-led hero shell and proof overlay slots.
- `src/components/marketing/premium/visual-category-grid.tsx` — visual service-category cards.
- `src/components/marketing/premium/story-steps.tsx` — three-moment story process.
- `src/components/marketing/premium/image-ui-composite.tsx` — lifestyle image plus product proof overlays.
- `src/components/marketing/premium/proof-chapter.tsx` — truthful trust/proof facts.
- `src/components/marketing/premium/partner-chapter.tsx` — partner/trade visual chapter.
- `src/components/marketing/premium/security-chapter.tsx` — premium security/privacy chapter.
- `src/components/marketing/premium/premium.module.css` — consolidated premium public-site visual system.
- `src/components/marketing/premium/types.ts` — shared visual-role types.
- `src/components/marketing/premium/assets.ts` — canonical asset manifest and alt/decorative metadata.
- `public/brand/premium/` — generated/approved image assets and optimized derivatives.
- `scripts/premium-redesign-contract.mjs` — source/route contract checks for the redesign.
- `scripts/premium-redesign-visual.mjs` — screenshot matrix and visual-review artifact capture.
- `docs/PREMIUM_REDESIGN_HANDOVER.md` — final visual handover and rollback reference.

**Modify**
- `src/app/page.tsx` — rebuild homepage composition around premium primitives.
- `src/components/home/intake-form.tsx` — preserve submission behavior, simplify visual hierarchy.
- `src/components/marketing/site-shell.tsx` — premium header/footer integration without nav-item changes.
- `src/components/marketing/ui.tsx` — retain generic primitives for simple pages and add interoperability hooks only where needed.
- `src/components/marketing/marketing.module.css` — remove/retire conflicting homepage override layers after migration; keep unrelated public styles functional.
- `src/app/leistungen/page.tsx`
- `src/app/so-funktionierts/page.tsx`
- `src/app/hausakte/page.tsx`
- `src/app/preise/page.tsx`
- `src/app/partner/page.tsx`
- `src/app/sicherheit/page.tsx`
- `src/app/ueber-uns/page.tsx`
- `src/app/hilfe/page.tsx`
- `src/app/pilotphase/page.tsx`
- `src/app/login/page.tsx`
- `src/app/register/page.tsx`
- `src/app/register-owner/page.tsx`
- `src/app/register-pro/page.tsx`
- `src/app/kontakt/page.tsx`
- `src/app/ansprechpartner/page.tsx`
- `src/app/eigenheimbesitzer/page.tsx`
- `src/app/impressum/page.tsx`
- `src/app/datenschutz/page.tsx`
- `src/app/agb/page.tsx`
- `src/app/barrierefreiheit/page.tsx`
- `src/app/welcome/page.tsx`
- `src/app/role/page.tsx`
- `src/app/check-email/page.tsx`
- `package.json` — add redesign contract/visual scripts.
- `DESIGN.md`, `README.md`, `docs/NEXT_AGENT.md`, `docs/PRODUCTION_HANDOVER.md`, `docs/ARCHITECTURE.md` — record new design system and safe rollout.

---

### Task 1: Create the reversible redesign workspace

**Files:**
- Create: `docs/superpowers/specs/2026-09-01-einfach-hausen-premium-consumer-redesign-design.md`
- Create: `docs/superpowers/plans/2026-09-02-premium-marketing-site-implementation.md`

**Interfaces:**
- Consumes: Git repository at `/Users/jeremy/dev/einfach-hausen`, verified baseline `aa84ee2`.
- Produces: backup ref `backup/pre-premium-redesign-20260902`, isolated branch `design/premium-consumer-v1`, isolated worktree path `/Users/jeremy/dev/einfach-hausen/.worktrees/premium-consumer-v1`.

- [ ] **Step 1: Verify baseline and working-tree safety**

Run:
```bash
cd /Users/jeremy/dev/einfach-hausen
git status --short --branch
git rev-parse HEAD
git rev-parse origin/main
```
Expected at the original checkpoint: clean tree and `aa84ee2` for both HEAD and origin/main. If HEAD has advanced legitimately, record the new clean SHA as the execution baseline before creating the backup ref; never rewrite it back to `aa84ee2`.

- [ ] **Step 2: Create the named safety branch without moving main**

Run:
```bash
git branch backup/pre-premium-redesign-20260902 HEAD
git show --no-patch --oneline backup/pre-premium-redesign-20260902
```
Expected: the backup branch resolves to the exact clean starting commit.

- [ ] **Step 3: Create the isolated worktree**

Run:
```bash
git worktree add /Users/jeremy/dev/einfach-hausen/.worktrees/premium-consumer-v1 -b design/premium-consumer-v1 HEAD
cd /Users/jeremy/dev/einfach-hausen/.worktrees/premium-consumer-v1
git status --short --branch
```
Expected: clean `design/premium-consumer-v1` worktree.

- [ ] **Step 4: Persist the approved spec and this plan in the worktree**

Copy the exact approved spec content into:
```text
docs/superpowers/specs/2026-09-01-einfach-hausen-premium-consumer-redesign-design.md
```
and this implementation plan into:
```text
docs/superpowers/plans/2026-09-02-premium-marketing-site-implementation.md
```

- [ ] **Step 5: Commit the safety/bootstrap documents**

Run:
```bash
git add docs/superpowers/specs/2026-09-01-einfach-hausen-premium-consumer-redesign-design.md \
        docs/superpowers/plans/2026-09-02-premium-marketing-site-implementation.md
git commit -m "docs: define premium consumer redesign"
```
Expected: one documentation-only commit; no product source changed.

---

### Task 2: Add a failing premium-design contract before redesigning components

**Files:**
- Create: `scripts/premium-redesign-contract.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: public route files and premium component paths.
- Produces: `npm run test:premium-redesign`, a deterministic source/route contract gate.

- [ ] **Step 1: Write the failing contract script**

Create `scripts/premium-redesign-contract.mjs` with checks equivalent to:
```js
import fs from 'node:fs';

const required = [
  'src/components/marketing/premium/consumer-hero.tsx',
  'src/components/marketing/premium/visual-category-grid.tsx',
  'src/components/marketing/premium/story-steps.tsx',
  'src/components/marketing/premium/image-ui-composite.tsx',
  'src/components/marketing/premium/proof-chapter.tsx',
  'src/components/marketing/premium/partner-chapter.tsx',
  'src/components/marketing/premium/security-chapter.tsx',
  'src/components/marketing/premium/premium.module.css',
  'src/components/marketing/premium/assets.ts',
];

const errors = required.filter((path) => !fs.existsSync(path)).map((path) => `missing ${path}`);
const home = fs.readFileSync('src/app/page.tsx', 'utf8');
for (const marker of ['ConsumerHero', 'VisualCategoryGrid', 'StorySteps', 'SecurityChapter']) {
  if (!home.includes(marker)) errors.push(`homepage missing ${marker}`);
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('premium redesign contract PASS');
```

Add to `package.json`:
```json
"test:premium-redesign": "node scripts/premium-redesign-contract.mjs"
```

- [ ] **Step 2: Run the contract and verify RED**

Run:
```bash
npm run test:premium-redesign
```
Expected: FAIL with missing premium component paths.

- [ ] **Step 3: Commit the failing contract**

Run:
```bash
git add scripts/premium-redesign-contract.mjs package.json
git commit -m "test: define premium redesign contract"
```

---

### Task 3: Build the premium token and visual-role foundation

**Files:**
- Create: `src/components/marketing/premium/types.ts`
- Create: `src/components/marketing/premium/premium.module.css`
- Create: `src/components/marketing/premium/assets.ts`
- Create: `src/components/marketing/premium/consumer-hero.tsx`
- Create: `src/components/marketing/premium/visual-category-grid.tsx`
- Create: `src/components/marketing/premium/story-steps.tsx`
- Create: `src/components/marketing/premium/image-ui-composite.tsx`
- Create: `src/components/marketing/premium/proof-chapter.tsx`
- Create: `src/components/marketing/premium/partner-chapter.tsx`
- Create: `src/components/marketing/premium/security-chapter.tsx`

**Interfaces:**
- Produces: reusable `ConsumerHero`, `VisualCategoryGrid`, `StorySteps`, `ImageUIComposite`, `ProofChapter`, `PartnerChapter`, `SecurityChapter` components consumed by homepage and subpages.
- Asset manifest shape:
```ts
export type PremiumAsset = {
  src: string;
  alt: string;
  decorative?: boolean;
  focalPoint?: `${number}% ${number}%`;
};
```

- [ ] **Step 1: Create type contracts and placeholder-safe asset manifest**

Implement `types.ts` with exact exported types:
```ts
export type PremiumTone = 'cream' | 'mint' | 'mist' | 'white' | 'petrol';
export type PremiumAsset = { src: string; alt: string; decorative?: boolean; focalPoint?: `${number}% ${number}%` };
export type ProofFact = { label: string; detail: string };
export type CategoryCard = { title: string; text: string; href: string; asset: PremiumAsset; tone: PremiumTone };
export type StoryStep = { index: '01' | '02' | '03'; title: string; text: string; asset: PremiumAsset };
```

- [ ] **Step 2: Implement the premium CSS foundation**

Define scoped variables and layout roles in `premium.module.css`, including:
```css
.premiumRoot {
  --premium-petrol: #105258;
  --premium-petrol-deep: #0a3539;
  --premium-ink: #1c2129;
  --premium-cream: #f6efe5;
  --premium-mint: #eaf4ef;
  --premium-mist: #eef3f4;
  --premium-line: rgba(28,33,41,.10);
}
.chapter { padding: clamp(72px, 8vw, 132px) 0; }
.chapterCompact { padding: clamp(48px, 6vw, 88px) 0; }
.chapterImmersive { padding: clamp(88px, 10vw, 156px) 0; }
.container { width: min(1360px, calc(100% - 48px)); margin: 0 auto; }
@media (max-width: 720px) { .container { width: calc(100% - 32px); } }
```
Add component-specific classes without relying on generic white-card repetition.

- [ ] **Step 3: Implement the seven visual-role components**

Each component must accept semantic content and assets via props and must not contain route-specific hardcoded backend behavior. `ConsumerHero` receives `children` for the existing intake form so intake behavior stays owned by `src/components/home/intake-form.tsx`.

- [ ] **Step 4: Run TypeScript/build checks**

Run:
```bash
npx tsc --noEmit
npm run build
```
Expected: PASS.

- [ ] **Step 5: Run premium contract**

Run:
```bash
npm run test:premium-redesign
```
Expected: still FAIL only because homepage markers are not integrated yet.

- [ ] **Step 6: Commit foundation**

Run:
```bash
git add src/components/marketing/premium
git commit -m "feat: add premium marketing design primitives"
```

---

### Task 4: Produce and register the premium asset library

**Files:**
- Create: `public/brand/premium/homeowner-hero.webp`
- Create: `public/brand/premium/category-heating.webp`
- Create: `public/brand/premium/category-energy.webp`
- Create: `public/brand/premium/category-roof.webp`
- Create: `public/brand/premium/category-bath.webp`
- Create: `public/brand/premium/category-renovation.webp`
- Create: `public/brand/premium/category-garden.webp`
- Create: `public/brand/premium/category-care.webp`
- Create: `public/brand/premium/category-more.webp`
- Create: `public/brand/premium/story-describe.webp`
- Create: `public/brand/premium/story-professional.webp`
- Create: `public/brand/premium/story-complete.webp`
- Create: `public/brand/premium/house-record.webp`
- Create: `public/brand/premium/partner-professional.webp`
- Create: `public/brand/premium/security-home.webp`
- Modify: `src/components/marketing/premium/assets.ts`

**Interfaces:**
- Produces: `premiumAssets` object mapping semantic keys to `PremiumAsset` entries.

- [ ] **Step 1: Generate/select assets using the approved art direction**

For every asset enforce: realistic German/European home context, natural premium light, no visible third-party logos, no text baked into image, no fake certification, believable hands/faces, consistent grading.

- [ ] **Step 2: Optimize each accepted asset to WebP**

Use an image pipeline that preserves aspect ratio and creates practical web dimensions; hero/immersive images should have a long edge around 1800–2200px, cards around 900–1400px. Do not upscale low-quality sources.

- [ ] **Step 3: Fill the canonical asset manifest**

`assets.ts` exports:
```ts
export const premiumAssets = {
  homeownerHero: { src: '/brand/premium/homeowner-hero.webp', alt: 'Eigenheimbesitzer vor einem gepflegten Wohnhaus' },
  categoryHeating: { src: '/brand/premium/category-heating.webp', alt: 'Heizungs- und Thermostatdetail in einem Wohnhaus' },
  categoryEnergy: { src: '/brand/premium/category-energy.webp', alt: 'Moderne Energie- und Elektroinstallation am Eigenheim' },
  categoryRoof: { src: '/brand/premium/category-roof.webp', alt: 'Dach- und Gebäudehüllendetail eines Wohnhauses' },
  categoryBath: { src: '/brand/premium/category-bath.webp', alt: 'Sanitärdetail in einem modernen Badezimmer' },
  categoryRenovation: { src: '/brand/premium/category-renovation.webp', alt: 'Renovierungsarbeiten mit hochwertigen Materialien' },
  categoryGarden: { src: '/brand/premium/category-garden.webp', alt: 'Gepflegter Garten und Außenbereich eines Eigenheims' },
  categoryCare: { src: '/brand/premium/category-care.webp', alt: 'Pflege- und Reinigungsarbeit rund um ein Eigenheim' },
  categoryMore: { src: '/brand/premium/category-more.webp', alt: 'Werkzeuge und Hausservice für weitere Arbeiten' },
  storyDescribe: { src: '/brand/premium/story-describe.webp', alt: 'Eigentümer beschreibt ein Anliegen per Smartphone' },
  storyProfessional: { src: '/brand/premium/story-professional.webp', alt: 'Fachkraft im Gespräch über eine Arbeit am Eigenheim' },
  storyComplete: { src: '/brand/premium/story-complete.webp', alt: 'Erledigte Hausarbeit wird dokumentiert' },
  houseRecord: { src: '/brand/premium/house-record.webp', alt: 'Eigenheim als Hintergrund für die digitale Hausakte' },
  partnerProfessional: { src: '/brand/premium/partner-professional.webp', alt: 'Professionelle Fachkraft im Einsatz am Wohnhaus' },
  securityHome: { src: '/brand/premium/security-home.webp', alt: 'Ruhige Wohnsituation als Symbol für Datenschutz und Sicherheit' },
} satisfies Record<string, PremiumAsset>;
```

- [ ] **Step 4: Verify all manifest files exist**

Run a Node one-liner or extend `premium-redesign-contract.mjs` to assert every `/brand/premium/...` path exists under `public`.
Expected: PASS for asset existence.

- [ ] **Step 5: Commit assets and manifest**

Run:
```bash
git add public/brand/premium src/components/marketing/premium/assets.ts scripts/premium-redesign-contract.mjs
git commit -m "feat: add premium consumer brand assets"
```

---

### Task 5: Recompose the homepage around one conversion path

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/home/intake-form.tsx`
- Modify: `src/components/marketing/premium/premium.module.css`

**Interfaces:**
- Consumes: existing `IntakeForm` submit/navigation behavior and premium components from Task 3.
- Produces: homepage using the visual architecture defined in the approved spec.

- [ ] **Step 1: Add a failing homepage marker check**

Extend `premium-redesign-contract.mjs` so `src/app/page.tsx` must contain all of:
```text
ConsumerHero
VisualCategoryGrid
StorySteps
ImageUIComposite
ProofChapter
PartnerChapter
SecurityChapter
```
Run `npm run test:premium-redesign`; expected FAIL before the page rewrite.

- [ ] **Step 2: Rewrite the homepage composition**

The homepage order becomes:
```text
Header
ConsumerHero + existing IntakeForm
VisualCategoryGrid
StorySteps
ImageUIComposite (Hausakte)
ProofChapter
PartnerChapter
Pricing entry section
SecurityChapter
FAQ/help bridge
Conversion band
Dark branded footer via site shell
```
Keep the eight current service categories and truthful current claims. Reduce above-fold supporting copy and secondary links; retain the pilot offer only as a subordinate promotion.

- [ ] **Step 3: Preserve intake behavior exactly**

`src/components/home/intake-form.tsx` may change markup/classes, but its submit target and request forwarding must remain behaviorally identical. Add a source assertion to the existing intake regression or `premium-redesign-contract.mjs` that the same destination/query parameter remains present.

- [ ] **Step 4: Run focused gates**

Run:
```bash
npm run test:premium-redesign
npm run test:intake
npm run lint
npx tsc --noEmit
npm run build
```
Expected: all PASS.

- [ ] **Step 5: Capture homepage screenshots at four widths**

Capture `/` at 1920, 1440, 390, and 320/360 supported stress width. Store artifacts under the repository's existing visual-evidence convention, not in source directories.

Manual acceptance for homepage:
- dominant image-led hero
- intake is the obvious action within five seconds
- no icon-grid-as-main-category presentation
- three story moments are visually substantial
- Hausakte is lifestyle + product proof, not only a timeline box
- security/trust has a dark/high-weight chapter
- wide desktop has no giant dead zones

- [ ] **Step 6: Commit homepage**

Run:
```bash
git add src/app/page.tsx src/components/home/intake-form.tsx src/components/marketing/premium scripts/premium-redesign-contract.mjs
git commit -m "feat: recompose homepage as premium consumer experience"
```

---

### Task 6: Upgrade the site shell, header, and dark branded footer

**Files:**
- Modify: `src/components/marketing/site-shell.tsx`
- Modify: `src/components/marketing/marketing.module.css`
- Modify: `src/components/marketing/premium/premium.module.css`

**Interfaces:**
- Consumes: existing navigation labels/routes and auth entry points.
- Produces: premium header/footer while preserving the same navigation set.

- [ ] **Step 1: Write a nav-preservation contract**

In `premium-redesign-contract.mjs`, read `site-shell.tsx` and assert existing primary public route hrefs still exist. The test must fail if a redesign removes a required nav link.

- [ ] **Step 2: Refactor shell visuals without changing nav IA**

Keep route destinations intact. Make header quieter and more premium; replace the visually weak white footer with a deep-petrol `DarkBrandFooter` treatment containing the existing link groups plus truthful trust facts.

- [ ] **Step 3: Remove superseded shell overrides instead of adding another specificity layer**

Delete only CSS selectors that are demonstrably superseded by the new shell and premium homepage. Leave app/global unrelated styles untouched.

- [ ] **Step 4: Run gates**

Run:
```bash
npm run test:premium-redesign
npm run test:website-matrix
npm run test:a11y
npm run build
```
Expected: PASS.

- [ ] **Step 5: Commit shell**

Run:
```bash
git add src/components/marketing/site-shell.tsx src/components/marketing/marketing.module.css src/components/marketing/premium scripts/premium-redesign-contract.mjs
git commit -m "feat: upgrade public shell and branded footer"
```

---

### Task 7: Migrate the core public content routes with page-specific art direction

**Files:**
- Modify: `src/app/leistungen/page.tsx`
- Modify: `src/app/so-funktionierts/page.tsx`
- Modify: `src/app/hausakte/page.tsx`
- Modify: `src/app/preise/page.tsx`
- Modify: `src/app/partner/page.tsx`
- Modify: `src/app/sicherheit/page.tsx`
- Modify: `src/app/ueber-uns/page.tsx`
- Modify: `src/components/marketing/premium/*`

**Interfaces:**
- Consumes: shared premium primitives and asset manifest.
- Produces: seven route-specific premium pages that do not repeat one generic left-copy/right-mockup hero.

- [ ] **Step 1: Add route presence checks**

Extend `premium-redesign-contract.mjs` with a route list and assert each file imports at least one premium visual-role component or premium stylesheet.
Run the contract; expected FAIL before migration.

- [ ] **Step 2: Migrate `/leistungen`**

Use visual category gallery art direction with tangible service imagery. Preserve existing links and content semantics.

- [ ] **Step 3: Migrate `/so-funktionierts`**

Use expanded story sequence with human/professional/product states. Preserve detailed process semantics even though homepage uses only three moments.

- [ ] **Step 4: Migrate `/hausakte`**

Make this the strongest product/lifestyle composite route. Keep existing functional links intact.

- [ ] **Step 5: Migrate `/preise`**

Keep pricing calm and easy to scan; do not add fake urgency, fake discounts, or unnecessary dashboard visuals.

- [ ] **Step 6: Migrate `/partner`**

Use trade-professional imagery and current 0% commission/business claims only where already supported by product policy.

- [ ] **Step 7: Migrate `/sicherheit`**

Use deep/light trust contrast, truthful security copy, and no fake certificates.

- [ ] **Step 8: Migrate `/ueber-uns`**

Use human/mission visual tone. Do not fabricate team portraits or bios; only use generic brand imagery where real team material is unavailable.

- [ ] **Step 9: Run core route gates and capture representative screenshots**

Run:
```bash
npm run test:premium-redesign
npm run test:website-matrix
npm run test:responsive
npm run test:a11y:matrix
npm run build
```
Expected: PASS.
Capture desktop/mobile screenshots for all seven routes.

- [ ] **Step 10: Commit route migration**

Run:
```bash
git add src/app/leistungen src/app/so-funktionierts src/app/hausakte src/app/preise src/app/partner src/app/sicherheit src/app/ueber-uns src/components/marketing/premium scripts/premium-redesign-contract.mjs
git commit -m "feat: migrate core public pages to premium system"
```

---

### Task 8: Migrate help, pilot, and auth-entry surfaces without breaking flows

**Files:**
- Modify: `src/app/hilfe/page.tsx`
- Modify: `src/app/pilotphase/page.tsx`
- Modify: `src/app/login/page.tsx`
- Modify: `src/app/register/page.tsx`
- Modify: `src/app/register-owner/page.tsx`
- Modify: `src/app/register-pro/page.tsx`

**Interfaces:**
- Consumes: existing auth and registration actions/redirects.
- Produces: brand-consistent public/auth surfaces with unchanged functional contracts.

- [ ] **Step 1: Record existing auth route/action markers before edits**

Use source grep and existing auth regression scripts to document the current form actions, redirect targets, role semantics, and server-action imports used by these pages. Save the snapshot into the task evidence folder.

- [ ] **Step 2: Add preservation assertions**

Extend `premium-redesign-contract.mjs` to assert the critical action/redirect markers from Step 1 remain present after visual migration.

- [ ] **Step 3: Migrate `/hilfe` and `/pilotphase`**

`/hilfe` remains low-friction and readable; `/pilotphase` may be visually expressive but must not overshadow truthful eligibility/offer terms.

- [ ] **Step 4: Migrate login/register surfaces**

Use a calm premium brand shell, one strong contextual visual, and simple forms. Do not add marketing sections inside transactional auth forms.

- [ ] **Step 5: Run auth and public gates**

Run:
```bash
npm run test:t0168-auth
npm run test:t0170-auth
npm run test:premium-redesign
npm run test:website-matrix
npm run build
```
Expected: all PASS.

- [ ] **Step 6: Commit auth/public tail migration**

Run:
```bash
git add src/app/hilfe src/app/pilotphase src/app/login src/app/register src/app/register-owner src/app/register-pro scripts/premium-redesign-contract.mjs
git commit -m "feat: align help pilot and auth surfaces"
```

---

### Task 9: Migrate the remaining public/legal/state routes and prove complete public coverage

**Files:**
- Modify: `src/app/kontakt/page.tsx`
- Modify: `src/app/ansprechpartner/page.tsx`
- Modify: `src/app/eigenheimbesitzer/page.tsx`
- Modify: `src/app/impressum/page.tsx`
- Modify: `src/app/datenschutz/page.tsx`
- Modify: `src/app/agb/page.tsx`
- Modify: `src/app/barrierefreiheit/page.tsx`
- Modify: `src/app/welcome/page.tsx`
- Modify: `src/app/role/page.tsx`
- Modify: `src/app/check-email/page.tsx`
- Modify: `scripts/premium-redesign-contract.mjs`

**Interfaces:**
- Consumes: the repository's explicit public-route allowlist in `src/components/AuthContext.tsx` plus the premium design system.
- Produces: every allowlisted public route is either premium-migrated or explicitly classified as a transactional/state page with premium shell treatment.

- [ ] **Step 1: Make the contract derive the complete public route set from `src/components/AuthContext.tsx`**

Parse the existing `PUBLIC_ROUTES` and `PUBLIC_PREFIXES` declarations and compare them with the route files under `src/app`. The script must print every public route/prefix it evaluates and exit nonzero when a public route is not covered by the premium shell or an approved transactional-state treatment.

- [ ] **Step 2: Migrate human-facing public content routes**

Use page-specific premium composition for `/kontakt`, `/ansprechpartner`, and `/eigenheimbesitzer`. Keep their existing links/actions and copy semantics.

- [ ] **Step 3: Migrate legal/accessibility routes conservatively**

For `/impressum`, `/datenschutz`, `/agb`, and `/barrierefreiheit`, preserve legal text structure and readability. Apply premium typography, spacing, navigation/footer, and restrained brand surfaces; do not turn legal content into image-heavy marketing pages.

- [ ] **Step 4: Migrate transactional/state routes conservatively**

For `/welcome`, `/role`, and `/check-email`, preserve the existing flow and screen purpose. Apply the premium brand system without adding/removing steps or options.

- [ ] **Step 5: Run complete public-route coverage**

Run:
```bash
npm run test:premium-redesign
npm run test:website-matrix
npm run test:a11y:matrix
npm run build
```
Expected: PASS and the redesign contract reports zero uncovered public routes.

- [ ] **Step 6: Commit public-tail migration**

```bash
git add src/app/kontakt src/app/ansprechpartner src/app/eigenheimbesitzer src/app/impressum src/app/datenschutz src/app/agb src/app/barrierefreiheit src/app/welcome src/app/role src/app/check-email scripts/premium-redesign-contract.mjs
git commit -m "feat: complete premium public route migration"
```

---

### Task 10: Add redesign-specific screenshot matrix and wide-desktop acceptance gate

**Files:**
- Create: `scripts/premium-redesign-visual.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: running production-like Next.js server and route list.
- Produces: screenshots for 1920, 1440, tablet, 390, and stress-mobile widths plus an index/manifest for review.

- [ ] **Step 1: Implement the screenshot matrix using the repository's existing browser tooling**

The script must cover at minimum:
```js
const routes = ['/', '/leistungen', '/so-funktionierts', '/hausakte', '/preise', '/partner', '/sicherheit', '/ueber-uns', '/hilfe', '/pilotphase', '/login', '/register'];
const widths = [1920, 1440, 1024, 390, 360];
```
It writes screenshots into a timestamped evidence folder and exits nonzero on navigation/render failures.

- [ ] **Step 2: Add npm script**

Add:
```json
"test:premium-redesign:visual": "node scripts/premium-redesign-visual.mjs"
```

- [ ] **Step 3: Run the full visual matrix**

Run:
```bash
npm run test:premium-redesign:visual
```
Expected: all routes render at all widths with no navigation/render error.

- [ ] **Step 4: Perform the manual premium review against the approved checklist**

For every page answer yes/no in a review artifact:
1. dominant visual anchor above fold
2. primary action obvious within five seconds where applicable
3. consumer-brand rather than generic SaaS silhouette
4. adjacent chapters have visual variety
5. no dead area caused only by padding
6. imagery used where icons previously carried too much visual responsibility
7. product mockups support rather than replace the story
8. proof is truthful
9. 1920px layout intentionally fills the viewport
10. mobile is deliberately recomposed

Any “no” blocks acceptance and must be fixed before Task 10.

- [ ] **Step 5: Commit visual gate**

Run:
```bash
git add scripts/premium-redesign-visual.mjs package.json
git commit -m "test: add premium visual review matrix"
```

---

### Task 11: Consolidate CSS and remove superseded homepage design layers

**Files:**
- Modify: `src/components/marketing/marketing.module.css`
- Modify: `src/components/marketing/premium/premium.module.css`

**Interfaces:**
- Consumes: all migrated public routes.
- Produces: one clear premium layer without contradictory old homepage overrides.

- [ ] **Step 1: Identify selectors no longer referenced by migrated homepage/public components**

Use a deterministic source search over `src/app` and `src/components/marketing` before removal. Only remove selectors with zero remaining references or selectors explicitly superseded by premium equivalents.

- [ ] **Step 2: Delete obsolete override blocks**

Remove superseded homepage-specific layers such as duplicate hero sizing, duplicate service-grid decoration, old process-line styling, and obsolete floating-card rules only after confirming no migrated route consumes them.

- [ ] **Step 3: Run full static/build/visual gates**

Run:
```bash
npm run lint
npx tsc --noEmit
npm run build
npm run test:premium-redesign
npm run test:visual
npm run test:responsive
npm run test:a11y:matrix
```
Expected: PASS.

- [ ] **Step 4: Commit CSS consolidation**

Run:
```bash
git add src/components/marketing/marketing.module.css src/components/marketing/premium/premium.module.css
git commit -m "refactor: consolidate premium marketing styles"
```

---

### Task 12: Final release gates, documentation, and rollback evidence

**Files:**
- Create: `docs/PREMIUM_REDESIGN_HANDOVER.md`
- Modify: `DESIGN.md`
- Modify: `README.md`
- Modify: `docs/NEXT_AGENT.md`
- Modify: `docs/PRODUCTION_HANDOVER.md`
- Modify: `docs/ARCHITECTURE.md`

**Interfaces:**
- Produces: complete handover with baseline, redesign branch SHA, asset map, test matrix, deployment instructions, and rollback instructions.

- [ ] **Step 1: Run the complete project gate set**

Run the repository's release gate plus the redesign-specific gates:
```bash
npm run release-gate
npm run test:premium-redesign
npm run test:premium-redesign:visual
npm run test:t0168-auth
npm run test:t0170-auth
npm run test:intake
npm run test:website-matrix
npm run test:responsive
npm run test:a11y:matrix
```
Expected: PASS. Any failure blocks merge/deploy.

- [ ] **Step 2: Verify no backend/business files changed unexpectedly**

Run:
```bash
git diff --name-only backup/pre-premium-redesign-20260902...HEAD
```
Review the list. Backend/auth implementation changes are allowed only if they are strictly necessary to preserve existing front-end integration and have explicit regression coverage; otherwise revert those individual changes with normal edits, not destructive history commands.

- [ ] **Step 3: Write rollback instructions into handover**

`docs/PREMIUM_REDESIGN_HANDOVER.md` must record:
```text
Baseline ref: backup/pre-premium-redesign-20260902
Baseline SHA: value written by `git rev-parse backup/pre-premium-redesign-20260902` during Task 11
Redesign branch: design/premium-consumer-v1
Rollback before merge: switch to main; no revert needed
Rollback after merge: normal git revert of redesign merge commit(s) or redeploy baseline; no force/reset
```
The actual SHA from Task 1 is copied verbatim into the document during execution.

- [ ] **Step 4: Update architecture/design docs**

Document premium visual-role components, asset manifest ownership, marketing-vs-app boundary, and the rule that macro art direction precedes polish.

- [ ] **Step 5: Commit documentation**

Run:
```bash
git add docs/PREMIUM_REDESIGN_HANDOVER.md DESIGN.md README.md docs/NEXT_AGENT.md docs/PRODUCTION_HANDOVER.md docs/ARCHITECTURE.md
git commit -m "docs: hand over premium marketing redesign"
```

- [ ] **Step 6: Stop for user visual acceptance before merge**

Do not merge `design/premium-consumer-v1` into `main` until the user has reviewed the screenshot matrix and explicitly approved the website design.
