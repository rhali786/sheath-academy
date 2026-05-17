import { SEED_IDS } from '@/features/lib/seedIds'
import {
  getQuranSessions,
  addQuranSession,
  resetStore,
} from '@/features/quran/server/service'

beforeEach(resetStore)

describe('getQuranSessions', () => {
  test('returns all seeded sessions when no childId filter', () => {
    const sessions = getQuranSessions()
    expect(sessions.length).toBeGreaterThan(0)
  })

  test('returns only sessions for the given childId', () => {
    const sessions = getQuranSessions(SEED_IDS.adam)
    expect(sessions.length).toBeGreaterThan(0)
    sessions.forEach(s => expect(s.childId).toBe(SEED_IDS.adam))
  })

  test('returns empty array for a childId with no sessions', () => {
    const sessions = getQuranSessions('nonexistent_child')
    expect(sessions).toHaveLength(0)
  })
})

describe('addQuranSession', () => {
  test('creates a new session with the provided data', () => {
    const before = getQuranSessions(SEED_IDS.khadijah).length
    addQuranSession({
      childId: SEED_IDS.khadijah,
      type: 'Revision',
      surah: 'Al-Fatihah',
      fromAyah: 1,
      toAyah: 7,
      notes: 'Test',
    })
    const after = getQuranSessions(SEED_IDS.khadijah)
    expect(after).toHaveLength(before + 1)
    expect(after[after.length - 1].surah).toBe('Al-Fatihah')
  })

  test('assigned new session a unique id', () => {
    const s1 = addQuranSession({ childId: SEED_IDS.adam, type: 'Revision', surah: 'Al-Ikhlas', fromAyah: 1, toAyah: 4, notes: '' })
    const s2 = addQuranSession({ childId: SEED_IDS.adam, type: 'Revision', surah: 'Al-Ikhlas', fromAyah: 1, toAyah: 4, notes: '' })
    expect(s1.id).not.toBe(s2.id)
  })

  test('new session has a date field', () => {
    const session = addQuranSession({ childId: SEED_IDS.zayd, type: 'Recitation', surah: 'Juz 30', fromAyah: 1, toAyah: 50, notes: '' })
    expect(session.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
