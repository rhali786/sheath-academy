import { getDataStore, resetDataStore } from '@/lib/server/dataStore'
import type { DataStore } from '@/lib/types'

describe('TestStartup', () => {
  beforeEach(() => {
    resetDataStore()
  })

  test('should initialize data store successfully', () => {
    const data = getDataStore()
    expect(data).not.toBeNull()
    expect(data).toBeDefined()
  })

  test('should load data with all required fields', () => {
    const data = getDataStore()
    expect(data.children).toBeDefined()
    expect(data.tasks).toBeDefined()
    expect(data.alerts).toBeDefined()
    expect(data.quranSessions).toBeDefined()
    expect(data.records).toBeDefined()
    expect(data.progressData).toBeDefined()
  })

  test('should initialize with correct number of children', () => {
    const data = getDataStore()
    expect(data.children).toHaveLength(3)
    const childNames = data.children.map(c => c.name)
    expect(childNames).toContain('Adam')
    expect(childNames).toContain('Khadijah')
    expect(childNames).toContain('Zayd')
  })
})
