# Wave 17 — UI polish: Quran add form, settings layout, navigation, typography, dashboard rearrange

**Branch:** `claude/fix-planner-bugs`
**Depends on:** Waves 0–16 complete
**Scope:** Pure front-end changes — no new API routes, no new types, no new stores.

---

## Summary of changes

| # | Area | Change |
|---|------|--------|
| 1 | Quran page | Add "Log session" form at the top of the page |
| 2 | Settings → Household tab | Two-column layout |
| 3 | Header | Brand icon + name → `<Link href="/">` |
| 4 | Growth page | Wrap EvidenceForm in same card box as "Add lesson" |
| 5 | Lessons page | Add `h1` "Lessons" at the top |
| 6 | All content pages | Shared `.page-title` CSS class for all h1s |
| 7 | Today (Dashboard) | Remove `IslamicDateDisplay` (date already in header) |
| 8 | Today (Dashboard) | Sticky child selector bar |
| 13 | All "Add" forms | Standardize add-form card box across all pages |
| 9 | Today's Readiness | Add "Portfolio Items" and "Lessons Planned" pills |
| 10 | Do Today | Show all children when no child is selected |
| 11 | Dashboard right column | Move QuranStreak under SchoolYearProgressCard |
| 12 | Dashboard left column | Move SubjectActivity under Do Today |

---

## Pre-implementation audit

**Types used:** No new types needed. All changes are layout/component wiring.

**Data access:** No new API calls. DoToday will consume `children` already available from `useContext_Dashboard`. TodayStatusSummary already receives `metrics` which has `portfolioItems` and `lessonsPlanned`.

**Architecture findings:**
- `TodayLessonCard` was already updated in the previous session to accept `children: StudentProfile[]` — DoToday must be updated to use the new API.
- `DashboardMetrics` already has `portfolioItems` and `lessonsPlanned` — adding them to `TodayStatusSummary` requires no backend changes.
- `DoToday` currently only reads `selectedChildId` from context. It must also read `children` from the same context (`useContext_Dashboard`).

---

## Item 1 — Quran page: Add "Log session" form

**Problem:** `QuranPage` only shows a list and an inline edit form. There is no way to add a new session from the Quran page — the user must currently use the Dashboard QuranStreak card.

**Fix:** Add a collapsible "Log session" form at the top of `QuranPage`, using the same field set as the edit form (type, date, surah, fromAyah, toAyah, notes, childId). Wrap it in the same card box style as "Add lesson" in LessonsPage.

**Fields:** child selector, type, date (defaults to today), surah, from ayah, to ayah, notes.

**Submit:** calls `quranApi.createSession(...)`, appends the returned session to local state, collapses or resets form.

**File:**
| File | Change |
|------|--------|
| `features/quran/front/pages/QuranPage.tsx` | Add form state + `handleAdd()` handler + form JSX at top of return |

**Style target:**
```tsx
<div>
  <h2 className="text-lg font-bold text-slate-900 mb-4">Log session</h2>
  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
    {/* form fields */}
  </div>
</div>
```

**Tests:** Add integration test in `features/quran/__tests__/integration/QuranPage.test.tsx` (or extend existing) covering:
- Form renders with child selector, type, surah fields
- Submit calls `quranApi.createSession` with correct payload
- After submit the new session appears in the list

---

## Item 2 — Settings → Household tab: two-column layout

**Problem:** Household tab is a single-column `space-y-6` stack. At wide screen (max-w-6xl) there is room for two columns.

**Fix:** Wrap the three household sections in a `grid grid-cols-1 md:grid-cols-2 gap-8`:
- Left column: Household name form
- Right column top: Week start day (`HouseholdSettings`)
- Right column bottom: Islamic calendar reminders (`IslamicRemindersSection`)

Or as a simpler split: left = name + week start, right = Islamic reminders — whichever fits better after visual inspection.

**File:**
| File | Change |
|------|--------|
| `features/settings/front/pages/SettingsPage.tsx` | Change `<div className="space-y-6">` to `<div className="grid grid-cols-1 md:grid-cols-2 gap-8">` in the `activeTab === 'household'` section; group children into two column divs |

**Tests:** Existing settings integration tests cover the tab presence; no new test needed for layout change.

---

## Item 3 — Header: brand → home link

**Problem:** The icon (ش) and "Sheath Academy" text are in a plain `<div>`. Clicking them does nothing.

**Fix:** Wrap the brand div in `<Link href="/">`. The Link should not break the existing flex layout.

```tsx
// Before
<div className="flex items-center gap-3">
  <div className="w-9 h-9 rounded-xl bg-forest-900 ...">…</div>
  <div><h1>Sheath Academy …</h1><p>{familyName}</p></div>
</div>

// After
<Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
  <div className="w-9 h-9 rounded-xl bg-forest-900 ...">…</div>
  <div><h1>Sheath Academy …</h1><p>{familyName}</p></div>
</Link>
```

**File:**
| File | Change |
|------|--------|
| `features/layout/front/components/Header.tsx` | Wrap brand section in `<Link href="/">` |

**Tests:** Extend `features/layout/__tests__/Header.test.tsx` to verify brand section renders a link with `href="/"`.

---

## Item 4 — Growth page: EvidenceForm card box

**Problem:** `PortfolioPage` renders `<EvidenceForm …/>` directly with no surrounding card box. The Lessons page wraps `LessonTaskForm` in `bg-white rounded-xl border border-slate-200 p-6 shadow-sm` with a section heading — this is the visual standard.

**Fix:** In `PortfolioPage`, wrap the EvidenceForm call in:
```tsx
<div>
  <h2 className="text-lg font-bold text-slate-900 mb-4">Add evidence</h2>
  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
    <EvidenceForm … />
  </div>
</div>
```

**File:**
| File | Change |
|------|--------|
| `features/portfolio/front/pages/PortfolioPage.tsx` | Add wrapper div + heading around `<EvidenceForm>` |

---

## Item 5 — Lessons page: add `h1`

**Problem:** `LessonsPage` starts with the "Add lesson" form section heading but has no top-level page `h1`. Every other content page has one.

**Fix:** Add `<h1 className="page-title">Lessons</h1>` (using the shared class from item 6) before the "Add lesson" section.

**File:**
| File | Change |
|------|--------|
| `features/plan/front/pages/LessonsPage.tsx` | Add `<h1>` at top of return div |

---

## Item 6 — Shared page title class

**Problem:** Page `h1` elements across the app use inconsistent Tailwind class combinations:
- Attendance: `text-2xl font-bold text-slate-900`
- Growth: `text-xl font-bold text-gray-900`
- Quran: `text-2xl font-bold text-slate-900 mb-2`
- Records/Reports: `text-3xl font-bold text-slate-800`

**Fix:** Add a `.page-title` utility class in `app/globals.css`:
```css
@layer utilities {
  .page-title {
    @apply text-2xl font-bold text-slate-900 mb-1;
  }
}
```

Then apply `className="page-title"` to all content page `h1`s:

| File | Current classes | Action |
|------|----------------|--------|
| `features/attendance/front/pages/AttendancePage.tsx` | `text-2xl font-bold text-slate-900` | Replace with `page-title` |
| `features/portfolio/front/pages/PortfolioPage.tsx` | `text-xl font-bold text-gray-900` | Replace with `page-title` |
| `features/quran/front/pages/QuranPage.tsx` | `text-2xl font-bold text-slate-900 mb-2` | Replace with `page-title` |
| `features/records/front/pages/ReportsPage.tsx` | `text-3xl font-bold text-slate-800` | Replace with `page-title` |
| `features/resources/front/pages/ResourcesPage.tsx` | (check and standardize) | Replace with `page-title` |
| `features/plan/front/pages/LessonsPage.tsx` | (new h1 from item 5) | Use `page-title` |
| `features/schedule/front/pages/SchedulePage.tsx` | `text-xl font-semibold text-slate-900 mb-6` | Replace with `page-title` |
| `features/settings/front/pages/SettingsPage.tsx` | `text-xl font-semibold text-slate-900 mb-6` | Replace with `page-title` |
| `features/about/front/pages/About.tsx` | (About is a marketing page — skip or use a different class) | Skip |

---

## Item 7 — Today page: remove duplicate date

**Problem:** The Dashboard Today tab renders `<IslamicDateDisplay />` which shows the full Gregorian date and Hijri date. The header already shows the Hijri date in Arabic + the Hijri year/Gregorian year. This is redundant — two dates visible simultaneously at the top of every page.

**Fix:** Remove `<IslamicDateDisplay />` from `Dashboard.tsx`. The ChildSelector row that currently holds both components will just hold the ChildSelector (which becomes sticky in item 8).

**File:**
| File | Change |
|------|--------|
| `features/dashboard/front/pages/Dashboard.tsx` | Remove `<IslamicDateDisplay />` import and JSX |

---

## Item 8 — Today page: sticky child selector

**Problem:** The ChildSelector ("Viewing: [child name]") scrolls off screen as the user scrolls down the Today dashboard. The user should always be able to see which child they are viewing.

**Fix:** After removing `IslamicDateDisplay` (item 7), the row becomes just the ChildSelector. Make that row sticky, positioned just below the app header.

The header height is approximately:
- Mobile (tabs hidden): ~72px → `top-[4.5rem]`
- Desktop (brand + tab nav): ~109px → `top-[6.875rem]`

```tsx
// Dashboard.tsx — replace the container div
<div className="sticky top-[4.5rem] md:top-[6.875rem] z-40 bg-white border-b border-slate-100 shadow-sm">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex justify-end">
    <ChildSelector />
  </div>
</div>
```

**Note:** The exact `top` values are based on measured header heights. If the header is restyled later, these values should be updated or replaced with a CSS variable.

**File:**
| File | Change |
|------|--------|
| `features/dashboard/front/pages/Dashboard.tsx` | Replace container div with sticky wrapper; remove IslamicDateDisplay |

---

## Item 9 — Today's Readiness: add Portfolio Items and Lessons Planned pills

**Problem:** `TodayStatusSummary` shows Attendance, Quran, and Needs Attention pills. The user wants Portfolio Items and Lessons Planned shown in the same row. Both values already exist in `DashboardMetrics` (`portfolioItems`, `lessonsPlanned`).

**Fix:** Add two more `<StatusPill>` components to `TodayStatusSummary`:

```tsx
<StatusPill
  label="Lessons Planned"
  value={String(metrics.lessonsPlanned)}
  ok={metrics.lessonsPlanned > 0}
  warn={false}
/>
<StatusPill
  label="Portfolio Items"
  value={String(metrics.portfolioItems)}
  ok={metrics.portfolioItems > 0}
  warn={false}
/>
```

Also update `readinessPercent()` to factor in lessons planned: if `lessonsPlanned > 0`, count it as a positive signal.

**File:**
| File | Change |
|------|--------|
| `features/dashboard/front/components/TodayStatusSummary.tsx` | Add 2 StatusPill components; optionally update readiness formula |

**Tests:** Extend `TodayStatusSummary` test to assert pills render when metrics include `lessonsPlanned` and `portfolioItems`.

---

## Item 10 — Do Today: show all children when none selected

**Problem:** When no child is selected on the Dashboard, `DoToday` shows "Select a child to see today's lessons." With the updated `TodayLessonCard` (which now accepts `children: StudentProfile[]`), we can show all children's lessons in one card.

**Fix:**
1. In `DoToday`, also read `children` from `useContext_Dashboard`.
2. When `selectedChildId` is set, pass `[selectedChild]` to `TodayLessonCard`.
3. When `selectedChildId` is null/empty, pass all `children`.
4. Remove the "Select a child" placeholder.

```tsx
export function DoToday() {
  const { selectedChildId, children } = useContext_Dashboard()
  const today = todayLocal()
  const activeChildren = selectedChildId
    ? children.filter(c => c.id === selectedChildId)
    : children

  return (
    <section>
      <h2 className="text-xl font-bold text-slate-900 mb-5">Do Today</h2>
      <TodayLessonCard children={activeChildren} today={today} />
    </section>
  )
}
```

**Files:**
| File | Change |
|------|--------|
| `features/dashboard/front/components/DoToday.tsx` | Read `children` from context; pass as array to TodayLessonCard |

**Note:** `DashboardProvider` already exposes `children` (it is `studentProfiles`). No context change needed.

**Tests:** Extend `DoToday` test: when `selectedChildId` is null and children have 2 entries, `TodayLessonCard` is called with both children.

---

## Item 11 — Dashboard: QuranStreak into right column

**Problem:** Currently the bottom section has `WeeklyActivity` full-width, then `SubjectActivity` + `QuranStreak` side by side in a `grid-cols-2`. The user wants QuranStreak stacked vertically in the right sidebar under `SchoolYearProgressCard` (so the circular streak indicators stack vertically, one per row, instead of being in a horizontal 2-column grid).

**Current right column:**
```tsx
<div className="space-y-6">
  <ScheduleNowNextCard … />
  <SchoolYearProgressCard />
  {/* Islamic calendar cards */}
</div>
```

**After:**
```tsx
<div className="space-y-6">
  <ScheduleNowNextCard … />
  <SchoolYearProgressCard />
  <QuranStreak … />
  {/* Islamic calendar cards */}
</div>
```

Remove `QuranStreak` from the bottom `grid-cols-2` block.

**File:**
| File | Change |
|------|--------|
| `features/dashboard/front/pages/Dashboard.tsx` | Move `<QuranStreak>` from bottom grid to right sidebar; remove from bottom `grid-cols-2` |

---

## Item 12 — Dashboard: SubjectActivity under Do Today

**Problem:** `SubjectActivity` is currently in the bottom section alongside `QuranStreak`. The user wants it moved up into the main left column (under Do Today), so the bottom section is only `WeeklyActivity` and `RecordsProof`.

**Current left column (`lg:col-span-2`):**
```tsx
<div className="lg:col-span-2">
  <DoToday />
</div>
```

**After:**
```tsx
<div className="lg:col-span-2 space-y-6">
  <DoToday />
  <SubjectActivity … />
</div>
```

**Current bottom section:**
```tsx
<WeeklyActivity … />
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <SubjectActivity … />
  <QuranStreak … />   {/* now moved to right column */}
</div>
```

**After:**
```tsx
<WeeklyActivity … />
{/* SubjectActivity and QuranStreak moved out — only RecordsProof remains */}
```

**File:**
| File | Change |
|------|--------|
| `features/dashboard/front/pages/Dashboard.tsx` | Move `<SubjectActivity>` to main left col; remove bottom `grid-cols-2`; keep `<RecordsProof>` at bottom |

---

## Item 13 — Standardize "Add" form card boxes across all pages

**Reference style (Lessons page — confirmed correct by user):**
```tsx
<div>
  <h2 className="text-lg font-bold text-slate-900 mb-4">Add [thing]</h2>
  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
    <TheForm … />
  </div>
</div>
```
- Heading: outside the card, `text-lg font-bold text-slate-900 mb-4`
- Card: `bg-white rounded-xl border border-slate-200 p-6 shadow-sm`

**Audit of all "Add" form boxes:**

| Page | Current container | Action |
|------|------------------|--------|
| Lessons | `bg-white rounded-xl border border-slate-200 p-6 shadow-sm` + h2 outside | ✅ Reference — no change |
| Attendance | `bg-white rounded-xl border border-slate-200 p-6 shadow-sm` | ✅ Card matches — add h2 "Mark attendance" outside if missing |
| Growth/Portfolio | No wrapper | ❌ Fix in item 4 |
| Resources | `p-5 bg-white rounded-xl border border-slate-200` — missing `shadow-sm`, `p-5` not `p-6`, h2 inside | ❌ Fix here |
| Quran | No form yet | ✅ New form in item 1 uses reference style |
| Records | Report generator form (not an add form — different semantic purpose) | — skip |
| Settings | Tabbed admin layout with its own context | — skip |

**Fixes for Resources page (`features/resources/front/pages/ResourcesPage.tsx`):**
- Change `p-5 bg-white rounded-xl border border-slate-200` → `bg-white rounded-xl border border-slate-200 p-6 shadow-sm`
- Move the `<h2>New resource</h2>` from inside the card to outside (above the card div)
- Change h2 text from `"New resource"` to `"Add resource"` with class `text-lg font-bold text-slate-900 mb-4`

**Fixes for Attendance page (`features/attendance/front/pages/AttendancePage.tsx`):**
- Card already matches reference style. Check whether a section h2 "Mark attendance" exists above the card; add it if absent.

---

## Implementation order

Execute in this order to minimize re-reads and context switching:

**Wave A — Header and nav (1 file each):**
1. Item 3: Header brand link
2. Item 7 + 8: Dashboard — remove date + sticky ChildSelector (same file)

**Wave B — Page structure (typography + titles):**
3. Item 6: Add `.page-title` to `app/globals.css`
4. Item 5 + 6: LessonsPage h1
5. Item 6: Apply `page-title` class to remaining page h1s

**Wave C — Dashboard layout (1 file — Dashboard.tsx):**
6. Items 11 + 12: Rearrange Dashboard columns

**Wave D — Dashboard components:**
7. Item 9: TodayStatusSummary pills
8. Item 10: DoToday show-all fix

**Wave E — Feature pages:**
9. Item 4 + 13: EvidenceForm wrapper in PortfolioPage + Resources card fix + Attendance heading check
10. Item 2: Settings household tab two columns
11. Item 1: Quran add session form (largest single change)

---

## Files to touch

| File | Items |
|------|-------|
| `features/layout/front/components/Header.tsx` | 3 |
| `features/dashboard/front/pages/Dashboard.tsx` | 7, 8, 11, 12 |
| `features/dashboard/front/components/TodayStatusSummary.tsx` | 9 |
| `features/dashboard/front/components/DoToday.tsx` | 10 |
| `app/globals.css` | 6 |
| `features/plan/front/pages/LessonsPage.tsx` | 5, 6 |
| `features/attendance/front/pages/AttendancePage.tsx` | 6, 13 |
| `features/portfolio/front/pages/PortfolioPage.tsx` | 4, 6 |
| `features/quran/front/pages/QuranPage.tsx` | 1, 6 |
| `features/records/front/pages/ReportsPage.tsx` | 6 |
| `features/resources/front/pages/ResourcesPage.tsx` | 6, 13 |
| `features/schedule/front/pages/SchedulePage.tsx` | 6 |
| `features/settings/front/pages/SettingsPage.tsx` | 2, 6 |
| Test files (extend existing) | 1, 3, 9, 10 |

---

## Out of scope

- No new API routes
- No new type definitions
- No changes to `app/` routing
- About page title kept as-is (marketing page, different visual treatment)
- No changes to mobile menu in Header (brand link only affects desktop brand area)
