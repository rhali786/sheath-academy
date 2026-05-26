# Development Plan — Dashboard Layout Migration (Mockup → Production)

Branch: `dev`

Status: **Waves 0–4 shipped** · **Waves 5–9 implemented** · **Waves 10–14 queued (detailed below)**

Design reference: [`docs/design/dashboard-mockup-20260524.png`](../design/dashboard-mockup-20260524.png)

Brand mark: [`features/layout/front/components/SheathLogo.tsx`](../../features/layout/front/components/SheathLogo.tsx)

Planning mode: Mode 3 (Waves 5, 6, 8), Mode 4 (Wave 7), Mode 2 (Wave 9) per [`docs/planning-quality-rule.md`](../planning-quality-rule.md)

**Supersedes:** dashboard rearrange items in [`docs/waves/wave-17-ui-polish.md`](../waves/wave-17-ui-polish.md) §7–12 on the migration branch.

---

## 1. Summary

Migrate Sheath Academy from a **top-tab header** to a **mockup-driven layout**: left sidebar, focused “Today” home page, greeting header, summary cards, schedule hero, alerts right rail, and AI assistant.

Waves 0–4 shipped navigation and above-the-fold dashboard. Waves 5–9 complete mockup parity and polish.

### Ownership map

| Domain | Owner | Dashboard role |
|--------|-------|----------------|
| Lessons / status | Planner | Compose only |
| Schedule / timeline | Schedule feature | Compose only |
| Alerts | Alerts feature | Compose `NeedsAttention` |
| Metrics aggregation | Dashboard API | Compose via feature APIs |
| Settings tabs | Settings | Nav links only |

---

## 2. Waves 0–4 (shipped)

See git history (`74ba213`, `3aa2113`, `406595c`, `5a64b8f`). Key deliverables: sidebar shell, hero grid, `DashboardHeader`, `TodayTaskSummaryCards`, `taskMetrics.ts`.

---

## 3. Known gaps (Waves 0–4) → resolved in 5–9

| Issue | Wave |
|-------|------|
| Now & Next vs timeline | 5 |
| `N of N` schedule footer | 5 |
| In-progress 0/1 metric | 5 |
| Dual headers | 6 |
| Hijri twice | 6 |
| Settings triple-highlight | 6 |
| Below-fold clutter | 6 |
| Dead `NavigationContext` | 6 |
| AI panel missing | 7 |
| Date picker / calendar UX | 8 |
| Bell + Quick Add stubs | 9 |

---

## 4. Wave 5 — Full schedule timeline

**Goal:** Replace Now & Next in dashboard hero with mockup-style vertical timeline.

### Code path audit

| Layer | File |
|-------|------|
| Dashboard builds schedule | `features/dashboard/front/pages/Dashboard.tsx` |
| Panel | `features/dashboard/front/components/TodaySchedulePanel.tsx` |
| Builder | `features/schedule/server/service.ts` → `buildDailySchedule` |
| Types | `features/schedule/types.ts` |
| Metrics | `features/dashboard/server/taskMetrics.ts` |
| Subjects (loaded, unused) | `subjectsApi` in Dashboard |

### Changes

1. **`ScheduleEntry` union** in `types.ts`: `lesson` \| `break` \| `meal` \| `prayer`
2. **`DaySchedule.entries`** + keep `blocks` (lesson-only) for reflow
3. **`buildDailySchedule`**: optional synthetic breaks (10:30 break, 12:00 lunch+Dhuhr) — assumption A13
4. **`ScheduleTimeline.tsx`**: vertical rail, icons, status pills, single card (no nest)
5. **`subjectScheduleIcons.ts`**: `SubjectCourseCategory` → Lucide + dot color
6. **`timelineStatus.ts`**: derive `completed` \| `in_progress` \| `planned` \| `skipped`
7. **Footer**: `getScheduleFooterCounts()` — X = actionable lessons, Y = all entries (A2)
8. **`taskMetrics`**: in-progress = count lessons started today with `not_started` (A1)
9. **`ScheduleAdjustDay.tsx`**: collapsible reflow (extracted from Now & Next)

### TDD order

1. Unit: `buildDailySchedule` breaks, `timelineStatus`, `scheduleFooterCounts`, `taskMetrics`
2. Unit: `subjectScheduleIcons`
3. Integration: `ScheduleTimeline.test.tsx`
4. Integration: `TodaySchedulePanel.test.tsx`, `Dashboard.test.tsx`
5. API: `dashboardSummary.test.ts` if needed

### Acceptance criteria

- [ ] Dashboard shows vertical timeline with time, icon, title, status pill per row
- [ ] Synthetic break + lunch rows appear when lessons exist
- [ ] Footer shows `X of Y` where `Y > X` when breaks present
- [ ] In Progress card can show values > 1
- [ ] No nested white card inside schedule panel
- [ ] `npm test` and `npm run build` pass

### Exit criteria

Wave 5 complete when all acceptance boxes checked and smoke OK.

---

## 5. Wave 6 — Dashboard declutter and shell polish

**Goal:** Mockup-scale dashboard density; fix header and nav awkward edges.

### Removals from dashboard (A3)

Remove from `dashboard-more-insights`: `DoToday`, `SubjectActivity`, `WeeklyActivity`

Keep: `SchoolYearProgressCard`, `QuranStreak`, `RecordsProof`, `IslamicCalendarCard` (if reminders on)

Delete orphans: `TodayStatusSummary`, `TodayState`, `IslamicDateDisplay`, `PerChildProgress`, `QuranStudies`, `NavigationContext.tsx`

### Header merge (A4, A5)

- `Header.tsx` on `/`: mobile menu + auth only (no bell on dashboard)
- `DashboardHeader.tsx`: greeting, Gregorian date only, Quick Add, Today's Plan, bell stub, ChildSelector

### Nav fix

- `isNavItemActive(pathname, item, settingsTab?)` — People → `children`, Compliance → `records-compliance`, Settings → default/other tabs

### Brand (A6)

- UI copy: **Sheath** + tagline; `<title>` may stay "Sheath Academy"

### TDD

- `navConfig.test.ts` tab cases
- `Sidebar.test.tsx` settings tabs
- `Dashboard.test.tsx` — no removed widgets
- Fix stale e2e: `dashboard-learning-activity.spec.ts`, `cross-feature-linked-filtering.spec.ts`

### Acceptance criteria

- [ ] Dashboard scroll length ~mockup (hero + compact footer)
- [ ] Hijri visible only in sidebar
- [ ] `/settings?tab=children` highlights People only
- [ ] No `NavigationProvider` imports

---

## 6. Wave 7 — AI Personal Assistant panel (beta stub)

**Goal:** Purple right-rail card above alerts (A7: static stub, no API).

### Files

- New: `features/dashboard/front/components/PersonalAssistantPanel.tsx`
- Update: `Dashboard.tsx` — stack in `dashboard-alerts-rail`

### Acceptance criteria

- [ ] BETA badge, sample insight, Review Suggestions button (no-op or `/plan` link)
- [ ] Checklist links to plan/settings routes
- [ ] Mobile: AI stacks above alerts below schedule
- [ ] Integration test for render + links

---

## 7. Wave 8 — Calendar experience and date navigation

**Goal:** Date picker on dashboard; `/plan/schedule` reuses timeline (A8 client state, A9 no `/calendar` route).

### Changes

- `DashboardDatePicker.tsx` or inline in `DashboardHeader`
- Dashboard state: `selectedDate` → refetch lessons → rebuild schedule
- `SchedulePage.tsx` uses `ScheduleTimeline`
- Reflow in collapsible `ScheduleAdjustDay` below timeline (A10)

### Acceptance criteria

- [ ] Prev/next day changes schedule on dashboard
- [ ] `/plan/schedule` shows same timeline component
- [ ] Playwright: Calendar nav → timeline visible

---

## 8. Wave 9 — Notification bell and Quick Add

**Goal:** Minimal real behavior (A11 alerts dropdown, A12 link menu v1).

### Bell

- Dropdown of open alerts from dashboard context / alerts API
- Badge count when open alerts > 0
- Empty: "No new notifications"

### Quick Add

- Improved labels; same three links; close on navigate

### Acceptance criteria

- [ ] Bell opens alert list; badge shows count
- [ ] Quick Add menu accessible with clear labels
- [ ] Integration tests updated

---

## 9. Assumptions (defaults — verify to override)

| ID | Assumption | Default |
|----|------------|---------|
| A1 | In Progress counts lessons with block started + `not_started` | Count model |
| A2 | Footer X = completed + not_started lessons; Y = all entries | As stated |
| A3 | Remove DoToday, SubjectActivity, WeeklyActivity from dashboard | Remove |
| A4 | Merge headers on dashboard | Merge |
| A5 | Hijri sidebar only | Sidebar only |
| A6 | Brand "Sheath" in UI | Sheath |
| A7 | AI panel static stub | Stub |
| A8 | Date picker via React state | Client state |
| A9 | No `/calendar` route | Keep `/plan/schedule` |
| A10 | Reflow collapsible, not removed | Collapse |
| A11 | Bell = alerts dropdown | Alerts dropdown |
| A12 | Quick Add = link menu v1 | Links only |
| A13 | Fixed synthetic breaks 10:30 + 12:00 | Fixed rules |
| A14 | 30min default lesson duration | Default |
| A15 | Migration supersedes wave-17 dashboard items | Migration wins |

---

## 10. Cross-wave dependency

```
Wave 5 → Wave 6 → Wave 7
              ↘ Wave 8
              ↘ Wave 9
```

Implement order: **5 → 6 → 7 → 8 → 9**. One commit per wave recommended.

---

## 11. Cross-wave regression checklist (Playwright)

- [ ] `e2e/dashboard.spec.ts` — hero grid, summary cards
- [ ] `e2e/planner.spec.ts` — schedule / calendar nav
- [ ] `e2e/dashboard-learning-activity.spec.ts` — update after Wave 6
- [ ] `e2e/cross-feature-linked-filtering.spec.ts` — update after Wave 6
- [ ] `e2e/alerts-links.spec.ts` — alerts rail

---

## 12. File index

### Waves 0–4

| Area | Paths |
|------|-------|
| Nav | `features/layout/lib/navConfig.ts`, `navIcons.tsx` |
| Shell | `Sidebar.tsx`, `Header.tsx`, `AppShell.tsx`, `SheathLogo.tsx` |
| Dashboard | `Dashboard.tsx`, `DashboardHeader.tsx`, `TodayTaskSummaryCards.tsx`, `TodaySchedulePanel.tsx` |
| Metrics | `features/dashboard/server/taskMetrics.ts`, `api/routes/summary.ts` |

### Waves 5–9 (new/updated)

| Wave | Paths |
|------|-------|
| 5 | `schedule/types.ts`, `server/service.ts`, `ScheduleTimeline.tsx`, `subjectScheduleIcons.ts`, `timelineStatus.ts`, `ScheduleAdjustDay.tsx` |
| 6 | `Dashboard.tsx`, `Header.tsx`, `DashboardHeader.tsx`, `navConfig.ts`, `Sidebar.tsx` |
| 7 | `PersonalAssistantPanel.tsx` |
| 8 | `DashboardDatePicker.tsx`, `SchedulePage.tsx`, `Dashboard.tsx` |
| 9 | `DashboardHeader.tsx`, `NotificationBell.tsx` (optional extract) |

---

## 13. Acceptance checklist (all waves)

### Waves 0–4
- [x] Sidebar + nav icons
- [x] Dashboard header + summary cards
- [x] Hero grid

### Waves 5–9
- [ ] Full schedule timeline (5)
- [ ] Footer X of Y + in-progress count (5)
- [ ] Dashboard declutter (6)
- [ ] Single-header polish (6)
- [ ] Settings nav tabs (6)
- [ ] AI assistant stub (7)
- [ ] Date picker + schedule page timeline (8)
- [ ] Bell + Quick Add v1 (9)

---

## 14. Changelog

| Date | Notes |
|------|-------|
| 2026-05-24 | Waves 0–4 shipped; mockup + logo |
| 2026-05-24 | Plan expanded: Waves 5–9 detail, assumptions, TDD, acceptance |

---

## 15. Follow-on assumptions confirmed (Waves 10–14)

These assumptions were accepted after the Waves 5–9 pass and are the default execution contract for the next set of work.

| ID | Assumption | Execution default |
|----|------------|-------------------|
| A16 | Dashboard date browsing should fetch the selected day from the backend, not just filter already-loaded lessons client-side | Use backend-selected date |
| A17 | Selected day should live in the URL and survive refresh/back/forward | Use `date=YYYY-MM-DD` query param |
| A18 | Notification bell remains an alternate view of open alerts, not a true read/unread notification system | Keep alert-backed |
| A19 | Quick Add remains link-based for now, not a modal workflow | Keep links |
| A20 | Assistant remains deterministic/rule-based next, not LLM-backed | Rule-based first |
| A21 | Assistant rules should use existing signals (schedule distribution, overdue/compliance) before inventing new APIs | Reuse current data |
| A22 | Synthetic breaks remain system-generated timeline rows, not user-editable | Keep fixed |
| A23 | Synthetic breaks count in timeline/footer totals, not in productivity metrics | Count only in footer/timeline |
| A24 | In Progress continues to use the current count model, even if more than one lesson overlaps the active window | Keep count model |
| A25 | `/plan/schedule` remains the canonical daily calendar page; no new `/calendar` route yet | Keep `/plan/schedule` |
| A26 | `Adjust day` controls remain available on dashboard and on `/plan/schedule` | Keep in both places |
| A27 | Dashboard is allowed to keep a compact footer stack rather than forcing mockup-minimal purity | Keep compact footer |
| A28 | UI continues to say `Sheath`; legal/title/email/system strings may still say `Sheath Academy` | Mixed naming allowed |
| A29 | Existing Edge/build warnings and unrelated React `act(...)` warnings are out of scope for this dashboard follow-on | Out of scope |
| A30 | Deleted dashboard orphan components stay retired | Do not revive |

### Additional implementation defaults

These are not product-level reversals, but they matter for code shape and test coverage:

| ID | Default |
|----|---------|
| D1 | Reuse `GET /api/plan/lessons` by extending it with `startDate` / `endDate` filters instead of creating a dashboard-only endpoint |
| D2 | Use `date` as the shared query param on `/` and `/plan/schedule` |
| D3 | Assistant suggestions are child-scoped when `selectedChildId` exists; otherwise household-scoped |
| D4 | `/plan/schedule` stays household-wide unless/until we explicitly add a `childId` URL contract there |

---

## 16. Architecture findings for Waves 10–14

### Current code path audit

| Concern | Current owner / path | Finding |
|---------|----------------------|---------|
| Dashboard selected date | `features/dashboard/front/pages/Dashboard.tsx` | Local React state only; not persisted to URL |
| Dashboard date controls | `features/dashboard/front/components/DashboardDatePicker.tsx` | Emits date strings only; routing-aware behavior not yet present |
| Dashboard lesson loading | `plannerApi.getLessons(undefined, selectedChildId ? [selectedChildId] : undefined)` | Loads a broad lesson set, then filters by `dueDate === selectedDate` client-side |
| Planner API list route | `features/plan/api/routes/lessons.ts` | Supports `week`, `childIds`, `subjectIds`; does not yet support direct `startDate` / `endDate` on lesson list |
| Planner repository | `features/plan/server/repository.ts` | Already supports `startDate` / `endDate`; no new repository method required for selected-day loading |
| Schedule day page | `app/(shell)/plan/schedule/page.tsx` | Already fetches date-bounded rows server-side, but only for today and without a shared URL contract |
| Schedule day view UI | `features/schedule/front/pages/SchedulePage.tsx` | Already reuses `ScheduleTimeline` |
| Assistant panel | `features/dashboard/front/components/PersonalAssistantPanel.tsx` | Static markup only; no current rules module |
| Bell dropdown | `features/dashboard/front/components/NotificationBellDropdown.tsx` | Alert-backed, no read/unread state, already aligned with A18 |

### Type ownership decisions

- Planner continues to own `LessonTask` and lesson list filtering contracts.
- Schedule continues to own `DaySchedule`, `ScheduleEntry`, and timeline assembly.
- Dashboard owns only view composition, URL state orchestration, and assistant presentation.
- New assistant rule result types belong under dashboard or a new assistant feature, not `features/lib/types.ts`.

### Data-access ownership decisions

- Do not add a dashboard-specific server data path for day lessons.
- Extend `features/plan/api/routes/lessons.ts` to accept direct date range filters and keep `features/plan/server/repository.ts` as the persistence owner.
- Dashboard remains a client consumer of `plannerApi`.
- `/plan/schedule` remains a server component that reads date-bounded lesson rows and builds the same schedule contract.

### Postgres readiness

- Extending the existing lesson list filters is Postgres-ready because the repository already supports bounded date queries.
- Rule-based assistant work should consume existing API/context data, not add dashboard-owned persistence.
- URL-backed date state changes UI routing only and does not create new persistence coupling.

### End-to-end data flow target

#### Dashboard day view

`DashboardDatePicker` → query param `date` on `/` → dashboard reads selected date → `plannerApi.getLessons(startDate/endDate + selectedChildId)` → `buildDailySchedule()` → `TodaySchedulePanel` / `ScheduleTimeline`

#### Canonical schedule page

`/plan/schedule?date=YYYY-MM-DD` → server component loads selected-day lessons via planner repository → `buildDailySchedule()` → `SchedulePage`

#### Assistant rules

Dashboard lesson set + alerts + selected child context → pure rule module → assistant suggestion view model → `PersonalAssistantPanel`

---

## 17. Wave 10 — URL-backed dashboard date

**Goal:** Persist selected dashboard day in the URL so refresh, back/forward, and copy/paste retain the current date.

### Scope

- Read `date` from the dashboard route query string
- Normalize invalid or missing dates back to "today"
- Update prev/next controls so they push/replace URL state instead of only mutating local state
- Keep current visual behavior unchanged

### Files to touch

| Area | Paths |
|------|-------|
| Dashboard page | `features/dashboard/front/pages/Dashboard.tsx` |
| Date picker | `features/dashboard/front/components/DashboardDatePicker.tsx` |
| Header integration | `features/dashboard/front/components/DashboardHeader.tsx` |
| Integration tests | `features/dashboard/__tests__/integration/components/DashboardDatePicker.test.tsx`, `features/dashboard/__tests__/integration/components/DashboardHeader.test.tsx`, `features/dashboard/__tests__/integration/Dashboard.test.tsx` |

### TDD order

1. Failing integration test: dashboard reads initial `date` query and renders that day
2. Failing integration test: prev/next updates URL contract
3. Failing integration test: invalid date falls back safely to today
4. Implement routing-aware date state
5. Refactor helper parsing/normalization if needed

### Acceptance criteria

- [ ] Dashboard day survives refresh and browser navigation
- [ ] URL contract is `/?date=YYYY-MM-DD`
- [ ] Invalid date never crashes the page
- [ ] Existing bell / Quick Add / child selector interactions still work

---

## 18. Wave 11 — Backend-selected day loading

**Goal:** Remove client-only selected-day filtering and load the selected day directly from the planner data path.

### Smallest safe fix

Extend `GET /api/plan/lessons` with optional `startDate` / `endDate` filters, reusing the existing repository support already present in `listLessonTaskRows(...)`.

### Scope

- Update planner front API client to send `startDate` / `endDate`
- Extend planner lessons route to accept them alongside current `week` behavior
- Dashboard requests only the selected day
- Preserve selected child scoping and existing lesson list shape

### Files to touch

| Area | Paths |
|------|-------|
| Planner front client | `features/plan/front/services/api.ts` |
| Planner route | `features/plan/api/routes/lessons.ts` |
| Dashboard page | `features/dashboard/front/pages/Dashboard.tsx` |
| Planner API tests | `features/plan/__tests__/api/lessons-handler.test.ts` |
| Dashboard integration tests | `features/dashboard/__tests__/integration/Dashboard.test.tsx` |

### TDD order

1. Failing API test: `startDate` / `endDate` filters bound the lesson list
2. Failing API test: `week` behavior still works unchanged
3. Failing dashboard integration test: changing selected date triggers a different fetched day
4. Implement front API + route changes

### Acceptance criteria

- [ ] Dashboard fetches only the selected day from the backend
- [ ] No new dashboard-specific API endpoint exists
- [ ] Existing `week` filtering remains backward compatible
- [ ] Selected child filtering still works

---

## 19. Wave 12 — Canonical day-view unification

**Goal:** Make `/plan/schedule` the canonical daily calendar page using the same `date` contract and schedule model as dashboard.

### Scope

- Add `date` query parsing to `app/(shell)/plan/schedule/page.tsx`
- Keep `buildDailySchedule()` and `ScheduleTimeline` as the shared source of day-view behavior
- Keep `Adjust day` visible on both dashboard and `/plan/schedule`
- Do not create `/calendar`

### Files to touch

| Area | Paths |
|------|-------|
| Server route page | `app/(shell)/plan/schedule/page.tsx` |
| Schedule page UI | `features/schedule/front/pages/SchedulePage.tsx` |
| Dashboard panel links | `features/dashboard/front/components/TodaySchedulePanel.tsx` |
| Schedule tests | `features/schedule/__tests__/integration/SchedulePage.test.tsx` |
| Possibly e2e | `e2e/planner.spec.ts` |

### TDD order

1. Failing schedule page integration test: selected date renders in title / timeline
2. Failing integration test: shared timeline still renders same rows for the same day
3. Failing regression test: `Adjust day` remains available
4. Implement shared `date` contract

### Acceptance criteria

- [ ] `/plan/schedule?date=YYYY-MM-DD` renders that day
- [ ] Dashboard "View Full Calendar" link preserves the current day
- [ ] No new `/calendar` route is introduced
- [ ] Day-view behavior remains aligned across dashboard and schedule page

---

## 20. Wave 13 — Rule-based assistant

**Goal:** Replace the static assistant stub with deterministic suggestions backed by current app signals.

### Rule candidates (A20, A21, D3)

1. **Schedule imbalance** — same subject or same instruction mode is overly clustered in the selected day / nearby period
2. **Overdue focus** — selected child (or household) has overdue work that should be prioritized
3. **Compliance nudge** — records/compliance attention is open and should be surfaced

### Scope

- Add a pure rules module that converts current dashboard inputs into assistant suggestions
- Keep the panel static in layout, dynamic in content
- No LLM, no network call, no new persistence

### Files to touch

| Area | Paths |
|------|-------|
| New rules module | `features/dashboard/front/lib/assistantRules.ts` (or new `features/assistant/` if scope expands) |
| Panel | `features/dashboard/front/components/PersonalAssistantPanel.tsx` |
| Dashboard wiring | `features/dashboard/front/pages/Dashboard.tsx` |
| Unit tests | `features/dashboard/__tests__/unit/assistantRules.test.ts` |
| Integration tests | `features/dashboard/__tests__/integration/components/PersonalAssistantPanel.test.tsx` |

### TDD order

1. Failing unit tests for each rule
2. Failing integration test for rendered suggestion state
3. Implement pure rules
4. Wire rule output into panel view model

### Acceptance criteria

- [ ] Panel shows real suggestion content derived from current data
- [ ] Rules are child-scoped when a child is selected; otherwise household-scoped
- [ ] Empty / healthy state remains presentable
- [ ] No backend AI integration is added

---

## 21. Wave 14 — Bell, Quick Add, compact footer, and guardrails

**Goal:** Harden the current v1 dashboard contract without broad refactors.

### Scope

- Keep bell alert-backed; improve presentation/sorting only if needed
- Keep Quick Add as links; improve UX/accessibility behavior only
- Preserve compact footer widgets as an intentional layout choice
- Add guardrails in tests/docs so deleted orphans and rejected patterns do not drift back in
- Leave unrelated build/Edge warning cleanup out of scope

### Files to touch

| Area | Paths |
|------|-------|
| Bell | `features/dashboard/front/components/NotificationBellDropdown.tsx` |
| Header | `features/dashboard/front/components/DashboardHeader.tsx` |
| Bell tests | `features/dashboard/__tests__/integration/components/NotificationBellDropdown.test.tsx` |
| Header tests | `features/dashboard/__tests__/integration/components/DashboardHeader.test.tsx` |
| Optional doc guardrail | this plan file / related docs if needed |

### TDD order

1. Failing integration test: bell ordering / close behavior if refined
2. Failing integration test: Quick Add remains links and closes on navigate
3. Failing regression test: footer widgets remain compact and intentional

### Acceptance criteria

- [ ] Bell remains a simple open-alert surface, not a notification system rewrite
- [ ] Quick Add remains link-based and predictable
- [ ] Compact footer stack remains intentional and tested
- [ ] No retired dashboard widgets are reintroduced

---

## 22. Recommended execution order (Waves 10–14)

Implement in order:

1. **Wave 10** — URL-backed date
2. **Wave 11** — backend-selected day loading
3. **Wave 12** — canonical day-view unification
4. **Wave 13** — rule-based assistant
5. **Wave 14** — hardening and guardrails

Recommended commit rhythm: **one wave per commit**.

---

## 23. Cross-wave regression checklist (Waves 10–14)

- [ ] Dashboard date survives refresh, back/forward, and link sharing
- [ ] Dashboard selected day is fetched from planner backend, not filtered only in-memory
- [ ] `/plan/schedule` preserves selected day via query param
- [ ] Dashboard → "View Full Calendar" preserves current date
- [ ] Assistant renders household vs child scoped suggestions correctly
- [ ] Bell/Quick Add behavior remains green in integration tests
- [ ] `npm test`, `npm run build`, and `npm run smoke` pass after each wave
