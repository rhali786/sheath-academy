import { LessonTask } from '../types'
import { lessonsStore } from './store'

export function getLessons(childId?: string, subjectId?: string): LessonTask[] {
  // TODO: Implement with optional filters
  return lessonsStore.getAll()
}

export function getLessonTask(id: string): LessonTask | undefined {
  return lessonsStore.getById(id)
}

export function createLessonTask(data: Omit<LessonTask, 'id' | 'createdAt' | 'updatedAt'>): LessonTask {
  // TODO: Implement
  throw new Error('Not implemented')
}

export function updateLessonTask(id: string, patch: Partial<LessonTask>): LessonTask | null {
  return lessonsStore.update(id, patch)
}

export function completeLessonTask(id: string): LessonTask | null {
  return lessonsStore.update(id, { isCompleted: true })
}
