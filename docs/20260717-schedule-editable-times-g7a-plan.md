# G7a — Editable start/end time for scheduled classes

**Date:** 2026-07-17
**Source:** feedback `3b8b891b` ("it could be helpful to be able to change the start and end time for the class", `/plan/schedule`), originally scoped in `docs/20260716-feedback-batch-g1-g7-plan.md`'s G7 table. A first attempt (`phase-g7-schedule-times`) correctly failed rather than widen scope, and found the real shape of the problem — this plan re-scopes it properly.

---

## Planning mode
**Mode 2 (local feature behavior)**, bordering Mode 3: the change is one coherent capability (override a lesson's synthesized schedule time) but touches two features — `plan` (owns `LessonTask`, the source of truth) and `schedule` (reads lessons and synthesizes a daily timeline). No dashboard/records aggregation is involved, so full Mode 3 treatment isn't needed, but both features' code paths are audited below.

---

## Code-path audit (traced 2026-07-17, confirms and extends the prior failed attempt's findings)

| Concern | Current reality |
|---|---|
| Where times are shown | `features/schedule/front/pages/SchedulePage.tsx` → `features/schedule/front/components/ScheduleTimeline.tsx`, rendering `DaySchedule.entries` (`ScheduleEntry[]`, `features/schedule/types.ts`). |
| Where times come from | `features/schedule/server/service.ts` `buildDailySchedule(lessons, settings)`: starts a `cursor` at `settings.startTime` (hardcoded `'08:30'` in `SchedulePage.tsx`), and for each lesson in order sets `startTime = cursor`, `endTime = cursor + parseDurationMinutes(lesson.estimatedDuration, defaultDurationMinutes)`, then advances `cursor` by that duration plus `transitionMinutes`. **Nothing about a lesson's time is persisted — it is recomputed fresh on every render.** |
| Reflow already has a "locked" concept | `ScheduleBlock`/`LessonScheduleEntry` carry an optional `flexibilityState: 'locked' \| 'flexible' \| 'optional'`, and the reflow functions in `service.ts` already special-case `locked` blocks ("Locked block stays; move cursor past it"). **This field is synthetic today — it is never set from persisted data and never written back.** This is the natural hook for an explicit time override. |
| Lesson data | `features/plan/types.ts` `LessonTask`: `estimatedDuration?: LessonDuration` (a duration *bucket* — `'15min'\|'30min'\|'45min'\|'1hr'\|'custom'`), `plannedStartDate?`/`dueDate` (dates, not clock times). **No clock-time field exists.** |
| Schema | `db/schema.ts` `lessonTasks` (`db/schema.ts:275-290`+): no time-of-day columns. Confirmed via direct read — this matches the prior attempt's finding. |
| Edit entry point | `ScheduleTimeline.tsx`'s pencil icon calls `onEditLesson(id)` → `router.push('/lessons?editId=' + id)`, opening the planner's `LessonTaskForm` (`features/plan/front/components/LessonTaskForm.tsx`), which has no time fields today. |
| Existing tests | `features/schedule/__tests__/` (service + integration), `features/plan/__tests__/` for `LessonTaskForm`. |

### Consequence for the plan
Making a class's start/end time genuinely editable-and-persisted requires a **schema change** — nullable clock-time fields on `LessonTask`, since that's the source of truth for lessons. This plan adds them and wires `buildDailySchedule` to honor an explicit override when present, falling back to today's synthesized behavior otherwise (fully backward compatible — no existing lesson's displayed time changes unless a parent explicitly sets one).

---

## Source-of-truth decision
**Planner / Lesson Tasks** owns lessons, including their scheduling. The explicit time override is stored on `lesson_tasks`, not on the `schedule` feature — `schedule` remains presentation-only, reading the override the same way it already reads `estimatedDuration`. This matches the project's stated ownership rule (`schedule` synthesizes a *view*; it does not own lesson data) and requires no dashboard/seed workaround.

---

## Data / contract changes
- **Migration:** add `scheduled_start_time` (text, nullable, `HH:MM` 24-hour) and `scheduled_end_time` (text, nullable, `HH:MM`) to `lesson_tasks`. Nullable and additive — no backfill needed; existing rows are unaffected and continue to use synthesized times.
- **`LessonTask` type:** add `scheduledStartTime?: string` and `scheduledEndTime?: string`.
- **`buildDailySchedule`:** when a lesson has both `scheduledStartTime` and `scheduledEndTime` set, use them directly for that lesson's block (`startTime`/`endTime`/`durationMinutes` computed from the pair) and mark it `flexibilityState: 'locked'` (reusing the existing reflow special-case — a manually-timed lesson should not be silently moved by reflow). Cursor placement for *subsequent* unset lessons continues from `max(cursor, override endTime + transitionMinutes)` so a manual time doesn't cause later lessons to overlap it.
- **Validation:** reject `scheduledEndTime <= scheduledStartTime` at the API boundary with a clear error.

---

## UI plan
- `LessonTaskForm.tsx` gains two optional time inputs ("Start time" / "End time"), clearing both is allowed (reverts to synthesized behavior). Follows existing form-field patterns in that file (labeled inputs, inline validation error).
- No new interaction pattern: this is a field addition to the existing edit form reachable from the schedule pencil icon, consistent with `ui-style-guide`'s "edit inline via the existing record form" default — no new modal introduced here (distinct from G7c's Dashboard popup, which was a plan-approved exception for a different surface).

---

## Acceptance criteria
1. On `/plan/schedule`, editing a lesson and setting an explicit start and end time, then saving, shows that lesson at exactly those times on the timeline.
2. Reloading the page preserves the manually-set times (persisted, not resynthesized).
3. A lesson with no explicit time continues to display a synthesized time exactly as before (regression: no existing schedule changes).
4. A manually-timed lesson does not get moved by reflow (`flexibilityState: 'locked'` semantics already implemented in `service.ts`).
5. Subsequent unset lessons on the same day schedule after the manually-timed lesson's end time, without overlapping it.
6. Setting an end time at or before the start time is rejected with a clear inline error; nothing is saved.
7. Clearing both time fields on a previously-overridden lesson reverts it to synthesized timing.

---

## Testing plan (failing first)
- **Repository/unit:** `buildDailySchedule` given a lesson with `scheduledStartTime`/`scheduledEndTime` set places it at exactly those times, marks it `locked`, and pushes the cursor for later lessons past its end + transition; a lesson without them is unaffected (regression case using existing fixtures).
- **API:** creating/updating a `LessonTask` with `scheduledStartTime`/`scheduledEndTime` persists and returns them; `endTime <= startTime` returns a 400 with a clear message.
- **Integration:** `LessonTaskForm` — setting both times and submitting calls update with them; clearing both submits `null`/`undefined` for both; end-before-start shows an inline error and does not submit.
- **Integration:** `ScheduleTimeline`/`SchedulePage` — a lesson with an override renders at the override times; one without does not change from current synthesized behavior.

---

## Files
- `db/schema.ts` + new migration (`db/migrations/`)
- `features/plan/types.ts` (`LessonTask` fields)
- `features/plan/server/repository.ts` (persist the two new fields on create/update)
- `features/plan/api/routes/*` (whichever route(s) handle lesson create/update — confirm exact file at implementation time)
- `features/schedule/server/service.ts` (`buildDailySchedule` override + cursor logic)
- `features/plan/front/components/LessonTaskForm.tsx` (two new optional inputs + validation)
- Tests: `features/schedule/__tests__/server/service.test.ts` (or existing equivalent), `features/plan/__tests__/...` for the form and API route.

---

## Out of scope
- Changing `estimatedDuration`'s bucket-enum model for lessons that don't use an explicit override.
- Any change to `ScheduleSettings`'s global `startTime`/`transitionMinutes` (household-level defaults) — this plan is per-lesson only.
- Reflow algorithm changes beyond honoring the existing `locked` special-case with real data now flowing into it.

---

## Manual QA
Walk acceptance criteria 1–7 above against a seeded local view (or prod, given dev DB is gone — see execution notes) after implementation.

## Branch / execution note
This is a single, small, schema-touching phase. Given the dev database is gone, migration must target **PRODUCTION** directly via `DATABASE_URL_PROD` (mirroring `scripts/migrate-prod.ts`), the same policy already established and used successfully for migrations `0033` and `0034` in the G1–G7 batch. Rollback point: `backups/prod-2026-07-17T00-58-42/` (pre-existing, still valid — migrations `0033`/`0034` were additive/nullable and don't need to be un-done for this plan's rollback to make sense). Gated — requires explicit approval before `db:migrate` runs against prod.
