import {
  getHouseholdProfile,
  createWorkspace,
  createHouseholdProfile,
  updateHouseholdProfile,
  resetStore,
} from '@/features/household/server/service'

beforeEach(() => {
  resetStore()
})

describe('household profile (household data layer)', () => {
  test('returns null when no profile has been created', () => {
    const profile = getHouseholdProfile()
    expect(profile).toBeNull()
  })

  test('createHouseholdProfile returns a profile with all required fields', () => {
    const workspace = createWorkspace('Ahmed Academy')
    const profile = createHouseholdProfile(workspace.id, 'Ahmed Family')
    expect(typeof profile.id).toBe('string')
    expect(typeof profile.workspaceId).toBe('string')
    expect(typeof profile.familyName).toBe('string')
    expect(typeof profile.createdAt).toBe('string')
  })

  test('createHouseholdProfile links to the workspace', () => {
    const workspace = createWorkspace('Ahmed Academy')
    const profile = createHouseholdProfile(workspace.id, 'Ahmed Family')
    expect(profile.workspaceId).toBe(workspace.id)
    expect(profile.familyName).toBe('Ahmed Family')
  })

  test('getHouseholdProfile returns the profile after creation', () => {
    const workspace = createWorkspace('Ahmed Academy')
    createHouseholdProfile(workspace.id, 'Ahmed Family')
    const profile = getHouseholdProfile()
    expect(profile).not.toBeNull()
    expect(profile!.familyName).toBe('Ahmed Family')
  })

  test('updateHouseholdProfile returns null when no profile exists', () => {
    const result = updateHouseholdProfile({ familyName: 'New Name' })
    expect(result).toBeNull()
  })

  test('updateHouseholdProfile changes the family name', () => {
    const workspace = createWorkspace('Ahmed Academy')
    createHouseholdProfile(workspace.id, 'Ahmed Family')
    const updated = updateHouseholdProfile({ familyName: 'Ahmed Academy' })
    expect(updated!.familyName).toBe('Ahmed Academy')
    expect(getHouseholdProfile()!.familyName).toBe('Ahmed Academy')
  })

  test('updateHouseholdProfile persists new household settings fields', () => {
    const workspace = createWorkspace('Ahmed Academy')
    createHouseholdProfile(workspace.id, 'Ahmed Family')
    const updated = updateHouseholdProfile({
      weekStartDay: 'Saturday',
      schoolDays: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday'],
      reportingName: 'Al-Noor Academy',
      timezone: 'Asia/Dubai',
      dateDisplay: 'bilingual',
    })
    expect(updated!.weekStartDay).toBe('Saturday')
    expect(updated!.schoolDays).toContain('Saturday')
    expect(updated!.reportingName).toBe('Al-Noor Academy')
    expect(updated!.timezone).toBe('Asia/Dubai')
    expect(updated!.dateDisplay).toBe('bilingual')
  })

  test('resetStore clears the profile', () => {
    const workspace = createWorkspace('Ahmed Academy')
    createHouseholdProfile(workspace.id, 'Ahmed Family')
    resetStore()
    expect(getHouseholdProfile()).toBeNull()
  })
})
