# Plan — Four Features, Built UI → API → DB (rev. 3)

## Context

We are building four large feature requests together: **Compliance**, **Badges/Gamification v1**, **Gradebook**, and **Lesson Planner enhancements**. Rev. 2 organized the work **DB → API → UI** (bottom-up). Rev. 3 makes two deliberate changes:

1. **Reverse the build order to UI → API → DB (top-down, contract-driven).** The UI drives the whole application; building it first crystallizes the exact data each screen needs, so the API contract is *derived from a real consumer* instead of guessed and locked before anything uses it. This directly kills rev. 2's biggest risk ("no user-visible value until the end; API contracts locked before a UI consumes them"). With agentic development this is built in hours, not weeks. All four features advance together, one layer at a time, top-down — **the layer is the delivery unit** (no vertical or per-feature branches).
2. **Bake in the user-story fixes** from the pre-implementation review (the parent-facing problems we agreed on).

The locked product decisions from rev. 2 stand.

### How UI-first stays honest (not faking it)

The trap with UI-first is building screens against pretend data that the DB can't deliver. We avoid it with three rules:

- **Each feature exposes one typed front-service** (`gradebookApi`, `complianceApi`, `badgesApi`, and the existing `plannerApi`). In Layer 1 it returns **typed fixtures** shaped *exactly* like the eventual API response (`{ status, data, message, timestamp }`). In Layer 2 the same interface swaps to real `fetch` — **the contract shape is stable across the swap** (component async/error wiring still gets exercised against real latency in Layer 2). The front-service interface IS the contract the API must satisfy and the DB must persist.
- **The hard guarantees live in pure modules built in Layer 1**, where they're consumed by the UI and need no DB: aggregation/no-zero, compliance status engine, badge award rules, grade-band normalizer, lesson-window validation. These are *real from day one* — the UI renders genuine computed output over fixtures, not faked numbers. So when DB lands in Layer 3, the logic is already proven.
- **Surfaces whose *verdict* depends on data they can't yet read are labeled illustrative (US2).** The flagship case is the **Compliance status hero**: its green/yellow/red needs real `attendance_events` + seeded rules that don't exist until Layers 2–3. In Layer 1 it renders behind an explicit **"Sample data — not computed from your records yet"** banner and is never presented as authoritative. The *shape* and *interaction* are real; the *verdict* is illustrative until Layer 3. This prevents the "looks authoritative, means nothing" failure during demos.

Net effect: Layer 1 produces a **clickable, demoable, test-covered prototype of all four features** over fixtures; Layer 2 makes it real over the wire; Layer 3 makes it durable.

---

## Decisions

### Carried forward (LOCKED, rev. 2)
- **R1.** Gradeable unit = `lesson_tasks`; no `assignments` table. Attempts/scores reference `lessonTaskId` (nullable → standalone manual grade).
- **R2.** Print-to-PDF via print-CSS views; no PDF lib, no blob storage. "Stored copies" = immutable JSON snapshots.
- **R3.** `/growth` = a **Growth nav module** (NAV_MODULES sub-nav) with sub-routes Gradebook / Badges / Portfolio. *(This resolves the "top-level vs sub-group" question — it is a module, per the lock.)*
- **R4.** CI runs integration + DB tests with a provisioned CI `DATABASE_URL`. **Now gated on the `test:db` plumbing fix below.**
- **C1–C6, B1–B5, G1–G4, L1–L5** unchanged (5 sourced states; LOI/NOI + binder print views; selectable pathway; retain-until-delete + bulk delete; reuse `portfolio_evidence`; manual-accept snapshots; ~8 starter badges; per-badge verification enum; neutral `continuity`; three grade bands; descriptive autonomy toggle; rules-based analyst; extend `subjects`; CC+custom+Islamic strands; state export via `ComplianceSink`; formalize `groupId`; drag updates due-date; single-step undo; step model; `plannedStartDate <= dueDate` invariant).

### New in rev. 3
- **Build order reversed:** UI → API → DB.
- **Delivery unit = the layer.** Full horizontal advance, top-down: one branch per layer (`feat/layer1-ui`, `feat/layer2-api`, `feat/layer3-db`), behavior-oriented commits one per feature within the branch. No vertical or per-feature branches.
- **GamificationEmitter dropped from v1.** Badges are fully manual (evidence + verify + approve); there is no event sink and no auto-award. The seam *type* stays in `features/lib/types.ts` for the future, but gradebook makes **no emit calls** and the plan claims no score→badge reactivity. The "continuity" timeline derives from `badge_awards.approvedAt` across school years.
- **`test:db` is currently a no-op** (matches zero files: `/__tests__/integration/` is globally ignored and `--testPathPattern` doesn't override `testPathIgnorePatterns`; verified — `tenant.db.test.ts` exists yet `--listTests` returns zero). **Fix the plumbing before R4 relies on it**, and add a CI assertion that DB-test count > 0.

---

## User-story fixes baked in

| # | Parent-facing story | Concrete change | Layer |
|---|---|---|---|
| US1 | "When I move a lesson, its window moves too and Undo really puts it back." | Drag shifts the **whole window**: send both `plannedStartDate` + `dueDate` (preserve span). Undo snapshots & restores both. Pure validation rejects inverted range; fix the partial-PUT bug that nulls `plannedStartDate`. | UI (+ pure mod) |
| US2 | "When it says I'm compliant, that's true." | Status engine reads **real `attendance_events`** via a real `AttendanceSource` adapter and **real seeded rules**; Layer-1 prototype is labeled illustrative until then. | API/DB |
| US3 | "The feature isn't empty on the real site." | Idempotent **reference-data seed** (state rulesets + starter badges) with stable ids + `ON CONFLICT DO NOTHING`, run on deploy. | DB |
| US4 | "My family's records never leak to another family." | **Denormalize `householdId`** onto `scores`, audit, score_evidence, badge_awards/evidence — boundary in the data, not per-query discipline. | DB |
| US5 | "I can find Gradebook and Badges." | Full nav diff: Growth module + `gradebook`/`badges` items + icons + `grades-progress`→Portfolio re-home + `/growth` redirect + tests. | UI |
| US6 | "Badges feel earned and fit my kid." | Grade-band normalizer (pure, null→neutral default); **text/lucide fallback emblem** keyed by `emblem_key` so it's never blocked on art; earned-vs-locked render test. | UI (+ pure mod) |
| US7 | "Don't make me feel like a failure." | "Needs attention" queue capped + prioritized; explicit "all caught up" / "no badges yet" empty states; aspirational locked-emblem copy. | UI |
| US8 | "Remind me about the filing I started." | `compliance_deadlines` feed the status-hero next-action list as live nudges. | UI/API |
| US9 | "Missing/excused never tanks the average." | **Keeper** — no-zero guarantee as a pure-module unit test in `npm test` (CI-blocking). | UI (pure mod) |

Naming: use `plannedStartDate <= dueDate` throughout (there is no `available_from` field).

---

## Layer 1 — UI (all four; integration tests + pure modules)

**Goal:** a clickable, test-covered prototype of all four features over typed fixtures, with the real logic modules already built and proven. **TDD:** failing integration test → component; failing unit test → pure module.

**Pre-flight (before Layer 1):** commit the already-written but uncommitted working-tree files the plan depends on — the seam contracts (`features/lib/types.ts`) and the brief (`docs/feature-briefs/submitted-feedback-2026-06-26.md`) — so the `§N` citations and C1 seeder input are version-controlled.

**Global UI rules (ui-style-guide):** inline-edit expansion (§1) + standard action icons (§2); app-styled confirm via existing `InlineConfirm`, never `window.confirm` (§3); `InlineSuccess` for transient success (§9); `page-title`/`form-section-heading`/`add-form-card` + collapsible add-form `showForm=true` (§4/§5); pages under `app/(shell)/`, never import `Header`/`AppShell` (§6); Nivo with explicit array props (§7). Every surface ships integration tests for loading/empty/error/populated + interactions (§8). **Per-screen UI-audit row required** (confirm pattern, inline-vs-modal, icons, empty/loading/error, mobile, chart contract).

**InlineSuccess Undo extension (Cursor 6.3):** add an optional `action?: { label: string; onAction: () => void }` to `InlineSuccess`; when set, default `dismissAfterMs` to **8000** and render the action button before the dismiss X. Documented §9 exception, tested (with-action renders/fires/dismisses; longer auto-dismiss; no-action path unchanged). Used by the reschedule "Moved X to Friday · Undo" notice (US1).

**Mobile (Cursor 6.5):** **drag is desktop-only.** Lesson grid keeps `overflow-x-auto` + sticky child column on desktop and collapses under `sm` to a vertical day-grouped agenda where reschedule uses tap→edit (existing deep-link), not touch-drag. Trophy case `grid-cols-2 sm:grid-cols-3 md:grid-cols-4`; compliance hero + gradebook learner cards stack single-column; gradebook entry grid `overflow-x-auto` with per-subject card entry preferred on mobile.

### Visual design direction (frontend-design — beauty, not just correctness)
`ui-style-guide` sets the interaction *floor*; this sets the visual *ceiling*. Source of truth = the living tokens in `tailwind.config.js` + `app/globals.css` (the old `design-*.md` docs no longer exist). **Reuse, don't reinvent.**

- **Identity (grounded in the subject).** Sheath is a Muslim homeschool home — "Faith. Learning. Purpose." The established identity is **forest green** (`forest-950 #0a2d1a → 600 #2d9862 → 50 #f0f9f4`) on a calm `slate-50` ground with white Notion-style cards (`.card`, `rounded-xl shadow-sm`). Accent = `forest-600`; neutrals = slate. Status already has a vocabulary — the `.badge-green/amber/red` pills — and **every new status (compliance light, gradebook mark, lesson status) reuses those pills**, never new colors.
- **Type.** One family today (Inter); make it intentional — a deliberate scale and generous line-height for the calm tone. A second **display** face is justified *only* for the badge/hero moments; propose it as an explicit font-add decision, not a silent import (if rejected, get the effect from Inter weight/tracking).
- **Spend the boldness in one place — the badge trophy case is the signature.** Everything else stays quiet and disciplined. Emblems are **real circular merit-badge SVGs** with a forest palette + soft metallic relief, in a collectible grid (`grid-cols-2 sm:3 md:4`): earned = full color + subtle raised shadow; not-yet-earned = desaturated with "How to earn this" (US7/8.3 tone). The `emblem_key` lucide/text fallback is the **safety net, never the design target** — the art *is* the feature. **One orchestrated earn-moment** (reuse `riseIn`/`reveal` from `globals.css`, `prefers-reduced-motion` already wired), band-aware (g1_4 playful, g9_12 quiet fade).
- **Keep the other three quiet and precise** (minimal direction = precision in spacing/type/detail):
  - **Compliance hero** — calm from *low saturation + space*, not alarm: green `forest-50` ground + `forest-600` mark, yellow `amber-50`, red **muted not fire-engine**; "why" + next-action as confident sentences; provenance as small slate metadata. The reassurance *is* the design.
  - **Gradebook command center** — clarity over judgment: status reads at a glance via the existing pills; the dual line chart uses a **restrained 2-series palette** (`forest-600` mastery, `slate-400` points), legible axes, a designed tooltip, and a crafted empty-chart state — not Nivo defaults.
  - **Planner grid** — density done well: subject-colored chips, the existing today-column `forest-100` ring, sticky headers; beauty is alignment + rhythm at 4×7, not ornament.
- **Copy is design material.** Active voice, sentence case, named by what the parent controls; empty/error states are direction not mood ("No subjects yet — add one to start grading"); an action keeps its name through the flow ("Move" → "Moved").
- **Quality floor (non-negotiable):** responsive to mobile (above), visible keyboard focus on every interactive element, reduced-motion respected, and **print views reuse the existing `@media print` system** (`.print-report`/`.print-callout`/`.print-stats`, Georgia serif) — the R2 transcript/report-card/binder foundation, not a new stylesheet.
- **Process gate (per surface, before building):** write its 4–6 hex token set + type roles + the one signature element and confirm it isn't a generic default; the badge wall is where distinctiveness is required, the rest is disciplined restraint.

### Front-service contracts (the deliverable that drives Layers 2–3)
Define `gradebookApi`, `complianceApi`, `badgesApi`, extend `plannerApi` — each a typed interface returning the standard response shape, **fixture-backed** in this layer. These interfaces are frozen here and become the API spec. **Fixtures** live in `features/<feature>/__tests__/fixtures/` (and a dev fixture module the front-service reads in Layer 1), shaped to the response type and deliberately covering null/empty/sparse cases (null `subjectId`, no evidence, too-few mastery points) so the UI's loading/empty/error/null handling is real, not optimistic.

### Pure logic modules (built + unit-tested here, no DB)
- `features/gradebook/server/aggregation.ts` — `computeSubjectGrade`, `computeGpa` (weighted+unweighted, credits-from-hours), `masteryStatus` (most-recent|decaying|highest), `decayStatus`, dual projection. **Guarantees:** missing/not_graded/excused never count as 0 (US9); same scores → both points & mastery; decay surfaces "needs review."
- `features/compliance/server/status-engine.ts` — inputs `{ rules+overrides, schoolYearConfig, attendanceSummary, subjectCoverage, artifactFlags }` → `{ status, reasons[], nextActions[], missingData[] }`. **Source-of-truth precedence (Cursor 7.3):** `compliance_rulesets` is the **legal floor** (state authority, shown with provenance); `school_years.requiredDays/requiredHours` is the **household's own target**. The verdict evaluates attendance against the **ruleset** when verified, AND flags when the household target is below the legal floor ("School year set to 170 days; TX requires 180"). If the ruleset value is `null`/unverified, fall back to the school-year target and label the verdict **"self-reported, not state-verified."** The engine never silently merges the two. (precedence test)
- `features/badges/server/award-rules.ts` — `canAward` enforces evidence + verification + approval (status can't reach `verified` without all three).
- `features/badges/server/gradeBand.ts` — `learners.gradeLevel` (free text/null) → `g1_4|g5_8|g9_12`; K/Pre-K+1–4→g1_4, 5–8→g5_8, 9–12→g9_12, **null/garbage→g5_8**; tested per bucket.
- `features/plan/server/validation.ts` — `plannedStartDate <= dueDate` (US1, L5); defensive guard so `formatCompletionWindow` never renders end-before-start.

### Screens
- **Gradebook (`/growth/gradebook`)** — multi-child command center (per-learner cards, §1 inline-expand); **"Needs attention" queue capped + prioritized + "all caught up" empty** (US7); per-subject Nivo line (mastery + points series, explicit `legends`/`layers`/`markers`/`defs`/`fill`) with an unambiguous "Calculated grade" vs "Projected mastery" toggle; fast inline entry grid + standalone manual-grade add-form (§5); attempt detail (history, linked evidence, override, comment-bank); print-CSS transcript/report-card/progress views (R2); rules-based analyst panel ("advisory"); loading/empty/error.
- **Compliance (`/compliance`, replaces settings stub)** — status hero (green/yellow/red + "why" + prioritized next-actions, never bare color; calm tone). **Layer-1 status hero is labeled illustrative** ("Sample data — not computed from your records yet"): it computes from fixture attendance only and becomes authoritative when the real `AttendanceSource` + seeded rules land in Layers 2–3 (US2). Requirements view (value + source link + last-verified + "informational, not legal advice"; unverified states say so); deadline timeline **feeding the hero's next-actions** (US8); capture/backfill; document generator + print binder + manifest; submission tracker (drafted→sent→accepted, manual confirm, snapshot); overrides (§1, marked parent-set, conflict banner); privacy/retention (per-record + bulk delete-by-date-range + export-then-delete, styled confirm §3).
- **Badges (`/growth/badges`)** — trophy case of emblems keyed by `emblem_key` with a **text/lucide fallback** (US6) so nothing blocks on art; earned = color, locked = grayscale with **aspirational, non-punitive framing (Cursor 8.3): label "Not yet earned" (never "Locked"), show "How to earn this" criteria, no forbidden/red affordance, no earned-count scoreboard; empty case "No badges yet — here's what your kids can work toward" showing the starter set as targets; band-aware copy (g1_4 "Keep going!", g9_12 neutral); accessible names "{badge}, earned {date}" / "{badge}, not yet earned — {criteria}"** (US7); badge detail + award flow (submit evidence → verify → approve, gated client+server); three grade-band surfaces off one engine via `gradeBand`; governance (toggle/visibility/disable platform-wide); autonomy-unlock display; continuity timeline (from `approvedAt`). Accessible names on every emblem; earned-vs-locked render test.
- **Lesson Planner (`/plan`, `/lessons`)** — compact grid (see view-mode/drop spec below); **reschedule = drag shifts the whole window, Undo restores both dates** (US1); filters/empty states; step-authoring drill-in (§1 inline); edit safety (dirty-gated Save, unsaved-nav warn, reliable Cancel, group vs instance delete, propagation default OFF, URL validation, fixed inverted date range).

### Lesson Planner grid — view modes & drop semantics (Cursor 7.2 / US1)
Three view modes off one lesson set; sticky day-header + first column; daily-total footer sums durations.
- **Expanded** (preserves today's `WeekGrid` behavior): rows = child×subject pairs, cols = 7 days, **one lesson per cell** (existing `.find()` model). Drop-target id `${childId}:${subjectId}:${dateStr}`.
- **By Child** (default): rows = children, cols = days; each cell holds **all of that child's lessons that day across subjects → multi-chip cell** (chips stacked, each = Subject·Title·Duration·Status, individually draggable). Drop-target id `${childId}:${dateStr}`.
- **By Subject:** rows = subjects, cols = days; each cell holds **all lessons for that subject that day across children → multi-chip cell** (chips show Child·Title·Duration·Status). Drop-target id `${subjectId}:${dateStr}`.
- **Multi-chip cell:** each chip is an independent `useDraggable`; the cell is one `useDroppable`; empty cell renders the droppable target only.
- **Drop semantics (all modes):** the drag payload carries `{ lessonId, sourceChildId, sourceSubjectId, prevPlannedStartDate, prevDueDate }`. A drop (1) sets `dueDate = targetDate`; (2) shifts `plannedStartDate` by the **same delta** to preserve the window (US1) — never independently, so `plannedStartDate <= dueDate` holds by construction; (3) shows `InlineSuccess` "Moved {title} to {day} · Undo" (8 s) whose Undo re-PUTs the prior both-dates. **Reassignment is out of scope for drag:** drops are accepted **only within the same row** (same child in By-Child/Expanded; same subject in By-Subject); a drop targeting a different child/subject is rejected (no-op + subtle shake) — changing a lesson's child or subject is done via edit. **Drag is desktop-only**; mobile uses tap→edit (Cursor 6.5).
- **Regression test:** drag a lesson with a 7-day window earlier than its start → it stays visible, the window stays valid, Undo restores both dates.

**Navigation (US5, R3):** Growth module in `NAV_MODULES` (`id:'growth'`, label "Growth", `defaultHref:'/growth/gradebook'`, items `gradebook`,`badges`,`grades-progress`); new `NAV_ITEMS` `gradebook`(`/growth/gradebook`) + `badges`(`/growth/badges`); re-home `grades-progress`→ label "Portfolio", href `/growth/portfolio`, narrow `activePrefixes:['/growth/portfolio','/portfolio']`; add `MODULE_ICONS.growth` + `NAV_ICONS.gradebook`/`badges`; bare `app/(shell)/growth/page.tsx` → `redirect('/growth/gradebook')`; add `growth/{gradebook,badges,portfolio}/page.tsx`. **Update both nav systems** (the `NavModuleId`/`NAV_MODULES` path the Sidebar renders AND, if touched, the legacy `NavModule`/`getNavModules` path) and update `navConfig.test.ts` + `Sidebar.test.tsx`.

**Layer-1 exit:** all four feature prototypes clickable over fixtures; integration tests green (`npx jest`); pure-module guarantee tests green in `npm test` (CI-blocking); `npm run build` + `npm test` pass; browser check for Nivo.

---

## Layer 2 — API (all four; TDD, mock at the repository boundary)

**Goal:** swap each front-service from fixtures to real `fetch`; implement route handlers + feature services satisfying the **already-frozen** Layer-1 contracts. Contract shapes don't change; component async/error wiring is exercised against real latency.

Each feature: `api/router.ts` + thin handlers + feature service, wired into `app/api/[...slug]/route.ts`, response shape `{ status, data, message, timestamp }`. **Every handler resolves tenant via `getRequestAuthCtx()` and is ownership-guarded** (`guardOwnership`/`assertSessionOwnership`); route tests assert 401/403 paths. Failing API tests first; mock the repository/service boundary (never `getDb()`).

- **Gradebook** (`/api/gradebook/*`) — subjects-grading config, scales, categories, aggregation rules CRUD; attempts/scores CRUD (lessonTask-keyed or standalone; **require a resolvable subject** for any graded attempt, fallback when `lesson_tasks.subjectId` null); rubric-criteria scores; standards sets/import; mastery + decay reads; aggregation endpoints calling the pure module; rules-based analyst; CSV export (string-built); print-view data endpoints; state export via `ComplianceSink`; audit-log read; comment-bank CRUD. **Real `AttendanceSource`** read (US2). **No `GamificationEmitter` calls.**
- **Compliance** (`/api/compliance/*`) — ruleset read (+ provenance); overrides CRUD (+ conflict surfacing, never auto-resolve); config set/switch pathway; status endpoint (status-engine over **real** attendance + rules, US2 — Layer-1 illustrative banner removed once live); deadline timeline; submissions tracker (manual accept, snapshot); document payload + manifest; export via seam; retention (per-record + bulk delete-by-date-range + export). "Informational, not legal advice" in every status payload.
- **Badges** (`/api/badges/*`) — definitions CRUD (starter + custom + override/disable); award flow gated by `award-rules`; collection/timeline read; settings (platform-wide disable); autonomy-unlock CRUD. **Never writes scores/mastery** (concrete test: badge repo exports no scores/mastery writer).
- **Lesson Planner** (`/api/plan/*`) — `lesson_steps` CRUD; `updateLesson` gains a what-changed return + `plannedStartDate <= dueDate` validation + **accepts both dates on reschedule** (US1); no new reschedule endpoint (Undo = client re-PUT prior both-dates). Reuse `plannerApi`/router; add cases.

**Layer-2 exit:** route + service tests green (incl. 401/403); **contract integration tests** (mock repo, assert response shape + key fields per feature — this replaces the vague "UI smoke"); front-services now hit real routes; UI integration tests still green; `npm run build` + `npm test` pass.

---

## Layer 3 — DB (all four; TDD; persistence behind the now-proven services)

**Goal:** make it durable. Repositories + schema + migration satisfy the service layer; swap each feature service from any remaining in-memory store to Drizzle/Postgres. Repository `.db.test.ts` cover persistence. Confirm `DATABASE_URL` is never prod before `db:generate`/`db:migrate`.

**Plumbing fix first:** repair `test:db` so `.db.test.ts` actually runs (carve `.db.test` out of the integration ignore, or add `--testPathIgnorePatterns '/node_modules/'` to the script); add a CI guard that DB-test count > 0. Only then wire R4 (integration + DB jobs + ephemeral Postgres; **change `ci.yml` push trigger to `branches:[main, master, dev]`** so post-merge pushes to the team's `dev` integration branch are gated — PRs into `dev` are already covered by the unfiltered `pull_request` trigger (Cursor 10.4); Postgres as its own job so a flaky DB step can't block build/test/smoke). **The integration suite is not green today** — per `vast-wobbling-cookie.md`, **7 suites / 53 tests fail** (missing provider wrappers + sessionStorage leakage, already captured in CLAUDE.md's testing gotchas). R4 must land **after** that fix (its Part A, branch `fix/test-infrastructure-jest-integration` off `dev`) or CI goes red on pre-existing drift — gate R4 on a green integration baseline first.

### Schema (mirror `features/portfolio/server/repository.ts`; **every table carries `householdId` + indexes**)
- **Gradebook:** extend `subjects` (+`grading_scale_id`, `aggregation_rule_id`, `standards_set_id` nullable FKs, `is_formal_course`, `credit_hours`, `term_model`); `grading_scales`, `grade_categories`, `aggregation_rules`, `attempts` (nullable `lesson_task_id` FK), `scores` (state enum `graded|not_graded|missing|excused|complete`, source enum, `householdId`), `rubric_criteria_scores` (`householdId`), `attempt_standards`, `score_evidence` (`householdId`, link-only FK→`portfolio_evidence`), `mastery_skills`, `standards_sets`+`standards`, `terms`, `grade_audit_log` (`householdId`, append-only), `comment_bank`.
- **Compliance:** `compliance_rulesets` (state, pathwayKey, requirementType, value JSON, `source_url`, `last_verified_at`, `is_verified`), `compliance_overrides`, `household_compliance_config`, `compliance_deadlines`, `compliance_submissions` (`snapshot_json`), `compliance_documents` (`payload_json`, `manifest_json`). Reuse `portfolio_evidence` + `attendance_events` + `lesson_tasks` via seams.
- **Badges:** `badge_definitions` (`householdId` nullable = starter vs custom, `verification_requirement` enum, `gradeBands` JSON, `emblem_key`, enabled/isStarter/visibility), `badge_awards` (`householdId`, status `draft|submitted|verified`), `badge_award_evidence` (`householdId`), `autonomy_unlocks`, `badge_settings`.
- **Lesson Planner:** `lesson_steps` (lessonTaskId FK, order, stepText, type enum, doneCriteria, quantity nullable). No `planned_day`, no `reschedule_log`.

**Indexes** per house style (`_household_*_idx`): `attempts(householdId,learnerId,subjectId)`+`(lessonTaskId)`; `scores(attemptId)`; `score_evidence(scoreId)`+`(evidenceId)`; `rubric_criteria_scores(scoreId)`; `mastery_skills(householdId,learnerId,subjectId)`; `compliance_*(householdId,schoolYearId)`; `badge_awards(householdId,learnerId)`+`(badgeId)`; `lesson_steps(lessonTaskId)`.

**Migrations:** generate **per-feature** migration files even on the shared Layer-3 branch (smaller, reviewable journals; order by FK dependency — e.g. `score_evidence`→`portfolio_evidence` after gradebook core); apply to a throwaway DB first (mandatory). Verify `DATABASE_URL` ≠ prod as a checklist gate.

**Reference + demo seed (US3):** `scripts/seed-reference-data.ts` (`db:seed:reference`) — idempotent, stable deterministic ids, `ON CONFLICT DO NOTHING`; reads the **existing** compliance research at `docs/compliance-research/homeschool-requirements-2026-06-27.json` for rulesets + a static starter-badge manifest; run on deploy after migrate. (Seeder must honor the file's `verified:false`/`null` fields — never seed an unverified rule as authoritative.) Extend `scripts/seed-demo-households.ts` (bulk INSERT, empty-DB only) with gradebook/compliance/badge rows so demo surfaces render populated. Use counter/uuid ids for bulk demo inserts (avoid `Date.now()` collisions).

**Layer-3 exit:** repository `.db.test.ts` green via fixed `test:db` + CI; per-feature migrations generate clean; services swapped to Postgres; reference seed idempotent (re-run = no-op); compliance illustrative banner gone (status now off real data); `npm run build` + `npm test` pass.

---

## Cross-cutting

**Branch & commit:** **the layer is the delivery and integration unit.** One branch per layer (`feat/layer1-ui`, `feat/layer2-api`, `feat/layer3-db`), behavior-oriented commits **one per feature within the branch** so review happens per commit. Never `--no-verify`; PRs against `dev` (`--body-file`, idempotent create per the Windows/PowerShell notes). No vertical or per-feature branches.

**Testing:** pure modules carry the guarantees (CI-blocking `npm test`); API/service tests mock the repo boundary; repository `.db.test.ts` via fixed `test:db` + CI; integration under `__tests__/integration/` via `npx jest` and CI (R4, after plumbing fix); Playwright authored, not CI-gated.

**Risks & rollback:** UI-first over fixtures can drift from DB reality → mitigated by typed front-service contracts, deliberately null/sparse fixtures, real pure modules, and the illustrative-banner rule for data-dependent verdicts. Reversed order means persistence lands last → mitigated because every service is already tested at its boundary before Postgres swaps in. All changes additive (new tables, nullable columns, new routes/nav). Rollback = revert per-feature migration + routes; existing features untouched.

## Verification (end-to-end, after Layer 3)
Per layer: pure unit + API tests via `npm test`; integration via `npx jest`; repo via fixed `test:db`; `npm run build` passes. Manual QA (full stack): create learner→subject→manual grade in <1 min; missing/excused never lowers average; same work shows GPA + mastery; one-click print transcript; compliance status shows why + next action with provenance + "not legal advice" **off real attendance** (no illustrative banner); badge cannot be awarded without evidence+verification+approval; grid scannable at 4 kids × 7 subjects in all three view modes; **drag a windowed lesson earlier → it stays visible, window stays valid, Undo restores both dates**; inverted date range fixed. Browser check for Nivo.

## Out of scope (v1)
LLM analyst; per-state standards libraries; agency auto-submission; XP/streaks/ranks/reward shops; subject-specific badges; offline sync; badge continuity marketing name; step OCR/dictation; batch reschedule/operation-log undo; `planned_day`; separate `assignments`/`courses`; binary PDF storage; **GamificationEmitter wiring/auto-award**; **cross-child/cross-subject reassignment via drag** (use edit).

## Appendix A — C1 compliance research (DONE)
The C1 state research is **already produced** and lives at `docs/compliance-research/homeschool-requirements-2026-06-27.json` — the seeder (`scripts/seed-reference-data.ts`) reads this file directly; no Sonnet research pass is needed. Before seeding, validate it against the C1 contract: covers the locked states, every requirement carries `source_url` + `last_verified`, and unverified/unknown fields are `null` + `verified:false` (those seed as "not yet verified," never as authoritative). If a state/pathway is missing a field, it surfaces as "not yet verified" in the UI — never fabricated.
