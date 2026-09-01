# Einfach Hausen — Premium Consumer Redesign V1

**Design specification**
**Date:** 2026-09-01
**Status:** Proposed for user review
**Primary reference:** DoktorABC homepage screenshot supplied by the user
**Primary implementation target:** `einfach-hausen` public website first; Owner/Pro apps second, visual polish only
**Backend constraint:** preserve existing backend, auth, APIs, data models, business logic, and working frontend-to-backend flows

---

## 1. Executive intent

Einfach Hausen currently behaves more like a clean SaaS/product prototype than a premium consumer brand. The redesign must change the visible experience without replacing the underlying product. The goal is not to clone DoktorABC; the goal is to adopt the design principles that make the reference feel modern, dense, trustworthy, emotionally legible, and commercially finished.

The public website is the first and highest-priority wave. The Owner and Pro apps follow only after the website establishes the new brand system. App information architecture is protected: navigation items, core screen structure, feature set, and business flows must not be casually added, removed, or rearranged.

The central design rule is:

> Macro art direction comes before micro polish. A page is not premium because it has more whitespace, shadows, motion, gradients, Lucide icons, or rounded cards. It is premium when composition, imagery, hierarchy, chapter rhythm, trust, and conversion priority work together before the user reads the copy.

---

## 2. Safety / rollback contract

### 2.1 Verified baseline

The last live Mac-M1 repository check before this specification showed:

- branch: `main`
- working tree: clean
- `HEAD`: `aa84ee2`
- `origin/main`: `aa84ee2`
- commit: `docs: final handover - designer-boss premium website wave`

This exact commit is the canonical **PREMIUM-REDESIGN-BASELINE**.

### 2.2 Hard safety rules

No redesign implementation may use:

- `git reset --hard`
- `git clean`
- force-push
- destructive history rewrites
- deleting unrelated worktrees
- deleting backend code merely because it is not visible in the redesigned page

### 2.3 Implementation isolation

Implementation must start from `aa84ee2` on a dedicated redesign branch/worktree, for example:

```text
design/premium-consumer-v1
```

`main` stays untouched while the redesign is being evaluated. The redesign is merged only after visual acceptance and regression gates pass.

### 2.4 Easy rollback

The guaranteed baseline is `aa84ee2`. A rejected redesign can be abandoned by switching back to `main`; no revert is required if implementation remains isolated.

For an explicit restoration branch at any later point:

```bash
git switch -c restore/pre-premium-redesign aa84ee2
```

If the redesign was already merged, restoration must be performed with normal revert commits or by redeploying the known baseline commit; no history rewrite is required.

### 2.5 Recommended named snapshot once Mac-M1 execution access is available

Create an additional human-readable safety ref before implementation:

```bash
git branch backup/pre-premium-redesign-20260901 aa84ee2
```

Optionally push that branch if repository policy allows it. This is convenience; the immutable baseline SHA remains the source of truth.

---

## 3. Scope

### 3.1 Wave 1 — public website, complete premium redesign

The whole visible marketing/public experience is in scope, including at minimum:

- `/`
- `/leistungen`
- `/so-funktionierts`
- `/hausakte`
- `/preise`
- `/partner`
- `/sicherheit`
- `/ueber-uns`
- `/hilfe`
- `/pilotphase`
- `/login`
- `/register`
- `/register-owner`
- `/register-pro`
- other public/marketing/auth entry pages that use the same visible brand system

The website information architecture may be recomposed when necessary for better storytelling and conversion, provided routes and underlying product flows continue to work.

### 3.2 Wave 2 — Owner and Pro apps, protected structure

The apps are in scope for visual quality only after the website system is established.

Allowed:

- typography refinement
- spacing/rhythm
- card/component visual quality
- surface hierarchy
- button/input treatment
- icon consistency
- illustration/image quality
- visual section headers
- color calibration
- controlled motion
- consistent brand expression

Protected unless explicitly approved separately:

- navigation item count
- navigation labels/meaning
- removal of existing screens
- addition of arbitrary new screens
- core user flows
- route structure
- product logic
- backend behavior

### 3.3 Out of scope for this redesign

- replacing the backend
- rewriting auth architecture
- changing database schema solely for visual reasons
- redesigning business rules
- inventing fake reviews, certifications, press coverage, customer counts, or success metrics
- copying DoktorABC assets, copy, layout, or proprietary branding 1:1

---

## 4. Diagnosis of the current design

### 4.1 Primary failure

The existing site over-optimizes micro-design while under-investing in macro art direction. The current homepage contains technically polished elements—gradients, floating proof cards, draw-path underline, motion primitives, icon tiles, and product mockups—but the page still reads as a SaaS demo rather than a premium consumer brand.

### 4.2 Current anti-patterns to remove

1. **UI as the main visual language**
   Too many sections communicate through software mockups, timelines, icons, or abstract panels rather than people, homes, physical objects, and lived situations.

2. **Icon-grid-as-final-design**
   Category and trust information is repeatedly expressed as white cards with small Lucide icons. This is useful for documentation, not sufficient as final high-end consumer art direction.

3. **Whitespace without visual payload**
   Large section paddings are not inherently premium. Empty space must frame a strong visual anchor; otherwise it feels unfinished.

4. **SaaS hero default**
   "Big headline left + product UI right" is overused and insufficient for an emotional homeowner service proposition.

5. **Monotone chapter system**
   White, off-white, pale green, border, card, repeat. The reference succeeds because each chapter has a distinct visual temperature while retaining brand consistency.

6. **Too much explanatory copy above the fold**
   Pilot banner + badges + long body copy + intake + extra strip + links + UI preview all compete simultaneously.

7. **Weak process storytelling**
   Numeric steps and lines explain a process but do not dramatize it.

8. **Weak human trust layer**
   A service involving homes and contractors requires visible, credible people and situations.

9. **Repeated component silhouette**
   Border + radius + white surface + icon + text appears too often. A premium page needs compositional variety.

10. **False completion via polish**
    Passing lint/build/visual regression does not prove that the page is visually excellent. Visual gates must evaluate art direction, not just technical correctness.

---

## 5. Reference translation: what to learn from DoktorABC

The redesign may learn from these principles without copying:

### 5.1 Strong visual anchors

Each major section should have at least one dominant visual element:

- a person
- a house/home context
- a contractor/technician
- a physical object
- a high-quality branded illustration/render
- or a product UI composition large enough to tell a story

### 5.2 Visual category cards

Service categories should feel tangible. Use image/object-based cards, not icon-only grids.

Potential Einfach Hausen visual subjects:

- heating / radiator / thermostat / boiler detail
- electrical / EV charger / PV / breaker detail
- roof / gutter / tile / facade
- bathroom / faucet / shower detail
- garden / hedge / tools
- renovation / paint / flooring / carpentry

### 5.3 Distinct section worlds

Rotate controlled branded tones:

- warm cream / sand for home/lifestyle
- mint for assistance and service
- cool pale blue/grey for organization/documentation
- clean white for conversion
- deep petrol for trust/security/partner sections

No rainbow palette. All colors must feel derived from the Einfach Hausen brand.

### 5.4 Story-driven process

Replace generic linear steps with three large staged moments:

1. **Beschreiben** — homeowner + phone / concern
2. **Passenden Menschen bekommen** — real professional / communication
3. **Erledigt & gespeichert** — completed home task + house record/documentation

The cards may overlap slightly or use controlled depth/perspective, but effects remain secondary to comprehension.

### 5.5 Trust as a chapter, not a footnote

Trust must become visually substantial. Use only claims that can be supported by the product or evidence. If verified numbers or reviews do not exist, do not fabricate them.

---

## 6. Brand and visual direction

### 6.1 Brand personality

The website should feel:

- capable
- warm
- modern
- calm
- trustworthy
- human
- visually confident
- consumer-first
- technically competent without looking technical

It should not feel:

- corporate insurance portal
- generic Next.js SaaS starter
- fintech dashboard
- sterile government portal
- luxury for luxury's sake
- cartoonish home-service marketplace

### 6.2 Color system

Keep existing Petrol/Charcoal identity as the anchor, but expand supporting surfaces.

Core intent:

- **Petrol:** brand, primary actions, trust
- **Charcoal:** headline authority
- **Warm cream/sand:** home/lifestyle chapters
- **Soft mint:** help/service chapters
- **Cool mist:** records/organization chapters
- **White:** selective clean surfaces, not the default answer to every section
- **Deep petrol:** footer, security, or partner trust chapter

Exact token values are implementation details and should be derived from existing brand tokens instead of introducing unrelated colors.

### 6.3 Typography

Use the current brand-compatible type foundation but change usage:

- shorter hero headline
- bold, editorial section statements
- fewer long explanatory paragraphs
- clear contrast between statement, supporting copy, metadata, and microcopy
- avoid tiny text as a substitute for hierarchy

Target hierarchy:

- hero: visually dominant, compact message
- section statement: large, 1–2 lines
- supporting copy: 1 concise paragraph
- proof/caption: intentionally small

### 6.4 Shape language

Rounded corners remain part of the design, but no single radius should define the whole site. Use a hierarchy:

- large visual chapters: generous radius
- product UI overlays: medium radius
- pills/chips: full radius only when semantically appropriate
- imagery may occasionally bleed to section edges or use asymmetric framing

### 6.5 Motion

Motion supports, never creates, the premium feeling.

Keep:

- subtle reveal
- small depth/lift
- controlled parallax or float where meaningful
- deliberate process activation

Avoid:

- animation added to compensate for weak composition
- excessive floating cards
- simultaneous competing motions
- novelty effects on every section

---

## 7. Asset strategy

The user explicitly approved new premium image worlds, including AI-generated brand assets.

### 7.1 Required asset families

Create a consistent library for:

1. homeowner lifestyle
2. home exterior/interior context
3. skilled tradespeople / service professionals
4. category objects / cutouts
5. house-record / document/product composites
6. security/trust chapter
7. partner/business chapter

### 7.2 Asset consistency rules

All generated/selected assets should share:

- realistic European/German residential context where visible
- natural daylight or controlled premium studio light
- restrained styling
- real materials and believable homes
- warm but not overly stock-photo expressions
- consistent grading across pages
- enough negative space for layout use

Avoid:

- uncanny faces/hands
- US-suburban clichés when avoidable
- random luxury mansions disconnected from the target market
- fake uniforms/logos
- fake certificates
- text baked into generated images unless intentionally approved

### 7.3 Product UI remains visible

Product UI is not removed. It changes role:

- secondary proof
- floating context card
- embedded screenshot
- before/after workflow result
- house-record overlay

It should no longer dominate every major visual section.

---

## 8. New public website design system

### 8.1 Core primitives

The marketing component layer should support at least:

- `ConsumerHero`
- `VisualCategoryRail` / `VisualCategoryGrid`
- `StoryStepCard`
- `ImageUIComposite`
- `ProofChapter`
- `TrustMetric`
- `LifestyleSplit`
- `PartnerChapter`
- `SecurityChapter`
- `EditorialStatement`
- `ConversionBand`
- `DarkBrandFooter`

Names may change during implementation; responsibilities should remain clear.

### 8.2 Component principle

Components should encode visual roles, not generic containers only. A generic `Section` can remain for simple pages, but the new premium homepage must not be assembled solely from generic `Section + InfoPanel + IconGrid` primitives.

### 8.3 Density modes

Support at least:

- compact conversion block
- normal editorial chapter
- immersive visual chapter
- dark trust chapter

This prevents every section from sharing one global padding/rhythm.

---

## 9. Homepage information and visual architecture

### 9.1 Header

Goals:

- calmer and more premium
- strong brand lockup
- clear primary CTA
- navigation readable but not dominant
- sticky behavior retained if useful

Do not clutter the header with extra navigation items merely for redesign purposes.

### 9.2 Hero — one primary job

Primary user question:

> "Kann mir Einfach Hausen bei meinem Hausproblem helfen und was muss ich jetzt tun?"

Hero requirements:

- compact headline with a single strong promise
- one concise supporting paragraph
- intake field / concern entry is primary conversion action
- one dominant homeowner/home visual
- product UI appears as contextual proof, not the main hero object
- trust proof kept concise
- pilot promotion may remain but must not dominate the main promise

The hero should feel understandable in approximately five seconds without reading every sentence.

### 9.3 Visual service categories

Replace the current table-like service grid with high-quality clickable category cards.

Recommended initial categories:

- Reparatur & Montage
- Elektro & Energie
- Heizung & Sanitär
- Dach & Gebäudehülle
- Ausbau & Renovierung
- Garten & Außenbereich
- Pflege & Reinigung
- Weitere Hausdienste

Each category gets:

- recognisable visual
- distinct controlled tone
- short label
- optional short descriptor
- clear interaction affordance

### 9.4 How it works — three story moments

Move from four abstract micro-steps to three visually substantial chapters/cards while preserving the underlying meaning:

1. Anliegen beschreiben
2. Einordnen + passenden nächsten Schritt / Ansprechpartner
3. Erledigung + Hausakte

If detailed four-step semantics are required elsewhere, keep them on `/so-funktionierts`; the homepage should optimize comprehension, not exhaustiveness.

### 9.5 House record / long-term value

Goal: make the Hausakte emotionally understandable.

Visual concept:

- real home context or homeowner
- overlaid product cards such as:
  - Heizung gewartet
  - Rechnung gespeichert
  - Garantie vorhanden
  - Ansprechpartner bekannt
- one clear statement about the home becoming better organized over time

### 9.6 Proof / trust

Use real, supportable facts only.

Potential proof themes:

- geprüfte Vertragspartner
- persönlicher Ansprechpartner
- geordnete Hausakte
- keine automatische Beauftragung
- no lead-auction logic if accurately supported by product policy
- security/privacy principles

Verified public reviews, press, customer counts, or transaction counts may be added later only when evidence exists.

### 9.7 Partner chapter

The current three-feature SaaS grid is replaced with a human business chapter:

- real professional / trade context
- strong value statement
- 0% commission claim only if current product model supports it
- quality/matching explanation
- clear CTA to partner information

### 9.8 Pricing / entry

Pricing should be visually simple, credible, and legible. Avoid oversized pricing dashboards if the pricing model is small.

Focus:

- easy entry
- what is free
- what costs later
- no hidden marketplace ambiguity

### 9.9 Security/privacy

Dedicated premium trust chapter with deep petrol visual treatment. Make privacy/security feel like a core product property, not legal footer copy.

### 9.10 Footer

Replace the weak white visual fade-out with a substantial branded footer:

- deep petrol / near-black brand surface
- logo and concise brand promise
- structured link groups
- trust facts / legal links
- no fake certification strip

---

## 10. Public subpage system

Every public page should inherit the new brand system but not become a copy of the homepage.

### 10.1 Subpage hero rules

A subpage hero should include:

- one thematic statement
- one relevant visual or contextual product composition when useful
- concise supporting copy
- primary action only when relevant

Avoid repeating the same generic left-text/right-mockup silhouette across every route.

### 10.2 Page-specific art direction

Examples:

- `/leistungen`: visual category gallery / real service objects
- `/so-funktionierts`: expanded story sequence with real people and product states
- `/hausakte`: strongest product/lifestyle composite page
- `/preise`: calm, simple pricing clarity, not visual noise
- `/partner`: trade professional imagery + business proof
- `/sicherheit`: trust/security visual system, dark/light contrast
- `/ueber-uns`: human/team/mission feel rather than generic corporate copy
- `/hilfe`: supportive, low-friction, searchable/helpful—not visually overdesigned
- auth/register routes: brand-consistent, simple, conversion-first; no marketing clutter during account creation

---

## 11. App visual convergence — strict guardrails

### 11.1 Non-negotiable structure protection

The Owner and Pro app already have approved/established screen structures. The redesign must not treat the apps as a blank canvas.

Do not add/remove navigation items or redesign information architecture without a separate explicit product decision.

### 11.2 App quality goals

Use the website system to improve:

- brand color consistency
- typography
- card depth/surface contrast
- input/button quality
- empty states
- section title hierarchy
- photo/illustration quality where screens already call for media
- micro-motion
- accessible focus and interaction states

### 11.3 App acceptance rule

A screenshot of the same app screen before and after should clearly look more refined while the user can still point to the same navigation and same core controls in the same conceptual places.

---

## 12. `sin-frontend-design` redesign requirements

The existing design skill must be expanded because current behavior allows agents to pass technical checks while still producing generic visual work.

### 12.1 New core doctrine

The skill must teach:

> Premium frontend design is primarily a macro-composition and art-direction problem. Typography, shadows, rounded cards, animations, and gradients are polish layers, not substitutes for visual storytelling.

### 12.2 Mandatory audit dimensions

Before designing against a visual reference, agents must explicitly compare:

1. macro composition
2. visual hierarchy
3. image/asset strategy
4. human presence
5. visual density
6. section/chapter rhythm
7. conversion priority
8. trust/proof strategy
9. color-story variation
10. component silhouette repetition
11. responsive composition
12. brand distinctiveness

### 12.3 Mandatory three-level diagnosis

The skill must separate findings into:

#### Level A — Art direction / macro
Examples:
- wrong hero concept
- no human imagery
- no chapter rhythm
- wrong density
- generic SaaS silhouette

#### Level B — Component system
Examples:
- icon-grid dependency
- weak cards
- poor button/input hierarchy
- repetitive panels

#### Level C — Polish
Examples:
- hover
- shadow
- animation
- micro-spacing
- border nuance

Agents must not spend most effort on Level C when Level A is failing.

### 12.4 Anti-pattern catalogue

The skill must explicitly flag:

- SaaS hero by default
- icon grid as finished category design
- huge whitespace with little content
- generic gradients as premium signal
- excessive rounded white cards
- motion-first redesign
- copying reference surface details without its compositional logic
- adding fake social proof
- changing product IA when task is visual polish
- declaring completion based only on build/lint/regression passes

### 12.5 Asset strategy requirement

When the reference depends materially on imagery, the skill must force an asset decision:

- use existing real assets
- acquire appropriate licensed assets
- generate brand-consistent assets
- or explicitly accept a lower visual ceiling

An agent may not silently replace photo-led art direction with icons because assets are inconvenient.

### 12.6 Reference translation rule

For every strong reference, agents must answer:

- What makes the reference successful?
- Which effects are structural vs decorative?
- Which structural principles transfer to this brand?
- Which elements must not be copied?
- What is the equivalent visual metaphor for this product?

### 12.7 Premium acceptance gates

Add visual gates beyond technical tests:

- Is the page understandable without reading all copy?
- Does every major viewport contain a deliberate visual anchor?
- Is the primary CTA obvious?
- Is there compositional variety?
- Is there excessive repeated card silhouette?
- Does the page still look premium at full desktop width?
- Does mobile retain a deliberate composition rather than simply stacking desktop cards?
- Are trust claims real and supportable?
- Does it look like this brand rather than a template?

### 12.8 Marketing vs app boundary

The skill must distinguish:

- **Marketing site:** structure may be recomposed to improve story/conversion
- **Product app polish:** preserve established IA unless redesign scope explicitly includes product UX

This exact distinction is required for Einfach Hausen and should become reusable guidance.

### 12.9 Skill quality verification

Because this is a reusable skill, its update should be tested with pressure scenarios before/after editing it. Suggested scenario:

> "Make this bland SaaS homepage look premium like the supplied consumer reference. Keep functionality."

Baseline failure patterns to check:

- only gradients/shadows/motion
- no asset strategy
- icon grids retained
- no macro analysis
- claims completion after lint/build

The updated skill should cause an agent to catch and correct those failures.

---

## 13. Technical architecture constraints

### 13.1 Reuse existing working behavior

Keep and adapt rather than rewrite blindly:

- intake submission flow
- auth redirects
- register flow
- route semantics
- existing backend calls
- current accessibility hooks
- existing motion primitives when they genuinely help
- visual regression harness
- responsive/a11y gates

### 13.2 Expected main frontend touch points

Likely areas include:

```text
src/app/page.tsx
src/app/<public routes>/page.tsx
src/components/marketing/site-shell.tsx
src/components/marketing/ui.tsx
src/components/marketing/marketing.module.css
src/components/home/intake-form.tsx
src/components/marketing/*
public/<new brand asset folders>
```

Exact file list must be confirmed in the implementation plan after spec approval.

### 13.3 CSS strategy

Do not append another giant override layer to an already long stylesheet merely to win specificity.

Preferred implementation direction:

- consolidate homepage/public marketing styles
- extract clear visual-role components
- reduce contradictory override layers
- preserve existing global tokens where compatible
- introduce new tokens deliberately

Refactoring should remain scoped to the frontend areas touched by the redesign.

---

## 14. Responsive design requirements

### 14.1 Desktop

Primary target is not just 1200px content correctness; the page must feel intentionally designed on wide desktop screens such as 1440–1920px.

Requirements:

- no giant dead side/vertical zones
- imagery scales with composition
- sections feel full but not crowded
- text line lengths remain controlled
- cards are not tiny islands in an empty viewport

### 14.2 Tablet

- preserve visual hierarchy
- categories may move to 2-column or rail layouts
- image/UI composites recompose instead of merely shrinking

### 14.3 Mobile

Mobile must be separately composed.

Avoid:

- stacking every desktop card into one endless column without redesign
- tiny overlays
- overlong hero before CTA
- excessive decorative layers competing with content

Maintain:

- primary intake/CTA near top
- readable large type
- strong imagery
- simple category interaction
- clear touch targets

---

## 15. Accessibility and truthfulness

Premium design cannot reduce accessibility.

Must retain or improve:

- focus visibility
- semantic headings
- input labels
- keyboard access
- adequate target sizes
- contrast
- reduced-motion behavior
- alt text for meaningful imagery
- decorative images hidden appropriately

Trust content must remain truthful. No invented:

- Trustpilot ratings
- customer numbers
- partner counts
- awards
- press logos
- certifications
- security claims

---

## 16. Implementation sequence after spec approval

### Phase 0 — safety

1. verify Mac-M1 repo is still clean / identify any drift from `aa84ee2`
2. create named backup ref to verified starting commit
3. create isolated redesign branch/worktree
4. do not modify `main`

### Phase 1 — design system foundation

1. define final color/surface tokens
2. define type scale/rhythm
3. create visual-role marketing primitives
4. create asset folder conventions
5. add new brand assets

### Phase 2 — homepage

1. header/hero
2. visual service categories
3. story-driven process
4. Hausakte value chapter
5. trust/proof
6. partner chapter
7. pricing/entry
8. security chapter
9. dark footer

Homepage becomes the visual acceptance reference before the rest of the site is migrated.

### Phase 3 — public subpages

Migrate every public route to the new visual language with page-specific composition.

### Phase 4 — auth surfaces

Polish login/register/onboarding entry surfaces without disrupting the existing auth/product flow.

### Phase 5 — Owner/Pro visual convergence

Polish existing screen designs under the structure-protection rules.

### Phase 6 — `sin-frontend-design`

Use the redesign findings to update and test the reusable skill.

---

## 17. Required testing / release gates

Existing technical gates remain mandatory where applicable:

- lint
- typecheck/build
- existing auth regressions
- production smoke
- responsive matrix
- accessibility tests
- visual regression

Add a redesign-specific screenshot review matrix:

### Desktop

- 1440px
- 1920px

### Tablet

- representative tablet width

### Mobile

- 390px
- 320/360px stress width where current QA supports it

### Manual visual review questions

For each major page:

1. What is the dominant visual anchor above the fold?
2. Is the primary action obvious in five seconds?
3. Does the page look like a consumer brand rather than a SaaS template?
4. Is there visual variety between adjacent chapters?
5. Is any area empty merely because of large padding?
6. Are icons doing work that should be done by imagery?
7. Are product mockups supporting the story rather than replacing it?
8. Is all proof truthful?
9. Does wide desktop look intentionally filled?
10. Does mobile look designed, not collapsed?

---

## 18. Acceptance criteria

The redesign is not complete until all of the following are true.

### Website

- the homepage communicates the product visually before detailed reading
- every major homepage chapter contains a strong visual anchor
- the overall silhouette no longer reads as generic SaaS
- service categories are visual/tangible rather than primarily icon-grid based
- the process is story-driven rather than line-and-number driven
- real/brand-consistent human/home/service imagery is integrated
- section color worlds create clear chapter rhythm
- the primary conversion action is unmistakable
- trust/security has real visual weight
- public subpages feel like the same premium brand without repeating one template
- wide desktop and mobile both feel deliberately composed
- no fake proof data is introduced
- existing backend/product flows continue to work

### Apps

- navigation and established product structure remain intact
- screenshots are visibly more refined
- brand connection to the website is stronger
- no unnecessary product/IA redesign slips into the visual pass

### Skill

- `sin-frontend-design` explicitly prevents the failure modes documented in this specification
- skill verification demonstrates that an agent now prioritizes macro art direction before polish

---

## 19. Definition of success

A successful result should create this reaction:

> "Einfach Hausen now looks like a credible, modern consumer company that happens to have strong software behind it."

Not:

> "This is a nicer SaaS landing page."

The redesign must preserve the existing product while fundamentally upgrading the visible brand experience.