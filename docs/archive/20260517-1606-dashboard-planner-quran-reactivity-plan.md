# Development Plan — Dashboard Learning Activity, Planner Status, Quran Streak, and Alerts

Branch: `claude/fix-planner-bugs`

Archived from: `docs/dashboard-planner-quran-reactivity-plan.md`

Note: active replacement exists at `docs/bug_enhancement/20260517-1600-dashboard-learning-activity-reactivity.md`.

## Summary

Fix the remaining dashboard/planner/Quran/alerts issues by replacing the old Per-Child Progress/Quran Progress presentation with a clearer three-card dashboard learning activity section, syncing lesson status changes from the lesson edit form to All Lessons and dashboard counts, wiring Quran streak and session logging to the Quran feature, and making alerts display child names and link to their owning pages.

This is a Mode 3 cross-feature dashboard plan. It touches dashboard composition, planner lesson status, Quran session summaries/streaks, records counts, alerts, and selected-child behavior.

Do not run parallel implementation agents. Complete one phase, test it, commit it, and then move to the next phase.

## Current Code Path Audit

### Dashboard learning activity area

Current files:

- `features/dashboard/front/components/PerChildProgress.tsx`
- `features/dashboard/front/components/QuranStudies.tsx`
- `features/dashboard/front/pages/Dashboard.tsx`
- `features/dashboard/front/context/DashboardProvider.tsx`
- `features/dashboard/front/utils/transformProgress.ts`

Current findings:

- `PerChildProgress` has its own internal child selector. This conflicts with the dashboard page-level child selector.
- `PerChildProgress` visualizes planner-derived subject progress and tries to render a Quran ring from fields that are not produced by planner progress data.
- `QuranStudies` owns Quran logging and weekly sessions, but the weekly chart is Mon-Fri and hard-capped.
- Dashboard planner progress refetches mostly on selected-child changes, not necessarily after planner status mutations.

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
- When a lesson is edited and saved as `completed` or `skipped`, the All Lessons list can still show the old status until refresh/refetch.
- The page-level `lessons` state is not being updated consistently after edit-form status changes.

Correct source of truth:

- Planner owns lesson status.
- `LessonsPage` should own canonical page-level lesson state.
- Mutating child components/forms must update or refetch the page-level lesson list after success.

### Quran summary, streak, and logging

Current files:

- `features/quran/server/service.ts`
- `features/quran/api/routes/summary.ts`
- `features/quran/api/routes/sessions.ts`
- `features/quran/front/services/api.ts`
- `features/dashboard/front/components/QuranStudies.tsx`
- `features/dashboard/front/context/DashboardProvider.tsx`

Current findings:

- Quran sessions and a summary endpoint exist, but dashboard is not fully treating Quran summary/streak as canonical for Quran-derived dashboard cards.
- If old QuranStudies cards are removed, dashboard still needs a visible way to log Quran sessions.

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
- For this corrective pass, leave `GET /api/dashboard/records` temporarily, but keep it composed from feature services only.

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

## Final Dashboard Learning Activity Design

Replace current Per-Child Progress/Quran Progress presentation with three bright, playful dashboard cards. Use Nivo only for charts. Use stable child colors across all three cards. Always show child names and numeric labels.

### Card 1 — Weekly Activity

Purpose: show completed learning activity by day for the current week.

Data sources:

- Completed lessons from Planner.
- Quran sessions from Quran.

Counting rules:

- One completed lesson counts as 1 lesson activity on its completion date.
- One Quran session counts as 1 Quran activity on its session date.
- Week is Sunday through Saturday.
- Counts are not capped.
- Only completed lessons count.
- Skipped and not-started lessons do not count.
- Any Quran session type counts.

Selected-child behavior:

- One child selected: show Sunday-Saturday bars for that child.
- All Children selected: each day has one bar per active child.
- Each child/day bar is stacked by activity type: bottom segment = completed lessons; top segment = Quran sessions.
- Include child color legend.
- Archived children are excluded.

### Card 2 — Subject Activity

Purpose: show completed lesson counts by subject without implying percent completion.

Rules:

- Count completed lessons grouped by subject.
- Use the current week.
- Do not show fake percentages, burndown, or target completion unless a real planned total exists.
- One child selected: show that child only.
- All Children selected: show active children only.

### Card 3 — Quran Streak

Purpose: show consecutive-day Quran session streaks.

Rules:

- Starting from today in the household timezone, count backward one day at a time.
- A day counts if the child has at least one Quran session.
- The streak ends at the first day with no Quran session.
- Any Quran session type counts.
- One selected child shows one circle.
- All Children shows one circle per active child.
- Archived children are excluded.
- Include `Log Quran Session`.
- Remove old `Current` and `Last logged` callouts.

## Acceptance Criteria

- Dashboard uses page-level child selector only.
- No internal child selector appears inside learning activity cards.
- Selecting Child A shows only Child A data.
- Selecting Child B hides Child A data.
- Selecting All Children shows active children only.
- Weekly Activity uses Sunday-Saturday.
- Completed lessons and Quran sessions increase correct weekday segments.
- Subject Activity counts current-week completed lessons by subject.
- Quran Streak is based on Quran sessions, not planner progress.
- Log Quran Session updates streak immediately.
- On `/lessons`, saving status `completed` or `skipped` updates the matching All Lessons card immediately and survives refresh.
- Progress Updates reflects completed current-week lessons.
- Quran Sessions count updates after Quran logging.
- Needs Attention shows human names and source links.

## Data Contracts

Weekly Activity datum:

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

Subject Activity datum:

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

Quran Streak datum:

```ts
type QuranStreakDatum = {
  childId: string
  childName: string
  childColor?: string
  streakDays: number
  lastSessionDate?: string
}
```

## Testing Plan

Unit tests:

- Planner completed lessons count by completion date and subject.
- Skipped lessons do not count.
- Any Quran session type counts toward activity and streak.
- Quran streak counts consecutive days backward and stops at first missing day.
- Alerts include/resolve child names and source hrefs.

API tests:

- Editing lesson status to `completed` or `skipped` persists and returns updated status.
- Posting Quran session updates summary/streak/session counts.
- Records counts update after planner/Quran mutations.
- Alerts API returns display-safe names and navigable hrefs/source metadata.

Integration tests:

- Dashboard renders Weekly Activity, Subject Activity, Quran Streak.
- Dashboard uses page-level selector only.
- Weekly Activity renders seven days.
- All Children excludes archived children.
- Quran Streak renders selected/all children correctly.
- Lessons edit form updates All Lessons immediately.
- AlertItem renders child names and hrefs.

Playwright tests:

- Dashboard selected child changes displayed data.
- Lesson status edit persists after refresh.
- Quran logging updates streak, weekly activity, and Records & Proof.
- Needs Attention shows names and links.

## Build Phases

1. Lessons edit-form status synchronization.
2. Dashboard learning activity cards.
3. Quran summary and streak service.
4. Records and cross-feature refresh.
5. Alert names and links.
6. Regression Playwright pass.

## Out of Scope

- No global event bus.
- No Postgres migration.
- No new dashboard seed/store fallback data.
- No file/photo upload.
- No PDF export.
- No unrelated auth, payments, AI, deployment, or theme-only work.
- No parallel implementation agents.
- No future color-exhaustion fix.

## Final Acceptance Checklist

- Three dashboard learning activity cards exist: Weekly Activity, Subject Activity, Quran Streak.
- Weekly Activity is a Nivo vertical Sun-Sat chart.
- Weekly Activity counts completed lessons and Quran sessions only.
- Each child/day bar is stacked by Lessons and Quran.
- Subject Activity counts current-week completed lessons by subject.
- Quran Streak calculates consecutive days from Quran sessions and includes Log Quran Session.
- Lesson status changes update immediately and persist.
- Records counts update from planner/Quran changes.
- Alerts show child names and link to source pages.
- No raw `STUDENT_SEED_` IDs are visible.
- No dashboard seed/store fallback data was added.
- No parallel agents were used.

Before declaring done:

```bash
npm test
npm run build
npx playwright test
```
