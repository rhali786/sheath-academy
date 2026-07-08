# Feedback — Bigger Features plan (2026-07-07)

The two feedback items deferred from the queue:
- **f96c36b3** (/dashboard) — custom homeschool calendar reminders (+ optional Gmail sync)
- **b01b66f0** (/attendance) — enter break *ranges* preemptively (+ optional auto-reschedule of lessons around them)

Branch: **proposed `feat/feedback-bigger-features`** (decision — not yet created; the queue work lives on `feat/feedback-queue-jul06`).
Gating: **none** (per standing preference). The hard sub-problems are handled as **separate deferred plans**, not gated phases.

**Scope decision (important):** each feature splits into a *core* that is safe and fast, and a *hard part* that is a distinct project. This plan builds the **cores**. The hard parts (Gmail sync; lesson auto-reschedule engine) are specified as **out-of-scope follow-ons** with their own future plans — consistent with the original briefs, where Gmail sync was floated as "another idea" and auto-reschedule as "if the user agrees."

---

## Architecture findings (type/data ownership)

| Data | Current owner | Decision |
|------|---------------|----------|
| Reminders (dated, household-level) | **none — net-new** | Create a new **`reminders`** feature that owns the entity. Dashboard **composes** it (no data ownership); calendar views render markers. |
| School breaks (`SchoolYear.breaks: SchoolBreak[]`) | **school-year** (already) | Keep. Add the missing entry UI + make generation consume it. No new source of truth. |
| Lessons / rescheduling | **planner** | Auto-reschedule engine (deferred) belongs to planner, not attendance or school-year. |
| Lesson generation / due dates | **resources** (`server/service.ts`) | Extend `computeDueDates` to also skip break dates (builds on the queue's bug 1.2 `schoolDaysOfWeek` work). |

No dashboard-owned data. No new seed/store data to fake dynamic behavior.

---

# FEATURE A — Calendar reminders  (f96c36b3)

**Planning mode:** 4 (new feature) for the core entity; the dashboard/calendar surfacing is Mode 3.

## Code-path audit
- **No existing reminder/event entity.** `features/islamic-calendar/*` (Islamic reminder *settings*) and `features/settings/.../IslamicRemindersSection.tsx` are unrelated notification prefs, not user-authored dated reminders.
- **Surfaces that exist to host reminders:** `features/schedule/front/components/MonthCalendarView.tsx` and `WeekCalendarView.tsx` (currently render lessons/schedule, computed from `LessonTask` — no persistence of their own). `features/dashboard/front/pages/Dashboard.tsx` composes Today-facing modules.
- **DB:** new table required (`reminders`) via Drizzle migration; see `db/schema.ts`. No existing table fits.

## Source-of-truth decision
New **`reminders`** feature owns the entity end-to-end (types, repo, API, front service). Dashboard and schedule calendar views are **read-only consumers**. Reminders are household-scoped and date-anchored; optionally categorized (sale / compliance / field-trip / meetup / other) and optionally learner-tagged.

## Data / contract
`Reminder { id, householdId, title, date (ISO yyyy-mm-dd), endDate?, category, notes?, learnerId?, createdAt, updatedAt }`. Additive new table — no change to existing tables.

## Build phases (core)
1. **Schema + migration** — `reminders` table; `npm run db:generate`, inspect SQL (composite-FK ordering caveat), `db:migrate` against a **non-prod** DB.
2. **Types + repository CRUD + `.db.test.ts`** — list (by household + date range), create, update, delete.
3. **API routes + router wiring + tests** — extend the feature router + `app/api/[...slug]`; standard `{status,data,message,timestamp}` envelope.
4. **Front service + Reminders UI** — collapsible add-form (approved pattern) + editable record-card list; integration tests (loading/empty/error/populated + create/edit/delete).
5. **Surface** — a dashboard reminders module (upcoming N) + markers on `MonthCalendarView`/`WeekCalendarView`. Dashboard composes only.

## Acceptance criteria
- A parent can add a dated reminder (e.g. "Curriculum sale — Jul 20") with a category and see it in a reminders list and on the month calendar.
- Reminders can be edited and deleted (styled confirmation, no `window.confirm`).
- Upcoming reminders appear on the dashboard; selecting a date range on the calendar shows that period's reminders.
- Empty state: "No reminders yet — add homeschool dates, sales, field trips."

## Tests (failing first)
Repo `.db.test.ts` (CRUD + date-range query); API route tests (create/list/validation); integration for the form + list + dashboard module + calendar marker rendering.

## FEATURE A — Part 2: Google Calendar / Gmail sync  (in scope)

**Planning mode:** 4 (new capability) + external integration. **High risk** — external service, cannot be fully verified without live Google credentials.

### Code-path audit
- **No Google OAuth exists.** `features/auth/auth.config.ts` has **no** Google provider or scopes (magic-link + credentials + dev-bypass only). `features/auth/lib/drizzleAdapter.ts` provides the Auth.js `accounts` table where OAuth tokens are stored. So Google OAuth + Calendar scope must be added from scratch.
- **No googleapis client** in the repo — new dependency.
- Reminders entity (Part 1) is the sync target/source.

### ⚠️ Manual steps you must take (human prerequisites — code cannot be verified until done)
1. **Google Cloud project** — create/choose one; note the project id.
2. **Enable the Google Calendar API** for that project.
3. **OAuth consent screen** — configure app name, support email, add scope `https://www.googleapis.com/auth/calendar.events` (or `calendar.readonly` for import-only), add yourself + testers, and (for prod) submit for verification.
4. **OAuth 2.0 Web client** — create it; add authorized redirect URI(s) for local (`http://localhost:3000/...`) and Render (`https://<domain>/...`).
5. **Provide secrets** in `.env.local` / Render: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`. (Never commit them.)
6. **Decide sync direction** — import (Google → app reminders), export (app reminders → a dedicated "Homeschool" Google calendar), or two-way. This choice changes the scope of the sync service below.

### Source-of-truth decision
Reminders remain owned by the **`reminders`** feature. Google Calendar is an **external mirror**. On two-way sync, the app is authoritative for app-created reminders; Google is authoritative for Google-created events. Reconcile by storing `googleEventId` + a sync token on the reminder; never silently overwrite a user edit.

### Build phases
1. **Google OAuth provider** — add Auth.js Google provider with `access_type=offline`, `prompt=consent`, calendar scope; persist `refresh_token` via the drizzle adapter `accounts` table. (Depends on your steps 1–5.)
2. **Token + client layer** — server-side googleapis client with refresh-token flow; typed wrapper; secrets read from env only.
3. **Sync service** — per chosen direction: list Google events (incremental `syncToken`) → upsert reminders keyed by `googleEventId`; and/or push app reminders as calendar events. Dedupe + conflict rules; structured logging.
4. **UI** — "Connect Google Calendar" in settings + connection/last-sync status; per-reminder **source badge** (App / Google); manual "Sync now"; disconnect/revoke.
5. **Tests** — **mock googleapis at the client boundary** (never hit the network in Jest); unit-test reconciliation/dedupe/conflict logic; integration-test the settings connect/status UI. Live end-to-end is **manual** (needs your Google account) — documented in Manual QA.

### Acceptance criteria
- After connecting Google (your steps done), the chosen sync direction works: Google events appear as reminders and/or app reminders appear on the dedicated Google calendar, deduped by `googleEventId`.
- Disconnect stops sync and clears tokens; a revoked grant surfaces a clear reconnect prompt.
- A user edit is never silently clobbered by a sync; conflicts are surfaced.

### Risk
External-integration regime — not modeled by the commit-rate estimate. Verification blocked on your steps 1–5. Token handling is security-sensitive (refresh tokens are secrets). Google API verification for non-test users can take time (out of our control).

---

# FEATURE B — Break ranges  (b01b66f0)

**Planning mode:** 2–3 (extends existing school-year + resources generation).

## Code-path audit
- **`SchoolYear.breaks?: SchoolBreak[]`** already exists (`features/school-year/types.ts:7,27`) — a **date-range** model (`startDate`/`endDate`).
- **`calculatePlannedDaysLocal`** (`features/school-year/front/lib/calculateDays.ts`) **already excludes break dates** from day counts. ✅
- **Gap 1 — entry UI:** `features/school-year/front/components/SchoolYearForm.tsx` has **no** breaks editor (grep: no `break` matches). Users cannot enter breaks.
- **Gap 2 — generation:** `features/resources/server/service.ts` `computeDueDates` skips weekends/non-school-days but **not** break dates → generated lessons can land inside a break.
- **Attendance:** has `holiday` / `not_school` statuses but those are **single-day records**, not the preemptive range the feedback asks for. The range belongs on `SchoolYear.breaks`, not attendance.

## Source-of-truth decision
School-year already owns `breaks`. This feature **fills the two gaps** (entry UI + generation consumption). No new entity.

## Build phases (core)
1. **Breaks editor in `SchoolYearForm`** — add/remove break ranges (name + start + end), writing to the existing `SchoolYear.breaks`. Validate `startDate <= endDate`. Integration tests (add, remove, validation, persisted round-trip).
2. **Generation honors breaks** — `computeDueDates` accepts the active year's `breaks` and skips any date within a break range, for every cadence (extends the queue's bug 1.2 `schoolDaysOfWeek` work). Service unit tests (a break week produces no due dates inside it; lessons roll forward past the break).

## Acceptance criteria
- A parent can enter a break range (e.g. "Winter break, Dec 22–Jan 2") in the school-year form; it persists and shows in the list.
- Generating lessons never places a `dueDate` inside a break range; remaining lessons shift to the next available school day after the break.
- Existing planned-days counts (already break-aware) continue to match.

## Tests (failing first)
`SchoolYearForm` integration (breaks add/remove/validate/persist); `computeDueDates` service unit (no due dates inside a break; roll-forward). Regression: existing `calculateDays` + school-year tests still pass.

## FEATURE B — Part 2: Auto-reschedule lessons around breaks  (in scope)

**Planning mode:** 3 (planner-owned, cross-feature inputs). **Medium-high risk** — non-destructive **bulk mutation** of planner data; the "materialized-risk tail" from our estimation notes. Depends on **B1** (breaks must be enterable) and reuses **B2**'s break-aware date logic.

### Code-path audit
- **Single-lesson date update exists:** `features/plan/api/routes/lesson.ts` `PUT(id)` → `updateLessonTaskRow(id, householdId, { dueDate, ... })` with `validateLessonWindow(plannedStartDate, dueDate)` (`features/plan/server/validation.ts`). Primitives to build on.
- **`listLessonTaskRows(householdId, { startDate, endDate, learnerId })`** (`features/plan/server/repository.ts`) selects affected lessons.
- **No bulk-shift / preview / undo engine exists** — this is the new work.
- Break-aware roll-forward logic already lands in **B2** (`computeDueDates` skipping break + non-school days) — reuse it so shifts land on valid school days.

### Source-of-truth decision
**Planner** owns lessons and their rescheduling. Attendance/school-year supply the break ranges; planner consumes them. The reschedule engine is a planner service — attendance/school-year never mutate lessons.

### ⚠️ Manual step you must take (one decision, not external setup)
- **Confirm the default conflict policy:** when a shifted lesson would land on a day that already has lessons, do we (a) stack them, (b) push subsequent lessons forward too (cascade), or (c) flag and skip? Recommended default: **cascade forward, preview before apply**. Everything else auto-derives.

### Build phases
1. **Reschedule service (preview)** — `previewBreakReschedule(householdId, break)`: find lessons with `dueDate` inside the break range; compute new dates by rolling forward past break + non-school days (reuse B2 logic); return `{ moved[], skipped[], conflicts[] }` with per-lesson old→new. **Pure/read-only — no writes.**
2. **Apply + operation log** — `applyBreakReschedule(previewId)`: bulk-update affected lessons in a transaction via `updateLessonTaskRow`; write a reversible **operation log** row (old→new per lesson) so the move can be undone.
3. **Undo** — `undoReschedule(operationId)`: restore prior dueDates from the log.
4. **UI (non-destructive default)** — when a break is saved (B1), prompt: *"N lessons fall inside this break. Preview → Apply → Undo."* Show the preview counts; never auto-apply without confirm; styled confirmation (no `window.confirm`).
5. **Tests** — service unit (preview counts, roll-forward, conflict/cascade, empty); apply/undo round-trip (repository-boundary mocks); integration for the prompt + preview + undo flow.

### Acceptance criteria
- Entering a break that overlaps scheduled lessons offers a preview showing exactly which lessons move and to when.
- Applying shifts only those lessons, past the break and any non-school days, per the confirmed conflict policy; nothing outside the range moves.
- Undo restores the prior dates exactly.
- Declining the prompt leaves all lessons unchanged (break still saved).

### Risk
Bulk mutation of live planner data. Mitigate with preview-before-apply, a transaction, and an undo log. Highest rework probability of anything in this plan — most likely place a test forces a second pass.

---

## Combined out of scope
- Lesson Planner v2 grid/reschedule (separate shipped-brief follow-up).
- Google API production verification (a Google review process — external, cannot be coded).

## Testing plan (all)
TDD — failing test first. jsdom UI; mock at the repository boundary, never `getDb()`. New UI ships integration tests (loading/empty/error/populated + interactions). `npm run build` + full Jest (incl. integration) green before merge. Any `db:*` command runs against a verified **non-prod** `DATABASE_URL`.

## Manual QA (click-by-click)
1. Dashboard → add reminder "Sale Jul 20 / compliance" → appears in list + month calendar; edit + delete. (A)
2. School-year form → add "Winter break Dec 22–Jan 2" → persists in list. (B1)
3. `/resources` generate across that range → no lessons dated inside the break; they resume after. (B2)

## Estimation (measured-rate method, uninterrupted, pre-audited)
Anchor ≈ **2.5–4 min/commit** for CRUD/UI units. The two hard parts are **not** governed by this rate and carry explicit tails.

| Scope | Est. commits | Execution-only | Notes |
|-------|-------------|----------------|-------|
| A1 — Reminders core | ~5–6 | ~20–25 min | schema+migration is the slowest unit |
| B1 — Breaks core | ~2–3 | ~10–15 min | schema already exists |
| **Both cores** | **~7–9** | **~30–40 min** | measured-rate regime |
| A2 — Gmail/Calendar sync | ~5–7 | ~30–45 min code **+ blocked on your steps 1–5** | external-integration regime; not verifiable in-run without live creds; Google verification lead time is out of our hands |
| B2 — Auto-reschedule engine | ~4–6 | ~30–60 min **+ real rework tail** | bulk mutation; highest chance of a second pass |
| **Full plan (all 4 parts)** | **~16–22** | **~1.5–2.5 hr code** | plus your Google setup + likely one reschedule rework pass |

Two honesty flags this exposes:
1. **A2 has a hard human dependency** — the code can be written, but "done/verified" is gated on your Google Cloud steps and possibly Google's verification review. Execution time ≠ elapsed time here.
2. **B2 is the one part where I expect rework** — the estimate includes a tail, not just base commits. Treat its number as a p50, not a ceiling.

Collaboration time is extra and dominates (~10×) if a human checkpoint enters the loop mid-run.

## Risks + rollback
- **A1** adds a table — additive migration, revert = drop table + revert commits. Verify `DATABASE_URL` non-prod before migrate.
- **A2 (sync)** — refresh tokens are secrets; store only in the adapter `accounts` table, never logged/committed. Blocked on your Google steps; ship behind a "Connect Google Calendar" opt-in so nothing breaks if credentials are absent. Revert = remove provider + sync service; reminders core unaffected.
- **B1** low-risk (schema exists; day-counting already break-aware).
- **B2 (auto-reschedule)** — the real risk: bulk mutation of live lessons. Guardrails: preview-before-apply, DB transaction, reversible operation log, non-destructive default. Revert = disable the prompt + engine; breaks core (B1) still works. Do **not** ship B2 without the undo log green.

## Suggested build order
B1 → B2 → A1 → A2. Rationale: B1/B2 reuse the queue's break-aware date logic and unblock the reschedule value fastest; A1 is independent; A2 is last because it's gated on your external setup and shouldn't block the rest.
