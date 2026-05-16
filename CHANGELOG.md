# Changelog

Version increments follow `package.json`. This file is updated when the **minor** version bumps (e.g. `0.1.x → 0.2.0`).

---

## [0.35.0] — Portfolio completion + Reports spine (current)

### Added
- **Feature 30a — Text note + URL evidence** — parents can save text note and URL evidence; `http`/`https`-only URL validation; unsafe protocols (`javascript:`, `file:`, `data:`, `mailto:`) rejected
- **Feature 31 — Parent reflection** — `reflection` field on evidence items; visible in portfolio list and reports view; placeholder: "Why does this show learning or growth?"
- **Feature 32 — Portfolio list + filters** — filter by child, subject, type, and date range; newest-first sort; 50-item display limit; empty states with next-action guidance
- **Feature 33 — Records report view** — separate `/reports` route; sectioned layout: child info, subjects, attendance summary, progress/completed lessons, portfolio count, parent reflections; composes from existing feature utilities — no duplicated business logic
- **Feature 34a — Print-optimised records summary** — "Print records" button (`window.print()`); `@media print` CSS hides nav, filters, and controls; page-break rules; generated date in print header
- **Feature 35 — Advisory records review checklist** — flags missing attendance records, subjects without completed lessons, and no portfolio evidence; advisory only (non-blocking); calm language; does not overclaim compliance

---

## [0.26.0] — Records spine

### Added
- **Feature 24 — Progress by subject** — per-subject completion rates computed from lesson task records; `ProgressBySubjectCard` in the dashboard; `computeProgressBySubject` utility in planner feature
- **Feature 25 — Completed lesson history** — chronological lesson history per child/subject; `CompletedLessonHistory` component; API route + service function; `getCompletedLessonHistory` utility
- **Feature 26 — Records dashboard cards** — `SubjectProgressCard` and `RecentLessonsCard` wired into dashboard tab; progress and history available at a glance

---

## [0.10.0] — Weekly planner

### Added
- **Feature 11 — Weekly planner** — per-child lesson scheduling across the week; `WeekNavigator` and `WeeklyList` components; linked child/subject filters; week start day preference in household settings; planner integrated into app routing with its own tab

---

## [0.5.1] — Subjects, settings, and setup wizard

### Added
- **Features 05–10** — subject/course data model and admin UI; unified settings page; progressive household setup cards; child selector; header date display; per-feature data stores replace the shared dataStore

---

## [0.4.0] — Child profiles

### Added
- **Feature 04** — child data model, API routes, and management UI; parents can add, edit, and remove children; child list drives per-child progress and Quran tracking sections

---

## [0.1.x] — Foundation

### Added
- **Project foundation** — modular `features/` architecture; Next.js 15 App Router, TypeScript, Tailwind CSS, Jest
- **Dashboard UI** — today's lessons, task lists, per-child progress, Quran studies, needs-attention alerts, records proof
- **Design system** — Madinah green + sky blue palette (`forest-*`), Notion-style borderless cards, responsive layout
- **Responsive navigation** — hamburger menu on mobile, tab bar on desktop; sticky header with brand mark and Hijri date
- **Feature 01 — Parent sign-in** — magic-link email auth via NextAuth v5 + Resend; dev bypass; middleware protecting all routes
- **About page** — public-facing page with product vision, pain points, Wave 1 roadmap, and changelog
- **CI / deploy** — GitHub Actions pipeline; Render config; pre-commit hook with version bump script

### Patches (internal reference)
- `0.1.0` — Initial modular project structure
- `0.1.1` — Next.js stack, TypeScript types, API routes, Jest suite
- `0.1.2` — Dashboard redesign, STYLES.md, responsive nav, favicon
- `0.1.3` — Wave 1 feature specs and documentation
- `0.1.4` — Feature 01 parent sign-in (magic link, dev bypass, version header)
- `0.1.5–0.1.7` — About page, CHANGELOG.md, version bump fix, changelog correction
