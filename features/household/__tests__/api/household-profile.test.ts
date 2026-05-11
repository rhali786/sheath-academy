import { getHouseholdProfile, resetDataStore } from '@/features/lib/server/dataStore'

beforeEach(() => {
  resetDataStore()
})

describe('getHouseholdProfile (household data layer)', () => {
  test('returns a household profile from the seeded store', () => {
    const profile = getHouseholdProfile()
    expect(profile).not.toBeNull()
  })

  test('household profile has all required fields', () => {
    const profile = getHouseholdProfile()!
    expect(typeof profile.id).toBe('string')
    expect(typeof profile.workspaceId).toBe('string')
    expect(typeof profile.familyName).toBe('string')
    expect(typeof profile.createdAt).toBe('string')
  })

  test('profile links to the seeded workspace', () => {
    const profile = getHouseholdProfile()!
    expect(profile.familyName).toBe('Naeem Family')
    expect(profile.workspaceId).toBe('workspace_001')
  })

  test('returns the profile id correctly', () => {
    const profile = getHouseholdProfile()!
    expect(profile.id).toBe('household_001')
  })
})
