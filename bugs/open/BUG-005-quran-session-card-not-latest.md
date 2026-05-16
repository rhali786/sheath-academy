# BUG-005 — Quran session card does not show newly saved session

- **ID**: BUG-005
- **Status**: Open
- **Date/time**: 2026-05-15 22:31 (America/Detroit)
- **Environment**: Live Render site, Dashboard / Quran Logging click-through
- **URL/path**: https://sheathacademy.onrender.com/
- **Area**: Quran Logging
- **Steps to reproduce**:
  1. Open the Dashboard / Today page.
  2. In Quran Logging, click Adam’s “Log Session.”
  3. Change the session details, such as Surah to “Al-Fatiha.”
  4. Save the session.
  5. Look at Adam’s Quran Logging card again.
- **Expected result**: Adam’s card should show the newly saved/latest Quran session.
- **Actual result**: Adam’s card continues to show the older seed session, such as Al-Mulk 1–5, Revision, Last: 2 days ago.
- **Notes**: Confirmed by click-through. Likely caused by displaying the first matching session instead of the newest session after appending a new one.
- **Attachments**:
