import type {
  ResourceFeedback,
  CommunityNote,
  CompatibilitySignal,
  FeedbackPrivacyLevel,
  FeedbackStatus,
} from '@/features/resources/types'
import { createMemoryStore } from '@/features/lib/server/memoryStore'

// ── Stores ────────────────────────────────────────────────────────────────────

let fbCounter = 0
function generateFeedbackId(): string {
  fbCounter++
  return `fb_${Date.now()}_${fbCounter}`
}

let noteCounter = 0
function generateNoteId(): string {
  noteCounter++
  return `note_${Date.now()}_${noteCounter}`
}

const feedbackStore = createMemoryStore<ResourceFeedback>([])
const noteStore = createMemoryStore<CommunityNote>([])

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
export function createFeedback(input: CreateFeedbackInput): ResourceFeedback {
  if (input.containsCopyrightedContent) {
    throw new Error('Submissions containing copyrighted content are not permitted.')
  }

  const privacyLevel = input.privacyLevel ?? 'anonymous'
  const now = new Date().toISOString()

  const feedback: ResourceFeedback = {
    id: generateFeedbackId(),
    resourceId: input.resourceId,
    parentId: input.parentId,
    displayParentId: privacyLevel === 'anonymous' ? undefined : input.parentId,
    compatibility: input.compatibility,
    rating: input.rating,
    difficulty: input.difficulty,
    actualTimeMinutes: input.actualTimeMinutes,
    islamicNote: input.islamicNote,
    worksIndependently: input.worksIndependently,
    worksTeacherLed: input.worksTeacherLed,
    privacyLevel,
    status: 'pending_review',
    createdAt: now,
  }

  feedbackStore.insert(feedback)

  // Also create a pending community note from this feedback
  const note: CommunityNote = {
    id: generateNoteId(),
    resourceId: input.resourceId,
    feedbackId: feedback.id,
    difficulty: input.difficulty,
    islamicNote: input.islamicNote,
    status: 'pending_review',
    createdAt: now,
    updatedAt: now,
  }
  noteStore.insert(note)

  return feedback
}

export function listFeedback(resourceId: string): ResourceFeedback[] {
  return feedbackStore.getAll().filter(f => f.resourceId === resourceId)
}

// ── Community notes ───────────────────────────────────────────────────────────

/**
 * Returns the first verified community note for a resource, or null if none exists.
 */
export function getVerifiedCommunityNote(resourceId: string): CommunityNote | null {
  const note = noteStore.getAll().find(
    n => n.resourceId === resourceId && n.status === 'verified'
  )
  return note ?? null
}

export function listNotes(resourceId: string): CommunityNote[] {
  return noteStore.getAll().filter(n => n.resourceId === resourceId)
}

// ── Moderation ────────────────────────────────────────────────────────────────

/**
 * Moderates a community note by feedback ID.
 * 'approve' → status becomes 'verified'; 'reject' → status becomes 'rejected'.
 */
export function moderateNote(
  feedbackId: string,
  action: 'approve' | 'reject',
): CommunityNote | null {
  const note = noteStore.getAll().find(n => n.feedbackId === feedbackId)
  if (!note) return null

  const newStatus: FeedbackStatus = action === 'approve' ? 'verified' : 'rejected'
  return noteStore.update(note.id, { status: newStatus, updatedAt: new Date().toISOString() })
}
