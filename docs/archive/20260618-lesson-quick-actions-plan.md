# Plan: Lesson quick-actions & date-field clarity

**Date:** 2026-06-18
**Branch:** `feat/lesson-quick-actions` (off `master`)

## Planning mode: 3 — Cross-feature
Touches Plan (LessonCard, LessonTaskList, LessonsPage, LessonTaskForm), Dashboard (TodayLessonCard via DoToday), and Schedule (ScheduleTimeline). Data shown in multiple places; default to Mode 3 per CLAUDE.md.

## Source of truth
**Planner / Lesson Tasks** owns lessons, status, and dates. Dashboard and Schedule only *compose* and *link to* lesson data — they navigate to `/lessons?editId=` (the existing canonical edit entry point) rather than embedding edit logic. No new dashboard/schedule store data. ✅ No ownership violation.

---

## Originating requests
1. On Lessons, allow an icon on the lesson to mark it done.
2. Allow editing of the planned date in the edit screen of the lesson.
3. Address the difference between start date and planned date.
4. On Dashboard and on Plan/Schedule allow us to quickly click edit the lesson.

**Decision on #3 (terminology):** `dueDate` → **"Due date"** everywhere; `plannedStartDate` → **"Available from" (optional)**. Helper text: *"Lesson can be completed any day from 'Available from' through 'Due date'."*

---

## Code-path audit (traced)

- **LessonCard** `features/plan/front/components/LessonCard.tsx` — renders each lesson; inline edit exposes `dueDate` only (labeled "Due date"), Pencil + Trash icons. No mark-done. No `plannedStartDate` in inline edit.
- **LessonTaskList** `features/plan/front/components/LessonTaskList.tsx` — passes `onUpdate`/`onEdit`/`onDelete` to LessonCard. No `onComplete`.
- **LessonsPage** `features/plan/front/pages/LessonsPage.tsx` — owns `handleUpdate`/`handleDelete` calling `plannerApi`. No card-level complete handler (only TodayLessonCard completes).
- **LessonTaskForm** `features/plan/front/components/LessonTaskForm.tsx:234-257` — full add/edit form; `plannedStartDate`→"Start date", `dueDate`→"Planned date".
- **TodayLessonCard** `features/plan/front/components/TodayLessonCard.tsx` — Dashboard + Lessons "Today" list; mark done/skip buttons; **no edit affordance**.
- **DoToday** `features/dashboard/front/components/DoToday.tsx` — renders TodayLessonCard; no `?editId` deep-link wiring.
- **ScheduleTimeline** `features/schedule/front/components/ScheduleTimeline.tsx` — `TimelineRow` renders lesson title; **no edit affordance**; `entry.lesson` carries the lesson (incl. `id`).
- **WeekGrid** `WeekGrid.tsx:196` & **WeeklyList** `WeeklyList.tsx:138` — already `router.push('/lessons?editId=' + id)`. ✅ Plan quick-edit exists.
- **API**: `plannerApi.completeLesson(id, status)` (PATCH `/complete`), `plannerApi.updateLesson(id, patch)` (PUT accepts `plannedStartDate`/`dueDate`). ✅ No backend change.

**Existing tests:** `LessonCard.test.tsx`, `LessonTaskList.test.tsx`, `LessonTaskForm.test.tsx`, `TodayLessonCard.test.tsx`, `ScheduleTimeline.test.tsx`, `LessonsPage.test.tsx`, dashboard `DoToday.test.tsx`.

### UI pattern audit (`ui-style-guide`)
- Mark-done = **icon-only action** → lucide `Check` icon button with `aria-label="Mark lesson done"`, matching existing Pencil/Trash styling in LessonCard.
- Quick-edit on Dashboard/Schedule = **navigate** pattern (deep-link to canonical edit screen), consistent with Plan. Icon-only `Pencil` with `aria-label`.
- No new destructive actions; existing `InlineConfirm` for delete unchanged.

---

## Acceptance criteria (observable)

1. On **/lessons**, each not-started lesson card shows a **check icon**; clicking it marks the lesson completed (status badge → Completed, optimistic) without opening the edit form. Completed/skipped lessons do not show the check icon.
2. Opening a lesson's **inline edit** on /lessons shows an **"Available from (optional)"** field and a **"Due date"** field; editing either and saving persists both (verified via `plannerApi.updateLesson` payload containing `plannedStartDate` and `dueDate`).
3. The **add form** and **inline edit** both label `dueDate` as **"Due date"** and `plannedStartDate` as **"Available from"**, with helper text: *"Lesson can be completed any day from 'Available from' through 'Due date'."*
4. On the **Dashboard** "Do Today" list, each lesson row has an **edit icon**; clicking it navigates to `/lessons?editId=<id>` (opens inline edit on that card).
5. On **/schedule**, each lesson timeline row has an **edit icon**; clicking it navigates to `/lessons?editId=<id>`.
6. **Plan** (week grid / list) quick-edit is unchanged and still works.
7. Navigating to **/invite/accept?token=<valid>** redirects to `/dashboard` after accepting membership.
8. Navigating to **/invite/accept?token=<invalid>** shows an error and a link back to /login.
9. Navigating to **/invite/accept** (no token) shows an error immediately with no network request.

---

## API / data / contract changes
None to the backend. Front-end only:
- `LessonTaskList` gains optional `onComplete?: (id: string, status: 'completed') => Promise<void>`.
- `LessonCard` gains optional `onComplete?` and renders the check icon when `lesson.status === 'not_started'` and `onComplete` is provided.
- `LessonCard` inline edit gains `editPlannedStartDate` state; `saveEdit` includes `plannedStartDate: editPlannedStartDate || undefined`.
- `TodayLessonCard` gains optional `onEditLesson?: (id: string) => void`; renders Pencil when provided.

---

## Testing plan (failing tests first)

1. `LessonCard.test.tsx` —
   - renders check icon for not-started lesson when `onComplete` given; click calls `onComplete(id, 'completed')`.
   - does **not** render check icon when status is completed/skipped.
   - inline edit renders "Available from" + "Due date" inputs; editing "Available from" and saving calls `onUpdate` with `plannedStartDate` set.
2. `LessonTaskList.test.tsx` — forwards `onComplete` to each card.
3. `LessonTaskForm.test.tsx` — labels updated to "Available from" / "Due date"; helper text present; submitting still sends `plannedStartDate`/`dueDate`.
4. `TodayLessonCard.test.tsx` — when `onEditLesson` provided, edit icon renders and click calls it with lesson id; absent when prop omitted.
5. `DoToday.test.tsx` (dashboard integration) — edit icon click triggers navigation to `/lessons?editId=<id>` (mock `next/navigation` `useRouter`).
6. `ScheduleTimeline.test.tsx` — lesson row renders edit control; click navigates to `/lessons?editId=<id>`.
7. `LessonsPage.test.tsx` — `handleComplete` calls `plannerApi.completeLesson` then refetches.
8. `InvitationAccept.test.tsx` (new) —
   - renders "Accepting your invitation…" while fetch is in flight.
   - calls `router.replace('/dashboard')` on success.
   - shows API error message + link to /login on 404 (invalid token).
   - shows API error message + link to /login on 410 (expired/used token).
   - shows "invalid or missing invitation link" error with no fetch when no `?token=` in URL.

Write all of the above as failing tests first, confirm red, then implement.

---

## Build phases (ordered by dependency)

**Phase 1 — Date terminology (lowest risk, no new behavior)**
Tests: `LessonTaskForm.test.tsx`. Relabel in `LessonTaskForm` and `LessonCard` inline edit: `dueDate`→"Due date", `plannedStartDate`→"Available from", add helper text.
Commit: `refactor(plan): unify lesson date labels to Due date / Available from`.

**Phase 2 — Inline edit gains "Available from"**
Tests: `LessonCard.test.tsx` (edit case). Add `editPlannedStartDate` state + input to `LessonCard` inline edit; include in `saveEdit` patch.
Commit: `feat(plan): allow editing Available-from date in lesson inline edit`.

**Phase 3 — Mark-done icon on Lessons**
Tests: `LessonCard.test.tsx` (complete), `LessonTaskList.test.tsx`, `LessonsPage.test.tsx`. Add `onComplete` prop chain + Check icon button; `LessonsPage.handleComplete` → `plannerApi.completeLesson` → refetch. Mirror TodayLessonCard's optimistic + revert-on-failure logic.
Commit: `feat(plan): add quick mark-done icon to lesson cards`.

**Phase 4 — Quick-edit on Dashboard & Schedule**
Tests: `TodayLessonCard.test.tsx`, `DoToday.test.tsx`, `ScheduleTimeline.test.tsx`. Add `onEditLesson` to `TodayLessonCard`; `DoToday` passes a handler that `router.push('/lessons?editId=' + id)`. Add edit control to `ScheduleTimeline` `TimelineRow` for lesson entries, navigating likewise.
Commit: `feat(dashboard,schedule): add quick-edit deep links to lessons`.

**Phase 5 — Invite-accept page**
Tests: `InvitationAccept.test.tsx` (5 tests, written first). New files: `features/household/front/pages/InviteAccept.tsx` (client component, matches `ResetPassword.tsx` shell: logo header, `div.card p-8`, `<Suspense>` wrapper) and `app/(auth)/invite/accept/page.tsx` (thin metadata route). Behavior: reads `?token=` via `useSearchParams`; on mount POSTs to `/api/household/invite/accept` (already wired); states — pending ("Accepting your invitation…"), success (`router.replace('/dashboard')`), error (API message + link to /login). No token → skip fetch, go straight to error. No backend changes.
Commit: `feat(household): add invite-accept page`.

**Phase 6 — Verify**
`npm test`, then `npx jest --testPathIgnorePatterns="/node_modules/"` (integration), then `npm run build`. All green before merge.

---

## Out of scope
- Backend/schema changes (none needed).
- Editing dates directly from Dashboard/Schedule (they deep-link to the edit screen instead).
- Mark-done from Schedule timeline (only edit deep-link added there; completion stays on Lessons/Dashboard).
- Bulk/group completion semantics beyond existing `applyToGroup`.

## Manual QA (click-by-click)
1. /lessons → not-started card → click check icon → badge flips to Completed, no form opens.
2. /lessons → pencil on a card → confirm "Available from" + "Due date" fields with helper text → set Available from earlier than Due date → Save → reopen, values persisted.
3. Dashboard → Do Today → click edit icon on a lesson → lands on /lessons with that card in inline edit, scrolled into view.
4. /schedule → click edit icon on a lesson row → same deep-link behavior.
5. /plan → click a lesson → still deep-links to edit (regression check).

## Risks + rollback
- **Risk:** `ScheduleTimeline` rows are non-interactive today; adding a button must not break `timelineStatus` layout or the `data-testid` selectors used by tests. Mitigation: add the control inside the existing right-side area next to `StatusPill`, keep test ids.
- **Risk:** optimistic mark-done on LessonCard must revert on API failure (mirror TodayLessonCard's revert logic).
- **Rollback:** each phase is an independent commit; revert individually.
