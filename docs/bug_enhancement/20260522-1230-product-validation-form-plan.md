# Development Plan — Product Validation Forms

Branch: `claude/feedback-yIxhs`

Status: Planned

## 1. Summary

Create a product validation form for Sheath Academy based on the Fork Test Framework. The form will collect structured post-use feedback about previous pain, benefit, friction, trust, retention, willingness to pay, referral likelihood, and positioning clarity. It will include 1–5 score questions and open-text questions, store responses in the database, link from the About page, and summarize results in the admin area so product decisions are based on actual use rather than compliments.

The form should use the visual and interaction feel of the provided German Method application form reference: a focused multi-step flow, progress bar, centered card, large section headings, clean controls, Back/Continue navigation, and mobile-friendly spacing. Do not embed an external form product unless explicitly approved. Build the form inside Sheath Academy so responses can be tied to authenticated users, tenants, and admin review.

## 2. Planning Mode

Mode 4 — New Feature, with Mode 3 cross-feature integration.

Reason: this introduces a new product-validation feature with data model, API, front-end form, About-page link, admin review UI, score calculations, and Playwright coverage. It also integrates with future admin metrics and authentication/user ownership work.

## 3. Current Code Path Audit

### About page link surface

- Rendering component: `features/about/front/pages/About.tsx`.
- Data provider/hook/context: none; static content with `next/link`.
- API route called: none.
- Server service/repository: none.
- Store/seed/source currently used: static arrays for pains, Wave 1 summary, and changelog.
- Current owner: About feature owns public product narrative and footer links.
- Correct owner: About should only link to the product validation form; the validation feature should own the form, responses, scoring, and admin summary.
- Existing tests: must inspect `features/about/__tests__` before implementation.
- Missing tests: integration test proving the About page exposes a clear link to the validation form.

### Product validation form

- Rendering component: does not exist yet.
- Data provider/hook/context: does not exist yet.
- API route called: does not exist yet.
- Server service/repository: does not exist yet.
- Store/seed/source currently used: none.
- Current owner: none.
- Correct owner: new `features/product-validation/` feature.
- Existing tests: none.
- Missing tests: unit tests for scoring, API tests for response creation/listing/summary, integration tests for the multi-step form, and Playwright tests for the full submission path.

### Admin review UI

- Rendering component: no confirmed admin metrics page exists in the repo search results.
- Data provider/hook/context: none confirmed.
- API route called: none confirmed.
- Server service/repository: none confirmed.
- Store/seed/source currently used: none confirmed.
- Current owner: absent or not yet implemented.
- Correct owner: admin feature should own admin-only review surfaces; product-validation feature should expose summary/read APIs that admin UI consumes.
- Existing tests: none confirmed.
- Missing tests: admin-only access tests, summary rendering tests, filter/sort tests, and unauthorized access tests once auth roles are implemented.

### Authentication and ownership dependency

- Rendering component: login already exists in `features/auth/front/pages/Login.tsx`.
- API route: auth is handled by `app/api/auth/[...nextauth]/route.ts`.
- Server service/repository: `features/auth/auth.ts`.
- Store/seed/source currently used: current auth adapter is memory-backed; a separate auth/user ownership plan exists for durable users, roles, tenant ownership, and API authorization.
- Current owner: Auth owns session/login.
- Correct owner: product validation responses should eventually store `userId`, `tenantId`, and role context when a signed-in user submits the form. Anonymous/public submissions should be explicitly allowed or disallowed by product decision.
- Existing tests: must inspect during implementation.
- Missing tests: form submission with signed-in user, optional anonymous path if approved, and admin-only access.

### Persistence dependency

- Rendering component: none.
- API route: future product-validation API.
- Server service/repository: future product-validation service/repository.
- Store/seed/source currently used: no product-validation store exists.
- Current owner: none.
- Correct owner: product-validation should use the project’s emerging repository pattern and be Postgres-ready. If Postgres is not yet implemented, use a feature-owned memory adapter only as a temporary compatibility layer, with the same service contract intended for Postgres.
- Existing tests: none.
- Missing tests: repository/service tests proving scoring, create, list, detail, and aggregate behavior.

## 4. Source-of-Truth Decision

The product-validation feature owns validation responses and score calculations.

The About page only links to the form. Dashboard/admin pages only consume validation summaries. Auth owns user identity and role checks. The database owns durable response records.

Do not store validation responses in dashboard state, About page arrays, browser-only local storage, or a third-party form service if the goal is admin scoring and product learning inside Sheath Academy.

## 5. UI Pattern Audit

### Public/About link

- Existing visual and interaction pattern: About page uses large static sections, white cards, and footer links.
- Closest approved pattern in `docs/ui-style-guide.md`: feature pages should use app shell/page-width unless intentionally public/focused; About is currently a public narrative page.
- Current icons: none for footer links.
- Required icons: no icon required; optional small arrow icon if consistent with existing link styling.
- Current confirmation pattern: none.
- Required confirmation pattern: none.
- Reuse/extend/replace: extend About page with a validation CTA near the North Star or footer.
- Shell/page-width: keep current About layout and width.
- Nivo: not applicable.
- Tests: About integration test verifies the CTA/link points to `/product-validation` or chosen route.

### Validation form page

- Existing visual and interaction pattern: no native form exists for this flow. Reference form shows multi-step progress, centered card, section label, progress bar, Back/Continue controls, clean inputs, and mobile-first layout.
- Closest approved pattern in `docs/ui-style-guide.md`: focused/auth/onboarding flow exception to app shell, plus page-width consistency if placed under shell.
- Current icons: none.
- Required icons: use lucide-react icons only where they clarify actions; icon-only buttons must have accessible labels.
- Current confirmation pattern: none.
- Required confirmation pattern: no destructive confirmation. Submission should show a success/thank-you state.
- Reuse/extend/replace: create a new focused multi-step form pattern in `features/product-validation/front/components/` and document it if reused later.
- Shell/page-width: recommended route is a focused public or semi-public form under `app/(auth)/product-validation/page.tsx` or a route that intentionally does not show the full app shell. If the form is only for signed-in families, place it under `app/(shell)/product-validation/page.tsx` and preserve shell width.
- Nivo: not applicable on the form.
- Tests: integration tests for step navigation, required fields, score selection, open text entry, back/continue behavior, validation errors, success state, and mobile-friendly accessible controls.

### Admin review UI

- Existing visual and interaction pattern: no confirmed admin metrics page yet.
- Closest approved pattern: app shell and approved page-width pattern; dashboard/admin charts should use Nivo.
- Current icons: none confirmed.
- Required icons: table actions may use view/expand icons with accessible labels; avoid destructive actions in initial slice.
- Current confirmation pattern: none.
- Required confirmation pattern: no delete/archive in the first slice; if added, use app-styled destructive confirmation, not `window.confirm`.
- Reuse/extend/replace: create admin review page or integrate with planned admin metrics page.
- Shell/page-width: admin page must live under app shell and require admin role.
- Nivo: if charts are added, use Nivo explicit props and browser smoke verification.
- Tests: admin API and integration tests for summary cards, table rows, filters, and unauthorized access.

## 6. Product Validation Form Structure

Use a 6-step form inspired by the reference screenshots.

### Step 1 — Context

Purpose: identify who is answering and after what kind of use.

Fields:

- Name, optional if authenticated.
- Email, optional if authenticated.
- Role: parent, tutor, admin/program operator, other.
- Household/program type: homeschool family, tutor-led program, co-op, other.
- How long did you use Sheath Academy before answering? Options: under 10 minutes, one session, one day, one week, multiple weeks.
- Which parts did you actually use? Multi-select: Dashboard, Attendance, Plan/Lessons, Quran, Arabic, Islamic Studies, Portfolio, Records/Reports, Alerts, Other.

### Step 2 — Previous pain

Score question:

- How painful was your previous way of managing this? 1 = not painful, 5 = very painful.

Open text:

- What did Sheath Academy replace for you?

### Step 3 — Benefit and friction

Score questions:

- How much did Sheath Academy improve that process? 1 = not at all, 5 = dramatically.
- How easy was it to use? 1 = very difficult, 5 = very easy.

Open text:

- What was the most useful part?
- What felt confusing or burdensome?

### Step 4 — Trust and records

Score question:

- How much do you trust the records/reports? 1 = do not trust, 5 = fully trust.

Open text:

- What would make this a must-have?

### Step 5 — Retention, price, referral

Score questions:

- How likely are you to keep using it? 1 = very unlikely, 5 = very likely.
- How likely are you to pay for it? 1 = very unlikely, 5 = very likely.
- How likely are you to recommend it? 1 = very unlikely, 5 = very likely.

Open text:

- What would you do if you lost access tomorrow?
- Who specifically would you recommend this to?
- What message would you send them?

### Step 6 — Positioning clarity and consent

Score question:

- How clearly can you explain who it is for? 1 = not clearly, 5 = very clearly.

Optional fields:

- May we contact you about this feedback? yes/no.
- May we quote anonymized feedback? yes/no.
- Anything else we should know?

Success state:

- Thank the user.
- Say the response was saved.
- Offer links back to About, Dashboard, or login depending on auth state.

## 7. Scoring Logic

Store raw scores and compute derived scores server-side.

### Raw score fields

All are 1–5 integers:

- `previousPainScore`
- `improvementScore`
- `easeScore`
- `trustScore`
- `retentionScore`
- `payScore`
- `referralScore`
- `positioningClarityScore`

### Derived score groups

- Pain score: `previousPainScore`.
- Benefit score: average of `improvementScore`, `retentionScore`, and `lossReactionStrength` if later coded from text.
- Usability score: `easeScore`.
- Trust score: `trustScore`.
- Commercial score: average of `payScore` and `referralScore`.
- Positioning score: `positioningClarityScore`.

### Fork Test Fit Score

Initial calculation:

```txt
forkTestFitScore = round(
  previousPainScore * 0.15 +
  improvementScore * 0.20 +
  easeScore * 0.10 +
  trustScore * 0.15 +
  retentionScore * 0.15 +
  payScore * 0.10 +
  referralScore * 0.10 +
  positioningClarityScore * 0.05,
  2
)
```

Interpretation:

- 4.3–5.0: strong fork signal — users feel pain, benefit, trust, and continued use.
- 3.5–4.29: promising but inspect open text for friction or weak pricing.
- 2.5–3.49: unclear; product may be useful but not urgent.
- below 2.5: weak signal or wrong audience.

Do not over-automate decision-making. Admin review must show open text beside scores because a high score with vague text is weaker than a moderate score with specific replacement/referral language.

## 8. Data Model / Contract Changes

Create feature-owned types in `features/product-validation/types.ts`.

```ts
export type ValidationRespondentRole = 'parent' | 'tutor' | 'admin' | 'program_operator' | 'other'
export type ValidationUsageDuration = 'under_10_minutes' | 'one_session' | 'one_day' | 'one_week' | 'multiple_weeks'
export type ValidationFeatureArea =
  | 'dashboard'
  | 'attendance'
  | 'plan_lessons'
  | 'quran'
  | 'arabic'
  | 'islamic_studies'
  | 'portfolio'
  | 'records_reports'
  | 'alerts'
  | 'other'

export interface ProductValidationResponse {
  id: string
  userId?: string
  tenantId?: string
  respondentName?: string
  respondentEmail?: string
  role: ValidationRespondentRole
  householdOrProgramType?: string
  usageDuration: ValidationUsageDuration
  usedFeatureAreas: ValidationFeatureArea[]
  previousPainScore: number
  improvementScore: number
  easeScore: number
  trustScore: number
  retentionScore: number
  payScore: number
  referralScore: number
  positioningClarityScore: number
  replacedWhat: string
  mostUseful: string
  confusingOrBurdensome: string
  mustHaveChange: string
  lostAccessReaction: string
  recommendTo: string
  referralMessage: string
  additionalNotes?: string
  mayContact: boolean
  mayQuoteAnonymized: boolean
  forkTestFitScore: number
  createdAt: string
  updatedAt: string
}
```

### Database table

Recommended table name: `product_validation_responses`.

Columns:

- `id uuid primary key`
- `user_id uuid null references users(id)` when auth persistence exists.
- `tenant_id uuid null references tenants(id)` when user ownership exists.
- `respondent_name text null`
- `respondent_email text null`
- `role text not null`
- `household_or_program_type text null`
- `usage_duration text not null`
- `used_feature_areas text[] not null default '{}'`
- one integer column for each score with `check (score between 1 and 5)`.
- one text column for each open-ended answer.
- `may_contact boolean not null default false`
- `may_quote_anonymized boolean not null default false`
- `fork_test_fit_score numeric(4,2) not null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

If Postgres is not ready, implement the same contract behind `features/product-validation/server/store.ts` using memory storage temporarily, then migrate without changing UI or API contracts.

## 9. API / Store / Service Plan

Create:

```txt
features/product-validation/
  types.ts
  server/
    scoring.ts
    schema.ts
    service.ts
    store.ts or repository.ts
  api/
    router.ts
    routes/
      responses.ts
      summary.ts
  front/
    pages/ProductValidationPage.tsx
    pages/AdminProductValidationPage.tsx
    components/ProductValidationWizard.tsx
    components/ScoreQuestion.tsx
    components/TextQuestion.tsx
    components/FormProgress.tsx
    components/AdminValidationSummary.tsx
    services/api.ts
  __tests__/
    unit/scoring.test.ts
    api/productValidation.test.ts
    integration/ProductValidationWizard.test.tsx
    integration/AdminProductValidationPage.test.tsx
```

API endpoints:

- `POST /api/product-validation/responses`: create response.
- `GET /api/product-validation/responses`: admin-only list, filter, sort.
- `GET /api/product-validation/summary`: admin-only aggregate summary.
- Optional `GET /api/product-validation/responses/:id`: admin-only detail view.

Validation rules:

- All score fields are integers from 1 to 5.
- Required open text fields must be non-empty after trimming.
- Email is optional for signed-in users, required only if anonymous submissions are allowed and contact consent is true.
- `usedFeatureAreas` must include at least one selected feature.
- Server computes `forkTestFitScore`; client never sends the trusted score.

Authorization rules:

- Creating a response may be public or authenticated depending on the final product decision.
- Admin list/summary endpoints must require admin role once role ownership is in place.
- Until admin roles exist, gate admin endpoints with a temporary environment-based allow-list or keep them unavailable outside dev, documented clearly.

## 10. Admin Review UI

Admin page route recommendation:

```txt
/admin/product-validation
```

Initial UI:

- Hero metric cards:
  - Total responses.
  - Average Fork Test Fit Score.
  - Average pain score.
  - Average improvement score.
  - Average trust score.
  - Average pay score.
  - Average referral score.
- Table columns:
  - Date.
  - Role.
  - Usage duration.
  - Used areas.
  - Fork Test Fit Score.
  - Pain.
  - Improvement.
  - Ease.
  - Trust.
  - Retention.
  - Pay.
  - Referral.
  - Positioning clarity.
  - Contact allowed.
- Detail drawer or expanded row:
  - What it replaced.
  - Most useful part.
  - Confusing/burdensome part.
  - Must-have change.
  - Lost-access reaction.
  - Recommendation target.
  - Referral message.

Charts:

- Use Nivo only if charts are included in this slice.
- Recommended charts: score distribution by question and response trend over time.
- Nivo requirements: explicit array props for legends, layers, markers, defs, and fill; browser smoke check because Jest mocks Nivo.

## 11. UI Implementation Notes from Reference Form

Replicate these qualities from the provided form screenshots:

- Top back link, if public form needs to return to About.
- Step label such as `STEP 2 OF 6`.
- Thin progress bar with filled segment.
- Right-aligned current section label.
- Large white rounded card on soft warm/slate background.
- Clear card heading and helper text.
- Two-column layout on desktop that collapses to one column on mobile.
- Back button on lower left and Continue/Submit button on lower right.
- Selected choices use strong border/background and checkmark.
- Inputs use labels, required markers, visible focus, and accessible names.

The uploaded page appears to be a custom Next application using Tailwind-style classes and Radix/shadcn-like primitives, not an obvious external form SaaS embed. Since this repo already has Tailwind and lucide-react but does not list shadcn/radix dependencies in `package.json`, build the UI with existing React/Tailwind/lucide dependencies unless implementation audit approves adding a component library.

## 12. Acceptance Criteria

1. About page includes a visible link or CTA to the product validation form.
2. Opening the form shows a focused multi-step flow with progress bar, step count, section label, and Back/Continue controls.
3. User cannot submit until all required score and open-text questions are answered.
4. Every score question accepts only 1–5.
5. Back and Continue preserve entered answers.
6. Submitting creates one durable response through the product-validation API.
7. Server computes `forkTestFitScore`; client-submitted score is ignored if present.
8. Successful submission shows a thank-you state.
9. Admin review page shows response count, average scores, Fork Test Fit Score, and open-text details.
10. Admin endpoints are protected; non-admin users cannot list responses.
11. Playwright proves a user can reach the form from About and submit a complete response.
12. Playwright proves unauthorized users cannot access admin response data.
13. `npm run build`, `npm test`, and relevant Playwright tests pass.

## 13. Testing Plan

Write failing tests first.

### Unit tests

- `calculateForkTestFitScore()` returns expected weighted score.
- Score validation rejects values below 1, above 5, decimals, and missing values.
- Required open text validation trims whitespace.
- Summary builder calculates averages, counts, and distributions correctly.

### API tests

- `POST /api/product-validation/responses` creates a response with valid input.
- POST rejects missing required score.
- POST rejects invalid score range.
- POST rejects missing required open text.
- POST ignores client-supplied `forkTestFitScore` and computes server-side.
- `GET /api/product-validation/summary` returns aggregate values for admin.
- Admin list rejects unauthorized/non-admin request.

### Integration tests

- About page renders product validation CTA/link.
- Wizard renders Step 1 with progress bar.
- Continue validates required fields.
- Score selection updates visible state.
- Open text answers persist after Back/Continue.
- Submit calls API and renders thank-you state.
- Admin page renders hero metrics and response table from mocked API.
- Admin page handles empty state: “No validation responses yet.”

### Playwright tests

- From About, click validation CTA, complete form, submit, see thank-you state.
- Refresh before submit if draft persistence is implemented; confirm answers survive only if in scope.
- Admin can view the submitted response in admin review UI.
- Non-admin cannot access `/admin/product-validation` or admin API.

## 14. Build Phases

### Phase 1 — Audit and route decision

- Read `CLAUDE.md`, `docs/planning-quality-rule.md`, and `docs/ui-style-guide.md`.
- Inspect About tests, app route groups, auth role status, admin page status, and persistence state.
- Decide final form route:
  - public/focused: `/product-validation` outside app shell, or
  - authenticated/shell: `/product-validation` inside app shell.

Exit criteria: exact route, auth posture, and file list are confirmed.

### Phase 2 — Types, scoring, validation, and service

- Create product-validation feature folder.
- Add types, scoring helper, validation schema/helper, service, and repository/store adapter.
- Add unit tests first.

Exit criteria: scoring and validation tests pass.

### Phase 3 — API routes

- Add product-validation router and wire it into `app/api/[...slug]/route.ts`.
- Add create/list/summary route handlers.
- Add API tests first.

Exit criteria: API tests pass and response shape follows standard `{ status, data, message, timestamp }`.

### Phase 4 — Form UI

- Build multi-step wizard components.
- Build form page.
- Add route wrapper.
- Add About CTA/link.
- Add integration tests first.

Exit criteria: user can complete and submit the form locally.

### Phase 5 — Admin review UI

- Build admin summary/review page or integrate with existing admin metrics page if it exists by implementation time.
- Add admin summary cards, table, detail expansion, and empty state.
- Add integration/API tests for admin access.

Exit criteria: admin can review scores and open text.

### Phase 6 — Playwright and smoke

- Add full user flow test from About to form submission.
- Add admin access/unauthorized access test.
- Run build, unit/API/integration tests, Playwright, and browser smoke if charts are included.

Exit criteria: all checks pass.

## 15. Out of Scope

- External form SaaS integration unless explicitly approved.
- Anonymous public sharing of raw feedback.
- AI summarization of responses.
- Deleting validation responses.
- Email notifications on submission.
- File uploads or profile pictures.
- Payment collection or checkout.
- Complex survey branching beyond the 6-step flow.

## 16. Manual QA Plan

1. Open About page.
2. Confirm the product validation CTA is visible and clear.
3. Click the CTA.
4. Confirm the form opens with Step 1 of 6 and a progress bar.
5. Try to continue without required fields; confirm validation appears.
6. Complete each step with valid score and text answers.
7. Use Back from Step 4 to Step 3; confirm answers remain.
8. Continue again to final step.
9. Submit.
10. Confirm thank-you state appears.
11. Open the admin validation page as admin.
12. Confirm the new response appears in the table and summary counts update.
13. Open the response detail and confirm open text is readable.
14. Sign in as non-admin or unauthenticated user.
15. Confirm admin page/API access is denied.
16. Run `npm run build`, `npm test`, and Playwright tests.

## 17. Questions for Rasheed Before Implementation

1. Should the form be public from About, or only available after sign-in?
2. Should anonymous respondents be allowed to submit, or must every response attach to a user/tenant?
3. Should the route be `/product-validation`, `/feedback`, or `/fork-test`?
4. Should users be allowed to submit more than once, or only one response per user/tenant per time period?
5. Should the admin review live in the upcoming admin metrics page, or as a separate `/admin/product-validation` page first?
6. Should quote consent be included now, since the form asks for referral language that may be useful for marketing?
7. Should pricing ask only “likely to pay” or also include a price range question in this first version?
8. Should the form copy speak to Muslim homeschool families only, or also tutors/program operators from day one?

## 18. Branch and Commit Plan

Recommended branch:

```txt
feature/product-validation-form
```

Commit sequence:

```txt
test(product-validation): cover fork test scoring and validation
feat(product-validation): add response types service and repository
test(product-validation): cover create and admin summary api
feat(product-validation): add response and summary api routes
test(product-validation): cover multi-step wizard behavior
feat(product-validation): add fork test validation wizard
test(about): cover validation form cta
feat(about): link to product validation form
test(admin): cover validation response summary ui
feat(admin): add product validation review page
test(e2e): cover product validation submission and admin access
```

## 19. Risks and Rollback

### Risks

- Building admin review before auth roles are complete may create unsafe visibility.
- Public form submissions may attract spam if the route is unauthenticated.
- Adding a new UI library for one form may increase bundle and maintenance cost.
- Form responses without tenant/user context may be less useful later.
- Over-scoring may hide the meaning found in open text.

### Mitigations

- Prefer authenticated form for real users unless public feedback is explicitly desired.
- Keep admin APIs fail-closed until admin role checks exist.
- Use existing React/Tailwind/lucide dependencies for the first implementation.
- Store both raw scores and open text.
- Show open text beside scores in admin review.

### Rollback

- Remove About CTA to stop new submissions without deleting saved data.
- Disable POST route with a feature flag if needed.
- Keep existing app features unaffected because product-validation is feature-owned and isolated.

## 20. Implementation Prompt for Claude Code

```txt
Create the product validation form from docs/bug_enhancement/20260522-1230-product-validation-form-plan.md.

Before coding, read CLAUDE.md, docs/planning-quality-rule.md, docs/ui-style-guide.md, and the current About page.

Start with Phase 1 only: audit the current About page tests, route groups, auth/admin role status, API routing, persistence state, and package dependencies. Do not implement yet. Report the exact files to touch, whether the form should be public or authenticated based on current architecture, and whether admin review should be standalone or integrated with the admin metrics page.
```
