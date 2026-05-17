# Plan: Bug Fix + Feedback Implementation — BUG-001–016, FB-001–014

## Context

16 open bugs (manual QA on live site) and 14 feedback items. All are addressed in this plan.
Bugs and feedback that touch the same area are grouped into the same wave.
TDD throughout: failing tests written before implementation at every layer.

---

## Decisions locked

| Question | Decision |
|----------|----------|
| BUG-004: Sort by date | Implement — add `date` field to alert items and sort by it |
| BUG-013: Missing days definition | Mon–Fri only within school year range |
| BUG-008: Export behavior | Print / PDF flow via `window.print()` |
| BUG-002: Per-Child Progress selector | Unify — remove its own selector, follow global top selector |
| Wave ordering | Wave 0 first (nav + directory rename), then Wave 1 (display fixes) |
| FB-001: Directory rename | Yes — `features/planner` → `features/plan`, `features/reports` → `features/records` |
| FB-001: Growth tab | portfolio + progress features; `features/portfolio` maps to Growth |
| FB-001: Resources tab | Stub page + route only at MVP |
| FB-002/003 scope | Full implementation (enrollment model, instructor assignment, transcript fields) |
| FB-005/012/013 scope | Full implementation waves |

---

## Bug + feedback map

| ID | Type | Area | Title | Wave |
|----|------|------|-------|------|
| FB-001 | Feedback | Nav | Tab rename + directory rename | 0 |
| BUG-003 | Bug | Dashboard | Needs Attention shows raw child ID | 1 |
| BUG-004 | Bug | Dashboard | Sort by date no-op | 1 |
| BUG-014 | Bug | Settings | Week Starts On radio both checked | 1 |
| BUG-016 | Bug | Lessons | Lesson status not shown on card | 1 |
| FB-007 | Feedback | Settings | Household Settings expansion | 1 |
| BUG-012 | Bug | Attendance | Duplicate records + missing child names | 2 |
| BUG-013 | Bug | Attendance | Missing days metric | 2 |
| FB-014 | Feedback | Attendance | Attendance as records/compliance engine | 2 |
| BUG-001 | Bug | Dashboard | Setup prompt stuck | 3 |
| BUG-002 | Bug | Dashboard | Child selector filtering inconsistent | 3 |
| BUG-007 | Bug | Dashboard | Today metrics hardcoded | 3 |
| FB-004 | Feedback | Dashboard | Today as priority command center | 3 |
| BUG-005 | Bug | Quran | Session card shows stale data | 4 |
| BUG-006 | Bug | Quran | Weekly Sessions chart hardcoded | 4 |
| BUG-011 | Bug | Lessons | Today shows only first child | 4 |
| FB-011 | Feedback | Lessons | Lessons as work management hub | 4 |
| BUG-009 | Bug | Planner | Duplicate subject rows | 5 |
| BUG-010 | Bug | Planner | Week navigation stuck | 5 |
| FB-006 | Feedback | Planner | Planner as planning control board | 5 |
| BUG-008 | Bug | Reports | Export says prepared, nothing downloads | 6 |
| FB-002 | Feedback | Children | Children sub-tab full refinement | 7 |
| FB-003 | Feedback | Subjects | Subjects/Courses sub-tab full refinement | 8 |
| FB-008 | Feedback | Settings | Settings architecture reorganization | 9 |
| FB-009 | Feedback | School Year | School Year as academic calendar foundation | 10 |
| FB-010 | Feedback | Islamic Calendar | Muslim-native calendar reminders | 11 |
| FB-005 | Feedback | Schedule | Live schedule / classroom timing workflow | 12 |
| FB-012 | Feedback | Resources | Curriculum / resource pacing engine | 13 |
| FB-013 | Feedback | Resources | Community curriculum intelligence | 14 |

> BUG-015 (archive cascade) was addressed in the previous wave plan.

---

## Pre-implementation audit (per CLAUDE.md)

Before each wave:
```bash
git fetch origin && git merge origin/master
```
Read every file in the wave's file index before touching anything.

---

## Wave 0 — Navigation tab rename + feature directory rename

**Source:** FB-001

**Scope:**
- Rename nav tabs: Today (unchanged), Weekly → **Plan**, Reports → **Records**, add **Growth**, add **Resources**, Settings (unchanged), About (unchanged)
- Rename `features/planner` → `features/plan` (all imports, test paths, routes)
- Rename `features/reports` → `features/records` (all imports, test paths, routes)
- `features/portfolio` becomes the backing feature for the **Growth** tab
- Add `/growth` route pointing to portfolio+progress page
- Add `/resources` route pointing to a stub "Coming soon" page (`features/resources/`)
- Update `app/api/[...slug]/route.ts` router for new slug prefixes
- Update all `@/features/planner/...` imports → `@/features/plan/...`
- Update all `@/features/reports/...` imports → `@/features/records/...`

**Risk:** This wave touches every file that imports from `features/planner` or `features/reports`.
It must be done in isolation before any other wave to avoid merge conflicts.

**TDD:**

Unit:
- Router test: `GET /api/plan/...` routes to the correct handler (previously `/api/planner/...`).
- Router test: `GET /api/records/...` routes to the correct handler (previously `/api/reports/...`).

Integration:
- Render `Header` — assert nav contains links with text "Plan", "Records", "Growth", "Resources".
- Assert nav does NOT contain "Weekly" or "Reports" as link text.
- Render `Header` — assert "Growth" link points to `/growth`.
- Render `Header` — assert "Resources" link points to `/resources`.

Playwright (`e2e/auth.spec.ts`, `e2e/nav.spec.ts`):
- Navigate to `/`, assert nav item "Plan" is visible and "Weekly" is not.
- Click "Plan" → assert URL is `/plan` (or `/planner` if route alias used).
- Click "Records" → assert URL is `/records`.
- Click "Growth" → assert portfolio/growth page loads.
- Click "Resources" → assert stub page loads without error.

**File index:**

| File | Change |
|------|--------|
| `features/layout/front/components/Header.tsx` | Update link labels and hrefs |
| `features/plan/` (renamed from `features/planner/`) | Rename directory, update all internal imports |
| `features/records/` (renamed from `features/reports/`) | Rename directory, update all internal imports |
| `features/resources/` (new) | Stub feature directory + stub page |
| `app/(shell)/plan/page.tsx` (renamed from `/planner/page.tsx`) | Route rename |
| `app/(shell)/records/page.tsx` (renamed from `/reports/page.tsx`) | Route rename |
| `app/(shell)/growth/page.tsx` (new) | Route → PortfolioPage (growth view) |
| `app/(shell)/resources/page.tsx` (new) | Route → ResourcesStubPage |
| `app/api/[...slug]/route.ts` | Add `plan`, `records`, `resources` slug cases |
| `features/plan/api/router.ts` | Update router slug prefix |
| `features/records/api/router.ts` | Update router slug prefix |
| All files importing `@/features/planner/...` | Global import path update |
| All files importing `@/features/reports/...` | Global import path update |
| `e2e/nav.spec.ts` (new) | Nav label + routing E2E |
| `features/layout/__tests__/Header.test.tsx` | Update for new link labels |

---

## Wave 1 — Display fixes + Household Settings

**Bugs:** BUG-003, BUG-004, BUG-014, BUG-016
**Feedback:** FB-007 (Household Settings expansion)

---

### BUG-003 — Needs Attention shows raw child ID

**Root cause:** Alert item renders `alert.childId` directly instead of resolving the name.

**TDD:**
- Integration: render `NeedsAttentionCard` with `childId: 'student_seed_adam_001'` and
  children context containing `{ id: 'student_seed_adam_001', name: 'Adam' }`.
  Assert rendered text is "Adam", not "student_seed_adam_001".
- Playwright: navigate to `/`, assert no text matching `/student_seed_.*_\d{3}/` exists.

**Implementation:** `children.find(c => c.id === alert.childId)?.name ?? alert.childId`

---

### BUG-004 — Sort by date implements

**Decision:** Implement — add `date: string` (ISO) to alert items.

**TDD:**
- Unit: `sortAlerts(alerts, 'date')` returns alerts sorted oldest→newest by `alert.date`.
- Integration: two alerts with different dates, select "By Date" → assert rendered order is date-ascending.
- Playwright: select "By Date" sort → assert first alert date is earlier than second.

---

### BUG-014 + FB-007 — Week Starts On radio fix + Household Settings expansion

**BUG-014 root cause:** Uncontrolled radio input — `defaultValue` used instead of `value`.

**BUG-014 TDD:**
- Integration: render settings with `weekStart: 'monday'`. Assert Monday checked, Sunday not.
  Simulate click Sunday. Assert Sunday checked, Monday not. Save. Assert only Sunday checked after update.
- Playwright: navigate to `/settings`, click Sunday, assert only one radio checked after toast.

**FB-007 additions (same wave, same files):**
- Expand `weekStart` to support all 7 days (not just Mon/Sun).
- Add **Default School Days** checkboxes (all 7 days).
- Add **Day-load preference** per day: Off, Light, Normal, Heavy.
- Add **Household/School reporting name** field (for transcripts, exports).
- Add **Timezone** selector.
- Add **Date Display** preference: Gregorian only, Gregorian + English Hijri, Full bilingual.
- Add optional **Jumu'ah protected time** (leave window / return window).
- Add **unsaved-change warning** when navigating away with edits.
- Organize Household page into sections: Household Identity, Weekly Rhythm, Protected Time, Calendar & Time.

**FB-007 TDD:**
- Integration: render expanded Household settings, assert all 7 weekday checkboxes present.
- Integration: change day-load preference for Monday, save, assert preference persists.
- Integration: set reporting name, save, assert it appears on reports.
- Integration: set Jumu'ah window, save, assert it persists.
- Playwright: navigate to `/settings → Household`, assert Date Display preference selector exists.

---

### BUG-016 — Lesson status not shown on card

**Root cause:** Lesson card does not render the `status` field.

**TDD:**
- Integration: render `LessonCard` with `status: 'completed'` → assert "Completed" badge visible.
- Integration: `status: 'missed'` → assert "Missed" badge.
- Integration: `status: 'planned'` → assert "Planned" badge.
- Playwright: navigate to `/plan` (was `/planner`), find lesson card, assert status indicator present.

**Implementation:** `STATUS_LABELS` map + Tailwind color classes per status.

---

### Wave 1 — File index

| File | Change |
|------|--------|
| `features/dashboard/front/components/NeedsAttentionCard.tsx` | Resolve child name |
| `features/dashboard/__tests__/integration/NeedsAttentionCard.test.tsx` | New/extend |
| `features/settings/front/components/HouseholdSettingsTab.tsx` | Fix radio + expand fields |
| `features/settings/server/service.ts` | Add new household fields |
| `features/household/types.ts` | Expand `HouseholdProfile` with new fields |
| `features/settings/__tests__/integration/HouseholdSettingsTab.test.tsx` | New/extend |
| `features/plan/front/components/LessonCard.tsx` | Add status badge |
| `features/plan/__tests__/integration/LessonCard.test.tsx` | New/extend |
| `e2e/dashboard.spec.ts` | raw ID assertion |
| `e2e/settings.spec.ts` | radio + household fields |
| `e2e/nav.spec.ts` | lesson status assertion |

---

## Wave 2 — Attendance integrity + compliance engine

**Bugs:** BUG-012, BUG-013
**Feedback:** FB-014

---

### BUG-012 — Duplicate attendance records + missing child names

**Root cause:**
1. Service does not upsert — same `childId + date` creates a new record each time.
2. Records list UI omits child name column.

**TDD:**
- Unit: `createOrUpdateAttendance({childId, date, status})` called twice same child/date →
  store has exactly 1 record; second call updates, does not insert.
- Unit: different children, same date → 2 records (valid).
- Integration: submit Present twice same child/date → records list shows exactly 1 row.
- Integration: records list renders child name column (not UUID).
- Playwright: mark Present twice → assert only 1 record; assert row contains learner name.

---

### BUG-013 — Missing days metric

**Decision:** Mon–Fri only within school year range.

**TDD:**
- Unit: school year Sep 1 – Jun 30, 5 records for a child through today →
  `getAttendanceSummary(childId)` returns `missingDays = weekdaysElapsed - recordCount`.
- Unit: record for every elapsed weekday → `missingDays: 0`.
- Integration: render `AttendanceSummary` with `missingDays: 3` → assert "3" visible in Missing label.
- Playwright: navigate to `/records/attendance` (new path), assert Summary shows Missing metric.

---

### FB-014 — Attendance as records/compliance engine

**MVP additions (same wave):**
- Rename **Child → Learner** across all attendance UI.
- **Date defaults to today** in the attendance form.
- Add **daily batch attendance mode**: mark all learners at once.
- Add **quick actions**: Mark all present, Mark all absent, Copy previous school day.
- Expand status options: Present, Absent, Partial, Excused absence, Sick day, Holiday/break,
  Field trip, Co-op day, Makeup day, Not a school day.
- Distinguish planned school day from non-school day in absence logic.
- Add **attendance type/context** field: Regular, Field trip, Co-op, Tutor, Masjid, Project day, etc.
- Add **reason templates** per status (sick, appointment, travel, etc.).
- Add **filters**: Today, This week, This month, This school year, Custom range, Learner, Status.
- Replace Delete action with safer **Archive / Void** with confirmation.
- Add **export actions**: Print attendance log, Export CSV (MVP).
- Add compliance progress display: "X of Y configured school days complete."
- Add **unsaved-change warning** when navigating away.
- Inherit school-year tracking method (days only / hours only / days + hours / flexible).

**FB-014 TDD:**
- Integration: render form → assert date field defaults to today.
- Integration: render batch mode → assert all active learners shown as a group.
- Integration: click "Mark all present" → assert all learner statuses set to Present.
- Integration: status dropdown includes "Field trip" and "Co-op day" options.
- Integration: Delete button → confirm dialog appears; record archived, not hard-deleted.
- Integration: filter by learner → assert only that learner's records shown.
- Playwright: open `/records/attendance`, mark all present via batch mode, assert all rows show Present.

---

### Wave 2 — File index

| File | Change |
|------|--------|
| `features/attendance/server/service.ts` | Upsert + missingDays + archiveByChildId |
| `features/attendance/api/routes/attendance.ts` | Upsert call; batch route |
| `features/attendance/types.ts` | Add `missingDays`, expand status enum, add type/reason |
| `features/attendance/front/components/AttendanceSummary.tsx` | missingDays metric |
| `features/attendance/front/components/AttendanceList.tsx` | Child name, filters, safe delete |
| `features/attendance/front/components/AttendanceForm.tsx` | Date default, Learner label, batch mode |
| `features/attendance/front/components/BatchAttendanceForm.tsx` (new) | Batch entry for all learners |
| `features/attendance/front/pages/AttendancePage.tsx` | Wire new components |
| `features/school-year/server/service.ts` | Read-only: verify date range |
| `features/attendance/__tests__/api/attendance-service.test.ts` | New/extend |
| `features/attendance/__tests__/integration/AttendancePage.test.tsx` | Extend |
| `e2e/attendance.spec.ts` | Extend |

---

## Wave 3 — Dashboard data wiring + Today command center

**Bugs:** BUG-001, BUG-002, BUG-007
**Feedback:** FB-004

---

### BUG-001 — Setup prompt stuck

**Root cause:** `hasLessons: false`, `hasAttendance: false`, `hasPortfolio: false` hardcoded.

**TDD:**
- Unit: `getSetupStatus(householdId)` returns `hasLessons: true` when lessons exist.
- Integration: Dashboard with `hasLessons: true` → setup strip does not say "Plan your first lesson."
- Playwright: create a lesson, return to Today → assert setup strip advances past first step.

---

### BUG-007 — Today metrics hardcoded

**Root cause:** Needs Attention count, Attendance Ready, and other metric bar fields are hardcoded.

**TDD:**
- Unit: `GET /api/dashboard/summary` with seed data → `needsAttentionCount` equals actual alert count.
- Integration: render `TodayMetricsBar` with mocked summary → displayed numbers match mock.
- Playwright: count visible alert cards, assert metric bar count matches.

---

### BUG-002 — Child selector filtering inconsistent

**Decision:** Per-Child Progress removes its own selector and follows global top selector.

**Audit before touching (trace each section):**

| Section | Expected filter |
|---------|----------------|
| Today's State | selectedChildId |
| Do Today | selectedChildId |
| Needs Attention | selectedChildId |
| Per-Child Progress | selectedChildId (remove own selector) |
| Quran Logging | selectedChildId |
| Records & Proof | selectedChildId |

**TDD:**
- Integration: render Dashboard, select child B → Quran Logging section shows only B's sessions.
- Integration: Per-Child Progress section has no child selector of its own.
- Playwright: select Adam → assert Quran section updates; select Khadijah → assert it updates again.

---

### FB-004 — Today as priority command center

**MVP additions (same wave):**
- Replace "Plan your first lesson / Coming soon" hero with **Today's Homeschool Status** summary card.
  Includes: attendance status, overdue count, Quran logging status, daily readiness %.
- Move **Needs Attention** directly below the status summary.
- Add **School Year Progress** card: Day X of 180, Week X of 36, remaining school days.
- Add bilingual Islamic date display: Arabic Hijri + English Hijri + Gregorian.
- Rename **Records & Proof** → **Records Readiness** with clear readiness state.
- Surface pacing awareness: "On pace / Behind / Ahead" indicator.
- Add **Now & Next** live schedule preview card (minimal: next planned lesson + time).
- All metrics must derive from live API data (no hardcoded values after BUG-007 fix).

**FB-004 TDD:**
- Integration: render Today → assert `TodayStatusSummary` card is present.
- Integration: render Today with school year data → assert "Day X of 180" visible.
- Integration: Islamic date display enabled → assert Hijri date text is rendered.
- Integration: `NeedsAttention` renders directly below status summary.
- Playwright: navigate to Today → assert "School Year Progress" card visible with non-zero day count.

---

### Wave 3 — File index

| File | Change |
|------|--------|
| `features/dashboard/api/routes/summary.ts` | Real setup status + real metrics |
| `features/dashboard/server/service.ts` | `getSetupStatus()`, `getTodayMetrics()` |
| `features/dashboard/front/context/DashboardProvider.tsx` | Propagate selectedChildId to all sections |
| `features/dashboard/front/pages/Dashboard.tsx` | Wire filter; add new FB-004 sections |
| `features/dashboard/front/components/TodayMetricsBar.tsx` | Live metric values |
| `features/dashboard/front/components/TodayStatusSummary.tsx` (new) | Status card |
| `features/dashboard/front/components/SchoolYearProgressCard.tsx` (new) | Day/week progress |
| `features/dashboard/front/components/IslamicDateDisplay.tsx` (new) | Hijri + Gregorian date |
| `features/dashboard/front/components/QuranLoggingSection.tsx` | Accept + filter by selectedChildId |
| `features/dashboard/front/components/PerChildProgressSection.tsx` | Remove own selector |
| `features/dashboard/front/components/RecordsReadinessSection.tsx` (rename) | Rename + readiness state |
| `features/dashboard/__tests__/api/summary.test.ts` | Extend |
| `features/dashboard/__tests__/integration/Dashboard.test.tsx` | Extend |
| `features/dashboard/__tests__/integration/TodayMetricsBar.test.tsx` | New/extend |
| `e2e/dashboard.spec.ts` | Extend |

---

## Wave 4 — Quran + Lessons data flow + Lessons hub

**Bugs:** BUG-005, BUG-006, BUG-011
**Feedback:** FB-011

---

### BUG-005 — Quran session card shows stale seed data

**Root cause:** Service returns first matching session, not newest.

**TDD:**
- Unit: two sessions for child A (older: Al-Mulk 1–5, newer: Al-Fatiha) →
  `getLatestQuranSession(childId)` returns Al-Fatiha session.
- Integration: Quran card with mocked latest session → shows newest session data.
- Playwright: log new session, return to Today → card shows new session, not seed.

---

### BUG-006 — Weekly Sessions chart hardcoded

**Root cause:** Hardcoded default array passed to chart instead of API response.

**TDD:**
- Integration: `QuranLoggingSection` with mocked API returning 3 sessions this week →
  chart prop has 3 entries (not the hardcoded default).
- Playwright: log a session, return to Today → chart updates for today's date.

---

### BUG-011 — Today section only shows first child

**Root cause:** `LessonsPage` renders Today card with `childId={children[0].id}`.

**TDD:**
- Integration: two children (Adam, Khadijah) both with lessons today →
  Today section renders lessons for both (or renders all children's today lessons).
- Playwright: navigate to `/plan/lessons` (new path), assert Today section includes lessons for
  all children with lessons today.

**Implementation:** Iterate over all children, collect today lessons, or pass `null` childId.

---

### FB-011 — Lessons page as work management hub

**MVP additions (same wave):**
- Move Lessons under Plan tab as a subview (`/plan/lessons`).
- Rename form fields: Child → **Learner(s)**, Subject → **Course/Subject**, Due date → **Planned date**.
- Add **Estimated duration** field (15 min, 30 min, 45 min, 1 hr, custom).
- Add **Lesson type** dropdown (adaptive per course category):
  General: Lesson, Assignment, Reading, Practice, Review, Project, Assessment, Other.
  Quran: Memorisation, Revision, Recitation, Tajweed, Listening.
- Add **overdue labeling**: past planned date + not completed = "Overdue" badge.
- Add **filters and grouping**: by learner, course/subject, date range, status, overdue, lesson type.
- Expand lesson actions: Complete, Move, Edit, Skip, Add evidence.
- Replace Delete with **Archive/Remove** with confirmation for lessons with records.
- Add helper text when Course/Subject is empty: "Choose learner first to see active courses."
- Fix internal ID leaks in labels, filters, validation.

**FB-011 TDD:**
- Integration: render form → assert "Learner" label, not "Child".
- Integration: render form → assert "Planned date" label.
- Integration: render form → assert Lesson type dropdown present with Quran-specific options
  when Quran course is selected.
- Integration: lesson with past planned date + `status: 'planned'` → assert "Overdue" badge.
- Integration: Delete button → assert confirmation dialog; after confirm, lesson archived not deleted.
- Integration: filter by lesson type → assert only matching lessons shown.
- Playwright: open `/plan/lessons`, add lesson, assert Lesson type dropdown contains "Revision" for Quran.

---

### Wave 4 — File index

| File | Change |
|------|--------|
| `features/dashboard/api/routes/quran-sessions.ts` | Sort sessions by date desc |
| `features/dashboard/server/service.ts` | `getLatestQuranSession()` fix |
| `features/dashboard/front/components/QuranLoggingSection.tsx` | Pass API chart data |
| `features/plan/front/pages/LessonsPage.tsx` | Fix hardcoded `children[0]`; rename fields; add subview |
| `features/plan/front/components/LessonForm.tsx` | Rename fields, add duration, lesson type |
| `features/plan/front/components/LessonCard.tsx` | Overdue badge, expanded actions |
| `features/plan/front/components/LessonFilters.tsx` (new) | Filters + grouping |
| `features/plan/types.ts` | Add `estimatedDuration`, `lessonType`, `plannedDate` |
| `app/(shell)/plan/lessons/page.tsx` (new) | Route for `/plan/lessons` |
| `features/dashboard/__tests__/api/quran-sessions.test.ts` | New/extend |
| `features/dashboard/__tests__/integration/QuranLoggingSection.test.tsx` | New/extend |
| `features/plan/__tests__/integration/LessonsPage.test.tsx` | New/extend |
| `e2e/dashboard.spec.ts` | Quran session/chart assertions |
| `e2e/planner.spec.ts` | Lessons Today, lesson type assertions |

---

## Wave 5 — Planner fixes + planning control board

**Bugs:** BUG-009, BUG-010
**Feedback:** FB-006

---

### BUG-009 — Duplicate subject rows

**Root cause:** Audit seed and planner query — either seed inserts duplicate rows or
planner query doesn't dedup subjects with multiple lessons.

**TDD:**
- Unit: `getPlannerWeek(householdId, weekStart)` → each subject appears once per child
  even with multiple lessons.
- Integration: `WeekGrid` with Adam having two lessons under Quran Memorisation →
  "Quran Memorisation" row appears exactly once.
- Playwright: open `/plan`, filter subjects → "Quran Memorisation" count = 1.

---

### BUG-010 — Week navigation stuck

**Root cause:** Navigation buttons don't propagate updated `weekStart` to the grid.

**TDD:**
- Integration: render `PlannerPage` → click Previous → week label changes to prior week.
  Click Next twice → label shows week after current.
- Playwright: navigate to `/plan`, click Previous → assert week range changes in header.

---

### FB-006 — Planner as planning control board

**MVP additions (same wave):**
- Default to week containing **today** (not hardcoded week).
- **Highlight today's column** visually in the weekly grid.
- Improve **active filter display**: "Children: All 3 · Subjects: Quran, Math."
- Add **collapsible child groups** in the grid.
- Add **Scheduled-only vs All-subjects** view toggle.
- Remove/prevent duplicate subject rows (from BUG-009 fix).
- Add **Family/Shared Work** section in grid.
- Add **direct "+ Add lesson" affordance** in empty cells.
- Add lesson cell actions: Edit, Move, Duplicate, Complete, Add evidence.
- Support **estimated lesson durations** in cells.
- Auto-calculate **daily scheduled time totals** (e.g., "Monday: 6 lessons · 4h 20m").
- Add family-configurable **workload thresholds** (from Household settings).
  Frame warnings around settings: "Monday exceeds your preferred daily lesson target."
- Add **Week Balance summary**: total lessons, total instructional time, overloaded days.
- Add **Carry Forward Unfinished Work** action: move to next school day, next week, mark skipped.
- Add **print/export weekly plan** (via `window.print()`).
- Add **school week indicator**: "School Week 15 of 36."

**FB-006 TDD:**
- Integration: render `PlannerPage` → assert today's column is highlighted.
- Integration: render with active filters → assert filter summary text is visible.
- Integration: click "+ Add lesson" in empty cell → assert add-lesson form/modal opens.
- Integration: lesson with duration 30 min → daily total updates to reflect it.
- Integration: day exceeding threshold → assert warning message appears.
- Integration: click "Carry Forward" on an overdue lesson → assert move dialog appears.
- Playwright: navigate to `/plan`, assert school week indicator ("Week X of") is visible.

---

### Wave 5 — File index

| File | Change |
|------|--------|
| `features/subjects/server/seed.ts` | Audit + remove duplicate records |
| `features/plan/server/service.ts` | Dedup subject rows; default to current week |
| `features/plan/front/pages/PlannerPage.tsx` | Fix week nav; add week indicator; carry forward |
| `features/plan/front/components/WeekGrid.tsx` | Highlight today; add cell actions; duration totals |
| `features/plan/front/components/WeekGridFilters.tsx` | Improve filter display; add view toggle |
| `features/plan/front/components/SharedWorkSection.tsx` (new) | Family/shared lesson section |
| `features/plan/front/components/WeekBalanceSummary.tsx` (new) | Totals + threshold warnings |
| `features/plan/front/components/CarryForwardModal.tsx` (new) | Move unfinished work dialog |
| `features/plan/__tests__/api/planner-service.test.ts` | New/extend |
| `features/plan/__tests__/integration/WeekGrid.test.tsx` | New/extend |
| `features/plan/__tests__/integration/PlannerPage.test.tsx` | New/extend |
| `e2e/planner.spec.ts` | Extend |

---

## Wave 6 — Records export (print/PDF)

**Bug:** BUG-008

### BUG-008 — Export says prepared, nothing downloads

**Decision:** Print/PDF flow via `window.print()` or navigate to print view.

**TDD:**
- Integration: spy on `window.print`. Click "Attendance Report" button → assert `window.print` called.
- Integration: modal does NOT contain "being prepared" or "check your downloads."
- Playwright: click export → assert print dialog triggered or print view navigated to.

**File index:**

| File | Change |
|------|--------|
| `features/records/front/components/AttendanceReportModal.tsx` | Replace copy; wire `window.print()` |
| `features/dashboard/__tests__/integration/RecordsSection.test.tsx` | New/extend |
| `e2e/reports.spec.ts` | Extend |

---

## Wave 7 — Children sub-tab full refinement

**Source:** FB-002

**Scope:** Full implementation of transcript-safe learner records model.

**Changes:**
- Split "Child's name" into **First name*** + **Last name*** (required).
- Add helper text: "Names entered here may appear on reports, transcripts, and exported records."
- Change **Grade/Level** from free text to dropdown: PK, K, Grade 1–12, Other/custom.
- Keep DOB optional; show on card only when present, formatted cleanly.
- Remove **Teacher/Instructor** from child profile — instructor belongs at course/enrollment level.
- Add **"Allow learner to sign in"** toggle. Show Username/Password only when enabled.
- On learner cards: replace raw Username with "Learner login: Enabled / Not enabled."
- Rename **Edit** → **Edit profile** on cards.
- Archive behavior: keep records, hide from active planning, restorable.
- Add "Show archived" count display.

**TDD:**
- Unit: `createStudent({ firstName, lastName, ... })` → student stored with `firstName` and `lastName` fields.
- Unit: `archiveStudentProfile(id)` → student `isActive: false`, related data follows.
- Integration: render `AddChildForm` → assert "First name" and "Last name" fields present.
- Integration: render `AddChildForm` → assert Grade dropdown contains "PK", "K", "Grade 1"–"Grade 12".
- Integration: render `AddChildForm` → assert "Teacher/Instructor" field absent.
- Integration: "Allow learner to sign in" toggle off → Username/Password fields hidden.
- Integration: toggle on → Username/Password fields visible.
- Integration: render learner card → assert displays first + last name.
- Integration: render learner card → assert no raw username; assert "Learner login: Enabled" label.
- Playwright: navigate to `/settings`, open Children tab, add child with first + last name →
  assert card shows full name.

**File index:**

| File | Change |
|------|--------|
| `features/children/types.ts` | Add `firstName`, `lastName`; remove `teacherName` |
| `features/children/server/service.ts` | Update to firstName/lastName |
| `features/children/server/seed.ts` | Update seed to firstName/lastName |
| `features/children/front/components/ChildForm.tsx` | Split name; grade dropdown; learner login toggle |
| `features/children/front/components/ChildCard.tsx` | Full name; login status; rename Edit |
| `features/settings/front/pages/SettingsPage.tsx` | Wire updated child components |
| `features/children/__tests__/api/child.test.ts` | Extend |
| `features/children/__tests__/integration/ChildForm.test.tsx` | New/extend |
| `e2e/settings.spec.ts` | Children tab assertions |

---

## Wave 8 — Subjects/Courses sub-tab full refinement

**Source:** FB-003

**Scope:** Full implementation of course/enrollment management model.

**Changes:**
- Rename "Subject name" → **Course / Subject name**.
- Add optional **Instructor/Teacher** field (course-level, not child-level).
- Add optional **Level/Grade** field (e.g., Grade 5, Algebra I, Arabic Level 2).
- Associate courses with a **School Year**.
- Replace child-tab assignment with **Learner multi-select** inside the course form.
  - Support shared/family courses (one record, multiple learners).
- Fix **category formatting**: "IslamicStudies" → "Islamic Studies".
- Expand category list to include: Quran, Arabic, Islamic Studies, Math, English/ELA,
  Reading, Writing, Science, History, Social Studies, Geography, Art, PE/Health,
  Technology, Nature Study, Logic, Life Skills, Civics, Economics, Handwriting,
  Vocabulary/Spelling, Foreign Language, Other/Custom.
- Add **custom category** field when "Other/Custom" selected.
- Update **All Subjects table** → Course/Enrollment Management table.
  Columns: Learner(s), Course/Subject, Category, Level/Grade, School Year, Instructor, Status, Actions.
- For shared courses: show course once with learner chips, not duplicate rows.
- Archive behavior: keep records, hide from active planning, restorable.
- Standardize spelling: "Quran Memorization" (US English).

**TDD:**
- Unit: `createSubject({ learnerIds: ['A', 'B'], courseName, category })` → one subject record,
  enrolled for two learners.
- Unit: `getSubjectsByLearner(childId)` returns only that learner's enrolled courses.
- Integration: render `AddSubjectForm` → assert "Learner(s)" multi-select present.
- Integration: category dropdown contains "Quran" (first), "Arabic", "Islamic Studies".
- Integration: select "Other/Custom" → assert custom category text field appears.
- Integration: subject shared between Adam and Khadijah → All Subjects table shows one row with both learner chips.
- Integration: "IslamicStudies" category → displays as "Islamic Studies".
- Playwright: navigate to `/settings`, open Subjects tab, create shared course for two learners →
  assert table shows one row with two learner chips.

**File index:**

| File | Change |
|------|--------|
| `features/subjects/types.ts` | Add `instructorName`, `level`, `schoolYearId`, `learnerIds[]` |
| `features/subjects/server/service.ts` | Enrollment model; dedup |
| `features/subjects/server/seed.ts` | Update seed with proper categories + shared courses |
| `features/subjects/front/components/SubjectForm.tsx` | Learner multi-select; new fields |
| `features/subjects/front/components/SubjectTable.tsx` | Enrollment table; learner chips |
| `features/settings/front/pages/SettingsPage.tsx` | Wire updated subject components |
| `features/subjects/__tests__/api/subject.test.ts` | Extend |
| `features/subjects/__tests__/integration/SubjectForm.test.tsx` | New/extend |
| `e2e/settings.spec.ts` | Subjects tab assertions |

---

## Wave 9 — Settings architecture reorganization

**Source:** FB-008

**Scope:** Reorganize Settings sub-tabs to align with confirmed top-level tab structure.

**New Settings sub-tabs:**
- Household (already exists — expanded in Wave 1)
- School Year (already exists — expanded in Wave 10)
- Learners (replaces Children)
- Courses (replaces Subjects)
- Planning Defaults (new): planning style, workload thresholds, carry-forward behavior.
- Records & Compliance Defaults (new): tracking method, days vs hours, export format.
- Access & Privacy (new): learner login, data export, archive/delete.

**TDD:**
- Integration: render SettingsPage → assert tabs include "Learners", "Courses",
  "Planning Defaults", "Records & Compliance", "Access & Privacy".
- Integration: render SettingsPage → assert tabs do NOT include raw "Children" or "Subjects" labels
  (or keep friendly names while internally renaming).
- Integration: render Planning Defaults tab → assert workload threshold fields present.
- Playwright: navigate to `/settings`, assert sub-tab navigation contains new tabs.

**File index:**

| File | Change |
|------|--------|
| `features/settings/front/pages/SettingsPage.tsx` | Update tab navigation |
| `features/settings/front/components/PlanningDefaultsTab.tsx` (new) | Planning defaults UI |
| `features/settings/front/components/RecordsComplianceDefaultsTab.tsx` (new) | Compliance defaults UI |
| `features/settings/front/components/AccessPrivacyTab.tsx` (new) | Access/privacy settings |
| `features/settings/server/service.ts` | Extend to support new settings domains |
| `features/settings/__tests__/integration/SettingsPage.test.tsx` | New/extend |
| `e2e/settings.spec.ts` | Tab navigation assertions |

---

## Wave 10 — School Year Settings as academic calendar foundation

**Source:** FB-009

**Scope:** Full expansion of School Year Settings.

**MVP additions:**
- **Active school year card**: show name, Gregorian + Hijri start/end dates, day count, week count.
  Example: "Day 72 of 180 planned school days · Week 15 of 36."
- Prefill current active year when editing.
- Distinguish: Edit active year / Create new year / Create next year.
- Add **required school days** and/or **required instructional hours**.
- Add **tracking method**: Days only / Hours only / Days + hours / Flexible.
- Add **breaks, holidays, and custom non-school days** (Eid break, Ramadan light schedule, etc.).
- Add **terms/reporting periods**: full year, semesters, quarters, trimesters.
- Add **school day counting rules** and week numbering.
- Add **live academic-year preview** before saving: planned school days, required days,
  weeks remaining, target status.
- Add **compliance note**: location/state requirements with "informational, not legal advice" disclaimer.
- Add **planned school days calculator**: start/end dates + household school days + breaks.

**TDD:**
- Unit: `calculatePlannedSchoolDays({ startDate, endDate, schoolDays: ['mon','tue','wed','thu','fri'], breaks: [] })` → correct day count.
- Unit: add a 5-day Eid break → day count decreases by 5.
- Integration: render school year card → assert "Day X of Y" visible with real data.
- Integration: add a break (Eid) → preview updates day count.
- Integration: render tracking method selector → assert "Days only", "Hours only" options present.
- Playwright: navigate to `/settings`, open School Year tab → assert day count card is visible.

**File index:**

| File | Change |
|------|--------|
| `features/school-year/types.ts` | Add `requiredDays`, `requiredHours`, `trackingMethod`, `breaks[]`, `terms[]` |
| `features/school-year/server/service.ts` | `calculatePlannedDays()`, `getSchoolYearProgress()` |
| `features/school-year/front/components/SchoolYearCard.tsx` | Day/week progress display |
| `features/school-year/front/components/SchoolYearForm.tsx` | New fields + live preview |
| `features/school-year/front/components/BreakManager.tsx` (new) | Add/edit breaks |
| `features/school-year/__tests__/api/school-year.test.ts` | New/extend |
| `features/school-year/__tests__/integration/SchoolYearForm.test.tsx` | New/extend |
| `e2e/settings.spec.ts` | School Year tab assertions |

---

## Wave 11 — Islamic calendar reminders

**Source:** FB-010

**Scope:** Muslim-native calendar layer — countdowns, reminders, dashboard display.

**Features:**
- Built-in countdowns for: Ramadan, Eid al-Fitr, Eid al-Adha, Day of Arafah, Ashura,
  White Days (13th/14th/15th of each Hijri month), Sacred Months (Muharram, Rajab, Dhul-Qa'dah, Dhul-Hijjah).
- Support **custom Islamic date reminders** and **custom Gregorian date reminders**.
- Settings toggle per reminder: enabled/disabled via checkboxes.
- Surface selected reminders on **Today dashboard**:
  "Ramadan begins in 23 days" / "White Days begin tomorrow" / "We are in Rajab."
- Optional interaction with Planner and School Year (Eid break, Ramadan light schedule).
- Hijri date calculation (auto-computed, with manual adjustment later).

**TDD:**
- Unit: `getIslamicCalendarCountdowns(today)` returns correct days-remaining for next Eid given known test date.
- Unit: White Days calculation returns correct Hijri dates for a given month.
- Integration: render `IslamicCalendarCard` with upcoming Ramadan → assert "Ramadan begins in X days."
- Integration: reminder disabled in settings → assert that reminder does not appear on Today.
- Playwright: navigate to Today → assert at least one Islamic calendar indicator is visible.

**File index:**

| File | Change |
|------|--------|
| `features/islamic-calendar/` (new) | New feature directory |
| `features/islamic-calendar/types.ts` | Reminder, countdown types |
| `features/islamic-calendar/server/service.ts` | Hijri calculations, countdown logic |
| `features/islamic-calendar/front/components/IslamicCalendarCard.tsx` | Countdown display |
| `features/dashboard/front/pages/Dashboard.tsx` | Surface Islamic calendar card on Today |
| `features/settings/front/components/IslamicCalendarSettings.tsx` (new) | Toggle reminders |
| `features/islamic-calendar/__tests__/api/islamic-calendar.test.ts` | New |
| `features/islamic-calendar/__tests__/integration/IslamicCalendarCard.test.tsx` | New |
| `e2e/dashboard.spec.ts` | Assert Islamic calendar indicator |

---

## Wave 12 — Live schedule / classroom timing workflow

**Source:** FB-005

**Scope:** Dedicated Schedule/Classroom screen + "Now & Next" preview on Today.

**Features:**
- **Now & Next preview card** on Today dashboard: current lesson block, time remaining, next block.
- **Dedicated `/plan/schedule` route**: visual daily schedule.
- Display current lesson block, start/end times, current time, live time fill, upcoming preview.
- **Pause Day / Resume Day** workflow.
- **Dynamic Day Reflow** actions: shift remaining, swap order, pull independent work forward, compress/extend day, convert to light day, reschedule unfinished.
- **Instruction mode** per lesson block: Teacher-led, Guided, Independent, Shared/family, Tutor-led, Co-op, Async.
- **Flexibility state** per block: Locked, Flexible, Optional.
- **Independent work bank**: lessons that can be pulled forward when schedule changes.
- **Transition/break time** support between blocks; protected break types (lunch, prayer, Jumu'ah, toddler care).
- **Schedule templates**: Standard Monday, Co-op Tuesday, Light Friday, Ramadan schedule.

**TDD:**
- Unit: `buildDailySchedule(lessons, settings)` returns blocks with correct start/end times
  accounting for transition time.
- Unit: `reflow('compress', schedule, currentTime)` returns schedule with remaining blocks compressed.
- Integration: render `NowNextCard` with 2 lessons → assert current lesson and next lesson both visible.
- Integration: click "Pause Day" → assert reflow options appear.
- Integration: lesson with `flexibilityState: 'locked'` → assert it cannot be moved in reflow.
- Playwright: navigate to `/plan/schedule`, assert time-fill progress bar visible for current block.

**File index:**

| File | Change |
|------|--------|
| `features/schedule/` (new) | New feature directory |
| `features/schedule/types.ts` | ScheduleBlock, DaySchedule, ReflowAction types |
| `features/schedule/server/service.ts` | `buildDailySchedule()`, `reflow()` |
| `features/schedule/front/pages/SchedulePage.tsx` | Visual daily schedule |
| `features/schedule/front/components/ScheduleBlock.tsx` | Block card with live time fill |
| `features/schedule/front/components/NowNextCard.tsx` | Today dashboard preview |
| `features/schedule/front/components/ReflowPanel.tsx` | Reflow action panel |
| `features/dashboard/front/pages/Dashboard.tsx` | Surface `NowNextCard` on Today |
| `app/(shell)/plan/schedule/page.tsx` (new) | Route |
| `features/schedule/__tests__/api/schedule.test.ts` | New |
| `features/schedule/__tests__/integration/SchedulePage.test.tsx` | New |
| `e2e/planner.spec.ts` | Schedule route + Now & Next assertions |

---

## Wave 13 — Curriculum / resource pacing engine

**Source:** FB-012

**Scope:** Resources tab + pacing engine connected to Plan, Lessons, and Growth.

**Features:**
- `features/resources/` (scaffold started in Wave 0 as stub — expand here).
- Structured resource metadata: title, publisher, author, edition, grade/level, subject/category,
  ISBN, resource type (textbook/workbook/online course/Quran text/etc.),
  total pages, lesson count, units/chapters/modules, table of contents sequence.
- **Lesson generation from resource structure**: by pages, chapters, lessons, surahs/ayahs.
- **Pacing calculation**: resource length ÷ course schedule days = pages/lessons per day.
- **Pacing targets**: finish by school year end, finish by custom date, X pages/lessons per week.
- **Progress tracking**: completed through page X of Y; recalculate needed pace.
- **Adaptive recalculation** (user-confirms before changing plans).
- **Shared/verified resource database**: one entry per resource; admin verification workflow.
- Edition-exact matching, verification status (User-submitted / Needs review / Verified / Deprecated).
- Copyright guardrails: no redistribution of copyrighted content.

**TDD:**
- Unit: `calculatePace({ totalPages: 360, schoolDays: 150 })` → `pagesPerDay: 2.4`.
- Unit: `calculatePace` with completed pages → returns remaining days needed and pace.
- Unit: `generateLessons({ resource, paceTarget: 'byChapter', chapters: 30, schoolDays: 36 })` →
  returns 30 lesson stubs across the school year.
- Integration: render ResourceForm → assert title, publisher, edition, resource type fields present.
- Integration: render ResourceForm → assert lesson generation button present after metadata entered.
- Integration: render PacingCard with behind-pace state → assert "You need X pages/day to finish on time" visible.
- Integration: shared resource with verification status "Verified" → assert "Verified" badge visible.
- Playwright: navigate to `/resources`, add a resource, trigger lesson generation →
  assert lessons appear in plan.

**File index:**

| File | Change |
|------|--------|
| `features/resources/` (expand from Wave 0 stub) | Full feature directory |
| `features/resources/types.ts` | Resource, PacingTarget, VerificationStatus types |
| `features/resources/server/service.ts` | `createResource()`, `calculatePace()`, `generateLessons()` |
| `features/resources/front/pages/ResourcesPage.tsx` | Resource library list |
| `features/resources/front/components/ResourceForm.tsx` | Metadata entry form |
| `features/resources/front/components/PacingCard.tsx` | Pacing status + adaptive alert |
| `features/resources/front/components/LessonGenerationPanel.tsx` | Generate lessons from resource |
| `app/(shell)/resources/page.tsx` | Expand from stub |
| `features/resources/__tests__/api/resources.test.ts` | New |
| `features/resources/__tests__/integration/ResourcesPage.test.tsx` | New |
| `e2e/planner.spec.ts` | Pacing + lesson generation assertions |

---

## Wave 14 — Community curriculum intelligence

**Source:** FB-013

**Scope:** Community-informed resource intelligence with moderation and privacy controls.

**Features:**
- Parent feedback layer on resources/lessons: rating, difficulty, actual time, vocab load,
  parent prep, supplies, independent/teacher-led fit, Islamic compatibility note.
- **Muslim-native review signals**: Generally compatible / Needs parent context /
  Contains worldview concern / Contains sensitive content / Strongly beneficial / Not reviewed.
- Parent notes shared only by opt-in; not auto-exposed to other users.
- **Sheath Community Note** per resource: distilled vetted insight in consistent format
  (difficulty, time, prep, supplies, Islamic note, vocab warnings, pacing pattern, modifications).
- **Community pacing signals**: "Most families spend 2 days on this lesson."
- Contribution guards: no copyrighted content redistribution.
- Moderation/review workflow before community notes are broadly visible.
- Privacy controls: anonymous / named / private / share with Sheath for review.
- Future: resource recommendations based on grade, subject, Islamic compatibility, pacing, budget.

**TDD:**
- Unit: `createResourceFeedback({ resourceId, parentId, compatibility: 'needsContext', ... })` →
  feedback stored with status "pending review".
- Unit: `getVerifiedCommunityNote(resourceId)` returns null when no verified notes exist.
- Unit: feedback with copyrighted content flag → blocked from submission.
- Integration: render ResourceCard → assert "Community Note" section only shows when verified note exists.
- Integration: render FeedbackForm → assert Islamic compatibility selector present.
- Integration: anonymous contribution selected → feedback stored without parent attribution.
- Playwright: navigate to resource, open feedback form, submit feedback →
  assert "Under review" status shown; assert note not publicly visible until verified.

**File index:**

| File | Change |
|------|--------|
| `features/resources/types.ts` | Add ResourceFeedback, CommunityNote types |
| `features/resources/server/service.ts` | `createFeedback()`, `getCommunityNote()`, `moderateNote()` |
| `features/resources/front/components/FeedbackForm.tsx` | Parent feedback form |
| `features/resources/front/components/CommunityNoteCard.tsx` | Vetted note display |
| `features/resources/front/components/IslamicCompatibilityBadge.tsx` | Compatibility signal |
| `features/resources/server/moderation.ts` (new) | Moderation workflow |
| `features/resources/__tests__/api/community.test.ts` | New |
| `features/resources/__tests__/integration/FeedbackForm.test.tsx` | New |
| `e2e/planner.spec.ts` | Community note + feedback form assertions |

---

## E2E specs summary

| Spec file | Waves covered |
|-----------|---------------|
| `e2e/nav.spec.ts` | 0 |
| `e2e/dashboard.spec.ts` | 1, 3, 4, 11 |
| `e2e/settings.spec.ts` | 1, 7, 8, 9, 10 |
| `e2e/attendance.spec.ts` | 2 |
| `e2e/planner.spec.ts` | 4, 5, 12, 13, 14 |
| `e2e/reports.spec.ts` | 6 |
| `e2e/auth.spec.ts` | 0 (route changes) |

---

## Session discipline

Each wave = one session message with explicit file scope.
Write failing tests first (Jest for unit/integration, Playwright for E2E).
Then implement until tests pass. Then push.
Do not read or modify files outside the wave's file list without explicit approval.
Wave 0 must complete and merge before any other wave begins.
