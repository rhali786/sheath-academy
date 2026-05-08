import { GET, POST } from '@/app/api/dashboard/tasks/route'
import { POST as completeTask } from '@/app/api/dashboard/tasks/[id]/complete/route'
import { resetDataStore, getTasks, updateTask } from '@/lib/server/dataStore'

describe('TestTasks', () => {
  beforeEach(() => {
    resetDataStore()
  })

  test('get tasks returns all tasks with correct structure', async () => {
    const response = await GET()
    const data = await response.json()

    expect(data.status).toBe('success')
    expect(Array.isArray(data.data)).toBe(true)
    expect(data.data.length).toBeGreaterThan(0)

    // Check task structure
    const task = data.data[0]
    expect(task.id).toBeDefined()
    expect(task.childId).toBeDefined()
    expect(task.subject).toBeDefined()
    expect(task.description).toBeDefined()
    expect(task.status).toBeDefined()
    expect(typeof task.completed).toBe('boolean')
  })

  test('tasks include all three students plus family', async () => {
    const response = await GET()
    const data = await response.json()
    const tasks = data.data

    const childIds = new Set(tasks.map((t: any) => t.childId))
    expect(childIds.has('adam_001')).toBe(true)
    expect(childIds.has('khadijah_001')).toBe(true)
    expect(childIds.has('zayd_001')).toBe(true)
    expect(childIds.has('family')).toBe(true)
  })

  test('complete task toggles completion status', async () => {
    const response = await GET()
    const tasks = (await response.json()).data
    const task = tasks[0]
    const initialCompleted = task.completed

    // Mock the params for the dynamic route
    const completeResponse = await completeTask(
      new Request('http://localhost:3000/api/dashboard/tasks/task_001/complete', {
        method: 'POST',
        body: JSON.stringify({ completed: !initialCompleted }),
      }),
      { params: Promise.resolve({ id: 'task_001' }) }
    )

    const completedTask = (await completeResponse.json()).data
    expect(completedTask.completed).toBe(!initialCompleted)

    // Verify persistence
    const updatedTasks = getTasks()
    const foundTask = updatedTasks.find(t => t.id === 'task_001')
    expect(foundTask?.completed).toBe(!initialCompleted)
  })
})
