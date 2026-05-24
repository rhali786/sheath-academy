# Wave 0 — Navigation rename + directory rename

**Source:** FB-001
**Bugs:** none
**Must complete before any other wave.**

---

## Scope

- Rename nav tabs: Weekly → **Plan**, Reports → **Records**, add **Growth**, add **Resources**
- Rename `features/planner/` → `features/plan/` (all internal imports updated)
- Rename `features/reports/` → `features/records/` (all internal imports updated)
- Rename route `app/(shell)/planner/` → `app/(shell)/plan/`
- Rename route `app/(shell)/reports/` → `app/(shell)/records/`
- `/lessons` stays at `/lessons` — separate feature, no change
- Add `/growth` route → portfolio/progress page (`features/portfolio/` unchanged internally)
- Add `/resources` route → stub "Coming soon" page (`features/resources/` new)
- Update `app/api/[...slug]/route.ts` for new slug prefixes (`plan`, `records`, `resources`)
- Update all `@/features/planner/...` imports → `@/features/plan/...` across codebase
- Update all `@/features/reports/...` imports → `@/features/records/...` across codebase
- Update `CLAUDE.md` examples that reference `features/planner/` → `features/plan/`
- Add redirect: old `/planner` → `/plan` (next.js redirect in `next.config.js`)
- Add redirect: old `/reports` → `/records`

## What does NOT change

- `features/lessons/` — no such directory; lesson APIs live in `features/plan/`
- `/lessons` route — stays at `/lessons`
- `features/portfolio/` — stays as-is; Growth tab links to it
- `features/attendance/`, `features/children/`, `features/subjects/`, `features/dashboard/` — untouched

---

## TDD

**Unit tests:**
- Router: `GET /api/plan/...` resolves to correct handler (previously `/api/planner/...`)
- Router: `GET /api/records/...` resolves to correct handler (previously `/api/reports/...`)

**Integration tests (`features/layout/__tests__/Header.test.tsx`):**
- Assert nav contains "Plan" link — NOT "Weekly"
- Assert nav contains "Records" link — NOT "Reports"
- Assert nav contains "Growth" link
- Assert nav contains "Resources" link
- Assert "Growth" href points to `/growth`
- Assert "Resources" href points to `/resources`

**Playwright (`e2e/nav.spec.ts` — new):**
- Navigate to `/`, assert "Plan" visible in nav, "Weekly" not present
- Click "Plan" → assert URL is `/plan`
- Click "Records" → assert URL is `/records`
- Click "Growth" → assert portfolio/growth page loads without error
- Click "Resources" → assert stub page loads without error
- Navigate to `/planner` → assert redirect lands at `/plan`
- Navigate to `/reports` → assert redirect lands at `/records`

---

## File index

| File | Change |
|------|--------|
| `features/plan/` | Renamed from `features/planner/` — update all internal relative imports |
| `features/records/` | Renamed from `features/reports/` — update all internal relative imports |
| `features/resources/` | New stub directory |
| `features/resources/front/pages/ResourcesPage.tsx` | "Coming soon" stub |
| `features/layout/front/components/Header.tsx` | Update link labels + hrefs |
| `features/plan/api/router.ts` | Slug prefix: `planner` → `plan` |
| `features/records/api/router.ts` | Slug prefix: `reports` → `records` |
| `app/(shell)/plan/page.tsx` | Renamed from `planner/page.tsx` |
| `app/(shell)/records/page.tsx` | Renamed from `reports/page.tsx` |
| `app/(shell)/growth/page.tsx` | New — links to PortfolioPage |
| `app/(shell)/resources/page.tsx` | New — ResourcesStubPage |
| `app/api/[...slug]/route.ts` | Add `plan`, `records`, `resources` cases |
| `next.config.js` | Add redirects: `/planner` → `/plan`, `/reports` → `/records` |
| `CLAUDE.md` | Update all `features/planner/` references → `features/plan/` |
| All files importing `@/features/planner/...` | Global sweep → `@/features/plan/...` |
| All files importing `@/features/reports/...` | Global sweep → `@/features/records/...` |
| `features/layout/__tests__/Header.test.tsx` | Update for new link labels |
| `e2e/nav.spec.ts` | New E2E spec |

---

## Session discipline

Read every file in this list before touching it. Run `npm test` and `npm run build` after the rename sweep before pushing. Do not start Wave 1 until this passes CI.
