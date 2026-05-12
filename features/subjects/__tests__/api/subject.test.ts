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
      childId: SEED_IDS.adam,
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

    it('partially updates fields without overwriting others', () => {
      const original = getSubject(testSubjectId)
      updateSubject(testSubjectId, { name: 'New Name' })
      const updated = getSubject(testSubjectId)

      expect(updated!.name).toBe('New Name')
      expect(updated!.category).toBe(original!.category)
      expect(updated!.childId).toBe(original!.childId)
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
      createSubject({ childId: SEED_IDS.zayd, name: 'New', category: 'Other' })
      expect(getSubjects().length).toBe(before + 1)
    })
  })
})
