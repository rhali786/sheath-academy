# Idea Exploration — Feedback Steward Agent Automation

Branch context: `dev`

Status: Exploratory idea, not an approved implementation plan

## Idea Summary

Explore a future automation called the **Feedback Steward Agent**. The agent would review database-backed feedback on a schedule, group related feedback, create or update development plans, and potentially help move feedback toward resolution.

The core idea is to turn feedback from a passive database table into an active improvement loop while preserving architecture, security, testing, and human review standards.

This document is intentionally not a build plan. It is a concept note for discussion, refinement, and future planning.

## Starting Concept

Once per day, an agent such as Claude Code or Codex could check the feedback table.

Possible behavior:

- If there is no open feedback, skip the run.
- If there is one feedback item, analyze it and create a focused plan.
- If there are multiple related feedback items, collapse them into one grouped plan using the planning guide.
- If there are many unrelated items, group by feature, risk, and theme.
- For safe, approved work, eventually create a branch, execute the plan, commit, push, archive the plan, update the feedback record, attach a version number, and mark the feedback done.

The vision is not just automation. The vision is disciplined stewardship: every feedback item is treated as an amānah, with traceability, quality checks, and humility about what should require human judgment.

## Outside Enhancements to Explore

Outside enhancements are improvements around the workflow rather than inside the code-change rules.

### User feedback loop

When a feedback item is resolved, notify the person who submitted it if contact information is available.

Possible message:

- What changed.
- Which version includes the change.
- Link to the PR, commit, or release note.
- Whether the feedback was fully resolved, partially resolved, deferred, or needs clarification.

### Admin daily digest

Send a daily or weekly admin digest showing:

- New feedback received.
- Feedback grouped into plans.
- Feedback skipped.
- Feedback needing clarification.
- Branches or PRs opened.
- Tests/build status.
- Items marked done.

### Feedback receipt and tracking

Give each feedback item a visible lifecycle:

```txt
received → triaged → planned → in progress → PR opened → shipped → done
```

Other statuses could include:

```txt
needs clarification
deferred
duplicate
blocked
failed automation
human review required
```

### PR-first workflow

The agent should open a branch and PR rather than pushing directly to `dev` or `main`.

Direct merge can be considered later only for very low-risk changes after the system earns trust.

### Release note generation

When feedback is resolved, generate a short changelog entry:

```txt
Fixed dashboard learner filtering from linked alert cards.
Improved lesson status sync after edit.
Added clearer empty state on reports.
```

### Clarification channel

Some feedback is ambiguous. The agent should not guess. It should mark the item `needs_clarification` and generate one or two precise questions.

### Feedback grouping intelligence

If ten feedback records touch the same feature, one grouped plan may be appropriate.

If ten records touch unrelated features, the agent should split them by feature/risk rather than creating one broad unstable PR.

### Do-not-automate categories

Some feedback should become plan-only by default:

- Authentication and authorization.
- Security.
- Data deletion.
- Database migrations.
- Billing/payment.
- Privacy-sensitive changes.
- Architecture-wide refactors.
- Anything that changes permissions or user ownership.

### Rollback visibility

Every run should store:

- Agent run ID.
- Feedback IDs processed.
- Plan path.
- Branch name.
- PR URL.
- Commit SHAs.
- Tests run.
- Migration status.
- Final result.
- Rollback notes.

## Inside Enhancements to Explore

Inside enhancements are guardrails and intelligence inside the repo/agent workflow.

### Triage before planning

Raw feedback should become a normalized triage record before planning.

Possible fields:

```txt
category
feature_area
severity
risk_level
confidence
scope
requires_human_review
duplicate_of
related_feedback_ids
suggested_next_action
```

### Architecture rule enforcement

Before writing a plan or code, the agent should read the relevant project guidance:

- `CLAUDE.md`
- `docs/README.md`
- `docs/planning-quality-rule.md`
- UI style guide if UI is affected
- Any future automation rules document

It should verify feature ownership and avoid known anti-patterns, such as putting canonical feature data into dashboard stores.

### Risk-based permission levels

Potential automation levels:

| Level | Behavior |
|---|---|
| Level 0 | Triage only |
| Level 1 | Create plan only |
| Level 2 | Create branch and PR with changes |
| Level 3 | Auto-merge low-risk changes after tests pass |

Initial version should probably stop at Level 1 or Level 2.

### Planning quality rule integration

The agent should follow the planning quality rule before implementation:

- Inspect only necessary files.
- Identify source of truth.
- Identify rendering components, API routes, services, repositories, and tests.
- Confirm import patterns.
- Verify route wiring.
- List files to touch.
- Write failing tests before implementation where appropriate.

### Test requirement by risk

Not every feedback item needs the same test depth.

Possible mapping:

| Feedback type | Minimum test expectation |
|---|---|
| Copy/UI label | Component or snapshot-adjacent test if existing |
| UI behavior | Component/integration test |
| API behavior | API/service test |
| Cross-feature behavior | Unit + integration + Playwright |
| DB migration | Migration + repository/API tests |
| Auth/security | Plan-only or human approval plus targeted tests |

### Feedback status update rules

The agent should not mark feedback done just because code was written.

Suggested rule:

- `planned` when a plan exists.
- `in_progress` when branch work begins.
- `pr_opened` when a PR exists.
- `done` only after tests pass and the PR/commit is linked.
- `needs_clarification` when the agent cannot safely infer the desired behavior.
- `failed` when the run attempted work but did not complete.

### Partial completion handling

If a grouped plan includes ten feedback items and only seven are resolved, only those seven should be marked done. The other three should remain open, deferred, or needs clarification with a reason.

### Blast-radius section

Every generated plan should include a blast-radius section:

- Affected pages.
- Affected components.
- Affected API routes.
- Affected services/repositories.
- Affected database tables.
- Affected tests.
- Affected user workflows.

### Contradiction detection

The agent should stop and ask for review when feedback conflicts with architecture rules, security boundaries, or product direction.

Example:

- Feedback asks dashboard to store canonical lesson progress.
- Feedback asks for admin-only data to be visible to all users.
- Feedback requires changing auth/permissions without clear acceptance criteria.

## Possible Data Model Additions

The current `user_feedback` table stores submitted feedback. A future steward workflow may need additional fields or related tables.

Possible fields on feedback:

```txt
status
triage_category
feature_area
risk_level
priority
version_resolved
resolved_at
resolution_summary
plan_path
branch_name
pr_url
commit_sha
agent_run_id
needs_human_review
```

Possible related table:

```txt
feedback_agent_runs
- id
- started_at
- completed_at
- status
- feedback_ids
- grouped_plan_path
- branch_name
- pr_url
- commit_shas
- tests_run
- result_summary
- error_message
```

## Open Questions

1. Should the first version create plans only, or also open PRs?
2. Should high-risk items always be plan-only?
3. Should the agent run daily, weekly, or only when manually triggered?
4. Should it process all open feedback or cap itself to one grouped batch per run?
5. Should feedback submitters receive email updates, in-app updates, or both?
6. Should the admin approve grouped feedback before any code is written?
7. Should the agent create GitHub issues from feedback before planning?
8. Should the version number be the app version, PR number, release version, or commit SHA?
9. What exact statuses should be added to the feedback lifecycle?
10. Should the first implementation use GitHub Actions, a scheduled server job, or an external automation runner?

## Suggested Starting Position

The safest first version is:

```txt
Daily or manual trigger
→ read open feedback
→ group feedback
→ create a plan under docs/bug_enhancement
→ update feedback records as planned
→ notify admin with summary
```

A second version could:

```txt
create branch
implement low-risk approved plan
run tests
push branch
open PR
update feedback records with PR link
```

Auto-merge should wait until the workflow has proven itself repeatedly.

## Why This Is Worth Exploring

This could make Sheath Academy feel unusually responsive. Feedback would not decay in a table. It would become a structured improvement pipeline with visibility, planning discipline, and accountable resolution.

The major caution is that speed without guardrails can damage trust. The system should begin with planning and traceability, then earn more autonomy slowly.
