---
name: plan-builder
description: Use when building or reviewing a development plan for a feature, bug fix, enhancement, refactor, or cross-feature repair in Sheath Academy. Provides planning-mode selection, the current-code-path audit, source-of-truth ownership rules, and the required plan structure. Plan from real code paths, not memory.
---

# Plan builder

Produce plans that are grounded in the real codebase, testable through observable behavior, respectful of feature ownership, and safe for agentic implementation.

Plan from current code paths and the intended source of truth — never from memory, desired architecture, or assumptions. If a path can't be traced, say what was traced and what is unknown. Do not fill gaps.

Pair this with the `ui-style-guide`, `testing-patterns`, and `architecture-rules` skills when a plan touches UI, tests, or type/data ownership.

---

## 1. Pick a planning mode (do this first)

Routing determines how much of the rest applies. Use the lightest mode that still protects correctness.

| Mode | Use when | Core requirements |
|---|---|---|
| **1 — Tiny UI / copy / styling** | Only wording, spacing, labels, colors, presentation; no data behavior change | Identify component; observable acceptance criteria; tests only if behavior changes. No full audit. |
| **2 — Local feature behavior** | One feature's UI, store, API, validation, or local behavior changes | Audit the component + feature service/store/API route; existing + missing tests; unit/API/integration as applicable. Playwright optional unless the flow crosses screens. |
| **3 — Cross-feature / dashboard / records / reports** | Behavior depends on multiple features, shared selectors, dashboard composition, or cross-feature counts | Full code-path audit; source-of-truth decision; unit + API + integration + Playwright; explicit regression checklist. |
| **4 — New feature** | Roadmap feature or substantial new capability | Ownership decision; data model, validation, API/store, UI, tests; build phases; acceptance criteria; out-of-scope; branch/commit plan; TDD plan; manual QA. |
| **5 — Architecture migration** | Moving data ownership, replacing stores, changing shared contracts, removing duplicate sources of truth | Current + target ownership maps; compatibility strategy; migration steps; deprecation/removal plan; high-value regression tests; rollback notes. |

**Default to Mode 3** if the request involves: Dashboard, Records, Reports, child selector, All-Children aggregation, archived-child behavior, cross-feature counts, or data shown in multiple places.

Per-mode requirement checklists and the full plan structure: see `references/plan-types.md`.

---

## 2. Audit the current code path

Before writing any plan, trace every affected behavior. For each affected UI section, report:

1. The component that renders it.
2. The front-end service, hook, context, or store that provides its data.
3. The API route called, if any.
4. The server service or repository called, if any.
5. The store, seed, mock, database, or source currently used.
6. The feature that *should* own the data.
7. The existing tests that cover it.
8. The missing tests needed to prove the fix.

If the code path cannot be fully traced, state exactly what was traced and what remains unknown. Do not fill gaps with assumptions.

**UI changes** additionally require a UI pattern audit — invoke the `ui-style-guide` skill and report which approved patterns apply (record-card interaction, icons, confirmation pattern, shell/page-width, Nivo rules, accessibility).

**Type/data ownership** decisions follow the `architecture-rules` skill — produce its required "Architecture Findings" block.

Inspect only the folders/files needed for the slice. Before touching files outside expected scope, state why it is necessary. (Scope guidance: `references/standards.md`.)

---

## 3. Decide the source of truth

Every plan must identify the source of truth.

- **Planner / Lesson Tasks** — lessons, tasks, lesson status, scheduling, rescheduling, progress inputs.
- **Attendance** — attendance records, status, minutes, attendance summaries.
- **Portfolio** — evidence items, notes, links, lesson-evidence connections.
- **Qur'an** — Qur'an sessions, recitation/memorization/review progress.
- **Alerts** — Needs Attention and advisory signals.
- **Records / Reports** — records summaries, report views, print/export, review checklists.
- **Dashboard** — composes Today-facing data only. It does not own business logic or canonical data.

If current code violates ownership, the plan must pick one and say why: (1) leave temporarily with a reason, (2) wrap behind a feature service, (3) migrate it in this wave, or (4) defer with a named follow-up.

**Never create new dashboard seed/store data to solve dynamic-data bugs.**

---

## 4. Write the plan

Use the required structure (full version in `references/plan-types.md`). At minimum, every non-trivial plan states:

- **Summary** — what will be built/fixed, one paragraph.
- **Planning mode** — which mode and why.
- **Code-path audit** — the section-2 trace.
- **Source-of-truth decision** — owner, and how any violation is handled.
- **Acceptance criteria** — exact, observable outcomes a tester can click through (not "make dashboard dynamic" but "selecting Child B hides Child A data").
- **Data/contract changes**, **API/store/service plan**, **UI plan** as applicable.
- **Testing plan** — failing tests listed first. Test-type responsibilities and examples: `references/test-strategy.md`.
- **Build phases** — ordered by dependency; each phase produces a usable capability.
- **Out of scope** — what will not be built.
- **Manual QA** — click-by-click, tied to acceptance criteria.
- **Branch + commit plan** — descriptive branch name; behavior-oriented commits.
- **Risks + rollback** as applicable.

Standards for acceptance criteria, empty states, accessibility/mobile, date/time, out-of-scope discipline, branch naming, commit discipline, waves/slicing, and worked examples live in `references/standards.md`.

---

## 5. Final gate

Before finalizing, confirm:

- Planning mode stated; affected code path audited; source of truth identified; ownership violations handled explicitly.
- For UI: closest approved pattern named; record-card interaction (inline/modal/navigate/reuse) stated; destructive actions specify the styled confirmation (no `window.confirm`); icon-only actions have labels; Nivo plans specify data contract, empty state, legend, color source, and browser verification.
- Acceptance criteria observable; failing tests listed first; unit/API/integration/Playwright responsibilities clear.
- Dashboard owns no feature data; no new seed/store data hides dynamic-data bugs.
- Build phases ordered by dependency; out-of-scope named; manual QA click-by-click; branch named; commits behavior-oriented; slice small enough to implement safely.

If any item is missing, revise before implementation.

---

## Guiding principle

Make the plan truthful before making it clever. A good plan identifies the real code path, the real owner, the real tests, and the real observable behavior. It does not hide uncertainty behind architecture language, make the dashboard look dynamic with fake data, or overbuild future concerns into the current slice.

Build in layers: source of truth → tested contract → user-visible behavior → regression protection.
