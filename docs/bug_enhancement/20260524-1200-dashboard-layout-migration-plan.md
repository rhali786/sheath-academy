# Development Plan — Dashboard Layout Migration (Mockup → Production)

Branch: `dev` (Waves 0–4 shipped)

Status: **Waves 0–4 complete** · **Waves 5–9 planned**

Design reference: [`docs/design/dashboard-mockup-20260524.png`](../design/dashboard-mockup-20260524.png)

Brand mark (single source): [`features/layout/front/components/SheathLogo.tsx`](../../features/layout/front/components/SheathLogo.tsx)

---

## 1. Summary

Migrate Sheath Academy from a **top-tab header** to a **mockup-driven layout**: left sidebar, focused “Today” home page, greeting header, summary cards, schedule hero, alerts right rail, and (later) AI assistant.

Waves 0–4 reshaped navigation and the dashboard **above-the-fold** experience. Legacy widgets remain **below the fold** until Wave 6 declutter.

---

## 2. Waves 0–4 (shipped)

### Wave 0 — Nav map

- Sidebar includes Quran, Settings, Admin, About (footer section)
- Messages / Finances: visible, **disabled**, gray badge
- `/` is always the dashboard; `NavigationProvider` removed from shell
- Three nav items for plan area: Calendar (`/plan/schedule`), Lesson Planner (`/plan`), Courses (`/lessons`)
- Grades & Progress covers `/growth` and `/portfolio`

### Wave 1 — Sidebar shell

- `navConfig.ts`, `Sidebar.tsx`, `AppShell.tsx`, slim `Header.tsx`
- Brand: **Sheath** + “Faith. Learning. Purpose.”
- Shield + leaf logo via **`SheathLogo.tsx`** (all UI + favicon reference this file)
- Lucide nav icons via `navIcons.tsx`
- Hijri date under logo in sidebar

### Wave 2 — Dashboard grid

- Hero grid: schedule (2 cols) + alerts right rail (1 col)
- Legacy widgets demoted to `dashboard-more-insights` below the fold

### Wave 3 — Dashboard header

- Dashboard-only `DashboardHeader`: Assalamu alaikum greeting, Gregorian + Hijri dates, Quick Add stub menu, Today’s Plan link, ChildSelector
- Global `Header`: mobile menu, notification bell stub, auth

### Wave 4 — Task summary metrics

- `taskMetrics.ts` + extended `GET /api/dashboard/summary`
- `TodayTaskSummaryCards`: Tasks Completed, In Progress, Overdue
- **Completed** = completed lessons today + attendance marked + Quran sessions today
- `TodaySchedulePanel` wraps existing `ScheduleNowNextCard` (full timeline deferred to Wave 5)

---

## 3. Known gaps & awkward edges (Waves 0–4)

These are **intentional or incomplete** — not bugs to hotfix silently. Address in Waves 5–6 unless noted.

### Layout & UX

| Issue | Detail | Target wave |
|-------|--------|-------------|
| **Two horizontal bars on dashboard** | Slim global `Header` (menu, bell, sign-out) **plus** `DashboardHeader` (greeting, dates, actions). Mockup merges bell + actions into one dashboard band. | Wave 6 |
| **“Today’s Schedule” ≠ mockup timeline** | Panel title says “Today’s Schedule” but content is legacy **Now & Next** (`ScheduleNowNextCard`), not the vertical timeline with subject icons and status pills. | Wave 5 |
| **Schedule footer tautology** | Footer shows `"N of N items scheduled"` because both numbers use `schedule.blocks.length`. Mockup shows `"7 of 10"`. | Wave 5 |
| **Hijri shown twice** | Sidebar under logo **and** dashboard header. By design for Wave 1/3, but can feel redundant. | Wave 6 (pick one primary) |

### Metrics & data

| Issue | Detail | Target wave |
|-------|--------|-------------|
| **In Progress is 0 or 1** | `taskMetrics.ts` sets in-progress to `1` if any current schedule block is active — not a count of in-progress tasks. Mockup shows `3`. | Wave 5 |
| **Readiness bar removed from top** | `TodayStatusSummary` (readiness %, attendance/Quran/lessons/portfolio pills) replaced by three summary cards. Component still exists but is **not mounted** on `Dashboard.tsx`. | Wave 6 (remove or relocate) |

### Navigation

| Issue | Detail | Target wave |
|-------|--------|-------------|
| **Settings triple-highlight** | On `/settings`, **People**, **Compliance**, and **Settings** can all appear active (`People` matches any `/settings` path; Compliance shares prefix). | Wave 6 |
| **People / Compliance query tabs** | Links use `?tab=` but active state does not distinguish tabs. | Wave 6 |
| **Calendar vs planner split** | Two sidebar entries for related plan workflows (`/plan` vs `/plan/schedule`). Works but requires user learning. | Document / Wave 9 settings IA |
| **Quran on sidebar** | Not in mockup nav; added per product decision. | — |

### Stubs & dead code

| Issue | Detail | Target wave |
|-------|--------|-------------|
| **Notification bell** | Rendered in `Header.tsx`; no-op stub. | Wave 7+ |
| **Quick Add** | Opens menu with links; not a unified create flow. | Wave 7+ |
| **`NavigationContext.tsx`** | `NavigationProvider` unused after shell migration; file remains. | Wave 6 cleanup |
| **Nested white cards in schedule** | `TodaySchedulePanel` and `ScheduleNowNextCard` both use white bordered cards. | Wave 5 |

### Branding

| Issue | Detail | Target wave |
|-------|--------|-------------|
| **“Sheath” vs “Sheath Academy”** | Sidebar uses **Sheath**; login/setup/metadata still say **Sheath Academy**. | Wave 6 copy pass |
| **Logo single source** | **`SheathLogo.tsx`** is canonical; `public/favicon.svg` must stay in sync (comment in file). | Ongoing |

---

## 4. What changed on the dashboard (nothing deleted)

### Removed from above-the-fold (replaced or demoted)

- **Top tab navigation** → sidebar routes
- **`TodayStatusSummary`** readiness bar → **`TodayTaskSummaryCards`** (3 metrics)

### Still on the page (below fold — `dashboard-more-insights`)

- `DoToday`, `SubjectActivity`, `SchoolYearProgressCard`, `QuranStreak`, `IslamicCalendarCard`, `WeeklyActivity`, `RecordsProof`

### Still at top

- `NextSetupStrip`, `DashboardHeader`, summary cards, schedule panel, alerts rail

---

## 5. Waves 5–9 (planned)

### Wave 5 — Full schedule timeline

- Replace Now & Next with vertical timeline (time, subject icon, topic, status pill)
- Breaks, lunch/prayer blocks
- Fix `"X of Y items scheduled"` denominator (planned vs scheduled)
- Improve in-progress metric to count (or document single-slot model)

### Wave 6 — Dashboard declutter & shell polish

- Remove or relocate legacy widgets below fold
- Merge / simplify dual headers on dashboard
- Fix settings nav active-state logic
- Remove dead `NavigationProvider` code
- Brand copy pass (Sheath vs Sheath Academy)

### Wave 7 — AI Personal Assistant panel

- Purple right-rail card per mockup (beta)
- Schedule imbalance suggestions (stub → real data later)

### Wave 8 — Calendar page

- Dedicated calendar experience (may supersede `/plan/schedule` stub feel)
- Header date picker with prev/next arrows

### Wave 9 — Notification bell & Quick Add

- Bell behavior
- Unified Quick Add create flow

---

## 6. File index (Waves 0–4)

| Area | Paths |
|------|-------|
| Nav | `features/layout/lib/navConfig.ts`, `navIcons.tsx` |
| Shell | `Sidebar.tsx`, `Header.tsx`, `AppShell.tsx`, **`SheathLogo.tsx`** |
| Dashboard | `Dashboard.tsx`, `DashboardHeader.tsx`, `TodayTaskSummaryCards.tsx`, `TodaySchedulePanel.tsx` |
| Metrics API | `features/dashboard/server/taskMetrics.ts`, `api/routes/summary.ts` |
| Design | `docs/design/dashboard-mockup-20260524.png`, `docs/design/README.md` |

---

## 7. Acceptance checklist (Waves 0–4)

- [x] Sidebar with all agreed nav items + disabled Messages/Finances
- [x] Shield logo + nav icons (mockup-aligned styling)
- [x] Dashboard greeting header with dates and actions
- [x] Three task summary cards wired to API
- [x] Hero grid: schedule + alerts
- [x] Legacy widgets reachable below fold
- [ ] Full schedule timeline (Wave 5)
- [ ] AI assistant panel (Wave 7)
- [ ] Single-header dashboard polish (Wave 6)

---

## 8. Changelog

| Date | Notes |
|------|-------|
| 2026-05-24 | Waves 0–4 shipped; mockup saved; logo consolidated to `SheathLogo.tsx`; plan expanded with known gaps and Waves 5–9 |
