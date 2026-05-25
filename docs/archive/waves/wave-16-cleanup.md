# Wave 16 — Code cleanup (post-review)

**Status: AWAITING APPROVAL — do not execute until reviewed with user**
**Source:** Wave 15 self code review findings B-1 through B-10
**Branch:** new branch from master, or continuation of `claude/fix-planner-bugs`

> Each item below is self-contained and can be executed independently.
> Ordered by severity (highest first). Items may be deselected before execution.

---

## Item 1 — Extract schedule pure functions out of `server/` (B-1) — HIGH

**Why:** `ScheduleNowNextCard.tsx` is a `'use client'` component that currently imports `reflow` from `features/schedule/server/service.ts`. If that server module ever gains a Next.js server-only import (e.g. `next/headers`, `@/lib/db`), the client bundle will fail to build.

**Change:**

1. Create `features/schedule/front/lib/schedule.ts` — move `toMinutes`, `fromMinutes`, `parseDurationMinutes`, `buildDailySchedule`, `reflow` into it. Export all.

2. Update `features/schedule/server/service.ts` — re-export from the lib (or keep `getScheduleTemplates` here alone since templates have no client use case today):

```typescript
// features/schedule/server/service.ts
export { buildDailySchedule, reflow } from '../front/lib/schedule'
export { getScheduleTemplates } from './templates' // move templates here
```

3. Update `ScheduleNowNextCard.tsx` — change import to:
```typescript
import { reflow } from '@/features/schedule/front/lib/schedule'
```

4. Update `features/schedule/__tests__/api/schedule.test.ts` — import path stays unchanged (service re-exports, so no change needed; or point directly at lib — either works).

**Files:**
- `features/schedule/front/lib/schedule.ts` — NEW (moved functions)
- `features/schedule/server/service.ts` — thin re-export shell
- `features/schedule/front/components/ScheduleNowNextCard.tsx` — update import
- `features/schedule/__tests__/api/schedule.test.ts` — no change (re-export keeps path valid)

**Tests:** Existing 8 unit tests + 6 integration tests must remain green. No new tests needed.

---

## Item 2 — Deduplicate `gregorianToHijri` and `HIJRI_MONTHS` (B-2) — MEDIUM

**Why:** Two copies of the same algorithm exist. A future correction (e.g. calendar epoch offset) would need to be applied twice and could silently diverge.

**Change:**

In `features/dashboard/front/components/IslamicDateDisplay.tsx`:

```typescript
// Remove local copies and replace with:
import { gregorianToHijri } from '@/features/islamic-calendar/front/lib/countdowns'
import { HIJRI_MONTHS } from '@/features/islamic-calendar/types'
```

Delete the local `function gregorianToHijri(...)` and `const HIJRI_MONTHS = [...]` from that file.

**Files:**
- `features/dashboard/front/components/IslamicDateDisplay.tsx` — remove duplicates, add imports

**Tests:** Existing `IslamicDateDisplay.test.tsx` must remain green. Run the full suite to confirm no regressions.

---

## Item 3 — Fix `app/(shell)/plan/schedule/page.tsx` to use API layer (B-3) — MEDIUM

**Why:** The page calls `getLessons` and `buildDailySchedule` directly, bypassing the API layer established for every other feature in the app. This couples the routing layer to the persistence layer and makes Postgres migration harder.

**Change:**

1. Create `features/schedule/front/services/api.ts`:

```typescript
import type { DaySchedule } from '@/features/schedule/types'
import type { ApiResponse } from '@/features/lib/types'

export const scheduleApi = {
  async getToday(childId?: string): Promise<ApiResponse<DaySchedule>> {
    const qs = childId ? `?childId=${childId}` : ''
    const res = await fetch(`/api/schedule/today${qs}`)
    return res.json()
  },
}
```

2. Rewrite `app/(shell)/plan/schedule/page.tsx` as a client component that calls `scheduleApi.getToday()` and renders `SchedulePage` with the fetched schedule (or a loading state).

**Files:**
- `features/schedule/front/services/api.ts` — NEW
- `app/(shell)/plan/schedule/page.tsx` — rewrite as client component

**Tests:** Add a unit test for `scheduleApi.getToday` (mock `fetch`).

---

## Item 4 — Include `SchoolYearProgress` in school-year API response (B-4) — MEDIUM

**Why:** `SchoolYearCard.tsx` re-implements progress calculation that already exists in the server service. Any logic change must be made twice.

**Change:**

1. Extend the GET `/api/school-years/active` response to include a `progress` field computed by `getSchoolYearProgress()`.

2. Update `SchoolYearCard.tsx` to use `progress` from props when provided; keep local `computeProgress` as an offline/test fallback with a `// TODO: remove after API always provides progress` comment.

3. Update `SchoolYearProgressCard.tsx` (the dashboard card that fetches active year) to also pass the `progress` prop down.

**Files:**
- `features/school-year/api/routes/school-years.ts` — add `progress` field to GET active response
- `features/school-year/front/components/SchoolYearCard.tsx` — use prop-provided progress first
- `features/dashboard/front/components/SchoolYearProgressCard.tsx` — pass `progress` prop

**Tests:** Update existing school-year API tests to assert `progress` field present in response.

---

## Item 5 — Remove `'use client'` from `SchedulePage` (B-5) — LOW

**Why:** `SchedulePage.tsx` has no hooks, no event handlers, no browser APIs. The `'use client'` directive is unnecessary and forces the whole component tree to be a client boundary unnecessarily.

**Change:** Remove `'use client'` from line 1 of `features/schedule/front/pages/SchedulePage.tsx`.

**Caveat:** If `ScheduleNowNextCard` is eventually embedded in `SchedulePage`, the client boundary will come from `ScheduleNowNextCard` automatically. No action needed there.

**Files:**
- `features/schedule/front/pages/SchedulePage.tsx` — remove `'use client'`

**Tests:** Existing 2 integration tests must pass unchanged.

---

## Item 6 — Replace emoji with text label in `SchedulePage` (B-6) — LOW

**File:** `features/schedule/front/pages/SchedulePage.tsx:41`

**Change:**
```tsx
// Before
<span className="text-xs text-slate-400" title="Locked">🔒</span>

// After
<span className="text-xs text-slate-400 font-medium">Locked</span>
```

**Files:**
- `features/schedule/front/pages/SchedulePage.tsx`

**Tests:** No test changes needed.

---

## Item 7 — Remove `isPaused: true` side effect from `reflow` service (B-7) — LOW

**Why:** The `reflow` function should be a pure transformation of the schedule's blocks. Setting `isPaused` is a UI concern that belongs in the component's state handler, not the service.

**Change:** In `features/schedule/server/service.ts` (or `front/lib/schedule.ts` after Item 1), change all return statements:
```typescript
// Before
return { ...schedule, blocks, isPaused: true }

// After
return { ...schedule, blocks }
```

In `ScheduleNowNextCard.tsx`, the `applyReflow` handler already calls `setSchedule(...)` — add `setIsPaused(true)` there (or merge `isPaused` into the schedule state via a separate setter).

**Files:**
- `features/schedule/server/service.ts` (or `front/lib/schedule.ts`) — remove `isPaused: true`
- `features/schedule/front/components/ScheduleNowNextCard.tsx` — manage `isPaused` in component

**Tests:** Update the `reflow` unit tests: remove any assertion that checks `isPaused === true` on the returned schedule. Those tests should be testing block-timing changes, not state management.

---

## Item 8 — Server-side guard for empty `learnerIds` in subjects (B-8) — LOW

**File:** `features/subjects/server/service.ts` — `createSubject`

**Change:**
```typescript
// Add near the top of createSubject:
const effectiveLearnerIds = data.learnerIds ?? (data.childId ? [data.childId] : [])
if (effectiveLearnerIds.length === 0) {
  throw new Error('At least one learner is required')
}
```

**Files:**
- `features/subjects/server/service.ts`

**Tests:** Add unit test: `createSubject({ name: 'X', learnerIds: [] })` → throws `'At least one learner is required'`.

---

## Item 9 — Rename `calculatePlannedDaysLocal` to `calculatePlannedDays` (B-9) — LOW

**Why:** The `Local` suffix incorrectly implies browser-only. The function is pure arithmetic and is already used by both client components and the server service.

**Change:** Rename the export in `features/school-year/front/lib/calculateDays.ts` and update all 4 call sites:

| File | Change |
|------|--------|
| `features/school-year/front/lib/calculateDays.ts` | Rename export |
| `features/school-year/server/service.ts` | Update import + call site |
| `features/school-year/front/components/SchoolYearForm.tsx` | Update import + call site |
| `features/school-year/front/components/SchoolYearCard.tsx` | Update import + call site |

**Tests:** No logic change; all existing school-year tests must remain green.

---

## Item 10 — Remove unused `StudentProfile` import from `Dashboard.tsx` (B-10) — LOW

**File:** `features/dashboard/front/pages/Dashboard.tsx:28`

**Change:** Delete:
```typescript
import type { StudentProfile } from '@/features/lib/types'
```

The type is used only by inference through `useContext_Dashboard()`. The explicit import adds noise and would be flagged by `tsc --noUnusedLocals`.

**Files:**
- `features/dashboard/front/pages/Dashboard.tsx`

**Tests:** No change needed. TypeScript build (`npm run build`) must remain clean.

---

## Execution order (if approved as a batch)

Items can be executed independently but the following order minimises merge conflicts:

1. Item 1 (extract schedule lib) — changes the most files; do first
2. Item 7 (remove `isPaused` side effect) — depends on Item 1 for correct file paths
3. Item 2 (deduplicate Hijri utils) — standalone
4. Item 4 (school-year progress in API) — standalone
5. Item 3 (schedule API layer) — depends on Item 1 (scheduleApi needs the lib)
6. Items 5, 6, 8, 9, 10 — trivial, any order

---

## Risk assessment

| Item | Risk of regression | Mitigated by |
|------|-------------------|--------------|
| 1 | Medium — import path change across 3 files | Re-export from server/service keeps existing test imports valid |
| 2 | Low — same algorithm, different import source | Existing IslamicDateDisplay tests |
| 3 | Low — new file, replaces thin page | Manual smoke test of `/plan/schedule` |
| 4 | Low — additive API field | Existing school-year API tests |
| 5–10 | Very low | Existing test suite |

**Total new tests this wave: ~8** (items 1, 3, 4, 8 each add ≤2 tests).
