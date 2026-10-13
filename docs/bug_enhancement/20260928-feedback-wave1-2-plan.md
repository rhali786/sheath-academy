# Feedback Wave 1 + 2 — implementation plan (2026-09-28)

**Source:** `docs/bug_enhancement/20260928-feedback-triage.md` (27 submitted rows, prod).
**Backup:** `backups/prod-2026-09-28T04-03-39/` taken before any DB access.

## Summary

Fix four contained defects from the August feedback batch (modal scroll, orphaned nav entry, inert badge setting, missing overdue filter), then two real bugs (gradebook missing courses, learner login). Learner permissions (item 11) is added here as a gated design phase, not a quick fix — the audit found no role authorization exists anywhere.

**Planning mode:** mixed, stated per phase. Phases 1–4 are Mode 1/2. Phase 5 is Mode 3. Phase 7 is Mode 5 and is gated.

---

## ⛔ Phase 0 — Unblock the build (must land first)

**`npm run build` currently fails on a clean `dev` tree.** Verified by stashing all local changes and rebuilding: identical failure. This is pre-existing, not caused by the learning-time work.

**Root cause traced:**
`app/(shell)/about/page.tsx` is an async server component that calls `listChangelogEntries()` — a live DB query — and is statically generated at build time. Its `try/catch` handles a DB that *errors*, but not one that *hangs*. `DATABASE_URL` points at `sacad` (Virginia), which is **unreachable — ECONNRESET, confirmed on three separate attempts**. So: static-generate `/about` → query dead DB → hang → 60s timeout × 3 attempts → build fails.

This single cause also explains why `steward:*` has been unusable.

**Two fixes, both wanted:**
1. **Repoint `DATABASE_URL`** (see open question below — needs your decision, not mine).
2. **Make `/about` resilient regardless** — wrap `listChangelogEntries()` in a timeout so the existing `catch` actually fires, or mark the route `dynamic`. A page that renders a static changelog should never be able to fail a build on DB availability. *This is the real fix; #1 only masks it.*

**Acceptance:** `npm run build` exits 0 with `DATABASE_URL` pointing at an unreachable host.

---

## Phase 1 — Course edit dialog cannot scroll *(items 6, 16 — screenshot-confirmed)*

**Mode 1.** Presentation only, no data behavior change.

**Code-path audit:** `features/subjects/front/components/SubjectEditDialog.tsx`.
- L104: overlay is `fixed inset-0 flex items-center justify-center p-4`.
- L110–116: dialog panel is `w-full max-w-md … p-6` — **no `max-height`, no `overflow`**.
- L167–184: "Linked resources" renders one `min-h-[44px]` row per resource, unbounded.

With ~17 resources that's ~750px of checkboxes plus the rest of the form. The panel exceeds viewport height, and because it is *vertically centered*, it overflows past the top **and** bottom equally — exactly "can't scroll nor see the top or bottom." No scroll container exists anywhere in the tree.

**Fix:** constrain the panel (`max-h-[90vh]`, `flex flex-col`) and make the form body the scroll region (`overflow-y-auto`), leaving the title and the Cancel/Save row pinned. Per `ui-style-guide`, the footer must stay reachable without scrolling.

**Tests (failing first):** integration test in `features/subjects/__tests__/integration/` — render `SubjectEditDialog` with 25 resources, assert the scroll container exists and the submit button is within the panel bounds.

**Manual QA:** Settings → Courses → Edit on a course in a household with 15+ resources → confirm the list scrolls internally and Save stays visible.

---

## Phase 2 — Learning Time is unreachable from navigation *(item 1, partial)*

**Mode 1.**

**Code-path audit:** `app/(shell)/learning-time/page.tsx` exists and renders. `features/layout/lib/navConfig.ts` `NAV_ITEMS` contains **no entry for it** (grep: zero matches for `learning-time`). The feature is orphaned — reachable only by typing the URL.

The other half of item 1 ("nothing labeled Plan") is **already resolved** by the IA rework — `Planbook › Lesson Planner`. No action.

**Fix:** add one `NAV_ITEM` (`id: 'learning-time'`, label `Learning Time`, href `/learning-time`, module `Planbook`) and add its id to the `planbook` module's `itemIds`. Both lists must be updated — `getModuleItems` reads `itemIds`, so a `NAV_ITEMS` entry alone renders nothing in the module sidebar.

**Tests:** extend the existing navConfig unit test — assert `/learning-time` resolves to a nav item and `isNavItemActive('/learning-time', item)` is true.

---

## Phase 3 — "Platform badges" checkbox does nothing *(item 15)*

**Mode 2.** The user is literally correct; this is not a perception issue.

**Code-path audit:**
- `BadgesPage.tsx:541` `handleToggleSettings` → `badgesApi.setSettings(next)` → persists, shows "Settings updated". **Never calls `reloadCollection()`** — every sibling action does.
- More fundamentally: `repository.ts:70` `listBadgeDefinitions` returns *all* definitions (`householdId IS NULL` ∪ household's) and **never consults `getBadgeSettings`**. `listBadgeCollection` (L91) doesn't either.

So `platformBadgesEnabled` is a **write-only setting** — stored in `household_settings`, read by nothing. The checkbox is inert by construction.

**Source of truth:** Badges feature owns badge visibility. Filtering belongs in the repository, not the page.

**Fix:** `listBadgeCollection` consults `getBadgeSettings(householdId)`; when `platformBadgesEnabled === false`, exclude platform definitions (`householdId IS NULL` / `isStarter`). Front-end: `await reloadCollection()` after toggle.

**Tests (failing first):** repository test — seed one platform + one household badge, assert the platform badge is excluded when disabled and present when enabled. Integration test — toggle the checkbox, assert the list re-renders.

---

## Phase 4 — "Overdue" missing from the status filter *(item 25)*

**Mode 2.** Larger than it looks — do not just add an `<option>`.

**Code-path audit:** `features/plan/types.ts:1` — `LessonTaskStatus = 'not_started' | 'completed' | 'skipped'`. **There is no `overdue` status.** `LessonsPage.tsx:89` filters by exact equality (`l.status === filterStatus`), and the dropdown (L177–186) lists only the three real statuses.

Overdue is a **derived** condition: `status === 'not_started' && dueDate < today`. Naively adding `<option value="overdue">` would match nothing and silently return an empty list.

**Fix:** widen the filter state to `LessonTaskStatus | 'overdue' | ''` and special-case `'overdue'` in the `useMemo` predicate. Do **not** add `overdue` to `LessonTaskStatus` — it is not a persisted state, and adding it would leak a non-storable value into the write path.

**Tests (failing first):** unit test on the filter predicate — a `not_started` lesson dated yesterday matches; one dated tomorrow does not; a `completed` lesson dated yesterday does not.

**Date handling:** compare in household-local time, not UTC — see `references/standards.md`.

---

## Phase 5 — Gradebook missing courses *(items 14, 23 — screenshot-confirmed)*

**Mode 3.** Cross-feature; the same data appears in Settings and Gradebook and disagrees.

**Evidence:** screenshot `7f96d574` shows Samura with 2 courses in Gradebook; the Settings screenshot from the same session shows her linked to more.

**Code-path audit so far:** `features/gradebook/server/repository.ts:184` `listGradebookSummaries` → L212–216 scopes subjects to `s.schoolYearId === activeYearId || schoolYearId == null`, dropping `isActive === false`. The inline comment claims this "mirrors" `features/subjects/server/repository.ts` `listSubjectRows`.

**⚠️ Unverified — this is the thing to check first.** I did not confirm that `listSubjectRows` actually applies the same filter. If Settings uses looser scoping, that divergence *is* the bug, and the comment has simply drifted from the code. Per CLAUDE.md, do not trust the comment — read `listSubjectRows` and diff the two predicates before writing any fix.

Most likely culprit: a course whose `schoolYearId` points at a non-active year (created directly, not via rollover) is visible in Settings but excluded from Gradebook.

**Do not fix until the two predicates have been diffed and the divergence named.**

The grade-per-lesson half of item 23 is **out of scope** — separate feature, own plan.

---

## Phase 6 — Learner login won't enable *(item 5)* — GATED

**Mode 2.** **Root cause not established. Do not implement from this plan.**

Two hypotheses were formed and both **disproven**:
1. *`addMember` creates an inactive membership* — disproven. `household_members.isActive` defaults `true` (`db/schema.ts:106`) and `addMember` relies on that default.
2. *`updateLearner` drops `userId`* — disproven. `features/children/server/repository.ts:124` explicitly persists it.

Read-back is `learnerLoginEnabled = !!user?.passwordHash && !!membership?.isActive` (`children/api/routes/child.ts:41`), so the failure is in one of those two conditions, but which is unknown.

One real asymmetry worth examining: `addMember` (`household/server/repository.ts:160–165`) **returns early if a membership row already exists, without reactivating it**. A learner who was enabled → disabled → re-enabled *and* whose `learner.userId` was cleared would hit `addMember` with a stale inactive row and silently stay inactive. This is a hypothesis, not a finding.

**Next step is reproduction against real data, not more code reading** — per your standing preference, the diagnosis gets confirmed before a fix is written.

---

## Phase 7 — Learner accounts have full household permissions *(item 11)* — GATED

**Mode 5.** Added here per your instruction, but flagged: **this is not a Wave 2 fix.**

**Finding:** `household_members.role` stores `'owner' | 'member' | 'teacher' | 'learner'` (`db/schema.ts:103`), but a grep across all of `features/` for any role check — `role === 'learner'`, `requireRole`, `isLearner` — returns **zero matches outside tests**. No route, service, or component consults it.

A learner who signs in therefore has **identical privileges to the household owner**: add courses, edit any learner's grades, archive other students. That matches item 11 exactly.

Closing this means an authorization layer: a role gate on every mutating route, learner-scoped data reads, and UI affordance hiding — plus a decision on what a learner *should* be able to do (item 12 wants them self-reporting Qur'an progress, so "read-only" is not the answer).

**Gate:** needs its own design spike before any code. Do not attempt inside this plan.

---

## Out of scope

Items 7, 22 (lesson filters/bulk ops), 23-b (grade-per-lesson), 2/3/17 (rollover + resource deletion), 18/26/27 (break shift engine — Wave 3, needs a spike), 19/20/13 (recurring times — Wave 3), 4, 9, 24 (deferred).

**Item 10 (badge upload) — decided: defer.** `3bf2fff` added an image **URL text field** (`BadgesPage.tsx:84`), not a file upload. The actual ask — "upload directly from our computer" — is **not** satisfied. But the user themselves framed it as "if later," and `features/portfolio/front/components/EvidenceForm.tsx` already has an upload pattern to reuse when we do it. Not urgent; closes cleanly in a later wave.

---

## Build phases (dependency order)

`Phase 0` → `1, 2, 3, 4` (independent, parallelisable) → `5` → `6, 7` gated.

## Branch + commits

Branch: `fix/feedback-wave1-20260928`. One behavior-oriented commit per phase. Never `--no-verify`.

## Open question — needs your decision

**Phase 0 asks which database `DATABASE_URL` should point at.** You said "use prod db," which I read as *prod is the source of truth for feedback data* — and I used the read-only prod pull for exactly that.

But repointing `.env.local`'s `DATABASE_URL` at prod is a different thing: it makes **every** `db:*` command target production. Per CLAUDE.md, that is the precise configuration that caused `db:reset:demo` to truncate the prod database on 2026-06-08. I'm not making that change on my own initiative.

Options: (a) fix `/about` to tolerate an unreachable DB and leave `DATABASE_URL` alone, (b) provision a fresh dev DB to replace the dead `sacad`, (c) repoint at prod with your explicit say-so. **I recommend (a) + (b).**
