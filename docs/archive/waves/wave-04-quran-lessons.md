# Wave 4 — Quran data flow + Lessons page improvements

**Bugs:** BUG-005, BUG-006, BUG-011
**Feedback:** FB-011
**Depends on:** Wave 0 complete

---

## Architecture note

`features/plan/` (renamed from `features/planner/`) owns the lesson data, store, and API.
`/lessons` is a separate route at `app/(shell)/lessons/page.tsx` — it stays at `/lessons`.
Do not move `/lessons` under `/plan`. They are separate routes calling the same API.

---

## BUG-005 — Quran session card shows stale seed data

**Root cause:** Service returns `filter(...)[0]` — first match, not newest.

**TDD:**
- Unit: two sessions for child A (older: Al-Mulk 1–5, newer: Al-Fatiha) → `getLatestQuranSession(childId)` returns Al-Fatiha session (newest by date).
- Integration: `QuranLoggingCard` with mocked latest session → card displays newest session data.
- Playwright (`e2e/dashboard.spec.ts`): log new session, navigate back to Today → card shows new session, not seed data.

**Implementation:** Sort sessions by `date` desc, return first result.

---

## BUG-006 — Weekly Sessions chart hardcoded

**Root cause:** API response chart data is loaded but a hardcoded default array is passed to the chart component instead.

**TDD:**
- Integration: render `QuranLoggingSection` with mocked API returning 3 sessions this week → chart `data` prop contains 3 entries, not the hardcoded default.
- Playwright: log a Quran session, navigate back → chart bar updates for today's date.

**Implementation:** Pass API chart data directly to chart component; remove hardcoded fallback.

---

## BUG-011 — Today section shows only first child's lesson

**Root cause:** Lessons page renders Today card with `childId={children[0].id}` — hardcoded to first child.

**TDD:**
- Integration: two children (Adam, Khadijah) both with lessons today → Today section renders lessons for both. Assert Khadijah's lesson is present.
- Playwright (`e2e/planner.spec.ts`): navigate to `/lessons`, assert Today section includes at least one lesson from each child that has lessons today.

**Implementation:** Iterate all children and collect today's lessons, or pass `null` as childId to render all.

---

## FB-011 — Lessons page improvements (MVP scope)

Applies to `/lessons` route. The route stays at `/lessons`. The data comes from `features/plan/` APIs.

**Changes:**
- Rename form labels: Child → **Learner(s)**, Subject → **Course/Subject**, Due date → **Planned date**.
- Add **Estimated duration** field: 15 min, 30 min, 45 min, 1 hr, custom.
- Add **Lesson type** dropdown, adaptive by course category:
  - General: Lesson, Assignment, Reading, Practice, Review, Project, Assessment, Other
  - Quran: Memorisation, Revision, Recitation, Tajweed, Listening
- Add **overdue labeling**: past planned date + status not completed → "Overdue" badge.
- Add **filters**: by learner, course/subject, date range, status, overdue, lesson type.
- Expand lesson **actions**: Complete, Move, Edit, Skip, Add evidence (alongside existing Edit/Delete).
- Replace Delete with **Archive/Remove** with confirmation for lessons that have records.
- Add helper text when Course/Subject is empty: "Choose a learner first to see active courses."
- Ensure no internal IDs appear in labels, dropdowns, or validation messages.

**FB-011 TDD:**
- Integration: render lesson form → assert label "Learner", not "Child".
- Integration: render lesson form → assert label "Planned date", not "Due date".
- Integration: render form → assert Lesson type dropdown present; when Quran course selected, assert "Memorisation" and "Revision" options appear.
- Integration: lesson with past planned date + `status: 'planned'` → assert "Overdue" badge visible on card.
- Integration: click Delete on lesson with evidence → confirm dialog appears; lesson archived, not removed from store.
- Integration: filter by lesson type → only matching lessons shown.
- Playwright: open `/lessons`, add a lesson with Quran course → assert "Revision" appears in Lesson type dropdown.

---

## File index

| File | Change |
|------|--------|
| `features/dashboard/api/routes/quran-sessions.ts` | Sort sessions by date desc |
| `features/dashboard/server/service.ts` | Fix `getLatestQuranSession()` |
| `features/dashboard/front/components/QuranLoggingSection.tsx` | Pass API chart data; filter by selectedChildId |
| `features/plan/front/pages/LessonsPage.tsx` | Fix `children[0]` hardcode; integrate FB-011 changes |
| `features/plan/front/components/LessonForm.tsx` | Rename fields; add duration, lesson type |
| `features/plan/front/components/LessonCard.tsx` | Overdue badge; expanded action buttons |
| `features/plan/front/components/LessonFilters.tsx` | New — filter + grouping controls |
| `features/plan/types.ts` | Add `estimatedDuration`, `lessonType`, `plannedDate` |
| `features/dashboard/__tests__/api/quran-sessions.test.ts` | New/extend |
| `features/dashboard/__tests__/integration/QuranLoggingSection.test.tsx` | New/extend |
| `features/plan/__tests__/integration/LessonsPage.test.tsx` | New/extend |
| `e2e/dashboard.spec.ts` | Quran session + chart assertions |
| `e2e/planner.spec.ts` | Lessons Today multi-child; lesson type dropdown |
