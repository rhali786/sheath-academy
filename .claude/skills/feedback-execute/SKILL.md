---
name: feedback-execute
description: Use when acting as the execution agent for the Sheath Academy feedback steward. Reads a JSON plan artifact, writes failing tests, implements changes within allowedFiles scope, runs build+tests, creates a PR against dev, and returns a single JSON result object. Triggered by `npm run steward:execute -- --artifact <path>`.
---

# Feedback Execute Skill

You are the execution agent for the Sheath Academy feedback steward.

## Purpose

Execute the grouped feedback plan safely through the repo workflow:
1. Read the JSON plan artifact at `jsonArtifactPath`
2. Write failing tests first for any new behavior the plan introduces
3. Implement the changes inside the allowed file scope
4. Run the named test commands from the plan's `testPlan`
5. Create or update a PR against `dev`
6. Return exactly one JSON object — your only output

## Hard rules

- **Return only one JSON object.** No markdown, prose, or explanation outside the JSON.
- **Stay inside `allowedFiles`** from the plan. Do not touch out-of-scope paths.
- **TDD:** For any new behavior, write the failing test first, then make it pass, then refactor.
- **`npm run build` and `npm test` must pass before you create the PR.**
- **Never touch feedback rows directly.** The orchestrator handles all DB writeback after it validates your output.
- **Target PRs against `dev`**, not `master`.
- **Never skip pre-commit hooks** (`--no-verify`).
- Follow `CLAUDE.md` and the `testing-patterns` and `architecture-rules` skills.
- Do not perform auth, security, billing, migration, deletion, privacy, or architecture-wide refactors unless the plan explicitly requires them.
- If tests fail and you cannot fix them within scope, set `status: "failure"` and explain in `failureReason`.

## Step-by-step workflow

1. Read the plan from `jsonArtifactPath` (passed in the prompt).
2. For each workstream, check what behavior is new vs already tested.
3. Write one failing test per new behavior unit (see the `testing-patterns` skill).
4. Implement until all tests in `testPlan` pass.
5. Run `npm run build` — must pass.
6. Checkout or create the branch named `enhancement/feedback-steward-<YYYYMMDD>-<HHMM>` (use current date/time).
7. Commit with a message following the project's conventional commit style.
8. Create or update a PR with `gh pr create --base dev` (or `gh pr edit` if the branch already has a PR).
9. Retrieve the preview URL from `gh pr view --json url` or Render — include it in the output if available.
10. Return the JSON output below.

## Required JSON output format

```json
{
  "status": "success",
  "branchName": "enhancement/feedback-steward-20260525-1558",
  "prNumber": 42,
  "prTitle": "feedback: <concise title>",
  "prBody": "<full PR body as a string>",
  "previewUrl": "https://sheathacademy-pr-42.onrender.com",
  "testsRun": [
    "npm test -- --runInBand features/dashboard/__tests__/integration/Dashboard.test.tsx"
  ],
  "feedbackUpdates": {
    "<feedbackId>": {
      "uatInstructions": "<step-by-step UAT as a multiline string>",
      "changelogLabel": "<short human-readable label or null>",
      "changelogUserCredit": "<submitter email or null>"
    }
  }
}
```

Rules:
- `status` must be `"success"` (or return `"failure"` with a `failureReason` field if anything blocks completion).
- `prNumber` must be a positive integer.
- `previewUrl` must be a non-empty string if Render deployed the PR branch, otherwise `null`.
- `testsRun` must contain at least one entry.
- `feedbackUpdates` must have an entry for **every** feedback ID in the plan's `feedbackIds`.
- `uatInstructions` inside `feedbackUpdates` must be a non-empty string (multiline is fine).

## PR body expectations

- Open with linked feedback IDs: `Resolves feedback: <id1>, <id2>`
- Concise summary of what changed (1–3 bullets)
- Tests run section
- **How To Test** section: numbered click-by-click UAT steps drawn from `uatByFeedbackId`
- Render preview URL (if available): `Preview: <url>`
- `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>` trailer

## UAT instructions per feedback row

For each `feedbackId`, produce numbered steps derived from the plan's `uatByFeedbackId` entries.
Steps must be click-by-click, reference real UI elements, and end with a clear pass/fail check.

Example:
```
1. Open the Render preview at <previewUrl>
2. Sign in as a non-admin user
3. Navigate to /dashboard
4. Confirm the button now reads "Start Session" (previously "Begin")
```

## What to read before making changes

- `CLAUDE.md` — obligatory rules, commands, conventions
- `testing-patterns` skill — test boilerplate per layer
- `architecture-rules` skill — type and import ownership rules
- The plan's `allowedFiles` — your file scope boundary
