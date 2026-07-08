# Dashboard three-zone redesign — implementation plan (2026-07-07)

**Status:** ready for execution (one plan, run as ordered phases via `plan-execute`). **No human gates — all phases run autonomously.** The only pause-worthy risk (the Phase 1 migration) is handled by an automated precondition, not a stop.
**Design source of truth:** approved static prototype (three-zone: Today / Per-learner / Proof & Progress) + `docs/bug_enhancement/20260707-dashboard-redesign-discussion.md`.
**Prior audit:** service-surface audit already completed against real code (see Code-path audit below).

---

## Summary

Rebuild the Home dashboard (`features/dashboard/front/pages/Dashboard.tsx`) from a ~10-card two-rail pile into **three honest zones**:

- **Zone A — Today:** summary cards + `TodaySchedulePanel` (with *Start learning time* merged into its footer) beside a promoted, cross-feature **Attention Hub**.
- **Zone B — Per-learner command center:** one compact row per learner (attendance % · today's lessons X/Y · current grade), clicking a row scopes the whole dashboard to that learner via the existing `LearnerContext`.
- **Zone C — Proof & Progress:** a new **Compliance status card**, School Year ring, per-child Qur'an rings, an optional Learning-Time weekly chart, Islamic calendar, and a full-width non-scrolling Personal To-dos.

The dashboard stays a **pure composer** — all new aggregation lives in the owning features (alerts, gradebook, compliance), never in Home. Also folds in a **per-household logo preset** (pick one of 5; upload deferred).

**Cuts:** `PersonalAssistantPanel` (folded into alerts), `RecordsProof`/Records-Readiness tiles (Records + export live entirely on `/records`), `LearningTimeEntry` as a standalone card (becomes a button). **Dropped as unbacked:** reminders (no such feature), per-learner compliance dot (compliance is household-level), grade-trend arrow (GPA is a point value, no delta).

---

## Planning mode

**Mode 3 (cross-feature dashboard composition) + a Mode 4 slice (household logo presets).** The dashboard reads from ≥5 features and composes shared signals; the logo preset adds a new small capability with a schema change. Full code-path audit, source-of-truth decisions, unit + API + integration tests, and a gated migration are therefore required.

---

## Code-path audit (traced against current code)

| Zone / piece | Renders in | Data via (front) | API route | Server service / repo | Owner | Backed today? |
|---|---|---|---|---|---|---|
| Attention Hub | `NeedsAttention.tsx` (already renders `Alert[]`) | `dashboardApi.getAlerts` → `/api/alerts` | `features/alerts/api/routes/alerts.ts` | `alerts/server/service.ts:getAlerts()` — already imports attendance + children + plan repos | **Alerts** | Partially — planner + attendance emitters exist; gradebook + compliance emitters must be added |
| Compliance card | *new* `ComplianceStatusCard` | `complianceApi.getStatus` + `getDeadlines` + `getActiveSchoolYearId` | `/api/compliance/status`, `/deadlines`, `/api/school-years/active` | `compliance/server/status-engine.ts`, `repository.ts:getComplianceStatusInput/listDeadlines`; `school-year/server/service.ts:getActiveSchoolYear` | **Compliance** | ✅ fully |
| Zone B — attendance % | *new* `LearnerCommandRow` | `attendanceApi.getSummary(childId)` | `/api/attendance/summary` | attendance repo | **Attendance** | ✅ (per-child, N calls) |
| Zone B — today X/Y | same | `plannerApi.getLessons(childIds, date)` | `/api/plan/lessons` | plan repo | **Planner** | ✅ (one call) |
| Zone B — current grade | same | `gradebookApi.getSummaries()` | `/api/gradebook/summaries` | `gradebook/server/repository.ts:listGradebookSummaries` (all learners, one call) | **Gradebook** | ⚠️ needs a composer-safe overall field (see Phase 3) |
| Learner-click filter | `Dashboard.tsx` | `LearnerContext.setSelectedChildId` (existing) | — | — | **Dashboard (UI state)** | ✅ |
| Start learning time | `LearningTimeEntry.tsx` → becomes button in `TodaySchedulePanel` footer | `learningTimeApi` (unchanged) | `/api/learning-time/*` | learning-time | **Learning-time** | ✅ |
| Qur'an rings | `QuranStreak.tsx` (per-child, computes streak client-side — existing precedent) | dashboard context `quranSessions` | `/api/dashboard/quran` | dashboard | **Qur'an/Dashboard** | ✅ keep as-is |
| Learning-Time weekly chart (optional) | *new* card | `learningTimeApi.list({from,to})` + client daily bucketing (precedent: `QuranStreak.calcStreak`, `SchoolYearProgressCard.computeProgress`) | `/api/learning-time/sessions` | learning-time | **Learning-time** | ⚠️ backed only via client bucketing — optional; see Phase 8 |
| Household logo | app-shell `HouseholdSwitcher` + dashboard brand slot | `useHousehold().householdProfile.logoPreset` | `/api/household/profile` | `households` table + `household-profile.ts` | **Household** | ❌ new column + plumbing (Phase 1) |
| PersonalAssistantPanel | `PersonalAssistantPanel.tsx` + `assistantRules.ts` | — | — | dashboard-local business logic | — | **Cut** — its one real rule ("schedule imbalance") moves into `getAlerts()` |

**Fully traced.** Unknowns: none blocking. The only judgment call is the Learning-Time chart's client-side bucketing (Phase 8, optional).

---

## Architecture Findings (per `architecture-rules`)

- **Type ownership.** `Alert` / `AlertSourceFeature` are owned by `features/alerts/types.ts` — Phase 2 extends that union there (`'gradebook' | 'compliance'`), not in dashboard. `GradebookSummary` is owned by `features/gradebook/types.ts` — Phase 3 adds `overallMastery` there. `HouseholdProfile` (in `features/lib/types`) gains `logoPreset` — Phase 1.
- **Data-access ownership.** All new aggregation runs **inside the owning feature's server service**: gradebook/compliance emitters live in `alerts/server/service.ts` (which already reaches into sibling repos — established pattern), reading through each feature's repository, never raw stores from a route or UI. The dashboard components only call feature front-services.
- **Dashboard owns no business logic.** The Attention Hub aggregation is in the alerts feature; the "current grade" number is computed in the gradebook repository (Phase 3); the compliance verdict comes from the compliance status-engine. Home composes only. The one piece of existing dashboard-local logic (`assistantRules.ts`) is **removed**.
- **No new dashboard seed/store data.** Nothing here invents dashboard fixtures to fake dynamic data.
- **Cross-feature imports.** Dashboard components import feature **front-services** (`complianceApi`, `gradebookApi`, `attendanceApi`, `plannerApi`) — allowed. `getAlerts` (server) imports sibling **server repositories** — matches its current shape.

---

## Source-of-truth decisions

- **Attention signals → Alerts.** `getAlerts()` remains the single aggregator. Gradebook & compliance signals are *emitted* there by reading their repos; the dashboard never computes them. Ownership preserved (option: *migrate into this wave* for the two new emitters, which belong in alerts by design).
- **Current grade → Gradebook.** To keep Home a composer, the overall per-learner figure is computed in `listGradebookSummaries` (Phase 3), not by averaging in the dashboard.
- **Compliance verdict → Compliance status-engine** (unchanged). Note: `getComplianceStatusInput` currently passes `subjectCoverage: []` and all-false `artifactFlags` — the card surfaces whatever the engine returns; **improving those inputs is out of scope** (pre-existing behavior).
- **Household identity → Household.** Logo preset is a household attribute; stored on the `households` row.

---

## Acceptance criteria (observable)

**Zone A**
1. The dashboard renders three labeled regions in order: Today, Per-learner, Proof & Progress.
2. The Attention Hub lists items sourced from planner, attendance, gradebook, and compliance. Seeding an overdue lesson, a missing-attendance day, a decaying gradebook subject, and a compliance deadline within the window each produce a corresponding hub item with the correct source label and severity stripe.
3. Every hub item shows a learner chip; household-scoped items read "Household."
4. `Start learning time` appears in the schedule panel footer; the standalone `LearningTimeEntry` card is gone.
5. `PersonalAssistantPanel` no longer renders anywhere on Home.

**Zone B**
6. One row per active learner shows attendance %, today's lessons as "X / Y", and a current grade value; when a metric has no data it shows "—", not a crash or a fake number.
7. Clicking a learner row sets the global learner filter (header switcher reflects it) and the dashboard scopes to that learner.
8. No trend arrow and no per-learner compliance indicator appear (explicitly dropped).

**Zone C**
9. A Compliance card shows a green/amber/red status, its reasons, and the next deadline; on no active school year it shows an empty state ("Set up compliance"), on fetch error a retry, on load a spinner/skeleton.
10. School Year ring, per-child Qur'an rings, Islamic calendar, and a full-width Personal To-dos render; the to-dos list shows **all** items with **no internal scroll**.
11. Records-Readiness tiles and the export launcher are **absent** from Home.

**Logo presets**
12. During household setup and in household settings, a picker cycles through 5 preset marks; the selection persists (reload shows it) and renders next to the household name in the header switcher.
13. A household with no chosen preset renders a sensible default mark (no broken image, no crash).

**Global**
14. `npm run build` and `npm test` pass; the date in the dashboard header renders as plain text, not a button.

---

## Data / contract changes

1. **`households` table** (Phase 1, gated migration): add `logo_preset text` (nullable; app default applied on read). Pure column addition — no FK/UNIQUE, so the drizzle composite-FK ordering caveat does not apply. Inspect generated SQL before `db:migrate`; confirm `DATABASE_URL` is not prod.
2. **`HouseholdProfile`** (`features/lib/types`): add `logoPreset?: string`. Map it in `profileFromRowAndSettings`; accept/validate it in `household-profile.ts` `PUT` (whitelist against the 5 known keys).
3. **`AlertSourceFeature`** (`features/alerts/types.ts`): add `'gradebook' | 'compliance'`. No shape change to `Alert`.
4. **`GradebookSummary`** (`features/gradebook/types.ts`): add `overallMastery: number | null` (average of non-null subject `masteryAverage`, computed in `listGradebookSummaries`).

---

## Build phases (ordered by dependency)

> Each phase: test-first (write failing tests, implement, green), commit at phase end, `npm run build` + `npm test` before moving on. **All phases run autonomously — no human gates.**

### Phase 1 — Household logo preset: schema + profile plumbing
- **Precondition (automated, blocking): assert `DATABASE_URL` is not the prod database before running `db:migrate`. Abort the phase if it is — do not prompt, do not proceed.**
- Add `logo_preset` column; `npm run db:generate`, inspect SQL, `npm run db:migrate`.
- Add `logoPreset` to `HouseholdProfile`; map in `profileFromRowAndSettings`; validate in `PUT` (allowed keys only).
- **Tests first:** `household-profile` API test — `PUT { logoPreset }` persists and `GET` returns it; invalid key rejected (400).

### Phase 2 — Attention Hub: alerts type + `getAlerts()` emitters
- Extend `AlertSourceFeature` with `'gradebook' | 'compliance'`.
- In `getAlerts()`: emit **gradebook** alerts from `listGradebookSummaries` (`needsAttentionSubjects` → per-subject item, severity medium, href `/growth/gradebook?childId=`); emit **compliance** alerts from `getActiveSchoolYear` + `listDeadlines` (not-completed, `dueDate` within N days → item, href `/compliance`); emit **schedule-imbalance** (a subject scheduled ≥2× on `today` for a learner — the salvaged assistant rule) from the lessons already fetched.
- **Tests first:** `alerts/__tests__` unit cases — each emitter fires on seeded data and stays silent otherwise; existing alerts API test remains green.

### Phase 3 — Gradebook `overallMastery`
- Compute in `listGradebookSummaries` (avg of non-null subject `masteryAverage`; `null` when none). Add to type.
- **Tests first:** gradebook repository unit — mixed/empty subjects produce expected `overallMastery`.

### Phase 4 — Compliance status card (Zone C)
- New self-fetching `ComplianceStatusCard` (pattern: `SchoolYearProgressCard`): resolve active school-year id → `getStatus` + `getDeadlines`; render status color, reasons, next deadline; loading / empty / error states.
- **Tests first:** integration — loading, empty (no school year), error+retry, populated (green/amber/red + deadline). UI per `ui-style-guide` card pattern.

### Phase 5 — Zone B per-learner command center
- New `LearnerCommandRow` + container: attendance % (`getSummary` per child), today X/Y (`getLessons`), current grade (`getSummaries().overallMastery`). Row click → `setSelectedChildId`. "—" for missing metrics.
- **Tests first:** integration — rows render per learner, columns correct, click sets filter (assert context/URL), loading/empty/error. Uses `renderWithProvider` + `LearnerProvider`.

### Phase 6 — Household logo presets: UI
- 5 preset SVG marks in a small registry; cycling picker in `HouseholdSetup`/settings; render chosen preset in `HouseholdSwitcher` (+ dashboard brand slot) via `useHousehold().householdProfile.logoPreset`; default mark when null.
- **Tests first:** integration — picker cycles + persists (PUT called), switcher renders selected preset, default when null.

### Phase 7 — Dashboard re-shell + cuts (integrates Phases 2–6)
- Restructure `Dashboard.tsx` into Zone A/B/C; place Attention Hub (Zone A); merge `LearningTimeEntry` → schedule footer button; **remove** `PersonalAssistantPanel` + `assistantRules` usage; **remove** `RecordsProof` from Home; slim Zone C (Compliance, School Year, Qur'an rings, Islamic, full non-scrolling To-dos); fix compounding padding; date → plain label.
- **Tests first:** dashboard integration — three zones present, Attention Hub renders aggregated alerts, learner rows present, `PersonalAssistantPanel`/`RecordsProof` absent, To-dos not scroll-clipped.

### Phase 8 — Learning-Time weekly chart *(optional / lowest priority)*
- New card from `learningTimeApi.list({from,to})` with client daily bucketing (precedent noted). If we prefer zero client aggregation, defer and open a follow-up for a learning-time weekly-summary endpoint.
- **Tests first:** integration — buckets render, empty week state.

---

## Testing plan (failing tests first)

- **Unit:** alerts emitters (Phase 2); gradebook `overallMastery` (Phase 3); logoPreset validation (Phase 1).
- **API:** `household-profile` PUT/GET logoPreset (Phase 1); alerts route still returns aggregated array (Phase 2).
- **Integration:** Compliance card states (4); Zone B rows + click-to-scope (5); logo picker persist + render (6); dashboard three-zone composition + cuts (7). All must cover **loading / empty / error / populated** per CLAUDE.md. Reset `sessionStorage` between Zone B tests (LearnerContext leakage caveat).
- **Regression checklist:** existing alerts API test; `NeedsAttention` sort; `DashboardHeader` greeting/Quick Add; child selector; `TodaySchedulePanel` footer counts; household profile GET/PUT for existing fields.
- **Cut-module test fallout (Phase 7 must handle):** deleting `PersonalAssistantPanel`/`assistantRules` and removing `RecordsProof`/`LearningTimeEntry` from Home breaks/obsoletes these existing tests — they are in Phase 7's fileScope and must be updated or removed: `__tests__/integration/components/PersonalAssistantPanel.test.tsx`, `__tests__/unit/assistantRules.test.ts`, `__tests__/integration/components/LearningTimeEntry.test.tsx`, `__tests__/integration/RecordsSection.test.tsx`, `__tests__/integration/components/DashboardComponents.test.tsx`, `__tests__/integration/components/LinkedFiltering.test.tsx`.
- **Note:** a stale legacy `features/dashboard/frontend/src/` tree (duplicate `Dashboard.tsx`/`RecordsProof.tsx`) exists but is **not** wired into the app (`app/` uses `features/dashboard/front/`). Out of scope; do not edit.
- Run full suite incl. integration: `npx jest --testPathIgnorePatterns="/node_modules/"` (plain `npm test` skips integration).

---

## Out of scope

- Custom logo **upload** (deferred by decision — presets only).
- Improving compliance `subjectCoverage` / `artifactFlags` inputs (pre-existing engine limitation).
- A per-learner detail/dashboard page (learner click scopes in place instead).
- Batched attendance-summary endpoint (accept N per-child calls now; note as future optimization).
- Grade-trend arrow, per-learner compliance dot, reminders (unbacked — dropped).
- Badges/"Recent Wins" on Home (cut).

## Manual QA (click-by-click)

1. Seed demo → open Home; confirm three zones in order, no compounding gap, date is plain text.
2. Make a lesson overdue, clear one learner's attendance, force a decaying subject, add a compliance deadline due in 3 days → each appears in the Attention Hub with correct source + learner chip; click one → lands on its source page.
3. Click a learner row → header switcher updates, dashboard scopes to that learner; clear filter restores all.
4. Zone C: Compliance card shows status + next deadline; break the school-year to see empty state; To-dos with 12 items show fully without an inner scrollbar.
5. Setup a new household → cycle logo presets, pick one, finish setup, reload → mark shows in the header switcher; a household that skipped it shows the default mark.
6. `npm run build` + `npx jest --testPathIgnorePatterns="/node_modules/"` green.

## Branch + commit plan

- Branch: `feat/dashboard-three-zone-redesign` off `dev`.
- Behavior-oriented commits, one per phase (e.g. `feat(alerts): emit gradebook + compliance + schedule-imbalance signals`, `feat(dashboard): three-zone layout with attention hub and per-learner rows`, `feat(household): per-household logo presets`). Never `--no-verify`.
- PR into `dev` (per repo `gh` ergonomics: `--body-file`, idempotent create).

## Risks + rollback

- **Migration blast radius (Phase 1):** column addition is reversible; confirm `DATABASE_URL` non-prod before `db:migrate`; rollback = drop column.
- **`getAlerts()` fan-out cost:** two more repo reads per request; both are single-query per household (gradebook summaries, deadlines). Acceptable; monitor.
- **Zone B N attendance calls:** fine for small households; if it drags, add a batched endpoint (out of scope, named).
- **Layout regressions:** integration tests assert zone presence and cut components' absence; manual QA covers spacing.

## Estimate (measured-rate, risk/review-load — not effort-hours)

Build cost is ~free; what matters is **review surface and risk**:

| Phase | Review load | Risk |
|---|---|---|
| 1 Schema + profile | Low | **Med** (migration — guarded by non-prod precondition) |
| 2 Alerts emitters | **Med** (new cross-feature logic, most bug-prone) | Med |
| 3 Gradebook field | Low | Low |
| 4 Compliance card | Low–Med | Low |
| 5 Zone B rows | Med | Low–Med |
| 6 Logo UI | Low | Low |
| 7 Re-shell + cuts | **Med** (touches the most surface) | Med (regressions) |
| 8 Learning-time chart | Low | Low (optional) |

**No human gates — the run is autonomous.** Concentrate *post-hoc* review on Phase 1 (migration SQL), Phase 2 (alerts logic, most bug-prone), and Phase 7 (largest diff, regression surface). The Phase 1 migration is protected at runtime by the non-prod `DATABASE_URL` precondition. Everything else is low-risk, mechanical composition.
