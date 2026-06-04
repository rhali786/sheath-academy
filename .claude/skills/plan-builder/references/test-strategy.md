# Test strategy (plan-builder reference)

For test boilerplate per type, use the `testing-patterns` skill. This file is about *which* tests a plan must include.

## TDD requirement

Use TDD for every behavior-changing plan. Before implementing each step, write or update the smallest relevant failing test first where test infrastructure exists. If the repo has no working test setup, say so clearly — do not silently skip testing. Do not add broad test infrastructure unless the task requires it; prefer focused tests that prove the requested behavior.

Recommended order:

1. **Unit** — pure service/business rules.
2. **API** — route filters, validation, authorization/scoping, response shape.
3. **Integration** — component behavior and feature wiring.
4. **Playwright** — user-visible flows, cross-feature behavior, regressions.

## Test-type responsibilities

### Unit
Pure calculations, validation rules, date-range logic, filtering helpers, summary builders, ownership-specific business rules.
- e.g. attendance missing-day calculation; progress planned/completed/skipped counts; evidence URL validation; child/subject ownership validation.

### API
Route response shape; filtering by child/subject/date/type/status; workspace/household scoping; archived-entity exclusion; error handling; validation failures.
- e.g. `GET /api/progress?childId=x` returns only that child's progress; `POST /api/evidence` rejects a subject that does not belong to the child.

### Integration
Component renders from feature service/API response; reacts to selector changes; form submission updates visible list/card; empty states appear when source data is empty.
- e.g. portfolio list filters by child and subject; attendance quick-mark card updates after marking present.

### Playwright
User-visible flows; cross-feature wiring; dashboard and reports behavior; regression tests for previously broken flows.

Every Playwright test must assert meaningful state changes, not just that elements exist.

- **Good:** select Child A and confirm Child B data disappears; mark attendance and confirm dashboard summary changes; add evidence and confirm it appears in Portfolio and report count; move a lesson and confirm it persists after refresh.
- **Weak:** page loads; button exists; text is visible without verifying behavior.
