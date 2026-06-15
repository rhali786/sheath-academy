# Test infrastructure fix — progress tracker

Plan: `C:\Users\rashe\.claude\plans\vast-wobbling-cookie.md` (approved 2026-06-14).
Branch for Part A: `fix/test-infrastructure-jest-integration` (off `dev`).

Read this file after a context clear to see what's done and what's next.

## Part 0 — CLAUDE.md "Testing gotchas" section
- [x] Section added to CLAUDE.md near Troubleshooting (commit fa57b7d, pushed to origin/dev)

## Part A — Jest integration fixes (plan-execute)
- [x] Branch `fix/test-infrastructure-jest-integration` created off `dev`
- [x] `docs/bug_enhancement/20260614-test-infra-jest-plan.json` written (6 phases incl. phase-4b)
- [x] Validated via validate-plan (PASS, 0 fail/0 warn)
- [x] phase-1 (sessionStorage/localStorage isolation) — complete (6018f69)
- [x] phase-2 (provider-wrapper fixes) — complete (8517c5a)
- [x] phase-3 (QuranPage/AttendancePage triage) — complete (948722d)
- [x] phase-4 (SubjectsAllTable naming) — complete (54cb0d8)
- [x] phase-4b (LessonsPage ?childId= seed + Lesson-added confirmation fix) — complete (21e3c06)
- [x] phase-5 (re-enable integration tests in npm test, GATED) — complete (80f560a)

Part A done: `npm test` now runs all 231 suites (212 run, 19 pre-existing DB-gated skips),
1738 tests pass, 0 failed. `npm run build` passes. Per-phase detail in
`docs/bug_enhancement/20260614-test-infra-jest-plan.progress.json`.

Remaining: open PR for `fix/test-infrastructure-jest-integration` → `dev` (not yet requested by user).

## Part B — E2E triage
- [ ] `docs/bug_enhancement/20260614-e2e-triage.md` written (22 spec files categorized)
- [ ] Stale `e2e/auth.spec.ts` `/` redirect test removed/updated
