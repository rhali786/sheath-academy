import { and, eq } from 'drizzle-orm'
import { getDb } from '@/features/lib/server/db'
import { resources, resourceFeedback, resourceCommunityNotes } from '@/db/schema'
import type { Resource, ResourceType, VerificationStatus, ResourceFeedback, CommunityNote } from '@/features/resources/types'

export type ResourceRow = typeof resources.$inferSelect
export type ResourceFeedbackRow = typeof resourceFeedback.$inferSelect
export type CommunityNoteRow = typeof resourceCommunityNotes.$inferSelect

export interface CreateResourceInput {
  title: string
  resourceType: ResourceType
  publisher?: string
  author?: string
  edition?: string
  gradeLevel?: string
  subjectCategory?: string
  isbn?: string
  totalPages?: number
  totalLessons?: number
  totalChapters?: number
}

function toIso(v: Date | string): string {
  return v instanceof Date ? v.toISOString() : v
}

export function mapResourceRow(row: ResourceRow): Resource {
  return {
    id: row.id,
    workspaceId: row.householdId,
    title: row.title,
    publisher: row.publisher ?? undefined,
    author: row.author ?? undefined,
    edition: row.edition ?? undefined,
    gradeLevel: row.gradeLevel ?? undefined,
    subjectCategory: row.subjectCategory ?? undefined,
    isbn: row.isbn ?? undefined,
    resourceType: row.resourceType as ResourceType,
    totalPages: row.totalPages ?? undefined,
    totalLessons: row.totalLessons ?? undefined,
    totalChapters: row.totalChapters ?? undefined,
    verificationStatus: row.verificationStatus as VerificationStatus,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  }
}

export async function listResourceRows(householdId: string): Promise<ResourceRow[]> {
  const db = getDb()
  return db.select().from(resources).where(eq(resources.householdId, householdId))
}

export async function getResourceRow(id: string, householdId: string): Promise<ResourceRow | null> {
  const db = getDb()
  const rows = await db
    .select()
    .from(resources)
    .where(and(eq(resources.id, id), eq(resources.householdId, householdId)))
    .limit(1)
  return rows[0] ?? null
}

export async function createResourceRow(
  householdId: string,
  input: CreateResourceInput,
): Promise<ResourceRow> {
  const db = getDb()
  const now = new Date()
  const rows = await db
    .insert(resources)
    .values({
      id: `res_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      householdId,
      title: input.title,
      resourceType: input.resourceType,
      publisher: input.publisher ?? null,
      author: input.author ?? null,
      edition: input.edition ?? null,
      gradeLevel: input.gradeLevel ?? null,
      subjectCategory: input.subjectCategory ?? null,
      isbn: input.isbn ?? null,
      totalPages: input.totalPages ?? null,
      totalLessons: input.totalLessons ?? null,
      totalChapters: input.totalChapters ?? null,
      verificationStatus: 'user-submitted',
      createdAt: now,
      updatedAt: now,
    })
    .returning()
  return rows[0]
}

export async function updateResourceVerificationRow(
  id: string,
  householdId: string,
  status: VerificationStatus,
): Promise<ResourceRow | null> {
  const db = getDb()
  const rows = await db
    .update(resources)
    .set({ verificationStatus: status, updatedAt: new Date() })
    .where(and(eq(resources.id, id), eq(resources.householdId, householdId)))
    .returning()
  return rows[0] ?? null
}

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
