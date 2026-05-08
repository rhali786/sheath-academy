import { GET } from '@/app/api/dashboard/alerts/route'
import { resetDataStore } from '@/features/lib/server/dataStore'

describe('TestAlerts', () => {
  beforeEach(() => {
    resetDataStore()
  })

  test('get alerts returns all alerts with correct structure', async () => {
    const response = await GET()
    const data = await response.json()

    expect(data.status).toBe('success')
    expect(Array.isArray(data.data)).toBe(true)
    expect(data.data.length).toBe(5) // 5 alerts

    data.data.forEach((alert: any) => {
      expect(alert.id).toBeDefined()
      expect(alert.title).toBeDefined()
      expect(alert.detail).toBeDefined()
      expect(alert.priority).toBeDefined()
      expect(alert.actionButton).toBeDefined()
    })
  })

  test('alerts have correct priority values', async () => {
    const response = await GET()
    const data = (await response.json()).data
    const alerts = data

    const priorities = new Set(alerts.map((a: any) => a.priority))
    expect(['amber', 'gray'].some(p => priorities.has(p))).toBe(true)
  })
})
