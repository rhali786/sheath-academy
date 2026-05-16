# BUG-011 — Lessons Today section only shows the first child's lesson

- **ID**: BUG-011
- **Status**: Open
- **Date/time**: 2026-05-15 23:05 (America/Detroit)
- **Environment**: Live Render site, Lessons page
- **URL/path**: https://sheathacademy.onrender.com/lessons
- **Area**: Lessons
- **Steps to reproduce**:
  1. Open the Lessons page.
  2. Scroll to the “Today” section.
  3. Compare the Today section with the “All lessons” list below it.
  4. Notice that the page has lessons for multiple children, but the Today section only shows the first child’s lesson for today.
- **Expected result**: The Today section should show all lessons due today across children, or clearly provide a child selector/filter that controls which child’s today lessons are being shown.
- **Actual result**: The Today section only shows Adam’s Friday lesson. The All lessons list includes multiple children, but Today is effectively scoped to the first loaded child.
- **Notes**: This appears to be caused by the Lessons page rendering the Today lesson card with `childId={children[0].id}`. That makes the Today section hardcoded to the first child instead of the actual page scope.
- **Attachments**:
