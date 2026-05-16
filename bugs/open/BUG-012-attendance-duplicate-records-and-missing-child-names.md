# BUG-012 — Attendance allows duplicate records and Records omits child names

- **ID**: BUG-012
- **Status**: Open
- **Date/time**: 2026-05-15 23:18 (America/Detroit)
- **Environment**: Live Render site, Attendance page click-through
- **URL/path**: https://sheathacademy.onrender.com/attendance
- **Area**: Attendance
- **Steps to reproduce**:
  1. Open Attendance.
  2. Keep the default child and date.
  3. Click “Present.”
  4. Click “Present” again without changing child/date.
  5. Change the attendance status to “Absent” for the same child/date.
  6. Click “Absent” more than once without changing child/date.
  7. Look at the Records section.
- **Expected result**: Attendance behaves like a daily record per child/date by updating the existing record, or it prevents duplicate records for the same child/date/status. The Records section should identify which child each record belongs to so official attendance history is auditable.
- **Actual result**: Additional attendance records can be added for the same child/date, including multiple absences. The Summary counts increase, and the Records section does not list the child name on each record.
- **Notes**: The old monolithic log only captured duplicate “Present” records. This per-bug file includes the additional details reported on 2026-05-16: duplicate “Absent” records and missing child names under Records. This can inflate attendance totals and makes the official attendance record ambiguous.
- **Attachments**:
