/**
 * Unit tests for Wave 14 — Community curriculum intelligence
 * TDD: written before implementation
 */

import {
  createFeedback,
  getVerifiedCommunityNote,
  moderateNote,
} from '@/features/resources/server/moderation'

const BASE_FEEDBACK = {
  resourceId: 'res_001',
  parentId: 'parent_001',
  compatibility: 'needsContext' as const,
  rating: 4,
  privacyLevel: 'anonymous' as const,
}

describe('createFeedback', () => {
  it('stores feedback with status pending_review', () => {
    const fb = createFeedback(BASE_FEEDBACK)
    expect(fb.status).toBe('pending_review')
    expect(fb.id).toMatch(/^fb_/)
  })

  it('stores parentId as undefined when privacyLevel is anonymous', () => {
    const fb = createFeedback({ ...BASE_FEEDBACK, privacyLevel: 'anonymous' })
    expect(fb.displayParentId).toBeUndefined()
  })

  it('stores parentId when privacyLevel is named', () => {
    const fb = createFeedback({ ...BASE_FEEDBACK, privacyLevel: 'named' })
    expect(fb.displayParentId).toBe(BASE_FEEDBACK.parentId)
  })

  it('rejects feedback flagged as containing copyrighted content', () => {
    expect(() =>
      createFeedback({ ...BASE_FEEDBACK, containsCopyrightedContent: true })
    ).toThrow(/copyright/)
  })
})

describe('getVerifiedCommunityNote', () => {
  it('returns null when no verified note exists for the resource', () => {
    const note = getVerifiedCommunityNote('res_no_notes')
    expect(note).toBeNull()
  })
})

describe('moderateNote', () => {
  it('changes note status to verified on approve action', () => {
    // First create a note via feedback approval workflow
    const fb = createFeedback({ ...BASE_FEEDBACK, resourceId: 'res_mod_test' })
    const note = moderateNote(fb.id, 'approve')
    expect(note?.status).toBe('verified')
  })

  it('changes note status to rejected on reject action', () => {
    const fb = createFeedback({ ...BASE_FEEDBACK, resourceId: 'res_mod_test_2' })
    const note = moderateNote(fb.id, 'reject')
    expect(note?.status).toBe('rejected')
  })
})
