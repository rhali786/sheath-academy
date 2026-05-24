import { and, eq } from 'drizzle-orm'
import { getDb } from '@/features/lib/server/db'
import { learners } from '@/db/schema'

export type LearnerRow = typeof learners.$inferSelect

export interface CreateLearnerInput {
  name: string
  gradeLevel?: string
  displayColor?: string
  sortOrder?: number
}

export interface UpdateLearnerInput {
  name?: string
  gradeLevel?: string
  displayColor?: string
  sortOrder?: number
}

export async function listLearners(householdId: string): Promise<LearnerRow[]> {
  const db = getDb()
  return db
    .select()
    .from(learners)
    .where(and(eq(learners.householdId, householdId), eq(learners.isActive, true)))
}

export async function listAllLearners(householdId: string): Promise<LearnerRow[]> {
  const db = getDb()
  return db.select().from(learners).where(eq(learners.householdId, householdId))
}

export async function getLearner(
  id: string,
  householdId: string,
): Promise<LearnerRow | null> {
  const db = getDb()
  const result = await db
    .select()
    .from(learners)
    .where(and(eq(learners.id, id), eq(learners.householdId, householdId)))
    .limit(1)
  return result[0] ?? null
}

export async function createLearner(
  householdId: string,
  input: CreateLearnerInput,
): Promise<LearnerRow> {
  const db = getDb()
  const now = new Date()
  const inserted = await db
    .insert(learners)
    .values({
      id: `learner_${Date.now()}`,
      householdId,
      name: input.name,
      gradeLevel: input.gradeLevel ?? null,
      displayColor: input.displayColor ?? null,
      isActive: true,
      sortOrder: input.sortOrder ?? 0,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
  return inserted[0]
}

/** Finds learner by id or creates with that id. Idempotent for seeds. */
export async function upsertLearner(
  householdId: string,
  learnerId: string,
  input: CreateLearnerInput,
): Promise<LearnerRow> {
  const existing = await getLearner(learnerId, householdId)
  if (existing) return existing

  const db = getDb()
  const now = new Date()
  const inserted = await db
    .insert(learners)
    .values({
      id: learnerId,
      householdId,
      name: input.name,
      gradeLevel: input.gradeLevel ?? null,
      displayColor: input.displayColor ?? null,
      isActive: true,
      sortOrder: input.sortOrder ?? 0,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
  return inserted[0]
}

export async function updateLearner(
  id: string,
  householdId: string,
  input: UpdateLearnerInput,
): Promise<LearnerRow | null> {
  const db = getDb()
  const patch: Partial<LearnerRow> = { updatedAt: new Date() }
  if (input.name !== undefined) patch.name = input.name
  if (input.gradeLevel !== undefined) patch.gradeLevel = input.gradeLevel
  if (input.displayColor !== undefined) patch.displayColor = input.displayColor
  if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder

  const result = await db
    .update(learners)
    .set(patch)
    .where(and(eq(learners.id, id), eq(learners.householdId, householdId)))
    .returning()
  return result[0] ?? null
}

export async function archiveLearner(
  id: string,
  householdId: string,
): Promise<LearnerRow | null> {
  const db = getDb()
  const result = await db
    .update(learners)
    .set({ isActive: false, archivedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(learners.id, id), eq(learners.householdId, householdId)))
    .returning()
  return result[0] ?? null
}

export async function restoreLearner(
  id: string,
  householdId: string,
): Promise<LearnerRow | null> {
  const db = getDb()
  const result = await db
    .update(learners)
    .set({ isActive: true, archivedAt: null, updatedAt: new Date() })
    .where(and(eq(learners.id, id), eq(learners.householdId, householdId)))
    .returning()
  return result[0] ?? null
}
