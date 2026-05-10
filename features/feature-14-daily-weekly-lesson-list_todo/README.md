# Feature 14 — Daily/weekly lesson list

**STATUS:** Undeveloped (To Do)

---

**Epic:** Lessons / Tasks · **Wave:** Wave 1B · **T-shirt size:** S

**User story.** As a parent, I need to see what is assigned today and this week.

**Acceptance criteria (done means).** Planner shows assigned lessons by day; dashboard can pull today’s list.

**Dependencies.** Add lesson/task; Child selector

**Build gate.** After features 9 and 13 built

**Source / why this feature exists.** Turns lesson creation into daily usability.

**MVP rationale.** This is the day-to-day operating spine.

**Risk if scoped too richly.** Trying to recreate full LMS/calendar too early.

**Risk if cut.** Product lacks daily utility.

**MVP decision:** MVP Core

**Pains this feature addresses (1):**

- **PAIN-015 — Students need actionable task clarity** *(Primary relief, Strong)*
  - *How this feature relieves it:* Shows students/parents what is assigned, what is done, and what remains.
  - *Build implication:* Keep task language clear and age-appropriate.

**Data model entities involved:**

- `lesson_task` — Atomic work object for planner, progress, curriculum execution, and reports.

**Related canonical features:** Lesson list / daily checklist

**Build queue notes.** Make it readable before automations.

**Open questions to resolve before sprint:**

- What's the default date range — today only, this week, or rolling 7 days?
- Are skipped lessons hidden by default?
- How are completed lessons styled — strikethrough, faded, or moved to a separate section?

---

---

**Next Steps:** Review this specification with the team. Resolve open questions before sprint planning.
