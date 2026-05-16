/** @jest-environment node */

import { getRecordsReport } from '@/features/reports/server/service'
import { SEED_IDS } from '@/features/lib/seedIds'

describe('getRecordsReport', () => {
  it('builds a single-child records summary from feature-owned services', () => {
    const report = getRecordsReport({ childId: SEED_IDS.adam })

    expect(report.child.id).toBe(SEED_IDS.adam)
    expect(report.subjects.length).toBeGreaterThan(0)
    expect(report.attendance.totalRecorded).toBeGreaterThan(0)
    expect(Array.isArray(report.completedLessons)).toBe(true)
    expect(report.progressBySubject.length).toBeGreaterThan(0)
    expect(report.portfolio.count).toBeGreaterThan(0)
  })

  it('uses the active school year as the default date range', () => {
    const report = getRecordsReport({ childId: SEED_IDS.adam })

    expect(report.dateRange).toEqual({
      start: '2025-08-01',
      end: '2026-05-31',
    })
  })

  it('includes parent reflections in portfolio evidence when present', () => {
    const report = getRecordsReport({ childId: SEED_IDS.adam })

    expect(report.portfolio.items.some(item => item.reflection)).toBe(true)
  })

  it('adds advisory checklist items without blocking report generation', () => {
    const report = getRecordsReport({ childId: SEED_IDS.khadijah })

    expect(report.checklist.length).toBeGreaterThan(0)
    expect(report.checklist.every(item => item.blocking === false)).toBe(true)
    expect(report.checklist.some(item => item.id === 'no_portfolio_evidence')).toBe(true)
  })
})
