# Feedback Steward — Implementation Plan

**Branch:** `dev`
**Status:** Approved direction. Ready to execute wave by wave.

---

## Summary

The feedback steward feature adds complete lifecycle management for user feedback submissions. It introduces a user-facing feedback hub (`/feedback`), an admin operations queue (`/admin/feedback`), automated triage and classification via Claude, daily plan generation, and PR-driven execution. Users can view their feedback history and track status from submission through resolution. Admins classify, approve, and route feedback through PRs. Daily automation scripts group eligible items into one grouped plan, execute that plan via PR, and track resolution. This spans five waves: schema/types/routes (Wave 1), admin UI polish (Wave 2), automation scripts (Wave 3), daily planning and execution (Wave 4), and PR/notification closure (Wave 5).

---

## Planning Mode

**Mode 4 — New Feature**

This is a substantial new capability spanning multiple feature surfaces (user hub, admin queue, automation layer). It introduces a data model, validation, API routes, UI pages, tests, scripts, and a daily automation workflow. The feature builds in waves to preserve dependency order and test coverage at each phase.

---

## Current Code Path Audit

### Existing: User feedback submission

**Component:** `features/feedback/front/components/FeedbackButton.tsx` (popup)  
**Data provider:** None (form-driven)  
**API route:** `POST /api/feedback` → `features/feedback/api/routes/submit.ts`  
**Server:** `features/feedback/server/repository.ts` → `insertFeedback()`  
**Database:** `userFeedback` table (basic schema: id, userId, householdId, userEmail, pagePath, sentiment, message, createdAt)  
**Current owner:** Feedback feature  
**Tests:** Unit test exists for submit route (`submit.test.ts`)

### New: User feedback hub

**Component:** `features/feedback/front/pages/FeedbackHubPage.tsx` (NEW)  
**Data provider:** Fetches from `GET /api/feedback` (NEW route)  
**API route:** `GET /api/feedback` → `features/feedback/api/routes/userList.ts` (NEW)  
**Server:** `listFeedbackByUserId(userId)` (NEW)  
**Database:** Extended `userFeedback` table with status, triage, and PR metadata (NEW columns)  
**Tests:** None yet (NEW)

### New: User feedback detail page

**Component:** `features/feedback/front/pages/FeedbackDetailPage.tsx` (NEW)  
**Data provider:** Fetches from `GET /api/feedback/[id]` (NEW route)  
**API route:** `GET /api/feedback/[id]` → `features/feedback/api/routes/userDetail.ts` (NEW)  
**Server:** `getFeedbackById(id)` (NEW)  
**Database:** `userFeedback` table  
**Tests:** None yet (NEW)

### New: Admin feedback queue

**Component:** `features/feedback/front/pages/AdminFeedbackPage.tsx` (NEW)  
**Data provider:** Fetches from `GET /api/admin/feedback` (existing route, extended with filters)  
**API route:** `GET /api/admin/feedback?status=...&confidence=...` (existing, extended)  
**Server:** `listFeedbackForAdmin(filters)` (NEW)  
**Database:** `userFeedback` table with new columns  
**Tests:** None yet (NEW)

### New: Admin feedback approval

**Component:** Approve button in `AdminFeedbackPage.tsx`  
**API route:** `POST /api/admin/feedback/[id]/approve` (NEW)  
**Server:** `approveFeedback(id, adminUserId)` (NEW)  
**Database:** Writes `adminApprovedAt`, `adminApprovedByUserId`, status → `classified`  
**Tests:** None yet (NEW)

### Navigation entry points (existing surfaces, modified)

**Feedback popup** (`FeedbackButton.tsx`): Add post-submit link to `/feedback` and product-validation link. Test needed.  
**Sidebar nav:** Add "My feedback" link pointing to `/feedback`. Test needed.  
**Admin sidebar:** Add "Feedback queue" link pointing to `/admin/feedback`. Test needed.  
**Admin metrics page:** Add summary card with unreviewed count + link. Test needed.

### Automation (completely new layer, Waves 3-5)

**Scripts:** `scripts/feedback-requeue.ts`, `scripts/feedback-dedupe.ts`, `scripts/run-classify.ts`, `scripts/run-daily.ts`, `scripts/pr-sync.ts`, `scripts/merge-hook.ts`, `scripts/feedback-notify.ts` (ALL NEW)  
**Skills:** `.claude/feedback-classify.md`, `.claude/feedback-daily-plan.md`, `.claude/feedback-execute.md`, `.claude/feedback-uat.md`, `.claude/feedback-changelog.md` (ALL NEW)  
**Tests:** Unit tests for script behavior (NEW)

---

## Source-of-Truth Decision

**Owner:** The feedback feature owns all feedback data — submissions, triage metadata, approvals, PR linking, and resolution tracking.

**Rationale:** Feedback is submitted to the feedback system, classified and routed by the feedback feature's automation layer, and resolved through PR linkage. No other feature owns feedback lifecycle.

**Violations:** None identified. The feature's scope is bounded and does not depend on ownership disputes.

**External integration:** Admin users (identified by `requireAdminApi` gate) approve feedback, but they do not "own" feedback in the data model sense. They are actors in the workflow. The feature service makes the approval call; the admin supplies the trigger.

---

## UI Pattern Audit

### Feedback Hub Page (`/feedback`)

**Existing visual pattern:** None (new page)  
**Approved pattern per style guide:** Page title (`h1.page-title`), list of cards with action icons, empty state message.  
**Current icons:** None defined yet  
**Required icons:** Sentiment icon (smiley, frown, neutral per sentiment value), status badge (color-coded), PR number chip  
**Confirmation pattern required:** None (hub is read-only; clicking row navigates to detail)  
**Shell compliance:** Page is under `(shell)` layout — AppShell provided automatically. Verified.  
**Pattern reuse:** Reuse approved card + list pattern from existing features (attendance, portfolio).  
**Accessibility:** Keyboard-navigable list, aria labels on sentiment icon, proper heading hierarchy.  
**Tests:** Integration test covering loading/empty/populated states, row click navigation.

### Feedback Detail Page (`/feedback/[id]`)

**Existing visual pattern:** None (new page)  
**Approved pattern:** Status badge (prominent), key-value display pairs, links to external resources (preview URL as styled button), collapsible sections (UAT instructions).  
**Current icons:** None  
**Required icons:** Status badge color + text, PR icon if PR number set, external link icon for preview URL  
**Confirmation pattern:** None (read-only for users; approve button in admin view uses app-styled confirmation)  
**Shell compliance:** Under `(shell)` layout.  
**Role-gated rendering:** Single component, `isAdmin` boolean gates admin-only sections (triage metadata, approve button, admin approval timestamp).  
**Accessibility:** Proper text labels on all badges, aria labels on icon-only buttons.  
**Tests:** Integration tests for loading/populated/not-found/forbidden states, admin vs. user rendering variants.

### Admin Feedback Queue Page (`/admin/feedback`)

**Existing visual pattern:** None (new page)  
**Approved pattern:** Sticky/prominent filter bar with dropdowns, dense card/table layout for operational queue, action buttons per row.  
**Current icons:** None  
**Required icons:** Status badge (color-coded), risk badge (warning color for high), confidence badge, sentiment icon, PR chip  
**Confirmation pattern:** Approve button triggers app-styled confirmation (not `window.confirm`).  
**Filter behavior:** Filter state updates query params; fetches refetch without full page reload (debounced).  
**Shell compliance:** Under `(shell)` layout.  
**Accessibility:** Keyboard-accessible filter dropdowns, aria labels on action buttons, proper heading hierarchy.  
**Tests:** Integration tests covering filter interaction, approve button flow, duplicate display, empty state.

### Feedback Popup Footer Links (modified `FeedbackButton.tsx`)

**Current pattern:** Post-submit toast/confirmation message  
**Modification:** Add two links to the footer:
- After submit success: "Submitted! [View your feedback →]" link to `/feedback`
- Always visible (pre- and post-submit): "Want structured feedback? [Share here →]" link to `/product-validation` (secondary style, small)

**Accessibility:** Links are focusable, keyboard-navigable.  
**Tests:** Unit test confirming both links render.

### Sidebar Navigation (modified)

**User section:** Add "My feedback" nav item pointing to `/feedback`. Match existing nav style and active-state behavior.  
**Admin section:** Add "Feedback queue" nav item pointing to `/admin/feedback`. Only render when user has admin role.  
**Style compliance:** Follow existing sidebar link pattern (icon + text, hover state, active highlight).  
**Tests:** Integration test confirming nav items appear based on role, click navigates correctly.

### Admin Metrics Card (modified `app/(shell)/admin/metrics/page.tsx`)

**New card:** Compact stat block showing unreviewed count (status = `submitted` or `classified` with no `adminApprovedAt`) + "Open feedback queue →" link.  
**Style:** Match existing metric card pattern on that page.  
**Tests:** Integration test confirming card renders and link works.

---

## Acceptance Criteria

**Wave 1 — Foundation**

- [ ] `npm run build && npm test` pass.
- [ ] DB migration runs without error; `npm run db:studio` shows new columns on `userFeedback`.
- [ ] `/api/feedback` (GET) returns authenticated user's own feedback rows only; returns 401 when unauthenticated.
- [ ] `/api/feedback/[id]` (GET) returns row for owner; returns 403 for another user's row; returns 404 for unknown ID; admins can access any row.
- [ ] `/api/admin/feedback` (GET) returns all feedback with optional filters (status, confidence, risk, type, area); returns 403 for non-admin.
- [ ] `/api/admin/feedback/[id]/approve` (POST) updates row to `status='classified'`, writes `adminApprovedAt` and `adminApprovedByUserId`; returns 403 for non-admin.
- [ ] `/feedback` page loads, shows user's own feedback, clicking row navigates to `/feedback/[id]`.
- [ ] `/feedback/[id]` page loads, shows full detail, user sees PR info and UAT instructions if set, admin additionally sees triage metadata and approve button.
- [ ] `/admin/feedback` page loads, shows all feedback, filters work, approve button fires request and updates row inline.
- [ ] `/product-validation` still loads and is not broken by route changes.
- [ ] Sidebar nav includes "My feedback" (all users) and "Feedback queue" (admin only).
- [ ] Feedback popup footer includes links to `/feedback` and `/product-validation`.
- [ ] Admin metrics page includes unreviewed count + link.

**Wave 2 — Admin UI Polish**

- [ ] Filter state persists in query params; refetch on filter change does not reload page.
- [ ] Duplicate feedback display shows linked ID with link to `/feedback/[duplicateOfId]`.
- [ ] UAT instructions render in collapsible section below feedback row (admin view).
- [ ] All UI elements (badges, buttons, icons) match `docs/ui-style-guide.md` approved patterns.
- [ ] Accessibility: filter dropdowns keyboard-navigable, icon-only buttons have aria labels, proper heading hierarchy.

**Wave 3 — Automation: Scripts + Classify**

- [ ] `npm run steward:classify` (or equivalent) lists unclassified feedback, calls classify skill for each, writes classification back to DB.
- [ ] `feedback-classify` skill reads feedback + dedup result, outputs status, triage fields, and recommendation JSON.
- [ ] `feedback-dedupe` script detects duplicates (message overlap, shared PR).
- [ ] Classification writes back correctly: triage fields and status are correct in DB.

**Wave 4 — Daily Plan + Execute**

- [ ] `npm run steward:daily` queries auto-eligible feedback (`status='classified'`, `confidence='high'`, `riskLevel='low'`, `prNumber IS NULL`) and approval-eligible feedback (`status='awaiting_approval'`, `adminApprovedAt IS NOT NULL`, `prNumber IS NULL`).
- [ ] Items matching `config/feedback-steward/do-not-automate.json` (featureArea or feedbackType exclusions) are skipped.
- [ ] Items already at `status='in_pr'` are excluded — idempotent rerun is a no-op.
- [ ] `feedback-daily-plan` skill outputs a strict JSON plan artifact to `tmp/feedback-steward/<timestamp>-plan.json` and a human-readable companion to `docs/bug_enhancement/<date>-steward-grouped-plan.md`.
- [ ] Plan JSON validates against schema (required fields present, file paths within allowed scope, no forbidden featureArea/feedbackType combinations).
- [ ] `feedback-execute` skill reads plan JSON, writes failing tests first, implements changes, commits using `test(x):` / `feat(x):` convention, creates PR.
- [ ] PR body includes: feedback items table (id, type, confidence, risk, recommendation), summary, How To Test section per item, evidence section with test command and preview URL. All feedback IDs link to `/feedback/[id]`.
- [ ] Feedback rows are updated to `status='in_pr'`, `prNumber`, `previewUrl`, `uatInstructions` only after PR is successfully created.
- [ ] `npm run steward:daily --dry-run` prints plan output without writing to DB or creating a PR.
- [ ] If plan JSON is invalid or missing required fields, `run-daily.ts` exits non-zero and no DB rows are mutated.
- [ ] If execute skill fails after plan generation, feedback rows remain at their pre-run status (no partial mutation).

**Wave 5 — PR Sync, UAT, Changelog, Notify, Merge**

- [ ] `npm run steward:pr-sync --pr 42 --feedback id1,id2` updates feedback rows with PR number, preview URL, status='in_pr'.
- [ ] `npm run steward:notify --feedback id1 --event shipped` marks row as shipped, sets `versionResolved` and `resolvedAt`.
- [ ] On PR merge, `merge-hook` is called, finds all feedback with matching PR number, marks as shipped.
- [ ] Feedback rows correctly show shipped status, version resolved, and changelog label.

---

## Data Model / Contract Changes

### New `userFeedback` table columns (Wave 1)

```ts
// Triage metadata (written by admin or classify script)
status: text('status').notNull().default('submitted'),
  // Enum: 'submitted' | 'classified' | 'awaiting_approval' | 'in_pr' | 'in_qa' | 'shipped' | 'cancelled'

featureArea: text('feature_area'),
  // E.g., 'dashboard', 'attendance', 'quran', 'portfolio', 'admin', 'auth', 'settings'

feedbackType: text('feedback_type'),
  // Enum: 'bug' | 'enhancement' | 'ux' | 'copy' | 'performance' | 'question'

riskLevel: text('risk_level'),
  // Enum: 'low' | 'medium' | 'high'

confidence: text('confidence'),
  // Enum: 'high' | 'medium' | 'low'

// Deduplication
duplicateOfFeedbackId: text('duplicate_of_feedback_id'),
  // Self-reference; no FK constraint (application enforces)

// Admin approval
adminApprovedAt: timestamp('admin_approved_at'),
adminApprovedByUserId: text('admin_approved_by_user_id'),

// PR and execution
prNumber: integer('pr_number'),
previewUrl: text('preview_url'),
uatInstructions: text('uat_instructions'),

// Resolution
versionResolved: text('version_resolved'),
  // E.g., '3.4.2'
resolvedAt: timestamp('resolved_at'),

// Changelog
changelogVersion: text('changelog_version'),
changelogLabel: text('changelog_label'),
changelogUserCredit: text('changelog_user_credit'),
  // User's name or email for changelog attribution
```

**Index added:** `index('user_feedback_user_status_idx').on(t.userId, t.status)` for user hub query efficiency.

### Type updates (`features/feedback/types.ts`, Wave 1)

```ts
export type FeedbackStatus =
  | 'submitted' | 'classified' | 'awaiting_approval' | 'in_pr' | 'in_qa' | 'shipped' | 'cancelled'

export type FeedbackType = 'bug' | 'enhancement' | 'ux' | 'copy' | 'performance' | 'question'

export type FeedbackRiskLevel = 'low' | 'medium' | 'high'

export type FeedbackConfidence = 'high' | 'medium' | 'low'

export interface FeedbackRow {
  // Base fields (existing)
  id: string
  userId: string | null
  householdId: string | null
  userEmail: string
  pagePath: string
  sentiment: FeedbackSentiment
  message: string | null
  createdAt: string

  // New triage fields
  status: FeedbackStatus
  featureArea: string | null
  feedbackType: FeedbackType | null
  riskLevel: FeedbackRiskLevel | null
  confidence: FeedbackConfidence | null

  // Dedup and approval
  duplicateOfFeedbackId: string | null
  adminApprovedAt: string | null
  adminApprovedByUserId: string | null

  // PR and execution
  prNumber: number | null
  previewUrl: string | null
  uatInstructions: string | null

  // Resolution
  versionResolved: string | null
  resolvedAt: string | null

  // Changelog
  changelogVersion: string | null
  changelogLabel: string | null
  changelogUserCredit: string | null
}

export interface FeedbackTriageUpdate {
  status?: FeedbackStatus
  featureArea?: string | null
  feedbackType?: FeedbackType | null
  riskLevel?: FeedbackRiskLevel | null
  confidence?: FeedbackConfidence | null
  duplicateOfFeedbackId?: string | null
}

export interface FeedbackWorkflowUpdate {
  prNumber?: number | null
  previewUrl?: string | null
  uatInstructions?: string | null
  versionResolved?: string | null
  resolvedAt?: string | null
  changelogVersion?: string | null
  changelogLabel?: string | null
  changelogUserCredit?: string | null
  status?: FeedbackStatus
}

export interface AdminFeedbackFilters {
  status?: FeedbackStatus
  confidence?: FeedbackConfidence
  riskLevel?: FeedbackRiskLevel
  feedbackType?: FeedbackType
  featureArea?: string
  prNumber?: number
  hasDuplicate?: boolean
}
```

### Backward compatibility

**Breaking:** None. Existing `userFeedback` submissions continue to work. New columns default to null or 'submitted' status.

---

## API / Store / Service Plan

### Repository layer (`features/feedback/server/repository.ts`, Wave 1)

**New functions:**

```ts
// User-scoped reads
listFeedbackByUserId(userId: string): Promise<FeedbackRow[]>
  // Returns user's feedback ordered by createdAt DESC

getFeedbackById(id: string): Promise<FeedbackRow | null>
  // Returns single row or null

// Admin reads
listFeedbackForAdmin(filters: AdminFeedbackFilters = {}): Promise<FeedbackRow[]>
  // Filters by status, confidence, risk, type, area, prNumber, hasDuplicate
  // Returns all feedback (not scoped to current admin)

listUnclassifiedFeedback(): Promise<FeedbackRow[]>
  // Returns rows with status='submitted' (used by Wave 3 scripts)

// Triage writes
updateFeedbackTriage(id: string, data: FeedbackTriageUpdate): Promise<void>
  // Writes status, featureArea, feedbackType, confidence, riskLevel, duplicateOfFeedbackId

updateFeedbackWorkflow(id: string, data: FeedbackWorkflowUpdate): Promise<void>
  // Writes PR linkage, UAT, version, resolved info

approveFeedback(id: string, adminUserId: string): Promise<void>
  // Sets adminApprovedAt, adminApprovedByUserId, status='classified'
```

**Transform function:**
- `rowToFeedbackRow()` converts DB row to `FeedbackRow` type (handles date ISO conversion, null coalescing).

### API routes (Wave 1)

**User routes:**

- `GET /api/feedback` → `userList.ts`
  - Returns `ApiResponse<FeedbackRow[]>`
  - Requires auth, scoped to current user

- `GET /api/feedback/[id]` → `userDetail.ts`
  - Returns `ApiResponse<FeedbackRow>`
  - Requires auth, 403 if row belongs to different user (unless admin)

**Admin routes:**

- `GET /api/admin/feedback?status=...&confidence=...` → `adminList.ts` (existing route, extended)
  - Returns `ApiResponse<FeedbackRow[]>`
  - Requires admin, supports filters

- `POST /api/admin/feedback/[id]/approve` → `adminApprove.ts` (NEW)
  - Returns `ApiResponse<null>`
  - Requires admin

**Route wiring:**
- `features/feedback/api/router.ts` handles `POST /api/feedback` (submit) and `GET /api/feedback*` (user reads)
- `features/feedback/api/adminRouter.ts` handles `GET /api/admin/feedback*` and `POST /api/admin/feedback/[id]/approve`
- Both routers are invoked from `app/api/[...slug]/route.ts` dispatcher

---

## UI Plan

### Wave 1 — Core Pages and Navigation

#### `FeedbackHubPage` (`/feedback`)

**Component:** `features/feedback/front/pages/FeedbackHubPage.tsx`  
**Responsibility:** Display user's own feedback submissions  
**Entry points:** Sidebar nav "My feedback", popup post-submit link

**States:**
- Loading: Skeleton card pattern (per style guide)
- Empty: Friendly message + suggestion to submit feedback via popup
- Error: Error state with retry option
- Populated: List of user's feedback rows

**Per-row display:**
- Date submitted (formatted, not ISO)
- Page path
- Sentiment icon/badge (color-coded)
- Status badge (color-coded: submitted=neutral, classified=blue, in_pr=purple, shipped=green, cancelled=muted)
- PR number chip (if set)
- Version resolved (if shipped)

**Interaction:** Clicking row navigates to `/feedback/[id]`.

**Accessibility:** Keyboard navigable, proper heading, aria labels on sentiment icon.

#### `FeedbackDetailPage` (`/feedback/[id]`)

**Component:** `features/feedback/front/pages/FeedbackDetailPage.tsx`  
**Responsibility:** Show single feedback item detail + status  
**Entry point:** Click from hub or direct URL

**States:**
- Loading: Skeleton pattern
- Not found (404): Friendly message
- Forbidden (403): Auth error (user attempting to access another user's row)
- Error: Retry option
- Populated: Full detail

**User view:**
- Status badge (prominent, top)
- Date submitted + page path
- Original sentiment + message
- If `duplicateOfFeedbackId` set: "Merged into [id]" callout with link to duplicate
- If `prNumber` set: "In review — PR #N" with preview URL as styled button ("Open preview →")
- If `uatInstructions` set: UAT instructions in readable block
- If shipped: "Shipped in [version]" with changelog label

**Admin additional view (same component, role-gated):**
- Triage metadata: featureArea, feedbackType, confidence, riskLevel (all with labels)
- adminApprovedAt + adminApprovedByUserId (if approved)
- Raw duplicateOfFeedbackId with link
- Approve button (visible only when status=classified and adminApprovedAt is null)
- changelogVersion, changelogLabel, changelogUserCredit
- User email + userId

**Interaction:** Approve button fires POST to `/api/admin/feedback/[id]/approve`, updates row inline (no page reload).

#### `AdminFeedbackPage` (`/admin/feedback`)

**Component:** `features/feedback/front/pages/AdminFeedbackPage.tsx`  
**Responsibility:** Operational queue for all feedback (all users)  
**Entry points:** Sidebar "Feedback queue", admin metrics card

**States:**
- Loading: Skeleton pattern
- Empty: Friendly message (no feedback submitted)
- Error: Retry option
- Populated: Dense card/table layout

**Filter bar (sticky/prominent):**
- Status dropdown (submitted, classified, in_pr, in_qa, shipped, cancelled)
- Confidence pills (high, medium, low)
- Risk pills (low, medium, high)
- Type dropdown (bug, enhancement, ux, copy, performance, question)
- Feature area text input or dropdown
- PR number input
- Clear all button

**Per-row display (dense, operational):**
- User email + page path (clickable → `/feedback/[id]`)
- Sentiment + feedback type + feature area badges
- Status badge + confidence badge + risk badge (high risk = warning color)
- If `prNumber` set: PR chip + "Open preview →" button
- If `uatInstructions` set: Collapsible section showing UAT steps
- Approve button (visible only when status=classified, no adminApprovedAt)
- If `duplicateOfFeedbackId` set: "Duplicate of [id]" label with link

**Interaction:**
- Filter changes update query params and refetch (debounced, no full page reload)
- Clicking row navigates to `/feedback/[id]`
- Approve button triggers app-styled confirmation, then POST to `/api/admin/feedback/[id]/approve`, updates row inline

**Accessibility:** Keyboard-accessible filters, icon-only buttons have aria labels, proper heading hierarchy.

### Wave 1.6b — Navigation Wiring

#### Feedback popup footer (`FeedbackButton.tsx`)

Add two links to the panel footer:
- Post-submit: "Submitted! [View your feedback →]" → `/feedback`
- Always: "Want structured feedback? [Share here →]" → `/product-validation` (secondary style)

#### Sidebar nav

Add "My feedback" link under user section → `/feedback`.  
Add "Feedback queue" link under admin section (role-gated) → `/admin/feedback`.

#### Admin metrics page

Add compact card: "Unreviewed: [count]" + "Open feedback queue →" button → `/admin/feedback`.

### Wave 1 Component Notes

- All pages use `'use client'` (client-side data fetching)
- All components use app-provided loading skeleton, error, empty-state patterns (not bare divs)
- All forms and buttons follow `docs/ui-style-guide.md` conventions
- Icons: status badge colors per style guide (existing patterns for badges)
- No new CSS files; use Tailwind + shared classes from `app/globals.css`

### Wave 2 — UI Polish

(Mostly refinement of Wave 1 components; no new pages)

- Filter state management with debounce
- Inline UAT instructions expansion (collapsible)
- Duplicate display with proper links
- All icons, badges, buttons tested for visual compliance

---

## Testing Plan

### Wave 1 — Unit Tests

**`features/feedback/__tests__/api/userList.test.ts`**
- GET `/api/feedback` returns user's own rows (mock repository)
- GET `/api/feedback` returns 401 when unauthenticated
- Rows sorted by createdAt DESC

**`features/feedback/__tests__/api/userDetail.test.ts`**
- GET `/api/feedback/[id]` returns row for owner
- GET `/api/feedback/[id]` returns 403 for another user's row
- GET `/api/feedback/[id]` returns 404 for unknown ID
- GET `/api/feedback/[id]` admin can access any row

**`features/feedback/__tests__/api/adminList.test.ts`** (update existing)
- GET `/api/admin/feedback?status=classified` filters correctly
- GET `/api/admin/feedback?confidence=high&riskLevel=low` filters correctly
- GET `/api/admin/feedback?featureArea=dashboard` filters
- GET `/api/admin/feedback?hasDuplicate=true` filters
- GET `/api/admin/feedback` returns 403 for non-admin

**`features/feedback/__tests__/api/adminApprove.test.ts`** (NEW)
- POST `/api/admin/feedback/[id]/approve` calls `approveFeedback`
- POST `/api/admin/feedback/[id]/approve` returns 400 if no ID
- POST `/api/admin/feedback/[id]/approve` returns 403 for non-admin

**`features/feedback/__tests__/server/repository.test.ts`** (update)
- `listFeedbackByUserId()` returns only that user's rows
- `getFeedbackById()` returns row or null
- `listFeedbackForAdmin()` applies filters
- `listUnclassifiedFeedback()` returns only status='submitted' rows
- `updateFeedbackTriage()` writes triage fields
- `approveFeedback()` sets approval fields and status='classified'

### Wave 1 — Integration Tests

**`features/feedback/__tests__/integration/FeedbackHubPage.test.tsx`**
- Loading state renders skeleton
- Empty state shows friendly message
- Populated state shows rows
- Error state shows retry option
- Clicking row navigates to `/feedback/[id]`
- Only user's own rows shown

**`features/feedback/__tests__/integration/FeedbackDetailPage.test.tsx`**
- Loading state
- Populated state shows all user-visible fields
- Not found (404) state
- Forbidden (403) state
- Admin role shows additional triage fields and approve button
- Approve button updates row (mocked API)
- PR info and UAT instructions render when set
- Duplicate notice renders when set

**`features/feedback/__tests__/integration/AdminFeedbackPage.test.tsx`**
- Loading state
- Empty state (no feedback)
- Populated state shows all rows
- Filter changes refetch without page reload
- Approve button visible when status=classified, no adminApprovedAt
- Approve button fires request and updates row inline
- Duplicate and UAT instructions display correctly
- Clicking row navigates to `/feedback/[id]`

**`features/feedback/__tests__/integration/FeedbackButton.test.tsx`** (update)
- Post-submit shows "View your feedback →" link to `/feedback`
- Footer always shows "Share structured feedback →" link to `/product-validation`

**`features/layout/__tests__/integration/Sidebar.test.tsx`** (update)
- "My feedback" nav link appears for all authenticated users
- "Feedback queue" nav link appears only for admin users
- Clicking nav links navigates correctly

**`app/(shell)/admin/metrics/__tests__/integration/AdminMetricsPage.test.tsx`** (update)
- Feedback summary card appears with unreviewed count
- "Open feedback queue →" link navigates to `/admin/feedback`

### Wave 2 — Integration Tests

**`features/feedback/__tests__/integration/AdminFeedbackPage.test.tsx`** (extend)
- Filter state updates query params
- Filter changes refetch (debounced)
- UAT instructions collapsible section
- Duplicate display with link

### Wave 3 — Script Tests

**`scripts/__tests__/feedback-requeue.test.ts`**
- `listUnclassifiedFeedback()` output is valid JSON
- Output format matches spec (id, message, pagePath, sentiment, createdAt)

**`scripts/__tests__/feedback-dedupe.test.ts`**
- Detects duplicate when message overlap exists
- Detects duplicate when prNumber matches
- Returns isDuplicate=false when no duplicates
- Output format valid

### Wave 4 — Script Tests

(Tests for plan generation and execution skills are harder to test in Jest; covered by manual runs and Playwright regression tests)

### Wave 5 — Script Tests

**`scripts/__tests__/pr-sync.test.ts`**
- Updates feedback row with prNumber, previewUrl, status='in_pr'

**`scripts/__tests__/merge-hook.test.ts`**
- Finds feedback rows with matching prNumber
- Marks as shipped with versionResolved and resolvedAt

---

## Build Phases

### Wave 0 (Complete)
Automation probe — identify Claude CLI feasibility and skill orchestration.

### Wave 1 — Foundation: DB, Types, Routes, Pages

**Goal:** Turn raw feedback rows into visible tracked records. Build the human workflow surfaces.

**Scope:**
1. Schema migration: Add columns to `userFeedback` table
2. Type updates: Expand feedback types with status, triage, PR metadata
3. Repository functions: List, read, update, approve operations
4. API routes: User list/detail, admin list/approve
5. UI pages: Feedback hub, detail, admin queue
6. Navigation wiring: Sidebar, popup, metrics card
7. Tests: Unit, API, integration for all new routes and pages

**Acceptance:** All new routes respond correctly. `/feedback`, `/feedback/[id]`, `/admin/feedback`, `/product-validation` load. Nav links work. `npm run build && npm test` pass.

**Time estimate:** 2–3 days focused coding.

---

### Wave 2 — Admin Approval Workflow (UI Polish)

**Goal:** Make the admin feedback page fully operational as a workflow queue.

**Scope:**
1. Filter state management (debounced query param updates)
2. Duplicate feedback display
3. UAT instructions collapsible section
4. Admin metrics entry point polish
5. Accessibility improvements (keyboard nav, aria labels)

**Acceptance:** Filter bar is responsive. Duplicates display correctly. UAT collapsible works. Admin metrics card links to queue. All accessibility requirements met.

**Time estimate:** 1 day.

---

### Wave 3 — Automation: Scripts + Classify Skill

**Goal:** Let Claude classify and triage feedback rows automatically.

**Scope:**
1. `scripts/feedback-requeue.ts` — Query unclassified feedback, output JSON
2. `scripts/feedback-dedupe.ts` — Detect duplicates by message/PR
3. `.claude/feedback-classify.md` — Claude skill to classify one row
4. `scripts/run-classify.ts` — Orchestrate requeue → dedupe → classify → update
5. Tests: Script behavior tests

**Acceptance:** `npm run steward:classify` runs end-to-end. Classification written back to DB correctly.

**Time estimate:** 2 days.

---

### Wave 4 — Daily Plan + Execute

**Goal:** Group eligible classified feedback into one plan per morning run. Execute that plan via PR.

**Scope:**
1. Eligibility criteria definition (status=classified, confidence=high, risk=low, not in do-not-automate list)
2. `.claude/feedback-daily-plan.md` — Claude skill to read eligible rows and produce grouped plan
3. `.claude/feedback-execute.md` — Claude skill to execute plan (TDD, tests, commits, PR creation)
4. `scripts/run-daily.ts` — Orchestrate classify → plan → execute
5. Tests: Script behavior tests
6. Integration: Feedback rows update with status, PR number, preview URL

**Acceptance:** `npm run steward:daily` produces a plan and PR. Feedback rows update correctly. PR body format follows spec.

**Time estimate:** 3–4 days.

---

### Wave 5 — PR Sync, UAT, Changelog, Notify, Merge Hook

**Goal:** Close the loop. Link PRs to feedback rows, notify users, update on merge.

**Scope:**
1. `scripts/pr-sync.ts` — Update feedback rows with PR number and preview URL
2. `.claude/feedback-uat.md` — Claude skill to generate click-by-click UAT steps
3. `.claude/feedback-changelog.md` — Claude skill to generate changelog entries
4. `scripts/feedback-notify.ts` — Update feedback status (DB write; email via Resend later)
5. `scripts/merge-hook.ts` — Called after PR merge, marks feedback as shipped
6. Tests: Script behavior tests
7. Integration: Post-merge automation updates feedback correctly

**Acceptance:** All scripts run without error. Feedback rows mark shipped on merge. Changelog generates correctly.

**Time estimate:** 2 days.

---

### Cron Schedule (Post-Wave 4)

Set up daily remote agent to call `npm run steward:daily` at 7:00 AM.

**Cron expression:** `0 7 * * *`  
**Command:** `cd /path/to/repo && npm run steward:daily`  
**Logging:** Visible success/failure output to stderr.

---

## Out of Scope

- **Email notification via Resend** — Wave 5 feedback-notify script only writes DB status. Email integration deferred.
- **User notification dashboard** — Feedback items do not trigger alerts or dashboard notifications.
- **Changelog publishing** — Changelog entries are written to DB but not published to a public changelog page.
- **Custom feedback form** — Product validation page remains as-is. Do not redesign the form.
- **Mobile-specific optimizations** — Pages follow responsive design from style guide; no mobile-exclusive features.
- **Accessibility audit beyond WCAG 2.1 AA** — Standard keyboard nav and aria labels; no extended keyboard shortcuts or screen-reader testing.
- **Auth integration for private feedback** — Feedback remains tied to user email; no user profile/credential system for private items.

---

## Manual QA Plan

### Wave 1 QA Checklist

**Setup:**
1. Run `npm run db:reset:demo` to seed demo households.
2. Run `npm run dev` and sign in as a parent user.

**User Feedback Hub (`/feedback`):**
1. Open the feedback popup (icon/button on any page).
2. Submit feedback on the dashboard: sentiment="good", message="Love this feature".
3. Confirm popup shows "Submitted! [View your feedback →]" link.
4. Click the link → should navigate to `/feedback`.
5. Confirm page shows the just-submitted feedback item with status="submitted".
6. Click the feedback row → should navigate to `/feedback/[id]`.
7. Confirm detail page shows date, page path, sentiment, message, status badge.
8. Go back to `/feedback`. Confirm the list shows multiple items (if seeded with demo).

**Navigation:**
1. Open sidebar and confirm "My feedback" link is visible.
2. Click "My feedback" → should navigate to `/feedback`.
3. Confirm breadcrumb or back link works to return to dashboard.

**Admin Feedback Queue (`/admin/feedback`):**
1. Sign in as an admin user (create via seed or dev bypass).
2. Open sidebar and confirm "Feedback queue" link is visible (only for admin).
3. Click → should navigate to `/admin/feedback`.
4. Confirm page shows all feedback from all users (not filtered to current admin).
5. Try filter dropdowns: select status="submitted", confirm list updates without page reload.
6. Confirm risk, confidence, type filters work.
7. For a feedback item with status="classified": confirm approve button is visible.
8. Click approve → should show confirmation dialog.
9. Confirm the button. Item should show adminApprovedAt timestamp and status should update to "classified" (or remain "classified" if already).
10. Confirm button is now hidden (no longer needed once approved).

**Admin Metrics Page (`/admin/metrics`):**
1. Navigate to `/admin/metrics`.
2. Confirm a new card appears with unreviewed feedback count.
3. Click "Open feedback queue" link → should navigate to `/admin/feedback`.

**Post-Submit Confirmation:**
1. Open feedback popup and submit feedback.
2. Confirm the success message includes "[View your feedback →]" link to `/feedback`.
3. Before closing the popup, confirm "Share structured feedback →" link is visible at the bottom.
4. Click the structured feedback link → should navigate to `/product-validation`.

**Empty States:**
1. Create a new test user (or demo household with no feedback).
2. Navigate to `/feedback`.
3. Confirm the page shows "No feedback submitted yet" or similar friendly message.

**Error Handling:**
1. Submit feedback with network throttling (dev tools).
2. Confirm error state appears if fetch fails.
3. Confirm retry button/link reloads the list.

---

### Wave 2 QA Checklist

**Filter Persistence:**
1. On `/admin/feedback`, select status="in_pr", risk="high".
2. Confirm URL query params show `?status=in_pr&riskLevel=high`.
3. Reload the page.
4. Confirm filters are still applied (state persisted in URL).

**Duplicate Display:**
1. Mark a feedback item as a duplicate of another via DB or admin update.
2. View the master item on `/feedback/[id]`.
3. Confirm a callout appears: "This was merged into [other-id]" with a link.
4. Click the link → should navigate to the other item.

**UAT Instructions Collapsible:**
1. On `/admin/feedback`, find a feedback item with `uatInstructions` set (seed or manual update).
2. Confirm UAT instructions appear in a collapsed section below the row.
3. Click to expand → should show full instructions.
4. Click to collapse → should hide instructions.

**Accessibility Keyboard Nav:**
1. Use Tab to navigate the filter dropdowns.
2. Confirm focus indicators are visible.
3. Confirm Space/Enter opens dropdowns and selects options.
4. Confirm all interactive elements are reachable via keyboard.

---

### Wave 3 QA Checklist

**Classification Script:**
1. Insert unclassified feedback rows into DB (or use demo seed).
2. Run `npm run steward:classify`.
3. Confirm script completes without error.
4. Query the DB: confirm triage fields are populated (featureArea, feedbackType, confidence, riskLevel).
5. Confirm status is "classified" for non-duplicate items.
6. Confirm duplicates have status="cancelled" and duplicateOfFeedbackId set.

---

### Wave 4 QA Checklist

**Daily Plan Generation:**
1. Ensure there are eligible classified feedback items (confidence=high, risk=low, featureArea not in do-not-automate).
2. Run `npm run steward:daily`.
3. Confirm a plan document is created at `docs/bug_enhancement/<date>-steward-grouped-plan.md`.
4. Confirm the plan groups items by feature area.
5. Confirm a PR is created on branch `dev` with the feedback items in the title or body.

**PR Body Format:**
1. Open the created PR on GitHub.
2. Confirm PR body includes:
   - Feedback Items table with id, type, confidence, risk, recommendation
   - Summary section
   - How To Test sections (one per feedback item)
   - Evidence section with test command and preview URL
3. Confirm all feedback IDs link to `/feedback/[id]`.

---

### Wave 5 QA Checklist

**PR Sync:**
1. After a feedback item is linked to a PR, run `npm run steward:pr-sync --pr 42 --feedback id1,id2 --preview https://...`.
2. Query the DB: confirm `prNumber`, `previewUrl`, and `status='in_pr'` are set.

**Merge Hook:**
1. Merge the feedback PR to `dev`.
2. The merge hook should trigger (run `scripts/merge-hook.ts --pr 42 --version <current-version>`).
3. Query the DB: confirm all feedback items with `prNumber=42` are marked `status='shipped'` with `versionResolved` and `resolvedAt` set.

---

## Branch and Commit Plan

### Branch

**Name:** `feature/feedback-steward-full`  
**Base:** `master` (sync before starting with `git fetch origin && git merge origin/master`)

### Commit Sequence

**Wave 1 — Foundation**

```
test(feedback): add schema migrations
feat(feedback): expand userFeedback table with triage, approval, and workflow columns
test(feedback): add repository function tests
feat(feedback): implement repository functions for list, read, update, approve
test(feedback): add API route tests
feat(feedback): implement user feedback list and detail routes
feat(feedback): implement admin feedback list and approval routes
test(feedback): add integration tests for feedback hub and detail pages
feat(feedback): build FeedbackHubPage component
feat(feedback): build FeedbackDetailPage component
test(feedback): add integration tests for AdminFeedbackPage
feat(feedback): build AdminFeedbackPage with filter bar
feat(feedback): add sidebar navigation links (My feedback, Feedback queue)
feat(feedback): add post-submit confirmation links in feedback popup
feat(feedback): add feedback summary card to admin metrics page
test(feedback): add accessibility tests for new pages
```

**Wave 2 — UI Polish**

```
test(feedback): add filter state management tests
feat(feedback): implement debounced filter query updates
test(feedback): add duplicate and UAT display tests
feat(feedback): add duplicate feedback callout with links
feat(feedback): add collapsible UAT instructions section
```

**Wave 3 — Classification Scripts**

```
test(scripts): add requeue script tests
feat(scripts): implement feedback-requeue.ts
test(scripts): add dedupe script tests
feat(scripts): implement feedback-dedupe.ts
test(scripts): add classify skill tests (manual run)
feat(scripts): implement .claude/feedback-classify.md skill
test(scripts): add run-classify orchestration tests
feat(scripts): implement run-classify.ts
```

**Wave 4 — Daily Plan and Execute**

```
test(scripts): add daily plan generation tests
feat(scripts): implement .claude/feedback-daily-plan.md skill
test(scripts): add execution skill tests
feat(scripts): implement .claude/feedback-execute.md skill
test(scripts): add run-daily orchestration tests
feat(scripts): implement run-daily.ts
```

**Wave 5 — PR Sync and Merge Hook**

```
test(scripts): add pr-sync tests
feat(scripts): implement pr-sync.ts
test(scripts): add merge-hook tests
feat(scripts): implement merge-hook.ts
test(scripts): add notification script tests
feat(scripts): implement feedback-notify.ts
feat(scripts): add npm script shortcuts (steward:classify, steward:daily, etc.)
```

**All waves complete:**

```
chore(feedback): update package.json with steward command shortcuts
docs(feedback): add feedback steward user guide (if needed)
```

### Pre-merge checks

Before merging to master:
1. `npm run build` passes.
2. `npm test` passes (all unit, API, integration tests).
3. Manual QA checklist complete for all waves.
4. PR body includes link to plan document.
5. All feedback-related routes tested in browser (no broken links).

---

## Risks and Rollback

### Main Risks

**Risk: Claude API outage or rate limits during daily automation**  
- **Mitigation:** Daily script logs all attempts. Non-blocking API errors are logged to stderr; retry on next run. No feedback item is lost.
- **Rollback:** Disable cron schedule. Manual runs can continue as needed.

**Risk: Generated plan is unsafe or contradicts do-not-automate guardrails**  
- **Mitigation:** `feedback-execute` skill includes explicit guards (no auth, security, data deletion, migrations, billing, privacy, architecture changes). Non-compliant plans fail with clear error message instead of proceeding.
- **Rollback:** Re-run classification and skip unsafe feedback until guardrails are updated. Manual intervention on next daily run.

**Risk: PR body format is incorrect or incomplete, confusing reviewers**  
- **Mitigation:** Skill outputs exact JSON schema; script validates before PR creation. Manual QA tests the format end-to-end.
- **Rollback:** Fix PR body manually. Re-run skill with corrected parameters.

**Risk: Feedback row update (e.g., status='in_pr') fails silently, causing state divergence**  
- **Mitigation:** All DB updates return success/failure. Scripts log updates and exit non-zero on failure. No silent failures.
- **Rollback:** Re-run the failed script step. Verify DB state and rerun if needed.

**Risk: Multiple daily runs in parallel corrupt feedback state**  
- **Mitigation:** Cron schedule is single daily (7 AM). Manual runs are user-triggered. If two runs overlap, the second will find items already processed and skip them (idempotent via status checks).
- **Rollback:** Restore DB from backup if corruption occurs. Likely not needed (idempotency guards this).

**Risk: User-visible detail page is confusing when admin and user role rendering differs**  
- **Mitigation:** Role-gated sections are clearly labeled (visual grouping, headings like "Admin only" or "Triage details"). Integration tests verify both role paths.
- **Rollback:** Simplify component to remove role gating (show only user-visible fields). Admin sees a filtered view. Low-risk change.

**Risk: Admin feedback queue becomes slow under load (many feedback items)**  
- **Mitigation:** DB index on `(userId, status)` for user hub queries. Admin list is not yet indexed by status + confidence; add index if performance issues arise.
- **Rollback:** Disable admin queue and revert to simpler list API. Manual triage via DB until optimization is in place.

### Rollback Plan

**Phase 1 (Waves 1–2):** Revert the branch. No automation yet; minimal risk.

**Phase 2 (Waves 3–4 running):** Stop the cron schedule. Let current PR finish if in progress. Do not start new daily runs. Revert the branch. No feedback state corruption because automation is paused.

**Phase 3 (Full automation):** Same as Phase 2. Stop cron, wait for in-flight runs, revert. DB state may need manual cleanup (feedback marked 'in_pr' but PR never created). Query and reset affected rows to 'classified' if needed.

**Partial rollback option:** Keep Wave 1 UI (pages and routes) but disable Wave 3+ automation. Users can still view feedback via hub; admins can still approve manually. Revert only the scripts and skills.

---

## Final Checklist

- [x] Planning mode stated (Mode 4 — New Feature)
- [x] Current code path audited (existing submit route, new routes, new pages, new scripts)
- [x] Source of truth identified (feedback feature owns all feedback data)
- [x] UI pattern audit included (page titles, badges, filters, action buttons, icons, accessibility)
- [x] Acceptance criteria are observable (routes respond, pages load, filters work, approve updates state)
- [x] Data model changes documented (new columns, types, validation)
- [x] API / store / service plan included (repository functions, routes, response shapes)
- [x] UI plan documented (all pages, states, interactions, accessibility)
- [x] Testing plan included (unit, API, integration tests per wave)
- [x] Build phases ordered by dependency (Waves 0–5, dependencies clear)
- [x] Out-of-scope items named (email, notifications, changelog publishing, mobile-specific, custom form redesign)
- [x] Manual QA is click-by-click (setup, user flows, admin flows, error handling, accessibility)
- [x] Branch name provided (`feature/feedback-steward-full`)
- [x] Commit plan is behavior-oriented (test-first, feature commits, integration commits per wave)
- [x] Risks identified and mitigation strategies clear (API outage, unsafe plans, failed updates, concurrent runs, performance, rollback)
- [x] Plan is small enough for safe implementation (5 waves, each produces testable capability)

---

**Ready to execute Wave 1.**

**Sync with master before starting:** `git fetch origin && git merge origin/master`

**Start at Wave 1:** Schema migration, types, repository, routes, UI pages, navigation, tests.

**Ground rules every wave:**
1. Read every file before editing.
2. Run `npm run build && npm test` before marking complete.
3. Never merge without passing tests.
4. Read `docs/ui-style-guide.md` before building any UI.
5. Use app's approved patterns; no bare divs or custom styles.
