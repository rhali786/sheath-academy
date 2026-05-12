# Sheath Academy — development guide

Homeschool dashboard (Next.js 15 App Router, React, TypeScript). Business logic and UI live under `features/`; `app/` is a thin routing layer. Data is in-memory (mock seed + `features/lib/server/dataStore`), session-only on Render.

---

## Obligatory

**Do these before anything else. They are not optional and do not appear again below.**

- **`npm run setup-hooks`** — run once after cloning. Installs `scripts/hooks/pre-commit` into `.git/hooks/`. Without it the patch version in `package.json` (shown in the app header) will not increment on commit.
- **`npm install`** — required before dev, build, or test.
- **Check `.env.example`** before running locally. At minimum `AUTH_SECRET` and `RESEND_API_KEY` must be set in `.env.local` (or Render → Environment) or auth is silently broken.
- **Test-driven development (TDD):** For new behavior, write a **failing automated test first**, then implement until it passes, then refactor. Use **unit tests** (red–green) for API route handlers, `dataStore` helpers, and other pure or isolated logic. Do not merge implementation-only changes that should have been test-driven.
- **Integration tests:** New or materially changed **UI** must ship with **integration tests** under `features/<feature>/__tests__/` (e.g. `integration/`), covering the interactions and states called out in the feature plan (loading, empty, error, populated as applicable). Same for user-visible flows that are not adequately covered by lower-level tests.
- **`npm run build` and `npm test` must pass before merging.** CI enforces this; don't skip it locally.
- **Never commit secrets.** `.env.local`, deploy hook URLs, API keys. Rotate immediately if any were ever exposed.

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
| Are seed/fixture IDs (`householdId`, `workspaceId`, etc.) consistent from the store through to the UI? | Confirm fixture values match what the runtime produces |

If any layer boundary is unverified in the plan, do not proceed to implementation.

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
| `npm run smoke` | After build: brief `next start`, checks `/api/health`. Default port **3010** (`SMOKE_PORT` to override) so it does not clash with dev on 3000 |

**Dependency / install issues:** occasional full reinstall is useful (`rm -rf node_modules` + lockfile + `npm install`); not required on every change.

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
| Magic link email never arrives | `RESEND_API_KEY` not set or domain unverified | Check `.env.example`; verify sending domain in Resend dashboard. |
| Version in header stuck / not incrementing | Pre-commit hook not installed | Run `npm run setup-hooks`. |

---

## Known product gaps (not bugs)

In-memory data only; limited validation and error boundaries; no e2e suite. Backlog examples: persistence, Playwright, accessibility pass, richer filtering, email allow-list, user-to-household binding.
