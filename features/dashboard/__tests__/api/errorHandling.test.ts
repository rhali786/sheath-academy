import { POST } from '@/features/dashboard/api/routes/tasks-complete'
import { resetDataStore } from '@/features/lib/server/dataStore'

describe('TestAPIErrorHandling', () => {
  beforeEach(() => {
    resetDataStore()
  })

  test('invalid task id returns error gracefully', async () => {
    const response = await POST(
      new Request('http://localhost:3000/api/dashboard/tasks/nonexistent_id/complete', {
        method: 'POST',
        body: JSON.stringify({ completed: true }),
      }),
      { params: Promise.resolve({ id: 'nonexistent_id' }) }
    )

    const data = await response.json()
    expect(response.status).toBe(404)
    expect(data.status).toBe('error')
  })

  test('task completion with valid id succeeds', async () => {
    const response = await POST(
      new Request('http://localhost:3000/api/dashboard/tasks/task_001/complete', {
        method: 'POST',
        body: JSON.stringify({ completed: true }),
      }),
      { params: Promise.resolve({ id: 'task_001' }) }
    )

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.status).toBe('success')
    expect(data.data.id).toBe('task_001')
  })

  test('api responses include required fields', async () => {
    const response = await POST(
      new Request('http://localhost:3000/api/dashboard/tasks/task_001/complete', {
        method: 'POST',
        body: JSON.stringify({ completed: false }),
      }),
      { params: Promise.resolve({ id: 'task_001' }) }
    )

    const data = await response.json()
    expect(data.status).toBeDefined()
    expect(data.data).toBeDefined()
    expect(data.message).toBeDefined()
    expect(data.timestamp).toBeDefined()
  })
})
