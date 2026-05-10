# Feature 4 — Add/edit child profile

**STATUS:** Undeveloped (To Do)

---

**Epic:** Student / Child Profiles · **Wave:** Wave 1A · **T-shirt size:** S

**User story.** As a parent, I need to add my children before planning lessons.

**Acceptance criteria (done means).** Parent can create/edit/archive a child; child appears in selectors across app.

**Dependencies.** Child profile data model

**Build gate.** After feature 3 built

**Source / why this feature exists.** No homeschool records spine exists without child setup.

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

**Build queue notes.** Must support multiple children.

**Open questions to resolve before sprint:**

- What does 'archive' mean in the UI — hidden but recoverable?
- Can a child be reactivated? How?
- Confirmation flow for archive?

---

---

**Next Steps:** Review this specification with the team. Resolve open questions before sprint planning.
