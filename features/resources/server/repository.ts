import { and, eq } from 'drizzle-orm'
import { getDb } from '@/features/lib/server/db'
import { resourceFeedback, resourceCommunityNotes } from '@/db/schema'
import type { ResourceFeedback, CommunityNote } from '@/features/resources/types'

export type ResourceFeedbackRow = typeof resourceFeedback.$inferSelect
export type CommunityNoteRow = typeof resourceCommunityNotes.$inferSelect

function toResourceFeedback(row: ResourceFeedbackRow): ResourceFeedback {
  return {
    ...row,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
  } as ResourceFeedback
}

function toCommunityNote(row: CommunityNoteRow): CommunityNote {
  return {
    ...row,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : row.updatedAt,
  } as CommunityNote
}

export interface CreateFeedbackInput {
  resourceId: string
  parentId: string
  compatibility: string
  rating?: number
  difficulty?: string
  actualTimeMinutes?: number
  islamicNote?: string
  worksIndependently?: boolean
  worksTeacherLed?: boolean
  privacyLevel?: string
  status?: string
}

export interface CreateCommunityNoteInput {
  resourceId: string
  feedbackId: string
  difficulty?: string
  islamicNote?: string
  status?: string
}

export async function createFeedback(input: CreateFeedbackInput): Promise<ResourceFeedback> {
  const db = getDb()
  const now = new Date()
  const privacyLevel = input.privacyLevel ?? 'anonymous'

  const inserted = await db
    .insert(resourceFeedback)
    .values({
      id: `fb_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      resourceId: input.resourceId,
      parentId: input.parentId,
      displayParentId: privacyLevel === 'anonymous' ? null : input.parentId,
      compatibility: input.compatibility,
      rating: input.rating ?? null,
      difficulty: input.difficulty ?? null,
      actualTimeMinutes: input.actualTimeMinutes ?? null,
      islamicNote: input.islamicNote ?? null,
      worksIndependently: input.worksIndependently ?? null,
      worksTeacherLed: input.worksTeacherLed ?? null,
      privacyLevel,
      status: input.status ?? 'pending_review',
      createdAt: now,
    })
    .returning()

  const row = inserted[0]
  return toResourceFeedback(row)
}

export async function listFeedback(resourceId: string): Promise<ResourceFeedback[]> {
  const db = getDb()
  const rows = await db
    .select()
    .from(resourceFeedback)
    .where(eq(resourceFeedback.resourceId, resourceId))

  return rows.map(toResourceFeedback)
}

export async function createCommunityNote(input: CreateCommunityNoteInput): Promise<CommunityNote> {
  const db = getDb()
  const now = new Date()

  const inserted = await db
    .insert(resourceCommunityNotes)
    .values({
      id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      resourceId: input.resourceId,
      feedbackId: input.feedbackId,
      difficulty: input.difficulty ?? null,
      islamicNote: input.islamicNote ?? null,
      status: input.status ?? 'pending_review',
      createdAt: now,
      updatedAt: now,
    })
    .returning()

  return toCommunityNote(inserted[0])
}

export async function getVerifiedCommunityNote(resourceId: string): Promise<CommunityNote | null> {
  const db = getDb()
  const rows = await db
    .select()
    .from(resourceCommunityNotes)
    .where(and(eq(resourceCommunityNotes.resourceId, resourceId), eq(resourceCommunityNotes.status, 'verified')))
    .limit(1)

  return rows[0] ? toCommunityNote(rows[0]) : null
}

export async function listNotes(resourceId: string): Promise<CommunityNote[]> {
  const db = getDb()
  const rows = await db
    .select()
    .from(resourceCommunityNotes)
    .where(eq(resourceCommunityNotes.resourceId, resourceId))

  return rows.map(toCommunityNote)
}

export async function moderateNote(
  feedbackId: string,
  action: 'approve' | 'reject',
): Promise<CommunityNote | null> {
  const db = getDb()
  const rows = await db
    .select()
    .from(resourceCommunityNotes)
    .where(eq(resourceCommunityNotes.feedbackId, feedbackId))
    .limit(1)

  const note = rows[0]
  if (!note) return null

  const newStatus = action === 'approve' ? 'verified' : 'rejected'
  const updated = await db
    .update(resourceCommunityNotes)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(resourceCommunityNotes.id, note.id))
    .returning()

  return updated[0] ? toCommunityNote(updated[0]) : null
}
