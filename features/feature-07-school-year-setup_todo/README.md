# Feature 7 — School year setup

**STATUS:** Undeveloped (To Do)

---

**Epic:** School Year / Term · **Wave:** Wave 1A · **T-shirt size:** S

**User story.** As a parent, I need records organized by school year.

**Acceptance criteria (done means).** Parent can set school year name, start date, end date, and active year.

**Dependencies.** Household workspace; Add/edit child profile

**Build gate.** After features 2 and 4 built

**Source / why this feature exists.** Needed for reports and summaries; not first-day blocker.

**MVP rationale.** Reports and attendance need a time container.

**Risk if scoped too richly.** Building terms/calendars too richly.

**Risk if cut.** Reports/export lack context.

**MVP decision:** MVP Core, simple

**Pains this feature addresses (1):**

- **PAIN-022 — Formal records need credibility** *(Secondary relief, Medium)*
  - *How this feature relieves it:* Records and reports need a year/term container to be credible.
  - *Build implication:* Keep simple; avoid calendar bloat.

**Data model entities involved:**

- `school_year` — Organizes records and reports by school year/term.

**Related canonical features:** School year / term setup

**Build queue notes.** Do not overbuild calendars yet.

**Open questions to resolve before sprint:**

- Does the parent set the school year manually or does the system suggest a default (e.g., Aug 1 – May 31)?
- Can a household have multiple active school years (e.g., transitioning between years)?
- What happens to existing data when a school year ends?

---

---

**Next Steps:** Review this specification with the team. Resolve open questions before sprint planning.
