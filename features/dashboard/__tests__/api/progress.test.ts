import { GET } from '@/app/api/dashboard/progress/route'
import { resetDataStore } from '@/features/lib/server/dataStore'

describe('TestProgress', () => {
  beforeEach(() => {
    resetDataStore()
  })

  test('get progress returns data for all children', async () => {
    const response = await GET()
    const data = await response.json()

    expect(data.status).toBe('success')
    expect(data.data).toBeDefined()
    expect(data.data.adam_001).toBeDefined()
    expect(data.data.khadijah_001).toBeDefined()
    expect(data.data.zayd_001).toBeDefined()
  })

  test('progress data has correct structure with subjects', async () => {
    const response = await GET()
    const data = (await response.json()).data

    const adam = data.adam_001
    expect(adam.childName).toBe('Adam')
    expect(Array.isArray(adam.subjects)).toBe(true)
    expect(adam.subjects.length).toBeGreaterThan(0)

    const subject = adam.subjects[0]
    expect(subject.subject).toBeDefined()
    expect(typeof subject.completion).toBe('number')
  })
})
