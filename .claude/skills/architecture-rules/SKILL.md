---
name: architecture-rules
description: Use during feature planning and pre-implementation audits in Sheath Academy. Rules for type ownership (where domain types live), data-access ownership (UI → service → repository, never raw stores in routes/UI), Postgres readiness, cross-feature imports, refactor restraint, and the required Architecture Findings audit block.
---

# Architecture rules

Rules for type ownership, data access, and cross-feature imports. Consult during feature planning and audits (pairs with the `plan-builder` skill).

---

## Type ownership

New domain types belong in the owning feature folder: `features/<feature>/types.ts` (Planner → `features/planner/types.ts`, Attendance → `features/attendance/types.ts`, Subjects/courses → `features/subjects/types.ts`, Portfolio → `features/portfolio/types.ts`).

Use `features/lib/types.ts` **only** for shared infrastructure: `ApiResponse`, `Workspace`, `HouseholdProfile`, `StudentProfile`, shared chart/UI data contracts.

If a feature needs another feature's domain type, import it from the owning feature. Do not duplicate it.

```ts
// Correct
import type { LessonTask } from '@/features/planner/types'
import type { SubjectCourse } from '@/features/subjects/types'
// Wrong — do not copy types or add second definitions to features/lib/types.ts
```

Before creating any type, answer: which feature owns this concept? does it already exist elsewhere? is it a domain entity, API DTO, form state, or UI-only view model? if a duplicate exists, which is canonical? If there is ambiguity, stop and report it before writing code.

---

## Data-access ownership

Do not call raw stores directly from API route handlers or UI code.

```
UI component → front service/client → API route → feature service → feature repository → Postgres
```

API route handlers stay thin: parse/validate the request, call the feature service, return the standard API response shape.

- First look for an existing service function; if one exists, use it.
- If not, add or extend a feature service function.
- Do **not** create a second store for the same entity.
- Do **not** bypass validation by importing a store directly into UI-facing routes.

---

## Postgres readiness

Do not design new features so a Postgres migration requires rewriting UI components or API routes. Keep persistence behind server-side feature services.

- No direct array mutation outside store/adapters.
- No synchronous-only persistence assumptions in route design.
- No UI importing server stores.
- No API route returning raw internal store objects.

Name service functions around domain operations, not store mechanics:

```ts
// Prefer
listEvidenceItems(filters)
createEvidenceItem(input)
// Avoid
evidenceStore.getAll()
evidenceStore.insert()
```

---

## Cross-feature imports

Use `@/features/...` for cross-feature imports; relative imports inside the same feature.

```ts
import type { SubjectCourse } from '@/features/subjects/types'  // cross-feature — alias
import type { LessonTask } from '../types'                      // same feature — relative
```

Cross-feature imports at the **client** layer (a dashboard card calling `plannerApi`) are fine — established pattern. Cross-feature imports at the **server** layer (a route handler importing another feature's store directly) are not. Before adding any cross-feature import, grep for the existing pattern in the same layer and match the path style.

---

## Refactor restraint

Do not perform broad type or data-access refactors while implementing a feature unless the feature plan explicitly includes that refactor. If you discover duplicate types, inconsistent imports, or direct store usage during the audit:

1. Report the issue.
2. State whether it blocks the current feature.
3. If it does not block, leave it untouched.
4. If it does block, propose the smallest safe change and wait for approval.

---

## Architecture findings (required output)

After every pre-implementation audit, include a short **"Architecture Findings"** block covering:

- Type-owner decisions and any duplicate-type risks.
- Existing import pattern followed.
- Existing service function used or extended.
- Whether raw store access was avoided.
- Whether the design remains Postgres-ready.
