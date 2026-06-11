# Feedback Steward - Implementation Plan V2

**Branch:** `enhancement/feedback-steward-v2` off `dev`  
**Status:** Replaces `20260525-1000-feedback-steward-plan.md` as the directing implementation document  
**Grounded on:** Current repo state as of 2026-05-25, including the existing Wave 1/2 feedback UI and the hardened Wave 3 classify runner

---

## 1. Summary

This V2 plan completes the Feedback Steward as a recovery-and-finish effort, not a greenfield build. The feedback feature already has a real database-backed row model, user pages, admin queue pages, route wiring, route tests, integration tests, and a first-pass classify pipeline. The main problem is not missing product direction; it is that the current implementation still has workflow-semantic drift, direct repository usage where feature services should own business rules, and incomplete automation contracts for the remaining daily-plan / execute / PR-sync / merge lifecycle. This plan first normalizes workflow ownership and state semantics, then completes the user/admin surfaces that are still inconsistent, then finishes automation with strict machine contracts, dry-run safety, and explicit fail-closed behavior.

---

## 2. Planning Mode

**Mode 4 - New Feature**, with **Mode 5 migration traits**.

Why:
- This is still a substantial roadmap capability spanning schema, API, UI, automation, and release workflow.
- It is not fully greenfield anymore because Wave 1/2 and part of Wave 3 already exist.
- The plan therefore must both finish missing capability and correct ownership/contract drift in the current partial implementation.

---

## 3. Current Code Path Audit

### 3.1 User feedback submission

- **Rendering component:** `features/feedback/front/components/FeedbackButton.tsx`
- **Front-end service:** `submitFeedback()` in `features/feedback/front/services/api.ts`
- **API route:** `POST /api/feedback` via `features/feedback/api/router.ts`
- **Server service/repository:** currently route-level write path ends at `insertFeedback()` in `features/feedback/server/repository.ts`
- **Store/source:** Postgres `userFeedback` via Drizzle
- **Current owner:** Feedback feature
- **Correct owner:** Feedback feature
- **Existing tests:** `features/feedback/__tests__/integration/FeedbackButton.test.tsx`
- **Missing tests:** submit route auth/validation coverage; service-layer tests once `server/service.ts` exists

### 3.2 User feedback hub (`/feedback`)

- **Rendering component:** `features/feedback/front/pages/FeedbackHubPage.tsx`
- **Front-end service:** `listUserFeedback()` in `features/feedback/front/services/api.ts`
- **API route:** `GET /api/feedback` via `features/feedback/api/routes/userList.ts`
- **Server service/repository:** currently route calls `listFeedbackByUserId()` in `features/feedback/server/repository.ts` directly
- **Store/source:** Postgres `userFeedback`
- **Current owner:** Feedback feature
- **Correct owner:** Feedback feature
- **Existing tests:** `features/feedback/__tests__/integration/FeedbackHubPage.test.tsx`, `features/feedback/__tests__/api/routes/userList.test.ts`
- **Missing tests:** service-layer tests for viewer scoping; Playwright flow from popup success state to hub to detail page

### 3.3 User feedback detail (`/feedback/[id]`)

- **Rendering component:** `features/feedback/front/pages/FeedbackDetailPage.tsx`
- **Front-end service:** `getUserFeedback(id)` in `features/feedback/front/services/api.ts`
- **API route:** `GET /api/feedback/[id]` via `features/feedback/api/routes/userDetail.ts`
- **Server service/repository:** currently route calls `getFeedbackById()` in `features/feedback/server/repository.ts` directly
- **Store/source:** Postgres `userFeedback`
- **Current owner:** Feedback feature
- **Correct owner:** Feedback feature
- **Existing tests:** `features/feedback/__tests__/integration/FeedbackDetailPage.test.tsx`, `features/feedback/__tests__/api/routes/userDetail.test.ts`
- **Missing tests:** service-layer authorization tests; duplicate-callout rendering; shipped/changelog rendering regression once changelog loop is completed; Playwright owner/admin access flow

### 3.4 Admin feedback queue (`/admin/feedback`)

- **Rendering component:** `features/feedback/front/pages/AdminFeedbackPage.tsx`
- **Front-end service:** none for queue reads today; the page currently calls `fetch()` directly
- **API route:** `GET /api/admin/feedback` via `features/feedback/api/routes/adminList.ts`
- **Server service/repository:** currently route calls `listFeedbackForAdmin()` in `features/feedback/server/repository.ts` directly
- **Store/source:** Postgres `userFeedback`
- **Current owner:** Feedback feature
- **Correct owner:** Feedback feature
- **Existing tests:** `features/feedback/__tests__/integration/AdminFeedbackPage.test.tsx`, `features/feedback/__tests__/api/routes/adminList.test.ts`
- **Missing tests:** URL-backed filter persistence; service-wrapper usage; admin metrics summary linkage; Playwright queue filter + approve flow

### 3.5 Admin approval action

- **Rendering component:** approve button in `features/feedback/front/pages/AdminFeedbackPage.tsx`, confirmation in `features/feedback/front/components/ApprovalModal.tsx`
- **Front-end service:** none today; page currently calls `fetch()` directly
- **API route:** `POST /api/admin/feedback/[id]/approve` via `features/feedback/api/routes/adminApprove.ts`
- **Server service/repository:** currently route calls `approveFeedback()` in `features/feedback/server/repository.ts` directly
- **Store/source:** Postgres `userFeedback`
- **Current owner:** Feedback feature
- **Correct owner:** Feedback feature
- **Existing tests:** `features/feedback/__tests__/integration/ApprovalModal.test.tsx`, `features/feedback/__tests__/integration/AdminFeedbackPage.test.tsx`, `features/feedback/__tests__/api/routes/adminApprove.test.ts`
- **Missing tests:** normalized state-semantic tests proving approval transitions from `awaiting_approval` back to eligible `classified`; service-layer approval rules; Playwright approve flow

### 3.6 Navigation and route ownership

- **Sidebar ownership:** `features/layout/lib/navConfig.ts` already owns "My feedback" and "Feedback queue"
- **Shell routes:** `app/(shell)/feedback/page.tsx`, `app/(shell)/feedback/[id]/page.tsx`, `app/(shell)/admin/feedback/page.tsx`
- **Auth route:** `app/(auth)/product-validation/page.tsx`
- **API dispatcher:** `app/api/[...slug]/route.ts` delegates to `handleFeedbackRoute()` and `handleAdminFeedbackRoute()`
- **Current owner:** Feedback feature for feature pages/routes; layout feature for nav
- **Existing tests:** feedback page integration and route tests; nav-specific coverage not yet confirmed for the new items
- **Missing tests:** sidebar/admin visibility coverage for the feedback links; admin metrics summary card coverage

### 3.7 Admin metrics feedback entry point

- **Rendering component:** currently `app/(shell)/admin/metrics/page.tsx`
- **Current behavior:** page still renders legacy `AdminFeedbackSection`, not the compact queue summary card described in the product direction
- **Correct behavior owner:** feedback feature summary component embedded in admin metrics page
- **Existing tests:** `features/feedback/__tests__/integration/AdminFeedbackSection.test.tsx` for the legacy section
- **Missing tests:** queue summary card rendering, count, and link to `/admin/feedback`

### 3.8 Automation: classify pipeline

- **Scripts:** `scripts/feedback-requeue.ts`, `scripts/feedback-dedupe.ts`, `scripts/run-classify.ts`
- **Current behavior:** requeue reads submitted rows; dedupe compares PR number and message similarity; classify invokes Claude with JSON schema validation and fail-closed parsing
- **Current owner:** feedback feature logically owns this workflow, but the script layer still carries business rules that should be moved behind a feedback server service
- **Existing tests:** `scripts/__tests__/feedback-requeue.test.ts`, `scripts/__tests__/feedback-dedupe.test.ts`, `scripts/__tests__/run-classify.test.ts`
- **Missing tests:** service-layer classification application; no-DB-mutation on malformed output at service boundary; dry-run and daily-plan tests; PR-sync / merge-hook tests

### 3.9 Architecture findings

- **Type owner decision:** `features/feedback/types.ts` is the correct canonical type owner.
- **Duplicate type risk:** low today; the main risk is workflow semantics drifting across UI, routes, repository, and scripts.
- **Existing import pattern followed:** feature types are imported from `@/features/feedback/types`.
- **Existing service function used or extended:** missing. This is the main architecture gap. Routes and scripts should stop calling repository functions directly for workflow mutations.
- **Raw store access avoided:** not yet. Repository exists, but there is no `features/feedback/server/service.ts` boundary for workflow rules.
- **Postgres readiness:** good on persistence; weak on business-rule centralization.

---

## 4. Source-of-Truth Decision

### 4.1 Owner

The **feedback feature** remains the source of truth for:
- feedback submission
- triage metadata
- duplicate linkage
- approval state
- PR linkage
- preview/UAT linkage
- shipped/changelog metadata

### 4.2 Ownership correction

V2 explicitly introduces `features/feedback/server/service.ts` as the business-rule owner between:
- API routes and the repository
- automation scripts and the repository

This is required because workflow transitions are now real business logic, not simple CRUD.

### 4.3 Tracking object

Keep `userFeedback` as the primary tracked object in V2:
- no separate work-item table
- no run-history table in V2
- multiple feedback rows may point to the same `prNumber`

That preserves the product direction while keeping implementation scope controlled.

---

## 5. UI Pattern Audit

### 5.1 Feedback hub page

- **Current pattern:** shell page with list of clickable feedback cards
- **Closest approved pattern:** shared shell page width + `page-title` + read-only list cards
- **Current icons:** emoji sentiment markers
- **Required icons:** sentiment marker may remain; status badges must keep text, not color-only meaning
- **Confirmation pattern:** none
- **Reuse/extend/replace:** extend current page; do not redesign route ownership
- **Shell/page-width compliance:** yes, already under `(shell)`
- **Tests required:** loading, empty, populated, navigation, duplicate callout when present

### 5.2 Feedback detail page

- **Current pattern:** read-only detail card plus PR/shipped callouts
- **Closest approved pattern:** shell page with key-value sections and explicit status callouts
- **Current icons:** emoji sentiment marker
- **Required icons:** preview/external-link affordance may remain text-based; badges must stay text-labeled
- **Confirmation pattern:** none in user mode
- **Reuse/extend/replace:** extend current page
- **Shell/page-width compliance:** yes
- **Tests required:** loading, error, owner/admin authorization, duplicate callout, preview/UAT section, shipped/changelog section

### 5.3 Admin feedback queue

- **Current pattern:** list page with filter controls and approval modal
- **Closest approved pattern:** shell page with prominent filter bar and app-styled confirmation
- **Current icons:** emoji sentiment markers; badges
- **Required icons:** keep text badges; icon-only actions must have labels if introduced
- **Confirmation pattern:** app-styled modal already exists; keep it and do not use `window.confirm`
- **Reuse/extend/replace:** extend current page, but move filters to URL-backed state and use front-end service wrappers
- **Shell/page-width compliance:** yes
- **Tests required:** filter persistence in URL, approval modal flow, no inline status drift, empty/loading/error states

### 5.4 Admin metrics feedback entry

- **Current pattern:** full embedded `AdminFeedbackSection`
- **Closest approved pattern:** compact summary card linking to the owning queue page
- **Current icons:** none required
- **Required icons:** optional queue/link affordance only if it matches existing admin metrics cards
- **Confirmation pattern:** none
- **Reuse/extend/replace:** replace the embedded section with a compact summary card; the full operational queue belongs on `/admin/feedback`
- **Shell/page-width compliance:** yes
- **Tests required:** summary count + link

### 5.5 Feedback popup

- **Current pattern:** floating dialog/panel
- **Closest approved pattern:** existing product feedback popup pattern already in use
- **Current icons:** emoji sentiments and chat bubble
- **Required icons:** keep accessible labels on trigger, close, and sentiment buttons
- **Confirmation pattern:** none
- **Reuse/extend/replace:** reuse current implementation
- **Tests required:** submit success link, structured feedback link, route preservation

---

## 6. Acceptance Criteria

### 6.1 Workflow semantics

- `awaiting_approval` means "triaged but blocked pending admin approval."
- Admin approval moves a row from `awaiting_approval` to `classified` and writes `adminApprovedAt` + `adminApprovedByUserId`.
- `classified` means "eligible for future planning if policy allows."
- The UI never shows an approve button on already-eligible `classified` rows.

### 6.2 User surfaces

- From any page, a user can submit feedback from the popup and then navigate to `/feedback` from the success state.
- `/feedback` shows only the signed-in user's rows.
- `/feedback/[id]` returns 403 for another user's row unless the viewer is an app admin.
- The feedback detail page shows duplicate linkage, PR/preview/UAT linkage, and shipped/changelog metadata when present.

### 6.3 Admin surfaces

- `/admin/feedback` shows all feedback rows for admins only.
- Filter state persists in the URL and survives refresh.
- Approving an `awaiting_approval` row updates the row to `classified` without a full page reload.
- `/admin/metrics` shows a compact feedback queue summary card, not the full embedded operational table.

### 6.4 Classification automation

- `npm run steward:classify` only mutates rows after dedupe/classify output passes validation.
- Malformed or incomplete classify output exits non-zero and does not write partial triage.
- Duplicate cancellation only happens when duplicate rules are satisfied; otherwise the row remains unmodified or proceeds to classification.

### 6.5 Daily plan / execute automation

- `npm run steward:daily --dry-run` produces a validated plan artifact and makes no DB or git mutations.
- Live `npm run steward:daily` does not update feedback rows to `in_pr` until PR creation succeeds.
- If plan generation or execution fails, rows remain in their pre-run state.
- Every plan and PR body carries feedback-specific UAT instructions and feedback ID links.

### 6.6 Shipping lifecycle

- PR-sync writes `prNumber`, `previewUrl`, and `status='in_pr'` only after the PR exists.
- Transition to `in_qa` happens only after preview URL and UAT instructions are present.
- Merge-hook marks rows `shipped` only after merge into `dev` is confirmed.

---

## 7. Data Model / Contract Changes

### 7.1 Row model

Keep the current `userFeedback` columns already introduced in Wave 1/2:
- `status`
- `featureArea`
- `feedbackType`
- `riskLevel`
- `confidence`
- `duplicateOfFeedbackId`
- `adminApprovedAt`
- `adminApprovedByUserId`
- `prNumber`
- `previewUrl`
- `uatInstructions`
- `versionResolved`
- `resolvedAt`
- `changelogVersion`
- `changelogLabel`
- `changelogUserCredit`

No new workflow table is added in V2.

### 7.2 Exact state transitions

| From | To | Trigger | Owner |
|---|---|---|---|
| `submitted` | `cancelled` | duplicate confirmed | feedback service |
| `submitted` | `classified` | valid classify output and no approval required | feedback service |
| `submitted` | `awaiting_approval` | valid classify output but approval required | feedback service |
| `awaiting_approval` | `classified` | admin approval | feedback service |
| `classified` | `in_pr` | PR created successfully and row attached | feedback service |
| `in_pr` | `in_qa` | preview URL + UAT instructions written | feedback service |
| `in_pr` or `in_qa` | `shipped` | merge into `dev` confirmed | feedback service |
| any non-`shipped` | `cancelled` | explicit duplicate/manual stop | feedback service |

### 7.3 Classify contract

`run-classify.ts` must treat the Claude output as valid only if it matches this exact contract:

```json
{
  "status": "classified",
  "featureArea": "dashboard",
  "feedbackType": "ux",
  "riskLevel": "low",
  "confidence": "high",
  "recommendation": "Clarify the dashboard button label and styling."
}
```

Required rules:
- no extra fields required for DB mutation
- no partial writes on malformed output
- fail closed on missing/invalid enum values

### 7.4 Daily plan artifact contract

Before any execute step, `run-daily.ts` must validate a JSON artifact with at least:

```json
{
  "version": 1,
  "generatedAt": "2026-05-25T11:40:00.000Z",
  "feedbackIds": ["fb_1", "fb_2"],
  "eligibilitySnapshot": {
    "autoEligibleIds": ["fb_1"],
    "approvedIds": ["fb_2"]
  },
  "workstreams": [
    {
      "featureArea": "dashboard",
      "summary": "Tighten dashboard feedback fixes",
      "allowedFiles": ["features/dashboard/**", "features/feedback/**"],
      "testPlan": [
        "npm test -- --runInBand features/dashboard/__tests__/integration/Dashboard.test.tsx"
      ],
      "uatByFeedbackId": {
        "fb_1": ["Open Render preview", "Visit dashboard", "Verify updated button copy"]
      }
    }
  ]
}
```

The execute step must refuse to run if:
- JSON is invalid
- `feedbackIds` are empty
- `allowedFiles` are missing
- `uatByFeedbackId` does not cover every included feedback row

---

## 8. API / Store / Service Plan

### 8.1 Add `features/feedback/server/service.ts`

This file becomes the workflow rule owner. Planned functions:

- `submitFeedbackFromUser(authCtx, input)`
- `listFeedbackForViewer(authCtx)`
- `getFeedbackDetailForViewer(authCtx, id)`
- `listAdminQueue(filters)`
- `approveFeedbackForPlanning(id, adminEmail)`
- `applyClassification(id, classifyOutput)`
- `markFeedbackDuplicate(id, duplicateOfId)`
- `markFeedbackInPr(id, workflowData)`
- `markFeedbackInQa(id, workflowData)`
- `markFeedbackShippedByPr(prNumber, versionData)`
- `listSubmittedFeedbackForClassification()`
- `listEligibleFeedbackForDailyRun()`

Routes and scripts should call these service functions, not the repository directly.

### 8.2 Repository scope

`features/feedback/server/repository.ts` stays responsible for persistence primitives only:
- row reads
- filtered row reads
- primitive updates/inserts

It should not own approval semantics, duplicate policy, or PR-state transition policy.

### 8.3 API route changes

- `userList.ts`, `userDetail.ts`, `adminList.ts`, and `adminApprove.ts` should call the new service layer.
- Add parameter validation at the route layer for admin filter enums before passing to the service.
- Keep `ApiResponse<T>` response shape.

### 8.4 Front-end service changes

Extend `features/feedback/front/services/api.ts` with:
- `listAdminFeedback(filters)`
- `approveAdminFeedback(id)`

The admin page should stop using raw `fetch()` and use the shared service wrapper for consistent error handling.

### 8.5 Automation file plan

- Keep the current `steward:requeue`, `steward:dedupe`, and `steward:classify` entry points.
- Add `scripts/run-daily.ts`
- Add `scripts/pr-sync.ts`
- Add `scripts/merge-hook.ts`
- Add `scripts/feedback-notify.ts`
- Add `config/feedback-steward/do-not-automate.json`
- Add `tmp/feedback-steward/` for machine artifacts; keep human-readable plans in `docs/bug_enhancement/`

---

## 9. UI Plan

### 9.1 Feedback hub

- Keep current shell route and list-card navigation.
- Add duplicate callout when `duplicateOfFeedbackId` exists.
- Preserve `page-title` and approved shell width.
- Empty state should explain next action: submit feedback from the popup.

### 9.2 Feedback detail

- Keep back link, status badge, message section, PR section, and shipped section.
- Add explicit duplicate callout with link to the canonical row.
- Add changelog attribution section when `changelogVersion` or `changelogUserCredit` exists.

### 9.3 Admin queue

- Keep approval modal pattern.
- Move filters to URL-backed state (`useSearchParams` + push/replace).
- Use `awaiting_approval` as the only queue state that shows the approve action.
- Keep UAT in collapsible details.
- Show duplicate linkage and PR linkage clearly on each row.

### 9.4 Admin metrics

- Replace embedded `AdminFeedbackSection` with a compact feedback summary card:
  - unreviewed count
  - awaiting approval count
  - in PR count
  - link to `/admin/feedback`

### 9.5 Navigation

- Keep sidebar links currently in `navConfig.ts`
- Add or update tests proving:
  - "My feedback" is always visible
  - "Feedback queue" is admin-only

---

## 10. Testing Plan

Write the smallest failing tests first for each phase.

### 10.1 Unit tests

Fail first:
- `features/feedback/__tests__/api/service.test.ts`
  - `approveFeedbackForPlanning()` moves `awaiting_approval` -> `classified`
  - high-confidence low-risk classification stays `classified`
  - medium/high-risk classification becomes `awaiting_approval`
  - duplicate confirmation sets `cancelled` + `duplicateOfFeedbackId`
  - daily-run eligibility respects `status`, `adminApprovedAt`, `confidence`, `riskLevel`, and do-not-automate config

- `scripts/__tests__/run-classify.test.ts`
  - malformed output does not mutate DB
  - schema-valid output applies classification through the service

- `scripts/__tests__/run-daily.test.ts`
  - dry-run writes plan artifact only
  - invalid plan artifact exits non-zero with no DB mutation

### 10.2 API tests

Fail first:
- `features/feedback/__tests__/api/routes/adminApprove.test.ts`
  - approving `awaiting_approval` returns success and row becomes `classified`
  - approving a non-awaiting row is rejected or no-op per chosen rule

- `features/feedback/__tests__/api/routes/adminList.test.ts`
  - enum filters are validated
  - combined filters preserve exact response shape

- add submit route test coverage if not present:
  - authenticated submit succeeds
  - missing auth is rejected

### 10.3 Integration tests

Fail first:
- `features/feedback/__tests__/integration/AdminFeedbackPage.test.tsx`
  - approve button only appears for `awaiting_approval`
  - filter state is reflected in URL and restored on reload

- `features/feedback/__tests__/integration/FeedbackDetailPage.test.tsx`
  - duplicate callout renders with link
  - changelog metadata renders when present

- add admin metrics integration test
  - summary card renders with link to `/admin/feedback`

- add nav integration coverage
  - user/admin visibility of feedback links

### 10.4 Playwright tests

Add targeted Playwright coverage once the UI semantics are normalized:
- user submits feedback from popup, lands on hub, opens detail
- admin opens queue, filters to awaiting approval, approves item, sees row leave awaiting state

If the existing Playwright setup is unstable, say so in implementation notes, but still add the targeted spec file and run it if the environment allows.

---

## 11. Build Phases

### Phase 0 - Normalize workflow semantics and service ownership

Files:
- `features/feedback/server/service.ts` (new)
- `features/feedback/server/repository.ts`
- `features/feedback/types.ts`
- `features/feedback/api/routes/adminApprove.ts`
- `features/feedback/api/routes/adminList.ts`
- `features/feedback/api/routes/userList.ts`
- `features/feedback/api/routes/userDetail.ts`
- relevant tests

Goal:
- centralize business rules
- fix approval semantics
- remove route-level workflow drift

### Phase 1 - Finish user/admin UI alignment

Files:
- `features/feedback/front/services/api.ts`
- `features/feedback/front/pages/AdminFeedbackPage.tsx`
- `features/feedback/front/pages/FeedbackDetailPage.tsx`
- `app/(shell)/admin/metrics/page.tsx`
- nav tests / metrics tests

Goal:
- stop raw admin `fetch()`
- align UI with normalized workflow states
- replace admin metrics embed with summary entry point

### Phase 2 - Lock classify automation

Files:
- `scripts/feedback-requeue.ts`
- `scripts/feedback-dedupe.ts`
- `scripts/run-classify.ts`
- `scripts/__tests__/*`
- `.claude/feedback-classify.md`

Goal:
- keep current hardening
- move mutation rules behind feedback service
- make classify behavior fully test-directed

### Phase 3 - Add daily plan dry-run

Files:
- `scripts/run-daily.ts`
- `config/feedback-steward/do-not-automate.json`
- `scripts/__tests__/run-daily.test.ts`
- `.claude/feedback-daily-plan.md`

Goal:
- generate validated plan artifacts
- no DB/git mutation in dry-run mode

### Phase 4 - Execute / PR lifecycle

Files:
- `.claude/feedback-execute.md`
- `scripts/pr-sync.ts`
- `scripts/merge-hook.ts`
- `scripts/feedback-notify.ts`
- corresponding tests

Goal:
- attach rows to PRs safely
- move rows through `in_pr`, `in_qa`, and `shipped`
- keep every step fail-closed

---

## 12. Out of Scope

- Email delivery via Resend
- Anonymous changelog attribution
- A separate automation-run history table
- Fully automatic merge to `dev`
- Auto-execution of do-not-automate categories:
  - auth
  - security
  - database migrations
  - privacy-sensitive changes
  - architecture-wide refactors

---

## 13. Manual QA Plan

### User flow

1. Sign in as a non-admin user.
2. Open the feedback popup from the dashboard.
3. Select a sentiment, enter a message, submit.
4. Click "View your feedback ->".
5. Confirm `/feedback` shows the new row only for that user.
6. Open the row.
7. Confirm detail page shows message, status, and page path.

### Admin approval flow

1. Seed or update one feedback row to `awaiting_approval`.
2. Sign in as an admin.
3. Open `/admin/feedback`.
4. Filter by status `awaiting_approval`.
5. Confirm the row appears with an approve action.
6. Approve it through the app-styled modal.
7. Confirm the row becomes `classified`, shows `adminApprovedAt`, and no longer offers approve.

### Metrics entry point

1. Open `/admin/metrics`.
2. Confirm a compact feedback summary card is present.
3. Click its queue link.
4. Confirm navigation lands on `/admin/feedback`.

### Classify script

1. Insert at least one submitted feedback row.
2. Run `npm run steward:classify`.
3. Confirm valid rows become `classified` or `awaiting_approval`.
4. Confirm duplicate rows become `cancelled` with `duplicateOfFeedbackId`.
5. Force malformed classify output in a test or local mock.
6. Confirm no partial triage write occurs.

### Daily dry-run

1. Prepare one auto-eligible row and one admin-approved row.
2. Run `npm run steward:daily --dry-run`.
3. Confirm a JSON artifact is written to `tmp/feedback-steward/`.
4. Confirm no `prNumber`, `previewUrl`, or status mutation is written to the DB.

---

## 14. Branch and Commit Plan

Recommended branch:

```txt
enhancement/feedback-steward-v2
```

Recommended commit sequence:

```txt
test(feedback): cover workflow state semantics and service rules
feat(feedback): add feedback service layer and normalize approval flow
test(feedback): cover admin queue URL filters and metrics summary
feat(feedback): align admin surfaces and feedback services
test(steward): cover classify contract and duplicate guards
feat(steward): route classify mutations through feedback service
test(steward): cover daily dry-run plan validation
feat(steward): add steward daily planning dry-run
test(steward): cover pr sync and merge lifecycle
feat(steward): complete feedback steward pr lifecycle
```

---

## 15. Risks and Rollback

### Main risks

- **Workflow semantic confusion:** current code and V1 plan disagree about approval semantics.
- **Duplicate false positives:** simplistic similarity can cancel the wrong row.
- **Partial automation mutation:** plan generation or execute failure could leave rows in inconsistent states.
- **UI drift:** admin metrics page still uses legacy embed rather than the dedicated queue model.
- **Playwright instability:** user-visible regression coverage may be blocked by unrelated suite instability.

### Mitigations

- Move workflow rules into `server/service.ts`
- Keep duplicate auto-cancel policy narrow and tested
- Validate every machine artifact before mutation
- Require dry-run before live daily execution
- Add targeted Playwright specs even if the full suite is unstable

### Rollback

- Each phase is intentionally reversible:
  - Phase 0 can roll back to repository-only behavior
  - Phase 1 can roll back UI/service wrappers without touching DB schema
  - Phase 2/3/4 can be disabled by removing steward scripts from operational use while keeping the user/admin UI intact
- Do not couple UI rollout to live cron automation until dry-run and manual verification pass

---

## Guiding implementation rule

Do not resume feature building from the old V1 assumption that "shape complete" means "workflow correct."  
For every remaining steward slice, the directing standard is:

1. failing test first  
2. single owner for business rules  
3. validated machine contract before mutation  
4. observable user/admin behavior  
5. dry-run before live automation
