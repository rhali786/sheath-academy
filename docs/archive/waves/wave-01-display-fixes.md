# Wave 1 — Display fixes + Household Settings expansion

**Bugs:** BUG-003, BUG-004, BUG-014, BUG-016
**Feedback:** FB-007
**Depends on:** Wave 0 complete

---

## BUG-003 — Needs Attention shows raw child ID

**Root cause:** Alert item renders `alert.childId` directly instead of resolving the name from children context.

**TDD:**
- Integration (`NeedsAttentionCard.test.tsx`): render with `childId: 'student_seed_adam_001'` and children context `{ id: 'student_seed_adam_001', name: 'Adam' }`. Assert rendered text is "Adam", not the raw ID.
- Playwright (`e2e/dashboard.spec.ts`): navigate to `/`, assert no text matching `/student_seed_.*_\d{3}/` exists anywhere on page.

**Implementation:** `children.find(c => c.id === alert.childId)?.name ?? alert.childId`

---

## BUG-004 — Sort by date (implement)

**Decision:** Implement — add `date: string` (ISO) field to alert items.

**TDD:**
- Unit: `sortAlerts(alerts, 'date')` returns alerts sorted oldest→newest.
- Integration: render two alerts with different dates, select "By Date" → assert order is date-ascending.
- Playwright: select "By Date" sort → assert first card has earlier date than second.

**Implementation:** Add `date` to alert item type; populate from alert source data; wire sort.

---

## BUG-014 + FB-007 — Week Starts On radio fix + Household Settings expansion

**BUG-014 root cause:** `defaultValue` used instead of `value` on radio input — uncontrolled.

**BUG-014 TDD:**
- Integration: render settings with `weekStart: 'monday'` → Monday checked, Sunday not.
  Click Sunday → Sunday checked, Monday not. Save → only Sunday checked after update.
- Playwright (`e2e/settings.spec.ts`): select Sunday, assert only one radio checked after toast.

**FB-007 additions (same files):**
- Expand `weekStart` to all 7 days.
- Add **Default School Days** checkboxes (Mon–Sun).
- Add **Day-load preference** per day: Off, Light, Normal, Heavy.
- Add optional **Homeschool / School reporting name** field.
- Add **Timezone** selector.
- Add **Date Display** preference: Gregorian only / Gregorian + English Hijri / Full bilingual.
- Add optional **Jumu'ah protected time** fields: leave window, return window.
- Add **unsaved-change warning** on navigate away.
- Organize page into sections: Household Identity, Weekly Rhythm, Protected Time, Calendar & Time.

**FB-007 TDD:**
- Integration: render expanded form → assert 7 weekday checkboxes present.
- Integration: set day-load for Monday → save → assert preference persists in response.
- Integration: set reporting name → save → assert stored.
- Integration: set Jumu'ah window → save → assert stored.
- Integration: navigate away with unsaved changes → assert warning prompt appears.
- Playwright: navigate to `/settings → Household`, assert Date Display selector exists.

---

## BUG-016 — Lesson status not shown on card

**Root cause:** Lesson card renders lesson fields but omits `status`.

**TDD:**
- Integration (`LessonCard.test.tsx`): `status: 'completed'` → "Completed" badge visible.
- Integration: `status: 'missed'` → "Missed" badge visible.
- Integration: `status: 'planned'` → "Planned" badge visible.
- Playwright (`e2e/planner.spec.ts`): navigate to `/lessons`, find lesson card, assert status badge present.

**Implementation:** `STATUS_LABELS` map + Tailwind color classes per status value.

---

## File index

| File | Change |
|------|--------|
| `features/dashboard/front/components/NeedsAttentionCard.tsx` | Resolve child name from context |
| `features/dashboard/__tests__/integration/NeedsAttentionCard.test.tsx` | New/extend |
| `features/settings/front/components/HouseholdSettingsTab.tsx` | Fix radio + expand FB-007 fields |
| `features/settings/server/service.ts` | Add new household fields |
| `features/household/types.ts` | Expand with new fields |
| `features/settings/__tests__/integration/HouseholdSettingsTab.test.tsx` | New/extend |
| `features/plan/front/components/LessonCard.tsx` | Add status badge (path updated after Wave 0) |
| `features/plan/__tests__/integration/LessonCard.test.tsx` | New/extend |
| `e2e/dashboard.spec.ts` | Raw ID assertion |
| `e2e/settings.spec.ts` | Radio fix + household expansion assertions |
| `e2e/planner.spec.ts` | Lesson status badge assertion |
