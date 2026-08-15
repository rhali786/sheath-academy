# Feedback batch plan — 2026-08-02 pull (7 real open gaps)

**Date:** 2026-08-02
**Source:** `npm run feedback:pull:prod`, prod DB, pull file `feedback-pulls/pull-2026-08-02T16-23-43-695Z.json`. Originally 28 rows with `status IN ('submitted','reviewed')`. Screenshots (where attached) in `feedback-screenshots/<id>.<ext>`.
**Precedent:** structure and tone follow `docs/20260716-feedback-batch-g1-g7-plan.md`.

## Status

Of the original 28 unresolved rows, 19 turned out to be stale — already shipped between 2026-07-16 and 2026-07-20 (`docs/20260716-feedback-batch-g1-g7-plan.md` phases G1–G7 + follow-up commit `9fd5436`), or pure praise with no actionable ask. All 19 commits/files were verified present on `origin/master` (prod, HEAD `7142c8a`, 2026-07-31) before closing anything. Those 19 feedback rows have been closed in the prod `user_feedback` table via `scripts/close-stale-feedback-20260802.js --apply` (17 → `shipped`, `version_resolved=2.110.1`; 2 → `cancelled`, no actionable ask). Two further rows (`b01b66f0` attendance break-ranges, `f96c36b3` dashboard calendar reminders/Google sync) were already correctly tracked elsewhere in `docs/bug_enhancement/20260707-feedback-bigger-features-plan.md` and needed no change.

This document now covers only the **7 genuinely open gaps** that remain: badge progress-tracking + custom badge images, drag-to-move on the Weekly Planner, combined multi-child daily view, recurring per-class schedule, course-first Learning Time selector, a custom 12-hour time picker, and the long-form Lesson Planner rework discussion (tracked as a follow-up design spike, not implemented here).

---

## Wave 1 — Growth/Badges: progress tracking and custom badge images

**Planning mode:** 2 (local feature behavior).

### Feedback
`57b14788` — "would like the ability to track progress toward a badge, and to be able to add a picture to represent that badge or select a default."

### Code-path audit
- **Renders:** `features/badges/front/pages/BadgesPage.tsx` (`BadgeDefinitionForm`, `AwardCard`, `BadgeEmblem`).
- **Data source today:** `features/badges/types.ts` — `BadgeDefinition` has `emblemKey: string` only; `BadgeEmblem` (`BadgesPage.tsx:130-149`) renders a text/lucide-icon fallback keyed off that string — the component's own comment says "the design target is real SVG art keyed by emblemKey," i.e. no image upload exists, only a key that maps to a small fixed icon set.
- **Server:** `features/badges/server/repository.ts` — `emblemKey` is the only visual field on create/update (`:169`, `:202`, `:231`); confirmed no `imageUrl`/`progress`/`threshold` columns anywhere in this file or `types.ts`.
- **Award progress:** `features/badges/server/award-rules.ts` was checked for progress/threshold/percent fields — none found. Awards are currently binary (earned/not earned), no partial-progress model.
- **Existing tests:** badge repository/route tests exist under `features/badges/__tests__/` (not itemized here — scope is additive, not a rewrite).
- **Missing tests:** progress-calculation unit test; image-upload API test; integration test for progress bar rendering and image display.

### Source-of-truth decision
Badges own this data end-to-end (`features/badges/`). No ownership violation — this is pure feature-local work. Progress is *derived* from whatever the badge's criteria references (this plan does not invent a new cross-feature progress-aggregation engine — see Out of scope).

### Data/contract changes
1. **Custom image (decide: URL-based, not binary upload, for parity with the rest of the app's asset patterns; consistent with the pattern in `db/schema.ts` for other blob-capable rows if binary is preferred instead — pick whichever the team's existing image-handling precedent uses; if no precedent exists, default to a URL field to avoid a new blob-storage decision here).** Add `imageUrl: text().nullable()` to `badge_definitions`, alongside the existing `emblemKey` (kept as the default/fallback when no custom image is set). New Drizzle migration via `npm run db:generate`.
2. **Progress (decide: manual/simple, not automatic cross-feature aggregation).** Add a `progressCurrent` / `progressTarget` pair (nullable integers) to `badge_awards`, settable by the parent when defining/tracking a badge manually (e.g. "5 of 10 memorized surahs"). This plan does **not** attempt to auto-wire progress from Gradebook/Qur'an/Portfolio counts — that would be a Mode 3 cross-feature project and a much larger scope change than the feedback asked for. Flag this reduced scope explicitly in the plan (see Out of scope).

### UI plan
- `BadgeDefinitionForm`: add an optional "Badge image URL" field (or file picker if an existing upload pattern is found during implementation — re-check `ui-style-guide` for an approved upload pattern before building a new one) alongside the emblem-key selector; emblem stays as the fallback.
- `AwardCard`: when `progressTarget` is set, render a simple progress bar/fraction ("3 / 10") with an edit control to update `progressCurrent`; when unset, no progress UI (empty state = binary earned/not-earned as today).
- `BadgeEmblem`: prefer `imageUrl` if present, fall back to the existing emblem-key icon lookup.

### Testing plan (failing first)
1. Repository test: creating a badge definition with `imageUrl` persists and returns it; updating `progressCurrent` on an award persists.
2. API test: `PATCH` award route accepts a progress update and rejects `progressCurrent > progressTarget` (or clamps — decide during implementation, document the choice).
3. Integration test: `BadgeDefinitionForm` — filling an image URL and saving shows the custom image in the definition list instead of the emblem icon. `AwardCard` — setting progress to 5/10 renders "5 / 10" and a proportional bar; incrementing updates the display.

### Build phases
1. Migration: `imageUrl` on `badge_definitions`, `progressCurrent`/`progressTarget` on `badge_awards`.
2. Repository + API: extend create/update inputs and response shapes.
3. `BadgeDefinitionForm`: image field.
4. `AwardCard`: progress bar + edit control.
5. `BadgeEmblem`: image-first rendering with emblem fallback.

### Out of scope
Automatic progress aggregation from other features' data (e.g. auto-computing "5 of 10 lessons completed" from Gradebook). Binary-blob image storage (URL-only for this wave). Any change to the existing emblem-icon set.

### Manual QA
1. Growth → Badges → Add badge: enter an image URL, save, confirm the image renders in the list instead of the icon.
2. Open an award for that badge, set progress target 10 / current 3, save, confirm "3 / 10" and a partial bar render.
3. Increment current to 10, confirm it visually reads as complete (exact "earned" semantics to be decided during implementation — does hitting the target auto-mark earned? confirm with product before building, note the decision in the PR).

### Branch and commit plan
`feature/badges-progress-and-image` — commits: migration; repository+API; definition-form image field; award progress UI; tests green.

---

## Wave 2 — Weekly Planner: drag-to-move and combined multi-child view

**Planning mode:** 3 (cross-feature/planner composition — touches the shared Weekly Planner surface and multi-learner rendering).

### Feedback
`781f32fe` — "move lessons directly on the weekly planner view like you can in the planning matrix." `62ac99a0` — "a combined view showing all children's lessons for a day together, instead of stacked per-child weekly views."

### Code-path audit
- **Planning Matrix (has the capability today):** `features/plan/front/components/WeekGrid.tsx:3,274` — uses `@dnd-kit/core` (`DndContext`, `useDraggable`, `useDroppable`, `DragOverlay`) to let a parent drag a lesson to a new day/slot.
- **Weekly Planner (does not have it):** `features/plan/front/components/WeeklyPlanner.tsx` — grep for `draggable|onDrop|onDragStart|dnd` returns **no matches**. This confirms the gap is real, not a misreport.
- **Grouping:** `WeeklyPlanner.tsx:34-126` — `learnerColor()`, `lessonsForLearner()`, `lessonsForLearnerDay()` all key off `learnerId` and render one stacked section per learner; there is no "all learners, one day, combined" grouping function.
- **View toggle already exists:** `PlannerViewToggle` (`features/plan/front/components/PlannerViewToggle.tsx`, shipped `2420dc4`) switches between Weekly Planner and Planning Matrix, persisted via `planner.defaultView` setting — this is the natural place to add a third view mode or a per-view display toggle.
- **Existing tests:** `features/plan/__tests__/integration/WeeklyPlanner.test.tsx`, `PlannerViewToggle.test.tsx`.
- **Missing tests:** drag-and-drop interaction test for the Planner view; combined-day-view rendering test.

### Source-of-truth decision
Owned entirely by `features/plan/` (Planner/Lesson Tasks owns lessons and scheduling). No cross-feature data ownership question — this is UI composition of already-owned data, reusing the exact same drag primitives (`@dnd-kit/core`) and mutation path (`updateLesson`/whatever `WeekGrid`'s `handleDragEnd` calls) that `WeekGrid` already proved out. Mode 3 only because it touches the shared multi-learner planner surface, not because ownership is unclear.

### UI plan
1. **Drag-to-move on Weekly Planner:** reuse `WeekGrid`'s `DndContext`/`useDraggable`/`useDroppable` pattern inside `WeeklyPlanner.tsx`; on drop, call the same lesson-date-update path `WeekGrid` uses (trace and reuse its `handleDragEnd`, do not build a second mutation path).
2. **Combined daily view:** add a display-mode control (segmented control near `PlannerViewToggle`, or a toggle within the Weekly Planner itself) — "By learner" (today's stacked default, unchanged) vs "By day" (one column per day, all learners' lessons for that day together, learner-color-coded using the existing `learnerColor()` helper so learners stay visually distinguishable without separate stacked sections).

### Testing plan (failing first)
1. Integration test: in Weekly Planner, drag a lesson card from Monday to Wednesday → assert the lesson's date updates and it renders under Wednesday, not Monday, after the drag completes (mirrors `WeekGrid`'s existing drag test pattern — find and reuse it).
2. Integration test: switch to "By day" mode → for a given day, lessons from Child A and Child B both render in that day's column with visually distinct learner-color coding; switching back to "By learner" restores the stacked-per-child layout.

### Acceptance criteria
- Weekly Planner: dragging a lesson to a different day moves it there and it persists after a page refresh (same persistence guarantee as the Planning Matrix).
- Selecting "By day" shows Child A and Child B's lessons together under each date; selecting "By learner" reverts to the current stacked view; no lessons are duplicated or dropped when toggling.

### Build phases
1. Extract/confirm `WeekGrid`'s drag-drop-to-date mutation path is reusable (function, not tangled directly into the matrix component); if it isn't cleanly reusable, factor it into a shared hook first — this is dependency, not the whole feature.
2. Wire drag-and-drop into `WeeklyPlanner.tsx`.
3. Add the by-day combined grouping function and view-mode toggle.
4. Tests, then manual QA.

### Out of scope
Any change to the Planning Matrix itself. Any change to `PlannerViewToggle`'s existing two-view semantics beyond adding the display-mode control described above.

### Manual QA
1. Open Plan → Weekly Planner. Drag "Spell words" from Monday to Thursday. Confirm it now appears under Thursday. Refresh the page — confirm it's still under Thursday.
2. Toggle to "By day" view. Confirm a day with two children's lessons shows both, color-coded by learner. Toggle back to "By learner" — confirm the original stacked-per-child layout returns unchanged.

### Branch and commit plan
`feature/planner-dragdrop-and-combined-view` — commits: `test(plan): cover weekly-planner drag-to-move`, `feat(plan): drag-to-move lessons on Weekly Planner`, `test(plan): cover combined by-day view`, `feat(plan): add by-day combined view toggle`.

---

## Wave 2b — Follow-up design spike (not implemented here)

**Feedback:** `6f7a6af3` — long-form (~4400 char) Lesson Planner UX rework proposal.

This is deliberately **not planned for implementation in this document**, per the same precedent as the 07-16 plan (`docs/20260716-lesson-planner-ux-rework-g8-plan.md` was its own separate plan). Since 07-16, substantial planner-rework work has already shipped as **G8** (`docs/20260716-lesson-planner-ux-rework-g8-plan.md` → phases: view toggle, learner-grouped Weekly Planner, card enrichment, curriculum/chapter/homework/assessment fields) and **G9** (calendar view surfacing, off-day awareness, multi-day lesson relabeling, Learning Time clock-driven auto-start). Recommendation: before scoping a new rework plan, re-read `6f7a6af3`'s full text against what G8/G9 already shipped to see what — if anything — is still genuinely unaddressed, then write a fresh, separate design-spike doc. Do not fold this into the current batch; it's too large and its scope overlaps live prior work.

---

## Wave 3 — Learning Time: recurring per-class schedule + course-first selector

**Planning mode:** 4 (new capability) for the recurring schedule; Mode 2 for the course-first selector (small, additive, already recommended).

### Feedback
`e6c64a05` — "would like a recurring schedule per class, not just per-lesson times." `66087f44` — course-first selection instead of learner-first, **already reviewed with a concrete recommendation on file**: *"Code audit: NowCard already supports tagging a subject and a specific lesson within a session (subject-select, lesson-select), but both are scoped by an already-selected learner (getLessons/getSubjects take learnerId). The literal ask — select by course first, learner second/narrowed — is not built. Recommend: add a Course selector on LearningTimePage that narrows the Learner dropdown to enrolled learners for that course and pre-fills subject on session start. Small, additive, no schema change (subjectId already exists on CreateSessionInput)."*

### Code-path audit
- **Recurring schedule:** grepped `features/learning-time/types.ts` and `features/learning-time/server/repository.ts` for `recurring|recurrence|daysOfWeek|weekly` — **no matches**. Confirmed no recurrence concept exists in Learning Time. The only time-scheduling primitive that exists is the **per-lesson-instance** `scheduledStartTime`/`scheduledEndTime` on `LessonTask` (shipped `b69274d`, per `docs/20260716-feedback-batch-g1-g7-plan.md`), which is deliberately per-occurrence, not a recurring weekly pattern per course.
- **Where a recurring pattern would plausibly live:** `SubjectCourse` (`features/subjects/types.ts`) is the closest owner of "this course meets Tue/Thu 10am-11am" as a course-level attribute, since Subjects/Courses already owns course identity and Learning Time/Planner are consumers. This needs confirming during implementation — do not assume without re-reading `features/subjects/types.ts` and how `computeDueDates`/lesson generation (`features/resources/server/service.ts`) already consumes subject-level scheduling hints, since a recurring-schedule feature that doesn't feed lesson generation would only half-satisfy the request.
- **Course-first selector:** `features/learning-time/front/components/NowCard.tsx` — confirmed by the existing review note that `getLessons`/`getSubjects` are learner-scoped, and `CreateSessionInput` already carries `subjectId`, so this is additive.
- **Existing tests:** `features/learning-time/__tests__/integration/NowCard.test.tsx`.
- **Missing tests:** recurring-schedule repository/API tests (new); course-first selector integration test (new).

### Source-of-truth decision
- **Recurring per-class schedule:** owned by `features/subjects/` (course identity) with `features/learning-time/` and `features/plan/` as consumers — mirrors the existing decision that Subjects/Courses owns `SubjectCourse` and other features are consumers-only. If implementation finds recurrence more naturally belongs to a scheduling primitive already inside `features/schedule/`, that's an acceptable alternative — confirm during the audit, don't assume Subjects is correct without re-checking `features/schedule/server/service.ts`.
- **Course-first selector:** stays inside `features/learning-time/` — pure UI composition of already-owned data, no new ownership question (matches the existing review note's conclusion of "small, additive, no schema change").

### Data/contract changes
Recurring schedule (new): add a `recurringSchedule` shape to `SubjectCourse` — e.g. `{ daysOfWeek: DayOfWeek[], startTime: string, endTime: string }[]` (array to support a course meeting at different times on different days), nullable/optional so existing courses are unaffected. New Drizzle migration.

### API/store/UI plan
- **Recurring schedule:** extend course create/edit UI (`features/subjects/front/components/SubjectForm.tsx`) with an optional recurring-time-block editor; Learning Time's quick-start list (`features/learning-time/front/pages/LearningTimePage.tsx`, already lists courses with duration) reads the recurring schedule to show "next scheduled: Tue 10:00 AM" alongside the existing duration.
- **Course-first selector:** add a Course dropdown to `LearningTimePage`/`NowCard` that, when set, narrows the Learner dropdown to only learners enrolled in that course (`subjectEnrollsLearner`, already used elsewhere per `features/subjects/lib/enrollment`) and pre-fills `subjectId` on session start.

### Testing plan (failing first)
1. Repository test: saving a course with a recurring schedule persists and round-trips the day/time blocks.
2. Integration test: `LearningTimePage` shows "next scheduled" text derived from a course's recurring schedule.
3. Integration test: `NowCard`/`LearningTimePage` — selecting a Course narrows the Learner dropdown to only enrolled learners and pre-fills the subject on session start (per the existing review recommendation).

### Build phases
1. Course-first selector (small, independently shippable, matches the pre-existing recommendation — ship first).
2. Recurring-schedule data model + migration.
3. Course form UI for recurring schedule.
4. Learning Time "next scheduled" display.

### Out of scope
Auto-generating lesson instances from the recurring schedule (that would touch lesson-generation in `features/resources/server/service.ts` and is a larger cross-feature change — flag as a possible future follow-up, not built here). Calendar/reminder integration (tracked separately in `docs/bug_enhancement/20260707-feedback-bigger-features-plan.md`).

### Manual QA
1. Learning Time page: select a Course first — confirm the Learner dropdown narrows to only that course's enrolled learners, and starting a session pre-fills the subject.
2. Add a recurring schedule to a course (e.g. Tue/Thu 10:00–11:00) in Settings → Courses. Confirm Learning Time's quick-start list shows the next scheduled occurrence for that course.

### Branch and commit plan
`feature/learning-time-course-first-selector` (ship first, independent), then `feature/subjects-recurring-schedule` (larger, migration-bearing).

---

## Wave 4 — Time display: custom 12-hour picker

**Planning mode:** 1 (tiny UI) — narrow, well-understood gap.

### Feedback
`a9c34993` — "perhaps have the times be in 12 hours using AM and PM, not just 24 hours."

### Code-path audit
- **Already 12-hour where it's read-only:** `features/schedule/front/components/ScheduleTimeline.tsx:39-43,86` — `formatTime12()` already converts and displays `HH:MM` as `h:MM AM/PM`. Confirmed this display surface already satisfies the request.
- **Still native/locale-dependent where it's editable:** `features/plan/front/components/LessonTaskForm.tsx:423-441` — `scheduledStartTime`/`scheduledEndTime` use native `<input type="time">`. Browsers render the native time-picker widget according to OS/browser locale, which can show 24-hour format regardless of app-level styling — this is the one place the tester's ask isn't fully satisfied, and it can't be forced to 12-hour via CSS on a native control.

### UI plan
Replace the native `<input type="time">` in `LessonTaskForm` with a small custom 12-hour control (hour 1–12 select, minute select, AM/PM toggle) that still stores/round-trips the same `HH:MM` 24-hour string the rest of the system (`buildDailySchedule`, `formatTime12`) already expects — no contract change beyond the input widget itself.

### Testing plan (failing first)
Integration test: `LessonTaskForm` — set hour "9", minute "30", period "PM" → assert the underlying stored value is `21:30`; opening an existing lesson with `scheduledStartTime: '21:30'` pre-fills the control as 9:30 PM.

### Acceptance criteria
Editing a lesson's start/end time in the Planner form uses a 12-hour AM/PM control everywhere the tester interacts with time (matches what `ScheduleTimeline` already displays read-only).

### Build phases
1. Build the custom 12-hour input component.
2. Swap it into `LessonTaskForm`.
3. Tests, manual QA.

### Out of scope
Any change to `ScheduleTimeline` (already correct). Any global locale/i18n system for time formatting.

### Manual QA
Open a lesson, set start time using the new 12-hour control to 9:30 AM, save, reopen — confirm it still reads "9:30 AM," not "09:30" or "21:30."

### Branch and commit plan
`enhancement/lesson-form-12hr-time-picker` — one commit for the component, one for wiring + tests.

---

## Cross-wave source-of-truth summary

| Data | Owner | Notes |
|---|---|---|
| Badge definitions, awards, evidence links, progress | `features/badges/` | Progress/image are additive within the same feature. |
| Lesson scheduling (per-instance times, drag-to-move) | `features/plan/` | Both the existing per-lesson time fields and the new drag-to-move/combined-view work stay inside Planner. |
| Recurring per-class schedule | `features/subjects/` (course-level) with `features/learning-time/` and `features/plan/` as consumers — **confirm during Wave 3 implementation, don't assume** | Mirrors the existing Courses ownership decision; alternative is `features/schedule/` if the audit finds a better fit. |

## Overall out of scope (this plan)
- Any implementation of `6f7a6af3` (design-spike only, Wave 2b).
- Automatic cross-feature progress aggregation for badges (Wave 1).
- Auto-generating lesson instances from a recurring course schedule (Wave 3).

## Suggested phasing / branches (dependency + confidence order)
1. `enhancement/lesson-form-12hr-time-picker` (Wave 4 — small, independent)
2. `feature/learning-time-course-first-selector` (Wave 3, part 1 — small, independent, already-reviewed recommendation)
3. `feature/planner-dragdrop-and-combined-view` (Wave 2 — medium, reuses proven `WeekGrid` drag pattern)
4. `feature/badges-progress-and-image` (Wave 1 — medium, schema-touching)
5. `feature/subjects-recurring-schedule` (Wave 3, part 2 — larger, schema-touching, ownership-audit-gated)
6. Wave 2b — write a fresh, separate design-spike doc for `6f7a6af3` before any implementation branch exists for it.

## Commit discipline
Behavior-oriented commits per wave; never `--no-verify`. Build + `npm test` + integration (`npx jest --testPathIgnorePatterns="/node_modules/"`) green before each PR, consistent with the 07-16 plan's discipline.

## Risks and rollback
- **Wave 3's recurring schedule** is the highest-risk build item (schema migration + ownership decision not yet finalized) — treat the ownership question as a go/no-go gate before writing the migration.
- **Rollback:** every migration-bearing wave (1, 3) should ship its migration and repository layer in a commit separable from UI wiring, so a bad UI change can be reverted without touching the schema; UI-only waves (2, 4) roll back with a simple revert.

### Critical Files for Implementation
- `features/plan/front/components/LessonTaskForm.tsx`
- `features/plan/front/components/WeeklyPlanner.tsx`
- `features/plan/front/components/WeekGrid.tsx`
- `features/badges/front/pages/BadgesPage.tsx`
- `features/badges/server/repository.ts`
- `features/learning-time/front/components/NowCard.tsx`
- `features/subjects/server/repository.ts`
- `docs/20260716-feedback-batch-g1-g7-plan.md`
