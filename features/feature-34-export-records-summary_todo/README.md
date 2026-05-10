# Feature 34 — Export records summary

**STATUS:** Undeveloped (To Do)

---

**Epic:** Reports / Exports · **Wave:** Wave 1D · **T-shirt size:** L

> ⚠️ **SPLIT REQUIRED.** 'Export or print' hides a fork. Print is a print-stylesheet CSS problem. PDF export is either server-side rendering (Puppeteer, wkhtmltopdf) or client-side library (jsPDF). These are different architectures. Split into (34a) print-optimized records page using CSS print stylesheets — ship this; (34b) PDF download — separate sprint after rendering approach is chosen.

**User story.** As a parent, I need to save/share records outside the app.

**Acceptance criteria (done means).** Parent can export or print records summary for selected child/year/date range.

**Dependencies.** Basic records report view

**Build gate.** After feature 33 built

**Source / why this feature exists.** Export makes records portable and trustable.

**MVP rationale.** Portability is a trust feature.

**Risk if scoped too richly.** PDF engineering delays.

**Risk if cut.** Parents cannot save/share records confidently.

**MVP decision:** MVP simple export

**Pains this feature addresses (3):**

- **PAIN-003 — Scattered records weaken confidence** *(Primary relief, Strong)*
  - *How this feature relieves it:* Exports make centralized records reviewable outside the app.
  - *Build implication:* Prioritize records summary export before many decorative formats.
- **PAIN-022 — Formal records need credibility** *(Secondary relief, Strong)*
  - *How this feature relieves it:* Formal PDF outputs support credible documentation.
  - *Build implication:* Keep outputs honest about source and status.
- **PAIN-024 — Families need data trust and portability** *(Secondary relief, Medium)*
  - *How this feature relieves it:* Export ability helps families trust data portability.
  - *Build implication:* Avoid lock-in; make clean data exit possible.

**Data model entities involved:**

- `report_request / report_export` — Tracks generated/exported record summaries.

**Related canonical features:** PDF/export

**Build queue notes.** PDF can come after print-friendly view.

**Open questions to resolve before sprint:**

- **See split note above.** Print or PDF — pick one for MVP.
- If print: CSS print stylesheets, page break logic, header/footer.
- If PDF: client-side or server-side rendering?
- Filename convention?

---

---

**Next Steps:** Review this specification with the team. Resolve open questions before sprint planning.
