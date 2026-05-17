# Wave 6 — Records export (print/PDF)

**Bug:** BUG-008
**Depends on:** Wave 0 complete (feature is now features/records/)

---

## BUG-008 — Export says prepared but nothing downloads

**Root cause:** The "Attendance Report" button opens a modal that tells the user to check their downloads, but no download fires.

**Decision:** Print/PDF flow via `window.print()`. Remove the misleading copy entirely.

**TDD:**

Unit:
- None needed — this is a UI interaction fix.

Integration (`RecordsSection.test.tsx`):
- Spy on `window.print`. Click "Attendance Report" button → assert `window.print` was called.
- Assert modal does NOT contain text "being prepared" or "check your downloads."
- Assert modal DOES contain a clear action label (e.g., "Print" or "Print attendance report").

Playwright (`e2e/reports.spec.ts`):
- Navigate to dashboard Records Readiness section (renamed in Wave 3).
- Click "Attendance Report."
- Assert `window.print` is called (or assert navigation to a printable records view).
- Assert no misleading "check your downloads" text appears.

---

## File index

| File | Change |
|------|--------|
| `features/records/front/components/AttendanceReportModal.tsx` | Replace misleading copy; wire `window.print()` |
| `features/dashboard/__tests__/integration/RecordsSection.test.tsx` | New/extend |
| `e2e/reports.spec.ts` | Extend |
