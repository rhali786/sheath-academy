# Planning standards & examples (plan-builder reference)

## Acceptance criteria

Use observable behavior. Avoid broad statements ("make dashboard dynamic", "fix filtering", "wire data correctly"). Prefer concrete, clickable statements:

- Selecting Child A shows Child A data; selecting Child B hides Child A data.
- Selecting All Children aggregates active children; archived children are excluded.
- Empty source data shows zero, not seeded fallback.
- Sorting changes visible order; counts match the owning API response.
- Moving a lesson to a new date removes it from the old date and shows it on the new date after refresh.

## Empty states

Every list view, dashboard card, and report section needs a designed empty state that explains why it's empty and names/links the next action. Do not show seeded fallback data when the real source is empty.

- "No portfolio evidence yet. Add a note or link to preserve proof of learning."
- "No completed lessons yet. Mark a lesson complete to begin building history."

## Accessibility & mobile

Every UI-changing plan must include: keyboard-navigable interactive elements; ARIA labels for icon-only buttons; text labels on status badges (color is never the only signal); touch targets ≥ 44px on mobile; defined mobile behavior for lists, grids, filters, action buttons.

## Date & time

Plans involving dates must specify storage format, display timezone, range inclusivity, definition of "today", and school-year boundaries. Defaults:

- Store timestamps in UTC; store local calendar dates as `YYYY-MM-DD` for school days.
- Display in the household's local timezone; "today" is relative to the household timezone, not the server.
- School-year start/end dates are inclusive.

## Out-of-scope discipline

Every plan says what is *not* being built, to prevent overbuilding. E.g. no file/photo upload until storage architecture is decided; no PDF download until rendering approach is chosen; no duplicate dashboard stores.

## File-inspection scope

Do not perform broad repo exploration. Start with only the folders/files needed for the slice. Inspect another file only if a direct import points there, a test failure requires it, or implementation cannot proceed without it. Before touching files outside expected scope (auth, payments, AI, notifications, deployment, theme-only, unrelated shell), state why it's necessary.

## Manual QA

Click-by-click and tied to acceptance criteria.

- **Good:** "1. Open Dashboard. 2. Select Child A. 3. Confirm only Child A lessons appear. 4. Select Child B. 5. Confirm Child A lessons disappear. 6. Select All Children. 7. Confirm active children are grouped separately."
- **Bad:** "Check dashboard. Make sure it works. Verify data."

## Branch naming

```
feature/<feature-number>-<short-name>
fix/<area>-<bug-short-name>
enhancement/<area>-<short-name>
refactor/<area>-<short-name>
test/<area>-<short-name>
```

e.g. `feature/24-progress-by-subject`, `fix/dashboard-child-selector-stale-data`, `refactor/dashboard-compose-feature-widgets`.

One branch per coherent slice. Do not mix unrelated fixes unless the plan requires it.

## Commit discipline

Commit at stable checkpoints, not random intervals: after failing tests added; after data model passes; after API/store behavior passes; after UI behavior passes; after Playwright regression passes; after cleanup with all tests green.

Names describe behavior. Good: `test(progress): cover subject summary counts`, `feat(dashboard): compose progress and attendance cards`, `fix(attendance): exclude archived children from all-children summary`. Avoid: `updates`, `fix stuff`, `wip`, `changes`.

## Waves, phases & slicing

A wave/phase produces a usable capability, not scattered files.

- **Good grouping:** attendance model + mark attendance + optional minutes + summary; progress by subject + completed history + dashboard cards.
- **Bad grouping:** dashboard shell + subject model + onboarding + unrelated settings in one sprint.

When a feature has a split warning, split it: text/link evidence now, file upload later; print-friendly report now, PDF later; basic recurrence now, exceptions later.
