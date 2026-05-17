# Agentic Development Planning Instructions

## Purpose

Use this guide when creating development plans for new features, bug fixes, enhancements, refactors, and cross-feature repairs.

The goal is to produce plans that are grounded in the real codebase, testable through observable behavior, respectful of feature ownership, and safe for agentic implementation.

Do not plan from memory, desired architecture, or assumptions. Plan from the current code paths and the intended source of truth.

---

## Core Planning Rule

Before writing an implementation plan, audit the current code paths for every affected behavior.

For each affected UI section, report:

1. The component that renders it.
2. The front-end service, hook, context, or store that provides its data.
3. The API route called, if any.
4. The server service or repository called, if any.
5. The store, seed, mock, database, or source currently used.
6. The feature that should own the data.
7. The existing tests that cover it.
8. The missing tests needed to prove the fix.

If the code path cannot be fully traced, say exactly what was traced and what remains unknown. Do not fill gaps with assumptions.

---

## Planning Mode Selection

Before writing the plan, classify the work into one mode. Use the lightest mode that still protects correctness.

### Mode 1 — Tiny UI, Copy, or Styling Fix

Use when the change affects only wording, spacing, labels, colors, or visual presentation without changing data behavior.

Required:

- Identify the affected component.
- Define observable acceptance criteria.
- Add or update tests only if behavior changes.
- No full source-of-truth audit is required.

Examples:

- Rename “Hours” to “Time logged (optional).”
- Adjust spacing on a card.
- Fix a typo in an empty state.

### Mode 2 — Local Feature Behavior

Use when one feature’s UI, store, API, validation, or local behavior changes.

Required:

- Audit the affected component.
- Audit the feature service/store/API route.
- Identify existing and missing tests.
- Include unit, API, and integration tests as applicable.
- Playwright is optional unless the user-visible flow crosses screens or feature boundaries.

Examples:

- Add validation to portfolio evidence.
- Change attendance minutes behavior.
- Add filters to one feature list.

### Mode 3 — Cross-Feature, Dashboard, Records, or Reports Bug

Use when behavior depends on multiple features, shared selectors, dashboard composition, records summaries, reports, or cross-feature counts.

Required:

- Full code-path audit.
- Source-of-truth ownership decision.
- Unit tests for business rules.
- API tests for filters and response shape.
- Integration tests for component behavior.
- Playwright tests for user-visible cross-feature wiring.
- Explicit regression checklist.

Default to Mode 3 if the request involves:

- Dashboard
- Records
- Reports
- Child selector
- All Children aggregation
- Archived child behavior
- Cross-feature counts
- Data shown in multiple places

### Mode 4 — New Feature

Use for roadmap features or substantial new capability.

Required:

- Feature ownership decision.
- Data model, validation, API/store, UI, and tests.
- Build phases.
- Observable acceptance criteria.
- Out-of-scope and deferral list.
- Branch and commit plan.
- TDD plan.
- Manual QA plan.

Examples:

- Add portfolio evidence.
- Add records report view.
- Add progress by subject.

### Mode 5 — Architecture Migration

Use when moving data ownership, replacing stores, changing shared contracts, or removing duplicate sources of truth.

Required:

- Current ownership map.
- Target ownership map.
- Compatibility strategy.
- Migration steps.
- Deprecation/removal plan.
- High-value regression tests.
- Rollback notes if applicable.

Examples:

- Move dashboard-owned task data into lesson-task feature ownership.
- Replace seeded dashboard store with feature-owned APIs.
- Migrate mock stores to a repository layer.

---

## Source-of-Truth Ownership

Every plan must identify the source of truth.

Default ownership map:

- Planner / Lesson Tasks owns lessons, tasks, lesson status, scheduling, rescheduling, and progress inputs.
- Attendance owns attendance records, attendance status, minutes, and attendance summaries.
- Portfolio owns evidence items, evidence notes, evidence links, and lesson-evidence connections.
- Qur’an owns Qur’an sessions, recitation progress, memorization, review, and Qur’an-specific tracking.
- Alerts owns Needs Attention and advisory signals.
- Records / Reports owns records summaries, report views, print/export surfaces, and review checklists.
- Dashboard only composes Today-facing data. It does not own business logic or canonical data.

If the current code violates ownership, the plan must choose one of these options:

1. Leave it temporarily, with a clear reason.
2. Wrap it behind a feature service.
3. Migrate it in this wave.
4. Defer it, with a named follow-up.

Never create new dashboard seed/store data to solve dynamic data bugs.

---

## Acceptance Criteria Standards

Every plan must include exact acceptance criteria using observable behavior.

Avoid broad statements like:

- Make dashboard dynamic.
- Fix filtering.
- Improve records.
- Wire data correctly.

Prefer concrete statements like:

- Selecting Child A shows Child A data.
- Selecting Child B hides Child A data.
- Selecting All Children aggregates active children.
- Archived children are excluded.
- Empty source data shows zero, not seeded fallback.
- Sorting changes visible order.
- Counts match the owning API response.
- Moving a lesson to a new date removes it from the old date and shows it on the new date after refresh.
- A missing attendance record is counted only according to the agreed school-day rule.

Acceptance criteria must be written so a tester can click through the app and verify them.

---

## TDD Requirement

Use TDD for every behavior-changing plan.

Before implementing each step, write or update the smallest relevant failing test first where test infrastructure exists.

Recommended order:

1. Unit tests for pure service/business rules.
2. API tests for route filters, validation, authorization/scoping, and response shape.
3. Integration tests for component behavior and feature wiring.
4. Playwright tests for user-visible flows, cross-feature behavior, and regressions.

If the repo has no working test setup, say so clearly. Do not silently skip testing.

Do not add broad test infrastructure unless the task requires it. Prefer focused tests that prove the requested behavior.

---

## Test Type Responsibilities

### Unit Tests

Use for:

- Pure calculations.
- Validation rules.
- Date range logic.
- Filtering helpers.
- Summary builders.
- Ownership-specific business rules.

Examples:

- Attendance missing-day calculation.
- Progress planned/completed/skipped counts.
- Evidence URL validation.
- Child/subject ownership validation.

### API Tests

Use for:

- Route response shape.
- Filtering by child, subject, date, type, status.
- Workspace/household scoping.
- Archived entity exclusion.
- Error handling.
- Validation failures.

Examples:

- `GET /api/progress?childId=x` returns only that child’s progress.
- `POST /api/evidence` rejects a subject that does not belong to the child.

### Integration Tests

Use for:

- Component renders from feature service/API response.
- Component reacts to selector changes.
- Form submission updates visible list/card.
- Empty states appear when source data is empty.

Examples:

- Portfolio list filters by child and subject.
- Attendance quick-mark card updates after marking present.

### Playwright Tests

Use for:

- User-visible flows.
- Cross-feature wiring.
- Dashboard and reports behavior.
- Regression tests for previously broken flows.

Every Playwright test must assert meaningful state changes, not just that elements exist.

Good Playwright assertions:

- Select Child A and confirm Child B data disappears.
- Mark attendance and confirm dashboard summary changes.
- Add evidence and confirm it appears in Portfolio and report count.
- Move a lesson and confirm it persists after refresh.

Weak Playwright assertions:

- Page loads.
- Button exists.
- Text is visible without verifying behavior.

---

## Required Plan Structure

Use this structure unless the task is Mode 1 and very small.

### 1. Summary

State what will be built or fixed in one paragraph.

### 2. Planning Mode

Name the selected planning mode and why.

### 3. Current Code Path Audit

For each affected UI section, list:

- Rendering component.
- Data provider/hook/context.
- API route.
- Server service/repository.
- Store/seed/source.
- Current owner.
- Correct owner.
- Existing tests.
- Missing tests.

### 4. Source-of-Truth Decision

State which feature owns the data and what will happen if current code violates that ownership.

### 5. Acceptance Criteria

List exact observable outcomes.

### 6. Data Model / Contract Changes

Include types, fields, enums, validation, and backward-compatibility concerns.

### 7. API / Store / Service Plan

Describe route changes, service changes, store/repository changes, and response shapes.

### 8. UI Plan

Describe components, screens, states, empty states, mobile behavior, and accessibility requirements.

### 9. Testing Plan

List failing tests first:

- Unit tests.
- API tests.
- Integration tests.
- Playwright tests.

### 10. Build Phases

Break work into safe, ordered phases.

### 11. Out of Scope

Name what will not be built.

### 12. Manual QA Plan

List click-by-click verification steps.

### 13. Branch and Commit Plan

Name the branch and planned commit sequence.

### 14. Risks and Rollback

List main risks, mitigations, and how to back out if needed.

---

## Feature Structure Expectations

A future-ready feature should usually have:

- Types.
- Validation/schema.
- Store or repository.
- API route or server action.
- UI components.
- Feature page or route.
- Dashboard widget, if relevant.
- Tests.
- Empty states.
- Manual QA checklist.

Use the existing repo conventions. Do not invent new architecture if the repo already has a pattern.

For new features, prefer this mental model:

```txt
feature ownership
→ data model
→ validation
→ store/repository
→ API/server action
→ UI
→ dashboard/report composition
→ tests
```

Dashboard and reports should compose feature-owned utilities. They should not duplicate business logic.

---

## Branch Naming

Use descriptive, scoped branch names.

Patterns:

```txt
feature/<feature-number>-<short-name>
fix/<area>-<bug-short-name>
enhancement/<area>-<short-name>
refactor/<area>-<short-name>
test/<area>-<short-name>
```

Examples:

```txt
feature/24-progress-by-subject
feature/30-35-reports-print-checklist
fix/dashboard-child-selector-stale-data
enhancement/attendance-optional-time-copy
refactor/dashboard-compose-feature-widgets
test/portfolio-evidence-playwright
```

Use one branch per coherent slice. Do not mix unrelated fixes into the feature branch unless they are required by the plan.

---

## Commit Discipline

Commit at stable checkpoints, not at random time intervals.

Good commit moments:

- After failing tests are added.
- After data model/schema passes tests.
- After API/store behavior passes tests.
- After UI behavior passes tests.
- After Playwright regression passes.
- After cleanup with all tests passing.

Commit names should describe behavior.

Good examples:

```txt
test(progress): cover subject summary counts
feat(progress): calculate weekly and yearly subject progress
feat(records): add completed lesson history filters
feat(dashboard): compose progress and attendance cards
fix(attendance): exclude archived children from all-children summary
```

Avoid vague commits:

```txt
updates
fix stuff
wip
changes
more dashboard
```

Prefer small commits that can be reviewed and reverted.

---

## Waves, Phases, and Slicing

Use waves to preserve dependency order and product coherence.

A wave or phase should produce a usable capability, not just scattered files.

Good grouping:

- Attendance model + mark attendance + optional minutes + summary.
- Progress by subject + completed history + dashboard cards.
- Portfolio evidence model + add evidence + list/filter.

Bad grouping:

- Dashboard shell + subject model + onboarding prompt + unrelated settings.
- File upload + PDF export + alerts + reports in one sprint.

When a feature has a split warning, split it.

Examples:

- Text/link evidence now; file/photo upload later after storage architecture.
- Print-friendly report now; PDF download later after rendering approach.
- Basic recurrence now; full recurrence exceptions later.

---

## File Inspection Constraint

Do not perform broad repo exploration.

Start by inspecting only the folders/files needed for the slice.

Common feature folders:

```txt
src/features/<affected-feature>/
src/features/dashboard/
src/features/records/
src/features/reports/
src/lib/ only if shared utilities or stores are imported by the affected feature
```

Only inspect another file if:

- A direct import points there.
- A test failure requires it.
- The implementation cannot proceed without it.

Before touching files outside the expected scope, state why it is necessary.

Avoid unrelated areas unless directly required:

```txt
auth
payments
AI
notifications
deployment
theme-only files
unrelated app shell files
```

---

## Empty States

Every list view, dashboard card, and report section needs a designed empty state.

An empty state should:

- Explain why the section is empty.
- Tell the parent the next action.
- Link to or identify the next action when possible.

Examples:

```txt
No portfolio evidence yet. Add a note or link to preserve proof of learning.
```

```txt
No completed lessons yet. Mark a lesson complete to begin building history.
```

Do not show seeded fallback data when the real source is empty.

---

## Accessibility and Mobile Requirements

Every plan that changes UI must include accessibility and mobile considerations.

Minimum requirements:

- Keyboard-navigable interactive elements.
- ARIA labels for icon-only buttons.
- Text labels on status badges; color cannot be the only signal.
- Touch targets at least 44px on mobile.
- Mobile behavior defined for lists, grids, filters, and action buttons.

---

## Date and Time Rules

Plans involving dates must specify:

- Storage format.
- Display timezone.
- Date range inclusivity.
- Definition of “today.”
- How school year boundaries apply.

Default rules:

- Store timestamps in UTC.
- Store local calendar dates as `YYYY-MM-DD` when the user means a school day.
- Display in the household’s local timezone.
- “Today” is relative to the household timezone, not the server.
- School year start and end dates are inclusive.

---

## Out-of-Scope Discipline

Every plan must say what is not being built.

This prevents agents from overbuilding.

Examples:

- Do not implement file/photo upload until storage architecture is decided.
- Do not implement PDF download until rendering approach is chosen.
- Do not implement legal compliance claims.
- Do not implement AI guidance or alerts unless the feature specifically owns them.
- Do not create duplicate dashboard stores.

---

## Manual QA Standards

Manual QA must be click-by-click and tied to acceptance criteria.

Good QA steps:

```txt
1. Open Dashboard.
2. Select Child A.
3. Confirm only Child A lessons appear.
4. Select Child B.
5. Confirm Child A lessons disappear.
6. Select All Children.
7. Confirm active children are grouped separately.
```

Bad QA steps:

```txt
Check dashboard.
Make sure it works.
Verify data.
```

---

## Bug Fix Plan Requirements

For bugs, every plan must include:

- Reproduction steps.
- Expected behavior.
- Actual behavior.
- Affected code path audit.
- Source-of-truth owner.
- Smallest safe fix.
- Failing regression test first.
- Playwright test if the bug is user-visible or cross-feature.
- Manual QA steps.

Do not fix bugs by adding new seed data or hardcoded fallbacks.

---

## Enhancement Plan Requirements

For enhancements, every plan must include:

- Current behavior.
- Desired behavior.
- Why the enhancement belongs to the owning feature.
- Whether it changes data contracts.
- Whether existing tests need updating.
- Whether new Playwright coverage is required.
- Out-of-scope boundaries.

---

## New Feature Plan Requirements

For new features, every plan must include:

- Feature owner.
- Dependencies and build gate.
- Data model.
- Validation schema.
- Store/API/service contract.
- UI surfaces.
- Dashboard/report composition, if relevant.
- Unit/API/integration/Playwright test plan.
- Manual QA.
- Accessibility/mobile.
- Branch and commit plan.
- Out-of-scope items.

---

## Architecture Migration Plan Requirements

For migrations, every plan must include:

- Current state.
- Target state.
- Compatibility path.
- Which code keeps working during migration.
- Which code will be removed.
- How tests prove old behavior still works or has intentionally changed.
- Rollback or recovery strategy.

Avoid big-bang migrations unless the old path is small and well-tested.

---

## Final Plan Quality Checklist

Before finalizing a plan, verify:

- The planning mode is stated.
- The affected code path was audited.
- The source of truth is identified.
- Ownership violations are handled explicitly.
- Acceptance criteria are observable.
- Failing tests are listed first.
- Unit/API/integration/Playwright responsibilities are clear.
- Dashboard does not own feature data.
- No new seed/store data is created to hide dynamic data bugs.
- Build phases are ordered by dependency.
- Out-of-scope items are named.
- Manual QA is click-by-click.
- Branch name is provided.
- Commit plan is behavior-oriented.
- The plan is small enough for a safe implementation slice.

If any item is missing, revise the plan before implementation.

---

## Guiding Principle

Make the plan truthful before making it clever.

A good plan identifies the real code path, the real owner, the real tests, and the real observable behavior. It does not hide uncertainty behind architecture language. It does not make the dashboard look dynamic with fake data. It does not overbuild future concerns into the current slice.

Build in layers: source of truth, tested contract, user-visible behavior, regression protection.
