/** @jest-environment node */

/**
 * Unit tests for Quran streak calculation in service.
 * Streak = consecutive days backward from today where ≥1 session exists for the child.
 */

import { getQuranSummary, resetStore } from '@/features/quran/server/service'

// We need to control "today" — mock Date
const FIXED_TODAY = '2026-05-17'

function makeSessions(dates: string[], childId = 'child_a') {
  return dates.map((date, i) => ({
    id: `s_${i}`,
    childId,
    type: 'Revision',
    surah: 'Al-Fatiha',
    fromAyah: 1,
    toAyah: 7,
    notes: '',
    date,
    lastLogged: date,
  }))
}

// Mock the store to return controlled sessions
jest.mock('@/features/quran/server/store', () => {
  const sessions: any[] = []
  return {
    quranSessionsStore: {
      getAll: () => sessions,
      insert: (s: any) => { sessions.push(s); return s },
      reset: (seed: any[]) => { sessions.splice(0, sessions.length, ...seed) },
      getById: (id: string) => sessions.find(s => s.id === id),
      update: (id: string, patch: any) => {
        const i = sessions.findIndex(s => s.id === id)
        if (i === -1) return null
        sessions[i] = { ...sessions[i], ...patch }
        return sessions[i]
      },
      remove: (id: string) => {
        const before = sessions.length
        const idx = sessions.findIndex(s => s.id === id)
        if (idx !== -1) sessions.splice(idx, 1)
        return sessions.length < before
      },
    },
  }
})

import { quranSessionsStore } from '@/features/quran/server/store'

beforeEach(() => {
  // Reset date mock
  jest.useFakeTimers()
  jest.setSystemTime(new Date(`${FIXED_TODAY}T12:00:00Z`))
  ;(quranSessionsStore as any).reset([])
})

afterEach(() => {
  jest.useRealTimers()
})

describe('getQuranSummary streakDays', () => {
  test('returns 0 when no sessions exist', () => {
    const summary = getQuranSummary({ childId: 'child_a' })
    expect(summary.streakDays).toBe(0)
  })

  test('returns 1 when only today has a session', () => {
    ;(quranSessionsStore as any).reset(makeSessions(['2026-05-17']))
    const summary = getQuranSummary({ childId: 'child_a' })
    expect(summary.streakDays).toBe(1)
  })

  test('counts consecutive days backward from today', () => {
    ;(quranSessionsStore as any).reset(makeSessions(['2026-05-15', '2026-05-16', '2026-05-17']))
    const summary = getQuranSummary({ childId: 'child_a' })
    expect(summary.streakDays).toBe(3)
  })

  test('stops at first gap — older sessions do not extend streak', () => {
    ;(quranSessionsStore as any).reset(makeSessions(['2026-05-13', '2026-05-16', '2026-05-17']))
    const summary = getQuranSummary({ childId: 'child_a' })
    expect(summary.streakDays).toBe(2)
  })

  test('multiple sessions on the same day still count as 1 streak day', () => {
    ;(quranSessionsStore as any).reset(
      makeSessions(['2026-05-16', '2026-05-16', '2026-05-17', '2026-05-17'])
    )
    const summary = getQuranSummary({ childId: 'child_a' })
    expect(summary.streakDays).toBe(2)
  })

  test('filters streak by childId — other child sessions do not count', () => {
    const mixed = [
      ...makeSessions(['2026-05-17'], 'child_a'),
      ...makeSessions(['2026-05-16'], 'child_b'),
    ]
    ;(quranSessionsStore as any).reset(mixed)
    const summary = getQuranSummary({ childId: 'child_a' })
    expect(summary.streakDays).toBe(1)
  })

  test('returns streakDays when no childId — any session counts', () => {
    ;(quranSessionsStore as any).reset([
      ...makeSessions(['2026-05-16'], 'child_a'),
      ...makeSessions(['2026-05-17'], 'child_b'),
    ])
    const summary = getQuranSummary({})
    expect(summary.streakDays).toBe(2)
  })
})
