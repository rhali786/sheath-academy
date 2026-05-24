import { and, eq, gte, lte } from 'drizzle-orm'
import { getDb } from '@/features/lib/server/db'
import { portfolioEvidence } from '@/db/schema'

export type EvidenceRow = typeof portfolioEvidence.$inferSelect

export interface CreateEvidenceInput {
  learnerId: string
  subjectId?: string
  lessonTaskId?: string
  quranSessionId?: string
  attendanceEventId?: string
  title: string
  description?: string
  evidenceType: string
  url?: string
  evidenceDate: string
  notes?: string
}

export interface EvidenceFilters {
  learnerId?: string
  subjectId?: string
  lessonTaskId?: string
  startDate?: string
  endDate?: string
}

export async function listEvidenceRows(
  householdId: string,
  filters: EvidenceFilters = {},
): Promise<EvidenceRow[]> {
  const db = getDb()
  const conditions = [eq(portfolioEvidence.householdId, householdId)]
  if (filters.learnerId) conditions.push(eq(portfolioEvidence.learnerId, filters.learnerId))
  if (filters.subjectId) conditions.push(eq(portfolioEvidence.subjectId, filters.subjectId))
  if (filters.lessonTaskId) conditions.push(eq(portfolioEvidence.lessonTaskId, filters.lessonTaskId))
  if (filters.startDate) conditions.push(gte(portfolioEvidence.evidenceDate, filters.startDate))
  if (filters.endDate) conditions.push(lte(portfolioEvidence.evidenceDate, filters.endDate))
  return db.select().from(portfolioEvidence).where(and(...conditions))
}

export async function getEvidenceRow(
  id: string,
  householdId: string,
): Promise<EvidenceRow | null> {
  const db = getDb()
  const result = await db
    .select()
    .from(portfolioEvidence)
    .where(and(eq(portfolioEvidence.id, id), eq(portfolioEvidence.householdId, householdId)))
    .limit(1)
  return result[0] ?? null
}

export async function createEvidenceRow(
  householdId: string,
  input: CreateEvidenceInput,
): Promise<EvidenceRow> {
  const db = getDb()
  const now = new Date()
  const inserted = await db
    .insert(portfolioEvidence)
    .values({
      id: `evidence_${Date.now()}`,
      householdId,
      learnerId: input.learnerId,
      subjectId: input.subjectId ?? null,
      lessonTaskId: input.lessonTaskId ?? null,
      quranSessionId: input.quranSessionId ?? null,
      attendanceEventId: input.attendanceEventId ?? null,
      title: input.title,
      description: input.description ?? null,
      evidenceType: input.evidenceType,
      url: input.url ?? null,
      evidenceDate: input.evidenceDate,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
  return inserted[0]
}

/** Inserts an evidence row with a caller-supplied id. No-ops on conflict. For seed scripts only. */
export async function upsertEvidenceRow(
  householdId: string,
  id: string,
  input: CreateEvidenceInput,
): Promise<void> {
  const db = getDb()
  const now = new Date()
  await db
    .insert(portfolioEvidence)
    .values({
      id,
      householdId,
      learnerId: input.learnerId,
      subjectId: input.subjectId ?? null,
      lessonTaskId: input.lessonTaskId ?? null,
      quranSessionId: input.quranSessionId ?? null,
      attendanceEventId: input.attendanceEventId ?? null,
      title: input.title,
      description: input.description ?? null,
      evidenceType: input.evidenceType,
      url: input.url ?? null,
      evidenceDate: input.evidenceDate,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing()
}

export async function updateEvidenceRow(
  id: string,
  householdId: string,
  patch: Partial<Pick<CreateEvidenceInput, 'title' | 'description' | 'url' | 'evidenceDate' | 'evidenceType'>>,
): Promise<EvidenceRow | null> {
  const db = getDb()
  const update: Partial<EvidenceRow> = { updatedAt: new Date() }
  if (patch.title !== undefined) update.title = patch.title
  if (patch.description !== undefined) update.description = patch.description
  if (patch.url !== undefined) update.url = patch.url
  if (patch.evidenceDate !== undefined) update.evidenceDate = patch.evidenceDate
  if (patch.evidenceType !== undefined) update.evidenceType = patch.evidenceType

  const result = await db
    .update(portfolioEvidence)
    .set(update)
    .where(and(eq(portfolioEvidence.id, id), eq(portfolioEvidence.householdId, householdId)))
    .returning()
  return result[0] ?? null
}

export async function deleteEvidenceRow(
  id: string,
  householdId: string,
): Promise<boolean> {
  const db = getDb()
  const result = await db
    .delete(portfolioEvidence)
    .where(and(eq(portfolioEvidence.id, id), eq(portfolioEvidence.householdId, householdId)))
    .returning()
  return result.length > 0
}
