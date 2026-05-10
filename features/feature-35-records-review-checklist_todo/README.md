# Feature 35 — Records review checklist

**STATUS:** Undeveloped (To Do)

---

**Epic:** Records QA · **Wave:** Wave 1D · **T-shirt size:** S

**User story.** As a parent, I need to know if my records are incomplete.

**Acceptance criteria (done means).** Checklist flags missing attendance days, subjects without lessons, and no portfolio evidence.

**Dependencies.** Attendance summary; Progress by subject; Portfolio list and filters

**Build gate.** After features 23, 24, 32 built

**Source / why this feature exists.** Trust feature that prevents false confidence.

**MVP rationale.** Valuable trust feature, but may not be needed before basic reports/export.

**Risk if scoped too richly.** Legal/compliance overclaiming.

**Risk if cut.** Parents miss gaps.

**MVP decision:** v1.1 unless very thin

**Pains this feature addresses (1):**

- **PAIN-025 — Compliance confidence needs bounded guidance** *(Primary relief, Medium)*
  - *How this feature relieves it:* Checklist shows record gaps before export without claiming legal certainty.
  - *Build implication:* Trust feature, not legal guarantee.

**Data model entities involved:**

- `report_request / report_export` — Tracks generated/exported record summaries.
- `records_check` — Computed checklist/gap signals before export.

**Related canonical features:** Records checklist

**Build queue notes.** Do not overclaim legal compliance.

**Open questions to resolve before sprint:**

- What gaps are flagged — missing attendance days, subjects with no lessons, no portfolio items, anything else?
- Are these advisory (here's what's incomplete) or blocking (you cannot export until X)?
- Recommendation: advisory.


---

# 5. Build sequence summary

All 35 features in dependency order with t-shirt sizes for sprint planning.

| # | Feature | Wave | Epic | Size | Notes |
|---|---|---|---|---|---|
| 1 | Parent account sign-in | 1A | Account / Workspace | S |  |
| 2 | Household workspace | 1A | Account / Workspace | S |  |
| 3 | Child profile data model | 1A | Student / Child Profiles | XS |  |
| 4 | Add/edit child profile | 1A | Student / Child Profiles | S |  |
| 5 | Subject/course data model | 1A | Subjects / Courses | XS |  |
| 6 | Create subject/course for child | 1A | Subjects / Courses | S |  |
| 7 | School year setup | 1A | School Year / Term | S |  |
| 8 | Parent dashboard shell | 1A | Dashboard | M | **Split** |
| 9 | Child selector | 1A | Dashboard | S |  |
| 10 | Next setup prompt | 1A | Dashboard | S |  |
| 11 | Weekly planner structure | 1B | Planner | M | **Resolve first** |
| 12 | Lesson/task data model | 1B | Lessons / Tasks | XS |  |
| 13 | Add lesson/task | 1B | Lessons / Tasks | S |  |
| 14 | Daily/weekly lesson list | 1B | Lessons / Tasks | S |  |
| 15 | Lesson status states | 1B | Lessons / Tasks | S |  |
| 16 | Move/reschedule lesson | 1B | Planner | S |  |
| 17 | Basic repeating weekly pattern | 1B | Planner | L | **Split** |
| 18 | Parent lesson notes/resources | 1B | Lessons / Tasks | S |  |
| 19 | Today’s lessons card | 1B | Dashboard | S |  |
| 20 | Attendance record data model | 1C | Attendance | XS |  |
| 21 | Mark attendance by child/date | 1C | Attendance | S |  |
| 22 | Optional hours/minutes field | 1C | Attendance | XS |  |
| 23 | Attendance summary | 1C | Attendance | M | **Resolve first** |
| 24 | Progress by subject | 1C | Progress | M | **Scope decision** |
| 25 | Completed lesson history | 1C | Progress | S |  |
| 26 | Progress and attendance cards | 1C | Dashboard | S |  |
| 27 | Portfolio evidence data model | 1D | Portfolio | XS |  |
| 28 | Add portfolio evidence item | 1D | Portfolio | S |  |
| 29 | Attach evidence to lesson/task | 1D | Portfolio | S |  |
| 30 | Upload file/photo/link/text evidence | 1D | Portfolio | L | **Split** |
| 31 | Parent reflection/note on evidence | 1D | Portfolio | XS |  |
| 32 | Portfolio list and filters | 1D | Portfolio | S |  |
| 33 | Basic records report view | 1D | Reports / Exports | M | Borderline |
| 34 | Export records summary | 1D | Reports / Exports | L | **Split** |
| 35 | Records review checklist | 1D | Records QA | S |  |

**Size totals:** XS = 6 · S = 19 · M = 6 · L = 4

**Items requiring splits or pre-sprint decisions:** 8 (split or scope-decide), 17 (split required, highest risk), 30 (split required), 34 (split required), 11 (resolve wireframe), 23 (resolve school-day rule), 24 (scope aggregations), 33 (resolve visual design).

---

# 6. Cross-cutting concerns

Decisions that span multiple features and need a single answer rather than per-feature negotiation.

## 6.1 Authentication and session

Resolves before Feature #1. Affects every protected route across the app.

- Auth provider — managed (Clerk, Supabase Auth, NextAuth + provider) or self-rolled?
- Email verification — required at signup or deferred until first sensitive action?
- Session persistence — JWT, server session, or both?
- Password recovery flow — email link, OTP, or both?
- Multi-device sign-in policy.

**Recommendation:** managed auth provider for Wave 1. Don't custom-roll password security. The Data Model `notes` column for `user_account` says this explicitly.

## 6.2 Multi-tenancy and workspace scoping

Resolves before Feature #2. Affects every database query and every API endpoint.

- Every query must scope to the active `workspace_id`.
- Workspace membership is checked at the API middleware layer, not per-feature.
- Future-state: a single user may belong to multiple workspaces. MVP simplification: one workspace per user, but the schema supports the future case.

## 6.3 Feature module structure

Each feature module owns its own:
- API router (`features/<feature>/api/`)
- Data access layer / repository
- Page (`features/<feature>/page.tsx`)
- Dashboard widget (`features/<feature>/widget.tsx`)
- Shared types and validation schemas

The dashboard composes widgets from features. The dashboard does not own data. This is the architectural fix to the monolith CC flagged.

## 6.4 Empty states

Affects Features #8, #10, #19, #26, #32, and any list view in Wave 1.

Every list view, dashboard card, and report needs a designed empty state. The empty state should:
- Tell the parent why the section is empty (not a generic 'no data')
- Tell them the next action (create a child, add a subject, mark today's attendance)
- Link or button to that next action

Empty states are not afterthoughts. For a brand-new user, every screen is empty for several days.

## 6.5 Mobile vs. desktop

Wave 1 must work on mobile. Most homeschool parents log attendance and check today's lesson list from a phone. Wireframe decisions for Features #8, #11, #14, #21 must address mobile behavior explicitly, not as a responsive afterthought.

## 6.6 Validation

Use a single shared schema definition (Zod, Valibot, or equivalent) for both client and server validation. Never validate twice with different rules.

Per-feature validation rules (date ranges, required fields, enum values) should be defined in `features/<feature>/schema.ts` and imported by both the API route and the form component.

## 6.7 Date and time handling

Affects Features #7, #15, #20, #21, #22, and any feature with a date.

- Store all timestamps in UTC.
- Display in the household's local timezone (stored on `household_profile`).
- 'Today' is always relative to the household timezone, not the server.
- 'School year' is a date range stored as `start_date` and `end_date`, both inclusive.

## 6.8 Privacy and data trust

PAIN-024 is addressed across Wave 1 by:
- Soft deletion as default (children, subjects, lessons, evidence). Records are recoverable.
- Export endpoints in Feature #34 give the user their data back in a portable format.
- No third-party analytics, tracking, or advertising integrations in Wave 1.
- Audit log entity reserved (`audit_event`) but not built — append-only system record of important changes is a Wave 2/3 concern.

## 6.9 Accessibility

- All interactive elements must be keyboard-navigable.
- ARIA labels on dashboard tiles, status badges, and icon-only buttons.
- Color is not the sole indicator of state. Status badges include text, not just color.
- Touch targets ≥ 44px on mobile.

## 6.10 Performance

- Dashboard load < 2 seconds for a household with 5 children, 1 school year of records.
- Mark attendance interaction < 200ms perceived response time.
- List views (Features #14, #25, #32) paginate at 50 items.

---

# Appendix

## A. Glossary

**Wave.** A delivery sequence. Waves are dependency-ordered, not theme-ordered. A wave is ready to start when the prior wave is done.

**Epic.** A theme group cutting across waves. Used for code organization and feature documentation. Examples: Dashboard (touched in 1A, 1B, 1C), Portfolio (entirely within 1D).

**Pain.** An atomic, named burden experienced by a real user. Pains live in `Pain Canon`. Each pain has severity, frequency, and switching pressure scores.

**Pain map.** The relationship layer. Many features can relieve one pain; many pains can be relieved by one feature.

**Done means.** The acceptance criteria for a feature. The feature is not Built until Done Means is satisfied. Built ≠ QA Passed; QA tests against Done Means.

**Build gate.** The condition that must be true before the feature can begin. Examples: 'previous feature complete', 'design wireframe approved', 'storage decision made'.

## B. Source workbook

This document is derived from `Sheath_Academy___Competitor_Analysis.xlsx` — a 46-tab product operations workbook containing:

- 158 audited competitors
- 2,505 normalized feature signals
- 398 canonical features
- 33 atomic pains
- 130 pain-feature mappings
- 72 build queue rows (35 of them in Wave 1)
- 17 data model entities
- 23 backend architecture layers

The workbook remains the source of truth for evidence, audits, and the broader roadmap beyond Wave 1.

## C. Status tracking

Use the Build Queue tab in the workbook for status, Built?, and QA Passed? tracking. This document is the specification — it does not track work-in-progress state.

---

*End of Wave 1 Specification.*

---

**Next Steps:** Review this specification with the team. Resolve open questions before sprint planning.
