# Dashboard layout migration — Waves 0–4

**Status:** Waves 0–4 shipped on `dev`  
**Design reference:** [`docs/design/dashboard-mockup-20260524.png`](../design/dashboard-mockup-20260524.png)

## Wave 0 — Nav map

- Sidebar includes Quran, Settings, Admin, About (footer)
- Messages / Finances visible, disabled, gray badge
- `/` is always dashboard; `NavigationProvider` removed from shell

## Wave 1 — Sidebar shell

- `navConfig.ts`, `Sidebar.tsx`, `AppShell.tsx`, slim `Header.tsx`
- Brand: Sheath + Faith. Learning. Purpose.
- Shield logo + Lucide nav icons (see `navIcons.tsx`, `SheathLogo.tsx`)

## Wave 2 — Dashboard grid

- Hero: schedule (2 cols) + alerts rail (1 col)
- Legacy widgets in `dashboard-more-insights`

## Wave 3 — Dashboard header

- Assalamu alaikum greeting, dates, Quick Add stub, Today's Plan, ChildSelector
- Dashboard-only (not global shell header)

## Wave 4 — Task summary metrics

- `taskMetrics.ts` + `GET /api/dashboard/summary` fields
- `TodayTaskSummaryCards` (completed = lessons + attendance + Quran today)
- `TodaySchedulePanel` wraps schedule-now/next (full timeline = Wave 5)

## Alignment notes (2026-05-24)

Mockup polish applied: light-gray sidebar, forest pill active state, circular metric icons, sun + outline Today's Plan in header. AI panel and full timeline remain Wave 5+.
