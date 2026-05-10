# Feature 28 — Add portfolio evidence item

**STATUS:** Undeveloped (To Do)

---

**Epic:** Portfolio · **Wave:** Wave 1D · **T-shirt size:** S

**User story.** As a parent, I need to add proof quickly after learning happens.

**Acceptance criteria (done means).** Parent can add evidence item with title, child, subject, date, type, and note.

**Dependencies.** Portfolio evidence data model

**Build gate.** After feature 27 built

**Source / why this feature exists.** This is the first real portfolio action.

**MVP rationale.** Proof of learning is a key Sheath differentiator and record-confidence feature.

**Risk if scoped too richly.** Too many media/storage complications.

**Risk if cut.** No proof-of-learning layer.

**MVP decision:** MVP Core

**Pains this feature addresses (1):**

- **PAIN-017 — Records need broader learning artifacts** *(Primary relief, Strong)*
  - *How this feature relieves it:* Portfolio data model creates a place for learning proof beyond grades.
  - *Build implication:* Connect to learning records.

**Data model entities involved:**

- `evidence_item` — Portfolio/proof of learning object.

**Related canonical features:** Portfolio capture

**Build queue notes.** Keep simple; file handling next.

**Open questions to resolve before sprint:**

- What fields are required at minimum?
- Quick-add flow — one screen or wizard?

---

---

**Next Steps:** Review this specification with the team. Resolve open questions before sprint planning.
