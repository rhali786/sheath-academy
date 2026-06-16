# "Where do I enter grades?" on `/growth` — investigation + plan

**Date:** 2026-06-06
**Branch:** `fix/grade-discoverability-investigation`
**Author:** planning pass (plan-builder), resolves the DEFERRED `portfolio` workstream in `docs/bug_enhancement/20260606-2016-steward-grouped-plan.json` (feedback `e9da1b59-9370-4b69-8c4d-58d2874f156d`)

---

## Headline answer (to the embedded clarifying question)

> **"Where are assignment grades actually meant to be entered, and should `/growth` point at a different grade-entry surface?"**

**Definitive answer: nowhere. The app does not have a "record a grade for an assignment" capability anywhere in the codebase.** There is no field, type, status value, or form input anywhere that stores a numeric or letter score for a piece of work. Re-pointing `/growth` at a "different grade-entry surface" is impossible because no such surface exists — building one would be new product work, not a routing/IA fix.

This is **not a discoverability bug**. It is a **missing-feature request wearing a discoverability costume**. The smallest correct fix is **not** to relabel or reroute anything (that would imply a feature exists when it doesn't) — it is to **stop promising "grades" in the nav** until grading exists, by retitling the nav item to match what the destination actually offers (growth/evidence tracking), and to flag the underlying "add assignment grading" capability as its own follow-up plan requiring schema work.

---

## Summary

| Question | Audit finding |
|---|---|
| Does `/growth` render the Portfolio (evidence) page? | **Yes.** `app/(shell)/growth/page.tsx:1-5` imports and renders `PortfolioPage` directly — no wrapper, no grade-specific content. |
| Does the "Grades & Progress" nav item point at `/growth`? | **Yes.** `features/layout/lib/navConfig.ts:36-42` — `{ id: 'grades-progress', label: 'Grades & Progress', href: '/growth', activePrefixes: ['/growth', '/portfolio'] }`. The `activePrefixes` array itself silently acknowledges `/growth` and `/portfolio` are the same destination. |
| Does the Portfolio page itself call its destination "Growth," not "Portfolio"? | **Yes — and this matters.** `features/portfolio/front/pages/PortfolioPage.tsx:132` renders `<h1 className="page-title mb-0">Growth</h1>`. The page already self-identifies as "Growth" (evidence/reflection tracking), not "Grades." The mismatch is entirely in the **nav label**, which promises "Grades & Progress" while the destination — by its own heading — is a growth/evidence tracker. |
| Is there ANY field, type, or status value anywhere that stores a numeric/letter grade for an assignment? | **No — confirmed exhaustively.** See Code-path audit below. The only "grade" concepts in the codebase are (a) a student's **grade level** (e.g. "Grade 5") and (b) unrelated terms ("Score" in `product-validation` survey scoring, "grader" nowhere). Nothing represents "this lesson/assignment received an A / 92% / Pass." |
| What DOES the app track for a lesson/assignment? | Only **completion status**: `LessonTaskStatus = 'not_started' \| 'completed' \| 'skipped'` (`features/plan/types.ts:1`). No score, no rubric, no percentage, no letter grade field anywhere on `LessonTask`. |
| What does Portfolio/"Growth" actually let you record? | Qualitative **evidence** of work: `EvidenceItem { type: 'note' \| 'link' \| 'writing_sample' \| 'project' \| 'recitation' \| 'other', notes?, reflection?, url? }` (`features/portfolio/types.ts:1-17`). `EvidenceForm.tsx` exposes title/child/subject/date/type/notes/reflection/url/linked-lesson — no numeric or letter input anywhere (`features/portfolio/front/components/EvidenceForm.tsx:6-12, 192-330`). |
| So what's the actual problem? | The **nav label over-promises**. "Grades & Progress" tells the user a grade-entry feature exists; it doesn't. The user isn't failing to *find* grade entry — they're correctly concluding it isn't there, and (reasonably) assuming the IA is just hiding it. **The fix is to stop the nav label from making a promise the product can't keep**, not to reroute to a feature that doesn't exist. |

**Conclusion: this is a missing-feature request, not a routing/discoverability defect.** The minimal correct response has two parts: (1) a same-day Mode 1 copy fix (rename the misleading nav label to match what the destination actually does), and (2) flag "let a parent record an assignment grade" as a separate, schema-touching follow-up plan — out of scope here.

---

## Planning mode

**Mode 1 — pure copy/IA fix for the immediate item; the underlying capability is explicitly out of scope and deferred to a follow-up plan.**

- The in-scope change touches exactly one line of static config (`navConfig.ts` label string) plus its test fixture/assertions — no new type, no schema, no API, no service, no repository, no route.
- The out-of-scope item ("let a user record a grade for an assignment") would be Mode 3+ (new `db/schema.ts` column(s) or table, new type, new repository/service/route, new UI input, migration) — that is named explicitly below as a follow-up and NOT designed here, per the task instructions.

---

## Code-path audit (current state)

### Route wiring — `/growth` → Portfolio
- `app/(shell)/growth/page.tsx:1-5` — entire file:
  ```tsx
  import { PortfolioPage } from '@/features/portfolio/front/pages'
  export default function Page() {
    return <PortfolioPage />
  }
  ```
  No grade-specific wrapper, no alternate content — `/growth` is a thin alias for the Portfolio feature.

### Nav config — what the user is told to expect
- `features/layout/lib/navConfig.ts:36-42`:
  ```ts
  {
    id: 'grades-progress',
    label: 'Grades & Progress',
    href: '/growth',
    section: 'main',
    activePrefixes: ['/growth', '/portfolio'],
  }
  ```
  The label promises "Grades." The `activePrefixes` list (`/growth`, `/portfolio`) shows the nav config's own author already knew these are the same destination — the mismatch is between the **label text** and the **destination's actual capability**, not a routing bug.

### Destination — what `/growth` (Portfolio) actually offers
- `features/portfolio/front/pages/PortfolioPage.tsx:132` — `<h1 className="page-title mb-0">Growth</h1>`. The page **already self-identifies as "Growth,"** not "Grades" or "Portfolio." This is strong evidence the page's own authors understood it as a qualitative growth/evidence tracker — the nav label is the outlier, not the page.
- `features/portfolio/front/pages/PortfolioPage.tsx:144-156` — "Add evidence" section renders `<EvidenceForm>`.
- `features/portfolio/front/components/EvidenceForm.tsx:6-12` — `EVIDENCE_TYPES`: `note`, `link`, `writing_sample`, `project`, `recitation`, `other`. No `grade`/`assessment`/`score` option.
- `features/portfolio/front/components/EvidenceForm.tsx:192-330` — full field list: title (`ev-title`), child (`ev-child`), subject (`ev-subject`), date (`ev-date`), type (`ev-type`), notes (`ev-notes`), reflection (`ev-reflection`), url (`ev-url`), linked lesson (`ev-lesson`). **No numeric, percentage, letter, or rubric input field anywhere in the form.**

### Type-level search — confirms no grade concept exists for assignments
- `features/portfolio/types.ts:1-29` — `EvidenceItem` / `CreateEvidenceItemInput`: `id, title, childId, subjectId, date, type, notes?, reflection?, url?, lessonTaskId?, createdBy, createdAt, updatedAt`. No score/grade field.
- `features/plan/types.ts:1` — `export type LessonTaskStatus = 'not_started' | 'completed' | 'skipped'`. This is the **only** state a lesson/assignment can be in — a tri-state completion flag, not a graded outcome. No `score`, `grade`, `percentage`, `mark`, or `rubric` field exists on `LessonTask` (confirmed via `grep -in "status|completion|complete|grade|score|mastery|percent" features/plan/types.ts`).
- `features/lib/types.ts:8` (`Child.grade: number`) and `:18` (`StudentProfile.gradeLabel: string`) — these are **student grade-level** descriptors (e.g., "Grade 5"), confirmed by the doc comment at `features/subjects/types.ts:42`: `/** Optional level descriptor, e.g. "Grade 5", "Algebra I", "Arabic Level 2". */`. **Not** an assignment score.
- Repo-wide search for `mastery|rubric|letterGrade|numericGrade|assignmentScore|gradeValue|percentage|gpa|GPA` returns **zero matches** in any feature directory (only unrelated hits in `auth`/`dashboard` test fixture noise like "transformProgress" and "passwordScore"-style names that are unrelated to assignment grading — verified by reading each hit's context).
- `features/records/server/service.ts:52,74-83,106-116` — the Reports/Records aggregation maps `gradeLabel` (student grade level, line 52), `LessonTask.status` (line 83), and `EvidenceItem.type` (line 113) into report rows. **No score/grade-of-work field is aggregated because none exists to aggregate.**
- `features/product-validation/` contains `ScoreQuestion.tsx` / `scoring.ts` — this is the internal **product-validation survey** feature (Likert-style scoring of feedback questions for app admins), entirely unrelated to student assignment grading. Confirmed by reading file paths and the surrounding feature directory; not a candidate "buried" location.

**Net: there is no code path, type, status enum, form field, or aggregation anywhere in the codebase that lets a user record or view a grade for a piece of student work.** The search was exhaustive across `features/portfolio`, `features/plan`, `features/subjects`, `features/lib`, `features/records`, and a repo-wide grep for grading-adjacent terms.

### Existing tests
- `features/portfolio/__tests__/integration/PortfolioPage.test.tsx` and `features/layout/__tests__/navConfig.test.ts` — neither asserts on the nav item's label text matching the destination's actual capability (confirm during Phase 1 before writing the new assertion, to avoid duplicating one).

---

## Overlap with the approved nav-restructure workstream

The grouped plan's `navigation` workstream (feedback `e1c3f3db-27c7-4978-a7ac-f40160c2d0df`, **APPROVED**, `allowedFiles: ["features/layout/lib/navConfig.ts", "features/layout/front/components/Sidebar.tsx", ...]`) is the "module grouping" first slice — it adds a `module` field to `NavItem` and groups the sidebar visually **without changing any `href` or `label`**. Its `blastRadiusNotes` explicitly states: *"all current hrefs (e.g. ... /growth ...) stay exactly as they are"* and its UAT checklist explicitly re-confirms `Grades & Progress→/growth` is unchanged.

**This plan and that workstream both touch `features/layout/lib/navConfig.ts`, but on different fields of the same array entry:**
- Nav-restructure workstream: adds/edits a new `module: 'planbook' | 'records' | ...` property on the `grades-progress` entry (and all others).
- This plan: edits the existing `label: 'Grades & Progress'` string on the same entry to `label: 'Growth & Reflection'` (or similar — final copy decided in Phase 1).

**Sequencing recommendation:** these are a one-line change each on the *same object literal* — a trivial textual merge conflict if executed in parallel on diverging branches, but not a logical conflict (one adds a `module:` key, the other edits the `label:` value). Whoever executes second should rebase onto the first's branch before editing `navConfig.ts`, and re-run `features/layout/__tests__/navConfig.test.ts` + `features/layout/__tests__/Sidebar.test.tsx` together. **Do not let both land via independent auto-merges without a human rebase step on this file.**

---

## Source-of-truth decision

**Layout/navigation** owns the nav label — `features/layout/lib/navConfig.ts` → `Sidebar.tsx`. **Portfolio** owns evidence (`EvidenceItem`, `features/portfolio/types.ts`). **Planner/Lesson Tasks** owns lesson completion status (`LessonTaskStatus`, `features/plan/types.ts`). **No feature currently owns "assignment grade/score"** — that ownership question is **open** because the concept doesn't exist yet; creating it would require a net-new decision (does a grade belong on `LessonTask` as a new field, on a new join entity linking `EvidenceItem` to a score, or as a wholly new `assignment_grades` table?). That decision is explicitly **deferred to the follow-up plan** named below — do not pre-decide it here.

### Architecture Findings
- **Type owner:** `NavItem.label` stays in `features/layout/lib/navConfig.ts` (`NavItem` type at `:3-16`). No new or modified type for the in-scope fix — only a string-literal edit to an existing array entry.
- **Data access:** No data-access layer is touched. `navConfig.ts` is static client-side configuration; `PortfolioPage.tsx` keeps its existing `UI → portfolioApi → /api/portfolio route → service → repository` chain completely unchanged.
- **Cross-feature import:** none introduced or removed. The fix does not add any import to or from `features/portfolio`.
- **Postgres-ready:** N/A for the in-scope fix — no schema or repository change. The deferred follow-up ("record an assignment grade") **would** require a `db/schema.ts` migration (new column(s) or table) and is explicitly flagged as needing its own plan for that reason.
- **Refactor restraint:** do not touch `PortfolioPage.tsx`, `EvidenceForm.tsx`, `EvidenceItem`/`CreateEvidenceItemInput`, `LessonTaskStatus`, or any repository/service/route file. Do not invent a placeholder "grade" field anywhere as a stopgap — that would create exactly the kind of half-built, speculative surface the deferral was meant to prevent (an empty/non-functional "Grade" input would be worse than no input, since it implies the value is being saved and used somewhere). Do not re-route `/growth` to a different existing page (e.g., `/plan` or `/records`) — none of them offer grade entry either, so re-routing would just relocate the same false promise.

---

## Build phase (single phase — Mode 1, no migration, no gate)

**Phase 1 — Retitle the nav item to match what `/growth` actually offers.**

Change the misleading label so the nav stops promising a feature that doesn't exist, aligning it with the destination page's own self-identification (`<h1>Growth</h1>`, `PortfolioPage.tsx:132`).

- **File:** `features/layout/lib/navConfig.ts:38` — change `label: 'Grades & Progress'` to a label that accurately describes evidence/reflection tracking and student growth, e.g. `label: 'Growth & Reflection'` or `label: 'Student Growth'` (final string is a product-copy decision; recommend matching the page's existing `<h1>Growth</h1>` heading for consistency — e.g. `'Growth'` or `'Growth & Evidence'`).
- Do **not** change `id: 'grades-progress'` (would be a wider blast radius — touches any code keying off the nav item id; purely cosmetic label change is sufficient and lower risk) — but note the id/label drift in a code comment so a future reader isn't confused (optional, low-priority).
- Do **not** change `href`, `activePrefixes`, or any routing.
- **Tests:** `features/layout/__tests__/navConfig.test.ts` — read existing assertions first (per the note above) to avoid duplicating one; add/update an assertion that the `grades-progress` nav item's label no longer contains the word "Grades" (regression-proof against re-introducing the same false promise), and that `href`/`activePrefixes` are unchanged (proves the routing is untouched).
- **No gate** — this is a pure label-string edit; the only "decision" (final wording) is a small, low-risk product-copy choice that does not block landing the fix (any accurate, non-overpromising label satisfies the requirement).

---

## Out of scope (and why)

- **Building an actual "record a grade for an assignment" feature.** This is the real underlying gap the feedback points at, but it requires a net-new product/data-model decision: where does a grade live (`LessonTask`? a new join table? a new `assignment_grades` table)? what shape (numeric 0–100? letter A–F? rubric levels?)? does it require a migration to `db/schema.ts`? This is **schema-touching, Mode 3+ work** and is explicitly named here as **its own follow-up plan** — do not attempt to design or implement it as part of this fix.
- **Re-routing `/growth` to a different existing page.** No existing page (`/plan`, `/records`, `/lessons`, `/attendance`) offers grade entry either — re-routing would relocate the same false promise to a different URL, not resolve it.
- **Adding a placeholder/stub "Grade" field to `EvidenceForm` or `LessonTask`.** Would create a non-functional input that appears to save a value nobody reads — worse than the status quo because it actively misleads users into thinking their grade was recorded.
- **Renaming `id: 'grades-progress'`** — wider blast radius than needed; the label string is the only user-visible promise that needs correcting.
- **Any change inside `features/portfolio` or `features/plan`** — both already correctly implement what they're scoped to do (evidence tracking, lesson-completion tracking respectively); neither is broken.

---

## Manual QA
- Sign in, open the left sidebar, confirm the item previously labeled "Grades & Progress" now reads the corrected label (e.g. "Growth & Reflection" / "Growth").
- Click it; confirm it still navigates to `/growth` and renders the same Portfolio/evidence page with `<h1>Growth</h1>` — no routing change, no broken link.
- Confirm the active-state highlighting still triggers correctly on `/growth` and `/portfolio/*` paths (per `activePrefixes` at `navConfig.ts:41`, unchanged).
- Confirm no other surface (Reports & Records, Dashboard, Settings) still references the old "Grades & Progress" label in a way that would now be inconsistent — `grep -rn "Grades & Progress"` across `features/` and `app/` before closing out.

## Risks + rollback
- Single-string change in one config file — trivially revertible (restore the old label string).
- **Merge-conflict risk with the approved nav-restructure workstream** on the same `navConfig.ts` object literal (see "Overlap" section) — mitigate by sequencing/rebasing, not by avoiding the fix.
- **Reputational/expectation risk if left unfixed:** every day this label says "Grades" while no grading feature exists, users will keep filing the same "where do I enter grades" feedback — the label fix is a small, immediate de-escalation even though it doesn't deliver the underlying capability.
- **Recommended immediate follow-up:** open a new dedicated plan (e.g. `docs/bug_enhancement/<date>-assignment-grading-feature-plan.md`) scoping the actual "record a grade for an assignment" capability — owner TBD (Portfolio vs. Planner vs. new `grading` feature), requires a `db/schema.ts` migration decision, new type(s), repository/service/route/UI work, and its own integration test plan per the Planning requirements in `CLAUDE.md`.
