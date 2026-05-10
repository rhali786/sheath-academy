# Feature 17 — Basic repeating weekly pattern

**STATUS:** Undeveloped (To Do)

---

**Epic:** Planner · **Wave:** Wave 1B · **T-shirt size:** L

> ⚠️ **SPLIT REQUIRED — HIGHEST RISK ITEM IN MVP.** Recurrence is the feature that breaks planning apps. The done means hides massive complexity. Required product decisions before any code: What happens when you edit one instance vs. the series? What happens when a recurring lesson is moved — does the pattern break? What happens to historical recurrences when you delete the rule? How are recurring vs. one-time lessons displayed differently? What happens at school year boundaries? Recommended split: (17a) recurring pattern creation only — define rule, generate forward instances, no edit-series logic; (17b) recurring pattern edit and exception handling — defer to Phase 1.5 or Wave 2.

**User story.** As a parent, I need to avoid retyping the same plan every week.

**Acceptance criteria (done means).** Parent can create recurring task by weekday and subject for a date range.

**Dependencies.** Add lesson/task; Weekly planner structure

**Build gate.** After features 11 and 13 built

**Source / why this feature exists.** Reduces planning labor after core planner works.

**MVP rationale.** Useful, but not required to prove first value if manual lesson creation works.

**Risk if scoped too richly.** Recurrence bugs and edge cases.

**Risk if cut.** More repeated entry labor in MVP.

**MVP decision:** Post-MVP / v1.1

**Pains this feature addresses (2):**

- **PAIN-004 — Missed days create planning exhaustion** *(Secondary relief, Medium)*
  - *How this feature relieves it:* Copy/reuse also supports plan repair after schedule disruption.
  - *Build implication:* Do not overbuild template library first.
- **PAIN-010 — Planning labor repeats every week** *(Primary relief, Strong)*
  - *How this feature relieves it:* Reduces repeated manual planning without needing AI.
  - *Build implication:* Useful non-AI relief path; may ship earlier than AI.

**Data model entities involved:**

- `recurrence_rule` — Defines repeating weekly lesson/task patterns.

**Related canonical features:** Recurring lesson pattern

**Build queue notes.** Can defer if MVP timing is tight.

**Open questions to resolve before sprint:**

- **See split note above.** Major scoping required.
- If a recurring lesson's status is set to Skipped, does that affect future instances?
- What's the UI for creating a recurring rule — a separate flow or part of Add Lesson?

---

---

**Next Steps:** Review this specification with the team. Resolve open questions before sprint planning.
