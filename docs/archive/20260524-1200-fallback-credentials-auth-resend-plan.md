# Development Plan — Fallback Credentials Auth with Resend Recovery

Branch: `feature/authz-changes`

Status: Active

## Summary

Build a reliable fallback sign-up and login path for parents and teachers so Sheath Academy remains usable when Google OAuth or Magic Link email sign-in is unavailable. The active implementation should deliver sign-up, username/email + password login, forgot password, reset password, DB-backed password hashes, DB-backed reset tokens, basic username checks, seed updates, migration steps, and focused tests including Playwright.

This plan is organized as epics and waves. Epic A is what we are implementing now. Epic B prepares the next layer without overbuilding it. Epic C preserves the broader authorization roadmap so it is not forgotten, but it stays out of the current slice.

## Planning Mode

Mode 4 — New Feature, with a small Mode 5 architecture extension.

Reason: this adds a new auth capability, touches Auth.js/NextAuth, Drizzle/Postgres schema, Resend email delivery, auth UI, seed data, and Playwright flows. It must preserve existing Magic Link, OAuth, and dev bypass behavior.

## Current Code Path Audit

This plan follows `docs/planning-quality-rule.md`. Implementation should inspect only the auth, schema, env, seed, and test files needed for this slice. Do not broaden into dashboard, planner, Qur’an, attendance, or records unless an auth dependency points there.

### Auth dependencies and scripts

Rendering component: none.

Data provider/hook/context: Auth.js/NextAuth runtime and `next-auth/react`.

API route: Auth.js handlers plus any new signup/reset endpoints.

Server service/repository: `features/auth/auth.ts`, `features/auth/lib/drizzleAdapter.ts`, future auth repository/service files.

Store/seed/source: Drizzle/Postgres through `db/schema.ts`; seed scripts through `db:seed:demo` and `db:reset:demo`.

Current owner: Auth owns providers and sign-in. Household owns tenant/household creation.

Correct owner: Auth owns credential login, password hashing, password reset tokens, and auth email delivery. Household still owns household creation/linking.

Known findings: `package.json` already has `next-auth`, `resend`, `drizzle-orm`, `postgres`, `drizzle-kit`, DB migration scripts, and demo seed/reset scripts. Do not add a parallel auth library.

Existing tests: Login component tests exist.

Missing tests: credentials provider tests, sign-up tests, reset-token tests, forgot-password tests, schema/migration regression, and Playwright fallback-login flow.

### Auth.js / NextAuth configuration

Rendering component: none.

Data provider/hook/context: Auth.js callbacks and JWT session.

API route: Auth.js handlers exported by the auth feature.

Server service/repository: `features/auth/auth.ts`.

Store/seed/source: Auth.js adapter and JWT session.

Current owner: Auth.

Correct owner: Auth.

Known findings: the auth file already uses Resend, Google, Facebook, and a dev-only Credentials provider for bypass. It uses JWT sessions and adds tenant claims such as user ID, household ID, and timezone when tenant resolution succeeds. The dev bypass must remain separate from the production credentials provider.

Existing tests: Login tests mock `next-auth/react`.

Missing tests: provider registration behavior, production credentials login, and session claim behavior.

### Login UI

Rendering component: `features/auth/front/pages/Login.tsx`.

Data provider/hook/context: `signIn` and `getProviders` from `next-auth/react`.

API route: Auth.js sign-in endpoints.

Server service/repository: Auth providers in `features/auth/auth.ts`.

Store/seed/source: Auth.js provider state and JWT session.

Current owner: Auth.

Correct owner: Auth.

Known findings: Login currently centers Magic Link email sign-in, shows OAuth buttons when providers exist, and shows dev bypass in dev mode. Extend this card instead of replacing it.

Existing tests: Login tests cover brand, email input, magic link submission, provider button visibility, and dev bypass.

Missing tests: credentials login form, email-or-username label, password field, sign-up link, forgot-password link, generic credential error, and successful credential submission.

### Auth adapter and schema

Rendering component: none.

Data provider/hook/context: Auth.js Drizzle adapter.

API route: Auth.js callbacks.

Server service/repository: `features/auth/lib/drizzleAdapter.ts`.

Store/seed/source: `users`, `auth_accounts`, and `verification_tokens` tables.

Current owner: Auth owns adapter. Household repository is used for user/household creation.

Correct owner: Auth owns credential fields and reset tokens. Household owns household creation/linking.

Known findings: `users.email` is currently required and unique. That is fine for Epic A because parent/teacher signup requires email. Nullable email should be handled later for learner/no-email accounts.

Existing tests: exact adapter tests must be inspected before implementation.

Missing tests: adapter compatibility after user table additions, magic-link token regression, and user lookup by email still working.

### Resend and environment

Rendering component: none.

Data provider/hook/context: env vars read by Auth.js and future email wrapper.

API route: Magic Link provider and future forgot-password route.

Server service/repository: `features/auth/auth.ts`, future `features/auth/server/email.ts`.

Store/seed/source: `.env.example`, `.env.local`, hosting provider env.

Current owner: Auth.

Correct owner: Auth.

Known findings: `.env.example` already documents `AUTH_SECRET`, `AUTH_URL`, `RESEND_API_KEY`, `AUTH_EMAIL_FROM`, `DATABASE_URL`, dev bypass, admin email, and OAuth variables.

Existing tests: Login tests cover some Resend failure display.

Missing tests: mocked forgot-password email send, missing Resend config error handling, and no-real-email test guard.

## Epic Map

### Epic A — Implement Now: Parent/Teacher Fallback Credentials Auth

Deliver sign-up, username/email password login, forgot/reset password, migrations, seed updates, tests, and Playwright. This is the main current work.

### Epic B — Prepare Next: Account Model for Later Learner Login

Prepare the next layer in planning/design terms: household-scoped learner usernames, nullable email only where account type allows it, role field hardening, learner-user linkage, and stable session claims. Build only what Epic A truly needs now.

### Epic C — Future Authorization Expansion

Capture out-of-scope work as future waves: full learner dashboard, parent-managed password reset, must-change-password flow, role management UI, account invitations, complex rate limiting, and full Google/Magic Link redesign.

## Source of Truth

Postgres is the source of truth for credential users and reset tokens.

Auth owns password hashes, username normalization, credentials login, reset tokens, and Resend auth emails.

Household owns household creation, one-household-per-user ownership, and tenant resolution.

Auth must extend the existing `users` table and Auth.js adapter. Do not create a parallel user store.

## Resend Developer Setup Checklist

These are developer/operator steps that must happen outside code:

1. Confirm access to the Resend account.
2. Create a Resend API key.
3. Add `RESEND_API_KEY` to `.env.local` and the hosting provider environment.
4. Decide the sender address, such as `Sheath Academy <no-reply@yourdomain.com>`.
5. For production sending, add and verify the sender domain in Resend.
6. Add required DNS records for SPF and DKIM.
7. Add DMARC if the domain does not already have it.
8. Set `AUTH_EMAIL_FROM` to the verified sender.
9. Confirm `AUTH_URL` or `APP_BASE_URL` is set so reset links point to the correct app URL.
10. In local testing with Resend’s test sender, send only to the allowed Resend account email.
11. Confirm tests mock Resend and never send real emails.
12. Confirm reset links/tokens are never logged.

## Data Model and Contract Changes

### Epic A schema now

Extend `users`:

```txt
username text nullable initially
username_normalized text nullable unique for adult credential users
password_hash text nullable
password_updated_at timestamp nullable
created_via text nullable: magic_link | oauth | credentials | dev_bypass | seed
role text default compatible with current app values
```

Add reset tokens:

```txt
password_reset_tokens
id text primary key
user_id text not null references users(id) on delete cascade
token_hash text not null unique
expires_at timestamp not null
used_at timestamp nullable
created_at timestamp not null
```

Rules:

Parent/teacher credential-created users require email, username, password, and confirm password.

OAuth/Magic Link users may have no password hash until a future “set password” flow is added.

Reset tokens must be stored hashed, expire, and be single-use.

### Epic B preparation later

Future learner/no-email work should add or revise:

```txt
users.email nullable only where account_type allows it
users.account_type: adult | learner
users.role: admin | parent | teacher | learner
learners.user_id nullable unique references users(id)
unique(household_id, username_normalized) for learner accounts
```

Important constraint: if learner usernames are unique only within a household, a global login page cannot identify `adam` without a household code, invite link, school code, or parent-selected household context. Do not solve this in Epic A.

## API / Store / Service Plan

Expected files to add or update:

```txt
features/auth/auth.ts
features/auth/server/credentials.ts
features/auth/server/password.ts
features/auth/server/passwordResetTokens.ts
features/auth/server/email.ts
features/auth/server/repository.ts
features/auth/front/pages/Login.tsx
features/auth/front/pages/Signup.tsx
features/auth/front/pages/ForgotPassword.tsx
features/auth/front/pages/ResetPassword.tsx
app route files for signup, forgot-password, and reset-password using existing repo conventions
app/api/auth/register/route.ts if needed
app/api/auth/password/forgot/route.ts
app/api/auth/password/reset/route.ts
.env.example
db/schema.ts
migration files
seed scripts
```

Use existing route conventions. Do not invent a second app structure.

Production credentials provider:

```txt
provider id: credentials
field: identifier = Email or username
field: password
```

Login logic:

1. Normalize identifier.
2. Try email lookup when identifier looks like email.
3. Otherwise try username lookup.
4. Reject generically if not found.
5. Reject generically if password hash is missing.
6. Verify password.
7. Return Auth.js user.
8. Ensure session can include user ID, role, household ID, and timezone.

Signup logic:

1. Validate name, email, username, password, confirm password.
2. Normalize email and username.
3. Reject duplicate email.
4. Reject duplicate username.
5. Hash password.
6. Create user.
7. Create/link one household.
8. Redirect to login or sign in after success.

Forgot-password logic:

1. Accept email or username.
2. Always show generic success.
3. If account exists and has email, create hashed reset token.
4. Send reset link through Resend wrapper.
5. Never log token or reset URL.

Reset-password logic:

1. Accept raw token, new password, confirm password.
2. Hash token and find valid unused token.
3. Reject expired/used token.
4. Hash new password.
5. Update user password fields.
6. Mark token used.
7. Optionally invalidate other outstanding tokens for that user.

## UI Pattern Audit and UI Plan

### Login page

Reuse the existing centered auth card.

Add:

```txt
Email or username
Password
Sign in with password
Forgot password?
Create account
```

Keep:

```txt
Magic Link
Google/Facebook provider buttons when configured
Dev bypass when dev mode is enabled
```

Required accessibility:

- Labels for all inputs.
- Generic credential failure uses `role="alert"`.
- Password visibility toggle, if added, must have an accessible label.
- Mobile touch targets at least 44px.

### Signup page

Use the same centered auth card.

Fields:

```txt
Name
Email
Username
Password
Confirm password
```

Add link back to login.

### Forgot-password page

Use the same centered auth card.

Field:

```txt
Email or username
```

Always display:

```txt
If this account can receive email, a reset link has been sent.
```

### Reset-password page

Use the same centered auth card.

Fields:

```txt
New password
Confirm password
```

Invalid/expired token state links back to forgot password.

## Testing Plan

Use TDD. Add failing tests first per wave.

Unit tests:

```txt
normalizeEmail
normalizeUsername
validateSignupInput
hashPassword
verifyPassword
createResetToken stores only token_hash
reset token expiry
reset token single-use behavior
forgot-password generic response behavior
```

API/service tests:

```txt
signup creates user, password hash, and household
signup rejects duplicate email
signup rejects duplicate username
login works with email
login works with username
login fails generically with wrong password
login fails generically with unknown identifier
forgot password returns generic success for known user
forgot password returns generic success for unknown user
forgot password sends mocked Resend email for email-backed user
reset password updates hash and marks token used
used reset token cannot be reused
expired reset token fails
```

Integration tests:

```txt
Login renders credential form and Magic Link option
Login credential submit calls credentials provider
Signup renders required fields and validation
Forgot password renders generic confirmation
Reset password handles invalid token and successful reset
```

Playwright:

```txt
e2e/auth-fallback-credentials.spec.ts
```

Flow:

1. Open `/signup`.
2. Create parent/teacher account with email, username, and password.
3. Confirm app shell or login success path.
4. Sign out.
5. Sign in with email and password.
6. Sign out.
7. Sign in with username and password.
8. Request forgot password.
9. Use test helper or DB lookup to retrieve a test reset token safely.
10. Reset password.
11. Confirm old password fails.
12. Confirm new password works.

Do not send real Resend email in tests.

## Build Waves

### Epic A — Current Implementation

#### Wave A1 — Focused audit and contract confirmation

Confirm Auth.js route wiring, current session claims, DB migration state, existing tests, and Playwright setup.

Deliverable: no behavior change; implementation notes in PR or commit summary.

#### Wave A2 — Credential schema and migration

Add credential fields to users, add reset-token table, generate migration, update schema exports/types, and update seed data.

Developer commands:

```txt
npm run db:generate
npm run db:migrate
npm run db:reset:demo if seed data changes require it
```

Acceptance: migration applies, Magic Link/OAuth adapter still works, demo seed still runs.

#### Wave A3 — Password and reset-token services

Add password hashing/verification, reset token creation/use, and auth repository functions.

Acceptance: passwords and reset tokens are never stored plain; used/expired tokens fail.

#### Wave A4 — Signup page and service

Add `/signup`, sign-up service/route, user creation, household creation/linking, and password hashing.

Acceptance: parent/teacher can sign up; duplicate email/username blocked; household exists.

#### Wave A5 — Credentials login

Add production credentials provider, update login page, keep Magic Link/OAuth/dev bypass intact, and ensure session claims remain stable.

Acceptance: email login works, username login works, wrong password fails generically, existing sign-in methods remain available.

#### Wave A6 — Resend forgot/reset password

Add forgot-password page, reset-password page, Resend email wrapper, reset-token handling, tests with mocked email, and `.env.example` updates if needed.

Developer steps: confirm `RESEND_API_KEY`, `AUTH_EMAIL_FROM`, and verified domain/DNS where needed.

Acceptance: generic forgot-password confirmation; reset email for email-backed user; reset link works once; old password fails; new password works.

#### Wave A7 — Tests, Playwright, and regression

Finish unit, API/service, integration, and Playwright tests.

Required commands:

```txt
npm test
npm run build
npm run test:e2e -- auth-fallback-credentials or equivalent targeted command
```

Acceptance: tests pass, build passes, fallback auth Playwright passes.

### Epic B — Near-Future Preparation

#### Wave B1 — Household-scoped learner username design

Decide household code/invite URL strategy. Add learner-user linkage only when learner login is actually implemented.

#### Wave B2 — Nullable email by account type

Allow nullable email only for account types that support it, likely learner/no-email accounts. Keep parent/teacher email required unless product decision changes.

#### Wave B3 — Role and authorization claims

Normalize roles: admin, parent, teacher, learner. Add server-side route/API authorization helpers. Ensure session includes user ID, role, household ID, and optional learner ID.

### Epic C — Deferred Authorization Expansion

#### Wave C1 — Full learner dashboard

Build restricted learner experience after learner auth exists.

#### Wave C2 — Parent-managed learner password reset

Parent resets learner/no-email passwords without email recovery.

#### Wave C3 — Must-change-password flow

Add forced password change after temporary/generated passwords.

#### Wave C4 — Role management UI

Allow safe management of adult, teacher, and learner roles.

#### Wave C5 — Account invitations

Add email invite flow with setup tokens and household membership.

#### Wave C6 — Complex rate limiting/security hardening

Add per-IP/per-identifier throttling, login audit events, and abuse monitoring.

#### Wave C7 — Full Google/Magic Link redesign

Unify provider choice, account linking, provider recovery, and clearer setup copy.

## Acceptance Criteria for Epic A

1. `/signup` exists.
2. Parent/teacher can sign up with name, email, username, password, and confirm password.
3. Signup creates or links a household.
4. `/login` supports email-or-username + password.
5. `/login` still supports Magic Link and configured OAuth providers.
6. Dev bypass still works only when dev env vars are set.
7. User can log in with email + password.
8. Same user can log in with username + password.
9. Wrong credentials show a generic error.
10. `/forgot-password` exists.
11. Forgot password always returns generic confirmation.
12. Forgot password sends Resend reset email for an email-backed user.
13. `/reset-password` changes password with a valid unused token.
14. Used/expired reset tokens fail.
15. Old password fails after reset.
16. New password works after reset.
17. Passwords are hashed.
18. Reset tokens are hashed.
19. Seed data and demo reset scripts still work.
20. `npm test` passes.
21. `npm run build` passes.
22. Targeted Playwright fallback auth test passes.

## Out of Scope for Epic A

Not building now:

- Full learner dashboard.
- Parent-managed learner password reset.
- Must-change-password flow.
- Role management UI.
- Account invitations.
- Complex rate limiting.
- Full Google/Magic Link redesign.
- No-email learner login.
- Household-code login.
- Adult no-email accounts.
- Account linking across providers.

## Manual QA Plan

1. Start local DB and app.
2. Run migrations.
3. Run demo seed/reset if needed.
4. Open `/login`.
5. Confirm Magic Link UI still appears.
6. Confirm credential login fields appear.
7. Confirm Google/Facebook buttons appear only when configured.
8. Open `/signup`.
9. Submit empty form and confirm validation.
10. Create account with name, email, username, and password.
11. Confirm account reaches app or login success path.
12. Sign out.
13. Log in with email and password.
14. Sign out.
15. Log in with username and password.
16. Try wrong password and confirm generic error.
17. Open `/forgot-password`.
18. Submit email or username.
19. Confirm generic success message.
20. In test/local mode, retrieve reset link through mock/test helper.
21. Open reset link.
22. Set new password.
23. Try old password and confirm it fails.
24. Try new password and confirm it works.
25. Confirm Magic Link still sends when Resend is configured.
26. Confirm build passes.

## Branch and Commit Plan

Branch:

```txt
feature/authz-changes
```

Recommended commits:

```txt
docs(plan): add fallback credentials auth resend plan
test(auth): cover credential signup and login contracts
feat(auth): add credential fields and reset token schema
feat(auth): add password hashing and reset token services
feat(auth): add parent teacher signup flow
feat(auth): add email or username credentials login
feat(auth): add resend forgot password reset flow
test(auth): add fallback auth playwright coverage
chore(seed): update demo user credentials
chore(auth): document resend setup and env requirements
```

## Risks and Rollback

Risk: Magic Link or OAuth breaks while adding credentials.

Mitigation: keep providers separate and add regression tests for existing provider visibility and sign-in calls.

Rollback: revert credentials provider/login UI commit. Preserve schema if already deployed, or add a cleanup migration only if safe.

Risk: Resend email fails because domain/API setup is incomplete.

Mitigation: document setup steps, mock tests, clear env errors, and use the Resend test sender only within its limits.

Rollback: disable forgot-password email send path behind env check while keeping credential login working.

Risk: username uniqueness conflicts with future household-scoped learner usernames.

Mitigation: keep Epic A adult-account username behavior simple and defer learner login context to Epic B.

Rollback: add account-type-specific uniqueness later.

Risk: passwords or reset tokens leak.

Mitigation: never log raw passwords, tokens, or reset URLs. Tests should assert hash storage.

Rollback: rotate secrets and invalidate outstanding reset tokens if leakage is detected.

Risk: seed data gets out of sync.

Mitigation: update seed script with schema/service changes and run demo reset locally.

Rollback: restore prior seed script and keep credential fields nullable until fixed.

## Final Plan Quality Checklist

- Planning mode is stated.
- Affected auth/login/schema/env code paths are audited.
- Source of truth is identified.
- Existing Auth.js/NextAuth setup is extended, not replaced.
- Resend developer steps are explicit.
- UI pattern audit covers login, signup, forgot-password, and reset-password pages.
- Acceptance criteria are observable.
- Failing tests are listed by type.
- Waves are ordered by dependency.
- Future/out-of-scope work is preserved as Epic B and Epic C.
- Manual QA is click-by-click.
- Branch and commit plan are behavior-oriented.
