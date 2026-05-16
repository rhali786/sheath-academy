# BUG-001 — Dashboard setup prompt remains stuck on first lesson

- **ID**: BUG-001
- **Status**: Open
- **Date/time**: 2026-05-15 22:31 (America/Detroit)
- **Environment**: Live Render site, Dashboard / Today page
- **URL/path**: https://sheathacademy.onrender.com/
- **Area**: Dashboard
- **Steps to reproduce**:
  1. Open the Dashboard / Today page.
  2. Confirm that Today’s State shows lessons planned.
  3. Confirm that Do Today shows at least one lesson.
  4. Look at the setup strip near the top of the dashboard.
- **Expected result**: Once lessons exist, the setup prompt should move past “Plan your first lesson” and advance to the next missing setup step.
- **Actual result**: The setup strip still says “Plan your first lesson” and “Lesson planning is coming soon,” even though lessons already exist.
- **Notes**: Likely caused by setup status hardcoding `hasLessons: false`, `hasAttendance: false`, and `hasPortfolio: false` instead of reading real service data.
- **Attachments**:
