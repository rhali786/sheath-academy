import type { LessonTask } from '@/features/plan/types'

export interface SubjectProgressSummary {
  childId: string
  childName: string
  subjectId: string
  subjectName: string
  scope: 'week' | 'year'
  plannedCount: number
  completedCount: number
  pendingCount: number
  completionRate: number
}

export function computeProgressBySubject(
  lessons: LessonTask[],
  dateRange: { start: string; end: string },
  childIdFilter: string[] | null,
  childNames: Record<string, string>,
  subjectNames: Record<string, string>,
  scope: 'week' | 'year'
): SubjectProgressSummary[] {
  const inRange = lessons.filter(l => l.dueDate >= dateRange.start && l.dueDate <= dateRange.end)
  const filtered = childIdFilter ? inRange.filter(l => childIdFilter.includes(l.childId)) : inRange

  const groups = new Map<string, LessonTask[]>()
  for (const lesson of filtered) {
    const key = `${lesson.childId}|${lesson.subjectId}`
    const group = groups.get(key) ?? []
    group.push(lesson)
    groups.set(key, group)
  }

  const summaries: SubjectProgressSummary[] = []
  for (const [key, group] of groups) {
    const [childId, subjectId] = key.split('|')
    const completedCount = group.filter(l => l.status === 'completed').length
    const plannedCount = group.length
    summaries.push({
      childId,
      childName: childNames[childId] ?? childId,
      subjectId,
      subjectName: subjectNames[subjectId] ?? subjectId,
      scope,
      plannedCount,
      completedCount,
      pendingCount: plannedCount - completedCount,
      completionRate: plannedCount === 0 ? 0 : completedCount / plannedCount,
    })
  }

  return summaries.sort((a, b) =>
    a.childName.localeCompare(b.childName) || a.subjectName.localeCompare(b.subjectName)
  )
}
