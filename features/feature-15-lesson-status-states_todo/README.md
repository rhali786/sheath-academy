# Feature 15 — Lesson status states

**STATUS:** Undeveloped (To Do)

---

**Epic:** Lessons / Tasks · **Wave:** Wave 1B · **T-shirt size:** S

**User story.** As a parent, I need to track what actually happened.

**Acceptance criteria (done means).** Parent can change status; completed/skipped/moved status is stored with timestamp.

**Dependencies.** Daily/weekly lesson list

**Build gate.** After feature 14 built

**Source / why this feature exists.** Required for progress, attendance logic, reports, and rescheduling.

**MVP rationale.** The product must survive real life; plan repair is a core pain.

**Risk if scoped too richly.** Complex automations too early.

**Risk if cut.** Planner becomes brittle and parents abandon it.

**MVP decision:** MVP Core

**Pains this feature addresses (1):**

- **PAIN-014 — Fast data entry is essential** *(Primary relief, Strong)*
  - *How this feature relieves it:* Fast status changes capture what actually happened.
  - *Build implication:* Simple states first.

**Data model entities involved:**

- `lesson_task` — Atomic work object for planner, progress, curriculum execution, and reports.
- `lesson_task_status_history` — Tracks status changes, moves, completions, and reschedules.

**Related canonical features:** Lesson completion tracking

**Build queue notes.** Use simple states now; nuance later.

**Open questions to resolve before sprint:**

- Exact status enum: Not Started, Completed, Skipped, Moved? Anything else?
- Is 'Moved' a status or a different concept (the original instance becomes a tombstone)?
- Can status be changed back from Completed to Not Started?

---

---

**Next Steps:** Review this specification with the team. Resolve open questions before sprint planning.
