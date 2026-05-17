/** @jest-environment node */

import { GET } from '@/features/quran/api/routes/summary'

jest.mock('@/features/quran/server/service', () => ({
  getQuranSummary: jest.fn(),
}))

import { getQuranSummary } from '@/features/quran/server/service'
const mockGetSummary = getQuranSummary as jest.Mock

const defaultSummary = {
  childId: undefined,
  sessionsLogged: 5,
  sessionsByType: [
    { type: 'Revision', count: 3 },
    { type: 'Recitation', count: 2 },
  ],
  recentSessions: [],
  dateRange: { startDate: undefined, endDate: undefined },
}

function makeRequest(url: string): Request {
  return new Request(`http://localhost${url}`)
}

beforeEach(() => {
  mockGetSummary.mockReturnValue(defaultSummary)
})

afterEach(() => {
  jest.clearAllMocks()
})

describe('GET /api/quran/summary', () => {
  test('returns status success and summary shape', async () => {
    const res = await GET(makeRequest('/api/quran/summary'))
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data).toHaveProperty('sessionsLogged')
    expect(body.data).toHaveProperty('sessionsByType')
    expect(body.data).toHaveProperty('recentSessions')
    expect(body.data).toHaveProperty('dateRange')
    expect(body.message).toBe('Quran summary retrieved')
  })

  test('calls service with childId when provided', async () => {
    const res = await GET(makeRequest('/api/quran/summary?childId=adam_01'))
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(mockGetSummary).toHaveBeenCalledWith(
      expect.objectContaining({ childId: 'adam_01' })
    )
  })

  test('passes startDate and endDate to service', async () => {
    const res = await GET(
      makeRequest('/api/quran/summary?startDate=2026-04-01&endDate=2026-05-31')
    )
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(mockGetSummary).toHaveBeenCalledWith(
      expect.objectContaining({ startDate: '2026-04-01', endDate: '2026-05-31' })
    )
  })

  test('calls service with no params when none are provided', async () => {
    await GET(makeRequest('/api/quran/summary'))
    expect(mockGetSummary).toHaveBeenCalledWith(
      expect.objectContaining({ childId: undefined, startDate: undefined, endDate: undefined })
    )
  })
})
