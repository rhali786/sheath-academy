# Plan: Bug Fix Wave — BUG-001 through BUG-016

## Context

16 bugs identified through manual QA on the live Render site. 14 feedback items also logged.
This plan addresses all 16 bugs in focused waves, each with unit tests, integration tests,
and Playwright E2E tests (TDD — failing tests written first).

Feedback items FB-001 through FB-014 are noted where they overlap with bugs, but feature
expansions are scoped out of this plan and belong in a separate plan.

---

## What this plan covers

- All 16 open bugs (BUG-001 to BUG-016)
- TDD: unit tests first, integration tests first, Playwright specs written before fixes land
- One wave per session message — strict file scope per wave

## What this plan does NOT cover

- FB-001 to FB-014 (feature expansions — separate plan)
- New features or major UI redesigns
- Refactors not required to fix the listed bugs

---

## Bug summary

| ID | Area | Title | Wave |
|----|------|-------|------|
| BUG-001 | Dashboard | Setup prompt remains stuck on first lesson | 3 |
| BUG-002 | Dashboard | Child selector filtering inconsistent across sections | 3 |
| BUG-003 | Dashboard | Needs Attention alert shows raw child ID | 1 |
| BUG-004 | Dashboard | Sort by date does not change order | 1 |
| BUG-005 | Quran Logging | Quran session card shows stale seed data | 4 |
| BUG-006 | Quran Logging | Weekly Sessions chart hardcoded | 4 |
| BUG-007 | Dashboard | Today metrics hardcoded / mismatched | 3 |
| BUG-008 | Reports | Export says "prepared" but no download occurs | 6 |
| BUG-009 | Planner | Duplicate Quran Memorisation subject rows | 5 |
| BUG-010 | Planner | Week navigation buttons do not change week | 5 |
| BUG-011 | Lessons | Today section only shows first child's lesson | 4 |
| BUG-012 | Attendance | Duplicate records + missing child names | 2 |
| BUG-013 | Attendance | Missing days metric not shown | 2 |
| BUG-014 | Settings | Week Starts On radio both appear checked | 1 |
| BUG-015 | Child Archive | Archived child data persists in active views | ✓ (previous plan) |
| BUG-016 | Lessons | Lesson status saved but not shown on card | 1 |

> BUG-015 (archive cascade) is covered in the previous wave already merged.
> This plan picks up remaining 15 bugs.

---

## Feedback overlap notes

| Feedback | Bug overlap | In scope? |
|---------|-------------|-----------|
| FB-001: Nav tab rename | None — cosmetic | **Out** (separate PR) |
| FB-002: Children sub-tab | No direct overlap | **Out** |
| FB-003: Subjects sub-tab | No direct overlap | **Out** |
| FB-004: Today dashboard refinement | Overlaps BUG-001, BUG-002, BUG-007 | Partial — fix bugs, not redesign |
| FB-006: Weekly Plan | Overlaps BUG-009, BUG-010 | Partial — fix bugs, not redesign |
| FB-011: Lessons page refinement | Overlaps BUG-011, BUG-016 | Partial — fix bugs, not redesign |
| FB-014: Attendance engine | Overlaps BUG-012, BUG-013 | Partial — fix bugs, not redesign |
| FB-005, 007–010, 012–013 | No bug overlap | **Out** |

---

## Pre-implementation audit (per CLAUDE.md)

Before each wave session, run:

```bash
git fetch origin && git merge origin/master
```

Then read every file listed in that wave's file index before touching anything.

---

## Wave 1 — Display-only fixes

**Bugs:** BUG-003, BUG-004, BUG-014, BUG-016

These are rendering/state bugs requiring no data model changes. Fastest wins.

---

### BUG-003 — Needs Attention alert shows raw child ID

**Root cause:** Alert item component hardcodes child ID string instead of resolving child name
from the children context or a lookup.

**Files to touch:**
- `features/dashboard/front/components/NeedsAttentionCard.tsx` (or alert item sub-component)
- `features/dashboard/__tests__/integration/NeedsAttentionCard.test.tsx` (new or extend)

**TDD:**
- Integration test: render `NeedsAttentionCard` with a mock alert containing `childId: 'student_seed_adam_001'`
  and a mock children context containing `{ id: 'student_seed_adam_001', name: 'Adam' }`.
  Assert rendered text includes `"Adam"` and does NOT include `"student_seed_adam_001"`.
- Playwright E2E (`e2e/dashboard.spec.ts`): navigate to `/`, find Needs Attention section,
  assert no element with text matching `/student_seed_.*_\d{3}/`.

**Implementation:**
- Inject the children list via `useHousehold()` or `useDashboard()`.
- Replace raw `alert.childId` display with `children.find(c => c.id === alert.childId)?.name ?? alert.childId`.

---

### BUG-004 — Sort by date does not change order

**Root cause:** Alert data has no `date` field, so "By Date" sort has nothing to sort on.
Exposing the option before the behavior exists misleads users.

**Decision: implement date sorting** — add a `date` field to alert items and sort by it.

**Files to touch:**
- `features/dashboard/front/components/NeedsAttentionCard.tsx` (sort UI)
- `features/dashboard/types.ts` — add `date: string` to alert item type
- `features/dashboard/server/service.ts` — populate `date` on each alert item
- `features/dashboard/__tests__/integration/NeedsAttentionCard.test.tsx`

**TDD:**
- Unit test: `sortAlerts(alerts, 'date')` returns alerts ordered oldest→newest by `alert.date`.
- Integration test: render with two alerts (different dates), select "By Date",
  assert rendered order matches date sort.
- Integration test: `alert.date` is a valid ISO date string in rendered output.

**Playwright E2E (`e2e/dashboard.spec.ts`):**
- Select "By Date" sort. Assert first alert has an earlier date than the second alert.

---

### BUG-014 — Week Starts On radio both appear checked

**Root cause:** Controlled input mismatch — likely a `defaultValue` used instead of `value`,
or state not updating on save response.

**Files to touch:**
- `features/settings/front/components/HouseholdSettingsTab.tsx` (or week-start sub-form)
- `features/settings/__tests__/integration/HouseholdSettingsTab.test.tsx` (new or extend)

**TDD:**
- Integration test: render settings form with `weekStart: 'monday'`.
  Assert Monday radio is checked, Sunday radio is not checked.
  Simulate clicking Sunday. Assert Sunday radio is checked, Monday radio is not.
  Simulate save. Assert only Sunday remains checked after re-render with updated value.
- Playwright E2E (`e2e/settings.spec.ts`): navigate to `/settings`, select Sunday,
  assert only one radio is checked after the success toast appears.

**Implementation:**
- Switch to fully controlled radio group: bind `checked={weekStart === 'sunday'}` etc.
- On save response, update local state from the response value, not from the click event alone.

---

### BUG-016 — Lesson status not shown on lesson card

**Root cause:** Lesson card component renders lesson fields but omits the `status` field,
even though `status` is persisted and returned by the API.

**Files to touch:**
- `features/planner/front/components/LessonCard.tsx` (or equivalent lesson list item)
- `features/planner/__tests__/integration/LessonCard.test.tsx` (new or extend)

**TDD:**
- Integration test: render `LessonCard` with `status: 'completed'`. Assert a badge or
  text element displaying "Completed" (or equivalent label) is visible.
- Integration test: render with `status: 'planned'`. Assert "Planned" badge is visible.
- Integration test: render with `status: 'missed'`. Assert "Missed" badge is visible.
- Playwright E2E (`e2e/planner.spec.ts`): navigate to `/lessons`, find a lesson card,
  assert a status indicator is present.

**Implementation:**
- Read `lesson.status` in the card component.
- Render a small status badge using a `STATUS_LABELS` map (`planned` → "Planned", `completed` → "Completed", etc.).
- Use Tailwind color classes per status (e.g., green for completed, amber for planned, red for missed).

---

### Wave 1 — File index

| File | Change |
|------|--------|
| `features/dashboard/front/components/NeedsAttentionCard.tsx` | Resolve child name from context |
| `features/dashboard/__tests__/integration/NeedsAttentionCard.test.tsx` | New/extend |
| `features/settings/front/components/HouseholdSettingsTab.tsx` | Fix controlled radio |
| `features/settings/__tests__/integration/HouseholdSettingsTab.test.tsx` | New/extend |
| `features/planner/front/components/LessonCard.tsx` | Render status badge |
| `features/planner/__tests__/integration/LessonCard.test.tsx` | New/extend |
| `e2e/dashboard.spec.ts` | New spec |
| `e2e/settings.spec.ts` | New spec |

---

## Wave 2 — Attendance data integrity

**Bugs:** BUG-012, BUG-013

---

### BUG-012 — Duplicate attendance records + missing child names

**Root cause (two issues):**
1. Service/API does not check for an existing record before inserting.
   Multiple submissions for the same `childId + date` create new records instead of updating.
2. The records list UI omits the child name column.

**Files to touch:**
- `features/attendance/server/service.ts` — add upsert logic
- `features/attendance/api/routes/attendance.ts` — confirm POST/PUT flow
- `features/attendance/front/components/AttendanceList.tsx` — add child name column
- `features/attendance/__tests__/api/attendance-service.test.ts` (new/extend)
- `features/attendance/__tests__/integration/AttendancePage.test.tsx` (extend)

**TDD:**

Unit tests (service):
- `createOrUpdateAttendance({ childId, date, status: 'present' })` twice for same child/date
  → store contains exactly one record; second call updates, does not insert.
- `createOrUpdateAttendance({ childId: 'A', date })` and `createOrUpdateAttendance({ childId: 'B', date })`
  → store contains two records (different children, same date — both valid).

Integration test (AttendancePage):
- Render page, submit Present twice for same child/date.
  Assert records list shows exactly one record for that child/date.
- Assert records list renders a child name column, not just a date and status.

Playwright E2E (`e2e/attendance.spec.ts`):
- Navigate to `/attendance`, mark Present, mark Present again, assert only one record visible.
- Assert record row contains child name text (not a UUID).

**Implementation:**
- In `attendance/server/service.ts`: before inserting, check for existing record with
  same `childId + date`. If found, update `status` and `updatedAt`. Otherwise insert.
- In `AttendanceList.tsx`: ensure child name is rendered per record (already partially addressed
  in previous wave — confirm or extend).

---

### BUG-013 — Missing days metric not shown

**Root cause:** The attendance summary only counts present/absent/partial.
Feature 23 acceptance criteria requires a "missing days" metric (school days with no record).
This needs school year date range data to compute expected days vs recorded days.

**Files to touch:**
- `features/attendance/server/service.ts` — add `missingDays` to summary calculation
- `features/school-year/server/service.ts` — confirm `getSchoolYear(householdId)` returns
  `startDate` and `endDate`
- `features/attendance/types.ts` — add `missingDays: number` to `AttendanceSummary`
- `features/attendance/front/components/AttendanceSummary.tsx` — render missing days
- `features/attendance/__tests__/api/attendance-service.test.ts` — extend

**TDD:**

Unit tests (service):
- Given school year 2025-09-01 to 2026-06-30, and 5 attendance records for a child
  through today, `getAttendanceSummary(childId, startDate, endDate)` returns
  `missingDays = (schoolDaysElapsed - recordCount)` where schoolDaysElapsed excludes
  weekends.
- A child with a record for every elapsed school day returns `missingDays: 0`.

Integration test (AttendanceSummary):
- Render `AttendanceSummary` with `{ present: 10, absent: 2, partial: 1, missingDays: 3 }`.
  Assert "3 days" (or equivalent label) is visible.

Playwright E2E (`e2e/attendance.spec.ts`):
- Navigate to `/attendance`, assert Summary section contains a "Missing" or "No record" label.

> **Decision: Mon–Fri only** — any weekday within the school year start/end range counts as a school day. No holiday awareness in this wave.

---

### Wave 2 — File index

| File | Change |
|------|--------|
| `features/attendance/server/service.ts` | Upsert logic + missingDays |
| `features/attendance/api/routes/attendance.ts` | Confirm upsert call |
| `features/attendance/types.ts` | Add `missingDays` to summary type |
| `features/attendance/front/components/AttendanceList.tsx` | Child name (confirm/extend) |
| `features/attendance/front/components/AttendanceSummary.tsx` | Render missingDays |
| `features/school-year/server/service.ts` | Read-only: verify date range API |
| `features/attendance/__tests__/api/attendance-service.test.ts` | New/extend |
| `features/attendance/__tests__/integration/AttendancePage.test.tsx` | Extend |
| `e2e/attendance.spec.ts` | Extend |

---

## Wave 3 — Dashboard data wiring

**Bugs:** BUG-001, BUG-002, BUG-007

These are the most complex. They require a full data-flow audit of the dashboard before
touching any files.

---

### BUG-001 — Setup prompt stuck on "Plan your first lesson"

**Root cause:** `setupStatus` is hardcoded as `{ hasLessons: false, hasAttendance: false, hasPortfolio: false }`.

**Files to touch:**
- `features/dashboard/api/routes/summary.ts` (or setup status route)
- `features/dashboard/server/service.ts` (or setup status service)
- `features/dashboard/__tests__/api/summary.test.ts` (extend)
- `features/dashboard/__tests__/integration/Dashboard.test.tsx` (extend)

**TDD:**

Unit test (service):
- `getSetupStatus(householdId)` when lessons exist for household → `hasLessons: true`.
- `getSetupStatus(householdId)` when no lessons → `hasLessons: false`.
- Same pattern for `hasAttendance` and `hasPortfolio`.

Integration test:
- Render Dashboard with mocked API returning `hasLessons: true`. Assert setup strip does not say "Plan your first lesson."
- Render with `hasLessons: false`. Assert setup strip shows "Plan your first lesson."

Playwright E2E (`e2e/dashboard.spec.ts`):
- Navigate to `/`, create a lesson, navigate back, assert setup strip has advanced past the first step.

---

### BUG-007 — Today metrics hardcoded/mismatched

**Root cause:** Several summary fields in the Today metrics bar are hardcoded
(e.g., Needs Attention count, Attendance Ready count).

**Files to touch:**
- `features/dashboard/api/routes/summary.ts`
- `features/dashboard/front/components/TodayMetricsBar.tsx` (or equivalent)
- `features/dashboard/__tests__/api/summary.test.ts` (extend)
- `features/dashboard/__tests__/integration/TodayMetricsBar.test.tsx` (new/extend)

**TDD:**

Unit test (API route):
- `GET /api/dashboard/summary` with seed data returns `needsAttentionCount` equal to
  actual count of alert items in the seed.
- `attendanceReadyCount` matches actual attendance records count.

Integration test:
- Render `TodayMetricsBar` with mocked summary. Assert displayed numbers match mock values.

Playwright E2E (`e2e/dashboard.spec.ts`):
- Navigate to `/`, read Needs Attention count from metric bar, count visible alert cards in
  Needs Attention section. Assert they match.

---

### BUG-002 — Child selector filtering inconsistent

**Root cause:** The top child selector updates some sections but not all.
Quran Logging, Per-Child Progress, Records & Proof, and top metrics all have
independent or missing child-filter wiring.

**Decision: Per-Child Progress removes its own selector and follows the global top selector.**

**Audit approach (read before touching):**

Before writing any code, trace each dashboard section:

| Section | Data source | Filtered by selected child? |
|---------|-------------|----------------------------|
| Today's State | `summary` API | Confirm |
| Do Today | `tasks` API | Confirm |
| Needs Attention | `alerts` API | Confirm |
| Per-Child Progress | **Remove own selector → follow top selector** | Implement |
| Quran Logging | `quran-sessions` API | Likely missing filter |
| Records & Proof | `records` API | Confirm |

**Files to touch:**
- `features/dashboard/front/context/DashboardProvider.tsx`
- `features/dashboard/front/pages/Dashboard.tsx`
- `features/dashboard/front/components/QuranLoggingSection.tsx` (or equivalent)
- `features/dashboard/front/components/RecordsSection.tsx` (or equivalent)
- `features/dashboard/__tests__/integration/Dashboard.test.tsx` (extend)

**TDD:**

Integration test:
- Render Dashboard with two children. Select child B. Assert Quran Logging section only
  shows child B's sessions.
- Select child A. Assert Quran Logging section shows child A's sessions.
- Assert Records & Proof section updates on child change.

Playwright E2E (`e2e/dashboard.spec.ts`):
- Select "Adam" from child selector. Assert Quran section contains "Adam" data only.
- Select "Khadijah". Assert section updates.

---

### Wave 3 — File index

| File | Change |
|------|--------|
| `features/dashboard/api/routes/summary.ts` | Real setup status + metrics |
| `features/dashboard/server/service.ts` | `getSetupStatus()` using real services |
| `features/dashboard/front/context/DashboardProvider.tsx` | Propagate selectedChildId |
| `features/dashboard/front/pages/Dashboard.tsx` | Wire filter to all sections |
| `features/dashboard/front/components/TodayMetricsBar.tsx` | Read real metric values |
| `features/dashboard/front/components/QuranLoggingSection.tsx` | Accept + use selectedChildId |
| `features/dashboard/front/components/RecordsSection.tsx` | Accept + use selectedChildId |
| `features/dashboard/__tests__/api/summary.test.ts` | Extend |
| `features/dashboard/__tests__/integration/Dashboard.test.tsx` | Extend |
| `features/dashboard/__tests__/integration/TodayMetricsBar.test.tsx` | New/extend |
| `e2e/dashboard.spec.ts` | Extend |

---

## Wave 4 — Quran + Lessons data flow

**Bugs:** BUG-005, BUG-006, BUG-011

---

### BUG-005 — Quran session card shows stale seed data

**Root cause:** Dashboard displays first matching session record rather than the newest
(likely `store.getAll().filter(s => s.childId === id)[0]` — no sort).

**Files to touch:**
- `features/dashboard/api/routes/quran-sessions.ts` (or records route)
- `features/dashboard/server/service.ts` — sort sessions by date desc, return latest
- `features/dashboard/__tests__/api/quran-sessions.test.ts` (new/extend)

**TDD:**

Unit test (service):
- Given two sessions for child A (older: Al-Mulk 1–5, newer: Al-Fatiha),
  `getLatestQuranSession(childId)` returns the Al-Fatiha session.

Integration test:
- Render Quran card with mocked latest session. Assert card shows newest session data.

Playwright E2E (`e2e/dashboard.spec.ts`):
- Log a new Quran session. Navigate back to dashboard. Assert card shows new session details,
  not the seed session.

---

### BUG-006 — Weekly Sessions chart hardcoded

**Root cause:** Dashboard loads chart data from API but passes a hardcoded default array
to the chart component instead of the API response.

**Files to touch:**
- `features/dashboard/front/components/QuranLoggingSection.tsx`
- `features/dashboard/__tests__/integration/QuranLoggingSection.test.tsx` (new/extend)

**TDD:**

Integration test:
- Render `QuranLoggingSection` with mocked API data returning 3 sessions this week.
  Assert chart component receives a `data` prop with 3 entries (not the hardcoded default).

Playwright E2E (`e2e/dashboard.spec.ts`):
- Log a session. Navigate back. Assert chart visually updates (non-zero bar for today's date).

---

### BUG-011 — Today section only shows first child's lesson

**Root cause:** Lessons page renders Today card with `childId={children[0].id}` — hardcoded
to first child.

**Files to touch:**
- `features/planner/front/pages/LessonsPage.tsx`
- `features/planner/__tests__/integration/LessonsPage.test.tsx` (new/extend)

**TDD:**

Integration test:
- Render `LessonsPage` with two children (Adam, Khadijah) both having lessons today.
  Assert Today section renders at least one lesson for each child, or renders all today's
  lessons without child scoping. Assert Khadijah's lesson is present.

Playwright E2E (`e2e/planner.spec.ts`):
- Navigate to `/lessons`. Assert Today section does not exclusively show one child's lessons
  when multiple children have lessons today.

**Implementation:**
- Iterate over all children and collect their today lessons, or pass `null` as `childId`
  to render all children's lessons.

---

### Wave 4 — File index

| File | Change |
|------|--------|
| `features/dashboard/api/routes/quran-sessions.ts` | Sort by date desc |
| `features/dashboard/server/service.ts` | `getLatestQuranSession()` fix |
| `features/dashboard/front/components/QuranLoggingSection.tsx` | Pass API chart data |
| `features/planner/front/pages/LessonsPage.tsx` | Fix hardcoded `children[0]` |
| `features/dashboard/__tests__/api/quran-sessions.test.ts` | New/extend |
| `features/dashboard/__tests__/integration/QuranLoggingSection.test.tsx` | New/extend |
| `features/planner/__tests__/integration/LessonsPage.test.tsx` | New/extend |
| `e2e/dashboard.spec.ts` | Extend |
| `e2e/planner.spec.ts` | Extend |

---

## Wave 5 — Planner fixes

**Bugs:** BUG-009, BUG-010

---

### BUG-009 — Duplicate Quran Memorisation subject rows

**Root cause:** Either the seed creates duplicate subject records for the same course,
or the planner query returns the same subject twice (e.g., by joining subjects + lessons
and grouping incorrectly).

**Two root cause paths — audit before implementing:**
1. Check seed: does `features/subjects/server/seed.ts` insert Quran Memorisation twice?
2. Check planner query: does `getPlannerWeek` return duplicate subject rows?

**Files to touch:**
- `features/subjects/server/seed.ts` — read/audit
- `features/planner/server/service.ts` — read/audit dedup logic
- `features/planner/__tests__/api/planner-service.test.ts` (new/extend)
- `features/planner/__tests__/integration/WeekGrid.test.tsx` (new/extend)

**TDD:**

Unit test (service):
- `getPlannerWeek(householdId, weekStart)` returns rows where each subject appears exactly once
  per child, even if the subject has multiple lessons.

Integration test (`WeekGrid`):
- Render `WeekGrid` with mock data where child Adam has two lessons under Quran Memorisation.
  Assert subject row "Quran Memorisation" appears exactly once in Adam's row group.

Playwright E2E (`e2e/planner.spec.ts`):
- Navigate to `/planner`, open subject filter, count occurrences of "Quran Memorisation".
  Assert count equals 1.

---

### BUG-010 — Week navigation stuck

**Root cause:** Navigation buttons either do not update week state, or state updates but does
not propagate to the grid query. Likely: local state updates but `currentWeekStart` prop
passed to grid is not re-derived.

**Files to touch:**
- `features/planner/front/pages/PlannerPage.tsx` (or `WeeklyPlannerPage.tsx`)
- `features/planner/front/components/WeekGrid.tsx`
- `features/planner/__tests__/integration/PlannerPage.test.tsx` (new/extend)

**TDD:**

Integration test:
- Render `PlannerPage`. Find week label (e.g., "May 11–17").
  Click Previous. Assert week label changes to the prior week (e.g., "May 4–10").
  Click Next. Assert week label returns to "May 11–17".
  Click Next again. Assert week label advances to "May 18–24".

Playwright E2E (`e2e/planner.spec.ts`):
- Navigate to `/planner`. Note displayed week. Click Previous. Assert week range changes.

**Implementation:**
- Confirm week state is derived correctly (e.g., `startOfWeek(addWeeks(currentDate, offset))`).
- Confirm the grid receives the updated `weekStart` as a prop and re-fetches or refilters.

---

### Wave 5 — File index

| File | Change |
|------|--------|
| `features/subjects/server/seed.ts` | Audit for duplicate records (read-only first) |
| `features/planner/server/service.ts` | Dedup subject rows if needed |
| `features/planner/front/pages/PlannerPage.tsx` | Fix week navigation state |
| `features/planner/front/components/WeekGrid.tsx` | Consume updated weekStart prop |
| `features/planner/__tests__/api/planner-service.test.ts` | New/extend |
| `features/planner/__tests__/integration/WeekGrid.test.tsx` | New/extend |
| `features/planner/__tests__/integration/PlannerPage.test.tsx` | New/extend |
| `e2e/planner.spec.ts` | Extend |

---

## Wave 6 — Reports export

**Bug:** BUG-008

---

### BUG-008 — Export says "prepared" but no download occurs

**Root cause:** The "Attendance Report" button opens a modal that says the report is being
prepared and to check downloads, but no download/export actually fires.

**Decision: print / PDF flow** — trigger `window.print()` (or navigate to the reports
page print view) so the user gets a real printable output. Remove the misleading
"being prepared, check downloads" copy entirely.

**Files to touch:**
- `features/reports/front/components/AttendanceReportModal.tsx` (or equivalent export modal)
- `features/dashboard/__tests__/integration/RecordsSection.test.tsx` (new/extend)

**TDD:**

Integration test:
- Spy on `window.print`. Click "Attendance Report" button. Assert `window.print` was called.
- Assert the modal no longer contains "being prepared" or "check your downloads."

Playwright E2E (`e2e/reports.spec.ts`):
- Click the Attendance Report button. Assert `window.print` is called (or assert
  navigation to the reports/print page).

---

### Wave 6 — File index

| File | Change |
|------|--------|
| `features/reports/front/components/AttendanceReportModal.tsx` | Fix copy or implement export |
| `features/dashboard/__tests__/integration/RecordsSection.test.tsx` | New/extend |
| `e2e/reports.spec.ts` | Extend |

---

## E2E specs summary

| Spec file | Bugs covered |
|-----------|-------------|
| `e2e/dashboard.spec.ts` | BUG-001, BUG-002, BUG-003, BUG-004, BUG-005, BUG-006, BUG-007 |
| `e2e/attendance.spec.ts` | BUG-012, BUG-013 |
| `e2e/settings.spec.ts` | BUG-014 |
| `e2e/planner.spec.ts` | BUG-009, BUG-010, BUG-011, BUG-016 |
| `e2e/reports.spec.ts` | BUG-008 |

---

## Session discipline

Each wave = one session message with explicit file scope.
Write failing tests first. Then implement until tests pass. Then push.
Do not read or modify files outside the wave's file list without explicit approval.

---

## Decisions (locked)

| Question | Decision |
|----------|----------|
| BUG-004: Sort by date | Implement — add `date` field to alert items and sort by it |
| BUG-013: Missing days definition | Mon–Fri only within school year range. No holiday awareness in this wave. |
| BUG-008: Export behavior | Print / PDF flow — `window.print()` or navigate to reports print view |
| BUG-002: Per-Child Progress selector | Unify — remove its own selector, follow global top selector |
| Wave ordering | Wave 1 first (quick display wins) |
