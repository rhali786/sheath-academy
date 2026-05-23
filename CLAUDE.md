# Sheath Academy — development guide

Homeschool dashboard (Next.js 15 App Router, React, TypeScript). Business logic and UI live under `features/`; `app/` is a thin routing layer. **Persistence is Postgres-only** via Drizzle ORM — `DATABASE_URL` is required at runtime. See `db/schema.ts` for table definitions and constraints.

---

## Obligatory

**Do these before anything else. They are not optional and do not appear again below.**

- **`npm run setup-hooks`** — run once after cloning. Installs `scripts/hooks/pre-commit` into `.git/hooks/`. Without it the patch version in `package.json` (shown in the app header) will not increment on commit.
- **`npm install`** — required before dev, build, or test.
- **Check `.env.example`** before running locally. At minimum `AUTH_SECRET`, `DATABASE_URL`, and `RESEND_API_KEY` must be set in `.env.local` (or Render → Environment). Without `DATABASE_URL` the app throws on startup. Without `AUTH_SECRET` auth is silently broken.
- **Seed demo data:** run `psql $DATABASE_URL < db/wipe_app_data.sql` once, then `npm run db:seed:demo`. This creates two households (Barakah Academy + Crescent Cove Learning) with 150 days of history.
- **Test-driven development (TDD):** For new behavior, write a **failing automated test first**, then implement until it passes, then refactor. Use **unit tests** (red–green) for API route handlers, repository functions, and other pure or isolated logic. Mock at the repository boundary — never mock `getDb()` directly. Do not merge implementation-only changes that should have been test-driven.
- **Integration tests:** New or materially changed **UI** must ship with **integration tests** under `features/<feature>/__tests__/` (e.g. `integration/`), covering the interactions and states called out in the feature plan (loading, empty, error, populated as applicable). Same for user-visible flows that are not adequately covered by lower-level tests.
- **`npm run build` and `npm test` must pass before merging.** CI enforces this; don't skip it locally.
- **Never commit secrets.** `.env.local`, deploy hook URLs, API keys. Rotate immediately if any were ever exposed.
- **Env files:** Next.js loads `.env` then `.env.local` (later overrides). Keep real secrets out of git — **`.env.local`** and **`.env`** are gitignored; **`.env.example`** stays committed as the template.

---

## Planning requirements (obligatory for every feature plan)

Every implementation plan must include these two checks before writing any code. Skipping them produces bugs that only surface during manual testing or in production. Merged code must also satisfy **TDD** and **integration-test** rules in **Obligatory** above.

**1. Integration test coverage for all UI components**

For every new component, the plan must identify:
- Which context(s) does it consume? Mock them in tests, don't render the full provider tree.
- What user interactions does it expose (clicks, form submits, toggles)? Each must have a corresponding test.
- What states does it render (loading, empty, error, populated)? Each must have a corresponding test.
- Are the tests in `features/<feature>/__tests__/integration/` (or the feature’s `__tests__/` tree) alongside the component?

Write the integration tests in the plan before writing the component. A component that has no test plan is incomplete.

**2. End-to-end data flow trace**

Before writing any code, trace the full lifecycle of each entity:

| Question | Must be answered in the plan |
|---|---|
| Where are IDs generated? | `features/lib/server/dataStore.ts` function name + format |
| Do IDs from the store match what the API returns and what the UI passes back? | Confirm at each layer boundary |
| Is the new page reachable from the navigation? | Name the Header link, tab, or route that reaches it |
| Does the form appear without extra clicks on arrival? | State what the user sees on first load |
| Are seed/fixture IDs (`householdId`, `workspaceId`, etc.) consistent from the store through to the UI? | `householdId` on students is **`HouseholdProfile.id`**, not `Workspace.id`. Confirm fixture values match what the runtime produces. |

If any layer boundary is unverified in the plan, do not proceed to implementation.

---

## Pre-implementation audit (obligatory before writing any code)

Run these six checks at the start of every implementation session, before touching any file. They catch the class of bugs that only surface during manual testing or after a PR lands on master. Skipping any step is not optional.

**1. Sync with master**

```bash
git fetch origin && git merge origin/master
```

Note every conflict and every file that changed. Read the diff for any type, store, or API file that your plan touches — master may have renamed fields, added routes, or changed schemas since the plan was written.

**2. Read the actual type files**

For every type you plan to use, open the file that defines it and read the exact field names. Do not rely on session memory, plan summaries, or grep snippets. Pay attention to:
- Which file owns the type (`features/planner/types.ts` vs `features/lib/types.ts` — they can diverge)
- Whether a field has been renamed or replaced (e.g. `isCompleted: boolean` → `status: LessonTaskStatus`)
- Whether there is a duplicate definition and which one the existing code imports

**3. Check import paths before writing new imports**

Grep for how existing code in the same feature imports the type or module you plan to use:

```bash
grep -r "from '@/features/planner/types'" features/ --include="*.ts" --include="*.tsx" -l
```

Use the same path. Cross-feature imports at the client layer (a dashboard card calling `plannerApi`) are fine — they are the established pattern. Cross-feature imports at the server layer (a route handler importing another feature's store directly) are not.

**4. Trace the data path without creating new access**

For each piece of data the feature needs, identify the existing service function that returns it and call that function. Do not reach into another feature's store directly from a route handler. If no service function exists yet, create one in the owning feature before wiring the route.

**5. Verify route wiring**

Before adding a new endpoint, confirm:
- The feature router (`features/<feature>/api/router.ts`) has a case for the new slug
- `app/api/[...slug]/route.ts` delegates to the feature router
- No existing route uses the same slug pattern (collision produces silent wrong-handler bugs)

**6. List every file to touch — read it first**

Before editing any file, read it. State what you found and exactly what you will change and why. This prevents overwriting in-progress work, resolving a conflict in the wrong direction, or missing a dependency that the existing code already satisfies.

---

## Type ownership and data-access ownership

### Type ownership rule

New domain types belong in the owning feature folder:

```
features/<feature>/types.ts
```

Examples:
- Planner-owned lesson/task types → `features/planner/types.ts`
- Attendance-owned attendance types → `features/attendance/types.ts`
- Subject/course types → `features/subjects/types.ts`
- Portfolio evidence types → `features/portfolio/types.ts`
- Report/export/checklist types → the owning reports/records feature folder

Do **not** add new feature-domain types to `features/lib/types.ts` unless the type is truly shared infrastructure or an intentionally app-wide foundation type.

Use `features/lib/types.ts` only for shared infrastructure contracts and foundational app-wide models, such as:
- `ApiResponse`
- `Workspace`
- `HouseholdProfile`
- `StudentProfile` until intentionally migrated
- shared chart/UI data contracts
- temporary legacy dashboard contracts

If a feature needs another feature's domain type, import it from the owning feature. Do not duplicate it.

**Correct pattern:**
```ts
import type { LessonTask } from '@/features/planner/types'
import type { SubjectCourse } from '@/features/subjects/types'
import type { AttendanceRecord } from '@/features/attendance/types'
```

**Incorrect pattern:**
```ts
// Do not copy LessonTask into another feature.
// Do not add a second LessonTask definition to features/lib/types.ts.
// Do not create local "almost the same" DTOs unless the API contract truly differs.
```

Before creating any type, answer:
1. Which feature owns this domain concept?
2. Does this type already exist elsewhere?
3. Is this a domain entity, API DTO, form state, or UI-only view model?
4. If there is an existing duplicate, which one is canonical for this feature?

If there is ambiguity, stop and report it before writing code.

---

### Data-access ownership rule

Do not call raw stores directly from API route handlers or UI code.

**Preferred flow:**
```
UI component
  → front service/client
  → API route
  → feature service
  → feature repository/store adapter
  → memory store for now, Postgres later
```

API route handlers should be thin: parse/validate the request, call the feature service, return the standard API response shape. Feature services own business rules. Feature repository/store adapters own persistence details.

Persistence is Postgres via Drizzle ORM. `features/lib/server/memoryStore.ts` still exists for `resources` (catalog) and `school-year` — both pending Task 3 migration. Do not use it for new features.

When adding new server-side data access:
- First look for an existing service function in the feature.
- If one exists, use it.
- If one does not exist, add or extend a feature service function.
- Do **not** import `createMemoryStore` directly into API route handlers.
- Do **not** create a second store for the same entity.
- Do **not** bypass validation or business rules by importing a store directly into UI-facing routes.

If a feature currently has only `server/store.ts`, keep new persistence calls behind `server/service.ts`. If a repository layer already exists, use it. If no repository layer exists and the change is large enough to justify one, propose it in the audit before implementing.

---

### Postgres readiness rule

Do not design new features so that a Postgres migration requires rewriting UI components or API routes.

Keep persistence behind server-side feature services and, where useful, repository/store adapter functions.

Avoid leaking memory-store assumptions into higher layers:
- No direct array mutation outside store/adapters.
- No synchronous-only persistence assumptions in route design.
- No reliance on seed-only IDs unless documented in tests.
- No UI importing server stores.
- No API route returning raw internal store objects when the response contract should be stable.

If a new feature introduces an entity that will eventually live in Postgres, define service/repository function names around domain operations, not around memory-store mechanics.

**Prefer:**
```ts
listEvidenceItems(filters)
createEvidenceItem(input)
updateEvidenceItem(id, patch)
```

**Avoid exposing generic persistence language at the API boundary:**
```ts
evidenceStore.getAll()
evidenceStore.insert()
```

---

### Refactor restraint rule

Do not perform broad type or data-access refactors while implementing a feature unless the feature plan explicitly includes that refactor.

If you discover duplicate types, inconsistent imports, or direct store usage during the audit:
1. Report the issue.
2. State whether it blocks the current feature.
3. If it does not block the feature, leave it untouched.
4. If it does block the feature, propose the smallest safe change and wait for approval unless the user already authorized that exact file change.

Prefer forward-correct architecture for new code over opportunistic cleanup of old code.

---

### Cross-feature import rule

Before adding any cross-feature import, grep for the existing pattern in the same layer (API route → API route, server service → server service, front component → front component, test → test utility).

Use the same path style already used in that layer. Prefer `@/features/...` for cross-feature imports and relative imports inside the same feature folder.

```ts
// Cross-feature — use alias
import type { SubjectCourse } from '@/features/subjects/types'

// Same feature — use relative
import type { LessonTask } from '../types'
```

Do not introduce a new import style without a clear reason.

---

### Architecture findings (output requirement)

When applying this section during feature work, include a short **"Architecture Findings"** block in the audit report covering:

- Type owner decisions
- Any duplicate type risks found
- Existing import pattern followed
- Existing service function used or extended
- Whether any raw store access was avoided
- Whether the design remains Postgres-ready

---

## Commands

| Command | Purpose |
|--------|---------|
| `npm install` | Dependencies (single root `package.json`) |
| `npm run setup-hooks` | Install git hooks (see Obligatory above) |
| `npm run dev` | Dev server (port 3000) |
| `npm run dev:clean` | Delete `.next` then dev — fixes stale/mixed build artifacts |
| `npm run build` | Production build (must pass before merge) |
| `npm run start` | Production server after build |
| `npm test` | Jest (API + integration; `jsdom` for UI) |
| `npm run smoke` | After build: brief `next start`, checks `/api/health` and that `/login`’s linked `/_next/static` CSS/JS return 200. Uses a **random free port** by default so a stale process on 3010 cannot fake success; set **`SMOKE_PORT=3010`** only if that port is free |
| `npm run db:generate` | Generate Drizzle migration from schema diff |
| `npm run db:migrate` | Apply pending migrations to the database |
| `npm run db:studio` | Open Drizzle Studio (DB browser) |
| `npm run db:seed:demo` | Seed two demo households (run after wipe) |
| `psql $DATABASE_URL < db/wipe_app_data.sql` | **One-time** wipe of all app data before re-seeding |

**Dev vs production server:** Use **`npm run dev`** for day-to-day work. Use **`npm run build`** then **`npm run start`** only for production-style checks. Mixing dev and prod on the same `.next` folder causes `/_next/static` 404s and broken CSS/JS — see Troubleshooting.

**Dependency / install issues:** occasional full reinstall is useful (`rm -rf node_modules` + lockfile + `npm install`); not required on every change.

---

## Feature Implementation Waves

When implementing a complex feature, scope work into discrete waves to optimize for token usage and clarity.

**Wave structure:**
- **Wave 1 (internals):** All new files under `features/<feature>/` — types, server (store/seed/service/ids), API routes, front components, tests. No modifications to other features.
- **Wave 2+ (integration):** Surgical modifications to existing feature files to wire new feature into the app (Header nav, API routing, context wiring, etc.).

**How to invoke a wave:**

When starting a wave, explicitly specify scope in your message:

```
Start Wave 1: Work only in `features/planner/`. 
Create all new files from <plan section>. 
Write failing tests first (TDD), then implement until green. 
Do not modify any files outside `features/planner/`.
```

```
Start Wave 2: Modify only these files: 
- features/household/types.ts
- features/household/api/routes/household-profile.ts
- features/layout/front/components/Header.tsx
- app/api/[...slug]/route.ts

[Specific changes needed for each file]
```

**Scope is a hard boundary.** Do not reach outside the specified directory or file list without explicit approval in your message. This prevents accidental scope creep and keeps each wave focused.

---

## CI and deploy

- **GitHub Actions:** `.github/workflows/ci.yml` — push to `main` or `master`, and PRs to any branch: `npm ci` → `npm run build` → `npm test` → `npm run smoke`.
- **Render:** `npm run build` / `npm run start` per `render.yaml`. Do **not** commit deploy hook URLs or secrets; rotate if they were ever exposed.

---

## Node and versions

- **Production:** `render.yaml` `runtimeVersion` and **`.nvmrc`** (e.g. 22.22.2). **`package.json` `engines.node`** is a minimum (`>=22.22.2`).
- **Libraries:** Prefer `npm ls <pkg> --depth=0` over guessing from `^` ranges. After bumps, run **`build`** and **browser smoke** for chart/UI changes — Jest mocks Nivo, so real Nivo bugs may not appear in tests.

---

## Repository layout

```
features/
  lib/                    # types; `server/` — mockData, dataStore (shared)
  auth/                   # sign-in feature (NextAuth, magic link, dev bypass)
  layout/                 # AppShell, Header — product shell components
    front/components/AppShell.tsx   # owns HouseholdProvider + Header; used by (shell) layout
    front/components/Header.tsx     # reads useHousehold() directly — no prop threading
  household/              # workspace / household profile feature
  dashboard/
    api/router.ts         # maps /api/dashboard/* → route handlers
    api/routes/           # handlers (summary, tasks, …)
    front/                # UI: components, pages, context, services
    __tests__/            # api/, integration/, utils, mocks
app/                      # thin routing layer — route declarations + metadata only
  (shell)/                # pages that use AppShell (Header + HouseholdProvider)
    layout.tsx            # <AppShell>{children}</AppShell> — single place to update
    page.tsx              # → Dashboard (protected by middleware)
    about/page.tsx        # → AboutPage (public)
  (auth)/                 # pages without AppShell (no header)
    login/page.tsx        # → Login
  api/health/route.ts
  api/auth/[...nextauth]/route.ts → NextAuth handlers
  api/[...slug]/route.ts → feature routers
  layout.tsx              # generic: html/body/SessionProvider only — never grows
middleware.ts             # route protection — redirects unauthenticated to /login
scripts/
  hooks/pre-commit        # committed hook source; copied to .git/hooks/ by setup-hooks
  bump-version.cjs        # increments patch version in package.json
  setup-hooks.sh          # installs hooks (npm run setup-hooks)
```

New REST surface: extend the dynamic slug handler and the feature router consistently. Keep `app/api` imports thin.

---

## Conventions

**TypeScript**

- `'use client'` where hooks or browser-only APIs are used.
- Avoid unused imports (build/lint).
- Cast after fallback: `(x || fallback) as T`, not `(x as T) || fallback`.
- Do not shadow TS utilities (e.g. use `DashboardRecord`, not `Record` for domain types).

**API responses**

```ts
{ status: 'success' | 'error', data: T, message: string, timestamp: string }
```

**API client (`features/dashboard/front/services/api.ts`)**

- Same-origin requests should work from the browser; server-side calls need a correct base URL (see implementation). Prefer patterns that do not assume `localhost:3000` on the server without env.

**Tailwind**

- **One** pipeline: root `tailwind.config.js` with `content` including `./features/**/*`.
- Shared `@layer` / `@apply` live in **`app/globals.css`**. Do not add a second `@tailwind` entrypoint under a feature. Feature-only CSS: modules or plain CSS **without** duplicating Tailwind directives.

**Nivo**

- Real chart code does not run in Jest. For `ResponsiveLine` / similar, pass **explicit** array props the library would default (`legends`, `layers`, `markers`, `defs`, `fill`, etc.) so production does not hit `undefined.map` when `defaultProps` are not applied as expected.

---

## Testing

- Tests live under `features/<feature>/__tests__/` (`api/`, `integration/`, etc.). **`npm test` is the source of truth** for the current case count.
- UI tests use **`jsdom`** and **`@/features/dashboard/__tests__/utils/renderWithProvider`** so components sit under `DashboardProvider` (avoids `useDashboard must be used within DashboardProvider` at runtime).
- **New UI:** add or extend integration coverage with the provider; chart-heavy changes warrant a quick **browser** check.
- **React 18 + `jest.mock`:** `mockReturnValueOnce` on context hooks (`useHousehold`, `useNavigation`, etc.) often fails because the component runs **more than one** render (Strict Mode or re-renders). Use **`mockImplementation(() => ({ ... }))`** and reset to defaults in **`afterEach`** (see `features/layout/__tests__/Header.test.tsx`).

Jest maps `@nivo/line`, `@nivo/bar`, and `@nivo/core` to `__tests__/mocks/nivo.tsx`.
Jest maps `next-auth/react` to `__mocks__/next-auth/react.ts` (default unauthenticated stub; override per-test with `jest.mock`).

**Adding new pages — shell vs auth**

- Pages that need the Header and household context → add under `app/(shell)/`. The layout supplies `AppShell` automatically; no per-page provider wiring needed.
- Pages that must not show the Header (e.g. login, onboarding) → add under `app/(auth)/`. No AppShell, no HouseholdProvider.
- Feature components (`features/*/front/pages/`) must not import `Header` or `AppShell` directly — the shell layout owns those. Keep feature pages focused on their own content.
- Tests for feature page components render the component directly (no AppShell needed). If the component consumes a context, mock that context in the test file.

---

## `next.config.js` (do not regress)

- Do not force `dynamic = 'force-dynamic'` on root `app/layout.tsx` unless there is a specific need.
- Webpack tweaks that change **`optimization.minimize`** must **not** apply to the client bundle in **dev** (breaks Fast Refresh).
- `outputFileTracingRoot` helps `next build` / `next start` when a parent folder has another lockfile; dev behavior and static 404s are documented below.
- `env.NEXT_PUBLIC_APP_VERSION` is injected from `package.json` at build time — shown in the header. It updates automatically via the pre-commit hook.

---

## Troubleshooting

| Symptom | Likely cause | What to do |
|--------|----------------|------------|
| `/_next/static/...` 404 in dev | Stale or mixed `.next` (build/start vs dev, or interrupted compile) | Stop servers, `npm run dev:clean`, hard refresh. Do not run `next build` while `next dev` is running. |
| Edits not hot-reloading | Client minify enabled in dev | Keep minimize changes behind `!dev` in webpack config. |
| "Unstyled" dashboard | Tailwind `content` missing `features/**` | Fix root `tailwind.config.js`. |
| Nivo crash (`undefined.map` / `.length`) | Missing explicit array props | Pass empty arrays / default layers as in `QuranStudies` / similar. |
| Smoke or prod 500 / missing chunk | Corrupt `.next` or port conflict | `node scripts/clean-next.mjs`, `npm run build`, ensure `SMOKE_PORT` is free. |
| Tests pass, prod chart breaks | Nivo not exercised in Jest | Browser smoke after chart edits. |
| Type / import errors | Path aliases or wrong feature folder | Use `@/` and `features/` consistently; check `tsconfig` `paths` / `exclude`. |
| All routes redirect to `/login` unexpectedly | `AUTH_SECRET` not set | Add `AUTH_SECRET` to `.env.local` or Render environment (see `.env.example`). |
| `[auth][error] MissingSecret` / middleware auth errors | No Auth.js secret | Set **`AUTH_SECRET`** in `.env.local` (or Render). Restart the dev server after adding env vars. |
| Dev bypass UI missing on `/login` | `NEXT_PUBLIC_DEV_MODE` not `true` when the client bundle was built | Set **`NEXT_PUBLIC_DEV_MODE=true`** and **`DEV_BYPASS_SECRET`** in `.env.local`. Restart **`npm run dev`** so `NEXT_PUBLIC_*` is inlined. |
| Child picker empty / no children | `DATABASE_URL` not set or seed not run | Ensure `DATABASE_URL` is set and `npm run db:seed:demo` has been run after the wipe. |
| App throws `DATABASE_URL is not configured` on startup | Missing env var | Add `DATABASE_URL` to `.env.local` (see `.env.example`). Restart the dev server. |
| `PUT /api/household/profile` HTTP 500 | No household row in DB for current user | Run seed or ensure the setup flow completed (upserts household on first sign-in). |
| Magic link email never arrives | `RESEND_API_KEY` not set or domain unverified | Check `.env.example`; verify sending domain in Resend dashboard. |
| Version in header stuck / not incrementing | Pre-commit hook not installed | Run `npm run setup-hooks`. |

---

## Known product gaps (not bugs)

Limited validation and error boundaries; no e2e suite. Features still on memory stubs pending Postgres migration: `resources` (catalog only — feedback/notes migrated), `school-year`, `records/service`, `setup/service`. Backlog: Playwright e2e, accessibility pass, richer filtering, email allow-list, user-to-household binding, reports persistence table.
