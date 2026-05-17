import {
  getTasks,
  getChildren,
  resetStore,
} from '@/features/dashboard/server/service'
import { getQuranSessions, resetStore as resetQuranStore } from '@/features/quran/server/service'
import { SEED_IDS } from '@/features/lib/seedIds'

describe('TestDataIntegrity', () => {
  beforeEach(() => {
    resetStore()
    resetQuranStore()
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
    const validIds = new Set([SEED_IDS.adam, SEED_IDS.khadijah, SEED_IDS.zayd])

    sessions.forEach(session => {
      expect(validIds.has(session.childId)).toBe(true)
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
