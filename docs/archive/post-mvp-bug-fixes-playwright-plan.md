# Plan: Bug Fixes + Playwright Setup — Post-MVP Wave

## Context

Wave 1 (35 features) is tagged. A set of bugs and gaps was identified through manual QA. This plan addresses them in focused slices to minimise token use per session.

---

## Confirmed Findings

| # | Issue | Root cause |
|---|-------|-----------|
| 1 | Sign-in not enforced | `AUTH_SECRET` not set → middleware auth() silently fails → no redirect |
| 2 | Child archive no cascade | `archiveStudentProfile()` only sets isActive; no service calls to related features |
| 3 | Subject archive no cascade | `archiveSubject()` only sets isActive; no cascade to lessons |
| 4 | Attendance records display incomplete | Missing: child name (via API), hours, minutes, notes icon |
| 5 | Portfolio full width | `PortfolioTab` has no max-width; Dashboard uses `max-w-7xl mx-auto` |
| 6 | Planner click-to-edit | Already wired; needs E2E test coverage |
| 7 | Print layout poor | CSS print rules exist but layout isn't pretty; missing components |
| 8 | Reports: attendance data not filtering | Full data flow from page → API → service needs audit; not just a param tweak |
| 9 | Reports: subjects not child-filtered | Same — full flow audit needed |
| 10 | Dashboard cards not all on real APIs | Mixed context + API; some cards may use stale seed data |

---

## Playwright Setup

### Location
```
e2e/                          ← new directory at repo root
  auth.spec.ts
  planner.spec.ts
  attendance.spec.ts
  portfolio.spec.ts
  reports.spec.ts
playwright.config.ts          ← at repo root
```

Not under `features/*/`. Not under `__tests__/`. Entirely separate from Jest.

### Config
- Base URL: `process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'`
- webServer: `npm run dev`, port 3000, reuseExistingServer: true
- testDir: `./e2e`
- Reporters: list + html (output to `e2e/results/`)
- Browser: chromium only for MVP
- PDF: use `page.pdf()` in Playwright to generate and assert print output where feasible

### npm scripts to add
```json
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui"
```

---

## Wave Plan

### Wave A — Layout / display

**A1 — Portfolio width**
- File: `features/portfolio/front/components/PortfolioTab.tsx`
- Change: wrap content in `<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">`
- TDD: integration test asserts container uses max-width class
- E2E: `portfolio.spec.ts` — assert content is not full-viewport-width

**A2 — Attendance records: child name + hours + minutes + notes icon**
- Files: `features/attendance/front/components/AttendanceList.tsx` (or record row component)
- Changes:
  - Fetch child name via **attendance API response** (childId) → call `childrenApi.getChild(childId)` to resolve name; do NOT import children store
  - Display: child name, hours (if > 0), minutes (if > 0), notes icon (e.g. 📝 or inline SVG) when notes are present
- TDD (failing first): integration test asserts child name, hours, minutes rendered; notes icon present when notes exist, absent when no notes
- E2E: `attendance.spec.ts` — assert all four fields visible in records list

**A3 — Print / PDF output**
- File: `app/globals.css` (print CSS), `features/reports/front/pages/ReportsPage.tsx` (print classes)
- Approach:
  1. First test current HTML output via Playwright `page.pdf()` to see what's actually rendering
  2. Rework `@media print` CSS to:
     - Match section order of screen layout exactly
     - Page breaks between major sections (`page-break-inside: avoid; break-inside: avoid`)
     - Clean typography: black on white, appropriate font sizes
     - Ensure ALL sections from screen render in print (checklist, attendance, subjects, portfolio, progress, reflections)
     - Print header: child name, school year, generated date prominent
  3. Generate a Playwright PDF test that asserts the PDF is non-empty and contains expected text strings
- TDD: Playwright `reports.spec.ts` — `page.pdf()` assertion (file size > 0, key text present)

---

### Wave B — Archive cascades

**B1 — Child archive cascade**
- File: `features/children/server/service.ts`
- When `archiveStudentProfile(id)` is called, call cross-feature service functions (not stores):
  - `attendanceService.archiveByChildId(childId)` — add this function to `features/attendance/server/service.ts`
  - `plannerService.archiveByChildId(childId)` — add to `features/planner/server/service.ts`
  - `portfolioService.archiveByChildId(childId)` — add to `features/portfolio/server/service.ts`
  - `subjectService.archiveByChildId(childId)` — add to `features/subjects/server/service.ts`
- Each service function sets `isActive: false` on all records for that childId
- TDD (failing first): unit test each new `archiveByChildId` function; integration test on the children API route asserts cascade fires

**B2 — Subject archive cascade**
- File: `features/subjects/server/service.ts`
- When `archiveSubject(id)` is called, call:
  - `plannerService.archiveBySubjectId(subjectId)` — add to `features/planner/server/service.ts`
- TDD: unit test `archiveBySubjectId`; integration test on subjects API route asserts cascade

---

### Wave C — Reports data accuracy (full flow audit)

**Full trace:**
```
ReportsPage (front) → reportsApi.getSummary(childId, startDate, endDate)
  → GET /api/reports/summary?childId=…
  → reports/api/routes/summary.ts
  → reports/server/service.ts: getRecordsReport(options)
    → getAttendanceSummary(childId, startDate, endDate)   ← verify childId passed
    → getSubjects(childId)                                 ← verify childId passed
```

**C1 — Verify + fix attendance in reports**
- Read `features/reports/server/service.ts` lines 90–95 carefully
- Confirm `getAttendanceSummary` signature matches expected `(childId, startDate?, endDate?)`
- Confirm the call passes all three args
- If attendance service doesn't filter by date range, add that filter
- TDD: service test with two children confirms only correct child's attendance returned; date range test confirms records outside range excluded

**C2 — Verify + fix subjects in reports**
- Read `features/reports/server/service.ts` line 83
- Confirm `getSubjects(childId)` returns only that child's subjects (not all subjects)
- Trace through `features/subjects/server/service.ts` to confirm the filter
- If gap: fix the filter at the service level
- TDD: service test with two children/subjects asserts correct isolation

---

### Wave D — Sign-in enforcement (env only)

**Root cause:** `AUTH_SECRET` not set → Auth.js middleware silently fails.

**D1 — Set env vars in `.env.local`**
```
AUTH_SECRET=2026
NEXT_PUBLIC_DEV_MODE=true
DEV_BYPASS_SECRET=dev2026
```
(`.env.local` is gitignored — do not commit.)

**D2 — Defensive code guard (optional)**
- File: `middleware.ts`
- If `AUTH_SECRET` is not set, log a server-side error and redirect all requests to `/login`
- Prevents silent open access in misconfigured deployments

---

### Wave E — Dashboard API audit

**E1 — Audit each dashboard card**
- Read `features/dashboard/front/pages/Dashboard.tsx` and `DashboardProvider`
- For each card: is it reading from live API response or from static context seed data?
- Wire any static cards to their feature APIs
- TDD: mock API calls in integration tests; assert cards re-render on data change

---

### Wave F — Playwright E2E

Write failing E2E specs for each area, then they pass as waves A–E are implemented.

Priority specs:
1. `auth.spec.ts` — `/`, `/reports`, `/lessons` require sign-in; `/about`, `/login` accessible without
2. `planner.spec.ts` — click lesson in WeekGrid → navigates to `/lessons` with edit form populated
3. `attendance.spec.ts` — child name, hours, minutes, notes icon visible in records list
4. `portfolio.spec.ts` — portfolio container matches max-width of other pages
5. `reports.spec.ts` — report renders real attendance + subjects; `page.pdf()` generates non-empty PDF with child name

---

## Integration Test Coverage Gaps

| Area | Gap | Wave |
|------|-----|------|
| Archive cascade | No cascade tests exist | B |
| Attendance display | No test for child name / hours / minutes / notes icon | A2 |
| Reports accuracy | Needs childId isolation tests | C |
| Dashboard live data | Cards tested with static context; need mocked API tests | E |

---

## File Index

| File | Wave |
|------|------|
| `features/portfolio/front/components/PortfolioTab.tsx` | A1 |
| `features/attendance/front/components/AttendanceList.tsx` | A2 |
| `features/attendance/front/services/api.ts` | A2 (child lookup) |
| `app/globals.css` | A3 |
| `features/reports/front/pages/ReportsPage.tsx` | A3 |
| `features/children/server/service.ts` | B1 |
| `features/attendance/server/service.ts` | B1 |
| `features/planner/server/service.ts` | B1, B2 |
| `features/portfolio/server/service.ts` | B1 |
| `features/subjects/server/service.ts` | B1, B2, C2 |
| `features/reports/server/service.ts` | C1, C2 |
| `.env.local` (not committed) | D1 |
| `middleware.ts` | D2 |
| `features/dashboard/front/pages/Dashboard.tsx` | E1 |
| `features/dashboard/front/context/DashboardProvider.tsx` | E1 |
| `playwright.config.ts` (new) | F |
| `e2e/*.spec.ts` (new) | F |

---

## Session Discipline

Each wave = one session message with explicit scope. Do not read or modify files outside the wave's file list. Write failing tests first (TDD for Jest, Playwright for E2E), then implement, then push. Do not restart the dev server.
