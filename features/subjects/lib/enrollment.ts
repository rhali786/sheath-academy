import type { SubjectCourse } from '@/features/subjects/types'

/** All learner IDs enrolled on a course row (join table with childId fallback). */
export function getSubjectLearnerIds(subject: SubjectCourse): string[] {
  if (subject.learnerIds?.length) return subject.learnerIds
  return subject.childId ? [subject.childId] : []
}

export function subjectEnrollsLearner(subject: SubjectCourse, learnerId: string): boolean {
  return getSubjectLearnerIds(subject).includes(learnerId)
}

/** Active courses that enroll the given learner. */
export function filterSubjectsForLearner(
  subjects: SubjectCourse[],
  learnerId: string,
): SubjectCourse[] {
  return subjects.filter(
    (s) => s.isActive !== false && subjectEnrollsLearner(s, learnerId),
  )
}

/**
 * Courses shared by every selected learner — one row enrolling all,
 * or legacy separate rows with the same name per learner.
 */
export function filterSubjectsForLearners(
  subjects: SubjectCourse[],
  learnerIds: string[],
): SubjectCourse[] {
  if (learnerIds.length === 0) return []
  if (learnerIds.length === 1) return filterSubjectsForLearner(subjects, learnerIds[0])

  const active = subjects.filter((s) => s.isActive !== false)

  const sharedRows = active.filter((s) =>
    learnerIds.every((id) => subjectEnrollsLearner(s, id)),
  )
  if (sharedRows.length > 0) return sharedRows

  const firstLearnerSubjects = filterSubjectsForLearner(active, learnerIds[0])
  return firstLearnerSubjects.filter((s) =>
    learnerIds.every((cid) =>
      active.some(
        (other) => other.name === s.name && subjectEnrollsLearner(other, cid),
      ),
    ),
  )
}
