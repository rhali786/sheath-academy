# Wave 8 — Subjects/Courses sub-tab full refinement

**Source:** FB-003
**Bugs:** none (BUG-009 dedup handled in Wave 5)
**Depends on:** Wave 0, Wave 7 complete

---

## Scope

Full implementation of a course/enrollment management model in Settings → Subjects/Courses tab.

---

## Changes

- Rename form label "Subject name" → **Course / Subject name**.
- Add optional **Instructor/Teacher** field at the course level (removed from child profile in Wave 7).
- Add optional **Level/Grade** field: e.g., Grade 5, Algebra I, Arabic Level 2, Quran Revision.
- Associate courses with a **School Year**.
- Replace child-tab-only assignment model with **Learner multi-select** inside the course form. Supports one learner, multiple learners, or all learners.
- Support **shared/family courses** without duplicate rows (one record, multiple learners).
- Update **All Subjects table** → Course/Enrollment management table. Columns: Learner(s), Course/Subject, Category, Level/Grade, School Year, Instructor, Status, Actions.
- For shared courses: show one row with learner chips (e.g., Adam, Khadijah) rather than two rows.
- Fix **category formatting**: "IslamicStudies" → "Islamic Studies."
- Expand **category list**: Quran, Arabic, Islamic Studies, Math, English/ELA, Reading, Writing, Science, History, Social Studies, Geography, Art, PE/Health, Technology, Nature Study, Logic, Life Skills, Civics, Economics, Handwriting, Vocabulary/Spelling, Foreign Language, Other/Custom.
- Keep Quran, Arabic, Islamic Studies as **first-class categories** — not "Other."
- Add **custom category** input field when "Other/Custom" is selected.
- Archive behavior: archived courses keep records, are hidden from active planning by default, restorable.
- Standardize spelling: **"Quran Memorization"** (US English consistently).

---

## TDD

**Unit tests (`features/subjects/__tests__/api/`):**
- `createSubject({ learnerIds: ['A', 'B'], courseName, category })` → one subject record enrolled for two learners.
- `getSubjectsByLearner(childId)` → returns only subjects where that childId is in `learnerIds`.
- `getSubjectsByLearner` returns "IslamicStudies" category formatted as "Islamic Studies."

**Integration tests (`features/subjects/__tests__/integration/`):**
- Render `SubjectForm` → assert "Course / Subject name" label.
- Render `SubjectForm` → assert Learner(s) multi-select present.
- Render `SubjectForm` → assert category dropdown contains "Quran" as first option.
- Render `SubjectForm` → assert category dropdown contains "Arabic", "Islamic Studies."
- Render `SubjectForm` → select "Other/Custom" → assert custom category input appears.
- Render `SubjectTable` with one shared subject (Adam + Khadijah) → assert table shows one row, not two.
- Render `SubjectTable` → assert learner chips ("Adam", "Khadijah") visible on shared row.
- Render `SubjectTable` → assert "Islamic Studies" displays correctly (not "IslamicStudies").

**Playwright (`e2e/settings.spec.ts`):**
- Navigate to `/settings`, open Subjects tab.
- Create a course shared between two learners → assert table shows one row with two learner chips.
- Assert category dropdown shows "Quran" at the top of the list.

---

## File index

| File | Change |
|------|--------|
| `features/subjects/types.ts` | Add `instructorName`, `level`, `schoolYearId`, `learnerIds: string[]` |
| `features/subjects/server/service.ts` | Enrollment model; dedup; category formatting |
| `features/subjects/server/seed.ts` | Update seed: correct categories, no duplicate records |
| `features/subjects/front/components/SubjectForm.tsx` | Learner multi-select; new fields; category list |
| `features/subjects/front/components/SubjectTable.tsx` | Enrollment management table; learner chips |
| `features/settings/front/pages/SettingsPage.tsx` | Wire updated subject components |
| `features/subjects/__tests__/api/subject.test.ts` | Extend |
| `features/subjects/__tests__/integration/SubjectForm.test.tsx` | New/extend |
| `features/subjects/__tests__/integration/SubjectTable.test.tsx` | New/extend |
| `e2e/settings.spec.ts` | Subjects tab assertions |
