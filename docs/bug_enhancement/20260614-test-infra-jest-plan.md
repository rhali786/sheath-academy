# Jest integration test infrastructure fix

Branch: `fix/test-infrastructure-jest-integration` (off `dev`).

## Context

`npm test` is green (127 suites / 935 tests) but `jest.config.js`'s `testPathIgnorePatterns`
excludes all 86 files under `features/**/__tests__/integration/`. Running those explicitly:
**7 suites / 53 tests fail** (out of 231 total). This plan fixes those 7 suites and then
re-enables integration tests in `npm test` (phase-5, gated).

See `CLAUDE.md` → "Testing gotchas (read before debugging failing tests)" before starting —
it documents the provider-wrapper and sessionStorage-leakage patterns behind most of these
failures.

## Root causes (confirmed)

| Suite | Failing tests | Root cause |
|---|---|---|
| `dashboard/__tests__/integration/Dashboard.test.tsx` | 14 | `renderDashboard()` wraps `HouseholdProvider`+`DashboardProvider` but not `LearnerProvider`; `DashboardProvider` calls `useLearner()` |
| `dashboard/__tests__/integration/components/LinkedFiltering.test.tsx` | 5 | Renders `<RecordsProof>` directly; `RecordsProof` calls `useHousehold()` — no `HouseholdProvider` |
| `dashboard/__tests__/integration/components/DashboardComponents.test.tsx` | 3 (RecordsProof block) | Same — `<RecordsProof>` rendered without `HouseholdProvider` |
| `plan/__tests__/integration/LessonsPage.test.tsx` | 9 | Render helper missing `LearnerProvider`; `LessonsPage` calls `useLearner()` |
| `quran/__tests__/integration/QuranPage.test.tsx` | ~10 | One test (`updates child filter when URL childId changes...`) calls `render(<QuranPage />)` directly instead of the file's `renderQuranPage()` helper (missing `LearnerProvider`); others (`falls back to All Children filter`, Edit/Delete-session visibility tests) fail because `LearnerContext`'s `sessionStorage` persistence leaks `selectedChildId` from an earlier test in the same file |
| `attendance/__tests__/integration/AttendancePage.test.tsx` | ~8 | Mix of the same `sessionStorage` leakage + possibly-stale assertions (`shows summary counts`, `clicking Present button calls createRecord`) — needs re-check after isolation fix |
| `subjects/__tests__/integration/SubjectsAllTable.test.tsx` | 1 | `SubjectEditDialog` heading is "Edit course"; test expects `getByRole('dialog', { name: /edit subject/i })` |

## Phases

1. **phase-1 — Test isolation foundation**: add `afterEach` sessionStorage/localStorage clear
   to `jest.setup.js`.
2. **phase-2 — Provider-wrapper fixes**: wrap `Dashboard.test.tsx`, `LessonsPage.test.tsx`
   render helpers with `LearnerProvider`; wrap `RecordsProof` renders in
   `LinkedFiltering.test.tsx`/`DashboardComponents.test.tsx` with `HouseholdProvider`; fix the
   one `QuranPage.test.tsx` test that bypasses `renderQuranPage()`.
3. **phase-3 — Remaining QuranPage/AttendancePage triage**: re-check whatever phase-1/2 leave
   failing; fix test or component as appropriate.
4. **phase-4 — SubjectsAllTable naming**: align `SubjectsAllTable.test.tsx` dialog-role
   assertion with `SubjectEditDialog`'s "Edit course" heading.
5. **phase-5 — Re-enable integration tests in `npm test`** (gated): remove
   `/__tests__/integration/` from `jest.config.js` `testPathIgnorePatterns`.

## Out of scope

- The Playwright e2e suite (separate triage, `docs/bug_enhancement/20260614-e2e-triage.md`).
- Any product-behavior change beyond what phase-3/phase-4 find genuinely broken.
