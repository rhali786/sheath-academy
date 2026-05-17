# Wave 11 — Islamic calendar reminders

**Source:** FB-010
**Depends on:** Wave 0, Wave 10 complete

---

## Changes

- New `features/islamic-calendar/` directory.
- Built-in countdowns for: Ramadan, Eid al-Fitr, Eid al-Adha, Day of Arafah, Ashura, White Days (13th/14th/15th of each Hijri month), Sacred Months (Muharram, Rajab, Dhul-Qa'dah, Dhul-Hijjah).
- Support **custom Islamic date reminders** and **custom Gregorian date reminders**.
- Settings toggle per reminder type (checkboxes in Settings → Household or dedicated sub-tab).
- Surface enabled reminders on **Today dashboard**: e.g., "Ramadan begins in 23 days", "White Days begin tomorrow", "We are in Rajab, one of the sacred months."
- Allow reminders to interact with School Year and Planner where appropriate (Eid break, Ramadan light schedule).
- Hijri date: auto-calculated. Manual adjustment to come in a later wave.

---

## TDD

**Unit tests (`features/islamic-calendar/__tests__/api/`):**
- `getIslamicCalendarCountdowns(date: '2026-01-01')` → returns correct days-remaining for next Eid given a known test date (use a hardcoded fixture date with known expected result).
- White Days: given a Hijri month + year, returns correct Gregorian equivalents for the 13th, 14th, 15th.
- `isInSacredMonth(date)` → returns true during Rajab, false during Sha'ban.

**Integration tests (`features/islamic-calendar/__tests__/integration/`):**
- Render `IslamicCalendarCard` with `{ event: 'Ramadan', daysUntil: 23 }` → assert "Ramadan begins in 23 days" visible.
- Render `IslamicCalendarCard` with `daysUntil: 0` → assert "today" language visible.
- Render with reminder disabled in settings → assert that card is not rendered.

**Playwright (`e2e/dashboard.spec.ts`):**
- Navigate to Today → assert at least one Islamic calendar indicator is visible (any upcoming event).

---

## File index

| File | Change |
|------|--------|
| `features/islamic-calendar/` | New feature directory |
| `features/islamic-calendar/types.ts` | IslamicReminder, Countdown types |
| `features/islamic-calendar/server/service.ts` | Hijri calculations, countdown logic |
| `features/islamic-calendar/front/components/IslamicCalendarCard.tsx` | Countdown display |
| `features/dashboard/front/pages/Dashboard.tsx` | Surface IslamicCalendarCard on Today |
| `features/settings/front/components/HouseholdSettingsTab.tsx` | Add reminder toggles (extend Wave 1 work) |
| `features/islamic-calendar/__tests__/api/islamic-calendar.test.ts` | New |
| `features/islamic-calendar/__tests__/integration/IslamicCalendarCard.test.tsx` | New |
| `e2e/dashboard.spec.ts` | Islamic calendar indicator assertion |
