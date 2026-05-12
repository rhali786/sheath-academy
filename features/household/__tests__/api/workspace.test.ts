import {
  getWorkspace,
  createWorkspace,
  resetStore,
} from '@/features/household/server/service'

beforeEach(() => {
  resetStore()
})

describe('workspace (household data layer)', () => {
  test('returns null when no workspace has been created', () => {
    const workspace = getWorkspace()
    expect(workspace).toBeNull()
  })

  test('createWorkspace returns a workspace with all required fields', () => {
    const workspace = createWorkspace('Ahmed Academy')
    expect(typeof workspace.id).toBe('string')
    expect(typeof workspace.name).toBe('string')
    expect(typeof workspace.ownerId).toBe('string')
    expect(typeof workspace.createdAt).toBe('string')
  })

  test('createWorkspace stores the provided name', () => {
    const workspace = createWorkspace('Ahmed Academy')
    expect(workspace.name).toBe('Ahmed Academy')
  })

  test('getWorkspace returns the workspace after creation', () => {
    createWorkspace('Ahmed Academy')
    const workspace = getWorkspace()
    expect(workspace).not.toBeNull()
    expect(workspace!.name).toBe('Ahmed Academy')
  })

  test('createWorkspace replaces any previous workspace', () => {
    createWorkspace('First Family')
    createWorkspace('Second Family')
    const workspace = getWorkspace()
    expect(workspace!.name).toBe('Second Family')
  })

  test('resetStore clears the workspace', () => {
    createWorkspace('Ahmed Academy')
    resetStore()
    expect(getWorkspace()).toBeNull()
  })
})
