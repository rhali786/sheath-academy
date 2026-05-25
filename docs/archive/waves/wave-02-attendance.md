# Wave 2 — Attendance integrity + compliance engine

**Bugs:** BUG-012, BUG-013
**Feedback:** FB-014
**Depends on:** Wave 0 complete

---

## BUG-012 — Duplicate records + missing child names

**Two issues:**
1. Service does not upsert — same `childId + date` creates a new record each submission.
2. Records list UI omits child name.

**TDD:**
- Unit: `createOrUpdateAttendance({childId, date, status})` called twice same child/date → store has exactly 1 record; second call updates, does not insert.
- Unit: different children, same date → 2 records (both valid).
- Integration: submit Present twice same child/date → records list shows exactly 1 row.
- Integration: records list renders child name column (not UUID).
- Playwright (`e2e/attendance.spec.ts`): mark Present twice → assert only 1 record; assert row contains learner name text.

---

## BUG-013 — Missing days metric

**Decision:** Mon–Fri only within school year start/end range. No holiday awareness in this wave.

**TDD:**
- Unit: school year Sep 1 – Jun 30, 5 records through today → `getAttendanceSummary(childId)` returns `missingDays = weekdaysElapsed - recordCount`.
- Unit: record for every elapsed weekday → `missingDays: 0`.
- Integration: render `AttendanceSummary` with `missingDays: 3` → assert "3" visible under Missing label.
- Playwright: navigate to `/records/attendance` (path after Wave 0), assert Summary shows Missing metric.

---

## FB-014 — Attendance as records/compliance engine (MVP scope)

**Changes (same wave, same files):**
- Rename **Child → Learner** across all attendance UI text.
- **Date defaults to today** in the attendance form.
- Add **daily batch attendance mode**: list all active learners, mark statuses at once.
- Add quick actions: **Mark all present**, **Mark all absent**, **Copy previous school day**.
- Expand status options: Present, Absent, Partial, Excused absence, Sick day, Holiday/break, Field trip, Co-op day, Makeup day, Not a school day.
- Add **attendance type/context**: Regular, Field trip, Co-op, Tutor, Masjid, Project day, Life skills.
- Add **reason templates** per status (sick, appointment, travel, religious holiday, etc.).
- Add **filters**: Today, This week, This month, This school year, Custom range, Learner, Status.
- Replace Delete with **Archive/Void** with confirmation dialog.
- Add **export actions**: Print attendance log (`window.print()`), Export CSV.
- Add compliance progress: "X of Y configured school days complete."
- Inherit tracking method from school year settings (days only / hours only / days+hours / flexible).
- Add **unsaved-change warning** on navigate away.

**FB-014 TDD:**
- Integration: render form → date field defaults to today.
- Integration: render batch mode → all active learners shown.
- Integration: click "Mark all present" → all learner statuses set to Present.
- Integration: status dropdown includes "Field trip", "Co-op day" options.
- Integration: Delete button → confirm dialog appears; record archived not hard-deleted.
- Integration: filter by learner → only that learner's records shown.
- Playwright: open `/records/attendance`, use batch mode mark all present → assert all rows show Present.

---

## File index

| File | Change |
|------|--------|
| `features/attendance/server/service.ts` | Upsert logic + missingDays calculation |
| `features/attendance/api/routes/attendance.ts` | Wire upsert; add batch route |
| `features/attendance/types.ts` | Add `missingDays`, expand status enum, add type/reason fields |
| `features/attendance/front/components/AttendanceSummary.tsx` | Render missingDays metric |
| `features/attendance/front/components/AttendanceList.tsx` | Child name column, filters, safe delete |
| `features/attendance/front/components/AttendanceForm.tsx` | Date default, Learner label |
| `features/attendance/front/components/BatchAttendanceForm.tsx` | New — batch entry for all learners |
| `features/attendance/front/pages/AttendancePage.tsx` | Wire new components |
| `features/school-year/server/service.ts` | Read-only: verify date range API |
| `features/attendance/__tests__/api/attendance-service.test.ts` | New/extend |
| `features/attendance/__tests__/integration/AttendancePage.test.tsx` | Extend |
| `e2e/attendance.spec.ts` | Extend |
