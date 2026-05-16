# Dev Plan - Features 24-26: Progress / Records Dashboard Spine

## Scope

Implement the Wave 1C progress and dashboard records slice:

- Feature 24 - Progress by subject
- Feature 25 - Completed lesson history
- Feature 26 - Progress and attendance cards

This slice turns existing `lesson_task` and `attendance_record` data into parent-facing clarity. It should not introduce portfolio evidence, exports, alerts, AI guidance, compliance engines, advanced analytics, or new canonical entities.

## Development Constraints

Use TDD.

For each feature, write or update focused tests before implementation. Start with pure utility tests, then component/API behavior tests as needed. Do not rely only on manual clicking.

Only inspect files that are directly needed for this work. Do not explore the repo broadly. Avoid speculative refactors. Trace only the relevant files for:

- `lesson_task` types, store, status updates, and date fields
- `attendance_record` summary utilities from Features 20-23
- child selector state used by dashboard/planner/attendance
- subject/course records
- school year records
- dashboard card composition

Do not create a second child selector mechanism. Reuse the existing selected child / All Children state.

Dashboard should compose feature-owned summaries. It should not own business logic.

## MVP Decisions

Feature 24 ships only two scopes:

- This Week
- School Year

Do not ship month, quarter, custom ranges, trends, grades, mastery scoring, rankings, or analytics.

For progress calculations, count only existing/generated `lesson_task` records in the selected scope.

Do not count lessons that should exist because of recurrence rules.

Use simple Tailwind UI. Do not use Nivo for this slice.

## Feature 24 - Progress by Subject

### Goal

Parent can see progress without manually calculating lesson status totals.

### Source Data

Use existing entities:

- `lesson_task`
- `child`
- `subject/course`
- `school_year`

Do not create a new `progress` entity. Progress is a derived view.

### Progress Calculation

For each selected child and subject inside the selected scope:

```ts
plannedCount = all scoped lesson_task records;
completedCount = count where status === "completed";
skippedCount = count where status === "skipped";
notStartedCount = count where status === "not_started";
completionRate = plannedCount === 0 ? 0 : completedCount / plannedCount;
```

If moved/rescheduled exists, treat it as scheduling behavior, not a progress category.

### Recommended Type

```ts
export interface SubjectProgressSummary {
  childId: string;
  childName: string;
  subjectId: string;
  subjectName: string;
  scope: "week" | "year";
  plannedCount: number;
  completedCount: number;
  skippedCount: number;
  notStartedCount: number;
  completionRate: number;
}
```

### UI

Use a simple scope toggle:

```txt
This Week | School Year
```

Example display:

```txt
Math
8 completed / 12 planned
2 skipped - 2 not started
67%
```

For one selected child, show that child's subject progress.

For All Children, show grouped rows by child, then subject. Avoid ambiguous blended totals.

### TDD Targets

Write tests for:

- week scope filters lesson tasks correctly
- school-year scope filters lesson tasks correctly
- counts are correct for completed/skipped/not_started
- completion rate is safe when plannedCount is zero
- selected child returns only that child's subjects
- All Children returns grouped summaries
- archived or missing subject names do not crash the UI

### Done Means

- Parent can see progress by subject.
- Progress supports This Week and School Year scopes.
- Progress counts planned, completed, skipped, and not_started.
- Progress respects selected child and All Children.
- Progress uses existing `lesson_task` records only.
- No grades, rankings, or heavy analytics are added.

## Feature 25 - Completed Lesson History

### Goal

Parent can review what was actually completed.

### Source Data

A completed lesson is:

```ts
lessonTask.status === "completed"
```

Do not create a separate `completed_lesson` entity.

### Filters

Support filters for:

- child
- subject
- date range
- status

Default status filter:

```txt
Completed
```

Recommended additional status filter values:

```txt
Completed | Skipped | All final statuses
```

Keep this simple.

### Sort and Limit

Default sort:

```txt
newest first
```

Do not build export here. Export belongs later in report/export features.

Pagination is not required for MVP. Use a sensible list limit, such as 50 items, unless the repo already has a pagination convention.

### Display Fields

Each history item should show:

- lesson title
- child name
- subject name
- lesson date or completedAt if available
- status
- notes/resource indicator if present

If `completedAt` does not exist, use the lesson's scheduled date for now.

### TDD Targets

Write tests for:

- default view returns completed lessons only
- newest-first sorting
- child filter
- subject filter
- date-range filter
- status filter
- empty state when no matching lessons exist

### Done Means

- Parent can filter lesson history by child, subject, date range, and status.
- Default view shows completed lessons newest first.
- History resolves child and subject names.
- Empty state is clear.
- No separate completed lesson entity is created.
- No export is added.

## Feature 26 - Progress and Attendance Cards

### Goal

Dashboard shows records health without becoming cluttered.

### MVP Cards

Build thin dashboard cards for:

1. Current Week Attendance
2. Subject Progress
3. Recent Completed Lessons

Do not build 4-week trends, rankings, anxiety-heavy alerts, AI recommendations, compliance warnings, or advanced charts.

### Current Week Attendance Card

Use Feature 23 attendance summary.

For selected child:

```txt
This week attendance
Present: 3
Partial: 1
Absent: 0
Missing records: 1
```

For All Children, show per-child rows.

Use careful language:

```txt
Missing attendance records
```

Do not say:

```txt
Non-compliant days
```

### Subject Progress Card

Use Feature 24 progress summary.

Dashboard default should be current week only.

Example:

```txt
Math: 3/5 complete
Qur'an: 2/2 complete
Language Arts: 1/4 complete
```

### Recent Completed Lessons Card

Use Feature 25 history.

Limit to 3-5 recent completed lessons.

### TDD Targets

Write tests for:

- dashboard attendance card uses current week attendance data
- dashboard subject progress card uses current week progress data
- recent completed lessons card limits results to 3-5
- cards respect selected child
- All Children view uses per-child grouping where appropriate
- dashboard cards do not duplicate business logic from feature utilities

### Done Means

- Dashboard shows current week attendance.
- Dashboard shows subject progress.
- Dashboard shows recent completed lessons.
- Cards respect selected child and All Children.
- Cards are thin and avoid dashboard bloat.
- Cards avoid legal/compliance overclaiming.

## Recommended File Areas

Follow existing repo conventions. Expected areas to inspect or modify:

```txt
src/features/lesson-tasks/
src/features/attendance/
src/features/dashboard/
src/features/subjects/
src/features/school-year/
src/features/children/
```

Do not browse unrelated features.

Suggested additions, adjusted to actual repo conventions:

```txt
src/features/lesson-tasks/utils/progressBySubject.ts
src/features/lesson-tasks/utils/completedLessonHistory.ts
src/features/lesson-tasks/components/ProgressBySubjectCard.tsx
src/features/lesson-tasks/components/CompletedLessonHistory.tsx
src/features/dashboard/components/ProgressAttendanceCards.tsx
```

## Build Order

### Step 1 - Feature 24

1. Locate `lesson_task`, child, subject, school year, and selector utilities.
2. Write tests for `getSubjectProgressSummary()`.
3. Implement `getSubjectProgressSummary()`.
4. Add simple UI with This Week / School Year toggle.
5. Verify selected child and All Children behavior.

### Step 2 - Feature 25

1. Write tests for `getCompletedLessonHistory()`.
2. Implement history selector/helper.
3. Add filters for child, subject, date range, and status.
4. Default to completed lessons, newest first.
5. Add empty state.

### Step 3 - Feature 26

1. Write tests for dashboard card data selection.
2. Add Current Week Attendance card using attendance summary utility.
3. Add Subject Progress card using progress utility.
4. Add Recent Completed Lessons card using completed history utility.
5. Verify cards respect the existing dashboard child selector.

## Manual QA Checklist

After implementation, run the UI test plan separately. At minimum, verify:

1. Progress by subject counts are correct.
2. This Week and School Year scopes work.
3. Completed lesson history filters work.
4. Dashboard cards update when lesson status changes.
5. Dashboard cards update when attendance changes.
6. All Children view does not produce confusing blended totals.
7. Empty states are clear and calm.

## Out of Scope

Do not implement:

- portfolio evidence
- file/photo uploads
- PDF export
- report generation
- records review checklist
- state compliance engine
- custom analytics
- Nivo charts
- grades/GPA
- mastery scoring
- rankings
- AI guidance
- alerts
- notifications
- broad dashboard redesign
- new child selector state

## Implementation Prompt

Implement Features 24-26 using TDD.

Do not broadly explore the repo. Only inspect files directly needed for `lesson_task`, `attendance_record`, child selector state, subjects, school year, and dashboard card composition. Avoid speculative refactors.

Follow the README numbering: Feature 24 is Progress by subject, Feature 25 is Completed lesson history, and Feature 26 is Progress and attendance dashboard cards.

For Feature 24, calculate progress from existing `lesson_task` records grouped by child and subject. Ship only two scopes: This Week and School Year. Count planned as actual `lesson_task` records in the selected scope, not inferred recurrence expectations. Count completed, skipped, and not_started, and calculate completion rate safely.

For Feature 25, build completed lesson history from `lesson_task` records. Do not create a `completed_lesson` entity. Support filters for child, subject, date range, and status. Default to completed lessons, newest first. Do not add export yet.

For Feature 26, add thin dashboard cards for current week attendance, subject progress, and recent completed lessons. Use existing attendance and progress utilities. Dashboard should compose summaries, not own business logic. Respect the existing selected child / All Children state. Avoid dashboard bloat, compliance overclaiming, rankings, alerts, AI, advanced analytics, or Nivo charts.
