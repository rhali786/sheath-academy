# Development Plan — Authentication and User Ownership

Branch: `claude/feedback-yIxhs`

Status: Planned

## 1. Summary

Add real authentication-backed ownership so Sheath Academy can safely serve multiple families, tutors, and admins without data mixing. The work extends the current NextAuth-based login into a tenant-aware authorization model with persisted users, memberships, roles, protected app/API routes, database ownership fields, service-level authorization checks, and Playwright regressions proving User A cannot view or mutate User B’s learners, sessions, reports, records, alerts, or portfolio evidence.

This plan assumes secrets and provider keys will be supplied through environment variables only. No API keys, OAuth secrets, database credentials, or deploy hooks should be committed.

## 2. Planning Mode

Mode 5 — Architecture Migration.

Reason: this changes identity, data ownership, route protection, API contracts, persistence boundaries, and cross-feature access rules. It affects auth, household, children, plan/lessons, attendance, Quran, portfolio, records, alerts, dashboard composition, setup, and future Postgres persistence.

## 3. Current Code Path Audit

### Auth configuration

- Rendering component: `features/auth/front/pages/Login.tsx` renders magic-link sign-in, disabled OAuth buttons, and dev bypass.
- Data provider/hook/context: NextAuth client `signIn()` is used in the login UI.
- API route: `app/api/auth/[...nextauth]/route.ts` re-exports NextAuth handlers.
- Server service/repository: `features/auth/auth.ts` configures NextAuth.
- Store/seed/source currently used: `features/auth/lib/memoryAdapter.ts` stores users and verification tokens in process memory.
- Current owner: Auth feature owns sign-in configuration, but not durable user ownership.
- Correct owner: Auth should own identity, session enrichment, role/membership claims, and authorization helpers; household/program ownership should be enforced through auth-aware feature services and repositories.
- Existing tests: must inspect `features/auth/__tests__` before implementation; current repo search showed auth implementation files but no confirmed ownership/isolation tests.
- Missing tests: user creation/session tests, role callback tests, middleware tests, API authorization tests, and Playwright isolation tests.

Current facts: `features/auth/auth.ts` uses NextAuth, a memory adapter, JWT sessions, Resend magic links, optional dev bypass credentials, and Google/Facebook providers wired by environment variables. The current adapter is intentionally in-memory and therefore not sufficient for real multi-user persistence.

### Route protection

- Rendering component: app shell pages under `app/(shell)/` and auth pages under `app/(auth)/`.
- Data provider/hook/context: middleware calls `auth()` from `features/auth/auth`.
- API route: middleware excludes `api/auth`, `api/health`, `login`, `about`, `worklog`, static assets, and image/favicon paths.
- Server service/repository: no feature service authorization is applied at middleware level.
- Store/seed/source currently used: session JWT only; no durable membership lookup.
- Current owner: root `middleware.ts` owns broad access gating.
- Correct owner: middleware should gate pages and APIs, but feature APIs/services must enforce authorization because middleware alone cannot prove record ownership.
- Existing tests: must inspect middleware/auth tests before implementation.
- Missing tests: unauthenticated protected-page redirect, unauthenticated protected-API rejection, authenticated wrong-tenant 403, and role-specific access tests.

Current facts: `middleware.ts` redirects unauthenticated requests to `/login` and also redirects when `AUTH_SECRET` is missing. It does not perform tenant or role checks.

### Dynamic feature APIs

- Rendering component: not directly rendered; APIs feed all feature pages and dashboard.
- Data provider/hook/context: feature front services call `/api/<feature>/*` through the dynamic route.
- API route: `app/api/[...slug]/route.ts` dispatches to feature routers for dashboard, household, children, subjects, school-years, setup-status, plan, attendance, portfolio, records, alerts, Quran, schedule, and resources.
- Server service/repository: each feature router calls its own route handlers/services.
- Store/seed/source currently used: feature memory stores and seeds.
- Current owner: dynamic route delegates but does not inject or require authenticated context.
- Correct owner: dynamic route should require auth for all protected feature APIs, derive an `AuthContext`, and pass it into feature routers/services or require each route handler to call a shared auth helper.
- Existing tests: API tests exist in several feature folders but must be inspected feature by feature.
- Missing tests: every owner-scoped API must prove it rejects cross-household/program IDs and never trusts client-supplied owner fields.

Current facts: `app/api/[...slug]/route.ts` dispatches by `slug[0]` to feature routers without deriving session context.

### Attendance ownership example

- Rendering component: attendance feature pages/cards must be inspected before implementation.
- Data provider/hook/context: attendance front services call attendance API routes.
- API route: `features/attendance/api/routes/attendance.ts` exposes GET, POST, and BATCH.
- Server service/repository: `features/attendance/server/service` exposes `getRecords`, `createOrUpdateRecord`, and validation.
- Store/seed/source currently used: attendance server store/memory seed.
- Current owner: Attendance owns attendance records.
- Correct owner: Attendance must own attendance records and enforce household/program membership through server-side auth context.
- Existing tests: `features/attendance/__tests__/api/attendance.test.ts` exists.
- Missing tests: GET scoped to the authenticated household/program, POST rejecting foreign `childId`, BATCH rejecting mixed-tenant entries, and regression tests proving client-supplied `householdId` is ignored or validated against session ownership.

Current fact: the current attendance POST accepts `householdId` from the request body and defaults it to `''`; this is not safe for real multi-tenant use.

### Shared types and ownership fields

- Rendering component: type-level impact across features.
- Data provider/hook/context: all feature services depend on shared or feature-owned types.
- API route: all feature APIs returning owned entities are affected.
- Server service/repository: all repositories/services for owned data are affected.
- Store/seed/source currently used: memory stores with IDs such as `householdId`, `workspaceId`, and `childId`.
- Current owner: `features/lib/types.ts` currently defines foundational `Workspace`, `HouseholdProfile`, and `StudentProfile` types.
- Correct owner: auth identity and memberships should live in `features/auth/types.ts`; household/program ownership should be represented in durable schema and feature-owned domain types where relevant.
- Existing tests: type-level tests are not expected, but service/API tests should prove contracts.
- Missing tests: data migration/schema tests and service tests ensuring owner fields are required and enforced.

Current facts: `Workspace` has `ownerId`; `HouseholdProfile` has `workspaceId`; `StudentProfile` has `householdId`. These fields are useful but not yet bound to authenticated session ownership.

### Persistence/Postgres dependency

- Rendering component: none directly.
- Data provider/hook/context: feature services/stores.
- API route: all feature APIs are affected.
- Server service/repository: existing feature stores use memory-store patterns.
- Store/seed/source currently used: memory stores; `.env.example` already documents `DATABASE_URL` and split Postgres env vars.
- Current owner: shared lib owns memory persistence; no confirmed Postgres client/migration dependency is installed.
- Correct owner: shared persistence should own DB connection, migration scripts, and transaction helper; features should own repositories and domain queries.
- Existing tests: memory store tests and feature API tests must be inspected before implementation.
- Missing tests: migration tests, repository contract tests, and tenant isolation tests at repository/service/API layers.

## 4. Source-of-Truth Decision

Authentication source of truth: Auth feature owns users, sessions, login providers, role claims, and membership lookup.

Tenant source of truth: Household/program membership owns which user can act inside which family/program boundary. The recommended model is:

- `users`: durable identity row linked to NextAuth account/session.
- `tenants`: generalized ownership boundary. A tenant can represent a family household, tutor practice, or program.
- `tenant_memberships`: joins users to tenants with roles.
- `households`: family profile under a tenant.
- `learners`: children/student profiles under a tenant and household.
- Feature records: every learner-bound or household-bound record stores `tenant_id` and, where applicable, `household_id` and `learner_id`.

Dashboard must remain a composer. It should never own identity or authorization logic. Each feature service must return only authorized records.

## 5. UI Pattern Audit

### Login page

- Existing visual/interaction pattern: focused auth card under auth layout, no app shell.
- Closest approved pattern in `docs/ui-style-guide.md`: focused/auth flow exception to app shell rule.
- Current icons: inline SVG mail/check and OAuth brand icons.
- Required icons: may keep existing icons if accessible labels remain clear.
- Current confirmation pattern: none.
- Required confirmation pattern: none.
- Reuse/extend/replace: extend current login card for provider states, invite acceptance, and post-login setup routing.
- Shell/page-width: keep outside app shell because login is a focused auth flow.
- Nivo: not applicable.
- Tests: integration tests for email submission, error state, dev bypass hidden unless enabled, and OAuth buttons only active when provider env vars are configured.

### App shell/Header

- Existing visual/interaction pattern: shell header reads household context and displays navigation.
- Closest approved pattern: app shell and approved page-width pattern.
- Current icons: must inspect Header before implementation.
- Required icons: user/account menu, sign out action, role/tenant switcher if multiple memberships exist.
- Current confirmation pattern: none.
- Required confirmation pattern: no destructive confirmation; sign-out can be direct or use account menu action.
- Reuse/extend/replace: extend shell with current user, role, and tenant context; do not let feature pages import `Header` or `AppShell` directly.
- Shell/page-width: protected feature pages stay under `app/(shell)/`.
- Nivo: not applicable.
- Tests: Header integration tests for current user email/name, sign out, tenant selector when multiple tenants exist, and role-gated nav items.

### Protected feature pages

- Existing visual/interaction pattern: feature pages under app shell.
- Closest approved pattern: app shell/page-width rule.
- Icons: unchanged unless page-specific actions change.
- Confirmation pattern: unchanged unless destructive actions are touched.
- Reuse/extend/replace: reuse existing feature UI, but inject authorized data only.
- Shell/page-width: must remain under shell except login/onboarding.
- Nivo: dashboard charts must continue following Nivo explicit-array rules.
- Tests: Playwright must prove cross-user data isolation on dashboard, Attendance, Plan/Lessons, Quran, Portfolio, Records/Reports, and Alerts.

## 6. Acceptance Criteria

1. A signed-out user who visits a protected app page is redirected to `/login`.
2. A signed-out user who calls a protected feature API receives 401 JSON, not data and not an HTML redirect.
3. A signed-in parent sees only tenants/households where they have a membership.
4. A signed-in tutor sees only assigned tenants/learners according to membership and assignment rules.
5. A signed-in admin can access admin-approved tenant/program views, but still through explicit role checks.
6. User A cannot list, view, create, update, delete, archive, or report on User B’s learners, lessons, Quran sessions, attendance records, portfolio evidence, alerts, records, or reports.
7. Client-supplied `householdId`, `tenantId`, `workspaceId`, or `childId` is never trusted by itself. Server code validates it against the authenticated user’s memberships.
8. New learners and records are written with server-derived `tenantId`/`householdId` ownership, not blindly copied from the request body.
9. Existing demo/dev bypass remains available only when explicitly enabled by environment variables.
10. Missing auth env vars fail closed with clear errors; they never expose protected data.
11. Playwright has at least two seeded users and proves that cross-user direct URL/API attempts fail.
12. `npm run build`, `npm test`, and the new Playwright suite pass before merge.

## 7. Data Model / Contract Changes

Add or migrate toward these durable auth/ownership entities. Exact SQL/ORM syntax depends on the chosen Postgres layer from the Postgres migration plan.

### Auth-owned entities

```ts
export type UserRole = 'owner' | 'parent' | 'tutor' | 'admin' | 'learner'
export type TenantType = 'family' | 'tutor_practice' | 'program'

export interface AuthUser {
  id: string
  email: string
  name?: string
  image?: string
  createdAt: string
  updatedAt: string
}

export interface Tenant {
  id: string
  type: TenantType
  name: string
  createdByUserId: string
  createdAt: string
  updatedAt: string
}

export interface TenantMembership {
  id: string
  tenantId: string
  userId: string
  role: UserRole
  status: 'active' | 'invited' | 'disabled'
  createdAt: string
  updatedAt: string
}
```

### Owned feature records

Every tenant-scoped table/entity should include:

- `tenantId` for authorization boundary.
- `householdId` when the record belongs to a family profile.
- `learnerId`/`childId` when learner-specific.
- `createdByUserId` for audit trail.
- `updatedByUserId` where mutation history matters.

For compatibility during migration, current `childId` may remain in UI contracts while server-side repositories map it to a tenant-owned learner row.

### API contract rule

Requests may include IDs for intent, but authorization must be derived from the session:

- Allowed: `POST /api/attendance` with `childId`, `date`, and status.
- Required server behavior: resolve `childId` under the current user’s active tenant membership before writing.
- Disallowed behavior: trusting `householdId` or `tenantId` from request body as proof of ownership.

## 8. API / Store / Service Plan

### Shared auth helpers

Create `features/auth/server/context.ts`:

- `getAuthContext(request): Promise<AuthContext>`
- `requireAuthContext(request): Promise<AuthContext>`
- `requireTenantAccess(authContext, tenantId, allowedRoles?)`
- `requireLearnerAccess(authContext, learnerId, allowedRoles?)`
- `requireHouseholdAccess(authContext, householdId, allowedRoles?)`
- `unauthorizedResponse()` and `forbiddenResponse()` helpers using the standard API response shape.

`AuthContext` should include:

- `userId`
- `email`
- `activeTenantId` when selected
- `memberships`
- `rolesByTenant`
- `isAdmin` only when an explicit admin membership or platform-admin claim exists

### NextAuth/session callbacks

Update `features/auth/auth.ts` to:

1. Use durable adapter/repository instead of process-only memory adapter for real users and verification tokens.
2. Add JWT/session callbacks that include stable `user.id`, email, and safe membership summary.
3. Avoid putting full authorization data in the client session if it could become stale; server auth context should re-check membership from repository for mutations.
4. Keep dev bypass disabled unless `DEV_BYPASS_SECRET` is set.

### Middleware

Update `middleware.ts` so:

- Browser page requests redirect unauthenticated users to `/login`.
- Protected API requests return 401 JSON.
- Public routes remain limited to login, auth callbacks, health, and explicitly public marketing pages.
- Tenant/role checks stay in API/service code, not only middleware.

### Feature API authorization pattern

For each feature route handler:

1. Call `requireAuthContext(request)` at the top.
2. Resolve any `childId`, `householdId`, `lessonId`, `sessionId`, `evidenceId`, `recordId`, or `alertId` through the owning feature service/repository.
3. Reject inaccessible IDs with 403 or 404 according to the chosen concealment policy.
4. Never use request-body ownership fields as canonical.
5. Pass `authContext` into service calls.

Recommended concealment policy: return 404 for direct lookup of a foreign record by ID, and 403 for attempts to act in a known tenant without the required role. Document the final policy in tests.

### Feature service migration order

1. Auth and memberships.
2. Household/setup/children because they establish the ownership boundary.
3. Subjects/school year because many records reference learner/household context.
4. Plan/Lessons.
5. Attendance.
6. Quran.
7. Portfolio.
8. Alerts.
9. Records/Reports.
10. Dashboard composition last, after feature services return scoped data.

## 9. UI Plan

### Login and onboarding

- Keep `/login` as a focused auth page outside app shell.
- Add explicit states for magic-link sent, provider unavailable, provider error, and expired/invalid link.
- After first sign-in, route users without a tenant/membership to setup/onboarding.
- After normal sign-in, route users to their active tenant dashboard.

### Tenant/family/program selection

- Add a tenant selector in the shell only if the user has more than one active membership.
- Persist active tenant in a safe server-side preference or signed session claim; revalidate on every API request.
- Empty state: if the user has no active tenant, show setup/invite-required state rather than an empty dashboard.

### Role-aware navigation

- Parent/owner: household, learners, plan, attendance, Quran, portfolio, records, dashboard.
- Tutor: assigned learners and permitted instructional surfaces.
- Admin: admin/program views only where explicitly implemented.
- Learner: no learner role UI in this slice unless explicitly approved; keep out of scope if not needed.

### Empty/loading/error states

Every scoped feature page must distinguish:

- No authorized tenant.
- Authorized tenant but no learners.
- Authorized tenant and learners but no feature data.
- API 401 signed-out.
- API 403 insufficient role.

## 10. Testing Plan

Write failing tests first.

### Unit tests

- `features/auth/__tests__/unit/authContext.test.ts`
  - Builds `AuthContext` from session and membership repository.
  - Rejects missing session.
  - Rejects disabled membership.
  - Resolves active tenant only from memberships.

- `features/auth/__tests__/unit/authorization.test.ts`
  - `requireTenantAccess` allows owner/parent/admin as configured.
  - `requireTenantAccess` rejects wrong tenant.
  - `requireLearnerAccess` rejects learner from another tenant.

### API tests

Add or update tests under each owning feature:

- Auth/session API test proving session includes stable user id.
- Household API rejects access to another user’s household.
- Children API lists only authorized learners.
- Plan/Lessons API rejects foreign `childId` and foreign lesson IDs.
- Attendance API rejects foreign `childId` and ignores/validates body `householdId`.
- Quran API rejects foreign `childId` and foreign session IDs.
- Portfolio API rejects foreign evidence IDs and foreign learner IDs.
- Records/Reports API returns only authorized learner/report data.
- Alerts API returns only authorized alerts.
- Dashboard API composes only authorized feature data.

### Integration tests

- Login page states: idle, loading, success, error, dev bypass visible/hidden.
- Header user menu: signed-in identity visible, sign out available, tenant selector only for multi-tenant users.
- Dashboard scoped empty state when tenant has no learners.
- Feature pages show 403/empty states correctly without leaking foreign names.

### Playwright tests

Create `e2e/auth-user-ownership.spec.ts` or repo-equivalent Playwright location after adding Playwright config if absent.

Required scenarios:

1. User A signs in and sees only User A learners on Dashboard.
2. User B signs in and sees only User B learners on Dashboard.
3. User A cannot open a direct URL to User B’s learner, lesson, Quran session, portfolio evidence, record, or report.
4. User A cannot POST attendance for User B’s `childId`.
5. User A cannot fetch User B dashboard/records/report data through API requests.
6. Multi-tenant tutor can switch only among assigned tenants and cannot see unassigned families.
7. Signed-out browser page redirects to `/login`.
8. Signed-out API request receives 401 JSON.

Seed test data must include at least:

- User A / Tenant A / Learner A / records in every feature.
- User B / Tenant B / Learner B / records in every feature.
- Tutor user assigned to Tenant A only.
- Admin user only if admin surfaces are implemented in this slice.

## 11. Build Phases

### Phase 0 — Auth/ownership audit checkpoint

- Confirm current branch has the latest `docs/ui-style-guide.md`, `docs/planning-quality-rule.md`, and `CLAUDE.md` wiring.
- Inspect all affected feature routers/services before touching code.
- Decide whether this slice depends on the Postgres migration being implemented first or whether a transitional in-memory ownership repository is acceptable.

Exit criteria: final file list and migration dependency decision are documented.

### Phase 1 — Persistent auth foundation

- Add durable auth repository/adapter or wire to the selected Postgres auth adapter.
- Define auth/domain types in `features/auth/types.ts`.
- Add membership repository and seed/test fixtures.
- Add auth context helpers and unit tests.

Exit criteria: users, tenants, memberships, and sessions can be resolved server-side with tests.

### Phase 2 — Route/API protection

- Update middleware for page redirect versus API 401 JSON.
- Update dynamic route/auth helper pattern so protected APIs require auth.
- Add authorization helpers for tenant, household, learner, and record access.

Exit criteria: unauthenticated APIs fail closed and protected pages still redirect to login.

### Phase 3 — Household and learner ownership

- Migrate household/setup/children services to server-derived ownership.
- Ensure user-created household/profile rows are tied to tenant membership.
- Ensure learner listing and creation are scoped.

Exit criteria: two users can each have separate households/learners without overlap.

### Phase 4 — Feature record authorization

Apply auth context to Plan/Lessons, Attendance, Quran, Portfolio, Alerts, Records/Reports, and Dashboard.

For each feature:

1. Write failing API tests for wrong-tenant access.
2. Update repository/service to filter by authorized tenant/learner.
3. Ignore or validate client-supplied owner fields.
4. Update front services only where contract changes are required.
5. Add integration tests for empty/forbidden states.

Exit criteria: all feature APIs are scoped and wrong-tenant attempts fail.

### Phase 5 — Role behavior and tenant switching

- Add tenant selector only for multi-tenant users.
- Add role-aware nav and route restrictions.
- Add tutor/admin behavior only where explicitly supported.

Exit criteria: parent, tutor, and admin roles behave according to acceptance criteria.

### Phase 6 — Playwright isolation suite

- Add Playwright config if absent.
- Add deterministic auth/test seeding helpers.
- Add the cross-user isolation tests.

Exit criteria: Playwright proves user isolation across UI and direct API attempts.

## 12. Out of Scope

- Payment/subscription authorization.
- Full learner self-login unless separately approved.
- File/photo upload authorization beyond existing portfolio evidence records.
- Public sharing links for reports or evidence.
- Organization billing/admin console beyond minimal role support.
- Legal/compliance claims.
- Row-level security policies unless the Postgres migration plan explicitly includes them in this slice.

## 13. Manual QA Plan

1. Start with a clean database/test seed containing User A and User B.
2. Sign out and open `/`; confirm redirect to `/login`.
3. Call `/api/dashboard/summary` signed out; confirm 401 JSON.
4. Sign in as User A.
5. Confirm Dashboard shows only User A learner names and counts.
6. Open Attendance; confirm only User A learners are available.
7. Create attendance for User A learner; refresh; confirm it persists for User A.
8. Attempt to POST attendance using User B learner ID; confirm 403/404 and no record is created.
9. Open Quran, Portfolio, Plan/Lessons, Records, and Alerts; confirm no User B names or records appear.
10. Sign out.
11. Sign in as User B.
12. Confirm User B does not see User A learners, sessions, reports, evidence, alerts, or records.
13. Sign in as tutor assigned only to User A tenant; confirm User B tenant is inaccessible.
14. Disable a membership; confirm that user loses access after refresh/sign-in.
15. Run `npm run build`, `npm test`, and Playwright suite.

## 14. Branch and Commit Plan

Recommended implementation branch:

```txt
feature/auth-user-ownership
```

Commit sequence:

```txt
test(auth): cover auth context and tenant membership authorization
feat(auth): add durable users tenants and memberships
feat(auth): derive server auth context from session
fix(api): return json 401 for unauthenticated protected APIs
test(children): cover learner ownership isolation
feat(children): scope learners to authenticated tenant
test(attendance): reject cross-tenant attendance access
feat(attendance): enforce tenant ownership in attendance service
test(quran): reject cross-tenant session access
feat(quran): enforce tenant ownership in quran service
test(portfolio): reject cross-tenant evidence access
feat(portfolio): enforce tenant ownership in portfolio service
test(records): cover scoped reports and records
test(dashboard): cover tenant-scoped dashboard composition
feat(shell): add account and tenant context controls
test(e2e): add cross-user isolation playwright suite
```

## 15. Risks and Rollback

### Risks

- Partial migration could give a false sense of security if some feature APIs remain unscoped.
- Middleware redirects can break API clients if APIs receive HTML instead of JSON.
- Existing seed/demo data may not have consistent owner fields.
- JWT membership claims can become stale if roles change.
- Dev bypass could become unsafe if enabled in production.
- Postgres and auth migration may be too large for one implementation slice.

### Mitigations

- Treat every feature API as untrusted until it has explicit ownership tests.
- Keep authorization checks in server services/repositories, not only UI or middleware.
- Add a final route inventory checklist before merge.
- Re-read `.env.example` and production environment before deploy.
- Add CI checks for `npm test`, build, smoke, and Playwright where feasible.
- Prefer smaller mergeable phases if Postgres migration is not ready.

### Rollback

- If login breaks but data ownership code is not deployed, revert auth adapter/session changes first.
- If a feature-scoping regression appears, disable the affected feature route or revert that feature’s service authorization commit.
- Never roll back by removing authorization checks from protected data routes without replacing them with an equivalent fail-closed guard.

## 16. Implementation Prompt for Claude Code

Use this prompt when starting implementation:

```txt
Create authentication and user ownership in Sheath Academy from docs/bug_enhancement/20260522-1200-authentication-user-ownership-plan.md.

Before coding, read CLAUDE.md, docs/planning-quality-rule.md, docs/ui-style-guide.md, and docs/bug_enhancement/20260517-1630-postgres-migration-plan.md.

Start with Phase 0 only: audit current auth, middleware, dynamic API route, household, children, attendance, quran, portfolio, records, alerts, dashboard, and persistence paths. Do not implement yet. Report the exact file list, current authorization gaps, whether Postgres migration must come first, and the smallest safe Phase 1 implementation slice.
```
