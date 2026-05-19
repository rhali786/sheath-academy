import { LessonTask } from '../types'
import { lessonsStore } from './store'
import { SEED_LESSONS } from './seed'
import { generateLessonTaskId, resetIdCounter } from './ids'
import { getStudentProfile } from '@/features/children/server/service'
import { getSubject } from '@/features/subjects/server/service'

export function getLessons(childId?: string, subjectId?: string): LessonTask[] {
  let lessons = lessonsStore.getAll()

  if (childId) {
    lessons = lessons.filter(l => l.childId === childId)
  }

  if (subjectId) {
    lessons = lessons.filter(l => l.subjectId === subjectId)
  }

  return lessons
}

export function getLessonTask(id: string): LessonTask | undefined {
  return lessonsStore.getById(id)
}

export function createLessonTask(
  data: Omit<LessonTask, 'id' | 'createdAt' | 'updatedAt'>
): LessonTask | null {
  const student = getStudentProfile(data.childId)
  if (!student) return null

  const subject = getSubject(data.subjectId)
  if (!subject) return null

  const lesson: LessonTask = {
    ...data,
    status: data.status ?? 'not_started',
    id: generateLessonTaskId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  return lessonsStore.insert(lesson)
}

export function updateLessonTask(id: string, patch: Partial<LessonTask>): LessonTask | null {
  const lesson = lessonsStore.getById(id)
  if (!lesson) return null

  const allowedPatch: Partial<LessonTask> = {}
  if (patch.title !== undefined) allowedPatch.title = patch.title
  if (patch.description !== undefined) allowedPatch.description = patch.description
  if (patch.resourceLink !== undefined) allowedPatch.resourceLink = patch.resourceLink
  if (patch.dueDate !== undefined) allowedPatch.dueDate = patch.dueDate
  if (patch.status !== undefined) allowedPatch.status = patch.status
  if (patch.order !== undefined) allowedPatch.order = patch.order
  if (patch.estimatedDuration !== undefined) allowedPatch.estimatedDuration = patch.estimatedDuration
  if (patch.lessonType !== undefined) allowedPatch.lessonType = patch.lessonType
  allowedPatch.updatedAt = new Date().toISOString()

  return lessonsStore.update(id, allowedPatch)
}

export function completeLessonTask(id: string, status: 'completed' | 'skipped' = 'completed'): LessonTask | null {
  const lesson = lessonsStore.getById(id)
  if (!lesson) return null

  return lessonsStore.update(id, { status, updatedAt: new Date().toISOString() })
}

export function deleteLessonTask(id: string): boolean {
  const lesson = lessonsStore.getById(id)
  if (!lesson) return false
  return lessonsStore.remove(id)
}

// Lesson history is preserved for reporting; no isActive field on LessonTask.
export function archiveByChildId(_childId: string): void {}
export function archiveBySubjectId(_subjectId: string): void {}

export function resetStore(seed?: LessonTask[]): void {
  lessonsStore.reset(seed ?? SEED_LESSONS)
  resetIdCounter()
}
