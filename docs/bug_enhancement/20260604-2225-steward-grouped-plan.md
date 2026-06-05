# Feedback Steward Grouped Plan

Generated at: 2026-06-04T22:25:11.332Z

## Feedback IDs

- 1131d003-f5a1-4ccd-a2af-0a953d48c641
- e1c3f3db-27c7-4978-a7ac-f40160c2d0df
- 1e365a22-06c7-4bf6-b28b-3d4a73c0faa4
- f674588f-7f9a-4e9f-a7e2-cc1d4621de95
- ad71a81f-6bc8-4463-9d1a-0f8f3c11951e
- 533ecbb1-bc49-4795-b8fe-3d579fc96076
- 1831c99f-8e92-43be-8274-6d1189d8bbe5
- 103eaba1-67d8-4fde-addc-86228a3860e0
- 3dc815ad-a973-4672-a4ee-39553008f324
- a2a7a0b6-9751-4967-91f8-8daf9e8a5955

Auto-eligible: 1131d003-f5a1-4ccd-a2af-0a953d48c641, ad71a81f-6bc8-4463-9d1a-0f8f3c11951e, 533ecbb1-bc49-4795-b8fe-3d579fc96076, 1831c99f-8e92-43be-8274-6d1189d8bbe5, 103eaba1-67d8-4fde-addc-86228a3860e0, 3dc815ad-a973-4672-a4ee-39553008f324, a2a7a0b6-9751-4967-91f8-8daf9e8a5955
Approved: e1c3f3db-27c7-4978-a7ac-f40160c2d0df, 1e365a22-06c7-4bf6-b28b-3d4a73c0faa4, f674588f-7f9a-4e9f-a7e2-cc1d4621de95

## Workstream 1: Show a count of the currently displayed feedback items directly above the Filters card on the admin feedback page. Simple total count of the items returned for the active filter — no per-status breakdown (per admin decision).

- Feature area: feedback
- Owning component: features/feedback/front/pages/AdminFeedbackPage.tsx
- Allowed files: features/feedback/front/pages/AdminFeedbackPage.tsx, features/feedback/__tests__/integration/AdminFeedbackPage.test.tsx
- Test plan:
  - `NEW TEST: features/feedback/__tests__/integration/AdminFeedbackPage.test.tsx — renders a filtered-count line (e.g. 'N feedback items') directly above the Filters card and updates the number when a filter narrows the list`
  - `RUN: npm test -- features/feedback/__tests__/integration/AdminFeedbackPage.test.tsx`

### UAT

### 1131d003-f5a1-4ccd-a2af-0a953d48c641

- Context: Add count at the top under the Filters of the filtered feedbacks on the page.
- Sign in as an admin user.
- Navigate to /admin/feedback.
- Confirm a count line (e.g. '12 feedback items') is visible directly above the 'Filters' card.
- In the Filters card, type a value into 'Feature area' or pick a Status that narrows the list.
- Confirm the count above the Filters updates to match the number of feedback cards now shown.
- Clear the filters and confirm the count returns to the full total.
## Workstream 2: Rename the 'classified' feedback status to 'reviewed' system-wide (per admin decision — full rename, NOT a display-only label). Changes the stored enum value everywhere: the FeedbackStatus union, the classify writeback and eligibility filter, the classify output schema, the steward scripts that read/write the status, the admin status filter and STATUS_COLORS, the user-facing status copy, and existing DB rows.

- Feature area: feedback
- Owning component: features/feedback/types.ts
- Allowed files: features/feedback/types.ts, features/feedback/server/service.ts, features/feedback/server/repository.ts, features/feedback/front/pages/AdminFeedbackPage.tsx, features/feedback/front/pages/FeedbackHubPage.tsx, features/feedback/front/pages/FeedbackDetailPage.tsx, features/feedback/__tests__/**/*.ts, features/feedback/__tests__/**/*.tsx, scripts/feedback-steward/**/*.ts
- Blast radius: CONFIRMED FULL RENAME (admin decision 2026-06-04): 'classified' -> 'reviewed' is a stored enum value change, not a display relabel. The value is referenced in ~22 files: the FeedbackStatus union (types.ts), applyClassification + requiresApproval + listEligibleFeedbackForDailyRun (service.ts), repository, the admin status filter <select> + STATUS_COLORS (AdminFeedbackPage.tsx), the user-facing pills (FeedbackHubPage/FeedbackDetailPage), and the steward scripts (run-classify CLASSIFY_OUTPUT_SCHEMA enum + writeback, feedback-requeue, run-reset-classification, steward-preflight, run-rollback) plus their tests. No Drizzle SCHEMA migration is required — user_feedback.status is a free-text column (default 'submitted') — but a one-off DATA migration is required to update existing rows: `UPDATE user_feedback SET status = 'reviewed' WHERE status = 'classified';` run via psql against each environment after the code ships. Because the steward intake pipeline depends on this value, land this PR atomically and BEFORE the other feedback-area workstreams to avoid a broken classify/daily run and rebase churn.
- Test plan:
  - `NEW TEST: features/feedback/__tests__/api/service.test.ts — applyClassification sets status to 'reviewed' (not 'classified') and listEligibleFeedbackForDailyRun selects 'reviewed' rows`
  - `NEW TEST: scripts/feedback-steward/__tests__/run-classify.test.ts — the classify output schema and DB writeback use 'reviewed' as the post-classification status`
  - `RUN: npm test -- features/feedback`
  - `RUN: npm test -- scripts/feedback-steward`
  - `RUN: npm run build`

### UAT

### 533ecbb1-bc49-4795-b8fe-3d579fc96076

- Context: Change the clarification or status of feedback from classified to reviews once it has been processed by the daily process. Reviewed makes more since to users than clarified
- Sign in as an admin user.
- Navigate to /admin/feedback.
- Confirm feedback that was previously 'classified' now shows 'reviewed' everywhere — the status pill, the status filter dropdown option, and the detail page.
- Filter by 'reviewed' and confirm the previously-classified items are returned.
- Run `npm run steward:daily -- --plan-only` and confirm the steward still selects eligible 'reviewed' rows (no items lost because of the rename).
- Confirm the data migration ran: no feedback row remains with status 'classified'.
## Workstream 3: Add an admin 'Reject planning' action so an admin can decline an item instead of only approving it. The reject sets the item to the existing 'cancelled' status (per admin decision — no new enum value) and is confirmed via a modal that mirrors the existing ApprovalModal flow (per admin decision — not one-click). Also review the user-facing status copy (acknowledgement and a resolved 'Implemented' label).

- Feature area: feedback
- Owning component: features/feedback/server/service.ts
- Allowed files: features/feedback/server/service.ts, features/feedback/server/repository.ts, features/feedback/api/router.ts, features/feedback/api/routes/adminReject.ts, features/feedback/api/routes/adminApprove.ts, features/feedback/front/services/api.ts, features/feedback/front/components/ApprovalModal.tsx, features/feedback/front/components/RejectModal.tsx, features/feedback/front/pages/AdminFeedbackPage.tsx, features/feedback/front/pages/FeedbackHubPage.tsx, features/feedback/front/pages/FeedbackDetailPage.tsx, features/feedback/__tests__/api/service.test.ts, features/feedback/__tests__/api/repository.test.ts, features/feedback/__tests__/api/routes/adminReject.test.ts, features/feedback/__tests__/integration/AdminFeedbackPage.test.tsx, features/feedback/__tests__/integration/RejectModal.test.tsx, features/feedback/__tests__/integration/FeedbackHubPage.test.tsx
- Blast radius: Adds a new feedback lifecycle action. Per admin decision the reject reuses the existing 'cancelled' status (already in STATUS_COLORS and the schema) — NO new enum value, so types.ts does not change for the status set. Per admin decision the action is confirmed via a modal mirroring features/feedback/front/components/ApprovalModal.tsx (new RejectModal.tsx). Adds a new admin route (adminReject.ts) wired through api/router.ts, plus service + repository support, so npm run build is required. The user-facing label review (ad71a81f's second ask) spans FeedbackHubPage/FeedbackDetailPage and must stay display-only — do not change stored status values. NOTE: this workstream and the 'classified'->'reviewed' rename both edit AdminFeedbackPage.tsx and the feedback service/repository; land the rename first, then rebase this on top.

> ⚠️ **Clarifying questions — confirm before executing this workstream:**
> - Confirm the exact user-facing copy for the label review: the acknowledgement wording for newly submitted items (e.g. 'Thanks for your feedback') and the resolved-state label (e.g. 'Implemented'), and which statuses each label applies to.
- Test plan:
  - `NEW TEST: features/feedback/__tests__/api/service.test.ts — rejectForPlanning(id) sets the feedback to status 'cancelled' and is rejected when the row is already shipped`
  - `NEW TEST: features/feedback/__tests__/api/repository.test.ts — repository reject update persists status 'cancelled' (mock at the repository boundary, do not mock getDb())`
  - `NEW TEST: features/feedback/__tests__/api/routes/adminReject.test.ts — POST /api/admin/feedback/:id/reject returns success for an admin and 403 for a non-admin`
  - `NEW TEST: features/feedback/__tests__/integration/RejectModal.test.tsx — the reject confirmation modal (mirroring ApprovalModal) renders, cancels without calling the endpoint, and confirms by POSTing to the reject endpoint`
  - `NEW TEST: features/feedback/__tests__/integration/AdminFeedbackPage.test.tsx — a classified/awaiting_approval row shows a 'Reject planning' button that opens the reject modal; confirming moves the row to 'cancelled'`
  - `RUN: npm test -- features/feedback`
  - `RUN: npm run build`

### UAT

### ad71a81f-6bc8-4463-9d1a-0f8f3c11951e

- Context: Add a reject planning button for admin on the feedback page. Perhaps also the labels should be reviewed, Thanks for your Feedback, and Implemented
- Sign in as an admin user.
- Navigate to /admin/feedback.
- Find a feedback card that is reviewed or awaiting approval.
- Confirm a 'Reject planning' button appears alongside the approve action.
- Click 'Reject planning' and confirm a confirmation modal appears (like the approve modal).
- Cancel the modal and confirm nothing changes; reopen and confirm — the item moves to the cancelled state (pill colour changes, item leaves the actionable set).
- As a regular (non-admin) user, navigate to /feedback and open one of your submissions.
- Confirm the status copy reads clearly (acknowledgement on new items, and 'Implemented' on shipped items) rather than internal status codes.
## Workstream 4: Sidebar polish and collapse: center-align the version number in the sidebar footer, center the Arabic Hijri date block under the 'Faith. Learning. Purpose.' tagline, and add a collapse/expand toggle so the desktop sidebar can be hidden to reclaim space.

- Feature area: layout
- Owning component: features/layout/front/components/Sidebar.tsx
- Allowed files: features/layout/front/components/Sidebar.tsx, features/layout/front/components/AppShell.tsx, features/layout/__tests__/Sidebar.test.tsx
- Blast radius: The collapse toggle (1831c99f) introduces sidebar open/collapsed state. If the collapsed width must persist across navigation or coordinate with the main content area, the state likely needs to live in AppShell.tsx (which owns the shell layout) rather than only inside Sidebar — AppShell is therefore in allowedFiles. The two centering tweaks (103eaba1, 3dc815ad) are pure className changes confined to Sidebar.tsx. Note 3dc815ad was filed on /settings but the Hijri date/tagline live in the global Sidebar, so the fix is in Sidebar.tsx, not a settings page.

> ⚠️ **Clarifying questions — confirm before executing this workstream:**
> - For the collapse toggle (1831c99f), should the collapsed state persist (e.g. localStorage / across reloads), and when collapsed should the sidebar shrink to an icon-rail or hide entirely? Current scope implements a session-only show/hide toggle.
- Test plan:
  - `NEW TEST: features/layout/__tests__/Sidebar.test.tsx — the version element (data-testid='sidebar-version') is rendered with centered alignment`
  - `NEW TEST: features/layout/__tests__/Sidebar.test.tsx — the Hijri date block (data-testid='sidebar-hijri-date') is centered under the tagline rather than left-indented`
  - `NEW TEST: features/layout/__tests__/Sidebar.test.tsx — a collapse toggle button is present; activating it collapses the sidebar panel and activating it again expands it`
  - `RUN: npm test -- features/layout/__tests__/Sidebar.test.tsx`

### UAT

### 103eaba1-67d8-4fde-addc-86228a3860e0

- Context: Center the version number in the navigation Side bar
- Sign in and open any /(shell) page (e.g. /dashboard).
- Look at the bottom of the left sidebar.
- Confirm the version number (e.g. 'v2.15.4') is horizontally centered in the sidebar footer rather than left-aligned.

### 3dc815ad-a973-4672-a4ee-39553008f324

- Context: Center the Arabic Hijri calendar under where it says Faith.Learnig. Purpose.
- Sign in and open any /(shell) page.
- Look at the top of the left sidebar under 'Faith. Learning. Purpose.'.
- Confirm the Arabic Hijri date block is centered beneath the tagline rather than indented to the left.

### 1831c99f-8e92-43be-8274-6d1189d8bbe5

- Context: Allow the sidebar to collapse. Like how AI screens have the square with the partial square inside of it so you can expand and collapse that panel.
- Sign in on a desktop-width viewport and open /dashboard.
- Locate the new collapse/expand toggle control on the sidebar.
- Click it and confirm the sidebar collapses and the main content reclaims the space.
- Click it again and confirm the sidebar expands back to its normal state.
- Confirm navigation links still work in both states.
## Workstream 5: Replace the bare email in the top app header with a personalized Arabic greeting: show a rotating greeting plus the user's first name, with the email in grey parentheses underneath, e.g. 'Marhaban Rasheed' over '(rhali786@gmail.com)'. Use 5-8 rotating greetings so it does not feel stale.

- Feature area: layout
- Owning component: features/layout/front/components/Header.tsx
- Allowed files: features/layout/front/components/Header.tsx, features/layout/lib/greetings.ts, features/layout/__tests__/Header.test.tsx
- Blast radius: Currently Header.tsx renders `session.user?.name ?? session.user?.email` as a single truncated span. The seed/dev user (dev@sheathacademy.ai) has no name, so a fallback is required to avoid showing 'Marhaban undefined'. Greeting list is a small new pure helper (features/layout/lib/greetings.ts). No data-layer changes.

> ⚠️ **Clarifying questions — confirm before executing this workstream:**
> - When the user has no name on their session (e.g. the dev seed user dev@sheathacademy.ai), what should the greeting show — fall back to the email only, to a generic name like 'there', or to the household/family name? The current plan assumes a generic fallback when name is absent.
> - Please confirm the desired set of 5-8 Arabic greetings (e.g. Marhaban, Ahlan, Assalamu alaikum, ...) and whether they should rotate per page load or per session.
- Test plan:
  - `NEW TEST: features/layout/__tests__/Header.test.tsx — when session has a name, the header renders an Arabic greeting + first name on one line and the email in grey parentheses on a second line`
  - `NEW TEST: features/layout/__tests__/Header.test.tsx — greetings helper returns a value from the configured set of 5-8 greetings (deterministic given a seeded picker)`
  - `RUN: npm test -- features/layout/__tests__/Header.test.tsx`

### UAT

### a2a7a0b6-9751-4967-91f8-8daf9e8a5955

- Context: On the header it shows me by my email address. I would like for it to greet me in arabic, say my name, and have my email in grey in parantehses under the greeting of my name. So like Marhaban Rasheed (rhali786@gmail.com). And it should have 5-8 different greetings so it doesn't get stale.
- Sign in as a user that has a display name on the account.
- Look at the top-right of the app header (on /dashboard).
- Confirm it shows an Arabic greeting and the first name (e.g. 'Marhaban Rasheed') instead of the raw email.
- Confirm the email appears in grey, in parentheses, on a line beneath the greeting.
- Reload the page several times and confirm the greeting word varies across a set of 5-8 options.
## Workstream 6: Navigation restructure — Wave 1 (safe first slice of the approved module-based nav redesign). Rename the top-level 'Dashboard' nav item to 'Home' (label only; route '/' and active logic unchanged). This is the smallest reversible step of the larger approved plan to move to Home / Planbook / Records / Compliance / People / Settings modules.

- Feature area: dashboard
- Owning component: features/layout/lib/navConfig.ts
- Allowed files: features/layout/lib/navConfig.ts, features/layout/__tests__/navConfig.test.ts
- Blast radius: This implements ONLY the label rename (Dashboard -> Home) from the large approved restructure (e1c3f3db). The full feedback requests umbrella modules (Planbook over Calendar/Lesson Planner/Courses/Quran; Records over Attendance/Grades/Reports), promoting People and Compliance out of settings tabs, moving Finances/Resources, hover speed-menus, a global learner switcher, and a new In-session page. Those are multi-wave, route-level, cross-feature changes (touch navConfig, Sidebar, isNavItemActive, many app/(shell) routes, and several feature pages) and are deliberately deferred to subsequent waves — see docs/feature-waves.md. NOTE: navConfig.ts is also touched by the cross-household-messaging workstream; sequence/rebase these two PRs to avoid a merge conflict.

> ⚠️ **Clarifying questions — confirm before executing this workstream:**
> - This approved restructure is large; Wave 1 implements only the Dashboard->Home rename. Should the remaining waves (Planbook module, Records module, People/Compliance promotion, Finances/Resources re-homing, hover menus, global learner switcher, In-session page) be planned next as a scoped wave sequence per docs/feature-waves.md, or held until you review Wave 1 in the preview?
> - Confirm the canonical label should be 'Home' (the feedback recommends Home over 'Dashboard'/'Hub') and that the page title may remain 'Dashboard'.
- Test plan:
  - `NEW TEST: features/layout/__tests__/navConfig.test.ts — the nav item with id 'dashboard' has label 'Home', href '/', and is still marked active when pathname is '/'`
  - `RUN: npm test -- features/layout/__tests__/navConfig.test.ts`
  - `RUN: npm run build`

### UAT

### e1c3f3db-27c7-4978-a7ac-f40160c2d0df

- Context: ## 0) Scope note

This feedback **ignores dev-only items** (Admin, Feedback queue, My feedback). Everything else is treated as “real nav.”

---

## 1) Executive summary (what’s wrong + what to do)

### What’s wrong right now

Your left sidebar is still a **feature-per-tab** navigation model:

- Dashboard
- Calendar
- Lesson Planner
- Courses
- Attendance
- Grades & Progress
- Reports & Records
- People
- Resources
- Quran
- Messages
- Finances
- Compliance
- Settings
- About

That’s **too many top-level choices**. It forces users to memorize “where things live,” and it guarantees future sprawl as features expand.

### What to do

Shift to a **module-based navigation model** with stable top-level items, and move the rest into **local tabs/subpages** inside modules.

**Target desktop left sidebar:**

- **Home**
- **Planbook**
- **Records**
- **Compliance**
- **People**
- **Settings**
- **Messages** *(only if truly launched/opt-in; otherwise hide until enabled)*

Everything else becomes a **tab or subpage** inside one of those modules.

---

## 2) Canonical naming: Home vs Dashboard vs Hub

### Do we have signal from sources?

Yes—across the tools we benchmarked, there’s consistent patterning:

- “Home” / “Today” anchors are common.
- “Dashboard” is a **page type** (layout), not always a nav label.
- “Hub” is less standard and tends to read as internal jargon unless your product is explicitly “hub-first.”

### Recommendation (what to use)

Use **Home** as the canonical sidebar label.

**Why Home wins:**

- Shortest label (good for mobile + narrow sidebars)
- Most universally understood (lowest learning cost)
- Works even when Home contains multiple widgets/sections
- Lets “Dashboard” remain a descriptor: “Home is a dashboard page.”

**Implementation detail:**

- Sidebar label: **Home**
- Page title (optional): “Home” or “Dashboard” depending on tone
- In copy, you can say: “Your Home dashboard” without calling the nav item Dashboard.

I updated the spec to reflect this explicitly.

---

## 3) Biggest structural change: create a Planbook umbrella module

Right now, your navigation is splitting the planning domain into separate top-level entries:

- Calendar (`/plan/schedule`)
- Lesson Planner (`/plan`)
- Courses (`/lessons`)
- Quran (`/quran`)

This is exactly the kind of fragmentation that makes users feel lost.

### Change request

Replace those four top-level items with a single module: **Planbook**.

Inside **Planbook**, provide local navigation (tabs or secondary nav):

- **Calendar**
- **Subjects** *(Subjects contain Courses; user can browse Subject → Course)*
- **Lesson Plans**
- **In‑session** *(more on this below)*

### Routing

- Clicking **Planbook** should open **Last used** Planbook surface
    - fallback for new users: **Calendar**

This aligns with what we closed in Navigation Bar (Parent App) — Spec.

---

## 4) Second biggest change: create a Records umbrella module

Right now, recordkeeping is split across:

- Attendance (`/attendance`)
- Grades & Progress (`/growth`)
- Reports & Records (`/records`)

### Change request

Replace those with one top-level module: **Records**.

Inside Records, provide local nav:

- **Attendance**
- **Grades & Progress**
- **Evidence / Portfolio**
- **Reports & Exports**

### Routing

- Clicking **Records** opens **Last used** Records surface
    - fallback for new users: **Attendance** (we decided this)

### Attendance capture rule (important)

You currently let users “do attendance” directly in the Attendance module. Our target architecture makes this cleaner:

- **Capture/edit attendance** happens in **Planbook → Calendar day view** (execution context)
- **Review/export attendance** happens in **Records → Attendance**
- Records → Attendance should include a prominent link: **“Mark today’s attendance” → Planbook day view**

This reduces “two places to edit the same thing.”

---

## 5) People and Compliance must stop being Settings tabs

Your audit showed:

- People goes to `/settings?tab=children`
- Compliance goes to `/settings?tab=records-compliance`

That violates scent-trail logic: users won’t know whether People/Compliance are “real” or “just settings.”

### Change request: People

- Keep **People** as a top-level module
- Clicking People opens a true People landing page:
    - **Roster/Switcher**
    - Permissions/roles
    - Student profiles

### Change request: Compliance

- Keep **Compliance** as a top-level module
- Clicking Compliance opens a dedicated **Status dashboard** (fixed landing)
- Compliance config (if any) can still live under Settings, but Compliance itself should not be a Settings tab.

---

## 6) Move Finances out of top-level

Finances is useful but not a primary daily “mode.”

### Change request

- Remove top-level **Finances**
- Put it under **Settings → Finances** (household admin)

---

## 7) Resources: decide whether it’s Planbook or Settings

Right now Resources is top-level. In our module model it should live under a module.

### Decision rule

- If Resources = learning materials tied to subjects/courses → **Planbook** (course/subject level)
- If Resources = household/admin docs (policies, reference) → **Settings**

### Change request

- Remove top-level Resources
- Re-home it under the chosen module.

---

## 8) Quran should not be a top-level destination

Your screenshot currently has Quran as a top-level nav item and also dashboard shortcuts.

### Change request

- Remove Quran from top-level nav.
- Quran becomes a **Subject** under:
    - **Planbook → Subjects → Quran → Course**
- Keep a **Home widget shortcut** for Quran if it’s high-frequency.

This prevents “special-case subject inflation” (otherwise you’ll need Math/Science/etc. top-level later).

---

## 9) Messages: keep top-level only if it’s truly launched + opt-in

In screenshot: Messages exists with badge “3”.

### Change request (conditional)

- If messaging is stable and intended: keep it top-level.
- If it’s partial/early: hide unless enabled (opt-in). When enabled, it can appear top-level with badge.

---

## 10) Add the desktop “speed layer” (hover menus)

Currently: no hover menus.

### Change request

Add hover menus for **all top-level modules**:

- Home, Planbook, Records, Compliance, People, Settings (+ Messages if enabled)

Rules:

- Hover reveals local destinations (tabs) + “View all”
- Click always works without hover
- Cap depth ≈ 3 levels
    - Example: Planbook → Subjects → Subject → Course (OK)
    - Don’t go deeper than that via hover

---

## 11) Learner context must be globally persistent

Currently “Viewing: All children” exists on Dashboard. It needs to be visible everywhere.

### Change request

- Move learner switcher to a **global header** or **top of sidebar**.
- Ensure all modules respect it consistently (Planbook, Records, Compliance).

---

## 12) Add the missing page: “In‑session mode” (classroom screen)

This is a good call—and it absolutely needs a home.

### What it is

A full-screen “run the day” view for parent/teacher during instruction:

- visual timer
- visual schedule / current block
- next up
- quick actions (mark complete, add note, reschedule)

### Where it belongs (recommended)

Put **In‑session** under **Planbook**, not as a new top-level module.

**Why Planbook is correct:**

- It’s execution-time usage of schedule/calendar (Planbook domain).
- It avoids top-level sprawl.
- It aligns with the canonical capture flow (day view).

### Entry points (important)

- Home widget: **Start session**
- Planbook local nav: **In‑session**
- Planbook hover menu: **In‑session**
- Optional keyboard shortcut later (“Start session”)

I added this placement into the spec so the nav system already accounts for it.

---

## 13) Concrete “target nav mapping” from your current UI

Here’s the exact mapping from what you have → where it should go:

### Top-level now → target

- Dashboard → **Home** (rename)
- Calendar → **Planbook → Calendar**
- Lesson Planner → **Planbook → Lesson Plans**
- Courses → **Planbook → Subjects** (course browsing)
- Attendance → **Records → Attendance**
- Grades & Progress → **Records → Grades & Progress**
- Reports & Records → **Records → Reports & Exports**
- People → **People** (real module, not Settings tab)
- Resources → **Planbook or Settings** (pick one)
- Quran → **Planbook → Subjects → Quran**
- Messages → **Messages** (only if launched/opt-in)
- Finances → **Settings → Finances**
- Compliance → **Compliance → Status** (real module, not Settings tab)
- Settings → **Settings**
- About → footer/info (fine)
- Sign in and open any /(shell) page.
- Look at the top item of the left sidebar main section.
- Confirm it now reads 'Home' instead of 'Dashboard'.
- Click 'Home' and confirm it navigates to '/' and is highlighted as the active item.
- Confirm no other nav items moved or changed in this wave.
## Workstream 7: Support multiple teachers per household (approved). The household_members model already supports multiple memberships with roles ('owner' | 'member'); this adds a 'teacher' role option to membership and surfaces it in the member management UI so an owner can add/invite additional teachers and assign the teacher role. Smallest safe slice builds on the existing invite/members infrastructure rather than introducing a new permissions engine.

- Feature area: household
- Owning component: features/household/front/components/MemberManager.tsx
- Allowed files: features/household/front/components/MemberManager.tsx, features/household/server/repository.ts, features/household/api/routes/members.ts, features/household/api/routes/invite.ts, db/schema.ts, features/household/__tests__/integration/MemberManager.test.tsx, features/household/__tests__/api/membership.test.ts, features/household/__tests__/api/repository.test.ts
- Blast radius: Touches db/schema.ts: household_members.role currently documents 'owner' | 'member' (text column, default 'member'). Adding 'teacher' is a value-level addition, not a column change, so no migration is strictly required, but the role set is referenced by membership routes and any role-based gating — verify all role checks tolerate the new value. npm run build required because household repository/route contracts and schema comments change. This slice adds the teacher role + UI; it does NOT implement teacher-specific permission scoping (what a teacher can/can't do) — that is follow-up work.

> ⚠️ **Clarifying questions — confirm before executing this workstream:**
> - Should adding a 'teacher' role in this slice grant any distinct permissions, or is 'teacher' initially equivalent to 'member' (label/role-tag only) with permission scoping handled in a follow-up? The current scope treats it as a role label without new permission gating.
> - Should existing 'member' rows be left as-is, or should some be migrated/relabelled to 'teacher'?
- Test plan:
  - `NEW TEST: features/household/__tests__/api/repository.test.ts — a member can be created/updated with role 'teacher' and multiple teacher members can coexist in one household`
  - `NEW TEST: features/household/__tests__/api/membership.test.ts — the members/invite route accepts and persists the 'teacher' role and rejects unknown roles`
  - `NEW TEST: features/household/__tests__/integration/MemberManager.test.tsx — the member manager lets an owner add another member with the 'teacher' role and lists multiple teachers`
  - `RUN: npm test -- features/household`
  - `RUN: npm run build`

### UAT

### 1e365a22-06c7-4bf6-b28b-3d4a73c0faa4

- Context: Allow multiple teachers to be added to a specific household
- Sign in as the owner of a household.
- Open the household member management UI (Settings -> People / member manager).
- Invite or add a new member and assign them the 'teacher' role.
- Add a second member, also as a 'teacher'.
- Confirm both teachers are listed in the household with the teacher role shown.
- Confirm the owner can still manage (remove) the added teachers.
## Workstream 8: Cross-household messaging (approved, high risk) — HOLD pending data-isolation review. No messaging feature exists today (the 'Messages' sidebar item is a disabled stub). The safe first slice keeps Messages disabled and adds a guard test asserting it stays disabled until a security/tenant-isolation review is completed, because cross-household messaging deliberately breaks the per-household data boundary. This workstream is held via clarifying questions and should not be built until the questions are answered.

- Feature area: other
- Owning component: features/layout/lib/navConfig.ts
- Allowed files: features/layout/lib/navConfig.ts, features/layout/__tests__/navConfig.test.ts
- Blast radius: This item was admin-approved but its own classification recommends a security and data-isolation review before implementation, and there is NO existing messaging feature — only a disabled 'messages' nav stub in navConfig.ts. Cross-household messaging would intentionally cross the tenant boundary that the rest of the app enforces (household_members scoping, tenant context in features/lib), so building it without a design + security review is unsafe. The safe slice asserts the surface stays disabled. Full delivery requires a new messaging feature (schema tables, service/repository with explicit cross-tenant authorization, routes, UI) and a security review — out of scope for an automated PR. NOTE: navConfig.ts is also touched by the nav-restructure workstream; sequence the PRs to avoid conflict.

> ⚠️ **Clarifying questions — confirm before executing this workstream:**
> - Cross-household messaging has no existing feature to build on and its classification recommends a security/data-isolation review first. Do you want to (a) commission a design + security review before any code, or (b) proceed to a scaffolded, feature-flagged messaging foundation — and if (b), what authorization model governs who may message across households?
> - What is the intended scope of 'different household' messaging — fully open user-to-user, admin-mediated, or invitation/consent based? This determines the entire data model and isolation strategy.
- Test plan:
  - `NEW TEST: features/layout/__tests__/navConfig.test.ts — the 'messages' nav item remains disabled (no href, disabled: true) so no cross-household messaging surface is exposed before the isolation review`
  - `RUN: npm test -- features/layout/__tests__/navConfig.test.ts`

### UAT

### f674588f-7f9a-4e9f-a7e2-cc1d4621de95

- Context: Allow messages between users of different household.
- Sign in and open any /(shell) page.
- Confirm the 'Messages' item in the sidebar remains visible-but-disabled (not clickable) — no cross-household messaging surface is exposed.
- Note: full UAT for cross-household messaging is deferred until the data-isolation review and design questions above are resolved; this PR only verifies the messaging surface stays safely disabled.
