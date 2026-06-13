import { and, eq, gte, lte, ne } from 'drizzle-orm'
import { getDb } from '@/features/lib/server/db'
import { learningTimeSessions } from '@/db/schema'
import type { SessionListFilters } from '../types'

export type LearningTimeSessionRow = typeof learningTimeSessions.$inferSelect

export interface CreateSessionRowInput {
  learnerId: string
  subjectId?: string | null
  lessonTaskId?: string | null
  timeChannelType: string
  targetMinutes?: number | null
  scheduledStart?: Date | null
  scheduledEnd?: Date | null
}

export type SessionRowPatch = Partial<
  Pick<
    LearningTimeSessionRow,
    'status' | 'startedAt' | 'pausedAt' | 'endedAt' | 'endedBy' | 'outcome' | 'notes'
  >
>

export async function getSessionRow(
  id: string,
  householdId: string,
): Promise<LearningTimeSessionRow | null> {
  const db = getDb()
  const result = await db
    .select()
    .from(learningTimeSessions)
    .where(and(eq(learningTimeSessions.id, id), eq(learningTimeSessions.householdId, householdId)))
    .limit(1)
  return result[0] ?? null
}

/** Returns the learner's non-finalized session, if any. A learner may have at most one. */
export async function getActiveSessionRow(
  householdId: string,
  learnerId: string,
): Promise<LearningTimeSessionRow | null> {
  const db = getDb()
  const result = await db
    .select()
    .from(learningTimeSessions)
    .where(
      and(
        eq(learningTimeSessions.householdId, householdId),
        eq(learningTimeSessions.learnerId, learnerId),
        ne(learningTimeSessions.status, 'finalized'),
      ),
    )
    .limit(1)
  return result[0] ?? null
}

/** Creates a 'draft' session. Rejects if the learner already has a non-finalized session. */
export async function createSessionRow(
  householdId: string,
  input: CreateSessionRowInput,
): Promise<LearningTimeSessionRow> {
  const existing = await getActiveSessionRow(householdId, input.learnerId)
  if (existing) {
    throw new Error('Learner already has an active learning time session')
  }

  const db = getDb()
  const now = new Date()
  const inserted = await db
    .insert(learningTimeSessions)
    .values({
      id: `lt_${Date.now()}`,
      householdId,
      learnerId: input.learnerId,
      subjectId: input.subjectId ?? null,
      lessonTaskId: input.lessonTaskId ?? null,
      timeChannelType: input.timeChannelType,
      targetMinutes: input.targetMinutes ?? null,
      scheduledStart: input.scheduledStart ?? null,
      scheduledEnd: input.scheduledEnd ?? null,
      status: 'draft',
      startedAt: null,
      pausedAt: null,
      endedAt: null,
      endedBy: null,
      outcome: null,
      notes: null,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
  return inserted[0]
}

export async function updateSessionRow(
  id: string,
  householdId: string,
  patch: SessionRowPatch,
): Promise<LearningTimeSessionRow | null> {
  const db = getDb()
  const result = await db
    .update(learningTimeSessions)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(learningTimeSessions.id, id), eq(learningTimeSessions.householdId, householdId)))
    .returning()
  return result[0] ?? null
}

/** Finalized sessions in range, most recent first is not guaranteed — callers may sort. */
export async function listFinalizedSessionRows(
  householdId: string,
  filters: SessionListFilters = {},
): Promise<LearningTimeSessionRow[]> {
  const db = getDb()
  const conditions = [
    eq(learningTimeSessions.householdId, householdId),
    eq(learningTimeSessions.status, 'finalized'),
  ]
  if (filters.learnerId) conditions.push(eq(learningTimeSessions.learnerId, filters.learnerId))
  if (filters.from) conditions.push(gte(learningTimeSessions.endedAt, new Date(filters.from)))
  if (filters.to) conditions.push(lte(learningTimeSessions.endedAt, new Date(filters.to)))
  return db.select().from(learningTimeSessions).where(and(...conditions))
}
