# Plan: Wave 5 — Learning Time Screen ("Execution Cockpit")

Source: production feedback `46a51bee-a42b-450a-b2b2-9b66c47e0aa9` (`/dashboard`, enhancement, risk: high, admin-approved 2026-06-11). Full text is the "LEARNING TIME SCREEN (Execution Cockpit) — Full Feature Brief" — a complete product+engineering spec for a real-time session-execution surface.

This item was deliberately excluded from `20260611-feedback-waves-1-4-plan.md` because it is not a bug fix or small enhancement — it is a **new, large feature** (Mode 4/5 in `/plan-builder` terms) that touches the dashboard, planner, attendance, and portfolio. This document does not attempt a single implementation plan for the whole brief. Instead, per `docs/feature-waves.md`'s guidance to scope large features into discrete, reviewable phases, it:

1. Audits what exists today (so we know what's new vs. reusable).
2. Establishes ownership/source-of-truth for the new concepts.
3. Breaks the brief into an ordered phase roadmap.
4. Gives **Phase 1 (MVP)** a full `/plan-builder` Mode 4 plan, ready to implement.
5. Scopes Phases 2–6 at a level sufficient to sequence work — **each later phase needs its own `/plan-builder` pass (with a fresh code-path audit) before implementation**, since the codebase will have changed by then.

---

## Planning mode

**Mode 4/5 (new feature, large)** for the brief as a whole. Phase 1 below is itself Mode 4 (new feature, fully scoped). Phases 2–6 are roadmap-level only.

---

## Code-path audit (current state)

| Concept in brief | Existing equivalent today | Notes |
|---|---|---|
| "Session object" (time/task tracking, start/end, outcome) | **None.** No `pgTable` for sessions/timers exists in `db/schema.ts`. | Confirmed via full scan of `db/schema.ts` table exports — closest are `attendanceEvents` (date+minutes+status, post-hoc record, not a live session) and `quranSessions` (a logged Qur'an session, also post-hoc, not live). |
| "Planned work link" | `lessonTasks` (`db/schema.ts:230-260`) — `householdId`, `learnerId`, `subjectId`, `title`, `dueDate`, `status`, `estimatedDuration` (text), `resourceLink`. | `estimatedDuration` is a free-text field today, not structured minutes — Phase 1 needs to confirm its format before treating it as a time-channel default. |
| "Trustworthy record / log" feeding "records for review" | `features/records` (Records/Reports feature, per `/plan-builder`'s source-of-truth table). | Per source-of-truth rules, Records/Reports is the *consumer* of finalized session logs, not the owner of session execution state. |
| "Evidence references" | `portfolioEvidence` + `portfolioEvidenceAttachments` (`db/schema.ts`). | `features/portfolio` owns evidence; Learning Time should *attach references to* existing evidence records, not duplicate storage. |
| Attendance "minutes" | `attendanceEvents.minutes` (`db/schema.ts:264-278`). | Brief's "elapsed/required time" logging is conceptually adjacent to attendance minutes but **not the same thing** (a session is per-subject/per-block; attendance is per-day). Reconciling these is explicitly deferred to Phase 6 (see below) — do not collapse them prematurely. |
| Dashboard entry point ("Open full Learning Time", "Start next") | `features/dashboard` — `Dashboard.tsx`, `DashboardProvider`, existing modules under `features/dashboard/front/components/`. | Phase 1 adds a small dashboard module; full cockpit lives in its own route. |
| "Now/Next" task ordering | `features/plan` (`lessonTasks`, planner). | Today's planner is date-scheduled, not a live ordered queue — Phase 1's "Next" is derived read-only from `lessonTasks` due today, ordered by existing `order` field. |

**No existing feature owns "live session execution."** This is new. Per `/plan-builder`'s source-of-truth table (Planner / Attendance / Portfolio / Qur'an / Alerts / Records / Dashboard), none of those map cleanly to "a session is currently running" — this plan proposes a **new feature**, `features/learning-time`, as the owner.

---

## Source-of-truth decisions (for the whole brief)

| Data | Owner | Rationale |
|---|---|---|
| Session lifecycle state (draft/running/paused/ended/finalized), time channel state, task channel state, end reason, outcome | **New: `features/learning-time`** | Nothing else owns "is a session live right now." |
| Which lesson/subject a session is "about" | **`features/plan`** (`lessonTasks`) — Learning Time stores an optional `lessonTaskId` reference, does not copy lesson data | Avoids duplicating planner data (architecture-rules: no parallel stores for the same entity). |
| Evidence attached during a session | **`features/portfolio`** — Learning Time creates/links `portfolioEvidence` rows via the existing portfolio API, does not add its own evidence table | Matches Wave 1b precedent (Resources → Planner via existing API, no new store). |
| Finalized session record surfaced in Records/Reports | **`features/records`** reads finalized `learning_time_sessions` rows (read-only) | Records/Reports composes; it does not own. |
| Attendance minutes vs. session elapsed time | **Unresolved — Phase 6 decision**, not Phase 1 | Brief explicitly separates "Learning Time" (completion/progress events) from downstream consumers; attendance reconciliation is a downstream concern. |
| Gamification reactions to session events | **Out of scope entirely** (brief's own "hard boundaries" section) | Learning Time only emits events; no gamification logic lives here, ever. |

---

## Phase roadmap (ordered, each phase ships independently)

| Phase | Name | Depends on | Mode | Status |
|---|---|---|---|---|
| 1 | Core session object + single-learner Now/Next cockpit, time-only | — | 4 (fully planned below) | Ready to plan→build |
| 2 | Task channel + mixed-mode contract + end-of-session summary | 1 | 4 | Roadmap only |
| 3 | Multi-learner cockpit ("child-first") + Dayboard/Now-Next lens switch | 1, 2 | 4/5 | Roadmap only |
| 4 | Embedded resource viewer / side pane (PDF, video, images, docs) | 1 | 4 | Roadmap only |
| 5 | Multi-actor roles (Facilitator/Viewer) + parent attention guardrails | 3 | 4 | Roadmap only |
| 6 | Continuity artifacts + downstream integration (Records, attendance reconciliation, evidence policy, event emission for gamification) | 1–5 | 5 (architecture) | Roadmap only |

Phases are intentionally ordered so that **Phase 1 alone is a usable, demoable capability** (a parent can run a single timed session for one learner and get a logged record), per plan-builder's "each phase produces a usable capability" rule.

---

# Phase 1 — Core session object + single-learner cockpit (time-only MVP)

### Summary

Introduce the `features/learning-time` feature: a new `learning_time_sessions` table, a session-lifecycle API (draft → running ⇄ paused → ended → finalized), and a single-learner "Now card" cockpit page supporting the three time-channel primitives (stopwatch, countdown timer, scheduled window — interval stacks deferred). No task channel, no multi-learner view, no resource viewer yet — those are Phases 2–4. A small dashboard module links into the cockpit.

### Code-path audit

| Section | Path |
|---|---|
| New schema table | `db/schema.ts` — add `learningTimeSessions` (pattern: `id`, `householdId`, `learnerId`, `subjectId?`, `lessonTaskId?`, `mode: 'time'` (fixed in Phase 1), `timeChannelType: 'scheduled'\|'stopwatch'\|'timer'`, `targetMinutes?` (for timer/scheduled), `status: 'draft'\|'running'\|'paused'\|'ended'\|'finalized'`, `startedAt?`, `pausedAt?`, `endedAt?`, `endedBy?: 'time'\|'manual'`, `outcome?: 'complete'\|'partial'\|'abandoned'`, `notes?`, `createdAt`, `updatedAt`) |
| New feature scaffold | `features/learning-time/` — `types.ts`, `server/repository.ts`, `server/service.ts`, `api/routes/learning-time.ts`, `front/pages/LearningTimePage.tsx`, `front/components/NowCard.tsx`, `front/services/api.ts`, `__tests__/` |
| Route wiring | `app/api/[...slug]/route.ts` — add `learning-time` case delegating to `features/learning-time/api/router.ts` (pattern: mirror `features/dashboard/api/router.ts`) |
| New page route | `app/(shell)/learning-time/page.tsx` — shell page (Header + household context required, per CLAUDE.md "needs Header → `app/(shell)/`") |
| Dashboard entry point | `features/dashboard/front/components/` — new small module, e.g. `LearningTimeEntry.tsx`, rendered from `Dashboard.tsx`; links to `/learning-time` |
| Optional planned-work link | `features/plan/front/services/api.ts` `plannerApi` — read-only fetch of today's `lessonTasks` for the selected learner, to populate the "Next" preview and optional context link |
| Existing tests to extend | None yet for this feature — all new |

### Acceptance criteria

- From `/dashboard`, a "Start Learning Time" entry point is visible and links to `/learning-time`.
- On `/learning-time`, selecting a learner shows their **Now card**: idle state ("Idle — awaiting assignment") if no session is running, with a "Next" preview showing today's next `lessonTask` (if any) by `dueDate`/`order`.
- From the idle state, the user can configure a new session: optional link to a `lessonTask` (or "ad-hoc"), optional subject, and a time-channel type — **stopwatch** (count up, no target), **timer** (countdown from `targetMinutes`), or **scheduled window** (start/end clock times).
- Starting a session transitions `draft → running`; the Now card shows live elapsed/remaining time.
- Pause/Resume work for stopwatch and timer modes (`running ⇄ paused`); scheduled-window sessions do not support pause (matches "scheduled window: completes when window ends" in the brief).
- Finish/end transitions to `ended`, recording `endedBy: 'manual'` (user clicked Finish) or `endedBy: 'time'` (timer/window reached zero/end and user confirmed).
- Ending a session shows a minimal finalize step: outcome (`complete`/`partial`/`abandoned`), optional notes — then transitions to `finalized`.
- A finalized session is immutable (no further state transitions); it is queryable by `householdId` + `learnerId` + date range (groundwork for Phase 6/Records, but no Records UI changes in Phase 1).
- Refreshing the page mid-session (`running`/`paused`) restores the correct state and elapsed time from `startedAt`/`pausedAt` (no client-only timer state).
- Empty state: a household with no learners shows an appropriate message (reuse existing "no learners" empty-state pattern from another feature, e.g. `features/attendance`).

### Data model / contract changes

```ts
// db/schema.ts addition
export const learningTimeSessions = pgTable('learning_time_sessions', {
  id: text('id').primaryKey(),
  householdId: text('household_id').notNull().references(() => households.id),
  learnerId: text('learner_id').notNull().references(() => learners.id),
  subjectId: text('subject_id').references(() => subjects.id),
  lessonTaskId: text('lesson_task_id').references(() => lessonTasks.id),
  timeChannelType: text('time_channel_type').notNull(), // 'scheduled' | 'stopwatch' | 'timer'
  targetMinutes: integer('target_minutes'), // for 'timer'; null for stopwatch/scheduled
  scheduledStart: timestamp('scheduled_start'), // for 'scheduled'
  scheduledEnd: timestamp('scheduled_end'),     // for 'scheduled'
  status: text('status').notNull(), // 'draft' | 'running' | 'paused' | 'ended' | 'finalized'
  startedAt: timestamp('started_at'),
  pausedAt: timestamp('paused_at'),
  endedAt: timestamp('ended_at'),
  endedBy: text('ended_by'), // 'time' | 'manual'
  outcome: text('outcome'), // 'complete' | 'partial' | 'abandoned'
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
}, (t) => [
  index('learning_time_sessions_household_learner_idx').on(t.householdId, t.learnerId),
])
```

- Requires `npm run db:generate` + `npm run db:migrate` against a **non-prod** DB — confirm `DATABASE_URL` target before running, per CLAUDE.md.
- `mode` field is deliberately **omitted** in Phase 1 (always time-only); Phase 2 adds `mode: 'time'|'tasks'|'mixed'` plus task-channel columns. Adding it now as a fixed `'time'` value would create a column that's immediately a lie once Phase 2 lands — better to add it when it's meaningful. *(Flag for Phase 2 planning: this is an additive migration, not a breaking one, since Phase 1 rows can default to `'time'`.)*
- New types in `features/learning-time/types.ts`: `LearningTimeSession`, `TimeChannelType`, `SessionStatus`, `EndedBy`, `Outcome`, `CreateSessionInput`, `SessionTransitionInput`.

### API / store / service plan

- `features/learning-time/api/routes/learning-time.ts`:
  - `POST /api/learning-time/sessions` — create (`status: 'draft'`).
  - `PATCH /api/learning-time/sessions/:id` — state transitions (`start`, `pause`, `resume`, `end`, `finalize`) via an `action` field; service validates legal transitions (reject e.g. `pause` when `status !== 'running'`).
  - `GET /api/learning-time/sessions/active?learnerId=` — returns the learner's current non-finalized session, if any (one active session per learner — service enforces this on create).
  - `GET /api/learning-time/sessions?learnerId=&from=&to=` — finalized sessions in range (groundwork for Phase 6).
- `features/learning-time/server/service.ts` — owns transition validation and `endedBy`/elapsed-time computation server-side (never trust client-computed elapsed time, since refresh must restore correct state).
- `features/learning-time/server/repository.ts` — Drizzle CRUD, following the repository-mock-boundary testing convention (CLAUDE.md: "mock at the repository boundary, never mock `getDb()`").
- `features/learning-time/front/services/api.ts` — `learningTimeApi.createSession`, `.transition`, `.getActive`, `.list`.

### UI plan

- `app/(shell)/learning-time/page.tsx` — thin route, renders `LearningTimePage`.
- `features/learning-time/front/pages/LearningTimePage.tsx`:
  - Learner selector (reuse existing learner-picker pattern, e.g. from `features/attendance/front/pages/AttendancePage.tsx`).
  - Renders `NowCard` for the selected learner.
- `features/learning-time/front/components/NowCard.tsx`:
  - **Idle state:** "Idle — awaiting assignment", "Next: <lessonTask title> (<time>)" if one exists today, else "Nothing assigned now". "Start session" button opens session config.
  - **Draft/config state:** select optional `lessonTask` (today's, from planner) or "Ad-hoc"; optional subject (if ad-hoc); time-channel type radio (Stopwatch / Timer / Scheduled window); conditional `targetMinutes` input (Timer) or start/end time inputs (Scheduled).
  - **Running/Paused state:** large elapsed/remaining time display; Pause/Resume (stopwatch/timer only) and Finish buttons; "NEXT" one-line preview unchanged from idle.
  - **Ended state:** outcome radio (Complete/Partial/Abandoned), optional notes textarea, "Save" → finalize.
  - **Finalized state:** read-only summary, "Start another session" returns to idle.
  - Mobile: single-column stack; Now card is full-width.
  - Accessibility: timer/countdown text uses `aria-live="polite"` for screen-reader updates (throttled, not every second); all action buttons have visible text labels.
- `features/dashboard/front/components/LearningTimeEntry.tsx` — small card/module: "Start Learning Time" + (if a session is active) "Resume session — <learner>, <elapsed>"; links to `/learning-time`.

### Testing plan (failing tests first)

1. `features/learning-time/__tests__/server/repository.test.ts` — create/read/update a session row; enforce one-active-session-per-learner at the repository or service layer (failing test first: creating a second `draft`/`running` session for a learner with one already active is rejected).
2. `features/learning-time/__tests__/server/service.test.ts` — transition validation: `start` requires `draft`; `pause`/`resume` require `running`/`paused` respectively and only for `stopwatch`/`timer` (not `scheduled`); `end` computes `endedBy` and elapsed time server-side from `startedAt`/`pausedAt`/`endedAt`.
3. `features/learning-time/__tests__/api/learning-time.test.ts` — route handler tests for create/transition/active/list, mocking the repository boundary (per CLAUDE.md TDD rule).
4. `features/learning-time/__tests__/integration/LearningTimePage.test.tsx` — covers loading/empty (`no learners`)/idle/draft-config/running/paused/ended/finalized states and the action buttons in each; mid-session refresh restores state from `GET .../active`.
5. `features/dashboard/__tests__/integration/components/LearningTimeEntry.test.tsx` — entry module renders link, and "Resume session" variant when an active session exists.
6. Playwright (recommended, not optional, given this is a new cross-screen flow): `/dashboard` → "Start Learning Time" → configure timer session → start → pause → resume → finish → finalize; reload mid-session to confirm state restoration.

### Build phases

1. Schema + migration (`learning_time_sessions`) — gated, confirm target DB.
2. Repository + service (lifecycle/transition logic), failing tests first.
3. API routes + router wiring (`app/api/[...slug]/route.ts`).
4. `LearningTimePage` + `NowCard` (idle/draft/running/paused/ended/finalized states), with integration tests.
5. Dashboard entry module (`LearningTimeEntry`).
6. Playwright end-to-end flow.

### Out of scope (Phase 1)

- Task channel, mixed mode, `ended_by: 'tasks'` (Phase 2).
- Multi-learner cockpit / Dayboard lens / Now-Next lens switch (Phase 3).
- Embedded resource viewer (Phase 4).
- Multi-actor roles, parent attention guardrails (Phase 5).
- Records integration, attendance-minutes reconciliation, evidence attachment, event emission for gamification (Phase 6).
- Interval stacks (multi-segment timing) — explicitly deferred even within the time channel.
- Interruption-reason capture on pause/resume.

### Manual QA

1. Open `/dashboard`; confirm "Start Learning Time" entry is visible.
2. Click it; on `/learning-time`, select a learner with a lesson due today. Confirm "Next: <lesson title>" shows in the idle state.
3. Click "Start session"; choose "Timer", set 5 minutes, optionally link the shown lesson. Click Start.
4. Confirm the countdown displays and decreases; click Pause, confirm it stops; click Resume, confirm it continues.
5. Click Finish before the timer reaches zero; confirm `endedBy` is recorded as manual (verify via the finalize/summary screen, not raw DB unless needed).
6. Choose outcome "Partial", add a note, Save. Confirm the session shows as finalized and "Start another session" returns to idle.
7. Reload the page mid-session (start a new one, refresh while running); confirm elapsed time is correct after reload (server-computed, not reset to zero).
8. Select a learner with no `lessonTask` due today; confirm idle state shows "Nothing assigned now" with no "Next" line.

### Branch and commit plan

- Branch: `feature/learning-time-phase1`
- Commits:
  1. `feat(db): add learning_time_sessions table`
  2. `test(learning-time): cover session repository and lifecycle service`
  3. `feat(learning-time): add session repository and lifecycle service`
  4. `test(learning-time): cover learning-time API routes`
  5. `feat(learning-time): add learning-time API routes and router wiring`
  6. `test(learning-time): cover NowCard and LearningTimePage states`
  7. `feat(learning-time): add LearningTimePage and NowCard cockpit UI`
  8. `feat(dashboard): add Learning Time entry point`
  9. `test(learning-time): add end-to-end session flow (Playwright)`

### Risks and rollback

- **New table, additive only** — no existing table is modified in Phase 1, so rollback is dropping the new table/feature folder if needed; no data migration risk to existing features.
- **Server-authoritative time** is the main correctness risk — if elapsed/remaining time is computed client-side and not reconciled against `startedAt`/`pausedAt` on the server, refresh/multi-device will drift. Service-layer tests (item 2 above) must cover this before UI work begins.
- **Scope discipline**: this brief is large enough that "just one more field for Phase 2" pressure during Phase 1 implementation is likely — hold the line at the Phase 1 acceptance criteria above; anything from Phases 2–6 goes into the next phase's plan, not a Phase 1 PR.

---

# Phases 2–6 — Roadmap scope (plan in detail later)

Each phase below needs a fresh `/plan-builder` pass (full code-path audit against the codebase *as it exists after the prior phase ships*) before implementation. These summaries exist to sequence work and flag cross-cutting decisions early.

### Phase 2 — Task channel + mixed mode + end-of-session summary

- Add `mode: 'time'|'tasks'|'mixed'`, task-channel columns (`taskChannelType: 'checklist'|'counter'|'rundown'`, `taskTarget`, `taskItems`/`taskProgress` as jsonb), and `endedBy: 'tasks'`.
- Implement the **mixed-mode contract**: session ends when either channel ends; the other channel's state is preserved and shown at end; `endedBy` reflects which channel triggered the end.
- End-of-session summary flow: status (Completed/Partial/Skipped), optional outcome (Good/Mixed/Struggled), optional next action (Continue/Repeat/Remediate/Skip ahead) — these are *additional* fields beyond Phase 1's `outcome`; reconcile the two outcome vocabularies during this phase's planning (the brief uses different terms in different sections — this is a planning question, not an implementation guess).
- **Open question for Phase 2 planning**: should "policy-based parent confirmation when mixed-mode ends with an incomplete channel" require new household-settings fields (`householdSettings` table exists already) or a simpler hardcoded default initially?

### Phase 3 — Multi-learner cockpit + lens switch

- "Child-first cockpit": render every learner's `NowCard` simultaneously (grid layout, responsive per brief: desktop center surface, tablet/mobile compressed).
- Two lenses (Dayboard vs Now/Next) as a **presentation toggle only** — both read the same session state; switching must not call any transition endpoint.
- Likely needs a `GET /api/learning-time/sessions/active?householdId=` (all-learners variant) — extend rather than duplicate the Phase 1 endpoint.
- **Open question**: Dayboard lens implies a "day segments" / timetable concept that doesn't exist in the schema today (`schedule` feature exists — audit it first; may already cover this, avoiding a new concept).

### Phase 4 — Embedded resource viewer / side pane

- Reuses `features/resources` data (existing `resources` table) — Learning Time adds a *viewer UI* (inline/side-pane/full-screen/pop-out), not new resource storage.
- Device-adaptive: PiP for video where supported, floating mini-panel for PDF/docs/images preserving scroll position.
- **Open question**: confirm what resource file types are actually stored today (URLs vs. uploaded files) — the viewer's complexity depends entirely on this, and it wasn't in scope for the audits done so far.

### Phase 5 — Multi-actor roles + parent attention guardrails

- Facilitator/Viewer roles — likely maps to existing `householdMembers` roles (audit `db/schema.ts` `householdMembers` for an existing role column before adding a new one).
- Conflict detection for overlapping "Parent-led" items across learners' sessions — a household-level query across Phase 3's multi-learner session state; "quick fix" suggestions (shift by 15/30/60, swap) are UI-only given Phase 1–3's transition API already supports re-scheduling via session config edits (verify during Phase 5 planning — may need a new "reschedule draft" transition).

### Phase 6 — Continuity, Records integration, downstream events

- Records/Reports reads finalized `learning_time_sessions` (read-only) — coordinate with `features/records`' existing data-aggregation pattern (audit before adding).
- Resolve the attendance-minutes-vs-session-elapsed-time question flagged in "Source-of-truth decisions" above — likely: attendance remains manually logged (per Wave 4a's existing flow), and Learning Time sessions are a *separate, additive* record that Records can optionally cross-reference, **not** an automatic attendance-minutes writer (auto-writing into another feature's table would violate the no-cross-feature-store-writes architecture rule without an explicit, planned exception).
- Evidence attachment: link to `portfolioEvidence` via existing portfolio API (precedent: Wave 1b's "Save to plan" reuses `plannerApi.createLesson` rather than a new store).
- Event emission for gamification: define the event *shape* and *emission point* (likely on `finalize`), but the brief is explicit that **no consumer for these events exists or should be built here** — this phase ships the emission only if a concrete consumer is planned; otherwise, defer emission itself to whenever gamification is actually scoped (avoid building unused infrastructure per CLAUDE.md's "no half-finished implementations").

---

## Cross-wave notes

- This Wave 5 roadmap is independent of Waves 1–4 and can be sequenced separately. The only soft dependency: Wave 1b ("Save to plan" persisting `lessonTasks`) makes Phase 1's "optional planned-work link" more useful (more households will have real `lessonTasks` rows to link), but Phase 1 works correctly even with zero `lessonTasks` (idle state shows "Nothing assigned now").
- Given the `riskLevel: high` / `confidence: high` on the source feedback and the size of the brief, recommend treating **Phase 1 alone** as the next concrete deliverable, and revisiting this roadmap document (updating audits, not assumptions) before scoping Phase 2.
