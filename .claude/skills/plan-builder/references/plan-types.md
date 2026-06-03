# Plan structure & per-type requirements (plan-builder reference)

## Required plan structure

Use this structure unless the task is Mode 1 and very small.

1. **Summary** — what will be built/fixed, one paragraph.
2. **Planning mode** — selected mode and why.
3. **Current code-path audit** — for each affected UI section: rendering component, data provider/hook/context, API route, server service/repository, store/seed/source, current owner, correct owner, existing tests, missing tests.
4. **Source-of-truth decision** — which feature owns the data and what happens if current code violates ownership.
5. **UI pattern audit** — for each affected UI section: existing pattern, closest approved pattern (`ui-style-guide` skill), current vs required icons, current vs required confirmation pattern, reuse/extend/replace, shell/page-width compliance, Nivo compliance, accessibility (incl. icon-only labels), tests proving the pattern.
6. **Acceptance criteria** — exact observable outcomes.
7. **Data model / contract changes** — types, fields, enums, validation, backward-compatibility.
8. **API / store / service plan** — route, service, store/repository changes, response shapes.
9. **UI plan** — components, screens, states, empty states, mobile behavior, accessibility.
10. **Testing plan** — failing tests first: unit, API, integration, Playwright.
11. **Build phases** — safe, ordered phases.
12. **Out of scope** — what will not be built.
13. **Manual QA plan** — click-by-click verification.
14. **Branch and commit plan** — branch name + planned commit sequence.
15. **Risks and rollback** — main risks, mitigations, back-out path.

## Per-type requirements

### Bug fix
Reproduction steps; expected behavior; actual behavior; affected code-path audit; source-of-truth owner; smallest safe fix; failing regression test first; Playwright test if user-visible or cross-feature; manual QA. **Do not fix bugs by adding new seed data or hardcoded fallbacks.**

### Enhancement
Current behavior; desired behavior; why it belongs to the owning feature; whether it changes data contracts; whether existing tests need updating; whether new Playwright coverage is required; out-of-scope boundaries.

### New feature
Feature owner; dependencies and build gate; data model; validation schema; store/API/service contract; UI surfaces; dashboard/report composition (if relevant); unit/API/integration/Playwright test plan; manual QA; accessibility/mobile; branch and commit plan; out-of-scope items.

### Architecture migration
Current state; target state; compatibility path; which code keeps working during migration; which code will be removed; how tests prove old behavior still works or has intentionally changed; rollback/recovery strategy. Avoid big-bang migrations unless the old path is small and well-tested.

## Feature structure expectations

A future-ready feature usually has: types; validation/schema; store or repository; API route or server action; UI components; feature page/route; dashboard widget (if relevant); tests; empty states; manual QA checklist.

Mental model for new features:

```
feature ownership → data model → validation → store/repository
→ API/server action → UI → dashboard/report composition → tests
```

Dashboard and reports compose feature-owned utilities. They do not duplicate business logic. Use existing repo conventions — do not invent new architecture if a pattern already exists.
