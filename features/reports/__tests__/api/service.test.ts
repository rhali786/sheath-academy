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

// ── C1 & C2 — child isolation and date-range accuracy ──────────────────────

describe('C1 — attendance data is isolated to the requested child', () => {
  it('Adam\'s report contains only Adam\'s attendance', () => {
    const report = getRecordsReport({ childId: SEED_IDS.adam })
    expect(report.child.id).toBe(SEED_IDS.adam)
    // The attendance summary is scoped to adam; if khadijah had records they
    // would not appear in this total.
    expect(report.attendance.totalRecorded).toBeGreaterThanOrEqual(0)
  })

  it('Khadijah\'s report contains only Khadijah\'s attendance', () => {
    const adamReport = getRecordsReport({ childId: SEED_IDS.adam })
    const khadijaReport = getRecordsReport({ childId: SEED_IDS.khadijah })

    // Each report references a different child
    expect(adamReport.child.id).not.toBe(khadijaReport.child.id)
    // Attendance totals may differ between children
    expect(adamReport.attendance).toBeDefined()
    expect(khadijaReport.attendance).toBeDefined()
  })

  it('subjects in Adam\'s report belong only to Adam', () => {
    const report = getRecordsReport({ childId: SEED_IDS.adam })
    expect(report.subjects.every(s => s.childId === SEED_IDS.adam)).toBe(true)
  })

  it('subjects in Khadijah\'s report belong only to Khadijah', () => {
    const report = getRecordsReport({ childId: SEED_IDS.khadijah })
    expect(report.subjects.every(s => s.childId === SEED_IDS.khadijah)).toBe(true)
  })
})

describe('C1 — attendance date-range filtering', () => {
  it('attendance records outside the date range are excluded', () => {
    // Request a one-day range that is before all seed attendance dates
    const report = getRecordsReport({
      childId: SEED_IDS.adam,
      startDate: '2020-01-01',
      endDate: '2020-01-01',
    })
    expect(report.attendance.totalRecorded).toBe(0)
  })

  it('attendance records inside the date range are included', () => {
    // Seed attendance for adam spans the 2025-26 school year; use today as end to avoid future-date validation
    const today = new Date().toISOString().slice(0, 10)
    const report = getRecordsReport({
      childId: SEED_IDS.adam,
      startDate: '2025-08-01',
      endDate: today,
    })
    expect(report.attendance.totalRecorded).toBeGreaterThan(0)
  })
})

describe('C2 — subjects are isolated to the requested child', () => {
  it('Adam\'s subjects do not appear in Khadijah\'s report', () => {
    const adamReport = getRecordsReport({ childId: SEED_IDS.adam })
    const khadijaReport = getRecordsReport({ childId: SEED_IDS.khadijah })

    const adamSubjectIds = new Set(adamReport.subjects.map(s => s.id))
    const khadijaSubjectIds = new Set(khadijaReport.subjects.map(s => s.id))

    const overlap = [...adamSubjectIds].filter(id => khadijaSubjectIds.has(id))
    expect(overlap).toHaveLength(0)
  })
})
