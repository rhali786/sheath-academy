export type LessonTaskStatus = 'not_started' | 'completed' | 'skipped'

export type LessonDuration = '15min' | '30min' | '45min' | '1hr' | 'custom'

export interface LessonTask {
  id: string
  childId: string
  subjectId: string
  householdId: string
  title: string
  description?: string
  resourceLink?: string
  dueDate: string
  status: LessonTaskStatus
  order: number
  estimatedDuration?: LessonDuration
  lessonType?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}
