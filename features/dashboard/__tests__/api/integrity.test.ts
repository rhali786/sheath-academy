import {
  getTasks,
  getChildren,
  getQuranSessions,
  getProgressData,
  resetStore,
} from '@/features/dashboard/server/service'

describe('TestDataIntegrity', () => {
  beforeEach(() => {
    resetStore()
  })

  test('no duplicate task ids', () => {
    const tasks = getTasks()
    const taskIds = tasks.map(t => t.id)
    const uniqueIds = new Set(taskIds)

    expect(taskIds.length).toBe(uniqueIds.size)
  })

  test('all tasks have valid child id', () => {
    const tasks = getTasks()
    const children = getChildren()
    const childIds = new Set(children.map(c => c.id))
    childIds.add('family') // Family is valid

    tasks.forEach(task => {
      expect(childIds.has(task.childId)).toBe(true)
    })
  })

  test('quran sessions have valid child id', () => {
    const sessions = getQuranSessions()
    const children = getChildren()
    const childIds = new Set(children.map(c => c.id))

    sessions.forEach(session => {
      expect(childIds.has(session.childId)).toBe(true)
    })
  })

  test('progress data matches children', () => {
    const progress = getProgressData()
    const children = getChildren()
    const childIds = new Set(children.map(c => c.id))

    Object.keys(progress).forEach(childId => {
      expect(childIds.has(childId)).toBe(true)
    })
  })

  test('every task childId in seed matches a seeded child or is "family"', () => {
    const tasks = getTasks()
    const children = getChildren()
    const validIds = new Set([...children.map(c => c.id), 'family'])

    tasks.forEach(task => {
      expect(validIds.has(task.childId)).toBe(true)
    })
  })
})
