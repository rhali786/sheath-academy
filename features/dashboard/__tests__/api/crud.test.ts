import {
  getDataStore,
  getTasks,
  updateTask,
  getChildren,
  getQuranSessions,
  addQuranSession,
  getRecords,
  resetDataStore,
} from '@/features/lib/server/dataStore'

describe('TestCRUDOperations', () => {
  beforeEach(() => {
    resetDataStore()
  })

  test('load data initializes with all required fields', () => {
    const data = getDataStore()
    expect(data).toBeDefined()
    expect(data.children).toBeDefined()
    expect(data.tasks).toBeDefined()
    expect(data.alerts).toBeDefined()
    expect(data.quranSessions).toBeDefined()
    expect(data.records).toBeDefined()
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
    resetDataStore()

    const initialTasks = getTasks()
    const taskToUpdate = initialTasks.find(t => !t.completed) || initialTasks[0]
    const initialState = taskToUpdate.completed

    updateTask(taskToUpdate.id, !initialState)

    const updatedTasks = getTasks()
    const updatedTask = updatedTasks.find(t => t.id === taskToUpdate.id)
    expect(updatedTask?.completed).toBe(!initialState)
  })
})
