# Feature 5 — Subject/course data model

**STATUS:** Undeveloped (To Do)

---

**Epic:** Subjects / Courses · **Wave:** Wave 1A · **T-shirt size:** XS

**User story.** As a parent, I need subjects/courses to organize learning.

**Acceptance criteria (done means).** System stores subject/course name, child, category, active status, and order.

**Dependencies.** Add/edit child profile

**Build gate.** After feature 4 built

**Source / why this feature exists.** Lessons, progress, portfolio, and reports need a subject/course spine.

**MVP rationale.** Lessons, progress, reports, and portfolio need subject organization.

**Risk if scoped too richly.** Overbuilding curriculum catalog too early.

**Risk if cut.** Work becomes a generic task list with weak educational meaning.

**MVP decision:** MVP Core

**Pains this feature addresses (3):**

- **PAIN-016 — Curriculum must become actionable work** *(Secondary relief, Strong)*
  - *How this feature relieves it:* Native subjects still need to become lessons, goals, evidence, and progress records.
  - *Build implication:* Connect Muslim-native fields to lesson/task/evidence model.
- **PAIN-017 — Records need broader learning artifacts** *(Secondary relief, Medium)*
  - *How this feature relieves it:* Quran/audio/adab/service evidence requires artifact types beyond generic grades.
  - *Build implication:* Include evidence models for Muslim learning domains.
- **PAIN-029 — Muslim subjects need native records** *(Primary relief, Strong)*
  - *How this feature relieves it:* Quran, Arabic, Islamic Studies, and adab need non-generic fields.
  - *Build implication:* Make this a core Sheath data architecture decision.

**Data model entities involved:**

- `subject_course` — Subject/course container for learning records.

**Related canonical features:** Subject/course setup

**Build queue notes.** Use flexible model for Quran/Arabic later.

**Open questions to resolve before sprint:**

- What is 'category' — predefined enum (Quran, Arabic, Islamic Studies, Math, Reading, Science, History, English, Other) or freeform?
- Should categories drive default colors/icons?

---

---

**Next Steps:** Review this specification with the team. Resolve open questions before sprint planning.
