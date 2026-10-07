# Blockers plan — Quick Start fix, break-aware lesson shift, recurring course times

**Date:** 2026-10-07 · **Branch:** `fix/blockers-20261007` (from `dev`) · **JSON:** `20261007-blockers-quickstart-shift-recurring-plan.json`

## Summary

Three user-blocking gaps from prod feedback, in dependency order:

1. **Quick Start fails** (`5dd1dafd`, Oct 6). The Dashboard's "Quick start by course" always tries to create a new session, but the server refuses while the learner has *any* non-finalized session. Prod has 4 stuck sessions (2 in the reporter's household). The UI hides the real reason.
2. **No way to move the schedule around breaks, sick days, or a lost week** (`03a84383` *bad*, `ef9163fd` *poor*, `b8be399a` *poor*, filed 3× Aug 18→31). Lessons can only be dragged one at a time. Break dates have a data field but **no UI to enter them** and **nothing reads them** when placing lessons.
3. **Course times don't reach the schedule** (`5116ae4f` Blocker, `4ee15e76`). `SubjectCourse.recurringSchedule` (Math Mon–Fri 10:15–11:00) is saved, but the daily schedule ignores it and stacks lessons from 08:30.

**No schema changes or migrations in any phase.** `school_years.breaks` (jsonb) and `subjects.recurring_schedule` (jsonb) already exist.

## Planning mode

**Mode 3 — cross-feature.** Touches learning-time + dashboard (1), plan + school-year + settings (2), schedule + dashboard + subjects (3). Phase 2a is a **gated design-decision phase**.

---

## Code-path audit

### 1. Quick Start
| Layer | Finding |
|---|---|
| UI | `learning-time/front/components/QuickStartByCourseList.tsx` — `handleStart` does `createSession` → `transition('start')`; any error → generic "Failed to start session" (line 124). |
| Hosts | `dashboard/front/components/TodaySchedulePanel.tsx:58` renders it **unconditionally** when a learner is selected. `NowCard.tsx:488` renders it only when there's no active session (`getActive`, line 124) — so `/learning-time` is safe, the **Dashboard is not**. |
| API | `POST /api/learning-time/sessions` → `api/routes/learning-time.ts` returns 400 with the thrown message. `GET /sessions/active` exists. |
| Server | `server/repository.ts:63` `createSessionRow` throws "Learner already has an active learning time session" if any row has `status <> 'finalized'` (draft/running/paused/ended). |
| Prod data (read-only, 2026-10-07) | `household_1781012946471`: `learner_1781013323296` **paused** since Aug 16; `learner_1781013295929` **ended, never finalized** since Jul 27. `household_1784473901966`: 2 paused (Jul 23, Aug 4). |
| Tests | `learning-time/__tests__/integration/QuickStartByCourseList.test.tsx`, `NowCard.test.tsx`; dashboard `TodaySchedulePanel` coverage — **none for "active session exists"**. |

**Root cause:** the Dashboard host doesn't check for an active session; the component swallows the server message.

### 2. Lesson shift + breaks
| Layer | Finding |
|---|---|
| Lesson dates | `lesson_tasks.due_date` places a lesson on a day; `planned_start_date` (optional) = "available from". `listLessonTaskRows` filters `due_date >= start` and `coalesce(planned_start_date, due_date) <= end`. Status union is `'not_started' \| 'completed' \| 'skipped'` (`plan/types.ts:1`); "overdue" is derived. |
| Moving lessons today | Single-lesson `PUT /api/plan/lessons/:id` → `updateLessonTaskRow` (`plan/server/repository.ts:237`); Weekly Planner drag via `useLessonReschedule`. **No bulk/date-range update anywhere.** |
| School days | **Two sources.** Household settings `schoolDays` (`'Monday'…`, `features/lib/types.ts:116`, stored in `household_settings`, read by planner via `useHousehold().householdProfile.schoolDays`, `plan/utils/schoolDays.ts` `isOffDay`/`DEFAULT_SCHOOL_DAYS`). School year `schoolDays` (`'mon'…`, `school-year/types.ts:1`) — used only by `calculatePlannedDaysLocal` for day counts. |
| Breaks | `SchoolYear.breaks: SchoolBreak[]` (`{id,name,startDate,endDate}`), persisted by `PUT /api/school-years/:id` (`school-year/api/routes/school-year.ts:73`). **No UI sets it** — `SchoolYearForm` is create-only with no break field; `SchoolYearCard` reads breaks but **is not mounted anywhere**. The schedule feature's "breaks" are unrelated synthetic lunch/prayer rows. |
| Settings UI | `settings/front/pages/SettingsPage.tsx:277` school-year tab: active-year summary, `SchoolYearForm`, `RolloverCoursesPanel`. |
| Planner UI | `plan/front/components/WeeklyPlannerPage.tsx` — `WeekNavigator` header (has Add-lesson toggle), `ChildSubjectFilter`, `PlannerViewToggle`, then Weekly / Matrix / mobile list. |
| Auth | `auth/server/learnerPolicy.ts` is deny-by-default: any new mutating route is **owner-only automatically**. |
| Tests | `plan/__tests__/api/lessons-handler.test.ts`, `lesson-handler.test.ts`, `repository.test.ts`; `school-year/__tests__/api/*`; `auth/__tests__/learnerPolicy.test.ts`. **Nothing for multi-lesson date moves or break editing.** |

### 3. Recurring times → schedule
| Layer | Finding |
|---|---|
| Builder | `schedule/server/service.ts:76` `buildDailySchedule(lessons, settings)` — lessons with `scheduledStartTime`+`scheduledEndTime` are **locked** at that time; all others stack from `startTime` (08:30). It stamps `date: new Date()` and callers override it. |
| Callers (4) | `dashboard/front/pages/Dashboard.tsx:68` (client, has `selectedDate`), `schedule/front/pages/SchedulePage.tsx:94` (client, `selectedDate`), `schedule/api/routes/schedule.ts:51` (server, today), `dashboard/server/taskMetrics.ts:30` (server, today). |
| Data | `SubjectCourse.recurringSchedule?: { daysOfWeek: DayOfWeek[] ('Monday'…), startTime, endTime }[]`. Consumed only by `QuickStartByCourseList` ("Next scheduled"). |
| Tests | `schedule/__tests__` for `buildDailySchedule`; dashboard integration. Nothing uses course times. |

---

## Source-of-truth decisions

- **Session lifecycle:** `learning-time` owns it. The Dashboard keeps composing `QuickStartByCourseList`; the active-session check lives **inside the learning-time component**, not in the dashboard.
- **Lesson dates:** `plan` owns them. The shift engine is a `plan` server service. It reads the calendar through `school-year` service (`getActiveSchoolYear`) and `settings` repository (`getHouseholdSetting(householdId,'schoolDays')`), never their tables directly.
- **School calendar for shifting:** household-settings `schoolDays` (what the planner, drag-move and lesson generation already use) **+ active school year `breaks`**. School-year `schoolDays` is a second, diverging source. **Leave it for now** (it only feeds day counts) and log the follow-up "unify school-day source" below. Do not fix it in this plan.
- **Course times:** `subjects` owns `recurringSchedule`. `schedule` reads it at build time (no writes to lessons). The explicit per-lesson time still wins.

---

## Phase 2a design decisions — APPROVED 2026-10-07 (all D1–D7 as recommended)

Recommended answers. Phase 2b builds exactly these unless amended.

| # | Decision | Recommendation |
|---|---|---|
| D1 | Shift unit | **School days.** Skip non-school weekdays and break dates. "1 week" = the household's school-days-per-week count (5 by default). |
| D2 | Algorithm | **Ordinal remap**, one pure function. Let `S_before`/`S_after` be the ordered school-day sequences before/after the calendar change. For each date `d`: `new = S_after[ordinal(S_before, d) + N]`. Plain shift: same calendar, `N ≥ 1`. New break: `S_after` includes the break, `N = 0`. Every lesson keeps its *order and per-day grouping*, so a day's 4 lessons stay together. A date on a non-school day snaps to the next school day's ordinal. Applied independently to `dueDate` and `plannedStartDate`. |
| D3 | What moves | `status = 'not_started'` only, with `dueDate >= fromDate`. Completed/skipped lessons never move. Optional filters: learners (default **all**), courses (default **all**). Overdue lessons before `fromDate` are untouched. |
| D4 | Entry points | (a) **Lesson Planner → "Shift lessons"** panel: from-date (default today), shift by N school days with quick buttons *1 day* / *1 week*, learner + course filters. (b) **Settings → School year → Breaks**: after saving a break that covers scheduled lessons, show inline "*N lessons fall in Thanksgiving break. Move them after the break?*" → same engine, break mode. |
| D5 | Safety | **Preview → confirm → Undo.** Preview returns every move (`id, from{due,planned}, to{due,planned}`) plus counts per learner. Apply re-validates and runs **one transaction**. Undo posts the inverse moves. Rows changed since the preview are skipped and reported, so nothing is silently clobbered. No new table. |
| D6 | Past year end | Allowed. Preview warns: "*12 lessons will land after the school year ends (Jun 5)*". |
| D7 | Negative shift (pull earlier) | **Out of scope** for this plan. |

---

## Acceptance criteria

**Phase 1 — Quick Start**
1. On the Dashboard, with a learner selected who has a **paused** session for Math, the Quick Start area shows "*Math session is paused*" with **Resume** and **Open Learning Time** instead of the course Start buttons.
2. Clicking Resume resumes it (status → running) and shows the existing "Session started — open Learning Time" line.
3. With an **ended (unfinished)** session, it shows "*Math session needs to be finished*" and a link to `/learning-time`, where the existing outcome → Save flow finalizes it. Afterwards, Quick Start shows the course list again.
4. If create still fails, the error text is the **server's message**, not the generic one.
5. With no active session, behavior is unchanged.

**Phase 2b — engine + API**
6. With school days Mon–Fri and a break Nov 25–27, shifting 1 school day from Fri Nov 21 moves Fri → Mon Nov 24, and Mon Nov 24 → Fri Nov 28 (skips the break and the weekend).
7. Completed/skipped lessons and lessons before `fromDate` keep their dates.
8. Two learners' copies of a grouped lesson (same `groupId`) land on the same new date.
9. A learner account gets 403 from both shift endpoints.

**Phase 2c — break editing**
10. Settings → School year shows a **Breaks** list for the active year. Each break is an inline-editable record card (name, start, end) with pencil and trash icons. Trash uses `InlineConfirm`, and an `InlineSuccess` notice ("*Thanksgiving break removed*") follows.
11. A break whose end is before its start, or that falls outside the school year, shows an inline error and is not saved.
12. Saving a break that covers *N > 0* not-started lessons shows "*N lessons fall in <name>. Move them after the break?*" with **Preview** and **Not now**. Preview shows the counts, Confirm moves them, and the Planner shows none of those lessons on break dates.

**Phase 2d — planner shift UI**
13. Lesson Planner header has **Shift lessons**. The panel defaults to from = today, N = 1, all learners, all courses.
14. **Preview** shows "*38 lessons for 3 learners move 5 school days later (Oct 13 → Oct 20 …)*" plus the year-end warning if applicable. Nothing changes until **Confirm**.
15. After Confirm, the week view refreshes and `InlineSuccess` says "*38 lessons moved*" with **Undo**. Undo restores every original date.

**Phase 3 — course times**
16. Math has a recurring block Mon–Fri 10:15–11:00. On a Tuesday, a Math lesson **with no explicit time** shows 10:15–11:00 on the Dashboard Today panel and on `/plan/schedule`.
17. A Math lesson **with** an explicit time keeps its own time.
18. A course with no block for that weekday, or no block at all, still stacks from 08:30 as today.
19. Changing Math's block in Settings → Courses to 9:00–9:45 changes every future untimed Math lesson on the schedule. No lesson rows are written.

---

## Data / contract changes

- **None in the DB.**
- `plan/types.ts`: `ShiftLessonsRequest { fromDate: string; schoolDays: number; learnerIds?: string[]; subjectIds?: string[]; mode: 'shift' | 'break'; breakId?: string }`, `LessonDateMove { id; learnerId; subjectId; from: {dueDate; plannedStartDate}; to: {…} }`, `ShiftPreview { moves; countsByLearner; pastYearEndCount; schoolYearEnd }`.
- `plan/utils/schoolCalendar.ts` (new, pure): `buildSchoolDaySequence(start, end, schoolDays, breaks)`, `remapDate(date, before, after, offset)`.
- `schedule/types.ts` `ScheduleSettings`: add optional `date?: string` and `courseTimes?: Record<subjectId, RecurringScheduleBlock[]>`. Optional fields, so all 4 callers keep compiling unchanged.

## API / service plan

| Route | Handler | Notes |
|---|---|---|
| `POST /api/plan/lessons/shift/preview` | `plan/api/routes/lesson-shift.ts` → `plan/server/shiftService.ts#previewShift` | Read-only. Loads household `schoolDays` + active year `breaks`, lists candidate rows, returns `ShiftPreview`. 400 on bad date or N < 0. 400 for `mode:'break'` with an unknown `breakId`. |
| `POST /api/plan/lessons/shift/apply` | `#applyMoves(moves)` | Body = preview moves. In one transaction: update each row **only if** its current `due_date`/`planned_start_date` equal `from` and status is still `not_started`. Returns `{ applied, skipped[] }`. Undo calls the same route with `from`/`to` swapped. |

- Register both in `plan/api/router.ts` **before** the `lessons/:id` matchers (slug length 3, `slug[1]==='shift'`).
- New repository fn `updateLessonDatesIfUnchanged(householdId, moves)` in `plan/server/repository.ts`, using a transaction.
- Learner policy: no change needed (deny-by-default). A test proves the 403.

## UI plan

- **P1** `QuickStartByCourseList`: on mount, `learningTimeApi.getActive(learnerId)`. If running/paused, render the active-session row (Resume via `transition('resume')`, or "Open Learning Time"). If ended or draft, render the "needs to be finished" row with a link. Error text = `err.message`. NowCard is unaffected (it only mounts the list when idle).
- **P2c** `school-year/front/components/SchoolBreaksPanel.tsx`, mounted in `SettingsPage` school-year tab under the active-year summary. Breaks are record cards following the **editable record card** pattern (§1): inline edit expansion, pencil/trash icons with `aria-label`s, `InlineConfirm` for delete, `InlineSuccess` after. "Add break" is a **collapsible add-form** (§5) inside the panel. Saves via existing `PUT /api/school-years/:id` with the full `breaks` array. The post-save prompt calls preview/apply.
- **P2d** `plan/front/components/ShiftLessonsPanel.tsx`: a toggle in `WeekNavigator` next to Add lesson, using the same collapsible pattern (`add-form-card`, toggle label "Shift lessons"/"Cancel", **default closed** — deliberate deviation, since this is a rare, consequential action rather than a primary add-form). Steps: form → preview summary → Confirm → `InlineSuccess` + Undo. Refresh via `refreshLessons`. Works in all three planner views (it changes data, not a view). Mobile: fields stack.
- **P3** No new UI. The schedule reads course times.
- Empty states: P2c "No breaks yet". P2d preview with 0 moves shows "*No not-started lessons on or after <date> match these filters*" and Confirm is disabled.

---

## Testing plan (failing tests first, per phase)

**P1**
- `learning-time/__tests__/integration/QuickStartByCourseList.test.tsx`: active paused → resume row; Resume calls `transition('resume')` and `onStarted`; ended → finish link; create rejects with "Learner already has…" → that text shown; no active → course list (unchanged).
- `dashboard/__tests__/integration/components/TodaySchedulePanel.test.tsx` (extend): panel with an active session shows the resume row, not Start buttons.

**P2b**
- `plan/__tests__/unit/schoolCalendar.test.ts`: sequence skips non-school days and breaks; `remapDate` cases from AC 6; weekend date snaps forward; break mode (N=0, new break) pushes in-break and post-break dates by the break's school-day length; past-year-end extends the sequence beyond `endDate`.
- `plan/__tests__/api/lesson-shift.test.ts` (mock at repository + school-year/settings service boundary): preview filters (status, fromDate, learners, courses); grouped rows stay aligned; 400s; apply skips rows changed since preview.
- `plan/__tests__/api/repository.test.ts`: `updateLessonDatesIfUnchanged` updates matching rows only (real DB pattern per `testing-patterns`).
- `auth/__tests__/learnerPolicy.test.ts`: learner POST to both shift routes → 403.

**P2c**
- `school-year/__tests__/integration/SchoolBreaksPanel.test.tsx`: loading, empty, error, populated; add / inline edit / cancel restores / validation errors (AC 11); delete confirm-cancel and confirm paths + `InlineSuccess`; post-save prompt appears only when preview count > 0; Not now dismisses; Confirm calls apply.
- `settings/__tests__/integration/SettingsPage.test.tsx`: school-year tab mounts the panel when an active year exists, and not otherwise.

**P2d**
- `plan/__tests__/integration/ShiftLessonsPanel.test.tsx`: defaults; 1 day / 1 week presets; preview summary + year-end warning; 0-move empty state disables Confirm; Confirm → apply → `refreshLessons` + success; Undo posts inverse moves; API error shown; cancel leaves data untouched.
- `plan/__tests__/integration/WeeklyPlannerPage.test.tsx` + `WeekNavigator.test.tsx`: toggle opens and closes the panel.

**P3**
- `schedule/__tests__/unit/buildDailySchedule.test.ts` (new; existing coverage is in `api/schedule.test.ts`): untimed lesson takes its course block for that weekday; explicit time wins; no block for the weekday → stacks; two courses at overlapping times both render (no auto-resolve); stacking cursor continues after course-timed blocks.
- Dashboard + SchedulePage integration: a lesson shows its course time (AC 16).

---

## Build phases

| Phase | Gated | Depends | Delivers |
|---|---|---|---|
| **1 — Quick Start fix** | no | — | AC 1–5. Ships standalone; unblocks the reporter today. |
| **2a — Design sign-off** | **yes** | — | User approves/amends D1–D7. No code. |
| **2b — Calendar engine + shift API** | no | 2a | AC 6–9 |
| **2c — Breaks UI + break prompt** | no | 2b | AC 10–12 |
| **2d — Planner Shift panel + Undo** | no | 2b | AC 13–15 |
| **3 — Course times on schedule** | no | — (after 2d for merge order) | AC 16–19 |
| **4 — Release + feedback close-out** | **yes** | all | PR to `dev`, UAT on dev, then promote; mark rows shipped (see below). |

## Out of scope

Negative shift / pulling lessons earlier; auto-generating lessons from `recurringSchedule` (`fe487c22` range-repeat generation — next batch); unifying the two school-day sources (follow-up); stale-session auto-cleanup job; changing paused-time accounting; lesson filters + bulk delete (`78b91193`, `a69015d2`); resource edit/delete (`7cc4bd58`, `fde7a084`); learner-edit-in-place (`6076e425`); course list grouping (`61f189cf`).

## Manual QA (dev site, owner login)

1. **P1:** Dashboard → select a learner → Quick Start → Math → go to `/learning-time` → Pause → back to Dashboard. Expect the paused row with Resume. Click Resume, then Learning Time shows it running. End it without finishing → Dashboard shows the "needs to be finished" link → follow it → Finish → Dashboard shows the course list again.
2. **P2c:** Settings → School year → Add break "Test break" spanning two school days with lessons → Save → prompt shows N → Preview → Confirm → Planner: no lessons on those days, and they appear right after. Edit the break name → Save → Cancel restores. Delete → Cancel → still there; Delete → Confirm → "removed".
3. **P2d:** Planner → Shift lessons → 1 week, all learners → Preview numbers look right → Confirm → week view shifted → Undo → back to original. Repeat with one learner + one course filter.
4. **P3:** Settings → Courses → Math → recurring Mon–Fri 10:15–11:00 → Dashboard Today: untimed Math at 10:15. Give one Math lesson an explicit 13:00 → that one stays at 13:00.
5. **Learner login:** open Planner. The Shift and break actions don't succeed (403 surfaced as error).
6. `npm run uat:dev` still passes.

## Feedback rows this closes

`5dd1dafd` (P1) · `03a84383`, `ef9163fd`, `b8be399a` (P2) · `5116ae4f`, `4ee15e76` (P3) · `b01b66f0` (*reviewed*: "enter break ranges" on /attendance — closed by P2c). Add them to `scripts/mark-feedback-shipped.js` in phase 4 with the release PR number.

## Prod data note (stuck sessions)

**No data fix is planned.** After P1 ships, the reporter can resume, end or finish each stuck session from the UI. The fix is the product behavior, not a one-off DB write. If you'd rather clear them, that's a separate, explicitly approved write.

## Branch & commits

`fix/blockers-20261007` from `dev`. Commits, one per phase:
- `fix(learning-time): resume or finish an active session instead of failing quick start`
- `feat(plan): school-day calendar remap and lesson shift preview/apply API`
- `feat(school-year): edit breaks in Settings and offer to move lessons out of them`
- `feat(plan): shift lessons panel with preview and undo`
- `feat(schedule): place untimed lessons at their course's recurring time`

## Risks & rollback

- **Bulk date writes are the riskiest change in the batch.** Mitigations: preview-before-apply, one transaction, optimistic `from`-match per row, Undo, and owner-only access. Rollback: Undo for user error; code revert removes the feature without data residue (no schema).
- **Timezone/off-by-one in date math.** Mitigation: pure functions over `YYYY-MM-DD` strings with local-date parsing (same approach as `calculateDays.ts`), and unit tests across DST (Nov 2) and month ends.
- **Two school-day sources diverge.** Mitigation: documented choice (household settings) and a follow-up.
- **P3 overlapping course times** may show two blocks at once. Acceptable and visible. Lessons are not reordered automatically.
