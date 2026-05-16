# BUG-006 — Quran Weekly Sessions chart does not reflect saved sessions

- **ID**: BUG-006
- **Status**: Open
- **Date/time**: 2026-05-15 22:31 (America/Detroit)
- **Environment**: Live Render site, Dashboard / Quran Weekly Sessions
- **URL/path**: https://sheathacademy.onrender.com/
- **Area**: Quran Logging
- **Steps to reproduce**:
  1. Open the Dashboard / Today page.
  2. Note the Weekly Sessions chart in the Quran, Arabic & Islamic Studies section.
  3. Log a new Quran session.
  4. Re-check the chart.
- **Expected result**: The chart should reflect actual Quran sessions, especially after a new session is saved.
- **Actual result**: The chart appears to use hardcoded/default chart data rather than the API-generated chart data.
- **Notes**: Dashboard loads session data but does not appear to pass API chart data into the chart component.
- **Attachments**:
