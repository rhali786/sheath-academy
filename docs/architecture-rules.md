# Architecture rules

Detailed rules for type ownership, data access, and cross-feature imports. Consult during feature planning and audits.

---

## Type ownership

New domain types belong in the owning feature folder: `features/<feature>/types.ts`

- Planner types → `features/planner/types.ts`
- Attendance types → `features/attendance/types.ts`
- Subject/course types → `features/subjects/types.ts`
- Portfolio types → `features/portfolio/types.ts`

Use `features/lib/types.ts` **only** for shared infrastructure: `ApiResponse`, `Workspace`, `HouseholdProfile`, `StudentProfile`, shared chart/UI data contracts.

If a feature needs another feature's domain type, import it from the owning feature. Do not duplicate it.

```ts
// Correct
import type { LessonTask } from '@/features/planner/types'
import type { SubjectCourse } from '@/features/subjects/types'

// Wrong — do not copy types or add second definitions to features/lib/types.ts
```

Before creating any type, answer:
1. Which feature owns this domain concept?
2. Does this type already exist elsewhere?
3. Is this a domain entity, API DTO, form state, or UI-only view model?
4. If there is an existing duplicate, which one is canonical?

If there is ambiguity, stop and report it before writing code.

---

## Data-access ownership

Do not call raw stores directly from API route handlers or UI code.

**Preferred flow:**
```
UI component → front service/client → API route → feature service → feature repository → Postgres
```

API route handlers should be thin: parse/validate the request, call the feature service, return the standard API response shape.

- First look for an existing service function. If one exists, use it.
- If one does not exist, add or extend a feature service function.
- Do **not** create a second store for the same entity.
- Do **not** bypass validation by importing a store directly into UI-facing routes.

---

## Postgres readiness

Do not design new features so that a Postgres migration requires rewriting UI components or API routes. Keep persistence behind server-side feature services.

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

Prefer `@/features/...` for cross-feature imports and relative imports inside the same feature.

```ts
// Cross-feature — use alias
import type { SubjectCourse } from '@/features/subjects/types'

// Same feature — use relative
import type { LessonTask } from '../types'
```

Cross-feature imports at the client layer (a dashboard card calling `plannerApi`) are fine — established pattern. Cross-feature imports at the server layer (a route handler importing another feature's store directly) are not.

Before adding any cross-feature import, grep for the existing pattern in the same layer and use the same path style.

---

## Refactor restraint

Do not perform broad type or data-access refactors while implementing a feature unless the feature plan explicitly includes that refactor.

If you discover duplicate types, inconsistent imports, or direct store usage during the audit:
1. Report the issue.
2. State whether it blocks the current feature.
3. If it does not block the feature, leave it untouched.
4. If it does block the feature, propose the smallest safe change and wait for approval.

---

## Architecture findings (required output)

After every pre-implementation audit, include a short **"Architecture Findings"** block covering:
- Type owner decisions and any duplicate type risks
- Existing import pattern followed
- Existing service function used or extended
- Whether raw store access was avoided
- Whether the design remains Postgres-ready
