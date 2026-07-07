# Multiple users per household — context & implementation plan

Status: **planning** (no code yet). Target branch base: `dev`.

This document has two parts:

- **Part A — Context & locked decisions.** What we are building and why, and every product/architecture decision already made. Read this before the plan.
- **Part B — Implementation plan.** Audited code paths, data model, waves, TDD plan, per the rules in `docs/planning-quality-rule.md` and `docs/ui-style-guide.md`.

---

# Part A — Context & locked decisions

## A1. The goal

Today the app binds **one user to exactly one household**. We are moving to **many users per household, and many households per user** — i.e. a true membership model, like Slack workspaces. A parent can be invited into their spouse's household and see the same children, lessons, attendance, Qur'an, and portfolio data. A user who belongs to more than one household picks which one is "active."

## A2. Where the 1:1 binding is hardcoded today (the linchpin)

The strict 1:1 assumption lives in four layers. All four change.

| # | Layer | File / line | Current behavior |
|---|-------|-------------|------------------|
| 1 | **Schema** | `db/schema.ts:74` | `households.userId` is `.notNull().unique()`. The household points at its single owner; there is no membership table. |
| 2 | **Sign-in resolution** | `features/lib/server/tenant.ts:31` | `resolveTenant()` does `upsertUserByEmail` → `upsertHouseholdForUser(user.id)`, which looks up a household *by userId* and creates one if missing. Every new email gets its own household. |
| 3 | **Session claim** | `features/auth/auth.ts:92-104`, `:115` | The resolved `householdId` is baked into the JWT token, then the session, then `AuthCtx.householdId` (`features/auth/server/context.ts:90`). Every API route reads this single value with **no DB lookup** — tenancy is a JWT claim, not a query. |
| 4 | **Admin display** | `features/admin-metrics/server/service.ts:41` | Joins `households → users ON households.userId` to show exactly **one** email per household row. |

**Why the change is tractable:** every domain table (`learners`, `lesson_tasks`, `attendance_events`, `quran_sessions`, `portfolio_evidence`, `subjects`, `resources`, `household_settings`) is already scoped by `householdId`, **not** `userId`. Once two users resolve to the same active `householdId`, shared visibility of all child data is automatic. The split between `user_settings` (per-user) and `household_settings` (shared) already anticipates multi-user.

## A3. Locked decisions (from the user)

1. **Many households per user.** A user can belong to multiple households and must pick an **active** one. This requires:
   - an **active-household** concept stored in the session (JWT claim), and
   - a **household switcher** in the header (Slack-style).
2. **Two ways to add a member, both end in a magic-link finish:**
   - **Magic-link invite** — owner enters an email; invitee gets a magic link; on first sign-in they join the household.
   - **Manual add** — owner adds a person directly. This **creates a whole user row** (a stub: email only, no password/no OAuth account) and sends them a magic link to finish setup. Manual add and invite therefore share the same backend path; the only difference is whether the owner expects the person to self-serve.
3. **Owner / member roles.** The schema and repository will carry a `role` (`owner` | `member`) from day one. **Owner-only member management** (invite/remove/role-change) is the intended end state, but full enforcement is **planted, not built now** — we ship the role column and owner tagging; granular permission gating is a later wave.
4. **Admin page** shows each household as an **expandable/collapsible row** with the full member list; the **owner is tagged**.
5. **Display names for users.** Users get a real `name` (already a column on `users`) set via **Settings**, and the app shifts from showing raw **email as identity** to showing the **name** (email as fallback/secondary). This is an app-wide identity-display change, starting in Settings.

## A4. New concepts this introduces (did not exist before)

- **Membership** — the many-to-many edge between users and households (`household_members`).
- **Invitation** — a pending, email-targeted offer to join a household, carrying a magic-link token (`household_invitations`).
- **Active household** — which membership a multi-household user is currently viewing; persisted per-user and surfaced as a session claim + header switcher.
- **Owner** — the member who created the household (or was transferred ownership); cannot be removed; the only role that manages members (enforcement deferred).

## A5. What explicitly does NOT break

- All domain data is `householdId`-scoped, so shared access is automatic — **no data migration of domain rows**.
- `user_feedback` and `product_validation_responses` carry both `userId` and `householdId` — unaffected.
- The JWT-claim performance model survives **if** we keep "active household" as a single claim and validate membership at token-issue / switch time rather than per request (see A6).

## A6. Known trade-off to decide in the plan

The JWT holds the active `householdId` and routes trust it with no per-request DB lookup (fast). After this change, a user could be **removed** from a household but still hold a JWT naming it. Options, resolved in Part B §B4:

- **(Chosen)** Validate membership only when the token is **issued or switched** (`resolveTenant` / switch action). Accept the same JWT trust window the app already has today. Lowest cost, matches current architecture.
- (Rejected for now) Validate membership on every `requireAuthCtx` call — safer but adds a DB round-trip to every API request, regressing the deliberate no-lookup design.

---

# Part B — Implementation plan

## B1. Summary

Introduce a membership model (`household_members`) and invitations (`household_invitations`), replace the 1:1 sign-in binding with membership resolution plus an active-household session claim and header switcher, add owner-driven invite/manual-add flows over the existing magic-link infrastructure, update the admin page to show expandable member lists with owner tags, and let users set a display name in Settings with the app preferring name over email. Delivered in **five dependency-ordered waves**, each independently shippable to `dev`, each TDD-first.

## B2. Planning mode

**Primarily Mode 5 (Architecture Migration)** — we move the user↔household relationship from a column to a join table and change a shared contract (the session claim). **Mode 4 (New Feature)** applies to the invitation/member-management and switcher surfaces. Each wave below states which mode governs it.

## B3. Current code-path audit (traced so far)

These were read during the thought-process pass and are the basis of this plan:

| Concern | File | What it does today |
|---|---|---|
| Schema | `db/schema.ts` | `users`, `households (userId notNull unique)`, `user_settings`, `household_settings`, domain tables all `householdId`-scoped. No membership table. |
| Household data access | `features/household/server/repository.ts` | `upsertUserByEmail`, `upsertHouseholdForUser(userId)`, `getHouseholdForUser(userId)`, `getHouseholdById`, name/timezone updaters. All assume one household per user. |
| Tenant resolution | `features/lib/server/tenant.ts` | `resolveTenant(session)` → upsert user → upsert that user's single household. `devTenantContext()` for dev/test. |
| Auth callbacks | `features/auth/auth.ts:75-119` | `jwt` callback resolves tenant when `!token.householdId`; honors an `update` trigger that patches `userId`/`householdId`/`timezone`. `session` callback copies claims onto `session.user`. |
| Request auth | `features/auth/server/context.ts` | `getAuthCtx` / `requireAuthCtx` read `user.householdId` from the session with no DB lookup; `setupRequiredResponse()` (403 `setup_required`) when claim missing. |
| Admin metrics | `features/admin-metrics/server/service.ts` + `types.ts` | One row per household via `innerJoin(users, households.userId = users.id)`; `AdminMetricsUserRow` has flat `userId`/`userName`/`userEmail`; `filterAndSortUserRows` searches those single fields. |

### Files the pre-implementation audit MUST open (not yet read — do NOT assume their contents)

Per `docs/planning-quality-rule.md` "File Inspection Constraint," each wave opens only what it touches. Unknowns are flagged, not guessed:

- **Wave 1:** `features/auth/server/repository.ts` (calls `upsertHouseholdForUser` at ~:72 — confirm the orphan-recovery path), `features/auth/lib/drizzleAdapter.ts` (orphaned-user `getUserByEmail` logic, magic-link/verification token handling), `scripts/seed/buildPayload.ts` and the seed entrypoint (households are seeded with a `userId` — must also seed owner memberships). Note: `db/wipe_app_data.sql` already uses `CASCADE` on the `households` truncate, so new child tables (`household_members`, `household_invitations`) will be wiped automatically — no change needed.
- **Wave 2:** `features/layout/front/components/Header.tsx` and the `useHousehold()` context/`HouseholdProvider` (where the switcher mounts), `middleware.ts` (route protection unaffected, confirm), the e2e `auth-fallback-credentials.spec.ts` (asserts on the userId→household delete).
- **Wave 3:** `app/api/[...slug]/route.ts` + the household feature router (new `members`/`invitations` routes), the magic-link **email send** path (Resend) used for sign-in, to reuse for invites; `features/auth` magic-link config.
- **Wave 4:** `features/admin-metrics/front/components/AdminMetricsFamilyCard.tsx` + `AdminMetricsDashboard.tsx`, `features/admin-metrics/server/metrics.ts` (`filterAndSortUserRows`, `paginateRows`), `app/(shell)/admin/metrics/page.tsx`.
- **Wave 5:** the Settings feature/page (location not yet confirmed — `grep` for the profile/settings page that owns `users.name` and `user_settings`), and every identity-display surface that currently prints `email` (Header, admin, feedback author display).

If any of these contradicts an assumption below, **stop and revise this doc** before coding.

## B4. Source-of-truth decisions

- **Membership & invitations are owned by the `household` feature** (they are household-scoped relationships). New repository functions live in `features/household/server/`. `resolveTenant` (in `features/lib/server`) calls into the household repository — it must not reach into other features' stores.
- **Active-household selection is owned by auth/session** (`tenant.ts` + `auth.ts`), persisted as a per-user setting (`user_settings` key `active_household_id`).
- **`households.userId`** is repurposed/deprecated, not silently dropped. Decision (Wave 1): **keep the column, drop the `unique` constraint, treat it as the denormalized owner pointer (`ownerUserId` semantics)**, and make `household_members(role='owner')` the canonical owner. The column stays for backfill safety and rollback; a later wave may remove it. Reason: avoids a big-bang and preserves rollback.
- **Membership trust window:** validated at token issue/switch only (A6, chosen option). `requireAuthCtx` stays lookup-free.

## B5. Data model / contract changes

### New table — `household_members`
```
household_members
  id           text  pk            // id_-style, generated like other rows
  householdId  text  → households.id   notNull
  userId       text  → users.id        notNull
  role         text  notNull default 'member'   // 'owner' | 'member'
  createdAt    timestamp notNull
  updatedAt    timestamp notNull
  UNIQUE (householdId, userId)
  index on (userId)            // "households for this user" — switcher
  index on (householdId)       // "members of this household" — admin
```

### New table — `household_invitations`
```
household_invitations
  id              text pk
  householdId     text → households.id  notNull
  email           text notNull              // normalized lowercase
  role            text notNull default 'member'
  invitedByUserId text → users.id  notNull
  tokenHash       text notNull unique       // hashed magic token (mirror password_reset_tokens pattern)
  status          text notNull default 'pending'  // pending | accepted | revoked | expired
  expiresAt       timestamp notNull
  acceptedAt      timestamp
  createdAt       timestamp notNull
  index on (householdId)
  index on (email)
```
Token hashing follows the existing `password_reset_tokens` pattern (`db/schema.ts:343`) — store only the hash.

### Changed — `households`
- Drop the `unique` on `userId` (Drizzle migration). Keep the column as denormalized owner. (No rename in Wave 1 to keep the diff small; rename to `ownerUserId` is an optional later cleanup.)

### Changed types
- `features/admin-metrics/types.ts` — `AdminMetricsUserRow` gains `members: { userId: string; name?: string; email?: string; role: 'owner' | 'member'; lastLoginAt?: string }[]`. Keep a top-level `ownerEmail`/`ownerName` for default sort. Flat `userId/userEmail/userName` are removed (or kept as owner aliases during transition — decided in Wave 4 audit).
- `AuthCtx` (`context.ts:6`) is unchanged in shape (`householdId` is now the *active* one). A new optional `memberships` summary may be added to the session for the switcher (Wave 2), not to `AuthCtx`.
- New `features/household/types.ts` (or existing) gains `HouseholdMember`, `HouseholdInvitation`, `MembershipRole`.

### Date/time rules
- All new timestamps stored UTC. `expiresAt` for invitations: 7 days (configurable constant). "Active household" persisted as a plain id string in `user_settings`.

## B6. API / service / store plan

### Wave 1 (data + repo, no behavior change)
- `features/household/server/repository.ts`: add `addMember`, `removeMember`, `listMembers(householdId)`, `listHouseholdsForUser(userId)`, `getMembership(householdId, userId)`, `setMemberRole`. `upsertHouseholdForUser` now also creates the **owner** membership. `getHouseholdForUser` is replaced/augmented by `listHouseholdsForUser` (keep old function returning the owner-household for back-compat until callers migrate).
- Migration via `npm run db:generate`; backfill script inserts one `role='owner'` membership per existing household from `households.userId`.
- `db/wipe_app_data.sql` is **not touched** — CASCADE handles new tables automatically.

### Wave 2 (active household + switcher)
- `resolveTenant` rewrite (see B7 pseudocode).
- New session field for the membership list; `auth.ts` `jwt` callback populates it and honors a switch via the existing `update` trigger (`auth.ts:80`).
- New tiny API route to **switch active household**: validates the target is one of the caller's memberships, writes `user_settings.active_household_id`, and triggers a session `update`. Lives under the household feature router; `app/api/[...slug]/route.ts` already delegates.

### Wave 3 (invitations + manual add)
- Routes (household feature router): `POST members/invite` (email, role) → create user stub if needed + invitation + send magic link; `POST members/manual-add` (same path, different copy); `POST invitations/accept` (token) → create membership, mark accepted; `GET members` (list); `DELETE members/:userId` (owner-only, enforcement light for now); `POST invitations/:id/revoke`.
- Reuse the existing Resend magic-link send; the accept flow rides the existing NextAuth magic-link sign-in, then `resolveTenant` attaches the pending invite.

### Wave 4 (admin)
- `getAdminMetricsUsers` join changes from `households→users(by userId)` to `households → household_members → users`, aggregated into `members[]` per household. `filterAndSortUserRows` searches across all member emails/names.

### Wave 5 (display names)
- Settings route to update `users.name`. Identity-display helper (e.g. `displayName(user) = name ?? email`) used by Header, admin, feedback author rendering.

All responses use the standard envelope `{ status, data, message, timestamp }` (CLAUDE.md convention).

## B7. `resolveTenant` target behavior (Wave 2)

```
resolveTenant(session):
  user = upsertUserByEmail(email, name)
  // 1. accept any pending invite for this email
  for inv in pendingInvitationsForEmail(user.email):
     addMember(inv.householdId, user.id, inv.role); markAccepted(inv)
  memberships = listHouseholdsForUser(user.id)
  // 2. brand-new user with no membership and no invite → preserve today's behavior
  if memberships empty:
     hh = upsertHouseholdForUser(user.id)   // also creates owner membership
     memberships = [hh]
  // 3. choose active household
  saved = userSetting(user.id, 'active_household_id')
  active = (saved is a valid membership) ? saved : memberships[0]
  return { userId, householdId: active.householdId, timezone: active.timezone, memberships }
```

## B8. UI plan & UI-pattern audit (`docs/ui-style-guide.md`)

### Header household switcher (Wave 2) — NEW pattern, justification required
- **No existing approved pattern** covers a workspace switcher. Closest is none; this is a navigation control, not an editable record card, so the inline-edit rule (§1) does **not** apply. The plan explicitly declares a **new pattern**: a header dropdown listing the user's households, current one checked, owner badge on owned ones.
- Only render the switcher when the user has **≥2 memberships** (single-household users see nothing new).
- Accessibility: keyboard-navigable menu, `aria-label` on the trigger, 44px touch target, text label not color-only for the active state.

### Admin household row (Wave 4) — expand/collapse
- Uses the **chevron "View details/expand"** intent (§2 table) — read-only expansion of the member list, **not** the editable-card inline-edit pattern. Owner gets a **text badge** ("Owner"), not color-only (§ accessibility).
- Reuses existing admin card container; adds a collapsible region. Page stays under `app/(shell)/admin/metrics` with current width.
- Icon-only expander must have an accessible label ("Show members of {household}").

### Settings — member management + display name (Wave 3 & 5)
- Follows the **collapsible add-form pattern** (§6): an "Invite member" / "Add member" toggle button (`bg-forest-900` styling), `form-section-heading` + `add-form-card` wrappers, default `showForm` per the section's convention.
- Member list rows: read-only summary + owner badge; remove action (when built) uses the **app-styled destructive confirmation** (§3) — **never `window.confirm`** — naming the member being removed.
- Display-name field: standard form input in the existing settings card; Save persists through the settings service.

### Identity display shift (Wave 5)
- Replace raw-email renders with `displayName(user)` (name, email fallback). Email remains visible as secondary text where it aids identification (e.g. admin).

## B9. Acceptance criteria (observable)

Wave 1:
- After migration + backfill, every existing household has exactly one `role='owner'` membership whose `userId` equals the old `households.userId`. (DB assertion + repo test.)
- `listHouseholdsForUser(ownerId)` returns that household; `listMembers(hhId)` returns the owner.

Wave 2:
- A user who is a member of two households sees a switcher; selecting household B makes dashboard/lessons/attendance show B's children and hides A's after the session updates; refreshing keeps B active (persisted).
- A brand-new email signing in with no invite still lands in its own freshly created household (no regression).
- A user removed from a household before token re-issue still relies on the trust window (documented), but on next sign-in/switch the household is gone from their list.

Wave 3:
- Owner invites `b@x.com`; `b@x.com` receives a magic link; signing in via it lands them in the owner's household as a member, seeing the same children. The invitation row flips to `accepted`.
- Owner "manual add" of `c@x.com` creates a user row immediately and sends a magic link; before they accept, the household members list shows them as pending.
- A second invite to an already-accepted email does not create a duplicate membership.

Wave 4:
- Admin metrics shows one row per household; expanding it lists all members with emails; the owner row is tagged "Owner". Searching by a non-owner member's email finds the household.

Wave 5:
- Setting a display name in Settings makes the Header and admin show the name instead of the email; users without a name still show their email.

## B10. Testing plan (TDD — failing tests first, each wave)

Per CLAUDE.md: unit tests for repo/service, mock at the repository boundary, never mock `getDb()`; integration tests for new/changed UI covering loading/empty/error/populated + interactions; Playwright for cross-screen flows.

- **Wave 1 (unit/repo + migration):** `household-members` repo tests (add/list/remove/role, dedupe on `(householdId,userId)`); backfill correctness test; seed payload test updated so seeded households produce owner memberships (`scripts/seed/__tests__/buildPayload.test.ts`).
- **Wave 2 (unit + integration + e2e):** `resolveTenant` unit tests (invite-accept, new-user default, active-household selection/persistence, invalid saved id fallback); switcher integration tests (renders only with ≥2 memberships; switching changes context; loading/empty/error); Playwright: two-household user switches and child data swaps and persists across refresh.
- **Wave 3 (api + integration + e2e):** invite/manual-add/accept/revoke route tests (auth scoping, duplicate-invite idempotency, expired token rejection, owner-only guard); members settings integration tests (collapsed/expand, invite submit, destructive-confirm cancel + confirm paths, empty/loading/error); Playwright: invite → magic link → join → sees shared children.
- **Wave 4 (api + integration):** admin service test (members aggregated per household, search matches any member); `filterAndSortUserRows` unit tests for multi-member search; `AdminMetricsFamilyCard` integration (collapsed, expanded member list, owner badge present, accessible expander label).
- **Wave 5 (unit + integration):** `displayName` helper unit tests; settings name-update integration (save path, error path); Header integration shows name over email with email fallback.

## B11. Build phases / waves (dependency-ordered)

1. **Wave 1 — Membership model & migration (Mode 5).** Schema + migration + backfill + repository + seed/wipe updates. No user-visible change. Owner membership mirrors today's binding. *Branch:* `feature/household-members-model`.
2. **Wave 2 — Active household & switcher (Mode 5 + 4).** `resolveTenant` rewrite, session membership list, switch route, header switcher. *Branch:* `feature/active-household-switcher`.
3. **Wave 3 — Invitations & manual add (Mode 4).** Invite/manual-add/accept/revoke + member-management settings UI over magic link. *Branch:* `feature/household-invitations`.
4. **Wave 4 — Admin member lists (Mode 3).** Expandable member rows + owner tag + multi-member search. *Branch:* `feature/admin-household-members`.
5. **Wave 5 — Display names & identity shift (Mode 2).** Settings name field + `displayName` everywhere email is identity. *Branch:* `feature/user-display-names`.

Each wave: failing tests → implement → `npm run build` + `npm test` green → PR into `dev`.

## B12. Out of scope (do not build now)

- Granular permission enforcement beyond owner tagging (member can still technically hit management routes until the permissions wave; routes get a light owner guard only).
- Ownership transfer between users.
- Removing the `households.userId` column (kept for rollback; remove in a later cleanup).
- Per-household role beyond `owner`/`member` (no `co-teacher`, `viewer`, etc.).
- Email allow-list / domain restrictions on invites (existing backlog item, unchanged).
- Any change to domain-data scoping (it is already `householdId`-based and correct).

## B13. Manual QA (click-by-click, per wave) — summary

Detailed steps written into each wave's PR. Representative Wave 2/3 flow:
1. Sign in as owner of Household A; confirm children A visible, no switcher.
2. In Settings, invite `spouse@x.com`; confirm pending member shows.
3. In a separate session, open the magic link as `spouse@x.com`; confirm landing in Household A with children A visible.
4. As spouse, if they also own Household B, open the switcher; select B; confirm children B replace children A; refresh; confirm B persists.
5. Open `/admin/metrics`; expand Household A; confirm both members listed, owner tagged.

## B14. Risks & rollback

- **Risk: stale JWT after removal** (A6). Mitigation: accept documented trust window; re-validate at issue/switch. Rollback: none needed (behavior matches today).
- **Risk: migration backfill miscounts owners.** Mitigation: backfill test asserts 1 owner per household = old `userId`; run on a wiped+reseeded DB first. Rollback: drop `household_members`/`household_invitations`, restore `unique` on `households.userId` — domain data untouched, fully reversible.
- **Risk: switcher/session desync** (token vs persisted active id). Mitigation: persisted `active_household_id` is the tiebreaker; `resolveTenant` validates it against live memberships and falls back to first.
- **Risk: admin query cost** with the extra join. Mitigation: indexes on `household_members(householdId)` and `(userId)`; admin already aggregates per household.
- **Big-bang avoidance:** `households.userId` kept; old `getHouseholdForUser` retained until callers migrate; each wave ships independently.

## B15. Open items to confirm during Wave-1 audit (flagged, not assumed)

- Exact orphan-recovery behavior in `features/auth/lib/drizzleAdapter.ts` and `features/auth/server/repository.ts:~72` — must not double-create households when a membership already exists.
- Where the Settings page lives and what it currently owns (Wave 5 depends on it).
- Header/`useHousehold` context shape for mounting the switcher (Wave 2).
- The Resend magic-link send entrypoint to reuse for invites (Wave 3).

Do not start implementation of a wave until that wave's audit files (B3) are opened and any contradiction with this doc is resolved.
