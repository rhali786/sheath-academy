# BUG-015 — Archived child related data remains visible or active

- **ID**: BUG-015
- **Status**: Open
- **Date/time**: 2026-05-16 07:35 (America/Detroit)
- **Environment**: Live Render site, child archive flow
- **URL/path**: https://sheathacademy.onrender.com/settings
- **Area**: Child Archive
- **Steps to reproduce**:
  1. Open the area where children can be archived.
  2. Archive a child who already has related records, such as lessons, attendance, Quran sessions, planner rows, or records/proof data.
  3. Return to dashboard, planner, attendance, lessons, Quran logging, reports, and other child-scoped sections.
  4. Look for data belonging to the archived child.
- **Expected result**: Archiving a child should consistently archive or hide all child-scoped related data with that child. Restoring/unarchiving the child should restore visibility of the child and the related child-scoped data together, unless a section explicitly supports viewing archived records.
- **Actual result**: The child can be archived, but related child data persists in the app and remains visible or active in child-scoped areas.
- **Notes**: Related records should follow the child archive state rather than remaining independently active. The fix should define one archive cascade policy for all child-owned data and apply it consistently across services and UI queries.
- **Attachments**:
