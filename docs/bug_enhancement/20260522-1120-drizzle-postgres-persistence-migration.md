# Development Plan — Drizzle/Postgres Persistence Migration

Branch: `claude/feedback-yIxhs`

Status: Active

## 1. Summary

Move Sheath Academy from prototype/demo persistence to real-user durable persistence using Drizzle ORM with Postgres. The app should stop treating seeded in-memory data as the production source of truth. Real users should have DB-backed household, learner, subject, school-year, lesson, attendance, Qur’an, portfolio, settings, dashboard, records/report, and alert data.

This migration should preserve the existing feature-owned architecture. API routes call server services. Server services call feature repositories. Feature repositories call Drizzle. UI components must not call Drizzle directly. Dashboard, Records, Reports, and Alerts should compose feature-owned repositories/services rather than owning duplicate canonical data.

Product constraints for this plan:

- Database stack: Drizzle + Postgres.
- V1 account model: one household per user.
- Durable rows still carry `householdId` so future household sharing/membership remains possible.
- Demo data exists only under a dev/demo user account and household.
- Attendance supports multiple attendance events per learner per day.
- Settings, including Islamic reminder/dashboard preferences, should be DB-backed.

## 2. Planning Mode

Mode 5 — Architecture Migration.

Reason: this replaces seeded/in-memory persistence with a real database, introduces tenant ownership, changes shared data contracts, adds migrations, and affects every feature that currently reads/writes through seed-backed stores.

## 3. Current Code Path Audit

This audit follows `docs/planning-quality-rule.md`: identify the rendering/data path, the current source, the correct owner, and missing tests before planning implementation.

### Shared memory store

- Rendering component: none; shared server infrastructure.
- Data provider/service: each feature imports its own `server/store.ts`.
- API route: all feature APIs are indirectly affected.
- Server service/repository: feature services call feature stores.
- Store/seed/source: `features/lib/server/memoryStore.ts` exposes `createMemoryStore(seed)` with synchronous `getAll`, `getById`, `insert`, `update`, `remove`, and `reset` methods.
- Current owner: shared lib owns a generic in-memory helper; feature folders own store instances.
- Correct owner: shared lib should own Drizzle DB setup, schema exports, transaction helpers, and tenant helpers. Feature folders should own repositories and domain queries.
- Existing tests: memory store tests exist.
- Missing tests: repository contract tests, tenant-scoping tests, persistence-after-refresh Playwright tests, and no-seed-fallback tests.

### Household / user / setup

- Rendering component: app shell/setup surfaces and dashboard provider depend on household/children state.
- Data provider/service: household and children front services/context.
- API route: household/children APIs.
- Server service/repository: household and children services.
- Store/seed/source: `features/household/server/store.ts` uses seeded workspace/profile stores; `features/children/server/store.ts` uses seeded learner/student profiles.
- Current owner: Household owns workspace/profile; Children owns learner profiles.
- Correct owner: User/Household owns account and one-household-per-user identity. Children owns learner profile records under that household.
- Existing tests: children/household tests must be inspected before implementation.
- Missing tests: creating a household for a user, no seeded children for a fresh non-demo user, learner persistence after refresh, and household isolation.

### Subjects and school year

- Rendering component: subject selectors, lessons page, dashboard subject activity, reports.
- Data provider/service: subjects and school-year front services.
- API route: subjects/school-year APIs.
- Server service/repository: subject and school-year services.
- Store/seed/source: `features/subjects/server/store.ts` and `features/school-year/server/store.ts` use seeded memory stores.
- Current owner: Subjects owns subject definitions; School Year owns academic year windows.
- Correct owner: DB-backed subjects and school-year repositories scoped to household.
- Existing tests: subject and school-year API tests exist and must be updated for DB-backed behavior.
- Missing tests: subject/school-year persistence, household scoping, active-year behavior, and no seed fallback.

### Plan / lessons

- Rendering component: lessons/plan page, lesson cards, dashboard weekly activity, dashboard subject activity, alerts, reports.
- Data provider/service: plan front API/service and dashboard provider composition.
- API route: plan/lessons API routes.
- Server service/repository: plan/lesson service.
- Store/seed/source: `features/plan/server/store.ts` uses seeded lessons through memory store.
- Current owner: Planner/Plan owns lesson tasks, status, scheduling, and lesson progress inputs.
- Correct owner: Plan repository backed by Drizzle `lessonTasks` table.
- Existing tests: plan/lesson tests must be inspected and retained.
- Missing tests: DB-backed create/update/status persistence, child/subject/status/date filters, dashboard composition from DB-backed lessons, and status persistence after refresh.

### Attendance

- Rendering component: attendance page, batch attendance form, attendance list, dashboard today card, attendance alerts, reports.
- Data provider/service: attendance front API/service and dashboard provider composition.
- API route: attendance APIs including batch paths if present.
- Server service/repository: attendance service.
- Store/seed/source: `features/attendance/server/store.ts` uses seeded memory store.
- Current owner: Attendance owns attendance events, statuses, minutes, notes, void state, and attendance summaries.
- Correct owner: Attendance repository backed by Drizzle `attendanceEvents` table.
- Existing tests: attendance API/service/batch/page tests exist and must be updated.
- Missing tests: multiple attendance events per learner per date, void behavior, date-range filtering, dashboard “has attendance today” derivation, and alerts derived from DB events.

### Qur’an

- Rendering component: Qur’an page, dashboard Qur’an streak, dashboard weekly activity, records/reports.
- Data provider/service: Qur’an front API/service and dashboard provider composition.
- API route: Qur’an APIs.
- Server service/repository: Qur’an service.
- Store/seed/source: `features/quran/server/store.ts` uses seeded Qur’an sessions through memory store.
- Current owner: Qur’an owns Qur’an sessions, session types, streak inputs, and Qur’an-specific summaries.
- Correct owner: Qur’an repository backed by Drizzle `quranSessions` table.
- Existing tests: Qur’an page/session tests exist and must be updated.
- Missing tests: DB-backed session persistence, child/date/type filters, streak calculation from DB sessions, and dashboard weekly activity composition.

### Portfolio evidence

- Rendering component: portfolio page and evidence cards/lists; records/proof and reports consume evidence counts/details.
- Data provider/service: portfolio front API/service.
- API route: portfolio APIs.
- Server service/repository: portfolio service.
- Store/seed/source: `features/portfolio/server/store.ts` uses seeded evidence through memory store.
- Current owner: Portfolio owns evidence records, evidence notes, evidence links, and evidence-to-learning associations.
- Correct owner: Portfolio repository backed by Drizzle `portfolioEvidence` table.
- Existing tests: portfolio tests exist and must be updated.
- Missing tests: DB-backed add/edit/delete if supported, child/subject/lesson/date filters, and records/reports composition from DB-backed evidence.

### Dashboard, Records, Reports, Alerts

- Rendering component: Dashboard page and dashboard cards/charts; Records/Reports pages; Needs Attention alerts.
- Data provider/service: dashboard provider calls feature APIs and dashboard APIs; alert service derives signals from feature services.
- API route: dashboard summary/records/alerts/report routes.
- Server service/repository: dashboard services, records/report services, alerts service.
- Store/seed/source: dashboard currently still has seeded dashboard store data for tasks/records/children in some paths.
- Current owner: dashboard composes; records/reports own report surfaces; alerts own advisory signal generation.
- Correct owner: Dashboard should not own canonical data. It should compose DB-backed feature services. Alerts should derive from DB-backed lessons/attendance/children unless alert dismissal/snooze is introduced. Records/Reports should read feature-owned repositories/services.
- Existing tests: dashboard, linked-filter, records/report, and alerts tests must be inspected.
- Missing tests: dashboard counts match owning feature APIs, no dashboard seed fallback, selected-child/all-children aggregation from DB data, and Playwright persistence flows.

### Settings and local preferences

- Rendering component: dashboard reminder/settings surfaces.
- Data provider/service: reminder settings hook/provider.
- API route: likely none today for local preferences.
- Store/seed/source: settings appear to be local/device-level today where applicable.
- Current owner: UI/local hook owns preferences.
- Correct owner: Settings feature/table owns DB-backed user/household preferences.
- Existing tests: must be inspected before implementation.
- Missing tests: read/write user settings, household settings, reminder preference persistence after refresh, and no localStorage-only dependency for production preferences.

## 4. Source-of-Truth Decision

Postgres is the durable production source of truth.

Drizzle is the application’s DB query and migration layer.

Feature ownership remains:

- User/Household owns user account, one household per user, household timezone, setup state.
- Children owns learners and active/archive state.
- Subjects owns subject definitions.
- School Year owns academic-year windows.
- Plan owns lessons, lesson status, scheduling, and progress inputs.
- Attendance owns multi-event attendance records.
- Qur’an owns Qur’an sessions and streak inputs.
- Portfolio owns evidence items and evidence associations.
- Settings owns DB-backed user/household preferences.
- Alerts owns advisory signal generation.
- Records/Reports owns report surfaces and report composition.
- Dashboard composes Today-facing data only.

Do not create new dashboard tables for canonical lessons, attendance, Qur’an sessions, learners, or evidence. If a cached dashboard/materialized view is needed later, it must be explicitly planned as a cache with invalidation rules, not as a second source of truth.

## 5. Target Architecture

```txt
UI component
→ feature front service/hook/context
→ app API route / feature router
→ feature server service
→ feature repository
→ shared Drizzle db client
→ Postgres
```

Hard rule for implementation:

```txt
Do not use Drizzle directly outside:
- shared DB setup/schema/migration utilities
- feature repository files
- narrowly scoped test helpers
```

API routes should not contain SQL/query construction. UI should not import Drizzle. Dashboard should not bypass feature ownership.

## 6. UI Pattern Audit

This migration is not a UI redesign. Existing surfaces should remain visually consistent with `docs/ui-style-guide.md`.

Affected UI sections must preserve their current layout and add only the states needed for durable data:

- loading states for DB-backed requests,
- empty states for real empty tenants,
- error states for failed DB/API requests,
- refresh-after-mutation behavior where optimistic/local state was previously enough.

Nivo/dashboard charts must continue to use the approved chart theme/wrapper and must display real empty states rather than seeded fallback data.

Destination pages should continue honoring linked filters. If a URL includes `childId`/`learnerId`, the destination page must apply that filter after learners load.

## 7. Data Model / Contract Changes

Use Drizzle schema definitions as the source of table/column contracts.

Recommended schema modules:

```txt
db/schema.ts
features/lib/server/db.ts
features/lib/server/tenant.ts
features/lib/server/date.ts
```

Alternative acceptable layout:

```txt
features/lib/server/db/schema.ts
features/lib/server/db/client.ts
features/lib/server/db/tenant.ts
```

Choose one layout and use it consistently.

### Core tables

#### users

```txt
id text primary key
email text not null unique
name text nullable
role text nullable default 'user'
created_at timestamp not null
updated_at timestamp not null
```

V1 rule: one app user owns one household.

#### households

```txt
id text primary key
user_id text not null unique references users(id)
name text not null
timezone text not null default 'America/New_York'
setup_completed_at timestamp nullable
created_at timestamp not null
updated_at timestamp not null
```

Keep `household_id` on all durable feature rows even though `user_id → household_id` is one-to-one in v1.

#### learners

```txt
id text primary key
household_id text not null references households(id)
name text not null
display_color text nullable
grade_level text nullable
is_active boolean not null default true
archived_at timestamp nullable
sort_order integer not null default 0
created_at timestamp not null
updated_at timestamp not null
```

#### school_years

```txt
id text primary key
household_id text not null references households(id)
name text not null
start_date date not null
end_date date not null
is_active boolean not null default false
created_at timestamp not null
updated_at timestamp not null
```

#### subjects

```txt
id text primary key
household_id text not null references households(id)
name text not null
description text nullable
color text nullable
sort_order integer not null default 0
is_active boolean not null default true
created_at timestamp not null
updated_at timestamp not null
```

#### lesson_tasks

```txt
id text primary key
household_id text not null references households(id)
learner_id text not null references learners(id)
subject_id text nullable references subjects(id)
title text not null
description text nullable
notes text nullable
due_date date nullable
status text not null default 'not_started'
sort_order integer not null default 0
completed_at timestamp nullable
skipped_at timestamp nullable
created_at timestamp not null
updated_at timestamp not null
```

Allowed status values:

```txt
not_started
completed
skipped
```

#### attendance_events

Attendance is multi-event per learner per day. Do not add a unique constraint on learner/date.

```txt
id text primary key
household_id text not null references households(id)
learner_id text not null references learners(id)
attendance_date date not null
occurred_at timestamp nullable
status text not null
minutes integer nullable
notes text nullable
voided_at timestamp nullable
created_at timestamp not null
updated_at timestamp not null
```

Allowed status values should reflect current app types, but must support at least:

```txt
present
absent
excused
partial
```

Void should be represented by `voided_at` rather than overwriting the original event status unless current product language requires a `voided` status. Summary queries must ignore voided events by default.

Dashboard “attendance today” should derive from whether a learner has at least one non-voided attendance event for the household-local date.

#### quran_sessions

```txt
id text primary key
household_id text not null references households(id)
learner_id text not null references learners(id)
session_date date not null
session_type text not null
surah text nullable
from_ayah integer nullable
to_ayah integer nullable
duration_minutes integer nullable
notes text nullable
created_at timestamp not null
updated_at timestamp not null
```

Session types should mirror current app types. Any Qur’an session type counts toward streak unless product logic later narrows it.

#### portfolio_evidence

```txt
id text primary key
household_id text not null references households(id)
learner_id text not null references learners(id)
subject_id text nullable references subjects(id)
lesson_task_id text nullable references lesson_tasks(id)
quran_session_id text nullable references quran_sessions(id)
attendance_event_id text nullable references attendance_events(id)
title text not null
description text nullable
evidence_type text not null
url text nullable
evidence_date date not null
created_at timestamp not null
updated_at timestamp not null
```

File upload/blob storage is out of scope for this migration unless already present in the app. Link/text/note evidence can be persisted now.

#### user_settings

```txt
id text primary key
user_id text not null references users(id)
key text not null
value jsonb not null
created_at timestamp not null
updated_at timestamp not null
unique(user_id, key)
```

Use for personal preferences such as reminder dismissal/preference and UI preference where appropriate.

#### household_settings

```txt
id text primary key
household_id text not null references households(id)
key text not null
value jsonb not null
created_at timestamp not null
updated_at timestamp not null
unique(household_id, key)
```

Use for household-wide defaults such as timezone-related homeschool defaults.

### Indexes

Add indexes for common access patterns:

```txt
learners(household_id, is_active)
school_years(household_id, is_active)
subjects(household_id, is_active)
lesson_tasks(household_id, learner_id, due_date)
lesson_tasks(household_id, subject_id)
lesson_tasks(household_id, status)
attendance_events(household_id, learner_id, attendance_date)
attendance_events(household_id, attendance_date)
quran_sessions(household_id, learner_id, session_date)
quran_sessions(household_id, session_date)
portfolio_evidence(household_id, learner_id, evidence_date)
portfolio_evidence(household_id, subject_id)
user_settings(user_id, key)
household_settings(household_id, key)
```

### Date and time rules

- Store timestamps in UTC.
- Store school-day concepts as `date` columns.
- “Today” is based on household timezone.
- Date range filters are inclusive unless an endpoint explicitly says otherwise.
- School-year start/end dates are inclusive.

## 8. API / Store / Service Plan

### Drizzle setup

Add dependencies:

```txt
dizzle-orm
postgres or pg
-drizzle-kit as dev dependency
```

Use the correct package names during implementation; verify package names in `package.json` and Drizzle docs before installing.

Add scripts:

```json
{
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate",
  "db:studio": "drizzle-kit studio",
  "db:seed:dev": "tsx scripts/seed-dev-user.ts"
}
```

If the repo does not use `tsx`, choose the existing script runner or add it explicitly.

Add environment variables:

```txt
DATABASE_URL=
DEV_SEED_USER_EMAIL=
DATA_STORE=memory|postgres optional during migration
```

If a compatibility flag is used, production should not silently fall back to memory. In production, missing `DATABASE_URL` should fail fast.

### Tenant resolver

Create one shared helper:

```txt
features/lib/server/tenant.ts
```

Responsibilities:

- Resolve current user.
- Resolve that user’s household.
- Return `{ userId, householdId, timezone }`.
- In development/test only, allow deterministic dev user resolution.
- Do not let each feature invent its own current household lookup.

V1 account rule: one household per user.

### Feature repositories

Create feature-owned repository files. Examples:

```txt
features/children/server/repository.ts
features/subjects/server/repository.ts
features/school-year/server/repository.ts
features/plan/server/repository.ts
features/attendance/server/repository.ts
features/quran/server/repository.ts
features/portfolio/server/repository.ts
features/settings/server/repository.ts
```

Repository rules:

- All public repository methods require `householdId` except user-level settings.
- All learner-owned queries require both `householdId` and `learnerId` where fetching a single learner’s records.
- Repository methods should return domain types expected by current services, or the service should map DB rows to domain types in one place.
- Drizzle queries live in repositories, not in API routes or UI.

### Service migration pattern

For each feature:

1. Read current type definitions.
2. Read current store/service/API route.
3. Add repository with Drizzle queries.
4. Update service to call repository.
5. Keep API response shape stable unless the plan explicitly changes it.
6. Update tests.
7. Remove production dependence on seed/memory store.

### Demo data strategy

Create only one seed path for demo/dev data:

```txt
scripts/seed-dev-user.ts
```

Rules:

- Reads `DEV_SEED_USER_EMAIL`.
- Creates or updates that user.
- Creates or updates that user’s one household.
- Inserts demo learners, subjects, lessons, attendance events, Qur’an sessions, and evidence under that household only.
- Uses deterministic IDs or unique keys to remain idempotent.
- Does not run automatically for normal users.
- No API route should fall back to demo seed data if a user has no records.

## 9. UI Plan

No major UI redesign.

Required UI behavior changes:

- Empty real household shows empty states, not Adam/Zayd/Khadijah/demo data.
- Mutation flows refetch/update after DB-backed writes.
- Dashboard charts/cards show zeros or empty states when no DB rows exist.
- Child filters still apply after learners load from DB.
- Settings UI, if present, reads/writes DB-backed settings rather than localStorage-only persistence.

Affected screens:

- Dashboard.
- Children/learner management or setup surfaces.
- Attendance.
- Plan/Lessons.
- Qur’an.
- Portfolio.
- Records/Reports.
- Settings/reminder surfaces.

Accessibility/mobile expectations remain governed by `docs/ui-style-guide.md`.

## 10. Testing Plan

Use TDD. Add/modify failing tests before implementation in each phase.

### Unit tests

Add tests for:

- Tenant resolver returns correct user/household in dev/test mode.
- Date helpers compute household-local today.
- Attendance summary treats multi-event days correctly.
- Attendance summary ignores voided events by default.
- Qur’an streak uses DB-backed session dates.
- Dashboard summary builders handle empty tenants.
- Settings read/write serializes/deserializes JSON values.

### Repository/API tests

For each repository/API, test:

- Create/read/update/delete where supported.
- Household scoping.
- Learner scoping.
- Date range filters.
- Status/type filters.
- Empty tenant returns empty results.
- Demo data does not appear for non-dev users.

Specific tests:

```txt
children repository: list active learners by household
subjects repository: list active subjects by household
school-year repository: get active year by household
plan repository: list lessons by learner/subject/status/date
attendance repository: create multiple same-day events for one learner
attendance repository: void one event without deleting the others
quran repository: list sessions by learner/date/type
portfolio repository: list evidence by learner/subject/date
settings repository: upsert user setting and household setting
```

### Integration tests

- Lessons page create/edit/status update uses DB-backed API response.
- Attendance page creates multiple events per day and shows them after refetch.
- Qur’an page creates/edits sessions and updates list.
- Portfolio page creates/edits evidence and updates list.
- Dashboard selected-child/all-children data updates from DB-backed feature APIs.
- Records/Reports use DB-backed lessons, attendance events, Qur’an sessions, and evidence.

### Playwright tests

Create or update:

```txt
e2e/persistence-real-db.spec.ts
e2e/no-seed-fallback.spec.ts
e2e/dashboard-db-composition.spec.ts
```

Persistence flow:

1. Start with a clean test user/household.
2. Create a learner.
3. Create a subject.
4. Create a lesson.
5. Mark lesson completed.
6. Refresh; completed status remains.
7. Dashboard weekly/subject activity reflects the completed lesson.
8. Add two attendance events for the same learner on the same day.
9. Refresh; both attendance events remain.
10. Void one attendance event; the other remains.
11. Dashboard today state still treats the learner according to the agreed attendance summary rule.
12. Add Qur’an session.
13. Refresh; session remains and dashboard streak/weekly activity updates.
14. Add portfolio evidence.
15. Refresh; evidence remains and records/proof reflects it.
16. Create a second learner.
17. Verify selected-child filters isolate learner data.
18. Verify All Children aggregates active learners.

No-seed-fallback flow:

1. Create/login as a new non-dev test user.
2. Confirm no demo learners appear.
3. Confirm dashboard shows empty states/zero counts.
4. Confirm reports/records show empty states.

Demo-user flow:

1. Seed dev user with `db:seed:dev`.
2. Login/resolve as dev user.
3. Confirm demo learners/data appear only for that user.
4. Login/resolve as another user.
5. Confirm demo data does not appear.

## 11. Build Phases

### Phase 1 — Drizzle foundation

Files likely affected:

```txt
package.json
.env.example
drizzle.config.ts
db/schema.ts or features/lib/server/db/schema.ts
features/lib/server/db.ts
features/lib/server/tenant.ts
features/lib/server/date.ts
scripts/seed-dev-user.ts
```

Implementation:

- Add Drizzle/Postgres dependencies.
- Add config and migration scripts.
- Add DB client helper.
- Add tenant resolver seam.
- Add initial schema.
- Add dev-user seed script skeleton.
- Add config tests.

Acceptance:

- `npm test` passes.
- `npm run build` passes.
- Migration generation works.
- App does not call DB-backed feature paths yet unless explicitly wired.

### Phase 2 — User, household, learner, settings

Implementation:

- Add user/household/learner/settings repositories.
- Migrate household/children services to DB-backed repositories.
- Add DB-backed user and household settings.
- Keep one household per user.
- Remove seed fallback for non-dev users.

Acceptance:

- New user has one household.
- Learners persist.
- Empty non-dev user has no demo learners.
- Settings persist after refresh.

### Phase 3 — Subjects and school year

Implementation:

- Add subjects and school-year repositories.
- Migrate services/API routes.
- Update UI consumers if response loading/empty states need changes.

Acceptance:

- Subjects and school years persist.
- Active school year reads from DB.
- Lessons can reference DB-backed subjects.

### Phase 4 — Plan/lessons

Implementation:

- Add Drizzle lesson repository.
- Migrate lesson services/API routes.
- Preserve current response shapes and filters.
- Dashboard weekly/subject activity uses DB-backed lessons.
- Alerts derive lesson signals from DB-backed lessons.

Acceptance:

- Create/edit/delete/status changes persist after refresh/server restart.
- Completed/skipped/not-started status remains correct.
- Dashboard lesson charts/cards reflect DB-backed lessons.

### Phase 5 — Multi-event attendance

Implementation:

- Add Drizzle attendance repository.
- Model attendance as events; no unique learner/date constraint.
- Update batch attendance to create multiple event rows as intended or to create one event per selected learner for the chosen timestamp/date.
- Update summaries to ignore voided events by default.
- Dashboard today/alerts read DB-backed events.

Acceptance:

- Multiple same-day events for one learner persist.
- Voiding one event does not remove other same-day events.
- Dashboard today state uses DB-backed attendance events.
- Attendance alerts use DB-backed events.

### Phase 6 — Qur’an sessions

Implementation:

- Add Drizzle Qur’an repository.
- Migrate Qur’an services/API routes.
- Update dashboard Qur’an streak and weekly activity to use DB-backed sessions.

Acceptance:

- Qur’an sessions persist.
- Any session type counts toward streak.
- Dashboard streak and weekly activity reflect DB-backed sessions.

### Phase 7 — Portfolio evidence

Implementation:

- Add Drizzle portfolio repository.
- Migrate evidence services/API routes.
- Link evidence to learner, subject, lesson, Qur’an session, or attendance event where current UI supports it.

Acceptance:

- Evidence persists.
- Evidence filters by learner/date/subject where supported.
- Records/proof and reports reflect DB-backed evidence.

### Phase 8 — Dashboard, records, reports, alerts cleanup

Implementation:

- Remove production use of dashboard seed/memory stores for canonical data.
- Ensure dashboard summary composes DB-backed feature services.
- Ensure records/reports compose DB-backed feature services.
- Keep alerts derived unless dismissal/snooze is introduced.

Acceptance:

- No user-facing dashboard card depends on dashboard seed store.
- Empty tenants show empty/zero states.
- Dashboard counts match owning feature API/repository data.

### Phase 9 — Demo seed quarantine and memory-store removal

Implementation:

- Finalize `db:seed:dev`.
- Keep seed fixtures only for tests/dev seed script.
- Remove or quarantine production `createMemoryStore` usage.
- Keep memory store only for tests if still valuable.

Acceptance:

- Search for production `createMemoryStore` usage returns none or only explicitly test/demo paths.
- Demo data appears only for the dev user/household.
- Non-dev users start empty.

## 12. Out of Scope

- No full auth provider redesign unless needed to resolve current user.
- No multi-household-per-user membership UI.
- No household sharing/invites.
- No file/blob upload storage for portfolio evidence.
- No PDF/export redesign.
- No analytics warehouse.
- No dashboard materialized cache.
- No offline sync.
- No full UI redesign.
- No AI recommendations.

## 13. Manual QA Plan

1. Create or resolve a clean non-dev test user.
2. Confirm the user has one household.
3. Confirm Dashboard shows empty states and zero counts.
4. Confirm no demo learners appear.
5. Add learner A.
6. Refresh; learner A remains.
7. Add subject Mathematics.
8. Refresh; subject remains.
9. Create a lesson for learner A.
10. Refresh; lesson remains.
11. Mark lesson completed.
12. Refresh; lesson remains completed.
13. Open Dashboard; weekly/subject activity reflects the completed lesson.
14. Add two attendance events for learner A on the same day.
15. Refresh; both attendance events remain.
16. Void one attendance event.
17. Refresh; voided event state remains and the other event remains.
18. Open Dashboard; attendance today uses non-voided events.
19. Add Qur’an session for learner A.
20. Refresh; session remains.
21. Open Dashboard; Qur’an streak/weekly activity updates.
22. Add portfolio evidence for learner A.
23. Refresh; evidence remains.
24. Open Records/Reports; evidence and completed learning records appear.
25. Add learner B.
26. Select learner B; learner A records are hidden.
27. Select All Children; active learner data aggregates.
28. Archive learner A.
29. Confirm active dashboards exclude learner A where expected.
30. Run dev seed for the dev user.
31. Confirm demo data appears only for dev user.
32. Confirm another user still starts empty.

## 14. Branch and Commit Plan

Recommended implementation branch:

```txt
refactor/drizzle-postgres-persistence
```

Commit sequence:

```txt
chore(db): add drizzle postgres foundation
feat(db): add core household learning schema
test(db): cover tenant resolver and repository contracts
feat(settings): persist user and household preferences
feat(children): persist household learners
feat(subjects): persist subjects and school years
feat(plan): persist lesson tasks with drizzle
feat(attendance): persist multi-event attendance
feat(quran): persist quran sessions
feat(portfolio): persist evidence records
feat(dashboard): compose summaries from persisted feature data
feat(records): compose reports from persisted feature data
chore(seed): quarantine demo data to dev user
chore(memory): remove production seed store dependencies
test(e2e): cover persistence and no-seed fallback
```

## 15. Risks and Rollback

### Risk: Drizzle queries get scattered through the app

Mitigation: only shared DB setup and feature repositories may import/use Drizzle. Add review checklist and tests around repository boundaries.

Rollback: move scattered queries into repositories before merging.

### Risk: tenant scoping is missed

Mitigation: every repository method requires `householdId`; tests create two households and prove isolation.

Rollback: block merge and fix repository query filters.

### Risk: demo data leaks to real users

Mitigation: seed script targets `DEV_SEED_USER_EMAIL` only. No API seed fallback.

Rollback: disable dev seed script and remove accidental seeded rows from non-dev households.

### Risk: attendance summaries are wrong because attendance is multi-event per day

Mitigation: model events explicitly and write tests for multiple same-day events, voided events, and dashboard derivation.

Rollback: fix summary functions; do not add a unique learner/date constraint.

### Risk: settings ownership becomes vague

Mitigation: split `user_settings` and `household_settings`. Use the narrowest owner for each setting.

Rollback: migrate ambiguous settings into the correct table before production use.

### Risk: big-bang migration breaks too much

Mitigation: phase by feature. Keep old behavior only where necessary during transition. Do not merge partial production DB migration until its feature tests pass.

Rollback: revert the latest feature migration commit while keeping earlier DB foundations.

## 16. Final Regression Checklist

- Drizzle migration applies to empty Postgres database.
- DB client fails safely when required production config is missing.
- One user maps to one household in v1.
- New non-dev user starts empty.
- Dev seed data belongs only to dev user household.
- Learners persist.
- Settings persist.
- Subjects and school years persist.
- Lessons persist and status survives refresh.
- Multiple same-day attendance events persist.
- Voiding attendance does not delete unrelated same-day events.
- Qur’an sessions persist and update streak.
- Portfolio evidence persists.
- Dashboard composes DB-backed feature data.
- Records/Reports compose DB-backed feature data.
- Alerts derive from DB-backed feature data.
- No production dashboard seed fallback remains.
- No production `createMemoryStore` dependency remains outside test/demo paths.
- Unit tests pass.
- API tests pass.
- Integration tests pass.
- Playwright persistence tests pass.
- `npm test` passes.
- `npm run build` passes.
