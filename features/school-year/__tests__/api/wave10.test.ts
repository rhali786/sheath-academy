import {
  calculatePlannedSchoolDays,
  getSchoolYearProgress,
} from '@/features/school-year/server/service'
import { getSchoolYearRow } from '@/features/school-year/server/repository'
import type { SchoolBreak } from '@/features/school-year/types'
import { SEED_IDS } from '@/features/lib/seedIds'

jest.mock('@/features/school-year/server/repository', () => {
  const actual = jest.requireActual('@/features/school-year/server/repository')
  return {
    ...actual,
    getSchoolYearRow: jest.fn(),
  }
})

const mockGetSchoolYearRow = getSchoolYearRow as jest.Mock
const HOUSEHOLD_ID = 'hh_01'

function makeRow(overrides = {}) {
  return {
    id: SEED_IDS.schoolYear,
    householdId: HOUSEHOLD_ID,
    name: '2025-2026',
    startDate: '2025-08-01',
    endDate: '2026-05-31',
    isActive: true,
    requiredDays: null,
    requiredHours: null,
    trackingMethod: null,
    schoolDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
    breaks: [],
    termStructure: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  }
}

beforeEach(() => {
  mockGetSchoolYearRow.mockResolvedValue(makeRow())
})

afterEach(() => {
  jest.clearAllMocks()
})

describe('calculatePlannedSchoolDays', () => {
  test('returns 5 for Mon-Fri one week (Mon Jan 5 - Fri Jan 9 2026)', () => {
    const count = calculatePlannedSchoolDays({
      startDate: '2026-01-05',
      endDate: '2026-01-09',
      schoolDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
    })
    expect(count).toBe(5)
  })

  test('returns 10 for Mon-Fri two weeks (Jan 5-16 2026)', () => {
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
    expect(withBreak).toBe(5)
  })

  test('excludes weekend days when only mon-fri selected', () => {
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
  test('returns null for unknown school year id', async () => {
    mockGetSchoolYearRow.mockResolvedValue(null)
    await expect(getSchoolYearProgress(HOUSEHOLD_ID, 'nonexistent')).resolves.toBeNull()
  })

  test('returns totalDays > 0 for active seed school year', async () => {
    const progress = await getSchoolYearProgress(HOUSEHOLD_ID, SEED_IDS.schoolYear)
    expect(progress).not.toBeNull()
    expect(progress!.totalDays).toBeGreaterThan(0)
  })

  test('dayNumber is within [0, totalDays] range', async () => {
    const progress = await getSchoolYearProgress(HOUSEHOLD_ID, SEED_IDS.schoolYear)
    expect(progress).not.toBeNull()
    expect(progress!.dayNumber).toBeGreaterThanOrEqual(0)
    expect(progress!.dayNumber).toBeLessThanOrEqual(progress!.totalDays)
  })

  test('returns correct totalDays when schoolDays are set on year', async () => {
    mockGetSchoolYearRow.mockResolvedValue(makeRow({
      id: 'test_year',
      startDate: '2026-01-05',
      endDate: '2026-01-09',
      schoolDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
    }))

    const progress = await getSchoolYearProgress(HOUSEHOLD_ID, 'test_year')
    expect(progress).not.toBeNull()
    expect(progress!.totalDays).toBe(5)
    expect(progress!.totalWeeks).toBe(1)
  })
})
