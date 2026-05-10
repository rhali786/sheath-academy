# Feature 6 — Create subject/course for child

**STATUS:** Undeveloped (To Do)

---

**Epic:** Subjects / Courses · **Wave:** Wave 1A · **T-shirt size:** S

**User story.** As a parent, I need to set up the subjects each child is studying.

**Acceptance criteria (done means).** Parent can create at least one subject for each child and see it in course list.

**Dependencies.** Subject/course data model

**Build gate.** After feature 5 built

**Source / why this feature exists.** Turns child profiles into usable homeschool records.

**MVP rationale.** Lessons, progress, reports, and portfolio need subject organization.

**Risk if scoped too richly.** Overbuilding curriculum catalog too early.

**Risk if cut.** Work becomes a generic task list with weak educational meaning.

**MVP decision:** MVP Core

**Pains this feature addresses (1):**

- **PAIN-029 — Muslim subjects need native records** *(Primary relief, Strong)*
  - *How this feature relieves it:* Flexible subject/course setup creates room for Quran, Arabic, Islamic Studies, and ordinary subjects.
  - *Build implication:* Keep generic enough for all subjects but ready for native templates.

**Data model entities involved:**

- `subject_course` — Subject/course container for learning records.

**Related canonical features:** Subject/course setup

**Build queue notes.** Keep form short.

**Open questions to resolve before sprint:**

- Can the same subject (e.g., 'Math') be created independently for each child, or shared at the household level?
- MVP recommendation: per-child for simplicity. Shared subjects come later if needed.

---

---

**Next Steps:** Review this specification with the team. Resolve open questions before sprint planning.
