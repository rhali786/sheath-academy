# Feature 33 — Basic records report view

**STATUS:** Undeveloped (To Do)

---

**Epic:** Reports / Exports · **Wave:** Wave 1D · **T-shirt size:** M

> ⚠️ **BORDERLINE M.** Read-only view aggregating five data sources. Complexity is in layout and aggregation, not new logic. Treat as M but resolve the visual design question before sprint: how do five record types coexist on one page without overwhelming the parent?

**User story.** As a parent, I need a summary of homeschool records.

**Acceptance criteria (done means).** Report includes child info, subjects, attendance, completed lessons, and portfolio count.

**Dependencies.** Attendance summary; Progress by subject; Portfolio list and filters

**Build gate.** After features 23, 24, 32 built

**Source / why this feature exists.** Reports/exports are repeated competitor and homeschool compliance value.

**MVP rationale.** Report view turns records into usable confidence.

**Risk if scoped too richly.** PDF/export complexity too early if report itself is weak.

**Risk if cut.** Records remain trapped in app views.

**MVP decision:** MVP Core

**Pains this feature addresses (3):**

- **PAIN-003 — Scattered records weaken confidence** *(Primary relief, Strong)*
  - *How this feature relieves it:* Brings attendance, grades, notes, and evidence into one operational layer.
  - *Build implication:* Should remain core operating spine.
- **PAIN-022 — Formal records need credibility** *(Secondary relief, Strong)*
  - *How this feature relieves it:* Formal PDF outputs support credible documentation.
  - *Build implication:* Keep outputs honest about source and status.
- **PAIN-024 — Families need data trust and portability** *(Secondary relief, Medium)*
  - *How this feature relieves it:* Export ability helps families trust data portability.
  - *Build implication:* Avoid lock-in; make clean data exit possible.

**Data model entities involved:**

- `report_request / report_export` — Tracks generated/exported record summaries.

**Related canonical features:** Reports / exports

**Build queue notes.** Start with readable HTML/print view.

**Open questions to resolve before sprint:**

- **Visual design needed.** How do five data types coexist on one page?
- Print-friendly by default or web-first?
- Date range picker?

---

---

**Next Steps:** Review this specification with the team. Resolve open questions before sprint planning.
