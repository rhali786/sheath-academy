# BUG-002 — Dashboard child selector filtering is inconsistent

- **ID**: BUG-002
- **Status**: Open
- **Date/time**: 2026-05-15 22:31 (America/Detroit)
- **Environment**: Live Render site, Dashboard / Today page
- **URL/path**: https://sheathacademy.onrender.com/
- **Area**: Dashboard
- **Steps to reproduce**:
  1. Open the Dashboard / Today page.
  2. Use the top child selector and choose Adam.
  3. Scroll through Today’s State, Do Today, Needs Attention, Per-Child Progress, Quran Logging, and Records & Proof.
- **Expected result**: Dashboard sections should consistently respect the selected child, or clearly label which sections are household-wide.
- **Actual result**: Only some data is filtered. Quran Logging still shows all children, Per-Child Progress uses its own child selector, Records & Proof remains global, and top metrics remain global or hardcoded.
- **Notes**: The child selector is supposed to support All Children vs one selected child during the session. Filtering currently appears partial.
- **Attachments**:
