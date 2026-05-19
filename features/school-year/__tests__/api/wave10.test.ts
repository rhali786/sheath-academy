/**
 * Wave 10 — FB-009 School Year as academic calendar foundation
 * Unit tests for calculatePlannedSchoolDays and getSchoolYearProgress.
 * Written first (TDD) — will fail until service is updated.
 */
import {
  calculatePlannedSchoolDays,
  getSchoolYearProgress,
  resetStore,
  seedSchoolYears,
} from '@/features/school-year/server/service'
import type { SchoolBreak } from '@/features/school-year/types'
import { SEED_IDS } from '@/features/lib/seedIds'

beforeEach(() => {
  resetStore()
})

describe('calculatePlannedSchoolDays', () => {
  test('returns 5 for Mon–Fri one week (Mon Jan 5 – Fri Jan 9 2026)', () => {
    const count = calculatePlannedSchoolDays({
      startDate: '2026-01-05',
      endDate: '2026-01-09',
      schoolDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
    })
    expect(count).toBe(5)
  })

  test('returns 10 for Mon–Fri two weeks (Jan 5–16 2026)', () => {
    const count = calculatePlannedSchoolDays({
      startDate: '2026-01-05',
      endDate: '2026-01-16',
      schoolDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
    })
    expect(count).toBe(10)
  })

  test('adding a 5-day Eid break decreases count by 5', () => {
    const eidBreak: SchoolBreak = {
      id: 'b1',
      name: 'Eid break',
      startDate: '2026-01-05',
      endDate: '2026-01-09',
    }
    const withBreak = calculatePlannedSchoolDays({
      startDate: '2026-01-05',
      endDate: '2026-01-16',
      schoolDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
      breaks: [eidBreak],
    })
    expect(withBreak).toBe(5) // 10 - 5 = 5
  })

  test('excludes weekend days when only mon-fri selected', () => {
    // Jan 10 (Sat) and Jan 11 (Sun) 2026 should not count
    const count = calculatePlannedSchoolDays({
      startDate: '2026-01-10',
      endDate: '2026-01-11',
      schoolDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
    })
    expect(count).toBe(0)
  })

  test('counts Saturday and Sunday when schoolDays includes them', () => {
    const count = calculatePlannedSchoolDays({
      startDate: '2026-01-10',
      endDate: '2026-01-11',
      schoolDays: ['sat', 'sun'],
    })
    expect(count).toBe(2)
  })

  test('returns 0 for empty schoolDays', () => {
    const count = calculatePlannedSchoolDays({
      startDate: '2026-01-05',
      endDate: '2026-01-09',
      schoolDays: [],
    })
    expect(count).toBe(0)
  })
})

describe('getSchoolYearProgress', () => {
  test('returns null for unknown school year id', () => {
    expect(getSchoolYearProgress('nonexistent')).toBeNull()
  })

  test('returns totalDays > 0 for active seed school year', () => {
    const progress = getSchoolYearProgress(SEED_IDS.schoolYear)
    expect(progress).not.toBeNull()
    expect(progress!.totalDays).toBeGreaterThan(0)
  })

  test('dayNumber is within [0, totalDays] range', () => {
    const progress = getSchoolYearProgress(SEED_IDS.schoolYear)
    expect(progress).not.toBeNull()
    expect(progress!.dayNumber).toBeGreaterThanOrEqual(0)
    expect(progress!.dayNumber).toBeLessThanOrEqual(progress!.totalDays)
  })

  test('returns correct totalDays when schoolDays are set on year', () => {
    // Seed a school year with known dates and school days
    seedSchoolYears([{
      id: 'test_year',
      workspaceId: 'ws_001',
      name: 'Test Year',
      startDate: '2026-01-05',
      endDate: '2026-01-09',
      isActive: true,
      schoolDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
      createdAt: '2026-01-01T00:00:00Z',
    }])
    const progress = getSchoolYearProgress('test_year')
    expect(progress).not.toBeNull()
    expect(progress!.totalDays).toBe(5)
    expect(progress!.totalWeeks).toBe(1)
  })
})
