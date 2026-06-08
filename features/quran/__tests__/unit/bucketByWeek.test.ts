import { bucketByWeek } from '@/features/quran/front/components/QuranProgressChart'
import type { QuranSession } from '@/features/lib/types'

function makeSession(id: string, date: string): QuranSession {
  return {
    id,
    childId: 'child_001',
    type: 'Revision',
    surah: 'Al-Fatiha',
    fromAyah: 1,
    toAyah: 7,
    date,
    notes: '',
  } as QuranSession
}

describe('bucketByWeek', () => {
  it('returns [] for empty input', () => {
    expect(bucketByWeek([])).toEqual([])
  })

  it('groups sessions into weekly buckets keyed by week start (Sunday) with counts', () => {
    const sessions = [
      // Week of 2026-05-10 (Sun) – 2026-05-16 (Sat)
      makeSession('s1', '2026-05-10'),
      makeSession('s2', '2026-05-12'),
      makeSession('s3', '2026-05-16'),
      // Week of 2026-05-17 (Sun) – 2026-05-23 (Sat)
      makeSession('s4', '2026-05-18'),
      // Week of 2026-05-24 (Sun)
      makeSession('s5', '2026-05-26'),
      makeSession('s6', '2026-05-27'),
    ]

    expect(bucketByWeek(sessions)).toEqual([
      { weekStart: '2026-05-10', count: 3 },
      { weekStart: '2026-05-17', count: 1 },
      { weekStart: '2026-05-24', count: 2 },
    ])
  })

  it('sorts buckets chronologically regardless of input order', () => {
    const sessions = [
      makeSession('s1', '2026-05-26'),
      makeSession('s2', '2026-05-10'),
      makeSession('s3', '2026-05-18'),
    ]

    expect(bucketByWeek(sessions).map(b => b.weekStart)).toEqual([
      '2026-05-10',
      '2026-05-17',
      '2026-05-24',
    ])
  })
})
