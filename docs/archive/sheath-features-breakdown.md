# Sheath Academy — Feature Breakdown

A working spec for splitting the monolithic dashboard into independent features. Each feature owns its own data table(s), API router, page, and dashboard widget.

---

## The 6 features

| # | Feature | Page | Dashboard widget | Primary table(s) |
|---|---|---|---|---|
| 1 | **Lessons & Tasks** | Weekly planner; assign work by child & subject | "Do Today" checklist grouped by child | `lessons`, `task_completions` |
| 2 | **Quran** | Per-child surah ledger, session history, streaks | "Quran Logging" cards + streak ring | `quran_sessions`, `quran_assignments` |
| 3 | **Attendance** | Daily roll, calendar grid, regulatory exports | "Attendance Ready" KPI tile | `attendance_days` |
| 4 | **Progress & Reports** | Subject mastery charts, weekly/quarterly reports | Subject completion bar chart | `progress_snapshots`, `reports` |
| 5 | **Portfolio** | Evidence library — photos, writing, uploads tagged by subject | "Portfolio Items" KPI tile | `portfolio_items` |
| 6 | **Alerts** | Full triage list with snooze, dismiss, history | "Needs Attention" sidebar list | `alerts` |

---

## Why these 6 (and not more)

**Tasks vs. Quran are separate even though Quran shows up in the task list.** A task is binary: did the child do the thing today, yes/no. A Quran session has surah, ayah range, type (new memorization / revision / recitation), tajweed notes, and a last-reviewed date driving spaced-repetition prompts. Forcing Quran into the task table cripples the streak and revision-cycle logic. PowerSchool keeps gradebook and standards mastery separate for the same reason.

**Attendance is its own feature because in most US states homeschool attendance is a legal artifact** — 180 days, exportable, immutable once submitted. It must not depend on whether tasks were checked off.

**Alerts is a feature, not a UI element.** It has its own rules engine reading from every other feature ("Quran not logged in 2 days," "Friday attendance missing," "Portfolio thin"). Its own table lets you snooze, dismiss, and audit alerts without touching source data.

**Portfolio is the IXL-style "show your work" layer** — photos and writing samples that prove learning happened. Required by regulators in portfolio-review states (PA, NY). Totally different shape from tasks: file uploads, captions, subject tags, date captured.

---

## What's NOT a feature

**Students** — a setup/profile concern, not a feature. It's the dimension every feature joins on. Lives in `lib/` or a thin `students` module, but doesn't earn its own page or widget. Configure once in Settings.

**Records & Proof** (the bottom section of your current dashboard) — not a feature. It's an aggregator page that lists each feature's export endpoint. Once features 3, 4, 5, and 2 exist, this page is a thin composition of their `exportable` summaries. No separate table.

**Dashboard** — becomes a composition, not a feature. After extraction, `features/dashboard/` should hold only the page shell, the KPI strip, and the layout that arranges widgets exported from each feature. Each widget imports from its own feature's public API (e.g. the Quran widget calls `features/quran/api`, not a shared dashboard router). That's the architectural win.

---

## Suggested build order

1. **Lessons & Tasks** — biggest surface area, highest daily use. Get this clean first.
2. **Quran** — extract next; it's the most distinct data shape and the family's daily anchor.
3. **Attendance** — small, self-contained, regulatory value.
4. **Alerts** — needs the above three to have meaningful rules to run.
5. **Portfolio** — file uploads add complexity; defer until the rest is stable.
6. **Progress & Reports** — read-only over the other features; build last.

---

## Open questions

- Do you need a separate **Subjects** taxonomy table, or are subject names hardcoded? (Quran, Arabic, Math, Reading, Islamic Studies, Science, English, History visible on dashboard.)
- Per-state regulatory requirements — which state are you in? Affects whether Attendance and Portfolio have hard exports vs. nice-to-haves.
- Multi-parent access — is this single-user (mom logs everything) or shared (mom + dad both edit)?
