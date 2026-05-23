// Memory store removed. Stubs kept for compilation.
// Use subjects/server/repository for new code.
import type { SubjectCourse, SubjectCourseCategory } from '@/features/subjects/types'

export function getSubjects(_childId?: string): SubjectCourse[] { return [] }
export function getSubjectsByLearner(_childId: string): SubjectCourse[] { return [] }
export function getSubject(_id: string): SubjectCourse | null { return null }
export function createSubject(_data: unknown): SubjectCourse | null { return null }
export function updateSubject(_id: string, _patch: { name?: string; category?: SubjectCourseCategory; order?: number; childId?: string }): SubjectCourse | null { return null }
export function archiveSubject(_id: string): SubjectCourse | null { return null }
export function archiveByChildId(_childId: string): void {}
export function restoreSubject(_id: string): SubjectCourse | null { return null }
export function resetStore(_seed?: SubjectCourse[]): void {}
