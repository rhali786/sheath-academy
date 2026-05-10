# Feature 23 — Attendance summary

**STATUS:** Undeveloped (To Do)

---

**Epic:** Attendance · **Wave:** Wave 1C · **T-shirt size:** M

> ⚠️ **RESOLVE BEFORE SPRINT.** 'Missing days' requires a rule: which days should have attendance? School days only? Every day? Weekday + active school year + non-holiday? This rule affects the summary's accuracy and the records review checklist (#35) downstream.

**User story.** As a parent, I need to know if records are complete.

**Acceptance criteria (done means).** Parent can see attendance count and missing days for selected child/year.

**Dependencies.** Mark attendance by child/date; School year setup

**Build gate.** After features 7 and 21 built

**Source / why this feature exists.** Summaries make records usable and audit-ready.

**MVP rationale.** Raw attendance entries need summary to create confidence.

**Risk if scoped too richly.** Overclaiming legal compliance.

**Risk if cut.** Attendance log is not useful enough.

**MVP decision:** MVP Core

**Pains this feature addresses (1):**

- **PAIN-018 — Parents need attendance proof** *(Primary relief, Strong)*
  - *How this feature relieves it:* Turns daily records into reviewable totals and missing-day visibility.
  - *Build implication:* Summaries should not overclaim legal compliance.

**Data model entities involved:**

- `attendance_record` — Daily attendance/time record for child/date.

**Related canonical features:** Attendance summary

**Build queue notes.** Foundation for reports/export.

**Open questions to resolve before sprint:**

- **Define 'school days' rule.** Weekdays only? Weekday + active school year + non-holiday? Per-household configurable?
- What's a 'missing day' — only weekdays, only days in active school year?
- How is the summary scoped — current week, current month, school year?

---

---

**Next Steps:** Review this specification with the team. Resolve open questions before sprint planning.
