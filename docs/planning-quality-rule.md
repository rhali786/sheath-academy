# Planning Quality Rule

Planning is part of the engineering work. A plan that sounds right but does not verify the codebase is not ready for implementation.

Before writing an implementation plan, the planning agent must audit the current code paths for every affected behavior. Do not plan from memory, session summaries, or architecture assumptions.

## Required audit for every affected UI section

For each affected UI section, report:

1. The component that renders it.
2. The front-end service or context that provides its data.
3. The API route called.
4. The server service called.
5. The store, seed, or source currently used.
6. The feature that should own the data.
7. The existing tests that cover it.
8. The missing tests needed to prove the fix.

If any layer cannot be traced, say so and stop before planning implementation details.

## Observable acceptance criteria

Every plan must include exact, user-visible acceptance criteria. Avoid broad statements like “make dashboard dynamic.” Prefer concrete statements like:

- Selecting Child A shows Child A data.
- Selecting Child B hides Child A data.
- Selecting All children aggregates active children.
- Archived children are excluded.
- Empty source data shows zero or empty state, not seeded fallback.
- Sorting changes visible order.
- Counts match the owning API response.

## Required testing plan

Every plan must include failing tests first:

- Unit tests for pure service and business rules.
- API tests for route filters, validation, and response shape.
- Integration tests for component behavior.
- Playwright tests for user-visible flows and cross-feature wiring.

Playwright tests must assert meaningful state changes, not only that elements exist.

A weak Playwright test says: “Dashboard loads.”

A strong Playwright test says: “Select Adam, confirm Adam-only Quran session appears; select Khadijah, confirm Adam session disappears; select All children, confirm active-child aggregation; confirm archived child never appears.”

## Source-of-truth declaration

Every plan must identify source of truth before implementation:

- Planner owns lessons and lesson-derived progress.
- Attendance owns attendance records and summaries.
- Portfolio owns evidence.
- Quran owns Quran sessions and Quran progress.
- Alerts owns Needs Attention.
- Records/Reports owns records summaries and report composition.
- Dashboard only composes Today-facing data.

If the current code violates ownership, the plan must state whether to:

1. Leave it temporarily.
2. Wrap it behind a feature service.
3. Migrate it in this wave.
4. Defer it.

Do not create new dashboard seed or dashboard store data to solve dynamic data bugs.

## Wave discipline

Split implementation plans into small waves with one ownership change per wave.

Good wave examples:

- Create Alerts feature and fix alert count, filtering, and sorting.
- Move Quran sessions behind a Quran service and summary API.
- Replace dashboard progress with planner-derived progress.

Bad wave example:

- Rebuild Dashboard, Quran, Records, Reports, Portfolio, and Alerts in one pass.

Each wave must list:

- Files expected to change.
- Files that must not change.
- Tests to write first.
- User-visible acceptance criteria.
- Source-of-truth decision.

## Gap-risk section

Before coding, every plan must include a short gap-risk section that lists ambiguities and asks for decisions when needed.

Examples:

- Should household-level alerts count in selected-child mode?
- Should All children be the default dashboard selection?
- Should progress count skipped lessons, completed lessons only, or both?
- Should Records & Proof link to `/records`, `/reports`, or the owning feature pages?

Do not let ambiguity turn into an implementation assumption.

## Final rule

The planning agent may inspect the relevant codebase, but it must not wander. It should trace only the files and flows related to the requested change, then produce a plan grounded in what it actually found.
