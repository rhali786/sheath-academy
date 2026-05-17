# Dev Plan — Features 30–35: Portfolio Completion + Reports Spine

## Scope

Implement the remaining Wave 1D proof/reporting features in two safe slices:

### Group A — Portfolio Completion

- Feature 30a — Text note + URL evidence
- Feature 31 — Parent reflection/note on evidence
- Feature 32 — Portfolio list and filters

### Group B — Reports Spine

- Feature 33 — Basic records report view
- Feature 34a — Print-optimized records summary
- Feature 35 — Thin advisory records review checklist

Reports should be a separate surface, not hidden inside the Records tab.

Recommended route:

```txt
/reports
```

Optional later route structure:

```txt
/reports
/reports/records-summary
/reports/records-summary/print
```

For MVP, a single `/reports` page with a records-summary view is enough.

## Deferred Work

Do not implement in this slice:

- Feature 30b — File/photo upload
- `file_asset`
- storage provider decision
- upload API
- thumbnails/previews
- MIME allowlist
- file size limits
- upload progress indicators
- Feature 34b — PDF download
- server-side PDF rendering
- client-side PDF library
- persistent `report_export` records
- state compliance engine
- legal advice/checking
- role-based report workflows
- AI summaries

## Implementation Guardrails

Use TDD.

Before implementing each step, write the smallest useful failing test first where test infrastructure exists.

Recommended test order:

1. Validation/schema tests
2. Store/selector tests
3. Summary/checklist utility tests
4. Route/component tests only where the repo already supports them

Do not add broad test infrastructure unless necessary.

Inspect only files needed for this slice.

Start with:

```txt
src/features/portfolio/
src/features/lesson-tasks/
src/features/attendance/
src/features/children/
src/features/subjects/
src/features/school-year/
src/features/progress/
src/features/records/
src/features/reports/       if it already exists
src/features/dashboard/     only for navigation/link placement
src/lib/                    only if shared utilities/stores live there
app/ or src/app/            only for adding the Reports route if routes live there
```

Do not broadly explore unrelated folders.

Avoid:

```txt
auth
payments
AI
notifications
deployment
theme-only files
unrelated app shell refactors
```

Before modifying any file outside the needed folders, stop and justify why it is required.

## Architectural Rule

Feature modules own business logic.

Reports compose feature-owned summaries. Reports should not recalculate attendance, progress, completed lessons, or portfolio data with duplicate logic.

Use existing utilities from:

```txt
attendance summary
progress by subject
completed lesson history
portfolio evidence list
children
subjects
school year
```

If a utility is missing, add it to the owning feature module, not directly inside the report page.

---

# Group A — Portfolio Completion

## Feature 30a — Text Note + URL Evidence

### Goal

Allow parents to save useful evidence without waiting on file/photo storage.

### MVP Decision

Ship:

```txt
text note evidence
URL/link evidence
evidence type selection
safe URL rendering
```

Do not ship:

```txt
file upload
photo upload
document upload
file_asset
storage provider
upload progress
thumbnail preview
MIME validation
```

### Evidence Types

Use the evidence types already chosen for the portfolio model:

```ts
type EvidenceType =
  | "note"
  | "link"
  | "writing_sample"
  | "project"
  | "recitation"
  | "other";
```

Do not expose `photo` or `document` until upload exists.

### URL Rules

Allow:

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

If `type === "link"`, require `url`.

If `type === "note"`, require `notes` unless a URL is present.

### Done Means

```txt
- Parent can save text note evidence.
- Parent can save URL evidence.
- Link evidence requires a valid http/https URL.
- Unsafe protocols are rejected.
- No file/photo upload UI appears.
- Evidence appears in the Portfolio list.
```

---

## Feature 31 — Parent Reflection / Note on Evidence

### Goal

Let the parent explain why an evidence item proves learning.

### MVP Decision

Use one plain-text field.

Recommended field:

```ts
reflection?: string;
```

If the existing evidence model already has `notes`, use this distinction:

```txt
notes = factual description
reflection = why this proves learning
```

If the model is already implemented and adding a field creates too much churn, reuse `notes` as the parent reflection field for MVP.

Preferred recommendation: add `reflection?: string` if easy.

### Placeholder Copy

Use:

```txt
What does this show about the child’s learning?
```

Do not build a structured rubric or multi-question reflection flow yet.

### Display

Reflection should be visible in:

```txt
Portfolio list/detail
Reports view
Print view
```

If the Portfolio list is compact, show a short preview.

### Done Means

```txt
- Evidence can store a parent reflection/note.
- Reflection appears in portfolio view.
- Reflection appears in the Reports view.
- Reflection appears in print output where space allows.
- Field is plain text only.
- No structured rubric/reflection workflow is added.
```

---

## Feature 32 — Portfolio List and Filters

### Goal

Make evidence retrievable.

### MVP Filters

Ship:

```txt
child
subject
type
date range
```

Optional if cheap within existing patterns:

```txt
title search
```

Recommendation: defer title search unless the repo already has a search/filter pattern.

### Sort

Default:

```txt
newest first
```

Pagination/display limit:

```txt
50 items per page or 50-item display limit
```

This aligns with the broader performance note that list views should paginate at 50 items.

### Empty State

Use:

```txt
No portfolio evidence yet.
Add a note or link to preserve proof of learning.
```

If filters return nothing:

```txt
No evidence matches these filters.
Try changing the child, subject, type, or date range.
```

### Done Means

```txt
- Parent can view evidence items.
- Parent can filter by child, subject, type, and date range.
- Evidence list sorts newest first.
- Empty states guide the next action.
- List remains mobile-friendly.
```

---

# Group B — Reports Spine

## Feature 33 — Basic Records Report View

### Goal

Create a separate Reports surface where the parent can review homeschool records in one readable summary.

### Route Decision

Reports should be separate.

Use:

```txt
/reports
```

Add a navigation entry for Reports if the app has primary navigation.

Do not bury the report inside the Records tab.

The Records area remains for operational review. The Reports area is for summarized, shareable, print-friendly record output.

### Visual Design Decision

Use a sectioned report layout, not a dense dashboard grid.

Recommended order:

```txt
1. Report header
2. Child information
3. School year/date range
4. Subjects summary
5. Attendance summary
6. Progress/completed lessons summary
7. Portfolio evidence summary
8. Parent reflections / notes
9. Records checklist summary
```

This avoids forcing five data types into one cluttered card grid.

### MVP Scope

Report includes:

```txt
child info
subjects
attendance
completed lessons
portfolio count
```

Also include progress-by-subject if Feature 24 is complete.

### Filters

Required:

```txt
child
school year/date range
```

If All Children is supported in existing selectors, reports should either:

```txt
show one child at a time for print clarity
```

or:

```txt
show per-child report sections
```

Recommendation for MVP: require a single selected child for the printable report. Keep All Children out of the print report until multi-child report design is intentional.

### Date Range

Default:

```txt
active school year to date
```

Do not add a complex custom report builder.

### Data Sources

Use existing feature utilities:

```txt
children
subjects
attendance summary
progress by subject
completed lesson history
portfolio evidence list
records checklist utility
```

Do not create duplicate report-only logic.

### Report Entity

The README mentions `report_request / report_export`, but for Feature 33 MVP, do not create a persistent report entity yet.

Feature 33 is a read-only generated view.

Create `report_request` / `report_export` later when exports are actually generated and persisted.

### Done Means

```txt
- Parent can open a separate Reports page.
- Reports page shows a basic records summary.
- Report shows child info, subjects, attendance, completed lessons, and portfolio count.
- Report uses active school year/date range.
- Report is readable on desktop and mobile.
- Report does not overclaim legal compliance.
```

---

## Feature 34a — Print-Optimized Records Summary

### Goal

Let the parent save/share records through browser print without solving PDF generation yet.

### MVP Decision

Ship:

```txt
Print button
CSS print stylesheet
print-friendly report layout
```

Defer:

```txt
PDF download
server-side rendering
Puppeteer
jsPDF
wkhtmltopdf
report export persistence
```

### Print Behavior

Add a button on `/reports`:

```txt
Print records
```

Action:

```ts
window.print();
```

### Print Styles

Print view should:

```txt
hide navigation
hide buttons
hide filters
show report title
show child name
show school year/date range
show generated date
avoid awkward page breaks inside sections
use black text on white background
```

### Suggested Print Title

```txt
Sheath Academy Records — {Child Name} — {School Year}
```

Browser print does not reliably control saved filename, so do not overbuild filename logic yet.

### Done Means

```txt
- Parent can print the records report from the Reports page.
- Print output hides app navigation and controls.
- Printed report includes child, date range, attendance, progress/completed lessons, and portfolio summary.
- No PDF generation is implemented.
```

---

## Feature 35 — Thin Records Review Checklist

### Goal

Show advisory record gaps before the parent relies on a report.

### MVP Decision

Advisory only, not blocking.

Do not prevent printing.

Use language like:

```txt
Review suggested
Missing attendance records
No portfolio evidence yet
Subject has no completed lessons
```

Avoid:

```txt
non-compliant
invalid
failed
illegal
```

### Checklist Items

Ship these three checks:

```txt
1. Missing attendance records
2. Subjects without lessons/completed work
3. No portfolio evidence
```

### 1. Missing Attendance Records

Use Feature 23’s missing-day rule:

```txt
Monday–Friday inside active school year, up to today, without attendance_record.
```

Display count and link to attendance area if route exists.

### 2. Subjects Without Lessons / Completed Work

For each active subject, flag if:

```txt
no lesson_task records exist in selected date range
```

Optionally distinguish:

```txt
subject has planned lessons but no completed lessons
```

Keep wording calm.

### 3. No Portfolio Evidence

Flag if selected child/date range has:

```txt
0 evidence_item records
```

### Placement

Show checklist on:

```txt
/reports
```

Place it near the top as a small “Records review” section or near the bottom before printing.

Recommendation: top-right or upper section on screen; in print, place it after the report header.

### Done Means

```txt
- Checklist flags missing attendance records.
- Checklist flags subjects without lessons or completed work.
- Checklist flags no portfolio evidence.
- Checklist is advisory only.
- Checklist does not block printing.
- Checklist avoids legal/compliance overclaiming.
```

---

# Recommended Build Order

## Step 1 — Feature 30a

Build text + URL evidence support.

```txt
validation
safe URL handling
form fields
list display
no upload UI
```

## Step 2 — Feature 31

Add parent reflection/note.

```txt
reflection field
placeholder
portfolio display
report-ready display field
```

## Step 3 — Feature 32

Build portfolio list and filters.

```txt
child filter
subject filter
type filter
date range filter
newest-first sort
empty states
50-item pagination/display limit
```

## Step 4 — Feature 33

Build separate Reports page.

```txt
/reports route
Reports navigation entry if needed
sectioned report layout
child info
subjects
attendance
progress/completed lessons
portfolio count
reflection preview
date range
```

## Step 5 — Feature 34a

Add print support.

```txt
Print records button
@media print CSS
hide navigation/controls
page-break rules
print header
```

## Step 6 — Feature 35 Thin

Add advisory checklist to Reports.

```txt
missing attendance
subjects without lessons/completed work
no portfolio evidence
calm advisory language
```

---

# Manual QA

## Portfolio Evidence

```txt
1. Open Portfolio tab.
2. Add evidence with type note and no notes.
3. Confirm validation asks for note content.
4. Add evidence with title, child, subject, date, type note, and reflection/note.
5. Confirm it appears in portfolio list.
6. Add evidence with type link and invalid URL.
7. Confirm invalid URL is rejected.
8. Add evidence with https:// URL.
9. Confirm it saves and renders as a safe link.
10. Confirm there is no file/photo upload control.
```

## Portfolio Filters

```txt
1. Add evidence for two children.
2. Filter by Child A.
3. Confirm Child B evidence is hidden.
4. Filter by subject.
5. Confirm only matching subject evidence appears.
6. Filter by type.
7. Confirm only matching type appears.
8. Apply date range.
9. Confirm out-of-range evidence disappears.
10. Clear filters and confirm evidence returns.
```

## Reports Page

```txt
1. Open /reports.
2. Confirm Reports appears as a separate surface, not inside Records only.
3. Select a child.
4. Confirm child info appears.
5. Confirm school year/date range appears.
6. Confirm subjects appear.
7. Confirm attendance summary appears.
8. Confirm completed lessons/progress appears.
9. Confirm portfolio count appears.
10. Confirm parent reflection/note appears where relevant.
11. Change child/date range and confirm report updates.
```

## Print

```txt
1. Open /reports.
2. Select a child with records.
3. Click Print records.
4. Confirm browser print dialog opens.
5. Confirm app navigation is hidden in print preview.
6. Confirm filters/buttons are hidden.
7. Confirm child name and school year/date range are visible.
8. Confirm generated date is visible.
9. Confirm sections do not break awkwardly where avoidable.
10. Confirm there is no PDF download button unless separately implemented later.
```

## Checklist

```txt
1. Open /reports for a child with missing attendance records.
2. Confirm checklist shows missing attendance records.
3. Open a child with a subject but no lessons.
4. Confirm checklist flags the subject gap.
5. Open a child with no portfolio evidence.
6. Confirm checklist flags no portfolio evidence.
7. Confirm checklist is advisory and does not block print.
8. Confirm wording avoids legal/compliance claims.
```

---

# Out of Scope

Do not implement:

```txt
file/photo upload
file_asset
storage provider
upload API
PDF download
server-side PDF rendering
client-side PDF library
persistent report_export records
state compliance engine
legal advice
AI report summaries
alerts
notifications
role permissions
portfolio sharing
rubrics/grades
```

---

# Implementation Prompt

Implement Features 30–35 in two coherent slices.

Use TDD. Write the smallest relevant failing tests before implementation where test infrastructure exists. Do not broadly explore the repo. Inspect only the feature folders needed for portfolio, evidence, attendance, progress, lesson tasks, children, subjects, school year, reports, records, dashboard navigation, and directly imported shared utilities.

For Feature 30, implement only 30a: text note and URL evidence. Do not implement file/photo upload, file_asset, storage provider, upload API, MIME validation, thumbnails, or upload progress. Do not show file/photo upload controls. URL evidence must validate http/https only.

For Feature 31, add a plain parent reflection/note field to evidence. Use one field with a helpful placeholder. Show it in portfolio and make it available to the report view.

For Feature 32, build the portfolio list and filters. Support filtering by child, subject, type, and date range. Sort newest first. Use helpful empty states and a 50-item page/display limit.

For Feature 33, build a separate Reports page at `/reports`. The report should use a sectioned layout and include child info, subjects, attendance summary, progress/completed lesson summary, and portfolio count. Use existing feature-owned utilities; do not duplicate business logic in the report. Do not bury Reports inside the Records tab.

For Feature 34, implement only 34a: print-optimized records summary. Add a Print records button using browser print and CSS print stylesheets. Do not implement PDF download yet.

For Feature 35, add a thin advisory records review checklist on the Reports page. Flag missing attendance records, subjects without lessons/completed work, and no portfolio evidence. The checklist is advisory only and must not block printing. Avoid compliance overclaiming.
