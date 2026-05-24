# Wave 13 — Curriculum / resource pacing engine

**Source:** FB-012
**Depends on:** Waves 0, 8, 10 complete

---

## Changes

Expands `features/resources/` (created as a stub in Wave 0).

- Structured resource metadata: title, publisher, author, edition, grade/level, subject/category, ISBN, resource type (textbook, workbook, online course, Quran text, reader, etc.), total pages, lesson count, units/chapters/modules.
- **Lesson generation from resource structure**: by pages, by chapters, by lessons, by surahs/ayahs, by modules.
- **Pacing calculation**: resource length ÷ course schedule days = pages/lessons per day.
- **Pacing targets**: finish by school year end, finish by custom date, X pages/lessons per week, X sessions per week.
- **Progress tracking**: completed through page X of Y; recalculates needed pace automatically.
- **Adaptive recalculation**: surface updated pace suggestion; user confirms before plan changes.
- **Shared resource database**: one entry per resource; admin verification workflow.
- Edition-exact matching; verification status: User-submitted / Needs review / Verified / Deprecated.
- Copyright guardrails: no redistribution of copyrighted textbook content.

---

## TDD

**Unit tests (`features/resources/__tests__/api/`):**
- `calculatePace({ totalPages: 360, scheduledDays: 150 })` → `{ pagesPerDay: 2.4 }`.
- `calculatePace({ totalPages: 360, completedPages: 57, scheduledDaysRemaining: 120 })` → `{ pagesPerDayNeeded: 2.525 }`.
- `generateLessons({ resource, strategy: 'byChapter', chapters: 30, schoolDays: 36 })` → returns array of 30 lesson stubs distributed across school days.

**Integration tests (`features/resources/__tests__/integration/`):**
- Render `ResourceForm` → assert title, publisher, edition, resource type fields present.
- Render `ResourceForm` → assert lesson generation button appears after total pages entered.
- Render `PacingCard` in behind-pace state → assert "You need X pages/day to finish on time" visible.
- Render resource with verification status "Verified" → assert "Verified" badge visible.
- Render resource with status "Needs review" → assert "Needs review" badge visible.

**Playwright (`e2e/planner.spec.ts`):**
- Navigate to `/resources`, add a resource with 10 chapters → click "Generate lessons" → assert 10 lessons appear in the plan.

---

## File index

| File | Change |
|------|--------|
| `features/resources/types.ts` | Resource, PacingTarget, LessonGenerationStrategy, VerificationStatus types |
| `features/resources/server/service.ts` | `createResource()`, `calculatePace()`, `generateLessons()`, `updateVerificationStatus()` |
| `features/resources/front/pages/ResourcesPage.tsx` | Expand from Wave 0 stub → full resource library |
| `features/resources/front/components/ResourceForm.tsx` | Full metadata entry form |
| `features/resources/front/components/PacingCard.tsx` | Pacing status + adaptive alert |
| `features/resources/front/components/LessonGenerationPanel.tsx` | Generate lessons from resource |
| `features/resources/api/router.ts` | Extend with pacing + generation routes |
| `features/resources/__tests__/api/resources.test.ts` | New |
| `features/resources/__tests__/integration/ResourcesPage.test.tsx` | New |
| `e2e/planner.spec.ts` | Pacing + lesson generation assertions |
