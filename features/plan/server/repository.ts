import { and, eq, gte, lte, sql } from 'drizzle-orm'
import { getDb } from '@/features/lib/server/db'
import { lessonTasks } from '@/db/schema'

export type LessonTaskRow = typeof lessonTasks.$inferSelect

export interface CreateLessonTaskInput {
  learnerId: string
  subjectId?: string
  title: string
  description?: string
  notes?: string
  resourceLink?: string
  lessonType?: string
  estimatedDuration?: string
  plannedStartDate?: string
  dueDate?: string
  status?: string
  sortOrder?: number
  groupId?: string | null
}

export interface LessonAssignmentInput {
  learnerId: string
  subjectId?: string
}

export type SharedLessonTaskFields = Omit<CreateLessonTaskInput, 'learnerId' | 'subjectId' | 'groupId'>

export interface UpdateLessonTaskOptions {
  applyToGroup?: boolean
}

export interface DeleteLessonTaskOptions {
  deleteGroup?: boolean
}

export interface UpdateLessonTaskInput {
  title?: string
  description?: string
  notes?: string
  resourceLink?: string
  lessonType?: string
  estimatedDuration?: string
  plannedStartDate?: string | null
  dueDate?: string
  status?: string
  sortOrder?: number
}

export interface LessonTaskFilters {
  learnerId?: string
  subjectId?: string
  status?: string
  startDate?: string
  endDate?: string
}

export async function listLessonTaskRows(
  householdId: string,
  filters: LessonTaskFilters = {},
): Promise<LessonTaskRow[]> {
  const db = getDb()
  const conditions = [eq(lessonTasks.householdId, householdId)]
  if (filters.learnerId) conditions.push(eq(lessonTasks.learnerId, filters.learnerId))
  if (filters.subjectId) conditions.push(eq(lessonTasks.subjectId, filters.subjectId))
  if (filters.status) conditions.push(eq(lessonTasks.status, filters.status))
  if (filters.startDate) conditions.push(gte(lessonTasks.dueDate, filters.startDate))
  if (filters.endDate) {
    conditions.push(
      lte(sql`coalesce(${lessonTasks.plannedStartDate}, ${lessonTasks.dueDate})`, filters.endDate),
    )
  }
  return db.select().from(lessonTasks).where(and(...conditions))
}

export async function getLessonTaskRow(
  id: string,
  householdId: string,
): Promise<LessonTaskRow | null> {
  const db = getDb()
  const result = await db
    .select()
    .from(lessonTasks)
    .where(and(eq(lessonTasks.id, id), eq(lessonTasks.householdId, householdId)))
    .limit(1)
  return result[0] ?? null
}

export async function createLessonTaskRow(
  householdId: string,
  input: CreateLessonTaskInput,
): Promise<LessonTaskRow> {
  const db = getDb()
  const now = new Date()
  const inserted = await db
    .insert(lessonTasks)
    .values({
      id: `lesson_${Date.now()}`,
      householdId,
      learnerId: input.learnerId,
      subjectId: input.subjectId ?? null,
      title: input.title,
      description: input.description ?? null,
      notes: input.notes ?? null,
      resourceLink: input.resourceLink ?? null,
      lessonType: input.lessonType ?? null,
      estimatedDuration: input.estimatedDuration ?? null,
      plannedStartDate: input.plannedStartDate ?? null,
      dueDate: input.dueDate ?? null,
      status: input.status ?? 'not_started',
      sortOrder: input.sortOrder ?? 0,
      groupId: input.groupId ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
  return inserted[0]
}

function buildSharedInsertValues(
  householdId: string,
  base: SharedLessonTaskFields,
  assignment: LessonAssignmentInput,
  groupId: string | null,
  now: Date,
  index: number,
) {
  return {
    id: `lesson_${Date.now()}_${index}`,
    householdId,
    learnerId: assignment.learnerId,
    subjectId: assignment.subjectId ?? null,
    groupId,
    title: base.title,
    description: base.description ?? null,
    notes: base.notes ?? null,
    resourceLink: base.resourceLink ?? null,
    lessonType: base.lessonType ?? null,
    estimatedDuration: base.estimatedDuration ?? null,
    plannedStartDate: base.plannedStartDate ?? null,
    dueDate: base.dueDate ?? null,
    status: base.status ?? 'not_started',
    sortOrder: base.sortOrder ?? 0,
    createdAt: now,
    updatedAt: now,
  }
}

/** Creates one row per assignment; 2+ learners share a generated group_id. */
export async function createLessonTasksFanOut(
  householdId: string,
  base: SharedLessonTaskFields,
  assignments: LessonAssignmentInput[],
): Promise<LessonTaskRow[]> {
  if (assignments.length === 0) {
    throw new Error('At least one learner assignment is required')
  }
  const db = getDb()
  const now = new Date()
  const groupId =
    assignments.length > 1 ? `group_${Date.now()}_${Math.random().toString(36).slice(2, 9)}` : null
  const values = assignments.map((assignment, index) =>
    buildSharedInsertValues(householdId, base, assignment, groupId, now, index),
  )
  return db.insert(lessonTasks).values(values).returning()
}

/** Inserts a lesson task with a caller-supplied id. Updates status/timestamps on conflict. For seed scripts only. */
export async function upsertLessonTaskRow(
  householdId: string,
  id: string,
  input: CreateLessonTaskInput & { completedAt?: Date },
): Promise<void> {
  const db = getDb()
  const now = new Date()
  const activityAt =
    input.status === 'completed'
      ? (input.completedAt ?? (input.dueDate ? new Date(`${input.dueDate}T15:00:00Z`) : now))
      : input.dueDate
        ? new Date(`${input.dueDate}T09:00:00Z`)
        : now

  await db
    .insert(lessonTasks)
    .values({
      id,
      householdId,
      learnerId: input.learnerId,
      subjectId: input.subjectId ?? null,
      title: input.title,
      description: input.description ?? null,
      notes: input.notes ?? null,
      dueDate: input.dueDate ?? null,
      status: input.status ?? 'not_started',
      sortOrder: input.sortOrder ?? 0,
      completedAt: input.completedAt ?? null,
      skippedAt: null,
      createdAt: now,
      updatedAt: activityAt,
    })
    .onConflictDoUpdate({
      target: lessonTasks.id,
      set: {
        status: input.status ?? 'not_started',
        dueDate: input.dueDate ?? null,
        completedAt: input.completedAt ?? null,
        updatedAt: activityAt,
      },
    })
}

export async function updateLessonTaskRow(
  id: string,
  householdId: string,
  input: UpdateLessonTaskInput,
  options: UpdateLessonTaskOptions = {},
): Promise<LessonTaskRow | null> {
  const db = getDb()
  const existing = await getLessonTaskRow(id, householdId)
  if (!existing) return null

  const patch: Partial<LessonTaskRow> = { updatedAt: new Date() }
  if (input.title !== undefined) patch.title = input.title
  if (input.description !== undefined) patch.description = input.description
  if (input.notes !== undefined) patch.notes = input.notes
  if (input.resourceLink !== undefined) patch.resourceLink = input.resourceLink
  if (input.lessonType !== undefined) patch.lessonType = input.lessonType
  if (input.estimatedDuration !== undefined) patch.estimatedDuration = input.estimatedDuration
  if (input.plannedStartDate !== undefined) patch.plannedStartDate = input.plannedStartDate
  if (input.dueDate !== undefined) patch.dueDate = input.dueDate
  if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder

  if (options.applyToGroup && existing.groupId) {
    const result = await db
      .update(lessonTasks)
      .set(patch)
      .where(and(eq(lessonTasks.householdId, householdId), eq(lessonTasks.groupId, existing.groupId)))
      .returning()
    return result.find(r => r.id === id) ?? result[0] ?? null
  }

  if (input.status !== undefined) patch.status = input.status

  const result = await db
    .update(lessonTasks)
    .set(patch)
    .where(and(eq(lessonTasks.id, id), eq(lessonTasks.householdId, householdId)))
    .returning()
  return result[0] ?? null
}

export async function completeLessonTaskRow(
  id: string,
  householdId: string,
  status: 'completed' | 'skipped' = 'completed',
): Promise<LessonTaskRow | null> {
  const db = getDb()
  const now = new Date()
  const patch: Partial<LessonTaskRow> = {
    status,
    updatedAt: now,
    completedAt: status === 'completed' ? now : null,
    skippedAt: status === 'skipped' ? now : null,
  }
  const result = await db
    .update(lessonTasks)
    .set(patch)
    .where(and(eq(lessonTasks.id, id), eq(lessonTasks.householdId, householdId)))
    .returning()
  return result[0] ?? null
}

export async function deleteLessonTaskRow(
  id: string,
  householdId: string,
  options: DeleteLessonTaskOptions = {},
): Promise<boolean> {
  const db = getDb()
  const existing = await getLessonTaskRow(id, householdId)
  if (!existing) return false

  if (options.deleteGroup && existing.groupId) {
    const result = await db
      .delete(lessonTasks)
      .where(and(eq(lessonTasks.householdId, householdId), eq(lessonTasks.groupId, existing.groupId)))
      .returning()
    return result.length > 0
  }

  const result = await db
    .delete(lessonTasks)
    .where(and(eq(lessonTasks.id, id), eq(lessonTasks.householdId, householdId)))
    .returning()
  return result.length > 0
}
