# Wave 5 — Planner fixes + planning control board

**Bugs:** BUG-009, BUG-010
**Feedback:** FB-006
**Depends on:** Wave 0 complete (directory is now features/plan/)

---

## BUG-009 — Duplicate Quran Memorisation subject rows

**Root cause (audit before touching):** Either seed inserts duplicates, or the planner query returns the same subject twice when a subject has multiple lessons.

**Pre-code audit steps:**
1. Read `features/subjects/server/seed.ts` — count Quran Memorisation entries.
2. Read `features/plan/server/service.ts` — check if `getPlannerWeek` deduplicates subjects.

**TDD:**
- Unit: `getPlannerWeek(householdId, weekStart)` → each subject appears once per child, even when that subject has multiple lessons in the week.
- Integration: `WeekGrid` with Adam having two lessons under Quran Memorisation → "Quran Memorisation" row appears exactly once in Adam's group.
- Playwright (`e2e/planner.spec.ts`): navigate to `/plan`, open subject filter, count "Quran Memorisation" entries → assert count is 1.

---

## BUG-010 — Week navigation stuck

**Root cause:** Navigation buttons do not propagate updated `weekStart` to the grid, or state updates but the grid does not re-fetch.

**TDD:**
- Integration: render `PlannerPage`, click Previous → week label changes to prior week.
  Click Next twice → label shows week after current week.
- Playwright: navigate to `/plan`, note week range, click Previous → assert week range changes in header.

---

## FB-006 — Planner as planning control board (MVP scope)

**Changes (same wave, same files):**
- Default displayed week to the week **containing today** (not a hardcoded date).
- **Highlight today's column** visually in the weekly grid.
- Improve **active filter display**: show summary of active filters, e.g., "Children: All 3 · Subjects: Quran, Math."
- Add **collapsible child groups** in the grid rows.
- Add **Scheduled-only vs All-subjects** view toggle.
- Fix/prevent duplicate subject rows (connects to BUG-009).
- Add **Family/Shared Work** section for lessons shared across learners.
- Add **direct "+ Add lesson"** affordance in empty grid cells.
- Add lesson cell actions: Edit, Move, Duplicate, Complete, Add evidence.
- Display **estimated lesson duration** in cells where set.
- Auto-calculate **daily scheduled time totals**: e.g., "Monday: 6 lessons · 4h 20m."
- Add **workload threshold warnings** (from Household settings defaults): "Monday exceeds your preferred daily lesson target."
- Add **Week Balance summary**: total lessons planned, total instructional time, overloaded days.
- Add **Carry Forward Unfinished Work** action: move to next school day, next week, mark skipped.
- Add **print/export weekly plan** via `window.print()`.
- Add **school week indicator**: "School Week 15 of 36."

**FB-006 TDD:**
- Integration: render `PlannerPage` → today's column has a visible highlight class.
- Integration: render with active filters → filter summary text is visible.
- Integration: click "+ Add lesson" in empty cell → lesson form/modal opens.
- Integration: lesson with `estimatedDuration: 30` → daily total reflects 30 min.
- Integration: day total exceeds household threshold → warning message visible.
- Integration: click "Carry Forward" on overdue lesson → move options dialog appears.
- Integration: school week indicator renders "Week X of" text.
- Playwright: navigate to `/plan` → assert school week indicator visible.

---

## File index

| File | Change |
|------|--------|
| `features/subjects/server/seed.ts` | Read + audit — remove duplicate records if found |
| `features/plan/server/service.ts` | Dedup subject rows; default to current week |
| `features/plan/front/pages/PlannerPage.tsx` | Fix week nav; default to today's week; school week indicator; carry forward |
| `features/plan/front/components/WeekGrid.tsx` | Highlight today; cell actions; duration totals; threshold warnings |
| `features/plan/front/components/WeekGridFilters.tsx` | Improve filter summary display; add view toggle |
| `features/plan/front/components/SharedWorkSection.tsx` | New — family/shared lesson section |
| `features/plan/front/components/WeekBalanceSummary.tsx` | New — totals + threshold warnings |
| `features/plan/front/components/CarryForwardModal.tsx` | New — move unfinished work dialog |
| `features/plan/__tests__/api/planner-service.test.ts` | New/extend |
| `features/plan/__tests__/integration/WeekGrid.test.tsx` | New/extend |
| `features/plan/__tests__/integration/PlannerPage.test.tsx` | New/extend |
| `e2e/planner.spec.ts` | Extend |
