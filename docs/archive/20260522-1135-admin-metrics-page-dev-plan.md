# Dev Plan — Admin Metrics Page for Sheath Academy

Recommended repo path:

```txt
bugs_enhancement/admin-metrics-page-dev-plan.md
```

## Goal

Create an admin-only metrics page that shows whether people are actually using Sheath Academy, not just saying they like it.

This page should support the Fork Test Framework: does the app help families actually create learners, log learning, complete sessions, preserve evidence, generate reports, and return later?

Do not overbuild analytics first. Track only events that help answer real usage questions.

## Planning Mode

Mode 4 — New Feature  
Mode 5 — Small persistence foundation

Reason:

- New admin-only UI surface
- New database-backed usage event model
- New API routes
- Cross-feature event instrumentation
- Admin authorization required
- Unit, API, integration, and Playwright tests required

## Branch

```txt
feature/admin-metrics-fork-test
```

Alternative if database setup becomes the main work:

```txt
feature/persisted-admin-metrics
```

## Required Pre-Implementation Audit

Before coding, audit only the code paths needed for this feature. Do not broadly explore the repo.

For each affected behavior, identify:

| Area | What to identify |
|---|---|
| Auth/session | Where user identity and roles are stored |
| Admin access | Whether an admin role already exists |
| Family/program model | Where household/workspace/program records live |
| Learner model | Where child/learner creation happens |
| Lesson/session model | Where sessions, lesson starts, or completions are created |
| Qur’an/Arabic/Islamic Studies records | Whether these are subject-based lessons or separate records |
| Evidence model | Where portfolio evidence is created |
| Reports model | Where reports/print/export actions happen |
| Database layer | Prisma, Supabase, Drizzle, raw SQL, or current persistence layer |
| Existing tests | Unit/API/component/Playwright patterns |

Only inspect another file if a direct import, failing test, or implementation error requires it.

## Source of Truth Ownership

| Data | Owning feature |
|---|---|
| Analytics/usage events | `admin-metrics` or `usage-metrics` |
| Families/programs | Account/workspace feature |
| Learners | Child/learner feature |
| Lessons/sessions | Planner / lesson-tasks feature |
| Attendance | Attendance feature |
| Evidence | Portfolio feature |
| Reports | Reports feature |
| Qur’an/Arabic/Islamic Studies records | Existing subject/lesson model for MVP unless native models exist |
| Admin page | Admin metrics composes only |

Admin metrics should not own learner data, evidence data, reports data, or session data. It should read from feature-owned data and persisted usage events.

Do not create dashboard seed/store data to fake metrics.

## Data Persistence Decision

Create durable database-backed usage events.

Recommended table/model:

```ts
UsageEvent {
  id: string;
  eventType: UsageEventType;
  userId: string;
  workspaceId: string;
  learnerId?: string;
  featureArea: FeatureArea;
  entityType?: string;
  entityId?: string;
  metadata?: Json;
  occurredAt: Date;
}
```

Recommended feature areas:

```ts
type FeatureArea =
  | "account"
  | "learners"
  | "planner"
  | "attendance"
  | "quran"
  | "arabic"
  | "islamic_studies"
  | "portfolio"
  | "reports"
  | "admin";
```

Recommended event types:

```ts
type UsageEventType =
  | "user_active"
  | "family_created"
  | "learner_created"
  | "session_started"
  | "session_completed"
  | "session_abandoned"
  | "lesson_completed"
  | "quran_record_created"
  | "arabic_record_created"
  | "islamic_studies_record_created"
  | "evidence_created"
  | "report_generated"
  | "feature_viewed";
```

If the repo already has an event or audit system, wrap it behind a metrics service instead of creating a parallel system.

## Admin Route

```txt
/admin/metrics
```

This should be a separate admin surface, not part of the parent dashboard.

## Admin-Only Access

Acceptance criteria:

- Unauthenticated users cannot access `/admin/metrics`.
- Authenticated non-admin users cannot access `/admin/metrics`.
- Admin users can access `/admin/metrics`.
- Non-admin users cannot call admin metrics APIs.
- Admin-only API routes return 401 for unauthenticated users and 403 for non-admin users.

If admin roles do not exist yet, add the smallest viable role gate, such as:

```ts
role: "admin" | "parent"
```

Do not build a full role-management UI in this slice.

## API Routes

Recommended routes:

```txt
GET /api/admin/metrics/summary
GET /api/admin/metrics/users
GET /api/admin/metrics/events
POST /api/usage-events
```

If usage events are emitted only server-side, `POST /api/usage-events` may be replaced by an internal service function.

## Hero Bar

The hero bar should summarize trends, not replace the table.

Use 1–3 trend cards:

| Hero card | Includes | Why it matters |
|---|---|---|
| Active users / families | Active users, active families/programs | Shows whether people return |
| Learning activity | Sessions logged, completion events | Shows whether learning is happening |
| Proof and records | Evidence added, reports generated | Shows whether records/proof are being used |

Default period:

```txt
Last 30 days
```

Comparison period:

```txt
Previous 30 days
```

Use simple trend cards or lightweight sparklines. Do not introduce heavy analytics or charting unless the app already has a clear charting convention.

## Main Admin Metrics Table

The page should be table-first.

Default row grain:

```txt
one row per workspace/family/program + primary user
```

If programs later contain many families, add grouping modes later:

```txt
Program view
Family/workspace view
User view
```

### Required Table Columns

All named Fork Test metrics should appear in the main table either as direct columns or compact expandable cells.

| Column | Metric | Why it exists |
|---|---|---|
| User | User name/email | Identifies who is using the app |
| Family / Program | Workspace or program name | Shows active families/programs |
| Active? | Active in selected period: yes/no | Supports active user count |
| Last active date | Most recent meaningful event | Shows whether users return |
| Learners created | Count of learners/children created | Shows setup progress |
| Sessions logged | Count of sessions or completed lesson activity | Shows real learning usage |
| Completion events | Count of completed sessions/lessons | Shows follow-through, not just starts |
| Started not completed | Count of started sessions without completion | Shows drop-off during learning |
| Qur’an records | Count of Qur’an learning records | Tracks Muslim-native usage |
| Arabic records | Count of Arabic learning records | Tracks Muslim-native usage |
| Islamic Studies records | Count of Islamic Studies records | Tracks Muslim-native usage |
| Evidence uploaded / added | Count of evidence items created | Shows proof-of-learning usage |
| Reports generated | Count of report views/prints/exports | Shows records portability/trust usage |
| Feature usage by area | Compact counts by feature area | Shows which parts of the app earn use |
| Drop-off signals | Learners no activity, started not completed, no evidence, no reports | Shows Fork Test failure points |

### Feature Usage by Area Cell

Display as compact badges or a detail popover:

```txt
Planner: 14
Attendance: 9
Portfolio: 3
Reports: 1
Qur’an: 5
Arabic: 2
Islamic Studies: 1
```

This should not be hidden only in a secondary section. It answers which parts of the app are actually being used.

### Drop-Off Signals

Use calm labels:

```txt
Learners created, no activity
Started session, not completed
Learning activity, no evidence
Records exist, no report generated
Inactive 30+ days
```

Avoid:

```txt
Failed
Bad user
Non-compliant
```

### Table Filters

| Filter | Purpose |
|---|---|
| Date range | View usage over selected period |
| Active / inactive | Find retained vs inactive users |
| Feature area | Filter users by area used |
| Drop-off type | Find specific friction points |
| Family / program | Narrow to one organization |
| Has learners but no activity | Fork Test setup-drop filter |
| Has session starts but no completions | Fork Test completion-drop filter |

Default sort:

```txt
Last active date descending
```

Secondary useful sorts:

```txt
Most sessions logged
Most evidence items
Most reports generated
Most drop-off signals
Least activity
```

Pagination:

```txt
50 rows per page
```

## API Response Shapes

```ts
export interface AdminMetricsSummary {
  activeUsers: number;
  activeFamilies: number;
  learnersCreated: number;
  sessionsLogged: number;
  completionEvents: number;
  deenRecordsCreated: number;
  evidenceItemsCreated: number;
  reportsGenerated: number;
  periodStart: string;
  periodEnd: string;
  previousPeriodComparison: {
    activeUsersDelta: number;
    sessionsDelta: number;
    evidenceReportsDelta: number;
  };
}
```

```ts
export interface AdminMetricsUserRow {
  userId: string;
  userName?: string;
  userEmail?: string;

  workspaceId: string;
  workspaceName: string;
  workspaceType?: "family" | "program";

  isActiveInPeriod: boolean;
  lastActiveAt?: string;

  learnerCount: number;
  sessionsLogged: number;
  completionEvents: number;
  startedNotCompletedCount: number;

  quranRecordsCreated: number;
  arabicRecordsCreated: number;
  islamicStudiesRecordsCreated: number;
  deenRecordsCreated: number;

  evidenceItemsCreated: number;
  reportsGenerated: number;

  featureUsageByArea: {
    account?: number;
    learners?: number;
    planner?: number;
    attendance?: number;
    quran?: number;
    arabic?: number;
    islamic_studies?: number;
    portfolio?: number;
    reports?: number;
  };

  dropOffSignals: Array<
    | "learners_no_activity"
    | "started_not_completed"
    | "activity_no_evidence"
    | "records_no_report"
    | "inactive_30_days"
  >;
}
```

## Drop-Off Definitions

| Drop-off | Definition |
|---|---|
| Learner created, no learning activity | Workspace has learner but zero sessions/completions in selected period or since setup |
| Session started, not completed | `session_started` exists without matching completion within expected window |
| Learning activity, no evidence | Workspace has learning activity but zero evidence items |
| Records exist, no report generated | Workspace has attendance/progress/evidence but zero report events |
| Inactive 30+ days | No meaningful event in last 30 days |

Use 14 days for “possibly inactive” only if a softer warning is needed. Use 30 days for inactive.

## Event Instrumentation

Track meaningful events at the service/action layer, not only through UI clicks.

| Action | Event |
|---|---|
| User performs meaningful app action | `user_active` |
| Family/program created | `family_created` |
| Learner created | `learner_created` |
| Session/lesson started | `session_started` |
| Session/lesson completed | `session_completed` or `lesson_completed` |
| Qur’an record created | `quran_record_created` |
| Arabic record created | `arabic_record_created` |
| Islamic Studies record created | `islamic_studies_record_created` |
| Evidence created | `evidence_created` |
| Report generated/printed/exported | `report_generated` |

Do not track every click. Track only Fork Test events.

## TDD Plan

Use TDD.

Write failing tests first where test infrastructure exists.

### Unit Tests

Test pure metrics logic:

- Counts active users in period.
- Counts active families/programs.
- Counts learners created.
- Counts sessions logged.
- Counts completion events.
- Counts Qur’an records.
- Counts Arabic records.
- Counts Islamic Studies records.
- Counts evidence items created.
- Counts reports generated.
- Calculates last active date.
- Groups feature usage by area.
- Detects learners-created-no-activity drop-off.
- Detects started-session-not-completed drop-off.
- Detects learning-activity-no-evidence drop-off.
- Detects records-no-report drop-off.

### API Tests

Test admin metrics routes:

- Admin can fetch summary.
- Admin can fetch user table.
- Unauthenticated user receives 401.
- Non-admin receives 403.
- Date range filters work.
- Feature area filters work.
- Drop-off filters work.
- Response shape is stable.
- Counts match seeded database events.

### Integration Tests

Test UI behavior with mocked API or test database:

- Admin metrics page renders hero cards.
- Table renders all required columns.
- Date range changes counts and table rows.
- Feature filter changes rows or feature usage display.
- Empty data shows zero states.
- Drop-off signals render correctly.
- Non-admin cannot see page.

### Playwright Tests

Playwright tests must assert meaningful state changes, not just element presence.

Required flows:

- Admin opens `/admin/metrics` and sees summary counts.
- Changing date range changes visible counts/table rows.
- Creating a learner increases learner count.
- Logging or completing a session increases session/completion metrics.
- Creating evidence increases evidence count.
- Generating or printing a report increases report count.
- A user with learner but no learning activity appears with a drop-off signal.
- A user with session start but no completion appears with a drop-off signal.
- Non-admin user is blocked from `/admin/metrics`.

If full end-to-end record creation is too slow, seed test database state through test helpers, then verify UI behavior.

## Acceptance Criteria

Observable behavior:

- Admin can visit `/admin/metrics`.
- Non-admin cannot visit `/admin/metrics`.
- Usage metrics are persisted in the database.
- Hero bar shows active users/families, learning activity, and evidence/report trends.
- Main table includes user, family/program, active state, last active date, learners created, sessions logged, completion events, started-not-completed count, Qur’an records, Arabic records, Islamic Studies records, evidence items, reports generated, feature usage by area, and drop-off signals.
- Selecting a shorter date range changes the counts.
- Selecting a feature area filters feature usage.
- Creating a learner updates learner metrics.
- Completing a lesson/session updates learning activity metrics.
- Creating Qur’an/Arabic/Islamic Studies records updates deen-centered metrics.
- Adding evidence updates evidence metrics.
- Generating or printing a report updates report metrics.
- Users who create learners but no learning activity are flagged.
- Users who start but do not complete a session are flagged.
- Empty source data shows zero states, not seeded fallback.
- Counts match the owning API/database response.

## Build Phases

| Phase | Work | Tests |
|---|---|---|
| 0 | Audit current code paths and ownership | Discovery notes |
| 1 | Add database usage event model and metrics service | Unit tests |
| 2 | Instrument Fork Test events | Unit/integration tests |
| 3 | Add admin metrics API routes | API tests |
| 4 | Add admin-only page and full table | Integration tests |
| 5 | Add hero trend cards | Unit/integration tests |
| 6 | Add Playwright flows | Playwright tests |
| 7 | QA, cleanup, docs | Regression checks |

## Commit Plan

Use small commits after tests pass.

Recommended commits:

```txt
test(admin-metrics): add metric calculation coverage
feat(admin-metrics): add usage event persistence
feat(admin-metrics): instrument fork test events
feat(admin-metrics): add admin metrics api routes
feat(admin-metrics): add admin metrics table
feat(admin-metrics): add usage trend hero cards
test(admin-metrics): add admin metrics playwright coverage
docs(admin-metrics): document tracked events and ownership
```

Do not commit broad refactors with feature work.

## Out of Scope

Do not implement yet:

- Full analytics platform
- Third-party analytics
- Tracking every click
- Marketing attribution
- Cohort analysis
- Retention heatmaps
- Heavy chart dashboard unless already standard
- PDF analytics export
- Admin user management
- Role management UI
- Billing metrics
- Privacy-invasive tracking
- Dashboard seed/store data to fake usage

## Implementation Prompt

Create an admin metrics page for Sheath Academy at `/admin/metrics`.

Use TDD. Audit only the code paths needed for auth/admin access, users/workspaces, learners, lesson/session completion, Qur’an/Arabic/Islamic Studies records, portfolio evidence, reports, and existing database/store patterns. Do not broadly explore unrelated folders.

Persist usage events in the database using a `usage_event` model or the existing event/audit system if one already exists. Track only meaningful Fork Test events: active users, active families/programs, learners created, sessions started/completed, Qur’an/Arabic/Islamic Studies records created, evidence created, reports generated, last active date, feature usage by area, and drop-off signals.

Add admin-only API routes for summary metrics and user-level usage rows. Add an admin-only UI with a top hero bar containing 1–3 trend cards and a main table. The main table must include all named Fork Test metrics: active state, family/program, learners created, sessions logged, completion events, started-not-completed count, Qur’an records, Arabic records, Islamic Studies records, evidence items, reports generated, last active date, feature usage by area, and drop-off signals.

Add unit tests for metric calculations, API tests for admin access and response shapes, integration tests for UI state, and Playwright tests for meaningful user-visible flows. Playwright should verify counts change after real or seeded usage events, and non-admin users are blocked.

Do not overbuild analytics. Do not add third-party analytics. Do not create dashboard seed/store data to fake metrics. Admin metrics should compose from persisted events and feature-owned data.
