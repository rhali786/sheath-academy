# Sheath Academy

Homeschool dashboard for the Naeem family—**one Next.js app** (App Router) with a modular **`/features`** layout. The UI and dashboard APIs live together in TypeScript; data is **in-memory** (mock seed on startup), suitable for MVP and demos. Deployed on **Render**.

> **Deep dive:** conventions, pre-commit hooks, testing rules, and full troubleshooting live in [`CLAUDE.md`](./CLAUDE.md).

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000 — API + UI
npm run dev:clean    # if /_next/static/* 404: wipes .next then dev (use this first)
npm test             # Jest (API + UI integration)
npm run build && npm run start   # production locally
```

Smoke check: `GET /api/health` should return `200` and `status: "healthy"`.

**Requirements:** Node.js LTS (see `render.yaml` / `package.json` for what we deploy with).

---

## How this repo uses Next.js (intentionally different)

Most Next projects put pages, API routes, and components under **`/app`**. Here **`/app` stays thin** and **`/features` holds the product**:

| Layer | Role |
|--------|------|
| **`app/`** | Routing only: root layout, home page entry, `api/health`, and a catch‑all `api/[...slug]` that forwards to feature routers. |
| **`features/<name>/`** | Self-contained units: **`api/`** (handlers + router), **`front/`** (React UI, context, services), **`__tests__/`** (co-located Jest tests). |
| **`features/lib/`** | Shared types, mock data, and the in-memory **data store** used by API handlers. |

**Why:** Keeps features isolated, easier to grow (e.g. `features/login/`), and avoids a single bloated `app/` tree. It does **not** require special flags like global `force-dynamic`; modularity comes from **imports and folder boundaries**, not from opting the whole app out of static optimization.

Path alias **`@/*`** maps to the repo root so `app` can import `@/features/...` cleanly.

---

## Dashboard product (what ships today)

The main experience is under **`features/dashboard/`**, mounted from **`app/page.tsx`** via `DashboardProvider` + `Dashboard`.

**Navigation:** header tabs **Today**, **Weekly**, **Reports**, **Settings**. The **Today** tab is fully wired; other tabs are placeholders.

**Today tab — seven areas:**

1. **Today overview** — household metrics / “today” snapshot  
2. **Do today** — task list and completion  
3. **Needs attention** — alerts  
4. **Per-child progress** — progress by student  
5. **Quran studies** — sessions and charts (Nivo)  
6. **Records & proof** — attendance / portfolio-style records  
7. **Header** — family context and tab navigation  

**Login** exists as a **future** feature folder pattern; there is no separate auth service in this MVP.

---

## API surface (summary)

- **`GET /api/health`** — liveness  
- **`/api/dashboard/*`** — summary, tasks, progress, Quran, records, alerts (see `features/dashboard/api/router.ts` and `features/dashboard/api/routes/`)

Responses follow a shared shape: `{ status, data, message, timestamp }` (errors use `status: "error"` and appropriate HTTP codes).

---

## Data & limitations (know this up front)

- **Storage:** In-memory only (no DB files on disk). **Data resets on redeploy** or process restart; it **does** persist across requests while the server keeps running.  
- **Render:** Filesystem is not a durable data layer for this design—treat persistence as session/ephemeral unless you add a real database later.  
- **MVP gaps:** Minimal validation on some flows (e.g. Quran logging), no auth, no e2e suite—see **Learned lessons** in [`CLAUDE.md`](./CLAUDE.md) for a fuller risk list.

---

## Major local-dev gotchas (short list)

If something feels “broken” in development, check these first—details and more fixes are in [`CLAUDE.md`](./CLAUDE.md):

- **`/_next/static/...` 404** (e.g. `main-app.js`, CSS): often a **corrupt or mixed `.next`** — e.g. **`npm run build` while `npm run dev` is still running** (both use `.next`). Run **`npm run dev:clean`**, then hard-refresh. `outputFileTracingRoot` is **disabled for `next dev`** on purpose to avoid this class of issue.  
- **Hot reload / saves ignored:** client bundles must not be forced through production-style **minification** during dev (see `next.config.js` — webpack only tweaks minify when **not** in dev).  
- **Wrong workspace root warning** if a **parent** directory also has a `package-lock.json`: this repo sets **`outputFileTracingRoot`** in `next.config.js` to pin tracing to the project root.  
- **Tailwind:** one root pipeline (`tailwind.config.js`, styles wired through `app/layout.tsx` / `app/globals.css`). Don’t add a second `@tailwind` entrypoint inside a feature—extend **`content`** if you add new TSX locations (see [`CLAUDE.md`](./CLAUDE.md) “New features: one Tailwind pipeline”).

---

## Project layout (abbreviated)

```
app/                      # Next entry: layout, page, api routes
features/
  lib/                    # types, mockData, dataStore
  dashboard/
    api/                  # REST handlers + router
    front/                # React dashboard UI
    __tests__/            # Jest
  login/                  # placeholder / future
next.config.js
package.json
CLAUDE.md
render.yaml
```

---

## License / ownership

Private family project; not published as a reusable package.
