/** @jest-environment node */

jest.mock('@/features/quran/server/repository', () => ({
  listQuranSessionRows: jest.fn(),
}))

import { listQuranSessionRows } from '@/features/quran/server/repository'
import { getQuranSummary } from '@/features/quran/server/service'

const mockListRows = listQuranSessionRows as jest.Mock
const FIXED_TODAY = '2026-05-17'
const HOUSEHOLD = 'hh_test'

function makeRow(id: string, date: string, childId = 'child_a') {
  return { id, householdId: HOUSEHOLD, learnerId: childId, sessionDate: date, sessionType: 'revision', surah: null, fromAyah: null, toAyah: null, durationMinutes: null, notes: null, createdAt: new Date(), updatedAt: new Date() }
}

beforeEach(() => {
  mockListRows.mockReset()
  jest.useFakeTimers()
  jest.setSystemTime(new Date(`${FIXED_TODAY}T12:00:00Z`))
})

afterEach(() => {
  jest.useRealTimers()
})

describe('getQuranSummary streakDays', () => {
  test('returns 0 when no sessions exist', async () => {
    mockListRows.mockResolvedValue([])
    const summary = await getQuranSummary(HOUSEHOLD, { childId: 'child_a' })
    expect(summary.streakDays).toBe(0)
  })

  test('returns 1 when only today has a session', async () => {
    mockListRows.mockResolvedValue([makeRow('s1', FIXED_TODAY)])
    const summary = await getQuranSummary(HOUSEHOLD, { childId: 'child_a' })
    expect(summary.streakDays).toBe(1)
  })

  test('counts consecutive days backward from today', async () => {
    mockListRows.mockResolvedValue([
      makeRow('s1', '2026-05-15'),
      makeRow('s2', '2026-05-16'),
      makeRow('s3', '2026-05-17'),
    ])
    const summary = await getQuranSummary(HOUSEHOLD, { childId: 'child_a' })
    expect(summary.streakDays).toBe(3)
  })

  test('stops at first gap — older sessions do not extend streak', async () => {
    mockListRows.mockResolvedValue([
      makeRow('s1', '2026-05-13'),
      makeRow('s2', '2026-05-16'),
      makeRow('s3', '2026-05-17'),
    ])
    const summary = await getQuranSummary(HOUSEHOLD, { childId: 'child_a' })
    expect(summary.streakDays).toBe(2)
  })

  test('sessionsLogged returns total count', async () => {
    mockListRows.mockResolvedValue([makeRow('s1', '2026-05-15'), makeRow('s2', '2026-05-17')])
    const summary = await getQuranSummary(HOUSEHOLD)
    expect(summary.sessionsLogged).toBe(2)
  })
})
