# Feature 2 — Household workspace

**STATUS:** Undeveloped (To Do)

---

**Epic:** Account / Workspace · **Wave:** Wave 1A · **T-shirt size:** S

**User story.** As a parent, I need one place for my family records.

**Acceptance criteria (done means).** New account creates or joins one household; household has name, owner, and created date.

**Dependencies.** Parent account sign-in

**Build gate.** After feature 1 built

**Source / why this feature exists.** Homeschool product is household-first.

**MVP rationale.** The homeschool unit is the family/household; this prevents loose records.

**Risk if scoped too richly.** Overbuilding institutions here.

**Risk if cut.** Records become scattered and hard to scope.

**MVP decision:** MVP Core

**Pains this feature addresses (1):**

- **PAIN-027 — Parents need one operating surface** *(Primary relief, Strong)*
  - *How this feature relieves it:* A household workspace gives the parent one family operating context.
  - *Build implication:* Foundation row; keep household-first.

**Data model entities involved:**

- `workspace` — Generic container for household now and institutions later.
- `household_profile` — Homeschool-specific profile for family/household context.

**Related canonical features:** Household/family profile

**Build queue notes.** This becomes the parent’s operating layer.

**Open questions to resolve before sprint:**

- Can a single user belong to multiple workspaces (e.g., remarried family, co-parenting)? MVP answer: probably no, defer to Wave 3.
- What's the workspace name default — 'Naeem Family' style, or just left blank?

---

---

**Next Steps:** Review this specification with the team. Resolve open questions before sprint planning.
