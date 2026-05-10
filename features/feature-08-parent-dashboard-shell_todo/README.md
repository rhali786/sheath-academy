# Feature 8 — Parent dashboard shell

**STATUS:** Undeveloped (To Do)

---

**Epic:** Dashboard · **Wave:** Wave 1A · **T-shirt size:** M

> ⚠️ **SPLIT RECOMMENDED.** The done means combines a layout shell with five distinct empty-state prompts. Split into (8a) layout, navigation, and routing scaffold; (8b) empty state system with prompt sequence and copy. Different deliverables, different review surfaces.

**User story.** As a parent, I need a home base to see what to do next.

**Acceptance criteria (done means).** Dashboard loads and shows empty-state prompts for children, subjects, lessons, attendance, portfolio.

**Dependencies.** Parent account sign-in; Household workspace

**Build gate.** After features 1 and 2 built

**Source / why this feature exists.** Competitors repeatedly sell the all-in-one dashboard promise.

**MVP rationale.** Dashboard should tell parent where to start and what needs attention.

**Risk if scoped too richly.** Decorative dashboard wasting dev time.

**Risk if cut.** User feels lost after login.

**MVP decision:** MVP Core, thin

**Pains this feature addresses (3):**

- **PAIN-003 — Scattered records weaken confidence** *(Secondary relief, Medium)*
  - *How this feature relieves it:* Dashboard can unify records, tasks, attendance, and progress context.
  - *Build implication:* Surface records state without duplicating every module.
- **PAIN-005 — Progress is invisible until too late** *(Secondary relief, Medium)*
  - *How this feature relieves it:* Dashboard can reveal slipping progress early enough for support.
  - *Build implication:* Avoid anxious warning systems.
- **PAIN-027 — Parents need one operating surface** *(Primary relief, Strong)*
  - *How this feature relieves it:* Dashboard reduces hunting across tabs and surfaces next actions.
  - *Build implication:* Keep dashboard calm and action-oriented.

**Related canonical features:** Parent dashboard

**Build queue notes.** Start as shell; cards come later.

**Open questions to resolve before sprint:**

- Wireframe needed before sprint. Mobile-first or desktop-first?
- What are the 5 empty states' exact copy?
- Do prompts dismiss permanently or rotate?

---

---

**Next Steps:** Review this specification with the team. Resolve open questions before sprint planning.
