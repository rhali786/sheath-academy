import { GET } from '@/features/dashboard/api/routes/records'
import { resetDataStore } from '@/features/lib/server/dataStore'

describe('TestRecords', () => {
  beforeEach(() => {
    resetDataStore()
  })

  test('get records returns all records with correct structure', async () => {
    const response = await GET()
    const data = await response.json()

    expect(data.status).toBe('success')
    expect(Array.isArray(data.data)).toBe(true)
    expect(data.data.length).toBe(4) // 4 record types

    data.data.forEach((record: any) => {
      expect(record.id).toBeDefined()
      expect(record.title).toBeDefined()
      expect(typeof record.count).toBe('number')
      expect(record.icon).toBeDefined()
    })
  })
})
