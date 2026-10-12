# Shared lessons batch — edit in place, delete for one or all, one card per shared lesson

**Date:** 2026-10-12 · **Branch:** `fix/shared-lessons-batch` (stacked on PR #48's branch) · **Status:** D1–D6 approved 2026-10-12

## Results on dev (v2.120.0, 2026-10-12)

PRs #48 and #49 merged to `dev`. Browser UAT `e2e/uat/uat-shared-lessons.spec.ts`: **24/24**. Regression: `uat-4-course-times` + `uat-5.2` **11/11** (4.5 updated: the Calendar now opens the window in place), `scripts/uat-dev.js` **39/39**. Jest incl. integration 2610/2610; build passes. First run: 4 spec mistakes (header learner pre-selected on Lessons/Calendar), fixed in the spec, not the app. One run was cut short by a local DNS outage; its leftover ZZ data was removed.

## Phase 0 findings (browser, dev.sheathacademy.com, 2026-10-12)

Throwaway probe learner + course (Mon–Sun 9:00–9:45), checked **the screen**, not just the API:

- **UAT 3.8 reproduced — real bug.** Dashboard → pencil → set 1:00–1:30 PM → Save: window closes, the API has 13:00, but Today's Schedule still shows **9:00 AM** until a reload. Root cause: `ScheduleTimeline` copies its `schedule` prop into state once (`useState(initialSchedule)`, `ScheduleTimeline.tsx:134`) and never takes a new one, so the Dashboard's refetch never reaches the screen. Same component renders the Calendar day view. The existing UAT specs missed it because they asserted via the API only.
- **`?editId=` reopen reproduced.** After Save on `/lessons?editId=…`, the editor is open again and the URL still carries `editId`.

## Summary

Parents with several children plan many lessons once for several learners ("shared lessons": one `lesson_tasks` row per learner, linked by `group_id`). PR #48 fixed the first two problems a parent hits (renaming a shared lesson only renamed one copy; date edits on a shared lesson moved everyone; Child/Course in the editor did nothing). This batch covers the next ones, found by walking the parent's day rather than the feature list:

1. **"Fix this from the Calendar and get back to my day."** Every edit pencil outside the Dashboard sends the parent to `/lessons?editId=`, and after **Save** the list reloads and the same editor opens again — it looks like the save failed, and there is no way back.
2. **"We're not doing this shared lesson."** Delete removes one learner's copy; a 5-learner lesson takes 5 deletes. There is no Delete inside either editor.
3. **"Show me what I planned this week."** With several learners in view, a shared lesson appears once per learner (5 near-identical cards).
4. **"Why is Math at 8:30 today?"** A course with no time on a given weekday silently falls back to the 8:30 start (most likely cause of the UAT 2.5/3.7 notes — see *Evidence*).

## Planning mode

**Mode 3 — cross-feature.** Plan/Lesson Tasks owns the data, but the edit entry points live in Schedule (Calendar), Plan (Planner, Lessons page) and Dashboard. Full audit, integration tests per surface, one Playwright UAT spec against dev.

## Evidence (what was observed, not assumed)

- **Edit reopen (#1):** `LessonsPage` sets `isLoading` on every refetch, which unmounts the list; `LessonTaskList` passes `defaultEditing={lesson.id === editingLessonId}`; `LessonCard`'s effect calls `startEdit()` when `defaultEditing` — so after a save the deep-linked card remounts in edit mode. `editId` is never cleared from the URL. *Traced in code; not yet reproduced in a browser.* The UAT 3.8 note ("you need to reload the page") came from the **Dashboard** window path, which does refetch (`onLessonSaved={fetchDayLessons}`), so 3.8 is **unexplained** — Phase 0 reproduces it before anything is changed.
- **Delete (#2):** `DELETE /api/plan/lessons/:id?deleteGroup=true` exists and is covered by a DB test; `plannerApi.deleteLesson(id)` never sends it; `LessonCard` delete uses `InlineConfirm` with no group choice.
- **Duplicates (#3):** `LessonTaskList` maps one `LessonCard` per row; the only group signal is a "Group lesson" badge.
- **8:30 (#4):** replayed UAT 2.2 → 2.5 → 2.6 → 3.2 → 3.7 on dev through the same APIs the browser uses, with a throwaway course: placement was correct at every step (10:15, 9:00, 13:00, 9:00). The tester did 2.1–2.4 at 03:34 UTC Oct 10 (**Friday 11:34 PM ET**, "tick today's weekday" = Friday) and 2.5 on **Saturday**; dev still has Idris's *Quran* course with exactly *Friday 10:15–11:00*. A Friday-only course time correctly does not apply on Saturday. 2.6 passing at 9:00 is not fully explained, so this is "most likely", not proven. The product gap is real either way: nothing tells the parent why a lesson sits at 8:30.

## Current code-path audit

| Surface | Component | Data | API | Server | Tests today | Missing |
|---|---|---|---|---|---|---|
| Calendar day view pencil | `schedule/ScheduleTimeline` (default `router.push('/lessons?editId=')`) | `SchedulePage` → `plannerApi.getLessons(range)` | `GET /api/plan/lessons` | `listLessonTaskRows` | `ScheduleTimeline.test`, `SchedulePage.test` | pencil opens window; save refreshes the day; no navigation |
| Planner week grid / weekly planner / weekly list | `plan/WeekGrid:282`, `WeeklyPlanner:283`, `WeeklyList:138` (all `router.push`) | `PlannerContext` → `getLessons(week)` | same | same | `WeekGrid.test`, `WeeklyPlanner.test`, `WeeklyList.test` | same as above |
| Dashboard Today / Do Today pencil | `dashboard/TodaySchedulePanel`, `DoToday` → `dashboard/EditLessonModal` (wraps `plan/LessonTaskForm`) | `Dashboard.fetchDayLessons` | `GET/PUT /api/plan/lessons/:id` | `getLessonTaskRow`, `updateLessonTaskRow` | `EditLessonModal` tests via Dashboard integration | group options, delete, learner/course change in the window |
| Lessons page inline editor | `plan/LessonCard` (+ `?editId=` deep link) | `LessonsPage` | `PUT/DELETE /api/plan/lessons/:id` | as above | `LessonCard.test`, `LessonsPage.test`, `LessonTime.editPaths.test` | no reopen after save; delete for one/all; delete inside editor |
| Lessons page list | `plan/LessonTaskList` → `LessonCard` per row | `LessonsPage` | `GET /api/plan/lessons` | `listLessonTaskRows` | `LessonTaskList.test` | one card per shared lesson |
| Schedule placement | `schedule/server/service.buildDailySchedule` | `courseTimesFromSubjects(allSubjects)` | — | — | service unit tests | reason shown when a course has no time that weekday |

## Source-of-truth decisions

- **Plan / Lesson Tasks** owns lessons, groups, and the lesson editor. `EditLessonModal` currently lives in `features/dashboard` but edits a Plan lesson → **move it to `features/plan/front/components/EditLessonModal.tsx`** (D1) and have Dashboard, Calendar and Planner import it from Plan. Dashboard and Schedule compose; they own no lesson logic.
- **Subjects** owns course times; the "why 8:30" hint reads `courseTimes` the same way `buildDailySchedule` does (shared helper in `schedule/lib/courseTimes.ts`, no new data).
- No schema change, no migration. No seed data.

## Decisions to approve

| # | Decision | Recommendation |
|---|---|---|
| D1 | One editor everywhere | Move `EditLessonModal` to Plan; Calendar, Planner and Dashboard open it in place. `/lessons?editId=` keeps working for old links but clears `editId` on save/cancel. |
| D2 | Window gets the PR #48 group options | Same two boxes as `LessonCard` ("Apply title and details to all learners" ✔ by default; "Also move the date and time for every learner" ☐) via one shared `GroupEditOptions` component. |
| D3 | Learner/course change in the window | Yes — the window becomes the main editor, so it needs the fix PR #48 gave the inline editor. |
| D4 | Delete a shared lesson | Styled confirm offers **"Just Hawa"** and **"All 5 learners"** (destructive styling on both, Cancel neutral). Delete also available inside both editors. Success via `InlineSuccess` ("Fractions deleted for 5 learners"). |
| D5 | One card per shared lesson | When 2+ copies of a group are in view, render one `SharedLessonCard`: title, course, date (or range if copies differ), a chip per learner with that learner's status; expand to see/act on each copy. Single-learner view keeps today's `LessonCard`. |
| D6 | Adding/removing a learner to an existing shared lesson | **Out of scope this batch** (needs a new create-into-group API). "Remove" is covered by D4 "Just Hawa". |

## Acceptance criteria (observable)

1. On the Calendar (day view) and in the Planner, clicking a lesson's pencil opens the **Edit lesson** window on the same page; the URL does not change to `/lessons`.
2. Saving in that window closes it and the lesson shows its new title/time **without a page reload**; the parent is still on the Calendar/Planner day they were looking at.
3. Opening an old `/lessons?editId=…` link opens that lesson's editor once; after **Save** or **Cancel** the editor stays closed and the URL is `/lessons`.
4. In the window, for a lesson shared by 5 learners: renaming it renames all 5; moving its date moves only this learner unless "Also move the date and time for every learner" is ticked.
5. In the window, changing **Child** to Khadijah and **Course** to one of hers moves the lesson to Khadijah; choosing a course she isn't enrolled in is not offered; if the server refuses, its reason is shown and the window stays open.
6. Deleting a shared lesson asks "Just Hawa" / "All 5 learners" / Cancel. "Just Hawa" leaves the other 4; "All 5 learners" removes all 5; Cancel removes nothing. A one-line notice confirms what was deleted.
7. Both editors (window and Lessons page) have a **Delete** action with the same confirmation.
8. On the Lessons page with All children (or 2+ learners) selected, a lesson shared by 5 learners appears **once**, with 5 learner chips showing each learner's status; with one learner selected it appears once as that learner's card.
9. Marking one learner done from the shared card marks only that learner's copy done.
10. When a lesson has no time of its own and its course has no time on that weekday, the editor says "Math has no set time on Saturdays — this lesson follows the day's order (starts 8:30)." When the course does have a time that day, it says "Uses Math's time: 10:15 AM".

## Data / contract changes

- `plannerApi.deleteLesson(id, { deleteGroup?: boolean })` → `DELETE …?deleteGroup=true` (route already supports it).
- `GroupEditOptions` props: `{ childName, applyToGroup, applyScheduleToGroup, onChange }` — UI only.
- `groupSharedLessons(lessons): (LessonTask | SharedLessonGroup)[]` pure helper in `features/plan/utils/` — `SharedLessonGroup = { groupId, copies: LessonTask[] }`, order-preserving, groups only when 2+ copies are present.
- `courseTimeFor(subjectId, date, courseTimes)` pure helper in `schedule/lib/courseTimes.ts`, reused by `buildDailySchedule` (refactor, behaviour-preserving) and the editor hint.

## Testing plan (failing tests first, per phase)

**Integration tests per component** (contexts consumed · interactions · states):

- `EditLessonModal` (moved) — consumes `useHousehold`; interactions: save, cancel, group boxes, child/course change, delete (cancel/just this/all); states: loading, not found, load error, save error (server message), populated. File: `features/plan/__tests__/integration/EditLessonModal.test.tsx`.
- `ScheduleTimeline` / `SchedulePage` — pencil opens window (no `router.push`), save triggers refetch; states unchanged.
- `WeekGrid`, `WeeklyPlanner`, `WeeklyList` — click opens window; save refreshes `PlannerContext`.
- `LessonsPage` — `?editId=` editor does not reopen after save; URL replaced with `/lessons` on save/cancel; shared lesson renders once with chips (All children), once per learner view; empty/error unchanged.
- `SharedLessonCard` — collapsed summary, expand, per-learner mark done, edit, delete (one/all) — loading/error per action.
- `LessonCard` — Delete inside editor; group delete choices.

**Unit:** `groupSharedLessons` (order, 2+ rule, filtered views), `courseTimeFor` (own time wins, weekday match, no-block case), `plannerApi.deleteLesson` query param.

**API:** none new — `DELETE ?deleteGroup` already covered by the DB repository test; add a handler test that `deleteGroup=true` is passed through.

**Playwright UAT (dev):** `e2e/uat/uat-shared-lessons.spec.ts` with a throwaway 2-learner probe group: rename through the real window → both copies renamed (API check); move date → only one moved; delete "just this" → one left; delete "all" → none left. This is also the dev check promised in PR #48.

## Build phases

0. **Reproduce first (no code):** browser run on dev of UAT 3.8 (Dashboard window save → does Today's Schedule update without reload?) and of the `?editId=` reopen. Record findings in this file; adjust Phase 2 if 3.8 has a different cause.
1. **Delete for one or all (#2).** API client flag, `InlineConfirm` choices, Delete inside `LessonCard` editor, `InlineSuccess`. Smallest, independent.
2. **One editor everywhere (#1).** Move `EditLessonModal` to Plan; extract `GroupEditOptions`; window gains group options, learner/course change, delete; Calendar + Planner open it in place; `/lessons?editId=` clears on save/cancel.
3. **One card per shared lesson (#3).** `groupSharedLessons` + `SharedLessonCard` on the Lessons page.
4. **Why this time (#4).** `courseTimeFor` refactor + editor hint.
5. **Playwright UAT spec + outcome-based UAT checklist** (below), run against dev after deploy.

## UAT checklist (outcomes, not presence) — to publish as an artifact after deploy

Setup: owner login on dev; pick a lesson shared by 3+ learners (or create one for 3 learners today).

1. Calendar → today → pencil on the shared lesson. **Outcome:** an Edit lesson window opens over the Calendar; the address bar still shows the Calendar.
2. Rename it and Save. **Outcome:** the window closes and the new title shows on the Calendar immediately; switch the learner filter to each of the other learners — each shows the new title.
3. Open it again, change only the date to tomorrow, Save. **Outcome:** this learner's lesson is on tomorrow; the other learners' copies are still today.
4. Open another learner's copy, tick "Also move the date and time for every learner", set 1:00 PM, Save. **Outcome:** every learner's copy shows 1:00 PM.
5. Open a copy, change Child to a learner who isn't in the group and pick one of their courses, Save. **Outcome:** the lesson appears under that learner and is no longer listed under the original learner.
6. Lessons page, All children. **Outcome:** the shared lesson appears once, with one chip per learner and each learner's status.
7. Mark one learner done from the shared card. **Outcome:** only that learner's chip shows Done; the Dashboard for another learner still shows it not started.
8. Delete → "Just <learner>". **Outcome:** that learner's chip is gone; the others remain.
9. Delete → "All N learners". **Outcome:** the lesson is gone for every learner; a notice says how many were deleted.
10. Open a lesson whose course has a time on another weekday but not today. **Outcome:** the editor explains it follows the day's order and why.
11. Open an old `/lessons?editId=` link, Save. **Outcome:** the editor closes and stays closed; the address bar shows `/lessons`.

## Data-flow trace & fixture IDs

- `group_id` is generated only in `createLessonTasksFanOut` (`group_<ts>_<rand>`); copies share it; moving a copy to another learner nulls it (PR #48). Delete-all keys on `group_id` within `household_id`.
- Lesson ids: `lesson_<ts>[_<n>]`, generated server-side; the window loads by id via `GET /api/plan/lessons/:id` — same id the Calendar/Planner hold.
- `childId` on lessons = `StudentProfile.id`; `householdId` on students = `HouseholdProfile.id` (fixtures: `hh_001`), not `Workspace.id`.
- Reachability: no new pages; the window is opened from existing pencils.

## Out of scope

Adding a learner to an existing shared lesson (D6); bulk select/delete; recurring lesson generation; Dashboard redesign; changing how untimed lessons stack after fixed ones (logged known behaviour).

## Manual QA

Run the UAT checklist above on dev at 375px and desktop width; keyboard-only pass on the window (Tab order, Esc closes, focus returns to the pencil); screen-reader labels on the delete choices and learner chips.

## Branch & commits

`fix/shared-lessons-batch` from `dev` after #48. One behaviour-oriented commit per phase, e.g. `feat(lessons): delete a shared lesson for one learner or all`, `fix(lessons): edit lessons in place from Calendar and Planner`, `feat(lessons): show a shared lesson once with per-learner status`, `feat(schedule): explain why an untimed lesson starts when it does`, `test(uat): shared-lesson outcomes against dev`.

## Risks & rollback

- **Moving `EditLessonModal`** touches Dashboard imports — covered by Dashboard integration tests; revert is a file move.
- **Grouped card hides per-learner differences** (different dates/statuses) — chips show each learner's status and the card shows a date range when copies differ; expanding shows every copy.
- **Delete all** is destructive and irreversible — two-step styled confirm naming the learner count; Cancel default focus.
- Each phase is its own commit; any phase can be reverted alone (Phase 2 depends on Phase 1's API client only).
