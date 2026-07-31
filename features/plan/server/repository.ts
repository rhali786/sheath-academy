import { and, eq, gte, lte, sql } from 'drizzle-orm'
import { getDb } from '@/features/lib/server/db'
import { lessonTasks, lessonSteps } from '@/db/schema'

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
  scheduledStartTime?: string | null
  scheduledEndTime?: string | null
  plannedStartDate?: string
  dueDate?: string
  status?: string
  sortOrder?: number
  groupId?: string | null
  curriculum?: string
  chapter?: string
  hasHomework?: boolean
  hasAssessment?: boolean
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
  scheduledStartTime?: string | null
  scheduledEndTime?: string | null
  plannedStartDate?: string | null
  dueDate?: string
  status?: string
  sortOrder?: number
  curriculum?: string | null
  chapter?: string | null
  hasHomework?: boolean
  hasAssessment?: boolean
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
      scheduledStartTime: input.scheduledStartTime ?? null,
      scheduledEndTime: input.scheduledEndTime ?? null,
      plannedStartDate: input.plannedStartDate ?? null,
      dueDate: input.dueDate ?? null,
      status: input.status ?? 'not_started',
      sortOrder: input.sortOrder ?? 0,
      groupId: input.groupId ?? null,
      curriculum: input.curriculum ?? null,
      chapter: input.chapter ?? null,
      hasHomework: input.hasHomework ?? false,
      hasAssessment: input.hasAssessment ?? false,
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
    scheduledStartTime: base.scheduledStartTime ?? null,
    scheduledEndTime: base.scheduledEndTime ?? null,
    plannedStartDate: base.plannedStartDate ?? null,
    dueDate: base.dueDate ?? null,
    status: base.status ?? 'not_started',
    sortOrder: base.sortOrder ?? 0,
    curriculum: base.curriculum ?? null,
    chapter: base.chapter ?? null,
    hasHomework: base.hasHomework ?? false,
    hasAssessment: base.hasAssessment ?? false,
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
  if (input.scheduledStartTime !== undefined) patch.scheduledStartTime = input.scheduledStartTime
  if (input.scheduledEndTime !== undefined) patch.scheduledEndTime = input.scheduledEndTime
  if (input.plannedStartDate !== undefined) patch.plannedStartDate = input.plannedStartDate
  if (input.dueDate !== undefined) patch.dueDate = input.dueDate
  if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder
  if (input.curriculum !== undefined) patch.curriculum = input.curriculum
  if (input.chapter !== undefined) patch.chapter = input.chapter
  if (input.hasHomework !== undefined) patch.hasHomework = input.hasHomework
  if (input.hasAssessment !== undefined) patch.hasAssessment = input.hasAssessment

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

// ─── Lesson Steps ─────────────────────────────────────────────────────────────

export type LessonStepRow = typeof lessonSteps.$inferSelect

export interface CreateLessonStepInput {
  lessonTaskId: string
  order: number
  stepText: string
  type?: string
  doneCriteria?: string
  quantity?: number
}

export interface UpdateLessonStepInput {
  order?: number
  stepText?: string
  type?: string
  doneCriteria?: string | null
  quantity?: number | null
}

export async function listLessonSteps(lessonTaskId: string): Promise<LessonStepRow[]> {
  const db = getDb()
  return db
    .select()
    .from(lessonSteps)
    .where(eq(lessonSteps.lessonTaskId, lessonTaskId))
    .orderBy(lessonSteps.order)
}

export async function createLessonStep(input: CreateLessonStepInput): Promise<LessonStepRow> {
  const db = getDb()
  const now = new Date()
  const inserted = await db
    .insert(lessonSteps)
    .values({
      id: `step_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      lessonTaskId: input.lessonTaskId,
      order: input.order,
      stepText: input.stepText,
      type: input.type ?? 'instruction',
      doneCriteria: input.doneCriteria ?? null,
      quantity: input.quantity ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
  return inserted[0]
}

export async function updateLessonStep(
  id: string,
  lessonTaskId: string,
  patch: UpdateLessonStepInput,
): Promise<LessonStepRow | null> {
  const db = getDb()
  const update: Partial<LessonStepRow> = { updatedAt: new Date() }
  if (patch.order !== undefined) update.order = patch.order
  if (patch.stepText !== undefined) update.stepText = patch.stepText
  if (patch.type !== undefined) update.type = patch.type
  if ('doneCriteria' in patch) update.doneCriteria = patch.doneCriteria ?? null
  if ('quantity' in patch) update.quantity = patch.quantity ?? null

  const result = await db
    .update(lessonSteps)
    .set(update)
    .where(and(eq(lessonSteps.id, id), eq(lessonSteps.lessonTaskId, lessonTaskId)))
    .returning()
  return result[0] ?? null
}

export async function deleteLessonStep(id: string, lessonTaskId: string): Promise<boolean> {
  const db = getDb()
  const result = await db
    .delete(lessonSteps)
    .where(and(eq(lessonSteps.id, id), eq(lessonSteps.lessonTaskId, lessonTaskId)))
    .returning()
  return result.length > 0
}
