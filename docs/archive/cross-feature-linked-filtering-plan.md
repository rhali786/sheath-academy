# Development Plan — Cross-Feature Linked Filtering

Branch: `claude/fix-planner-bugs`

## 1. Summary

Fix the recurring linked-filter gap across Dashboard, Attendance, Quran, Lessons, Records & Proof, and Alerts. When a dashboard card, record card, Quran streak circle, Quran sessions link, or alert is clicked while a child is selected or when the source item is child-scoped, the destination page must open with that child already selected/filtered. This should be implemented as a shared query-param navigation contract, not as one-off links.

The core rule: if a source UI is about a child, the destination route must carry that child identity and the destination page must initialize its filter from it.

Do not solve this with dashboard-owned state or seed data. Do not add a global event bus. Use explicit route query parameters plus page-level filter initialization.

---

## 2. Planning Mode

Mode 3 — Cross-Feature, Dashboard, Records, or Reports Bug.

Reason: this touches Dashboard navigation, Today State cards, Records & Proof links, Quran Streak interactions, Attendance filters, Lessons filters, Quran page/session filters, Alerts, selected-child behavior, and Playwright cross-feature flows.

---

## 3. Current Code Path Audit

### Affected UI section: Today State dashboard cards

- Rendering component: `features/dashboard/front/components/TodayState.tsx`.
- Link component: `features/dashboard/front/components/shared/MetricCard.tsx`.
- Data provider/context: `DashboardProvider` provides `metrics` and `selectedChildId` to `Dashboard.tsx`, but `TodayState` currently receives only `metrics`.
- API route called: `dashboardApi.getSummary(selectedChildId)` through `DashboardProvider`.
- Server service/repository: dashboard summary route/service.
- Store/seed/source: feature-derived dashboard summary data.
- Current owner: Dashboard composes the card, but the destination filters belong to Attendance, Planner/Lessons, Quran, Portfolio, and Alerts/source features.
- Correct owner: Dashboard may build the link, but each destination feature owns reading and applying its own child filter.
- Existing tests found: not fully inspected in this planning pass; inspect `features/dashboard/__tests__` before implementation.
- Missing tests: component/integration tests proving Today State card hrefs include `childId` when one child is selected and omit it for All Children.

Current observed code facts:

- `TodayState` renders `MetricCard` links with static hrefs like `/attendance`, `/lessons`, `/quran`, `/portfolio`.
- `MetricCard` accepts a plain `href` string and renders a Next `Link`.
- `TodayState` does not receive `selectedChildId`, so it cannot currently create child-scoped hrefs.

### Affected UI section: Records & Proof cards

- Rendering component: `features/dashboard/front/components/RecordsProof.tsx`.
- Data provider/context: `DashboardProvider` provides `records` and selected-child scoped records data.
- API route called: `dashboardApi.getRecords(selectedChildId)`.
- Server route: `features/dashboard/api/routes/records.ts`.
- Store/seed/source: records are composed from feature services.
- Current owner: Dashboard currently renders links; destination filtering belongs to target feature pages.
- Correct owner: Dashboard builds a destination href with context; target page owns applying the filter.
- Existing tests found: not fully inspected in this planning pass; inspect dashboard component tests before implementation.
- Missing tests: integration tests proving Records & Proof links include selected child in one-child mode and omit child filter in All Children mode.

Current observed code facts:

- `RecordsProof` has a static `RECORD_ROUTES` map:
  - `record_attendance` -> `/attendance`
  - `record_progress` -> `/planner`
  - `record_portfolio` -> `/portfolio`
  - `record_quran` -> `/quran`
- It receives only `records`, not `selectedChildId`.
- Therefore it cannot currently preserve the dashboard child filter in its links.

### Affected UI section: Quran Streak card and Quran circle

- Rendering component: `features/dashboard/front/components/QuranStreak.tsx`.
- Data provider/context: `DashboardProvider` provides `quranSessions`, `children`, `selectedChildId`, and `addQuranSession`.
- API routes called:
  - `GET /api/quran/sessions?childId=...`
  - `POST /api/quran/sessions`
  - eventually `GET /api/quran/summary` for streak/summary if wired.
- Server service/repository: Quran server service/store.
- Store/seed/source: Quran sessions store.
- Current owner: Quran owns sessions/streak; Dashboard visualizes the streak.
- Correct owner: Quran feature owns `/quran` child filtering; Dashboard can link to `/quran?childId=<id>`.
- Existing tests found: not fully inspected in this planning pass; inspect dashboard/quran tests before implementation.
- Missing tests: integration/Playwright tests proving clicking a selected child’s Quran streak circle opens the Quran page filtered to that child.

Current observed code facts:

- `QuranStreak` renders child streak circles as non-clickable `div`s.
- The `Log Quran Session` button opens an inline modal and correctly defaults to the selected/first active child.
- There is no observed link from the Quran streak circle to `/quran?childId=<id>`.

### Affected UI section: Needs Attention alerts

- Rendering components:
  - `features/dashboard/front/components/NeedsAttention.tsx`
  - `features/dashboard/front/components/shared/AlertItem.tsx`
- Data provider/context: `DashboardProvider` fetches `alertsApi.getAlerts(selectedChildId)`.
- API route called: `GET /api/alerts?childId=...` through alerts API.
- Server service: `features/alerts/server/service.ts`.
- Store/seed/source: alerts are generated from planner lessons, attendance records, and children service.
- Current owner: Alerts owns alert generation. Dashboard renders alert cards.
- Correct owner: Alerts should include enough navigation metadata to preserve source context, including child-scoped hrefs.
- Existing tests found: not fully inspected in this planning pass; inspect alerts/dashboard tests before implementation.
- Missing tests: unit/API tests for child-scoped alert hrefs and Playwright tests proving clicking an alert applies the child filter on the target page.

Current observed code facts:

- `Alert` type already has `childId`, `childName`, `href`, `sourceFeature`, and `sourceId`.
- `AlertItem` wraps the card in a `Link` when `alert.href` exists.
- Alerts service currently sets lesson alerts to `href: '/lessons'` and attendance alerts to `href: '/attendance'` without child query params.
- Therefore an alert about a child can navigate to the target page but lose the child filter.

### Affected destination page: Attendance

- Rendering component: `features/attendance/front/pages/AttendancePage.tsx`.
- Data provider/service: local state plus `attendanceApi`, `childrenApi`, and `useHousehold`.
- API routes called:
  - Attendance records with `{ childId }`.
  - Attendance summary by child.
- Server service/repository: Attendance service/store.
- Store/seed/source: attendance records store and children store.
- Current owner: Attendance owns attendance records and its child selector.
- Correct owner: Attendance page should accept URL query `childId` and initialize/sync `selectedChildId` from it.
- Existing tests found: not fully inspected in this planning pass; inspect `features/attendance/__tests__` before implementation.
- Missing tests: integration and Playwright tests proving `/attendance?childId=<id>` selects that child and loads that child’s records.

Current observed code facts:

- `AttendancePage` has a local `selectedChildId` state.
- On children load, it defaults to the first child.
- It does not read `useSearchParams()` or apply a URL `childId`.
- Therefore links to `/attendance?childId=<id>` would not work until the page is updated to read the query param.

### Affected destination page: Lessons

- Rendering component: `features/planner/front/pages/LessonsPage.tsx`.
- Data provider/service: local state plus `plannerApi`, `childrenApi`, `subjectsApi`, and `useHousehold`.
- API route called: `plannerApi.getLessons()` for all lessons, then local filtering.
- Server service/repository: Planner service/store.
- Store/seed/source: lesson task store.
- Current owner: Planner/Lessons owns lesson data and lesson filters.
- Correct owner: Lessons page should accept URL query `childId` and initialize/sync `filterChildId` from it.
- Existing tests found: `features/planner/__tests__/integration/LessonsPage.test.tsx` appears in search results and must be inspected before implementation.
- Missing tests: integration and Playwright tests proving `/lessons?childId=<id>` filters All Lessons to that child.

Current observed code facts:

- `LessonsPage` already imports and uses `useSearchParams`, but only for `editId` inside `EditIdWatcher`.
- `filterChildId` is local state initialized as `''`.
- The page does not currently read `childId` from search params for filtering.
- Therefore alert links such as `/lessons` cannot filter by the alert child, and `/lessons?childId=<id>` would not apply until implemented.

### Affected destination page: Quran

- Rendering component: not found through targeted search in this planning pass.
- Front service: `features/quran/front/services/api.ts`.
- API route called: `GET /api/quran/sessions?childId=...` already supports child filtering at the API client level.
- Server service/repository: Quran sessions service/store.
- Store/seed/source: Quran sessions store.
- Current owner: Quran owns session list/filtering.
- Correct owner: Quran page should accept URL query `childId` and initialize/sync its child filter from it.
- Existing tests found: not fully inspected in this planning pass; inspect Quran tests and route/page files before implementation.
- Missing tests: integration and Playwright tests proving `/quran?childId=<id>` selects that child and shows only that child’s sessions.

Current observed code facts:

- `quranApi.getSessions(childId)` supports a `childId` query param.
- The dashboard links to `/quran` from Today State and Records & Proof.
- User observed `/quran` opens, so a route likely exists, but the page file path was not located by targeted search in this pass.
- The implementation phase must locate the Quran page/route before editing. Do not assume its path.

---

## 4. Source-of-Truth Decision

- Child selection as a dashboard filter is dashboard display state.
- Cross-route child intent should be represented in the URL query string, not hidden dashboard session state.
- Destination pages own their own filters and must initialize from URL params.
- Feature data remains owned by the feature:
  - Attendance owns attendance filters and records.
  - Planner/Lessons owns lesson filters and lesson records.
  - Quran owns Quran session filters and session records.
  - Alerts owns source metadata and child-scoped alert hrefs.
  - Dashboard composes links but does not own destination data.

Canonical linked-filter query contract:

```txt
childId=<studentId>
```

All Children is represented by the absence of `childId`, not by a magic value like `all`.

Optional future params may include:

```txt
source=dashboard|alert|records
focus=attendance|lessons|quran|portfolio
status=absent|completed|skipped
```

Do not add optional params in this slice unless needed to satisfy the stated bugs.

---

## 5. Acceptance Criteria

### Dashboard Today State links

- When Dashboard is filtered to a child, clicking Attendance Ready opens `/attendance?childId=<selectedChildId>` and the Attendance page selector is set to that child.
- When Dashboard is filtered to a child, clicking Lessons Planned opens `/lessons?childId=<selectedChildId>` and the Lessons page All Lessons filter is set to that child.
- When Dashboard is filtered to a child, clicking Quran Logged opens `/quran?childId=<selectedChildId>` and the Quran page is filtered to that child.
- When Dashboard is in All Children mode, these links omit `childId` or intentionally open the destination in All Children/default mode.

### Dashboard Quran Streak circles

- Clicking a Quran streak circle for Adam opens `/quran?childId=<adamId>`.
- Clicking a Quran streak circle for Khadijah opens `/quran?childId=<khadijahId>`.
- The Quran page reflects the clicked child filter on load.
- The Log Quran Session button still opens the logging modal; the circle/link behavior must not break logging.

### Records & Proof links

- When Dashboard is filtered to a child, clicking Quran Sessions opens `/quran?childId=<selectedChildId>` and filters Quran sessions to that child.
- When Dashboard is filtered to a child, clicking Attendance opens `/attendance?childId=<selectedChildId>` and filters Attendance to that child.
- When Dashboard is filtered to a child, clicking Progress Updates opens `/lessons?childId=<selectedChildId>` or `/planner?childId=<selectedChildId>` according to the final owning route decision, and the target page filters to that child.
- In All Children mode, links open target pages without a child filter.

### Needs Attention alerts

- A lesson alert for Layth links to `/lessons?childId=<laythId>`.
- Clicking that alert opens Lessons filtered to Layth.
- An attendance alert for a child links to `/attendance?childId=<childId>`.
- Clicking that alert opens Attendance filtered to that child.
- Household-level attendance alerts may link to `/attendance` without `childId`.
- Raw seed IDs are not shown to users.

### Destination page behavior

- `/attendance?childId=<id>` initializes Attendance child selector to that child after children load.
- `/lessons?childId=<id>` initializes All Lessons child filter to that child after children load.
- `/quran?childId=<id>` initializes Quran page/session filter to that child after children load.
- If `childId` is invalid or archived/inactive, destination pages show a safe fallback: All Children/default child plus a non-blocking notice or silently ignore the invalid filter.
- Filter state remains user-changeable after landing; users can switch to another child or All Children manually.

---

## 6. Data Model / Contract Changes

### Shared query helper

Add a small shared frontend helper instead of hand-building query strings everywhere:

```ts
export function childScopedHref(basePath: string, childId?: string | null): string {
  if (!childId) return basePath
  return `${basePath}?childId=${encodeURIComponent(childId)}`
}
```

Possible location:

```txt
features/lib/front/navigation.ts
```

Use only if this matches repo conventions. If an existing navigation helper exists, extend it instead.

### Alert hrefs

`Alert` already supports:

```ts
childId: string | null
childName?: string
href?: string
sourceFeature: AlertSourceFeature
sourceId?: string
```

Update generated hrefs so child-scoped alerts include `childId` in the query string.

Examples:

```txt
/lessons?childId=<childId>
/attendance?childId=<childId>
/quran?childId=<childId>
```

Do not introduce a second alert navigation field unless needed. Prefer using existing `href`.

### Destination page filters

Attendance:

```txt
/attendance?childId=<id>
```

Lessons:

```txt
/lessons?childId=<id>
```

Quran:

```txt
/quran?childId=<id>
```

All Children/default:

```txt
/no childId param
```

---

## 7. API / Store / Service Plan

No backend data model change is required for the basic linked-filter behavior.

### Attendance

- No API change required if existing `attendanceApi.getRecords({ childId })` and summary calls already support child filtering.
- Update Attendance page to read `childId` from URL and apply it to local `selectedChildId`.

### Lessons

- No API change required if Lessons page continues fetching all lessons and filtering locally.
- Update Lessons page to read `childId` from URL and apply it to `filterChildId`.
- Do not change lesson ownership or store behavior.

### Quran

- `quranApi.getSessions(childId)` already supports child filtering.
- Locate Quran page/route.
- Update Quran page to read `childId` from URL and apply it to its child/session filter.
- If no real Quran page exists and `/quran` is a placeholder, this must be surfaced before implementation proceeds; then either create the page in the Quran feature or update the plan with the real destination behavior.

### Alerts

- Update `features/alerts/server/service.ts` to generate child-scoped hrefs for child-scoped alerts.
- Household-level alerts can remain unscoped.
- Prefer a helper for source-feature-to-route mapping if more alert sources are added.

### Dashboard

- Pass `selectedChildId` into link-rendering components:
  - `TodayState`
  - `RecordsProof`
  - possibly `QuranStreak` if circles become links.
- Use the shared `childScopedHref` helper.
- Do not rely on `sessionStorage` selected child to configure destination pages.

---

## 8. UI Plan

### Today State

- Add `selectedChildId` prop.
- Build hrefs using `childScopedHref`.
- Preserve current card visuals.
- Add accessible link labels if needed.

### Records & Proof

- Add `selectedChildId` prop.
- Replace static route map usage with child-scoped href generation.
- Confirm `record_progress` route should be `/lessons` or `/planner`; pick the page that actually exposes lesson filtering. Current observed functional page is `/lessons`.

### Quran Streak

- Make each child streak circle or its surrounding card area a link to `/quran?childId=<child.id>`.
- Keep `Log Quran Session` as a button, not a link.
- Ensure clicking the log button does not trigger navigation.
- In selected-child mode, the single circle links to that child.
- In All Children mode, each circle links to its own child.
- Preserve keyboard accessibility.

### Needs Attention

- Keep `AlertItem` link rendering.
- Ensure alert hrefs include child query params when the alert is child-scoped.
- Link text/card should remain visually clear.

### Attendance page

- Read `childId` from URL search params.
- After children load, if the param matches an active child, set selected child to that ID.
- If no param, preserve current default behavior.
- If invalid param, fall back safely.

### Lessons page

- Read `childId` from URL search params.
- After children load, if the param matches an active child, set `filterChildId` to that ID.
- If no param, preserve All Children filter.
- If invalid param, fall back to All Children.

### Quran page

- Locate actual page file first.
- Read `childId` from URL search params.
- Apply to Quran child/session filter.
- If invalid param, fall back safely.

---

## 9. Testing Plan — Failing Tests First

Before implementation, inspect existing tests only in the affected folders:

- `features/dashboard/__tests__`
- `features/attendance/__tests__`
- `features/planner/__tests__`
- `features/quran/__tests__`
- `features/alerts/__tests__`
- relevant `e2e/` dashboard/attendance/quran/lessons specs

Do not do broad test discovery unless direct imports or failures require it.

### Unit tests

Shared navigation helper:

- `childScopedHref('/attendance', undefined)` returns `/attendance`.
- `childScopedHref('/attendance', null)` returns `/attendance`.
- `childScopedHref('/attendance', 'student 1')` encodes the value.

Alerts:

- Child-scoped lesson alert href is `/lessons?childId=<id>`.
- Child-scoped attendance alert href is `/attendance?childId=<id>`.
- Household attendance alert href remains `/attendance`.

### API tests

No new API routes are required, but if alert service is tested through API:

- `GET /api/alerts?childId=<id>` returns child-scoped alert hrefs that include `childId`.
- `GET /api/alerts` returns household-level attendance alert href without child query and child-scoped planner hrefs with child query.

### Integration tests

Dashboard:

- `TodayState` links include `childId` when `selectedChildId` exists.
- `RecordsProof` links include `childId` when `selectedChildId` exists.
- `QuranStreak` child circles link to child-scoped Quran URLs.
- `Log Quran Session` remains a button and opens the modal.

Attendance:

- Rendering `AttendancePage` with `?childId=<id>` selects that child after children load.
- Invalid `childId` does not crash and falls back safely.

Lessons:

- Rendering `LessonsPage` with `?childId=<id>` sets the All Lessons child filter and hides other children’s lessons.
- Invalid `childId` falls back to All Children.

Quran:

- Rendering Quran page with `?childId=<id>` selects/filters that child.
- Invalid `childId` falls back safely.

Alerts:

- `AlertItem` renders the supplied child-scoped href.

### Playwright tests

Attendance linked filter:

1. Open Dashboard.
2. Select a specific child.
3. Click Attendance Ready.
4. Confirm URL contains `/attendance?childId=<id>`.
5. Confirm Attendance child selector shows that child.
6. Confirm records/summary are for that child.

Quran streak linked filter:

1. Open Dashboard.
2. In All Children mode, click a Quran streak circle for a specific child.
3. Confirm URL contains `/quran?childId=<id>`.
4. Confirm Quran page/session view is filtered to that child.

Quran sessions from Records & Proof:

1. Open Dashboard.
2. Select a specific child.
3. Click Quran Sessions in Records & Proof.
4. Confirm URL contains `/quran?childId=<id>`.
5. Confirm Quran page/session view is filtered to that child.

Lesson alert linked filter:

1. Open Dashboard.
2. Locate a Needs Attention lesson alert for Layth or another specific child.
3. Click the alert.
4. Confirm URL contains `/lessons?childId=<id>`.
5. Confirm All Lessons filter shows that child and other children’s lessons are hidden.

All Children behavior:

1. Open Dashboard.
2. Select All Children.
3. Click Attendance Ready.
4. Confirm the destination does not include `childId`.
5. Confirm the destination uses its default/All Children behavior.

---

## 10. Build Phases

### Phase 1 — Shared linked-filter helper and dashboard links

Expected files:

- `features/lib/front/navigation.ts` or existing navigation utility if present.
- `features/dashboard/front/components/TodayState.tsx`
- `features/dashboard/front/components/RecordsProof.tsx`
- `features/dashboard/front/components/QuranStreak.tsx`
- `features/dashboard/front/pages/Dashboard.tsx`
- Dashboard tests.

Implementation outline:

1. Add failing tests for child-scoped href generation.
2. Add/extend helper for child-scoped hrefs.
3. Pass `selectedChildId` into `TodayState` and `RecordsProof`.
4. Generate child-scoped metric/record hrefs.
5. Make Quran streak circles link to child-scoped Quran routes without breaking Log Quran Session.

Commit:

```txt
fix(dashboard): preserve child filters in dashboard links
```

### Phase 2 — Destination pages read childId query params

Expected files:

- `features/attendance/front/pages/AttendancePage.tsx`
- `features/planner/front/pages/LessonsPage.tsx`
- Quran page file, once located.
- Attendance/planner/quran tests.

Implementation outline:

1. Add failing tests for `/attendance?childId=<id>`.
2. Add failing tests for `/lessons?childId=<id>`.
3. Locate Quran page, then add failing tests for `/quran?childId=<id>`.
4. Use `useSearchParams()` to read `childId`.
5. Apply param only after children load and only if valid/active.
6. Preserve user ability to manually change filters.

Commit:

```txt
fix(filters): initialize feature pages from child query params
```

### Phase 3 — Alert hrefs include child filters

Expected files:

- `features/alerts/server/service.ts`
- `features/alerts/types.ts` only if source metadata needs refinement.
- `features/dashboard/front/components/shared/AlertItem.tsx` only if UI behavior needs adjustment.
- Alerts/dashboard tests.

Implementation outline:

1. Add failing tests for child-scoped alert hrefs.
2. Update lesson alerts to `/lessons?childId=<childId>`.
3. Update child attendance alerts to `/attendance?childId=<childId>`.
4. Keep household alerts unscoped.
5. Add Quran/portfolio route mappings if those alert types exist or are added.

Commit:

```txt
fix(alerts): include child filters in alert links
```

### Phase 4 — Cross-feature Playwright coverage

Expected files:

- relevant `e2e/*.spec.ts`

Implementation outline:

1. Add Playwright tests for the four reported flows:
   - Dashboard Today -> Attendance child filter.
   - Dashboard Quran circle -> Quran child filter.
   - Records & Proof Quran Sessions -> Quran child filter.
   - Needs Attention lesson alert -> Lessons child filter.
2. Assert URL and visible filter state.
3. Assert filtered content, not just navigation.

Commit:

```txt
test(filters): cover cross-feature linked child filters
```

---

## 11. Out of Scope

- Do not build a global selected-child context shared by every feature in this slice.
- Do not add a global event bus.
- Do not migrate dashboard selected-child session storage.
- Do not redesign the Attendance, Lessons, or Quran pages beyond query-param initialization.
- Do not add new seed data to make tests pass.
- Do not change Postgres/storage architecture.
- Do not implement advanced query params like status/date/focus unless needed by the stated bugs.
- Do not solve color exhaustion or chart redesign here.
- Do not run parallel agents.

---

## 12. Manual QA Plan

### Attendance from Today State

1. Open Dashboard.
2. Select a specific child, such as Layth.
3. Click Attendance Ready.
4. Confirm URL includes `/attendance?childId=<Layth id>`.
5. Confirm Attendance child selector shows Layth.
6. Confirm Attendance records/summary belong to Layth.

### Quran circle from Dashboard

1. Open Dashboard.
2. Select All Children.
3. Click the Quran Streak circle for a specific child.
4. Confirm URL includes `/quran?childId=<that child id>`.
5. Confirm Quran page filter/session list shows that child.

### Quran Sessions from Records & Proof

1. Open Dashboard.
2. Select a specific child.
3. Click Quran Sessions in Records & Proof.
4. Confirm URL includes `/quran?childId=<selected child id>`.
5. Confirm Quran page/session list is filtered to that child.

### Lesson alert to Lessons

1. Open Dashboard.
2. Find a Needs Attention lesson alert for Layth.
3. Click the alert.
4. Confirm URL includes `/lessons?childId=<Layth id>`.
5. Confirm All Lessons child filter shows Layth.
6. Confirm lessons for other children are hidden.

### All Children mode

1. Open Dashboard.
2. Select All Children.
3. Click Attendance Ready.
4. Confirm URL does not include `childId`.
5. Confirm destination opens in its default/All Children behavior.

---

## 13. Branch and Commit Plan

Branch: `claude/fix-planner-bugs`

Planned commits:

```txt
fix(dashboard): preserve child filters in dashboard links
fix(filters): initialize feature pages from child query params
fix(alerts): include child filters in alert links
test(filters): cover cross-feature linked child filters
```

Before final completion:

```bash
npm test
npm run build
npx playwright test
```

All must pass before the implementation is called done.

---

## 14. Risks and Rollback

### Risk: Quran page path is not obvious

Mitigation: locate the actual `/quran` page/route before editing. If no real page exists, stop and report that `/quran` is a dead/placeholder route before implementing the filter.

Rollback: revert Phase 2 Quran-specific changes only.

### Risk: query param fights local user changes

Mitigation: apply URL `childId` on initial load and when the URL changes, but do not repeatedly override manual selector changes unless the route param changes.

Rollback: revert destination page query-param initialization commit.

### Risk: invalid child IDs crash pages

Mitigation: validate query param against loaded active children before setting selected child/filter.

Rollback: revert Phase 2 changes.

### Risk: alert links break existing alert rendering

Mitigation: keep using existing `href` field and `AlertItem` link behavior. Only change href values.

Rollback: revert Phase 3 alert href commit.

### Risk: dashboard uses selectedChildId from session storage but destination pages use URL

Mitigation: treat URL as the cross-feature contract. Dashboard session storage can remain dashboard-local. Destination pages should not depend on dashboard storage.

Rollback: revert Phase 1 dashboard link changes.

---

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
- Tests include unit, integration, and Playwright coverage for linked filtering.
