# Features 12 + 13 — Implementation Plan
## Lesson/Task Data Model + Add Lesson/Task

**Status:** Ready for implementation  
**Data layer:** In-memory store (consistent with Features 1–6)  
**Prerequisites:** Features 1–6 built and passing — user account, workspace, child profiles, subjects  
**Wave:** 1B — Planning Spine

---

## 1. Locked product decisions

These decisions are final. Claude Code must not re-open them.

- One canonical entity: `LessonTask` / `lesson_task`. Product copy may say "lesson" or "task." Code uses `LessonTask` everywhere.
- Do not split into separate Lesson and Task entities.
- Required fields: `title`, `childId`, `subjectId`, `date`.
- Default status on create: `not_started`.
- MVP status enum: `not_started | completed | skipped`. Do not add `moved` yet.
- Store `subjectId`, not subject name. Validate that `subject.childId === lessonTask.childId` at the service layer.
- Store dates as `YYYY-MM-DD` strings. The client determines today's date — not the server. Never use `new Date().toISOString().split('T')[0]` on the server side for a default date.
- Optional fields: `notes?: string`, `resourceLink?: string`. Normalize empty strings to `undefined` in the service — never store `""`.
- Validate resource links as `http://` or `https://` only. Reject `javascript:`, `file:`, `mailto:`.
- Generate IDs as `lesson_task_${Date.now()}_${counter}`. This format is **in-memory MVP only**. When Postgres is introduced, IDs will migrate to UUIDs. Do not let future code depend on the string format of these IDs.
- Seed lightly: 3–5 items, current-week dates, at least two different children represented.
- Leave the existing dashboard `Task` model completely alone. Do not refactor it. Do not reference it. Do not replace it.

---

## 2. Scope

### In scope
- `features/lesson-tasks/` module — all server, API, and front sub-directories
- `LessonTask` TypeScript types and validation schemas
- In-memory store and seed data
- Server service: list, get, create, update, delete
- API route handlers: full CRUD
- API route registration in the catch-all router
- Parent-facing page: view, add, edit, delete lesson/tasks
- Navigation entry in Header

### Out of scope — do not build these
- Separate Lesson and Task entities
- Rescheduling / `moved` status behavior
- Status transition timestamps
- Multiple resource links or file uploads
- Dashboard Task replacement or refactor
- Recurring patterns (Feature 17)
- Attendance, progress, portfolio, or reporting integration
- Persisted week-index fields

---

## 3. Existing codebase patterns to follow

- `app/` stays thin — routing only
- Business logic and UI live under `features/`
- Feature modules follow the existing `server/`, `api/`, `front/` structure already established by Features 1–6
- Stores use the shared in-memory store factory already in the project
- API responses use the existing response envelope (see Section 7)
- The `LessonTask` service validates subject/child matching — this is service-layer logic, not UI-layer logic
- Seed IDs reference real child and subject seed IDs from the existing seed files

---

## 4. Data model

### Core type

```typescript
export type LessonTaskStatus = 'not_started' | 'completed' | 'skipped'

export interface LessonTask {
  id: string
  childId: string
  subjectId: string
  title: string
  date: string         // YYYY-MM-DD
  status: LessonTaskStatus
  notes?: string       // undefined if not provided, never ""
  resourceLink?: string // undefined if not provided, never ""
  createdAt: string    // ISO timestamp
  updatedAt: string    // ISO timestamp
}

export interface CreateLessonTaskInput {
  childId: string
  subjectId: string
  title: string
  date: string
  status?: LessonTaskStatus  // defaults to not_started
  notes?: string
  resourceLink?: string
}

export interface UpdateLessonTaskInput {
  childId?: string
  subjectId?: string
  title?: string
  date?: string
  status?: LessonTaskStatus
  notes?: string
  resourceLink?: string
}
```

### Validation rules — enforced at the service layer

| Field | Rule |
|---|---|
| `title` | Required. Trim whitespace. Min 1 char after trim. Max 120 chars. |
| `childId` | Required. Child must exist in the child store. |
| `subjectId` | Required. Subject must exist in the subject store. |
| Subject/child match | `subject.childId` must equal `lessonTask.childId`. Reject if mismatch. |
| `date` | Required. Must match `YYYY-MM-DD` format. Must be a valid calendar date. |
| `status` | Must be one of `not_started`, `completed`, `skipped`. |
| `notes` | Optional. Normalize empty/whitespace-only string to `undefined`. |
| `resourceLink` | Optional. Normalize empty string to `undefined`. If provided, must begin with `http://` or `https://`. Reject `javascript:`, `file:`, `mailto:`, and any other scheme. |

### ID generation

```typescript
// features/lesson-tasks/server/ids.ts
let counter = 0

export function generateLessonTaskId(): string {
  counter++
  return `lesson_task_${Date.now()}_${counter}`
}

export function resetIdCounter(): void {
  counter = 0
}
```

The service generates the ID once. The store persists it. The API returns it. The UI uses `lessonTask.id` for edit and delete operations.

---

## 5. File structure

### New files

```
features/lesson-tasks/
  types.ts
  server/
    ids.ts
    seed.ts
    store.ts
    service.ts
  api/
    router.ts
    routes/
      lesson-tasks.ts      // collection: GET, POST
      lesson-task.ts       // item: GET, PUT/PATCH, DELETE
  front/
    pages/
      LessonTasksPage.tsx
    components/
      LessonTaskForm.tsx
      LessonTaskList.tsx
    services/
      api.ts
  __tests__/
    service.test.ts
    api.test.ts
    LessonTasksPage.test.tsx
    LessonTaskForm.test.tsx
    LessonTaskList.test.tsx

app/
  (shell)/
    lessons/
      page.tsx
```

### Files to modify

```
app/api/[...slug]/route.ts       — register lesson-tasks router
features/lib/seedIds.ts          — add lesson-task seed IDs if not present
features/layout/front/components/Header.tsx  — add Lessons nav entry
features/layout/__tests__/Header.test.tsx    — add Lessons nav tests
```

Only modify subject seed files if reusable subject seed IDs are not already cleanly available.

---

## 6. Service functions

```typescript
// features/lesson-tasks/server/service.ts

getLessonTasks(filters?: {
  childId?: string
  subjectId?: string
  date?: string
}): LessonTask[]

getLessonTask(id: string): LessonTask | null

createLessonTask(input: CreateLessonTaskInput): LessonTask | null

updateLessonTask(id: string, patch: UpdateLessonTaskInput): LessonTask | null

deleteLessonTask(id: string): boolean

resetStore(seed?: LessonTask[]): void
```

### Update rules
- Refresh `updatedAt` on every successful update
- Preserve `createdAt` — never modify it
- Validate the full resulting entity after applying the patch, not just the patch fields
- Validate child/subject relationship on update — a patch that changes `childId` or `subjectId` must re-validate that they still match
- Hard delete for MVP (no soft delete / archive on lesson tasks yet)

---

## 7. API contract

### Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/lesson-tasks` | List lesson tasks, with optional query filters |
| POST | `/api/lesson-tasks` | Create a lesson task |
| GET | `/api/lesson-tasks/:id` | Get a single lesson task |
| PATCH | `/api/lesson-tasks/:id` | Update a lesson task |
| DELETE | `/api/lesson-tasks/:id` | Delete a lesson task |

### Response envelope

```typescript
{
  status: 'success' | 'error'
  data: T | null
  message: string
  timestamp: string
}
```

### HTTP status mapping

| Situation | Status |
|---|---|
| Success | 200 |
| Created | 201 |
| Validation error | 400 |
| Not found | 404 |
| Server error | 500 |

### Query filters (GET /api/lesson-tasks)

All optional. All filter by exact match.

- `?childId=` — filter by child
- `?subjectId=` — filter by subject
- `?date=` — filter by date (YYYY-MM-DD)

Filters are AND-combined when multiple are provided.

---

## 8. Seed data

Keep it minimal. Real child and subject seed IDs only — no hardcoded string IDs that don't reference existing seeds.

```
5 lesson tasks total:
  - 2 for Child 1 (Adam), different subjects
  - 2 for Child 2 (Khadijah), different subjects
  - 1 for Child 3 (Zayd) if seeded, otherwise Child 1

Status distribution:
  - 3 × not_started
  - 1 × completed
  - 1 × skipped

Dates: all within the current school week (Mon–Fri)

Optional fields:
  - 1 item with notes
  - 1 item with a valid https:// resource link
  - All others: notes and resourceLink omitted (undefined, not "")
```

Two children must have seeds so the subject-filters-by-child interaction is visible and testable from first load.

---

## 9. UI specification

### Page: `/lessons`

**First load state — before any user data exists:**

```
[Page heading] Lessons
[Subheading] Plan your week — add a lesson or task for any child and subject.

[Add form — visible immediately, not behind a button]
  Child: [dropdown — all active children]
  Subject: [dropdown — filtered by selected child, updates on child change]
  Date: [date picker — defaults to client-determined today]
  Title: [text input — placeholder: "e.g. Chapter 4 reading, math worksheet"]
  Status: [dropdown — defaults to not_started, label: "Not started"]
  Notes: [textarea — optional, placeholder: "Page numbers, instructions, reminders"]
  Resource link: [text input — optional, placeholder: "https://"]
  [Add lesson button]

[Lesson list — below form]
  [Empty state if no lessons]:
    "No lessons yet. Add your first one above."
```

**List item display:**

Each lesson task in the list shows:
- Title (prominent)
- Child name
- Subject name
- Date (formatted as "Mon, May 12" — not raw YYYY-MM-DD)
- Status badge (`Not started` / `Completed` / `Skipped`)
- Notes excerpt (first 80 chars, truncated with ellipsis if longer)
- Resource link (rendered as a safe anchor — `rel="noopener noreferrer" target="_blank"`)
- Edit button
- Delete button (with confirmation — "Delete this lesson?" yes/cancel)

**Edit mode:**
- Clicking Edit populates the form with the lesson's existing values
- Form heading changes to "Edit lesson"
- Submit button label changes to "Save changes"
- Cancel button appears — cancels edit, returns form to blank add state

**Error state (API failure):**
- "Something went wrong loading your lessons. Please refresh."

### Subject dropdown behavior

The subject dropdown must:
1. Start filtered to the first child in the list on page load
2. Re-filter immediately when the child selection changes
3. Reset to the first subject of the new child when child changes — never carry over a subject from a different child
4. Show "No subjects for this child" as a disabled option if the selected child has no subjects

### Empty state copy

| Context | Copy |
|---|---|
| No lessons at all | "No lessons yet. Add your first one above." |
| No subjects for selected child | "No subjects found for this child. Add subjects first." |
| Filter returns no results | "No lessons match the current filter." |

---

## 10. Test plan

Write tests **before** implementation code. Follow this order strictly:

1. Service tests (failing) → implement service → service tests pass
2. API tests (failing) → implement API routes → API tests pass
3. Integration tests (failing) → implement UI → integration tests pass

### Service tests

```
Listing
  ✓ returns seeded lesson tasks
  ✓ filters by childId
  ✓ filters by subjectId
  ✓ filters by date
  ✓ AND-combines multiple filters
  ✓ returns empty array when no matches

Creating
  ✓ generates ID with lesson_task_ prefix
  ✓ defaults status to not_started
  ✓ trims title whitespace
  ✓ stores createdAt and updatedAt as ISO strings
  ✗ rejects blank title (after trim)
  ✗ rejects title over 120 characters
  ✗ rejects missing childId
  ✗ rejects missing subjectId
  ✗ rejects non-existent child
  ✗ rejects non-existent subject
  ✗ rejects subject belonging to different child
  ✗ rejects invalid date format
  ✗ rejects invalid status value
  ✓ normalizes empty notes to undefined
  ✓ normalizes whitespace-only notes to undefined
  ✓ accepts valid http:// resource link
  ✓ accepts valid https:// resource link
  ✗ rejects javascript: resource link
  ✗ rejects file: resource link
  ✗ rejects mailto: resource link
  ✓ normalizes empty resource link to undefined

Updating
  ✓ updates specified fields
  ✓ refreshes updatedAt
  ✓ preserves createdAt
  ✓ validates child/subject relationship after patch
  ✗ rejects update with cross-child subject
  ✗ rejects update with blank title
  ✓ returns null for non-existent ID

Deleting
  ✓ removes the lesson task
  ✓ returns true on success
  ✓ returns false for non-existent ID

Store
  ✓ resetStore clears all data
  ✓ resetStore reseeds when seed provided
  ✓ ID counter resets
```

### API tests

```
GET /api/lesson-tasks
  ✓ 200 with lesson task array
  ✓ 200 with filtered results (childId, subjectId, date)
  ✓ 200 with empty array when no matches

POST /api/lesson-tasks
  ✓ 201 with created lesson task
  ✗ 400 for missing title
  ✗ 400 for missing childId
  ✗ 400 for missing subjectId
  ✗ 400 for non-existent child
  ✗ 400 for non-existent subject
  ✗ 400 for cross-child subject mismatch
  ✗ 400 for invalid date
  ✗ 400 for invalid status
  ✗ 400 for invalid resource link scheme

GET /api/lesson-tasks/:id
  ✓ 200 with lesson task
  ✗ 404 for unknown ID

PATCH /api/lesson-tasks/:id
  ✓ 200 with updated lesson task
  ✗ 400 for validation failure
  ✗ 404 for unknown ID

DELETE /api/lesson-tasks/:id
  ✓ 200 on success
  ✗ 404 for unknown ID

App router catch-all
  ✓ DELETE method supported (verify this explicitly)
```

### Integration tests — LessonTasksPage

```
Loading state
  ✓ shows loading indicator while fetching

Error state
  ✓ shows error message on API failure

Empty state
  ✓ shows add form on first load
  ✓ shows empty list message
  ✓ subject dropdown filters by child

Populated state
  ✓ shows list of lesson tasks
  ✓ shows title, child, subject, date, status for each

Creating
  ✓ submits form and adds lesson to list
  ✓ clears form after successful create
  ✗ shows validation error for blank title
  ✗ shows validation error for invalid resource link

Editing
  ✓ clicking Edit populates form with existing values
  ✓ saving updates the list item
  ✓ Cancel returns form to blank add state

Deleting
  ✓ clicking Delete with confirmation removes item

Child/subject interaction
  ✓ changing child re-filters subject dropdown
  ✓ subject selection resets when child changes
```

### Integration tests — LessonTaskForm

```
Blank create mode
  ✓ all fields empty or default
  ✓ date defaults to today
  ✓ status defaults to not_started
  ✓ submit button says "Add lesson"

Edit mode
  ✓ fields pre-populated with existing values
  ✓ submit button says "Save changes"
  ✓ Cancel button visible

No subjects available
  ✓ subject dropdown shows disabled "No subjects" option

Validation errors
  ✗ blank title shows error
  ✗ invalid resource link shows error

Pending/submitting state
  ✓ submit button disabled while submitting
```

### Integration tests — LessonTaskList

```
Empty
  ✓ shows empty state copy

Populated
  ✓ renders title, child name, subject name, date, status badge
  ✓ renders notes excerpt
  ✓ renders resource link as safe anchor (rel=noopener, target=_blank)
  ✓ renders safely when notes/resourceLink undefined

Edit/delete
  ✓ Edit button calls onEdit with lesson task
  ✓ Delete button calls onDelete with confirmation
```

### Integration tests — Header

```
  ✓ Desktop: Lessons link points to /lessons
  ✓ Mobile: menu includes Lessons link
  ✓ Mobile: clicking Lessons closes the menu
```

---

## 11. Implementation sequence

Follow this order exactly. Do not skip ahead.

1. **Confirm plan approved** — do not write code until this document is approved
2. **Write failing service tests** — `features/lesson-tasks/__tests__/service.test.ts`
3. **Implement types, store, service** — until all service tests pass
4. **Write failing API tests** — `features/lesson-tasks/__tests__/api.test.ts`
5. **Implement API routes + register in catch-all router** — until all API tests pass
6. **Write failing integration tests** — LessonTasksPage, LessonTaskForm, LessonTaskList, Header
7. **Implement frontend** — API client, form, list, page, App Router page, Header nav entry
8. **Refactor** — clean up after green, not before
9. **Run `npm run build`** — must pass with zero errors
10. **Run `npm test`** — must pass with zero failures
11. **Run `npm run smoke`** if available
12. **Take a screenshot** — this feature adds visible UI
13. **Commit and open PR**

---

## 12. Definition of done

- [ ] Failing service tests written before any service implementation
- [ ] Failing API tests written before any API implementation
- [ ] Failing integration tests written before any UI implementation
- [ ] `LessonTask` is the only canonical lesson/task entity in the codebase
- [ ] API supports full CRUD (GET list, GET one, POST, PATCH, DELETE)
- [ ] Service enforces all validation rules at the service layer
- [ ] Empty optional strings normalize to `undefined`, never stored as `""`
- [ ] IDs use `lesson_task_${Date.now()}_${counter}` format
- [ ] Seed data: 3–5 items, two children represented, real child and subject seed IDs only
- [ ] Add form visible on first page load without any interaction
- [ ] Subject dropdown filters by selected child
- [ ] Child change resets subject selection
- [ ] Parent can add, edit, and delete lesson tasks
- [ ] Resource links render with `rel="noopener noreferrer" target="_blank"`
- [ ] Dashboard legacy Task model is untouched
- [ ] `npm run build` passes
- [ ] `npm test` passes
- [ ] Screenshot captured and attached to PR

---

## 13. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Feature 11 (weekly planner) route conflicts | Check existing route registration before adding `/api/lesson-tasks`. Confirm no overlap. |
| Subject seed IDs not cleanly available | Check `features/lib/seedIds.ts` first. Only modify subject seed if needed. |
| Cross-child subject bug hidden by UI filtering | Service test for cross-child mismatch is mandatory — cannot rely on dropdown filtering to catch this |
| Timezone causing wrong "today" default | Client determines today's date. Never use server-side `new Date()` for the form default. |
| ID format depended on in future code | Add a comment in `ids.ts`: "In-memory MVP only. Migrate to UUID on Postgres." |
| Scope creep into recurring/reschedule | `moved` status is explicitly out of scope. Recurring patterns are Feature 17. Reject any PR that includes these. |
