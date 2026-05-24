import { and, gte, lte, sql } from 'drizzle-orm'
import { getDb } from '@/features/lib/server/db'
import { lessonTasks } from '@/db/schema'
import { listLessonTaskRows } from './repository'

export interface AdminLessonCount {
  householdId: string
  count: number
  completedCount: number
  lastDueDate: string | null
}

/** Cross-household aggregate for admin metrics. Uses lesson_tasks_due_household_idx. */
export async function getAdminLessonCounts(
  periodStart: string,
  periodEnd: string,
): Promise<AdminLessonCount[]> {
  const db = getDb()
  const rows = await db
    .select({
      householdId: lessonTasks.householdId,
      count: sql<number>`count(*)::int`,
      completedCount: sql<number>`count(*) filter (where ${lessonTasks.status} = 'completed')::int`,
      lastDueDate: sql<string | null>`max(${lessonTasks.dueDate})`,
    })
    .from(lessonTasks)
    .where(and(gte(lessonTasks.dueDate, periodStart), lte(lessonTasks.dueDate, periodEnd)))
    .groupBy(lessonTasks.householdId)
  return rows
}


export type LessonTaskPeriodCounts = {
  lessonTasksInPeriod: number
  lessonsCompletedInPeriod: number
}

export async function getLessonTaskPeriodCounts(
  householdId: string,
  periodStart: string,
  periodEnd: string,
): Promise<LessonTaskPeriodCounts> {
  const rows = await listLessonTaskRows(householdId, {
    startDate: periodStart,
    endDate: periodEnd,
  })
  return {
    lessonTasksInPeriod: rows.length,
    lessonsCompletedInPeriod: rows.filter(r => r.status === 'completed').length,
  }
}
