import type { LessonTask } from '@/features/plan/types'

export type LessonListItem =
  | { kind: 'single'; lesson: LessonTask }
  | { kind: 'shared'; groupId: string; copies: LessonTask[] }

/**
 * A shared lesson is one row per learner (same group_id). For the Lessons list, copies in
 * view collapse into one item placed where the first copy was; a group with only one copy
 * in view (e.g. one learner selected) stays an ordinary lesson. Order is preserved.
 */
export function groupSharedLessons(lessons: LessonTask[]): LessonListItem[] {
  const counts = new Map<string, number>()
  for (const l of lessons) if (l.groupId) counts.set(l.groupId, (counts.get(l.groupId) ?? 0) + 1)

  const items: LessonListItem[] = []
  const sharedByGroup = new Map<string, { kind: 'shared'; groupId: string; copies: LessonTask[] }>()
  for (const lesson of lessons) {
    const groupId = lesson.groupId
    if (!groupId || (counts.get(groupId) ?? 0) < 2) {
      items.push({ kind: 'single', lesson })
      continue
    }
    const existing = sharedByGroup.get(groupId)
    if (existing) {
      existing.copies.push(lesson)
    } else {
      const item = { kind: 'shared' as const, groupId, copies: [lesson] }
      sharedByGroup.set(groupId, item)
      items.push(item)
    }
  }
  return items
}
