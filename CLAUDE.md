# Sheath Academy — development guide

Homeschool dashboard (Next.js 15 App Router, React, TypeScript). Business logic and UI live under `features/`; `app/` is a thin routing layer. **Persistence is Postgres-only** via Drizzle ORM — `DATABASE_URL` is required at runtime. See `db/schema.ts` for table definitions and constraints.

---

## Obligatory

**Do these before anything else. They are not optional and do not appear again below.**

- **`npm run setup-hooks`** — run once after cloning. Installs `scripts/hooks/pre-commit` into `.git/hooks/`. Without it the patch version in `package.json` (shown in the app header) will not increment on commit.
- **`npm install`** — required before dev, build, or test.
- **Check `.env.example`** before running locally. At minimum `AUTH_SECRET`, `DATABASE_URL`, and `RESEND_API_KEY` must be set in `.env.local` (or Render → Environment). Without `DATABASE_URL` the app throws on startup. Without `AUTH_SECRET` auth is silently broken.
- **Seed demo data:** wipe first, then bulk seed. See the **`database-seeding`** skill (`/database-seeding`).
  - `npm run db:wipe` then `npm run db:seed:demo` — or `npm run db:reset:demo` for both.
  - Creates two households (Barakah Academy + Crescent Cove Learning) with 150 days of history.
  - **Never seed row-by-row** — demo data loads via chunked multi-row INSERTs only.
- **Test-driven development (TDD):** Write a failing test first, implement until it passes, then refactor. Unit tests for API route handlers and repository functions; mock at the repository boundary, never mock `getDb()`. Do not merge implementation-only changes that should have been test-driven. See the **`testing-patterns`** skill (`/testing-patterns`).
- **Integration tests:** New or materially changed UI must ship with integration tests under `features/<feature>/__tests__/integration/` covering loading, empty, error, and populated states plus all user interactions. Same for user-visible flows not adequately covered by lower-level tests.
- **`npm run build` and `npm test` must pass before merging.** CI enforces this; don't skip it locally.
- **Never commit secrets.** `.env.local`, deploy hook URLs, API keys. Rotate immediately if any were ever exposed.
- **Env files:** Next.js loads `.env` then `.env.local` (later overrides). Keep real secrets out of git — **`.env.local`** and **`.env`** are gitignored; **`.env.example`** stays committed as the template.

---

## Planning requirements (obligatory for every feature plan)

Before writing any code, every plan must cover:

1. **Integration test plan** — for each new component: which contexts does it consume, what interactions does it expose, what states does it render (loading/empty/error/populated)? Each must have a named test.
2. **Data flow trace** — where are IDs generated, do they match at every layer boundary (store → API → UI), is the new page reachable from navigation, does the form appear without extra clicks on first load?
3. **Seed/fixture ID consistency** — `householdId` on students is `HouseholdProfile.id`, not `Workspace.id`. Confirm fixture values match what the runtime produces.

If any layer boundary is unverified, do not proceed to implementation.

See the **`architecture-rules`** skill (`/architecture-rules`) for type ownership, data-access, and cross-feature import rules (required reading before every audit). See the **`plan-builder`** skill (`/plan-builder`) for planning modes, the code-path audit, and plan structure, and the **`ui-style-guide`** skill (`/ui-style-guide`) before any UI change. See [docs/feature-waves.md](docs/feature-waves.md) for how to scope large feature work into waves.

---

## Pre-implementation audit (obligatory before writing any code)

Run these checks before touching any file:

1. **Sync with master** — `git fetch origin && git merge origin/master`. Read the diff for any type, store, or API file your plan touches.
2. **Read the actual type files** — open every type you plan to use and read the exact field names. Do not rely on session memory or grep snippets. Check which file owns the type and whether a field has been renamed.
3. **Check import paths** — grep for how existing code in the same feature imports the module you plan to use. Use the same path.
4. **Trace the data path** — identify the existing service function that returns each piece of data you need. Do not reach into another feature's store from a route handler.
5. **Verify route wiring** — confirm the feature router has a case for the new slug, `app/api/[...slug]/route.ts` delegates to it, and no existing route collides.
6. **Read every file before editing it** — state what you found and exactly what you will change and why.

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
| `npm test` | Jest unit + integration tests (`jsdom` for UI) |
| `npm run test:watch` | Jest in watch mode |
| `npm run test:e2e` | Playwright e2e suite (requires built app + `DATABASE_URL`) |
| `npm run test:e2e:ui` | Playwright with interactive UI |
| `npm run smoke` | After build: checks `/api/health` and static assets. Uses a random free port by default; set `SMOKE_PORT=3010` only if that port is free |
| `npm run db:generate` | Generate Drizzle migration from schema diff |
| `npm run db:migrate` | Apply pending migrations to the database |
| `npm run db:studio` | Open Drizzle Studio (DB browser) |
| `npm run db:seed:demo` | Bulk-seed two demo households (**after wipe**) |
| `npm run db:wipe` | Truncate all application tables (keeps schema) |
| `npm run db:reset:demo` | Wipe + bulk seed in one command |
| `psql $DATABASE_URL < db/wipe_app_data.sql` | SQL equivalent of `db:wipe` |

**Dev vs production server:** Use `npm run dev` for day-to-day work. Mixing dev and prod on the same `.next` folder causes `/_next/static` 404s — see Troubleshooting.

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

## Logging

**Stack: `consola` (interface) + `pino` (server file transport)**

- **One import everywhere:** `import { logger } from '@/features/lib/logger'`
- `features/lib/logger.ts` — exports the shared `consola` instance. Safe to import in server code, client components, and shared utilities. Do not create logger instances inline in individual files.
- `instrumentation.ts` (project root) — Next.js 15 server startup hook. Registers the pino file reporter once. All logging behavior (level, output file, format) is controlled here, not at call sites.
- **Server:** logs to both console and `logs/app.log` (JSON via pino). File is gitignored.
- **Browser:** consola default pretty reporter (no file output).
- **Tests:** mock `@/features/lib/logger` at the module level — do not let tests write to disk.
- Use structured args: `logger.info({ userId, householdId }, 'tenant resolved')` not string interpolation.
- Log levels: `logger.error` for caught exceptions, `logger.warn` for recoverable issues, `logger.info` for significant events, `logger.debug` for dev-only detail.

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

**Tailwind**

- **One** pipeline: root `tailwind.config.js` with `content` including `./features/**/*`.
- Shared `@layer` / `@apply` live in **`app/globals.css`**. Do not add a second `@tailwind` entrypoint under a feature. Feature-only CSS: modules or plain CSS without duplicating Tailwind directives.

**Nivo**

- Real chart code does not run in Jest. Pass **explicit** array props (`legends`, `layers`, `markers`, `defs`, `fill`) so production does not hit `undefined.map` when `defaultProps` are not applied as expected.

---

## Testing

See the **`testing-patterns`** skill (`/testing-patterns`) for boilerplate for each test type.

- Tests live under `features/<feature>/__tests__/` (`api/`, `integration/`, etc.).
- UI tests use `jsdom`. Use `@/features/dashboard/__tests__/utils/renderWithProvider` for components inside `DashboardProvider`.
- **`mockImplementation`** not `mockReturnValueOnce` for context hooks — components re-render multiple times in Strict Mode. Reset to defaults in `afterEach`.
- Jest maps `@nivo/*` to `__tests__/mocks/nivo.tsx` and `next-auth/react` to `__mocks__/next-auth/react.ts`.

**Adding new pages — shell vs auth**

- Needs Header + household context → `app/(shell)/`. AppShell is provided automatically.
- Must not show Header (login, onboarding) → `app/(auth)/`. No AppShell, no HouseholdProvider.
- Feature components must not import `Header` or `AppShell` directly.

---

## CI and deploy

- **GitHub Actions:** `npm ci` → `npm run build` → `npm test` → `npm run smoke` on push to master and all PRs.
- **Render:** `npm run build` / `npm run start` per `render.yaml`. Do **not** commit deploy hook URLs or secrets.

---

## Node and versions

- **Production:** `render.yaml` `runtimeVersion` and `.nvmrc` (e.g. 22.22.2). `package.json` `engines.node` is a minimum.
- **Libraries:** Use `npm ls <pkg> --depth=0` over guessing from `^` ranges. After bumps, run build and browser smoke for chart/UI changes — Jest mocks Nivo.

---

## `next.config.js` (do not regress)

- Do not force `dynamic = 'force-dynamic'` on root `app/layout.tsx` unless there is a specific need.
- Webpack tweaks that change `optimization.minimize` must **not** apply to the client bundle in dev (breaks Fast Refresh).
- `env.NEXT_PUBLIC_APP_VERSION` is injected from `package.json` at build time — shown in the header.

---

## Troubleshooting

| Symptom | Likely cause | What to do |
|--------|----------------|------------|
| `/_next/static/...` 404 in dev | Stale or mixed `.next` | Stop servers, `npm run dev:clean`, hard refresh |
| Edits not hot-reloading | Client minify enabled in dev | Keep minimize changes behind `!dev` in webpack config |
| "Unstyled" dashboard | Tailwind `content` missing `features/**` | Fix root `tailwind.config.js` |
| Nivo crash (`undefined.map` / `.length`) | Missing explicit array props | Pass empty arrays / default layers |
| Smoke or prod 500 / missing chunk | Corrupt `.next` or port conflict | `node scripts/clean-next.mjs`, `npm run build` |
| Tests pass, prod chart breaks | Nivo not exercised in Jest | Browser smoke after chart edits |
| Type / import errors | Path aliases or wrong feature folder | Use `@/` consistently; check `tsconfig` `paths` |
| All routes redirect to `/login` | `AUTH_SECRET` not set | Add `AUTH_SECRET` to `.env.local` or Render |
| `[auth][error] MissingSecret` | No Auth.js secret | Set `AUTH_SECRET` in `.env.local`, restart dev server |
| App throws `DATABASE_URL is not configured` | Missing env var | Add `DATABASE_URL` to `.env.local`, restart |
| `PUT /api/household/profile` 500 | No household row in DB | Run seed or complete setup flow |
| Dev bypass UI missing on `/login` | `NEXT_PUBLIC_DEV_MODE` not set when bundle was built | Set `NEXT_PUBLIC_DEV_MODE=true` + `DEV_BYPASS_SECRET`, restart dev server |
| Child picker empty | `DATABASE_URL` not set or seed not run | Set `DATABASE_URL`, run `npm run db:seed:demo` |
| Magic link email never arrives | `RESEND_API_KEY` not set or domain unverified | Check `.env.example`; verify sending domain in Resend |
| Google sign-in → `redirect_uri_mismatch` | `AUTH_URL` set to localhost in Render | Set `AUTH_URL=https://yourdomain.com` in Render env |
| Sign-out redirects to localhost | `AUTH_URL=http://localhost:3000` in Render env | Fix `AUTH_URL` in Render to production domain |
| Version in header stuck | Pre-commit hook not installed | Run `npm run setup-hooks` |

---

## Known product gaps (not bugs)

Limited validation and error boundaries. Backlog: accessibility pass, richer filtering, email allow-list, user-to-household binding.
