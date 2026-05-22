# Development Plan — Authentication and User Ownership

Branch: `claude/feedback-yIxhs`

Status: Planned

## 1. Summary

Enforce data isolation so multiple families can safely share one Sheath Academy deployment. The
approach is deliberate and minimal: the `households` table is the tenant boundary. Every authenticated
user maps to one household in v1 (enforced by a `UNIQUE` constraint on `households.user_id`). Every
feature row already carries `household_id`. The auth layer resolves `householdId` once per API
request and passes it into every feature route handler. Feature handlers validate that entity IDs in
the request body belong to the session household before acting.

**Multi-household readiness:** The schema already supports it — only `households.user_id UNIQUE`
limits v1 to one household per user. When multi-household is introduced, drop that constraint, add a
household switcher in the Header, and add an `activehouseholdId` claim to the session. Feature code
that already receives and uses `householdId` from auth context will not need to change.

This plan does **not** introduce `Tenant`/`TenantMembership` tables, role-based access control,
tutor/admin surfaces, or a household switcher UI. Those belong in a separate slice.

This plan assumes secrets and provider keys are supplied through environment variables only. No API
keys, OAuth secrets, database credentials, or deploy hooks should be committed.

## 2. Planning Mode

Mode 3 — Targeted security hardening.

Reason: the change is surgical — one shared resolver (already planned in the DB migration), one
choke-point update, and per-feature service scoping. It does not restructure identity, change the
auth provider, or introduce new UI surfaces beyond a user identity display and sign-out in the
Header.

## 3. Dependency on DB Migration Plan

This plan depends on the Drizzle/Postgres persistence migration
(`docs/bug_enhancement/20260522-1120-drizzle-postgres-persistence-migration.md`), specifically:

- **Phase 1 complete:** `features/lib/server/db.ts` (Drizzle client), schema with `users` and
  `households` tables.
- **Phase 2 complete:** `features/lib/server/tenant.ts` resolver (`getTenantCtx`) that returns
  `{ userId, householdId, timezone }`. Household row is created automatically on first API call for
  a new user (auto-provision pattern from DB Phase 2).

Auth plan implementation should not begin until these DB foundations are in place. If DB Phase 2 is
still in progress, auth plan work should be sequenced after it.

## 4. Current Code Path Audit

### Auth configuration

- **File:** `features/auth/auth.ts` — NextAuth, memory adapter, JWT sessions, Resend magic links,
  optional dev bypass credentials, Google/Facebook providers wired by env vars.
- **Gap:** session JWT carries `user.id` and `email` but no `householdId`. The household link lives
  in the DB (`households.user_id`), not in the session token.
- **Required change:** `householdId` is **not** stored in the JWT — it is resolved on every
  protected API request via `getTenantCtx()` to avoid stale session data when households are
  created post-login. The auth plan wraps `getTenantCtx()` to produce `AuthCtx`.

### Route protection (`middleware.ts`)

- Already redirects unauthenticated browser requests to `/login`.
- Already excludes `api/auth`, `api/health`, `login`, `about`, static assets, and image paths.
- **No change needed.** Household/ownership checks belong in API/service code, not middleware.
  Middleware only gates pages.

### Dynamic API route — the single choke point

- **File:** `app/api/[...slug]/route.ts` dispatches to feature routers by `slug[0]`.
- **Gap:** currently passes no auth context into feature routers.
- **Required change:** at the top of each HTTP handler, call `requireAuthCtx(request)`. If it
  returns a `Response` (401), return immediately. Otherwise pass `AuthCtx` into the feature router.

This is one function call and one parameter thread — not per-route boilerplate.

### Feature route handlers

- Each feature router calls its own route handlers with `(request, slug)` today.
- **Required change:** add `authCtx: AuthCtx` as a third parameter to each router and handler
  function. Handlers use `authCtx.householdId` to scope DB queries and validate request body IDs.
- Client-supplied `householdId`, `workspaceId` in the body are **ignored** — server session value
  only.
- Client-supplied entity IDs (`childId`, `lessonId`, `evidenceId`, etc.) are **validated**: look up
  the record, confirm its `household_id` matches `authCtx.householdId`, return 404 if not.

### Existing ownership fields

All feature tables already carry `household_id` (DB migration plan Section 7). No schema changes are
needed. This plan only enforces that API routes use the session-derived value.

## 5. Source-of-Truth Decision

| Question | Answer |
|---|---|
| What is the tenant boundary? | `household` — one row per family/program |
| How is household resolved? | `features/lib/server/tenant.ts` → `getTenantCtx(userId)` |
| Where is household stored in v1? | `households` table, `user_id UNIQUE` per v1 rule |
| What changes for multi-household? | Drop `UNIQUE`, add `active_household_id` to session, add switcher UI. Feature code unchanged. |
| What is `AuthCtx`? | `{ userId: string; householdId: string }` — resolved server-side, never from request body |
| Are roles in scope? | No. Single role (owner/parent) for all v1 users. |

## 6. Data Model / Contract Changes

### AuthCtx (server-only, never serialized to client)

```ts
// features/auth/server/context.ts
export interface AuthCtx {
  userId: string
  householdId: string
}
```

No new tables. The `households` table from the DB migration plan is the tenant record. The
`users` table from the DB migration plan is the identity record. No `Tenant` or `TenantMembership`
tables are introduced.

### Session JWT

NextAuth JWT callback must include stable `user.id`. `householdId` is **not** stored in the JWT —
it is resolved per-request from `getTenantCtx()`. This means:

- A new user's JWT is valid before their household exists.
- The household is auto-provisioned on first protected API call (DB Phase 2 behavior).
- If a user has no household yet, `getTenantCtx()` returns `{ householdId: '' }`. Route handlers
  that require a household return 403 with a clear `setup_required` code — not a silent 404.

### Multi-household path (not in this slice)

When multi-household is introduced later:

1. Drop `UNIQUE` on `households.user_id`.
2. Add `active_household_id text` to the JWT/session (set on login or household switch).
3. `getTenantCtx()` reads `active_household_id` from the session instead of querying by `user_id`.
4. Add household switcher UI to Header.
5. Feature code that receives `authCtx.householdId` does not change.

### API contract rule

- Allowed: `POST /api/attendance` with `childId`, `date`, `status`.
- Required server behavior: validate `childId` belongs to `authCtx.householdId` before writing;
  ignore any `householdId` in the body.
- Disallowed: writing any owned record before confirming `household_id` matches.

### Owned feature entities and enforcement action

| Entity | Field | Enforcement |
|---|---|---|
| `households` | `user_id` | Resolved via `getTenantCtx` — no body trust |
| `learners` | `household_id` | Filter list by `householdId`; validate single lookup |
| Subjects | `household_id` | Filter + validate |
| School years | `household_id` | Filter + validate |
| Lesson tasks | `household_id`, `learner_id` | Validate `learner_id` ownership, then write |
| Attendance events | `household_id`, `learner_id` | Validate `learner_id`; ignore body `householdId` |
| Qur'an sessions | `household_id`, `learner_id` | Validate `learner_id`; ignore body `householdId` |
| Portfolio evidence | `household_id`, `learner_id` | Validate `learner_id` and `evidence_id` |
| Alerts | `household_id` | Filter by `householdId` |
| Records/reports | `household_id` | Filter by `householdId` |

## 7. API / Store / Service Plan

### Auth context helper

Create `features/auth/server/context.ts`:

```ts
// Returns null if no session.
export async function getAuthCtx(request: NextRequest): Promise<AuthCtx | null>

// Returns AuthCtx or a 401 Response. Route handlers return immediately on Response.
export async function requireAuthCtx(
  request: NextRequest
): Promise<AuthCtx | Response>

// Validate entity belongs to session household.
// Throws NotFoundError (→ 404) if household_id does not match.
export async function assertOwnership(
  authCtx: AuthCtx,
  entityType: 'learner' | 'lesson' | 'attendance' | 'session' | 'evidence' | 'alert',
  entityId: string
): Promise<void>

export function unauthorizedResponse(): Response   // 401 JSON
export function setupRequiredResponse(): Response  // 403 JSON, code: 'setup_required'
```

`getAuthCtx` implementation:
1. Call `auth()` from NextAuth to get session.
2. If no session, return `null`.
3. Call `getTenantCtx(session.user.id)` from `features/lib/server/tenant.ts` (DB Phase 2).
4. Return `{ userId: session.user.id, householdId: tenantCtx.householdId }`.

`assertOwnership` implementation:
1. Query the owning feature repository for the entity by `entityId`.
2. If not found or `household_id !== authCtx.householdId`, throw `NotFoundError`.
3. The calling route handler catches `NotFoundError` and returns 404.

### Dynamic API route update

`app/api/[...slug]/route.ts` — add at the top of each HTTP method handler:

```ts
const authResult = await requireAuthCtx(request)
if (authResult instanceof Response) return authResult
// authResult is AuthCtx — pass into feature router
return featureRouter(request, slug, authResult)
```

Public routes (`/api/health`) are handled before the auth check via early return.

### Feature router / handler signature update

Every feature router gains a third parameter:

```ts
export function householdRouter(
  request: NextRequest,
  slug: string[],
  authCtx: AuthCtx
): Promise<Response>
```

Handlers that write data call `assertOwnership` on every entity ID from the request body before
reading or writing. Handlers that list data filter by `authCtx.householdId` — never accept
`householdId` from query params or body.

### Feature service migration order

1. Household / setup — scope household lookup to `authCtx.userId`.
2. Children / learners — filter list and validate IDs against `authCtx.householdId`.
3. Subjects / school year — filter by `authCtx.householdId`.
4. Plan / lessons — validate `learnerId` before read/write.
5. Attendance — validate `learnerId`; ignore body `householdId`.
6. Qur'an — validate `learnerId`.
7. Portfolio — validate `learnerId` and `evidenceId`.
8. Alerts — filter by `authCtx.householdId`.
9. Records / reports — filter by `authCtx.householdId`.
10. Dashboard — scoping flows from each feature service above; no separate dashboard change needed.

Each step: write failing tests first, implement, confirm tests pass, commit.

### Error concealment policy

| Scenario | Response |
|---|---|
| No session | 401 JSON |
| Valid session, no household yet | 403 JSON `{ code: 'setup_required' }` |
| Foreign entity ID (right format, wrong household) | 404 — do not reveal existence |
| Malformed ID | 400 |

## 8. UI Plan Audit

### Login page

- No layout changes.
- Add explicit states: magic-link sent, link expired/invalid, provider error.
- After sign-in: if `householdId` is empty (new user, no household yet), redirect to `/setup`.
  Otherwise redirect to `/`.
- Tests: email submission, loading, success/redirect, error, dev bypass visible/hidden.

### Header additions

- Display authenticated user's name or email (read from `useSession()`).
- Add sign-out link/button — direct `signOut()` call, no confirmation dialog.
- No tenant switcher, no role badge in this slice.
- Tests: user email shown, sign-out available, no tenant selector rendered.

### Protected feature pages

- No visual changes. Correct scoping is invisible to authorized users and produces accurate empty
  states for new households with no data yet.

### Empty states

Empty states when a household has no records already exist per feature. They will display correctly
once APIs return only authorized (potentially empty) data instead of demo seed data.

## 9. Acceptance Criteria

1. A signed-out user visiting a protected app page is redirected to `/login`.
2. A signed-out user calling a protected feature API receives 401 JSON — not data, not HTML.
3. A signed-in user sees only their own household's learners, lessons, sessions, evidence, records,
   and alerts.
4. User A cannot list, view, create, update, or delete User B's learners or any records belonging
   to User B's household.
5. Client-supplied `householdId` or `workspaceId` in a request body is never used as the
   authorization boundary — only the session-derived value is used.
6. Client-supplied entity IDs are validated against `authCtx.householdId` before read or write.
   Unowned IDs return 404.
7. New records are written with server-derived `householdId` — never copied from the request body.
8. A new user with no household yet receives 403 `setup_required` from protected write routes.
9. Dev bypass remains available only when `DEV_BYPASS_SECRET` and `NEXT_PUBLIC_DEV_MODE=true` are
   set.
10. Missing auth env vars fail closed; they never expose protected data.
11. `npm run build`, `npm test`, and Playwright user-isolation suite pass before merge.

## 10. Testing Plan

Write failing tests first (TDD — applies to every item below).

### Unit tests

**`features/auth/__tests__/unit/context.test.ts`**

- `getAuthCtx` returns `null` when no session exists.
- `getAuthCtx` returns `{ userId, householdId }` for user with an existing household.
- `getAuthCtx` returns `{ userId, householdId: '' }` for new user with no household row yet.
- `requireAuthCtx` returns 401 Response when no session.
- `assertOwnership('learner', learnerId)` resolves for a learner owned by the session household.
- `assertOwnership('learner', learnerId)` throws (→ 404) for a learner from a different household.

### API tests

Add or update a test per feature under `features/<feature>/__tests__/api/`:

| Feature | Test |
|---|---|
| Household | GET with no session → 401; GET returns only own profile |
| Children | GET lists only own learners; GET by foreign `childId` → 404 |
| Subjects | GET filters by `householdId`; POST with no session → 401 |
| Plan / Lessons | POST with foreign `learnerId` → 404; GET scoped to own learners |
| Attendance | POST with foreign `learnerId` → 404; body `householdId` ignored |
| Qur'an | POST with foreign `learnerId` → 404; GET scoped to own sessions |
| Portfolio | GET with foreign `evidenceId` → 404; POST scoped to own learner |
| Alerts | GET returns only own-household alerts |
| Records | GET returns only own-household reports |
| Dashboard | Summary counts reflect only own household's data |

### Integration tests

- Login: idle, loading, magic-link-sent, error, dev-bypass visibility.
- Header: user email shown, sign-out available, no tenant switcher rendered.
- Dashboard: shows empty state for a household with no learners (no foreign data leaked).

### Playwright suite

Create `e2e/auth-isolation.spec.ts`.

Required scenarios:

1. Signed-out browser request to `/` redirects to `/login`.
2. Signed-out API call to `/api/dashboard/summary` returns 401 JSON (not HTML, not data).
3. User A signs in and sees only User A learners on Dashboard.
4. User B signs in and sees only User B learners on Dashboard.
5. User A cannot open a direct URL to a User B learner.
6. User A cannot `POST /api/attendance` with User B `learnerId` — receives 404.
7. User A cannot `GET /api/children` and receive User B learner names in the response.

Test seed must include:
- User A with Household A, Learner A, and at least one record per feature.
- User B with Household B, Learner B, and at least one record per feature.

## 11. Build Phases

### Phase 0 — Audit checkpoint (before any code)

Confirm:
- DB Phase 1 and Phase 2 are complete (`features/lib/server/tenant.ts` exists and exports
  `getTenantCtx`).
- `auth()` from `features/auth/auth.ts` returns a session with stable `user.id`.
- `app/api/[...slug]/route.ts` current handler signatures.
- Every feature router function signature.
- Which routes must remain public (health, auth callbacks).

Exit criteria: file list confirmed, `getTenantCtx` signature verified, public route list documented.

### Phase 1 — Auth context helper and API choke point

1. Write failing unit tests for `getAuthCtx`, `requireAuthCtx`, `assertOwnership`.
2. Create `features/auth/server/context.ts`.
3. Update `app/api/[...slug]/route.ts` — call `requireAuthCtx`, pass `authCtx` into all feature
   routers.
4. Update each feature router function signature to accept `authCtx: AuthCtx` (thread only — no
   behavior change yet).
5. `npm test` must pass.

Exit criteria: unauthenticated API calls return 401 JSON; authenticated calls still work; unit tests
green.

### Phase 2 — Household and learner ownership

1. Write failing API tests for household and children scope.
2. Scope household service to `authCtx.userId`.
3. Scope learner list and ID validation to `authCtx.householdId`.
4. Add user email display and sign-out to Header.
5. `npm test` must pass.

Exit criteria: User A cannot see User B learners through the API; household route returns only the
authenticated user's profile.

### Phase 3 — Feature record authorization

Apply `authCtx.householdId` scoping to each remaining feature in the order from Section 7. For each:

1. Write failing API test for wrong-household access.
2. Add `assertOwnership` call or `householdId` filter in the service.
3. Remove any trust of client-supplied `householdId` from the body.
4. `npm test` must pass after each feature.
5. Commit before moving to next feature.

Exit criteria: all feature APIs scope queries and reject foreign IDs.

### Phase 4 — Playwright isolation suite

1. Add Playwright config if absent.
2. Add deterministic test seed (User A + Household A + records; User B + Household B + records).
3. Implement `e2e/auth-isolation.spec.ts` scenarios from Section 10.
4. Playwright suite passes.

Exit criteria: Playwright proves UI redirect, API 401, and cross-user data isolation.

## 12. Out of Scope

- `Tenant` / `TenantMembership` tables.
- Multi-household switching UI (the schema supports it; the switcher and session claim are deferred).
- Role-based access control (tutor, admin, learner self-login).
- Invite / membership management flows.
- Payment / subscription authorization.
- File / photo upload authorization beyond existing portfolio evidence.
- Public sharing links for reports or evidence.
- Row-level security policies in Postgres.

## 13. Manual QA Plan

1. Start with two seeded accounts: User A (Household A, Learner A) and User B (Household B,
   Learner B), each with records in every feature.
2. Sign out and open `/`; confirm redirect to `/login`.
3. Call `/api/dashboard/summary` unsigned; confirm 401 JSON body, not HTML.
4. Sign in as User A; confirm Dashboard shows only User A learner name and counts.
5. Open Attendance; confirm only User A learner is available for record entry.
6. Attempt `POST /api/attendance` in browser dev tools with User B `learnerId`; confirm 404.
7. Open Plan, Qur'an, Portfolio, Records, Alerts; confirm no User B names or data appear.
8. Sign out; sign in as User B; confirm User B sees no User A data anywhere.
9. Create a brand-new user account; confirm Dashboard shows empty states (no demo data).
10. Confirm new user is routed to `/setup` when no household exists yet.
11. Run `npm run build`, `npm test`, Playwright suite.

## 14. Branch and Commit Plan

```txt
feature/auth-user-ownership
```

Commit sequence:

```txt
test(auth): cover getAuthCtx requireAuthCtx assertOwnership helpers
feat(auth): add auth context helpers wrapping tenant resolver
fix(api): return 401 json for unauthenticated protected api calls
feat(api): thread authCtx into all feature routers
feat(shell): display signed-in user email and sign-out in Header
test(household): cover session-scoped household and learner access
feat(household): scope household and learner queries to session userId
test(subjects): cover householdId scoping in subjects and school-year
feat(subjects): scope subjects and school-year to session household
test(plan): reject cross-household learnerId in plan routes
feat(plan): scope lessons to session household
test(attendance): reject cross-household learnerId in attendance post
feat(attendance): scope attendance to session household
test(quran): reject cross-household learnerId in quran routes
feat(quran): scope quran sessions to session household
test(portfolio): reject cross-household evidence and learnerId
feat(portfolio): scope portfolio evidence to session household
test(records): cover household-scoped records and alerts
feat(records): scope records and alerts to session household
test(e2e): add playwright cross-user isolation suite
```

## 15. Risks and Rollback

### Risks

- Threading `authCtx` through every feature router and handler is wide but mechanical. A missed
  signature is a TypeScript compile error — it surfaces immediately in `npm run build`.
- If `getTenantCtx` is slow (no index on `households.user_id`), the per-request lookup adds
  latency. Mitigation: `households.user_id` carries a `UNIQUE` index by design; query is O(1).
- A new user who has no household yet will receive a `householdId: ''`. Route handlers must check
  for this explicitly and return `setupRequiredResponse()` — not silently skip authorization.
- Partial migration (some features scoped, some not) is a real gap. Close it feature by feature
  with tests before merging each feature.

### Mitigations

- TypeScript enforces `authCtx` threading at compile time.
- Write API tests before implementing each feature scope — the gap is visible before code is written.
- Keep `assertOwnership` centralized; it cannot be bypassed by copying logic.
- Route inventory checklist before merge: every handler that writes data must call `assertOwnership`
  or filter by `householdId`.

### Rollback

- If login breaks, revert `features/auth/auth.ts` and `app/api/[...slug]/route.ts` changes. The
  context helper is additive and does not break existing behavior if unused.
- If a feature-scoping regression appears, revert that feature's service commit. The 401 choke-point
  behavior remains intact.
- Never remove an authorization check without replacing it with an equivalent fail-closed guard.

## 16. Implementation Prompt for Claude Code

```txt
Implement authentication and user ownership from
docs/bug_enhancement/20260522-1200-authentication-user-ownership-plan.md.

Before coding, read CLAUDE.md and confirm:
- DB Phase 1 and Phase 2 are complete
- features/lib/server/tenant.ts exports getTenantCtx and its exact signature
- auth() returns a session with stable user.id
- app/api/[...slug]/route.ts current handler signatures
- every feature router function signature
- which routes must remain public

Start with Phase 0 audit only. Report findings. Do not implement until Phase 0
is confirmed.
```
