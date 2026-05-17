# Changelog

Version increments follow `package.json`. This file is updated when the **minor** version bumps.

---

## [0.35.0] — Portfolio completion + Reports spine

### Added
- **F31 — Parent reflection** — `reflection` field on evidence items; visible in portfolio list and reports view
- **F32 — Portfolio filters** — filter by child, subject, type, and date range; newest-first sort; 50-item display limit; empty states with guidance copy
- **F33 — Records report view** — separate `/reports` route; sectioned layout: child info, subjects, attendance summary, progress/completed lessons, portfolio count, parent reflections; composes from existing feature services — no duplicated business logic
- **F34a — Print-optimised records summary** — "Print records" button (`window.print()`); `@media print` CSS hides nav, filters, controls; page-break rules; generated date in print header
- **F35 — Advisory records review checklist** — flags missing attendance records, subjects without completed lessons, no portfolio evidence; advisory only (non-blocking); calm, non-compliance language

### Fixed
- Portfolio filter empty-state copy corrected
- Generated date in print header aligned to report generation time
- "Showing 50 most recent items" notice added when list hits service limit

---

## [0.30.0] — Portfolio evidence (F27–F30a)

### Added
- **F27–F29 — Evidence data model, API, and UI** — `EvidenceItem` type; store, service, seed; CRUD API routes; `EvidenceForm`, `EvidenceListItem`, `EvidenceList` components; 55 tests
- **F30a — Text note + URL evidence** — evidence types: `note | link | writing_sample | project | recitation | other`; `http`/`https`-only URL validation; unsafe protocols (`javascript:`, `file:`, `data:`, `mailto:`) rejected; no file/photo upload controls
- **Wave 2 wiring** — Portfolio wired into slug router, Header tab, and Dashboard

---

## [0.26.0] — Records spine (F24–F26)

### Added
- **F24 — Progress by subject** — `computeProgressBySubject` utility; per-subject completion rates; `ProgressBySubjectCard` in the dashboard
- **F25 — Completed lesson history** — `getCompletedLessonHistory` utility; chronological lesson history per child/subject; API route and service function; `CompletedLessonHistory` component
- **F26 — Records dashboard cards** — `SubjectProgressCard` and `RecentLessonsCard` wired into the dashboard tab

### Changed
- Type ownership and data-access ownership rules added to CLAUDE.md
- Pre-implementation audit checklist added to CLAUDE.md
- Wave 1 implementation plans (F12–F35) added to `docs/`

---

## [0.23.0] — Attendance tracking (F20–F23)

### Added
- **F20–F23 — Attendance tracking** — daily attendance records by child; attendance API routes and service; attendance dashboard card; missing-day detection (weekdays inside active school year, up to today, without a record)

---

## [0.10.20] — Planner stabilisation

### Fixed
- **WeekGrid formula** — corrected `daysFromStart` calculation; `formatLocalDate` used throughout for UTC-safe date math
- **Today section staleness** — `TodayLessonCard` receives `externalLessons` prop; `LessonsPage` passes lessons state through so Today section refreshes on mutations
- **DoToday auto-select** — auto-select behaviour corrected
- Planner seed fixed to use current week's Monday instead of hardcoded date
- SettingsPage test: missing `getProfile` mock added to householdApi stub

### Added
- **F14 — Today section on /lessons page** (Wave 2) — Today section added to lessons page; linked with planner week view
- Drag-to-reschedule and click-to-edit on lesson cards

---

## [0.10.0] — Weekly planner (F11)

### Added
- **F11 — Weekly planner** — per-child lesson scheduling across the week; `WeekNavigator`, `WeekGrid`, and `WeeklyList` components; linked child/subject filters; week start day preference in household settings; planner integrated into app routing with its own tab

---

## [0.5.1] — Subjects, settings, and setup wizard (F5–F10)

### Added
- **F5–F10** — subject/course data model and admin UI; unified settings page; progressive household setup cards; child selector; header Hijri date display
- Per-feature data stores replace the shared `dataStore`

---

## [0.4.0] — Child profiles (F4)

### Added
- **F4** — child data model, API routes, and management UI; add, edit, and remove children from the household; child list drives per-child progress and Quran tracking

---

## [0.3.4] — Shell stabilisation

### Changed
- `AppShell` owns `Header` — removed duplicate rendering from `Dashboard`
- Household settings restored to full rename form
- Semantic versioning via pre-commit hook keeps `package.json` in sync on every commit

### Added
- Worklog linked from About footer

---

## [0.3.0] — Worklog page

### Added
- `/worklog` — week 1 work summary; publicly accessible without sign-in

---

## [0.1.17] — Shell and navigation

### Added
- `AppShell` architecture — header and household context in one shell component shared by all pages
- `NavigationContext` — tab state in sync between header and dashboard; tab buttons navigate back to dashboard from any page

---

## [0.1.10] — Household workspace (F2–F3)

### Added
- **F2–F3** — workspace and household profile API; first-login setup flow; family name in header; household settings tab to rename

---

## [0.1.4] — Parent sign-in (F1)

### Added
- **F1** — magic-link email authentication via Resend; NextAuth session management; middleware route protection; dev bypass for local testing

---

## [0.1.2] — Dashboard redesign

### Added
- Madinah green + sky blue design system (`forest-*` palette); Notion-style borderless cards; `STYLES.md`
- Responsive hamburger nav on mobile; sticky header

### Changed
- Custom SVG favicon

---

## [0.1.1] — Next.js stack

### Changed
- Migrated from Python / FastAPI prototype to Next.js 15 App Router
- All business logic moved from `app/` into `features/`; `app/` is now a thin routing layer
- TypeScript types, mock data, API routes, Jest suite established
- CI: GitHub Actions (`npm ci → build → test → smoke`); Render deploy config

---

## [0.1.0] — Foundation

### Added
- Modular `features/` architecture; Next.js 15 App Router, TypeScript, Tailwind CSS, Jest
- Dashboard shell with four tab panels; in-memory data store
- Wave 1 — 35 feature specs scaffolded in `features/feature-XX-*_todo/`; `docs/WAVE1-SPECIFICATION.md`
- About page; `CLAUDE.md` development guide
