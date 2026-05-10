# Feature 20 — Attendance record data model

**STATUS:** Undeveloped (To Do)

---

**Epic:** Attendance · **Wave:** Wave 1C · **T-shirt size:** XS

**User story.** As a parent, I need attendance records for compliance and tracking.

**Acceptance criteria (done means).** System stores child, date, attendance status, optional notes, optional hours/minutes.

**Dependencies.** Add/edit child profile; School year setup

**Build gate.** After features 4 and 7 built

**Source / why this feature exists.** Attendance is a records/compliance spine item across competitors.

**MVP rationale.** Records confidence and compliance anxiety are buying triggers.

**Risk if scoped too richly.** Overbuilding compliance logic.

**Risk if cut.** Weak recordkeeping value.

**MVP decision:** MVP Core

**Pains this feature addresses (3):**

- **PAIN-018 — Parents need attendance proof** *(Primary relief, Strong)*
  - *How this feature relieves it:* Attendance record data and marking attendance prove school happened.
  - *Build implication:* Must be fast and visible.
- **PAIN-020 — Programs need safety/accountability attendance** *(Primary relief, Strong)*
  - *How this feature relieves it:* Gives programs a shared attendance record for safety, accountability, and follow-up.
  - *Build implication:* Role permissions and visibility rules matter.
- **PAIN-021 — Quran sessions need attendance proof** *(Secondary relief, Medium)*
  - *How this feature relieves it:* Can support Quran/Hifz session record credibility if adapted to Quran workflows.
  - *Build implication:* Do not treat Quran sessions as generic class attendance only.

**Data model entities involved:**

- `attendance_record` — Daily attendance/time record for child/date.

**Related canonical features:** Attendance logs

**Build queue notes.** Do before advanced reporting.

**Open questions to resolve before sprint:**

- What's the attendance status enum — Present, Absent, Partial? Or Present, Absent, Excused, Sick, Holiday?
- Is there a 'Not Recorded' state, or do missing days simply not have records?
- Recommendation: keep it simple. Present, Absent, Partial.

---

---

**Next Steps:** Review this specification with the team. Resolve open questions before sprint planning.
