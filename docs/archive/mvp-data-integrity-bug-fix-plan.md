# Sheath Academy MVP Bug Fix Dev Plan

## Goal

Fix the MVP data-integrity bugs across dashboard, student selection, archive behavior, session saving, lesson completion, portfolio evidence, progress updates, and reports.

This wave is not a feature-expansion wave. It is a truthfulness and reliability wave. Every visible dashboard/report value must be tied to real selected-student data, archive status, and date range rules.

## Core Principle

Use TDD and Playwright.

The dev agent must write failing tests first, then implement the smallest changes needed to pass.

The dev agent must not explore the whole repository. Only inspect the files necessary for these bugs.

## Repository Inspection Limits

Only inspect files related to:

- Dashboard page/components/cards
- Selected student context/store
- Student archive logic
- Dashboard data selectors/query utilities
- Session save/create flow
- Lesson completion flow
- Report generation/date filters
- Shared types/schemas for students, sessions, lesson completions, evidence, progress updates, and reports
- Playwright configuration and existing e2e/spec files
- Mock/sample data only if imported by dashboard or reports

Do not inspect unrelated areas such as:

- Marketing pages
- Auth flows, unless required to reach dashboard in tests
- Settings, unless dashboard state depends on settings
- Styling-only files
- Unrelated onboarding flows
- Unrelated feature folders

## Bugs to Fix

1. When Adam is archived, his needs-attention notes still appear.
2. When Adam is archived, his weekly sessions still appear on the dashboard.
3. When Khadijah is selected, Zayd still shows up in the “Qur’an Arabic and Islamic Studies” dashboard section.
4. Dashboard records/proofs and today’s state do not change when selected student changes.
5. “Plan your first session” does not appear to change after a real session is created or saved.
6. Dashboard shows three portfolio evidence items even when there is no portfolio evidence.
7. Progress updates are unclear and do not appear tied to real selected-student events.
8. Saving a Qur’an session appears to do nothing.
9. Marking Khadijah’s lesson done does not show on the report.
10. Report end date can go beyond the current date.
11. Report start date can go beyond the current date.
12. Report start date can go beyond the report end date.

## Expected Data Behavior

Dashboard data must always be filtered by selectedStudentId.

Active dashboard views must exclude archived students unless the user is explicitly viewing archived/history mode.

Dashboard cards must use real data, not production-visible mock/demo fallback values.

Saving a Qur’an session must create a real student-specific session record.

Saving a Qur’an session must update the selected student’s dashboard state, including weekly sessions and today’s state. It should also affect progress updates if progress updates are intended to reflect session activity.

“Plan your first session” should disappear or change once the selected student has a saved first session or completed planned activity.

Marking a lesson done must create or update a student-specific lesson completion record.

Reports must include completed lessons and sessions for the selected student when the date range includes the completion/session date.

Reports must prevent future dates and invalid date ranges.

## Data Ownership Map

Before implementation, confirm or establish the data source for each dashboard/report section.

### Needs Attention Notes

Should be tied to selected-student records only. Acceptable sources include:

- Student-specific missed lessons
- Student-specific incomplete lessons
- Student-specific teacher notes
- Student-specific assessment/session flags

Archived students must not contribute to active dashboard needs-attention notes.

### Weekly Sessions

Should be tied to saved session records for the selected student within the current week.

Archived students must not contribute to active weekly session totals.

### Qur’an Arabic and Islamic Studies Section

Should be tied only to the selected student’s curriculum, lessons, sessions, or progress.

Selecting Khadijah must never show Zayd’s records in this section.

### Records and Proofs

Should be tied to actual selected-student records/evidence/proofs.

If no records exist, show zero or an empty state.

### Today’s State

Should be tied to selected-student activity for the current local day.

It should update after a selected-student session or completion is saved.

### Plan Your First Session

Should be tied to whether the selected student has at least one real saved session or completed planned activity.

### Portfolio Evidence

Should be tied to actual evidence records for the selected student.

No evidence means zero. Do not show mock/demo evidence in production dashboard mode.

### Progress Updates

Should be tied to real selected-student events, such as:

- Session saved
- Lesson completed
- Evidence added
- Note created
- Assessment/progress milestone recorded

If no real progress events exist, show an empty state.

## Required Test Strategy

Implement tests at two levels:

1. Unit/integration tests for selectors, query utilities, stores, and validation logic.
2. Playwright end-to-end tests for actual user flows.

Do not rely only on unit tests. These bugs were observed through UI behavior, so Playwright coverage is required.

## Unit and Integration Test Requirements

Add or update tests for the following.

### Archived Student Filtering

Tests must verify:

- Archived Adam’s needs-attention notes do not appear in active dashboard data.
- Archived Adam’s weekly sessions do not contribute to active dashboard counts.
- Archived students are excluded from active dashboard aggregations by default.
- Historical records for archived students are preserved, unless current data model intentionally deletes them.

### Selected Student Isolation

Tests must verify:

- Selecting Khadijah returns only Khadijah’s dashboard data.
- Zayd’s Qur’an/Arabic/Islamic Studies records do not appear when Khadijah is selected.
- Changing selected student recalculates records/proofs, today’s state, weekly sessions, progress updates, and evidence counts.

### Dashboard Empty States

Tests must verify:

- No portfolio evidence displays zero or an empty state.
- No progress updates displays an empty state.
- No records/proofs displays zero or an empty state.
- No mock/demo fallback data appears in production dashboard paths.

### Qur’an Session Save Flow

Tests must verify:

- Saving a Qur’an session creates a persisted session record with studentId, subject/type, date, status, and timestamps.
- Saved Qur’an session updates weekly sessions for the selected student.
- Saved Qur’an session updates today’s state for the selected student.
- Saved Qur’an session changes the “Plan your first session” prompt for that student.
- Saved Qur’an session does not affect another student.

### Lesson Completion and Reports

Tests must verify:

- Marking Khadijah’s lesson done creates or updates a completion record tied to Khadijah.
- Khadijah’s completed lesson appears in Khadijah’s report when the date range includes the completion date.
- Khadijah’s completed lesson does not appear in Zayd’s report.
- Lesson completion date handling does not fail because of timezone/date normalization.

### Report Date Validation

Tests must verify:

- End date cannot be later than today.
- Start date cannot be later than today.
- Start date cannot be after end date.
- Invalid dates block report generation/export.
- Invalid dates show a clear validation message.

## Required Playwright Tests

Create or update Playwright specs for the flows below.

Use existing test utilities/fixtures if present. If no fixtures exist, create the smallest useful fixture setup needed for Adam, Khadijah, and Zayd.

Avoid brittle selectors. Prefer accessible selectors such as getByRole, getByLabel, getByText, and stable test IDs only when necessary.

### Playwright Spec 1: Dashboard Student Isolation

Suggested file name:

`tests/e2e/dashboard-student-isolation.spec.ts`

Test scenario:

1. Open the dashboard.
2. Select Khadijah.
3. Verify the dashboard indicates Khadijah is selected.
4. Verify the “Qur’an Arabic and Islamic Studies” section does not show Zayd.
5. Verify Khadijah-specific content appears if fixture data provides it.
6. Switch to Zayd.
7. Verify Khadijah-specific content no longer appears.
8. Verify dashboard records/proofs, today’s state, progress updates, and weekly sessions update or show correct empty states.

Acceptance:

- No cross-student leakage.
- Dashboard sections react to selected student changes.

### Playwright Spec 2: Archive Excludes Student from Active Dashboard

Suggested file name:

`tests/e2e/archive-dashboard-filtering.spec.ts`

Test scenario:

1. Create or load fixture data where Adam has needs-attention notes and weekly sessions.
2. Open dashboard and confirm Adam’s data appears when Adam is active/selected.
3. Archive Adam.
4. Return to dashboard or refresh dashboard.
5. Verify Adam is not included in active dashboard metrics.
6. Verify Adam’s needs-attention notes no longer appear.
7. Verify Adam’s weekly sessions no longer appear in active dashboard counts.

Acceptance:

- Archiving excludes Adam from active dashboard views.
- Historical data is not necessarily deleted, but it is not shown in active dashboard aggregates.

### Playwright Spec 3: Portfolio Evidence Empty State

Suggested file name:

`tests/e2e/dashboard-evidence-empty-state.spec.ts`

Test scenario:

1. Select a student with no portfolio evidence.
2. Open dashboard.
3. Verify portfolio evidence count is zero or empty state is shown.
4. Verify the dashboard does not show three fake evidence items.

Acceptance:

- No production-visible mock evidence.
- Empty evidence state is truthful.

### Playwright Spec 4: Qur’an Session Save Updates Dashboard

Suggested file name:

`tests/e2e/quran-session-dashboard-update.spec.ts`

Test scenario:

1. Select Khadijah.
2. Confirm initial weekly session count and today’s state.
3. Start or open the Qur’an session flow.
4. Save a Qur’an session.
5. Verify success feedback appears.
6. Return to dashboard if needed.
7. Verify weekly sessions updated for Khadijah.
8. Verify today’s state updated for Khadijah.
9. Verify progress updates changed if session saves are intended to generate progress updates.
10. Verify “Plan your first session” changed or disappeared.
11. Switch to Zayd and verify Khadijah’s saved session does not affect Zayd.

Acceptance:

- Saving a Qur’an session has visible downstream effects.
- Effects are scoped to selected student.

### Playwright Spec 5: Lesson Completion Appears in Report

Suggested file name:

`tests/e2e/lesson-completion-report.spec.ts`

Test scenario:

1. Select Khadijah.
2. Mark a lesson done.
3. Open reports.
4. Set report start date to today or earlier.
5. Set report end date to today.
6. Generate report.
7. Verify Khadijah’s completed lesson appears.
8. Switch report/student to Zayd.
9. Generate report for same date range.
10. Verify Khadijah’s completed lesson does not appear in Zayd’s report.

Acceptance:

- Lesson completion persists.
- Report reads the canonical completion data.
- Report is student-scoped.

### Playwright Spec 6: Report Date Validation

Suggested file name:

`tests/e2e/report-date-validation.spec.ts`

Test scenario:

1. Open reports.
2. Try to set end date to tomorrow.
3. Verify UI prevents it or shows validation.
4. Try to set start date to tomorrow.
5. Verify UI prevents it or shows validation.
6. Set start date after end date.
7. Verify report generation/export is disabled or blocked.
8. Verify a clear validation message is shown.

Acceptance:

- Future dates are blocked.
- Start date after end date is blocked.
- Invalid reports cannot be generated/exported.

## Playwright Test Data Guidance

Use deterministic fixture data.

Minimum fixture students:

- Adam: has needs-attention notes and weekly sessions; used for archive test.
- Khadijah: used for Qur’an session save and lesson completion tests.
- Zayd: used to prove selected-student isolation and prevent cross-student leakage.

Minimum fixture records:

- Adam needs-attention note
- Adam weekly session
- Khadijah Qur’an/Arabic/Islamic Studies lesson
- Zayd Qur’an/Arabic/Islamic Studies lesson or progress item
- A student with zero portfolio evidence

Tests should clean up or reset state between runs.

If the app uses local storage, seed/reset local storage in Playwright setup.

If the app uses an API/database, use test fixtures or API helpers to create deterministic data.

If the app has no reliable test data setup, create the smallest reusable Playwright fixture/helper needed. Do not build a broad test framework.

## Implementation Order

### Step 1: Add Failing Unit/Integration Tests

Start with selectors and validation logic.

Add tests proving current incorrect behavior:

- Archived student data leaks into dashboard.
- Selected student data leaks across students.
- Empty evidence shows fake count.
- Session save does not update dashboard-derived data.
- Lesson completion does not appear in report data.
- Invalid report dates are accepted.

### Step 2: Add Failing Playwright Tests

Add Playwright tests for the user-facing flows before implementation fixes.

The tests should fail against the current bugged behavior.

### Step 3: Centralize Dashboard Query/Selector Logic

Create or fix helpers similar to:

- `getActiveStudents()`
- `getSelectedStudentDashboardData(studentId)`
- `getWeeklySessions(studentId, weekStart, weekEnd)`
- `getNeedsAttentionItems(studentId)`
- `getPortfolioEvidence(studentId)`
- `getProgressUpdates(studentId)`
- `getTodayState(studentId, today)`
- `hasPlannedOrCompletedFirstSession(studentId)`

Use existing names/patterns where possible. Do not duplicate existing architecture.

### Step 4: Fix Archive Behavior

Archived students should be excluded from active dashboard metrics.

Keep historical records intact unless the existing product explicitly deletes archived student data.

### Step 5: Fix Selected Student Leakage

All dashboard sections must receive or derive selectedStudentId.

Watch for these likely bug sources:

- Components reading from global arrays without filtering.
- Components using the first student by default.
- Components using the most recently updated student.
- Hardcoded sample student names/data.
- Cached derived state not invalidating on selected student change.

### Step 6: Remove Production Mock Fallback Data

Dashboard and reports must not show mock/sample values in normal app mode.

If demo data is needed, gate it behind an explicit demo mode.

### Step 7: Fix Qur’an Session Save Flow

The save flow must:

- Validate selectedStudentId.
- Create a real session record.
- Attach Qur’an/session subject metadata.
- Set date correctly.
- Persist to the real store/database.
- Invalidate/refetch dashboard data or update local state.
- Show success feedback.
- Update weekly sessions, today’s state, and first-session prompt.

Recommendation:

A saved Qur’an session should count toward weekly sessions and progress updates. It should not automatically create portfolio evidence unless the user attaches proof/evidence.

### Step 8: Fix Lesson Completion to Report Pipeline

The completion flow must:

- Create/update a student-specific lesson completion record.
- Include lessonId, studentId, completedAt, and subject/track where available.
- Ensure report queries include lesson completions in the selected date range.
- Prevent Khadijah’s completed lessons from appearing in Zayd’s report.

### Step 9: Fix Report Date Validation

Add validation at both UI and report-generation/query level.

Rules:

- End date must be today or earlier.
- Start date must be today or earlier.
- Start date must be on or before end date.

Invalid dates must block generation/export and show clear messaging.

## Manual Verification Checklist

After automated tests pass, manually verify:

- Archive Adam. Confirm Adam’s needs-attention notes disappear.
- Archive Adam. Confirm Adam’s weekly sessions disappear from active dashboard counts.
- Select Khadijah. Confirm Zayd does not appear anywhere in Khadijah’s Qur’an/Arabic/Islamic Studies dashboard section.
- Select Khadijah. Confirm records/proofs, today’s state, progress updates, weekly sessions, and portfolio evidence all change or empty correctly.
- Confirm a student with no portfolio evidence shows zero or an empty state, not three items.
- Save a Qur’an session. Confirm dashboard updates.
- Save a Qur’an session. Confirm “Plan your first session” disappears or changes for that student.
- Save a Qur’an session for Khadijah. Confirm Zayd’s dashboard does not change.
- Mark Khadijah’s lesson done. Generate a report including today. Confirm the lesson appears.
- Generate Zayd’s report for the same date range. Confirm Khadijah’s lesson does not appear.
- Try setting report end date to tomorrow. Confirm it is blocked.
- Try setting report start date to tomorrow. Confirm it is blocked.
- Try setting start date after end date. Confirm it is blocked.

## Definition of Done

This wave is complete only when:

- Unit/integration tests exist and pass.
- Playwright tests exist and pass.
- Dashboard data is selected-student scoped.
- Archived students are excluded from active dashboard data.
- Dashboard no longer shows production mock data as real data.
- Qur’an session save visibly updates the correct selected student’s dashboard state.
- Lesson completion appears in the correct selected student’s report.
- Report date validation prevents future and invalid date ranges.
- Manual verification checklist passes.

## Prompt for Claude Code / Dev Agent

```md
We are fixing MVP data-integrity bugs in Sheath Academy. Use TDD and Playwright.

Write failing tests first, including Playwright end-to-end tests for the user-facing flows. Then implement the smallest changes needed to pass.

Do not explore the whole repository. Only inspect files related to:
- dashboard page/components/cards
- selected student context/store
- student archive logic
- dashboard data selectors/query utilities
- session save/create flow
- lesson completion flow
- report generation/date filters
- shared types/schemas for students, sessions, lesson completions, evidence, progress updates, and reports
- Playwright config and existing e2e/spec files
- mock/sample data only if imported by dashboard or reports

Bugs to fix:
1. Archived Adam still shows needs-attention notes.
2. Archived Adam still contributes weekly sessions.
3. Selecting Khadijah still shows Zayd in the Qur’an Arabic and Islamic Studies dashboard section.
4. Dashboard records/proofs and today’s state do not change by selected student.
5. “Plan your first session” does not change after saving/starting a real session.
6. Dashboard shows three portfolio evidence items when there is no portfolio evidence.
7. Progress updates are unclear/not tied to real selected-student events.
8. Saving a Qur’an session appears to do nothing.
9. Marking Khadijah’s lesson done does not show in the report.
10. Report end date must not go beyond today.
11. Report start date must not go beyond today.
12. Report start date must not be after end date.

Required Playwright specs/coverage:
- Dashboard selected-student isolation.
- Archived student exclusion from active dashboard metrics.
- Portfolio evidence empty state showing zero/no items instead of fake items.
- Qur’an session save updates selected student dashboard state.
- Lesson completion appears in selected student report.
- Report date validation blocks future dates and start date after end date.

Expected behavior:
- Dashboard data must always be filtered by selectedStudentId.
- Active dashboard views must exclude archived students unless explicitly viewing archived/history mode.
- Dashboard widgets must use real records, not mock/demo fallback data.
- Saving a Qur’an session must persist a student-specific session and update weekly sessions, today’s state/progress updates, and first-session prompt.
- Marking a lesson done must create a student-specific completion record that appears in reports when the date range includes it.
- Reports must validate date ranges at UI and generation/query level.

Testing requirements:
- Add unit/integration tests for selectors, data filtering, session save side effects, lesson completion reporting, and report date validation.
- Add Playwright tests for the full UI flows listed above.
- Prefer accessible selectors in Playwright tests.
- Use deterministic test data for Adam, Khadijah, and Zayd.
- Ensure tests reset state between runs.

Implementation guidance:
- Prefer centralized selector/query helpers over per-component filtering.
- Do not create duplicate data models if existing entities already exist.
- Keep historical archived student records intact, but exclude them from active dashboard aggregates.
- Normalize dates so today’s records appear correctly in reports.
- Remove production use of mock/sample fallback data from dashboard/report render paths.

Definition of done:
- Unit/integration tests pass.
- Playwright tests pass.
- Manual verification checklist passes.
```
