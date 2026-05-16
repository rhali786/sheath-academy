# BUG-007 — Dashboard Today metrics appear hardcoded or mismatched

- **ID**: BUG-007
- **Status**: Open
- **Date/time**: 2026-05-15 22:31 (America/Detroit)
- **Environment**: Live Render site, Dashboard / Today metrics
- **URL/path**: https://sheathacademy.onrender.com/
- **Area**: Dashboard
- **Steps to reproduce**:
  1. Open the Dashboard / Today page.
  2. Compare Today’s State metrics against visible page sections.
  3. Compare Needs Attention count, attendance count, Quran count, and records/proof data.
- **Expected result**: Summary metrics should be computed from the same live data used by the page sections, or clearly marked as placeholders.
- **Actual result**: Several metrics appear hardcoded or mismatched. For example, Need Attention can show 2 while more visible attention cards are shown, and Attendance Ready can differ from Records & Proof attendance.
- **Notes**: The lessons planned metric was made dynamic, but several other summary fields appear to remain hardcoded.
- **Attachments**:
