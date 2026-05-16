# BUG-003 — Needs Attention alert shows raw child ID

- **ID**: BUG-003
- **Status**: Open
- **Date/time**: 2026-05-15 22:31 (America/Detroit)
- **Environment**: Live Render site, Dashboard / Today page
- **URL/path**: https://sheathacademy.onrender.com/
- **Area**: Dashboard
- **Steps to reproduce**:
  1. Open the Dashboard / Today page.
  2. Look at the Needs Attention section.
  3. Find the Quran revision alert.
- **Expected result**: Child-specific alerts should display the learner’s name.
- **Actual result**: The alert displays the raw internal ID `student_seed_adam_001`.
- **Notes**: Likely caused by stale hardcoded child ID mapping in the alert item component.
- **Attachments**:
