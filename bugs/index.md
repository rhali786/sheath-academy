# Bug index

Use this file as the lightweight source for checking whether a bug is already tracked. Full details live in individual files under `bugs/open/` or `bugs/resolved/`.

## Workflow

1. Search this index first by area, title, and ID.
2. If a likely match exists, open that bug file and update it.
3. If no match exists, create the next `BUG-###` file under `bugs/open/` using `bugs/template.md`.
4. Add or update the row in this index.
5. Move files from `bugs/open/` to `bugs/resolved/` when the bug is verified fixed.

## Open bugs

| ID | Status | Area | Title | File |
|---|---|---|---|---|
| BUG-001 | Open | Dashboard | Setup prompt remains on first lesson despite lessons existing | `bugs/open/BUG-001-dashboard-setup-prompt-stuck.md` |
| BUG-002 | Open | Dashboard | Child selector filtering is inconsistent across dashboard sections | `bugs/open/BUG-002-dashboard-child-selector-filtering-inconsistent.md` |
| BUG-003 | Open | Dashboard | Needs Attention alert shows raw child ID | `bugs/open/BUG-003-dashboard-alert-shows-raw-child-id.md` |
| BUG-004 | Open | Dashboard | Needs Attention sort by date does not change order | `bugs/open/BUG-004-dashboard-date-sort-no-op.md` |
| BUG-005 | Open | Quran Logging | Newly saved Quran session does not appear on child card | `bugs/open/BUG-005-quran-session-card-not-latest.md` |
| BUG-006 | Open | Quran Logging | Weekly Sessions chart does not reflect saved Quran sessions | `bugs/open/BUG-006-quran-weekly-chart-hardcoded.md` |
| BUG-007 | Open | Dashboard | Today metrics appear hardcoded or mismatched | `bugs/open/BUG-007-dashboard-metrics-hardcoded-mismatched.md` |
| BUG-008 | Open | Reports | Attendance Report says download is prepared but no export occurs | `bugs/open/BUG-008-attendance-report-no-export.md` |
| BUG-009 | Open | Planner | Quran Memorisation appears as duplicate subject rows | `bugs/open/BUG-009-planner-duplicate-quran-memorisation-rows.md` |
| BUG-010 | Open | Planner | Week navigation buttons do not change the planner week | `bugs/open/BUG-010-planner-week-navigation-stuck.md` |
| BUG-011 | Open | Lessons | Today section only shows first child’s lesson | `bugs/open/BUG-011-lessons-today-first-child-only.md` |
| BUG-012 | Open | Attendance | Duplicate attendance records and missing child names | `bugs/open/BUG-012-attendance-duplicate-records-and-missing-child-names.md` |
| BUG-013 | Open | Attendance | Missing days metric is not shown in attendance summary | `bugs/open/BUG-013-attendance-missing-days-metric.md` |
| BUG-014 | Open | Settings | Week Starts On radio buttons can both appear checked | `bugs/open/BUG-014-settings-week-start-radio-double-checked.md` |
| BUG-015 | Open | Child Archive | Archived child related data remains visible or active | `bugs/open/BUG-015-archived-child-related-data-persists.md` |
| BUG-016 | Open | Lessons | Lesson status is saved but not shown on lesson card | `bugs/open/BUG-016-lesson-status-not-shown-on-card.md` |

## Notes

`bugs/bug-log.md` has been migrated away from as the source of truth. Keep this index small, and keep full bug details in one file per bug.
