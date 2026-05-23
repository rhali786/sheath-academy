/**
 * Unit tests for Wave 14 — Community curriculum intelligence
 */

jest.mock('@/features/resources/server/repository', () => {
  const feedback: Array<Record<string, unknown>> = []
  const notes: Array<Record<string, unknown>> = []

  return {
    createFeedback: jest.fn(async (input: Record<string, unknown>) => {
      const row = {
        id: `fb_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        displayParentId: input.privacyLevel === 'anonymous' ? undefined : input.parentId,
        createdAt: new Date().toISOString(),
        ...input,
      }
      feedback.push(row)
      return row
    }),
    createCommunityNote: jest.fn(async (input: Record<string, unknown>) => {
      const row = {
        id: `note_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...input,
      }
      notes.push(row)
      return row
    }),
    listFeedback: jest.fn(async () => feedback),
    getVerifiedCommunityNote: jest.fn(async () => null),
    listNotes: jest.fn(async () => notes),
    moderateNote: jest.fn(async (feedbackId: string, action: 'approve' | 'reject') => {
      const note = notes.find((n) => n.feedbackId === feedbackId)
      if (!note) return null
      note.status = action === 'approve' ? 'verified' : 'rejected'
      return note
    }),
  }
})

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
  it('stores feedback with status pending_review', async () => {
    const fb = await createFeedback(BASE_FEEDBACK)
    expect(fb.status).toBe('pending_review')
    expect(fb.id).toMatch(/^fb_/)
  })

  it('stores parentId as undefined when privacyLevel is anonymous', async () => {
    const fb = await createFeedback({ ...BASE_FEEDBACK, privacyLevel: 'anonymous' })
    expect(fb.displayParentId).toBeUndefined()
  })

  it('stores parentId when privacyLevel is named', async () => {
    const fb = await createFeedback({ ...BASE_FEEDBACK, privacyLevel: 'named' })
    expect(fb.displayParentId).toBe(BASE_FEEDBACK.parentId)
  })

  it('rejects feedback flagged as containing copyrighted content', async () => {
    await expect(
      createFeedback({ ...BASE_FEEDBACK, containsCopyrightedContent: true }),
    ).rejects.toThrow(/copyright/)
  })
})

describe('getVerifiedCommunityNote', () => {
  it('returns null when no verified note exists for the resource', async () => {
    const note = await getVerifiedCommunityNote('res_no_notes')
    expect(note).toBeNull()
  })
})

describe('moderateNote', () => {
  it('changes note status to verified on approve action', async () => {
    const fb = await createFeedback({ ...BASE_FEEDBACK, resourceId: 'res_mod_test' })
    const note = await moderateNote(fb.id, 'approve')
    expect(note?.status).toBe('verified')
  })

  it('changes note status to rejected on reject action', async () => {
    const fb = await createFeedback({ ...BASE_FEEDBACK, resourceId: 'res_mod_test_2' })
    const note = await moderateNote(fb.id, 'reject')
    expect(note?.status).toBe('rejected')
  })
})
