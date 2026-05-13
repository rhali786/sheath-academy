export interface LessonTask {
  id: string
  childId: string
  subjectId: string
  householdId: string
  title: string
  description?: string
  dueDate: string
  isCompleted: boolean
  order: number
  createdAt: string
  updatedAt: string
}
