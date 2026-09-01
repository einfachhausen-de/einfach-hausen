# SIN Frontend Design Skill Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite and verify `sin-frontend-design` so future agents diagnose macro art direction before micro polish, translate visual references structurally, make explicit asset decisions, protect app information architecture during visual-only work, and refuse to declare premium design complete based only on technical gates.

**Architecture:** Treat the skill update as TDD for process documentation. First run baseline pressure scenarios against the current skill and record failures. Then revise the skill and supporting references under `wow-my-zsh/shared/skills/sin-frontend-design/`, add scenario fixtures/checklists, rerun the same scenarios, and update platform documentation.

**Tech Stack:** Markdown Agent Skill format, wow-my-zsh shared skill system, shell/agent scenario harness already used by the repository, Git, repository documentation.

**Spec:** `einfach-hausen/docs/superpowers/specs/2026-09-01-einfach-hausen-premium-consumer-redesign-design.md`

## Global Constraints

- Canonical wow-my-zsh repository path is `/Users/jeremy/dev/wow-my-zsh` on Mac-M1.
- Canonical shared skill namespace is `shared/skills/`.
- Target skill path is `shared/skills/sin-frontend-design/`; execution must verify the directory before editing and stop if the skill has been moved rather than creating a duplicate under a new name.
- Follow writing-skills RED → GREEN → REFACTOR: capture baseline failure before changing the skill.
- The skill must remain reusable across projects; Einfach Hausen-specific examples belong in examples/references, not as the only trigger logic.
- No fake social proof guidance, no reference cloning, no automatic product-IA redesign when the task is visual polish.
- Never use destructive git reset/clean/force operations.

---

## File Structure Map

**Modify**
- `shared/skills/sin-frontend-design/SKILL.md` — main trigger/decision workflow and premium design doctrine.

**Create or modify under the same skill directory**
- `shared/skills/sin-frontend-design/references/macro-art-direction.md` — Level A/B/C diagnostic model.
- `shared/skills/sin-frontend-design/references/reference-translation.md` — how to translate references without copying.
- `shared/skills/sin-frontend-design/references/asset-strategy.md` — required imagery/asset decision tree.
- `shared/skills/sin-frontend-design/references/premium-acceptance.md` — visual review gates.
- `shared/skills/sin-frontend-design/references/marketing-vs-app.md` — IA boundary rules.
- `shared/skills/sin-frontend-design/tests/scenarios.md` — reusable pressure scenarios and expected behaviors.
- `docs/sin-frontend-design.md` — platform-facing skill documentation.
- `README.md`, `AGENTS.md`, `docs/NEXT_AGENT.md`, `docs/PRODUCTION_HANDOVER.md`, `docs/ARCHITECTURE.md` — discovery/ownership/handover updates.

---

### Task 1: Isolate wow-my-zsh skill work and verify canonical path

**Files:**
- No source modifications yet.

**Interfaces:**
- Produces: isolated branch/worktree for skill hardening.

- [ ] **Step 1: Verify repository and skill path**

Run:
```bash
cd /Users/jeremy/dev/wow-my-zsh
git status --short --branch
test -f shared/skills/sin-frontend-design/SKILL.md
printf 'skill=%s\n' shared/skills/sin-frontend-design/SKILL.md
```
Expected: existing skill file is found. If the `test` fails, locate the existing skill with `find shared/skills -maxdepth 3 -iname 'SKILL.md' | grep -i 'frontend'` and stop for plan correction rather than creating a duplicate skill.

- [ ] **Step 2: Create isolated worktree**

Run:
```bash
git worktree add /Users/jeremy/dev/wow-my-zsh/.worktrees/sin-frontend-design-hardening -b feat/sin-frontend-design-hardening HEAD
cd /Users/jeremy/dev/wow-my-zsh/.worktrees/sin-frontend-design-hardening
```
Expected: clean feature worktree.

- [ ] **Step 3: Commit no changes**

This task ends after safe isolation verification.

---

### Task 2: Capture RED baseline behavior before editing the skill

**Files:**
- Create: `shared/skills/sin-frontend-design/tests/scenarios.md`

**Interfaces:**
- Produces: five fixed pressure scenarios and a baseline-results section recording current failure modes.

- [ ] **Step 1: Write the pressure scenarios**

`tests/scenarios.md` must include these exact scenario intents:

1. **Consumer reference translation** — “Make this bland SaaS homepage look premium like the supplied consumer reference. Keep functionality.”
2. **Photo-led reference under asset pressure** — “You have no ready photos; finish today. Make it premium.”
3. **App visual polish boundary** — “Polish this app visually; do not change navigation or product structure.”
4. **Technical-gates temptation** — “Lint/build/visual regression are green; is the redesign done?”
5. **Fake-proof temptation** — “The reference has 20k reviews; add something similar so ours looks trustworthy.”

For each scenario define required good behavior and prohibited failure behavior.

- [ ] **Step 2: Run the current skill against all five scenarios**

Use the repository's supported agent/skill test mechanism. If no automated harness exists for this skill, execute the scenarios manually with a fresh agent context that loads the current `sin-frontend-design` skill and record the response summaries in `tests/scenarios.md` under `## Baseline RED results`.

Required failure patterns to look for:
- gradients/shadows/motion proposed before macro composition
- photo-led reference reduced to icons because assets are inconvenient
- icon grids retained as final category design
- no explicit Level A/B/C diagnosis
- app navigation or IA changes suggested during visual-only work
- completion claimed because technical gates are green
- fabricated or implied fake social proof

- [ ] **Step 3: Verify at least one meaningful RED failure exists**

Do not edit the skill until the baseline demonstrates a concrete weakness the new text must correct.

- [ ] **Step 4: Commit test scenarios and baseline evidence**

```bash
git add shared/skills/sin-frontend-design/tests/scenarios.md
git commit -m "test: capture frontend design skill failure modes"
```

---

### Task 3: Rewrite the skill trigger and core doctrine

**Files:**
- Modify: `shared/skills/sin-frontend-design/SKILL.md`

**Interfaces:**
- Produces: skill whose description triggers on frontend redesign, visual reference matching, premium polish, and consumer-brand art direction tasks without summarizing the workflow in frontmatter.

- [ ] **Step 1: Rewrite frontmatter description as trigger-only text**

Use a description in this form:
```yaml
---
name: sin-frontend-design
description: Use when designing or redesigning a visible frontend, matching a visual reference, improving a bland or generic UI, or reviewing whether a website or app reaches a premium visual bar.
---
```

- [ ] **Step 2: Add the non-negotiable core doctrine near the top**

Include this exact concept:
```text
Premium frontend design is primarily a macro-composition and art-direction problem. Typography, shadows, rounded cards, animations, gradients, and hover effects are polish layers, not substitutes for visual storytelling, hierarchy, imagery, chapter rhythm, trust, and conversion clarity.
```

- [ ] **Step 3: Add mandatory Level A/B/C diagnosis before implementation**

The skill must force agents to classify findings as:
- Level A — art direction / macro
- Level B — component system
- Level C — polish

The skill must explicitly prohibit spending most effort on Level C while Level A still fails.

- [ ] **Step 4: Add the marketing-vs-app scope gate**

Require the agent to determine whether it may recompose marketing structure or must preserve established app IA. Visual-only app tasks must protect navigation, routes, and product flows.

- [ ] **Step 5: Commit the core skill rewrite**

```bash
git add shared/skills/sin-frontend-design/SKILL.md
git commit -m "feat: make frontend design skill macro-first"
```

---

### Task 4: Add reference-translation and asset-strategy references

**Files:**
- Create: `shared/skills/sin-frontend-design/references/reference-translation.md`
- Create: `shared/skills/sin-frontend-design/references/asset-strategy.md`
- Modify: `shared/skills/sin-frontend-design/SKILL.md`

**Interfaces:**
- Produces: two concise references loaded when a task uses an external visual reference or requires image-led art direction.

- [ ] **Step 1: Write `reference-translation.md`**

Require explicit answers to:
```text
1. What makes the reference successful?
2. Which effects are structural and which are decorative?
3. Which structural principles transfer to this brand?
4. Which elements must not be copied?
5. What is the equivalent visual metaphor for this product?
```
Also require comparison across: macro composition, hierarchy, image strategy, human presence, density, chapter rhythm, conversion priority, trust, color-story variation, silhouette repetition, responsive composition, and brand distinctiveness.

- [ ] **Step 2: Write `asset-strategy.md`**

Require exactly one explicit asset decision when imagery materially drives the reference:
```text
A. use existing real assets
B. acquire appropriate licensed assets
C. generate brand-consistent assets
D. explicitly accept a lower visual ceiling
```
State that silently replacing a photo-led reference with icons is not acceptable.

- [ ] **Step 3: Link both references from SKILL.md at the appropriate decision points**

The main skill remains concise; detailed checklists live in references.

- [ ] **Step 4: Commit references**

```bash
git add shared/skills/sin-frontend-design/SKILL.md shared/skills/sin-frontend-design/references
git commit -m "docs: add reference and asset strategy guidance"
```

---

### Task 5: Add anti-pattern catalogue and premium acceptance gates

**Files:**
- Create: `shared/skills/sin-frontend-design/references/macro-art-direction.md`
- Create: `shared/skills/sin-frontend-design/references/premium-acceptance.md`
- Create: `shared/skills/sin-frontend-design/references/marketing-vs-app.md`
- Modify: `shared/skills/sin-frontend-design/SKILL.md`

**Interfaces:**
- Produces: reusable anti-pattern detection and completion gates.

- [ ] **Step 1: Write the macro-art-direction anti-pattern catalogue**

It must explicitly flag:
- SaaS hero by default
- icon grid as finished category design
- huge whitespace with little visual payload
- generic gradients as premium signal
- excessive rounded white cards
- motion-first redesign
- copying surface details without compositional logic
- repeated component silhouettes
- completion based only on technical checks

- [ ] **Step 2: Write `premium-acceptance.md`**

Require yes/no answers to:
```text
Is the page understandable without reading all copy?
Does every major viewport contain a deliberate visual anchor?
Is the primary CTA obvious?
Is there compositional variety?
Is repeated card silhouette excessive?
Does the page still look premium at full desktop width?
Does mobile retain deliberate composition instead of merely stacking desktop cards?
Are trust claims real and supportable?
Does it look like this brand rather than a template?
```
Any “no” means the agent may not declare the visual task complete.

- [ ] **Step 3: Write `marketing-vs-app.md`**

State:
- marketing structure may be recomposed when scope permits
- established product app IA is preserved during visual-only polish
- navigation add/remove/rename requires explicit UX/product scope
- preserve backend behavior and route semantics unless the task explicitly includes them

- [ ] **Step 4: Link the references from SKILL.md**

- [ ] **Step 5: Commit**

```bash
git add shared/skills/sin-frontend-design
git commit -m "docs: add premium design acceptance gates"
```

---

### Task 6: Run GREEN verification with the same five pressure scenarios

**Files:**
- Modify: `shared/skills/sin-frontend-design/tests/scenarios.md`

**Interfaces:**
- Produces: after-results showing the updated skill corrects baseline failures.

- [ ] **Step 1: Rerun all five scenarios in fresh agent contexts with the updated skill loaded**

Use exactly the same scenario wording as the RED baseline.

- [ ] **Step 2: Record GREEN results**

For each scenario, record whether the response now:
- leads with macro diagnosis
- separates Level A/B/C
- makes an explicit asset decision when needed
- protects app IA during visual-only work
- refuses fake proof
- refuses completion when premium acceptance questions fail

- [ ] **Step 3: Fix loopholes found during GREEN testing**

If an agent still rationalizes around a rule, tighten the smallest relevant wording/reference and rerun that same scenario until it passes.

- [ ] **Step 4: Commit verified skill behavior**

```bash
git add shared/skills/sin-frontend-design
git commit -m "test: verify premium frontend design behavior"
```

---

### Task 7: Update platform documentation and discovery

**Files:**
- Create/Modify: `docs/sin-frontend-design.md`
- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: `docs/NEXT_AGENT.md`
- Modify: `docs/PRODUCTION_HANDOVER.md`
- Modify: `docs/ARCHITECTURE.md`

**Interfaces:**
- Produces: discoverable skill ownership, triggers, verification instructions, and relationship to visual tasks.

- [ ] **Step 1: Document skill purpose and trigger conditions**

Do not duplicate the whole skill body in README/AGENTS; link to `shared/skills/sin-frontend-design/SKILL.md` and summarize when to invoke it.

- [ ] **Step 2: Document the test scenarios and expected RED/GREEN method**

`docs/sin-frontend-design.md` must explain how future changes to the skill are verified with `shared/skills/sin-frontend-design/tests/scenarios.md`.

- [ ] **Step 3: Update architecture/handover docs**

Record that frontend design work now has separate macro, component, polish, asset, and IA-boundary gates.

- [ ] **Step 4: Commit docs**

```bash
git add docs/sin-frontend-design.md README.md AGENTS.md docs/NEXT_AGENT.md docs/PRODUCTION_HANDOVER.md docs/ARCHITECTURE.md
git commit -m "docs: document hardened frontend design skill"
```

---

### Task 8: Final skill verification and integration readiness

**Files:**
- No new files.

**Interfaces:**
- Produces: verified feature branch ready for code review/merge.

- [ ] **Step 1: Run repository skill/document validation commands defined by wow-my-zsh**

Use the existing skill validation/lint/test commands documented in `AGENTS.md` or the repository package/task runner. All must PASS.

- [ ] **Step 2: Re-open SKILL.md and perform a placeholder/duplication scan**

Verify there is no `TBD`, `TODO`, contradictory workflow, or project-specific rule masquerading as a universal rule.

- [ ] **Step 3: Review branch diff**

```bash
git diff --stat main...HEAD
git diff main...HEAD -- shared/skills/sin-frontend-design docs README.md AGENTS.md
```
Expected: only skill/relevant documentation/test files changed.

- [ ] **Step 4: Stop for review before merge**

Do not merge until the updated skill's RED/GREEN evidence is reviewed.
