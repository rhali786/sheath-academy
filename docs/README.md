# Docs Workflow

Use this folder for planning documents, process rules, and project documentation that should live with the repo.

## Folder structure

```txt
docs/
  README.md
  planning-quality-rule.md
  bug_enhancement/
  archive/
```

### Planning rules → the `plan-builder` skill

Use the **`plan-builder`** skill (`/plan-builder`) before creating any implementation plan. (The old `docs/planning-quality-rule.md` is now a pointer stub to that skill.)

Every non-trivial bug fix, enhancement, dashboard change, records/report change, cross-feature change, or architecture migration plan should follow that skill.

Plans must be grounded in the actual code path, not memory or assumptions.

### `bug_enhancement/`

Use this folder for active bug-fix and enhancement plans.

Create one document per coherent implementation slice.

Name each active plan with a datetime prefix so plans sort chronologically:

```txt
YYYYMMDD-HHMM-short-description.md
```

Example:

```txt
20260517-1430-cross-feature-linked-filtering.md
20260517-1515-dashboard-learning-activity-redesign.md
```

Use the household/project local time unless the task explicitly needs UTC.

### `archive/`

Move completed, superseded, or no-longer-active planning documents here.

After a plan is implemented, tested, and no longer active, move it to `docs/archive/` instead of leaving it in the active docs area.

If a plan is replaced by a newer plan, move the old one to archive and create the replacement in `docs/bug_enhancement/` with a new datetime-prefixed filename.

## Plan lifecycle

1. Use the `plan-builder` skill (`/plan-builder`).
2. Audit the affected code paths.
3. Create the plan in `docs/bug_enhancement/` using a datetime-prefixed filename.
4. Keep the plan active while implementation is ongoing.
5. When the plan is completed or superseded, move it to `docs/archive/`.

## Naming rules

Use lowercase kebab-case after the datetime prefix.

Good:

```txt
20260517-1430-cross-feature-linked-filtering.md
20260517-1515-dashboard-learning-activity-redesign.md
```

Avoid:

```txt
plan.md
fixes.md
new-dashboard.md
latest.md
```

## Scope rules

Do not use docs as a dumping ground for stale plans.

Only active plans should stay in `docs/bug_enhancement/`.

Only process/rule documents should stay at the root of `docs/`.

Completed or superseded plans belong in `docs/archive/`.
