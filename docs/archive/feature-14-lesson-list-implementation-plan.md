# Feature 14 — Daily/Weekly Lesson List
## Implementation Plan

**Status:** Ready for implementation  
**Wave:** 1B — Planning Spine  
**T-shirt size:** S  
**Data layer:** In-memory store (consistent with Features 1–13)  
**Prerequisites:** Features 9 (child selector) and 13 (lesson/task store) built and passing

---

## 1. Locked product decisions

These decisions are final. Claude Code must not re-open them.

- **Default date range:** The current calendar week — Monday through Sunday. Not today-only. Not rolling 7 days. The week is the natural planning unit for a homeschool parent.
- **"Today" is highlighted** within the week view — visually distinct from other days, not a separate view.
- **Week navigation:** Parent can move forward and backward one week at a time. No jumping to arbitrary dates in this feature.
- **Skipped lessons are shown by default.** They are visually de-emphasized (muted, faded opacity) but never hidden. A parent needs to see what was skipped, not have it silently disappear.
- **Completed lessons stay in place.** They are faded with a checkmark. No strikethrough (hard to read). No separate "completed" section (adds layout complexity, breaks the day's visual shape).
- **Lesson order within a day:** Sorted by `subjectId` alphabetically for MVP. No drag-to-reorder in this feature.
- **Child scoping:** The lesson list always scopes to the currently selected child from the child selector (#9). It never shows all children at once.
- **Empty day:** Show an empty state per day — not a collapsed or hidden day. Every weekday in the week is always visible.
- **No status changes in this feature.** Status editing is Feature 15. This feature is read-only display. Lessons are not interactive in this view.
- **No filtering or search.** The list shows the full week for the selected child. Filtering is not in scope.
- **Leave the existing dashboard Task model alone.** Do not reference it. Do not replace it.

---

## 2. Scope

### In scope
- Weekly lesson list page at `/lessons/week` or as the primary view on `/lessons`
- Week grid — 5 weekdays (Mon–Fri), each showing that day's lessons for the selected child
- Week navigation — previous week / next week controls
- Today highlight — current day visually distinct
- Lesson card display — title, subject name, status badge
- Empty day state — each empty day shows copy, not a collapsed row
- Dashboard "Today" card — a read-only list of today's lessons for the selected child, pulled from the same data source

### Out of scope — do not build these
- Status editing or status changes (Feature 15)
- Move/reschedule (Feature 16)
- Recurring lesson display logic (Feature 17)
- Add lesson from this view (that lives on the add form from Feature 13)
- Filter, search, or sort controls
- Weekend days (Saturday, Sunday)
- Multi-child view
- Drag-to-reorder
- Calendar month view
- Any modification to the existing dashboard Task model

---

## 3. Existing codebase patterns to follow

- `app/` stays thin — routing only
- Business logic and UI live under `features/`
- The lesson list reads from the existing `lesson-tasks` service — no new store, no new service
- The child selector state from Feature 9 is the source of truth for which child is shown — do not create a second child state
- API responses use the existing response envelope
- Week date calculation happens on the client, not the server

---

## 4. Data flow

No new data model. No new API endpoints. Feature 14 reads from the existing `/api/lesson-tasks` endpoint introduced in Feature 13.

### Query pattern

```
GET /api/lesson-tasks?childId={selectedChildId}&date={YYYY-MM-DD}
```

The client fetches one date at a time or fetches the full week and filters client-side. **Recommended approach: fetch the full week in one pass** — 5 separate requests (one per day) would create 5 loading states. Instead, fetch with `childId` only, then group results by date on the client for the current week.

```
GET /api/lesson-tasks?childId={selectedChildId}
→ filter client-side to dates within current week range
→ group by date
→ render day columns
```

If the lesson-tasks API does not yet support returning all lessons for a child without a date filter, that filter needs to be confirmed as supported before sprint. Check the Feature 13 implementation.

### Date calculation — client only

```typescript
// features/lesson-list/utils/week.ts

export function getCurrentWeekRange(today: Date): { start: Date; end: Date } {
  // Week starts Monday
  const day = today.getDay() // 0 = Sun, 1 = Mon ... 6 = Sat
  const diff = day === 0 ? -6 : 1 - day // adjust to Monday
  const monday = new Date(today)
  monday.setDate(today.getDate() + diff)
  monday.setHours(0, 0, 0, 0)

  const friday = new Date(monday)
  friday.setDate(monday.getDate() + 4)
  friday.setHours(23, 59, 59, 999)

  return { start: monday, end: friday }
}

export function formatDateKey(date: Date): string {
  // Returns YYYY-MM-DD in local time — never UTC
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })
}
```

**Never use `.toISOString()` for date display or comparison.** `toISOString()` converts to UTC, which produces the wrong date for families in timezones west of UTC after 5–7pm. All date math uses local time.

---

## 5. File structure

### New files

```
features/lesson-list/
  types.ts
  utils/
    week.ts                        // date math — getCurrentWeekRange, formatDateKey, getWeekDays
  front/
    pages/
      LessonListPage.tsx           // main weekly view
    components/
      WeekNav.tsx                  // previous / current / next week navigation
      DayColumn.tsx                // one day's lessons
      LessonCard.tsx               // single lesson display — read only
      TodayCard.tsx                // dashboard widget: today's lessons only
    services/
      api.ts                       // thin wrapper over existing lesson-tasks API
  __tests__/
    week.test.ts                   // unit tests for date math
    LessonListPage.test.tsx
    DayColumn.test.tsx
    LessonCard.test.tsx
    TodayCard.test.tsx
```

### Files to modify

```
app/(shell)/lessons/page.tsx        — render LessonListPage (may already exist from Feature 13)
features/dashboard/                 — add TodayCard widget to dashboard shell
features/layout/front/components/Header.tsx  — confirm Lessons nav exists (added in Feature 13)
```

Do not create a new API router. Do not create a new store. Do not create a new service. This feature is purely a read layer over Feature 13's data.

---

## 6. Component specification

### LessonListPage

Top-level page component. Owns the week state (current week start date). Fetches all lessons for the selected child and passes them down.

```
Props: none (reads child from shared child selector context/store)

State:
  weekStart: Date         — Monday of the currently displayed week
  lessons: LessonTask[]   — all lessons for the selected child (unfiltered)
  loading: boolean
  error: string | null

Behavior:
  - On mount: calculate current week, fetch lessons for selected child
  - On child change: re-fetch
  - On week navigation: update weekStart, re-fetch (or re-filter if full dataset cached)
  - Groups lessons by YYYY-MM-DD date key
  - Passes each day's lessons to DayColumn
```

Layout (desktop):

```
[Week navigation — "< May 5–9" / "May 12–16 >" ]
[Monday]  [Tuesday]  [Wednesday]  [Thursday]  [Friday]
  card      card        (empty)      card       card
  card                              card
```

Layout (mobile):

```
[Week navigation]
[Monday — today]
  card
  card
[Tuesday]
  (empty)
[Wednesday]
  card
...
```

Mobile renders as a vertical stack of days, not a grid.

### WeekNav

```
Props:
  weekStart: Date
  onPrevWeek: () => void
  onNextWeek: () => void

Display:
  "< [Mon DD] – [Fri DD, YYYY] >"
  Example: "< May 12 – May 16, 2025 >"

Behavior:
  - No future week limit in MVP
  - No past week limit in MVP
  - "Today" button appears when not on current week — jumps back to current week
```

### DayColumn

```
Props:
  date: Date
  lessons: LessonTask[]
  isToday: boolean

Display:
  Day heading: "Mon 12" (short weekday + date number)
  If isToday: heading has visual highlight (background, border, or color treatment)
  Lessons: rendered as LessonCard list
  If lessons.length === 0: empty state copy (see Section 8)
```

### LessonCard

Read-only. No interactions in this feature.

```
Props:
  lesson: LessonTask
  subjectName: string    // resolved from subjectId — do not display raw ID

Display:
  Title: full title, wraps if long
  Subject: subject name, smaller/secondary
  Status badge:
    not_started  → no badge or subtle "To do" label
    completed    → checkmark icon + "Done" label, card faded (opacity ~60%)
    skipped      → "Skipped" label, card faded (opacity ~60%), muted color

Visual rules:
  - completed and skipped cards remain in their position — never moved or hidden
  - Do not use strikethrough on any text
  - Status is display-only — no click handler on the card in this feature
```

### TodayCard

Dashboard widget. Shows only today's lessons for the selected child. Intended to be composed into the dashboard shell from Feature 8.

```
Props:
  childId: string
  today: string    // YYYY-MM-DD, passed in — not calculated inside component

Display:
  Heading: "Today — [Day, Month DD]"  e.g. "Today — Monday, May 12"
  Lesson list: title + status badge for each lesson today
  Empty state: "No lessons scheduled for today."
  Loading state: skeleton or spinner
  Error state: "Could not load today's lessons."

Behavior:
  - Fetches GET /api/lesson-tasks?childId={childId}&date={today}
  - Read-only — no interactions
  - Refreshes when childId changes
```

---

## 7. API client

Thin wrapper. No new endpoints. No new logic.

```typescript
// features/lesson-list/front/services/api.ts

import type { LessonTask } from '@/features/lesson-tasks/types'

export async function fetchLessonsForChild(childId: string): Promise<LessonTask[]> {
  const res = await fetch(`/api/lesson-tasks?childId=${childId}`)
  const body = await res.json()
  if (!res.ok || body.status === 'error') {
    throw new Error(body.message ?? 'Failed to load lessons')
  }
  return body.data
}

export async function fetchLessonsForToday(childId: string, date: string): Promise<LessonTask[]> {
  const res = await fetch(`/api/lesson-tasks?childId=${childId}&date=${date}`)
  const body = await res.json()
  if (!res.ok || body.status === 'error') {
    throw new Error(body.message ?? 'Failed to load lessons')
  }
  return body.data
}
```

---

## 8. Empty and edge state copy

| Context | Copy |
|---|---|
| Day with no lessons | "Nothing scheduled." |
| Full week with no lessons for this child | "No lessons this week. Add lessons to get started." |
| No child selected | "Select a child to see their lessons." |
| Today card — no lessons today | "No lessons scheduled for today." |
| Loading | Spinner or skeleton — no copy |
| Error | "Could not load lessons. Please refresh." |

---

## 9. Test plan

Write tests **before** implementation. Follow this order:

1. Date util unit tests → implement utils → tests pass
2. Integration tests (failing) → implement components → tests pass

### Unit tests — week.ts

```
getCurrentWeekRange
  ✓ returns Monday–Friday for a Wednesday input
  ✓ returns correct Monday when today is Monday
  ✓ returns correct Monday when today is Friday
  ✓ returns correct Monday when today is Sunday
  ✓ start date is midnight local time
  ✓ end date is end of Friday local time

formatDateKey
  ✓ returns YYYY-MM-DD in local time
  ✓ does not use UTC (regression: test with a date that differs UTC vs local)

getWeekDays
  ✓ returns 5 dates
  ✓ first date is the weekStart
  ✓ last date is Friday of that week
  ✓ dates are consecutive
```

### Integration tests — LessonListPage

```
Loading state
  ✓ shows loading indicator while fetching

Error state
  ✓ shows error message on API failure

No child selected
  ✓ shows "select a child" message, no week grid

Empty week
  ✓ shows 5 day columns
  ✓ each day shows empty state copy

Populated week
  ✓ lessons appear under correct day column
  ✓ lessons from other weeks do not appear
  ✓ completed lessons are faded, show checkmark
  ✓ skipped lessons are faded, show skipped label
  ✓ not_started lessons show no status badge or "To do"
  ✓ today's day column is visually highlighted
  ✓ subject name is shown, not raw subjectId

Week navigation
  ✓ clicking next week shows the following week's lessons
  ✓ clicking prev week shows the prior week's lessons
  ✓ "Today" button appears when not on current week
  ✓ clicking "Today" returns to current week

Child change
  ✓ changing selected child re-fetches and shows that child's lessons
  ✓ previous child's lessons are not shown
```

### Integration tests — LessonCard

```
not_started
  ✓ renders title and subject name
  ✓ no strikethrough
  ✓ no fading
  ✓ no click handler that changes status

completed
  ✓ renders faded
  ✓ shows checkmark and "Done"
  ✓ no strikethrough
  ✓ stays in position (not moved to bottom)

skipped
  ✓ renders faded
  ✓ shows "Skipped" label
  ✓ stays in position
```

### Integration tests — TodayCard

```
Loading
  ✓ shows loading state

Error
  ✓ shows error copy

Empty
  ✓ shows "No lessons scheduled for today."

Populated
  ✓ shows lessons for today only
  ✓ shows title and status badge for each
  ✓ does not show lessons from other dates

Child change
  ✓ re-fetches when childId prop changes
```

### Integration tests — WeekNav

```
  ✓ displays formatted week range e.g. "May 12 – May 16, 2025"
  ✓ prev button calls onPrevWeek
  ✓ next button calls onNextWeek
  ✓ "Today" button hidden when on current week
  ✓ "Today" button visible when on a different week
```

---

## 10. Implementation sequence

Follow this order exactly.

1. **Confirm plan approved**
2. **Write failing date util tests** — `features/lesson-list/__tests__/week.test.ts`
3. **Implement date utils** — until all util tests pass
4. **Write failing integration tests** — LessonListPage, LessonCard, TodayCard, WeekNav, DayColumn
5. **Implement components and API client** — until all integration tests pass
6. **Wire TodayCard into dashboard shell**
7. **Refactor** — clean up after green
8. **Run `npm run build`** — zero errors
9. **Run `npm test`** — zero failures
10. **Screenshot** — weekly view populated, today highlighted, at least two days with lessons
11. **Commit and open PR**

---

## 11. Definition of done

- [ ] Date util unit tests written before implementation
- [ ] Integration tests written before UI implementation
- [ ] Weekly view shows Mon–Fri for the selected child
- [ ] Today is visually highlighted
- [ ] Week navigation (prev/next) works correctly
- [ ] "Today" button returns to current week when on a different week
- [ ] Completed lessons: faded, checkmark, in place, no strikethrough
- [ ] Skipped lessons: faded, "Skipped" label, in place
- [ ] Empty days show copy — never hidden or collapsed
- [ ] Subject names shown — never raw `subjectId`
- [ ] Child selector change re-fetches lessons
- [ ] TodayCard widget wired into dashboard shell
- [ ] No status editing in this feature (that is Feature 15)
- [ ] No new API endpoints created
- [ ] No new store or service created
- [ ] All date math uses local time — never `.toISOString()` for display or comparison
- [ ] `npm run build` passes
- [ ] `npm test` passes
- [ ] Screenshot captured

---

## 12. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Timezone bug in date calculation | Unit tests explicitly check that `formatDateKey` produces local date, not UTC. Test with a date that differs between UTC and local. |
| Feature 13 API not supporting childId-only filter | Confirm before sprint. If missing, add the filter to the existing lesson-tasks service — that is a bug fix in Feature 13, not a new feature. |
| Subject name resolution — rendering raw subjectId | The component receives `subjectName` as a prop. The page resolves subject names from the subject store before passing to DayColumn. Do not resolve names inside LessonCard. |
| Status editing added prematurely | LessonCard has no click handler in this feature. Status editing is Feature 15. Reject any PR that adds status interactions here. |
| Scope creep into add-from-planner | The weekly view is read-only. Adding lessons is Feature 13's form. Do not add a "+ Add" button inside a day column in this feature. |
