import type { LessonTaskRow } from '@/features/plan/server/repository'
import type { LessonTask } from '@/features/plan/types'

export function mapLessonTaskRow(r: LessonTaskRow): LessonTask {
  return {
    id: r.id,
    childId: r.learnerId,
    subjectId: r.subjectId ?? '',
    householdId: r.householdId,
    title: r.title,
    description: r.description ?? undefined,
    dueDate: r.dueDate ?? '',
    status: (r.status as LessonTask['status']) ?? 'not_started',
    order: r.sortOrder,
    completedAt: r.completedAt?.toISOString(),
    createdAt: r.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: r.updatedAt?.toISOString() ?? new Date().toISOString(),
  }
}
