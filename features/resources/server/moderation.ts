import type { CompatibilitySignal, FeedbackPrivacyLevel } from '@/features/resources/types'
import type { ResourceFeedback, CommunityNote } from '@/features/resources/types'
import {
  createFeedback as repoCreateFeedback,
  createCommunityNote,
  listFeedback as repoListFeedback,
  getVerifiedCommunityNote as repoGetVerifiedCommunityNote,
  listNotes as repoListNotes,
  moderateNote as repoModerateNote,
} from './repository'

// ── Feedback ──────────────────────────────────────────────────────────────────

export interface CreateFeedbackInput {
  resourceId: string
  parentId: string
  compatibility: CompatibilitySignal
  rating?: number
  difficulty?: string
  actualTimeMinutes?: number
  islamicNote?: string
  worksIndependently?: boolean
  worksTeacherLed?: boolean
  privacyLevel?: FeedbackPrivacyLevel
  containsCopyrightedContent?: boolean
}

/**
 * Creates a new resource feedback entry with `status: 'pending_review'`.
 * Throws if the submission is flagged as containing copyrighted content.
 * Parent name is hidden when privacyLevel is 'anonymous'.
 */
export async function createFeedback(input: CreateFeedbackInput): Promise<ResourceFeedback> {
  if (input.containsCopyrightedContent) {
    throw new Error('Submissions containing copyrighted content are not permitted.')
  }

  const privacyLevel = input.privacyLevel ?? 'anonymous'

  const feedback = await repoCreateFeedback({
    resourceId: input.resourceId,
    parentId: input.parentId,
    compatibility: input.compatibility,
    rating: input.rating,
    difficulty: input.difficulty,
    actualTimeMinutes: input.actualTimeMinutes,
    islamicNote: input.islamicNote,
    worksIndependently: input.worksIndependently,
    worksTeacherLed: input.worksTeacherLed,
    privacyLevel,
    status: 'pending_review',
  })

  await createCommunityNote({
    resourceId: input.resourceId,
    feedbackId: feedback.id,
    difficulty: input.difficulty,
    islamicNote: input.islamicNote,
    status: 'pending_review',
  })

  return feedback
}

export async function listFeedback(resourceId: string): Promise<ResourceFeedback[]> {
  return repoListFeedback(resourceId)
}

// ── Community notes ───────────────────────────────────────────────────────────

/**
 * Returns the first verified community note for a resource, or null if none exists.
 */
export async function getVerifiedCommunityNote(resourceId: string): Promise<CommunityNote | null> {
  return repoGetVerifiedCommunityNote(resourceId)
}

export async function listNotes(resourceId: string): Promise<CommunityNote[]> {
  return repoListNotes(resourceId)
}

// ── Moderation ────────────────────────────────────────────────────────────────

/**
 * Moderates a community note by feedback ID.
 * 'approve' → status becomes 'verified'; 'reject' → status becomes 'rejected'.
 */
export async function moderateNote(
  feedbackId: string,
  action: 'approve' | 'reject',
): Promise<CommunityNote | null> {
  return repoModerateNote(feedbackId, action)
}
