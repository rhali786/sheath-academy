# Wave 9 — Settings architecture reorganization

**Source:** FB-008
**Depends on:** Waves 0, 7, 8 complete

---

## Scope

Reorganize the Settings page sub-tabs to align with the confirmed top-level tab structure and prepare for future growth.

---

## New Settings sub-tab structure

| Sub-tab | Contents |
|---------|----------|
| Household | Identity, reporting name, week rhythm, protected time, Jumu'ah, timezone, date display (expanded in Wave 1) |
| School Year | Academic calendar, required days/hours, tracking method, breaks (expanded in Wave 10) |
| Learners | Replaces "Children" (implemented in Wave 7) |
| Courses | Replaces "Subjects" (implemented in Wave 8) |
| Planning Defaults | Planning style, workload thresholds, carry-forward behavior, light/normal/heavy day definitions |
| Records & Compliance | Attendance tracking preference, days vs hours, export format defaults |
| Access & Privacy | Learner login permissions, data export, archive/delete household |

---

## Changes

- Rename sub-tab labels in the Settings nav: "Children" → **Learners**, "Subjects" → **Courses**.
- Add new sub-tab: **Planning Defaults** with workload threshold fields, planning style selector, carry-forward behavior setting.
- Add new sub-tab: **Records & Compliance** with attendance tracking method, days vs hours setting, export format preference.
- Add new sub-tab: **Access & Privacy** with learner login management, data export option, archive household option.
- Settings should not duplicate Plan, Records, Growth, or Resources workflows — it defines how they behave.

---

## TDD

**Integration tests (`features/settings/__tests__/integration/`):**
- Render `SettingsPage` → assert tab labels include "Learners", "Courses", "Planning Defaults", "Records & Compliance", "Access & Privacy."
- Render `SettingsPage` → assert tab labels do NOT include "Children" or "Subjects" (or both old and new if friendly aliases are kept — clarify).
- Render `PlanningDefaultsTab` → assert workload threshold field present (e.g., "Maximum lessons per day").
- Render `PlanningDefaultsTab` → assert carry-forward behavior selector present.
- Render `RecordsComplianceTab` → assert tracking method selector present.
- Render `AccessPrivacyTab` → assert learner login management section visible.

**Playwright (`e2e/settings.spec.ts`):**
- Navigate to `/settings` → assert sub-tab nav contains "Planning Defaults."
- Click "Planning Defaults" → assert threshold input is visible.

---

## File index

| File | Change |
|------|--------|
| `features/settings/front/pages/SettingsPage.tsx` | Update tab labels; add new tab components |
| `features/settings/front/components/PlanningDefaultsTab.tsx` | New |
| `features/settings/front/components/RecordsComplianceTab.tsx` | New |
| `features/settings/front/components/AccessPrivacyTab.tsx` | New |
| `features/settings/server/service.ts` | Extend to store planning defaults, compliance defaults |
| `features/settings/__tests__/integration/SettingsPage.test.tsx` | New/extend |
| `e2e/settings.spec.ts` | Tab navigation assertions |
