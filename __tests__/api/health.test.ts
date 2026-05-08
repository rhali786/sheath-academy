import { GET } from '@/app/api/health/route'

describe('TestHealth', () => {
  test('health check returns healthy status', async () => {
    const response = await GET()
    const data = await response.json()

    expect(data.status).toBe('healthy')
    expect(data.service).toContain('Sheath Academy')
    expect(data.timestamp).toBeDefined()
  })
})
