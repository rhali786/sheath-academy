# Feature 27 — Portfolio evidence data model

**STATUS:** Undeveloped (To Do)

---

**Epic:** Portfolio · **Wave:** Wave 1D · **T-shirt size:** XS

**User story.** As a parent, I need to preserve proof of learning.

**Acceptance criteria (done means).** System stores evidence title, child, subject, date, type, notes, and created by.

**Dependencies.** Child profile; Subject/course setup

**Build gate.** After features 4 and 6 built

**Source / why this feature exists.** Portfolio/proof is central to Sheath and repeated competitor signal.

**MVP rationale.** Proof of learning is a key Sheath differentiator and record-confidence feature.

**Risk if scoped too richly.** Too many media/storage complications.

**Risk if cut.** No proof-of-learning layer.

**MVP decision:** MVP Core

**Pains this feature addresses (1):**

- **PAIN-017 — Records need broader learning artifacts** *(Primary relief, Strong)*
  - *How this feature relieves it:* Creates a place for non-grade evidence such as files, notes, links, photos, and reflections.
  - *Build implication:* Do not make portfolio a random bucket detached from learning records.

**Data model entities involved:**

- `evidence_item` — Portfolio/proof of learning object.

**Related canonical features:** Portfolio / proof

**Build queue notes.** Data model before upload UI.

**Open questions to resolve before sprint:**

- What's the type enum for evidence — Photo, Document, Writing Sample, Project, Recitation, Other?
- Is 'created by' relevant in MVP (probably parent only) or only future-state?

---

---

**Next Steps:** Review this specification with the team. Resolve open questions before sprint planning.
