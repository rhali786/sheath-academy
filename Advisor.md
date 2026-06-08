# Advisor notes — what made the Step 6 batch-conductor prompt work

Captured after running it live (PR #24 merge detour, stash forensics, gate
approval, plan #1 in flight). Not about the code — about the prompt design and
collaboration patterns that made this go smoothly. Worth reusing for the next
"drive a long autonomous process" task.

## The original prompt (for reference)

```
STEP 6 — Track 2 batch conductor (subprocess driver)

You are the BATCH CONDUCTOR. You do NOT implement features. You drive
`npm run plan:execute` as a BLOCKING subprocess, one plan at a time, in order,
committing frequently and opening one PR per plan against dev.

RUN MODE: interactive claude only (NOT `claude -p`). Gates and dependency
pauses require my typed approval. Repo root is the cwd for every command.

Read once: .claude/skills/plan-execute/SKILL.md, CLAUDE.md (obligatory rules).
NOTE: the plan:execute runner now spawns workers with --permission-mode acceptEdits,
so worker phases can edit files headlessly. You (conductor) own git + PRs only.

[... full manifest, hard rules, git prep, merge dependencies, outer loop,
resume-after-crash, DB safety, and reporting sections — see chat history for
the complete text ...]
```

## Why this prompt worked

**1. State lived on disk, never in my head.**
The manifest (`step6-batch.progress.json`) + each plan's `progress.json` meant
I never had to *remember* where the batch was — I could always re-derive it by
reading two files. When the session detoured hard (discovering the tooling
didn't exist on `dev`, merging PR #24, recreating the branch from scratch), the
batch survived because nothing important lived only in conversation memory.
**Lesson: for any multi-hour/multi-session process, design the state to be
re-derivable from disk, not carried in context.**

**2. "Never X unless I say so" beats "use good judgment."**
`Never use --skip-gates unless I say so`, `Never -B on resume`,
`Never two in parallel`, `Never restart a completed plan unless I say "restart
plan N"` — each of these is a crisp tripwire, not a vibe. They told me exactly
when to stop and ask, which meant I asked at the moments that actually
mattered (the gate, the dirty tree, the missing tooling) instead of either
asking about everything or barreling through everything.
**Lesson: enumerate the specific irreversible/high-blast-radius actions by
name and ban them by default. Vague caution produces either too much
friction or too little.**

**3. STOP conditions were phrased as checkable predicates, not feelings.**
`If git status --porcelain is non-empty AND it belongs to a different
plan/branch: STOP and report` is something I can mechanically evaluate. It's
what caught the dirty working tree at the very first step, before any
git operation could compound the mess. Compare to "be careful with the working
tree" — that would have left the call to my judgment under time pressure.
**Lesson: write STOP conditions as `if <observable> then <action>`, not as
general cautions. Observable conditions get checked; cautions get
rationalized away mid-task.**

**4. Built-in self-verification steps caught real problems.**
`VERIFY BRANCH before running anything` — comparing `git branch --show-current`
against the manifest — wasn't a formality. It would have caught (and later did
inform how I handled) the case where a branch was cut from a stale `dev`. The
prompt didn't just say "create the branch correctly"; it said "and then check
that you did."
**Lesson: for any step where being wrong is expensive, pair the action with an
explicit verification of its own outcome — don't trust that the action
succeeded as intended.**

**5. The prompt assumed interruption, not a clean single run.**
Idempotent PR creation (`gh pr list` before `gh pr create`), the `--resume`
contract, "RESUME AFTER CRASH / NEW SESSION" as its own section, "never
restart a completed plan" — all of this assumes the process *will* be
interrupted (quota, crash, gate, a detour like ours) and designs for clean
resumption rather than hoping for an unbroken run.
**Lesson: for long processes, design the resume path first. Assume the happy
path is the exception, not the rule.**

**6. My role was scoped on purpose, and that scoping paid off.**
"You do NOT implement features... you own git + PRs only" kept me from
drifting into code review or implementation mid-batch when phase-2 was
running long. I could stay focused on orchestration hygiene (commits, branch
state, PR bodies) instead of getting pulled into the worker's job.
**Lesson: for orchestrator/conductor roles, explicitly exclude the adjacent
job. The temptation to "just peek at the code" is real and it derails the
orchestration job.**

**7. Known hazards were named in advance, before I'd hit them.**
The `MERGE DEPENDENCIES` and `DB SAFETY` sections told me — *before* I got
there — which plan numbers had ordering hazards and which ones touch shared
infrastructure (`DATABASE_URL`). That meant when I eventually reach plan #4 or
#6, I'll already be primed to pause rather than discover the hazard live and
have to reason about it under pressure.
**Lesson: if you already know where the landmines are, mark them on the map.
Don't make the agent discover them by stepping on them.**

**8. The prompt treated the session's context budget as a real constraint.**
"Remind me to check session % before continuing... if I'm past ~70%, STOP" —
this is the prompt author acknowledging that the conversation itself is a
finite resource and building a checkpoint into the workflow, not just the
git/CI workflow.
**Lesson: for long-running interactive sessions, put budget checkpoints in the
plan itself — don't assume the agent (or the user) will remember to look.**

## What came up in practice that validated the design

- **The dirty-tree STOP fired immediately** and correctly separated "my batch
  work" from "in-flight Track 1 work" — grouping the resulting commits by
  logical concern (tooling / steward / docs / diagnostic script) rather than
  one mega-commit made the history reviewable afterward.
- **Branch verification + git prep surfaced a real blocker** (the
  `plan:execute` runner didn't exist on `dev` yet — it was sitting uncommitted
  on a feature branch) *before* any of the 9 batch branches were built on a
  foundation that couldn't run. Cheap to catch early, expensive to discover on
  branch #5.
- **"Dig in and bring back what's necessary" (rather than "just pop the
  stash") was the right framing** for ambiguous recovered state — it let the
  investigation conclude "this WIP was abandoned because it didn't compile,
  and here's the proof" instead of either blindly restoring broken code or
  blindly discarding possibly-valuable work.
- **The gate-approval moment showed the value of reading the actual plan
  before reaching for the dangerous flag.** `--skip-gates` disables *all*
  gates for a run — but checking the plan JSON showed phase-1 was the *only*
  gated phase, which turned "should I use the nuclear option" into "this
  specific flag, in this specific plan, does exactly the scoped thing you'd
  want." Same flag, completely different risk profile depending on what's
  actually in the file.

## One transferable principle, if I had to pick just one

**Write the STOP conditions as code, not as culture.** Telling an agent to
"be careful" produces inconsistent caution. Telling it "if `<this observable
thing>` is true, stop and report — never auto-resolve it" produces consistent,
predictable pauses exactly where the human needs to be in the loop, and
confident autonomy everywhere else. That's the difference between a prompt
that *describes* good judgment and one that *manufactures* it.
