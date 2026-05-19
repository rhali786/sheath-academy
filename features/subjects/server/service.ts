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

/**
 * Returns all subjects where childId is in learnerIds.
 * Falls back to checking subject.childId for legacy records without learnerIds.
 */
export function getSubjectsByLearner(childId: string): SubjectCourse[] {
  return subjectsStore.getAll().filter(s => {
    const ids = s.learnerIds ?? [s.childId]
    return ids.includes(childId)
  })
}

export function getSubject(id: string): SubjectCourse | null {
  return subjectsStore.getById(id) ?? null
}

export function createSubject(data: {
  childId?: string
  learnerIds?: string[]
  name: string
  category: SubjectCourseCategory
  customCategory?: string
  instructorName?: string
  level?: string
  schoolYearId?: string
  order?: number
}): SubjectCourse | null {
  if (!data.name?.trim()) return null

  // Resolve learnerIds / childId
  let learnerIds: string[]
  if (data.learnerIds && data.learnerIds.length > 0) {
    learnerIds = data.learnerIds
  } else if (data.childId) {
    learnerIds = [data.childId]
  } else {
    return null
  }

  const primaryChildId = learnerIds[0]

  // Validate all learners exist
  for (const id of learnerIds) {
    const child = getStudentProfile(id)
    if (!child) return null
  }

  const subject: SubjectCourse = {
    id: generateSubjectId(),
    childId: primaryChildId,
    learnerIds,
    name: data.name.trim(),
    category: data.category,
    ...(data.customCategory !== undefined && { customCategory: data.customCategory }),
    ...(data.instructorName !== undefined && { instructorName: data.instructorName }),
    ...(data.level !== undefined && { level: data.level }),
    ...(data.schoolYearId !== undefined && { schoolYearId: data.schoolYearId }),
    isActive: true,
    order: data.order ?? 0,
    createdAt: new Date().toISOString(),
  }
  return subjectsStore.insert(subject)
}

export function updateSubject(
  id: string,
  patch: Partial<Pick<SubjectCourse, 'name' | 'category' | 'customCategory' | 'instructorName' | 'level' | 'schoolYearId' | 'order' | 'childId' | 'learnerIds'>>
): SubjectCourse | null {
  if (!subjectsStore.getById(id)) return null

  if (patch.childId !== undefined) {
    const child = getStudentProfile(patch.childId)
    if (!child) return null
  }

  const allowedPatch: Partial<SubjectCourse> = {}
  if (patch.name !== undefined) allowedPatch.name = patch.name
  if (patch.category !== undefined) allowedPatch.category = patch.category
  if (patch.customCategory !== undefined) allowedPatch.customCategory = patch.customCategory
  if (patch.instructorName !== undefined) allowedPatch.instructorName = patch.instructorName
  if (patch.level !== undefined) allowedPatch.level = patch.level
  if (patch.schoolYearId !== undefined) allowedPatch.schoolYearId = patch.schoolYearId
  if (patch.order !== undefined) allowedPatch.order = patch.order
  if (patch.childId !== undefined) allowedPatch.childId = patch.childId
  if (patch.learnerIds !== undefined) allowedPatch.learnerIds = patch.learnerIds

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
