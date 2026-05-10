# Feature 30 — Upload file/photo/link/text evidence

**STATUS:** Undeveloped (To Do)

---

**Epic:** Portfolio · **Wave:** Wave 1D · **T-shirt size:** L

> ⚠️ **SPLIT REQUIRED.** The done means caveat 'file/photo upload included if storage is ready' is doing massive work. File upload requires storage provider decision (S3, Cloudflare R2, equivalent), upload API, file size limits, MIME-type allowlist, progress indicators, error handling, and storage cost governance. Split into (30a) text note + URL evidence — ship this in Wave 1D; (30b) file/photo upload — separate sprint after storage architecture is decided. Do not let file upload block the rest of Portfolio.

**User story.** As a parent, I need to save photos, files, links, or text notes as proof.

**Acceptance criteria (done means).** Evidence supports text note and URL; file/photo upload included if storage is ready.

**Dependencies.** Add portfolio evidence item

**Build gate.** After feature 28 built

**Source / why this feature exists.** Portfolio without actual evidence capture is too thin.

**MVP rationale.** Evidence capture matters, but storage should not block the whole MVP.

**Risk if scoped too richly.** Storage/privacy delays.

**Risk if cut.** Portfolio feels thin without real artifact capture.

**MVP decision:** MVP simple; file optional

**Pains this feature addresses (1):**

- **PAIN-017 — Records need broader learning artifacts** *(Primary relief, Strong)*
  - *How this feature relieves it:* Lets users capture actual artifacts instead of only recording textual summaries.
  - *Build implication:* Storage/privacy architecture must be serious.

**Data model entities involved:**

- `evidence_item` — Portfolio/proof of learning object.
- `file_asset` — Metadata for uploaded photos/files linked to evidence.

**Related canonical features:** Evidence upload

**Build queue notes.** If storage delays, ship text/link first.

**Open questions to resolve before sprint:**

- **See split note above.** Storage architecture decision required.
- If file upload is deferred, ship URL + text only and label clearly.
- Max file size?
- Allowed MIME types — images only, or documents too?

---

---

**Next Steps:** Review this specification with the team. Resolve open questions before sprint planning.
