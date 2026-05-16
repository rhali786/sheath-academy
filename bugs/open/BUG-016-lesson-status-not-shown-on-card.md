# BUG-016 — Lesson status is saved but not shown on lesson card

- **ID**: BUG-016
- **Status**: Open
- **Date/time**: 2026-05-16 07:45 (America/Detroit)
- **Environment**: Live Render site, Lessons page
- **URL/path**: https://sheathacademy.onrender.com/lessons
- **Area**: Lessons
- **Steps to reproduce**:
  1. Open the Lessons page.
  2. Create or edit a lesson and set a status.
  3. Save the lesson.
  4. Return to the Lessons page list/card view.
  5. Look at the lesson card.
  6. Edit the same lesson again and observe the status field.
- **Expected result**: The lesson card should display the saved lesson status so parents can quickly see whether the lesson is planned, completed, missed, or in another saved state.
- **Actual result**: The lesson status does not show on the lesson card, even though the status is saved to the database and appears when editing the lesson.
- **Notes**: This appears to be a display/rendering gap rather than a persistence issue. The lesson card should read and render the saved status from the lesson record.
- **Attachments**:
