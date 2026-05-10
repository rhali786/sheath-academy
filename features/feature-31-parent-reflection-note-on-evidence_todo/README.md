# Feature 31 — Parent reflection/note on evidence

**STATUS:** Undeveloped (To Do)

---

**Epic:** Portfolio · **Wave:** Wave 1D · **T-shirt size:** XS

**User story.** As a parent, I need to explain why an item proves learning.

**Acceptance criteria (done means).** Evidence has parent note/reflection visible in portfolio and report view.

**Dependencies.** Add portfolio evidence item

**Build gate.** After feature 28 built

**Source / why this feature exists.** Supports portfolio quality without complex grading.

**MVP rationale.** Basic note is enough for MVP; richer reflection can come later.

**Risk if scoped too richly.** Over-designed portfolio writing flow.

**Risk if cut.** Less rich evidence context.

**MVP decision:** v1.1 / Muslim-native layer

**Pains this feature addresses (1):**

- **PAIN-017 — Records need broader learning artifacts** *(Secondary relief, Medium)*
  - *How this feature relieves it:* Parent reflection explains why evidence matters.
  - *Build implication:* Useful for portfolio quality.

**Data model entities involved:**

- `evidence_item` — Portfolio/proof of learning object.

**Related canonical features:** Portfolio notes

**Build queue notes.** Useful for Muslim-native reflection later.

**Open questions to resolve before sprint:**

- Single text field or structured (what was learned, what surprised me, etc.)?
- Recommendation: single field, prompted with a placeholder.

---

---

**Next Steps:** Review this specification with the team. Resolve open questions before sprint planning.
