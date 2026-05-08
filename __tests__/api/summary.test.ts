import { GET } from '@/app/api/dashboard/summary/route'

describe('TestSummary', () => {
  test('get summary returns all required fields', async () => {
    const response = await GET()
    const data = await response.json()

    expect(data.status).toBe('success')
    expect(data.data).toBeDefined()
    expect(data.data.attendanceReady).toBeDefined()
    expect(data.data.lessonsPlanned).toBeDefined()
    expect(data.data.needsAttention).toBeDefined()
    expect(data.data.quranLogged).toBeDefined()
    expect(data.data.portfolioItems).toBeDefined()
  })
})
