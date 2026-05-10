# Feature 29 — Attach evidence to lesson/task

**STATUS:** Undeveloped (To Do)

---

**Epic:** Portfolio · **Wave:** Wave 1D · **T-shirt size:** S

**User story.** As a parent, I need proof connected to what was assigned/completed.

**Acceptance criteria (done means).** Evidence can link to one lesson/task; lesson view shows attached evidence.

**Dependencies.** Add portfolio evidence item; Lesson/task data model

**Build gate.** After features 12 and 28 built

**Source / why this feature exists.** Connects planner to portfolio, avoiding random file bucket.

**MVP rationale.** Valuable, but not required if evidence can attach to child/subject/date in MVP.

**Risk if scoped too richly.** Complex linking UX too early.

**Risk if cut.** Evidence less connected to exact assignment.

**MVP decision:** v1.1

**Pains this feature addresses (1):**

- **PAIN-017 — Records need broader learning artifacts** *(Primary relief, Strong)*
  - *How this feature relieves it:* Linking evidence to lessons prevents random file-bucket behavior.
  - *Build implication:* Connect proof to actual work.

**Data model entities involved:**

- `evidence_item` — Portfolio/proof of learning object.

**Related canonical features:** Portfolio-to-lesson link

**Build queue notes.** Very valuable after portfolio works.

**Open questions to resolve before sprint:**

- Can one evidence item attach to multiple lessons, or strictly one?
- Recommendation: many-to-one (one evidence → one lesson) for MVP simplicity.
- What's the UI on the lesson view — show count, show thumbnails, show list?

---

---

**Next Steps:** Review this specification with the team. Resolve open questions before sprint planning.
