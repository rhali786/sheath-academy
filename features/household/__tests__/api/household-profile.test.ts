import {
  getHouseholdProfile,
  createWorkspace,
  createHouseholdProfile,
  updateHouseholdProfile,
  resetDataStore,
} from '@/features/lib/server/dataStore'

beforeEach(() => {
  resetDataStore()
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
    const result = updateHouseholdProfile('New Name')
    expect(result).toBeNull()
  })

  test('updateHouseholdProfile changes the family name', () => {
    const workspace = createWorkspace('Ahmed Academy')
    createHouseholdProfile(workspace.id, 'Ahmed Family')
    const updated = updateHouseholdProfile('Ahmed Academy')
    expect(updated!.familyName).toBe('Ahmed Academy')
    expect(getHouseholdProfile()!.familyName).toBe('Ahmed Academy')
  })

  test('resetDataStore clears the profile', () => {
    const workspace = createWorkspace('Ahmed Academy')
    createHouseholdProfile(workspace.id, 'Ahmed Family')
    resetDataStore()
    expect(getHouseholdProfile()).toBeNull()
  })
})
