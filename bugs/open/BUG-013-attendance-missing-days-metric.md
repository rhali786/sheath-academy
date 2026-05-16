# BUG-013 — Attendance summary does not show missing days metric

- **ID**: BUG-013
- **Status**: Open
- **Date/time**: 2026-05-15 23:18 (America/Detroit)
- **Environment**: Live Render site, Attendance page
- **URL/path**: https://sheathacademy.onrender.com/attendance
- **Area**: Attendance
- **Steps to reproduce**:
  1. Open Attendance.
  2. Look at the Summary section.
- **Expected result**: Summary should include the intended “missing days” metric for the selected child/year, or clearly indicate that missing-day detection is not implemented yet.
- **Actual result**: Summary only shows Present / Absent / Partial counts; there is no “missing days” metric displayed.
- **Notes**: Feature 23’s acceptance criteria says the parent can see attendance count and missing days for the selected child/year. Current summary service and UI only count statuses.
- **Attachments**:
