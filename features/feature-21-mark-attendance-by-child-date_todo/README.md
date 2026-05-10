# Feature 21 — Mark attendance by child/date

**STATUS:** Undeveloped (To Do)

---

**Epic:** Attendance · **Wave:** Wave 1C · **T-shirt size:** S

**User story.** As a parent, I need to quickly record that school happened today.

**Acceptance criteria (done means).** Parent can mark present/absent/partial for a child/date and edit it later.

**Dependencies.** Attendance record data model

**Build gate.** After feature 20 built

**Source / why this feature exists.** Core compliance and recordkeeping task.

**MVP rationale.** Records confidence and compliance anxiety are buying triggers.

**Risk if scoped too richly.** Overbuilding compliance logic.

**Risk if cut.** Weak recordkeeping value.

**MVP decision:** MVP Core

**Pains this feature addresses (2):**

- **PAIN-018 — Parents need attendance proof** *(Primary relief, Strong)*
  - *How this feature relieves it:* Creates the daily record that school happened.
  - *Build implication:* Must be fast and visible from daily workflow.
- **PAIN-020 — Programs need safety/accountability attendance** *(Primary relief, Strong)*
  - *How this feature relieves it:* Gives programs a shared attendance record for safety, accountability, and follow-up.
  - *Build implication:* Role permissions and visibility rules matter.

**Data model entities involved:**

- `attendance_record` — Daily attendance/time record for child/date.

**Related canonical features:** Attendance logs

**Build queue notes.** Must be faster than paper log.

**Open questions to resolve before sprint:**

- UI pattern — calendar grid, daily list, quick-tap cards?
- Mobile vs desktop differences?
- Bulk-mark a week?

---

---

**Next Steps:** Review this specification with the team. Resolve open questions before sprint planning.
