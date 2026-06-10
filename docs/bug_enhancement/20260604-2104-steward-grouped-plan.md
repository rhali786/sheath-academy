# Feedback Steward Grouped Plan

Generated at: 2026-06-04T21:10:00.000Z

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

## Workstream 1: Add filtered feedback count display and reject action button to admin feedback page

- Feature area: feedback
- Owning component: features/feedback/front/pages/AdminFeedbackPage.tsx
- Allowed files: features/feedback/front/pages/AdminFeedbackPage.tsx, features/feedback/__tests__/integration/AdminFeedbackPage.test.tsx
- Test plan:
  - `NEW TEST: features/feedback/__tests__/integration/AdminFeedbackPage.test.tsx — displays filtered count below Filters heading when filters are applied`
  - `NEW TEST: features/feedback/__tests__/integration/AdminFeedbackPage.test.tsx — reject button appears for classified items and updates status to cancelled`
  - `RUN: npm test -- features/feedback/__tests__/integration/AdminFeedbackPage.test.tsx`

### UAT

### 1131d003-f5a1-4ccd-a2af-0a953d48c641

- Context: Add count at the top under the Filters of the filtered feedbacks on the page.
- Navigate to /admin/feedback
- Apply a filter (e.g., select 'classified' status)
- Verify count appears below the Filters heading showing number of filtered results

### ad71a81f-6bc8-4463-9d1a-0f8f3c11951e

- Context: Add a reject planning button for admin on the feedback page. Perhaps also the labels should be reviewed, Thanks for your Feedback, and Implemented
- Navigate to /admin/feedback
- Find a feedback item with 'classified' status
- Verify a 'Reject' button is visible alongside other actions
- Click Reject and verify status changes to 'cancelled'
## Workstream 2: Center version number and Hijri calendar in sidebar, add collapsible toggle

- Feature area: layout
- Owning component: features/layout/front/components/Sidebar.tsx
- Allowed files: features/layout/front/components/Sidebar.tsx, features/layout/__tests__/Sidebar.test.tsx, features/layout/front/components/AppShell.tsx
- Blast radius: Collapsible sidebar requires state management in AppShell to persist collapsed state across navigation.
- Test plan:
  - `NEW TEST: features/layout/__tests__/Sidebar.test.tsx — version number is centered in sidebar footer`
  - `NEW TEST: features/layout/__tests__/Sidebar.test.tsx — Hijri calendar date is centered below tagline`
  - `NEW TEST: features/layout/__tests__/Sidebar.test.tsx — sidebar collapse toggle button is visible and toggles sidebar width`
  - `RUN: npm test -- features/layout/__tests__/Sidebar.test.tsx`

### UAT

### 1831c99f-8e92-43be-8274-6d1189d8bbe5

- Context: Allow the sidebar to collapse. Like how AI screens have the square with the partial square inside of it so you can expand and collapse that panel.
- Navigate to any page with sidebar visible (e.g., /dashboard)
- Locate collapse toggle icon (square with partial square inside)
- Click toggle and verify sidebar collapses to icons-only mode
- Click again to verify sidebar expands back

### 103eaba1-67d8-4fde-addc-86228a3860e0

- Context: Center the version number in the navigation Side bar
- Navigate to any page with sidebar visible
- Scroll to bottom of sidebar if needed
- Verify version number (e.g., v2.15.4) is horizontally centered

### 3dc815ad-a973-4672-a4ee-39553008f324

- Context: Center the Arabic Hijri calendar under where it says Faith.Learnig. Purpose.
- Navigate to any page with sidebar visible
- Look at sidebar header below 'Faith. Learning. Purpose.' tagline
- Verify Arabic Hijri date is horizontally centered under the tagline
## Workstream 3: Update header greeting to show Arabic salutation with user name and rotating greetings

- Feature area: layout
- Owning component: features/layout/front/components/Header.tsx
- Allowed files: features/layout/front/components/Header.tsx, features/layout/__tests__/Header.test.tsx, features/layout/lib/arabicGreetings.ts
- Test plan:
  - `NEW TEST: features/layout/__tests__/Header.test.tsx — displays Arabic greeting with user name when session has name`
  - `NEW TEST: features/layout/__tests__/Header.test.tsx — shows email in grey parentheses below greeting`
  - `NEW TEST: features/layout/__tests__/Header.test.tsx — uses one of 5-8 predefined Arabic greetings`
  - `RUN: npm test -- features/layout/__tests__/Header.test.tsx`

### UAT

### a2a7a0b6-9751-4967-91f8-8daf9e8a5955

- Context: On the header it shows me by my email address. I would like for it to greet me in arabic, say my name, and have my email in grey in parantehses under the greeting of my name. So like Marhaban Rasheed (rhali786@gmail.com). And it should have 5-8 different greetings so it doesn't get stale.
- Sign in to the app
- Navigate to dashboard (/)
- Verify header shows Arabic greeting (e.g., 'Marhaba Rasheed')
- Verify email appears in grey parentheses below the name
- Refresh page multiple times to see different greetings rotate
## Workstream 4: Rename 'classified' status to 'reviewed' throughout the feedback system

- Feature area: feedback
- Owning component: features/feedback/types.ts
- Allowed files: features/feedback/types.ts, features/feedback/front/pages/AdminFeedbackPage.tsx, features/feedback/front/pages/FeedbackHubPage.tsx, features/feedback/front/pages/FeedbackDetailPage.tsx, features/feedback/server/service.ts, features/feedback/server/repository.ts, features/feedback/__tests__/**/*.ts, scripts/feedback-steward/**/*.ts
- Blast radius: HIGH BLAST RADIUS: The 'classified' status value is used in 38+ files including db/schema.ts default, steward scripts, admin filters, and user-facing pages. This rename requires: (1) database migration to update existing rows, (2) coordinated changes across features/feedback and scripts/feedback-steward, (3) updating all filter dropdowns and display labels. Recommend splitting into separate PR with migration script.
- Test plan:
  - `NEW TEST: features/feedback/__tests__/api/service.test.ts — classification sets status to 'reviewed' not 'classified'`
  - `RUN: npm test -- features/feedback`
  - `RUN: npm test -- scripts/feedback-steward`
  - `RUN: npm run build`

### UAT

### 533ecbb1-bc49-4795-b8fe-3d579fc96076

- Context: Change the clarification or status of feedback from classified to reviews once it has been processed by the daily process. Reviewed makes more since to users than clarified
- Navigate to /admin/feedback
- Use status filter dropdown
- Verify 'Reviewed' option exists instead of 'Classified'
- Filter by 'Reviewed' and verify items previously marked 'classified' appear
- Check status badge on feedback cards shows 'reviewed' not 'classified'
## Workstream 5: DEFERRED: Module-based navigation restructure requires separate architecture planning

- Feature area: navigation
- Owning component: features/layout/lib/navConfig.ts
- Allowed files: features/layout/lib/navConfig.ts
- Blast radius: DEFERRED - HIGH RISK: This feedback requests a complete navigation restructure from feature-per-tab to module-based navigation (Home, Planbook, Records, Compliance, People, Settings). This affects: sidebar, routing, hover menus, learner context persistence, and introduces new 'In-session mode'. Recommend creating a separate feature-wave plan per docs/feature-waves.md before implementation.
- Test plan:
  - `This workstream requires separate architecture planning due to scope`

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
- DEFERRED - requires separate architecture planning and feature-wave breakdown
## Workstream 6: DEFERRED: Multiple teachers per household requires auth/permissions architecture review

- Feature area: household
- Owning component: features/household/server/service.ts
- Allowed files: features/household/server/service.ts
- Blast radius: DEFERRED - MEDIUM RISK: Adding multiple teachers per household touches auth, permissions, and multi-tenant data isolation. Requires: (1) schema changes to model teacher-household relationships, (2) permission scoping rules, (3) UI for teacher management. Recommend architecture review document before implementation.
- Test plan:
  - `This workstream requires architecture review before implementation`

### UAT

### 1e365a22-06c7-4bf6-b28b-3d4a73c0faa4

- Context: Allow multiple teachers to be added to a specific household
- DEFERRED - requires architecture review for auth and permissions
## Workstream 7: DEFERRED: Cross-household messaging requires security and data-isolation review

- Feature area: messaging
- Owning component: features/messaging/server/service.ts
- Allowed files: features/messaging/server/service.ts
- Blast radius: DEFERRED - HIGH RISK: Cross-household messaging breaks the current single-household data isolation model. Per the classification recommendation, this requires a security and data-isolation review before any implementation. Concerns include: message privacy, consent, blocking, moderation, and compliance.
- Test plan:
  - `This workstream requires security review before implementation`

### UAT

### f674588f-7f9a-4e9f-a7e2-cc1d4621de95

- Context: Allow messages between users of different household.
- DEFERRED - requires security and data-isolation review per classification recommendation
