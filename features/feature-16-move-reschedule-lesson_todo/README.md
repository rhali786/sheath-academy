# Feature 16 — Move/reschedule lesson

**STATUS:** Undeveloped (To Do)

---

**Epic:** Planner · **Wave:** Wave 1B · **T-shirt size:** S

**User story.** As a parent, I need the plan to survive real life.

**Acceptance criteria (done means).** Parent can move lesson to another date; original shows moved status or history.

**Dependencies.** Lesson status states

**Build gate.** After feature 15 built

**Source / why this feature exists.** Competitors show strong pain around plan repair and flexible rescheduling.

**MVP rationale.** The product must survive real life; plan repair is a core pain.

**Risk if scoped too richly.** Complex automations too early.

**Risk if cut.** Planner becomes brittle and parents abandon it.

**MVP decision:** MVP Core

**Pains this feature addresses (1):**

- **PAIN-004 — Missed days create planning exhaustion** *(Primary relief, Strong)*
  - *How this feature relieves it:* Lets parents repair pacing without rebuilding everything manually.
  - *Build implication:* Preserve parent control over automation.

**Data model entities involved:**

- `lesson_task` — Atomic work object for planner, progress, curriculum execution, and reports.
- `lesson_task_status_history` — Tracks status changes, moves, completions, and reschedules.
- `audit_event` — Append-only system record of important changes.

**Related canonical features:** Reschedule / plan repair

**Build queue notes.** Simple move before one-click automation.

**Open questions to resolve before sprint:**

- Does moving a lesson update the original date or create a new instance referencing the original?
- Can a lesson be moved more than once? How is history shown?
- What happens if a lesson is moved past the school year end?

---

---

**Next Steps:** Review this specification with the team. Resolve open questions before sprint planning.
