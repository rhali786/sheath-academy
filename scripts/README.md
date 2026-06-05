# scripts/

Utility scripts for the Sheath Academy feedback steward and dev tooling.

## Feedback steward entry points

Run these via `npm run steward:*` (see `package.json`). Do not call the underlying `.ts` files directly in normal operation — use the npm aliases.

All steward scripts live under `feedback-steward/`. Tests are under `feedback-steward/__tests__/`.

| npm script | File | Purpose |
|---|---|---|
| `steward:preflight` | `feedback-steward/steward-preflight.ts` | Check DB connectivity + Claude CLI auth before any mutating run |
| `steward:daily` | `feedback-steward/run-daily.ts` | Classify submitted feedback, check eligibility, generate a plan artifact. Use `--plan-only` to stop before executing. |
| `steward:execute` | `feedback-steward/run-execute.ts` | Execute a saved plan artifact: write tests, implement, create PR. Pass `--artifact <path>`. |
| `steward:rollback` | `feedback-steward/run-rollback.ts` | Close an unmerged PR and reset attached feedback rows to `classified`. Pass `--pr <number>`. |
| `steward:ship` | `feedback-steward/run-ship.ts` | Mark feedback rows and changelog as shipped after a PR merges. Pass `--pr <number> --version <x.y.z>`. |
| `steward:notify` | `feedback-steward/feedback-notify.ts` | Write a JSON notification summary of rows shipped in the last N hours. |

## Steward helper scripts

Called internally by the entry points or used for debugging in isolation.

| File | Purpose |
|---|---|
| `feedback-steward/run-classify.ts` | Classify a batch of submitted rows via Claude. Called automatically by `steward:daily`. |
| `feedback-steward/feedback-requeue.ts` | Query submitted rows eligible for classification. Pipe output into `run-classify.ts` for debugging. |
| `feedback-steward/feedback-dedupe.ts` | Duplicate-detection logic used during classification. |
| `feedback-steward/claude-integration.ts` | Low-level Claude CLI invocation wrapper used by all steward scripts. |
| `feedback-steward/claude-preflight.ts` | Claude-specific preflight (session limit, auth). Called by `steward:preflight`. |
| `feedback-steward/claude-runner.ts` | Shell runner used by `claude-integration.ts`. |

## Steward model selection

Claude model IDs are defined in `feedback-steward/steward-models.ts` and can be overridden at runtime via environment variables in `.env.local`.

| Env var | Default | Used by |
|---|---|---|
| `STEWARD_MODEL_CLASSIFY` | `claude-haiku-4-5-20251001` | Classification + preflight — high-volume, schema-constrained |
| `STEWARD_MODEL_PLAN` | `claude-opus-4-5` | Daily plan generation — once/day, highest leverage, everything downstream depends on it |
| `STEWARD_MODEL_EXECUTE` | `claude-sonnet-4-5` | Plan execution — guardrailed by `allowedFiles`; more mechanical when plans are accurate |

Example override in `.env.local`:

```
STEWARD_MODEL_PLAN=claude-opus-4-5-20251101
```

## Steward config

`feedback-steward/do-not-automate.json` — blocklist that prevents the steward from automating certain feedback categories. Edit this file to block additional `featureAreas` or `feedbackTypes`.

```json
{ "featureAreas": ["auth"], "feedbackTypes": [] }
```

## Dev / build tooling

| File | Purpose |
|---|---|
| `bump-version.cjs` | Increments patch version in `package.json`. Called by the pre-commit hook. |
| `setup-hooks.js` / `setup-hooks.sh` | Installs `scripts/hooks/pre-commit` into `.git/hooks/`. Run via `npm run setup-hooks`. |
| `clean-next.mjs` | Deletes `.next/` to fix stale build artifacts. |
| `smoke.cjs` | Post-build smoke test: hits `/api/health` and checks static assets. |
| `check-db-seed.ts` | Verifies the database has been seeded before running. |
| `test-db-connection.mjs` | One-shot DB connectivity check. |
| `create-feature-folders.mjs` | Scaffolds a new feature directory structure. |
| `seed-demo-households.ts` | Bulk seeds demo households. Called by `npm run db:seed:demo`. |

## Full operator runbook

See `features/feedback/README.md` for the end-to-end staged test plan (submission → classification → plan → execute → ship → notify).
