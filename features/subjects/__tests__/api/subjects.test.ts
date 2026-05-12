import {
  getSubjects,
  createSubject,
  resetStore,
} from '@/features/subjects/server/service'
import { SEED_SUBJECTS } from '@/features/subjects/server/seed'
import { SEED_IDS } from '@/features/lib/seedIds'

beforeEach(() => {
  resetStore()
})

describe('Subjects — List and Create', () => {
  describe('getSubjects()', () => {
    it('GET /subjects returns empty array when store is empty', () => {
      resetStore([])
      const subjects = getSubjects()
      expect(subjects).toEqual([])
    })

    it('GET /subjects returns all seeded subjects when no childId filter', () => {
      const subjects = getSubjects()
      expect(subjects.length).toBe(SEED_SUBJECTS.length)
    })

    it('GET /subjects?childId=X returns only subjects belonging to X', () => {
      const adamSubjects = getSubjects(SEED_IDS.adam)
      expect(adamSubjects.length).toBeGreaterThan(0)
      adamSubjects.forEach(s => expect(s.childId).toBe(SEED_IDS.adam))
    })

    it('returns empty array for unknown childId', () => {
      const subjects = getSubjects('unknown_child')
      expect(subjects).toEqual([])
    })
  })

  describe('createSubject()', () => {
    it('POST /subjects creates a subject with valid childId', () => {
      const subject = createSubject({
        childId: SEED_IDS.adam,
        name: 'English Reading',
        category: 'Reading',
        order: 5,
      })

      expect(subject).not.toBeNull()
      expect(subject!.id).toMatch(/^subject_/)
      expect(subject!.childId).toBe(SEED_IDS.adam)
      expect(subject!.name).toBe('English Reading')
      expect(subject!.category).toBe('Reading')
      expect(subject!.isActive).toBe(true)
      expect(subject!.order).toBe(5)
      expect(subject!.createdAt).toBeDefined()
    })

    it('POST /subjects uses default order of 0 when order not provided', () => {
      const subject = createSubject({
        childId: SEED_IDS.adam,
        name: 'Science',
        category: 'Science',
      })

      expect(subject!.order).toBe(0)
    })

    it('POST /subjects returns 400 when required fields are missing', () => {
      // Service returns null when name is missing
      const result = createSubject({
        childId: SEED_IDS.adam,
        name: '',
        category: 'Math',
      })
      expect(result).toBeNull()
    })

    it('persists created subject in the store', () => {
      const subject = createSubject({
        childId: SEED_IDS.khadijah,
        name: 'History',
        category: 'History',
      })
      const found = getSubjects(SEED_IDS.khadijah).find(s => s.id === subject!.id)
      expect(found).toBeDefined()
    })

    it('generates unique IDs for each subject', () => {
      const s1 = createSubject({ childId: SEED_IDS.adam, name: 'A', category: 'Other' })
      const s2 = createSubject({ childId: SEED_IDS.adam, name: 'B', category: 'Other' })
      expect(s1!.id).not.toBe(s2!.id)
    })
  })

  describe('POST /subjects returns 404 when childId does not exist in children service', () => {
    it('returns null for unknown childId', () => {
      const result = createSubject({
        childId: 'nonexistent_child_id',
        name: 'Test Subject',
        category: 'Other',
      })
      expect(result).toBeNull()
    })
  })
})
