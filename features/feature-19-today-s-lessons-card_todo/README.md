# Feature 19 — Today’s lessons card

**STATUS:** Undeveloped (To Do)

---

**Epic:** Dashboard · **Wave:** Wave 1B · **T-shirt size:** S

**User story.** As a parent, I need the dashboard to tell me what is due today.

**Acceptance criteria (done means).** Dashboard shows today’s tasks by child with status controls or quick links.

**Dependencies.** Daily/weekly lesson list; Lesson status states

**Build gate.** After features 14 and 15 built

**Source / why this feature exists.** Makes dashboard operational instead of decorative.

**MVP rationale.** Dashboard should tell parent where to start and what needs attention.

**Risk if scoped too richly.** Decorative dashboard wasting dev time.

**Risk if cut.** User feels lost after login.

**MVP decision:** MVP Core, thin

**Pains this feature addresses (1):**

- **PAIN-015 — Students need actionable task clarity** *(Primary relief, Strong)*
  - *How this feature relieves it:* Today’s lessons card brings daily work to the parent dashboard.
  - *Build implication:* Operational dashboard, not decoration.

**Data model entities involved:**

- `lesson_task` — Atomic work object for planner, progress, curriculum execution, and reports.

**Related canonical features:** Dashboard daily lessons

**Build queue notes.** Parent daily use begins here.

**Open questions to resolve before sprint:**

- What if there are zero lessons today — show empty state or hide the card?
- What if some children have no lessons? Show all children always or hide empty?

---

**Next Steps:** Review this specification with the team. Resolve open questions before sprint planning.
