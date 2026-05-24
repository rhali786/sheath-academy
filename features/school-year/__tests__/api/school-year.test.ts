import {
  activateSchoolYear,
  getSchoolYear,
  getSchoolYears,
  updateSchoolYear,
} from '@/features/school-year/server/service'
import {
  activateSchoolYearRow,
  getSchoolYearRow,
  listSchoolYearRows,
  updateSchoolYearRow,
} from '@/features/school-year/server/repository'
import { SEED_IDS } from '@/features/lib/seedIds'

jest.mock('@/features/school-year/server/repository', () => {
  const actual = jest.requireActual('@/features/school-year/server/repository')
  return {
    ...actual,
    activateSchoolYearRow: jest.fn(),
    getSchoolYearRow: jest.fn(),
    listSchoolYearRows: jest.fn(),
    updateSchoolYearRow: jest.fn(),
  }
})

const mockActivateSchoolYearRow = activateSchoolYearRow as jest.Mock
const mockGetSchoolYearRow = getSchoolYearRow as jest.Mock
const mockListSchoolYearRows = listSchoolYearRows as jest.Mock
const mockUpdateSchoolYearRow = updateSchoolYearRow as jest.Mock

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
    schoolDays: null,
    breaks: null,
    termStructure: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  }
}

beforeEach(() => {
  mockGetSchoolYearRow.mockResolvedValue(makeRow())
  mockListSchoolYearRows.mockResolvedValue([makeRow()])
  mockUpdateSchoolYearRow.mockImplementation(async (_id: string, _householdId: string, patch: Record<string, unknown>) =>
    makeRow(patch),
  )
  mockActivateSchoolYearRow.mockResolvedValue(makeRow({ isActive: true }))
})

afterEach(() => {
  jest.clearAllMocks()
})

describe('School Year - Single Item Operations', () => {
  describe('getSchoolYear()', () => {
    it('returns the year for a known household-scoped id', async () => {
      const year = await getSchoolYear(HOUSEHOLD_ID, SEED_IDS.schoolYear)
      expect(year).not.toBeNull()
      expect(year!.id).toBe(SEED_IDS.schoolYear)
      expect(mockGetSchoolYearRow).toHaveBeenCalledWith(SEED_IDS.schoolYear, HOUSEHOLD_ID)
    })

    it('returns null for unknown id', async () => {
      mockGetSchoolYearRow.mockResolvedValue(null)
      const year = await getSchoolYear(HOUSEHOLD_ID, 'nonexistent_id')
      expect(year).toBeNull()
    })
  })

  describe('updateSchoolYear()', () => {
    it('updates the year through the repository', async () => {
      const updated = await updateSchoolYear(HOUSEHOLD_ID, SEED_IDS.schoolYear, { name: 'Updated Name' })
      expect(updated).not.toBeNull()
      expect(updated!.name).toBe('Updated Name')
      expect(mockUpdateSchoolYearRow).toHaveBeenCalledWith(SEED_IDS.schoolYear, HOUSEHOLD_ID, { name: 'Updated Name' })
    })

    it('returns null for unknown id', async () => {
      mockGetSchoolYearRow.mockResolvedValue(null)
      const updated = await updateSchoolYear(HOUSEHOLD_ID, 'nonexistent_id', { name: 'Ghost' })
      expect(updated).toBeNull()
      expect(mockUpdateSchoolYearRow).not.toHaveBeenCalled()
    })

    it('validates endDate > startDate', async () => {
      await expect(
        updateSchoolYear(HOUSEHOLD_ID, SEED_IDS.schoolYear, {
          startDate: '2026-08-01',
          endDate: '2026-07-01',
        }),
      ).rejects.toThrow(/endDate must be after startDate/i)
    })
  })

  describe('activateSchoolYear()', () => {
    it('activates the requested school year through the repository', async () => {
      const activated = await activateSchoolYear(HOUSEHOLD_ID, SEED_IDS.schoolYear)
      expect(activated).not.toBeNull()
      expect(activated!.isActive).toBe(true)
      expect(mockActivateSchoolYearRow).toHaveBeenCalledWith(SEED_IDS.schoolYear, HOUSEHOLD_ID)
    })

    it('returns null for unknown id', async () => {
      mockGetSchoolYearRow.mockResolvedValue(null)
      const result = await activateSchoolYear(HOUSEHOLD_ID, 'nonexistent_id')
      expect(result).toBeNull()
      expect(mockActivateSchoolYearRow).not.toHaveBeenCalled()
    })
  })

  describe('business rules', () => {
    it('lists household-scoped school years from the repository', async () => {
      const years = await getSchoolYears(HOUSEHOLD_ID)
      expect(years).toHaveLength(1)
      expect(mockListSchoolYearRows).toHaveBeenCalledWith(HOUSEHOLD_ID)
    })
  })
})
