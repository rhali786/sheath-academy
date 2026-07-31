# G9 — Clock-based session timer, school-day scheduling bug, multi-day lesson spans

**Date:** 2026-07-17
**Source:** Raw feedback given directly by the product owner (voice-to-text, informal), dated 2026-07-17. Not pulled from the `user_feedback` prod table like G1–G8 — this is a fresh batch handed to planning directly.
**Scope:** Items 1–3 below are planned in full (code-path audit, source-of-truth, acceptance criteria, TDD, files, out-of-scope). Item 4 is a cross-reference to the already-planned G8 lesson-planner rework, not a new plan.

---

## Planning mode

**Mixed, per item.**
- **Item 1 (clock-based session timer)** — **Mode 2, bordering Mode 3.** It's a `features/learning-time` UI/behavior change, but its best version reads data from `features/plan` (`LessonTask.scheduledStartTime/scheduledEndTime`), so two features are touched.
- **Item 2 (school-days scheduling bug)** — **Mode 3 (cross-feature).** The source-of-truth setting lives in `features/household`, but the missing enforcement spans `features/plan` (manual create/edit, drag-and-drop) and `features/resources` (bulk generation), and the display gap spans `features/plan` and `features/schedule`.
- **Item 3 (multi-day lesson spans)** — **Mode 1/2.** The data model and two of three UI surfaces already support this; the fix is discoverability/UX polish on an existing capability, plus fixing one confirmed real inconsistency (Dashboard's Today card).
- **Item 4** — no new mode; see cross-reference section.

---

## Source-of-truth decisions

| Data | Owner | Notes |
|---|---|---|
| Lesson clock-time (`scheduledStartTime`/`scheduledEndTime`) | **Planner / Lesson Tasks** (`features/plan`, `lesson_tasks` table) | Shipped in G7a. `features/schedule` and (per this plan) `features/learning-time` are consumers only. |
| Live session execution state (timer/stopwatch/scheduled-window) | **Learning Time** (`features/learning-time`, `learning_time_sessions` table) | Owns session lifecycle (`draft→running→paused→ended→finalized`); this plan does not change that ownership. |
| Household school days (`schoolDays: DayOfWeek[]`) | **Household** (`features/household`, `household_settings` key-value store, key `schoolDays`) | Already the single settings source (confirmed — see audit). Consumers (`plan`, `resources`, `schedule`) must read it, not duplicate it. |
| Lesson completion window (`plannedStartDate`/`dueDate`) | **Planner / Lesson Tasks** (`features/plan`, `lesson_tasks` table) | Already exists and is already read by two of three lesson-listing surfaces (see audit). No new field needed for item 3's core ask. |

---

## Item 1 — Clock-based (wall-clock) session start/stop for the in-session timer

### Feedback (verbatim, condensed)
"The timeline for the in-session timer is not clear as to how to set up the times... we don't know how to put in math at 10:15a... This would be an addition to the start timer system. This is more of a clock system where it starts and stops by the time on the clock, not starts and stops by the time on a timer. So both would be nice."

### Code-path audit (traced 2026-07-17)

| Concern | Current reality |
|---|---|
| Where the in-session timer lives | `features/learning-time/front/components/NowCard.tsx`, rendered from `features/learning-time/front/pages/LearningTimePage.tsx` (`/learning-time` or wherever it's routed — confirm exact route mount at implementation; not traced here, out of this plan's scope since the page itself is unaffected). |
| Session data | `features/learning-time/types.ts` `LearningTimeSession` / `CreateSessionInput`: `timeChannelType: 'scheduled' \| 'stopwatch' \| 'timer'`, `scheduledStart`/`scheduledEnd` (ISO timestamps), `targetMinutes` (for `'timer'`). **A `'scheduled'` channel type already exists** (`NowCard.tsx:355-401`, `TIME_CHANNEL_LABELS.scheduled = 'Scheduled window'`). |
| What `'scheduled'` actually does today | Confirmed by reading `features/learning-time/server/service.ts`: `computeEndedBy` (`service.ts:36-45`) marks `endedBy: 'time'` if `now >= scheduledEnd` **only when the parent manually clicks Finish** (`transitionSession` action `'end'`, `service.ts:142-149`). `'start'` (`service.ts:115-121`) always requires the session to be in `draft` status and is **only ever triggered by a manual button click** (`handleConfigSubmit`/`NowCard.tsx:200-231`, `start-button` in the config panel). **There is no code path — client interval, server cron, or otherwise — that transitions a session to `running` automatically when wall-clock time reaches `scheduledStart`.** `scheduledStart` is stored but never read by any transition logic; only `scheduledEnd` affects `computeEndedBy`, and even that only evaluates at the moment of a manual "Finish" click, not proactively. |
| How a parent sets the scheduled window today | `NowCard.tsx:370-401` — selecting the `'scheduled'` radio in the "Configure session" panel reveals two bare `<input type="time">` fields (`scheduled-start-input`/`scheduled-end-input`) that the parent must type by hand, **every session**, with no persistence and no link to any lesson data. Explicit caveat text is shown: "Applies to this session only, today — not a recurring daily schedule." (`NowCard.tsx:397-400`). |
| Whether this reads G7a's new `LessonTask.scheduledStartTime`/`scheduledEndTime` | **No.** `NowCard.tsx`'s lesson picker (`lt-lesson` select, `NowCard.tsx:316-335`) lists `openLessons` (from `plannerApi.getLessons`, which returns full `LessonTask` objects including the G7a fields per `features/plan/types.ts:31-33`) but **never reads `scheduledStartTime`/`scheduledEndTime` off the selected lesson** to pre-fill the config panel's start/end inputs or to auto-select the `'scheduled'` channel. Selecting a lesson in the dropdown has zero effect on the time-channel fields. This is the direct answer to "how do we put in math at 10:15a" — the data now exists (since G7a) on the lesson, but the timer UI doesn't consume it. |
| Persistence backing | `db/schema.ts:318-343` `learning_time_sessions` — `scheduledStart`/`scheduledEnd` are `timestamp` columns, already present, no migration needed for read-only consumption of existing lesson fields. |
| Existing tests | `features/learning-time/__tests__/server/service.test.ts` (transition/endedBy logic), `features/learning-time/__tests__/api/learning-time.test.ts`, `features/learning-time/__tests__/integration/LearningTimePage.test.tsx`. |
| Missing tests | Pre-fill-from-lesson behavior; auto-transition-to-running behavior (new); "starts soon" / "past due to start" indicator states. |

### What's traced vs. unknown (do not fill this gap with assumptions)
**Traced and confirmed:** no auto-start/auto-stop mechanism exists anywhere in the codebase (client or server) for learning-time sessions; the `'scheduled'` channel is bookkeeping-only today.
**Unknown / architecture constraint to flag explicitly:** this is a Next.js app on Render with no confirmed background-worker/cron infrastructure (not traced beyond `render.yaml`'s web-service definition — a separate worker service was not found in the files read for this plan). A **server-side** "auto-start a session at 10:15am even if no browser tab is open" is **not buildable within currently-observed infrastructure** without adding a scheduled job runner, which is a materially larger change than this feedback item asks for. A **client-side** "while the Learning Time page is open, auto-transition to running at the scheduled time, and prompt to finish at the scheduled end" is buildable with what exists (the `NowCard.tsx:190-194` `setInterval` pattern already ticks every second while a session is running — the same pattern can watch for a `draft` scheduled session's `scheduledStart` and fire `transitionSession('start')`).

### Source-of-truth decision
**Learning Time** (`features/learning-time`) continues to own session lifecycle and the `'scheduled'` channel type — no ownership change. **Planner / Lesson Tasks** continues to own `scheduledStartTime`/`scheduledEndTime` as lesson metadata. This plan wires Learning Time to **read** the lesson's G7a fields as a **convenience pre-fill**, not to duplicate or re-own that data — the session's own `scheduledStart`/`scheduledEnd` timestamps remain the actual execution record (today's date + the lesson's HH:MM), consistent with the existing "applies to this session only, today" model.

### Decided design (both modes present, per the feedback's own request — "both would be nice")
1. **Pre-fill from lesson (new):** when a parent picks a lesson with `scheduledStartTime`/`scheduledEndTime` set in the `lt-lesson` dropdown, the config panel auto-selects the `'scheduled'` channel and pre-fills the start/end time inputs from the lesson (still editable/overridable, still "today only" per existing caveat text). This directly answers "how do we put in math at 10:15a" — the parent no longer retypes a time that's already on the lesson.
2. **Clock-driven auto-start (new, client-side, best-effort):** while `NowCard` is mounted and a `'scheduled'` session is in `draft` status, a polling interval (same pattern as the existing running-session ticker) checks wall-clock time against `scheduledStart` and calls `transitionSession('start')` automatically when reached, moving the card from "Configure/draft" to "Now — running" without a manual click. **Explicitly best-effort:** this only fires while the page is open in a browser tab; state this limitation in the UI (e.g. a small note: "Starts automatically while this page is open"). No server-side guarantee is added in this plan (see unknowns above).
3. **Clock-driven end reminder (new):** when a `'scheduled'` running session's wall-clock time passes `scheduledEnd`, surface a visible prompt to finish (not a silent auto-finalize — outcome/notes still require the existing manual "Finish"/"Save" steps, per the existing `'ended'`→`'finalized'` two-step flow). This avoids silently ending a session that's still genuinely in progress.
4. **Manual timer/stopwatch modes are unchanged** — this plan adds the clock mode alongside them, as requested ("both would be nice"), not instead of them.

### Acceptance criteria
1. Opening the session config panel and selecting a lesson that has `scheduledStartTime`/`scheduledEndTime` set auto-selects "Scheduled window" and fills the start/end time inputs with that lesson's times.
2. Selecting an ad-hoc (no lesson) or a lesson without scheduled times leaves the channel/time fields as they are today (regression: no behavior change for the existing stopwatch/timer paths).
3. A parent can still hand-edit the pre-filled times before starting (override is not locked).
4. With a `'scheduled'` draft session whose `scheduledStart` is in the past relative to wall-clock time, and the page open, the session transitions to `running` without a manual click within one polling interval (define interval, e.g. ≤30s, in implementation).
5. With a `'scheduled'` draft session whose `scheduledStart` is in the future, the card shows a clear "Starts at HH:MM" state (not the generic idle state) so the parent understands why nothing has happened yet.
6. When wall-clock time passes a running `'scheduled'` session's `scheduledEnd`, a visible "time to finish" prompt appears; the session does not silently finalize itself.
7. Closing and reopening the page after the scheduled start time has passed while the tab was closed does **not** retroactively auto-start the session — it lands in whatever state a manual start would have (draft), with the "Starts at HH:MM" indicator now showing the time has passed (a clear, honest gap statement, not a fake auto-start).

### Data / contract changes
- **No schema change.** `LessonTask.scheduledStartTime`/`scheduledEndTime` (G7a) and `LearningTimeSession.scheduledStart`/`scheduledEnd` already exist.
- `CreateSessionInput`/`NowCard` config state: no new fields, just new derivation logic (pre-fill from the selected lesson).

### API / store / service plan
- No new API routes. `NowCard.tsx`'s existing `lessonChoice` `onChange` handler gains a lookup into `openLessons` to read `scheduledStartTime`/`scheduledEndTime` and set `timeChannelType`/`scheduledStart`/`scheduledEnd` local state.
- New client-side polling effect in `NowCard.tsx` (alongside the existing running-session ticker) that, when `session?.status === 'draft' && session.timeChannelType === 'scheduled'`, compares `Date.now()` to `session.scheduledStart` and calls `learningTimeApi.transition(session.id, { action: 'start' })` once the threshold is crossed. Guard against double-firing (e.g. a `hasAutoStartedRef`).
- No service.ts change required — `transitionSession('start')` already exists and does exactly what's needed; it's just being called from a timer instead of only a click.

### UI plan
- `NowCard.tsx` "Configure session" panel: lesson selection drives channel + time pre-fill (per decided design #1).
- New "Starts at HH:MM" idle-but-scheduled state (between "Idle — awaiting assignment" and "running") for acceptance criterion 5.
- New "Time to finish [lesson]" visible prompt for acceptance criterion 6, styled consistently with existing inline prompts in the same file (no new modal pattern — `ui-style-guide` favors reusing what's on the page).
- Small caption noting the auto-start is page-open-dependent (sets honest expectations, avoids the "why didn't it start" support question).

### Testing plan (failing first)
- **Unit:** none new beyond what's covered by service tests already (no service.ts logic changes) — the new behavior is presentation/effect logic in `NowCard.tsx`, tested at the integration layer.
- **Integration (`features/learning-time/__tests__/integration/`):**
  1. Selecting a lesson with `scheduledStartTime`/`scheduledEndTime` set auto-selects the "Scheduled window" radio and fills both time inputs with the lesson's values.
  2. Selecting a lesson without those fields (or ad-hoc) leaves the channel/time fields unchanged from current defaults (regression).
  3. Editing a pre-filled time value after lesson selection is possible and is what gets submitted.
  4. With a mocked "now" past a draft scheduled session's `scheduledStart`, the component calls `learningTimeApi.transition` with `{ action: 'start' }` without a click, and only once (no duplicate calls across re-renders/polls).
  5. With a mocked "now" before `scheduledStart`, the card shows the "Starts at HH:MM" state and does **not** call transition.
  6. With a mocked "now" past a running scheduled session's `scheduledEnd`, the "time to finish" prompt renders; `Finish`/outcome flow is unchanged (still manual).

### Files
- Edit: `features/learning-time/front/components/NowCard.tsx` (pre-fill logic, auto-start polling effect, new idle-scheduled and end-reminder UI states).
- Tests: `features/learning-time/__tests__/integration/LearningTimePage.test.tsx` (or a new `NowCard.test.tsx` if NowCard isn't already integration-tested standalone — confirm at implementation).
- No changes to `features/learning-time/server/service.ts`, `repository.ts`, `types.ts`, or `db/schema.ts`.

### Out of scope
- Server-side/background auto-start that works when no browser tab is open (requires new worker/cron infrastructure not confirmed to exist — a separate, larger architecture decision).
- Recurring daily schedules for learning-time sessions (explicitly disclaimed already in the existing UI copy: "not a recurring daily schedule" — this plan does not change that).
- Push notifications / alerts when a scheduled session should start (would require a notification channel not evaluated here).
- Any change to `timeChannelType: 'timer'` (target-minutes countdown) behavior — unaffected by this plan.

---

## Item 2 — Schedule bug: lessons/schedule shown on days the household turned off

### Feedback (verbatim, condensed)
"The schedule days where it will schedule classes even on Saturday and Sunday, even though we turned those days off."

### Code-path audit (traced 2026-07-17)

| Concern | Current reality |
|---|---|
| Household school-days setting (source of truth) | `features/household/front/components/HouseholdSettings.tsx:172-187` — "Default school days" checkboxes, defaulting to Mon–Fri, backed by `form.schoolDays: DayOfWeek[]`. Saved via `householdApi.updateProfile({ schoolDays, ... })` → `PUT /api/household/profile` → `features/household/api/routes/household-profile.ts:104-109` (validates array of valid day names) → persisted as a `household_settings` row with `key = 'schoolDays'` via `setHouseholdSetting` (`household-profile.ts:150-155`). Read back via `GET` → `profileFromRowAndSettings` (`household-profile.ts:20-36`) → `HouseholdProfile.schoolDays`. **Confirmed: this is a real, working, persisted setting** (this is the "turned those days off" action the tester performed). |
| Consumer #1 — resource-based bulk lesson generation | `features/resources/front/components/LessonGenerationPanel.tsx:39-40,55-60` reads `householdProfile.schoolDays` as the **initial default** for its own separate `courseDays` checkbox state, then passes `courseDays` as `schoolDaysOfWeek` to `resourcesApi.generateLessons` (`LessonGenerationPanel.tsx:96`) → `features/resources/server/service.ts:56,83,110-124,138-178` `generateLessons`/`computeDueDates`, which **does** correctly skip disallowed weekdays (unit-tested: `features/resources/__tests__/api/resources.test.ts:238-` covers this). **This one path honors the setting**, but only as an editable per-generation default — a parent can unwittingly change `courseDays` for one generation without touching the household setting, and the component's own default (`DEFAULT_COURSE_DAYS`, `LessonGenerationPanel.tsx:11`) already excludes weekends before the household profile even loads, so this generator was not observed to be the source of weekend lessons. |
| Consumer #2 — manual lesson create/edit | `features/plan/front/components/LessonTaskForm.tsx:251-277` — `plannedStartDate`/`dueDate` are plain `<input type="date">` fields with **zero day-of-week awareness**. `features/plan/server/validation.ts:10-24` `validateLessonWindow` only enforces `plannedStartDate <= dueDate`; nothing checks weekday against `household.schoolDays`. A parent can pick any calendar date, including a turned-off day, with no warning at all. |
| Consumer #3 — drag-and-drop reschedule | `features/plan/front/components/WeekGrid.tsx:215-248` `handleDragEnd` calls `plannerApi.updateLesson(lessonId, { dueDate: newDueDate, ... })` for **any** droppable cell in the grid, including weekend columns — `DroppableCell` (`WeekGrid.tsx:137-154`) is droppable regardless of `isWeekendDay`; the weekend flag only changes cell styling (`opacity-60`), it does not disable the drop target or warn. **This is a confirmed, concrete way to place/move a lesson onto Saturday/Sunday with zero friction**, and is a strong candidate for what the tester actually did or saw happen (drag/reschedule is a primary interaction on `/plan`). |
| Consumer #4 — how weekends are visually flagged today | `WeekGrid.tsx:31-33` `isWeekend(dayIndex)` and `WeeklyList.tsx:26-28` (identical function) are **hardcoded to `dayIndex === 0 \|\| 6`** (calendar Saturday/Sunday) — **neither reads `household.schoolDays` at all.** This means: (a) a household that turned off a weekday other than Sat/Sun (e.g. no school Wednesdays) gets no visual signal on Wednesday; (b) a household that deliberately schools on Saturday (e.g. co-op) still sees Saturday muted/deprioritized as if it were off, which is actively wrong for them. This is the clearest, fully-confirmed root cause: **the UI's "off day" concept is a hardcoded weekend guess, never wired to the actual household setting**, so from the tester's point of view "days we turned off" and "days the app treats as off" are two unrelated things. |
| Consumer #5 — `/plan/schedule` day view | `features/schedule/front/pages/SchedulePage.tsx` renders whatever `dueDate` lessons exist for `selectedDate` via `buildDailySchedule` — it has no day-of-week gating at all; it will happily render a full timeline for a Saturday if lessons exist on that date. This is consistent with #2/#3 — the bug isn't in `schedule`, it's upstream in how the lesson got a weekend `dueDate` in the first place, or in `schedule` not warning the parent they're looking at an off day. |
| Existing tests | `features/resources/__tests__/api/resources.test.ts` (`schoolDaysOfWeek` cases, generator only); `features/household/__tests__/integration/HouseholdSettings.test.tsx`; `features/plan/__tests__/integration/WeekGrid.test.tsx` (drag-and-drop, no day-off assertions). |
| Missing tests | Any test proving `plan`/`schedule` surfaces are aware of `household.schoolDays` at all — **there are none today**, because the code path doesn't exist. |

### What's traced vs. unknown
**Fully confirmed:** the setting is real, saved, and read correctly by exactly one consumer (`LessonGenerationPanel`, generation-time only); every other lesson-placement path (manual form, drag-and-drop) has zero awareness of it; the visual "weekend" treatment in the grid/list views is hardcoded to calendar Sat/Sun and is never derived from the household setting.
**Not traced (would require the tester's specific repro):** whether the tester's actual complaint traces to a specific generated batch, a drag-and-drop move, or simply seeing muted-but-still-clickable weekend cells and expecting them to be unavailable. The fix below covers all three because the root cause (no shared, enforced concept of "off day" outside one generator) is the same regardless of which entry point the tester used.

### Source-of-truth decision
**Household** (`features/household`, `household_settings.schoolDays`) is confirmed as the sole source of truth. `plan`, `resources`, and `schedule` must all **consume** it, not maintain their own copy or hardcoded guess. Current violation: `WeekGrid`/`WeeklyList`'s `isWeekend()` is a **local, wrong proxy** for "off day" — decided fix is (3) migrate it in this wave: replace the hardcoded Sat/Sun check with a household-driven `isOffDay(dayOfWeek, householdSchoolDays)` check everywhere "weekend" styling/logic currently appears, sourced from `useHousehold().householdProfile.schoolDays`.

### Decided design
1. **Visual truth fix (all listing surfaces):** `WeekGrid`, `WeeklyList`, `WeekCalendarView`, `MonthCalendarView`, and `SchedulePage`'s day header derive "off day" from `householdProfile.schoolDays` (default Mon–Fri when unset, matching `HouseholdSettings.tsx`'s own default) instead of a hardcoded Sat/Sun check. A household that schools Saturdays sees Saturday styled as a normal school day; a household that's off Wednesdays sees Wednesday muted.
2. **Non-blocking warning on manual placement (`LessonTaskForm`):** if the chosen `dueDate` (or `plannedStartDate`) falls on an off day per the household setting, show an inline, dismissible warning ("This date is marked as an off day in your household settings") — **not a hard block**. Homeschool schedules have legitimate exceptions (a make-up day, a co-op Saturday not yet reflected in settings), so per plan-builder standards this must not become a `window.confirm`-style block; it's informative only, consistent with the project's general "don't invent a new blocking pattern" instruction.
3. **Non-blocking warning on drag-and-drop (`WeekGrid`):** dropping a lesson onto an off-day column still succeeds (preserves existing flexibility) but the existing `InlineSuccess` "Moved to <day>" notice (`WeekGrid.tsx:261-269`) is extended to note when the target day is an off day, so the parent gets a clear, immediate signal rather than silence.
4. **Bulk generation panel:** no functional change needed (already correct); optionally re-label `LessonGenerationPanel`'s "Course days" checkboxes to make clearer they default from — and can diverge from — the household setting (small copy fix, low priority, include only if time allows in the same PR).

### Acceptance criteria
1. In Settings → Household, uncheck Saturday and Sunday and save. On `/plan` (matrix view), the Saturday and Sunday columns are visually styled as off days (muted), matching the household setting — not a hardcoded assumption.
2. With Wednesday unchecked instead (Sat/Sun left on), the Wednesday column is muted and Saturday/Sunday are not — proving the styling is setting-driven, not a hardcoded weekend guess.
3. Creating a new lesson via the planner form with a due date that falls on an off day shows a visible, non-blocking inline warning; the lesson can still be saved.
4. Dragging a lesson onto an off-day column in the matrix succeeds (not blocked) and the resulting "Moved to <Day>" confirmation notes it's an off day.
5. A household that has never touched the setting continues to see the existing default behavior (Mon–Fri "school", Sat/Sun muted) — regression, no behavior change for households that haven't customized it.
6. `/plan/schedule` day view for a date whose weekday is an off day shows a small "this is an off day" indicator in the page header area (not silent).

### Data / contract changes
- No schema change. `HouseholdProfile.schoolDays` already exists end-to-end.
- No `LessonTask` field changes.

### API / store / service plan
- No new API routes. `useHousehold()` already exposes `householdProfile.schoolDays` to any component under `HouseholdProvider` (confirmed via `LessonGenerationPanel`'s existing usage) — `WeekGrid`/`WeeklyList`/`SchedulePage` already sit under the same provider (they already consume `useHousehold()` for other fields, e.g. `SchedulePage.tsx:53` `householdProfile`), so no new plumbing is required, only reading one more field.

### UI plan
- Replace `isWeekend(dayIndex: number)` in `WeekGrid.tsx` and `WeeklyList.tsx` with a shared helper (new small util, e.g. `features/plan/utils/schoolDays.ts`) taking `(dayIndex, schoolDays?: DayOfWeek[])` and defaulting to Mon–Fri when `schoolDays` is unset — mirrors `HouseholdSettings.tsx`'s own default so behavior is consistent everywhere.
- `LessonTaskForm.tsx`: add an inline warning line under the date fields (reuse the existing inline-message visual language already used for `titleError`/`timeError` in the same file, just non-error/amber-toned instead of red, since it's advisory not blocking).
- `WeekGrid.tsx`: extend `RescheduleUndo`/`InlineSuccess` message text when the new due date is an off day.
- `SchedulePage.tsx`: small header note when `selectedDate`'s weekday is an off day.
- Accessibility: the off-day indicator must not be color-only — pair the muted styling with text (e.g. "Off day" label), consistent with the standards' "text labels on status badges" rule.

### Testing plan (failing first)
- **Unit:** new `schoolDays.ts` helper — `isOffDay(dayIndex, schoolDays)` returns correct boolean for a custom set, and for `undefined` (Mon–Fri default); explicit test that Saturday is **not** off when `schoolDays` includes Saturday (proves it's not hardcoded).
- **Integration:**
  1. `WeekGrid` — with `householdProfile.schoolDays = ['Mon'..'Fri']`, Saturday/Sunday columns render the off-day style; with `schoolDays` including Saturday, Saturday renders as a normal day.
  2. `LessonTaskForm` — setting a due date on an off day shows the inline warning; setting it on a school day shows no warning; submission is not blocked either way.
  3. `WeekGrid` drag-and-drop — dropping onto an off-day column succeeds and the confirmation message includes the off-day note.
  4. `SchedulePage` — day view for an off-day date shows the header indicator; a school-day date does not.
- **Regression:** existing `WeekGrid.test.tsx`/`WeeklyList.test.tsx` assertions that Saturday/Sunday render as "weekend" by default must still pass unchanged (default household has no custom `schoolDays`, so Mon–Fri fallback preserves current visible behavior).

### Files
- Add: `features/plan/utils/schoolDays.ts` (+ unit test).
- Edit: `features/plan/front/components/WeekGrid.tsx`, `features/plan/front/components/WeeklyList.tsx`, `features/plan/front/components/LessonTaskForm.tsx`, `features/schedule/front/pages/SchedulePage.tsx`.
- Confirm at implementation whether `features/schedule/front/components/WeekCalendarView.tsx`/`MonthCalendarView.tsx` also hardcode a weekend concept (not read in this audit — grep for `isWeekend`/`getDay() === 0` there before implementation; if found, include in the same fix for consistency).
- Tests: `features/plan/__tests__/unit/schoolDays.test.ts` (new), `features/plan/__tests__/integration/WeekGrid.test.tsx`, `features/plan/__tests__/integration/LessonTaskForm.test.tsx`, `features/schedule/__tests__/integration/SchedulePage.test.tsx`.

### Out of scope
- Hard-blocking lesson placement on off days (explicitly rejected — homeschool schedules need exceptions).
- Changing `LessonGenerationPanel`'s generation logic (already correct); only its copy/labeling is optionally touched.
- Any change to `computeDueDates`/`generateLessons` in `features/resources/server/service.ts` — already correct and tested.
- Building a household-wide "school calendar" (holidays, breaks) — this plan is weekday-of-week only, matching the existing `schoolDays` field's scope.

---

## Item 3 — Multi-day lesson spans (Monday-only vs. Monday–Wednesday vs. Monday–Friday)

### Feedback (verbatim, condensed)
"If a lesson is placed on Monday, it shows up on Monday, but if we were trying to cover it for the whole week, it ends up staying on Monday rather than having the option to say it's only on Monday, or we're gonna stretch it Monday to Wednesday or Monday through Friday."

### Code-path audit (traced 2026-07-17)

| Concern | Current reality |
|---|---|
| Data model | `features/plan/types.ts:17-40` `LessonTask.plannedStartDate?` / `dueDate` — confirmed present. Comment on the field: "Completion window start; when omitted, dueDate alone defines the lesson day." |
| Window semantics | `features/plan/utils/lessonCompletionWindow.ts` — `getLessonWindowStart` (defaults to `dueDate` when `plannedStartDate` unset), **`lessonSpansDate(lesson, dateStr)`** (`dateStr >= windowStart && dateStr <= dueDate` — an **inclusive, contiguous** range check), `lessonOverlapsRange`, `formatCompletionWindow` (renders "Jul 14 – Jul 16" style label, returns `null` when there's no real span). Unit-tested: `features/plan/__tests__/unit/lessonCompletionWindow.test.ts`. |
| Consumer #1 — matrix view (`WeekGrid`) | **Already fully wired.** `WeekGrid.tsx:200-204` `getLessonForCell` calls `lessonSpansDate(l, dateStr)` per cell — a lesson with `plannedStartDate=Mon`, `dueDate=Wed` **already renders in the Monday, Tuesday, and Wednesday cells** of that child/subject row today, with a "Jul 14 – Jul 16"-style window label (`WeekGrid.tsx:119-121`, `formatCompletionWindow`). Confirmed by direct read — this is not hypothetical. |
| Consumer #2 — list view (`WeeklyList`, mobile default / desktop pre-G8) | **Also already wired.** `WeeklyList.tsx:90` `lessonsForDay = dateStr => lessons.filter(l => lessonSpansDate(l, dateStr))` — same contiguous-span behavior, same lesson card repeated once per spanned day, with the same window label (`WeeklyList.tsx:155-157`). |
| Consumer #3 — `LessonTaskForm` (where a parent would set this) | `features/plan/front/components/LessonTaskForm.tsx:251-279` — **the capability is exposed**, but weakly: two side-by-side plain date inputs labeled "Available from (optional)" and "Due date", with one line of small gray helper text below both: "Lesson can be completed any day from 'Available from' through 'Due date'." There is no framing that connects this to "stretch across the week," no quick-pick buttons (e.g. "This week," "Mon–Fri"), and the label "Available from" reads as a *when-can-they-start* concept, not a *this lesson spans multiple calendar cells* concept — a parent who wants "cover it for the whole week" has no reason to associate that goal with an "Available from" field. **This is the confirmed root cause: a real, working capability with a discoverability/labeling gap, not a missing feature.** |
| Consumer #4 — Dashboard "Today" card (found while tracing, not asked about but directly relevant) | `features/plan/front/components/TodayLessonCard.tsx:62,81` filters `l.dueDate === today` **only** — does **not** call `lessonSpansDate`. A lesson spanning Mon–Wed will **not** appear on the Dashboard's Today card on Monday or Tuesday, only on Wednesday (its `dueDate`). This is a genuine inconsistency between `/plan` (spans correctly) and Dashboard (doesn't) that a parent using a multi-day span would notice as "it's not really available all week." |
| Non-contiguous spans (e.g. "Monday AND Wednesday AND Friday, but not Tuesday/Thursday") | **Confirmed unsupported by the data model.** `lessonSpansDate` is a pure inclusive range check (`dateStr >= start && dateStr <= due`) — there is no way to represent "these specific days within the window" short of creating separate `LessonTask` rows (which the codebase already does for the "assign one lesson to multiple learners" fan-out case via `groupId`, per `features/plan/types.ts:36` and G8's audit — but that's a different axis: multiple *learners*, not multiple *non-contiguous days* for one learner). This genuinely does not exist today. |
| Existing tests | `features/plan/__tests__/unit/lessonCompletionWindow.test.ts` (window math), `features/plan/__tests__/integration/WeekGrid.test.tsx`, `WeeklyList.test.tsx` (rendering, not yet asserting multi-day span specifically — confirm exact coverage at implementation), `features/plan/__tests__/integration/LessonTaskForm.test.tsx`. |
| Missing tests | An integration test that *specifically* proves a spanning lesson shows on all three days in `WeekGrid`/`WeeklyList` (may already implicitly pass via existing fixtures — verify, don't assume, before writing new ones); a `LessonTaskForm` test for any new quick-pick UI; a `TodayLessonCard` test proving the dashboard's dueDate-only behavior (documenting current behavior before deciding whether to change it). |

### What's traced vs. unknown
**Fully confirmed:** the contiguous multi-day span is a real, already-shipped capability in both `WeekGrid` and `WeeklyList`, driven entirely by existing `plannedStartDate`/`dueDate` fields with zero new schema needed. The gap is **discoverability** in `LessonTaskForm`, not missing plumbing.
**Confirmed unsupported:** non-contiguous per-day selection ("Mon + Wed + Fri, skip Tue/Thu") is not representable in the current model.
**Not fully resolved (a decision, not an unknown):** whether the Dashboard Today-card inconsistency (`TodayLessonCard.tsx`) should be fixed in this same wave or deferred — see decided design below.

### Source-of-truth decision
**Planner / Lesson Tasks** already owns this correctly. No ownership change. The fix is UI-layer only in `features/plan` (form clarity) plus one small consistency fix in `features/plan`'s `TodayLessonCard` (still the same feature, no cross-feature reassignment).

### Decided design
1. **Reframe the form fields (in scope):** relabel/restructure `LessonTaskForm`'s date section so the "span" framing is explicit — e.g. a single "Schedule" control that defaults to "Just [due date]" and offers "Spans multiple days" to reveal the existing "Available from" input, with the helper copy rewritten to lead with the outcome ("This lesson will appear every day from ... through ..."), not the mechanism. Exact widget choice (toggle + reveal vs. always-visible with better copy) is an implementation-time call — either satisfies the acceptance criteria below; do not overbuild a date-range picker component if the existing two `<input type="date">`s with a clearer relationship read as "in scope" once relabeled.
2. **Optional quick-pick shortcuts (in scope, small):** given the tester explicitly said "Monday to Wednesday, or Monday through Friday," add small preset buttons near the fields — e.g. "This week (Mon–Fri)" — that set `plannedStartDate`/`dueDate` from the current form's due-date week. Keep this minimal; do not build a general recurrence engine (see out-of-scope).
3. **Non-contiguous per-day spans: explicitly deferred**, not built. The tester's own examples ("only on Monday," "Monday to Wednesday," "Monday through Friday") are all contiguous-range cases the model already supports once surfaced — building non-contiguous selection would be a materially larger data-model change (either a `daysOfWeek` set field decoupled from the date range, or true recurrence) for a case not actually requested. Named as a follow-up if a future feedback item asks for it explicitly.
4. **`TodayLessonCard` fix: in scope, small.** Change its filter from `dueDate === today` to `lessonSpansDate(l, today)` so the Dashboard's Today card is consistent with `/plan`'s matrix/list views — a lesson available today (per its window) should show as available today everywhere, not just on its final due date. This is a one-line-filter change with an existing tested utility; low risk, closes a real inconsistency found during this audit.

### Acceptance criteria
1. Creating a lesson with only a due date (no span) behaves exactly as today — appears on that single day in `/plan` matrix and list views. (Regression.)
2. Creating a lesson with "Available from" = Monday and "Due date" = Wednesday shows that lesson's card on Monday, Tuesday, **and** Wednesday in both the matrix and list views, each showing the "Jul 14 – Jul 16"-style window label. (Proves the existing capability now reachable/clear.)
3. The relabeled form makes it clear, without prior knowledge, that setting both dates creates a multi-day span — verified by the copy/label text itself in the rendered form, not just by the underlying behavior.
4. Using the "This week (Mon–Fri)" quick-pick (or equivalent) sets the span to the current due-date's school week in one action.
5. A lesson with a Monday–Wednesday span appears on the Dashboard's Today card on Monday, Tuesday, and Wednesday (not just Wednesday) — proves the `TodayLessonCard` fix.
6. A lesson with no span (single due date) still appears on the Dashboard's Today card only on its due date — regression for the non-spanning case.

### Data / contract changes
- **None.** `plannedStartDate`/`dueDate` already exist; no migration.

### API / store / service plan
- No API changes — `plannerApi.createLesson`/`updateLesson` already accept `plannedStartDate` (confirmed via `LessonTaskForm.tsx:174` and G7a's plan for the sibling `scheduledStartTime`/`scheduledEndTime` fields following the same pattern).

### UI plan
- `LessonTaskForm.tsx`: relabel/restructure the date section per decided design #1; add the quick-pick control per #2. Follow existing form-field visual language in the same file (labeled inputs, inline helper text) — no new interaction pattern introduced.
- `TodayLessonCard.tsx`: swap the filter predicate; no visual change otherwise.
- Accessibility: quick-pick buttons must be reachable by keyboard and have clear text labels (not icon-only).

### Testing plan (failing first)
- **Unit:** none new — `lessonCompletionWindow.ts` is unchanged and already tested.
- **Integration:**
  1. `LessonTaskForm` — the relabeled span control is present and its copy states the multi-day behavior in plain language (assert on rendered text, not just field presence).
  2. `LessonTaskForm` — the quick-pick sets `plannedStartDate`/`dueDate` to the expected Mon–Fri range for a given due date.
  3. `WeekGrid`/`WeeklyList` — explicit test (if not already covered — verify existing fixtures first) that a lesson with a 3-day window renders in all 3 day cells/sections, not just one.
  4. `TodayLessonCard` — a lesson spanning today (but not due today) appears; a lesson due on a different day and not spanning today does not.
- **Regression:** existing `LessonTaskForm.test.tsx`, `WeekGrid.test.tsx`, `WeeklyList.test.tsx`, `TodayLessonCard.test.tsx` single-day cases must stay green.

### Files
- Edit: `features/plan/front/components/LessonTaskForm.tsx`, `features/plan/front/components/TodayLessonCard.tsx`.
- Tests: `features/plan/__tests__/integration/LessonTaskForm.test.tsx`, `features/plan/__tests__/integration/WeekGrid.test.tsx` (or new assertions in existing file), `features/plan/__tests__/integration/WeeklyList.test.tsx`, `features/plan/__tests__/integration/TodayLessonCard.test.tsx`.
- No `db/schema.ts`, no migration, no `features/plan/server/**` changes.

### Out of scope
- Non-contiguous per-day-of-week spans ("Mon + Wed + Fri only") — deferred per decided design #3; would need a genuine data-model addition.
- A full recurrence engine (weekly-repeating lessons across multiple weeks/terms).
- Any change to `groupId`'s multi-learner fan-out semantics — orthogonal to this item.
- Redesigning the planner's card layout — that's G8's territory (see cross-reference below); this item only touches the date-window fields inside the existing form and the Dashboard's filter predicate.

---

## Item 4 — "Plan book... more like a calendar" — cross-reference to G8, not re-planned here

The raw feedback: *"The plan book thing I mentioned — having it more like a calendar rather than a new row for every subject, though that might be a nice view to have, but it being the only one is not ideal."*

**This is the same underlying complaint already captured and fully designed in `docs/20260716-lesson-planner-ux-rework-g8-plan.md` (G8).** Read in full for this cross-reference.

- G8's own framing of the original feedback (`6f7a6af3`) is: the planner "feels like editing a table," the matrix (`WeekGrid`) repeats the child/subject name on every row, and the fix is a **new lesson-centric Weekly Planner view** (grouped by learner, richer cards) **plus a toggle back to the existing Planning Matrix** — explicitly *not* removing the matrix, matching this new feedback's "it being the only one is not ideal" (i.e. the matrix shouldn't be the *only* view — G8 already ensures it won't be, by adding the Weekly Planner as the new default and keeping Matrix one click away, per G8 P1).
- **"More like a calendar"** is a slightly different phrasing than G8's "lesson-centric weekly planner grouped by learner," but tracing G8's design section (`WeeklyPlanner.tsx`, days-within-learner-band layout) shows it is still fundamentally a **week-grid-shaped** view (days as columns/sub-sections), not a true month-calendar view. G8's own "Out of scope" section explicitly lists **"Calendar/overview view (the doc lists it as a future idea, not this wave)"** — so there is a genuine nuance this G9 phrasing adds that G8's design does not fully cover: a true calendar-style (month-grid, date-cell-per-day) view of lessons is **not** what G8 builds, even after G8 ships.
- However, `features/schedule/front/components/MonthCalendarView.tsx` and `WeekCalendarView.tsx` (found during this audit, under `/plan/schedule`, not `/plan`) **already exist and already are calendar-shaped views of lessons** — confirmed present in the `features/schedule` glob during this session's audit, rendering `lessonsByDate` in a month/week calendar grid (`SchedulePage.tsx:134-149`). This raises an open question worth flagging rather than assuming: **is the tester's "calendar" ask already satisfied by `/plan/schedule`'s existing Week/Month calendar views, just not discoverable from `/plan` itself (different route, different nav entry)?** This was not traced further (out of this plan's scope to redesign navigation), but it's a concrete, low-cost thing to verify with the tester or in a quick manual check before deciding whether "calendar view" needs to be *built* (as a new G8/G9 phase) or just *linked/surfaced* from `/plan`.

**Decision for this plan:** G9 does **not** re-plan item 4. It is the same request as G8's core complaint and G8 already schedules a fix (view toggle + learner-grouped planner, matrix preserved). **G9 depends on / should sequence after G8** — building item 1–3's fixes on top of a planner UI that's mid-redesign risks rework (e.g. item 3's `LessonTaskForm` relabeling touches the same form G8 P4 also touches for curriculum/chapter fields). The one open thread not covered by G8 — whether a true month-calendar view should become the planner's own next phase, or whether `/plan/schedule`'s existing calendar views just need better discoverability from `/plan` — is flagged as a follow-up question, not built here.

---

## Sequencing across items 1–3 (and G8)

**Traced dependency check (not assumed):** the task brief asked whether item 1's clock-timer depends on item 2/3's fixes. Tracing the actual code: **no hard dependency exists.** Item 1 reads `LessonTask.scheduledStartTime`/`scheduledEndTime` directly (already shipped in G7a, unrelated to items 2/3). Item 2 (school-days enforcement) and item 3 (multi-day spans) both touch `LessonTaskForm.tsx` and `WeekGrid.tsx`/`WeeklyList.tsx`, but different, non-overlapping parts of those files (item 2: date-field warnings + weekend styling; item 3: date-field relabeling). They **can** ship independently, but doing them in the same PR/phase for a given file avoids two separate people editing the same date-field block in `LessonTaskForm.tsx` back to back.

Suggested phasing:

1. **`fix/plan-school-days-enforcement`** (Item 2) — bug fix, highest tester-visible confidence, touches shared util (`schoolDays.ts`) that nothing else in this plan depends on. Ship first.
2. **`enhancement/plan-multi-day-span-clarity`** (Item 3) — builds on the same `LessonTaskForm.tsx` date-field area item 2 just touched; sequencing after item 2 avoids a merge conflict on that block. Includes the `TodayLessonCard` fix.
3. **`feat/learning-time-clock-mode`** (Item 1) — fully independent of 1/2 above; can ship in parallel with either, but is the most novel/risky piece (new auto-transition polling logic) so putting it last means items 2–3 (safer, more confidently scoped) land first.
4. **Item 4 — no new phase.** Wait for G8 to land (already planned, separate branch sequence per that plan's own "Branch + commit plan"). Re-evaluate the "calendar view discoverability" open question from the cross-reference section only after G8 P1–P3 ship and the toggle exists to test against.

Each phase is independently shippable per plan-builder standards (a phase produces a usable capability, not scattered files); none require a schema migration, so none need the DATABASE_URL-targeting caution that G7a's migration phase needed.

---

## Manual QA (click-by-click, tied to acceptance criteria)

**Item 2:**
1. Settings → Household → uncheck Saturday and Sunday → Save.
2. Go to `/plan` (matrix view) → confirm Saturday/Sunday columns are visually muted with a text "Off day" indicator, not just hardcoded opacity.
3. Re-check Saturday, leave Sunday off, Save → confirm Saturday now renders as a normal school day, Sunday stays muted.
4. Add a new lesson via the planner form with a due date on a still-off day → confirm the inline warning appears and saving still succeeds.
5. Drag an existing lesson onto an off-day column → confirm the move succeeds and the confirmation message notes it's an off day.

**Item 3:**
1. Add a lesson with "Available from" = Monday, "Due date" = Wednesday of the current week.
2. Confirm the form's own copy states this creates a multi-day span before saving.
3. Save → confirm the lesson card appears on Monday, Tuesday, and Wednesday in the matrix view, each showing the "Jul X – Jul X" window label.
4. Switch to the mobile/list view → confirm the same 3-day appearance.
5. Go to Dashboard → on Monday, Tuesday, and Wednesday (simulate via date if needed) confirm the lesson shows on the Today card each day, not only Wednesday.
6. Add a lesson with only a due date (no span) → confirm it appears on exactly one day everywhere (regression).

**Item 1:**
1. Set a lesson's clock time via the schedule feature (G7a) to, say, 2 minutes from now.
2. Go to Learning Time → open the session config panel → select that lesson → confirm "Scheduled window" is auto-selected and the time fields show the lesson's times.
3. Leave the page open → confirm the session auto-transitions to "running" at the scheduled time without a click, and the "Starts at HH:MM" state was visible beforehand.
4. Let the scheduled end time pass while running → confirm a visible "time to finish" prompt appears; confirm the session does not silently finalize.
5. Manually finish and save an outcome → confirm the existing finalize flow is unchanged.

---

## Branch + commit plan
- `fix/plan-school-days-enforcement` (Item 2) → `enhancement/plan-multi-day-span-clarity` (Item 3) → `feat/learning-time-clock-mode` (Item 1).
- One PR per branch against `dev`; behavior-oriented commits (test-first, then implementation, then cleanup); never `--no-verify`. Build + `npm test` + integration (`npx jest --testPathIgnorePatterns="/node_modules/"`) green before each PR.
- No schema migrations in this plan — no `DATABASE_URL`/prod-targeting gate needed for any of the three phases.

## Risks & rollback
- **Item 1 risk:** client-only auto-start could surprise a parent if the tab is left open unattended for hours after the scheduled time with the session still in `draft` (nothing enforces "only auto-start within N minutes of the scheduled time"). Mitigation: scope the auto-start check to only fire when `now` is within a bounded window past `scheduledStart` (e.g. same calendar day), not indefinitely; state this as an implementation-time decision to make explicit, not silently assume.
- **Item 2 risk:** relying on a client-read `householdProfile.schoolDays` default (Mon–Fri) diverging from `HouseholdSettings.tsx`'s own default is a real risk if the two defaults are hand-copied instead of sharing one constant — implementation must define the Mon–Fri default in one place (e.g. export from the new `schoolDays.ts` util) and have `HouseholdSettings.tsx` import it, not duplicate it.
- **Item 3 risk:** relabeling `LessonTaskForm`'s date fields could confuse existing users mid-lesson-edit if the copy changes meaning without changing behavior — mitigate by keeping the underlying field semantics identical (no data migration, no behavior change) and only changing labels/framing, verified by the regression acceptance criteria (1) and (6).
- **Rollback:** each phase is a single small PR touching a bounded file set with no schema change — revertible independently without affecting the other two phases or G8.
