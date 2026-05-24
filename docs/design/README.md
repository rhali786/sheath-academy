# Design references

## Dashboard mockup (Waves 1–4)

**File:** [`dashboard-mockup-20260524.png`](./dashboard-mockup-20260524.png)

High-fidelity reference for the sidebar shell, dashboard header, summary cards, schedule hero grid, and alerts rail. Use this image when tuning icons, colors, and layout spacing.

### Sidebar (Wave 1)

| Mockup element | Implementation |
|----------------|----------------|
| Shield + leaf logo | `features/layout/front/components/SheathLogo.tsx` |
| Sheath + tagline | `Sidebar.tsx` brand block |
| Hijri under logo | `Sidebar.tsx` + `formatHeaderDates` |
| Nav icons per row | `features/layout/lib/navIcons.tsx` + `NavIcon` in `Sidebar.tsx` |
| Active row: light green pill | `bg-forest-100` active state |
| Messages badge (grayed) | Disabled row + `opacity-40` badge |
| Quran, Settings, Admin, About | Footer section in `navConfig.ts` |

### Dashboard layout (Waves 2–4)

| Mockup element | Implementation |
|----------------|----------------|
| Greeting + sun icon | `DashboardHeader.tsx` |
| Gregorian + Hijri dates | `DashboardHeader.tsx` |
| Quick Add / Today's Plan | `DashboardHeader.tsx` (stub menu + outline plan link) |
| Child selector on dashboard | `DashboardHeader.tsx` |
| 3 summary cards with circle icons | `TodayTaskSummaryCards.tsx` |
| Schedule center + alerts right | `Dashboard.tsx` `dashboard-hero-grid` |
| Legacy widgets below fold | `dashboard-more-insights` section |

### Deferred (Wave 5+)

- Full schedule timeline with subject icons and status pills
- AI Personal Assistant panel
- Date picker with prev/next arrows in header
- Notification bell behavior
