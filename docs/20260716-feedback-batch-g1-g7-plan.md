# Feedback batch plan — G1–G7 (excludes Lesson Planner rework)

**Date:** 2026-07-16
**Source:** 18 unprocessed prod feedback rows pulled 2026-07-16 (`scratchpad/feedback-synthesis.md`).
**Scope:** Everything except the Lesson Planner UX rework (that is a separate plan: `20260716-lesson-planner-ux-rework-g8-plan.md`).

This is a **grouped, multi-phase repair plan**. Each phase is independently shippable and independently testable. Phases are ordered by confidence and independence, not by feedback ID.

---

## Planning mode

**Mixed.** Per-phase mode is stated in each phase. Most phases are **Mode 2 (local feature behavior)**; G2 (course rollover) is **Mode 3 (cross-feature)** because course visibility spans Settings, Gradebook, and Learning-time; G3b (learner login persistence) is effectively **Mode 4 (new capability)** because the persistence layer does not exist.

---

## Source-of-truth decisions

| Data | Owner | Notes |
|---|---|---|
| Planning-default / records-compliance preferences | `household_settings` (key-value) via `features/settings/server/repository.ts` | Repo already exists; **no API route is wired yet** — must add one. |
| Courses (`SubjectCourse`) | `features/subjects` | Rollover + `schoolYearId` filtering owned here. Settings/Gradebook/Learning-time are consumers only. |
| Learner profile + login | `features/children` (profile) + `features/auth`/`features/household` (credential user + membership) | `learners` table currently stores **no** dob/first/last/userId columns. Login attaches a credential **user** to the existing household — same primitive as adding an adult. |
| Parent display name | `features/household` (`updateUserProfile`) + NextAuth session | Already wired in `SettingsPage.tsx:149`. |
| Compliance rulesets + starter badges | `features/compliance` / `features/badges` reference rows seeded by `scripts/seed-reference-data.ts` | **Verified 2026-07-16: prod has 0 rulesets and 0 badge definitions.** The Drizzle migration only creates the empty tables; the row-load is this separate `tsx` script, which was never run against prod. |

---

## Phase G1 — Persist Planning Defaults & Records/Compliance settings tabs

**Mode 2. Confidence: high (root cause confirmed).**

### Feedback
`894f8e3b`, `3c782254` — "no save changes button… settings revert to default when I navigate away."

### Code-path audit
- **Renders:** `features/settings/front/components/PlanningDefaultsTab.tsx`, `features/settings/front/components/RecordsComplianceTab.tsx`.
- **Data source today:** local `useState` only — **nothing is loaded or saved**. Confirmed by reading both files.
- **Persistence available but unused:** `features/settings/server/repository.ts` exposes `getAllHouseholdSettings` / `setHouseholdSetting` against the `household_settings` table. **There is no `features/settings/api/` router**, and `app/api/[...slug]/route.ts` has no `settings` case.
- **Existing tests:** `features/settings/__tests__/api/repository.test.ts` (repository), `features/settings/__tests__/integration/SettingsPage.test.tsx`.
- **Missing tests:** API route handler tests; tab persistence integration tests (load → change → persist).

### Changes
1. **New API surface** — `features/settings/api/routes/settings.ts` (`GET` returns `getAllHouseholdSettings`, `PUT` calls `setHouseholdSetting` for provided keys), `features/settings/api/router.ts`, and a new `if (slug[0] === 'settings')` case in `app/api/[...slug]/route.ts` (import `handleSettingsRoute`). Follow the exact dispatch pattern of the neighboring feature routers.
2. **Front service** — `features/settings/front/services/api.ts` (`getSettings()`, `updateSettings(patch)`).
3. **Wire tabs with an explicit "Save changes" button** (decided) — both tabs load current values on mount, track a dirty state as the user edits, and persist only when the parent clicks **Save changes**; show a saved/confirmation state after success. This matches exactly what the tester asked for ("no save changes button… reverts to default"). Disable the button when there are no unsaved changes. Keys: `planning.maxLessonsPerDay`, `planning.carryForward`, `records.trackingMethod`, `records.exportFormat`.

### Files
- Add: `features/settings/api/router.ts`, `features/settings/api/routes/settings.ts`, `features/settings/front/services/api.ts`
- Add tests: `features/settings/__tests__/api/settings.test.ts`, `features/settings/__tests__/integration/PlanningDefaultsTab.test.tsx`, `features/settings/__tests__/integration/RecordsComplianceTab.test.tsx`
- Edit: `features/settings/front/components/PlanningDefaultsTab.tsx`, `features/settings/front/components/RecordsComplianceTab.tsx`, `app/api/[...slug]/route.ts`

### TDD (write these failing first)
1. `settings.test.ts` — `GET /api/settings` returns stored household settings; `PUT /api/settings` upserts a key and returns updated map. Mock at the repository boundary (`getAllHouseholdSettings`/`setHouseholdSetting`), never `getDb()`.
2. `PlanningDefaultsTab.test.tsx` — renders with a mocked settings service returning `{ 'planning.maxLessonsPerDay': 3 }`; asserts the input shows 3 (proves load); the Save button is disabled until an edit; change to 5 → click Save → asserts `updateSettings` called with `planning.maxLessonsPerDay: 5` and a saved confirmation shows.
3. `RecordsComplianceTab.test.tsx` — same shape for `records.trackingMethod`.

### Acceptance criteria
- Settings → Planning Defaults: change "Maximum lessons per day" to 3 → a **Save changes** button becomes active → click it → confirmation shows → navigate to Dashboard → return: value is still 3.
- If you edit a field and navigate away **without** clicking Save, the value does not persist (explicit-save behavior, as requested).
- Settings → Records & Compliance: set tracking method to Hours → Save → navigate away → return: still Hours.

---

## Phase G2 — Course visibility & rollover de-duplication

**Mode 3 (cross-feature). Confidence: medium (root cause hypothesised, must be confirmed in the audit).**

### Feedback
`4aef1f48`, `16ced0c0`, `be863bc6` — courses added in Settings disappear, still show in Gradebook, and re-adding duplicates them ("Spelling listed twice").

### Code-path audit
- **Settings courses list:** `features/subjects/front/components/SubjectsAllTable.tsx` filters `s.isActive !== false` and calls `subjectsApi`.
- **Repository filter:** `features/subjects/server/repository.ts` `listSubjects` accepts `options.schoolYearId` and filters `schoolYearId = year OR schoolYearId IS NULL` plus `isActive = true`.
- **Learning-time already documents the bug** (`features/learning-time/front/pages/LessonTimePage.tsx:26-35`): "Rollover clones a course into the new school year but leaves the source row active too, so the same course name can legitimately appear more than once." It de-dupes by grouping on name — a local workaround.
- **Hypothesis to confirm in implementation:** Settings/Gradebook/Learning-time pass different (or no) `schoolYearId` to `listSubjects`, so each surface shows a different subset → a course looks "missing" on one screen and duplicated on another after rollover/re-add.
- **Existing tests:** subjects repository tests under `features/subjects/__tests__/`.
- **Missing tests:** repository test proving rollover does not create a visible duplicate for the active year; consistency test that all three consumers request the same active-year scope.

### Rollover behavior (DECIDED: hide but keep/recoverable)
When a new school year starts, the **previous year's course copies drop off the active Courses/Gradebook/Learning-time lists but are retained** and can be viewed/restored from history — nothing is destroyed, records stay intact. This is the target behavior the fix implements.

### Changes
1. Establish a single **active-year-scoped** course query and make Settings, Gradebook, and Learning-time all use it, so a course shows exactly once (its current-year row) everywhere. Remove the ad-hoc name-grouping workaround in Learning-time once the source is consistent.
2. Rollover: exclude prior-year rows from active-year views (they remain in the table, just not `isActive`/not current-year), so the current year shows a single copy. Prior-year copies remain retrievable via a history/archived view.
3. Guard re-add against creating a duplicate active-year row for the same name+learner (the mechanism that produced "Spelling twice").
4. **Still spike-first:** confirm in the audit exactly which `schoolYearId` each of the three consumers passes today before changing the query — that trace is the one remaining unknown.

> **Do not proceed to implementation until the audit confirms exactly which `schoolYearId` each of the three consumers passes.** If unconfirmed, this phase is a spike, not a fix.

### Files
- Likely edit: `features/subjects/server/repository.ts` (listSubjects/rollover), `features/subjects/front/components/SubjectsAllTable.tsx`, `features/learning-time/front/pages/LearningTimePage.tsx`, gradebook subject source in `features/gradebook/front/pages/GradebookPage.tsx`
- Tests: `features/subjects/__tests__/server/repository.test.ts` (or DB test under `__tests__/integration/`)

### TDD
1. Repository test: seed a course in year A, roll it over to year B, query active-year (B) → exactly one row returned (fails today if source stays active).
2. Consistency test / integration: Settings, Gradebook, Learning-time given the same household+active year render the same course set.

### Acceptance criteria
- Add "Spelling" in Settings → Courses (appears once) → Gradebook shows the same "Spelling" → back to Settings, still exactly one → advance school year → "Spelling" still appears once in both places.

---

## Phase G3 — Learner edit: no re-entry, reveal password, and login persistence

**G3a Mode 2 (profile persistence). G3b Mode 4 (new capability — but reuses the existing add-member primitive). Both DECIDED — build.**

### Feedback
`59a1624d` — "had to re-enter all of the student's information; couldn't see the password I was choosing; the changes weren't saved."

### Code-path audit (all three claims confirmed in code)
- **Form:** `features/children/front/components/ChildForm.tsx` splits into `firstName`/`lastName`/`dob` and prefills from `child?.firstName` etc. But the API's `StudentProfile` (`features/children/api/routes/child.ts:15-27`) only carries a combined `name`, **no** `firstName`/`lastName`/`dob`. So on edit the split fields are blank → **re-entry confirmed**.
- **Password field** is `type="password"` with **no reveal toggle** → gap.
- **Persistence:** `learners` table (`db/schema.ts:138-156`) has **no** `dob`/`first_name`/`last_name`/`user_id` columns. `updateLearner` patches only `name`/`gradeLevel`/`displayColor`/`sortOrder`. Both the create and update routes **hardcode `username: '', password: ''`** and never write credentials. → **"changes weren't saved" confirmed.**
- **The reusable template — how an ADULT is added to a household** (`features/household/api/routes/accept.ts:29-31`): it does **not** create a household — it `upsertUserByEmail(...)` then `addMember(householdId, user.id, role)`. `addMember` (`features/household/server/repository.ts:154`) inserts a `household_members` row. Signup's `upsertHouseholdForUser` is the ONLY thing that creates a new household — the learner path must **not** call it.

### G3a — store the learner's real profile (DECIDED: keep fields visible, persist them)
1. **Migration:** add `dob`, `first_name`, `last_name` columns to `learners` (keep `name` as the display/report value, derived from first+last). Generate with `npm run db:generate` and review SQL per the CLAUDE.md drizzle-ordering note.
2. **Repository + routes:** extend `UpdateLearnerInput`/`CreateLearnerInput`, `updateLearner`/create, and `learnerRowToStudentProfile` to carry `firstName`/`lastName`/`dob`. Stop hardcoding blanks.
3. **Form prefill:** edit mode pre-fills first/last/dob from the stored values → no re-entry.
4. **Password show/hide toggle (DECIDED: yes):** add an eye icon toggling the password input between `password`/`text` — the tester explicitly asked to see the password they're choosing.

### G3b — learner login (DECIDED: build it, mirroring the adult path)
Enabling "Allow learner to sign in" should, server-side, do exactly what adding an adult does **minus the new-household step**:
1. Create a **credential user** for the learner: reuse the `createCredentialUser` insert logic (username + `passwordHash` via `features/auth/server/password` hashing + `normalizeUsername`) **but skip `upsertHouseholdForUser`**.
2. `addMember(householdId, learnerUserId, 'learner')` to attach to the **existing** household.
3. Link the profile to the login: add `learners.user_id` → `users.id` (part of the G3a migration).

**Two wrinkles to handle (do not skip):**
- `users.email` is `NOT NULL UNIQUE`. Username-only learners have no email → **synthesize a stable placeholder** (e.g. `learner.<learnerId>@no-email.local`) or make email nullable — decide in the audit; synthesizing is lower-risk.
- Membership `role` is `owner`/`member`/`teacher` (`MembershipRole` union in `features/household/server/repository.ts:9`; `VALID_ROLES` in `invite.ts:28`). The `household_members.role` column is **free-text** (`text().notNull().default('member')`), so adding a `'learner'` role is a **type/constant change only — no DB enum migration**. `teacher` is existing precedent that roles beyond owner/member are supported. Add `'learner'` to the union + `VALID_ROLES`; recommend a distinct `learner` role (not reusing `member`) so learners don't inherit owner/member-eligible surfaces.

Editing later: changing the username updates the user row; setting a new password re-hashes (reuse `updateUserPassword`); unchecking login removes the membership/credential or deactivates it — define in the audit.

### Files
- Migration + `db/schema.ts` (learners: `dob`, `first_name`, `last_name`, `user_id`; add `'learner'` to membership role usage)
- `features/children/server/repository.ts`, `features/children/types.ts`, `features/children/api/routes/child.ts` + `children.ts`
- `features/children/front/components/ChildForm.tsx` (prefill + password toggle)
- Reuse: `features/auth/server/repository.ts` / `password.ts` (hashing), `features/household/server/repository.ts` (`addMember`)
- Tests: `features/children/__tests__/api/child.test.ts`, `.../children.test.ts`, repository DB test, `features/children/__tests__/integration/ChildForm.test.tsx`

### TDD (write failing first)
1. Repository/API: creating/updating a learner with first/last/dob persists and returns them (fails today — blanks hardcoded).
2. Enabling login creates a credential user, attaches it to the **existing** household via `addMember` (assert no new household row is created), and links `learners.user_id`.
3. Re-open after save → login still enabled, username persists (proves the "not saved" bug is fixed).
4. `ChildForm.test.tsx` — edit mode pre-fills first/last/dob (not blank); clicking the eye toggle switches the password input to `text` and reveals the typed value.

### Acceptance criteria
- Edit an existing learner → first name, last name, and birthdate are pre-filled (no re-entry).
- Enable "Allow learner to sign in", set username + password, Save → reload and re-open the learner → login still enabled and username persists → **no new household was created**, the learner is a member of the existing household → the learner can sign in with those credentials.

---

## Phase G4 — Compliance: populate state ruleset dropdown + explain the options

**Mode 2 + one ops action. Confidence: high.**

### Feedback
`a783e356` — empty ruleset dropdown for the user's state; wants info buttons explaining the options. `a11521dc` — "mark deadlines complete."

### Code-path audit (verified against prod 2026-07-16)
- **Dropdown source:** `features/compliance/front/pages/CompliancePage.tsx` (`RulesetCard`) maps `rulesets` from `listRulesets()` → `features/compliance/server/repository.ts:405`, which reads `compliance_rulesets` reference rows.
- **Root cause CONFIRMED by direct read-only prod query:** `compliance_rulesets` = **0 rows**, `badge_definitions` = **0 rows** in prod. The dropdown is empty because there is no reference data, not because of a UI bug.
- **Why (answers "if the load wasn't done with Drizzle, how was it done?"):** the Drizzle migration (`db:migrate:prod`) only `CREATE TABLE`s the empty shell. The **rows** come from a *separate* standalone script, `scripts/seed-reference-data.ts` (`ON CONFLICT DO NOTHING`, never truncates), which is **not** part of the Drizzle migration chain and was **never pointed at prod** — there is no `db:seed:reference:prod` npm script. So Drizzle built the table; the data-load step simply never ran in prod.
- **This also explains G5** (empty starter badges): same seed script, same never-run-in-prod gap.
- **"Mark deadline complete" already exists** — `CompliancePage.tsx:358` renders a "Mark deadline complete" / "Reopen" toggle (shipped in commit `8689bd1`). Feedback `a11521dc` is **already satisfied**; verify in manual QA, no code needed.

### Changes
1. ✅ **DONE 2026-07-16 — Ops step complete.** Added guarded `db:seed:reference:prod` (`scripts/seed-reference-prod.ts`) + fixed a latent path bug in `scripts/seed-reference-data.ts` (it pointed at `docs/compliance-research/…`, which had been moved to `docs/archive/compliance-research/…`). Ran against prod; **verified 66 rulesets + 8 starter badges landed.**
2. **⚠️ NEW GAP — state coverage.** The reference data only covers **7 states: TX, FL, NY, PA, CA, MI, CT** (that's all the research JSON contains). The dropdown lists *all* platform rulesets, so **a parent whose state is not one of these 7 will still see an empty dropdown.** Action: (a) determine the tester's state and confirm whether they're now covered; (b) if broader coverage is wanted, that's a **content task** — expand `docs/archive/compliance-research/homeschool-requirements-2026-06-27.json` with more states, then re-run the seed. Not a code change.
3. **Empty-state copy (still needed):** if `rulesets` is empty *for the user's situation*, render a helpful message instead of a blank dropdown ("No rulesets available yet for your state — …"). Now doubly justified because of the coverage gap above.
4. **Info tooltips:** add info icons next to the ruleset and pathway selectors with short explanations for new homeschoolers (approved icon/tooltip pattern per `ui-style-guide`).

### Files
- Edit: `features/compliance/front/pages/CompliancePage.tsx`
- Tests: `features/compliance/__tests__/integration/CompliancePage.test.tsx` (empty-state message when `rulesets: []`; tooltip renders)

### TDD
Integration test: render `CompliancePage` with `rulesets: []` → asserts empty-state message (not a bare empty `<select>`); render with rulesets → options present and info tooltip text is in the DOM.

### Acceptance criteria
- Compliance → ruleset dropdown lists options for the user's state (after seed). When none exist, a clear message shows instead of an empty control. Info icon next to ruleset/pathway reveals an explanation. (Deadline complete already works.)

---

## Phase G5 — Badges: make "Add badge" discoverable

**Mode 1/2 (discoverability). Confidence: high.**

### Feedback
`d4e5652b` — "I like badges but don't see how to add available badges."

### Code-path audit
- `features/badges/front/pages/BadgesPage.tsx` already contains a full `BadgeDefinitionForm` (create/edit). The capability exists; the **trigger is not obvious**. Confirm current trigger placement/labeling in the audit.
- **Data gap RESOLVED 2026-07-16:** prod now has **8 starter `badge_definitions`** (seeded with G4). The badges page is no longer empty. This phase is now **purely the discoverability improvement** — plus verifying the 8 starters render for the tester.

### Changes
- Surface a clearly labeled "Add badge" button in the badges list header (approved collapsible add-form / button pattern per `ui-style-guide`) with one line of helper text explaining that badges are household-defined.
- Verify the 8 seeded starter badges now display on the page (they should, via `visibility: 'platform'`).

### Files
- Edit: `features/badges/front/pages/BadgesPage.tsx`
- Tests: `features/badges/__tests__/integration/BadgesPage.test.tsx` (an "Add badge" control is present and opens the form)

### TDD
Integration test: render `BadgesPage` → a visible "Add badge" button exists; clicking it reveals the definition form.

### Acceptance criteria
- Growth → Badges: a clearly visible "Add badge" button opens the form; filling title/description/criteria/emblem and saving adds it to the available list.

---

## Phase G6 — Parent display name for magic-link users (verify-first)

**Mode 2. Confidence: low — likely already works; treat as an audit + possible small fix.**

### Feedback
`634196cb` — "When I login I can't change my name, it's just my email. I use the magic link."

### Code-path audit
- Display-name editing is wired: `SettingsPage.tsx:70-77,149-150` (`householdApi.updateUserProfile` + `updateSession`). Shipped Wave 5 (commit `818c32f`).
- **Unknown:** whether the header/nav reads the session `name` for magic-link users, and whether the display-name control is discoverable (it lives in the Household tab). Reproduce with a magic-link account before changing anything.

### Changes (only if repro confirms a gap)
- Ensure the display-name field is reachable/labeled for magic-link users and that the header shows `name` when set. No changes if it already works — record the QA result instead.

### Files
- Potentially edit: `features/settings/front/pages/SettingsPage.tsx`, `features/layout/front/components/Header.tsx` (only if header ignores `name`)
- Tests: extend `features/settings/__tests__/integration/SettingsPage.test.tsx` if a fix is made.

### Acceptance criteria
- Magic-link user sets display name "Umm Layth" in Settings → header shows "Umm Layth" (not the email); reload confirms persistence.

---

## Phase G7 — Quick UX enhancements (each independently optional)

**Mode 2 each. Confidence: medium — each needs a short per-item audit before building.** These are enhancements, not regressions; sequence them after G1–G4. Split into separate commits/PRs so any can be dropped.

| Item | Feedback | Change | Key files (to confirm in audit) | User test |
|---|---|---|---|---|
| Editable class times | `3b8b891b` | Make start/end time editable on the schedule | `app/(shell)/plan/schedule/page.tsx`, `features/schedule/**` | Open a class, change start+end, save; new times persist after reload |
| Learning-time one-click timer | `4ead6503` | List each course with its duration + a Start button | `features/learning-time/front/pages/LearningTimePage.tsx`, `NowCard.tsx` | Each course shows duration + Start that begins its timer in one click |
| Dashboard inline edit popup | `45d25364` | Edit today's schedule item in a popup instead of navigating | `features/dashboard/front/**`, reuse `LessonTaskForm` | Click edit on a Today item → popup opens → edit+save without leaving Dashboard |
| Gradebook assignment grading | `9e831885` | List scheduled assignments; assign a grade directly | `features/gradebook/front/pages/GradebookPage.tsx` | See scheduled assignments; assign a grade; recorded against that assignment |
| Feedback screenshots | `13adfec8` | Allow image attachment on the feedback widget, **stored as a blob on the feedback record** (DECIDED) | `features/feedback/**`, `db/schema.ts` (`user_feedback` bytea column + migration) | Attach an image in the widget, submit; the image is stored on the row and viewable by the reviewer |

Each item follows the standard TDD flow: failing integration test for the new interaction first, then implement, then build+test.

**Feedback screenshots — storage (DECIDED: blob on the DB row).** Add a `screenshot` `bytea` column (plus `screenshot_mime`) to `user_feedback` in `db/schema.ts` via a Drizzle migration, so the image lives in the database on the feedback record itself (no external object store). Consider a size cap (e.g. reject > ~2 MB, or downscale client-side before upload) to keep rows sane. The steward pull script and any admin feedback view should surface/download the blob. TDD: repository test round-trips the bytes; API route accepts multipart/base64 and persists; integration test attaches an image and asserts it's sent.

---

## Out of scope (this plan)
- **Lesson Planner UX rework** (`6f7a6af3`) — separate plan.
- Positive-only feedback: `9aed3009` (messages), `473cc681` (portfolio evidence) — no action.
- Any change to the `SubjectCourse` type name or `features/subjects/` folder (UI-copy convention only).

---

## Suggested phasing / branches
Ship in confidence/dependency order; one branch+PR per phase against `dev`:
1. ✅ `chore/prod-reference-seed` — **DONE 2026-07-16.** Reference seed run against prod (66 rulesets / 8 starter badges verified). Script + path-fix live on the working tree, pending commit. Remaining: broaden state coverage beyond the 7 seeded states if desired (content task).
2. `fix/settings-tab-persistence` (G1 — explicit Save button)
3. `fix/compliance-ruleset-empty-state-and-tooltips` (G4 UI)
4. `fix/badges-add-discoverability` (G5 UI)
5. `feat/learner-profile-and-login` (G3a + G3b together — one migration adds dob/first/last/user_id; mirrors the adult add-member path)
6. `spike/course-rollover-visibility` → `fix/course-rollover-dedup` (G2 — **after the pending rollover-behavior decision**)
7. `chore/verify-display-name-magic-link` (G6, verify-first)
8. G7 items as individually selected (feedback-screenshot blob is its own PR with a migration).

## Commit discipline
Behavior-oriented commits per phase; never `--no-verify` (pre-commit bumps the header version). Build + `npm test` + integration (`npx jest --testPathIgnorePatterns="/node_modules/"`) green before each PR.

## Manual QA
Run the per-phase Acceptance criteria click-throughs above against a seeded local DB (`npm run db:seed:demo`) and, for G4, verify the prod seed separately.
