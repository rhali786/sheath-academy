# Feature 02 — Household Workspace

## Context

The dashboard currently shows hardcoded "Naeem Family" data regardless of who is signed in. Feature 02 creates the `workspace` and `household_profile` data layer so every authenticated user operates inside their own household context. This is Wave 1A — the foundation every later feature (child profiles, lessons, attendance) attaches to. It directly unblocks the Feature 01 open item: "Tie identity to household data."

Data is still in-memory (no Postgres yet). The feature adds workspace/household records to the existing in-memory store, exposes them via a new API router, and provides a React context so the dashboard reads live data instead of hard-coded strings.

**Branch:** `claude/add-household-workspace-DN18A`

---

## What the feature delivers (acceptance criteria)

- A signed-in user has exactly one household workspace (auto-created on first use for MVP)
- Workspace has: `id`, `name`, `ownerId`, `createdAt`
- HouseholdProfile has: `id`, `workspaceId`, `familyName`, `createdAt`
- Dashboard header/title reads from the household record, not a hard-coded string
- New users see a one-step name prompt before the dashboard loads (optional for MVP — if time-boxed, seed a default name and skip the prompt)

---

## CLAUDE.md compliance checklist

Before any code runs:
- [ ] `npm run setup-hooks` — installs pre-commit hook that bumps patch version; required once after clone
- [ ] `npm install` — before dev, build, or test

Conventions enforced throughout:
- API responses always `{ status, data, message, timestamp }` — no exceptions
- `'use client'` on any component using hooks or browser APIs
- No second Tailwind entrypoint under `features/` — shared `@layer` in `app/globals.css` only
- Tests under `features/household/__tests__/`; UI tests use `renderWithProvider` from dashboard test utils
- `npm run build` and `npm test` must pass before the branch is pushed

---

## Implementation steps

### 0. Save this plan to the feature directory
Copy this plan to `features/feature-02-household-workspace_todo/PLAN.md` so it lives alongside the feature spec in the repo.

### 1. Types — `features/lib/types.ts`
Add two new interfaces:
```ts
export interface Workspace {
  id: string
  name: string
  ownerId: string
  createdAt: string
}

export interface HouseholdProfile {
  id: string
  workspaceId: string
  familyName: string
  createdAt: string
}
```
Also extend `DataStore` interface to include `workspaces: Workspace[]` and `householdProfiles: HouseholdProfile[]`.

### 2. Seed data — `features/lib/server/dataStore` (or wherever mock seed lives)
Add one seeded workspace and household profile for the Naeem Family (existing mock user), so the dashboard continues to work unchanged during development.

### 3. New feature folder — `features/household/`
Mirror the dashboard pattern:
```
features/household/
  api/
    router.ts              ← maps /api/household/* → handlers
    routes/
      workspace.ts         ← GET /api/household/workspace
      household-profile.ts ← GET /api/household/profile
  front/
    context/
      HouseholdContext.tsx  ← provides { workspace, householdProfile }
      HouseholdProvider.tsx ← fetches on mount, wraps children
    hooks/
      useHousehold.ts       ← convenience hook
  __tests__/
    api/
      workspace.test.ts
      household-profile.test.ts
```

### 4. Wire router — `app/api/[...slug]/route.ts`
Register the new household router alongside the existing dashboard router so `/api/household/*` is served.

### 5. Replace hardcoded family name in dashboard
Find all occurrences of "Naeem Family" (or equivalent hard-coded string) in `features/dashboard/` and `app/` and replace them with a value read from `HouseholdContext`.

Wrap the root layout (or dashboard page) with `HouseholdProvider` so context is available everywhere.

### 6. Tests
- API: GET workspace returns correct shape and seeds
- API: GET household profile returns correct shape
- Integration: context provides family name to a consumer component

---

## Critical files to touch

| File | Change |
|------|--------|
| `features/lib/types.ts` | Add `Workspace`, `HouseholdProfile`, extend `DataStore` |
| `features/lib/server/dataStore.*` | Seed workspace + household profile |
| `features/household/api/router.ts` | New |
| `features/household/api/routes/workspace.ts` | New |
| `features/household/api/routes/household-profile.ts` | New |
| `features/household/front/context/HouseholdContext.tsx` | New |
| `app/api/[...slug]/route.ts` | Register household router |
| `features/dashboard/front/` (header/title) | Read family name from context |
| `app/layout.tsx` or dashboard page | Wrap with HouseholdProvider |

---

## Patterns to reuse

- API response shape from `features/dashboard/api/routes/` — `{ status, data, message, timestamp }`
- Context pattern from `features/dashboard/front/` — DashboardProvider/useDashboard
- Router registration pattern from `app/api/[...slug]/route.ts`

---

## Feature impact — upstream and downstream

### This feature is blocked by
- **Feature 01 (Login)** — needs an authenticated session with a `userId` to look up or create the workspace. The dev bypass in Feature 01 provides a fake userId, which is sufficient for development.

### This feature unblocks
- **Feature 03 (Child Profile Data Model)** — child profiles need a `workspaceId` to scope them to a household. Cannot be built without this.
- **Feature 08 (Parent Dashboard Shell)** — the dashboard header/title reads the household name. Without this context it stays hardcoded.
- **Feature 09 (Child Selector)** — children are scoped per workspace; selector depends on that relationship existing.
- **All later features (10–35)** — every data record chains from `workspace` → `household_profile` → everything else. This is the root anchor.

### Other features this touches without blocking
- **Feature 01 open item** — "tie identity to household data" is directly resolved here. The dashboard will stop showing "Naeem Family" to every signed-in user.

---

## Do we need a widget and a page?

**Page: No (for Wave 1A MVP)**
Feature 02's scope is infrastructure + context, not a UI surface. A dedicated `/workspace/settings` page for editing the household name belongs to a later wave. Don't build it now.

**Setup prompt: Yes, minimal**
If an authenticated user has no household record, they need to name it before the dashboard loads. Keep this as a single-field modal or inline prompt — family name only, one button. Not a multi-step flow. Auto-generate an `id`, set `ownerId` from the session, and redirect to the dashboard. This covers the acceptance criteria ("new account creates a household").

**Widget: Not yet**
No dashboard widget is required for Feature 02. The household name surfaces in the existing dashboard header. A household settings card/widget (showing plan details, member count, etc.) is a Wave 2+ concern.

**Summary:** Build the API + context layer + a minimal name-entry prompt. No new page, no new widget.

---

## Risks and assumptions

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| The `app/api/[...slug]/route.ts` dynamic router may not exist or may work differently than assumed | Medium | Will inspect the file before wiring; fall back to creating a dedicated `app/api/household/` route folder if slug routing isn't in use |
| The dataStore location/shape is unknown — CLAUDE.md mentions it but the file wasn't read | Medium | Will read `features/lib/server/` first; if dataStore is structured differently, adapt the seed step accordingly |
| Dashboard hardcoded "Naeem Family" string may live in multiple places (header, page title, seed data) | Low | Grep for all occurrences before touching anything |
| HouseholdProvider placement in the layout may conflict with existing auth session provider | Low | Nest inside the existing session provider, not around it |
| No actual Postgres — workspace is in-memory only, resets on deploy | By design | MVP accepted this; noted so it doesn't get flagged as a bug |

**Key assumption:** MVP = one workspace per user, auto-seeded. No invite/join flow, no multi-workspace UI.

---

## Revision paths

**Revision 1 — if the slug router doesn't exist or blocks cleanly**
Skip the shared slug router. Instead create `app/api/household/workspace/route.ts` and `app/api/household/profile/route.ts` as standard Next.js App Router route files. This is more verbose but zero-risk.

**Revision 2 — if the dashboard doesn't have a clean injection point for HouseholdProvider**
Scope the provider to just the dashboard page rather than the root layout. This avoids touching `app/layout.tsx` (which the CLAUDE.md flags as sensitive — "do not force `dynamic = 'force-dynamic'` on root layout"). The family name would only be available inside the dashboard subtree, which is all that's needed for Wave 1A.

---

## Verification

1. `npm test` — all existing 69 tests pass; new household API tests pass
2. `npm run build` — clean build, no type errors
3. Browser: sign in → dashboard title shows household name from context (not hardcoded)
4. `GET /api/household/workspace` → `200` with workspace object
5. `GET /api/household/profile` → `200` with householdProfile object
