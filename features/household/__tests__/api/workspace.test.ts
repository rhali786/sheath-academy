import { getWorkspace, resetDataStore } from '@/features/lib/server/dataStore'

beforeEach(() => {
  resetDataStore()
})

describe('getWorkspace (household data layer)', () => {
  test('returns a workspace from the seeded store', () => {
    const workspace = getWorkspace()
    expect(workspace).not.toBeNull()
  })

  test('workspace has all required fields', () => {
    const workspace = getWorkspace()!
    expect(typeof workspace.id).toBe('string')
    expect(typeof workspace.name).toBe('string')
    expect(typeof workspace.ownerId).toBe('string')
    expect(typeof workspace.createdAt).toBe('string')
  })

  test('returns the seeded Naeem Household workspace', () => {
    const workspace = getWorkspace()!
    expect(workspace.name).toBe('Naeem Household')
    expect(workspace.id).toBe('workspace_001')
  })

  test('returns a fresh copy after resetDataStore', () => {
    const first = getWorkspace()
    resetDataStore()
    const second = getWorkspace()
    expect(second?.id).toBe(first?.id)
  })
})
