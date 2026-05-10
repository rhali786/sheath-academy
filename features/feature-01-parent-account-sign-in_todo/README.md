# Feature 1 — Parent account sign-in

**STATUS:** Undeveloped (To Do)

---

**Epic:** Account / Workspace · **Wave:** Wave 1A · **T-shirt size:** S

**User story.** As a parent, I need to access my household workspace securely.

**Acceptance criteria (done means).** Parent can create account, sign in, sign out, and return to same workspace.

**Dependencies.** None

**Build gate.** Ready

**Source / why this feature exists.** Every other workflow requires a parent/admin identity.

**MVP rationale.** No product exists without secure parent access.

**Risk if cut.** No persistent user system.

**MVP decision:** MVP Core

**Pains this feature addresses (1):**

- **PAIN-026 — Core access and identity must not block daily use** *(Primary relief, Strong)*
  - *How this feature relieves it:* Parent identity is required before any household records can exist.
  - *Build implication:* Foundation row; keep simple for MVP.

**Data model entities involved:**

- `user_account` — Authentication identity for parent/admin and future users.

**Related canonical features:** Parent/admin account

**Build queue notes.** Keep simple; no institution roles yet.

**Open questions to resolve before sprint:**

- Auth provider: roll our own (NextAuth + email/password), use a managed service (Clerk, Auth0, Supabase Auth), or magic link only?
- Email verification required at signup or deferred?
- Password requirements?
- Session length and refresh policy?

---

---

**Next Steps:** Review this specification with the team. Resolve open questions before sprint planning.
