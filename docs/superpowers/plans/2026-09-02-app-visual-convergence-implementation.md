# Einfach Hausen App Visual Convergence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the existing Owner and Pro apps to the same premium brand quality as the redesigned website without changing navigation structure, route structure, core screen architecture, or product behavior.

**Architecture:** Apply a protected-structure visual pass to existing app components and screens. First freeze navigation/route contracts and capture before screenshots; then introduce shared app visual tokens and polish representative screens before rolling those refinements through the remaining Owner and Pro routes.

**Tech Stack:** Existing Next.js/React app surfaces, current CSS/global styles, Lucide/custom icons, existing app visual regression, responsive, accessibility, and auth regression scripts.

**Spec:** `docs/superpowers/specs/2026-09-01-einfach-hausen-premium-consumer-redesign-design.md`

## Global Constraints

- This plan executes only after the public website premium system has passed user visual acceptance.
- Do not add or remove navigation items.
- Do not rename navigation semantics unless separately approved.
- Do not remove existing screens or invent new product screens.
- Do not change core user flows, route structure, backend behavior, or business logic for visual reasons.
- Before/after screenshots must retain the same conceptual controls and navigation in the same roles.
- Preserve auth/role isolation between Owner and Pro.
- Never use destructive git reset/clean/force operations.

---

## File Structure Map

**Create**
- `scripts/app-structure-contract.mjs` — navigation/route freeze gate.
- `docs/APP_VISUAL_CONVERGENCE_HANDOVER.md` — before/after and protected-structure evidence.

**Modify**
- `src/app/app/page.tsx`
- `src/app/app/home/page.tsx`
- `src/app/app/hausmeister/page.tsx`
- `src/app/app/jobs/page.tsx`
- `src/app/app/documents/page.tsx`
- `src/app/app/messages/page.tsx`
- `src/app/app/calendar/page.tsx`
- `src/app/app/plans/page.tsx`
- `src/app/app/profile/page.tsx`
- `src/app/app/settings/page.tsx`
- `src/app/app/insurance/page.tsx`
- `src/app/app/partners/page.tsx`
- `src/app/app/year/page.tsx`
- `src/app/app/consultation/page.tsx`
- `src/app/app/emergency/page.tsx`
- `src/app/app/more/page.tsx`
- `src/app/pro/page.tsx`
- `src/app/pro/orders/page.tsx`
- `src/app/pro/leads/page.tsx`
- `src/app/pro/messages/page.tsx`
- `src/app/pro/calendar/page.tsx`
- `src/app/pro/plans/page.tsx`
- `src/app/pro/profile/page.tsx`
- `src/app/pro/team/page.tsx`
- `src/app/globals.css` — refine the existing scoped `.app-page`, `.phone-shell`, `.bottom-nav`, `.pro-theme`, form, card, and state selectors; avoid unrelated public marketing changes.
- `package.json`

---

### Task 1: Freeze app structure before touching visuals

**Files:**
- Create: `scripts/app-structure-contract.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: `npm run test:app-structure`, a gate that prevents accidental nav/route loss.

- [ ] **Step 1: Enumerate current Owner and Pro route files**

Use filesystem discovery under `src/app/app` and `src/app/pro` and store the expected route list directly in `app-structure-contract.mjs`.

- [ ] **Step 2: Record current navigation labels/hrefs from shared nav components**

The contract must assert the exact current label/href pairs remain present. It must not enforce CSS classes or layout markup.

- [ ] **Step 3: Add package script**

Add:
```json
"test:app-structure": "node scripts/app-structure-contract.mjs"
```

- [ ] **Step 4: Run and verify GREEN before redesign**

Run:
```bash
npm run test:app-structure
npm run test:t0168-auth
npm run test:t0170-auth
```
Expected: PASS before any visual changes.

- [ ] **Step 5: Commit structure freeze**

```bash
git add scripts/app-structure-contract.mjs package.json
git commit -m "test: freeze app navigation structure"
```

---

### Task 2: Capture before-state app screenshots

**Files:**
- No production source changes.

**Interfaces:**
- Produces: Owner and Pro baseline screenshot evidence at mobile and desktop/app-shell widths.

- [ ] **Step 1: Use the existing app visual regression harness**

Run:
```bash
npm run test:visual:apps
```
Capture or preserve current baselines for representative screens: Owner home/hausmeister/jobs/documents/messages/profile and Pro dashboard/orders/leads/messages/team/profile.

- [ ] **Step 2: Record the current navigation and primary controls in the review artifact**

For each representative screen, list visible nav labels and primary controls. This becomes the visual-preservation checklist.

- [ ] **Step 3: Commit only evidence metadata if repository policy tracks it**

Do not rewrite baselines yet.

---

### Task 3: Introduce shared app premium tokens without changing IA

**Files:**
- Modify: `src/app/globals.css`

**Interfaces:**
- Produces: shared visual classes for surfaces, cards, headers, buttons, inputs, empty states, focus states, and Owner/Pro variants.

- [ ] **Step 1: Implement scoped app visual tokens**

Extend the existing app-scoped variables under `.app-page` and `.pro-theme` with a limited set derived from the website brand:
```css
.app-page {
  --app-petrol: #105258;
  --app-petrol-deep: #0a3539;
  --app-ink: #1c2129;
  --app-muted: #66706a;
  --app-mint: #eaf4ef;
  --app-surface: #ffffff;
  --app-line: rgba(28,33,41,.10);
}
```
Pro retains its darker operational character but uses the same brand family.

- [ ] **Step 2: Apply the new values only through existing scoped app selectors**

Refine `.phone-shell`, `.topbar`, `.bottom-nav`, `.screen`, cards, buttons, inputs, empty states, and `.pro-theme` variants in `src/app/globals.css`. Do not change navigation markup or move/replace navigation items.

- [ ] **Step 3: Run structure/auth/a11y gates**

```bash
npm run test:app-structure
npm run test:t0168-auth
npm run test:t0170-auth
npm run test:a11y:apps
```
Expected: PASS.

- [ ] **Step 4: Commit foundation**

```bash
git add src/app/globals.css package.json
git commit -m "feat: add shared premium app visual tokens"
```

---

### Task 4: Polish Owner representative screens first

**Files:**
- Modify: `src/app/app/home/page.tsx`
- Modify: `src/app/app/hausmeister/page.tsx`
- Modify: `src/app/app/jobs/page.tsx`
- Modify: `src/app/app/documents/page.tsx`
- Modify: `src/app/app/messages/page.tsx`
- Modify: `src/app/app/profile/page.tsx`

**Interfaces:**
- Consumes: scoped app premium tokens in `src/app/globals.css`.
- Produces: Owner visual reference screens for the rest of `/app/*`.

- [ ] **Step 1: Polish visual hierarchy only**

Improve typography, section spacing, card surface contrast, form affordances, empty states, and media framing. Do not add/remove controls or change navigation.

- [ ] **Step 2: Capture after screenshots for the same screens/widths as Task 2**

Compare side by side and assert same conceptual navigation and primary controls remain.

- [ ] **Step 3: Run Owner gates**

```bash
npm run test:app-structure
npm run test:visual:apps
npm run test:responsive
npm run test:a11y:apps
npm run build
```
Expected: PASS after intentional baseline review/update.

- [ ] **Step 4: Commit Owner reference polish**

```bash
git add src/app/app src/app/globals.css
git commit -m "feat: polish owner app visual system"
```

---

### Task 5: Roll Owner polish through remaining screens

**Files:**
- Modify: remaining `src/app/app/*/page.tsx` routes listed in the file map.

**Interfaces:**
- Consumes: Owner reference patterns from Task 4.
- Produces: visually consistent Owner app with unchanged product structure.

- [ ] **Step 1: Apply the approved visual patterns screen by screen**

Do not copy a single card layout blindly; keep screen-specific hierarchy while reusing tokens and component treatments.

- [ ] **Step 2: Run all app gates**

```bash
npm run test:app-structure
npm run test:visual:apps
npm run test:responsive
npm run test:a11y:matrix
npm run build
```
Expected: PASS.

- [ ] **Step 3: Commit remaining Owner polish**

```bash
git add src/app/app
git commit -m "feat: converge remaining owner screens"
```

---

### Task 6: Polish Pro representative screens first

**Files:**
- Modify: `src/app/pro/page.tsx`
- Modify: `src/app/pro/orders/page.tsx`
- Modify: `src/app/pro/leads/page.tsx`
- Modify: `src/app/pro/messages/page.tsx`
- Modify: `src/app/pro/team/page.tsx`
- Modify: `src/app/pro/profile/page.tsx`

**Interfaces:**
- Consumes: shared brand tokens in `src/app/globals.css` plus existing Pro dark theme semantics.
- Produces: Pro reference screens for remaining `/pro/*` routes.

- [ ] **Step 1: Refine Pro operational visual language**

Improve dashboard density, status hierarchy, data cards, action affordances, dark-surface contrast, and form quality. Preserve all controls and route meanings.

- [ ] **Step 2: Capture after screenshots and compare to Task 2**

The same navigation items and primary controls must remain visible in their same conceptual roles.

- [ ] **Step 3: Run Pro gates**

```bash
npm run test:app-structure
npm run test:visual:apps
npm run test:t0170-auth
npm run test:a11y:apps
npm run build
```
Expected: PASS.

- [ ] **Step 4: Commit Pro reference polish**

```bash
git add src/app/pro src/app/globals.css
git commit -m "feat: polish pro app visual system"
```

---

### Task 7: Roll Pro polish through remaining screens

**Files:**
- Modify: remaining `src/app/pro/*/page.tsx` routes listed in the file map.

**Interfaces:**
- Produces: visually converged Pro app with unchanged IA.

- [ ] **Step 1: Apply approved Pro visual patterns**

Keep existing workflow/control placement semantics. Visual density may improve; information architecture may not change.

- [ ] **Step 2: Run complete app regression matrix**

```bash
npm run test:app-structure
npm run test:visual:apps
npm run test:responsive
npm run test:a11y:matrix
npm run test:t0168-auth
npm run test:t0170-auth
npm run build
```
Expected: PASS.

- [ ] **Step 3: Commit remaining Pro polish**

```bash
git add src/app/pro
git commit -m "feat: converge remaining pro screens"
```

---

### Task 8: Final visual evidence and handover

**Files:**
- Create: `docs/APP_VISUAL_CONVERGENCE_HANDOVER.md`
- Modify: `DESIGN.md`, `docs/NEXT_AGENT.md`, `docs/PRODUCTION_HANDOVER.md`

**Interfaces:**
- Produces: before/after evidence plus explicit proof that navigation/IA was preserved.

- [ ] **Step 1: Run final gates**

```bash
npm run test:app-structure
npm run test:visual:apps
npm run test:responsive
npm run test:a11y:matrix
npm run test:t0168-auth
npm run test:t0170-auth
npm run build
```
Expected: PASS.

- [ ] **Step 2: Document protected-structure verification**

The handover must include the exact navigation label/href set from `app-structure-contract.mjs` and state that no items were added/removed.

- [ ] **Step 3: Commit handover**

```bash
git add docs/APP_VISUAL_CONVERGENCE_HANDOVER.md DESIGN.md docs/NEXT_AGENT.md docs/PRODUCTION_HANDOVER.md
git commit -m "docs: hand over app visual convergence"
```

- [ ] **Step 4: Stop for user screenshot review before merging/deploying app polish**
