# Wave 15 — Gap fixes, Playwright E2E, and self code review

**Branch:** `claude/fix-planner-bugs`
**Depends on:** Waves 0–12 complete
**Author note:** This wave closes three known gaps left open at end of Wave 12, adds the missing Playwright coverage, and documents a thorough self review of waves 8–12 for external inspection.

---

## Part A — Known gaps to fix

### Gap 1 — `ScheduleNowNextCard` not wired into the Dashboard

**Problem:** Wave 12 created `features/schedule/front/components/ScheduleNowNextCard.tsx` but never surfaced it on the Today dashboard. `Dashboard.tsx` still shows the original lightweight `NowNextCard` from `features/dashboard/front/components/`. The schedule-aware card with Pause Day / reflow actions is unreachable from the UI.

**Fix:** In `features/dashboard/front/pages/Dashboard.tsx`, replace the import and usage of the old `NowNextCard` with `ScheduleNowNextCard`. The new card requires a `schedule: DaySchedule` and a `currentTime: string` prop. Compute both on the client side:

```tsx
// compute once per render (client-side, no API needed — same pattern as Islamic countdowns)
const todaySchedule = useMemo(() => {
  // NowNextCard already fetches lessons via plannerApi — re-use that data
  // or call buildDailySchedule with already-fetched weeklyLessons
}, [weeklyLessons])
```

Because `weeklyLessons` is already fetched in Dashboard for `WeeklyActivity`, pass the filtered today-lessons into `buildDailySchedule`. This avoids a second API call.

**Files to change:**
| File | Change |
|------|--------|
| `features/dashboard/front/pages/Dashboard.tsx` | Replace `NowNextCard` import/usage with `ScheduleNowNextCard`; compute `todaySchedule` from already-fetched lessons |
| `features/dashboard/front/components/NowNextCard.tsx` | Retain — used independently in tests; no change needed |

**Tests to add:** Extend `features/dashboard/__tests__/integration/` to assert that `ScheduleNowNextCard` renders on the Today tab (basic presence check, mocked schedule data).

---

### Gap 2 — Islamic reminder settings not wired to Dashboard

**Problem:** `IslamicRemindersSection` in Settings stores toggle state in local React state only. It resets on every page refresh, and the Dashboard's `IslamicCalendarCard` array ignores it entirely — all cards always render.

**Fix:** Use `localStorage` to persist the enabled map under key `islamicReminderSettings`. Read it in both the Settings component and the Dashboard. Provide a thin custom hook `useIslamicReminderSettings()` in `features/islamic-calendar/front/lib/useIslamicReminderSettings.ts` that:
- Initialises from `localStorage` (all enabled by default if key absent)
- Exposes `{ enabled: Record<IslamicEventName, boolean>; toggle(name): void }`
- Persists to `localStorage` on every toggle

Then:
- `IslamicRemindersSection` replaces its local `useState` with this hook
- `Dashboard.tsx` imports the hook and filters `topCountdowns` by `enabled[c.name]` before rendering cards

**Files to change:**
| File | Change |
|------|--------|
| `features/islamic-calendar/front/lib/useIslamicReminderSettings.ts` | New hook |
| `features/settings/front/components/IslamicRemindersSection.tsx` | Use new hook instead of `useState` |
| `features/dashboard/front/pages/Dashboard.tsx` | Import hook, filter countdowns by `enabled[c.name]` |

**Tests to add:**
- Unit test for `useIslamicReminderSettings`: default all enabled, toggle persists, reload restores.
- Integration test for `IslamicRemindersSection`: toggling off "Ramadan" persists the change (mock localStorage).

---

### Gap 3 — Playwright E2E tests for Waves 11 and 12

**Problem:** Both wave plans specified Playwright assertions that were not written.

**Wave 11 spec** (`e2e/dashboard.spec.ts`):
> Navigate to Today → assert at least one Islamic calendar indicator is visible (any upcoming event).

**Wave 12 spec** (`e2e/planner.spec.ts`):
> Navigate to `/plan/schedule` → assert time-fill progress indicator visible for current/next block.
> Assert "Pause Day" button is present.

**Fix:** Add assertions to the existing E2E suite.

```typescript
// e2e/dashboard.spec.ts — add:
test('Today shows at least one Islamic calendar countdown', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('islamic-calendar-card').first()).toBeVisible()
})

// e2e/planner.spec.ts — add:
test('Schedule page renders blocks and Pause Day button', async ({ page }) => {
  await page.goto('/plan/schedule')
  await expect(page.getByTestId('schedule-page')).toBeVisible()
  await expect(page.getByRole('button', { name: /pause day/i })).toBeVisible()
})
```

---

## Part B — Self code review (Waves 8–12)

> This review is written for external inspection. Each finding is graded **Critical / High / Medium / Low** by severity.

---

### B-1. Server module imported in `'use client'` component — HIGH

**File:** `features/schedule/front/components/ScheduleNowNextCard.tsx:5`

```typescript
// ❌ 'use client' component importing from server/
import { reflow } from '@/features/schedule/server/service'
```

`reflow` is a pure function (no Node-only dependencies today), so this does not cause a runtime crash in the current codebase. However, naming the module `server/service.ts` signals that it may receive server-only imports in future (e.g., database calls). If that happens, Next.js will throw a build error: *"You're importing a component that needs `next/headers`..."*.

**Recommendation (Wave 16):** Extract the pure calculation functions (`buildDailySchedule`, `reflow`, `parseDurationMinutes`, time helpers) into `features/schedule/front/lib/schedule.ts`. The `server/service.ts` file can then import from that lib for any server-side orchestration. `ScheduleNowNextCard` imports from the lib. This mirrors the correct pattern already established in `features/school-year/front/lib/calculateDays.ts` and `features/islamic-calendar/front/lib/countdowns.ts`.

---

### B-2. `gregorianToHijri` and `HIJRI_MONTHS` duplicated — MEDIUM

**Files:**
- `features/dashboard/front/components/IslamicDateDisplay.tsx` — owns its own local copy of both `gregorianToHijri` and `HIJRI_MONTHS`
- `features/islamic-calendar/front/lib/countdowns.ts` — exports `gregorianToHijri`
- `features/islamic-calendar/types.ts` — exports `HIJRI_MONTHS`

The canonical versions now live in the `islamic-calendar` feature. `IslamicDateDisplay` predates that feature and was not updated.

**Recommendation (Wave 16):** Update `IslamicDateDisplay.tsx` to import `gregorianToHijri` from `@/features/islamic-calendar/front/lib/countdowns` and `HIJRI_MONTHS` from `@/features/islamic-calendar/types`. Delete the local copies. No behaviour change; one source of truth.

---

### B-3. `app/(shell)/plan/schedule/page.tsx` bypasses the API layer — MEDIUM

**File:** `app/(shell)/plan/schedule/page.tsx`

```typescript
// ❌ App page calling feature service functions directly, bypassing API
import { buildDailySchedule } from '@/features/schedule/server/service'
import { getLessons } from '@/features/plan/server/service'
```

The rest of the app routes data through the API layer (`/api/schedule/today` now exists precisely for this). Server components calling services directly couples the routing layer to the persistence layer, breaking the layering rule in CLAUDE.md and making the Postgres migration path harder (the page would need rewriting when `getLessons` becomes async).

**Recommendation (Wave 16):** Convert `app/(shell)/plan/schedule/page.tsx` to a thin client-side page that fetches `/api/schedule/today` via a new `scheduleApi` front service, consistent with all other pages in the app.

---

### B-4. `SchoolYearCard` duplicates server-side progress calculation — MEDIUM

**File:** `features/school-year/front/components/SchoolYearCard.tsx:11–30`

`computeProgress()` re-implements the same logic as `getSchoolYearProgress()` in `features/school-year/server/service.ts`. Both iterate over school days and compute `dayNumber / totalDays`. Any bug fix or rule change must be applied in two places.

**Root cause:** `SchoolYearCard` takes a `SchoolYear` object as a prop and computes progress client-side because the API returns the year but not the progress object. The server-side `getSchoolYearProgress` function exists but is not called by the API route that populates the card.

**Recommendation (Wave 16):** Add `progress?: SchoolYearProgress` to the school-year API GET response. `SchoolYearCard` uses the server-computed value when provided and falls back to local computation only when absent (for offline/test scenarios). Long term: remove the local `computeProgress` function entirely.

---

### B-5. `SchedulePage` is `'use client'` but `app` page is a server component — LOW (architecture note)

**Files:** `features/schedule/front/pages/SchedulePage.tsx` (has `'use client'`), `app/(shell)/plan/schedule/page.tsx` (no directive — server component by default)

The server component passes `schedule` as a prop to the client component. This is valid Next.js App Router usage. However, combined with finding B-3 (direct service calls), the page currently does all data work server-side even though the component declares itself as a client component — the `useState` reflow logic in `ScheduleNowNextCard` would hydrate on the client with the server-provided initial data. This is architecturally fine but the `'use client'` on `SchedulePage` may be unnecessary if it has no interactivity; that interactivity lives in `ScheduleNowNextCard`.

**Recommendation (Wave 16):** Remove `'use client'` from `SchedulePage.tsx` (it has no hooks or browser APIs). Keep `ScheduleNowNextCard` as `'use client'`.

---

### B-6. Emoji used without user request — LOW

**File:** `features/schedule/front/pages/SchedulePage.tsx:41`

```tsx
<span className="text-xs text-slate-400" title="Locked">🔒</span>
```

CLAUDE.md rule: *"Only use emojis if the user explicitly requests it."*

**Recommendation (Wave 16):** Replace with a text label or an SVG icon.

---

### B-7. `reflow` always sets `isPaused: true` as a side effect — LOW

**File:** `features/schedule/server/service.ts` — all `reflow` branches return `{ ...schedule, isPaused: true }`.

`isPaused` was intended to reflect whether the user has paused the day. Setting it unconditionally on any reflow call means calling `reflow` programmatically (e.g., from a test) would also mark the day as paused. The caller should own this state transition.

**Recommendation (Wave 16):** Remove `isPaused: true` from the `reflow` return. Let `ScheduleNowNextCard` set `isPaused` via the click handler, not via the service.

---

### B-8. `SubjectForm` empty-learner guard is UI-only — LOW

**File:** `features/subjects/front/components/SubjectForm.tsx:239`

The submit button is disabled when `selectedLearnerIds.length === 0`. However, the server-side `createSubject` does not validate that `learnerIds` is non-empty. A direct POST to `/api/subjects` with `learnerIds: []` would create a subject with no enrolled learners and `childId = undefined`, potentially causing `childId`-based lookups to silently miss it.

**Recommendation (Wave 16):** Add a server-side guard in `features/subjects/server/service.ts`: `if (!data.learnerIds?.length && !data.childId) throw new Error('At least one learner is required')`.

---

### B-9. `calculatePlannedDaysLocal` naming misleads — LOW

**File:** `features/school-year/front/lib/calculateDays.ts`

The `Local` suffix implies browser-only, but the function is also imported by the server service (`features/school-year/server/service.ts`). It is purely arithmetic — no browser APIs — so the suffix is misleading.

**Recommendation (Wave 16):** Rename to `calculatePlannedDays` (remove `Local`). Update all call sites. Three locations: the lib file itself, server service, SchoolYearForm, SchoolYearCard.

---

### B-10. `StudentProfile` import in `Dashboard.tsx` is technically unused as an explicit type — LOW

**File:** `features/dashboard/front/pages/Dashboard.tsx:28`

```typescript
import type { StudentProfile } from '@/features/lib/types'
```

`studentProfiles` in the component is typed by inference from `useContext_Dashboard()`. The `StudentProfile` type is passed as `children={studentProfiles}` to child components, but the explicit import is not used in any local type annotation. TypeScript will not error (the import is a re-export of the type and is used indirectly), but it adds noise and `tsc --noUnusedLocals` would flag it.

**Recommendation (Wave 16):** Remove the explicit import. The type flows through via the hook's return type.

---

## Part C — Summary table

| ID | Severity | File | Issue | Action |
|----|----------|------|-------|--------|
| B-1 | HIGH | `ScheduleNowNextCard.tsx` | `server/` import in `'use client'` component | Extract pure fns to `front/lib/schedule.ts` |
| B-2 | MEDIUM | `IslamicDateDisplay.tsx` | Duplicate `gregorianToHijri` + `HIJRI_MONTHS` | Import from `islamic-calendar` feature |
| B-3 | MEDIUM | `app/(shell)/plan/schedule/page.tsx` | API layer bypassed; direct service calls | Use `scheduleApi` front service |
| B-4 | MEDIUM | `SchoolYearCard.tsx` | Duplicate progress calculation vs server service | Include `progress` in API response |
| B-5 | LOW | `SchedulePage.tsx` | Unnecessary `'use client'` | Remove directive |
| B-6 | LOW | `SchedulePage.tsx` | Emoji without user request | Replace with text/SVG |
| B-7 | LOW | `schedule/server/service.ts` | `reflow` unconditionally sets `isPaused: true` | Remove side effect from service |
| B-8 | LOW | `subjects/server/service.ts` | No server-side guard for empty `learnerIds` | Add validation |
| B-9 | LOW | `calculateDays.ts` | Misleading `Local` suffix | Rename to `calculatePlannedDays` |
| B-10 | LOW | `Dashboard.tsx` | Unused explicit `StudentProfile` import | Remove import |

---

## TDD plan for Wave 15

**Unit tests:**
- `useIslamicReminderSettings`: defaults all enabled; `toggle('Ramadan')` → `enabled.Ramadan === false`; persists across hook re-initialisation (mock `localStorage`)

**Integration tests:**
- `IslamicRemindersSection`: unchecking "Ramadan" calls `toggle`; component re-renders with checkbox unchecked
- `Dashboard` (Today tab): when `enabled.Ramadan === false`, no card with text matching `/Ramadan/` is rendered

**E2E (Playwright):**
- `e2e/dashboard.spec.ts`: Today → at least one `data-testid="islamic-calendar-card"` visible
- `e2e/planner.spec.ts`: `/plan/schedule` → `data-testid="schedule-page"` visible; Pause Day button present

---

## File index

| File | Change |
|------|--------|
| `features/islamic-calendar/front/lib/useIslamicReminderSettings.ts` | New hook |
| `features/islamic-calendar/__tests__/api/useIslamicReminderSettings.test.ts` | New unit tests |
| `features/settings/front/components/IslamicRemindersSection.tsx` | Use hook |
| `features/settings/__tests__/integration/SettingsPage.test.tsx` | Add reminder toggle test |
| `features/dashboard/front/pages/Dashboard.tsx` | Filter countdowns by enabled; replace NowNextCard |
| `features/dashboard/__tests__/integration/` | Add ScheduleNowNextCard presence test |
| `e2e/dashboard.spec.ts` | Islamic calendar indicator assertion |
| `e2e/planner.spec.ts` | Schedule page + Pause Day assertion |
