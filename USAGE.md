# Usage Log

## Goal

Log a usage snapshot **before every `/clear`**. Over time, correlate these
snapshots with the work done between them to derive **our own unit of capacity** —
a practical estimate of "how much real work the quota buys."

Raw tokens are a poor unit: token cost varies by model (Opus ≫ Sonnet ≫ Haiku),
by reasoning effort, and by cache hit/miss. We want a model- and effort-normalized
measure (e.g. "QC passes per session", "plans reviewed per 10% quota", or a
weighted cost-per-task) so we can predict capacity *before* starting a batch and
decide how to route work (Opus driver vs. cheaper subagents) to stay within quota.

Each entry below is a data point toward that calibration.

---

## 2026-06-07 — pre-"DOZZY" checkpoint (session at 80% used, resets 6:30pm America/New_York)

- **Total cost:** $21.34
- **Total duration (API):** 1h 20m 55s
- **Total duration (wall):** 18h 43m 56s
- **Total code changes:** 3010 lines added, 29 lines removed

### Usage by model

| Model | Input | Output | Cache read | Cache write | Cost |
|-------|-------|--------|------------|-------------|------|
| claude-sonnet-4-6 | 13.3k | 255.0k | 26.3m | 1.4m | $17.11 |
| claude-haiku-4-5 | 17.1k | 164 | 0 | 0 | $0.0179 |
| claude-opus-4-8 | 14.7k | 53.9k | 2.9m | 214.0k | $4.22 |

### Limits

- **Current session:** 80% used (resets 6:30pm America/New_York)
- **Current week (all models):** 16% used (resets Jun 14, 1am America/New_York)

### What's contributing (last 24h)

- 27% from subagent-heavy sessions (each subagent runs its own requests)
- 25% from `/feedback-execute`

| Skill | % of usage |
|-------|-----------|
| /feedback-execute | 25% |
| /plan-execute | 10% |
| /plan-builder | 9% |
| /ui-style-guide | 2% |

| Subagent | % of usage |
|----------|-----------|
| plan-execute | 8% |
| Explore | 2% |

### Delta since "post Track 1 execute" entry

- Session usage moved **71% → 80% (+9 points)**, cost **+$2.55** ($18.79 → $21.34),
  in roughly +8m29s of API time and +1h29m of wall time. Code changes grew by a
  small +63/-7 lines — this stretch was mostly conversation/orchestration, not
  bulk file edits.
- **Opus line is byte-for-byte unchanged** (input/output/cache read/cache write/cost
  all identical to the prior snapshot: $4.22). The entire marginal spend is sonnet
  (+$2.55, output +28.5k, cache read +5.9m, cache write +0.1m) plus a fractional
  haiku tick. Confirms: this window had **zero new reasoning-tier (opus) work** —
  pure interactive/orchestration churn on the driver model.
- User flagged "**we are about to start a DOZZY!!**" right at this checkpoint —
  i.e. logging the snapshot deliberately *before* a big push, per the standing
  goal of capturing pre/post pairs to calibrate cost-per-batch. Whatever the next
  heavy run is, this $21.34 / 80% mark is its baseline — diff the next entry
  against this one to measure it.
- **Budget consequence:** only ~20% of session remains before the 6:30pm reset.
  Per the standing lesson ("never launch a heavy execute past ~70% session"),
  the "DOZZY" should either be lightweight enough to fit in the remaining 20%,
  or deliberately deferred to a fresh post-reset session.

---

## 2026-06-07 — post Track 1 execute (session at 71% used, resets 6:30pm America/New_York)

- **Total cost:** $18.79
- **Total duration (API):** 1h 12m 26s
- **Total duration (wall):** 17h 14m 44s
- **Total code changes:** 2947 lines added, 22 lines removed

### Usage by model

| Model | Input | Output | Cache read | Cache write | Cost |
|-------|-------|--------|------------|-------------|------|
| claude-sonnet-4-6 | 11.1k | 226.5k | 20.4m | 1.3m | $14.56 |
| claude-haiku-4-5 | 16.6k | 149 | 0 | 0 | $0.0174 |
| claude-opus-4-8 | 14.7k | 53.9k | 2.9m | 214.0k | $4.22 |

### Limits

- **Current session:** 71% used (resets 6:30pm America/New_York)
- **Current week (all models):** 15% used (resets Jun 14, 1am America/New_York)

### What's contributing (last 24h)

- 25% from subagent-heavy sessions (each subagent runs its own requests)
- 24% from `/feedback-execute` — now the dominant skill in the window

| Skill | % of usage |
|-------|-----------|
| /feedback-execute | 24% |
| /plan-builder | 10% |
| /plan-execute | 10% |
| /ui-style-guide | 3% |
| /architecture-rules | 1% |

| Subagent | % of usage |
|----------|-----------|
| plan-execute | 7% |
| Explore | 2% |

### Delta since 12:32pm entry (Step 5 — third `steward:execute`, PARTIAL)

**Session arc:** 89% → limit (attempt 2) → **reset at 1:10pm** → **0% → 71%** on the
post-reset run. The **+71 points** in the new window is one full Track-1 execute — our
best single-run calibration yet for a 7-workstream steward batch.

**Run log:** `logs/steward/2026-06-07T17-34-10-136Z-daily-execution.*`

| Metric | Attempt 1 (failed) | Attempt 2 (failed) | Attempt 3 (partial) |
|--------|-------------------|-------------------|---------------------|
| Session Δ | +19 pts (70→89%) | +11 pts (89→100%) | **+71 pts (0→71%)** |
| Run `$` | $1.32 | $0.70 | **$7.32** |
| Turns | 46 | 24 | **181** |
| Wall | ~46 min | ~24 min | **~78 min** |
| Edits | denied | OK | **OK** |
| Commit/PR | none | none | **commit yes, PR no** |

- **Direct run cost: $7.32** (`total_cost_usd` in result JSON). Same two-ledger pattern:
  interactive `/stats` **Total cost** still shows **$18.79** (unchanged since 12:32pm);
  the headless steward process is not rolled into that line. Real spend for Step 5 across
  all three attempts: **~$9.34** ($1.32 + $0.70 + $7.32).
- **Outcome: code shipped, pipeline incomplete.** `--permission-mode acceptEdits` fixed
  the edit denials. Agent committed and pushed
  `enhancement/feedback-steward-20260607-1400` (`e31c39c`, 16 files, +301/−65): plan
  lesson UX, nav module grouping + Growth & Reflection rename, attendance learner label,
  single notification bell, portfolio subject dropdown fix. Settings help copy (WS2) was
  already present — no diff needed.
- **PR blocked:** 8 permission denials, all **`gh`** (`pr create`, `pr list`, `gh api`).
  `.claude/settings.local.json` allows `git`/`npm` but **not `gh`**. Agent returned
  `status: "success"` with `prNumber: null`; orchestrator validation requires a positive
  integer → **`Invalid execute output`** — no feedback DB writeback, no changelog row,
  no `steward:ship` path.
- **Tests/build (from agent report):** targeted integration tests green; full suite 881
  passed with 3 pre-existing DB-dependent failures; `npm run build` passed. Worth a
  local confirm before merge.
- **Calibration lessons:**
  - Full Track-1 batch ≈ **71 session points + ~$7** when it completes — budget **one
    execute per fresh session** and stop planning other heavy work in the same window.
  - Failed partial runs are ~**19–30 pts + $1–2** for zero or non-mergeable output;
    guard preconditions (permissions, session headroom) before spawn.
  - **`gh` must be on the steward allow-list** (or PR creation moved outside the agent)
    or every successful execute will stall at the same step.

**Next manual step:** `gh pr create --base dev --head enhancement/feedback-steward-20260607-1400`
(or open the GitHub “compare & pull” URL), then re-run orchestrator writeback / ship if
needed. Add `Bash(gh *)` to `.claude/settings.local.json` before the next execute.

---

## 2026-06-07 — 12:32pm (session at 89% used, resets 1:10pm America/New_York)

- **Total cost:** $18.79
- **Total duration (API):** 1h 12m 26s
- **Total duration (wall):** 13h 5m 38s
- **Total code changes:** 2947 lines added, 22 lines removed

### Usage by model

| Model | Input | Output | Cache read | Cache write | Cost |
|-------|-------|--------|------------|-------------|------|
| claude-sonnet-4-6 | 11.1k | 226.5k | 20.4m | 1.3m | $14.56 |
| claude-haiku-4-5 | 16.6k | 149 | 0 | 0 | $0.0174 |
| claude-opus-4-8 | 14.7k | 53.9k | 2.9m | 214.0k | $4.22 |

### Limits

- **Current session:** 89% used (resets 1:10pm America/New_York)
- **Current week (all models):** 9% used (resets Jun 14, 1am America/New_York)

### What's contributing (last 24h)

- 36% from subagent-heavy sessions (each subagent runs its own requests)
- 12% from subagents under `plan-execute`
- 10% from `/plan-execute`

| Skill | % of usage |
|-------|-----------|
| /plan-execute | 10% |
| /plan-builder | 9% |
| /feedback-execute | 5% |
| /ui-style-guide | 3% |
| /architecture-rules | 1% |

| Subagent | % of usage |
|----------|-----------|
| plan-execute | 12% |
| general-purpose | 3% |
| Explore | 2% |

### Delta since 11:23am entry (Step 5 — `steward:execute`, FAILED)

- Session usage moved **70% → 89% (+19 points)**. That +19% is the cost of a
  single `npm run steward:execute` run against the Track-1 plan — it is the only
  Claude-CLI activity in the window.
- **Direct run cost: $1.32** (from the run's own result JSON, `total_cost_usd`).
  Cheap in dollars, expensive in session % — a cache-heavy burst (1.9m cache-read
  tokens, 22.7k output, 46 turns) lands hard against the 5-hour rolling bucket.
- **Two-ledger note:** the `/stats` **Total cost** barely moved ($18.77 → $18.79)
  because the headless `claude -p` steward run is a separate process and is **not**
  aggregated into the interactive session total. The **session %** bucket *does*
  count it (hence +19%). The run's real cost lives only in its result JSON.
- **Outcome: total loss.** The run died with an `API Error: socket connection
  closed unexpectedly` after edit **permission denials** (the `-p` invocation had
  no `--permission-mode`, so `Edit`/`Write` were denied). **No commit, no PR** —
  it left only half-written failing tests for ~3 of 7 workstreams. We paid ~19
  points + $1.32 for nothing shippable.
- **Fix landed (uncommitted):** added `--permission-mode acceptEdits` to the
  execute stage and live per-stage logging to `logs/steward/` so the next run can
  actually edit files and is observable. **Do not re-run until after the 1:10pm
  reset** — at 89%, a re-run (~another 19 pts) would hit the session limit mid-run.
- **Calibration lesson:** a failed headless execute is the worst spend profile we
  have measured — high session-% burn, real $ cost, zero output. Guard it: verify
  permissions/preconditions *before* spawning, and never launch one past ~70%
  session (this one started at 70% and exhausted the window with nothing to show).

---

## 2026-06-07 — 11:23am (session at 70% used, resets 1:10pm America/New_York)

- **Total cost:** $18.77
- **Total duration (API):** 1h 12m 23s
- **Total duration (wall):** 12h 5m 24s
- **Total code changes:** 2947 lines added, 22 lines removed

### Usage by model

| Model | Input | Output | Cache read | Cache write | Cost |
|-------|-------|--------|------------|-------------|------|
| claude-sonnet-4-6 | 11.0k | 226.4k | 20.4m | 1.3m | $14.54 |
| claude-haiku-4-5 | 16.6k | 149 | 0 | 0 | $0.0174 |
| claude-opus-4-8 | 14.7k | 53.9k | 2.9m | 214.0k | $4.22 |

### Limits

- **Current session:** 70% used (resets 1:10pm America/New_York)
- **Current week (all models):** 7% used (resets Jun 14, 1am America/New_York)

### What's contributing (last 24h)

- 37% from subagent-heavy sessions (each subagent runs its own requests)
- 12% from subagents under `plan-execute`
- 11% from `/plan-execute`

| Skill | % of usage |
|-------|-----------|
| /plan-execute | 11% |
| /plan-builder | 10% |
| /ui-style-guide | 4% |
| /feedback-execute | 2% |
| /architecture-rules | 1% |

| Subagent | % of usage |
|----------|-----------|
| plan-execute | 12% |
| general-purpose | 3% |
| Explore | 2% |

### Delta since 11:09am entry (Step 3c trim + optional cleanup — mechanical)

- Session usage moved **67% → 70% (+3 points)** and cost **+$0.67** (sonnet +$0.40,
  opus +$0.28) for purely mechanical file work: trimmed `course-rollover.json` to
  phase-1 only (removed the now-fulfilled phase-2 decision stub), consolidated the plan
  directory split (moved `ia-nav-restructure` + `course-rollover-rollover` into
  `docs/bug_enhancement/`), deleted 15 stray `.md` companions (JSON-only decision now
  enforced on disk), and removed a dangling `planMarkdownPath`.
- **Projection: I estimated ~1–2%; actual +3% — slightly over.** Reaffirms the standing
  lesson that "mechanical" is only cheap in *absolute* terms: late in a 12h wall session
  with 20m+ cache read, even moves/deletes accrue ~0.2–0.4 pt/min because each tool call
  re-reads a large accumulated context. The opus share (+$0.28) is the long-context tax,
  not real reasoning.
- **Worth-it verdict:** yes, narrowly. The +3% bought Step 4 de-risking — no directory
  split for the QC sweep to miss plans against, JSON-only enforced, no dead
  `planMarkdownPath` to confuse `plan:execute`. Cheaper to pay now than to untangle drift
  inside the QC gate.
- **Budget consequence:** 70% used, **~30% remains** before 1:10pm reset, and the
  session's one reasoning-heavy run (3b) is spent. **Step 4 QC and all executes wait for
  a fresh post-reset session.** Remaining quota this window is cheap-mechanical only, or
  bank it.

---

## 2026-06-07 — 11:09am (session at 67% used, resets 1:10pm America/New_York)

- **Total cost:** $18.10
- **Total duration (API):** 1h 10m 33s
- **Total duration (wall):** 11h 56m 33s
- **Total code changes:** 2878 lines added, 19 lines removed

### Usage by model

| Model | Input | Output | Cache read | Cache write | Cost |
|-------|-------|--------|------------|-------------|------|
| claude-sonnet-4-6 | 10.5k | 222.5k | 19.6m | 1.3m | $14.14 |
| claude-haiku-4-5 | 16.2k | 131 | 0 | 0 | $0.0168 |
| claude-opus-4-8 | 14.1k | 51.5k | 2.6m | 203.9k | $3.94 |

### Limits

- **Current session:** 67% used (resets 1:10pm America/New_York)
- **Current week (all models):** 7% used (resets Jun 14, 1am America/New_York)

### What's contributing (last 24h)

- 38% from subagent-heavy sessions (each subagent runs its own requests)
- 12% from subagents under `plan-execute`
- 11% from `/plan-execute`

| Skill | % of usage |
|-------|-----------|
| /plan-execute | 11% |
| /plan-builder | 10% |
| /ui-style-guide | 4% |
| /feedback-execute | 2% |
| /architecture-rules | 1% |

| Subagent | % of usage |
|----------|-----------|
| plan-execute | 12% |
| general-purpose | 3% |
| Explore | 2% |

### Delta since 10:59am entry (Step 3b — build `course-rollover-rollover` plan)

- Session usage moved **61% → 67% (+6 points)** and cost **+$1.19** for one
  `plan-builder` run (Mode 4/5 — year-scoped course rollover: schema migration +
  service + UI; 4 phases, 1 gated/strong). API duration +3m42s ⇒ **~1.6 pt/min**.
- **Projection beat: at 10:59am I estimated this run at ~8–12%; actual was +6%.**
  The win came from *not re-discovering* — the prompt handed me the verified code
  paths from the prior audit, so I read 9 files once and wrote, with no exploratory
  fan-out. Confirms the planning-tier rate (~1.6–2 pt/min) holds, but **grounding the
  planner with pre-verified paths shaves it toward the low end** vs. a cold Mode-3+
  build that has to trace from scratch.
- Model split is again the tell: **opus $2.75 → $3.94 (+$1.19) = ~100% of the
  marginal spend** (opus output +13k, cache write +58k); sonnet flat at $14.14.
  Real planning is an opus/strong-tier line item — same pattern as Step 3a, just
  cheaper because the reasoning surface was pre-scoped.
- **Budget consequence:** **33% remains** before 1:10pm reset. Two reasoning-heavy
  plan-builds this session cost +18 points combined (3a +12, 3b +6); the second was
  half the first purely from better input grounding. Remaining quota is enough for
  one light QC pass or a small execute, **not** another cold plan-build.
- **Calibration update:** plan-build cost is not fixed — it's `tier × reasoning
  surface`. A pre-audited prompt (paths, owners, decisions supplied) lands ~1.6
  pt/min; a from-scratch Mode-3+ trace lands ~2 pt/min. To predict a plan-build,
  ask first *how much of the audit is already done in the prompt.*

---

## 2026-06-07 — 10:59am (session at 61% used, resets 1:10pm America/New_York)

- **Total cost:** $16.91
- **Total duration (API):** 1h 6m 51s
- **Total duration (wall):** 11h 39m 7s
- **Total code changes:** 2730 lines added, 19 lines removed

### Usage by model

| Model | Input | Output | Cache read | Cache write | Cost |
|-------|-------|--------|------------|-------------|------|
| claude-sonnet-4-6 | 10.5k | 222.5k | 19.6m | 1.3m | $14.14 |
| claude-haiku-4-5 | 14.5k | 109 | 0 | 0 | $0.0150 |
| claude-opus-4-8 | 9.7k | 38.5k | 1.7m | 146.1k | $2.75 |

### Limits

- **Current session:** 61% used (resets 1:10pm America/New_York)
- **Current week (all models):** 7% used (resets Jun 14, 1am America/New_York)

### What's contributing (last 24h)

- 39% from subagent-heavy sessions (each subagent runs its own requests)
- 13% from subagents under `plan-execute`
- 11% from `/plan-execute`

| Skill | % of usage |
|-------|-----------|
| /plan-execute | 11% |
| /plan-builder | 7% |
| /ui-style-guide | 4% |
| /feedback-execute | 2% |
| /architecture-rules | 1% |

| Subagent | % of usage |
|----------|-----------|
| plan-execute | 13% |
| general-purpose | 3% |
| Explore | 2% |

### Delta since 10:43am entry (Step 3a — build `ia-nav-restructure` plan)

- Session usage moved **49% → 61% (+12 points)** and cost **+$2.17** for one
  `plan-builder` run (Mode 3 cross-feature IA plan; ~5m42s of churn, single-threaded,
  no subagent spawns). Output a 195-line PlanExecutePlan JSON (5 phases, 1 gated).
- **Projection miss: I estimated 3–6%; actual was +12% — 2–4x over.** Same class of
  error as Step 1, and the cause is now clear in the model split: **opus cost rose
  $0.93 → $2.75 (+$1.82), ~84% of the marginal spend**, with opus output +25k tokens
  and cache write +92k. Sonnet barely moved (+$0.34). So genuine *planning* runs on
  the strong (opus) tier with heavy reasoning over real code files.
- **New calibration tier — planning/reasoning:** ~2 pt/min (+12% over ~6 min of churn),
  which is **roughly 2x the subagent fan-out rate (~1.0) and ~5–9x single-threaded
  transform (~0.2–0.4)**. My earlier "plan-build is cheap single-threaded work" framing
  was wrong: it only holds for **mechanical transforms** (MD→JSON, Step 2). **Real
  planning ≠ transform.** Treat any `plan-builder` run on a Mode-3+ plan as a
  strong-tier, ~2 pt/min line item, not a cheap one.
- **Budget consequence:** only **39% remains** before the 1:10pm reset. A second
  plan-build (3b course-rollover-rollover) would likely cost another ~8–12%, leaving
  almost nothing for QC or any execute. Re-sequence: at most one more reasoning-heavy
  run this session.

---

## 2026-06-07 — 10:43am (session at 49% used, resets 1:10pm America/New_York)

- **Total cost:** $14.74
- **Total duration (API):** 1h 0m 43s
- **Total duration (wall):** 11h 24m 4s
- **Total code changes:** 2272 lines added, 19 lines removed

### Usage by model

| Model | Input | Output | Cache read | Cache write | Cost |
|-------|-------|--------|------------|-------------|------|
| claude-sonnet-4-6 | 9.9k | 221.0k | 18.6m | 1.3m | $13.80 |
| claude-haiku-4-5 | 11.3k | 73 | 0 | 0 | $0.0117 |
| claude-opus-4-8 | 4.8k | 13.3k | 474.5k | 54.3k | $0.93 |

### Limits

- **Current session:** 49% used (resets 1:10pm America/New_York)
- **Current week (all models):** 5% used (resets Jun 14, 1am America/New_York)

### What's contributing (last 24h)

- 41% from subagent-heavy sessions (each subagent runs its own requests)
- 13% from subagents under `plan-execute`
- 12% from `/plan-execute`

| Skill | % of usage |
|-------|-----------|
| /plan-execute | 12% |
| /plan-builder | 6% |
| /feedback-execute | 2% |
| /architecture-rules | 1% |
| /ui-style-guide | 1% |

| Subagent | % of usage |
|----------|-----------|
| plan-execute | 13% |
| general-purpose | 3% |
| Explore | 2% |

### Delta since 10:13am entry (30 minutes)

- Session usage moved **36% → 49%** (+13 points) and cost **+$1.76** in ~30 minutes,
  again with **zero new subagent spawns** — this stretch was the direct conversion
  of 7 markdown plans into PlanExecutePlan JSON companions (read each .md, write
  the structured JSON, validate with a Bash/node check), done entirely in the main
  thread per explicit instruction not to spawn subagents.
- Rate: ~0.43 points/min — between the single-file-transform rate (~0.23 points/min
  at 10:13am) and the subagent-spawn rate (~1.0 points/min). Likely driven by the
  larger total context held (7 source .md files + growing conversation, much of it
  cache-written rather than cache-read at each new file boundary — cache write rose
  from 1.2m → 1.3m and cache read from 16.6m → 18.6m). Reinforces: direct
  read-and-transform work is far cheaper than fan-out, but a long single-threaded
  session with many large file reads still accumulates steadily — batch/chunk such
  conversions across sessions if quota is tight, rather than doing all 7 in one go.

---

## 2026-06-07 — 9:38am (session at 21% used, resets 1:10pm America/New_York)

- **Total cost:** $11.13
- **Total duration (API):** 43m 43s
- **Total duration (wall):** 10h 20m 16s
- **Total code changes:** 1045 lines added, 19 lines removed

### Usage by model

| Model | Input | Output | Cache read | Cache write | Cost |
|-------|-------|--------|------------|-------------|------|
| claude-sonnet-4-6 | 7.8k | 145.7k | 15.4m | 974.5k | $10.50 |
| claude-haiku-4-5 | 8.7k | 36 | 0 | 0 | $0.0089 |
| claude-opus-4-8 | 4.2k | 9.0k | 145.0k | 48.2k | $0.62 |

### Limits

- **Current session:** 21% used (resets 1:10pm America/New_York)
- **Current week (all models):** 3% used (resets Jun 14, 1am America/New_York)

### What's contributing (last 24h)

- 40% from subagent-heavy sessions (each subagent runs its own requests)
- 15% from subagents under `plan-execute`
- 13% from `/plan-execute`

| Skill | % of usage |
|-------|-----------|
| /plan-execute | 13% |
| /feedback-execute | 3% |
| /plan-builder | 2% |
| /architecture-rules | 2% |
| /ui-style-guide | 2% |

| Subagent | % of usage |
|----------|-----------|
| plan-execute | 15% |
| general-purpose | 3% |

---

## 2026-06-07 — 9:47am (session at 30% used, resets 1:10pm America/New_York)

- **Total cost:** $12.34
- **Total duration (API):** 46m 54s
- **Total duration (wall):** 10h 28m 16s
- **Total code changes:** 1102 lines added, 19 lines removed

### Usage by model

| Model | Input | Output | Cache read | Cache write | Cost |
|-------|-------|--------|------------|-------------|------|
| claude-sonnet-4-6 | 9.0k | 155.2k | 16.0m | 1.1m | $11.39 |
| claude-haiku-4-5 | 10.3k | 52 | 0 | 0 | $0.0105 |
| claude-opus-4-8 | 4.8k | 13.3k | 474.5k | 54.3k | $0.93 |

### Limits

- **Current session:** 30% used (resets 1:10pm America/New_York)
- **Current week (all models):** 3% used (resets Jun 14, 1am America/New_York)

### What's contributing (last 24h)

- 42% from subagent-heavy sessions (each subagent runs its own requests)
- 14% from subagents under `plan-execute`
- 13% from `/plan-execute`

| Skill | % of usage |
|-------|-----------|
| /plan-execute | 13% |
| /feedback-execute | 3% |
| /plan-builder | 2% |
| /architecture-rules | 2% |
| /ui-style-guide | 1% |

| Subagent | % of usage |
|----------|-----------|
| plan-execute | 14% |
| general-purpose | 3% |
| Explore | 2% |

### Delta since 9:38am entry (9 minutes)

- Session usage jumped **21% → 30%** (+9 points) and cost **+$1.21** in ~9 minutes —
  driven mainly by 4 `Explore` subagents spawned for a QC batch (then rejected by
  the user before completing, since the JSON plan companions didn't exist yet).
- Even rejected/aborted subagent spawns appear to carry real cost — note the new
  `Explore` line (2%) and the jump in opus cache read (145.0k → 474.5k). Spawning
  4 subagents in parallel for a ~2-minute task burned roughly **9 percentage points
  of session quota** — a useful data point: subagent fan-out is expensive even when
  cut short.

---

## 2026-06-07 — 10:13am (session at 36% used, resets 1:10pm America/New_York)

- **Total cost:** $12.98
- **Total duration (API):** 51m 28s
- **Total duration (wall):** 10h 55m 27s
- **Total code changes:** 1369 lines added, 19 lines removed

### Usage by model

| Model | Input | Output | Cache read | Cache write | Cost |
|-------|-------|--------|------------|-------------|------|
| claude-sonnet-4-6 | 9.1k | 175.0k | 16.6m | 1.2m | $12.03 |
| claude-haiku-4-5 | 10.3k | 52 | 0 | 0 | $0.0105 |
| claude-opus-4-8 | 4.8k | 13.3k | 474.5k | 54.3k | $0.93 |

### Limits

- **Current session:** 36% used (resets 1:10pm America/New_York)
- **Current week (all models):** 4% used (resets Jun 14, 1am America/New_York)

### What's contributing (last 24h)

- 43% from subagent-heavy sessions (each subagent runs its own requests)
- 14% from subagents under `plan-execute`
- 12% from `/plan-execute`

| Skill | % of usage |
|-------|-----------|
| /plan-execute | 12% |
| /feedback-execute | 3% |
| /plan-builder | 2% |
| /architecture-rules | 2% |
| /ui-style-guide | 1% |

| Subagent | % of usage |
|----------|-----------|
| plan-execute | 14% |
| general-purpose | 3% |
| Explore | 2% |

### Delta since 9:47am entry (26 minutes)

- Session usage moved **30% → 36%** (+6 points) and cost **+$0.64** in ~26 minutes,
  with **zero new subagent spawns** — this stretch was a single-threaded driver
  session (USAGE.md update, then reading 3 source files and writing/validating one
  JSON artifact directly).
- Notably cheaper per-minute than the prior subagent-spawn window: ~0.23 points/min
  here vs. ~1.0 points/min during the rejected 4-agent QC batch — roughly **4x more
  efficient** when the orchestrator does the read-and-transform work itself instead
  of fanning out. Confirms the earlier finding: prefer direct tool use (Read/Write/
  Bash) over subagent spawns for tasks that are fundamentally single-threaded
  (file reads + structured transforms), reserving fan-out for genuinely parallel,
  independent work.
