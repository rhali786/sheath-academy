import { GET, POST } from '@/app/api/dashboard/quran/route'
import { resetDataStore } from '@/lib/server/dataStore'

describe('TestQuran', () => {
  beforeEach(() => {
    resetDataStore()
  })

  test('get quran sessions returns sessions and chart data', async () => {
    const response = await GET()
    const data = await response.json()

    expect(data.status).toBe('success')
    expect(data.data.sessions).toBeDefined()
    expect(data.data.chartData).toBeDefined()
    expect(Array.isArray(data.data.sessions)).toBe(true)
    expect(data.data.sessions.length).toBeGreaterThan(0)
  })

  test('quran chart data has correct nivo format', async () => {
    const response = await GET()
    const data = (await response.json()).data
    const chartData = data.chartData

    expect(chartData.length).toBe(3) // 3 children

    chartData.forEach((series: any) => {
      expect(series.id).toBeDefined()
      expect(series.color).toBeDefined()
      expect(series.data).toBeDefined()
      expect(Array.isArray(series.data)).toBe(true)
      expect(series.data.length).toBe(5) // Mon-Fri

      series.data.forEach((point: any) => {
        expect(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']).toContain(point.x)
        expect(typeof point.y).toBe('number')
      })
    })
  })
})
