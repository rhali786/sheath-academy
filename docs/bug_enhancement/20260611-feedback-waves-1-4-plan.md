# Plan: Feedback waves 1–4 (8 production feedback items)

Source: production feedback IDs `50774221`, `fcee6fd0`, `e534c6cc` (wave 1), `80f04cd0`, `3c4cc9a2` (wave 2), `23cd6909` (wave 3), `9937be68`, `9bb8370e` (wave 4). All `status: reviewed`, admin-approved. A 9th item (`46a51bee`, "Learning Time Screen") is a large standalone feature brief and is **out of scope** for this plan — to be planned separately.

---

## Wave 1 — Plan/Lessons data sync

### Summary

Two related fixes so the course/subject list and the lesson planner reflect what a household just did: (1a) newly created courses appear immediately in `/plan` and `/lessons` pickers without a full reload, and (1b) "Generate lessons" on the Resources page can actually be saved into the planner instead of only showing a preview.

### Planning mode

- **1a (subject list staleness):** Mode 2 — local feature behavior, single context + one settings page wiring fix.
- **1b (lesson generation persistence):** Mode 4 — new feature (no persistence path exists today).

### Code-path audit

**1a — Subject list staleness**
| Section | Path |
|---|---|
| Renders course pickers | `features/plan/front/pages/LessonsPage.tsx:26` (`allSubjects` from `useHousehold()`) |
| Data provider | `features/household/front/context/HouseholdContext.tsx:38-59` — `fetchHousehold` runs once on mount via `useEffect`; exposes `refetch` |
| Mutation entry point | `features/settings/front/pages/SettingsPage.tsx:345` (`SubjectForm onSuccess`) and `:353` (`SubjectsAllTable onMutate`) — both currently only call `setSubjectRefreshKey((k) => k+1)`, a **local** key that only re-renders `SubjectsAllTable`'s own fetch, not `HouseholdContext.allSubjects` |
| API route | `features/subjects/api/routes/subjects.ts` (`POST`/`PATCH` create/update) |
| Repository | `features/subjects/server/repository.ts` (`createSubjectRow`, `updateSubjectRow`, `archiveSubjectRow`) |
| Current owner | household feature owns `allSubjects`; correct |
| Existing tests | `features/settings/__tests__/integration/SettingsPage.test.tsx`, `features/household/__tests__/integration/HouseholdSettings.test.tsx` |
| Missing tests | Integration test: creating a subject in Settings updates `useHousehold().allSubjects` (and therefore would be visible to `/plan`/`/lessons`) without a reload |

**1b — Lesson generation persistence**
| Section | Path |
|---|---|
| Renders generated preview | `features/resources/front/components/LessonGenerationPanel.tsx` — `handleGenerate` (lines 29-47) calls `resourcesApi.generateLessons()`, stores result in local `generated` state, **never persisted** |
| Compute service | `features/resources/server/service.ts:54-104` `generateLessons()` — pure function, returns `GeneratedLesson[]` (`{ title, dueDate, order, description? }`), no DB write |
| Types | `features/resources/types.ts:61-77` (`GenerateLessonsInput`, `GeneratedLesson`) |
| Target persistence API | `features/plan/front/services/api.ts:78-84` `plannerApi.createLesson()` → `POST /api/plan/lessons` |
| LessonTask shape (required fields) | `features/plan/types.ts:5-25` — `childId`, `subjectId`, `householdId`, `title`, `dueDate`, `status`, `order` are required; `description`, `resourceLink` optional |
| Current owner | Resources generates content; Planner (`features/plan`) owns `lessonTasks` — correct split, but no bridge exists |
| Existing tests | `features/resources/__tests__/api/resources.test.ts:105-153` (generation only, no persistence) |
| Missing tests | API/unit test: "save generated lessons" creates one `lessonTasks` row per `GeneratedLesson` with the chosen `childId`/`subjectId` and `resourceLink` set to the resource id; integration test: Resources page "Save to plan" flow |

### Source-of-truth decision

- `allSubjects` remains owned by `features/household` (`HouseholdContext`). Fix: Settings calls `refetch()` after subject create/update/archive, in addition to the existing local `subjectRefreshKey`.
- Lesson tasks remain owned by `features/plan` (`lessonTasks` table / `plannerApi`). Resources feature does not gain a parallel "generated lessons" store — generated lessons are a **preview** that, on save, become real `lessonTasks` rows via the existing planner API. No new table.

### Acceptance criteria

**1a**
- On Settings → Courses, after creating a new course, navigating to `/plan` (Weekly Planner) shows the new course in the subject/course filter without a page reload.
- After creating a new course, navigating to `/lessons` shows the new course in the "Add lesson" course dropdown without a page reload.
- Editing or archiving a course in Settings is reflected the same way (archived courses drop out of the active pickers).

**1b**
- On `/resources`, after clicking "Generate lessons" and reviewing the preview list, a "Save to plan" button is shown.
- "Save to plan" requires selecting at least one learner and a course (subject) before it is enabled.
- Clicking "Save to plan" creates one lesson task per generated lesson, with `dueDate` and `title` from the preview, `resourceLink` set to the resource, and `status: 'not_started'` (or the existing default for new lessons).
- After saving, navigating to `/lessons` or the Weekly Planner shows the newly created lessons on their generated due dates.
- Saving twice does not silently duplicate — a second "Save to plan" click is disabled until a new generation is run, or shows a confirmation (decide in implementation; default: disable until re-generated).

### Data model / contract changes

- No schema changes. `lessonTasks` already has all needed fields (`subjectId`, `childId`, `resourceLink`, `dueDate`, `title`, `description`, `order`, `status`).
- `GeneratedLesson` (resources types) is unchanged; it is mapped client-side into `plannerApi.createLesson()` payloads.

### API / store / service plan

- **1a:** No new endpoints. `SettingsPage.tsx` subject `onSuccess`/`onMutate` handlers call `refetch()` from `useHousehold()` (already imported, used elsewhere in the same file at line 134) in addition to `setSubjectRefreshKey`.
- **1b:** No new endpoint required — reuse `plannerApi.createLesson()` in a loop (one call per generated lesson) from `LessonGenerationPanel`. If looped calls prove awkward for tests/UX, a follow-up bulk endpoint can be considered, but start with the existing per-lesson endpoint (smallest safe change).

### UI plan

- **1a:** No new UI. Behavior-only fix.
- **1b:** `LessonGenerationPanel` (`features/resources/front/components/LessonGenerationPanel.tsx`):
  - Add learner multi-select (reuse pattern from `SubjectForm.tsx` learner checkboxes) and a course/subject `<select>` (sourced from `useHousehold().allSubjects`, filtered to the selected learner(s)).
  - Add "Save to plan" button below the generated-lessons preview, disabled until learner + course chosen and `generated.length > 0`.
  - On success: show a confirmation message ("12 lessons added to the planner") and disable "Save to plan" until the next "Generate lessons" run.
  - Empty state: if `generated.length === 0`, no Save button is shown (current behavior).
  - Mobile: stack learner select, course select, and buttons vertically (existing `flex-wrap` pattern).
  - Accessibility: `<label>` for new selects; "Save to plan" button has visible text (not icon-only).

### Testing plan (failing tests first)

1. `features/household/__tests__/integration/HouseholdSettings.test.tsx` (or new test in `features/settings/__tests__/integration/SettingsPage.test.tsx`): creating a subject calls `refetch`/updates `allSubjects` from `useHousehold()` context — currently fails because only `subjectRefreshKey` changes.
2. `features/resources/__tests__/api/resources.test.ts`: new test "generateLessons output can be saved as lesson tasks" — exercise the mapping from `GeneratedLesson` → `plannerApi.createLesson` payload (unit-level, mock `plannerApi`).
3. `features/resources/__tests__/integration/`: new integration test for `LessonGenerationPanel` — generate → select learner/course → "Save to plan" → asserts `plannerApi.createLesson` called once per generated lesson with correct `dueDate`/`title`/`resourceLink`/`childId`/`subjectId`.
4. Playwright (optional, cross-screen): generate + save on `/resources`, then verify lesson appears on `/lessons` — flag as nice-to-have given existing e2e suite size; include if time allows.

### Build phases

1. **1a fix** — wire `refetch()` into Settings subject handlers; failing test → passing.
2. **1b — UI selection state** — add learner/course selectors to `LessonGenerationPanel`, with tests for the new controls' presence/disabled states.
3. **1b — Save to plan** — wire "Save to plan" to `plannerApi.createLesson` loop; failing tests → passing; manual QA against `/lessons`.

### Out of scope

- No bulk-create planner endpoint (reuse existing per-lesson API).
- No "edit before saving" UI for generated lesson titles/dates — saved as generated.
- No retroactive fix for already-reorganized households' stale client state (just requires a reload, which they already know to do).

### Manual QA

1. Open Settings → Courses. Add a new course "Test Course".
2. Navigate to `/lessons` (no reload). Confirm "Test Course" appears in the course dropdown.
3. Navigate to `/plan`. Confirm "Test Course" appears in the subject filter.
4. Go to `/resources`, open a resource with chapters, click "Generate lessons".
5. Select a learner and a course, click "Save to plan".
6. Navigate to `/lessons` or Weekly Planner; confirm the generated lessons appear on their due dates.

### Branch and commit plan

- Branch: `fix/plan-lessons-data-sync`
- Commits:
  1. `test(settings): cover subject create refreshing household context`
  2. `fix(settings): refetch household context after subject create/edit/archive`
  3. `test(resources): cover saving generated lessons to planner`
  4. `feat(resources): add learner/course selection to lesson generation panel`
  5. `feat(resources): save generated lessons as planner lesson tasks`

### Risks and rollback

- Risk: looping `createLesson` for many generated lessons (e.g., 36) creates 36 sequential API calls — acceptable for a manual "Save to plan" action but watch for UI responsiveness; show a spinner during save.
- Rollback: each commit is independently revertable; 1a and 1b are unrelated enough to ship separately if needed.

---

## Wave 2 — Quran pacing & terminology

### Summary

Clarify the "Memorisation" vs "New memorisation" Quran session-type labels (copy-only), and let households choose a pacing cadence (daily / weekly / every N days) when generating lessons from a Quran resource, instead of always one-chapter-per-school-day.

### Planning mode

- **2a (terminology):** Mode 1 — tiny copy change, no stored-value change.
- **2b (pacing cadence):** Mode 2 — local feature behavior in `features/resources`.

### Code-path audit

**2a — Terminology**
| Section | Path |
|---|---|
| Renders type dropdown | `features/quran/front/pages/QuranPage.tsx:15` (`SESSION_TYPES` array), used in add-form (~208-214) and edit-form (~322-328) |
| Stored value | `features/lib/types.ts:40-50` `QuranSession.type: string` — free-form string, persisted as-is |
| Existing tests | Quran page integration tests (need to confirm exact file under `features/quran/__tests__/`) |

**2b — Pacing cadence**
| Section | Path |
|---|---|
| Generation form | `features/resources/front/components/LessonGenerationPanel.tsx:80-90` — single "School days" number input |
| Types | `features/resources/types.ts:15-20` (`LessonGenerationStrategy`), `:61-70` (`GenerateLessonsInput` — `schoolDays: number` is a total budget, no cadence field) |
| Compute service | `features/resources/server/service.ts:54-104` `generateLessons()` — pre-computes Mon–Fri school-day dates, assigns one lesson per consecutive school day |
| Existing tests | `features/resources/__tests__/api/resources.test.ts:105-153` |

### Source-of-truth decision

- Quran session type remains a `features/quran`-owned free-form string field; no schema change. Display labels are remapped client-side only, so historical data (`'Memorisation'`, `'New memorisation'`) keeps working.
- Lesson-generation pacing remains owned by `features/resources` (`generateLessons`); `cadence` is a new optional input to that pure function, no new table.

### Acceptance criteria

**2a**
- The Quran session-type dropdown shows clearer labels, e.g. "New memorization (Hifz)" and "Memorization review (already memorized)", while the underlying stored `type` values are unchanged (`'New memorisation'` / `'Memorisation'`).
- Existing sessions logged with the old labels still display correctly (label is derived from stored value via a mapping, not from the raw string directly).

**2b**
- The "Generate lessons" form has a "Pacing" control with options: "Every school day" (current/default behavior, unchanged), "Once a week", "Every N days" (with an N input shown only for this option).
- Selecting "Once a week" generates lessons 7 calendar days apart (skipping to the next occurrence of the same weekday — decide and document which weekday: the start date's weekday).
- Selecting "Every N days" generates lessons N calendar days apart from the previous lesson's due date.
- "Every school day" preserves exactly today's behavior (regression-protected by existing tests).

### Data model / contract changes

- `GenerateLessonsInput` (`features/resources/types.ts:61-70`) gains:
  ```ts
  cadence?: 'schoolDay' | 'weekly' | 'everyNDays' // default 'schoolDay'
  cadenceDays?: number // required when cadence === 'everyNDays'
  ```
- `QuranSession.type` unchanged. New file (or addition to `features/quran/types.ts` if it exists) for a label map:
  ```ts
  export const QURAN_SESSION_TYPE_LABELS: Record<string, string> = {
    'New memorisation': 'New memorization (Hifz)',
    'Memorisation': 'Memorization review (already memorized)',
    // ... other SESSION_TYPES pass through unchanged
  }
  ```

### API / store / service plan

- `generateLessons()` (`features/resources/server/service.ts`): when `cadence === 'weekly'`, step due dates by 7 calendar days from `startDate`; when `'everyNDays'`, step by `cadenceDays` calendar days; when `'schoolDay'`/undefined, keep existing Mon–Fri school-day stepping unchanged.
- `features/resources/api/routes/resources.ts` generate-lessons handler: pass through `cadence`/`cadenceDays` from request body (validate `cadenceDays >= 1` when `cadence === 'everyNDays'`).

### UI plan

- `LessonGenerationPanel.tsx`: add a "Pacing" `<select>` (Every school day / Once a week / Every N days) next to "School days"; when "Every N days" selected, show an "N" number input (min 1).
- `QuranPage.tsx`: replace raw `SESSION_TYPES` strings in the `<option>` labels with `QURAN_SESSION_TYPE_LABELS[type] ?? type`, keeping `value={type}` as the stored value.
- Accessibility: existing `<label>` patterns reused; no icon-only controls added.

### Testing plan (failing tests first)

1. `features/resources/__tests__/api/resources.test.ts`: new tests for `generateLessons` with `cadence: 'weekly'` (lessons 7 days apart) and `cadence: 'everyNDays', cadenceDays: 3` (lessons 3 days apart); existing `schoolDay` tests must keep passing unchanged.
2. `features/resources/__tests__/integration/`: `LessonGenerationPanel` shows "Every N days" input only when that pacing is selected, and passes `cadence`/`cadenceDays` to `resourcesApi.generateLessons`.
3. `features/quran/__tests__/integration/`: dropdown renders the new friendly labels while submitting the original stored `type` value; an existing session with `type: 'Memorisation'` displays the friendly label.

### Build phases

1. 2a — label map + dropdown copy change (small, ships independently).
2. 2b — `generateLessons` cadence logic + tests.
3. 2b — `LessonGenerationPanel` pacing UI + API passthrough.

### Out of scope

- No change to stored `QuranSession.type` values or migration of historical data.
- No per-lesson custom cadence (cadence applies to the whole generation run).
- "Once a week" does not support choosing a specific weekday other than the start date's weekday in this wave.

### Manual QA

1. Open `/quran`, click "Add session". Confirm the type dropdown shows the new friendly labels.
2. Find an existing session previously logged as "Memorisation"; confirm it now displays the friendly review label.
3. Open `/resources`, pick a Quran resource, click "Generate lessons", select "Once a week" pacing — confirm preview dates are 7 days apart.
4. Switch to "Every N days", set N=3 — confirm preview dates are 3 days apart.
5. Switch back to "Every school day" — confirm preview matches prior (Mon–Fri) behavior.

### Branch and commit plan

- Branch: `enhancement/quran-pacing-and-labels`
- Commits:
  1. `fix(quran): clarify memorization session type labels`
  2. `test(resources): cover weekly and every-N-days lesson pacing`
  3. `feat(resources): support weekly and every-N-days pacing in lesson generation`

### Risks and rollback

- Low risk; both changes are additive (new optional field, label map). Each commit independently revertable.

---

## Wave 3 — Course–resource linking

### Summary

Allow a course (subject) to be linked to one or more resources from the Resources page, and surface those links in Settings → Courses, per the user's confirmed "multiple resources per course" decision.

### Planning mode

Mode 4 — new feature: new join table, repository methods, API surface, and UI on two features.

### Code-path audit

| Section | Path |
|---|---|
| Schema | `db/schema.ts` — `subjects` (lines 177-197), `resources` (lines 447-471). No existing join table. `subjectLearners` (lines 201-208) is the precedent pattern for a many-to-many join table. |
| Subjects types | `features/subjects/types.ts:30-49` `SubjectCourse` — no resource field |
| Subjects repository | `features/subjects/server/repository.ts` — `hydrate`/`hydrateMany` pattern (lines 69-96) used to attach `learnerIds`; same pattern to attach `resourceIds` |
| Subjects API | `features/subjects/api/routes/subjects.ts` |
| Resources types | `features/resources/types.ts:22-39` `Resource` — no subject field |
| Resources repository/API | `features/resources/server/repository.ts`, `features/resources/api/routes/resources.ts` |
| Settings UI | `features/settings/front/pages/SettingsPage.tsx:328-357` — Courses tab renders `SubjectForm` + `SubjectsAllTable`; resource-linking UI attaches here, likely via `SubjectEditDialog` or a new column in `SubjectsAllTable` |
| Existing tests | None for subject-resource relationships (`features/subjects/__tests__/`, `features/resources/__tests__/`) |

### Source-of-truth decision

- New join table `subjectResources` (pattern-matched to `subjectLearners`), owned by `features/subjects` (the "course" side), since linking is initiated from the course's perspective ("link this course to a resource"). `features/resources` repository gains a read method to list subjects linked to a resource, for symmetry, but does not own the join table.

### Acceptance criteria

- In Settings → Courses, editing a course (via `SubjectEditDialog`) shows a multi-select of the household's resources; selecting/deselecting and saving persists the link.
- A course can be linked to zero, one, or many resources.
- A resource can be linked to zero, one, or many courses (many-to-many, not exclusive).
- `SubjectsAllTable` shows the count or names of linked resources per course (e.g., "2 resources linked").
- Removing a course's resource link does not delete the resource; removing the resource (if deletion exists) removes the link rows (cascade).

### Data model / contract changes

- New table in `db/schema.ts`, modeled on `subjectLearners`:
  ```ts
  export const subjectResources = pgTable('subject_resources', {
    subjectId: text('subject_id').notNull().references(() => subjects.id, { onDelete: 'cascade' }),
    resourceId: text('resource_id').notNull().references(() => resources.id, { onDelete: 'cascade' }),
  }, (t) => [
    primaryKey({ columns: [t.subjectId, t.resourceId] }),
    index('subject_resources_resource_idx').on(t.resourceId),
  ])
  ```
  Requires `npm run db:generate` + `npm run db:migrate` against a non-prod DB (per CLAUDE.md migration rules — do not run against the shared dev DB without coordinating).
- `SubjectRowWithLearners` → extend (or add a sibling `SubjectRowWithResources`) with `resourceIds: string[]`, hydrated the same way as `learnerIds` (`readResourceIds`/`writeResourceRows`/`syncResourceRows`, mirroring `readLearnerIds`/`writeLearnerRows`/`syncLearnerRows` in `features/subjects/server/repository.ts:32-67`).
- `SubjectCourse` (`features/subjects/types.ts`) gains `resourceIds: string[]`.
- `UpdateSubjectInput` (`features/subjects/server/repository.ts:22-30`) gains `resourceIds?: string[]`.

### API / store / service plan

- `listSubjectRows`/`getSubjectRow`/`createSubjectRow`/`updateSubjectRow` in `features/subjects/server/repository.ts`: extend hydration to include `resourceIds`; `updateSubjectRow` calls `syncResourceRows` when `input.resourceIds !== undefined` (mirrors `syncLearnerRows`).
- `features/subjects/api/routes/subjects.ts`: `rowToSubject` includes `resourceIds`; `PATCH`/update handler accepts `resourceIds` in the body.
- `features/subjects/front/services/api.ts`: `updateSubject` (or equivalent) passes `resourceIds`.

### UI plan

- `SubjectEditDialog.tsx`: add a "Linked resources" multi-select (checkboxes or multi-select list), populated from `resourcesApi.getResources()` (household-scoped). Reuse the learner-checkbox visual pattern from `SubjectForm.tsx`.
- `SubjectsAllTable.tsx`: add a "Resources" column showing linked resource count/names (truncate with "+N more" for >2).
- Empty state: "No resources linked" when `resourceIds.length === 0`.
- Accessibility: multi-select uses checkboxes with visible labels (not a native `<select multiple>`, for touch-target size ≥44px on mobile).

### Testing plan (failing tests first)

1. `features/subjects/__tests__/server/repository.test.ts` (or equivalent): `updateSubjectRow` with `resourceIds` persists and is returned by `getSubjectRow`/`listSubjectRows`.
2. `features/subjects/__tests__/api/subjects.test.ts`: `PATCH /api/subjects/:id` with `resourceIds` updates the link table; `GET` returns `resourceIds`.
3. `features/subjects/__tests__/integration/SubjectEditDialog.test.tsx`: multi-select renders household resources, toggling + save calls API with updated `resourceIds`.
4. `features/subjects/__tests__/integration/SubjectsAllTable.test.tsx`: renders linked-resource count/names per course.

### Build phases

1. Schema + migration (`subjectResources` table) — gated, confirm target DB before running `db:generate`/`db:migrate`.
2. Repository hydration + `updateSubjectRow` resource sync, with failing tests first.
3. API route plumbing (`resourceIds` in request/response).
4. `SubjectEditDialog` multi-select UI.
5. `SubjectsAllTable` "Resources" column.

### Out of scope

- No UI on the Resources page itself to manage links from the resource's side (read-only "linked courses" display could be a follow-up).
- No resource deletion flow changes beyond cascade behavior already implied by the new FK.

### Manual QA

1. Run migration against a non-prod DB; seed/create a course and a resource.
2. Settings → Courses → edit the course → select the resource in "Linked resources" → Save.
3. Confirm `SubjectsAllTable` shows "1 resource linked" for that course.
4. Edit again, link a second resource; confirm it shows "2 resources linked".
5. Unlink both; confirm "No resources linked".

### Branch and commit plan

- Branch: `feature/course-resource-linking`
- Commits:
  1. `feat(db): add subject_resources join table`
  2. `test(subjects): cover linking resources to a course`
  3. `feat(subjects): persist and return linked resource ids`
  4. `feat(settings): add linked-resources picker to course edit dialog`
  5. `feat(settings): show linked resources in courses table`

### Risks and rollback

- Schema migration is the highest-risk step — **must confirm `DATABASE_URL` target before `db:generate`/`db:migrate`** per CLAUDE.md (never run against prod; coordinate with any other in-flight migration branches to avoid journal drift).
- All other changes are additive; rollback by reverting commits in reverse order. The join table can remain unused if later commits are reverted (no data loss to existing tables).

---

## Wave 4 — Dashboard polish

### Summary

Two dashboard fixes: (4a) the "Attendance not logged today" alert should clear once attendance is logged, and (4b) the "Set up your household" message becomes a clickable link to the setup flow.

### Planning mode

- **4a:** Mode 2/3 — cross-feature (alerts ← attendance), needs investigation during implementation (see "unknowns" below).
- **4b:** Mode 1 — tiny UI change, but needs a real navigable target (currently a conditional overlay, not a route).

### Code-path audit

**4a — Attendance alert staleness**
| Section | Path |
|---|---|
| Alert generation | `features/alerts/server/service.ts:6-9` (`todayLocal()`), `:58-97` (`attendance_missing` alert, built from `childIdsWithAttendance` derived from `listAttendanceEvents(householdId, { date: today })`) |
| Alert rendering | `features/dashboard/front/components/NeedsAttention.tsx`, `features/dashboard/front/components/shared/AlertItem.tsx` (href `/attendance?childId=...` or `/attendance`) |
| Dashboard data provider | `features/dashboard/front/context/DashboardProvider.tsx` — fetches alerts on mount and on `selectedChildId` change; instantiated in `app/(shell)/dashboard/page.tsx`, so navigating away to `/attendance` and back **should** remount and refetch |
| Attendance write path | `features/attendance/front/pages/AttendancePage.tsx:89-107` `markAttendance()` → `attendanceApi.createRecord({ childId, householdId, date, status, ... })` → `features/attendance/server/repository.ts:50-` `createAttendanceEvent` stores `attendanceDate: input.attendanceDate` |
| Read path for alert | `listAttendanceEvents(householdId, { date: today })` filters `eq(attendanceEvents.attendanceDate, filters.date)` where `today = todayLocal()` (`YYYY-MM-DD`, server-local) |
| Existing tests | `features/dashboard/__tests__/integration/components/NeedsAttention.test.tsx`, `features/alerts/__tests__/api/alerts.test.ts` — neither covers "alert clears after logging attendance" |

**Unknowns (to resolve in build phase 1, via a failing test before any fix):**
- Whether `AttendancePage`'s `date` state is produced client-side (browser-local date) and whether that matches the **server's** `todayLocal()` (server-local date) — a timezone mismatch here would mean a record is written for a different `attendanceDate` than the alert query's `today`, so the alert would never clear regardless of refetching. This must be confirmed by writing a failing API/integration test that creates an attendance record "today" (as the client would) and asserts `getAlerts` no longer includes `attendance_missing` for that learner.
- Whether `DashboardProvider` actually remounts on `/attendance` → `/dashboard` navigation in this app's routing (confirm via integration/Playwright, not assumption).

**4b — "Set up your household" link**
| Section | Path |
|---|---|
| Renders message | `features/setup/front/components/NextSetupStrip.tsx:8-11` (household step has `title`/`detail`, **no `href`**), `:72-91` (title rendered as plain `<p>`, "Go →" link only rendered `if (meta.href)`) |
| Setup flow target | `features/household/front/components/HouseholdSetup.tsx` — rendered conditionally by `features/dashboard/front/pages/Dashboard.tsx` (`if (needsSetup) return <HouseholdSetup />`) when `useHousehold().needsSetup` is true; **not a standalone route** |
| Existing tests | `features/setup/__tests__/integration/NextSetupStrip.test.tsx` — covers `firstSubject`/`firstLesson` steps, not `household` |

### Source-of-truth decision

- 4a: alerts remain owned by `features/alerts`; attendance remains owned by `features/attendance`. No ownership violation — this is a data-freshness/correctness bug, root cause to be confirmed by the failing test in phase 1 (likely a date-format/timezone mismatch or a refetch gap, not a new owner needed).
- 4b: `needsSetup`/household-setup remains owned by `features/household`. Since `HouseholdSetup` is a conditional full-page render (not a route) triggered by `needsSetup`, "Go →" cannot be a normal `<Link href>` to a separate page. Two options for implementation to choose between (decide in phase 1 of 4b):
  1. Make the entire `NextSetupStrip` household row a button that calls a callback to show `<HouseholdSetup />` (requires lifting state/visibility into a shared parent — bigger change), or
  2. Give household setup a real route (e.g. `app/(shell)/household/setup/page.tsx` rendering `<HouseholdSetup />`) and link to it; `Dashboard.tsx`'s conditional render can redirect to that route instead of inline-rendering. **Recommended** — smaller, matches "Needs Header + household context → `app/(shell)/`" convention, and makes `NextSetupStrip`'s existing `href`-based pattern (`Link href={meta.href}`) work unchanged.

### Acceptance criteria

**4a**
- After logging attendance for a child today (via `/attendance`), returning to the dashboard no longer shows "Attendance not logged today" for that child (or for the household, if it was the last missing child).
- A failing reproduction test exists and passes after the fix.

**4b**
- The "Set up your household" row in `NextSetupStrip` is clickable (entire row, or at minimum shows a "Go →" link) and navigates to the household setup flow.
- Completing household setup removes the "Set up your household" step from `NextSetupStrip` (already implied by `needsSetup` becoming false — confirm this still holds with the routing change).

### Data model / contract changes

- 4a: none anticipated (pending phase-1 investigation; if a date-format mismatch is found, the fix is in date computation/formatting, not schema).
- 4b: if recommended option 2 is chosen — `NEXT_SETUP_STEPS` (or equivalent constant in `features/setup`) household entry gains `href: '/household/setup'`; new route file `app/(shell)/household/setup/page.tsx`.

### API / store / service plan

- 4a: none anticipated beyond the fix identified by the failing test (likely in `features/alerts/server/service.ts` `todayLocal()` usage or `features/attendance` date handling).
- 4b: new thin route `app/(shell)/household/setup/page.tsx` rendering `<HouseholdSetup />`; `Dashboard.tsx` keeps its `needsSetup` check but `router.replace`s to `/household/setup` instead of inline rendering (or keeps inline rendering for the *first-run* case and the route serves the *revisit-via-link* case — decide based on whether `HouseholdSetup` works standalone outside the dashboard's data-loading context).

### UI plan

- 4a: no new UI; existing `AlertItem`/`NeedsAttention` rendering unchanged once the underlying data is correct.
- 4b: `NextSetupStrip.tsx` — household step gains `href: '/household/setup'` so the existing `{meta.href ? <Link href={meta.href}>Go →</Link> : null}` (line 82-88) renders for this step too, no new component needed. New route renders existing `HouseholdSetup` component as-is.

### Testing plan (failing tests first)

1. `features/alerts/__tests__/api/alerts.test.ts`: new test — create an attendance record for "today" for a learner, then call `getAlerts`/`listAlerts`, assert no `attendance_missing` alert for that learner. This is the reproduction; it should currently **fail or pass** depending on whether the bug is a date mismatch (failing) or a pure refetch issue (passing at this layer, meaning the bug is in `DashboardProvider`/routing).
2. If (1) passes, add `features/dashboard/__tests__/integration/`: test that `DashboardProvider`/dashboard page refetches alerts when the route is revisited after attendance is logged (may require Playwright if it's a routing/remount concern).
3. `features/setup/__tests__/integration/NextSetupStrip.test.tsx`: new test — household step renders a "Go →" link to `/household/setup`.
4. New test for `app/(shell)/household/setup/page.tsx` (or its underlying page component): renders `HouseholdSetup`.

### Build phases

1. **4a investigation + fix** — write the reproduction test (alerts API, attendance-logged-today scenario) first; trace to root cause (date mismatch vs. refetch gap vs. routing); fix at the identified layer.
2. **4b route** — add `/household/setup` route rendering `HouseholdSetup`; update `Dashboard.tsx` if needed.
3. **4b link** — add `href` to the household step in `NextSetupStrip`'s step config; test.

### Out of scope

- No redesign of `NeedsAttention`/`AlertItem` components.
- No change to how `needsSetup` is computed.
- No broader audit of other `NextSetupStrip` steps' hrefs (only `household`).

### Manual QA

1. As a household with no attendance logged today, open the dashboard. Confirm "Attendance not logged today" appears.
2. Click the alert, log attendance for the child on `/attendance`.
3. Return to the dashboard. Confirm the alert is gone.
4. As a household mid-setup (or by triggering `needsSetup`), confirm the "Set up your household" row shows a "Go →" link.
5. Click "Go →"; confirm it navigates to the household setup flow and the form renders correctly.
6. Complete setup; confirm the step disappears from `NextSetupStrip` on the next dashboard load.

### Branch and commit plan

- Branch: `fix/dashboard-alerts-and-setup-link`
- Commits:
  1. `test(alerts): cover attendance-missing alert clearing after logging attendance`
  2. `fix(alerts): <root cause fix, named after phase-1 finding>`
  3. `feat(household): add standalone household setup route`
  4. `feat(setup): link "Set up your household" to setup route`

### Risks and rollback

- 4a's actual fix is unknown until phase 1's reproduction test is written — the commit/branch plan above for commit 2 is a placeholder name pending that finding. If the root cause turns out to be larger than a one-line fix (e.g., a genuine cross-page cache-invalidation architecture gap), stop after phase 1 and re-plan rather than improvising.
- 4b: if `HouseholdSetup` depends on dashboard-loaded data not available standalone, option 2 (new route) may need adjustment — fall back to option 1 (callback-based reveal) if so.

---

## Cross-wave notes

- Waves are independent and can be implemented/merged in any order; **Wave 3 (schema migration) should not run concurrently with another migration-touching branch** per CLAUDE.md ("prefer merging migration PRs in order... or point at a throwaway DB").
- The excluded item `46a51bee` ("Learning Time Screen") should be planned separately via `/plan-builder` once waves 1–4 are underway or complete, since it is a large standalone feature (Mode 4/5) unrelated to these bug-fix waves.

---

## Feedback coverage (verbatim, verified against production)

Each row's `message` is the verbatim text from `userFeedback` (production DB, re-verified 2026-06-11). All 8 items are `status: reviewed`, admin-approved.

### `50774221-b443-4b7f-b725-64b571547686` — `/plan`, bug (2026-06-10T17:03:20Z)

> "I'm trying to add a lesson for a spelling class, but its not showing up on the course/subject list despite ust adding it as a course for them a moment ago."

**Covered by:** Wave 1a (build phase 1, task #6).
**Rationale:** Root cause is `HouseholdContext.allSubjects` (`features/household/front/context/HouseholdContext.tsx`) being fetched once on mount, with no refresh when a subject is created. The fix calls `refetch()` from `useHousehold()` in `SettingsPage.tsx`'s `SubjectForm onSuccess`/`SubjectsAllTable onMutate` handlers (alongside the existing local `subjectRefreshKey`). After this fix, creating "spelling" as a course immediately updates `allSubjects`, so it appears in `/plan`'s subject/course picker without a reload — directly addressing "not showing up on the course/subject list."

### `fcee6fd0-8ff5-43ec-a9e6-3b240d590af0` — `/lessons`, question (2026-06-10T17:04:15Z)

> "It is, however showing science class which I added the other day."

**Covered by:** Wave 1a (build phase 1, task #6) — same fix as `50774221`.
**Rationale:** Sent ~1 minute after `50774221` by the same user/household, this is the contrasting half of the same observation: "science" (added "the other day," i.e. before the current page load) *does* show up, while "spelling" (added moments ago, in the current session) does not. This is exactly the symptom of a fetch-once-on-mount cache — older data present at mount renders fine, anything created after mount is missing until reload. The Wave 1a `refetch()` fix resolves both halves of this single underlying bug: new subjects (like "spelling") become visible immediately, matching the already-visible behavior of "science."

### `e534c6cc-55f8-4455-adbc-414584592750` — `/plan`, bug (2026-06-10T16:53:43Z)

> "I generated lessons using the Resources page which showed it would plan lessons starting today and continuing from there, but I don't see the lessons when I click on the Calendar, Lesson Planner, etc."

**Covered by:** Wave 1b (build phases 2–3, tasks #7, #8).
**Rationale:** Confirmed root cause: `LessonGenerationPanel.tsx`'s `handleGenerate` calls `resourcesApi.generateLessons()`, which is a pure computation (`features/resources/server/service.ts generateLessons`) — it returns a preview list and never writes to `lessonTasks`. The household has 0 `lessonTasks` rows, confirming nothing was ever persisted, which is exactly "I don't see the lessons when I click on the Calendar, Lesson Planner, etc." Wave 1b adds learner/course selection (#7) and a "Save to plan" action (#8) that loops `plannerApi.createLesson()` to write each generated lesson into `lessonTasks` with the previewed `dueDate`/`title`. After this, generated lessons become real planner rows visible on `/lessons` and the Weekly Planner.

### `80f04cd0-5893-4c85-9167-997a96229a46` — `/quran`, question (2026-06-10T17:05:53Z)

> "Seeking clarification, is the 'memorization' option for when they've already memorized that surah? Because there's 'memorization' and 'new memorization.'"

**Covered by:** Wave 2a (build phase 1, task #9).
**Rationale:** This is a labeling-clarity question, not a data bug — `QuranPage.tsx`'s `SESSION_TYPES` includes both `'Memorisation'` and `'New memorisation'` with no explanatory copy. The fix adds a `QURAN_SESSION_TYPE_LABELS` map so the dropdown displays "New memorization (Hifz)" vs. "Memorization review (already memorized)" while the stored `type` value (and therefore historical data and the type filter) is unchanged. This directly answers the user's question in-product: the "review" label makes clear that option is for surahs already memorized, and "New memorization (Hifz)" is for first-time memorization — matching the user's own guess at the distinction.

### `3c4cc9a2-77cd-472b-9f69-f01da95cd59e` — `/resources`, enhancement (2026-06-10T16:51:38Z)

> "This page is much better Alhamdulillah. I like that I can change how many chapters I'm doing and what strategy. Its still automatically putting one chapter per day, rather than me choosing to do a chapter week or every x days."

**Covered by:** Wave 2b (build phases 2–3, tasks #10, #11).
**Rationale:** `generateLessons()` (`features/resources/server/service.ts`) currently always steps one chapter per Mon–Fri school day, with no cadence concept in `GenerateLessonsInput`. Wave 2b adds `cadence?: 'schoolDay' | 'weekly' | 'everyNDays'` and `cadenceDays?` to the input/service (#10 — "Once a week" steps 7 calendar days, "Every N days" steps `cadenceDays`), and a "Pacing" select + conditional N input in `LessonGenerationPanel` (#11). This directly gives the user the "choose a chapter a week or every x days" control they asked for, while leaving the existing daily behavior as the unchanged default.

### `23cd6909-0f6b-42c4-9390-6a0479040c50` — `/settings`, enhancement (2026-06-10T16:58:20Z)

> "This page is working much better now Alhamdulillah. It would be helpful if you could link the course with a specific resource from the resources page."

**Covered by:** Wave 3 (build phases 1–5, tasks #12–#16).
**Rationale:** No relationship between `subjects` and `resources` exists in `db/schema.ts` today. Wave 3 adds a `subjectResources` many-to-many join table (#12, modeled on the existing `subjectLearners` precedent), repository hydration/sync for `resourceIds` (#13), API plumbing (#14), and UI: a "Linked resources" multi-select in `SubjectEditDialog` (#15) and a "Resources" column in `SubjectsAllTable` (#16). The user's earlier feedback (and the follow-up clarification used to scope this wave) confirmed **multiple** resources per course should be supported — the join table and multi-select directly satisfy "link the course with a specific resource from the resources page," generalized to "resources" (plural).

### `9937be68-0b80-469f-8942-d370e3521d9d` — `/dashboard`, bug (2026-06-10T17:01:21Z)

> "I saw the notification that I hadn't logged attendance today, so I clicked on the link and logged attendance, but the notification is still there."

**Covered by:** Wave 4a (build phase 1, task #17).
**Rationale:** The `attendance_missing` alert (`features/alerts/server/service.ts`) is computed from `listAttendanceEvents(householdId, { date: today })` where `today = todayLocal()`. Task #17 starts with a failing reproduction test — create an attendance record "today" as the client would, then assert `getAlerts` no longer returns `attendance_missing` for that learner — to determine whether the bug is a date/timezone mismatch between the client-submitted `date` and the server's `todayLocal()`, or a `DashboardProvider` refetch/remount gap on navigation back to `/dashboard`. The fix targets whichever layer the failing test isolates, directly addressing "I logged attendance, but the notification is still there."

### `9bb8370e-bf6f-45b7-8058-b1e975025291` — `/dashboard`, ux (2026-06-09T13:49:17Z)

> "At the top of the dashboard it says 'Set up your household.' It would be helpful to have a clickable link that takes you to that page."

**Covered by:** Wave 4b (build phases 2–3, tasks #18, #19).
**Rationale:** `NextSetupStrip.tsx`'s household step currently has no `href`, so its `{meta.href ? <Link href={meta.href}>Go →</Link> : null}` pattern renders nothing for that step, and `HouseholdSetup` is only a conditional full-page render (not a route) — there is nowhere for a link to point. Task #18 adds a standalone `/household/setup` route rendering the existing `HouseholdSetup` component; task #19 adds `href: '/household/setup'` to the household step config so the existing "Go →" link pattern now renders for it. This turns the static "Set up your household" message into the clickable link the user asked for.

**Note:** the steward-generated `20260611-0343-steward-grouped-plan.md` ("Workstream 1") proposed a narrower alternative for this same item — link directly to `/settings` (and `/settings?tab=children`/`?tab=subjects` for the other two steps) instead of a new `/household/setup` route. Both approaches satisfy the verbatim request ("a clickable link that takes you to that page"); the choice between them (new route vs. existing Settings tab) should be made before starting task #18, not assumed.

---

## Coverage summary

| Feedback ID | Page | Type | Wave | Tasks |
|---|---|---|---|---|
| `50774221` | /plan | bug | 1a | #6 |
| `fcee6fd0` | /lessons | question | 1a | #6 |
| `e534c6cc` | /plan | bug | 1b | #7, #8 |
| `80f04cd0` | /quran | question | 2a | #9 |
| `3c4cc9a2` | /resources | enhancement | 2b | #10, #11 |
| `23cd6909` | /settings | enhancement | 3 | #12–#16 |
| `9937be68` | /dashboard | bug | 4a | #17 |
| `9bb8370e` | /dashboard | ux | 4b | #18, #19 |

All 8 eligible feedback items (status `reviewed`, admin-approved) are covered. The 9th item, `46a51bee` ("Learning Time Screen"), is covered separately by `20260611-wave5-learning-time-screen-plan.md` (Wave 5).
