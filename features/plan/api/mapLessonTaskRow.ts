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
    resourceLink: r.resourceLink ?? undefined,
    lessonType: r.lessonType ?? undefined,
    estimatedDuration: (r.estimatedDuration as LessonTask['estimatedDuration']) ?? undefined,
    scheduledStartTime: r.scheduledStartTime ?? undefined,
    scheduledEndTime: r.scheduledEndTime ?? undefined,
    plannedStartDate: r.plannedStartDate ?? undefined,
    groupId: r.groupId ?? undefined,
    dueDate: r.dueDate ?? '',
    status: (r.status as LessonTask['status']) ?? 'not_started',
    order: r.sortOrder,
    completedAt: r.completedAt?.toISOString(),
    createdAt: r.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: r.updatedAt?.toISOString() ?? new Date().toISOString(),
  }
}
