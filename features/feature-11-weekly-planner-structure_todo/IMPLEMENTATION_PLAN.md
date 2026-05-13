# Feature 11 — Weekly Planner Structure — Implementation Plan

**STATUS:** Ready for development

**Epic:** Planner · **Wave:** Wave 1B · **T-shirt size:** M

---

## Implementation Waves (Scope & Token Optimization)

### Wave 1: Feature internals (`features/planner/` only)

Create all new files under `features/planner/` including types, server (store/seed/service/ids), API routes, front components, and tests. Tests must fail first (TDD).

**Wave 1 deliverable:** All files in §7.1 created; all tests failing, then passing. No modifications to any other feature.

**Instruction to start Wave 1:**
> "Start Wave 1: Work only in `features/planner/`. Create all new files from §7.1. Write failing tests first (§6), then implement until green. Do not modify any files outside `features/planner/`."

---

### Wave 2: Cross-feature integration (existing files only)

Modify only these files to wire the planner into existing features:

```
features/household/types.ts                              — add weekStartDay field
features/household/server/service.ts                    — expose weekStartDay in getHouseholdProfile
features/household/api/routes/household-profile.ts    — handle weekStartDay in PUT payload
features/household/front/components/HouseholdSettings.tsx  — add week start selector UI
features/layout/front/components/Header.tsx             — add "Weekly" nav item
features/dashboard/front/pages/Dashboard.tsx            — remove "Weekly" tab
app/api/[...slug]/route.ts                              — add planner branch + import
```

**Wave 2 deliverable:** Household setting persists; Header nav works; API wiring complete. Wave 2 depends on Wave 1 passing all tests.

**Instruction to start Wave 2:**
> "Start Wave 2: Modify only the 7 files listed in §1 (Wave 2). Update household types/API/UI for weekStartDay, wire Header nav, remove Dashboard tab, add planner API route."

---

## 1. Locked Decisions

These decisions are frozen. Do not re-open them in a PR or agent chat.

1. **Layout approach.** Desktop weekly grid (7-day columns, child/subject rows) that flexes to mobile vertical collapsible sections (one section per day, lessons grouped inside).

2. **Navigation location.** Weekly planner is a **separate page** (not a dashboard tab), accessible via Header nav item labeled **"Weekly"** — same pattern as Settings page. The "Dashboard" tab remains; the planner is a sibling page.

3. **Week start setting.** Stored as a new field on `HouseholdProfile`: `weekStartDay: 'Monday' | 'Sunday'` (defaults to Monday). Household can change this in Settings. Both the Household UI (Settings page) and `PUT /api/household/profile` API must be updated to support this field.

4. **Filtering.** Multi-select filters for children and subjects. User can select:
   - Multiple children (default: all children in household)
   - Multiple subjects (default: all subjects for selected children)
   - Filter combination shows only lessons matching both criteria

5. **Weekends.** All 7 days displayed; weekends are visually de-emphasized (grayed out styling, smaller text, or similar). Not hidden or collapsed.

6. **Data readiness.** `lesson_task` is a new entity owned by the planner feature. The API is at `/api/planner/*`. Seed includes lessons for multiple children, subjects, and days of the week.

7. **Interaction model.** Read-only view in MVP — no drag/drop, no inline edits. Clicking a lesson cell does nothing (placeholder for future interaction).

8. **Empty week behavior.** Show a friendly, contextual message (e.g., "No lessons scheduled for this week — add one to get started!").

9. **Cross-feature dependency on household setting.** The planner calls `GET /api/household/profile` to retrieve the `weekStartDay` setting on page load. Household API update is a prerequisite.

---

## 2. Data Model: `lesson_task`

### 2.1 Type definition

```ts
// features/planner/types.ts
export interface LessonTask {
  id: string                    // 'lesson_<timestamp>_<n>'
  childId: string              // StudentProfile.id
  subjectId: string            // SubjectCourse.id
  householdId: string          // HouseholdProfile.id
  title: string                // e.g., "Math lesson 1", "Quran recitation"
  description?: string         // optional notes
  dueDate: string              // ISO yyyy-mm-dd
  isCompleted: boolean
  order: number                // sort order within the day/subject
  createdAt: string
  updatedAt: string
}
```

### 2.2 Seed data

Seed includes:
- 3–4 lessons per child for the current week
- Lessons distributed across 5–7 days (Monday–Sunday)
- Mix of subjects (Math, Reading, Quran, Science, etc.)
- At least one weekend lesson to test de-emphasis styling
- Example:
  - Adam: Math (Mon, Wed, Fri), Quran (Tue, Thu)
  - Khadijah: Reading (Mon, Wed, Fri), Science (Tue, Thu)
  - Zayd: Quran (Mon, Thu), English (Wed)

---

## 3. Architecture: Per-Feature Store + Service Contract

### 3.1 Folder layout

```
features/planner/
  types.ts                      # LessonTask interface
  server/
    ids.ts                      # generateLessonTaskId()
    store.ts                    # createMemoryStore<LessonTask>(SEED_LESSONS)
    seed.ts                     # seed lessons for all children/subjects
    service.ts                  # public exports: getLessons, getLessonTask, createLessonTask, updateLessonTask, etc.
  api/
    router.ts                   # handlePlannerRoute(slug, request)
    routes/
      lessons.ts                # GET /api/planner/lessons (with query filters)
      lesson.ts                 # GET /api/planner/lessons/:id (single lesson)
  front/
    components/
      WeeklyPlannerPage.tsx     # main page component
      WeekGrid.tsx              # desktop grid layout
      WeeklyList.tsx            # mobile vertical layout
      WeekNavigator.tsx         # prev/next buttons, date picker, jump to today
      ChildSubjectFilter.tsx    # multi-select filter UI
      EmptyWeekState.tsx        # friendly empty state message
    context/
      PlannerContext.tsx        # context for selected week, filters, lessons
    services/
      api.ts                    # browser HTTP client for planner endpoints
    pages/
      index.tsx                 # routed to app/(shell)/planner/page.tsx
  __tests__/
    api/
      lessons.test.ts           # unit tests for GET/POST handlers
    integration/
      WeeklyPlannerPage.test.tsx
      WeekGrid.test.tsx
      WeeklyList.test.tsx
      WeekNavigator.test.tsx
      ChildSubjectFilter.test.tsx
    fixtures/
      mockLessons.ts            # test seed data
```

### 3.2 Cross-feature reads

- **Planner** imports from **`features/children/server/service.ts`** → `getStudentProfiles()` to validate `childId` when creating lessons.
- **Planner** imports from **`features/subjects/server/service.ts`** → `getSubjects()` to validate `subjectId` and populate filter options.
- **Planner** imports from **`features/household/server/service.ts`** → `getHouseholdProfile()` to retrieve `weekStartDay` setting.
- **Planner browser UI** calls `GET /api/household/profile` to get `weekStartDay` on page load.
- **Planner browser UI** calls `GET /api/children` and `GET /api/subjects` to populate filter dropdowns.

---

## 4. REST API Surface

### 4.1 New branch in `app/api/[...slug]/route.ts`

Add immediately after the `children` branch (around line 18):

```ts
if (slug[0] === 'planner') {
  return await handlePlannerRoute(slug.slice(1), request)
}
```

Add the import at the top:

```ts
import { handlePlannerRoute } from '@/features/planner/api/router'
```

### 4.2 Planner API endpoints

| Method | Path | Query/Body | Response |
|--------|------|-----------|----------|
| GET | `/api/planner/lessons` | `?week=YYYY-MM-DD&childIds=X,Y&subjectIds=A,B` | `ApiResponse<LessonTask[]>` |
| GET | `/api/planner/lessons/:id` | — | `ApiResponse<LessonTask>` |
| POST | `/api/planner/lessons` | `{ childId, subjectId, title, dueDate, description? }` | `ApiResponse<LessonTask>` |
| PUT | `/api/planner/lessons/:id` | partial `LessonTask` | `ApiResponse<LessonTask>` |
| PATCH | `/api/planner/lessons/:id/complete` | — | `ApiResponse<LessonTask>` |

**Query parameter notes:**
- `week` is a Monday ISO date (YYYY-MM-DD) representing the start of the week. Backend returns all lessons for that 7-day span.
- `childIds` and `subjectIds` are comma-separated and optional; if omitted, all lessons for that week are returned.

---

## 5. Household Profile Changes

### 5.1 Update `HouseholdProfile` type

In `features/household/types.ts`, add:

```ts
export interface HouseholdProfile {
  // ... existing fields ...
  weekStartDay: 'Monday' | 'Sunday'  // defaults to 'Monday'
}
```

### 5.2 Household API update

- **Existing:** `PUT /api/household/profile` updates name, description, etc.
- **New:** Same endpoint now accepts `weekStartDay` in the request body and updates it.
- Response envelope includes the updated `HouseholdProfile` with `weekStartDay`.

### 5.3 Household UI update

In `features/household/front/components/HouseholdSettings.tsx` (or similar), add:
- A dropdown or radio button group for "Week Starts On" with options "Monday" and "Sunday".
- Wired to `PUT /api/household/profile` on change.
- Default value loaded from `useHousehold()` context or fetched from `GET /api/household/profile`.

---

## 6. TDD: Failing Tests (Red First)

### 6.1 Unit tests for API (`features/planner/__tests__/api/lessons.test.ts`)

```ts
describe('GET /api/planner/lessons', () => {
  it('returns all lessons for a given week when no filters provided')
  it('returns empty array when no lessons exist for that week')
  it('filters lessons by childId when childIds query param provided')
  it('filters lessons by subjectId when subjectIds query param provided')
  it('filters by both childIds and subjectIds when both provided')
  it('returns 400 when week param is not a valid ISO date')
  it('respects weekStartDay from household profile when calculating week span')
})

describe('GET /api/planner/lessons/:id', () => {
  it('returns the lesson by id')
  it('returns 404 when id does not exist')
})

describe('POST /api/planner/lessons', () => {
  it('creates a lesson with valid childId and subjectId')
  it('returns 404 when childId does not exist in children service')
  it('returns 404 when subjectId does not exist in subjects service')
  it('returns 400 when required fields are missing')
})

describe('PUT /api/planner/lessons/:id', () => {
  it('updates lesson fields (title, description, dueDate)')
  it('returns 404 when id does not exist')
})

describe('PATCH /api/planner/lessons/:id/complete', () => {
  it('sets isCompleted to true')
  it('returns 404 when id does not exist')
})
```

### 6.2 Integration tests for UI (`features/planner/__tests__/integration/WeeklyPlannerPage.test.tsx`)

```ts
describe('WeeklyPlannerPage', () => {
  it('shows loading spinner while fetching household profile and lessons')
  it('shows error state when GET /api/household/profile fails')
  it('shows error state when GET /api/planner/lessons fails')
  it('renders week grid on desktop viewport once loaded')
  it('renders week list on mobile viewport once loaded')
  it('loads and displays lessons for the current week on mount')
  it('shows empty state when no lessons exist for the week')
  it('previous/next buttons navigate to previous/next week')
  it('date picker allows jumping to a specific week')
  it('jump-to-today button returns to current week')
  it('child filter shows only selected children's lessons')
  it('subject filter shows only selected subjects' lessons')
  it('combined filter (child + subject) shows correct intersection')
  it('all-children mode shows lessons for all children')
  it('weekends are rendered with de-emphasized styling')
})

describe('WeekGrid (desktop)', () => {
  it('renders 7 columns (Mon–Sun) with correct headers')
  it('renders child/subject as row labels')
  it('lesson cells contain lesson title and description')
  it('clicking a lesson cell does nothing (read-only)')
  it('weekends columns have de-emphasis class')
})

describe('WeeklyList (mobile)', () => {
  it('renders one collapsible section per day')
  it('day section contains lessons grouped by child and subject')
  it('expanding a day section shows all lessons for that day')
  it('collapsing a day section hides lessons')
  it('weekends sections have de-emphasis styling')
})

describe('ChildSubjectFilter', () => {
  it('renders multi-select dropdown for children')
  it('renders multi-select dropdown for subjects')
  it('selecting a child updates the filter')
  it('selecting a subject updates the filter')
  it('deselecting a child removes it from the filter')
  it('clear button resets to all children and all subjects')
})

describe('WeekNavigator', () => {
  it('previous button navigates to the prior week')
  it('next button navigates to the following week')
  it('date picker opens and allows selecting a new week start')
  it('jump-to-today button sets week to current week')
  it('displays current week range in header (Mon–Sun based on weekStartDay)')
})

describe('EmptyWeekState', () => {
  it('renders friendly message when passed empty lessons array')
  it('does not render when lessons array is populated')
  it('message text is contextual and witty')
})
```

### 6.3 Integration tests for Household Settings (`features/household/__tests__/integration/HouseholdSettings.test.tsx`)

_Note: This test file may already exist; add the following cases if extending an existing file._

```ts
describe('HouseholdSettings — Week Start Day selector', () => {
  it('renders dropdown with "Monday" and "Sunday" options')
  it('loads and displays current weekStartDay from household profile on mount')
  it('defaults to "Monday" when weekStartDay is not set')
  it('calls PUT /api/household/profile when selection changes')
  it('updates displayed value after successful PUT')
  it('shows error message when PUT /api/household/profile fails')
  it('reverts to previous value if update fails')
})
```

---

## 7. Implementation Files

### 7.1 Files to create

```
features/planner/types.ts
features/planner/server/ids.ts
features/planner/server/store.ts
features/planner/server/seed.ts
features/planner/server/service.ts
features/planner/api/router.ts
features/planner/api/routes/lessons.ts
features/planner/api/routes/lesson.ts
features/planner/front/context/PlannerContext.tsx
features/planner/front/components/WeeklyPlannerPage.tsx
features/planner/front/components/WeekGrid.tsx
features/planner/front/components/WeeklyList.tsx
features/planner/front/components/WeekNavigator.tsx
features/planner/front/components/ChildSubjectFilter.tsx
features/planner/front/components/EmptyWeekState.tsx
features/planner/front/services/api.ts
features/planner/front/pages/index.tsx
features/planner/__tests__/api/lessons.test.ts
features/planner/__tests__/api/lesson.test.ts
features/planner/__tests__/integration/WeeklyPlannerPage.test.tsx
features/planner/__tests__/integration/WeekGrid.test.tsx
features/planner/__tests__/integration/WeeklyList.test.tsx
features/planner/__tests__/integration/WeekNavigator.test.tsx
features/planner/__tests__/integration/ChildSubjectFilter.test.tsx
features/planner/__tests__/fixtures/mockLessons.ts
app/(shell)/planner/page.tsx
```

### 7.2 Files to modify

```
features/household/types.ts                                    — add weekStartDay field to HouseholdProfile
features/household/server/service.ts                           — ensure getHouseholdProfile returns weekStartDay
features/household/api/routes/household-profile.ts            — ensure PUT endpoint handles weekStartDay
features/household/front/components/HouseholdSettings.tsx    — add week start selector UI
features/household/__tests__/integration/HouseholdSettings.test.tsx  — add week start day selector test cases
features/layout/front/components/Header.tsx                  — add "Weekly" nav item linking to /planner
features/layout/__tests__/Header.test.tsx                    — add test case for "Weekly" nav link rendering + routing
features/dashboard/front/pages/Dashboard.tsx                 — remove the "Weekly" tab if it exists
app/api/[...slug]/route.ts                                    — add planner branch + import (see §4.1)
```

---

## 8. Integration Test Matrix

| Component | Context(s) to mock | States | User interactions |
|---|---|---|---|
| `WeeklyPlannerPage` | Mock `useHousehold()` for weekStartDay; mock `GET /api/household/profile`, `GET /api/planner/lessons`, `GET /api/children`, `GET /api/subjects` | loading (profile + lessons), error (profile fails), error (lessons fail), empty week, populated week | navigate weeks, filter, jump to today |
| `WeekGrid` | Mock `PlannerContext` with lessons array | empty week, one lesson, multiple children/subjects, weekend de-emphasis | (none — read-only) |
| `WeeklyList` | Mock `PlannerContext` with lessons array | collapsed sections, expanded sections, empty sections | expand/collapse day sections |
| `EmptyWeekState` | None (pure display component) | message renders, message does not render | (none — read-only) |
| `ChildSubjectFilter` | Mock context + mock API responses | no children, one child, multiple children, filter updates | select/deselect children, select/deselect subjects |
| `WeekNavigator` | Mock context with current week | month transitions, date picker, jump to today, week range respects weekStartDay | prev/next, date picker, jump button |
| `HouseholdSettings` (week start) | Mock `useHousehold()`; mock `GET /api/household/profile`, `PUT /api/household/profile` | loading, default value, changed value, PUT success, PUT error | select option, change selection |

Mock contexts in tests; do not render `AppShell` or `HouseholdProvider`. Use `renderWithProvider` pattern from dashboard tests.

---

## 9. End-to-End Data Flow Trace (CLAUDE.md requirement)

| Question | Answer |
|---|---|
| Where are IDs generated? | `features/planner/server/ids.ts:generateLessonTaskId()` → `lesson_${Date.now()}_${n}` |
| Do IDs from the store match what the API returns and what the UI passes back? | `store.insert(lesson)` → `service.createLessonTask()` → `POST /api/planner/lessons` response → `PlannerContext` stores `lesson.id` → filter/display uses same id |
| Is the page reachable from navigation? | Yes — Header nav item "Weekly" → `/planner` route |
| Does the page appear without extra clicks on arrival? | Yes — `/planner` renders `WeeklyPlannerPage` immediately, loads current week's lessons on mount |
| Are seed/fixture IDs consistent? | `SEED_IDS.adam`, `SEED_IDS.khadijah`, `SEED_IDS.zayd` used in both `features/planner/server/seed.ts` (lesson `childId` values) and `features/children/server/seed.ts` |
| Is the householdId consistent? | `SEED_IDS.household` in `features/planner/server/seed.ts` matches `HouseholdProfile.id` from household seed |
| Does weekStartDay default to Monday? | Yes — default value in seed + `HouseholdProfile` type definition |
| How is weekStartDay retrieved in the UI? | `WeeklyPlannerPage` calls `GET /api/household/profile` on mount, extracts `weekStartDay`, passes to `WeekNavigator` and week-span calculator |

---

## 10. Definition of Done

### Code & Tests
- [ ] Failing test commit SHA included in PR description (tests must be red before implementation)
- [ ] All `it(...)` titles from §6 are present and passing
- [ ] `npm run build` passes locally
- [ ] `npm test` passes locally (no skipped tests)
- [ ] `npm run smoke` passes locally

### Architecture & Quality
- [ ] No import of `features/<any>/server/store.ts` from outside that feature
- [ ] No import of `features/lib/server/dataStore` or `mockData`
- [ ] All API handlers return `{ status, data, message, timestamp }` envelope
- [ ] All client components have `'use client'` at the top
- [ ] `PlannerContext` is used for shared planner state (week, filters, lessons); contexts are mocked in tests
- [ ] Integration tests mock `useHousehold()`, `GET /api/household/profile`, `GET /api/children`, `GET /api/subjects`

### Feature Behavior
- [ ] Weekly grid renders on desktop; vertical collapsible list on mobile
- [ ] Filters work: child multi-select, subject multi-select, all-children mode
- [ ] Week navigation works: prev, next, date picker, jump to today
- [ ] Weekends are displayed and visually de-emphasized
- [ ] Empty week shows friendly message (EmptyWeekState component)
- [ ] `GET /api/planner/lessons?week=YYYY-MM-DD&childIds=X,Y&subjectIds=A,B` works with all combinations
- [ ] Household `weekStartDay` setting is respected when calculating week spans
- [ ] Household Settings UI includes week start selector; changes persist via PUT
- [ ] Header nav has "Weekly" link; clicking navigates to `/planner`; Dashboard no longer has a Weekly tab

### Dependencies
- [ ] `features/household/types.ts` updated with `weekStartDay` field
- [ ] `features/household/server/service.ts` returns `weekStartDay` in profile
- [ ] `features/household/api/routes/household-profile.ts` handles `weekStartDay` in PUT payload
- [ ] `features/household/front/components/HouseholdSettings.tsx` includes UI for week start selector
- [ ] `features/household/__tests__/integration/HouseholdSettings.test.tsx` has test cases for week start selector
- [ ] `features/layout/front/components/Header.tsx` includes "Weekly" nav item
- [ ] `features/layout/__tests__/Header.test.tsx` has test case for "Weekly" link

### Scope
- [ ] Only files listed in §7 are created/modified
- [ ] Do not touch: `features/children/**`, `features/subjects/**`, `features/dashboard/api/**`, `features/auth/**`

---

## 11. PR Checklist Template

```markdown
## PR Checklist — Feature 11: Weekly Planner

### TDD
- [ ] Failing test commit SHA: `<sha>` (must be red before implementation)
- [ ] All test titles from implementation plan present and passing
- [ ] No `skip()` or `.only()` in test files

### Build & CI
- [ ] `npm run build` passes
- [ ] `npm test` passes
- [ ] `npm run smoke` passes

### Architecture
- [ ] No import of `features/planner/server/store` outside `features/planner/`
- [ ] No import of legacy `dataStore` or `mockData`
- [ ] All API handlers return envelope: `{ status, data, message, timestamp }`
- [ ] All client components have `'use client'`
- [ ] Contexts mocked in tests (no full `AppShell` render)

### Feature behavior
- [ ] Desktop grid + mobile collapsible list render correctly
- [ ] Child/subject filters work (multi-select)
- [ ] Week navigation (prev/next/date picker/jump to today) works
- [ ] `weekStartDay` from household profile is respected
- [ ] Empty week shows friendly message
- [ ] Weekends styled as de-emphasized
- [ ] Header has "Weekly" nav link
- [ ] Dashboard has no "Weekly" tab

### Testing coverage
- [ ] API unit tests cover: success, 404, 400, filter combinations
- [ ] Integration tests cover: loading, empty, error, populated states; all user interactions
- [ ] Household setting loaded and displayed correctly

### Secrets & scope
- [ ] No `.env.local`, API keys, or secrets committed
- [ ] Only files in §7 modified
```

---

## 11. Smoke Test Checklist

After `npm run build && npm run start`:

- [ ] Navigate to `/login` → dev bypass or auth flow
- [ ] Header displays "Dashboard" and **"Weekly"** nav items
- [ ] Click "Weekly" → navigates to `/planner`
- [ ] Weekly planner page loads; displays week grid (desktop) or collapsible list (mobile)
- [ ] Lessons populate for current week with multiple children/subjects visible
- [ ] Week navigation buttons (prev/next) change the displayed week
- [ ] Filters (child, subject) update the displayed lessons when changed
- [ ] "Jump to today" button returns to current week
- [ ] Navigate to Settings → "Week Starts On" dropdown visible with Monday/Sunday options
- [ ] Change week start setting → persists (reload page confirms the change)
- [ ] `GET http://localhost:3010/api/planner/lessons?week=2026-05-12` → 200 with lessons array

---

## 12. Notes for Implementation

1. **Week span calculation:** Given a Monday ISO date (e.g., `2026-05-12`), the week is that date through 6 days later. If `weekStartDay === 'Sunday'`, shift back one day. Implement a reusable utility in `features/planner/server/service.ts` and test it.

2. **Mobile detection:** Use a CSS media query breakpoint (e.g., `@media (max-width: 768px)`) or a React hook (`useMediaQuery`) to render `WeekGrid` or `WeeklyList`. Desktop-first approach: render grid by default, switch to list on mobile.

3. **Empty state message:** Examples:
   - "No lessons scheduled for this week — add one to get started!"
   - "Take a breath — no lessons this week!"
   - "Week looks clear! Time to plan ahead."

4. **De-emphasize weekends:** Apply a CSS class (e.g., `weekend-de-emphasized`) with lower opacity, grayed color, or reduced font size. Not hidden — all 7 days visible.

5. **Filter persistence:** Consider storing selected filters in `sessionStorage` (like the dashboard's child selector does) so they persist across navigation.

6. **Lesson data structure:** `dueDate` is a single date. If a lesson repeats across multiple days, it gets multiple rows/entries in the seed (one per day with the same `title` but different `dueDate`).

---

*Plan created: 2026-05-12. Ready for TDD implementation.*
