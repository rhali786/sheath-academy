---
name: validate-plan
description: Validate plan-execute JSON plans with deterministic structural checks and coverage mapping. Use when checking plan quality before Step 4 QC, before plan:execute, or when the user asks to validate all plans cheaply.
---

# Validate plan

Use this skill to run deterministic, low-cost validation on plan JSON files before any reasoning-heavy review.

## Run the validator script first

Default run:

```bash
npm run plan:validate
```

Custom target(s):

```bash
npm run plan:validate -- --plans docs/bug_enhancement
npm run plan:validate -- --plans docs/bug_enhancement/a-plan.json,docs/bug_enhancement/b-plan.json
```

Machine-readable output:

```bash
npm run plan:validate -- --json
```

## What the script validates

- Plan shape: `version: 1`, phases present, phase `id`/`title` (delegated to `parsePlanFile`).
- Per-phase required fields: non-empty `fileScope`, `testsFirst`, `doneWhen`, `writeBack`.
- `doneWhen` includes both an `npm test` command and `npm run build`.
- Gated phases have `preconditions`; warns when gated phases omit `modelTier`.
- `modelTier` is one of `cheap|standard|strong`.
- Cross-plan `fileScope` collisions (warn).
- Coverage matrix from grouped plan IDs to referencing plan files.
- Special guard: `20260606-course-rollover-plan.json` must be phase-1 only.

## Agent workflow

1. Run the script.
2. If it fails, report only the failing checks and fix deterministic issues.
3. If it passes, optionally do a short judgment pass only on:
   - whether gate reasons are sound,
   - whether tests are sufficient for user-visible states,
   - whether each phase's `fileScope` is sufficient for the change it describes, not merely non-empty (e.g. edits a route handler but omits the router it must register with),
   - whether collisions require serialization or are benign.

Do not re-audit full code paths unless the user explicitly asks for heavy QC.
