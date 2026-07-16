# Lesson Planner UX rework — G8 plan

**Date:** 2026-07-16
**Source:** feedback `6f7a6af3` (detailed design doc from `dev@sheathacademy.ai`), pulled 2026-07-16.
**Scope:** Reposition the desktop planner from a spreadsheet-style matrix to a **lesson-centric weekly planner**, while **preserving the matrix** as a distinct "Planning Matrix" view. This is its own feature wave, separate from the G1–G7 batch.

---

## Summary
The user's feedback is explicit: the planner "feels like editing a table," not "planning my week." The root complaint is the **mental model**, not missing features. We introduce a **view toggle** on `/plan` with two views — **Weekly Planner** (new default, lesson-centric, grouped by learner, rich lesson cards) and **Planning Matrix** (the existing `WeekGrid`, preserved unchanged as a power-user view). Drag-and-drop rescheduling and bulk planning are retained. We do **not** replace or delete the matrix.

---

## Planning mode
**Mode 3 (cross-feature / composition-heavy UI).** It changes the primary planner surface, adds a persisted view preference, enriches lesson cards, and must preserve existing drag-and-drop, filters, and bulk planning. Multiple components and the planner context are involved.

---

## Current-code-path audit (traced, not assumed)

| Concern | Current reality |
|---|---|
| Plan route | `app/(shell)/plan/page.tsx` → `features/plan/front/pages/index.tsx` → `WeeklyPlannerPage` inside `PlannerProvider`. |
| Page shell | `features/plan/front/components/WeeklyPlannerPage.tsx` — renders `WeekNavigator`, optional `LessonTaskForm`, `ChildSubjectFilter`, then **`WeekGrid` on desktop / `WeeklyList` on mobile** (`isMobile = innerWidth < 768`). |
| Matrix view | `features/plan/front/components/WeekGrid.tsx` — table: rows = **child × subject** (repeats child name per subject), columns = 7 days, empty cells rendered as blank `<td>`, thin lesson cards (title/description/window/duration), `@dnd-kit` drag-to-reschedule, daily-total footer. Empty weekend cells styled `opacity-60`. **This is exactly what the feedback describes as "spreadsheet."** |
| Mobile list | `features/plan/front/components/WeeklyList.tsx` — day-grouped, collapsible, richer cards already (child, subject, description, window). A partial precedent for the lesson-centric direction, but grouped by **day**, not **learner**. |
| Lesson data | `PlannerContext` (`features/plan/front/context/PlannerContext.tsx`) provides `lessons`, `children`, `subjects`, `selectedChildIds`, `selectedSubjectIds`, `selectedWeek`, `weekStartDay`, `refreshLessons`. |
| Lesson type | `features/plan/types.ts` `LessonTask` fields: `id, childId, subjectId, title, description?, resourceLink?, status, estimatedDuration?, dueDate, plannedStartDate?` (+ steps). **There is NO `curriculum`, `chapter`, `homework`, or `assessment` field.** |
| Edit interaction | Cards route to `/lessons?editId=...` (`WeekGrid.handleEdit`, `WeeklyList`). |
| Existing tests | `features/plan/__tests__/` — integration for planner page, WeekGrid, WeeklyList, filters (confirm exact files in implementation). |

### Consequences for the plan (honest constraints)
1. **Indicators the feedback requests (curriculum / chapter / homework / assessment) are not in the data model yet.** `LessonTask` today has only `title`, `description`, `resourceLink`, `status`. **DECIDED: build the richer details** — add the new `LessonTask` fields + migration + form inputs so the cards can show curriculum/chapter/homework/assessment for real (P4, now in scope). P2–P3 still ship first using existing fields so value lands early; P4 layers the real badges on top. Never render an indicator we can't back with stored data.
2. The mobile `WeeklyList` already proves the richer-card pattern; we reuse its card styling rather than inventing a new one.
3. The matrix must remain reachable and behaviorally unchanged.

### UI pattern audit (`ui-style-guide`)
- View toggle: use the approved segmented-control / tab pattern; persist choice.
- Lesson cards: reuse the record-card visual language already in `WeeklyList`; keep click-to-edit (navigate) interaction — do not introduce a new modal here (matches existing planner behavior; a separate feedback item G7 covers inline-edit popups on the Dashboard).
- Collapsible learner groups: approved collapsible section pattern (as in `WeeklyList` day sections).
- Empty states: muted, not blank; per standards.
- No Nivo in this plan.

---

## Source-of-truth decision
**Planner / Lesson Tasks** owns all lesson data. This plan is **presentation + one persisted UI preference**; it introduces **no** new lesson data source. The view preference is a UI setting persisted to `household_settings` (via the settings API introduced in the G1 plan) **or** `localStorage` if G1 has not shipped — decide at implementation; prefer `household_settings` for cross-device consistency. No dashboard/seed data is created.

---

## Acceptance criteria (observable)
1. `/plan` default (desktop) shows a **Weekly Planner** view led by **lesson cards**, not an empty grid. **(DECIDED: the new Weekly Planner is the default view; the Planning Matrix is one click away via the toggle.)**
2. Lessons are **grouped by learner**; each learner name appears **once** as a **collapsible** group header (expand/collapse works and persists within the session).
3. Within a learner group, lessons are organized by day (or subject) so empty space is minimized; **days/slots with no lessons are visually muted or omitted**, and scheduled lessons stand out.
4. Each lesson card shows, at a glance without opening it: **subject, lesson title, status**, and a **resource indicator** when `resourceLink` is set (P2–P3). After **P4**, cards also show **curriculum, chapter, and homework/assessment indicators** backed by real stored fields.
5. A **view toggle** switches between **Weekly Planner** and **Planning Matrix**; the matrix is the existing `WeekGrid` and its **drag-and-drop rescheduling, filters, and daily totals still work**.
6. The selected view **persists** across reloads.
7. Existing filters (`ChildSubjectFilter`), week navigation, and "Add lesson" continue to work in both views.

---

## Design direction

> Design brief in one line: **a homeschooling parent, on Sunday night, deciding what each of their children will do this week** — and feeling in control, not like they're maintaining a spreadsheet. The lesson is the hero; the learner is the spine.

This redesign lives **inside** the existing Sheath Academy design system — it does **not** introduce a new palette or type identity. Distinctiveness comes from **structure and hierarchy**, not new brand tokens. Reuse what's already in the codebase (observed in `WeekGrid`/`WeeklyList`): the forest/slate palette, `card` styling, `lucide-react` icons, Tailwind utilities.

### Palette (existing tokens — do not invent new ones)
- **Structure / surface:** `slate-50` page, `white` cards, `slate-200` hairlines, `slate-900/600/400` text ramp.
- **Brand / active:** `forest-900` (primary), `forest-50/100/200/600/700` (accents, hover, "today").
- **Status (already established):** `green-*` = completed, `amber-*` = skipped/attention, `slate-*` = not started.
- **Learner identity:** each learner's own `displayColor` (already on the `learners` table) — used only as a thin identity accent, never as a fill that competes with status color.

### Signature element — the **learner spine**
The one memorable, information-bearing device: each learner group is anchored by a **vertical color rail** in that learner's `displayColor` running down the left edge of their section, with the learner's name + avatar initial stated **once** at the top. This encodes something true (whose week this is) instead of decorating, and it's what replaces the feedback's core complaint — "Layth, Layth, Layth" repeated on every row. Everything else stays quiet so the rail + the lesson cards carry the page.

### Typography & structure
- Keep the app's existing type stack. Set hierarchy through **weight and size**, not new faces: learner name (semibold, `slate-900`) → day label (xs, uppercase, `slate-400`, tracking-wide) → lesson **subject** (medium, teaching context first) → lesson **title** (regular) → indicators (xs).
- **No decorative 01/02/03 numbering** — the content isn't a ranked sequence. The only ordering shown is chronological (days) and that's carried by day labels, which is honest structure.

### Layout concept
Vertical, scannable, learner-grouped. Days are columns *within* a learner's row band on wide screens, collapsing to stacked day sub-sections on narrow ones. Empty days are compressed to a thin muted marker, not full empty cells — reclaiming the "most of the screen is empty cells" space the feedback called out.

```
┌───────────────────────────────────────────────────────────────┐
│  This week ‹ Jul 14–20 ›            [ Weekly Planner | Matrix ] │  ← view toggle, top-right
│  Filters: Children ▾   Subjects ▾                    + Add lesson│
├───────────────────────────────────────────────────────────────┤
│ ▎ Layth ·  ▼                        (learner spine = his color) │
│ ▎   MON        TUE        WED        THU        FRI    ·· weekend│
│ ▎  ┌───────┐  ┌───────┐   ·         ┌───────┐    ·              │
│ ▎  │Reading│  │ Math  │  (none)     │Science│  (none)           │
│ ▎  │AAR L2 │  │Ch. 12 │             │Lab 3  │                   │
│ ▎  │Ch.91  │  │✓ Done │             │📎 📝  │                   │
│ ▎  │📎 Ready│ └───────┘             └───────┘                   │
│ ▎  └───────┘                                                    │
├───────────────────────────────────────────────────────────────┤
│ ▎ Safiya ·  ▼                                                   │
│ ▎   … her lessons …                                             │
├───────────────────────────────────────────────────────────────┤
│ ▎ Yusuf ·  ▶   (collapsed — 3 lessons this week)                │
└───────────────────────────────────────────────────────────────┘
```

### Lesson card anatomy (the real payload)
Lead with **teaching context**, per the feedback ("Reading / Chapter 91", not "All About Reading Level 2 — Chapter 91"):

```
┌─────────────────────────┐
│ READING            ● Done│  subject (eyebrow) + status dot
│ Ch. 91                  │  ← chapter/lesson focus (P4 field), largest line
│ All About Reading L2    │  ← curriculum (P4), smaller, muted
│ 📎 Resource  📝 Homework │  ← indicators, only when the data exists
└─────────────────────────┘
```
- **P2–P3 (existing fields):** subject eyebrow, title, status dot, `resourceLink` → 📎 indicator, duration.
- **P4 (new fields):** chapter becomes the focal line, curriculum the muted sub-line, `hasHomework`/`hasAssessment` → 📝/📋 indicators. Indicators are **presence-only** and never render without backing data.
- Whole card is the click target → edit (navigate, preserving current behavior); the drag handle stays for reschedule parity where DnD applies.

### States (all four required)
- **Loading:** skeleton learner bands (spine + 2–3 card placeholders), not a full-screen spinner — preserves layout so the page doesn't jump.
- **Empty (no lessons this week):** keep `EmptyWeekState`, but voiced as an invitation — "No lessons planned for this week yet. Add the first one." with the Add action inline. An empty screen is a prompt to act, not a dead end.
- **Empty (a single learner has nothing):** thin muted "No lessons this week" strip inside their band, so the parent still sees the child exists and can add.
- **Error:** existing error panel, plain voice — what failed + retry.

### Restraint / quality floor
Spend the boldness on the learner spine; keep cards, labels, and spacing quiet and consistent with the rest of the app. Responsive to mobile (bands stack; days become sub-sections — reuse the `WeeklyList` collapsible pattern), visible keyboard focus on cards and toggle, `prefers-reduced-motion` respected for collapse/expand. Copy is sentence-case, active-voice ("Add lesson", "Mark complete"), consistent with existing planner wording.

### What this deliberately avoids
The three AI-default looks (cream+serif+terracotta, black+acid-accent, broadsheet hairlines) are all off-brief here — the app already has an identity and consistency with it *is* the correct move. The risk taken is structural (the learner-spine organizing device), which is the right place to spend it for a planning tool.

---

## Build phases (ordered by dependency)

### P1 — View toggle + preserve matrix (no visual rework yet)
Introduce a `plannerView: 'planner' | 'matrix'` state in `WeeklyPlannerPage` with a toggle control, persisted (see source-of-truth note). `matrix` renders the current `WeekGrid` unchanged; `planner` initially renders the existing `WeeklyList` (already lesson-centric) on desktop too. This ships a usable improvement immediately and de-risks the rest.
- **Files:** edit `WeeklyPlannerPage.tsx`; add `features/plan/front/components/PlannerViewToggle.tsx`.
- **Tests (first):** `features/plan/__tests__/integration/PlannerViewToggle.test.tsx` — toggle renders; selecting Matrix renders the grid (assert a matrix-only element, e.g. the "Child / Subject" header); selecting Weekly Planner renders lesson cards; choice persists (mock persistence).

### P2 — Learner-grouped, lesson-centric Weekly Planner component
New `WeeklyPlanner.tsx` (desktop lesson-centric view) replacing `WeeklyList` in the `planner` view: group lessons by **learner** (each learner once, collapsible), nest that learner's lessons by day; mute/omit empty days; render rich cards reusing `WeeklyList` card styling. Respect `selectedChildIds`/`selectedSubjectIds` filters.
- **Files:** add `features/plan/front/components/WeeklyPlanner.tsx`; edit `WeeklyPlannerPage.tsx` to use it for the `planner` view; keep `WeeklyList` for mobile (or reuse the new component responsively — decide in audit).
- **Tests (first):** `features/plan/__tests__/integration/WeeklyPlanner.test.tsx` — with lessons for two learners, each learner header appears exactly once; collapsing a learner hides their lessons; a day with no lessons is muted/absent; a card shows subject + title + status; filters narrow the set.

### P3 — Card enrichment from existing fields + teaching-context ordering
Lead with **subject → title** (teaching context) over any curriculum string; show status badge and a **resource indicator** when `resourceLink` is present. No data-model change.
- **Files:** edit `WeeklyPlanner.tsx` (and optionally extract a shared `PlannerLessonCard.tsx`).
- **Tests (first):** card renders subject before title; resource indicator present iff `resourceLink` set; status badge reflects `status`.

### P4 — Curriculum / chapter / homework / assessment indicators (IN SCOPE — decided)
Add fields to `LessonTask` (`curriculum?`, `chapter?`, `hasHomework?`, `hasAssessment?` or similar), a **Drizzle migration**, form inputs in `LessonTaskForm`, and the matching card indicators. This is a **data-model change** — generate the migration with `npm run db:generate`, review the SQL, and follow the CLAUDE.md drizzle composite-FK ordering caution if applicable. Keep the new fields optional so existing lessons remain valid.
- **Files:** `db/schema.ts` + new migration, `features/plan/types.ts`, `features/plan/server/**` (persistence), `features/plan/front/components/LessonTaskForm.tsx`, `WeeklyPlanner.tsx`.
- **Tests (first):** repository persists new fields; form submits them; card renders each indicator only when set.

---

## Testing plan (summary)
- **Integration (jsdom, primary):** view toggle, learner grouping/collapse, empty-day muting, card content, filter interaction, persistence. Use `renderWithProvider` with `PlannerProvider` (and any required `HouseholdProvider`/`LearnerProvider` wrappers — see testing-patterns; missing provider is the usual cause of "useX must be used within Provider").
- **Unit:** any new grouping/util helper (e.g. group-lessons-by-learner-then-day) tested in isolation.
- **API/repository:** only P4 (new fields).
- **Regression checklist (must stay green):** `WeekGrid` drag-and-drop reschedule + undo; daily totals; `ChildSubjectFilter`; week navigation; "Add lesson" flow; mobile view.
- Failing tests are written **before** each phase's implementation.

---

## Out of scope
- Removing, replacing, or restructuring the `WeekGrid` matrix (explicitly preserved — the feedback says "Do NOT remove the matrix").
- Calendar/overview view (the doc lists it as a future idea, not this wave).
- Inline-edit modal on cards (planner keeps navigate-to-edit; Dashboard inline-edit is a separate G7 item).
- Any `SubjectCourse` type/folder rename.

---

## Risks & rollback
- **Risk:** changing the default view disorients existing users. **Mitigation:** the matrix is one click away via the toggle; P1 ships the toggle before any rework so users can revert their own view.
- **Risk:** grouping/regression breaks drag-and-drop. **Mitigation:** matrix code path is untouched in P1–P3; drag-and-drop regression tests stay green.
- **Rollback:** the view toggle defaults can flip back to `matrix`; each phase is an isolated PR revertible without touching the others.

---

## Branch + commit plan
- `feat/planner-view-toggle` (P1) → `feat/weekly-planner-learner-grouping` (P2) → `feat/planner-card-enrichment` (P3) → `feat/lesson-teaching-metadata` (P4, migration).
- One PR per phase against `dev`; behavior-oriented commits; never `--no-verify`; build + `npm test` + integration green before each PR.

## Manual QA (click-by-click)
1. `/plan` on desktop → Weekly Planner is default, lesson cards visible, no empty grid.
2. Two learners present → each name appears once; collapse one → its lessons hide; reopen → they return.
3. A day with no lessons is muted/absent; a scheduled lesson stands out.
4. A card shows subject, title, status, and a resource indicator when a resource link exists.
5. Toggle to Planning Matrix → the table returns; drag a lesson to another day → it moves and "Undo" works; daily totals update.
6. Reload → the last-selected view is still shown.
7. Apply a child/subject filter → both views respect it.
