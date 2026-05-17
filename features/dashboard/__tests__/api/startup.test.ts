import {
  getTasks,
  getChildren,
  resetStore,
} from '@/features/dashboard/server/service'
import { getAlerts } from '@/features/alerts/server/service'

describe('TestStartup', () => {
  beforeEach(() => {
    resetStore()
  })

  test('should initialize dashboard data successfully', () => {
    const tasks = getTasks()
    expect(tasks).not.toBeNull()
    expect(tasks).toBeDefined()
  })

  test('should load data with all required fields', () => {
    expect(getChildren()).toBeDefined()
    expect(getTasks()).toBeDefined()
    expect(getAlerts()).toBeDefined()
  })

  test('should initialize with correct number of children', () => {
    const children = getChildren()
    expect(children).toHaveLength(3)
    const childNames = children.map(c => c.name)
    expect(childNames).toContain('Adam')
    expect(childNames).toContain('Khadijah')
    expect(childNames).toContain('Zayd')
  })
})
