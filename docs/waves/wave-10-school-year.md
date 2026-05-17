# Wave 10 — School Year Settings as academic calendar foundation

**Source:** FB-009
**Depends on:** Wave 0, Wave 9 complete

---

## Changes

- **Active school year card** at top: show name, Gregorian + Hijri start/end dates, day count, week count. Example: "Day 72 of 180 planned school days · Week 15 of 36."
- Prefill current active year when editing.
- Clearly distinguish: Edit active year / Create new year / Create next year.
- Add **required school days** and/or **required instructional hours** fields.
- Add **tracking method** selector: Days only / Hours only / Days + hours / Flexible.
- Add **breaks and holidays**: Eid break, Ramadan light schedule, winter break, custom off days, make-up days.
- Add **terms/reporting periods**: Full year only, Semesters, Quarters, Trimesters, Custom.
- Add **school day counting rules** and week numbering rules.
- Add **live academic-year preview** before saving: planned school days, required days, weeks remaining, target status (On track / At risk / Behind).
- Add **compliance note**: location/state requirements surfaced with "informational only, not legal advice" disclaimer.
- Add **planned school days calculator**: derived from start/end dates + household school days + breaks.
- Allow school year to inherit household school days or customize for this year only.

---

## TDD

**Unit tests (`features/school-year/__tests__/api/`):**
- `calculatePlannedSchoolDays({ startDate: '2025-09-01', endDate: '2026-06-30', schoolDays: ['mon','tue','wed','thu','fri'], breaks: [] })` → correct weekday count.
- Add a 5-day Eid break → day count decreases by 5.
- `getSchoolYearProgress(schoolYearId)` → returns `{ dayNumber, totalDays, weekNumber, totalWeeks }`.

**Integration tests (`features/school-year/__tests__/integration/`):**
- Render school year card → assert "Day X of Y" text visible with real values.
- Render form → add a break (Eid) → live preview updates day count.
- Render form → assert tracking method selector contains "Days only", "Hours only", "Days + hours", "Flexible."
- Render form with existing year → assert fields pre-filled with current values.

**Playwright (`e2e/settings.spec.ts`):**
- Navigate to `/settings`, open School Year tab → assert day count card is visible.
- Add a break → assert preview day count decreases.

---

## File index

| File | Change |
|------|--------|
| `features/school-year/types.ts` | Add `requiredDays`, `requiredHours`, `trackingMethod`, `breaks[]`, `terms[]` |
| `features/school-year/server/service.ts` | `calculatePlannedDays()`, `getSchoolYearProgress()` |
| `features/school-year/front/components/SchoolYearCard.tsx` | Day/week progress display |
| `features/school-year/front/components/SchoolYearForm.tsx` | New fields + live preview |
| `features/school-year/front/components/BreakManager.tsx` | New — add/edit/remove breaks |
| `features/school-year/__tests__/api/school-year.test.ts` | New/extend |
| `features/school-year/__tests__/integration/SchoolYearForm.test.tsx` | New/extend |
| `e2e/settings.spec.ts` | School Year tab assertions |
