import {
  getTasks,
  updateTask,
  getChildren,
  getQuranSessions,
  getRecords,
  resetStore,
} from '@/features/dashboard/server/service'
import { getAlerts } from '@/features/alerts/server/service'

describe('TestCRUDOperations', () => {
  beforeEach(() => {
    resetStore()
  })

  test('load data initializes with all required fields', () => {
    expect(getChildren()).toBeDefined()
    expect(getTasks()).toBeDefined()
    expect(getAlerts()).toBeDefined()
    expect(getQuranSessions()).toBeDefined()
    expect(getRecords()).toBeDefined()
  })

  test('get children returns all three children', () => {
    const children = getChildren()
    expect(children).toHaveLength(3)

    const childNames = new Set(children.map(c => c.name))
    expect(childNames.has('Adam')).toBe(true)
    expect(childNames.has('Khadijah')).toBe(true)
    expect(childNames.has('Zayd')).toBe(true)
  })

  test('get tasks returns 15 total tasks', () => {
    const tasks = getTasks()
    expect(tasks).toHaveLength(15)
  })

  test('get quran sessions returns 11 sessions', () => {
    const sessions = getQuranSessions()
    expect(sessions).toHaveLength(11)
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
