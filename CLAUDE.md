# Sheath Academy — development guide

Homeschool dashboard (Next.js 15 App Router, React, TypeScript). Business logic and UI live under `features/`; `app/` is a thin routing layer. Data is in-memory (mock seed + `dataStore`), session-only on Render.

---

## Commands

| Command | Purpose |
|--------|---------|
| `npm install` | Dependencies (single root `package.json`) |
| `npm run dev` | Dev server (port 3000) |
| `npm run dev:clean` | Delete `.next` then dev — fixes stale/mixed build artifacts |
| `npm run build` | Production build (must pass before merge) |
| `npm run start` | Production server after build |
| `npm test` | Jest (API + integration; `jsdom` for UI) |
| `npm run smoke` | After build: brief `next start`, checks `/api/health`. Default port **3010** (`SMOKE_PORT` to override) so it does not clash with dev on 3000 |
| `npm run setup-hooks` | **Run once after cloning.** Installs the git pre-commit hook that auto-increments the patch version in `package.json` on every commit. Without this the version shown in the header will not update. |

**Before merging:** `npm run build` and `npm test` must pass. Run `npm run smoke` locally to mirror CI.

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
  lib/                    # types, mockData, dataStore (shared)
  dashboard/
    api/router.ts         # maps /api/dashboard/* → route handlers
    api/routes/           # handlers (summary, tasks, …)
    front/                # UI: components, pages, context, services
    __tests__/            # api/, integration/, utils, mocks
app/
  api/health/route.ts
  api/[...slug]/route.ts → dashboard router
  layout.tsx, page.tsx, globals.css
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

- Tests live in `features/dashboard/__tests__/` (API + integration; **33** cases — `npm test` is the source of truth if this drifts).
- UI tests use **`jsdom`** and **`@/features/dashboard/__tests__/utils/renderWithProvider`** so components sit under `DashboardProvider` (avoids `useDashboard must be used within DashboardProvider` at runtime).
- **New UI:** add or extend integration coverage with the provider; chart-heavy changes warrant a quick **browser** check.

Jest maps `@nivo/line` and `@nivo/bar` to `__tests__/mocks/nivo.tsx`.

---

## `next.config.js` (do not regress)

- Do not force `dynamic = 'force-dynamic'` on root `app/layout.tsx` unless there is a specific need.
- Webpack tweaks that change **`optimization.minimize`** must **not** apply to the client bundle in **dev** (breaks Fast Refresh).
- `outputFileTracingRoot` helps `next build` / `next start` when a parent folder has another lockfile; dev behavior and static 404s are documented below.

---

## Troubleshooting

| Symptom | Likely cause | What to do |
|--------|----------------|------------|
| `/_next/static/...` 404 in dev | Stale or mixed `.next` (build/start vs dev, or interrupted compile) | Stop servers, `npm run dev:clean`, hard refresh. Do not run `next build` while `next dev` is running. |
| Edits not hot-reloading | Client minify enabled in dev | Keep minimize changes behind `!dev` in webpack config. |
| “Unstyled” dashboard | Tailwind `content` missing `features/**` | Fix root `tailwind.config.js`. |
| Nivo crash (`undefined.map` / `.length`) | Missing explicit array props | Pass empty arrays / default layers as in `QuranStudies` / similar. |
| Smoke or prod 500 / missing chunk | Corrupt `.next` or port conflict | `node scripts/clean-next.mjs`, `npm run build`, ensure `SMOKE_PORT` is free. |
| Tests pass, prod chart breaks | Nivo not exercised in Jest | Browser smoke after chart edits. |
| Type / import errors | Path aliases or wrong feature folder | Use `@/` and `features/` consistently; check `tsconfig` `paths` / `exclude`. |

---

## Known product gaps (not bugs)

In-memory data only; limited validation and error boundaries; no e2e suite. Backlog examples: auth, persistence, Playwright, accessibility pass, richer filtering.
