# Wave 14 — Community curriculum intelligence

**Source:** FB-013
**Priority:** P3
**Depends on:** Wave 13 complete

---

## Changes

Extends `features/resources/` with a community feedback and moderation layer.

- **Parent feedback** on resources/lessons: rating, difficulty, actual time, vocab load, parent prep needed, supplies, works-independently flag, works-teacher-led flag, Islamic compatibility note.
- **Muslim-native review signals**: Generally compatible / Needs parent context / Contains worldview concern / Contains sensitive content / Strongly beneficial / Not reviewed yet.
- Parent notes are opt-in — not auto-exposed to other users without consent.
- **Sheath Community Note** per resource: distilled, vetted insight in consistent format (difficulty, time, prep, supplies, Islamic note, vocab warnings, pacing pattern, common modifications).
- **Community pacing signals**: "Most families spend 2 days on this lesson."
- Contribution copyright guards: no sharing of copyrighted textbook pages, answer keys, or teacher manual content.
- **Moderation/review workflow**: notes require review before becoming publicly visible.
- **Privacy controls**: Anonymous / Named / Private / Share with Sheath for review.

---

## TDD

**Unit tests (`features/resources/__tests__/api/`):**
- `createResourceFeedback({ resourceId, parentId, compatibility: 'needsContext', ... })` → stored with `status: 'pending_review'`.
- `getVerifiedCommunityNote(resourceId)` → returns `null` when no verified notes exist.
- Feedback flagged as containing copyrighted content → blocked from submission (returns error).
- `moderateNote(noteId, action: 'approve')` → note status changes to `verified`.

**Integration tests (`features/resources/__tests__/integration/`):**
- Render `ResourceCard` with no verified note → assert no "Community Note" section visible.
- Render `ResourceCard` with verified note → assert "Community Note" section visible.
- Render `FeedbackForm` → assert Islamic compatibility selector present.
- Render `FeedbackForm` → select Anonymous contribution → feedback stores without parent name.
- Submit feedback → assert "Under review" status shown to submitter; assert note not publicly visible yet.

**Playwright (`e2e/planner.spec.ts`):**
- Navigate to a resource, click "Leave feedback" → assert form opens.
- Submit feedback → assert "Under review" message appears.
- Assert community note section is NOT visible (no verified notes in seed).

---

## File index

| File | Change |
|------|--------|
| `features/resources/types.ts` | Add ResourceFeedback, CommunityNote, CompatibilitySignal types |
| `features/resources/server/service.ts` | `createFeedback()`, `getCommunityNote()` |
| `features/resources/server/moderation.ts` | New — moderation workflow |
| `features/resources/front/components/FeedbackForm.tsx` | New — parent feedback form |
| `features/resources/front/components/CommunityNoteCard.tsx` | New — vetted note display |
| `features/resources/front/components/IslamicCompatibilityBadge.tsx` | New — compatibility signal |
| `features/resources/__tests__/api/community.test.ts` | New |
| `features/resources/__tests__/integration/FeedbackForm.test.tsx` | New |
| `e2e/planner.spec.ts` | Community note + feedback assertions |
