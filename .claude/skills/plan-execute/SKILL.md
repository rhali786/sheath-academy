---
name: plan-execute
description: Use to execute a phased implementation plan (produced by the plan-builder skill) through isolated, context-free agents — one fresh agent per phase, coordinating state through a progress.json file rather than shared conversation context. Runs autonomously but pauses at phases the plan marks as gated. Use when the user says "execute the plan", "run the plan", or "kick off <plan>.md".
---

# Plan execute

Execute a phased plan so that each phase runs in a **fresh agent with no inherited context**, and the orchestrator (you) never absorbs the child agents' working context. State passes between phases through a `progress.json` file on disk — never through conversation memory.

This keeps the **orchestrator's** context flat — it costs ~one line per phase, not the thousands of tokens each phase consumes. It does **not** make total token usage flat: total cost is the sum of all workers. The real wins are (a) avoiding the context-reprocessing that bloats a single long session — which pays off on large, well-partitioned plans (~4+ substantive phases) and can cost *more* on tiny ones — and (b) per-phase model routing (see below), the larger quota lever.

For a **hard guarantee** of these mechanics rather than a followed instruction, drive execution from the code runner: `npm run plan:execute -- --plan <plan>.json`. The runner (`run-execute.ts` in this skill folder) enforces sequential execution, model routing, gate pauses, and the cross-phase invariant checks structurally — a loop cannot decide to parallelize. This skill describes the same contract for when you orchestrate by hand.

There are two roles in this skill. Read the one that applies to you.

- **Orchestrator** — the parent agent the user talks to. Reads the plan, manages `progress.json`, spawns one worker per phase, honors checkpoints. Holds almost no context.
- **Worker** — a freshly spawned agent that executes exactly one phase and returns a single line. Holds the phase's full working context, then is discarded.

---

## How context isolation actually works

When the orchestrator spawns a worker via the `Agent` tool:

- The worker receives **only the prompt string the orchestrator writes** — none of the orchestrator's conversation, none of any previous worker's context.
- The worker returns **only its final message** to the orchestrator — none of its file reads, edits, or reasoning.

So isolation is the default. The one thing that must be added is the **handoff channel**: because workers cannot pass memory, they pass state through files:

```
<plan>.md            the work orders — read-only during execution
<plan>.progress.json the shared state — which phases are done, what each produced
```

A worker reads `progress.json` to learn what earlier phases built (its preconditions), does its phase, writes its result back, and returns `DONE`.

---

## progress.json schema

The orchestrator owns creation; workers update their own phase entry only.

```json
{
  "plan": "docs/<plan-name>.md",
  "createdAt": "<ISO8601>",
  "updatedAt": "<ISO8601>",
  "branch": "<branch the plan specified>",
  "phases": [
    {
      "id": "phase-1",
      "title": "<short title from the plan>",
      "gated": false,
      "status": "pending",
      "model": null,
      "startedAt": null,
      "completedAt": null,
      "outputs": {
        "filesChanged": [],
        "testsRun": [],
        "notes": "<what the NEXT phase needs to know — exports created, IDs, decisions>"
      },
      "failureReason": null
    }
  ]
}
```

- `status`: `pending` → `in_progress` → `complete` | `failed`.
- `gated`: copied from the plan. A gated phase pauses the orchestrator **before** it runs (see Checkpoints).
- `model`: the resolved model the worker ran on. The orchestrator sets this from the phase's declared `modelTier`/`model` (see Model routing). Recorded for auditability.
- `outputs.notes`: the most important field. It is how a context-free next worker learns what happened. Write it for a reader who has never seen the prior phase.

---

## Orchestrator contract

1. **Locate the plan.** Confirm the plan file exists and contains a phase list with the work-order shape (id, preconditions, file scope, tests, done-when, write-back). If the plan is narrative prose without self-contained phases, stop and tell the user it must be re-planned with the `plan-builder` skill before it can be executed.

2. **Initialize or resume.**
   - If `<plan>.progress.json` does not exist, create it with every phase `pending`, copying each phase's `gated` flag from the plan.
   - If it exists, resume: find the first phase whose status is not `complete`. Re-run any phase left `in_progress` or `failed` from scratch.

3. **Run phases in order — strictly one at a time.** For each phase from the resume point:
   - **Checkpoint check:** if the phase is `gated`, stop. Report: `Phase <id> (<title>) is a checkpoint. <one line on why>. Review <plan>.progress.json and the diff so far. Reply to continue.` Do not spawn the worker until the user approves. (Once approved, treat it as ungated for this run and proceed.)
   - **Resolve the model** for this phase (see Model routing) and set it on the phase's `progress.json` entry.
   - **Spawn exactly one fresh worker** with the `Agent` tool. The prompt must be minimal and self-contained — see the template below. Do **not** restate the plan contents; point the worker at the files.
   - **Trust the file, not the reply.** When the worker returns, read `<plan>.progress.json` to confirm the phase is `complete`. The returned `DONE`/`FAILED` line is a signal; the file is the source of truth.
   - **Run the cross-phase invariant check** (see Invariants) if this phase touched schema, migrations, or a shared contract. If the invariant fails, set the phase `failed` with the reason and stop — a green unit test does not prove the migration set is contiguous and applied.
   - **On failure:** if the phase status is `failed` (or the worker returned `FAILED:`), stop the run. Report the phase id and `failureReason` from the file. Do not proceed to later phases.

   **Sequential execution is mandatory.** Spawn exactly one worker per turn, in the **foreground**, and wait for it to return before doing anything else. Never place two worker spawns in the same message; never run a worker in the background. This is a **correctness** constraint, not a style preference: `progress.json` is a single shared file, so two concurrent workers race on it and the second write clobbers the first, corrupting the handoff channel. The blocking, one-per-turn `Agent` call is what serializes them when you orchestrate by hand; the `plan:execute` runner enforces the same thing with a loop that cannot parallelize.

### Model routing

Each phase declares an optional `modelTier` (`cheap` | `standard` | `strong`) or an explicit `model`. Resolve it and run the worker on that model — match each phase to the cheapest model that can do it:

- **`cheap`** — mechanical, scoped phases: copy/label changes, CSS, a rename within one file.
- **`standard`** — ordinary feature/store/API/integration work (default).
- **`strong`** — `db/schema.ts`, migrations, shared contracts, cross-feature changes, anything gated.

An explicit `model` on the phase overrides the tier. A phase that needs no repository context (pure ideation/analysis) can be routed to a different provider entirely. Defaults and env overrides (`PLAN_EXECUTE_MODEL_*`) live in `plan-execute-models.ts` alongside this skill.

### Invariants

Artifacts carry what a phase *says* it did; they do not carry global truth. After any phase that touched `db/schema.ts` or a migration, verify before marking it done:

- `npm run db:generate` produces **no new migration** (schema and migrations agree), and
- `npm run db:migrate` applies cleanly with **no gap** in the migration sequence.

Record the migration number/range the phase touched in `outputs.notes` so the next cold worker can confirm nothing was skipped. (This is the class of failure where migration 16 lands but 9–10 silently never did.)

4. **Finish.** When all phases are `complete`, report a short summary read from `progress.json`: phases completed, files changed, tests run, and the branch. Then surface the plan's own follow-up steps (PR creation, manual QA) if they are not themselves phases.

**The orchestrator never reads the source files being changed, never runs the tests itself, and never inspects a worker's reasoning.** It reads only the plan and `progress.json`. This is what keeps its context small.

### Worker spawn prompt template

```
Execute phase <id> of the plan at <plan-path>.
Progress file: <progress-path>.
Follow the plan-execute worker contract (the plan-execute skill).
Return only one line: DONE or FAILED:<reason>.
```

---

## Worker contract

You have been spawned to execute **exactly one phase**. You have no memory of any prior phase. Everything you need is in the two files named in your prompt.

1. **Read the plan** at the given path. Find your phase by its `id`. Read its preconditions, file scope, tests, implementation steps, done-when criteria, and write-back instructions.

2. **Read `progress.json`.** Confirm your preconditions hold by inspecting earlier phases' `outputs` (especially `notes`). If a precondition is not met — an expected file or export from a prior phase is missing — set your phase to `failed` with a clear `failureReason` and return `FAILED:<reason>`. Do not try to redo a prior phase.

3. **Mark `in_progress`** in `progress.json` (set `startedAt`).

4. **Do the work, in the plan's order:**
   - Write the named failing tests first (TDD — see the `testing-patterns` skill).
   - Implement only within the phase's declared file scope. Do not touch files outside it; if you believe you must, stop and fail with that reason rather than widening scope silently.
   - Run the phase's done-when commands (`npm test -- <path>`, `npm run build`, etc.). They must pass.
   - If you touched `db/schema.ts` or a migration, run the invariant check (`npm run db:generate` must produce no new migration; `npm run db:migrate` must apply cleanly). If it fails, fail the phase — do not mark it complete.

5. **Commit your phase.** Once `doneWhen` passes (and the invariant check, if applicable), commit on the current branch before writing back:
   ```
   git add -A
   git commit -m "<type>(<plan-id>): phase <id> — <short title>"
   ```
   This guarantees frequent, per-phase commits and a non-empty branch — the runner and orchestrator never commit for you. Never use `--no-verify` (the pre-commit hook bumps the version). Do **not** `git push` or open a PR — that is the orchestrator's job at plan completion. If the working tree is unexpectedly clean (no changes to commit), record that in `notes`; do not create an empty commit.

6. **Write back.** Update your phase entry: `status: complete`, `completedAt`, and fill `outputs` — `filesChanged`, `testsRun`, and a `notes` line written for a stranger who will execute the next phase with zero context. If you ran a migration, record its number/range in `notes`. Update the top-level `updatedAt`.

7. **Return one line only:** `DONE` or `FAILED:<short reason>`. Never return file contents, diffs, or reasoning — that defeats the isolation. The orchestrator reads `progress.json`, not your message.

### Worker hard rules

- Stay inside the phase's file scope.
- Commit your phase changes once `doneWhen` passes (step 5). Never skip pre-commit hooks or `--no-verify`.
- Never `git push` or create a PR unless the phase explicitly says so.
- Follow `CLAUDE.md`, `testing-patterns`, and `architecture-rules`.
- If tests fail and you cannot fix them within scope, fail the phase — do not leave it half-done and report success.

---

## Failure & resume

Because all state lives in `progress.json`, a run can be interrupted (quota, crash, gate) and resumed later. Re-invoking the orchestrator on the same plan picks up at the first non-`complete` phase. A `failed` phase is re-run from scratch — workers must therefore be safe to re-enter (write idempotent changes where possible; the failing-test-first flow makes re-runs detectable).
