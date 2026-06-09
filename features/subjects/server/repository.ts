import { and, eq, inArray, isNull } from 'drizzle-orm'
import { getDb } from '@/features/lib/server/db'
import { subjects, subjectLearners } from '@/db/schema'

export type SubjectRow = typeof subjects.$inferSelect
export type SubjectRowWithLearners = SubjectRow & { learnerIds: string[] }

export interface CreateSubjectInput {
  name: string
  category: string
  /** Primary learner — sets subjects.learnerId for back-compat. */
  learnerId?: string
  /** Full set of enrolled learners. When provided, learnerId is used as first element. */
  learnerIds?: string[]
  /** Optional school year association. Caller defaults to active year in phase-2 routes. */
  schoolYearId?: string
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
  /** Replace enrolled learners when provided. Primary learner = learnerIds[0]. */
  learnerIds?: string[]
}

/** Attach subject_learners rows for a subject, deduplicating. */
async function writeLearnerRows(subjectId: string, learnerIdList: string[]): Promise<void> {
  if (learnerIdList.length === 0) return
  const db = getDb()
  await db
    .insert(subjectLearners)
    .values(learnerIdList.map((lid) => ({ subjectId, learnerId: lid })))
    .onConflictDoNothing()
}

/** Replace subject_learners enrollment to match learnerIdList exactly. */
async function syncLearnerRows(subjectId: string, learnerIdList: string[]): Promise<void> {
  const db = getDb()
  const existing = await db
    .select({ learnerId: subjectLearners.learnerId })
    .from(subjectLearners)
    .where(eq(subjectLearners.subjectId, subjectId))
  const next = [...new Set(learnerIdList)]
  const toRemove = existing.map((r) => r.learnerId).filter((id) => !next.includes(id))
  if (toRemove.length > 0) {
    await db
      .delete(subjectLearners)
      .where(and(eq(subjectLearners.subjectId, subjectId), inArray(subjectLearners.learnerId, toRemove)))
  }
  await writeLearnerRows(subjectId, next.filter((id) => !existing.some((r) => r.learnerId === id)))
}

/** Read all learner IDs enrolled in a subject, in insertion order. */
async function readLearnerIds(subjectId: string): Promise<string[]> {
  const db = getDb()
  const rows = await db
    .select({ learnerId: subjectLearners.learnerId })
    .from(subjectLearners)
    .where(eq(subjectLearners.subjectId, subjectId))
  return rows.map((r) => r.learnerId)
}

/** Hydrate a SubjectRow with its learnerIds from the join table.
 *  Falls back to [subjects.learnerId] for rows that predate the migration. */
async function hydrate(row: SubjectRow): Promise<SubjectRowWithLearners> {
  const ids = await readLearnerIds(row.id)
  const learnerIds = ids.length > 0 ? ids : row.learnerId ? [row.learnerId] : []
  return { ...row, learnerIds }
}

async function hydrateMany(rows: SubjectRow[]): Promise<SubjectRowWithLearners[]> {
  if (rows.length === 0) return []
  const db = getDb()
  const ids = rows.map((r) => r.id)
  const joinRows = await db
    .select()
    .from(subjectLearners)
    .where(inArray(subjectLearners.subjectId, ids))
  const bySubject = new Map<string, string[]>()
  for (const jr of joinRows) {
    const list = bySubject.get(jr.subjectId) ?? []
    list.push(jr.learnerId)
    bySubject.set(jr.subjectId, list)
  }
  return rows.map((row) => {
    const ids = bySubject.get(row.id) ?? []
    const learnerIds = ids.length > 0 ? ids : row.learnerId ? [row.learnerId] : []
    return { ...row, learnerIds }
  })
}

export async function listSubjectRows(
  householdId: string,
  learnerId?: string,
  includeInactive = false,
): Promise<SubjectRowWithLearners[]> {
  const db = getDb()
  const conditions = [eq(subjects.householdId, householdId)]
  if (!includeInactive) conditions.push(eq(subjects.isActive, true))
  if (learnerId) conditions.push(eq(subjects.learnerId, learnerId))
  const rows = await db.select().from(subjects).where(and(...conditions))
  return hydrateMany(rows)
}

export async function getSubjectRow(
  id: string,
  householdId: string,
): Promise<SubjectRowWithLearners | null> {
  const db = getDb()
  const result = await db
    .select()
    .from(subjects)
    .where(and(eq(subjects.id, id), eq(subjects.householdId, householdId)))
    .limit(1)
  if (!result[0]) return null
  return hydrate(result[0])
}

export async function upsertSubjectRow(
  householdId: string,
  subjectId: string,
  input: CreateSubjectInput,
): Promise<SubjectRowWithLearners> {
  const existing = await getSubjectRow(subjectId, householdId)
  if (existing) return existing

  const db = getDb()
  const now = new Date()
  const primaryLearnerId = input.learnerIds?.[0] ?? input.learnerId ?? null
  const inserted = await db
    .insert(subjects)
    .values({
      id: subjectId,
      householdId,
      learnerId: primaryLearnerId,
      schoolYearId: input.schoolYearId ?? null,
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
  const row = inserted[0]
  const allLearnerIds = input.learnerIds ?? (primaryLearnerId ? [primaryLearnerId] : [])
  await writeLearnerRows(row.id, allLearnerIds)
  return { ...row, learnerIds: allLearnerIds }
}

export async function createSubjectRow(
  householdId: string,
  input: CreateSubjectInput,
): Promise<SubjectRowWithLearners> {
  const db = getDb()
  const now = new Date()
  const primaryLearnerId = input.learnerIds?.[0] ?? input.learnerId ?? null
  const inserted = await db
    .insert(subjects)
    .values({
      id: `subject_${Date.now()}`,
      householdId,
      learnerId: primaryLearnerId,
      schoolYearId: input.schoolYearId ?? null,
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
  const row = inserted[0]
  const allLearnerIds = input.learnerIds ?? (primaryLearnerId ? [primaryLearnerId] : [])
  await writeLearnerRows(row.id, allLearnerIds)
  return { ...row, learnerIds: allLearnerIds }
}

export async function updateSubjectRow(
  id: string,
  householdId: string,
  input: UpdateSubjectInput,
): Promise<SubjectRowWithLearners | null> {
  const db = getDb()
  const patch: Partial<SubjectRow> = { updatedAt: new Date() }
  if (input.name !== undefined) patch.name = input.name
  if (input.category !== undefined) patch.category = input.category
  if (input.color !== undefined) patch.color = input.color
  if (input.description !== undefined) patch.description = input.description
  if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder
  if (input.learnerIds !== undefined) {
    patch.learnerId = input.learnerIds[0] ?? null
  }

  const result = await db
    .update(subjects)
    .set(patch)
    .where(and(eq(subjects.id, id), eq(subjects.householdId, householdId)))
    .returning()
  if (!result[0]) return null

  if (input.learnerIds !== undefined) {
    await syncLearnerRows(id, input.learnerIds)
  }

  return hydrate(result[0])
}

export async function archiveSubjectRow(
  id: string,
  householdId: string,
): Promise<SubjectRowWithLearners | null> {
  const db = getDb()
  const result = await db
    .update(subjects)
    .set({ isActive: false, updatedAt: new Date() })
    .where(and(eq(subjects.id, id), eq(subjects.householdId, householdId)))
    .returning()
  if (!result[0]) return null
  return hydrate(result[0])
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
