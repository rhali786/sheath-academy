# Feature 22 — Optional hours/minutes field

**STATUS:** Undeveloped (To Do)

---

**Epic:** Attendance · **Wave:** Wave 1C · **T-shirt size:** XS

**User story.** As a parent, I need to record hours when required or useful.

**Acceptance criteria (done means).** Attendance entry can store hours/minutes; blank allowed where not needed.

**Dependencies.** Mark attendance by child/date

**Build gate.** After feature 21 built

**Source / why this feature exists.** Some states/families need time records; avoid forcing all users.

**MVP rationale.** Some families need it; others should not be forced into it.

**Risk if scoped too richly.** Making all users feel legally burdened.

**Risk if cut.** Families in hour-based contexts lack required tracking.

**MVP decision:** MVP Core, optional

**Pains this feature addresses (1):**

- **PAIN-019 — Parents need hours documentation** *(Primary relief, Strong)*
  - *How this feature relieves it:* Supports time documentation where required without burdening families that do not need it.
  - *Build implication:* Optional, not universal; avoid compliance overreach.

**Data model entities involved:**

- `attendance_record` — Daily attendance/time record for child/date.

**Related canonical features:** Hours tracking

**Build queue notes.** Optional and unobtrusive.

**Open questions to resolve before sprint:**

- Validation rule — minutes 0-59, hours unconstrained, or capped at 24?
- Display format — '2h 30m' or '2.5 hours' or both?

---

---

**Next Steps:** Review this specification with the team. Resolve open questions before sprint planning.
