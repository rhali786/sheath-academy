# Plan: UAT follow-ups from Wave 5 / Feedback Waves 1–4

Source: UAT findings raised by the user after merging `feature/learning-time-phase1` and `feat/feedback-waves-1-4` into `dev` (2026-06-12). Four items, each scoped as its own phase within a single branch:

1. **1b** — Resources page: make "Generate lessons" / Pacing discoverable without a confusing "Details" toggle, and auto-show it for a newly added resource.
2. **4a** — Header notification bell: `attendance_missing` (and other) alerts must clear without a full page reload.
3. **4b** — Household setup: enable the "Set up lessons" and "Start portfolio" cards by linking to the already-built `/plan` and `/portfolio` pages.
4. **5** — Learning Time: show session history on `/learning-time`, and feed "time spent per subject" into the Records report.

---

## Item 1 — Resources: discoverable "Generate lessons" (1b)

### Summary

Newly added resources don't show "Generate lessons" / Pacing until the user notices and clicks an unlabeled "Details" toggle. Auto-expand a newly created resource's generation panel, and rename the toggle so it describes what it reveals.

### Planning mode

Mode 2 — local feature behavior (single page + one panel, no cross-feature data).

### Effort

Small (~½ day incl. tests). Two-line behavior change + one new integration test block.

### Code-path audit

| Section | Path |
|---|---|
| Resource list + "Add resource" form | `features/resources/front/pages/ResourcesPage.tsx:32-36` (`handleCreate`), `:84-124` (resource card map) |
| Expand/collapse toggle | `features/resources/front/pages/ResourcesPage.tsx:99-106` — button labelled "Details"/"Collapse", `data-testid="resource-expand-${resource.id}"`, controls `selected` state (single-expand) |
| Expanded content | `features/resources/front/pages/ResourcesPage.tsx:110-122` — `PacingCard` (if `totalPages`) + `LessonGenerationPanel` |
| Generation panel | `features/resources/front/components/LessonGenerationPanel.tsx` — already has strategy/pacing/cadence controls, learner + course selectors, "Generate lessons" and "Save to plan" |
| Current owner | `features/resources` — correct, no ownership violation |
| Existing tests | `features/resources/__tests__/integration/ResourcesPage.test.tsx` (currently only covers `ResourceForm`, `PacingCard`, `VerificationBadge` — no test renders `ResourcesPage` itself); `features/resources/__tests__/integration/LessonGenerationPanel.test.tsx` |
| Missing tests | New `ResourcesPage` integration coverage: (a) toggle label text, (b) auto-expand on create |

### Source-of-truth decision

No change. `features/resources` owns resources and the generation panel; this is a presentation-only fix.

### UI pattern audit

- No new component, no icons, no destructive action, no modal/confirmation needed.
- Toggle remains a plain text button (`ui-style-guide`'s record-card "inline" pattern — content expands within the existing card).

### Label-collision note (decided here, not in implementation)

`LessonGenerationPanel` already renders a **"Generate lessons"** section heading (`LessonGenerationPanel.tsx:117`) **and** a **"Generate lessons"** submit button (`:198`). Reusing "Generate lessons" for the card toggle would put three identical strings on one expanded card — ambiguous for both users and `getByText`/`getByRole` queries. The toggle is therefore labelled **"Plan lessons"** (collapsed) / **"Hide"** (expanded), describing what the panel is *for* without colliding with the panel's own controls.

### Acceptance criteria

- After submitting "Add resource", the new resource's card is rendered already expanded (Pacing card if applicable + "Generate lessons" panel visible) — no extra click required.
- Each resource card's toggle button reads **"Plan lessons"** when collapsed and **"Hide"** when expanded (replacing "Details"/"Collapse"). `data-testid="resource-expand-${resource.id}"` is unchanged.
- Expanding one resource's panel collapses any previously expanded resource (existing single-expand behavior preserved).
- Clicking "Hide" on the auto-expanded new resource collapses it and shows "Plan lessons" again.

### Data / contract changes

None.

### API / store / service plan

None — purely client state (`selected`) in `ResourcesPage.tsx`.

### UI plan

- `ResourcesPage.tsx`:
  - `handleCreate`: after `setResources(prev => [...prev, res.data])`, call `setSelected(res.data)`.
  - Toggle button label: `{selected?.id === resource.id ? 'Hide' : 'Plan lessons'}`.

### Testing plan (failing tests first)

`ResourcesPage.test.tsx` currently renders only `ResourceForm`/`PacingCard`/`VerificationBadge` — it never renders `ResourcesPage` itself. The new block must therefore mock the full surface the page + panel consume: `@/features/household/front/context` (`useHousehold` → `householdProfile`, `studentProfiles`, `allSubjects`, `loading: false`), `../services/api` (`resourcesApi.listResources`, `resourcesApi.createResource`), and `@/features/plan/front/services/api` (`plannerApi.createLesson`).

1. New `describe('ResourcesPage')` block in `features/resources/__tests__/integration/ResourcesPage.test.tsx`:
   - "resource card toggle reads 'Plan lessons' when collapsed and 'Hide' when expanded" — render `ResourcesPage` with one seeded resource (mock `resourcesApi.listResources`), assert toggle label, click it, assert it becomes "Hide".
   - "newly added resource is shown expanded with the Generate lessons panel visible" — mock `resourcesApi.createResource`, submit "Add resource", assert `LessonGenerationPanel`'s `data-testid="lesson-generation-panel"` is present for the new resource without clicking its toggle.

### Build phases

1. Add the two `ResourcesPage` integration tests (failing).
2. Implement `setSelected(res.data)` in `handleCreate` and the label rename; tests pass.

### Out of scope

- Moving Pacing/Generate-lessons fields into the "Add resource" form itself (the form stays focused on resource metadata; generation stays a post-creation step).
- Any change to `LessonGenerationPanel`'s internal controls.

### Manual QA

1. Go to `/resources`, click "Add resource", fill in title + total pages/chapters, submit.
2. Confirm the new resource card appears already expanded showing Pacing and "Generate lessons" controls, and its toggle reads "Hide".
3. Click "Hide" — card collapses, toggle now reads "Generate lessons".
4. Click "Generate lessons" on a different existing resource — confirm it expands and the first resource (if still expanded) collapses.

---

## Item 2 — Header alerts refresh on navigation (4a)

### Summary

The header notification bell fetches `/api/alerts` once on mount and never again, because `Header` is part of the persistent app shell and doesn't remount on client-side navigation. After a user clears an alert's underlying condition (e.g. logs attendance) and navigates elsewhere, the bell keeps showing the stale alert.

### Planning mode

Mode 2 — local feature behavior (layout/shell component, single data source already correct).

### Effort

Small (~½ day incl. tests). One hook dependency + (recommended) one open-handler refetch; updates to existing Header tests.

### Trigger decision (two triggers, not one)

The draft used route-change refetch alone. That misses the most common path: the user resolves an alert (logs attendance) and **stays on `/attendance`** — the bell stays stale until they navigate. So:

- **Primary: refetch when the dropdown opens.** Freshest data exactly when the user looks at it. Requires `NotificationBellDropdown` to expose an `onOpen` callback (or `Header` to own the open state). This is the trigger that actually covers the reported scenario.
- **Secondary: refetch on route change** (`usePathname`) — cheap, covers the navigate-away case, and keeps the badge count roughly current as the user moves around.

If exposing `onOpen` from `NotificationBellDropdown` proves invasive, ship route-change refetch first (smaller) and add open-refetch as a fast follow — but the plan's preference is both, since open-refetch is the one that fixes the literal complaint.

### Code-path audit

| Section | Path |
|---|---|
| Alert fetch | `features/layout/front/components/Header.tsx:26-31` — `useEffect(() => { fetch('/api/alerts')... }, [])`, runs once on mount only |
| Renders bell | `features/layout/front/components/Header.tsx:53` — `<NotificationBellDropdown alerts={alerts} />` |
| Dropdown open state | `features/dashboard/front/components/NotificationBellDropdown.tsx` — owns its own `open` state today; needs an `onOpen` prop (or a lifted open state) to trigger a parent refetch |
| Underlying data (already fixed) | `features/alerts/api/routes/alerts.ts` → `features/alerts/server/service.ts` `getAlerts()`/`todayLocal()` — timezone-aware, correctly clears `attendance_missing` once the household-local "today" has an attendance row (feedback `9937be68`, already fixed) |
| Precedent for route-aware refetch in shell | `features/layout/front/components/Sidebar.tsx`, `features/dashboard/front/pages/Dashboard.tsx` — both already import `usePathname` from `next/navigation` |
| Precedent for polling refresh | `features/dashboard/front/components/NotificationBellDropdown.tsx` — `setInterval(..., 15000)` for unread conversations (separate data, same dropdown component) |
| Existing tests | `features/layout/__tests__/Header.test.tsx` — mocks `fetch` but does not mock `next/navigation` |
| Missing tests | Header refetches `/api/alerts` when the route (`usePathname()`) changes |

### Source-of-truth decision

No change — `features/alerts` already owns `getAlerts()` and is timezone-correct. The only gap is that `Header` (layout) never re-invokes it. Fix is entirely in `features/layout`.

### Acceptance criteria

- Opening the header bell dropdown triggers a fresh `/api/alerts` fetch, so an alert whose condition was just resolved on the current page disappears on open — without a full page reload.
- After logging attendance for the last child missing it on `/attendance`, then navigating to any other route via the sidebar, the header bell's alert list no longer includes `attendance_missing`.
- Navigating between any two routes triggers a fresh `/api/alerts` fetch (in addition to the initial mount fetch).
- No infinite loop: the route-change effect depends only on `pathname`, which changes once per navigation; the open refetch fires only on the open transition (not on every render while open).

### Data / contract changes

None — reuses `/api/alerts` as-is.

### API / store / service plan

None.

### UI plan

- `Header.tsx`: extract the alert fetch into a `loadAlerts` callback. Call it: (a) on mount, (b) in a `useEffect` keyed on `usePathname()`, and (c) from an `onOpen` handler passed to `NotificationBellDropdown`.
- `NotificationBellDropdown.tsx`: add an optional `onOpen?: () => void` prop, invoked when the dropdown transitions closed → open. (Backward compatible — existing dashboard usage passes nothing.)

### Testing plan (failing tests first)

> **Blast radius:** `Header.test.tsx` does not currently mock `next/navigation`, and `Header` does not import it. Adding `usePathname` means a module-level `jest.mock('next/navigation', ...)` must be added to the file, and the existing `mockFetchEmpty()` setup already covers the mount fetch — verify the existing greeting/sign-out/height tests still pass after the mock is introduced (they don't assert fetch counts, so they should).

1. `features/layout/__tests__/Header.test.tsx`:
   - Add `jest.mock('next/navigation', () => ({ usePathname: jest.fn(() => '/') }))`.
   - "refetches /api/alerts when the route changes" — render `Header`, assert `fetch` called once with `/api/alerts`; change the mocked `usePathname` return value and re-render; assert a second `/api/alerts` fetch.
   - "does not refetch on re-render with the same pathname" — re-render with an unchanged pathname; assert call count unchanged (infinite-loop guard).
   - "refetches /api/alerts when the bell dropdown is opened" — with the real (un-mocked-out) `NotificationBellDropdown` or a stub that calls `onOpen`, trigger open and assert another `/api/alerts` fetch. (If the file's existing `NotificationBellDropdown` mock is kept, extend the mock to call `onOpen` on a click so the wiring is exercised.)

### Build phases

1. Add the three Header tests (failing — no `usePathname`, no `onOpen` wiring yet).
2. Add `usePathname` route-change refetch + the `loadAlerts` extraction; route tests pass.
3. Add `onOpen` to `NotificationBellDropdown` and wire it in `Header`; open-refetch test passes.

### Out of scope

- Polling (`setInterval`) for alerts — route-change refetch covers the reported case (navigate away after resolving the alert's condition). If a future report shows alerts going stale while the user stays on one page, add polling then.
- Changes to `getAlerts()` / `todayLocal()` — already fixed.

### Manual QA

1. Seed/seed-demo a household where one active child is missing today's attendance (bell shows "Attendance not logged today").
2. Go to `/attendance`, log attendance for that child.
3. Click any sidebar link (e.g. Dashboard) — **without** reloading the page.
4. Confirm the header bell no longer shows the "Attendance not logged today" alert.

---

## Item 3 — Enable "Set up lessons" / "Start portfolio" setup cards (4b)

### Summary

`SetupCard_Lessons` and `SetupCard_Portfolio` are permanently-disabled "Coming soon" stubs on `/household/setup`, even though `/plan` (lesson planner) and `/portfolio` are fully built, functional pages. Link the cards to those routes.

### Planning mode

Mode 2 — local feature behavior (two small presentational components + their tests).

### Effort

Trivial (~½ day incl. test updates). Both target pages already exist and work; this is prop + copy changes on two stub components.

### Navigation note (`<a>` vs `Link`)

`SetupCard`'s `actionHref` path renders a plain `<a href>` (`SetupCard.tsx:46-52`), which causes a full-page navigation rather than a client-side transition. For a one-time setup hand-off this is acceptable and matches the component's current contract. Converting `SetupCard` to `next/link` is a broader change to a shared component and is **out of scope** here — noted so it isn't mistaken for a regression.

### Code-path audit

| Section | Path |
|---|---|
| Stub card 1 | `features/household/front/components/SetupCard_Lessons.tsx` — `disabled`, `disabledTooltip="Coming soon"`, description "Lesson planning is coming soon." |
| Stub card 2 | `features/household/front/components/SetupCard_Portfolio.tsx` — same pattern, description "Portfolio is coming soon." |
| Shared component | `features/household/front/components/SetupCard.tsx` — already supports `actionHref` (renders `<a>` when `!disabled`) as an alternative to `onAction`/`disabled` |
| Renders both cards | `features/household/front/components/HouseholdSetup.tsx` — shown when `showStubs = Boolean(setupStatus?.hasChildren)` |
| Target routes (already built) | `/plan` (`features/plan/front/pages/...`), `/portfolio` (`features/portfolio/front/pages/PortfolioPage.tsx` — confirmed functional: `EvidenceForm`, filters, list) |
| Existing tests | `features/household/__tests__/integration/HouseholdSetup.test.tsx` — "stub cards" block asserts both cards render with a **disabled** button and "Coming soon" tooltip (lines ~235-289, ~340-366) |
| Missing tests | New assertions that both cards render an enabled link to `/plan` / `/portfolio` |

### Source-of-truth decision

No change — `features/household` owns the setup cards; `features/plan` and `features/portfolio` own their respective pages. This phase only adds navigation links between already-correct owners.

### UI pattern audit

- `SetupCard`'s `actionHref` path already renders an `<a>` styled as the primary button (`ui-style-guide`'s standard CTA styling) — no new pattern needed.
- No confirmation/destructive action involved (plain navigation link).

### Acceptance criteria

- On `/household/setup` with at least one active child, the "Create your first lesson plan" card shows an **enabled** link labelled "Set up lessons" that navigates to `/plan`.
- The "Start your portfolio" card shows an **enabled** link labelled "Start portfolio" that navigates to `/portfolio`.
- Neither card's description text says "coming soon" any longer.
- Both cards remain hidden when `setupStatus.hasChildren` is false (unchanged `HouseholdSetup` gating logic).

### Data / contract changes

None.

### API / store / service plan

None.

### UI plan

- `SetupCard_Lessons.tsx`: replace `disabled` / `disabledTooltip` / `onAction` props with `actionHref="/plan"`; update `description` to remove "coming soon" (e.g. "Organise daily lessons for each child.").
- `SetupCard_Portfolio.tsx`: same, `actionHref="/portfolio"`, description update (e.g. "Capture evidence of learning for each child.").
- Titles (`"Create your first lesson plan"`, `"Start your portfolio"` or current title) and `actionLabel`s (`"Set up lessons"`, `"Start portfolio"`) stay as-is.

### Testing plan (failing tests first — and tests to update)

1. `features/household/__tests__/integration/HouseholdSetup.test.tsx`:
   - **Update** "shows SetupCard_Lessons stub when children exist" / "shows SetupCard_Portfolio stub when children exist" (stub cards block, ~236-260): keep the `getByTestId('setup-card-lessons'/'setup-card-portfolio')` assertions (cards still render), but these no longer assert a disabled button.
   - **Replace** "SetupCard_Lessons standalone" / "SetupCard_Portfolio standalone" describe blocks (~342-366), which currently assert `screen.getByRole('button')` is disabled and `getByTitle('Coming soon')` exists. New assertions: `screen.getByRole('link', { name: /set up lessons/i })` has `href="/plan"` (and analogous for portfolio → `/portfolio`).
   - The generic `SetupCard` component test "disabled button is not clickable" (~323-337) and "disabled stub cards show tooltip copy 'Coming soon'" (~277-288) call `SetupCard` directly with hardcoded `disabled`/`disabledTooltip` props — **leave unchanged**, they test the shared component's disabled-state capability, which still exists and is used elsewhere (e.g. future stubs).

### Build phases

1. Update the four `HouseholdSetup.test.tsx` assertions above to expect links (failing against current stub components).
2. Update `SetupCard_Lessons.tsx` and `SetupCard_Portfolio.tsx` to use `actionHref` + new copy; tests pass.

### Out of scope

- Any "first-run" contextual onboarding inside `/plan` or `/portfolio` when arriving from setup.
- Auto-marking the setup card as "complete"/hiding it after first visit — cards continue to be shown/hidden purely by `setupStatus.hasChildren` as today.

### Manual QA

1. As a household with at least one active child and no lessons/portfolio yet, go to `/household/setup`.
2. Confirm "Set up lessons" is a clickable (non-greyed) link; click it and confirm it lands on `/plan`.
3. Go back to `/household/setup`, confirm "Start portfolio" is clickable; click it and confirm it lands on `/portfolio`.
4. Confirm neither card's description says "coming soon".

---

## Item 4 — Learning Time session history + Records report (5)

### Summary

Two related additions: (5a) show the selected learner's past finalized Learning Time sessions on `/learning-time` (the data already exists via `learningTimeApi.list()` but nothing renders it), and (5b) feed aggregated "time spent per subject" into the Records report (`RecordsReport`), the natural home for cross-subject summaries already shown to parents.

### Planning mode

Mode 3 — cross-feature/report composition (5b reaches into Records, which composes data from multiple features). 5a alone would be Mode 2, but bundling both in one phase under the stricter mode.

### Effort

Medium (~2–3 days incl. tests). 5a is small (~½ day: one new read-only component). 5b is the bulk: type change + service aggregation + report section + four test files. **5b is independently deferrable** — if scope needs trimming, ship 5a alone and split 5b into its own PR (see Risks).

### Code-path audit

**5a — Session history on `/learning-time`**

| Section | Path |
|---|---|
| Page | `features/learning-time/front/pages/LearningTimePage.tsx` — learner select + `<NowCard learnerId={selectedChildId} />`, no history |
| Existing list API (unused) | `features/learning-time/front/services/api.ts:42-49` `learningTimeApi.list(filters)` → `GET /api/learning-time/sessions?learnerId=&from=&to=` |
| Server | `features/learning-time/server/service.ts:95-101` `listSessions()` → `listFinalizedSessionRows()` (repository) — returns `LearningTimeSession[]` with `elapsedSeconds`, `outcome`, `subjectId`, `endedAt` |
| Duration formatting (exists, not exported) | `features/learning-time/front/components/NowCard.tsx:39-44` `formatElapsed(totalSeconds)` |
| Subject name lookup | `useHousehold().allSubjects` (`features/household/front/context`) — `SubjectCourse[]` with `id`/`name` |
| Existing tests | `features/learning-time/__tests__/integration/LearningTimePage.test.tsx` — already mocks `learningTimeApi.list` (unused by current code) |
| Missing tests | History list rendering: populated, empty, loading, and learner-switch refetch |

**5b — "Time spent by subject" in Records report**

| Section | Path |
|---|---|
| Report type | `features/records/types.ts:21-34` `RecordsReport` — no time field |
| Report service | `features/records/server/service.ts:172-257` `getRecordsReport()` — aggregates attendance/lessons/progress/portfolio/checklist per child + `dateRange`, already imports repositories from other features (attendance, portfolio, plan, subjects) directly |
| Session source | `features/learning-time/server/repository.ts:111-124` `listFinalizedSessionRows(householdId, { learnerId, from, to })` — filters by `endedAt` range, returns raw rows (`startedAt`/`endedAt` as `Date`, `subjectId: string | null`) |
| Print/report UI | `features/records/front/components/RecordsPrintReport.tsx` — variant-gated sections (`showAttendance`, `showProgress`, etc.); pattern to copy for new "Time spent by subject" section |
| Existing tests | `features/records/__tests__/server/recordsReport.test.ts` (mocks per-feature repositories), `features/records/__tests__/integration/ReportsPage.test.tsx` |
| Missing tests | `getRecordsReport` returns `timeBySubject`; `RecordsPrintReport` renders the new section (populated + empty) |

### Source-of-truth decision

- **Session data** stays owned by `features/learning-time` (`learningTimeSessions` table, `listFinalizedSessionRows`). `features/records` reads it directly via the repository, following the same cross-feature read pattern already used for attendance/portfolio/plan/subjects in `getRecordsReport()` — no new abstraction needed.
- **Session history list** (5a) lives on `/learning-time` itself — it's per-learner operational detail, not a cross-feature report, so it does not belong on the Dashboard or in Records.
- **"Time spent by subject"** (5b) is a cross-subject summary for a date range — it belongs in `RecordsReport`/`RecordsPrintReport`, alongside "Progress by subject", not duplicated into the Dashboard.

### UI pattern audit

- 5a list: plain stacked list/table rows inside the existing `/learning-time` page container — no new page-width or shell pattern needed (page already uses `max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6`).
- 5b section: follows `RecordsPrintReport`'s existing per-section pattern (`<section><h3>...</h3>...</section>`) with an explicit empty-state paragraph, matching the "Quran sessions" section's `sessionsInRange.length === 0` handling.
- No Nivo charts, no icons, no destructive actions — no further `ui-style-guide` patterns triggered.

### Acceptance criteria

**5a**
- On `/learning-time`, below the `NowCard`, a "Recent sessions" list shows the selected learner's finalized sessions, most recent first (by `endedAt`).
- Each row shows: date (from `endedAt`), subject name (resolved via `allSubjects`, or "No subject" if `subjectId` is `null`), duration (via shared `formatElapsed`), and outcome (`complete`/`partial`/`abandoned`).
- Empty state: "No completed sessions yet" when the list is empty.
- Loading state shown while the history fetch is in flight (`data-testid="session-history-loading"`).
- Switching the learner select re-fetches and re-renders the history for the newly selected learner.

**5b**
- `getRecordsReport()` returns `timeBySubject: { subjectId: string | null; subjectName: string; totalMinutes: number }[]`, one entry per subject (plus an `"Unassigned"` entry, `subjectId: null`, if any finalized sessions in range have no `subjectId`), covering only finalized sessions with `endedAt` within `dateRange`.
- `RecordsPrintReport` (variants `full` and `progress`) renders a "Time spent by subject" section listing each entry's subject name and total time (formatted as `Xh Ym` / `Ym`).
- If `timeBySubject` is empty, the section shows "No learning time recorded for this date range." instead of being hidden (matches the Quran-sessions empty-state pattern).

### Data / contract changes

- `features/records/types.ts`: add to `RecordsReport`:
  ```ts
  timeBySubject: { subjectId: string | null; subjectName: string; totalMinutes: number }[]
  ```
- No schema/migration changes — `learningTimeSessions` already exists (Phase 1, migration `0025_fair_virginia_dare`).

### API / store / service plan

- **5a**: no new endpoint — `learningTimeApi.list({ learnerId })` already exists and returns finalized sessions sorted however the repository returns them (repository docstring: "most recent first is not guaranteed — callers may sort"). `LearningTimePage`/new component sorts by `endedAt` descending client-side.
- **5b**: `features/records/server/service.ts`:
  - Import `listFinalizedSessionRows` from `@/features/learning-time/server/repository`.
  - **Date-boundary fix (important):** `listFinalizedSessionRows` filters with `lte(endedAt, new Date(filters.to))`, and `new Date('2026-01-31')` is `00:00:00Z` — so passing the bare end date silently drops every session finalized *during* the final day. Pass `to: \`${dateRange.end}T23:59:59.999Z\`` (and `from: \`${dateRange.start}T00:00:00.000Z\`` for symmetry) so the inclusive range actually covers the last day. Add a test that asserts a session finalized at, say, `2026-01-31T18:00:00Z` is included when `end = '2026-01-31'`.
  - For each row, compute minutes as `(row.endedAt!.getTime() - row.startedAt!.getTime()) / 60000`. Finalized sessions always have both timestamps. **Note:** this is wall-clock elapsed and therefore *includes* any paused interval, exactly matching `computeElapsedSeconds`'s Phase-1 semantics — consistent with the duration shown on the session itself.
  - Group by `subjectId` (null → `"Unassigned"` bucket), resolve names via the existing `subjectNames` map (built from `subjects`), sum minutes (round to whole minutes once at the end), sort by `subjectName` (Unassigned last).

### Two distinct formatters (do not conflate)

`NowCard`'s existing `formatElapsed(seconds)` returns **clock** format (`2:15:00` / `15:42`) and takes **seconds** — right for a per-session stopwatch reading, including the 5a history rows (each row is one session's duration). The Records "Time spent by subject" total wants a **human** format (`2h 15m` / `15m`) and works in **minutes**. These are different functions:

- `features/learning-time/front/lib/formatElapsed.ts` — the extracted existing `formatElapsed(seconds): string` (clock), reused by `NowCard` and the 5a history list.
- `features/records/.../formatDuration.ts` (or a small inline helper in `RecordsPrintReport`) — `formatMinutes(totalMinutes): string` → `"2h 15m"` / `"15m"` / `"0m"`. New, with its own unit test.

### UI plan

- New `features/learning-time/front/lib/formatElapsed.ts`: move the existing `formatElapsed` out of `NowCard.tsx` into this shared module; update `NowCard.tsx` to import it (no behavior change — pure refactor).
- New `features/learning-time/front/components/SessionHistoryList.tsx`:
  - Props: `learnerId: string`.
  - Fetches `learningTimeApi.list({ learnerId })` on mount and when `learnerId` changes.
  - States: loading (`data-testid="session-history-loading"`), empty (`data-testid="session-history-empty"`, text "No completed sessions yet"), populated (`data-testid="session-history-list"`, one row per session sorted by `endedAt` desc).
  - Each row uses `formatElapsed(session.elapsedSeconds)` for duration; subject name via `useHousehold().allSubjects` (or "No subject" when `subjectId` is null).
- `LearningTimePage.tsx`: render `<SessionHistoryList learnerId={selectedChildId} />` below `<NowCard ... />`.
- `RecordsPrintReport.tsx`: new "Time spent by subject" section after "Progress by subject", gated by `variant === 'full' || variant === 'progress'` (mirrors `showProgress`), rendering `report.timeBySubject` rows (subject name + `formatMinutes(totalMinutes)`) or the empty-state paragraph.

### Testing plan (failing tests first)

1. `features/learning-time/__tests__/integration/LearningTimePage.test.tsx` (extend existing `learningTimeApi.list` mock, already present):
   - "shows a loading state for session history before the list resolves" (`session-history-loading`).
   - "renders 'No completed sessions yet' when the history list is empty".
   - "renders finalized sessions with date, subject name, duration, and outcome".
   - "switching the learner re-fetches session history for the new learner" — assert `learningTimeApi.list` called with the new `learnerId`.
2. New `features/learning-time/__tests__/front/formatElapsed.test.ts`: unit test for the extracted `formatElapsed` (clock format: sub-hour → `MM:SS`, with hours → `H:MM:SS`).
3. New unit test for `formatMinutes` (`0m`, `15m`, `60m → 1h 0m`, `135m → 2h 15m`).
4. `features/records/__tests__/server/recordsReport.test.ts`: mock `listFinalizedSessionRows`, add tests:
   - "aggregates finalized session minutes by subject into timeBySubject".
   - "groups sessions with no subjectId under an 'Unassigned' entry".
   - "includes a session finalized during the last day of the range" (the `T23:59:59.999Z` boundary fix — assert a `2026-01-31T18:00:00Z` session is counted when `end = '2026-01-31'`).
   - "returns an empty timeBySubject array when there are no finalized sessions in range".
   - The mock must assert the **`to` argument** passed to `listFinalizedSessionRows` carries the end-of-day suffix, not the bare date.
5. `features/records/__tests__/integration/ReportsPage.test.tsx` (or a new `RecordsPrintReport.test.tsx`): "renders 'Time spent by subject' section with aggregated minutes" and "shows the empty-state message when timeBySubject is empty".

### Build phases

1. Extract `formatElapsed` to a shared module + its unit test; `NowCard` unaffected (refactor, tests stay green). **— end of 5a-shippable boundary if 5b is deferred.**
2. Add failing `LearningTimePage` history tests, then implement `SessionHistoryList` + wire into `LearningTimePage`.
3. Add `formatMinutes` + its unit test.
4. Add failing `recordsReport.test.ts` cases for `timeBySubject` (incl. the end-of-day boundary case), then implement the aggregation in `getRecordsReport()` and the `RecordsReport` type addition.
5. Add failing `RecordsPrintReport`/`ReportsPage` test for the new section, then implement the section in `RecordsPrintReport.tsx`.

### Out of scope

- Editing/deleting past sessions from the history list (read-only view).
- Charts/Nivo visualization of time-by-subject — text/table only in this phase.
- Pagination of session history (assume Phase-1 volumes are small; revisit if needed).
- Cross-child aggregation (Records report is already single-child; `timeBySubject` follows the same scope).

### Manual QA

1. Complete (finalize) at least one Learning Time session for a learner, with a subject assigned, via `/learning-time`.
2. Reload `/learning-time` for that learner — confirm "Recent sessions" shows the finalized session with correct date/subject/duration/outcome.
3. Switch the learner select to a learner with no finalized sessions — confirm "No completed sessions yet".
4. Go to `/records` (Reports page), select the learner from step 1 with a date range covering the session — confirm "Time spent by subject" shows the subject and total time.
5. Select a date range that excludes the session — confirm the section shows "No learning time recorded for this date range."

---

## Combined build ordering, branch, and commits

The four items touch disjoint feature areas (Resources, Layout, Household, Learning Time + Records) and have no interdependencies — order is for review convenience, not correctness.

- **Branch**: `enhancement/uat-followups-resources-alerts-setup-time`
- **Commits** (one per build-phase step, tests-first):
  1. `test(resources): cover Plan-lessons toggle label and auto-expand on create`
  2. `feat(resources): auto-expand new resource and relabel Details toggle to Plan lessons`
  3. `test(layout): cover header alert refetch on route change and dropdown open`
  4. `fix(layout): refetch alerts on route change so header bell clears stale items`
  5. `feat(layout): refetch alerts when the notification bell dropdown opens`
  6. `test(household): cover enabled Set up lessons / Start portfolio links`
  7. `feat(household): link setup cards to /plan and /portfolio`
  8. `test(learning-time): cover extracted formatElapsed helper`
  9. `refactor(learning-time): extract formatElapsed into a shared module`
  10. `test(learning-time): cover session history list states`
  11. `feat(learning-time): add session history list to /learning-time`
  12. `test(records): cover formatMinutes helper and timeBySubject aggregation incl. end-of-day boundary`
  13. `feat(records): aggregate finalized learning-time sessions into timeBySubject`
  14. `test(records): cover Time spent by subject report section`
  15. `feat(records): render Time spent by subject in records report`

## Decisions resolved

- **Item 2 trigger:** both triggers ship — dropdown-open refetch (primary fix for the reported scenario) and route-change refetch (secondary). Commits 3–5 above. If `onOpen` wiring proves more invasive than expected once in the code, commit 4 (route-change) can land alone and commit 5 deferred — see Risks.
- **`plan:execute` `.json` companion:** **not generated**. This plan is implemented directly with manual review per phase/commit, not via headless `plan:execute` — the work touches shared components (`Header`, `NotificationBellDropdown`, `SetupCard_*`) where a human should confirm each diff before committing.

## Risks and rollback

- Each item's commits are independently revertible; items 1–3 are small and low-risk (presentation/refetch only, no schema changes).
- Item 4 (5a/5b) is the largest: if `timeBySubject` aggregation or the new report section needs more design iteration, items 1–3 (+5a) can ship first as a smaller PR and 5b split into its own follow-up branch/PR. Build-phase 1 of item 4 is the clean cut line.
- `NotificationBellDropdown` gains an `onOpen` prop — it's optional/backward-compatible, but it is a shared component used by the dashboard, so re-run the dashboard notification tests after the change. If the prop wiring turns out to be awkward, ship commit 4 (route-change refetch) alone and defer commit 5.
- No new migrations — `learningTimeSessions` already exists in `dev` from the merged Phase 1 work.

## Merge gate (per CLAUDE.md — obligatory)

- `npm run build` **and** `npm test` must pass before opening the PR; CI re-checks on the PR.
- New/changed UI ships with the integration tests named above (Resources page, session history list, records section).
- TDD order is reflected in the commit list: every `feat`/`fix`/`refactor` commit is preceded by the `test` commit that fails against the prior state.
