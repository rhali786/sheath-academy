# Feature 24 — Progress by subject

**STATUS:** Undeveloped (To Do)

---

**Epic:** Progress · **Wave:** Wave 1C · **T-shirt size:** M

> ⚠️ **SCOPE DECISION NEEDED.** Done means lists four aggregations (child/subject/week/year). Building all four at once is L. Recommend scoping to two views at MVP — likely week and year as a toggle — and treating month/quarter as Wave 2.

**User story.** As a parent, I need to see progress without calculating manually.

**Acceptance criteria (done means).** Progress view shows completed/planned/skipped counts by child/subject/week/year.

**Dependencies.** Lesson status states; Subject/course setup

**Build gate.** After features 6 and 15 built

**Source / why this feature exists.** Repeated competitor value: progress tracking and parent clarity.

**MVP rationale.** Parents need visibility into what happened without manual calculation.

**Risk if scoped too richly.** Overbuilding grades/analytics.

**Risk if cut.** No progress confidence.

**MVP decision:** MVP Core, basic

**Pains this feature addresses (2):**

- **PAIN-005 — Progress is invisible until too late** *(Primary relief, Strong)*
  - *How this feature relieves it:* Progress insights can surface slipping performance before report periods.
  - *Build implication:* Make insights supportive and calm.
- **PAIN-023 — Assessment needs clarity without score obsession** *(Secondary relief, Medium)*
  - *How this feature relieves it:* Analytics can clarify assessment but can also overemphasize scores.
  - *Build implication:* Balance metrics with narrative and mastery context.

**Related canonical features:** Progress summaries

**Build queue notes.** First version can be count-based.

**Open questions to resolve before sprint:**

- **Scope decision: which time aggregations ship in MVP?**
- Recommendation: week and year as a toggle. Defer month/quarter.
- How are 'planned' counts calculated — only lessons that exist, or also lessons that should exist based on recurrence?

---

---

**Next Steps:** Review this specification with the team. Resolve open questions before sprint planning.
