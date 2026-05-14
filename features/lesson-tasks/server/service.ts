import type { LessonTask, LessonTaskStatus, CreateLessonTaskInput, UpdateLessonTaskInput } from '@/features/lesson-tasks/types'
import { lessonTasksStore } from './store'
import { SEED_LESSON_TASKS } from './seed'
import { generateLessonTaskId, resetIdCounter } from './ids'
import { getStudentProfile } from '@/features/children/server/service'
import { getSubject } from '@/features/subjects/server/service'

const VALID_STATUSES: LessonTaskStatus[] = ['not_started', 'completed', 'skipped']

function isValidDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false
  const [yearStr, monthStr, dayStr] = dateStr.split('-')
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10)
  const day = parseInt(dayStr, 10)
  const d = new Date(year, month - 1, day)
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day
}

function isValidResourceLink(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://')
}

function normalizeNotes(notes?: string): string | undefined {
  if (!notes || !notes.trim()) return undefined
  return notes
}

function normalizeResourceLink(link?: string): string | undefined {
  if (!link) return undefined
  return link
}

export function getLessonTasks(filters?: {
  childId?: string
  subjectId?: string
  date?: string
}): LessonTask[] {
  let tasks = lessonTasksStore.getAll()
  if (filters?.childId) tasks = tasks.filter(t => t.childId === filters.childId)
  if (filters?.subjectId) tasks = tasks.filter(t => t.subjectId === filters.subjectId)
  if (filters?.date) tasks = tasks.filter(t => t.date === filters.date)
  return tasks
}

export function getLessonTask(id: string): LessonTask | null {
  return lessonTasksStore.getById(id) ?? null
}

export function createLessonTask(input: CreateLessonTaskInput): LessonTask | null {
  const title = input.title?.trim() ?? ''
  if (!title) return null
  if (title.length > 120) return null

  if (!input.childId) return null
  if (!input.subjectId) return null
  if (!input.date || !isValidDate(input.date)) return null

  const status = input.status ?? 'not_started'
  if (!VALID_STATUSES.includes(status)) return null

  const child = getStudentProfile(input.childId)
  if (!child) return null

  const subject = getSubject(input.subjectId)
  if (!subject) return null
  if (subject.childId !== input.childId) return null

  const resourceLink = normalizeResourceLink(input.resourceLink)
  if (resourceLink !== undefined && !isValidResourceLink(resourceLink)) return null

  const now = new Date().toISOString()
  const task: LessonTask = {
    id: generateLessonTaskId(),
    childId: input.childId,
    subjectId: input.subjectId,
    title,
    date: input.date,
    status,
    notes: normalizeNotes(input.notes),
    resourceLink,
    createdAt: now,
    updatedAt: now,
  }

  return lessonTasksStore.insert(task)
}

export function updateLessonTask(id: string, patch: UpdateLessonTaskInput): LessonTask | null {
  const existing = lessonTasksStore.getById(id)
  if (!existing) return null

  const merged = { ...existing, ...patch }

  const title = merged.title?.trim() ?? ''
  if (!title) return null
  if (title.length > 120) return null

  if (!isValidDate(merged.date)) return null
  if (!VALID_STATUSES.includes(merged.status)) return null

  const child = getStudentProfile(merged.childId)
  if (!child) return null

  const subject = getSubject(merged.subjectId)
  if (!subject) return null
  if (subject.childId !== merged.childId) return null

  const resourceLink = normalizeResourceLink(merged.resourceLink)
  if (resourceLink !== undefined && !isValidResourceLink(resourceLink)) return null

  const notes = normalizeNotes(merged.notes)

  return lessonTasksStore.update(id, {
    childId: merged.childId,
    subjectId: merged.subjectId,
    title,
    date: merged.date,
    status: merged.status,
    notes,
    resourceLink,
    updatedAt: new Date().toISOString(),
  })
}

export function deleteLessonTask(id: string): boolean {
  return lessonTasksStore.remove(id)
}

export function resetStore(seed?: LessonTask[]): void {
  lessonTasksStore.reset(seed ?? SEED_LESSON_TASKS)
  resetIdCounter()
}
