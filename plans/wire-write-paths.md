# Plan — Wire the orphaned write paths (gradebook, compliance, badges, lesson steps)

## Summary

Layer 3 (DB schema + repository CRUD) is built for four features, but only the **read**
half is wired end-to-end. Every write/mutation repository function is orphaned: no API route
calls it, no UI triggers it. This plan closes the vertical slice — for each orphaned function
we decide the user action that should trigger it, expose it through the existing feature-router
+ `app/api/[...slug]` pattern, add a service method, and surface it in the page UI with the
approved interaction patterns. One read-path correctness bug (gradebook `creditHours` hardcode)
rides along with the gradebook phase.

Scope is **Tier A** (wire existing write functions) **+ Tier B** (add the missing update/delete
repo functions so each record type has complete, editable CRUD) **+ two promoted Tier C
capabilities**: custom badge authoring (Phase 5) and subject course/transcript config with its
backing grading-scale and aggregation-rule tables (Phase 6, the only schema-bearing phase). The
remaining Tier C items (`autonomy_unlocks`, `compliance_overrides`) are **deferred** — see
appendix.

This is **not** a wave-scoped build. It is a small set of ungated phases, one per feature,
each producing a usable capability and shippable on its own.

## Planning mode

**Mode 2 (local feature behavior), applied per feature.** Each phase touches exactly one
feature's repository (exists) → new route → new service method → that feature's page. No
cross-feature aggregation, no dashboard composition, no shared selectors. The lesson-steps
phase is the only one that adds a net-new UI surface (nested under a lesson).

## Assumptions (product intent — chosen as defaults, flag at review if wrong)

1. **Gradebook scores are manually entered by the parent** per subject (state + optional
   numeric value + date + comment). Not auto-derived from completed lessons. → `createScore`
   sits behind a per-subject "Add score" form.
2. **Compliance is parent-managed**: parent creates deadlines, marks them complete, creates a
   submission and advances its status, and sets the active ruleset/pathway config. Matches the
   full CRUD surface already in the repo.
3. **Badges are manually awarded by the parent** (no auto-award rule engine in this slice):
   parent creates an award (draft), advances its status (submitted → verified → approved),
   links portfolio evidence, and toggles platform-badges on/off in settings. (`award-rules.ts`
   exists but auto-award is **out of scope** here — see Out of scope.)
4. **Lesson steps are author-time**: the parent builds an ordered checklist of steps on a
   lesson. Learner-time check-off is **out of scope**.
5. **`autonomy_unlocks`** has no repository function at all → genuinely deferred, untouched by
   this plan.
6. **`upsertLessonTaskRow`** is an internal helper (used by fan-out/import paths), not a
   user-triggered action → not given a route here unless audit during Phase 4 shows a UI need.

## Code-path audit (current state, traced from source)

| Feature | Read routes wired | Write repo fns (orphaned) | Page | Service |
|---|---|---|---|---|
| Gradebook | GET `/summaries`, `/scores` | `createScore` | `GradebookPage.tsx` (LearnerCard → expandable ScoreHistory per subject) | `gradebookApi` (read-only) |
| Compliance | GET `/status`,`/ruleset`,`/deadlines`,`/submissions` | `createDeadline`, `markDeadlineComplete`, `createSubmission`, `updateSubmissionStatus`, `setHouseholdComplianceConfig` | `CompliancePage.tsx` (DeadlineTimeline, SubmissionsTracker, RulesetCard) | `complianceApi` (read-only) |
| Badges | GET `/definitions`,`/collection`,`/awards`,`/settings` | `createAward`, `updateAwardStatus`, `addEvidenceToAward`, `setBadgeSettings` | `BadgesPage.tsx` (BadgeCard grid) | `badgesApi` — **already has `submitEvidence` POSTing to an unwired route (dangling)** |
| Plan / lesson steps | lessons CRUD fully wired; **lesson_steps: none** | `listLessonSteps`, `createLessonStep`, `updateLessonStep`, `deleteLessonStep` | no steps UI | none for steps |

**Read-path bug:** `listGradebookSummaries` hardcodes `creditHours: 1` while the `subjects`
table now has real `creditHours` (+ `gradingScaleId`, `aggregationRuleId`, `isFormalCourse`,
`termModel`) columns from Phase 2. GPA weighting silently ignores stored credit hours.

## Source of truth

Unchanged — each feature already owns its data (Gradebook = scores, Compliance = deadlines/
submissions/config, Badges = awards/settings, Planner = lessons/lesson_steps). No ownership
moves. UI → that feature's service → that feature's route → that feature's repository. No route
reaches into another feature's store. (Badges evidence references Portfolio evidence IDs by
value only — no cross-feature store access; the route validates the ID exists via the badges
repo insert, not by importing Portfolio's store.)

## UI patterns (per ui-style-guide — confirm at review)

- **Collapsible add-form** for: add score, add deadline, create submission, create award.
- **Editable record card / inline action** for: mark deadline complete (checkbox/icon button),
  advance submission status (status control), advance award status.
- **Destructive actions** (delete lesson step) use the **styled confirmation dialog**, never
  `window.confirm`.
- **Icon-only actions** (complete, delete) carry `aria-label`.
- Reuse existing `card`, `page-shell`, `badge-*` classes; no new Tailwind entrypoints.

---

## Phases (ordered, ungated)

### Phase 0 — Fix `creditHours` hardcode (gradebook read path)
- Change `listGradebookSummaries` to read `creditHours` (and pass through the other Phase-2
  subject fields the summary should reflect) instead of hardcoding `1`.
- **Tests first:** extend `repository.db.test.ts` — seed two subjects with different
  `creditHours`, assert GPA weighting reflects them (currently would pass with the hardcode and
  fail once a non-1 value is introduced). Update `summaries.test.ts` if the contract widens.
- Small, isolated, no API/UI change. Ships independently.

### Phase 1 — Gradebook: full score CRUD
- **New repo fns (Tier B):** `updateScore(id, householdId, patch)`, `deleteScore(id, householdId)`.
- **API:** add to `handleGradebookRoute` + `routes/scores.ts`:
  - `POST /scores` → `createScore` (validate `learnerId`, `subjectId`, `state`; `numericValue`
    required when `state==='graded'`)
  - `PATCH /scores/:id` → `updateScore`
  - `DELETE /scores/:id` → `deleteScore`
- **Service:** `gradebookApi.createScore` / `updateScore` / `deleteScore`.
- **UI:** collapsible "Add score" form inside the expanded subject row in `LearnerCard`; each
  row in `ScoreHistory` gets inline edit + delete (delete uses the styled confirm dialog). On
  success refetch that subject's history.
- **Tests first:** `scores.test.ts` POST/PATCH/DELETE (success, missing field 400,
  graded-without-numeric 400, 404 on missing id); repo `db.test.ts` for update/delete;
  integration in `GradebookPage.test.tsx` (add, edit, delete, error state).

### Phase 2 — Compliance: full deadline/submission CRUD + config
- **New repo fns (Tier B):** `updateDeadline(id, householdId, patch)` (label/dueDate/
  requirementType **and** `isCompleted` toggle — supersedes the one-way `markDeadlineComplete`,
  which becomes a thin wrapper or is folded in), `deleteDeadline(id, householdId)`,
  `deleteSubmission(id, householdId)`, `listRulesets()` (so the config picker has a source of
  selectable rulesets).
- **API:** add to `handleComplianceRoute`:
  - `POST /deadlines` → `createDeadline`
  - `PATCH /deadlines/:id` → `updateDeadline` (covers complete/reopen/edit)
  - `DELETE /deadlines/:id` → `deleteDeadline`
  - `POST /submissions` → `createSubmission`
  - `PATCH /submissions/:id` → `updateSubmissionStatus`
  - `DELETE /submissions/:id` → `deleteSubmission`
  - `GET /rulesets` → `listRulesets`
  - `PUT /config` → `setHouseholdComplianceConfig`
- **Service:** matching `complianceApi` methods.
- **UI:** add-form + inline edit/complete/reopen/delete in `DeadlineTimeline`; create + status
  control + delete in `SubmissionsTracker`; ruleset/pathway picker in `RulesetCard` populated
  from `GET /rulesets` → `PUT /config`. Deletes use the styled confirm dialog.
- **Tests first:** `deadlines.test.ts` / `submissions.test.ts` / `rulesets.test.ts` /
  `config.test.ts` route tests; repo `db.test.ts` for update/delete/listRulesets; integration
  in `CompliancePage.test.tsx` (create/edit/complete/reopen/delete deadline, create/advance/
  delete submission, set config from a populated picker).

### Phase 3 — Badges: award lifecycle + evidence + settings (full CRUD)
- **New repo fns (Tier B):** `deleteAward(id, householdId)` (revoke),
  `removeEvidenceFromAward(badgeAwardEvidenceId, householdId)` (unlink).
- **API:** add to `handleBadgesRoute`:
  - `POST /awards` → `createAward`
  - `PATCH /awards/:id` (status) → `updateAwardStatus`
  - `DELETE /awards/:id` → `deleteAward`
  - `POST /awards/:id/evidence` → `addEvidenceToAward` **(closes the existing dangling
    `submitEvidence` client call)**
  - `DELETE /awards/:id/evidence/:evidenceLinkId` → `removeEvidenceFromAward`
  - `PUT /settings` → `setBadgeSettings`
- **Service:** add `createAward`, `updateAwardStatus`, `deleteAward`, `removeEvidence`,
  `setSettings`; keep existing `submitEvidence` (now backed by a real route).
- **UI:** on a not-yet-earned `BadgeCard`, "Award / mark progress" control that creates a draft
  award and advances status; revoke action (styled confirm); evidence-link + unlink affordance;
  settings toggle for platform badges.
- **Tests first:** `awards.test.ts` (create, patch status, add/remove evidence, delete, 404 on
  missing award), `settings.test.ts` (PUT); repo `db.test.ts` for delete/unlink; integration in
  `BadgesPage.test.tsx` (award flow, evidence link/unlink, revoke, settings toggle).

### Phase 4 — Plan: lesson steps CRUD + author UI
- **API:** add to `handlePlanRoute`:
  - `GET /lessons/:id/steps` → `listLessonSteps`
  - `POST /lessons/:id/steps` → `createLessonStep`
  - `PATCH /lessons/:id/steps/:stepId` → `updateLessonStep`
  - `DELETE /lessons/:id/steps/:stepId` → `deleteLessonStep`
- **Service:** new lesson-steps methods on the plan service.
- **UI:** steps checklist editor on the lesson detail/card (ordered list, add-step form, inline
  edit, delete with **styled confirm**).
- **Tests first:** route tests under `plan/__tests__/api/`; integration covering
  list/add/edit/delete + reorder if `order` is editable.
- Decide during this phase whether any UI legitimately needs `upsertLessonTaskRow`; if not,
  leave it as the internal helper it is.

---

### Phase 5 — Custom badge authoring (promoted from Tier C #3)
- **New repo fns:** `createBadgeDefinition`, `updateBadgeDefinition`, `deleteBadgeDefinition`
  (all scoped to `householdId`; platform starters — `householdId null` — are read-only and must
  not be editable/deletable through these). Reuse existing `listBadgeDefinitions`.
- **API:** add to `handleBadgesRoute`:
  - `POST /definitions` → `createBadgeDefinition`
  - `PATCH /definitions/:id` → `updateBadgeDefinition` (guard: 403/404 if the row is a starter
    or belongs to another household)
  - `DELETE /definitions/:id` → `deleteBadgeDefinition` (same guard; styled confirm in UI)
- **Service:** `badgesApi.createDefinition` / `updateDefinition` / `deleteDefinition`.
- **UI:** a "Create badge" collapsible form + edit/delete on household-owned `BadgeCard`s
  (title, description, criteria, emblemKey, gradeBands, verificationRequirement, visibility,
  enabled). Starter badges render without edit/delete affordances.
- **Tests first:** `definitions.test.ts` (create, patch, delete, starter-guard 403, cross-
  household 404); repo `db.test.ts`; integration in `BadgesPage.test.tsx` (author a badge, it
  appears in the grid; edit; delete; starters are not editable).
- No schema change — `badge_definitions` already has every column needed.

### Phase 6 — Subject course-config + grading scales + aggregation rules (promoted from Tier C #4)
**Schema-bearing** — the only phase that runs a migration. Do it last.
- **Schema (new tables):** `grading_scales` and `aggregation_rules` (both `householdId`-scoped,
  with the fields the gradebook aggregation needs), so `subjects.gradingScaleId` /
  `subjects.aggregationRuleId` finally reference real rows. Run `npm run db:generate`, then
  **inspect the generated SQL for the drizzle-kit composite-UNIQUE/FK ordering bug** (move any
  `ADD CONSTRAINT … UNIQUE` above the `ADD CONSTRAINT … FOREIGN KEY` that references it) before
  `npm run db:migrate`. **Confirm `DATABASE_URL` is not prod first.**
- **New repo fns:** CRUD for `grading_scales` and `aggregation_rules`; `updateSubjectConfig`
  (set `creditHours`, `isFormalCourse`, `termModel`, `gradingScaleId`, `aggregationRuleId` on a
  subject). Update `listGradebookSummaries` + `computeGpa`/aggregation to read the referenced
  grading scale and aggregation rule instead of the Phase-0 interim (which only un-hardcoded
  `creditHours`) — this is what makes GPA fully real.
- **API:** new `grading-scales` and `aggregation-rules` GET/POST/PATCH/DELETE routes; subject
  course-config likely lives on the subject's existing owner route (audit where subjects are
  edited today — do **not** create a competing subjects writer in gradebook).
- **Service + UI:** a subject course-config panel (credit hours, formal-course toggle, term
  model, grading-scale picker, aggregation-rule picker) reachable from the gradebook subject
  row or the subject's existing edit surface; small CRUD screens for grading scales and
  aggregation rules.
- **Tests first:** repo `db.test.ts` for the new tables + the now-dynamic GPA computation
  (seed two scales / two credit-hour values, assert weighting differs); route tests;
  integration covering config edit reflected in GPA.
- **Dependency:** ships after Phase 5; supersedes the Phase-0 interim hardcode fix (Phase 0
  still ships first so GPA is *less* wrong in the interim).

## Out of scope
- Auto-award rule engine for badges (`award-rules.ts` wiring) — manual award only here.
- Learner-facing step check-off (steps are author-time only in this slice).
- `autonomy_unlocks` table (no repo function exists).
- Any new dashboard composition or cross-feature aggregation.

## Acceptance criteria (observable)
- Parent can add a score to a subject and see it appear in that subject's history without reload.
- Parent can add a deadline, mark it complete (it shows struck-through), create a submission and
  advance its status, and change the active ruleset.
- Parent can create/advance a badge award and link evidence; the previously-dangling evidence
  call now succeeds (no 404).
- Parent can add/edit/delete ordered steps on a lesson; delete asks for styled confirmation.
- GPA reflects real `creditHours`, not a constant 1.

## Testing plan
Failing tests written first each phase: repository `db.test.ts` (Phase 0), route handler tests
(`api/`), and integration tests (`__tests__/integration/`) covering loading/empty/error/
populated + each interaction. `npm test` + targeted integration run + `npm run build` green
before each phase commit.

## Branch + commit plan
Continue on `feat/layer3-db` (or branch `feat/wire-write-paths` off it if the DB branch should
stay schema-only). One behavior-oriented commit per phase (e.g.
`feat(gradebook): manual score entry end-to-end`). Pre-commit hook bumps version — do not
`--no-verify`.

## Risks
- Low. Additive routes + UI on existing read-wired features; repositories already tested at the
  DB layer. Tier B adds new repo functions but they follow the exact patterns of their
  create/read siblings. Main risk is contract drift between new route response shapes and the
  existing `{status,data,message,timestamp}` envelope — covered by route tests.

---

## Appendix — Tier C: deferred (decided NOT to build)

Two schema-implied capabilities were reviewed and **deferred** (the other two, custom badge
authoring and course/transcript config, were promoted to Phases 5 and 6):

1. **`autonomy_unlocks` — fully dormant table.** No repo function, no read, no write anywhere.
   Implies a privilege/unlock system (unlocking independent-work / self-pacing privileges gated
   on progress, streaks, or badges). No demand signal and nothing partially built — **deferred.**
   Future housekeeping option: drop the dead table in a schema cleanup so it stops implying a
   feature that isn't coming.

2. **`compliance_overrides` — read-only / half-built.** The status engine already reads and
   applies overrides; there is just no way to *create* one. So it's dormant, not unbuilt.
   **Deferred** — compliance is legally sensitive and an override UI needs careful disclaimer
   treatment. If a real exemption case arises it's cheap to finish (small repo CRUD + one form),
   because the consume side already exists.
