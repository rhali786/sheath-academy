# Dashboard three-zone redesign — fidelity pass (2026-07-08)

**Why this exists:** the first execution (`20260707-dashboard-three-zone-redesign-plan`) built the backend/data
correctly (P1–P6) but the UI did **not** match the prototype. Root cause: tests asserted *structure against mocks*,
never *fidelity to the prototype*, and no phase ran the real app on seeded data. This pass fixes the UI to match the
approved prototype and verifies against the running app — not just jest.

**Design source of truth (authoritative):** Artifact "Dashboard redesign — three-zone prototype **v2**"
(`docs/design/dashboard-three-zone-prototype-v2.html`, committed alongside this plan). Where any earlier doc or the
v1 screenshot disagrees, **v2 wins**.

**Execution:** built interactively in one session (no sub-agents). Each item is verified by launching the app on the
**dev** DB (`sacad`, never prod) with `db:seed:demo` data and visually comparing to the prototype.

---

## What stays (already correct — do not touch)

- **Dashboard greeting header** (`DashboardHeader`): greeting "Assalamu alaikum, …", date pill, Quick Add, Today's
  Plan, and the "Viewing / All children" row. The prototype keeps all of these — leave as-is.
- **Backend/data from the prior pass:** `logo_preset` column + `HouseholdProfile.logoPreset` (P1), `getAlerts()`
  gradebook/compliance/schedule emitters (P2), `GradebookSummary.overallMastery` (P3), `ComplianceStatusCard`
  self-fetch (P4), `LearnerCommandCenter` fetch fan-out (P5), logo picker (P6). These are sound; this pass only
  changes presentation + two data windows.
- **School Year ring, Qur'an per-child rings, Islamic Calendar** cards — keep; light restyle only to match card chrome.

## What changes (UI fidelity)

### 1. Zone chrome — NO zone names (user override vs prototype)
- Do **not** render "Zone A/B/C" eyebrows. Separate the three sections with spacing only. No guiding-question captions.
- Keep the existing max-width frame and page background.

### 2. Zone A — summary strip
`TodayTaskSummaryCards`: match prototype copy + round chip icons.
- Card 1: big number, **"Lessons done"**, hint **"Across N learners"**, green ✓ chip.
- Card 2: **"In progress"**, hint **"On today's schedule"**, sky ◷ chip.
- Card 3: **"Overdue"**, hint **"Needs attention"**, amber ! chip.
- Numbers come from existing `metrics` (no new data).

### 3. Zone A — Attention Hub (biggest miss)
Replace the old `NeedsAttention` presentation with a hub that matches the prototype. **New component**
`AttentionHub.tsx` (or restyle `NeedsAttention` + `AlertItem`); consumes the same `alerts: Alert[]` from
`DashboardProvider` (already the new `getAlerts()` output).
- Header: "Attention Hub" + a **"N open"** soft pill (N = alerts.length).
- Each item: severity left-stripe (high=crit/med=warn/low=sky), an **emoji/icon square** keyed by `sourceFeature`
  (planner=📚, attendance=📅, gradebook=📊, compliance=🛡️, schedule=⏱️), a **title**, a **learner chip** (colored
  initial dot + name; household-scoped → "Household"), a **message** line, and a **"from `<Source>`"** label
  (`sourceFeature` → Planbook / Attendance / Gradebook / Compliance / Schedule).
- Whole item is a link to `alert.href` (deep-link to source) when present.
- **This is the key gap:** `AlertItem` currently renders no source label and no icon — add them.
- Keep the existing planner emitter's per-child aggregation ("N lessons not completed"); only restyle it.

### 4. Zone A — schedule panel
`TodaySchedulePanel` already renders slots + a "Start learning time" footer button. Match prototype: footer shows
the primary button + a "X of Y items scheduled" note. Minor style only.

### 5. Zone B — per-learner command center (restyle + data windows)
Restyle `LearnerCommandRow` to the prototype row:
- **who-cell:** colored avatar (initial) + name + subtitle = `learner.gradeLabel` (e.g. "Grade 6"). **No "Umbrella".**
- **Attendance column** labelled **"This year"**: switch the window from current-week to **school-year-to-date**
  (`getSummary(childId, schoolYearStart, today)`); value = present/totalRecorded %, thin colored bar, "—" when none.
  (This is why attendance is blank today — YTD populates from the seeded 150-day history.)
- **Today column** labelled **"Lessons"**: `completed / total` due today with a bar; "—" when none due.
- **Current grade column** labelled **"Mastery"**: `overallMastery` → **grade chip `"<letter> · <pct>%"`** using the
  gradebook letter bands (reuse `features/gradebook/server/aggregation.ts` letter logic — expose a small client-safe
  `masteryLetter(n)` helper from gradebook, or map A≥90/B≥80/C≥70/D≥60/F inline). "—" when null.
- Row click still calls `setSelectedChildId` (unchanged); add the "›" chevron affordance.
- Header row: Learner / Attendance / Today / Current grade.

### 6. Zone C — cards
- **Compliance card** (`ComplianceStatusCard`, exists): match prototype — status dot + "On track/…" label, a reasons
  list, a "Next deadline" block, and a "New" pill. Keep the loading/empty/error states already built.
- **Learning Time weekly chart** — **BUILD IT** (prototype v2 includes it; was wrongly deferred as P8).
  New `LearningTimeWeekCard.tsx`: `learningTimeApi.list({from,to})` for the current week (Mon→today), client-side
  bucket into weekday bars (precedent: `QuranStreak.calcStreak`, `SchoolYearProgressCard.computeProgress`), footer
  "Nh Nm logged". Empty-week state when no sessions. One fetch per active learner is acceptable (matches Zone B).
- **Personal To-dos:** full list, **two columns**, **no inner scroll**, header shows a count pill + "＋ Add".
  (`PersonalTodoList` — ensure no `max-h`/overflow; render all items.)
- School Year ring, Qur'an rings, Islamic Calendar — keep.

### 7. App-shell (secondary)
Render the household's **logo-preset mark** next to the household name in `HouseholdSwitcher`. P6 added this but only
when ≥2 households — ensure the mark shows for a single household too, without regressing the switcher's dropdown
behavior. Lower priority than the dashboard body.

---

## Verification (the process fix — every item)

For each item above: run `npm run dev` against the **dev** DB with `db:seed:demo` data, open `/dashboard`, and compare
to the prototype for that zone. Confirm real numbers render (attendance %, mastery letters, weekly bars) — not "—"
everywhere. Then `npm run build` + `npx jest --testPathIgnorePatterns="/node_modules/"`.

**Tests are fidelity-oriented, not just structural:**
- Attention Hub: an item renders its **source label** ("from Gradebook") and a learner chip; a household-scoped item
  reads "Household".
- Zone B: attendance uses the **YTD** window (assert the summary call's date range = school-year start→today); grade
  renders as **"B · 88%"** not a raw number; subtitle = gradeLabel.
- Learning-Time card: buckets sessions into weekday bars; empty-week state.
- Stat cards: assert the three labels + hints.

## Out of scope
- Theme toggle (mockup scaffolding). No `SubjectCourse` rename. No compliance-input improvements. No new API endpoints
  (learning-time weekly stays client-bucketed).
