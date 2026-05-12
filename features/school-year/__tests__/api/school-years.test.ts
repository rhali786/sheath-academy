import { getSchoolYears, createSchoolYear, resetStore } from '@/features/school-year/server/service'
import { SEED_SCHOOL_YEARS } from '@/features/school-year/server/seed'
import { resetStore as resetHouseholdStore } from '@/features/household/server/service'
import { SEED_IDS } from '@/features/lib/seedIds'

// Pre-seed the household workspace so createSchoolYear can resolve a workspaceId
const { workspacesStore } = require('@/features/household/server/store')

beforeEach(() => {
  resetStore()
  resetHouseholdStore()
  workspacesStore.reset([
    {
      id: SEED_IDS.workspace,
      name: 'Test Workspace',
      ownerId: 'user_test',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ])
})

describe('School Years - List and Create', () => {
  describe('getSchoolYears()', () => {
    it('GET /school-years returns seeded school years', () => {
      const years = getSchoolYears()
      expect(years.length).toBe(SEED_SCHOOL_YEARS.length)
    })

    it('GET /school-years returns empty array when no seed', () => {
      const { schoolYearsStore } = require('@/features/school-year/server/store')
      schoolYearsStore.reset([])
      const years = getSchoolYears()
      expect(years).toEqual([])
    })

    it('GET /school-years/active returns the active year', () => {
      const { getActiveSchoolYear } = require('@/features/school-year/server/service')
      const active = getActiveSchoolYear()
      expect(active).not.toBeNull()
      expect(active!.isActive).toBe(true)
      expect(active!.name).toBe('2025\u20132026')
    })

    it('GET /school-years/active returns null when none active', () => {
      const { schoolYearsStore } = require('@/features/school-year/server/store')
      schoolYearsStore.reset([])
      const { getActiveSchoolYear } = require('@/features/school-year/server/service')
      // after resetting to empty, no active year exists
      const active = getActiveSchoolYear()
      expect(active).toBeNull()
    })
  })

  describe('createSchoolYear()', () => {
    it('POST /school-years creates a school year', () => {
      const year = createSchoolYear({
        name: 'Test Year',
        startDate: '2026-08-01',
        endDate: '2027-05-31',
      })
      expect(year.id).toBeDefined()
      expect(year.name).toBe('Test Year')
      expect(year.startDate).toBe('2026-08-01')
      expect(year.endDate).toBe('2027-05-31')
      expect(year.workspaceId).toBeTruthy()
      expect(year.createdAt).toBeDefined()
    })

    it('POST /school-years returns 400 when endDate <= startDate', () => {
      expect(() =>
        createSchoolYear({
          name: 'Bad Year',
          startDate: '2026-08-01',
          endDate: '2026-07-01',
        })
      ).toThrow(/endDate must be after startDate/i)
    })

    it('POST /school-years returns 400 when name is missing', () => {
      expect(() =>
        createSchoolYear({
          name: '',
          startDate: '2026-08-01',
          endDate: '2027-05-31',
        })
      ).toThrow(/name is required/i)
    })

    it('creates a school year with isActive defaulting to false', () => {
      const year = createSchoolYear({
        name: 'Inactive Year',
        startDate: '2026-08-01',
        endDate: '2027-05-31',
      })
      expect(year.isActive).toBe(false)
    })

    it('creates a school year with isActive: true when specified', () => {
      const year = createSchoolYear({
        name: 'Active Year',
        startDate: '2026-08-01',
        endDate: '2027-05-31',
        isActive: true,
      })
      expect(year.isActive).toBe(true)
    })
  })
})
