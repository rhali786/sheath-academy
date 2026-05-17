/**
 * TDD: Tests for report date validation.
 * These tests should FAIL until server-side validation is added to getRecordsReport.
 */
import { getRecordsReport } from '@/features/reports/server/service'
import { resetStore as resetChildrenStore } from '@/features/children/server/service'
import { resetStore as resetPlannerStore } from '@/features/planner/server/service'
import { resetStore as resetAttendanceStore } from '@/features/attendance/server/service'
import { resetEvidenceStore } from '@/features/portfolio/server/service'
import { SEED_IDS } from '@/features/lib/seedIds'

function resetAll() {
  resetChildrenStore()
  resetPlannerStore()
  resetAttendanceStore()
  resetEvidenceStore()
}

describe('Report date validation — server-side', () => {
  beforeEach(resetAll)

  const FAR_FUTURE = '2099-12-31'
  const TOMORROW = (() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().slice(0, 10)
  })()
  const YESTERDAY = (() => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return d.toISOString().slice(0, 10)
  })()
  const TODAY = new Date().toISOString().slice(0, 10)

  test('end date in the future throws a validation error', () => {
    expect(() =>
      getRecordsReport({ childId: SEED_IDS.hawa, endDate: FAR_FUTURE })
    ).toThrow(/end date.*future|future.*end date/i)
  })

  test('start date in the future throws a validation error', () => {
    expect(() =>
      getRecordsReport({ childId: SEED_IDS.hawa, startDate: FAR_FUTURE })
    ).toThrow(/start date.*future|future.*start date/i)
  })

  test('end date of tomorrow throws a validation error', () => {
    expect(() =>
      getRecordsReport({ childId: SEED_IDS.hawa, endDate: TOMORROW })
    ).toThrow()
  })

  test('start date of tomorrow throws a validation error', () => {
    expect(() =>
      getRecordsReport({ childId: SEED_IDS.hawa, startDate: TOMORROW })
    ).toThrow()
  })

  test('start date after end date throws a validation error', () => {
    expect(() =>
      getRecordsReport({
        childId: SEED_IDS.hawa,
        startDate: TODAY,
        endDate: YESTERDAY,
      })
    ).toThrow(/start date.*end date|end date.*start date/i)
  })

  test('valid past date range does not throw', () => {
    expect(() =>
      getRecordsReport({
        childId: SEED_IDS.hawa,
        startDate: YESTERDAY,
        endDate: TODAY,
      })
    ).not.toThrow()
  })

  test('no dates provided (defaults to school year) does not throw', () => {
    // School year end date may be in the future — server should not cap the default
    expect(() =>
      getRecordsReport({ childId: SEED_IDS.hawa })
    ).not.toThrow()
  })
})
