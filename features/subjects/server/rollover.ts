import { and, eq, inArray } from 'drizzle-orm'
import { getDb } from '@/features/lib/server/db'
import { subjects, subjectLearners } from '@/db/schema'
import { getSubjectRow, type SubjectRowWithLearners } from './repository'

async function readLearnerIdsForSubject(subjectId: string): Promise<string[]> {
  const db = getDb()
  const rows = await db
    .select({ learnerId: subjectLearners.learnerId })
    .from(subjectLearners)
    .where(eq(subjectLearners.subjectId, subjectId))
  return rows.map((r) => r.learnerId)
}

/**
 * Clone selected active courses from fromYearId into toYearId with new ids.
 * Copies subject_learners enrollments; source rows and their lessons are untouched.
 */
export async function rolloverCourses(
  householdId: string,
  fromYearId: string,
  toYearId: string,
  courseIds?: string[],
): Promise<SubjectRowWithLearners[]> {
  const db = getDb()
  const conditions = [
    eq(subjects.householdId, householdId),
    eq(subjects.schoolYearId, fromYearId),
    eq(subjects.isActive, true),
  ]
  if (courseIds && courseIds.length > 0) {
    conditions.push(inArray(subjects.id, courseIds))
  }

  const sourceRows = await db.select().from(subjects).where(and(...conditions))
  const created: SubjectRowWithLearners[] = []

  for (const source of sourceRows) {
    const now = new Date()
    const newId = `subject_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    await db
      .insert(subjects)
      .values({
        id: newId,
        householdId,
        learnerId: source.learnerId,
        schoolYearId: toYearId,
        name: source.name,
        category: source.category,
        description: source.description,
        color: source.color,
        sortOrder: source.sortOrder,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })

    const learnerIds = await readLearnerIdsForSubject(source.id)
    const enrollments =
      learnerIds.length > 0
        ? learnerIds
        : source.learnerId
          ? [source.learnerId]
          : []

    if (enrollments.length > 0) {
      await db
        .insert(subjectLearners)
        .values(enrollments.map((learnerId) => ({ subjectId: newId, learnerId })))
        .onConflictDoNothing()
    }

    const hydrated = await getSubjectRow(newId, householdId)
    if (hydrated) created.push(hydrated)
  }

  return created
}
