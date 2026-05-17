# Development Plan — Cross-Feature Linked Filtering

Branch: `claude/fix-planner-bugs`

Archived from: `docs/cross-feature-linked-filtering-plan.md`

## Summary

Fix the recurring linked-filter gap across Dashboard, Attendance, Quran, Lessons, Records & Proof, and Alerts. When a dashboard card, record card, Quran streak circle, Quran sessions link, or alert is clicked while a child is selected or when the source item is child-scoped, the destination page must open with that child already selected/filtered. This should be implemented as a shared query-param navigation contract, not as one-off links.

The core rule: if a source UI is about a child, the destination route must carry that child identity and the destination page must initialize its filter from it.

Do not solve this with dashboard-owned state or seed data. Do not add a global event bus. Use explicit route query parameters plus page-level filter initialization.

## Planning Mode

Mode 3 — Cross-Feature, Dashboard, Records, or Reports Bug.

Reason: this touches Dashboard navigation, Today State cards, Records & Proof links, Quran Streak interactions, Attendance filters, Lessons filters, Quran page/session filters, Alerts, selected-child behavior, and Playwright cross-feature flows.

## Current Code Path Audit

### Today State dashboard cards

- Rendering component: `features/dashboard/front/components/TodayState.tsx`.
- Link component: `features/dashboard/front/components/shared/MetricCard.tsx`.
- Data provider/context: `DashboardProvider` provides `metrics` and `selectedChildId` to `Dashboard.tsx`, but `TodayState` currently receives only `metrics`.
- API route called: `dashboardApi.getSummary(selectedChildId)` through `DashboardProvider`.
- Correct owner: Dashboard may build the link, but each destination feature owns reading and applying its own child filter.
- Current observed fact: `TodayState` renders static hrefs like `/attendance`, `/lessons`, `/quran`, `/portfolio`.

### Records & Proof cards

- Rendering component: `features/dashboard/front/components/RecordsProof.tsx`.
- Data provider/context: `DashboardProvider` provides `records` and selected-child scoped records data.
- API route called: `dashboardApi.getRecords(selectedChildId)`.
- Current observed fact: `RecordsProof` has a static `RECORD_ROUTES` map and receives only `records`, not `selectedChildId`.

### Quran Streak card and Quran circle

- Rendering component: `features/dashboard/front/components/QuranStreak.tsx`.
- Data provider/context: `DashboardProvider` provides `quranSessions`, `children`, `selectedChildId`, and `addQuranSession`.
- Current observed fact: Quran streak circles are non-clickable `div`s, and there is no observed link to `/quran?childId=<id>`.

### Needs Attention alerts

- Rendering components: `features/dashboard/front/components/NeedsAttention.tsx` and `features/dashboard/front/components/shared/AlertItem.tsx`.
- Data provider/context: `DashboardProvider` fetches `alertsApi.getAlerts(selectedChildId)`.
- Server service: `features/alerts/server/service.ts`.
- Current observed fact: `Alert` already has `childId`, `childName`, `href`, `sourceFeature`, and `sourceId`, but generated lesson/attendance hrefs are unscoped.

### Attendance destination

- Rendering component: `features/attendance/front/pages/AttendancePage.tsx`.
- Current observed fact: local `selectedChildId` defaults to first child and does not read `useSearchParams()` or apply URL `childId`.

### Lessons destination

- Rendering component: `features/planner/front/pages/LessonsPage.tsx`.
- Current observed fact: `LessonsPage` uses `useSearchParams` only for `editId`; `filterChildId` is local state and does not read URL `childId`.

### Quran destination

- Front service: `features/quran/front/services/api.ts`.
- API route called: `GET /api/quran/sessions?childId=...` already supports child filtering.
- Current observed fact: actual Quran page file was not located in this planning pass and must be found before implementation.

## Source-of-truth Decision

- Child selection as a dashboard filter is dashboard display state.
- Cross-route child intent should be represented in the URL query string.
- Destination pages own their own filters and must initialize from URL params.
- Feature data remains owned by each source feature.

Canonical linked-filter query contract:

```txt
childId=<studentId>
```

All Children is represented by the absence of `childId`, not by a magic value.

## Acceptance Criteria

### Dashboard Today State links

- Dashboard filtered to a child -> Attendance Ready opens `/attendance?childId=<selectedChildId>` and Attendance selector is set to that child.
- Dashboard filtered to a child -> Lessons Planned opens `/lessons?childId=<selectedChildId>` and Lessons filter is set to that child.
- Dashboard filtered to a child -> Quran Logged opens `/quran?childId=<selectedChildId>` and Quran page is filtered to that child.
- All Children mode omits `childId`.

### Quran Streak circles

- Clicking a Quran streak circle opens `/quran?childId=<childId>`.
- Quran page reflects the clicked child filter.
- Log Quran Session remains a button and is not broken by link behavior.

### Records & Proof links

- Selected-child mode preserves child filter on Quran, Attendance, and Progress links.
- All Children mode opens unfiltered target pages.

### Needs Attention alerts

- Lesson alerts link to `/lessons?childId=<childId>`.
- Attendance alerts link to `/attendance?childId=<childId>`.
- Household-level alerts may remain unscoped.
- Raw seed IDs are not shown to users.

### Destination behavior

- `/attendance?childId=<id>` initializes Attendance selector.
- `/lessons?childId=<id>` initializes Lessons child filter.
- `/quran?childId=<id>` initializes Quran child/session filter.
- Invalid or archived child IDs fall back safely.
- Filters remain user-changeable after landing.

## Data Model / Contract Changes

Add or extend a shared frontend helper:

```ts
export function childScopedHref(basePath: string, childId?: string | null): string {
  if (!childId) return basePath
  return `${basePath}?childId=${encodeURIComponent(childId)}`
}
```

Possible location: `features/lib/front/navigation.ts`, if it matches repo conventions.

Alert hrefs should use existing `href` field and include child query params for child-scoped alerts.

## Implementation Plan

### Phase 1 — Shared linked-filter helper and dashboard links

Expected files:

- `features/lib/front/navigation.ts` or existing navigation utility.
- `features/dashboard/front/components/TodayState.tsx`
- `features/dashboard/front/components/RecordsProof.tsx`
- `features/dashboard/front/components/QuranStreak.tsx`
- `features/dashboard/front/pages/Dashboard.tsx`
- Dashboard tests.

Commit: `fix(dashboard): preserve child filters in dashboard links`

### Phase 2 — Destination pages read childId query params

Expected files:

- `features/attendance/front/pages/AttendancePage.tsx`
- `features/planner/front/pages/LessonsPage.tsx`
- Quran page file, once located.
- Attendance/planner/quran tests.

Commit: `fix(filters): initialize feature pages from child query params`

### Phase 3 — Alert hrefs include child filters

Expected files:

- `features/alerts/server/service.ts`
- `features/alerts/types.ts` only if source metadata needs refinement.
- Alert/dashboard tests.

Commit: `fix(alerts): include child filters in alert links`

### Phase 4 — Cross-feature Playwright coverage

Expected files: relevant `e2e/*.spec.ts`

Commit: `test(filters): cover cross-feature linked child filters`

## Testing Plan

Unit tests:

- `childScopedHref` handles undefined/null child ID and encodes child IDs.
- Child-scoped lesson alert href is `/lessons?childId=<id>`.
- Child-scoped attendance alert href is `/attendance?childId=<id>`.

Integration tests:

- `TodayState` links include child ID when selected.
- `RecordsProof` links include child ID when selected.
- Quran streak child circles link to child-scoped Quran URLs.
- Attendance, Lessons, and Quran pages initialize from `childId`.

Playwright tests:

- Dashboard Today -> Attendance child filter.
- Dashboard Quran circle -> Quran child filter.
- Records & Proof Quran Sessions -> Quran child filter.
- Needs Attention lesson alert -> Lessons child filter.
- All Children mode omits `childId`.

## Out of Scope

- No global selected-child context.
- No global event bus.
- No dashboard selected-child session storage migration.
- No page redesign beyond query-param initialization.
- No new seed data.
- No Postgres/storage changes.
- No advanced query params unless needed by the stated bugs.
- No parallel agents.

## Final Regression Checklist

- Dashboard Today State links preserve selected child.
- Attendance page applies `childId` query param.
- Lessons page applies `childId` query param.
- Quran page applies `childId` query param.
- Quran streak circles link to the correct child Quran page.
- Records & Proof links preserve selected child.
- Child-scoped alerts link to child-filtered destination pages.
- Household-level alerts remain unscoped.
- Invalid child query params do not crash destination pages.
- All Children mode does not add a fake `childId`.
- Tests include unit, integration, and Playwright coverage.
