# Feature 13 — Add lesson/task

**STATUS:** Undeveloped (To Do)

---

**Epic:** Lessons / Tasks · **Wave:** Wave 1B · **T-shirt size:** S

**User story.** As a parent, I need to add what each child should do.

**Acceptance criteria (done means).** Parent can add, edit, and delete a lesson/task for selected child, subject, and date.

**Dependencies.** Lesson/task data model

**Build gate.** After feature 12 built

**Source / why this feature exists.** Without this, planner is only a shell.

**MVP rationale.** This is the day-to-day operating spine.

**Risk if scoped too richly.** Trying to recreate full LMS/calendar too early.

**Risk if cut.** Product lacks daily utility.

**MVP decision:** MVP Core

**Pains this feature addresses (2):**

- **PAIN-014 — Fast data entry is essential** *(Primary relief, Strong)*
  - *How this feature relieves it:* Task records relieve operational burden only if the common entry path is fast and progressively detailed.
  - *Build implication:* Require minimal fields first; optional details later.
- **PAIN-016 — Curriculum must become actionable work** *(Primary relief, Strong)*
  - *How this feature relieves it:* Turns curriculum content into child-level assigned work.
  - *Build implication:* Curriculum cannot remain a detached content library.

**Data model entities involved:**

- `lesson_task` — Atomic work object for planner, progress, curriculum execution, and reports.

**Related canonical features:** Lesson/task creation

**Build queue notes.** First real usable planning action.

**Open questions to resolve before sprint:**

- What fields are required vs optional?
- Date picker default — today or selected planner date?
- Subject dropdown filtered by selected child?

---

---

**Next Steps:** Review this specification with the team. Resolve open questions before sprint planning.
