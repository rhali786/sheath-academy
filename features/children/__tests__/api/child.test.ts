import { createStudentProfile, getStudentProfile, updateStudentProfile, archiveStudentProfile, restoreStudentProfile, resetStore } from '@/features/children/server/service'

beforeEach(() => {
  resetStore()
})

describe('Student Profiles - Individual Operations', () => {
  let testProfileId: string

  beforeEach(() => {
    const profile = createStudentProfile({
      householdId: 'household_test',
      name: 'Test Child',
      gradeLabel: 'Grade 5',
      username: 'test.student',
      password: 'testpass123',
      dob: '2014-05-10',
      teacherName: 'Ms. Test',
    })
    testProfileId = profile.id
  })

  describe('getStudentProfile()', () => {
    it('should retrieve an existing student profile', () => {
      const profile = getStudentProfile(testProfileId)

      expect(profile).not.toBeNull()
      expect(profile!.id).toBe(testProfileId)
      expect(profile!.name).toBe('Test Child')
    })

    it('should return null for non-existent profile', () => {
      const profile = getStudentProfile('non_existent_id')
      expect(profile).toBeNull()
    })
  })

  describe('updateStudentProfile()', () => {
    it('should update student profile fields', () => {
      const updated = updateStudentProfile(testProfileId, {
        name: 'Updated Name',
        gradeLabel: 'Grade 6',
        teacherName: 'Ms. New',
      })

      expect(updated).not.toBeNull()
      expect(updated!.name).toBe('Updated Name')
      expect(updated!.gradeLabel).toBe('Grade 6')
      expect(updated!.teacherName).toBe('Ms. New')
    })

    it('should update password field', () => {
      const updated = updateStudentProfile(testProfileId, {
        password: 'newpass456',
      })

      expect(updated!.password).toBe('newpass456')
    })

    it('should update username field', () => {
      const updated = updateStudentProfile(testProfileId, {
        username: 'newusername',
      })

      expect(updated!.username).toBe('newusername')
    })

    it('should partially update fields', () => {
      const original = getStudentProfile(testProfileId)
      updateStudentProfile(testProfileId, {
        name: 'Changed',
      })
      const updated = getStudentProfile(testProfileId)

      expect(updated!.name).toBe('Changed')
      expect(updated!.dob).toBe(original!.dob)
      expect(updated!.teacherName).toBe(original!.teacherName)
    })

    it('should return null for non-existent profile', () => {
      const updated = updateStudentProfile('non_existent_id', {
        name: 'Updated',
      })

      expect(updated).toBeNull()
    })
  })

  describe('archiveStudentProfile()', () => {
    it('should archive an active student profile', () => {
      const archived = archiveStudentProfile(testProfileId)

      expect(archived).not.toBeNull()
      expect(archived!.isActive).toBe(false)
    })

    it('should persist archive state in store', () => {
      archiveStudentProfile(testProfileId)
      const profile = getStudentProfile(testProfileId)
      expect(profile!.isActive).toBe(false)
    })

    it('should return null for non-existent profile', () => {
      const archived = archiveStudentProfile('non_existent_id')
      expect(archived).toBeNull()
    })
  })

  describe('restoreStudentProfile()', () => {
    it('should restore an archived student profile', () => {
      archiveStudentProfile(testProfileId)
      let profile = getStudentProfile(testProfileId)
      expect(profile!.isActive).toBe(false)

      const restored = restoreStudentProfile(testProfileId)

      expect(restored).not.toBeNull()
      expect(restored!.isActive).toBe(true)
    })

    it('should persist restore state in store', () => {
      archiveStudentProfile(testProfileId)
      restoreStudentProfile(testProfileId)
      const profile = getStudentProfile(testProfileId)
      expect(profile!.isActive).toBe(true)
    })

    it('should return null for non-existent profile', () => {
      const restored = restoreStudentProfile('non_existent_id')
      expect(restored).toBeNull()
    })
  })

  describe('Archive/Restore workflow', () => {
    it('should support multiple archive/restore cycles', () => {
      const profile = getStudentProfile(testProfileId)
      expect(profile!.isActive).toBe(true)

      archiveStudentProfile(testProfileId)
      expect(getStudentProfile(testProfileId)!.isActive).toBe(false)

      restoreStudentProfile(testProfileId)
      expect(getStudentProfile(testProfileId)!.isActive).toBe(true)

      archiveStudentProfile(testProfileId)
      expect(getStudentProfile(testProfileId)!.isActive).toBe(false)
    })
  })
})
