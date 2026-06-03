# Feedback Steward Runbook and Human Test Plan

**Purpose:** End-to-end validation of the feedback steward pipeline, from a user submitting feedback through to a PR being merged and the submitter being marked as shipped.

**When to run:** Before Wave 6 development begins, and any time the team needs to validate the end-to-end workflow against a real database and real GitHub/Claude tooling.

## Environment model

This workflow spans two environments:

- **Web app target:** the shared dev server or a local dev server. Use whichever environment contains the feedback UI you want to test.
- **Automation host:** a checked-out repo with `.env.local`, `gh`, and `claude` available. This is where `steward:daily`, `steward:ship`, and `steward:notify` run.

Important current-state notes:

- There is **no non-admin dev bypass**. Stage 1 must use a real non-admin account. If no such account is available in the chosen environment, mark Stage 1 as blocked.
- The repo currently exposes `steward:daily`, `steward:execute`, `steward:rollback`, `steward:ship`, and `steward:notify` as npm entrypoints. Standalone intake helpers still exist as script files under `scripts/`, but the normal operator flow is now plan first, then execute the saved plan.
- The repo does **not** currently contain in-repo cron or scheduler wiring for these scripts. Running them manually here simulates what a future scheduled automation host would do.
- **`steward:daily` performs classification automatically.** As of Wave 6 intake work, `steward:daily` runs the full intake pipeline: it classifies submitted rows (equivalent to `steward:classify`) before checking eligibility and generating the plan. Running `steward:classify` manually beforehand is no longer required and is now an optional standalone operation. Dry-run (`--dry-run`) still classifies — it only skips the execute/PR-attachment phase.
- **Safer operator flow:** use `npm run steward:daily -- --plan-only` to generate a reviewable plan artifact, then `npm run steward:execute -- --artifact <path-to-plan.json>` to execute that exact saved plan. If the created PR is wrong and has not been merged, `npm run steward:rollback -- --pr <number>` closes the PR if needed and resets feedback/changelog metadata.
- **Claude is a hard dependency.** Before a real steward run, prefer `npm run steward:preflight`. It checks the same submitted-feedback DB path plus a real Claude CLI call and will surface session-limit/auth problems before the workflow mutates anything.

## Prerequisite checklist

### Web app access

- [ ] You know the base URL for the target environment, for example `https://<dev-server>` or `http://localhost:3000`
- [ ] A real non-admin user account exists for Stage 1
- [ ] An admin account exists for Stage 3 onward (dev bypass as admin is acceptable if available in that environment)

### Automation host access

- [ ] The repo is checked out locally on the machine running the scripts
- [ ] `.env.local` has `DATABASE_URL`, `AUTH_SECRET`, and any other required local secrets
- [ ] `gh auth status` confirms GitHub CLI is authenticated
- [ ] `claude --version` confirms Claude CLI is available
- [ ] The automation host is pointed at the same database/environment you are validating in the UI

---

## Stage 1 — Submit feedback as a non-admin user

**Goal:** Confirm the submission UI works end-to-end and creates a DB row.

1. Open the target environment in a browser.
2. Sign in as a **real non-admin** user.
3. Locate the feedback button.
4. Click it and confirm the feedback popup opens.
5. Select a sentiment, for example `Something's wrong` or `Suggestion`.
6. Type a message, for example: `The lesson progress bar disappears when I refresh the page`
7. Click Submit.
8. **Expected:** A success state appears.
9. Click `View your feedback` from the success state.
10. **Expected:** You land on `/feedback`; the new row appears with status `submitted`.
11. Click the row.
12. **Expected:** `/feedback/[id]` shows the message, sentiment, page path, and status `submitted`.
13. Record the feedback row ID now. You will need it to verify later stages.

**If blocked:** If you cannot sign in as a real non-admin user in the selected environment, record Stage 1 as blocked rather than guessing with an admin account.

**Pass criteria:** Row visible on hub, detail page loads, status is `submitted`, and the row ID is known.

---

## Stage 2 — Optional classify-only debug path

**Goal:** Debug intake in isolation if needed.

**Default path:** Skip this stage and go straight to Stage 4.

**Operator note:** `steward:daily` now runs classification automatically as part of its intake flow. Use this section only if you specifically want to inspect classification by itself before planning. For the normal operator workflow, run `npm run steward:daily -- --plan-only`.

1. Open a terminal on the automation host in the project root.
2. Run:
   ```
   dotenv -e .env.local -- tsx scripts/feedback-requeue.ts
   ```
3. **Expected output:**
   - JSON with an `items` array
   - Your row appears in that array

4. Run:
   ```
   dotenv -e .env.local -- tsx scripts/run-classify.ts
   ```
5. **Expected output:**
   - A line like `Processing <id>...`
   - For a normal classification path: `classified: <feedbackType>/<featureArea> confidence=<level>`
   - For a duplicate path: a duplicate message and cancellation

6. Check the row in the database or via the admin UI:
   - Status should now be `classified` or `awaiting_approval`
   - High-confidence, low-risk rows move directly to `classified`
   - Lower-confidence or riskier rows move to `awaiting_approval`

**Pass criteria:** Row is no longer `submitted`. Status is `classified` or `awaiting_approval`.

---

## Stage 3 — Admin approval (run only if status is `awaiting_approval`)

**Goal:** Confirm the admin approval flow works and correctly transitions the row.

**Skip this stage if the row is already `classified`.**

1. Sign in as an admin user.
2. Navigate to `/admin/feedback`.
3. Set the status filter to `awaiting_approval`.
4. **Expected:** The newly classified row appears.
5. Click the row card or the approve button.
6. Click `Approve for planning` and confirm the modal appears.
7. Confirm the approval in the modal.
8. **Expected:**
   - The badge changes to `classified`
   - The approve button disappears
   - No full page reload is needed
9. Optionally refresh the page and confirm the filter plus row state persist correctly.

**Pass criteria:** Row badge shows `classified`, approve button is gone, and no error toast appears.

---

## Stage 4 — Generate a reviewable plan artifact

**Goal:** Run the full intake + planning pipeline without executing the PR-creation phase.

**This is the normal next step after submission/admin approval.**

**Operator note:** `--plan-only` is the recommended operator mode here. `--dry-run` remains as a legacy alias. Both still run the intake pipeline, so they can classify submitted rows, cancel duplicates, and leave lower-confidence rows in `awaiting_approval`. They skip only the execute phase: no PR, no feedback row attachment to a PR, and no pending changelog entry insert.

1. Optional but recommended preflight:
   ```
   npm run steward:preflight
   ```
   - Expected: DB query summary plus `Claude preflight ok ...`
   - If this fails with a Claude session-limit/auth message, stop here and resolve that first.

2. On the automation host, run:
   ```
   npm run steward:daily -- --plan-only
   ```
3. **Expected terminal result:**
   - If at least one row is eligible after classification, the command exits successfully and prints the generated JSON and Markdown artifact paths.
   - If no rows are eligible after classification, the command may exit with `No eligible feedback found for daily run`. That is still a useful intake result — check the DB/UI to see whether rows moved to `classified`, `awaiting_approval`, or `cancelled`.

4. Open the JSON artifact in `docs/bug_enhancement/` and verify:
   - `version` is present
   - `generatedAt` is present
   - `feedbackIds` contains your row ID
   - `eligibilitySnapshot` is present
   - `workstreams` is present and non-empty

5. Open the accompanying `.md` mirror file with the same timestamp and confirm it reads like a coherent grouped plan.

6. Re-check the row in the database or UI.
   - Submitted rows may now be `classified`, `awaiting_approval`, or `cancelled`
   - `prNumber` should still be empty
   - No pending changelog entry should have been created yet

**Pass criteria:** Intake/classification ran, no PR was created, no feedback row was attached to a PR, and if rows were eligible a coherent plan artifact was written.

---

## Stage 5 — Execute the reviewed plan (creates the PR)

**Goal:** Execute the exact saved plan from Stage 4 and confirm a branch plus PR is created on GitHub, and the row transitions to `in_pr` or `in_qa`.

> **Warning:** This creates a real GitHub PR. Run it only in a repo/environment where that is acceptable.

1. Take the JSON artifact path printed in Stage 4.
2. On the automation host, run:
   ```
   npm run steward:execute -- --artifact docs/bug_enhancement/<timestamp>-steward-grouped-plan.json
   ```
3. **Expected terminal result:**
   - The command exits successfully
   - It prints the JSON artifact path, Markdown artifact path, and created PR number

4. Go to GitHub and confirm:
   - A new branch exists
   - A PR is open against `dev`
   - The PR body includes UAT guidance and changelog-candidate content
   - The About page changelog shows a new `Pending` steward entry for the PR when a changelog candidate was returned

5. Return to the feedback hub or admin page and confirm the row now shows `in_pr` or `in_qa`.

6. If the row shows `in_qa`, confirm a preview URL is visible on the detail page.

**Pass criteria:** PR exists on GitHub, row status is `in_pr` or `in_qa`, and the PR body is coherent.

---

## Stage 6 — Review the PR as a human

**Goal:** Validate that the automated changes are sensible before merging.

1. Open the PR created in Stage 5.
2. Review the diff and confirm the changes are scoped to what the feedback described.
3. Read the PR description:
   - Does the problem statement match the feedback?
   - Are the UAT steps reproducible?
   - Is the changelog candidate clear?
4. If a preview is available, open it and verify the fix behaves as described.

**Decision point:** If the PR looks wrong or harmful and it has **not** been merged, run:

```
npm run steward:rollback -- --pr 42
```

Expected rollback result:
- The PR is closed if it was still open
- Feedback rows attached to PR `42` return to `classified`
- The pending changelog entry for PR `42` is removed

If the PR looks good, proceed to Stage 7.

**Pass criteria:** Code is reasonable, PR description is accurate, and UAT steps are testable.

---

## Stage 7 — Merge the PR and run the ship script

**Goal:** Confirm that merging the PR and running the ship script correctly marks rows as `shipped`.

1. Merge the PR into `dev`.
2. Note the PR number, for example `42`.
3. On the automation host, run:
   ```
   npm run steward:ship -- --pr 42 --version 2.1.0
   ```
4. **Expected output:**
   - `PR #42 shipped — rows and changelog marked shipped at version 2.1.0`

5. Return to the feedback detail page as the submitter:
   - Status badge should show `shipped`
   - Version label should show `v2.1.0`
   - Changelog label should appear if set

6. Open `/admin/feedback` as admin:
   - The row card should show shipped state with the resolved version

**Pass criteria:** Row status is `shipped`, and version labeling is correct on detail and admin views.

---

## Stage 8 — Notification summary

**Goal:** Confirm the notify script generates a correct summary artifact.

1. On the automation host, run:
   ```
   npm run steward:notify
   ```
2. **Expected output:**
   - `Notification summary: 1 rows shipped in the last 24h`
   - One or more `v<version>: <email>` lines when shipped rows exist

3. Open `tmp/feedback-steward/notifications/` and confirm a JSON file was written today.
4. Open the file and verify:
   - `shippedCount` is correct
   - `rows` contains your feedback row
   - `byVersion` maps `2.1.0` to the submitter email

**Pass criteria:** Artifact written, counts correct, and the submitter email appears under the correct version.

---

## What to note during testing

For each stage, record:

- Did it work as described? (`Yes`, `No`, or `Partial`)
- If not, what happened instead?
- Was anything confusing or unclear without knowing the code?
- Did the environment mismatch matter, for example shared dev server vs local runner?
- Anything that felt broken from a user-experience perspective, even if technically it worked

This feedback should shape Wave 6 prioritization and any follow-up work needed to make the pipeline operable by humans before full automation lands.

---

## Scenario matrix

| Scenario | Stage(s) | What to confirm |
|---|---|---|
| High-confidence submission flows to PR automatically | 1 → 4 → 5 | `steward:daily` classifies automatically; row goes `submitted → classified → in_pr` |
| Lower-confidence submission requires admin approval | 1 → 4 → 3 → 4 or 5 | Dry-run classifies row to `awaiting_approval`; approval moves it to `classified`; rerun daily to create the PR |
| Admin filter state preserved across refresh | 3 | Set filter, refresh, confirm the same filter is applied |
| Dry-run classifies without executing | 4 | Submitted rows may advance to `classified` / `awaiting_approval`; no PR created; no `prNumber` attached |
| Rollback cleanly undoes an unmerged PR | 6 decision point | `steward:rollback` closes the PR, resets rows to `classified`, and removes the pending changelog entry |
| Ship script fails cleanly on non-merged PR | 7 error case | Run the ship script before merging; confirm non-zero exit and no DB mutation |
| Notify respects `--since-hours` cutoff | 8 | Run with `--since-hours 1` shortly after shipping and confirm the row appears |
