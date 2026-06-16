# Test infrastructure fix — progress tracker

Plan: `C:\Users\rashe\.claude\plans\vast-wobbling-cookie.md` (approved 2026-06-14).
Branch for Part A: `fix/test-infrastructure-jest-integration` (off `dev`).

Read this file after a context clear to see what's done and what's next.

## Part 0 — CLAUDE.md "Testing gotchas" section
- [ ] Section added to CLAUDE.md near Troubleshooting

## Part A — Jest integration fixes (plan-execute)
- [ ] Branch `fix/test-infrastructure-jest-integration` created off `dev`
- [ ] `docs/bug_enhancement/20260614-test-infra-jest-plan.json` written
- [ ] Validated via `npm run plan:validate`
- [ ] phase-1 (sessionStorage/localStorage isolation) — not started
- [ ] phase-2 (provider-wrapper fixes) — not started
- [ ] phase-3 (QuranPage/AttendancePage triage) — not started
- [ ] phase-4 (SubjectsAllTable naming) — not started
- [ ] phase-5 (re-enable integration tests in npm test, GATED) — not started

Per-phase detail will live in `docs/bug_enhancement/20260614-test-infra-jest-plan.progress.json`
once `plan:execute` starts (same pattern as `ia-nav-followup-plan.progress.json`).

## Part B — E2E triage
- [ ] `docs/bug_enhancement/20260614-e2e-triage.md` written (22 spec files categorized)
- [ ] Stale `e2e/auth.spec.ts` `/` redirect test removed/updated
