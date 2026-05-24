import { and, eq, isNull } from 'drizzle-orm'
import { getDb } from '@/features/lib/server/db'
import { subjects } from '@/db/schema'

export type SubjectRow = typeof subjects.$inferSelect

export interface CreateSubjectInput {
  name: string
  category: string
  learnerId?: string
  color?: string
  description?: string
  sortOrder?: number
}

export interface UpdateSubjectInput {
  name?: string
  category?: string
  color?: string
  description?: string
  sortOrder?: number
}

export async function listSubjectRows(
  householdId: string,
  learnerId?: string,
  includeInactive = false,
): Promise<SubjectRow[]> {
  const db = getDb()
  const conditions = [eq(subjects.householdId, householdId)]
  if (!includeInactive) conditions.push(eq(subjects.isActive, true))
  if (learnerId) conditions.push(eq(subjects.learnerId, learnerId))
  return db.select().from(subjects).where(and(...conditions))
}

export async function getSubjectRow(
  id: string,
  householdId: string,
): Promise<SubjectRow | null> {
  const db = getDb()
  const result = await db
    .select()
    .from(subjects)
    .where(and(eq(subjects.id, id), eq(subjects.householdId, householdId)))
    .limit(1)
  return result[0] ?? null
}

export async function upsertSubjectRow(
  householdId: string,
  subjectId: string,
  input: CreateSubjectInput,
): Promise<SubjectRow> {
  const existing = await getSubjectRow(subjectId, householdId)
  if (existing) return existing

  const db = getDb()
  const now = new Date()
  const inserted = await db
    .insert(subjects)
    .values({
      id: subjectId,
      householdId,
      learnerId: input.learnerId ?? null,
      name: input.name,
      category: input.category,
      description: input.description ?? null,
      color: input.color ?? null,
      sortOrder: input.sortOrder ?? 0,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
  return inserted[0]
}

export async function createSubjectRow(
  householdId: string,
  input: CreateSubjectInput,
): Promise<SubjectRow> {
  const db = getDb()
  const now = new Date()
  const inserted = await db
    .insert(subjects)
    .values({
      id: `subject_${Date.now()}`,
      householdId,
      learnerId: input.learnerId ?? null,
      name: input.name,
      category: input.category,
      description: input.description ?? null,
      color: input.color ?? null,
      sortOrder: input.sortOrder ?? 0,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
  return inserted[0]
}

export async function updateSubjectRow(
  id: string,
  householdId: string,
  input: UpdateSubjectInput,
): Promise<SubjectRow | null> {
  const db = getDb()
  const patch: Partial<SubjectRow> = { updatedAt: new Date() }
  if (input.name !== undefined) patch.name = input.name
  if (input.category !== undefined) patch.category = input.category
  if (input.color !== undefined) patch.color = input.color
  if (input.description !== undefined) patch.description = input.description
  if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder

  const result = await db
    .update(subjects)
    .set(patch)
    .where(and(eq(subjects.id, id), eq(subjects.householdId, householdId)))
    .returning()
  return result[0] ?? null
}

export async function archiveSubjectRow(
  id: string,
  householdId: string,
): Promise<SubjectRow | null> {
  const db = getDb()
  const result = await db
    .update(subjects)
    .set({ isActive: false, updatedAt: new Date() })
    .where(and(eq(subjects.id, id), eq(subjects.householdId, householdId)))
    .returning()
  return result[0] ?? null
}

export async function archiveSubjectsByLearner(
  learnerId: string,
  householdId: string,
): Promise<void> {
  const db = getDb()
  await db
    .update(subjects)
    .set({ isActive: false, updatedAt: new Date() })
    .where(and(eq(subjects.learnerId, learnerId), eq(subjects.householdId, householdId)))
}
