/**
 * Wave 8 — FB-003 Subjects/Courses refinement
 * Unit tests for multi-learner enrollment and category formatting.
 * Written first (TDD) — will fail until service is updated.
 */
import {
  createSubject,
  getSubjectsByLearner,
  resetStore,
} from '@/features/subjects/server/service'
import { SEED_IDS } from '@/features/lib/seedIds'
import { formatCategory } from '@/features/subjects/front/lib/categories'

beforeEach(() => {
  resetStore()
})

describe('Wave 8 — multi-learner enrollment', () => {
  test('createSubject with learnerIds creates ONE record for two learners', () => {
    const result = createSubject({
      learnerIds: [SEED_IDS.layth, SEED_IDS.hawa],
      name: 'Family Quran',
      category: 'Quran',
    })
    expect(result).not.toBeNull()
    // Only one record should be created
    const byLearnerA = getSubjectsByLearner(SEED_IDS.layth)
    const sharedSubject = byLearnerA.find(s => s.name === 'Family Quran')
    expect(sharedSubject).toBeDefined()
    const byLearnerB = getSubjectsByLearner(SEED_IDS.hawa)
    const sharedSubjectB = byLearnerB.find(s => s.name === 'Family Quran')
    expect(sharedSubjectB).toBeDefined()
    // Same id — one record, not two
    expect(sharedSubject!.id).toBe(sharedSubjectB!.id)
  })

  test('getSubjectsByLearner returns only subjects where childId is in learnerIds', () => {
    createSubject({
      learnerIds: [SEED_IDS.layth, SEED_IDS.hawa],
      name: 'Shared Arabic',
      category: 'Arabic',
    })
    createSubject({
      learnerIds: [SEED_IDS.talut],
      name: 'Talut Only Science',
      category: 'Science',
    })
    const laythSubjects = getSubjectsByLearner(SEED_IDS.layth)
    const hawaSubjects = getSubjectsByLearner(SEED_IDS.hawa)
    const talutSubjects = getSubjectsByLearner(SEED_IDS.talut)

    const laythNames = laythSubjects.map(s => s.name)
    expect(laythNames).toContain('Shared Arabic')
    expect(laythNames).not.toContain('Talut Only Science')

    const hawaNames = hawaSubjects.map(s => s.name)
    expect(hawaNames).toContain('Shared Arabic')

    const talutNames = talutSubjects.map(s => s.name)
    expect(talutNames).toContain('Talut Only Science')
    expect(talutNames).not.toContain('Shared Arabic')
  })

  test('getSubjectsByLearner returns Islamic Studies formatted correctly', () => {
    createSubject({
      learnerIds: [SEED_IDS.layth],
      name: 'Fiqh',
      category: 'IslamicStudies',
    })
    const subjects = getSubjectsByLearner(SEED_IDS.layth)
    const fiqh = subjects.find(s => s.name === 'Fiqh')
    expect(fiqh).toBeDefined()
    // The raw stored category is 'IslamicStudies'; formatCategory should return 'Islamic Studies'
    expect(formatCategory(fiqh!.category)).toBe('Islamic Studies')
  })
})

describe('Wave 8 — learnerIds on SubjectCourse', () => {
  test('created subject has learnerIds array', () => {
    const s = createSubject({
      learnerIds: [SEED_IDS.layth, SEED_IDS.hawa],
      name: 'Joint Math',
      category: 'Math',
    })
    expect(s).not.toBeNull()
    expect(s!.learnerIds).toEqual([SEED_IDS.layth, SEED_IDS.hawa])
  })

  test('createSubject with childId (legacy) sets learnerIds = [childId]', () => {
    const s = createSubject({
      childId: SEED_IDS.talut,
      name: 'Solo Science',
      category: 'Science',
    })
    expect(s).not.toBeNull()
    expect(s!.learnerIds).toEqual([SEED_IDS.talut])
  })
})
