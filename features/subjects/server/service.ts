import type { SubjectCourse, SubjectCourseCategory } from '@/features/subjects/types'
import { subjectsStore } from './store'
import { SEED_SUBJECTS } from './seed'
import { generateSubjectId, resetIdCounter } from './ids'
import { getStudentProfile } from '@/features/children/server/service'

export function getSubjects(childId?: string): SubjectCourse[] {
  const subjects = subjectsStore.getAll()
  if (childId) {
    return subjects.filter(s => s.childId === childId)
  }
  return subjects
}

export function getSubject(id: string): SubjectCourse | null {
  return subjectsStore.getById(id) ?? null
}

export function createSubject(data: {
  childId: string
  name: string
  category: SubjectCourseCategory
  order?: number
}): SubjectCourse | null {
  if (!data.name?.trim()) return null

  const child = getStudentProfile(data.childId)
  if (!child) return null

  const subject: SubjectCourse = {
    id: generateSubjectId(),
    childId: data.childId,
    name: data.name.trim(),
    category: data.category,
    isActive: true,
    order: data.order ?? 0,
    createdAt: new Date().toISOString(),
  }
  return subjectsStore.insert(subject)
}

export function updateSubject(
  id: string,
  patch: Partial<Pick<SubjectCourse, 'name' | 'category' | 'order' | 'childId'>>
): SubjectCourse | null {
  if (!subjectsStore.getById(id)) return null

  if (patch.childId !== undefined) {
    const child = getStudentProfile(patch.childId)
    if (!child) return null
  }

  const allowedPatch: Partial<SubjectCourse> = {}
  if (patch.name !== undefined) allowedPatch.name = patch.name
  if (patch.category !== undefined) allowedPatch.category = patch.category
  if (patch.order !== undefined) allowedPatch.order = patch.order
  if (patch.childId !== undefined) allowedPatch.childId = patch.childId

  return subjectsStore.update(id, allowedPatch)
}

export function archiveSubject(id: string): SubjectCourse | null {
  if (!subjectsStore.getById(id)) return null
  return subjectsStore.update(id, { isActive: false })
}

export function archiveByChildId(childId: string): void {
  getSubjects(childId).forEach(s => subjectsStore.update(s.id, { isActive: false }))
}

export function restoreSubject(id: string): SubjectCourse | null {
  if (!subjectsStore.getById(id)) return null
  return subjectsStore.update(id, { isActive: true })
}

export function resetStore(seed?: SubjectCourse[]): void {
  subjectsStore.reset(seed ?? SEED_SUBJECTS)
  resetIdCounter()
}
