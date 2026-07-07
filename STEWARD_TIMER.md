# Feedback Steward Implementation Timer

⏱️ **REMINDER: Use Sonnet for Wave 4 automation design/execution. Haiku was acceptable for structural groundwork, but Wave 4 is contract-heavy and failure-sensitive. Current recommended model: Sonnet.**

---

## Waves Timeline

### Wave 0 — Automation Probe (Complete)

- **Start:** [Prior context, timing not tracked]
- **Status:** Complete (from prior context)
- **Duration:** (already done)

---

### Wave 1 — Foundation: DB, Types, Routes, Pages + Tests

- **Start:** 2026-05-25T10:27:07Z (schema migration)
- **Estimated duration:** 2–3 days focused coding
- **Status:** ✅ COMPLETE
  - ✅ 1.1: Schema migration (2026-05-25T10:27:07Z) — 24 columns added, 2 indexes
  - ✅ 1.2: Types expanded (2026-05-25T10:27:32Z) — status, triage, workflow enums/interfaces
  - ✅ 1.3: Repository refactored (2026-05-25T10:33:34Z) — 8 functions, transform function, type fix
  - ✅ 1.4-1.5: Routes (2026-05-25T10:28:36Z–10:30:52Z) — API handlers, navigation updates
  - ✅ 1.6: UI pages (2026-05-25T10:28:07Z–10:28:14Z) — stub components for hub, detail, admin queue
  - ✅ 1.6b: Navigation (2026-05-25T10:30:52Z) — nav items + sidebar role filtering
  - ✅ 1.7: Tests — 21 API route tests + 11 repository tests, all passing
- **Completed at:** 2026-05-25T10:48:00Z
- **Total elapsed:** 20m 53s (10:27:07Z → 10:48:00Z)
- **Build status:** ✅ Passing
- **Note:** requireAdminApi returns email; storing in adminApprovedByUserId field. TDD approach applied to Wave 1.7.

---

### Wave 2 — Admin Approval Workflow (UI Polish)

- **Start:** 2026-05-25T10:41:28Z
- **Estimated duration:** 1 day
- **Status:** ✅ COMPLETE
- **Scope:** Polish approval UI, add approval modal, update admin page interactivity, tests
- **Sub-tasks:**
  - ✅ 2.1: AdminFeedbackPage interactivity (filters, sorting, selection)
  - ✅ 2.2: Approval modal/dialog component
  - ✅ 2.3: Integrate approval action into UI
  - ✅ 2.4: Polish styling and UX
  - ✅ 2.5: Integration tests for admin flow
  - ✅ 2.6 (Sonnet audit): FeedbackHubPage rewritten — Link navigation, service layer, design system layout
  - ✅ 2.7 (Sonnet audit): FeedbackDetailPage rewritten — service layer, back link, proper sections
  - ✅ 2.8 (Sonnet audit): approveFeedback status bug fixed (classified → awaiting_approval)
  - ✅ 2.9 (Sonnet audit): Admin filter options aligned to FeedbackType enum
  - ✅ 2.10 (Sonnet audit): FeedbackHubPage + FeedbackDetailPage integration tests added (18 tests)
- **Completed at:** 2026-05-25T11:00:00Z
- **Total elapsed:** ~19m (10:41:28Z → 11:00:00Z)
- **Tests:** 77 passing (all feedback API + integration suites)
- **Build status:** ✅ Passing

---

### Wave 3 — Automation: Scripts + Classify Skill

- **Start:** 2026-05-25T11:00:00Z (after Wave 2)
- **Estimated duration:** 2 days
- **Status:** ✅ COMPLETE
  - ✅ 3.1: `scripts/feedback-requeue.ts` — queries unclassified rows, outputs JSON
  - ✅ 3.2: `scripts/feedback-dedupe.ts` — detects duplicates by Jaccard similarity + PR number match
  - ✅ 3.3: `.claude/feedback-classify.md` — Claude skill to classify one feedback row
  - ✅ 3.4: `scripts/run-classify.ts` — orchestrates requeue → dedupe → classify → DB update
  - ✅ 3.5: Tests — 9 passing (4 requeue + 5 dedupe)
  - ✅ npm scripts: `steward:requeue`, `steward:dedupe`, `steward:classify`
- **Completed at:** 2026-05-25T11:15:54Z
- **Total elapsed:** ~??m since Wave 2 end (start time carried from prior context)
- **Tests:** 9 new passing; the previously noted unrelated `About` and `Dashboard` test failures were corrected afterward
- **Build status:** ✅ Tests passing (Wave 3 scope)

---

### Wave 4 — Daily Plan + Execute

- **Start:** 2026-05-25T15:46:00Z *(unverified, from user turn timestamp)*
- **Estimated duration:** 2–3 focused days
- **AI agentic estimate:** 16–24 hours end-to-end for north-star Wave 4 scope
- **AI agentic estimate (best case):** 12–16 hours if Wave 3 classify output contract is hardened first and the Claude/PR environment behaves cleanly
- **Status:** IN PROGRESS
- **North-star scope adjustment:** Follow `20260524-1230-feedback-steward-agent-idea.md` as the Wave 4 source of truth, not just the thinner implementation-plan wording
- **Sub-tasks:**
  - ✅ 4.0a: Introduced `features/feedback/server/service.ts` as the workflow-rule owner for approval/classification eligibility
  - ✅ 4.0b: Added failing-first service tests for approval semantics, classification semantics, duplicate cancellation, and daily-run eligibility
  - ✅ 4.0c: Updated `adminApprove` route to use the service layer instead of calling the repository directly
  - ✅ 4.0d: Green verification for first Phase 0 slice — 10 targeted tests passing (`service.test.ts` + `adminApprove.test.ts`)
  - ✅ 4.1: Defined the plan→execute contract first (schema-validated JSON artifact plus human-readable markdown mirror)
  - ✅ 4.2: Confirmed and encoded eligibility/idempotency policy in the service layer (auto-eligible vs approval-derived classified rows, skip existing `prNumber`, do-not-automate policy)
  - ✅ 4.3: Added `scripts/run-daily.ts` with `--dry-run` support
  - ✅ 4.4: Added `.claude/feedback-daily-plan.md` for grouped morning-plan generation
  - ✅ 4.4b: Added `config/feedback-steward/do-not-automate.json`
  - ✅ 4.4c: Routed `run-classify.ts` mutation paths through the feedback service instead of directly to repository updates
  - ✅ 4.4d: Green verification for classify + daily dry-run slice — 11 targeted tests passing (`run-classify.test.ts` + `run-daily.test.ts`)
  - ✅ 4.5: `.claude/feedback-execute.md` — execute skill with exact JSON schema, step-by-step workflow, TDD rules, PR body expectations
  - ✅ 4.6: Write grouped plan artifact under `docs/bug_enhancement` — JSON + Markdown written by `run-daily.ts`
  - ✅ 4.7: Create/update branch and PR against `dev` — handled by execute agent via `executeDailyPlan` in `run-daily.ts`
  - ✅ 4.8: Mirror PR number, preview URL, UAT instructions, and changelog candidate data — `markFeedbackAttachedToPr` called per feedback ID after validated execute output
  - ✅ 4.9: Orchestrator tests — 9 tests covering: dry-run writes artifacts only, invalid plan output (no file writes), live run happy path (rows updated), no eligible feedback (early exit without Claude), planning failure (no artifacts, no DB), execute non-zero exit (no DB), execute invalid output (no DB)
  - ⬜ 4.10: Manual verification — perform once a live run environment is available: grouped plan readability, PR body/UAT quality, Render preview URL in output, feedback rows transition to in_pr/in_qa
- **Assumptions to confirm before coding:**
  - Canonical machine artifact is strict JSON; markdown is a readable mirror, not the executor source of truth
  - Wave 4 gate is "high confidence + low risk + approved item/batch only" per north star unless explicitly widened
  - Wave 4 owns PR open/update, preview URL surfacing, UAT generation, and changelog candidate drafting
  - Wave 5 owns merge-to-dev completion, shipped/version-resolved updates, and submitter/admin completion evidence
  - Claude CLI, git auth, GitHub CLI auth, and Render preview behavior are available/stable in the runtime environment
- **Key risks / concerns:**
  - Wave 3 classify output contract is not hardened enough yet; bad metadata can poison Wave 4 eligibility
  - Invalid or partial model output can silently corrupt planning/execution state without schema validation
  - Retry/rerun behavior can create duplicate branch or PR churn if idempotency rules are weak
  - Windows/PowerShell quoting and CLI invocation details can break otherwise-correct automation
  - It is easy to overrun Wave 4 into Wave 5 if merge-hook/completion concerns are not held back
- **Latest verified progress timestamp:** 2026-05-25T17:30:00Z *(approximate — set at Wave 4 completion)*
- **Status:** ✅ COMPLETE (4.10 manual verification deferred until live environment available)
- **⚠️ DEFINITELY SONNET SWITCH** for automation skill design

---

### Wave 5 — Shipping and Completion Workflow

- **Start:** 2026-05-25T18:00:00Z (approximate)
- **Estimated duration:** 1–2 focused days
- **North-star scope:** Close the loop after PR execution succeeds
- **Sub-tasks:**
  - ✅ 5.0 (pre-condition): Fixed Wave 4 bug — `updateFeedbackWorkflow` was silently dropping the `status` field; rows were never transitioning from `classified` to `in_pr`/`in_qa` after PR attachment
  - ✅ 5.1: `scripts/merge-hook.ts` — verifies PR merged into `dev` via `gh pr view`, then calls `markFeedbackShippedByPr`; npm script `steward:merge-hook`
  - ✅ 5.2: `markFeedbackShippedByPr(prNumber, { versionResolved, changelogVersion })` in feedback service — finds all `in_pr`/`in_qa` rows for the PR, writes `shipped` + `versionResolved` + `resolvedAt` + `changelogVersion`; `listFeedbackByPrNumber` added to repository
  - ✅ 5.2b: Tests — 5 merge-hook tests + 4 service tests for ship/attach semantics (18 total in the wave, all passing)
  - ✅ 5.3: FeedbackDetailPage — confirmed shipped section already renders changelog label/version/credit; added 2 missing test cases covering those fields
  - ✅ 5.4: AdminFeedbackPage — fixed approve button to `awaiting_approval` (was `classified`); fixed optimistic update to set `classified` after approval (was `awaiting_approval`); added `versionResolved` badge on shipped cards; updated all affected tests
  - ✅ 5.5: `scripts/feedback-notify.ts` — queries shipped rows, filters by `sinceHours`, writes JSON summary to `tmp/feedback-steward/notifications/`; npm script `steward:notify`; 4 tests
  - ⬜ 5.6: Manual verification — run merge-hook against a real PR, confirm rows flip to shipped, run notify and confirm artifact
- **Tests added in Wave 5:** 23 new tests across service, merge-hook, notify, and integration suites
- **Build status:** ✅ Tests passing (5.1–5.5 complete)

---

## Ridiculously Optimistic Total Estimate

- **Wave 1:** 2–3 days
- **Wave 2:** 1 day
- **Wave 3:** 2 days
- **Wave 4:** 2–3 focused days / 16–24 AI agentic hours
- **Wave 5:** 1–2 focused days
- **Total:** **10–12 days** (if everything goes perfectly and Claude doesn't need to switch models mid-implementation 😅)

---

## Notes

- This assumes no rework, no bugs, no CI failures, and uninterrupted focus.
- Real estimate: probably 3–4 weeks with debugging, testing, and manual QA per wave.
- Haiku handles structural work fine; **Sonnet needed for Waves 3–4 when reasoning about automation logic intensifies.**
- **Timestamps:** Always run `date -u +"%Y-%m-%dT%H:%M:%SZ"` to get the real UTC time before writing a completion timestamp. Never guess or estimate times — if a prior session's timestamp cannot be verified, mark it as `(unverified, from prior context)`.

---

## Estimation Findings — Feedback Queue run (2026-07-06)

Second measured data point, comparing **estimate → actual** on the Feedback Queue plan
(`docs/bug_enhancement/20260706-feedback-queue-plan.md`). Actuals verified against **git
committer timestamps**, not the progress tracker (the tracker's first `startedAt` was a
fabricated round number — see caveat below).

| Unit | Estimate (raw) | Estimate (÷5 "reality") | Actual (git) |
|------|----------------|-------------------------|--------------|
| Task 1 — 2 bug commits | 3–4h | ~35–45 min | **~15 min** |
| Task 2 — 3 UX commits | 2–3h | ~30–40 min | **~11 min** |
| Tasks 1+2 combined (5 commits) | — | ~1h | **~27 min** |
| Real inter-commit gaps | — | — | 11, 4, 8, 1, 1 min |

### What the estimates got wrong

1. **Even the corrected numbers were 2–3× too high.** Actual ≈ raw ÷ 8–10, not ÷ 5. The
   STEWARD_TIMER Wave 1–3 data (2–3 day estimate → 20 min actual) was available and still
   under-applied.
2. **Risk was mispriced as time.** Bug 1.1 (shared-query change) carried the biggest time
   weight because it was "risky"; it took ≤11 min with no rework. A risk that doesn't
   materialize costs zero. Price risk as a probability-weighted tail, not flat padding.
3. **The build/test gate was overestimated.** Predicted "2–4 min × N commits" as the
   tentpole cost; real commits were 1–8 min apart *including* writing test + code + running
   the gate.
4. **The dominant variable is human turn-gaps, not compute.** "With user in the loop"
   estimate was 4–6h; the same work ran in 27 min uninterrupted (~10× difference).

### The meta-lesson
Accuracy improved every time real evidence replaced intuition (code audit → STEWARD_TIMER →
git commit times). **Verify the "actual" too** — trusting the progress file's inflated 47 min
would have taught the wrong throughput.

### Data-integrity caveat (why we almost learned the wrong thing)
The subagent wrote `1.1.startedAt = 22:45:00`, ~20 min *before* the preceding commit
(`f14899e`, 23:04:51) even existed — a guessed value. `completedAt` values were accurate
(they matched commit times). Reinforces the timestamp rule above: **read the clock, never
guess.** When recording durations, derive `startedAt` from the prior commit time or a real
clock read, not a round number.

### Estimation method to use going forward
Quote **two separate numbers**, and anchor to measured throughput:

```
execution_time   = commits × minutes_per_commit     # anchor 1–8 min/commit from measured runs; default ~5
collaboration_time = human_checkpoints × turn_gap     # the real cost when a human is in the loop
risk_premium     = Σ (probability_i × time_if_it_hits_i)   # weighted tail, NOT flat padding
estimate         = execution_time + collaboration_time + risk_premium
```

Report execution and collaboration separately (they differ ~10×). Discount `minutes_per_commit`
when: the code path is already audited, the infra/seam already exists, and the change is
additive/type-only. Inflate only the specific commit with a materialized-risk tail (shared query,
new write path, migration).

