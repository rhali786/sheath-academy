# Wave 3 — Dashboard data wiring + Today command center

**Bugs:** BUG-001, BUG-002, BUG-007
**Feedback:** FB-004
**Depends on:** Wave 0 complete

---

## BUG-001 — Setup prompt stuck

**Root cause:** `hasLessons: false`, `hasAttendance: false`, `hasPortfolio: false` are hardcoded.

**TDD:**
- Unit: `getSetupStatus(householdId)` returns `hasLessons: true` when lessons exist for household.
- Unit: returns `hasLessons: false` when no lessons exist.
- Same pattern for `hasAttendance`, `hasPortfolio`.
- Integration: Dashboard with mocked `hasLessons: true` → setup strip does NOT say "Plan your first lesson."
- Integration: mocked `hasLessons: false` → setup strip shows first lesson prompt.
- Playwright (`e2e/dashboard.spec.ts`): create a lesson, return to Today → setup strip has advanced.

---

## BUG-007 — Today metrics hardcoded

**Root cause:** Needs Attention count, Attendance Ready, and other metrics in the metric bar are hardcoded values.

**TDD:**
- Unit: `GET /api/dashboard/summary` with seed data → `needsAttentionCount` equals actual alert item count in seed.
- Unit: `attendanceReadyCount` matches actual attendance record count.
- Integration: render `TodayMetricsBar` with mocked summary → displayed numbers match mock values exactly.
- Playwright: count visible alert cards in Needs Attention section; assert metric bar count matches.

---

## BUG-002 — Child selector filtering inconsistent

**Decision:** Per-Child Progress removes its own child selector and follows the global top selector.

**Pre-code audit — trace each section before touching any file:**

| Section | Expected behavior |
|---------|------------------|
| Today's State | Filter by selectedChildId |
| Do Today | Filter by selectedChildId |
| Needs Attention | Filter by selectedChildId |
| Per-Child Progress | Remove own selector → follow global selectedChildId |
| Quran Logging | Filter by selectedChildId |
| Records Readiness | Filter by selectedChildId |

**TDD:**
- Integration: render Dashboard, select child B via global selector → Quran Logging section shows only B's sessions.
- Integration: Per-Child Progress section renders without its own child selector.
- Integration: Records Readiness section data updates when selectedChildId changes.
- Playwright: select Adam → assert Quran section updates; select Khadijah → assert it updates again.

---

## FB-004 — Today as priority command center (MVP scope)

**Changes (same wave, same files):**
- Replace "Plan your first lesson / Coming soon" hero with **Today's Homeschool Status** summary card. Includes: attendance status, overdue lesson count, Quran logging status, daily readiness %.
- Move **Needs Attention** directly below the status summary card.
- Add **School Year Progress** card: Day X of 180, Week X of 36, remaining school days.
- Add **bilingual Islamic date display**: Gregorian + English Hijri line (Arabic Hijri in Wave 11).
- Rename **Records & Proof** → **Records Readiness** with a readiness state indicator.
- Surface pacing awareness: On pace / Behind / Ahead indicator.
- Add **Now & Next** preview card (minimal: next planned lesson title + subject).
- All metric values must derive from live API data — no hardcoded values (connects to BUG-007 fix).
- Replace any remaining raw IDs in labels with resolved names (connects to BUG-003 fix).

**FB-004 TDD:**
- Integration: render Today → assert `TodayStatusSummary` card is present.
- Integration: render with school year data → assert "Day X of 180" text visible.
- Integration: render with Hijri enabled → assert English Hijri date string rendered.
- Integration: Needs Attention renders directly below TodayStatusSummary.
- Integration: Records Readiness section has a readiness indicator element.
- Playwright: navigate to Today → assert "School Year Progress" card visible with non-zero day count.

---

## File index

| File | Change |
|------|--------|
| `features/dashboard/api/routes/summary.ts` | Real setup status + real metric values |
| `features/dashboard/server/service.ts` | `getSetupStatus()`, `getTodayMetrics()` using real services |
| `features/dashboard/front/context/DashboardProvider.tsx` | Propagate selectedChildId to all sections |
| `features/dashboard/front/pages/Dashboard.tsx` | Wire filter; add new FB-004 sections |
| `features/dashboard/front/components/TodayMetricsBar.tsx` | Read live metric values from API |
| `features/dashboard/front/components/TodayStatusSummary.tsx` | New — status summary card |
| `features/dashboard/front/components/SchoolYearProgressCard.tsx` | New — day/week progress |
| `features/dashboard/front/components/IslamicDateDisplay.tsx` | New — Hijri + Gregorian date |
| `features/dashboard/front/components/NowNextCard.tsx` | New — minimal next lesson preview |
| `features/dashboard/front/components/QuranLoggingSection.tsx` | Accept + filter by selectedChildId |
| `features/dashboard/front/components/PerChildProgressSection.tsx` | Remove own child selector |
| `features/dashboard/front/components/RecordsReadinessSection.tsx` | Rename + readiness state |
| `features/dashboard/__tests__/api/summary.test.ts` | Extend |
| `features/dashboard/__tests__/integration/Dashboard.test.tsx` | Extend |
| `features/dashboard/__tests__/integration/TodayMetricsBar.test.tsx` | New/extend |
| `e2e/dashboard.spec.ts` | Extend |
