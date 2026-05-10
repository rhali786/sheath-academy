# Feature 10 — Next setup prompt

**STATUS:** Undeveloped (To Do)

---

**Epic:** Dashboard · **Wave:** Wave 1A · **T-shirt size:** S

**User story.** As a new parent user, I need to know what to do first.

**Acceptance criteria (done means).** Dashboard prompts: add child, add subject, create first lesson, mark attendance, add portfolio evidence.

**Dependencies.** Parent dashboard shell; Child selector

**Build gate.** After features 8 and 9 built

**Source / why this feature exists.** Reduces onboarding confusion and support burden.

**MVP rationale.** Dashboard should tell parent where to start and what needs attention.

**Risk if scoped too richly.** Decorative dashboard wasting dev time.

**Risk if cut.** User feels lost after login.

**MVP decision:** MVP Core, thin

**Pains this feature addresses (1):**

- **PAIN-030 — Onboarding friction blocks adoption** *(Primary relief, Medium)*
  - *How this feature relieves it:* Guidance reduces setup confusion by showing next missing action.
  - *Build implication:* Rules-based before AI.

**Related canonical features:** Guided next-action assistant

**Build queue notes.** Small UX feature with high leverage.

**Open questions to resolve before sprint:**

- What's the prompt order? Hardcoded sequence or smart based on what's missing?
- What does 'completed' look like — does the prompt strip disappear entirely after setup?

---

**Next Steps:** Review this specification with the team. Resolve open questions before sprint planning.
