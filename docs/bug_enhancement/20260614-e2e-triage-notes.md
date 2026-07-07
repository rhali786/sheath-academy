# E2E triage working notes (raw, feeds 20260614-e2e-triage.md)

## *** HEADLINE FINDING: `goto('/')` after login no longer reaches the Dashboard ***

`/` (`app/(public)/page.tsx`) is now the public marketing landing page for EVERYONE,
including signed-in users — middleware explicitly returns `NextResponse.next()` for `/`
regardless of auth (middleware.ts:15-18), and there is no post-login redirect to
`/dashboard`. The actual app dashboard moved to `/dashboard` (`app/(shell)/dashboard/page.tsx`,
confirmed via direct navigation: shows Quran Streak, child names Layth/Hawa/Idris/Hamza,
school-year countdown, etc.).

Confirmed by debug script: `loginDev(page); goto('/')` → renders the marketing landing
page (headings like "WHY NOT ONE OF THE OTHER 158 TOOLS", "THE PROOF"...), not the
dashboard. `loginDev(page); goto('/dashboard')` → renders the real dashboard.

**This single issue is the root cause of the overwhelming majority of e2e failures.**
15 spec files (grep for `goto('/')` immediately after `loginDev`) navigate to `/` post-login
expecting dashboard/shell content:
admin-metrics (n/a, doesn't goto('/')), alerts-links, archive-dashboard-filtering,
cross-feature-linked-filtering, dashboard-evidence-empty-state, dashboard-learning-activity,
dashboard-selected-child-regression, dashboard-student-isolation, dashboard.spec.ts,
learning-time, quran-session-dashboard-update, auth-isolation, auth.spec.ts (both already
fixed in B1 for the `/` redirect assertion specifically).

Category: SINGLE DOMINANT REGRESSION (or stale-test pattern, depending on framing) —
e2e suite predates the landing-page restructure that moved the dashboard from `/` to
`/dashboard`. Recommended B2 fix: mechanically replace `page.goto('/')` immediately
after `loginDev(page)` with `page.goto('/dashboard')` across all affected spec files,
then re-run to find the (likely much smaller) set of genuinely-new failures.


## auth.spec.ts (1 failed, 6 passed after fix)
- FIXED (B1): "/ redirects to /login when unauthenticated" — stale; `/` is now an
  intentionally-public landing page (`app/(public)/page.tsx`, middleware comment
  "Landing page is public"). Updated test to assert `/` is reachable and shows the
  landing heading. Committed in B1.
- STILL FAILING: "/about is reachable without signing in" — `/about` is excluded from
  the middleware matcher (intended public), but the page lives under `app/(shell)/about`
  which is wrapped in `AppShell` → `ShellAuthGuard`, which client-side redirects any
  unauthenticated `(shell)` page to `/login` (features/layout/front/components/ShellAuthGuard.tsx:17-19).
  Category: POSSIBLE REGRESSION (route-group placement vs. middleware intent mismatch).

## admin-metrics.spec.ts (3/3 passed)
- All pass. No action.

## auth-isolation.spec.ts (2 passed, 1 failed)
- FIXED (B1): "signed-out visit to / redirects to /login" — same confirmed-stale `/`
  redirect assumption as auth.spec.ts (landing page is intentionally public). Updated to
  assert `/` is reachable. Committed in B1.

## auth-fallback-credentials.spec.ts (3 passed, 3 failed, 4 skipped/cascading)
- FAILED: "parent can sign up with email, username, and password" —
  `page.getByLabel('Name')` resolves to 2 elements: the "Name" field AND the "Username"
  field (substring match: "Username" contains "name" case-insensitively). Needs
  `getByLabel('Name', { exact: true })`.
  Category: SELECTOR DRIFT (Username field added to signup form after this test was
  written; `getByLabel('Name')` is no longer unique).
- FAILED (cascading): "sign in with email and password" / "sign in with username and
  password" — both time out on `page.waitForURL(...)` after clicking Sign in, because the
  signup test above never created the test user (its failure means no account exists to
  sign in with).
  Category: CASCADING FAILURE from the signup selector-drift bug above — fixing that test
  should fix these too.
- SKIPPED (4, likely cascading from same root cause): "old password fails after reset",
  "new password works after reset", "reset password with DB-retrieved token" and one more
  — these depend on the signup/reset chain succeeding first.

## cross-feature-linked-filtering.spec.ts (15 tests, 0 failed, 15 skipped)
- All 15 tests are written to self-skip via `test.skip()` whenever an expected
  childId-linked element (Dashboard "Attendance Ready"/Quran-streak/lesson-alert links
  with `?childId=`, Attendance/Quran "Filter by learner" selects, etc.) is not found —
  and for the dev-bypass seed data, NONE of these elements were found, so every test
  self-skips. These are not counted in the 81 "failing" total (skips, not failures), but
  the 100% skip rate is suspicious: either (a) the dev-bypass household's seed data
  doesn't produce children/alerts/links in the states these tests check, or (b) the
  childId-linked-filtering feature (built across Part A's phase-4b and related dashboard
  work) doesn't render the expected `?childId=` links/selectors in the real app the way
  the (now-passing) jest integration tests mock it.
  Category: NEEDS INVESTIGATION (B2) — likely seed-data mismatch, but worth a manual
  click-through to rule out a real linked-filtering regression, since this is a whole
  cluster of dark/untested coverage.

## archive-dashboard-filtering.spec.ts (1 passed, 2 failed)
- FAILED: "Adam appears in children list before archiving" — `selector.evaluate(...)` on
  `getByRole('combobox').or(locator('select')).first()` times out at 30s. Dashboard page
  likely now renders multiple selects/comboboxes and/or takes longer to settle than before;
  another test in the same file (archiving-state checks) passes, so login/dev-bypass works.
  Category: POSSIBLE REGRESSION / SELECTOR DRIFT (needs closer look at Dashboard child
  selector markup and load timing).
- FAILED: "Adam's needs-attention alert is visible before archiving" —
  `selector.selectOption({ label: /Adam/i })` throws "options[0].label: expected string,
  got object" — Playwright's `selectOption({ label })` does not accept a RegExp, only a
  string. This is a test-code API misuse, not a product issue.
  Category: STALE TEST (incorrect Playwright API usage — `label` must be a string).

## attendance.spec.ts (2 passed, 3 failed)
- FAILED: "child selector is present" — `getByRole('combobox')` resolves to 3 elements
  (strict-mode violation): `aria-label="Filter by learner"` select plus 2 more unlabeled
  selects. Test needs a more specific locator (e.g. `getByLabel('Filter by learner')`).
  Category: SELECTOR DRIFT (page now has multiple comboboxes).
- FAILED: "notes icon shown when a record has notes" and "hours and minutes shown only
  when > 0" — both time out waiting for `getByPlaceholder('Notes (optional)')` /
  `getByPlaceholder('Hours')`. These fields exist (AttendancePage.tsx:223,231,239) but are
  inside the "Mark attendance" form, which is now collapsed behind a "Mark attendance"
  toggle button (AttendancePage.tsx:161-164, `showForm` state) — the test never clicks it.
  Category: SELECTOR/FLOW DRIFT (test predates the collapsible Mark-attendance form;
  needs to click "Mark attendance" first, and likely select a learner first per the
  sessionStorage-leakage gotcha from Part A).

## alerts-links.spec.ts (6 passed, 1 failed, 3 self-skipped via test.skip() when seed data absent)
- FAILED: "clicking edit opens inline form with pre-filled surah" — `page.getByLabel(/Surah/i)`
  finds nothing because QuranPage's edit-form `<label>Surah</label>` (QuranPage.tsx:348) is not
  associated with its `<select>` via htmlFor/id or wrapping.
  Category: SELECTOR/A11Y DRIFT (label not programmatically associated with control).
- Skips ("household attendance alert links to /attendance", "lesson alert links to /lessons
  with childId", "sessions are sorted by most recent date") are self-skipping when seed data
  doesn't produce the expected alert/sort scenario — not failures, no action needed for B1.

## dashboard.spec.ts + dashboard-student-isolation.spec.ts + feedback.spec.ts (7 failed, 8 passed)
- FAILED (dashboard.spec.ts:11) "Today shows at least one Islamic calendar countdown" —
  `getByTestId('islamic-calendar-card')` not found after `loginDev(page); goto('/')`.
  Category: HEADLINE FINDING (`/` is the public landing page; dashboard content lives at
  `/dashboard`).
- FAILED (dashboard-student-isolation.spec.ts:11) "dashboard loads and shows a child selector" —
  `getByRole('combobox').or(locator('select'))` not found after `goto('/')`.
  Category: HEADLINE FINDING.
- FAILED (dashboard-student-isolation.spec.ts:16) "switching to Khadijah updates the child
  selector" — `selectOption({ label: /Khadijah/i })` throws "options[0].label: expected
  string, got object" (RegExp passed to `selectOption({ label })`, which requires a string).
  Category: STALE TEST (Playwright API misuse) — also compounded by HEADLINE FINDING since
  the selector itself wouldn't be found on `/` anyway.
- FAILED (dashboard-student-isolation.spec.ts:24) "Quran section does not show all three
  children when Khadijah is selected" — same `selectOption({ label: /Khadijah/i })` regex
  misuse. Category: STALE TEST (Playwright API misuse) + HEADLINE FINDING.
- FAILED (dashboard-student-isolation.spec.ts:34) "switching student changes the visible
  child name in the Quran section" — same `selectOption({ label: regex })` misuse.
  Category: STALE TEST (Playwright API misuse) + HEADLINE FINDING.
- FAILED (dashboard-student-isolation.spec.ts:55) "switching student updates Today's State
  metrics" — same `selectOption({ label: regex })` misuse. Category: STALE TEST (Playwright
  API misuse) + HEADLINE FINDING.
- FAILED (feedback.spec.ts:57) "'View detail' link navigates to feedback detail page" —
  `page.getByText(/feedback detail/i)` is a strict-mode violation: resolves to 2 elements —
  `<h1 class="page-title">Feedback detail</h1>` AND Next.js's route announcer
  (`<div role="alert" id="__next-route-announcer__">Feedback detail — Sheath Academy</div>`).
  Category: SELECTOR DRIFT (needs `getByRole('heading', { name: 'Feedback detail' })` or
  similar) — independent of the headline finding (this spec doesn't `goto('/')` post-login).

## learning-time.spec.ts + lesson-completion-report.spec.ts + lesson-status-sync.spec.ts (8 failed, 3 passed, 1 skipped)
- FAILED (learning-time.spec.ts:44) "start, pause, resume, finish and finalize a Timer
  session from the dashboard" — `selector.selectOption({ label: /Zayd/i })` throws
  "options[0].label: expected string, got object". Category: STALE TEST (Playwright API
  misuse, same `selectOption({label: regex})` pattern as elsewhere) — likely also affected
  by HEADLINE FINDING since the selector is located via `getByRole('combobox').or(locator
  ('select')).first()` on the dashboard.
- FAILED (learning-time.spec.ts:95) "reloading mid-session restores elapsed time from the
  server" — same `selectOption({ label: /Khadijah/i })` regex misuse.
  Category: STALE TEST (Playwright API misuse) + likely HEADLINE FINDING.
- FAILED (lesson-completion-report.spec.ts:28) "Khadijah's report shows her subjects" —
  same `selectOption({ label: /Khadijah/i })` regex misuse.
  Category: STALE TEST (Playwright API misuse).
- FAILED (lesson-completion-report.spec.ts:41) "Khadijah's completed lesson does not appear
  in Zayd's report" — same `selectOption({ label: /Zayd/i })` regex misuse.
  Category: STALE TEST (Playwright API misuse).
- FAILED (lesson-completion-report.spec.ts:62) "report child selector reflects the correct
  selected child" — same `selectOption({ label: /Khadijah/i })` regex misuse.
  Category: STALE TEST (Playwright API misuse).
- FAILED (lesson-status-sync.spec.ts:23) "status filter shows only completed lessons when
  selected" — after selecting status filter "completed", `getByText('Skipped')` still
  resolves to 1 element (expected 0). Either the status filter doesn't fully filter out
  "Skipped"-status lesson cards, or "Skipped" text appears elsewhere on the page (e.g. a
  legend/summary) unrelated to the filtered list.
  Category: POSSIBLE REGRESSION / NEEDS INVESTIGATION (B2) — needs a manual click-through of
  `/lessons` with the status filter to confirm whether this is a real filtering bug or an
  overly-broad `getByText` locator.
- SKIPPED: "lessons page has edit functionality (edit form opens)" — self-skips via
  `test.skip()` when `[data-testid="lesson-card"]` count is 0 (no seed lessons found for
  this scenario). Not a failure.
- FAILED (lesson-status-sync.spec.ts:78) "planner page loads" — `await page.goto('/planner')`
  followed by `expect(page).toHaveURL(/\/planner/)` fails: actual URL is
  `http://localhost:3000/plan`. The planner feature's route is `/plan`, not `/planner`.
  Category: STALE TEST (route renamed/never was `/planner`; test asserts a URL pattern that
  doesn't match the real route).
- FAILED (lesson-status-sync.spec.ts:82) "completed lessons show Done badge in grid" —
  `loginDev`'s `page.waitForURL(...)` times out after 10s in this test's `beforeEach`
  (`await loginDev(page); await page.goto('/planner')`). Likely a knock-on/flaky effect of
  running after test 78 in the same `describe` block (both navigate to the non-existent
  `/planner` route, which may redirect/loop). Category: CASCADING FAILURE (from the
  `/planner` vs `/plan` route mismatch above) — should resolve once test 78's root cause is
  fixed and the describe block's `beforeEach` is updated to `/plan`.

## messaging.spec.ts + planner.spec.ts + portfolio.spec.ts (4 failed, 8 passed, 2 self-skipped)
- SKIPPED: "starting a direct conversation with a household member succeeds" — self-skips
  via `test.skip(true, 'no other household members available for this user')` when the
  "New message" dialog has no other-member radio options for the dev-bypass household.
  Not a failure.
- SKIPPED: "selecting a conversation opens the thread view" — self-skips via
  `test.skip(true, 'no conversations available for this user')` when
  `[data-testid^="conversation-item-"]` count is 0. Not a failure (consistent with the
  cross-feature-linked-filtering all-skip pattern — dev-bypass seed data has no existing
  conversations).
- FAILED (planner.spec.ts:9) "Schedule page renders and Pause Day button is present" —
  `page.goto('/plan/schedule')`; `data-testid="schedule-page"` IS visible (SchedulePage.tsx:98)
  but `getByRole('button', { name: /pause day/i })` is never found. Investigated:
  `ScheduleNowNextCard.tsx` contains a "Pause Day"/"Cancel" toggle button, but
  `SchedulePage.tsx` does not import or render `ScheduleNowNextCard` anywhere — the
  component is only referenced by a jest mock in
  `dashboard/__tests__/integration/TabSwitching.test.tsx`, i.e. it appears to be orphaned/
  unwired in the real app.
  Category: POSSIBLE REGRESSION (NEEDS INVESTIGATION, B2) — either `ScheduleNowNextCard`
  was meant to be rendered on `/plan/schedule` and got dropped during a refactor (real
  regression), or the "Pause Day" feature moved elsewhere and this e2e test + the orphaned
  component are both stale.
- FAILED (portfolio.spec.ts:11) "portfolio heading is visible" —
  `getByRole('heading', { name: /portfolio/i })` not found. Investigated:
  `app/(shell)/portfolio/page.tsx` renders `PortfolioPage`
  (`features/portfolio/front/pages/PortfolioPage.tsx:143`), whose `<h1>` reads "Growth", not
  "Portfolio" — a separate `app/(shell)/growth/page.tsx` route also exists.
  Category: COPY/SELECTOR DRIFT (feature renamed Portfolio → Growth; the `/portfolio` route
  still serves the page but its heading now says "Growth").
- FAILED (portfolio.spec.ts:15) "portfolio container uses max-w-7xl (matches other pages)" —
  `.max-w-7xl` not found. `PortfolioPage`'s outer div uses `max-w-5xl`
  (PortfolioPage.tsx:141), not `max-w-7xl`.
  Category: COPY/LAYOUT DRIFT — `/portfolio` (Growth) page uses a narrower `max-w-5xl`
  container than the `max-w-7xl` convention this test expects "to match other pages"; either
  the page's container width is a real inconsistency (B2 to verify against
  `ui-style-guide`) or the test's expectation is stale.
- FAILED (portfolio.spec.ts:21) "portfolio content is not full-viewport width" — times out
  (30s) on the same `.max-w-7xl` locator as above (never resolves because the element
  doesn't exist). Category: CASCADING FAILURE from the `max-w-7xl`/`max-w-5xl` mismatch above.

## product-validation.spec.ts + quran-session-dashboard-update.spec.ts + report-date-validation.spec.ts + reports.spec.ts (14 failed, 4 passed)
- FAILED (product-validation.spec.ts:5) "signed-out user sees sign-in required on /feedback"
  — `getByTestId('feedback-sign-in-required')` not found after `goto('/feedback')` while
  signed out. Investigated: `FeedbackPage.tsx:18-23` DOES render a
  `data-testid="feedback-sign-in-required"` block when `status === 'unauthenticated'`, but
  `/feedback` lives at `app/(shell)/feedback/page.tsx` — under `(shell)`, so
  `ShellAuthGuard` client-side-redirects unauthenticated visitors to `/login` before
  `FeedbackPage` can render its own signed-out state.
  Category: POSSIBLE REGRESSION — same root cause as the already-documented `/about` issue
  (`ShellAuthGuard` redirect vs. route-group placement); `FeedbackPage`'s signed-out UI is
  dead code while the page sits under `(shell)`.
- FAILED (product-validation.spec.ts:14) "about page links to feedback form" —
  `getByTestId('about-feedback-cta')` not found after `goto('/about')` while signed out.
  Same `/about` ShellAuthGuard redirect-to-`/login` issue already documented in
  `auth.spec.ts`'s notes — the CTA exists in `About.tsx:154` but the page never renders for
  an unauthenticated visitor. Category: POSSIBLE REGRESSION (same ShellAuthGuard issue).
- FAILED (product-validation.spec.ts:19) "signed-in user can open wizard from about CTA" —
  signed in, `goto('/about')` works, but `about-feedback-cta` (`About.tsx:151-157`) has
  `href="/product-validation"`, not `/feedback`. The wizard with `data-testid=
  "product-validation-wizard"` and "Step 1 of 6" text lives at `app/(auth)/product-validation/
  page.tsx` (`ProductValidationWizard.tsx`), not at `/feedback`.
  Category: STALE TEST / ROUTE MISMATCH — either the CTA's target route was renamed from
  `/feedback` to `/product-validation` after this test was written, or the test's expected
  route is simply wrong; `/feedback` (the page with `feedback-sign-in-required`) and
  `/product-validation` (the wizard) appear to be two different, unrelated pages despite
  similar naming.
- FAILED (quran-session-dashboard-update.spec.ts:16, :20, :39) all 3 tests in this file —
  `beforeEach` does `loginDev(page); goto('/'); ... selector.selectOption({ label: /Khadijah/i
  })`. Category: HEADLINE FINDING (dashboard content, including the Quran section and child
  selector, is not on `/`) **+** STALE TEST (Playwright API misuse —
  `selectOption({label: regex})` requires a string).
- FAILED (report-date-validation.spec.ts:27, :33) "end/start date input has a max attribute
  capped at today" — `ReportsPage.tsx:12-13` computes `today` via local
  `getFullYear()/getMonth()/getDate()`, while the e2e test's `today()` helper
  (`report-date-validation.spec.ts:16-18`) uses `new Date().toISOString().slice(0,10)`
  (UTC). Near a UTC day boundary (e.g. evening in US timezones, where local date is still
  "yesterday" relative to UTC), these two computations disagree, so the input's `max`
  attribute (local date) doesn't equal the test's expected value (UTC date).
  Category: STALE TEST / TIMEZONE BUG — the test's `today()` should match the app's
  local-date convention (`ReportsPage.tsx`'s approach), not UTC `toISOString()`. The app's
  date-input `max` (local "today") is more correct for a date picker than a UTC date.
- FAILED (report-date-validation.spec.ts:39, :51, :62, :75) all 4 remaining tests in this
  file use `page.getByRole('alert')`. `ReportsPage.tsx:144` correctly renders
  `<p role="alert">{dateError}</p>` when validation fails (and renders nothing when valid)
  — but Next.js's client-side route announcer
  (`<div role="alert" id="__next-route-announcer__">...</div>`, the same element that broke
  `feedback.spec.ts`'s "View detail" test) is ALSO present on every page after navigation
  and also has `role="alert"`. So `page.getByRole('alert')` always resolves to ≥1 element
  (the announcer), making `.toBeVisible()`/`.toContainText()` strict-mode-violate when the
  validation `<p>` is also present (2 matches), and making `.toHaveCount(0)` fail (1 match,
  the announcer) even when no validation error is shown.
  Category: SELECTOR DRIFT (recurring Next.js route-announcer `role="alert"` collision —
  same root cause as `feedback.spec.ts:57`; needs a more specific locator scoped to the
  validation message, e.g. a dedicated `data-testid` on `ReportsPage.tsx:144`'s `<p>`).
- FAILED (reports.spec.ts:23, :28) "report content renders inside max-w-7xl container" /
  "report content is not full viewport width" — `.max-w-7xl` not found.
  `ReportsPage.tsx` uses `max-w-5xl` (lines 70, 79), same LAYOUT DRIFT pattern as
  `portfolio.spec.ts` — `/reports` uses a narrower container than the `max-w-7xl` convention
  these tests expect.

## dashboard-evidence-empty-state.spec.ts + dashboard-learning-activity.spec.ts + dashboard-selected-child-regression.spec.ts (20 failed, 3 passed) — the cluster that surfaced the HEADLINE FINDING
- All 3 files' `beforeEach` does `loginDev(page); await page.goto('/')` (and
  dashboard-learning-activity's second `describe` block, dashboard-evidence-empty-state, and
  dashboard-selected-child-regression all follow this pattern). Per the HEADLINE FINDING,
  `/` is the public marketing landing page (even for authenticated users) — none of the
  dashboard chrome these tests look for (`Today's State`, "Quran Streak", schedule timeline
  panel, alerts rail, sidebar nav, child `<select>`, etc.) exists on `/`. Every failure
  below traces back to this.
- FAILED (dashboard-evidence-empty-state.spec.ts:11, :27, :43 — all 3 tests in file) —
  `selector.selectOption({ label: /Khadijah|Adam/i })` throws "expected string, got object"
  (regex misuse) on whatever `<select>`/combobox `.first()` resolves to on the landing page.
  Category: HEADLINE FINDING + STALE TEST (Playwright API misuse).
- FAILED (dashboard-learning-activity.spec.ts:11, :15, :19, :23, :35, :41) "schedule timeline
  panel is visible" / "Personal Assistant panel is visible in alerts rail" / "Quran Streak
  card is visible" / "Log Quran Session button is present on Quran Streak card" / "Quran
  Streak shows a circle for each active child in All Children mode" / "task summary cards
  are present" — none of this dashboard chrome exists on `/`.
  Category: HEADLINE FINDING.
- FAILED (dashboard-learning-activity.spec.ts:27) "child selector switches to a specific
  child" and (:62) "Log Quran Session modal opens and saves a session" — both also hit the
  `selectOption({ label: regex })` misuse on top of the missing-selector issue.
  Category: HEADLINE FINDING + STALE TEST (Playwright API misuse).
- PASSED (dashboard-learning-activity.spec.ts:45) "alerts do not display raw STUDENT_SEED_
  IDs" — passes vacuously (no alerts rail on the landing page, so no raw IDs to find either).
- FAILED (dashboard-selected-child-regression.spec.ts:26, :33, :39) "portfolio is reachable
  from the sidebar via Grades & Progress" / "records is reachable from the sidebar" /
  "sidebar navigation replaces the old Today tab" — no sidebar nav on the landing page `/`.
  Category: HEADLINE FINDING.
- FAILED (dashboard-selected-child-regression.spec.ts:44, :60, :73, :94, :107) "per-child
  progress uses planner subject names" / "...does not show Khadijah's seeded Science
  subject" / "...changes when switching from Adam to Khadijah" / "needs attention only shows
  alerts for the selected child" / "today's state metrics update when child changes" — all
  call `selector.selectOption({ label: /Adam|Khadijah|Zayd/i })` on the landing page.
  Category: HEADLINE FINDING + STALE TEST (Playwright API misuse).
- FAILED (dashboard-selected-child-regression.spec.ts:128) "archived child data does not
  appear in dashboard sections" — `selector.locator('option').allTextContents()` returns no
  non-empty options; the `<select>`/combobox `.first()` on the landing page is not the
  dashboard's child selector. Category: HEADLINE FINDING.
- PASSED (dashboard-selected-child-regression.spec.ts:137, :150) "All children is selected
  by default after load" / "selecting a child then switching back to All shows aggregate
  data" — both pass, apparently vacuously (their assertions don't require dashboard-specific
  elements to be present, so they pass even on the landing page).
