# Wave 12 — Live schedule / classroom timing workflow

**Source:** FB-005
**Depends on:** Waves 0, 4, 5 complete

---

## Changes

- New `features/schedule/` directory.
- **Now & Next preview card** on Today dashboard: current lesson block, time remaining, next block title.
- New route `/plan/schedule` → dedicated Schedule/Classroom screen.
- Visual daily schedule: current block, start/end times, current time indicator, live time-fill bar, upcoming blocks.
- **Pause Day / Resume Day** workflow.
- **Dynamic Day Reflow** actions: shift remaining, swap order, pull independent work forward, push teacher-led work later, compress day, extend day, convert to light day, reschedule unfinished.
- **Instruction mode** per block: Teacher-led, Guided, Independent, Shared/family, Tutor-led, Co-op, Async/self-paced.
- **Flexibility state** per block: Locked, Flexible, Optional.
- **Independent work bank**: pool of flexible lessons that can be pulled forward.
- **Transition/break time** between blocks with configurable defaults; protected break types (lunch, prayer, Jumu'ah, toddler care).
- **Schedule templates**: Standard Monday, Co-op Tuesday, Light Friday, Ramadan schedule, Hifz intensive day.

---

## TDD

**Unit tests (`features/schedule/__tests__/api/`):**
- `buildDailySchedule(lessons, settings)` → returns blocks with correct start/end times accounting for transition time between them.
- `buildDailySchedule` with a 30-min lesson followed by 10-min transition → next block starts 40 min after previous start.
- `reflow('compress', schedule, currentTime)` → remaining blocks are re-timed to start closer together.
- Lesson with `flexibilityState: 'locked'` → not moved by any reflow action.

**Integration tests (`features/schedule/__tests__/integration/`):**
- Render `NowNextCard` with 2 scheduled blocks → assert current lesson title and next lesson title both visible.
- Click "Pause Day" → assert reflow options panel appears.
- Click "Pull independent work forward" → assert an Optional/Independent lesson moves to next position.
- Render `SchedulePage` with 3 blocks → assert all 3 blocks visible with start times.

**Playwright (`e2e/planner.spec.ts`):**
- Navigate to `/plan/schedule` → assert time-fill progress indicator visible for current/next block.
- Assert "Pause Day" button is present.

---

## File index

| File | Change |
|------|--------|
| `features/schedule/` | New feature directory |
| `features/schedule/types.ts` | ScheduleBlock, DaySchedule, ReflowAction, InstructionMode, FlexibilityState |
| `features/schedule/server/service.ts` | `buildDailySchedule()`, `reflow()`, `getScheduleTemplates()` |
| `features/schedule/front/pages/SchedulePage.tsx` | Visual daily schedule page |
| `features/schedule/front/components/ScheduleBlock.tsx` | Block card with live time fill |
| `features/schedule/front/components/NowNextCard.tsx` | Today dashboard preview |
| `features/schedule/front/components/ReflowPanel.tsx` | Reflow action panel |
| `features/schedule/front/components/TransitionBlock.tsx` | Break/transition display between lessons |
| `features/dashboard/front/pages/Dashboard.tsx` | Surface NowNextCard on Today |
| `app/(shell)/plan/schedule/page.tsx` | New route |
| `app/api/[...slug]/route.ts` | Add `schedule` slug case |
| `features/schedule/api/router.ts` | New router |
| `features/schedule/__tests__/api/schedule.test.ts` | New |
| `features/schedule/__tests__/integration/SchedulePage.test.tsx` | New |
| `e2e/planner.spec.ts` | Schedule route + Now & Next assertions |
