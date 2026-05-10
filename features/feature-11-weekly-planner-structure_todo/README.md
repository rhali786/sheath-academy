# Feature 11 — Weekly planner structure

**STATUS:** Undeveloped (To Do)

---

**Epic:** Planner · **Wave:** Wave 1B · **T-shirt size:** M

> ⚠️ **RESOLVE BEFORE SPRINT.** Needs a wireframe decision before coding starts: is this a desktop-style week grid, a mobile vertical list, or both? The grid layout choice affects every downstream planner feature.

**User story.** As a parent, I need to see the learning week at a glance.

**Acceptance criteria (done means).** Parent can view a week, move between weeks, and see child/subject/day organization.

**Dependencies.** Child profile; Subject/course setup; School year setup

**Build gate.** After features 4, 6, 7 built

**Source / why this feature exists.** Planning/scheduling is one of the highest recurring competitor feature families.

**MVP rationale.** This is the day-to-day operating spine.

**Risk if scoped too richly.** Trying to recreate full LMS/calendar too early.

**Risk if cut.** Product lacks daily utility.

**MVP decision:** MVP Core

**Pains this feature addresses (2):**

- **PAIN-004 — Missed days create planning exhaustion** *(Secondary relief, Medium)*
  - *How this feature relieves it:* Scheduling matters because it enables later plan repair.
  - *Build implication:* Tie to rescheduling and pacing repair.
- **PAIN-010 — Planning labor repeats every week** *(Primary relief, Strong)*
  - *How this feature relieves it:* Planbook scheduling reduces weekly reconstruction work.
  - *Build implication:* Keep parent-controlled; avoid calendar bloat.

**Data model entities involved:**

- `lesson_task` — Atomic work object for planner, progress, curriculum execution, and reports.

**Related canonical features:** Calendar / planbook scheduling

**Build queue notes.** Keep first version simple and fast.

**Open questions to resolve before sprint:**

- **Wireframe required.** Grid layout, list layout, or hybrid?
- Mobile rendering — vertical day list?
- Default week starts Sunday or Monday?
- How are weekends shown — collapsed, hidden, or equal?

---

---

**Next Steps:** Review this specification with the team. Resolve open questions before sprint planning.
