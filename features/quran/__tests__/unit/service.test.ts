import { SEED_IDS } from '@/features/lib/seedIds'
import {
  getQuranSessions,
  addQuranSession,
  getQuranSummary,
  resetStore,
} from '@/features/quran/server/service'

beforeEach(resetStore)

describe('getQuranSessions', () => {
  test('returns all seeded sessions when no childId filter', () => {
    const sessions = getQuranSessions()
    expect(sessions.length).toBeGreaterThan(0)
  })

  test('returns only sessions for the given childId', () => {
    const sessions = getQuranSessions(SEED_IDS.layth)
    expect(sessions.length).toBeGreaterThan(0)
    sessions.forEach(s => expect(s.childId).toBe(SEED_IDS.layth))
  })

  test('returns empty array for a childId with no sessions', () => {
    const sessions = getQuranSessions('nonexistent_child')
    expect(sessions).toHaveLength(0)
  })
})

describe('addQuranSession', () => {
  test('creates a new session with the provided data', () => {
    const before = getQuranSessions(SEED_IDS.hawa).length
    addQuranSession({
      childId: SEED_IDS.hawa,
      type: 'Revision',
      surah: 'Al-Fatihah',
      fromAyah: 1,
      toAyah: 7,
      notes: 'Test',
    })
    const after = getQuranSessions(SEED_IDS.hawa)
    expect(after).toHaveLength(before + 1)
    expect(after[after.length - 1].surah).toBe('Al-Fatihah')
  })

  test('assigned new session a unique id', () => {
    const s1 = addQuranSession({ childId: SEED_IDS.layth, type: 'Revision', surah: 'Al-Ikhlas', fromAyah: 1, toAyah: 4, notes: '' })
    const s2 = addQuranSession({ childId: SEED_IDS.layth, type: 'Revision', surah: 'Al-Ikhlas', fromAyah: 1, toAyah: 4, notes: '' })
    expect(s1.id).not.toBe(s2.id)
  })

  test('new session has a date field', () => {
    const session = addQuranSession({ childId: SEED_IDS.talut, type: 'Recitation', surah: 'Juz 30', fromAyah: 1, toAyah: 50, notes: '' })
    expect(session.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('getQuranSummary', () => {
  test('returns sessionsLogged > 0 for default seed', () => {
    const summary = getQuranSummary()
    expect(summary.sessionsLogged).toBeGreaterThan(0)
  })

  test('returns only that child sessions when childId is provided', () => {
    const summary = getQuranSummary({ childId: SEED_IDS.layth })
    expect(summary.sessionsLogged).toBeGreaterThan(0)
    summary.recentSessions.forEach(s => expect(s.childId).toBe(SEED_IDS.layth))
  })

  test('filters by startDate and endDate', () => {
    const summary = getQuranSummary({ startDate: '2026-05-01', endDate: '2026-05-03' })
    // All sessions in range should have dates >= 2026-05-01 and <= 2026-05-03
    summary.recentSessions.forEach(s => {
      expect(s.date >= '2026-05-01').toBe(true)
      expect(s.date <= '2026-05-03').toBe(true)
    })
  })

  test('returns sessionsLogged: 0 when no matching sessions', () => {
    const summary = getQuranSummary({ childId: 'nonexistent_child' })
    expect(summary.sessionsLogged).toBe(0)
    expect(summary.sessionsByType).toHaveLength(0)
    expect(summary.recentSessions).toHaveLength(0)
  })

  test('groups sessions by type correctly', () => {
    const summary = getQuranSummary({ childId: SEED_IDS.layth })
    const revisionEntry = summary.sessionsByType.find(e => e.type === 'Revision')
    const recitationEntry = summary.sessionsByType.find(e => e.type === 'Recitation')
    // Adam has 2 Revision and 2 Recitation sessions in seed
    expect(revisionEntry).toBeDefined()
    expect(revisionEntry!.count).toBeGreaterThan(0)
    expect(recitationEntry).toBeDefined()
    expect(recitationEntry!.count).toBeGreaterThan(0)
  })

  test('recentSessions contains at most 5 items', () => {
    const summary = getQuranSummary()
    expect(summary.recentSessions.length).toBeLessThanOrEqual(5)
  })

  test('summary includes childId when provided', () => {
    const summary = getQuranSummary({ childId: SEED_IDS.hawa })
    expect(summary.childId).toBe(SEED_IDS.hawa)
  })

  test('summary includes dateRange when provided', () => {
    const summary = getQuranSummary({ startDate: '2026-04-01', endDate: '2026-05-31' })
    expect(summary.dateRange.startDate).toBe('2026-04-01')
    expect(summary.dateRange.endDate).toBe('2026-05-31')
  })
})
