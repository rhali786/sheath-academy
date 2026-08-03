# Design spike: is `6f7a6af3` (Lesson Planner UX rework) still open after G8/G9/today?

**Date:** 2026-08-03
**Source:** feedback `6f7a6af3` (2026-07-19, `/plan`), deferred in `docs/20260802-feedback-batch-prod-pull-plan.md` ("Wave 2b") pending this re-read.
**Type:** Design spike / comparison-and-recommendation. **Not** a build plan — no phases, no `testsFirst`, no file scope. If a gap survives this spike, its size is estimated at the end; the actual plan is a separate document.

---

## Summary

`6f7a6af3` asked for a mental-model shift on `/plan`: stop feeling like a spreadsheet, make the lesson the hero, stop repeating child names, quiet the empty cells, richen the card preview, lead with teaching context over curriculum metadata, and reposition the matrix as a power-user view rather than the only view — all **without removing the matrix**.

Reading it against what actually shipped in G8 (2026-07-16), G9 item 4 cross-reference (2026-07-17), and today's drag-drop/combined-view phase (2026-08-03), **the overwhelming majority of `6f7a6af3` is already built, live, and matches the feedback's own language almost verbatim** — down to the "learner spine" replacing "Layth, Layth, Layth" and the chapter-before-curriculum card ordering. This is a case where the feedback effectively became the design brief for G8, and G8 delivered.

What's left is narrow: two of the feedback's seven points are only **partially** addressed, and they're both small, already-adjacent-to-shipped-code gaps — not a new rework. There is no case here for a new multi-phase wave.

---

## Point-by-point: feedback vs. shipped reality

### 1. "The page feels like a spreadsheet instead of a planner" — **RESOLVED**
G8 P1–P2 (`docs/20260716-lesson-planner-ux-rework-g8-plan.progress.json`, phases `phase-g8-p1-view-toggle` / `phase-g8-p2-weekly-planner-component`) made `WeeklyPlanner` (lesson-centric) the **default** view on `/plan`, with `WeekGrid` (the matrix) one click away via `PlannerViewToggle`. Confirmed in current code: `features/plan/front/components/PlannerViewToggle.tsx` still has exactly this two-tab structure (`Weekly Planner` / `Planning Matrix`) plus a `Calendar` link added later. Today's phase-3 work only extended the planner view (drag-drop, display modes); it didn't touch this resolution.

### 2. "The lesson is not the primary visual element" — **RESOLVED**
`WeeklyPlanner.tsx`'s `LessonCard` (current code, `features/plan/front/components/WeeklyPlanner.tsx:100-202`) is the dominant visual unit per day/learner cell — grid structure is reduced to thin day-column scaffolding, and `DroppableDaySlot` renders only a label + cards, no cell borders/table chrome. This matches the feedback's ask directly.

### 3. "Child names repeat excessively" — **RESOLVED**
This is the one G8 explicitly designed a signature device for: the **"learner spine"** — each learner section header renders the name once, with a colored left-border rail (`style={{ borderLeftWidth: 4, borderLeftColor: color }}`, `WeeklyPlanner.tsx:349-350`) plus an avatar-initial badge, and is collapsible (`toggleLearner`, `aria-expanded`). The feedback's own "Questions to Explore" section asked for exactly this ("grouped rows," "expandable learner groups") — both shipped in G8 P2, confirmed still present and behaviorally unchanged by G9/today's phase-3 (phase-3's notes explicitly state the by-learner stacked layout is byte-identical to before, just wrapped in the new shared `LessonCard`).

### 4. "Empty cells create visual noise" — **RESOLVED**
Empty days per learner render as a single muted em-dash line (`data-testid="day-empty-..."`, `<div className="mt-1 opacity-60">—</div>`, `WeeklyPlanner.tsx:394-400`), not a blank table cell — this is the "compress empty days to a thin muted marker" design G8 committed to. Note this applies to the **Weekly Planner** view only, which is now the default; the Planning Matrix (`WeekGrid`) still renders traditional empty `<td>` cells, but that's by design — the feedback explicitly said "do NOT remove the matrix," and a power-user matrix view is expected to look like a matrix. The complaint was about the *default* experience, and the default no longer looks like this.

### 5. "Lesson cards need richer previews" (subject/curriculum/chapter/status/homework/assessment/attachment indicators) — **RESOLVED**
This was the feedback's most concrete, literal ask, and G8 P4 built it field-for-field: `curriculum`, `chapter`, `hasHomework`, `hasAssessment` were added to `LessonTask` (`features/plan/types.ts:38-43`) via a real Drizzle migration (`db/migrations/0036_tense_secret_warriors.sql`), plumbed through the form and repository, and rendered as presence-only indicators (📎 resource, 📝 homework, 📋 assessment) plus a status badge and duration — confirmed live in current `LessonCard` code (`WeeklyPlanner.tsx:147-199`). This is an almost line-for-line match to the feedback's own example ("Reading / All About Reading L2 / Chapter 91 / ✓ Ready / 📄 Worksheet / 📝 Homework").

### 6. "Curriculum metadata is more prominent than teaching context" — **RESOLVED**
G8 P4's card precedence rule (confirmed in `LessonCard`, `WeeklyPlanner.tsx:147-156`): when `chapter` is set, chapter is the focal line and `curriculum` renders as a smaller muted sub-line beneath it — title is not duplicated. This is exactly the "Reading / Chapter 91" before "All About Reading Level 2" ordering the feedback asked for, including the subject eyebrow leading even higher (subject → chapter → curriculum). Confirmed via `WeeklyPlanner.test.tsx`'s DOM-order assertions per G8 P3's progress notes.

### 7. "Lesson Planner and Planning Matrix are different tools" / matrix repositioning — **RESOLVED (plus a bonus)**
The feedback's suggested structure was "Calendar → overview, Weekly Planner → teacher workflow, Planning Matrix → curriculum management." G8 delivered the Weekly Planner/Matrix split; G9's cross-reference (item 4) flagged that a true calendar view was *not* part of G8's scope but that `features/schedule`'s existing Week/Month calendar views might already satisfy it. Current `PlannerViewToggle.tsx` shows a third `Calendar` tab was in fact added (`onOpenCalendar`, `data-testid="planner-view-tab-calendar"`) — so the full three-tier structure the feedback sketched (Calendar / Weekly Planner / Matrix) is now literally present on the toggle. This exceeds what `6f7a6af3` asked for and closes G9's own open question from its cross-reference section.

### Constraint: "Do NOT remove the matrix" — **HONORED**
Every phase's write-back notes are explicit that `WeekGrid.tsx` core behavior is untouched (P1–P3 didn't touch it at all; G9 item 2 added household-driven off-day styling to it as a bug fix, not a rework; today's phase-3 only extracted its drag logic into a reusable hook `useLessonReschedule`, verified to leave `WeekGrid`'s own tests and behavior unchanged). The matrix is alive, reachable, and functionally intact.

---

## What's genuinely still open

Only two threads don't have a clean "shipped" answer, and both are narrower than they first look.

### A. "Would compact lesson cards improve usability?" — asked and answered, but only in one display mode

The feedback's design question about compact cards is really about **information density when scanning many lessons at once** — not just richer card *content* (which is done), but a genuinely denser layout option. Today's phase-3 combined "By day" view (`displayMode === 'byDay'`) is the closest thing to this: it collapses per-learner repetition down to a single per-date column with small learner-initial badges (`combined-learner-badge-...`) instead of one full card-and-badge apparatus per learner. That's effectively a "compact multi-child" mode. But note it's a full-size `LessonCard` reused as-is (same badges/status/indicators) with only the learner identity compressed to a tiny circle — it is not a genuinely *compact* card variant (e.g. a single-line summary row). The original feedback's own compact-preview mock ("Reading / All About Reading L2 / Chapter 91 / ✓ Ready / 📄 / 📝") is exactly the current full card's content, so "compact" in the feedback turns out to mean "richer-but-still-small," which is resolved. A true single-line/dense list mode was never explicitly requested beyond that mock, so there's no unmet ask here — flagging this only so it's not mistaken for a gap later.

### B. Empty-cell muting is asymmetric between the two view modes (minor, cosmetic)

The Weekly Planner mutes empty days to a thin marker (point 4, above). The Planning Matrix (`WeekGrid`) does not — it still renders full empty `<td>` cells (with weekend/off-day opacity styling from G9 item 2, but not the "compress to a thin row" treatment). This is arguably correct by design (the matrix is deliberately the power-user/data view, and the feedback didn't ask to change the matrix's internals — only to stop it being the *only* view, which is resolved). This is not a genuine gap against the feedback text; it's a note for anyone who later wants matrix-specific polish, not a `6f7a6af3` follow-up.

**Neither A nor B represents an unaddressed point from the feedback's seven numbered problems or its explicit design questions.** Re-reading the feedback text one more time against this list: all of "spreadsheet vs. planner," "lesson as hero," "repeated names," "empty cell noise," "richer previews," "curriculum vs. teaching context ordering," and "matrix repositioning" are addressed. The three explicit "Questions to Explore" (grouped rows, expandable learner groups, compact lesson cards) are all answered by shipped code. The "do NOT remove the matrix" constraint held.

---

## Recommendation

**Do not scope a new implementation plan against `6f7a6af3`.** There is no genuinely unaddressed UX point left to build. This feedback item should be marked **resolved-by-prior-work** (G8 primarily, with G9's calendar-tab addition and today's combined-view work as supporting closure), not carried forward as an open backlog item.

If anything is worth a small follow-up later, it is cosmetic parity of empty-cell muting between the Weekly Planner and the Planning Matrix (item B above) — but that is optional matrix polish the feedback never asked for, not a `6f7a6af3` obligation. If it's ever picked up, it's a **single small mode-1/mode-2 slice** (one component, `WeekGrid.tsx`, styling-only, no data model or API changes) — not a new wave, and arguably not worth doing at all unless a *separate* piece of feedback specifically complains about the matrix view's density.

**Bottom line for the steward process:** close `6f7a6af3` as addressed, referencing this spike plus G8's plan/progress and G9's item-4 cross-reference and today's phase-3 notes as the evidence trail. No new plan document should follow this spike.

---

### Critical Files (reference only — no implementation recommended)
- `docs/20260716-lesson-planner-ux-rework-g8-plan.md`
- `docs/20260716-lesson-planner-ux-rework-g8-plan.progress.json`
- `docs/20260717-g9-timer-schedule-planner-plan.md`
- `docs/20260802-feedback-batch-prod-pull-plan.progress.json`
- `features/plan/front/components/WeeklyPlanner.tsx`
- `features/plan/front/components/PlannerViewToggle.tsx`
- `features/plan/types.ts`
