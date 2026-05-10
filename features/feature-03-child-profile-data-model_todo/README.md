# Feature 3 — Child profile data model

**STATUS:** Undeveloped (To Do)

---

**Epic:** Student / Child Profiles · **Wave:** Wave 1A · **T-shirt size:** XS

**User story.** As a parent, I need to track each child separately.

**Acceptance criteria (done means).** System stores child name, grade/level, optional DOB, active status, and household ID.

**Dependencies.** Household workspace

**Build gate.** After feature 2 built

**Source / why this feature exists.** Planning, attendance, portfolio, and reports attach to a child.

**MVP rationale.** Multi-child tracking is core homeschool value.

**Risk if scoped too richly.** Too much demographic data.

**Risk if cut.** Planner, attendance, and reports cannot attach correctly.

**MVP decision:** MVP Core

**Pains this feature addresses (2):**

- **PAIN-003 — Scattered records weaken confidence** *(Secondary relief, Medium)*
  - *How this feature relieves it:* Profiles prevent records from blending across children.
  - *Build implication:* Connect profile model to records spine.
- **PAIN-026 — Core access and identity must not block daily use** *(Primary relief, Strong)*
  - *How this feature relieves it:* Child profiles anchor child-specific work, records, attendance, and evidence.
  - *Build implication:* Treat as foundation data model with clear profile selection.

**Data model entities involved:**

- `student_profile` — Child/student record inside workspace.

**Related canonical features:** Student / child profile

**Build queue notes.** Core data model before UI polish.

**Open questions to resolve before sprint:**

- What is 'grade/level' — US K-12 only, or international labels too?
- Is DOB optional or required?
- Soft delete vs hard delete for archived children?

---

---

**Next Steps:** Review this specification with the team. Resolve open questions before sprint planning.
