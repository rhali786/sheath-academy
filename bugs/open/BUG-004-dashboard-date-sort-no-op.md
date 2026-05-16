# BUG-004 — Needs Attention sort by date does not change order

- **ID**: BUG-004
- **Status**: Open
- **Date/time**: 2026-05-15 22:31 (America/Detroit)
- **Environment**: Live Render site, Dashboard / Today page
- **URL/path**: https://sheathacademy.onrender.com/
- **Area**: Dashboard
- **Steps to reproduce**:
  1. Open the Dashboard / Today page.
  2. In Needs Attention, change the sort dropdown from “By Priority” to “By Date.”
  3. Observe the order of alert cards.
- **Expected result**: “By Date” should sort alerts by date, or the option should be hidden/disabled until date sorting exists.
- **Actual result**: “By Date” does not change sorting behavior.
- **Notes**: Current alert data does not appear to include a date field, so this option is exposed before the behavior exists.
- **Attachments**:
