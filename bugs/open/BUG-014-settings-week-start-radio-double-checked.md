# BUG-014 — Week Starts On radio buttons can both appear checked

- **ID**: BUG-014
- **Status**: Open
- **Date/time**: 2026-05-15 23:30 (America/Detroit)
- **Environment**: Live Render site, Settings / Household tab click-through
- **URL/path**: https://sheathacademy.onrender.com/settings
- **Area**: Settings
- **Steps to reproduce**:
  1. Open Settings → Household.
  2. Under “Week Starts On,” select Sunday.
- **Expected result**: Radio buttons behave as a normal exclusive group: only one is checked at a time, and the UI clearly shows the new selection.
- **Actual result**: Both Monday and Sunday appear checked simultaneously after selecting Sunday, while the week-start update success message appears.
- **Notes**: This creates ambiguity about what the household week start actually is. The UI state is not trustworthy after the save/update action.
- **Attachments**:
