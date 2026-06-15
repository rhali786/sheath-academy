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
- [x] `docs/bug_enhancement/20260614-e2e-triage.md` written (all 24 spec files categorized;
      raw working notes in `20260614-e2e-triage-notes.md`)
- [x] Stale `e2e/auth.spec.ts` `/` redirect test removed/updated
- [x] Stale `e2e/auth-isolation.spec.ts` `/` redirect test removed/updated (same root cause)
- Branch: `docs/e2e-triage-b1` (off `dev`, separate from Part A's
  `fix/test-infrastructure-jest-integration`)
- Result: 63 of 138 tests fail across 24 spec files (down from 81/135 after the two fixes
  above). Headline root cause: `/` is now a public landing page, dashboard moved to
  `/dashboard` — accounts for ~28 failures. Second-largest: `selectOption({label: regex})`
  Playwright API misuse (~14 failures). B2+ (separate future plan) will fix these.
