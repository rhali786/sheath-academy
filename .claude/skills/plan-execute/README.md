# Plan execute — portable skill bundle

Copy this entire folder to another project's `.claude/skills/plan-execute/` to get phased plan execution with hard sequential enforcement.

## Host project wiring

1. Add an npm script:

   ```json
   "plan:execute": "tsx .claude/skills/plan-execute/run-execute.ts"
   ```

2. Requires the `claude` CLI and `tsx` (or compile the TypeScript entry point).

3. Edit `invariants.config.json` for your stack:
   - Sheath / Drizzle: `{ "checkers": ["drizzle-migrations"] }`
   - No migrations: `{ "checkers": [] }` (phases with schema scope will fail until you add a checker)

4. Add custom invariant modules as `invariants.<stack>.ts` and register checkers with `registerInvariantChecker()`. Import them from `run-execute.ts`.

## Files

| File | Purpose |
|---|---|
| `SKILL.md` | Agent contract (orchestrator + worker roles) |
| `run-execute.ts` | Sequential runner loop |
| `plan-execute-models.ts` | `cheap` / `standard` / `strong` model routing |
| `invariants.ts` | Checker registry + `progress.json` path helpers |
| `invariants.drizzle.ts` | Drizzle migration journal contiguity checker |
| `invariants.config.json` | Which checkers run after schema/migration phases |
| `claude-integration.ts` | Claude CLI spawn wrapper |
| `paths.ts` | Resolves paths relative to this skill folder |

## Usage

```bash
npm run plan:execute -- --plan docs/my-plan.json
npm run plan:execute -- --plan docs/my-plan.json --resume
npm run plan:execute -- --plan docs/my-plan.json --skip-gates
```

Plan JSON format: see `plan-builder` skill §4a.
