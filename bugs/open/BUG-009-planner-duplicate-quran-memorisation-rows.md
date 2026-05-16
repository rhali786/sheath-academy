# BUG-009 — Planner shows duplicate Quran Memorisation subject rows

- **ID**: BUG-009
- **Status**: Open
- **Date/time**: 2026-05-15 22:50 (America/Detroit)
- **Environment**: Live Render site, Weekly Planner page
- **URL/path**: https://sheathacademy.onrender.com/planner
- **Area**: Planner
- **Steps to reproduce**:
  1. Open the Weekly Planner page.
  2. Click the “Subjects (7)” filter.
  3. Look at the subject checkbox list.
  4. Close the filter and look at the weekly grid rows for Adam, Khadijah, and Zayd.
- **Expected result**: Each subject/course should appear once per learner unless the rows are clearly distinct courses with different labels.
- **Actual result**: “Quran Memorisation” appears twice in the subject filter and appears as duplicate rows for learners in the weekly grid. Some duplicate rows are empty while the other duplicate row contains lessons.
- **Notes**: This creates ambiguity for filtering, lesson placement, drag/drop, and parent trust. If these are separate course records, the UI needs distinct labels. If they are accidental duplicates, the duplicate rows should be prevented or merged.
- **Attachments**:
