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
| BUG-001 | Open | Dashboard | Setup prompt remains on first lesson despite lessons existing | `bugs/bug-log.md` |
| BUG-002 | Open | Dashboard | Child selector filtering is inconsistent across dashboard sections | `bugs/bug-log.md` |
| BUG-003 | Open | Dashboard | Needs Attention alert shows raw child ID | `bugs/bug-log.md` |
| BUG-004 | Open | Dashboard | Needs Attention sort by date does not change order | `bugs/bug-log.md` |
| BUG-005 | Open | Quran Logging | Newly saved Quran session does not appear on child card | `bugs/bug-log.md` |
| BUG-006 | Open | Quran Logging | Weekly Sessions chart does not reflect saved Quran sessions | `bugs/bug-log.md` |
| BUG-007 | Open | Dashboard | Today metrics appear hardcoded or mismatched | `bugs/bug-log.md` |
| BUG-008 | Open | Reports | Attendance Report says download is prepared but no export occurs | `bugs/bug-log.md` |
| BUG-009 | Open | Planner | Quran Memorisation appears as duplicate subject rows | `bugs/bug-log.md` |
| BUG-010 | Open | Planner | Week navigation buttons do not change the planner week | `bugs/bug-log.md` |
| BUG-011 | Open | Lessons | Today section only shows first child’s lesson | `bugs/bug-log.md` |
| BUG-012 | Open | Attendance | Duplicate attendance records and missing child names | `bugs/open/BUG-012-attendance-duplicate-records-and-missing-child-names.md` |
| BUG-013 | Open | Attendance | Missing days metric is not shown in attendance summary | `bugs/bug-log.md` |
| BUG-014 | Open | Settings | Week Starts On radio buttons can both appear checked | `bugs/bug-log.md` |
| BUG-015 | Open | Child Archive | Archived child related data remains visible or active | `bugs/bug-log.md` |
| BUG-016 | Open | Lessons | Lesson status is saved but not shown on lesson card | `bugs/open/BUG-016-lesson-status-not-shown-on-card.md` |

## Notes

The original monolithic history remains in `bugs/bug-log.md`. New and substantially updated bugs should use one file per bug to reduce token use, avoid large-file rewrites, and make future updates safer.
