export type LessonTaskStatus = 'not_started' | 'completed' | 'skipped'

export interface LessonTask {
  id: string
  childId: string
  subjectId: string
  title: string
  date: string          // YYYY-MM-DD
  status: LessonTaskStatus
  notes?: string        // undefined if not provided, never ""
  resourceLink?: string // undefined if not provided, never ""
  createdAt: string
  updatedAt: string
}

export interface CreateLessonTaskInput {
  childId: string
  subjectId: string
  title: string
  date: string
  status?: LessonTaskStatus
  notes?: string
  resourceLink?: string
}

export interface UpdateLessonTaskInput {
  childId?: string
  subjectId?: string
  title?: string
  date?: string
  status?: LessonTaskStatus
  notes?: string
  resourceLink?: string
}
