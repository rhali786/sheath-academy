/** @jest-environment node */

jest.mock('@/features/auth/server/requestAuth', () => {
  const { mockRequestAuthModule } = require('@/features/auth/__tests__/helpers')
  return mockRequestAuthModule({ householdId: 'hh_test', userId: 'user_test', timezone: 'UTC' })
})

jest.mock('@/features/quran/server/repository', () => ({
  listQuranSessionRows: jest.fn(),
}))

import { listQuranSessionRows } from '@/features/quran/server/repository'
import { GET } from '@/features/quran/api/routes/summary'

const mockList = listQuranSessionRows as jest.Mock

beforeEach(() => { mockList.mockReset() })

describe('GET /api/quran/summary', () => {
  it('returns a summary with zero counts when no sessions', async () => {
    mockList.mockResolvedValue([])
    const res = await GET(new Request('http://localhost/api/quran/summary'))
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data.sessionsLogged).toBe(0)
    expect(body.data.streakDays).toBe(0)
  })

  it('returns session count from repository', async () => {
    mockList.mockResolvedValue([
      { id: 's1', householdId: 'hh_test', learnerId: 'l1', sessionDate: '2026-05-17', sessionType: 'revision', surah: null, fromAyah: null, toAyah: null, durationMinutes: null, notes: null, createdAt: new Date(), updatedAt: new Date() },
    ])
    const res = await GET(new Request('http://localhost/api/quran/summary'))
    const body = await res.json()
    expect(body.data.sessionsLogged).toBe(1)
  })
})
