import {
  getTasks,
  updateTask,
  getChildren,
  resetStore,
} from '@/features/dashboard/server/service'
import { getAlerts } from '@/features/alerts/server/service'
import { getQuranSessions, resetStore as resetQuranStore } from '@/features/quran/server/service'

describe('TestCRUDOperations', () => {
  beforeEach(() => {
    resetStore()
    resetQuranStore()
  })

  test('load data initializes with all required fields', () => {
    expect(getChildren()).toBeDefined()
    expect(getTasks()).toBeDefined()
    expect(getAlerts()).toBeDefined()
    expect(getQuranSessions()).toBeDefined()
  })

  test('get children returns all four children', () => {
    const children = getChildren()
    expect(children).toHaveLength(4)

    const childNames = new Set(children.map(c => c.name))
    expect(childNames.has('Layth')).toBe(true)
    expect(childNames.has('Hawa')).toBe(true)
    expect(childNames.has('Talut')).toBe(true)
    expect(childNames.has('Samurai')).toBe(true)
  })

  test('get tasks returns 16 total tasks', () => {
    const tasks = getTasks()
    expect(tasks).toHaveLength(16)
  })

  test('get quran sessions returns 58 sessions', () => {
    const sessions = getQuranSessions()
    expect(sessions).toHaveLength(58)
  })

  test('update task persists in memory', () => {
    resetStore()

    const initialTasks = getTasks()
    const taskToUpdate = initialTasks.find(t => !t.completed) || initialTasks[0]
    const initialState = taskToUpdate.completed

    updateTask(taskToUpdate.id, !initialState)

    const updatedTasks = getTasks()
    const updatedTask = updatedTasks.find(t => t.id === taskToUpdate.id)
    expect(updatedTask?.completed).toBe(!initialState)
  })
})
