# Feedback Steward — Wave 6 Plan

**Branch:** `enhancement/feedback-steward-wave6` off `dev`  
**Status:** Active — directing document for Wave 6 work  
**Preceded by:** `20260525-1140-feedback-steward-plan-v2_archive.md` (Waves 1–5 complete)  
**Date:** 2026-05-25

---

## 1. Gate: User Testing First

**No Wave 6 dev begins until user testing is complete.**

The full pipeline is now operational:
- Feedback submission → classify → daily plan → execute → merge-hook → notify
- Admin queue, approval flow, and shipped display are all wired
- Submitter and admin detail pages show full lifecycle state

User testing should validate:
1. The submission-to-detail flow feels coherent to a non-admin user
2. Admin approval workflow is discoverable and semantically clear
3. Shipped state is satisfying to see as a submitter

Feedback from user testing will determine which Wave 6 items actually get built and in what order. Do not start implementation until test findings are in hand.

---

## 2. Scope

Wave 6 completes the remaining plan items that were explicitly deferred, plus closes gaps discovered during Waves 4–5. It does **not** include items still listed as out of scope in the V2 plan (email via Resend, merge automation, separate run-history table).

### In scope

| Item | Priority | Reason |
|------|----------|--------|
| URL-backed admin filters | High | Usability gap today — filters reset on page refresh |
| Admin metrics summary card | High | Plan item 9.4 still showing old embedded table |
| `pr-sync.ts` | Medium | Needed for `in_pr` → `in_qa` transition without manual merge-hook re-runs |
| Playwright e2e coverage | Medium | Plan item 10.4 — targeted submit → hub → detail and admin approve flows |

### Contingent on user test findings

- If users find the submission flow confusing: revisit popup success state and hub empty state copy
- If admin approval is non-discoverable: add a notification badge or highlight to the queue nav item
- If shipped state is not satisfying: consider an in-app "thank you" callout on the detail page

### Out of scope (Wave 7+)

- Email delivery via Resend
- Fully automatic merge to dev
- Anonymous changelog attribution
- Automation run-history table

---

## 3. Item Detail

### 3.1 URL-backed admin filters

**Problem:** Changing a filter in `/admin/feedback` updates the view but not the URL. Refreshing or sharing the URL loses filter state. The plan (9.3) requires `useSearchParams` + router push/replace.

**Acceptance criteria:**
- Selecting a filter updates `?status=awaiting_approval` (etc.) in the URL without a full reload
- Loading `/admin/feedback?status=awaiting_approval` applies the filter immediately
- Refreshing preserves the filter
- Filter combinations compose correctly in the query string
- Existing integration tests are updated; new tests verify URL round-trip behaviour

**Files to touch:**
- `features/feedback/front/pages/AdminFeedbackPage.tsx`
- `features/feedback/__tests__/integration/AdminFeedbackPage.test.tsx`
- `features/feedback/front/services/api.ts` — switch from raw `fetch` to `listAdminFeedback` wrapper (plan 8.4 deviation, fix here)

**Test plan:**
- Unit: URL param parsing and filter state initialization
- Integration: filter changes update URL; URL params restore filter state; combined filters compose

---

### 3.2 Admin metrics summary card

**Problem:** `/admin/metrics` still embeds the full `AdminFeedbackSection` operational table. The plan (9.4) calls for a compact card: unreviewed count, awaiting approval count, in-PR count, link to `/admin/feedback`.

**Acceptance criteria:**
- A compact feedback summary card appears on `/admin/metrics`
- Card shows at minimum: count of `submitted` rows, count of `awaiting_approval` rows, count of `in_pr` rows
- Card has a visible link to `/admin/feedback`
- The full `AdminFeedbackSection` embedded table is removed from the metrics page
- Tests cover: card renders with counts and link; link navigates to queue

**Files to touch:**
- `app/(shell)/admin/metrics/page.tsx` — remove `AdminFeedbackSection`, add summary card
- `features/feedback/front/components/FeedbackSummaryCard.tsx` — new compact component
- `features/feedback/__tests__/integration/FeedbackSummaryCard.test.tsx` — new test file
- `features/feedback/api/routes/adminList.ts` or a dedicated summary route — provide aggregated counts

**API design:**
- Simplest option: call `GET /api/admin/feedback` three times with different status filters. Fast to implement, slightly chatty.
- Better option: add `GET /api/admin/feedback/summary` returning `{ submitted: N, awaiting_approval: N, in_pr: N }`. One request, naturally cacheable.

**Recommendation:** Add the summary route. It keeps the component clean and avoids three waterfall fetches.

**Test plan:**
- Unit: summary route handler returns correct counts
- Integration: `FeedbackSummaryCard` renders count and link; loading state; error state

---

### 3.3 `pr-sync.ts`

**Problem:** Once a PR is created and rows are marked `in_pr`, the `previewUrl` may not be available immediately. Currently the only way to transition `in_pr` → `in_qa` is to re-run the execute agent or manually update the row. `pr-sync.ts` periodically polls GitHub for PR state and writes back preview URL and merged status.

**Acceptance criteria:**
- `npm run steward:pr-sync` checks all `in_pr` rows and their associated PRs
- If a PR now has a Render deploy preview URL, writes it back and transitions the row to `in_qa`
- If a PR is merged into `dev`, calls `markFeedbackShippedByPr` (same logic as merge-hook)
- Does not re-run if the row is already `in_qa` or `shipped`
- Exits cleanly with a summary of what was updated
- Fail-closed: a failed GitHub API call leaves the row unchanged

**Files to touch:**
- `scripts/pr-sync.ts` — new script
- `scripts/__tests__/pr-sync.test.ts` — new tests
- `package.json` — add `steward:pr-sync` script

**Test plan:**
- `in_pr` row with preview URL now available → transitions to `in_qa`
- `in_pr` row with merged PR → calls `markFeedbackShippedByPr`
- Already `in_qa` row → skipped
- `gh` CLI failure → row unchanged, non-zero exit

---

### 3.4 Playwright e2e coverage

**Targeted specs only** — do not attempt full suite if Playwright environment is unstable.

**Spec 1 — User submit → hub → detail:**
1. Sign in as non-admin user (dev bypass)
2. Open feedback popup from dashboard
3. Select sentiment, enter message, submit
4. Click "View your feedback →" from success state
5. Assert `/feedback` shows the new row
6. Click the row
7. Assert `/feedback/[id]` shows message, status, page path

**Spec 2 — Admin approve flow:**
1. Sign in as admin user
2. Seed or update one row to `awaiting_approval`
3. Navigate to `/admin/feedback`
4. Filter by status `awaiting_approval`
5. Click approve, confirm in modal
6. Assert row badge changes to `classified`, approve button disappears

**Files:**
- `features/feedback/__tests__/e2e/feedback-user-flow.spec.ts`
- `features/feedback/__tests__/e2e/feedback-admin-approve.spec.ts`

**Note:** If Playwright environment is unreliable on Windows/dev, implement the spec files and document the manual equivalent. Do not block Wave 6 on Playwright stability.

---

## 4. Prerequisite Audit (run before coding each item)

Before touching any file:

1. `git fetch origin && git merge origin/dev` — sync with dev
2. Read the actual component/route file before editing — do not rely on memory of what it contained
3. Confirm `AdminFeedbackPage` imports and filter state before adding `useSearchParams` — Next.js App Router requires `useSearchParams` to be inside a `Suspense` boundary
4. For the summary route: verify `app/api/[...slug]/route.ts` dispatches to `handleAdminFeedbackRoute()` and that `adminList.ts` does not already have a `/summary` case

---

## 5. TDD Rules (same as all prior waves)

1. Write the smallest failing test first
2. Implement until it passes
3. Refactor if needed
4. `npm run build` and `npm test` must pass before commit

---

## 6. Commit Plan

```
test(feedback): cover URL filter state round-trip in admin queue
feat(feedback): add URL-backed filters to admin feedback page

test(feedback): cover feedback summary card rendering and counts
feat(feedback): add feedback summary card to admin metrics

test(steward): cover pr-sync preview URL writeback and merge detection
feat(steward): add pr-sync script for in_pr row state updates

test(feedback): add targeted Playwright specs for submit and approve flows
```

---

## 7. Manual QA Plan (post-implementation, before merge to master)

### Filter persistence
1. Open `/admin/feedback`
2. Set status filter to `awaiting_approval`
3. Confirm URL contains `?status=awaiting_approval`
4. Refresh — confirm filter is still applied and rows are filtered
5. Copy URL, open in new tab — confirm same filter state

### Metrics card
1. Open `/admin/metrics`
2. Confirm compact feedback card is present with three counts
3. Confirm no full operational table on the page
4. Click queue link — confirm navigation to `/admin/feedback`

### PR sync
1. Ensure at least one row is `in_pr` with no `previewUrl`
2. Run `npm run steward:pr-sync`
3. If the associated PR has a Render deploy, confirm row transitions to `in_qa`
4. Confirm no mutation occurs for already-`in_qa` or `shipped` rows

### Playwright specs
1. Run `npm run test:e2e` against a built app with seed data
2. Confirm both specs pass or document any environmental blocker
