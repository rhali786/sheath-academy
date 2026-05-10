# Feature 12 — Lesson/task data model

**STATUS:** Undeveloped (To Do)

---

**Epic:** Lessons / Tasks · **Wave:** Wave 1B · **T-shirt size:** XS

**User story.** As a parent, I need individual lessons/tasks to plan and track.

**Acceptance criteria (done means).** System stores title, child, subject, date, status, notes, optional resource link.

**Dependencies.** Weekly planner structure

**Build gate.** After feature 11 built

**Source / why this feature exists.** Lessons are the atomic unit for planning, progress, and reporting.

**MVP rationale.** This is the day-to-day operating spine.

**Risk if scoped too richly.** Trying to recreate full LMS/calendar too early.

**Risk if cut.** Product lacks daily utility.

**MVP decision:** MVP Core

**Pains this feature addresses (1):**

- **PAIN-016 — Curriculum must become actionable work** *(Primary relief, Strong)*
  - *How this feature relieves it:* Creates the atomic work object that curriculum can attach to.
  - *Build implication:* Core platform architecture dependency.

**Data model entities involved:**

- `lesson_task` — Atomic work object for planner, progress, curriculum execution, and reports.

**Related canonical features:** Lesson/task creation

**Build queue notes.** Unlocks multiple later features.

**Open questions to resolve before sprint:**

- What's the difference between a 'lesson' and a 'task' in the data model — same entity, different label, or two entities?
- MVP recommendation: one entity called `lesson_task`.
- Status enum values — exact list?

---

---

**Next Steps:** Review this specification with the team. Resolve open questions before sprint planning.
