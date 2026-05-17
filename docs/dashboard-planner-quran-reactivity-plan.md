# Development Plan — Dashboard Planner Quran Reactivity Fixes

Branch: `claude/fix-planner-bugs`

## 1. Summary

Fix the remaining dashboard, lesson status, and Quran summary/reactivity issues by tightening source-of-truth wiring instead of adding new dashboard-owned data. The dashboard must use the page-level child selector, Per-Child Progress must become a planner-derived vertical bar chart, lesson status changes on `/lessons` must update both Today and All Lessons immediately, Quran dashboard sections must derive from the Quran feature summary/session source, and cross-feature mutations must explicitly refresh currently visible derived dashboard/records sections.

This plan is intentionally scoped. Do not run parallel agents. Do not audit unrelated waves. Complete one phase, test it, commit it, then move to the next phase.

## 2. Planning Mode

Mode 3 — Cross-Feature, Dashboard, Records, or Reports Bug.

Reason: the request touches dashboard composition, page-level child selection, planner lesson status, Quran summary/session data, records counts, and user-visible cross-feature updates.

Mode 5 applies only lightly to the reactivity rule because this plan clarifies how feature-owned mutations refresh dashboard-derived sections. It should not introduce a global event bus or broad architecture migration.

## 3. Current Code Path Audit

### Affected UI section: Per-Child Progress on Dashboard

- Rendering component: `features/dashboard/front/components/PerChildProgress.tsx`.
- Data provider/hook/context: `features/dashboard/front/pages/Dashboard.tsx` owns local `progressData` state and calls `plannerApi.getProgress(...)` in a `useEffect` keyed only by `selectedChildId`.
- API route called: `GET /api/planner/progress` through `plannerApi.getProgress`.
- Server service/repository called: planner progress route/service path behind `/api/planner/progress`.
- Store/seed/source currently used: planner lesson data, transformed by `features/dashboard/front/utils/transformProgress.ts`.
- Current owner: mixed. The visual section is dashboard-owned, but its data is planner-derived. The component also owns an internal child selector, which conflicts with the page-level dashboard selector.
- Correct owner: Planner owns progress inputs and calculations. Dashboard only composes and visualizes the selected-child or All Children progress.
- Existing tests found during targeted audit: `features/dashboard/__tests__/integration/components/DashboardComponents.test.tsx` appears in search results for `PerChildProgress`, but this plan did not inspect it deeply. The implementation step must inspect it before editing tests.
- Missing tests needed: integration test that Per-Child Progress uses page-level selection, does not render internal child buttons, renders vertical bars, excludes archived children, and shows an empty state for empty planner progress. Playwright test that changing the page-level selector changes the chart without using an internal selector.

Current observed code facts:

- `PerChildProgress` has its own `useState(children[0]?.id)` selector.
- It renders child pill buttons inside the component.
- It renders a horizontal Nivo bar chart.
- It also renders a Quran progress ring from fields that are not produced by `transformPlannerProgress`.

### Affected UI section: Lessons page Today card and All Lessons list

- Rendering components:
  - `features/planner/front/pages/LessonsPage.tsx` renders the page.
  - `features/planner/front/components/TodayLessonCard.tsx` renders Today lessons and status action buttons.
  - `features/planner/front/components/LessonTaskList.tsx` renders All Lessons.
  - `features/planner/front/components/LessonCard.tsx` renders each All Lessons card status badge.
- Data provider/hook/context: `LessonsPage` owns `lessons` state and passes `externalLessons={lessons}` to `TodayLessonCard` and `lessons={lessons}` to `LessonTaskList`.
- API route called: `PATCH /api/planner/lessons/:id/complete` through `plannerApi.completeLesson`.
- Server service/repository called: planner lesson status update route/service behind `/api/planner/lessons/:id/complete`.
- Store/seed/source currently used: planner lesson store/service.
- Current owner: Planner owns lesson status.
- Correct owner: Planner owns lesson status and page-level lesson state. Child components that mutate status must notify the page owner.
- Existing tests found during targeted audit: no direct search result for `TodayLessonCard` status synchronization was found. The implementation step must inspect planner tests before editing.
- Missing tests needed: integration test proving a status change from Today updates the same lesson in All Lessons; API test proving status persists; Playwright test proving status changes without page refresh and survives refresh.

Current observed code facts:

- `LessonsPage` fetches lessons into parent `lessons` state.
- `TodayLessonCard` receives `externalLessons` but has no `onStatusChange` callback.
- `TodayLessonCard` uses local `localStatuses` for optimistic status only inside itself.
- `LessonTaskList` receives the unchanged parent `lessons` array, so All Lessons can stay `Not started`.

### Affected UI section: Quran Progress / Quran Logging / Weekly Sessions on Dashboard

- Rendering component: `features/dashboard/front/components/QuranStudies.tsx`.
- Data provider/hook/context: `DashboardProvider` fetches `quranApi.getSessions(...)` and passes `quranSessions` and `quranChartData` into `QuranStudies`.
- API routes called:
  - `GET /api/quran/sessions`
  - `POST /api/quran/sessions`
  - `GET /api/quran/summary` exists in the API client but is not currently wired into DashboardProvider state.
- Server service/repository called:
  - `features/quran/server/service.ts` has `getQuranSessions`, `getQuranSummary`, and `addQuranSession`.
- Store/seed/source currently used: `quranSessionsStore` seeded by `SEED_QURAN_SESSIONS`.
- Current owner: Quran feature owns sessions and summary. Dashboard uses sessions/chart data directly.
- Correct owner: Quran feature owns Quran sessions, summary, and Quran progress. Dashboard composes Quran feature outputs.
- Existing tests found during targeted audit: no direct search result for Quran summary dashboard wiring was found. The implementation step must inspect `features/quran/__tests__`, `features/dashboard/__tests__`, and e2e tests before editing.
- Missing tests needed: unit/API tests for summary filters and shape; integration tests for dashboard wiring to summary/session data; Playwright test that logging a session updates Quran Logging, Weekly Sessions, Records & Proof Quran count, and child filtering.

Current observed code facts:

- `quranApi.getSummary` exists.
- `getQuranSummary` exists but returns only `sessionsLogged`, `sessionsByType`, `recentSessions`, and `dateRange`.
- `DashboardProvider` does not fetch or store Quran summary.
- `QuranStudies` builds Weekly Sessions from `chartData`, uses only Mon–Fri, and hard-caps the chart at `maxValue={2}`.
- The separate `PerChildProgress` card renders a Quran ring from planner progress data, not Quran summary.

### Affected UI section: Records & Proof Progress Updates and Quran Sessions

- Rendering component: `features/dashboard/front/components/RecordsProof.tsx`.
- Data provider/hook/context: `DashboardProvider` fetches `dashboardApi.getRecords(selectedChildId)`.
- API route called: `GET /api/dashboard/records`.
- Server service/repository called: `features/dashboard/api/routes/records.ts` aggregates from attendance, planner, portfolio, Quran, and children services.
- Store/seed/source currently used: feature services; still routed under dashboard API.
- Current owner: dashboard route composes records data, but source records are feature-owned.
- Correct owner: Records/Reports should eventually own record summaries. For this fix, leave the route temporarily but require it to use feature services and refetch after relevant mutations.
- Existing tests found during targeted audit: not fully inspected. The implementation step must inspect dashboard records tests before editing.
- Missing tests needed: API test that progress updates count completed current-week lessons; API/integration test that Quran count follows Quran sessions; Playwright test that records counts update after planner/Quran mutations.

Current observed code facts:

- Records Progress Updates count is `completedLessons.length` for lessons due in the current week.
- `maxCount` is current-week lesson count.
- Quran sessions count is current-week Quran sessions.
- Records already has links for Attendance, Progress, Portfolio, and Quran.

### Affected UI section: Needs Attention alert child display

- Rendering component: `features/dashboard/front/components/shared/AlertItem.tsx`.
- Data provider/hook/context: `DashboardProvider` fetches `alertsApi.getAlerts(selectedChildId)` and passes alerts into `NeedsAttention`.
- API route called: `GET /api/alerts`.
- Server service/repository called: `features/alerts/server/service.ts`.
- Store/seed/source currently used: generated from planner lessons, attendance records, and children service.
- Current owner: Alerts feature owns alert generation.
- Correct owner: Alerts should return display-safe metadata or the dashboard AlertItem should receive a child lookup map.
- Existing tests found during targeted audit: not fully inspected. The implementation step must inspect alerts/dashboard tests before editing.
- Missing tests needed: integration test proving AlertItem renders child name, not raw ID; API/unit test if the Alert contract adds `childName`.

Current observed code facts:

- Alert generation has access to the child profile/name.
- Alert object does not include `childName`.
- `AlertItem` renders `alert.childId` directly.

## 4. Source-of-Truth Decision

- Planner owns lesson status and progress inputs.
- Quran owns Quran sessions, Quran summary, and Quran-derived progress.
- Alerts owns Needs Attention alert generation.
- Records/Reports should eventually own records summaries. For this fix, leave `GET /api/dashboard/records` temporarily because it already composes feature services, but do not add new dashboard-owned data.
- Dashboard only composes visible Today-facing data and owns display state such as selected child.

Ownership violations and decisions:

1. `PerChildProgress` owns an internal child selector. Migrate in this wave by removing it and using page-level selected child.
2. `PerChildProgress` renders Quran progress from planner-derived data. Migrate in this wave by removing Quran ring from this component. Quran progress belongs in Quran-owned dashboard section using Quran summary/session data.
3. `TodayLessonCard` owns local-only lesson status state. Migrate in this wave by adding a parent callback/refetch path.
4. Records summaries remain under dashboard API temporarily. Leave temporarily with a named follow-up to move to Records/Reports ownership after MVP bug stabilization.

## 5. Acceptance Criteria

### Per-Child Progress

- The Per-Child Progress component has no internal child selector or child pill buttons.
- The component uses the page-level dashboard selected child.
- Selecting one child on the dashboard shows only that child’s planner-derived subject progress.
- Selecting All Children shows active children’s planner-derived progress in an aggregate/grouped view.
- Archived children are excluded.
- The visualization is a vertical colored bar chart, not a horizontal chart or ring.
- Each bar has a text label with subject and completed/planned or percent information; color is not the only signal.
- Empty planner progress shows a clear empty state, not fake seeded progress.

### Lessons page status synchronization

- On `/lessons`, marking a Today lesson completed immediately changes that Today row to Completed/Done.
- The same lesson under All Lessons immediately changes from Not started to Completed without page refresh.
- Marking a Today lesson skipped immediately changes Today and All Lessons to Skipped.
- Refreshing the page preserves the updated status.
- Dashboard planner progress reflects completed lessons after dashboard-derived data is refetched.

### Quran summary and dashboard wiring

- `GET /api/quran/summary` is the canonical Quran summary endpoint for dashboard Quran-derived counts/progress.
- DashboardProvider fetches Quran summary for the current page-level selected child or All Children.
- Saving a Quran session refetches Quran sessions, Quran summary, dashboard summary, and records.
- Quran Logging updates after save.
- Weekly Sessions updates after save.
- Records & Proof Quran count updates after save.
- Selected child mode hides other children’s Quran sessions.
- All Children mode aggregates active children only.
- Weekly Sessions behavior is explicit: either include all seven days or label and intentionally test Monday–Friday only. Preferred: include all seven days unless product direction says school-week only.
- The chart scale must not hard-cap at 2 if counts can exceed 2.

### Needs Attention child display

- Needs Attention alert items display the child’s human name, not raw IDs like `STUDENT_SEED_ZAYD_001`.
- Household-level alerts are labeled as household/family-level or omit child label intentionally.

### Records & Proof / Progress Updates

- Progress Updates count is documented and tested as current-week completed lessons over current-week planned lessons.
- If a lesson due this week is marked completed, Records & Proof Progress Updates changes after refetch.
- If skipped lessons are not counted, this is explicit in code comments/tests and user-visible behavior.
- Quran Sessions count updates after a Quran session is saved.

### Cross-feature reactivity

- Any mutation that changes currently visible dashboard-derived data must refetch the visible derived sections that depend on it.
- Do not rely on page refresh, navigation, or changing selected child to update dashboard-derived cards.
- Use explicit callbacks/refetches for this branch. Do not add a global event bus.

## 6. Data Model / Contract Changes

### Alerts

Choose one safe contract approach:

Option A, preferred for display stability:

```ts
interface Alert {
  childId: string | null
  childName?: string
  // existing alert fields
}
```

Alert generation adds `childName` when the alert is child-scoped.

Option B:

Pass a `childNameById` map into `AlertItem`/`NeedsAttention` and keep Alert contract unchanged.

Preferred: Option A, because alerts are display/advisory objects generated from feature data and the service already has access to child names.

### Planner lesson status

No new status values. Continue using existing statuses:

```txt
not_started
completed
skipped
```

Add callback contract:

```ts
interface TodayLessonCardProps {
  childId: string
  today: string
  externalLessons?: LessonTask[]
  onLessonStatusChange?: (lesson: LessonTask) => void | Promise<void>
}
```

`plannerApi.completeLesson` already returns the updated `LessonTask`; use that returned value to update parent state or trigger `fetchLessons()`.

### Quran summary

Expand `QuranSummary` if needed so dashboard can avoid duplicating summary calculations:

```ts
interface QuranSummary {
  childId?: string
  sessionsLogged: number
  sessionsByType: Array<{ type: string; count: number }>
  sessionsByChild: Array<{ childId: string; childName: string; count: number }>
  weeklySessions: Array<{ date: string; dayLabel: string; count: number }>
  recentSessions: QuranSession[]
  dateRange: { startDate?: string; endDate?: string }
}
```

If child names are not available inside Quran service yet, explicitly fetch profiles there or return child IDs plus map in the dashboard. Do not render raw IDs in user-facing labels.

### Progress chart data

Expand transformed planner progress data to include counts, not only percent:

```ts
type ProgressBarDatum = {
  childId: string
  childName: string
  subjectId: string
  subjectName: string
  completed: number
  planned: number
  completionPercent: number
}
```

If the planner progress API already returns these fields under different names, use existing names and do not invent duplicates.

## 7. API / Store / Service Plan

### Planner

- Keep `PATCH /api/planner/lessons/:id/complete` as the status mutation route.
- Confirm it returns the updated `LessonTask`.
- Do not create a second status route.
- After success, `LessonsPage` should update local `lessons` state using the returned lesson or refetch with `fetchLessons()`.

### Dashboard progress

- `Dashboard.tsx` should continue using `plannerApi.getProgress` for planner progress.
- Add a refresh function such as `refreshPlannerProgress()` inside Dashboard or move planner progress into DashboardProvider if multiple dashboard components need it.
- Do not create dashboard seed/store progress.
- If dashboard needs to refetch planner progress after a mutation outside dashboard, use explicit callback from the page/provider that made the mutation. Do not add a global event bus.

### Quran

- Keep `GET /api/quran/sessions` for raw sessions and chart/session lists.
- Keep/strengthen `GET /api/quran/summary` for summary counts and progress.
- Ensure summary supports `childId`, `startDate`, and `endDate`.
- Ensure summary excludes archived children in All Children mode or make active-child filtering explicit through service inputs.
- `DashboardProvider.addQuranSession` must refetch sessions, summary, dashboard summary, and records.

### Records

- Keep `GET /api/dashboard/records` temporarily.
- Ensure it composes feature services only.
- After planner or Quran mutations, refetch records if records are visible.
- Named follow-up: move records summaries into `features/records` or `features/reports` after these bugs are fixed.

### Alerts

- Add display-safe child names or pass a child lookup map.
- Do not render raw child IDs in alert cards.

## 8. UI Plan

### Per-Child Progress UI

- Remove internal child pill selector.
- Accept `selectedChildId` or already-filtered/grouped chart data from Dashboard.
- Replace horizontal Nivo bar config with vertical bar config.
- X-axis: subject name for one child.
- X-axis in All Children mode: either child grouped by subject or subject grouped by child; choose the most readable implementation using existing Nivo capabilities.
- Y-axis: completion percentage or completed lesson count. Prefer percent with visible completed/planned labels if data is available.
- Include a legend when multiple children are shown.
- Include an empty state.
- Remove Quran ring from `PerChildProgress`; Quran belongs in `QuranStudies` or a Quran-specific summary card.

### Lessons page UI

- `TodayLessonCard` should notify parent after status mutation.
- All Lessons list should re-render from updated parent state.
- Preserve existing status badges in `LessonCard`.
- Show failure feedback if status update fails and roll back optimistic UI.

### Quran UI

- Use child names in legends, not raw series IDs if IDs are technical.
- Weekly Sessions should include all intended days and a dynamic max scale.
- Add a visible empty state for no sessions.
- After save, keep modal close behavior but ensure all dependent data visibly refreshes.

### Needs Attention UI

- Alert child label should show the child name.
- For household alerts, either show `Household`/`Family` or omit the label.

### Accessibility and mobile

- Bar labels must include text; color is not the only signal.
- Chart legends must use readable names.
- Buttons must remain keyboard accessible.
- Icon-only buttons must have aria labels if any are added.
- Mobile chart may use horizontal scroll rather than compressing labels into unreadable text.
- Touch targets should be at least 44px where practical.

## 9. Testing Plan — Failing Tests First

Before implementation, inspect existing tests in the affected feature folders only:

- `features/dashboard/__tests__`
- `features/planner/__tests__`
- `features/quran/__tests__`
- `features/alerts/__tests__`
- `e2e/` files related to dashboard/planner/quran

Do not run broad test discovery beyond those folders unless a direct import or test failure requires it.

### Unit tests

Planner:

- Status update helper/service persists `completed`.
- Status update helper/service persists `skipped`.
- Planner progress summary changes when a lesson becomes completed.
- Skipped lesson treatment is explicit and tested.

Quran:

- `getQuranSummary` filters by child.
- `getQuranSummary` filters by date range.
- `getQuranSummary` returns sessions by child with human names if added there.
- Weekly session summary includes the intended days and counts.

Alerts:

- Child-scoped alerts include a display name if the contract adds `childName`.
- Household alerts do not render technical child IDs.

### API tests

Planner:

- `PATCH /api/planner/lessons/:id/complete` returns updated lesson with status `completed`.
- Same route returns updated lesson with status `skipped`.
- `GET /api/planner/progress` reflects completed status.

Quran:

- `GET /api/quran/summary?childId=<id>` returns only that child’s summary.
- `POST /api/quran/sessions` followed by `GET /api/quran/summary` reflects the new session.
- Summary date filters work.

Records:

- `GET /api/dashboard/records?childId=<id>` Progress Updates count changes when a current-week lesson is completed.
- `GET /api/dashboard/records?childId=<id>` Quran Sessions count changes after a Quran session is added.

Alerts:

- `GET /api/alerts?childId=<id>` returns child-scoped alerts with display-safe labels.

### Integration tests

Dashboard Per-Child Progress:

- Does not render internal child selector.
- Uses selected child passed from Dashboard/page context.
- Renders vertical bars.
- Shows empty state for empty planner progress.

Lessons page:

- Given the same lesson in Today and All Lessons, clicking Mark done updates both views.
- Clicking Skip updates both views.
- API failure rolls back or shows error and does not leave inconsistent UI.

QuranStudies/DashboardProvider:

- Saving a Quran session calls/refetches sessions, summary, records, and dashboard summary.
- Weekly Sessions changes after save.
- Child filtering hides other children’s Quran data.

AlertItem:

- Displays child name, not child ID.
- Household alert label is correct.

### Playwright tests

Dashboard/progress:

1. Open Dashboard.
2. Select Child A.
3. Confirm Per-Child Progress shows Child A planner progress only.
4. Select Child B.
5. Confirm Child A progress labels disappear and Child B progress appears or empty state appears.
6. Select All Children.
7. Confirm active-child aggregate/grouped bars appear and archived children are absent.

Lessons status sync:

1. Open `/lessons`.
2. Locate a lesson scheduled for today that also appears under All Lessons.
3. Click Mark done in Today.
4. Confirm Today row shows Done/Completed.
5. Confirm the same All Lessons card shows Completed without refresh.
6. Refresh page.
7. Confirm status remains Completed.
8. Repeat for Skipped.

Quran reactivity:

1. Open Dashboard.
2. Select Child A.
3. Log a Quran session.
4. Confirm Quran Logging updates.
5. Confirm Weekly Sessions updates.
6. Confirm Records & Proof Quran Sessions count updates.
7. Select Child B.
8. Confirm Child A Quran session is hidden.
9. Select All Children.
10. Confirm active-child aggregation includes Child A session.

Needs Attention child label:

1. Open Dashboard.
2. Confirm Needs Attention shows child names.
3. Assert raw seed IDs such as `STUDENT_SEED_` are not visible.

Records progress:

1. Open `/lessons` and mark a current-week lesson completed.
2. Return to Dashboard.
3. Confirm Records & Proof Progress Updates count reflects the completed current-week lesson.

## 10. Build Phases

Run phases sequentially. Do not launch parallel agents.

### Phase 1 — Lesson status synchronization

Files expected to change:

- `features/planner/front/components/TodayLessonCard.tsx`
- `features/planner/front/pages/LessonsPage.tsx`
- Planner tests/e2e tests for status sync

Files that should not change:

- Dashboard provider/context
- Quran service/API
- Records route

Implementation outline:

1. Add failing tests for Today-to-All-Lessons status sync.
2. Add `onLessonStatusChange` callback to `TodayLessonCard`.
3. Use `plannerApi.completeLesson` returned lesson to call the callback.
4. In `LessonsPage`, update `lessons` state by ID or call `fetchLessons()` after success.
5. Preserve rollback/error behavior.
6. Run targeted planner tests.

Commit:

```txt
fix(planner): sync lesson status across lessons page
```

### Phase 2 — Dashboard Per-Child Progress chart correction

Files expected to change:

- `features/dashboard/front/components/PerChildProgress.tsx`
- `features/dashboard/front/pages/Dashboard.tsx`
- `features/dashboard/front/utils/transformProgress.ts` if counts/labels need transformation
- Dashboard component tests/e2e tests

Files that should not change:

- Quran service/API
- Planner mutation route
- Records route

Implementation outline:

1. Add failing integration test that internal child selector is absent and page selection drives data.
2. Add failing test for vertical chart/empty state.
3. Remove internal `useState` child selector from `PerChildProgress`.
4. Pass `selectedChildId` and selected/all-children mode from Dashboard.
5. Render vertical bars.
6. Remove Quran ring from this component.
7. Run targeted dashboard tests.

Commit:

```txt
fix(dashboard): use page selection for progress chart
```

### Phase 3 — Quran summary wiring and Weekly Sessions behavior

Files expected to change:

- `features/quran/server/service.ts`
- `features/quran/api/routes/summary.ts`
- `features/quran/front/services/api.ts` only if response type changes
- `features/dashboard/front/context/DashboardProvider.tsx`
- `features/dashboard/front/components/QuranStudies.tsx`
- Quran/dashboard tests/e2e tests

Files that should not change:

- Planner lesson mutation route
- PerChildProgress after Phase 2 unless a direct dependency requires it

Implementation outline:

1. Add failing Quran summary tests for child/date/session aggregation.
2. Add failing dashboard integration test for Quran summary/session refresh after save.
3. Expand summary shape if needed.
4. Fetch Quran summary in DashboardProvider.
5. Refetch summary after `addQuranSession`.
6. Update Weekly Sessions to use summary or aligned session-derived data.
7. Remove hard chart cap or make it dynamic.
8. Decide/test whether week means seven days or Mon–Fri. Preferred seven days.
9. Run targeted Quran/dashboard tests.

Commit:

```txt
fix(quran): wire dashboard to quran summary
```

### Phase 4 — Records and dashboard derived refetch rules

Files expected to change:

- `features/dashboard/front/context/DashboardProvider.tsx`
- `features/dashboard/api/routes/records.ts` only if current-week logic or Quran summary source needs correction
- Records/dashboard tests/e2e tests

Files that should not change:

- Planner UI except direct callback from Phase 1 if already done
- Quran UI except direct summary dependency from Phase 3 if already done

Implementation outline:

1. Add tests for records progress and Quran count after mutations.
2. Add/refine provider refresh functions:
   - `refreshDashboardSummary`
   - `refreshRecords`
   - `refreshAlerts`
   - `refreshQuran`
   - optional `refreshPlannerProgress` where Dashboard owns progress state.
3. Ensure visible dashboard sections refetch after Quran mutation.
4. Document planner mutation refresh limitation if mutation happens outside Dashboard and dashboard is not mounted. Dashboard must fetch fresh on load.
5. Run targeted dashboard/records tests.

Commit:

```txt
fix(dashboard): refresh derived records after mutations
```

### Phase 5 — Needs Attention child label cleanup

Files expected to change:

- `features/alerts/types.ts` if adding `childName`
- `features/alerts/server/service.ts`
- `features/dashboard/front/components/shared/AlertItem.tsx`
- Alert/dashboard tests/e2e tests

Files that should not change:

- Planner status mutation code
- Quran summary code

Implementation outline:

1. Add failing test that AlertItem does not render raw child ID.
2. Add `childName` to generated child-scoped alerts or pass a lookup map.
3. Render `childName` in AlertItem.
4. Label household alerts intentionally.
5. Run targeted alerts/dashboard tests.

Commit:

```txt
fix(alerts): show student names in needs attention
```

### Phase 6 — Cross-feature Playwright regression pass

Files expected to change:

- Relevant `e2e/*.spec.ts`
- No product code unless a failing test reveals an implementation bug

Implementation outline:

1. Add/strengthen Playwright tests listed above.
2. Ensure tests assert state changes, not just element existence.
3. Run the specific Playwright specs first.
4. Run full Playwright only after targeted specs pass.

Commit:

```txt
test(dashboard): cover planner quran reactivity regressions
```

## 11. Out of Scope

- Do not add a global event bus/pub-sub system.
- Do not migrate all records APIs to a new `features/records` module in this pass.
- Do not replace the in-memory stores with Postgres.
- Do not add new dashboard seed/store fallback data.
- Do not redesign all dashboard cards.
- Do not implement file/photo upload or PDF export.
- Do not change unrelated app shell, auth, payments, AI, deployment, or theme-only files.
- Do not run parallel implementation agents.

## 12. Manual QA Plan

### Lessons status sync

1. Open `/lessons`.
2. Confirm a lesson due today appears in Today and All Lessons.
3. Click Mark done in Today.
4. Confirm Today shows Done/Completed.
5. Confirm the same All Lessons card shows Completed immediately.
6. Refresh the page.
7. Confirm the card still shows Completed.
8. Repeat with another lesson and Skip.

### Dashboard progress

1. Open Dashboard.
2. Select Child A using the page-level selector.
3. Confirm Per-Child Progress has no internal child buttons.
4. Confirm the chart shows Child A planner progress.
5. Select Child B.
6. Confirm Child A progress is hidden.
7. Select All Children.
8. Confirm active-child aggregate/grouped bars are visible.
9. Confirm no archived child appears.

### Quran

1. Open Dashboard.
2. Select Child A.
3. Log a Quran session.
4. Confirm the logging card updates.
5. Confirm Weekly Sessions updates.
6. Confirm Records & Proof Quran Sessions count updates.
7. Select Child B.
8. Confirm Child A session is hidden.
9. Select All Children.
10. Confirm active-child aggregation includes the session.

### Needs Attention

1. Open Dashboard.
2. Inspect Needs Attention.
3. Confirm child labels show names, not raw IDs.
4. Confirm no `STUDENT_SEED_` text is visible.

### Records Progress Updates

1. Open `/lessons`.
2. Mark a current-week lesson completed.
3. Open Dashboard.
4. Confirm Records & Proof Progress Updates count changed according to current-week completed lesson rules.

## 13. Branch and Commit Plan

Branch: continue on `claude/fix-planner-bugs` unless the user asks for a new branch.

Sequential commits only:

```txt
fix(planner): sync lesson status across lessons page
fix(dashboard): use page selection for progress chart
fix(quran): wire dashboard to quran summary
fix(dashboard): refresh derived records after mutations
fix(alerts): show student names in needs attention
test(dashboard): cover planner quran reactivity regressions
```

Before each commit:

- Run the phase’s targeted unit/API/integration tests.
- Run the relevant Playwright spec if the phase has user-visible cross-feature behavior.
- State what changed and what remains.

Before final completion:

```bash
npm test
npm run build
npx playwright test
```

All must pass before calling the branch done.

## 14. Risks and Rollback

### Risk: changing chart data breaks existing dashboard tests

Mitigation: update tests to verify observable behavior, not internal Nivo structure. Use accessible labels and visible text where possible.

Rollback: revert Phase 2 commit only; it should be isolated from planner/Quran mutation behavior.

### Risk: Quran summary duplicates session chart logic

Mitigation: choose one summary/session-derived helper and use it consistently. Do not compute different weekly rules in dashboard and service.

Rollback: revert Phase 3 commit and keep sessions endpoint behavior intact.

### Risk: status sync optimistic update creates mismatch after failed PATCH

Mitigation: prefer refetch after successful PATCH or use returned lesson with rollback on failure.

Rollback: revert Phase 1 commit; planner API remains unchanged.

### Risk: Records route remains dashboard-owned

Mitigation: explicitly document this as temporary and keep it feature-service-composed. Named follow-up: move records summaries to `features/records` or `features/reports`.

Rollback: revert Phase 4 commit if records counts regress.

### Risk: parallel agents or broad audits consume quota and create conflicting changes

Mitigation: sequential phases only; inspect only files listed in the phase unless a direct import or test failure requires more.

Rollback: stop, inspect git diff, revert only the latest phase commit.

## Final Regression Checklist

- Per-Child Progress has no internal child selector.
- Per-Child Progress uses dashboard page-level selected child.
- Per-Child Progress is a vertical bar chart.
- Per-Child Progress does not render Quran ring/progress from planner data.
- Lessons Today status changes update All Lessons immediately.
- Lesson status persists after refresh.
- Dashboard planner progress reflects completed lessons after refetch.
- Quran summary endpoint is used by dashboard Quran-derived views.
- Saving Quran session updates Quran Logging, Weekly Sessions, Records & Proof Quran count, and dashboard summary where applicable.
- Weekly Sessions chart scale is not hard-capped incorrectly.
- Progress Updates count behavior is documented and tested.
- Needs Attention shows student names, not raw IDs.
- No new dashboard seed/store data was added.
- No parallel agents were used.
