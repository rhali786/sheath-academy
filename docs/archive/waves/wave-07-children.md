# Wave 7 — Children sub-tab full refinement

**Source:** FB-002
**Bugs:** none
**Depends on:** Wave 0 complete

---

## Scope

Full implementation of transcript-safe learner records model in the Settings → Children/Learners tab.

---

## Changes

- Split "Child's name" into **First name*** + **Last name*** (both required).
- Add helper text: "Names entered here may appear on reports, transcripts, and exported records."
- Change **Grade/Level** from free text to structured dropdown: PK, K, Grade 1–12, Other/custom.
- Keep Date of Birth optional; show on learner card only when present, formatted cleanly (no raw ISO string).
- **Remove Teacher/Instructor** from child profile form and learner cards entirely. Instructor belongs at the course/enrollment level (Wave 8).
- Add **"Allow learner to sign in"** toggle. Show Username and Password fields only when enabled.
- On learner cards: replace raw username display with login status label: "Learner login: Enabled" / "Learner login: Not enabled."
- Rename **Edit** button → **Edit profile** on learner cards.
- Archive behavior clarity: archived learners keep records, are hidden from active planning by default, and can be restored.
- Add **"Show archived"** toggle with archived count displayed.

---

## TDD

**Unit tests (`features/children/__tests__/api/`):**
- `createStudent({ firstName, lastName, gradeLevel, ... })` → student stored with `firstName` and `lastName` as separate fields.
- `getStudentsByHousehold(householdId)` → returns students with `firstName` and `lastName`.
- `archiveStudentProfile(id)` → sets `isActive: false`; student excluded from active list by default.

**Integration tests (`features/children/__tests__/integration/`):**
- Render `ChildForm` → assert "First name" and "Last name" fields present as separate inputs.
- Render `ChildForm` → assert Grade/Level is a dropdown containing "PK", "K", "Grade 1" through "Grade 12", "Other/custom".
- Render `ChildForm` → assert no "Teacher/Instructor" field present.
- Toggle "Allow learner to sign in" off → assert Username and Password fields hidden.
- Toggle on → assert Username and Password fields visible.
- Render `ChildCard` with `{ firstName: 'Adam', lastName: 'Al-Rashid' }` → assert full name displayed.
- Render `ChildCard` with `learnerLoginEnabled: false` → assert "Learner login: Not enabled" label.
- Render `ChildCard` with `learnerLoginEnabled: true` → assert "Learner login: Enabled" label, no raw username.
- Render `ChildCard` → assert Edit button label is "Edit profile".

**Playwright (`e2e/settings.spec.ts`):**
- Navigate to `/settings`, open Children tab.
- Add a child with first name "Zayd" and last name "Al-Rashid" → assert card shows "Zayd Al-Rashid."
- Assert Grade dropdown contains "PK" option.
- Assert no Teacher field visible anywhere in the form.

---

## File index

| File | Change |
|------|--------|
| `features/children/types.ts` | Add `firstName`, `lastName`; remove `teacherName`; add `gradeLevel` enum |
| `features/children/server/service.ts` | Update to firstName/lastName |
| `features/children/server/seed.ts` | Update seed to use firstName/lastName |
| `features/children/front/components/ChildForm.tsx` | Split name; grade dropdown; learner login toggle |
| `features/children/front/components/ChildCard.tsx` | Full name; login status label; rename Edit button |
| `features/settings/front/pages/SettingsPage.tsx` | Wire updated child components |
| `features/children/__tests__/api/child.test.ts` | Extend |
| `features/children/__tests__/integration/ChildForm.test.tsx` | New/extend |
| `features/children/__tests__/integration/ChildCard.test.tsx` | New/extend |
| `e2e/settings.spec.ts` | Children tab assertions |
