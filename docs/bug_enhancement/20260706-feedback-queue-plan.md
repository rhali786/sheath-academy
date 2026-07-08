# Feedback Queue — Bugs / UX / Resources plan (2026-07-06)

Branch: **`feat/feedback-queue-jul06`** (already created — **do not create new branches**).
Gating: **none** (user directive — no gated phases).
Structure: **3 tasks**, each self-contained. Every listed change is its own commit.

Source feedback rows (prod `user_feedback`, status `submitted`):
cb15ba12, 713d0753, c75d361b, 36f30694, ba88751d, 2bc4d916, adfe3188, bb573f78, 3a73264e.

Deferred to tomorrow (out of scope here): f96c36b3 (calendar/reminders + Gmail sync), b01b66f0 (break ranges + auto-reschedule).

---

## Source-of-truth map (applies across all three tasks)

| Data | Owner | Notes |
|------|-------|-------|
| Course enrollment (`subjectLearners` join) | **subjects** | `SubjectCourse.learnerIds`; `childId` = `learnerIds[0]` (primary only) |
| Course ↔ resource link (`subjectResources` join) | **subjects** | `SubjectCourse.resourceIds`; `updateSubjectRow({ resourceIds })` |
| Lesson generation / due-date distribution | **resources** | `features/resources/server/service.ts` |
| Configured school weekdays | **household** | `HouseholdProfile.schoolDays: DayOfWeek[]` (default Mon–Fri), edited in `HouseholdSettings` |
| Lessons (persisted) | **planner** | `plannerApi.createLesson` |
| Weekly records tiles | **dashboard** (presentation only) | counts come from `dashboard/api/routes/records.ts` (current Mon–Sun week) |
| Evidence | **portfolio** | consumes subjects for its Subject dropdown |

Rule respected: resources UI must not reach into the subjects repository directly — it calls the subjects API/service for any `subjectResources` write (Task 3.3/3.4).

---

# TASK 1 — Fix the 2 feedback bugs

**Planning mode:** 3 (bug 1.1 touches the shared subjects repository consumed by multiple features; bug 1.2 touches resources generation + household config).

## Bug 1.1 — Evidence subject dropdown empty on /growth  (cb15ba12)

### Code-path audit
- **UI** `features/portfolio/front/components/EvidenceForm.tsx` →
  `filteredSubjects = subjects.filter(s => s.childId === childId)` (**primary-learner only**; `SubjectOption` carries only `{id,name,childId}`).
- **Page** `features/portfolio/front/pages/PortfolioPage.tsx` → fetches `/api/subjects?childId=<filterChildId>`; maps `subjectOptions = subjects.map(s => ({id,name,childId: s.childId}))` — **drops `learnerIds`**.
- **API** `features/subjects/api/routes/subjects.ts` GET → `rowToSubject` sets `childId = r.learnerIds[0]`.
- **Repo** `features/subjects/server/repository.ts` `listSubjectRows` → filters `eq(subjects.learnerId, learnerId)` (**primary column only**; ignores the `subjectLearners` join even though `hydrateMany` already loads `learnerIds`). Also applies an active-school-year filter: `or(schoolYearId = active, schoolYearId IS NULL)`.

### Root cause
A child enrolled as a **secondary** learner is excluded at **two** layers: the SQL filter (`subjects.learnerId`) and the client filter (`s.childId === childId`). So a course assigned to the child (but whose primary learner is a sibling) never appears.

**Secondary suspect (verify, do not assume):** the active-school-year filter can also hide courses created under a different/older school year. **Verification step (read-only):** for the reporting household (`household_1781012946471`, child of `asmah.najib@gmail.com`), confirm whether the missing courses are (a) secondary-enrollment or (b) different-school-year, before finalizing the fix. If (b) also contributes, widen the fix; otherwise leave school-year filtering unchanged.

### Fix
- **Repo:** in `listSubjectRows`, filter by *enrollment* rather than the primary column — after `hydrateMany` (which already provides `learnerIds`), keep rows where `learnerIds.includes(learnerId)`. Do **not** add a second SQL predicate that would drop legacy rows. Keep the school-year predicate unchanged unless the verification step proves otherwise.
- **Client:** `EvidenceForm.filteredSubjects` → `subjects.filter(s => s.learnerIds.includes(childId))`; extend `SubjectOption` with `learnerIds: string[]`; `PortfolioPage.subjectOptions` must pass `learnerIds`. (Mirror the same in `EvidenceFilters`/`EvidenceList` option maps for consistency.)

### Regression surface
`listSubjectRows` is shared (WeekGrid, plan, gradebook). Broadening to enrollment-based matching is the correct semantic but must be regression-checked: run the subjects + plan + resources suites; confirm WeekGrid still renders each child's courses.

### Tests (write failing first)
- Repo `.db.test.ts`: `listSubjectRows(household, secondaryChildId)` returns a course where the child is a **secondary** enrollee.
- API `subjects.test.ts`: `GET /api/subjects?childId=<secondary>` includes the course.
- Integration `EvidenceForm`: with a child enrolled as secondary, the Subject `<select>` lists the course and evidence can be saved.

### Acceptance criteria
On `/growth` (portfolio), selecting any child enrolled in a course — primary **or** secondary — shows that course in the **Subject** dropdown and allows saving evidence. A child with no courses still shows the empty option only.

**Commit:** `fix(portfolio): show courses for secondary-enrolled learners in evidence subject dropdown`

---

## Bug 1.2 — Lessons scheduled on Sat/Sun despite non-school days  (713d0753)

### Code-path audit
- **UI** `features/resources/front/components/LessonGenerationPanel.tsx` → passes `schoolDays` (a **count**, default `36`), `cadence`, `startDate`; never passes the household's weekday set.
- **Service** `features/resources/server/service.ts` `computeDueDates`:
  - `schoolDay` cadence: hardcodes `dow !== 0 && dow !== 6` (Mon–Fri) — ignores `HouseholdProfile.schoolDays`.
  - `weekly` / `everyNDays`: step raw calendar days with **no** weekend/school-day guard.
- **Config** `HouseholdProfile.schoolDays: DayOfWeek[]` (`features/lib/types.ts:125`) is the real source of truth and is unused here.

### Root cause
Generation never consults `household.schoolDays`; the `schoolDay` path assumes Mon–Fri, and the `weekly`/`everyNDays` paths can land on any weekday including weekends.

### Fix (bug-scoped, minimal-correct)
- **Contract:** add `schoolDaysOfWeek?: DayOfWeek[]` to `GenerateLessonsInput` (the weekday **set**, distinct from the existing numeric `schoolDays` count).
- **Panel:** read `schoolDays` from `useHousehold()` and pass it as `schoolDaysOfWeek`.
- **`computeDueDates`:** for **every** cadence, only ever emit a date whose weekday ∈ `schoolDaysOfWeek`. `schoolDay` = walk allowed weekdays; `weekly`/`everyNDays` = step, then roll **forward** to the next allowed weekday if a step lands on a non-school day. When `schoolDaysOfWeek` is undefined, fall back to current Mon–Fri behavior (back-compat for existing tests/callers).

### Tests (write failing first)
- Service unit: `schoolDaysOfWeek = [Mon..Fri]`, `start = Saturday` → first due date is the following Monday; **no** weekend dates for any cadence.
- Service unit: `weekly`, start Friday, weekends excluded → all dates land on allowed weekdays, never Sat/Sun.
- Service unit: back-compat — omitting `schoolDaysOfWeek` reproduces existing Mon–Fri output.

### Acceptance criteria
Generating lessons (any pacing option) never produces a `dueDate` whose weekday is not in the household's configured `schoolDays`.

**Note:** This is the foundation for Task 3.2 (per-course weekday override). **Do Task 1 before Task 3.**

**Commit:** `fix(resources): honor household school days when distributing generated lessons`

---

# TASK 2 — Ship the UX clarity changes

**Planning mode:** 1 (copy / presentation; no data-behavior change; no new persisted data). Each is one commit.

## 2.1 — Save button always visible on /resources  (c75d361b)
- **Where:** `LessonGenerationPanel.tsx` — the **Save to plan** button (line ~252) renders only when `generated.length > 0`; the Learner/Course selectors already render but sit *after* the Generate button, so the submit step is unclear.
- **Change:** always render **Save to plan**; keep it `disabled` until `canSave`; add a one-line hint of what's still needed (generate lessons → pick learner(s) → pick course). Preserve existing `canSave` logic.
- **Test:** integration — Save to plan is present-but-disabled before generating, enabled after generate + learner + course selected.
- **Acceptance:** The Save action is visible before generation so the user sees how to submit.
- **Commit:** `fix(resources): keep Save-to-plan visible with a hint before lessons are generated`

## 2.2 — Learning-time time field clarity  (36f30694)
- **Where:** `features/learning-time/front/components/NowCard.tsx` — `timeChannelType === 'scheduled'` shows Start/End time (`type="time"`); `scheduledStart = ${today}T${time}` → **this session, today only** (not recurring).
- **Change:** add helper text under the time inputs: applies to this session today only, not a recurring daily schedule. Copy only.
- **Test:** integration — helper text present when scheduled channel is selected.
- **Acceptance:** The scheduled Start/End time inputs clearly state they apply to this one session.
- **Commit:** `fix(learning-time): clarify scheduled Start/End time applies to this session only`

## 2.3 — Records Readiness scope (week vs year)  (ba88751d)
- **Where:** `features/dashboard/front/components/RecordsProof.tsx` subtitle (line ~122). Counts originate from `dashboard/api/routes/records.ts` → `getCurrentWeekRange()` = **current Mon–Sun week**. Truthful label = "this week."
- **Change:** update the subtitle to state the period (e.g. "This week's proof of learning across all subjects and activities"). Dashboard stays presentation-only — **no new seed/store data**.
- **Test:** dashboard integration — subtitle references the current week.
- **Acceptance:** The Records Readiness section states its tiles cover the current week.
- **Commit:** `fix(dashboard): label Records Readiness tiles as current-week scope`

---

# TASK 3 — /resources scheduling + course-linking

**Planning mode:** 2–3 (3.1/3.2 local to resources generation; 3.3/3.4 introduce a resource-side write to the subjects-owned `subjectResources` join → architecture note required). Depends on **Task 1** (3.2 builds on bug 1.2).

## 3.1 — Starting chapter/page  (2bc4d916)
- **Contract:** add `startAt?: number` (1-based) to `GenerateLessonsInput`.
- **Service:** `generateLessons` begins numbering/titles at `startAt` (e.g. "Chapter 5 …") and generates `count − (startAt−1)` items; `order` starts at `startAt`.
- **UI:** `LessonGenerationPanel` — "Start at #" input (shown for byChapter/byPage/byLesson).
- **Tests:** service unit (startAt=5 → first title "Chapter 5", correct count); integration (input flows through).
- **Acceptance:** Choosing start = N generates lessons beginning at unit N.
- **Commit:** `feat(resources): let generation start from a chosen chapter/page`

## 3.2 — Per-course weekday selection  (adfe3188)  *(depends on bug 1.2)*
- **Reuses** the `schoolDaysOfWeek` contract from bug 1.2.
- **UI:** day pills/checkboxes in the panel, **defaulting to** the household `schoolDays`, editable per generation so the user picks which weekdays this course runs.
- **Service:** already handled by bug 1.2's `computeDueDates`.
- **Tests:** integration — deselecting Wednesday yields no Wednesday due dates.
- **Acceptance:** Selecting M/W/F schedules lessons only on those weekdays.
- **Commit:** `feat(resources): choose which weekdays a generated course is taught`

## 3.3 — Link a course when adding/editing a resource  (bb573f78)
- **Existing infra:** `subjectResources` join, `SubjectCourse.resourceIds`, `updateSubjectRow({ resourceIds })` — today the link is only set from the **course/settings** side.
- **Change:** add an enrolled-**course multi-select** to `ResourceForm` (add + edit). On save, link the resource to the chosen course(s). The write targets the **subjects** feature (owner of `subjectResources`): resources UI calls the subjects API/service — it does **not** touch the subjects repo directly.
- **API:** extend the existing subjects update path (`updateSubjectRow` already syncs `resourceIds`) so a resource-side save adds this resource id to each selected course's `resourceIds`. Confirm the round-trip: course's `resourceIds` reflects the new link and vice versa.
- **Architecture note (required):** ownership stays with subjects; resources consumes via service/API. No new source of truth.
- **Tests:** API — linking a resource to a course creates the `subjectResources` row and `course.resourceIds` includes it; integration — ResourceForm course multiselect saves the link.
- **Acceptance:** When adding/editing a resource, the user can attach it to enrolled course(s); the link shows on both the resource and the course.
- **Commit:** `feat(resources): link a resource to enrolled courses from the resource form`

## 3.4 — Enrolled-classes dropdown vs free-text subject category  (3a73264e)
- **Where:** `ResourceForm` free-text **Subject category** input (line ~153).
- **Change:** offer a dropdown of enrolled **courses** alongside (not replacing) the free-text field; selecting a course links the resource (reuses 3.3's write path) and can prefill the category. Keep free-text for resources not tied to a course.
- **Tests:** integration — dropdown lists enrolled courses; selecting one links the resource.
- **Acceptance:** The user can pick an enrolled class from a dropdown to link the resource to that course, instead of only typing a category.
- **Commit:** `feat(resources): add enrolled-course dropdown to the resource form`

---

## Testing plan (all tasks)
Per CLAUDE.md TDD — failing test first, then implement. jsdom for UI. Mock at the repository boundary; never mock `getDb()`. New/changed UI ships integration tests under `features/<feature>/__tests__/integration/` covering loading/empty/error/populated + interactions. `npm run build` and full Jest (incl. integration: `npx jest --testPathIgnorePatterns="/node_modules/"`) must pass before merge.

## Out of scope
Calendar/reminders + Gmail sync (f96c36b3); break ranges + auto-reschedule (b01b66f0); Lesson Planner v2 grid/reschedule; any schema migration beyond the additive `GenerateLessonsInput` fields (which are type-only, no DB change).

## Risks + rollback
- **Bug 1.1** broadens a shared query — mitigate with the regression suite (subjects/plan/resources/WeekGrid). Rollback = revert the single repo + EvidenceForm commit.
- **3.3/3.4** write to `subjectResources` from a new entry point — keep the write in the subjects service; each commit is independently revertible.
- No migrations, no gates, no branch changes.

## Manual QA (click-by-click)
1. `/growth` → pick a child enrolled as a sibling's co-learner → Subject dropdown lists the course; save evidence. (1.1)
2. Set household school days to M/W/F → `/resources` generate → preview shows only M/W/F, never Sat/Sun. (1.2, 3.2)
3. `/resources` open generate panel → Save-to-plan visible+disabled with hint before generating. (2.1)
4. `/learning-time` → scheduled channel → helper text under time inputs. (2.2)
5. Dashboard → Records Readiness subtitle says "this week." (2.3)
6. `/resources` generate → set Start at 5 → first lesson is unit 5. (3.1)
7. `/resources` add/edit resource → pick enrolled course from dropdown → link shows on the course. (3.3, 3.4)
