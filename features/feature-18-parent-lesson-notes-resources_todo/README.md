# Feature 18 — Parent lesson notes/resources

**STATUS:** Undeveloped (To Do)

---

**Epic:** Lessons / Tasks · **Wave:** Wave 1B · **T-shirt size:** S

**User story.** As a parent, I need to attach page, link, or reminder.

**Acceptance criteria (done means).** Lesson supports notes and one or more resource links/text references.

**Dependencies.** Add lesson/task

**Build gate.** After feature 13 built

**Source / why this feature exists.** Keeps planner practical without full curriculum import.

**MVP rationale.** This is the day-to-day operating spine.

**Risk if scoped too richly.** Trying to recreate full LMS/calendar too early.

**Risk if cut.** Product lacks daily utility.

**MVP decision:** MVP Core

**Pains this feature addresses (1):**

- **PAIN-014 — Fast data entry is essential** *(Secondary relief, Medium)*
  - *How this feature relieves it:* Notes/resources keep lesson entry practical without full curriculum import.
  - *Build implication:* Text/link first; files later.

**Data model entities involved:**

- `lesson_task` — Atomic work object for planner, progress, curriculum execution, and reports.

**Related canonical features:** Lesson notes / resources

**Build queue notes.** Text/link first; files later.

**Open questions to resolve before sprint:**

- Is 'one or more resource links' an array or a single field?
- Are notes markdown-supported or plain text?
- Are URLs auto-linkified?

---

---

**Next Steps:** Review this specification with the team. Resolve open questions before sprint planning.
