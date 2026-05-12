import {
  getSchoolYear,
  updateSchoolYear,
  activateSchoolYear,
  getSchoolYears,
  resetStore,
} from '@/features/school-year/server/service'
import { SEED_SCHOOL_YEARS } from '@/features/school-year/server/seed'
import { SEED_IDS } from '@/features/lib/seedIds'

beforeEach(() => {
  resetStore()
})

describe('School Year - Single Item Operations', () => {
  describe('getSchoolYear()', () => {
    it('GET /school-years/:id returns the year for a known id', () => {
      const year = getSchoolYear(SEED_IDS.schoolYear)
      expect(year).not.toBeNull()
      expect(year!.id).toBe(SEED_IDS.schoolYear)
    })

    it('GET /school-years/:id returns 404 for unknown id', () => {
      const year = getSchoolYear('nonexistent_id')
      expect(year).toBeNull()
    })
  })

  describe('updateSchoolYear()', () => {
    it('PUT /school-years/:id updates the year', () => {
      const updated = updateSchoolYear(SEED_IDS.schoolYear, { name: 'Updated Name' })
      expect(updated).not.toBeNull()
      expect(updated!.name).toBe('Updated Name')
    })

    it('PUT /school-years/:id returns null for unknown id', () => {
      const updated = updateSchoolYear('nonexistent_id', { name: 'Ghost' })
      expect(updated).toBeNull()
    })

    it('PUT /school-years/:id validates endDate > startDate', () => {
      expect(() =>
        updateSchoolYear(SEED_IDS.schoolYear, {
          startDate: '2026-08-01',
          endDate: '2026-07-01',
        })
      ).toThrow(/endDate must be after startDate/i)
    })
  })

  describe('activateSchoolYear()', () => {
    it('PATCH /school-years/:id/activate sets that year active and others inactive', () => {
      const allBefore = getSchoolYears()
      expect(allBefore.length).toBeGreaterThan(0)

      const targetId = SEED_IDS.schoolYear
      const activated = activateSchoolYear(targetId)
      expect(activated).not.toBeNull()
      expect(activated!.isActive).toBe(true)

      const allAfter = getSchoolYears()
      const others = allAfter.filter(y => y.id !== targetId)
      others.forEach(y => expect(y.isActive).toBe(false))
    })

    it('PATCH /school-years/:id/activate returns null for unknown id', () => {
      const result = activateSchoolYear('nonexistent_id')
      expect(result).toBeNull()
    })
  })

  describe('business rules', () => {
    it('only one school year is active at a time after activation', () => {
      const years = getSchoolYears()
      const secondId = years.find(y => y.id !== SEED_IDS.schoolYear)?.id
      if (!secondId) return

      activateSchoolYear(secondId)
      const allAfter = getSchoolYears()
      const activeYears = allAfter.filter(y => y.isActive)
      expect(activeYears).toHaveLength(1)
      expect(activeYears[0].id).toBe(secondId)
    })

    it('seed data has exactly one active school year', () => {
      const activeYears = SEED_SCHOOL_YEARS.filter(y => y.isActive)
      expect(activeYears).toHaveLength(1)
    })
  })
})
