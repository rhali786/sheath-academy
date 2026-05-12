import { createStudentProfile, getStudentProfiles, resetDataStore } from '@/features/lib/server/dataStore'

beforeEach(() => {
  resetDataStore()
})

describe('Student Profiles - List and Create', () => {
  describe('getStudentProfiles()', () => {
    it('should return seed data with 3 profiles in default household', () => {
      const profiles = getStudentProfiles('household_default')
      expect(profiles).toHaveLength(3)
      expect(profiles.every(p => p.householdId === 'household_default')).toBe(true)
    })

    it('should return all active profiles for a household by default', () => {
      const profiles = getStudentProfiles('household_default')
      expect(profiles.every(p => p.isActive)).toBe(true)
    })

    it('should return all profiles across households when no householdId specified', () => {
      const profiles = getStudentProfiles()
      expect(profiles.length).toBeGreaterThanOrEqual(3)
      expect(Array.isArray(profiles)).toBe(true)
    })

    it('should return empty array for non-existent householdId', () => {
      const profiles = getStudentProfiles('non_existent')
      expect(profiles).toEqual([])
    })
  })

  describe('createStudentProfile()', () => {
    it('should create a profile with all fields', () => {
      const profile = createStudentProfile({
        householdId: 'household_test',
        name: 'Aisha',
        gradeLabel: 'Grade 4',
        dob: '2015-06-20',
        teacherName: 'Mr. Ahmed',
        username: 'aisha.student',
        password: 'secure123',
      })

      expect(profile).toHaveProperty('id')
      expect(profile.name).toBe('Aisha')
      expect(profile.gradeLabel).toBe('Grade 4')
      expect(profile.dob).toBe('2015-06-20')
      expect(profile.teacherName).toBe('Mr. Ahmed')
      expect(profile.username).toBe('aisha.student')
      expect(profile.password).toBe('secure123')
      expect(profile.isActive).toBe(true)
      expect(profile.createdAt).toBeDefined()
    })

    it('should create profile with optional fields omitted', () => {
      const profile = createStudentProfile({
        householdId: 'household_test',
        name: 'Omar',
        gradeLabel: 'Grade 6',
        username: 'omar.student',
        password: 'pass123',
      })

      expect(profile.name).toBe('Omar')
      expect(profile.dob).toBeUndefined()
      expect(profile.teacherName).toBeUndefined()
    })

    it('should generate unique IDs for each profile', () => {
      const p1 = createStudentProfile({
        householdId: 'household_test',
        name: 'Child1',
        gradeLabel: 'Grade 1',
        username: 'child1',
        password: 'pass',
      })
      const p2 = createStudentProfile({
        householdId: 'household_test',
        name: 'Child2',
        gradeLabel: 'Grade 2',
        username: 'child2',
        password: 'pass',
      })

      expect(p1.id).not.toBe(p2.id)
    })

    it('should set avatarInitials from name if not provided', () => {
      const profile = createStudentProfile({
        householdId: 'household_test',
        name: 'Zahra',
        gradeLabel: 'Grade 3',
        username: 'zahra',
        password: 'pass',
      })

      expect(profile.avatarInitials).toBe('Z')
    })

    it('should use provided avatarInitials if specified', () => {
      const profile = createStudentProfile({
        householdId: 'household_test',
        name: 'Samir',
        gradeLabel: 'Grade 4',
        username: 'samir',
        password: 'pass',
        avatarInitials: 'SM',
      })

      expect(profile.avatarInitials).toBe('SM')
    })

    it('should persist the created profile in the store', () => {
      const profile = createStudentProfile({
        householdId: 'household_persist',
        name: 'Mariam',
        gradeLabel: 'Grade 3',
        username: 'mariam.student',
        password: 'pass123',
      })

      const profiles = getStudentProfiles('household_persist')
      expect(profiles.some(p => p.id === profile.id)).toBe(true)
    })
  })
})
