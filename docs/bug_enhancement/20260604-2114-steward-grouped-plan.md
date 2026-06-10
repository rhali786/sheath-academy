# Feedback Steward Grouped Plan

Generated at: 2026-06-04T21:14:42.846Z

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

## Workstream 1: On the admin feedback page add a filtered-count line directly under the Filters panel, add an admin Reject-for-planning action (sets status to the existing 'cancelled' value via a new admin endpoint), and review the status/CTA copy so users see clearer labels (e.g. 'Thanks for your feedback', 'Implemented').

- Feature area: feedback
- Owning component: features/feedback/front/pages/AdminFeedbackPage.tsx
- Allowed files: features/feedback/front/pages/AdminFeedbackPage.tsx, features/feedback/front/services/api.ts, features/feedback/server/service.ts, features/feedback/server/repository.ts, features/feedback/__tests__/integration/AdminFeedbackPage.test.tsx, features/feedback/__tests__/api/service.test.ts
- Blast radius: The Reject action needs a new admin mutation. The approve flow lives at POST /api/admin/feedback/[id]/approve — verify whether reject should be a sibling route under app/api/admin/feedback/[id] or the feedback feature router before wiring, and reuse the existing 'cancelled' FeedbackStatus value rather than introducing a new status (status rename is handled separately and deferred). Copy/label review is display-only and must not change stored enum values.
- Test plan:
  - `NEW TEST: features/feedback/__tests__/integration/AdminFeedbackPage.test.tsx — renders a filtered-count line ('N feedback items') directly beneath the Filters panel and updates it when a filter select changes the returned rows`
  - `NEW TEST: features/feedback/__tests__/integration/AdminFeedbackPage.test.tsx — shows a 'Reject for planning' button on actionable rows and POSTs to the reject endpoint, moving the row to a cancelled/rejected state on success`
  - `NEW TEST: features/feedback/__tests__/api/service.test.ts — reject action transitions a feedback row to status 'cancelled' and is rejected for non-admin callers`
  - `RUN: npm test -- features/feedback/__tests__/integration/AdminFeedbackPage.test.tsx`
  - `RUN: npm test -- features/feedback/__tests__/api/service.test.ts`

### UAT

### 1131d003-f5a1-4ccd-a2af-0a953d48c641

- Context: Add count at the top under the Filters of the filtered feedbacks on the page.
- Open the Render preview and sign in as an admin (dev@sheathacademy.ai).
- Navigate to /admin/feedback.
- Locate the 'Filters' panel.
- Confirm a count line appears directly under the Filters panel reading e.g. 'N feedback items'.
- In the 'Status' filter select 'Classified' and confirm the count updates to match the now-filtered list.
- Clear the filter and confirm the count returns to the total.

### ad71a81f-6bc8-4463-9d1a-0f8f3c11951e

- Context: Add a reject planning button for admin on the feedback page. Perhaps also the labels should be reviewed, Thanks for your Feedback, and Implemented
- On /admin/feedback as admin, find a feedback card that is actionable (awaiting approval / classified).
- Confirm a 'Reject for planning' button is visible alongside the existing approve action.
- Click 'Reject for planning' and confirm the card moves to a cancelled/rejected state and the queue summary counts update.
- Reload the page and confirm the rejected item stays rejected.
- Confirm the status/CTA labels read in clearer user-facing wording (e.g. 'Thanks for your feedback', 'Implemented') rather than raw enum text.
## Workstream 2: Sidebar polish: add a collapse/expand toggle for the left sidebar (AI-style panel icon), center the version number in the sidebar footer, and center the Arabic Hijri date block under the 'Faith. Learning. Purpose.' tagline.

- Feature area: dashboard
- Owning component: features/layout/front/components/Sidebar.tsx
- Allowed files: features/layout/front/components/Sidebar.tsx, features/layout/front/components/AppShell.tsx, features/layout/__tests__/Sidebar.test.tsx
- Blast radius: The 'Faith. Learning. Purpose.' tagline and Hijri date both live in Sidebar.tsx (not the settings page, despite the feedback being filed from /settings). Collapsed state may need to be lifted to AppShell.tsx if the main content area must reflow when the panel collapses; keep the toggle local to the sidebar if reflow is not required for the first slice.
- Test plan:
  - `NEW TEST: features/layout/__tests__/Sidebar.test.tsx — renders a collapse toggle button (aria-label) that, when clicked, collapses the sidebar panel and toggles back on a second click`
  - `NEW TEST: features/layout/__tests__/Sidebar.test.tsx — sidebar-version element is center-aligned`
  - `NEW TEST: features/layout/__tests__/Sidebar.test.tsx — sidebar-hijri-date block is centered under the 'Faith. Learning. Purpose.' tagline`
  - `RUN: npm test -- features/layout/__tests__/Sidebar.test.tsx`

### UAT

### 1831c99f-8e92-43be-8274-6d1189d8bbe5

- Context: Allow the sidebar to collapse. Like how AI screens have the square with the partial square inside of it so you can expand and collapse that panel.
- Open the Render preview and sign in, then go to /dashboard.
- Find the new collapse toggle (panel icon) on the left sidebar.
- Click it and confirm the sidebar collapses.
- Click it again and confirm the sidebar expands back to full width.
- Verify navigation links still work in both states.

### 103eaba1-67d8-4fde-addc-86228a3860e0

- Context: Center the version number in the navigation Side bar
- On /dashboard, scroll to the bottom of the left sidebar.
- Confirm the version number (e.g. 'v2.15.4') is horizontally centered in the sidebar footer rather than left-aligned.

### 3dc815ad-a973-4672-a4ee-39553008f324

- Context: Center the Arabic Hijri calendar under where it says Faith.Learnig. Purpose.
- On /dashboard, look at the top of the left sidebar under the 'Faith. Learning. Purpose.' tagline.
- Confirm the Arabic Hijri date block is centered beneath the tagline rather than left-indented.
## Workstream 3: Replace the header's raw email display with a friendly greeting: a rotating Arabic greeting plus the user's name, with the email in grey parentheses underneath (e.g. 'Marhaban Rasheed (rhali786@gmail.com)'). Provide 5-8 greetings that rotate so it does not feel stale.

- Feature area: dashboard
- Owning component: features/layout/front/components/Header.tsx
- Allowed files: features/layout/front/components/Header.tsx, features/layout/lib/headerGreeting.ts, features/layout/__tests__/Header.test.tsx
- Blast radius: Greeting list/selection logic should be a small pure helper (features/layout/lib/headerGreeting.ts) so it is unit-testable without rendering; Header reads session.user.name/email which already exist. No data layer or schema changes.
- Test plan:
  - `NEW TEST: features/layout/lib/__tests__/headerGreeting.test.ts — greeting selector returns one of 5-8 defined Arabic greetings and varies its selection across calls/seeds`
  - `NEW TEST: features/layout/__tests__/Header.test.tsx — header shows '<greeting> <name>' with the email rendered in grey parentheses underneath, and falls back to email when no name is present`
  - `RUN: npm test -- features/layout/lib/__tests__/headerGreeting.test.ts`
  - `RUN: npm test -- features/layout/__tests__/Header.test.tsx`

### UAT

### a2a7a0b6-9751-4967-91f8-8daf9e8a5955

- Context: On the header it shows me by my email address. I would like for it to greet me in arabic, say my name, and have my email in grey in parantehses under the greeting of my name. So like Marhaban Rasheed (rhali786@gmail.com). And it should have 5-8 different greetings so it doesn't get stale.
- Open the Render preview, sign in, and go to /dashboard.
- Look at the top-right header.
- Confirm it shows an Arabic greeting followed by your name (e.g. 'Marhaban Rasheed').
- Confirm your email appears in grey, in parentheses, underneath the greeting.
- Reload the page a few times and confirm the greeting rotates among several variants rather than staying identical.
## Workstream 4: First safe slice of the admin-approved module-based navigation restructure: rename the top-level 'Dashboard' nav item to 'Home' (canonical label from the spec) while keeping its '/' route, leaving the deeper module consolidation (Planbook, Records umbrellas, hover menus, global learner switcher) as documented follow-up.

- Feature area: dashboard
- Owning component: features/layout/lib/navConfig.ts
- Allowed files: features/layout/lib/navConfig.ts, features/layout/front/components/Sidebar.tsx, features/layout/__tests__/Sidebar.test.tsx
- Blast radius: Admin-approved but intentionally scoped to the lowest-risk slice. The full feedback requests an architecture-wide nav restructure (collapse Calendar/Lesson Planner/Courses/Quran into a Planbook module; Attendance/Grades/Reports into Records; promote People and Compliance out of Settings tabs; move Finances/Resources under modules; add desktop hover menus; make the learner switcher global; add an In-session page). That is multi-PR work touching navConfig, Sidebar, multiple app/(shell) routes, and the isNavItemActive logic, and must be planned as its own wave. This PR only renames the Dashboard label to Home and updates the related test/active-state references; the isNavItemActive 'dashboard' id branch must be updated consistently if the item id (not just the label) is renamed.
- Test plan:
  - `NEW TEST: features/layout/__tests__/Sidebar.test.tsx — sidebar renders a top-level 'Home' nav item linking to '/' and no longer renders a 'Dashboard' label`
  - `NEW TEST: features/layout/__tests__/Sidebar.test.tsx — the Home item is marked active when pathname is '/'`
  - `RUN: npm test -- features/layout/__tests__/Sidebar.test.tsx`

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
- Open the Render preview, sign in, and look at the left sidebar.
- Confirm the first top-level nav item now reads 'Home' (not 'Dashboard').
- Click 'Home' and confirm it navigates to '/' and is highlighted as the active item.
- Confirm all other nav items still render and route as before (no regressions from the rename).
## Workstream 5: Admin-approved first slice of multiple-teachers-per-household: extend the membership role model with a 'teacher' role (currently 'owner' | 'member') and surface it in the member management UI so a household can add additional teachers, with role-based scoping enforced at the repository/service boundary.

- Feature area: household
- Owning component: features/household/server/repository.ts
- Allowed files: features/household/server/repository.ts, features/household/front/components/MemberManager.tsx, features/household/api/routes/invite.ts, features/household/api/routes/members.ts, features/household/__tests__/integration/MemberManager.test.tsx, features/household/__tests__/api/membership.test.ts
- Blast radius: Extends the MembershipRole union ('owner' | 'member' -> add 'teacher') defined in features/household/server/repository.ts. The householdMembers.role column in db/schema.ts is free-text with a 'member' default and an inline 'owner' | 'member' comment, so no migration is required, but the schema comment and any place that branches on role (invite, switch, permission checks) must be reviewed for the new value. Keep this slice to adding/inviting teachers and listing them; deeper per-role permission scoping across features is follow-up.
- Test plan:
  - `NEW TEST: features/household/__tests__/api/membership.test.ts — addMember accepts a 'teacher' role and listMembersWithUsers returns it; an invite can be created with role 'teacher'`
  - `NEW TEST: features/household/__tests__/integration/MemberManager.test.tsx — member manager lets an owner invite/add a teacher and displays multiple teachers in the roster`
  - `RUN: npm test -- features/household/__tests__/api/membership.test.ts`
  - `RUN: npm test -- features/household/__tests__/integration/MemberManager.test.tsx`
  - `RUN: npm run build`

### UAT

### 1e365a22-06c7-4bf6-b28b-3d4a73c0faa4

- Context: Allow multiple teachers to be added to a specific household
- Open the Render preview and sign in as a household owner.
- Go to the member management UI (Settings -> household members / People).
- Invite or add a new member and choose the 'Teacher' role.
- Repeat to add a second teacher.
- Confirm both teachers appear in the household roster with the Teacher role label.
- Confirm the owner role is unchanged and removing a teacher still works.
## Workstream 6: Admin-approved cross-household messaging — safe foundational slice only. Because cross-household communication breaks the current strict household data-isolation model, land a default-deny capability boundary plus a disabled feature flag at the household data-access layer (no UI, no actual message delivery), so the boundary is explicit and tested before any messaging feature is built.

- Feature area: other
- Owning component: features/household/server/repository.ts
- Allowed files: features/household/server/repository.ts, features/household/__tests__/api/membership.test.ts
- Blast radius: High-risk, security-sensitive: the original classification calls for a security and data-isolation review before implementing cross-household messaging, and there is currently NO messaging feature in the repo (no features/messaging). This admin-approved item is therefore scoped to its smallest safe, actionable slice: a default-deny capability helper plus a disabled flag at the household data-access boundary — it does not expose any UI, store messages, or relax isolation. Building real cross-household messaging (transport, threads, permissions, abuse/privacy controls, opt-in) is a separate wave that must follow the security/data-isolation review and likely a new features/messaging module with its own schema and migration.
- Test plan:
  - `NEW TEST: features/household/__tests__/api/membership.test.ts — cross-household messaging capability check defaults to denied (returns false) for two distinct household ids and only permits same-household pairs`
  - `RUN: npm test -- features/household/__tests__/api/membership.test.ts`
  - `RUN: npm run build`

### UAT

### f674588f-7f9a-4e9f-a7e2-cc1d4621de95

- Context: Allow messages between users of different household.
- This slice is intentionally non-user-facing (no messaging UI ships).
- Reviewer verification is via the automated tests: confirm npm test for the membership suite passes and the cross-household capability check defaults to denied.
- Confirm no new menu item, route, or message-sending UI is exposed in the Render preview (Messages remains disabled in the sidebar).
- Confirm the follow-up security/data-isolation review and messaging-feature wave are recorded before any user-facing messaging is built.
## Workstream 7: DEFERRED: rename the 'classified' feedback status to 'reviewed' for clearer user-facing wording. Deferred because 'classified' is a FeedbackStatus enum value used across the feedback service, repository, admin filters, and the steward scripts (run-daily, run-classify, requeue, etc.) plus the DB column — a rename is a cross-cutting status migration, not a local UI label change.

- Feature area: feedback
- Owning component: features/feedback/types.ts
- Allowed files: features/feedback/types.ts
- Blast radius: 'classified' is referenced in ~18 files including features/feedback/server/service.ts, features/feedback/server/repository.ts, the admin filter dropdown and STATUS_COLORS/queueSummary in AdminFeedbackPage.tsx, and scripts/feedback-steward/* (run-daily, run-classify, run-reset-classification, feedback-requeue, steward-preflight) and their tests. If the stored value is renamed it is effectively a status/data migration touching the steward automation; a display-only label ('Reviewed' shown for the 'classified' value) is likely the safe way to satisfy the user without enum churn. Non-approved item, so deferral with this documented reason is permitted.
- Test plan:
  - `REVIEW REQUIRED before build: produce a migration plan covering the FeedbackStatus enum rename across features/feedback (types, service, repository, AdminFeedbackPage filters/labels) and all scripts/feedback-steward/* references and tests, decide whether to change the stored value or only the display label (a display-only relabel avoids the enum/DB churn and may fully satisfy the request), and confirm DB rows and steward pipeline stay consistent. Do not implement until this review picks an approach.`

### UAT

### 533ecbb1-bc49-4795-b8fe-3d579fc96076

- Context: Change the clarification or status of feedback from classified to reviews once it has been processed by the daily process. Reviewed makes more since to users than clarified
- Deferred pending review — no shippable change in this run.
- After the review picks the display-only-relabel vs full-enum-rename approach, UAT will be: on /admin/feedback confirm items processed by the daily steward show 'Reviewed' instead of 'Classified', and confirm the steward pipeline and filters still function.
