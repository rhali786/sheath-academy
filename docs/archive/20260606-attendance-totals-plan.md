# Per-learner attendance totals on `/attendance` — implementation plan

**Date:** 2026-06-06
**Branch:** `fix/attendance-summary-discoverability`
**Author:** planning pass (plan-builder), resolves the DEFERRED `attendance` workstream in `docs/bug_enhancement/20260606-2016-steward-grouped-plan.json` (feedback `7f75f578-c9bd-4945-a9d6-1ebc32e4c7bb`)

---

## Summary

| Question | Audit finding |
|---|---|
| Does `AttendanceSummary` already show **per-learner** totals? | **Yes.** It is rendered with `summary` for the currently-selected learner only (`AttendancePage.tsx:252` → `summary` state populated by `fetchSummary(selectedChildId)`, `:71-77`), and the underlying data is computed **per `childId`** end-to-end (`getAttendanceSummary(householdId, childId, …)` → `summarizeAttendanceByStatus(childId, …)`). It is not a household aggregate. |
| Is it visible without extra clicks? | **Yes.** It renders directly under the "Summary" heading on initial page load (`AttendancePage.tsx:250-253`), no toggle, no collapsed state, no extra navigation. |
| Does it show **totals** (counts by status, total records)? | **Yes.** `summary.totalRecorded` and a card grid of `summary.byStatus[status]` per active status (`AttendanceSummary.tsx:35-52`). |
| So what's missing? | **Nothing functionally** — but the component gives **zero visual indication of *which learner*** the totals belong to. The learner selector lives inside the (collapsible, click-to-open) "Mark attendance" form (`AttendancePage.tsx:182-196`), so a user looking only at the Summary section has no on-screen cue that these numbers are scoped to one learner and will silently change if they pick someone else. **This is the likely cause of "I want per-learner totals" — the user may already be looking at exactly that, without realizing it's per-learner.** |

**Conclusion: the existing summary already satisfies "totals per learner."** The gap is a labeling/discoverability issue, not a missing aggregation. No new API, service, or repository work is needed.

---

## Planning mode

**Mode 1 — pure copy/discoverability.** The data is already computed and delivered per-learner end to end (repository → service → route → front service → page → component). The only change needed is a UI label naming the learner whose totals are shown — no new aggregation, no schema/repository/service change, no new type.

---

## Code-path audit (current state)

### Page → state → component wiring
- `features/attendance/front/pages/AttendancePage.tsx:39` — `const [summary, setSummary] = useState<SummaryType>(DEFAULT_SUMMARY)`.
- `features/attendance/front/pages/AttendancePage.tsx:71-77` — `fetchSummary(childId)` calls `attendanceApi.getSummary(childId)` and sets `summary` from the response; guarded by `if (!childId) return`.
- `features/attendance/front/pages/AttendancePage.tsx:83-85` — `useEffect(() => { fetchSummary(selectedChildId) }, [selectedChildId])` — refetches whenever the selected learner changes (also re-fetched after create/archive/update/batch at `:105,111,117,126`).
- `features/attendance/front/pages/AttendancePage.tsx:250-253` — renders `<h2>Summary</h2>` then `<AttendanceSummary summary={summary} />` directly, always visible, no conditional wrapper, no collapse — confirms **visible without extra clicks**.
- `features/attendance/front/pages/AttendancePage.tsx:55` — `selectedChildId` is set from the URL `childId` param if present, else `children[0].id` — so on first load it already defaults to one specific learner; the Summary section is therefore *always* one-learner-scoped, never blank/aggregate.

### Component rendering
- `features/attendance/front/components/AttendanceSummary.tsx:24-31` — early-returns "No attendance recorded yet for this learner." when `summary.totalRecorded === 0` — note the empty-state copy *already says* "for this learner," confirming the component's own self-understanding that it is per-learner; the populated state simply doesn't carry that label forward.
- `features/attendance/front/components/AttendanceSummary.tsx:35-37` — shows `{summary.totalRecorded} record(s) total`.
- `features/attendance/front/components/AttendanceSummary.tsx:38-52` — grid of cards, one per active status, each showing `summary.byStatus[status]` and `STATUS_LABELS[status]`.
- `features/attendance/front/lib/summaryDisplay.ts:4-6` — `statusesWithCounts` filters to statuses with `count > 0` (this is why "no extra clicks" doesn't mean "no filtering" — zero-count statuses are hidden by design, a presentation choice unrelated to the feedback).

### Data path (per-learner, confirmed at every layer)
- `features/attendance/front/services/api.ts:70-75` — `getSummary(childId, startDate?, endDate?)` builds `?childId=...` query and calls `GET /api/attendance/summary`.
- `features/attendance/api/routes/summary.ts:10-17` — route requires `childId` query param (400 if missing) — **the endpoint cannot return a household aggregate; it is per-learner by contract**.
- `features/attendance/api/routes/summary.ts:23-24` — `getRequestAuthCtx()` resolves `householdId`; `getAttendanceSummary(householdId, childId, startDate, endDate)`.
- `features/attendance/server/service.ts:45-60` — `getAttendanceSummary` calls `listAttendanceEvents(householdId, { learnerId: childId, startDate, endDate })` then `summarizeAttendanceByStatus(childId, rows.map(r => r.status))`.
- `features/attendance/server/summarize.ts:4-20` — pure aggregation function; takes `childId` and a status array, returns `{ childId, totalRecorded, byStatus }`.
- `features/attendance/types.ts:81-85` — `AttendanceSummary { childId; totalRecorded; byStatus: Record<AttendanceStatus, number> }` — the type itself is keyed to a single `childId`; there is no household-aggregate shape anywhere in this feature.
- `features/attendance/types.ts:48-54` — `emptyAttendanceSummary(childId)` — even the empty-state constructor takes a `childId`.

**Every layer — repository filter, service signature, route contract, front-service signature, type shape, and component copy — is already single-learner-scoped.** There is no code path that could produce a household-wide aggregate from this endpoint; building one would be a different, larger feature (a new aggregation across all `children`, looped `getSummary` calls or a new repository query grouped by `learnerId`), which nothing in the feedback or the deferred note asks for.

### Existing tests
- No test asserts on the *labeling* of `AttendanceSummary` (i.e., that it names the learner). Tests likely assert on `summary.byStatus`/`totalRecorded` rendering only — confirm during Phase 1 by reading `features/attendance/__tests__/integration/*` before writing the new assertion (avoid duplicating an existing one).

---

## Source-of-truth decision

**Attendance** owns this data — `attendance_events` in `db/schema.ts`, via `features/attendance/server/repository.ts` → `service.ts` → `api/routes/summary.ts`. No ownership question; this plan changes **zero** lines of data-access code.

### Architecture Findings
- **Type owner:** `AttendanceSummary` stays in `features/attendance/types.ts`. No new or modified type — `childId` is already on the shape; we only need to resolve it to a display name in the UI layer using data the page already has (`children` from `useHousehold()`, `AttendancePage.tsx:31`).
- **Data access:** `UI → attendanceApi → /api/attendance/summary route → service → repository`. **Completely unchanged** — this is a presentation-only fix. No new query, no new service function, no new route param.
- **Cross-feature import:** none introduced (the page already consumes `useHousehold()` for `studentProfiles`/`children`, which is the existing, approved way to resolve a `childId` → display name within `(shell)` pages).
- **Postgres-ready:** N/A — no schema or repository change.
- **Refactor restraint:** do not touch `summarize.ts`, `service.ts`, `repository.ts`, or the route handler. Do not add a household-aggregate mode to the endpoint — nothing in the feedback or the deferred clarifying note asks for one, and adding one would be exactly the kind of speculative larger-than-needed change the deferral was meant to prevent.

---

## Build phase (single phase — Mode 1, no migration, no gate)

**Phase 1 — Name the learner in the Summary section.**
Add a visible label naming the selected learner above/alongside `<AttendanceSummary>`, e.g. `<h2>Summary — {selectedChild?.name}</h2>` or a sub-line `"Showing totals for {name}"`, resolved via `children.find(c => c.id === selectedChildId)` (the page already has `children` in scope from `useHousehold()`, `AttendancePage.tsx:31`). This makes the existing per-learner scoping visible at a glance and removes any ambiguity about whether the numbers are household-wide.
- Files: `features/attendance/front/pages/AttendancePage.tsx` (the `<h2>Summary</h2>` at `:251`), its integration test under `features/attendance/__tests__/integration/`.
- Optionally also pass the resolved name into `AttendanceSummary` as a prop (e.g. `learnerName?: string`) so the component's own empty-state copy ("No attendance recorded yet for **this learner**") can be made concrete ("...for **Amira**") — a small, contained prop addition, not a new data dependency (the component still receives only `summary`; `learnerName` is purely cosmetic and optional).
- Tests: integration test asserting that switching the learner selector updates both the displayed name label *and* the summary counts (regression-proves the existing per-learner refetch at `AttendancePage.tsx:83-85` while proving the new label tracks it); empty-state test asserting the name appears in the "no attendance recorded" message if the optional prop is wired through.
- **No gate** — this is a pure UI labeling change against data that is already fetched and already correct; no product decision is pending.

---

## Out of scope
- Any new household-aggregate or "all learners at a glance" attendance view — not requested by the feedback or the deferred note; would require a new repository query grouped by `learnerId` and a new UI section, which is a materially larger feature than what was asked.
- Any change to `getAttendanceSummary`, `summarizeAttendanceByStatus`, `listAttendanceEvents`, or the `/api/attendance/summary` route contract — all already correct and per-learner.
- Date-range summary UI (the API already accepts `startDate`/`endDate`, `summary.ts:70-74`, but no UI currently surfaces a range picker for the summary — a separate, unrequested enhancement; do not bundle it here).
- Print/export of the summary — `window.print()` exists for the page (`AttendancePage.tsx:151`) but nothing summary-specific is requested.

## Manual QA
- On `/attendance`, with at least two active learners seeded, confirm the "Summary" section header (or sub-label) names the currently selected learner.
- Switch the learner selector inside "Mark attendance" (or via `?childId=` URL param) and confirm both the label and the totals/cards update together, with no stale name/number mismatch.
- Confirm the empty state ("No attendance recorded yet for this learner") names the learner when the optional prop is wired through.
- Confirm `Print` still renders the labeled summary correctly (no layout regression from the added label).

## Risks + rollback
- Single-file UI change with no data-layer touch — trivially revertible (remove the label line).
- The only risk is a stale-name flash if `children` hasn't loaded yet when `selectedChildId` is set; guard with `selectedChild?.name ?? ''` (the page already guards similarly elsewhere, e.g. `householdProfile?.id ?? ''` at `:89,123`).
- No migration, no API contract change — zero risk of breaking other consumers of `/api/attendance/summary` (only `attendanceApi.getSummary` calls it, per `grep` of `features/attendance/`).
