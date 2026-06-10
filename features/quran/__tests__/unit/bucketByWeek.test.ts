import { bucketByWeek, bucketByWeekPerChild } from '@/features/quran/front/components/QuranProgressChart'
import { childColors } from '@/features/quran/front/theme'
import type { QuranSession, StudentProfile } from '@/features/lib/types'

function makeSession(id: string, date: string, childId = 'child_001'): QuranSession {
  return {
    id,
    childId,
    type: 'Revision',
    surah: 'Al-Fatiha',
    fromAyah: 1,
    toAyah: 7,
    date,
    notes: '',
  } as QuranSession
}

function makeStudent(id: string, name: string): StudentProfile {
  return { id, name } as StudentProfile
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

describe('bucketByWeekPerChild', () => {
  const students = [
    makeStudent('child_001', 'Aisha'),
    makeStudent('child_002', 'Yusuf'),
    makeStudent('child_003', 'Zaid'),
  ]

  it('returns [] for empty input', () => {
    expect(bucketByWeekPerChild([], students)).toEqual([])
  })

  it('builds one series per child that has sessions, aligned to the shared set of weeks (0-filled)', () => {
    const sessions = [
      // Aisha: week of 05-10 (×2), week of 05-17 (×1)
      makeSession('a1', '2026-05-10', 'child_001'),
      makeSession('a2', '2026-05-12', 'child_001'),
      makeSession('a3', '2026-05-18', 'child_001'),
      // Yusuf: week of 05-17 (×3)
      makeSession('y1', '2026-05-18', 'child_002'),
      makeSession('y2', '2026-05-19', 'child_002'),
      makeSession('y3', '2026-05-21', 'child_002'),
    ]

    const series = bucketByWeekPerChild(sessions, students)

    // Zaid has no sessions → excluded
    expect(series.map(s => s.id)).toEqual(['Aisha', 'Yusuf'])

    expect(series[0]).toEqual({
      id: 'Aisha',
      childId: 'child_001',
      color: childColors[0],
      total: 3,
      data: [
        { x: 'May 10', y: 2 },
        { x: 'May 17', y: 1 },
      ],
    })

    expect(series[1]).toEqual({
      id: 'Yusuf',
      childId: 'child_002',
      color: childColors[1],
      total: 3,
      data: [
        { x: 'May 10', y: 0 },
        { x: 'May 17', y: 3 },
      ],
    })
  })

  it('colors each series by the child index in the household list (stable per child)', () => {
    const sessions = [makeSession('y1', '2026-05-18', 'child_002')]
    const series = bucketByWeekPerChild(sessions, students)
    expect(series).toHaveLength(1)
    expect(series[0].color).toBe(childColors[1])
  })
})
