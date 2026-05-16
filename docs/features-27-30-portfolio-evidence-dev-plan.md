# Dev Plan — Features 27–30: Portfolio Evidence Spine

## Scope

Implement Wave 1D portfolio/proof features:

- Feature 27 — Portfolio evidence data model
- Feature 28 — Add portfolio evidence item
- Feature 29 — Attach evidence to lesson/task
- Feature 30a — Text note + URL evidence

Defer:

- Feature 30b — File/photo upload
- `file_asset` implementation
- storage provider decision
- upload API
- file size limits
- MIME allowlist
- upload progress UI
- thumbnails/previews
- file deletion/storage governance

Feature 30 is intentionally split. Ship text note + URL evidence now. Do not let file/photo storage block the rest of the portfolio.

## Product Goal

Parents should be able to preserve proof of learning and connect it to child, subject, date, and optionally a lesson/task.

The portfolio should not become a random file bucket. Evidence should remain connected to learning records.

## Key MVP Decisions

### UI Location

Portfolio lives inside the existing dashboard experience:

```txt
/dashboard → Portfolio tab
```

Do not create a separate top-level `/portfolio` route unless the app already has that route pattern.

### Evidence Entity

Use one canonical entity:

```ts
EvidenceItem
```

Storage name:

```ts
evidence_item
```

### Evidence Type Enum

Use a simple MVP enum:

```ts
type EvidenceType =
  | "note"
  | "link"
  | "writing_sample"
  | "project"
  | "recitation"
  | "other";
```

Do not include `photo` or `document` until file/photo upload is actually implemented. Those belong with Feature 30b after storage architecture is ready.

### Required Fields

Required at create time:

```txt
title
childId
subjectId
date
type
```

Defaulted:

```txt
createdBy = parent/demo user/current user context
```

Optional:

```txt
notes
url
lessonTaskId
```

System-generated:

```txt
id
createdAt
updatedAt
```

### Subject Requirement

`subjectId` is required.

Reason: portfolio evidence should remain connected to learning records. If general/family evidence is needed later, create a `General` subject rather than allowing blank subject references.

### Lesson/Task Attachment

`lessonTaskId` is optional.

Evidence can exist at the child/subject/date level without being attached to a specific lesson. When attached, one evidence item points to at most one lesson task. Many evidence items may point to the same lesson task.

Use:

```ts
lessonTaskId?: string;
```

### Type-Specific Rules

If `type === "link"`, require `url`.

If `type === "note"`, require `notes` unless a URL is present.

For other types, `notes` and `url` are optional, but at least one of `notes` or `url` is encouraged by UI copy.

### URL Evidence

Support optional URL evidence for Feature 30a.

Allow only:

```txt
http://
https://
```

Reject:

```txt
javascript:
file:
data:
mailto:
```

Render links safely. External links should open in a new tab with appropriate `rel` attributes if applicable.

### Notes

Notes are plain text only.

No markdown rendering yet.

### Created By

Store `createdBy` now, even if the only user is the parent/demo user.

If no auth/current-user system exists yet, use:

```ts
createdBy: "demo-parent"
```

Do not show `createdBy` in the UI yet unless there are already multiple roles/users.

---

# Feature 27 — Portfolio Evidence Data Model

## Goal

Create the canonical proof-of-learning object.

## Recommended Module

```txt
src/features/portfolio/
```

Suggested files:

```txt
src/features/portfolio/types.ts
src/features/portfolio/store.ts
src/features/portfolio/validation.ts
src/features/portfolio/utils.ts
src/features/portfolio/components/
```

## TypeScript Model

```ts
export type EvidenceType =
  | "note"
  | "link"
  | "writing_sample"
  | "project"
  | "recitation"
  | "other";

export interface EvidenceItem {
  id: string;
  title: string;
  childId: string;
  subjectId: string;
  date: string; // YYYY-MM-DD
  type: EvidenceType;
  notes?: string;
  url?: string;
  lessonTaskId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
```

## ID Format

Use:

```ts
evidence_item_${Date.now()}_${counter}
```

## Validation

Validate:

```txt
title required, trimmed, max 120 chars
childId exists
subjectId exists
subjectId belongs to childId
date is valid YYYY-MM-DD
type is valid EvidenceType
notes optional plain text
url optional valid http/https URL
if type is link, url is required
if type is note, notes are required unless url exists
lessonTaskId optional, but if present must exist
lessonTask childId must match evidence childId
createdBy present
```

Normalize optional strings:

```ts
notes: notes?.trim() || undefined
url: url?.trim() || undefined
```

## Done Means

```txt
- EvidenceItem type exists.
- Evidence store exists.
- Evidence can be listed, created, updated, and deleted.
- Evidence stores title, child, subject, date, type, notes, createdBy.
- Optional URL and lessonTaskId are supported.
- Type-specific validation works.
- No file/photo upload is implemented.
```

---

# Feature 28 — Add Portfolio Evidence Item

## Goal

Parent can quickly add proof after learning happens.

## MVP UI Pattern

Use a single-screen form, not a wizard.

Recommended fields:

```txt
Title
Child
Subject
Date
Evidence type
Notes
URL
Optional linked lesson/task
```

Required:

```txt
Title
Child
Subject
Date
Type
```

Optional:

```txt
Notes
URL
Linked lesson/task
```

## Placement

Primary placement:

```txt
Dashboard → Portfolio tab
```

The Portfolio tab should include both:

```txt
Add Evidence form
Evidence list
```

The user should not save evidence into a void.

Optional secondary entry points, only if easy:

```txt
Completed lesson history row: Add evidence
Lesson detail page: Add evidence
```

For this sprint, the Portfolio tab form is enough.

## UX Copy

Use clear wording:

```txt
Add evidence
Preserve proof of learning for a child, subject, and date.
```

For URL:

```txt
Link evidence (optional)
Paste a web link, shared document link, or resource URL.
```

For notes:

```txt
Notes (optional)
Briefly describe what this evidence shows.
```

Do not display photo/document upload controls yet.

## Done Means

```txt
- Parent can add evidence item.
- Required fields are validated.
- Type-specific validation works.
- Optional note and URL can be saved.
- Created evidence appears in the Portfolio list.
- Form resets or navigates cleanly after save.
```

---

# Feature 29 — Attach Evidence to Lesson/Task

## Goal

Evidence can connect to one lesson/task so proof does not become detached from assigned/completed work.

## MVP Relationship

Use:

```ts
lessonTaskId?: string;
```

This means:

```txt
many evidence items can point to one lesson_task
one evidence item points to at most one lesson_task
```

Do not build many-to-many evidence linking yet.

## Attachment UI

In the evidence form, provide an optional lesson/task selector filtered by:

```txt
selected child
selected subject
near selected date if possible
```

Minimum viable selector:

```txt
Linked lesson/task (optional)
[Select from this child’s lessons]
```

Display label:

```txt
Lesson title — Subject — Date
```

## Linked Evidence Display

If there is an existing lesson detail or lesson edit page, show linked evidence there.

If there is no lesson detail page, show linked evidence in the completed lesson history row/card.

Recommended display:

```txt
Evidence
- Writing sample: Multiplication worksheet
- Recitation: Surah Al-Fatihah review
```

A simple “Evidence: 2” indicator with expandable/listed items is enough.

Do not create a complex evidence gallery.

## Done Means

```txt
- Evidence can link to one lesson_task.
- Linked lesson_task must exist.
- Linked lesson_task must belong to the same child.
- Lesson view or completed lesson history shows attached evidence.
- Evidence remains visible in Portfolio even if not linked to a lesson.
```

---

# Feature 30a — Text Note + URL Evidence

## Goal

Ship useful evidence capture without blocking on file storage.

## Scope

Implement:

```txt
plain text evidence notes
URL evidence
evidence type selection
portfolio display
child/subject filters
newest-first sorting
```

Do not implement:

```txt
file upload
photo upload
file_asset
storage provider
upload API
upload progress
file previews
thumbnail generation
MIME validation
file deletion
storage cost handling
```

## Portfolio Display

Evidence list item should show:

```txt
title
type
child name
subject name
date
notes preview if present
URL indicator/link if present
linked lesson indicator if present
```

## Filters

MVP filters:

```txt
child
subject
```

Optional if easy:

```txt
type
date range
```

## Sort

Default:

```txt
newest first
```

## Empty State

Use:

```txt
No portfolio evidence yet.
Add a note or link to preserve proof of learning.
```

## Done Means

```txt
- Parent can save text note evidence.
- Parent can save URL evidence.
- Portfolio list shows saved evidence.
- Portfolio list filters by child and subject.
- File/photo upload is clearly not shown as available.
```

---

# Store/API Functions

Recommended functions:

```ts
listEvidenceItems(): EvidenceItem[];

getEvidenceItemById(id: string): EvidenceItem | undefined;

createEvidenceItem(input: CreateEvidenceItemInput): EvidenceItem;

updateEvidenceItem(id: string, input: UpdateEvidenceItemInput): EvidenceItem;

deleteEvidenceItem(id: string): void;

listEvidenceByChild(params: {
  childId: string;
}): EvidenceItem[];

listEvidenceBySubject(params: {
  childId?: string;
  subjectId: string;
}): EvidenceItem[];

listEvidenceByLessonTask(params: {
  lessonTaskId: string;
}): EvidenceItem[];
```

Input type:

```ts
export interface CreateEvidenceItemInput {
  title: string;
  childId: string;
  subjectId: string;
  date: string;
  type: EvidenceType;
  notes?: string;
  url?: string;
  lessonTaskId?: string;
}
```

---

# Components

Recommended components:

```txt
EvidenceForm
EvidenceTypeSelect
EvidenceLessonTaskSelect
EvidenceList
EvidenceListItem
EvidenceFilters
LinkedEvidenceList
```

Keep components plain and fast.

Use Tailwind forms/cards. No heavy galleries.

---

# TDD Requirement

Use TDD for this slice.

Before implementing each step, write or update the smallest relevant failing test first.

Recommended order:

```txt
1. Validation tests
2. Store/CRUD tests
3. Selector/filter tests
4. UI tests only where existing test infrastructure supports them
```

Do not skip tests unless the repo has no working test setup. If test setup is missing or broken, report that clearly and proceed with manual-testable implementation.

Do not add broad test infrastructure unless absolutely necessary.

## Recommended Tests

Evidence validation:

```txt
- rejects blank title
- rejects invalid type
- rejects invalid URL protocol
- rejects link type without URL
- rejects note type without notes unless URL exists
- rejects subjectId that does not belong to childId
- rejects lessonTaskId that belongs to another child
```

Evidence store:

```txt
- creates evidence item
- updates evidence item
- deletes evidence item
- lists evidence by child
- lists evidence by subject
- lists evidence by lessonTask
```

Portfolio UI:

```txt
- form requires title, child, subject, date, type
- can save note evidence
- can save URL evidence
- displays saved evidence in list
- linked lesson evidence appears on lesson/completed-history surface
- no file/photo upload control is shown
```

---

# File Inspection Constraint

Do not perform broad repo exploration.

Start by inspecting only these folders/files:

```txt
src/features/portfolio/
src/features/lesson-tasks/
src/features/children/
src/features/subjects/
src/features/records/
src/features/dashboard/
src/lib/
```

Only inspect another file if implementation fails or a direct import points there.

Do not inspect or modify:

```txt
auth
payments
AI
exports
notifications
deployment
theme-only files
unrelated layout files
```

Before touching any file outside the allowed set, state why it is necessary.

Do not refactor unrelated code.

Do not rename existing public APIs unless required.

---

# Build Order

## Step 1 — Feature 27

Build:

```txt
EvidenceItem type
EvidenceType enum
validation
store
seed data
CRUD functions
```

Verify:

```txt
evidence items can be created/listed/updated/deleted
subject belongs to child
URL validates
link type requires URL
note type requires notes unless URL exists
lessonTask link validates if provided
```

## Step 2 — Feature 28

Build:

```txt
EvidenceForm
Portfolio tab add-evidence UI
required field validation
success/empty states
evidence list refresh after save
```

Verify:

```txt
parent can add evidence with required fields
parent can add notes
parent can add URL
saved item appears in list
```

## Step 3 — Feature 29

Build:

```txt
optional lessonTaskId field
lesson/task selector
list evidence by lessonTask
linked evidence display on lesson view or completed lesson history
```

Verify:

```txt
evidence can attach to one lesson_task
linked evidence appears near that lesson
evidence remains accessible in Portfolio
```

## Step 4 — Feature 30a

Build:

```txt
text-note evidence
URL evidence
portfolio filters
safe link rendering
clear omission of file/photo upload UI
```

Verify:

```txt
text and URL evidence work
no file/photo upload UI is shown
portfolio list filters by child/subject
```

---

# Manual QA

```txt
1. Open Dashboard → Portfolio tab.
2. Confirm empty state appears if no evidence exists.
3. Confirm there is no file/photo upload control.
4. Add evidence with missing title. Confirm validation error.
5. Add evidence with title, child, subject, date, type note, and notes.
6. Confirm evidence appears in list.
7. Try type note without notes or URL. Confirm validation error.
8. Add URL evidence with invalid URL protocol. Confirm validation error.
9. Add URL evidence with https:// link. Confirm it saves and renders safely.
10. Add evidence for Child A and Subject A.
11. Switch filter to Child B. Confirm Child A evidence disappears.
12. Switch back to Child A. Confirm evidence appears.
13. Attach evidence to a lesson_task.
14. Open lesson view or completed lesson history.
15. Confirm attached evidence appears near the lesson.
16. Confirm evidence still appears in Portfolio list.
17. Refresh the page and confirm evidence persists according to current app store behavior.
```

---

# Out of Scope

Do not implement:

```txt
file/photo upload
file_asset
S3/R2/storage provider
upload progress
thumbnail generation
MIME allowlist
file deletion
PDF export
portfolio report
AI reflection
rubric grading
sharing
role permissions
many-to-many lesson evidence links
photo/document evidence types
```

---

# Implementation Prompt

Implement Features 27–30 as the Portfolio Evidence Spine.

Use TDD. Before implementing each step, write or update the smallest relevant failing test first. Add focused tests for validation, store behavior, selector/filter behavior, and core UI flows where existing test infrastructure supports it. If test setup is missing or broken, report that clearly and proceed with manual-testable implementation. Do not add broad test infrastructure unless absolutely necessary.

Inspect only files needed for this slice. Start with `src/features/portfolio/`, `src/features/lesson-tasks/`, `src/features/children/`, `src/features/subjects/`, `src/features/records/`, `src/features/dashboard/`, and `src/lib/`. Do not broadly explore or refactor unrelated areas. Do not inspect or modify auth, payments, AI, exports, notifications, deployment, theme-only files, or unrelated layout files. Before touching any file outside the allowed set, state why it is necessary.

Feature 27 creates the `EvidenceItem` / `evidence_item` model. Use fields: id, title, childId, subjectId, date, type, notes, url, lessonTaskId, createdBy, createdAt, updatedAt. Required fields are title, childId, subjectId, date, and type. Use evidence type values: note, link, writing_sample, project, recitation, other. Store date as YYYY-MM-DD. Validate that subjectId belongs to childId. Validate url as http/https only. If type is link, require url. If type is note, require notes unless URL exists. Validate lessonTaskId if provided.

Feature 28 adds a single-screen Add Evidence form in Dashboard → Portfolio tab. Parent can add evidence with title, child, subject, date, type, optional notes, optional URL, and optional linked lesson/task. Saved evidence should appear in the Portfolio list immediately.

Feature 29 allows one evidence item to link to one lesson_task using optional lessonTaskId. Many evidence items may point to the same lesson_task. Show linked evidence on the lesson view if it exists; otherwise show it in completed lesson history near the relevant lesson. Evidence should remain visible in Portfolio even if not linked to a lesson.

Feature 30 must be split. Implement only Feature 30a now: text note and URL evidence. Do not implement file/photo upload, file_asset, storage provider, upload API, thumbnails, MIME validation, upload progress, or photo/document evidence types. Do not show a file/photo upload UI yet. Keep the portfolio list filterable by child and subject and sorted newest first.
