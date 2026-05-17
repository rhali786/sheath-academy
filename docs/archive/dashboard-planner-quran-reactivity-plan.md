# Development Plan — Dashboard Learning Activity, Planner Status, Quran Streak, and Alerts

Branch: `claude/fix-planner-bugs`

## 1. Summary

Fix the remaining dashboard/planner/Quran/alerts issues by replacing the old Per-Child Progress/Quran Progress presentation with a clearer three-card dashboard learning activity section, syncing lesson status changes from the lesson edit form to All Lessons and dashboard counts, wiring Quran streak and session logging to the Quran feature, and making alerts display child names and link to their owning pages.

This is a Mode 3 cross-feature dashboard plan. It touches dashboard composition, planner lesson status, Quran session summaries/streaks, records counts, alerts, and selected-child behavior.

Do not run parallel implementation agents. Complete one phase, test it, commit it, and then move to the next phase.

---

## 2. Current Code Path Audit

### Dashboard learning activity area

Current files:

- `features/dashboard/front/components/PerChildProgress.tsx`
- `features/dashboard/front/components/QuranStudies.tsx`
- `features/dashboard/front/pages/Dashboard.tsx`
- `features/dashboard/front/context/DashboardProvider.tsx`
- `features/dashboard/front/utils/transformProgress.ts`

Current findings:

- `PerChildProgress` has its own internal child selector. This conflicts with the dashboard page-level child selector.
- `PerChildProgress` currently visualizes planner-derived subject progress and also tries to render a Quran ring from fields that are not produced by planner progress data.
- `QuranStudies` currently owns Quran logging and weekly sessions, but the weekly chart is Mon-Fri and hard-capped.
- Dashboard planner progress currently refetches mostly on selected-child changes, not necessarily after planner status mutations.

Correct source of truth:

- Planner owns completed lessons and subject counts.
- Quran owns Quran sessions and streak calculations.
- Dashboard owns only selected-child display state and visual composition.

### Lessons page status sync

Current files:

- `features/planner/front/pages/LessonsPage.tsx`
- Lesson edit form component used by `LessonsPage`.
- `features/planner/front/components/LessonTaskList.tsx`
- `features/planner/front/components/LessonCard.tsx`
- `features/planner/front/services/api.ts`

Current findings:

- All Lessons cards have status badges.
- The bug is not limited to any Today card. When a lesson is edited through the edit form and saved as `completed` or `skipped`, the All Lessons list still shows the old status until the page refreshes or refetches.
- The page-level `lessons` state is not being updated consistently after edit-form status changes.

Correct source of truth:

- Planner owns lesson status.
- `LessonsPage` should own canonical page-level lesson state.
- Child components/forms that mutate a lesson must update or refetch the page-level lesson list after success.

### Quran summary, streak, and logging

Current files:

- `features/quran/server/service.ts`
- `features/quran/api/routes/summary.ts`
- `features/quran/api/routes/sessions.ts`
- `features/quran/front/services/api.ts`
- `features/dashboard/front/components/QuranStudies.tsx`
- `features/dashboard/front/context/DashboardProvider.tsx`

Current findings:

- Quran sessions and a summary endpoint exist, but the dashboard is not fully treating Quran summary/streak as the canonical source for Quran-derived dashboard cards.
- If old QuranStudies cards are removed, the dashboard still needs a visible way to log Quran sessions.

Correct source of truth:

- Quran feature owns sessions, session summaries, and streak calculation.
- Dashboard may expose a Quran logging action, but it must call Quran feature APIs and refetch Quran-derived dashboard data.

### Records & Proof counts

Current files:

- `features/dashboard/front/components/RecordsProof.tsx`
- `features/dashboard/api/routes/records.ts`
- `features/dashboard/front/context/DashboardProvider.tsx`

Current findings:

- Records & Proof is currently composed under dashboard API, but it reads from feature services.
- Progress Updates should be tested and documented as current-week completed lessons.
- Quran Sessions count must update after a Quran session is logged.

Correct source of truth:

- Records/Reports should eventually own summary composition.
- For this corrective pass, leave `GET /api/dashboard/records` temporarily, but keep it composed from feature services only. Do not add dashboard seed/store fallback data.

### Needs Attention alerts

Current files:

- `features/alerts/server/service.ts`
- `features/alerts/types.ts`
- `features/dashboard/front/components/shared/AlertItem.tsx`
- `features/dashboard/front/components/NeedsAttention.tsx`

Current findings:

- Alerts can render raw child IDs such as `STUDENT_SEED_ZAYD_001`.
- Alert cards do not reliably link to the source page they are about.

Correct source of truth:

- Alerts feature owns alert generation.
- Alerts should include display-safe child names and source navigation metadata, or the dashboard must map IDs to names and routes before rendering.

---

## 3. Final Dashboard Learning Activity Design

Replace the current Per-Child Progress/Quran Progress presentation with three playful, bright dashboard cards. Use Nivo only for charts. Use stable child colors across all three cards.

Color is reinforcement, not the only signal. Always show child names and numeric labels.

### Card 1 — Weekly Activity

Purpose: show completed learning activity by day for the current week.

Data sources:

- Completed lessons from Planner.
- Quran sessions from Quran.

Counting rules:

- One completed lesson counts as 1 lesson activity on its completion date.
- One Quran session counts as 1 Quran activity on its session date.
- The week is Sunday through Saturday.
- Counts are not capped. If a child completes 20 lessons/sessions in a day, the bar goes to 20.
- Only completed lessons count. Skipped and not-started lessons do not count.
- Any Quran session type counts.

Selected-child behavior:

- One child selected: show Sunday-Saturday bars for that child.
- All Children selected: each day has one bar per active child.
- Each child/day bar is stacked by activity type: bottom segment = completed lessons; top segment = Quran sessions.
- Include a legend mapping each child to their stable color.
- Archived children are excluded.

Visual requirements:

- Nivo vertical bar chart.
- X-axis: Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday.
- Y-axis: activity count.
- Stacked segments inside each child bar for Lessons and Quran Sessions.
- Tooltip shows child name, day, completed lessons count, Quran sessions count, and total.
- Empty state: `No learning activity logged this week.`

### Card 2 — Subject Activity

Purpose: show completed lesson counts by subject without implying percent completion.

Data source:

- Planner completed lessons.

Counting rules:

- Count completed lessons grouped by subject.
- Use the current week.
- Do not show completion percentage unless a real planned total exists.
- Do not imply a burndown or completion target.

Selected-child behavior:

- One child selected: show that child’s completed lesson counts by subject for the week.
- All Children selected: show active children’s subject counts using the same stable child colors.
- Archived children are excluded.

Visual requirements:

- Prefer a compact Nivo chart if readable; otherwise use playful count tiles.
- Show subject name and count.
- Color-code by child where child grouping is shown.
- Empty state: `No completed lessons by subject this week.`

### Card 3 — Quran Streak

Purpose: show consecutive-day Quran session streaks.

Data source:

- Quran sessions from the Quran feature.

Streak rule:

- Starting from today in the household timezone, count backward one day at a time.
- A day counts if the child has at least one Quran session on that date.
- The streak ends at the first day with no Quran session.
- Any Quran session type counts.

Selected-child behavior:

- One child selected: show that child’s Quran streak circle.
- All Children selected: show one circle per active child.
- Archived children are excluded.

Visual requirements:

- Rename the card from Quran Progress to Quran Streak.
- Remove old `Current` and `Last logged` callouts.
- Show child-colored circle with streak number inside, such as `4 days`.
- Show child name near the circle.
- Empty/no streak state shows `0 days`.
- Include a clear `Log Quran Session` action on this card because the older Quran logging cards may be removed.
- The log action must open the existing Quran session logging flow or a feature-owned Quran logging form.
- After logging, Quran streak, weekly activity, records Quran count, and any Quran session list/summary must refresh.

---

## 4. Acceptance Criteria

### Dashboard learning activity

- Dashboard uses the page-level child selector only.
- No internal child selector appears inside the learning activity cards.
- Selecting Child A shows only Child A learning activity, subject counts, and Quran streak.
- Selecting Child B hides Child A data.
- Selecting All Children shows active children only.
- Archived children never appear in the dashboard learning activity section.
- Child colors are stable across Weekly Activity, Subject Activity, and Quran Streak.

### Weekly Activity

- Weekly Activity uses Sunday-Saturday.
- A completed lesson increases the lesson segment on the correct day.
- A Quran session increases the Quran segment on the correct day.
- Counts are not capped.
- All Children mode shows one stacked bar per active child per day.
- Tooltip/labels identify child, day, lessons, Quran sessions, and total.

### Subject Activity

- Subject Activity counts completed lessons by subject for the current week.
- It does not show fake completion percentages.
- It updates after a lesson is marked completed.
- Skipped lessons do not count unless product direction changes later.

### Quran Streak

- Quran Streak is based on Quran sessions, not planner progress.
- Any Quran session type counts toward the streak.
- One selected child shows one circle.
- All Children shows one circle per active child.
- `Log Quran Session` is visible on the Quran Streak card.
- Logging a Quran session updates the streak immediately without page refresh.

### Lessons page status sync

- On `/lessons`, editing a lesson and saving status `completed` immediately updates the matching card in All Lessons.
- Editing a lesson and saving status `skipped` immediately updates the matching card in All Lessons.
- The status survives page refresh.
- Dashboard Weekly Activity and Subject Activity reflect completed lessons after dashboard data is refetched.

### Records & Proof

- Progress Updates count reflects completed current-week lessons according to the documented rule.
- Quran Sessions count updates after logging a Quran session.

### Alerts

- Needs Attention shows human child names, not raw IDs.
- Each alert links to the page it is about:
  - attendance/absence alerts -> `/attendance`
  - lesson/planner alerts -> `/lessons` or `/planner`
  - Quran alerts -> `/quran` if available, otherwise dashboard Quran logging section until `/quran` exists
  - portfolio alerts -> `/portfolio`
  - records/report alerts -> `/reports` or `/records`
- Alert cards must not be dead-end display-only cards.

---

## 5. Data Contracts and Service Plan

### Weekly Activity contract

Create or derive a dashboard-facing view model from feature services:

```ts
type WeeklyActivityDatum = {
  date: string
  dayLabel: 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday'
  childId: string
  childName: string
  childColor: string
  completedLessons: number
  quranSessions: number
  total: number
}
```

Source rules:

- Completed lessons come from Planner.
- Quran sessions come from Quran.
- Dashboard may compose these into a chart model, but it must not own canonical data.

### Subject Activity contract

```ts
type SubjectActivityDatum = {
  childId: string
  childName: string
  childColor: string
  subjectId: string
  subjectName: string
  completedLessons: number
}
```

### Quran Streak contract

Prefer calculating streak in the Quran service and exposing it through Quran summary:

```ts
type QuranStreakDatum = {
  childId: string
  childName: string
  childColor?: string
  streakDays: number
  lastSessionDate?: string
}
```

`GET /api/quran/summary` should support:

```txt
childId
startDate
endDate
```

And return streak data for selected child or all active children.

### Alerts contract

Preferred addition:

```ts
interface Alert {
  childId: string | null
  childName?: string
  href?: string
  sourceFeature?: 'attendance' | 'planner' | 'quran' | 'portfolio' | 'records' | 'reports' | 'dashboard'
}
```

If alert links are derived in the UI instead of service, add tests proving the route mapping.

---

## 6. Testing Plan — Failing Tests First

Inspect only existing tests in the affected folders before editing:

- `features/dashboard/__tests__`
- `features/planner/__tests__`
- `features/quran/__tests__`
- `features/alerts/__tests__`
- relevant `e2e/` dashboard/planner/quran specs

Do not perform broad test discovery unless a direct import or failure requires it.

### Unit tests

Planner:

- Completed lessons are counted by completion date for Weekly Activity.
- Completed lessons are counted by subject for Subject Activity.
- Skipped lessons do not count in Weekly Activity or Subject Activity.

Quran:

- Any Quran session type counts toward Quran activity.
- Quran streak counts consecutive days backward from today.
- Quran streak stops at the first missing day.
- Quran streak filters by child.
- All Children streak excludes archived children.

Alerts:

- Child-scoped alerts include child name or are resolvable to child name.
- Alerts include or resolve correct `href` by source feature.

### API tests

Planner:

- Editing lesson status to `completed` persists and returns updated status.
- Editing lesson status to `skipped` persists and returns updated status.
- Progress/activity endpoint or composed service reflects completed current-week lessons.

Quran:

- `POST /api/quran/sessions` followed by `GET /api/quran/summary` updates streak and session counts.
- `GET /api/quran/summary?childId=<id>` returns only that child’s streak/session summary.
- All Children summary excludes archived children.

Records:

- Records Progress Updates count changes after a current-week lesson is completed.
- Records Quran Sessions count changes after a Quran session is logged.

Alerts:

- `GET /api/alerts?childId=<id>` returns alert data with child display names and navigable hrefs or source metadata.

### Integration tests

Dashboard learning activity:

- Renders three cards: Weekly Activity, Subject Activity, Quran Streak.
- Does not render an internal child selector.
- Uses page-level selected child.
- Weekly Activity renders seven days.
- All Children renders grouped child bars with stacked activity segments.
- Subject Activity shows weekly completed counts by subject.
- Quran Streak shows one circle for selected child and multiple circles for All Children.
- `Log Quran Session` action is visible on Quran Streak card and refreshes dashboard Quran-derived data.

Lessons page:

- Editing a lesson to Completed updates the All Lessons card immediately.
- Editing a lesson to Skipped updates the All Lessons card immediately.
- Page refresh preserves the status.

Alerts:

- AlertItem renders child name.
- AlertItem has an href matching source type.
- Raw seed IDs such as `STUDENT_SEED_` are not visible.

### Playwright tests

Dashboard learning activity:

1. Open Dashboard.
2. Select Child A.
3. Confirm Weekly Activity shows Child A data only.
4. Confirm Subject Activity shows Child A subject counts only.
5. Confirm Quran Streak shows one Child A circle.
6. Select Child B.
7. Confirm Child A labels disappear.
8. Select All Children.
9. Confirm active children appear with stable legend/colors.
10. Confirm archived children do not appear.

Lesson status sync:

1. Open `/lessons`.
2. Open a lesson edit form.
3. Change status to Completed and save.
4. Confirm the matching All Lessons card shows Completed without refresh.
5. Refresh page and confirm Completed persists.
6. Repeat for Skipped.

Quran logging/streak:

1. Open Dashboard.
2. Select Child A.
3. Click `Log Quran Session` on Quran Streak card.
4. Save a Quran session.
5. Confirm Quran Streak updates.
6. Confirm Weekly Activity Quran segment updates for the correct day.
7. Confirm Records & Proof Quran count updates.
8. Select Child B and confirm Child A session is hidden.
9. Select All Children and confirm aggregation includes Child A.

Alerts:

1. Open Dashboard.
2. Confirm Needs Attention shows child names.
3. Confirm no `STUDENT_SEED_` text is visible.
4. Click an attendance alert and confirm navigation to `/attendance`.
5. Click a lesson alert and confirm navigation to `/lessons` or `/planner`.

---

## 7. Build Phases

### Phase 1 — Lessons edit-form status synchronization

Expected files:

- `features/planner/front/pages/LessonsPage.tsx`
- lesson edit form component used by `LessonsPage`
- `features/planner/front/components/LessonTaskList.tsx` only if needed
- planner tests/e2e tests

Implementation outline:

1. Add failing tests for edit-form status save updating All Lessons.
2. Ensure the edit form returns or emits the updated lesson after save.
3. Update `LessonsPage` page-level `lessons` state by ID or refetch lessons after successful save.
4. Preserve status after refresh.

Commit:

```txt
fix(planner): sync edit status to lessons list
```

### Phase 2 — Dashboard learning activity cards

Expected files:

- `features/dashboard/front/pages/Dashboard.tsx`
- `features/dashboard/front/components/PerChildProgress.tsx` or new learning activity components
- `features/dashboard/front/components/QuranStudies.tsx` if consolidating/removing old cards
- `features/dashboard/front/utils/transformProgress.ts` or new chart-model helpers
- dashboard tests/e2e tests

Implementation outline:

1. Add tests for three-card layout.
2. Remove internal child selector.
3. Build Weekly Activity chart model from completed planner lessons and Quran sessions.
4. Render Nivo vertical Sun-Sat chart with stacked Lessons/Quran segments.
5. Build Subject Activity weekly completed-count card.
6. Build Quran Streak card with circles and Log Quran Session action.
7. Remove old Current/Last Logged callouts.

Commit:

```txt
feat(dashboard): add weekly activity and quran streak cards
```

### Phase 3 — Quran summary and streak service

Expected files:

- `features/quran/server/service.ts`
- `features/quran/api/routes/summary.ts`
- `features/quran/front/services/api.ts`
- dashboard provider if summary wiring lives there
- Quran tests

Implementation outline:

1. Add failing streak tests.
2. Implement streak calculation in Quran service.
3. Add streak data to Quran summary.
4. Ensure selected child and All Children filtering work.
5. Ensure Dashboard refetches summary after logging a session.

Commit:

```txt
fix(quran): expose session streak summary
```

### Phase 4 — Records and cross-feature refresh

Expected files:

- `features/dashboard/front/context/DashboardProvider.tsx`
- `features/dashboard/api/routes/records.ts` only if count logic needs correction
- dashboard/records tests

Implementation outline:

1. Add failing tests for records counts after planner/Quran mutations.
2. Refetch dashboard summary, records, alerts, Quran summary/sessions, and chart models after relevant mutations.
3. Do not add global event bus.

Commit:

```txt
fix(dashboard): refresh derived learning summaries
```

### Phase 5 — Alert names and links

Expected files:

- `features/alerts/types.ts`
- `features/alerts/server/service.ts`
- `features/dashboard/front/components/shared/AlertItem.tsx`
- alert/dashboard tests/e2e tests

Implementation outline:

1. Add failing tests for child names and hrefs.
2. Add childName and href/source metadata to alert objects or derive them safely in UI.
3. Render alert cards as links.
4. Route alerts to their owning pages.

Commit:

```txt
fix(alerts): link needs attention to source pages
```

### Phase 6 — Regression Playwright pass

Expected files:

- relevant `e2e/*.spec.ts`

Implementation outline:

1. Add/strengthen Playwright tests listed above.
2. Assert state changes, not element existence only.
3. Run targeted specs first.
4. Run full Playwright after targeted specs pass.

Commit:

```txt
test(dashboard): cover learning activity regressions
```

---

## 8. Out of Scope

- No global event bus.
- No Postgres migration.
- No new dashboard seed/store fallback data.
- No file/photo upload.
- No PDF export.
- No unrelated auth, payments, AI, deployment, or theme-only work.
- No parallel implementation agents.
- No solving the future color-exhaustion problem for very large child counts. If colors run out, that is a later bug.

---

## 9. Manual QA

### Lessons

1. Open `/lessons`.
2. Open a lesson edit form.
3. Change status to Completed and save.
4. Confirm the All Lessons card changes to Completed immediately.
5. Refresh and confirm Completed persists.
6. Repeat with Skipped.

### Dashboard Weekly Activity

1. Open Dashboard.
2. Select one child.
3. Complete a lesson for that child this week.
4. Confirm that child’s lesson segment increases on the correct weekday.
5. Log a Quran session.
6. Confirm that child’s Quran segment increases on the correct weekday.
7. Select All Children.
8. Confirm each active child has their own colored bar per day and that each bar is stacked by Lessons/Quran.

### Dashboard Subject Activity

1. Complete a lesson in a known subject.
2. Open Dashboard.
3. Confirm the subject count increases for the selected child.
4. Select another child and confirm the first child’s count is hidden.

### Quran Streak

1. Open Dashboard.
2. Select a child.
3. Click Log Quran Session on the Quran Streak card.
4. Save a session.
5. Confirm streak updates.
6. Select All Children.
7. Confirm all active children have streak circles.

### Alerts

1. Open Dashboard.
2. Confirm Needs Attention shows names, not raw IDs.
3. Click an attendance alert and confirm it opens `/attendance`.
4. Click a lesson alert and confirm it opens `/lessons` or `/planner`.

---

## 10. Final Acceptance Checklist

- Three dashboard learning activity cards exist: Weekly Activity, Subject Activity, Quran Streak.
- Weekly Activity is a Nivo vertical Sun-Sat chart.
- Weekly Activity counts completed lessons and Quran sessions only.
- Weekly Activity supports selected child and All Children grouped child bars.
- Each child/day bar is stacked by Lessons and Quran.
- Subject Activity counts current-week completed lessons by subject.
- Quran Streak calculates consecutive days from Quran sessions.
- Quran Streak includes Log Quran Session.
- Lessons edit-form status changes update All Lessons immediately.
- Lesson statuses persist after refresh.
- Records counts update from planner/Quran changes.
- Alerts show child names and link to source pages.
- No raw `STUDENT_SEED_` IDs are visible.
- No new dashboard seed/store fallback data was added.
- No parallel agents were used.

Before declaring done:

```bash
npm test
npm run build
npx playwright test
```

All must pass.
