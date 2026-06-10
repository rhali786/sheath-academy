import type { SubjectCourse } from '@/features/subjects/types'
import {
  filterSubjectsForLearner,
  filterSubjectsForLearners,
  getSubjectLearnerIds,
  subjectEnrollsLearner,
} from '@/features/subjects/lib/enrollment'

const sharedAlgebra: SubjectCourse = {
  id: 'subj_algebra',
  childId: 'child_a',
  learnerIds: ['child_a', 'child_b', 'child_c'],
  name: 'Algebra',
  category: 'Math',
  isActive: true,
  order: 1,
  createdAt: '2026-01-01T00:00:00Z',
}

const soloReading: SubjectCourse = {
  id: 'subj_reading',
  childId: 'child_b',
  learnerIds: ['child_b'],
  name: 'Reading',
  category: 'Reading',
  isActive: true,
  order: 2,
  createdAt: '2026-01-01T00:00:00Z',
}

describe('subject enrollment helpers', () => {
  it('getSubjectLearnerIds prefers learnerIds over childId', () => {
    expect(getSubjectLearnerIds(sharedAlgebra)).toEqual(['child_a', 'child_b', 'child_c'])
  })

  it('subjectEnrollsLearner matches any enrolled learner, not only primary', () => {
    expect(subjectEnrollsLearner(sharedAlgebra, 'child_b')).toBe(true)
    expect(subjectEnrollsLearner(sharedAlgebra, 'child_c')).toBe(true)
    expect(subjectEnrollsLearner(sharedAlgebra, 'child_z')).toBe(false)
  })

  it('filterSubjectsForLearner returns shared courses for non-primary learners', () => {
    const result = filterSubjectsForLearner([sharedAlgebra, soloReading], 'child_c')
    expect(result.map((s) => s.id)).toEqual(['subj_algebra'])
  })

  it('filterSubjectsForLearners returns one shared row when all learners are on the same course', () => {
    const result = filterSubjectsForLearners(
      [sharedAlgebra, soloReading],
      ['child_a', 'child_b'],
    )
    expect(result.map((s) => s.id)).toEqual(['subj_algebra'])
  })

  it('filterSubjectsForLearners supports legacy per-learner rows with matching names', () => {
    const legacy: SubjectCourse[] = [
      { ...sharedAlgebra, id: 'subj_a', childId: 'child_a', learnerIds: ['child_a'], name: 'Mathematics' },
      { ...sharedAlgebra, id: 'subj_b', childId: 'child_b', learnerIds: ['child_b'], name: 'Mathematics' },
    ]
    const result = filterSubjectsForLearners(legacy, ['child_a', 'child_b'])
    expect(result.map((s) => s.name)).toEqual(['Mathematics'])
  })
})
