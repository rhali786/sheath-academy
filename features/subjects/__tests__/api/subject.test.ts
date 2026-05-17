import {
  getSubject,
  getSubjects,
  createSubject,
  updateSubject,
  archiveSubject,
  restoreSubject,
  resetStore,
} from '@/features/subjects/server/service'
import { SEED_IDS } from '@/features/lib/seedIds'

beforeEach(() => {
  resetStore()
})

describe('Subjects — Individual Operations', () => {
  let testSubjectId: string

  beforeEach(() => {
    const subject = createSubject({
      childId: SEED_IDS.layth,
      name: 'Test Subject',
      category: 'Math',
      order: 1,
    })
    testSubjectId = subject!.id
  })

  describe('getSubject()', () => {
    it('GET /subjects/:id returns the subject', () => {
      const subject = getSubject(testSubjectId)
      expect(subject).not.toBeNull()
      expect(subject!.id).toBe(testSubjectId)
      expect(subject!.name).toBe('Test Subject')
    })

    it('GET /subjects/:id returns 404 for unknown id', () => {
      const subject = getSubject('unknown_id')
      expect(subject).toBeNull()
    })
  })

  describe('updateSubject()', () => {
    it('PUT /subjects/:id updates name and category', () => {
      const updated = updateSubject(testSubjectId, {
        name: 'Updated Subject',
        category: 'Science',
      })

      expect(updated).not.toBeNull()
      expect(updated!.name).toBe('Updated Subject')
      expect(updated!.category).toBe('Science')
    })

    it('PUT /subjects/:id returns 404 for unknown id', () => {
      const updated = updateSubject('unknown_id', { name: 'X' })
      expect(updated).toBeNull()
    })

    it('updates childId when reassigned to another student', () => {
      const updated = updateSubject(testSubjectId, {
        childId: SEED_IDS.hawa,
      })
      expect(updated).not.toBeNull()
      expect(updated!.childId).toBe(SEED_IDS.hawa)
    })

    it('returns null when childId does not exist', () => {
      const updated = updateSubject(testSubjectId, { childId: 'nonexistent_child' })
      expect(updated).toBeNull()
    })
  })

  describe('archiveSubject()', () => {
    it('PATCH /subjects/:id/archive sets isActive to false', () => {
      const archived = archiveSubject(testSubjectId)
      expect(archived).not.toBeNull()
      expect(archived!.isActive).toBe(false)
    })

    it('persists archive state in store', () => {
      archiveSubject(testSubjectId)
      const subject = getSubject(testSubjectId)
      expect(subject!.isActive).toBe(false)
    })

    it('PATCH /subjects/:id/archive returns 404 for unknown id', () => {
      const result = archiveSubject('unknown_id')
      expect(result).toBeNull()
    })
  })

  describe('restoreSubject()', () => {
    it('PATCH /subjects/:id/restore sets isActive to true after archive', () => {
      archiveSubject(testSubjectId)
      expect(getSubject(testSubjectId)!.isActive).toBe(false)

      const restored = restoreSubject(testSubjectId)
      expect(restored).not.toBeNull()
      expect(restored!.isActive).toBe(true)
    })

    it('persists restore state in store', () => {
      archiveSubject(testSubjectId)
      restoreSubject(testSubjectId)
      const subject = getSubject(testSubjectId)
      expect(subject!.isActive).toBe(true)
    })

    it('returns null for unknown id', () => {
      const result = restoreSubject('unknown_id')
      expect(result).toBeNull()
    })

    it('supports multiple archive/restore cycles', () => {
      archiveSubject(testSubjectId)
      expect(getSubject(testSubjectId)!.isActive).toBe(false)

      restoreSubject(testSubjectId)
      expect(getSubject(testSubjectId)!.isActive).toBe(true)

      archiveSubject(testSubjectId)
      expect(getSubject(testSubjectId)!.isActive).toBe(false)
    })
  })

  describe('getSubjects() after mutations', () => {
    it('getSubjects returns updated list after create', () => {
      const before = getSubjects().length
      createSubject({ childId: SEED_IDS.talut, name: 'New', category: 'Other' })
      expect(getSubjects().length).toBe(before + 1)
    })
  })
})
