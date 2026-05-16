# BUG-010 — Planner week navigation does not change the displayed week

- **ID**: BUG-010
- **Status**: Open
- **Date/time**: 2026-05-15 22:50 (America/Detroit)
- **Environment**: Live Render site, Weekly Planner click-through
- **URL/path**: https://sheathacademy.onrender.com/planner
- **Area**: Planner
- **Steps to reproduce**:
  1. Open the Weekly Planner page.
  2. Note the displayed week range: May 11 – May 17, 2026.
  3. Click “← Previous.”
  4. Observe the week range and grid.
  5. Click “Next →.”
  6. Observe the week range and grid again.
- **Expected result**: Previous should move the planner to the prior week, and Next should move the planner to the following week. The displayed week range and lesson grid should update.
- **Actual result**: The week range remains stuck on May 11 – May 17, 2026, and the grid does not move to the previous or next week.
- **Notes**: This suggests the week navigation buttons are either not updating planner week state, or the state changes but does not trigger the displayed range/grid to re-render.
- **Attachments**:
