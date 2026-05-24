# Development Plan — Product Validation Forms

Branch: `claude/feedback-yIxhs`

Status: Planned — decisions resolved

## 1. Summary

Create a product validation form for Sheath Academy based on the Fork Test Framework. The form will collect structured post-use feedback about previous pain, benefit, friction, trust, retention, pricing, referral likelihood, and positioning clarity. It will include 1–5 score questions, a price-range slider/question, and open-text questions. Responses must be stored in the database, linked to an authenticated user/tenant, and summarized inside the admin metrics page.

The form link should be public from the About page, but the form submission itself must require sign-in. Anonymous respondents are not allowed. The public route is `/feedback`. Multiple submissions are allowed because feedback after first use, one week, and later real use may differ.

The form should use the visual and interaction feel of the provided German Method application form reference: a focused multi-step flow, progress bar, centered card, large section headings, clean controls, Back/Continue navigation, selected cards/checkmarks, and mobile-friendly spacing. Build the form inside Sheath Academy using the existing React/Tailwind/lucide stack unless the implementation audit finds an already-approved component library. Do not embed an external form SaaS.

The copy should speak to both Muslim homeschool families and tutor/program operators.

## 2. Planning Mode

Mode 4 — New Feature, with Mode 3 cross-feature integration.

Reason: this introduces a new product-validation feature with data model, API, front-end form, About-page link, admin metrics integration, score calculations, and Playwright coverage. It also depends on authentication/user ownership because responses may not be anonymous.

## 3. Confirmed Product Decisions

- About page link: yes, public CTA/link from About.
- Route: `/feedback`.
- Anonymous submissions: no. Users must sign in before submitting.
- Multiple submissions: yes. Do not enforce one response per user/tenant.
- Admin review location: integrate into the admin metrics page, not a standalone `/admin/product-validation` page unless admin metrics does not exist yet and the implementation plan explicitly documents a temporary fallback.
- Quote/contact consent: include now.
- Pricing: include both the 1–5 willingness-to-pay score and a price-range slider/question.
- Audience copy: address homeschool families and tutor/program operators.

## 4. Current Code Path Audit

### About page link surface

- Rendering component: `features/about/front/pages/About.tsx`.
- Data provider/hook/context: none; static content with `next/link`.
- API route called: none.
- Server service/repository: none.
- Store/seed/source currently used: static arrays for pains, Wave 1 summary, and changelog.
- Current owner: About feature owns public product narrative and footer links.
- Correct owner: About should only link to `/feedback`; the product-validation feature should own the form, responses, scoring, and admin metrics data.
- Existing tests: must inspect `features/about/__tests__` before implementation.
- Missing tests: integration test proving the About page exposes a clear CTA/link to `/feedback`.

### Product validation form

- Rendering component: does not exist yet.
- Data provider/hook/context: does not exist yet.
- API route called: does not exist yet.
- Server service/repository: does not exist yet.
- Store/seed/source currently used: none.
- Current owner: none.
- Correct owner: new `features/product-validation/` feature.
- Existing tests: none.
- Missing tests: unit tests for scoring, API tests for response creation/listing/summary, integration tests for the multi-step form, and Playwright tests for the full signed-in submission path.

### Admin metrics integration

- Rendering component: admin metrics page was requested in prior planning but was not confirmed in repo search at plan time.
- Data provider/hook/context: none confirmed.
- API route called: none confirmed.
- Server service/repository: none confirmed.
- Store/seed/source currently used: none confirmed.
- Current owner: absent or not yet implemented.
- Correct owner: admin metrics owns the review surface; product-validation owns response storage and summary/read APIs consumed by admin metrics.
- Existing tests: none confirmed.
- Missing tests: admin-only access tests, summary rendering tests, filter/sort tests, response detail tests, and unauthorized access tests once auth roles are implemented.

### Authentication and ownership dependency

- Rendering component: login already exists in `features/auth/front/pages/Login.tsx`.
- API route: auth is handled by `app/api/auth/[...nextauth]/route.ts`.
- Server service/repository: `features/auth/auth.ts`.
- Store/seed/source currently used: current auth adapter is memory-backed; a separate auth/user ownership plan exists for durable users, roles, tenant ownership, and API authorization.
- Current owner: Auth owns session/login.
- Correct owner: product validation responses must store `userId`, `tenantId`, and role/audience context when a signed-in user submits the form.
- Existing tests: must inspect during implementation.
- Missing tests: form route sign-in gating, signed-in submission, user/tenant attachment, multiple submissions by the same user, and admin-only access.

### Persistence dependency

- Rendering component: none.
- API route: future product-validation API.
- Server service/repository: future product-validation service/repository.
- Store/seed/source currently used: no product-validation store exists.
- Current owner: none.
- Correct owner: product-validation should use the project’s emerging repository pattern and be Postgres-ready. If Postgres is not yet implemented, use a feature-owned memory adapter only as a temporary compatibility layer, with the same service contract intended for Postgres.
- Existing tests: none.
- Missing tests: repository/service tests proving scoring, price-range storage, create, list, detail, and aggregate behavior.

## 5. Source-of-Truth Decision

The product-validation feature owns validation responses, scoring, price-range fields, and summary calculations.

The About page only links to `/feedback`. The admin metrics page only consumes validation summaries and response details. Auth owns identity and role checks. The database owns durable response records.

Do not store validation responses in dashboard state, About page arrays, browser-only local storage, or a third-party form service. Do not allow anonymous response creation.

## 6. UI Pattern Audit

### Public/About link

- Existing visual and interaction pattern: About page uses large static sections, white cards, and footer links.
- Closest approved pattern in `docs/ui-style-guide.md`: About is a public narrative page and may link into a focused/auth-gated flow.
- Current icons: none for footer links.
- Required icons: no icon required; optional small arrow icon if consistent with existing link styling.
- Current confirmation pattern: none.
- Required confirmation pattern: none.
- Reuse/extend/replace: extend About page with a validation CTA near the North Star and/or footer.
- Shell/page-width: keep current About layout and width.
- Nivo: not applicable.
- Tests: About integration test verifies the CTA/link points to `/feedback`.

### Feedback form page

- Existing visual and interaction pattern: no native form exists for this flow. Reference form shows multi-step progress, centered card, section label, progress bar, Back/Continue controls, clean inputs, and mobile-first layout.
- Closest approved pattern in `docs/ui-style-guide.md`: focused/auth/onboarding flow exception to app shell. Because `/feedback` is public-linkable but requires sign-in to submit, implementation should choose either an auth-gated focused route or a shell route after login; the route path remains `/feedback`.
- Current icons: none.
- Required icons: use lucide-react icons only where they clarify actions; icon-only buttons must have accessible labels.
- Current confirmation pattern: none.
- Required confirmation pattern: no destructive confirmation. Submission should show a success/thank-you state.
- Reuse/extend/replace: create a new focused multi-step form pattern in `features/product-validation/front/components/` and document it if reused later.
- Shell/page-width: `/feedback` should have the focused form layout inspired by the reference. If unauthenticated, show sign-in prompt or redirect preserving return-to `/feedback`; after sign-in, return to the form.
- Nivo: not applicable on the form.
- Tests: integration tests for step navigation, required fields, sign-in gating, score selection, price-range slider, open text entry, back/continue behavior, validation errors, success state, and mobile-friendly accessible controls.

### Admin metrics review UI

- Existing visual and interaction pattern: admin metrics page may not exist yet; implementation must inspect current branch first.
- Closest approved pattern: app shell and approved page-width pattern; dashboard/admin charts should use Nivo.
- Current icons: none confirmed.
- Required icons: table actions may use view/expand icons with accessible labels; avoid destructive actions in initial slice.
- Current confirmation pattern: none.
- Required confirmation pattern: no delete/archive in the first slice; if added later, use app-styled destructive confirmation, not `window.confirm`.
- Reuse/extend/replace: integrate product validation summary and detail review into the admin metrics page. If admin metrics is not implemented yet, add a clearly named section/page that can be moved into admin metrics without changing product-validation APIs.
- Shell/page-width: admin metrics page must live under app shell and require admin role.
- Nivo: if charts are added, use Nivo explicit props and browser smoke verification.
- Tests: admin API and integration tests for summary cards, table rows, filters, detail expansion, price-range summaries, quote consent flags, and unauthorized access.

## 7. Product Validation Form Structure

Use a 6-step form inspired by the reference screenshots.

### Step 1 — Context

Purpose: identify who is answering and after what kind of use.

Fields:

- Name, prefilled from authenticated user if available; editable only if product decision allows.
- Email, prefilled from authenticated user and stored with response.
- Respondent type: homeschool parent/family, tutor, program operator/admin, other.
- Household/program type: homeschool family, tutor-led program, co-op, micro-school, other.
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

Pricing question:

- What monthly price would feel reasonable if Sheath Academy became part of your regular homeschool or tutoring workflow?

Recommended slider values:

```txt
$0, $5, $10, $15, $20, $30, $50, $75, $100+
```

Store both the selected bucket and an optional free-text pricing note. UI copy should make clear this is research, not a checkout or commitment.

Open text:

- What would you do if you lost access tomorrow?
- Who specifically would you recommend this to?
- What message would you send them?

### Step 6 — Positioning clarity and consent

Score question:

- How clearly can you explain who it is for? 1 = not clearly, 5 = very clearly.

Consent and notes:

- May we contact you about this feedback? yes/no.
- May we quote anonymized feedback? yes/no.
- May we quote your feedback with your name? yes/no, optional and default false.
- Anything else we should know?

Success state:

- Thank the user.
- Say the response was saved.
- Offer links back to About or Dashboard depending on auth/session state.

## 8. Scoring Logic

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

### Pricing fields

- `reasonableMonthlyPriceBucket`: one of `0`, `5`, `10`, `15`, `20`, `30`, `50`, `75`, `100_plus`.
- `pricingNotes`: optional text.

### Derived score groups

- Pain score: `previousPainScore`.
- Benefit score: average of `improvementScore`, `retentionScore`, and `lossReactionStrength` if later coded from text.
- Usability score: `easeScore`.
- Trust score: `trustScore`.
- Commercial score: average of `payScore` and `referralScore`, with price bucket shown separately instead of silently blending it into the core fit score.
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
- 3.5–4.29: promising but inspect open text for friction, weak pricing, or weak referral specificity.
- 2.5–3.49: unclear; product may be useful but not urgent.
- below 2.5: weak signal or wrong audience.

Do not over-automate decision-making. Admin metrics must show open text and price bucket beside scores because a high score with vague text is weaker than a moderate score with specific replacement/referral language.

## 9. Data Model / Contract Changes

Create feature-owned types in `features/product-validation/types.ts`.

```ts
export type ValidationRespondentType = 'homeschool_family' | 'tutor' | 'program_operator' | 'other'
export type ValidationUsageDuration = 'under_10_minutes' | 'one_session' | 'one_day' | 'one_week' | 'multiple_weeks'
export type ValidationPriceBucket = '0' | '5' | '10' | '15' | '20' | '30' | '50' | '75' | '100_plus'
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
  userId: string
  tenantId?: string
  respondentName?: string
  respondentEmail: string
  respondentType: ValidationRespondentType
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
  reasonableMonthlyPriceBucket: ValidationPriceBucket
  pricingNotes?: string
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
  mayQuoteWithName: boolean
  forkTestFitScore: number
  createdAt: string
  updatedAt: string
}
```

### Database table

Recommended table name: `product_validation_responses`.

Columns:

- `id uuid primary key`
- `user_id uuid not null references users(id)` when auth persistence exists.
- `tenant_id uuid null references tenants(id)` when user ownership exists.
- `respondent_name text null`
- `respondent_email text not null`
- `respondent_type text not null`
- `household_or_program_type text null`
- `usage_duration text not null`
- `used_feature_areas text[] not null default '{}'`
- one integer column for each score with `check (score between 1 and 5)`.
- `reasonable_monthly_price_bucket text not null`
- `pricing_notes text null`
- one text column for each open-ended answer.
- `may_contact boolean not null default false`
- `may_quote_anonymized boolean not null default false`
- `may_quote_with_name boolean not null default false`
- `fork_test_fit_score numeric(4,2) not null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

If Postgres is not ready, implement the same contract behind `features/product-validation/server/store.ts` using memory storage temporarily, then migrate without changing UI or API contracts.

## 10. API / Store / Service Plan

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
    pages/FeedbackPage.tsx
    components/ProductValidationWizard.tsx
    components/ScoreQuestion.tsx
    components/PriceRangeQuestion.tsx
    components/TextQuestion.tsx
    components/FormProgress.tsx
    components/AdminValidationSummary.tsx
    services/api.ts
  __tests__/
    unit/scoring.test.ts
    api/productValidation.test.ts
    integration/ProductValidationWizard.test.tsx
    integration/AdminValidationSummary.test.tsx
```

API endpoints:

- `POST /api/product-validation/responses`: create response for the signed-in user.
- `GET /api/product-validation/responses`: admin-only list, filter, sort for admin metrics.
- `GET /api/product-validation/summary`: admin-only aggregate summary for admin metrics.
- Optional `GET /api/product-validation/responses/:id`: admin-only detail view.

Validation rules:

- Request must be authenticated; anonymous POST returns 401.
- All score fields are integers from 1 to 5.
- Required open text fields must be non-empty after trimming.
- `reasonableMonthlyPriceBucket` must be one of the approved buckets.
- Email comes from the authenticated user/session where possible; do not trust anonymous email as identity.
- `usedFeatureAreas` must include at least one selected feature.
- Server computes `forkTestFitScore`; client never sends the trusted score.
- Multiple submissions are allowed.

Authorization rules:

- Creating a response requires a signed-in user.
- Admin list/summary endpoints must require admin role once role ownership is in place.
- Until admin roles exist, gate admin metrics endpoints with the same temporary admin guard used by the admin metrics page; fail closed outside approved dev/admin contexts.

## 11. Admin Metrics Integration

The product validation review belongs inside the admin metrics page.

Admin metrics should include a `Product validation` section with:

- Total feedback responses.
- Average Fork Test Fit Score.
- Average pain score.
- Average improvement score.
- Average ease score.
- Average trust score.
- Average retention score.
- Average pay score.
- Average referral score.
- Average positioning clarity score.
- Price bucket distribution.
- Contact/quote consent counts.

Table columns:

- Date.
- Respondent type.
- Household/program type.
- Usage duration.
- Used areas.
- Fork Test Fit Score.
- Pain.
- Improvement.
- Ease.
- Trust.
- Retention.
- Pay.
- Price bucket.
- Referral.
- Positioning clarity.
- Contact allowed.
- Quote anonymized.
- Quote with name.

Detail drawer or expanded row:

- What it replaced.
- Most useful part.
- Confusing/burdensome part.
- Must-have change.
- Lost-access reaction.
- Recommendation target.
- Referral message.
- Pricing notes.
- Additional notes.

Charts:

- Use Nivo only if charts are included in this slice.
- Recommended charts: score distribution by question, price bucket distribution, and response trend over time.
- Nivo requirements: explicit array props for legends, layers, markers, defs, and fill; browser smoke check because Jest mocks Nivo.

## 12. UI Implementation Notes from Reference Form

Replicate these qualities from the provided form screenshots:

- Top back link returning to About.
- Step label such as `STEP 2 OF 6`.
- Thin progress bar with filled segment.
- Right-aligned current section label.
- Large white rounded card on soft warm/slate background.
- Clear card heading and helper text.
- Two-column layout on desktop that collapses to one column on mobile.
- Back button on lower left and Continue/Submit button on lower right.
- Selected choices use strong border/background and checkmark.
- Inputs use labels, required markers, visible focus, and accessible names.
- Price slider shows the current selected monthly price clearly and explains it is research, not a payment commitment.

The uploaded page appears to be a custom Next application using Tailwind-style classes and Radix/shadcn-like primitives, not an obvious external form SaaS embed. Since this repo already has Tailwind and lucide-react but does not list shadcn/radix dependencies in `package.json`, build the UI with existing React/Tailwind/lucide dependencies unless implementation audit approves adding a component library.

## 13. Acceptance Criteria

1. About page includes a visible link or CTA to `/feedback`.
2. Opening `/feedback` while signed out prompts sign-in or redirects to login while preserving return-to `/feedback`.
3. Opening `/feedback` while signed in shows a focused multi-step flow with progress bar, step count, section label, and Back/Continue controls.
4. User cannot submit until all required score, pricing, consent, and open-text questions are answered.
5. Every score question accepts only 1–5.
6. Price range question stores one approved monthly price bucket and optional notes.
7. Back and Continue preserve entered answers.
8. Submitting creates one durable response through the product-validation API linked to the signed-in user and tenant when available.
9. Multiple submissions by the same user are allowed.
10. Server computes `forkTestFitScore`; client-submitted score is ignored if present.
11. Successful submission shows a thank-you state.
12. Admin metrics page shows response count, average scores, price distribution, quote consent counts, Fork Test Fit Score, and open-text details.
13. Admin endpoints are protected; non-admin users cannot list responses.
14. Playwright proves a signed-in user can reach the form from About and submit a complete response.
15. Playwright proves a signed-out user cannot submit anonymously.
16. Playwright proves unauthorized users cannot access admin metrics response data.
17. `npm run build`, `npm test`, and relevant Playwright tests pass.

## 14. Testing Plan

Write failing tests first.

### Unit tests

- `calculateForkTestFitScore()` returns expected weighted score.
- Score validation rejects values below 1, above 5, decimals, and missing values.
- Price bucket validation rejects values outside the approved buckets.
- Required open text validation trims whitespace.
- Summary builder calculates averages, counts, distributions, price buckets, and consent counts correctly.

### API tests

- `POST /api/product-validation/responses` rejects signed-out/anonymous request.
- POST creates a response with valid signed-in input.
- POST allows multiple submissions by the same user.
- POST rejects missing required score.
- POST rejects invalid score range.
- POST rejects invalid price bucket.
- POST rejects missing required open text.
- POST ignores client-supplied `forkTestFitScore` and computes server-side.
- `GET /api/product-validation/summary` returns aggregate values for admin metrics.
- Admin list rejects unauthorized/non-admin request.

### Integration tests

- About page renders product validation CTA/link to `/feedback`.
- Wizard renders Step 1 with progress bar.
- Signed-out feedback page shows sign-in prompt or redirect behavior.
- Continue validates required fields.
- Score selection updates visible state.
- Price slider/choice updates visible selected price bucket.
- Open text answers persist after Back/Continue.
- Submit calls API and renders thank-you state.
- Admin metrics product-validation section renders hero metrics and response table from mocked API.
- Admin metrics handles empty state: “No validation responses yet.”

### Playwright tests

- From About, click feedback CTA while signed out; confirm sign-in is required and anonymous submission is unavailable.
- Sign in, return to `/feedback`, complete form, submit, and see thank-you state.
- Submit a second response as the same user; confirm multiple submissions are allowed.
- Admin can view the submitted response inside admin metrics.
- Non-admin cannot access product-validation admin metrics or admin APIs.

## 15. Build Phases

### Phase 1 — Audit and route/admin decision confirmation

- Read `CLAUDE.md`, `docs/planning-quality-rule.md`, and `docs/ui-style-guide.md`.
- Inspect About tests, app route groups, auth role status, admin metrics status, API routing, persistence state, and package dependencies.
- Confirm `/feedback` route implementation location and return-to-login behavior.
- Confirm how the existing or planned admin metrics page should consume product-validation summaries.

Exit criteria: exact route, auth posture, admin metrics integration point, and file list are confirmed.

### Phase 2 — Types, scoring, validation, and service

- Create product-validation feature folder.
- Add types, scoring helper, validation schema/helper, service, and repository/store adapter.
- Add unit tests first.

Exit criteria: scoring, pricing, consent, and validation tests pass.

### Phase 3 — API routes

- Add product-validation router and wire it into `app/api/[...slug]/route.ts`.
- Add create/list/summary route handlers.
- Add API tests first.

Exit criteria: API tests pass and response shape follows standard `{ status, data, message, timestamp }`.

### Phase 4 — Feedback form UI

- Build multi-step wizard components.
- Build `/feedback` page.
- Add sign-in-required behavior preserving return-to `/feedback`.
- Add About CTA/link.
- Add integration tests first.

Exit criteria: a signed-in user can complete and submit the form locally; signed-out users cannot submit.

### Phase 5 — Admin metrics integration

- Add product validation section to admin metrics page.
- Add summary cards, price distribution, table, detail expansion, quote consent flags, and empty state.
- Add integration/API tests for admin access.

Exit criteria: admin metrics can review scores, price buckets, consent, and open text.

### Phase 6 — Playwright and smoke

- Add full user flow test from About to signed-in feedback submission.
- Add multiple-submission test.
- Add admin/non-admin access test.
- Run build, unit/API/integration tests, Playwright, and browser smoke if charts are included.

Exit criteria: all checks pass.

## 16. Out of Scope

- External form SaaS integration.
- Anonymous submissions.
- Public sharing of raw feedback.
- AI summarization of responses.
- Deleting validation responses.
- Email notifications on submission.
- File uploads or profile pictures.
- Payment collection or checkout.
- Complex survey branching beyond the 6-step flow.

## 17. Manual QA Plan

1. Open About page.
2. Confirm the feedback CTA is visible and points to `/feedback`.
3. Click the CTA while signed out.
4. Confirm sign-in is required and anonymous submission is not available.
5. Sign in and return to `/feedback`.
6. Confirm the form opens with Step 1 of 6 and a progress bar.
7. Try to continue without required fields; confirm validation appears.
8. Complete each step with valid score, price bucket, consent, and text answers.
9. Use Back from Step 4 to Step 3; confirm answers remain.
10. Continue again to final step.
11. Submit.
12. Confirm thank-you state appears.
13. Submit a second response as the same user; confirm it is accepted.
14. Open admin metrics as admin.
15. Confirm the product validation section shows updated response count, averages, price distribution, and consent counts.
16. Open the response detail and confirm open text is readable.
17. Sign in as non-admin or unauthenticated user.
18. Confirm admin metrics response data/API access is denied.
19. Run `npm run build`, `npm test`, and Playwright tests.

## 18. Branch and Commit Plan

Recommended branch:

```txt
feature/product-validation-form
```

Commit sequence:

```txt
test(product-validation): cover fork test scoring pricing and validation
feat(product-validation): add response types service and repository
test(product-validation): cover create and admin metrics summary api
feat(product-validation): add response and summary api routes
test(product-validation): cover multi-step feedback wizard behavior
feat(product-validation): add signed-in feedback wizard
test(about): cover feedback cta
feat(about): link to feedback form
test(admin): cover product validation metrics section
feat(admin): add product validation to admin metrics
test(e2e): cover feedback submission and admin access
```

## 19. Risks and Rollback

### Risks

- Building admin metrics review before auth roles are complete may create unsafe visibility.
- A public link with sign-in-required submission may confuse users if return-to behavior is poor.
- Adding a new UI library for one form may increase bundle and maintenance cost.
- Form responses without tenant context may be less useful later, even though user identity is required.
- Over-scoring may hide the meaning found in open text.
- Price research could feel like a purchase prompt if copy is not clear.

### Mitigations

- Keep admin APIs fail-closed until admin role checks exist.
- Preserve return-to `/feedback` after sign-in.
- Use existing React/Tailwind/lucide dependencies for the first implementation.
- Store both raw scores and open text.
- Show open text and price buckets beside scores in admin metrics.
- Explicitly label pricing as research, not checkout or commitment.

### Rollback

- Remove About CTA to stop new submissions without deleting saved data.
- Disable POST route with a feature flag if needed.
- Hide product-validation section in admin metrics if authorization is not ready.
- Keep existing app features unaffected because product-validation is feature-owned and isolated.

## 20. Implementation Prompt for Claude Code

```txt
Create the product validation form from docs/bug_enhancement/20260522-1230-product-validation-form-plan.md.

Before coding, read CLAUDE.md, docs/planning-quality-rule.md, docs/ui-style-guide.md, and the current About page.

Start with Phase 1 only: audit the current About page tests, route groups, auth/admin role status, admin metrics page status, API routing, persistence state, and package dependencies. Do not implement yet. Report the exact files to touch, how /feedback will require sign-in while remaining linked publicly from About, and how the product-validation summary will integrate into admin metrics.
```
