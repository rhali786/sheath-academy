import { runStatusEngine } from '@/features/compliance/server/status-engine'
import type { StatusEngineInput } from '@/features/compliance/types'

function baseInput(overrides: Partial<StatusEngineInput> = {}): StatusEngineInput {
  return {
    ruleset: {
      id: 'rs1',
      state: 'TX',
      pathwayKey: 'independent',
      requirementType: 'attendance_days',
      value: 180,
      unit: 'days',
      sourceUrl: 'https://example.com',
      lastVerifiedAt: '2026-01-01',
      isVerified: true,
    },
    overrides: [],
    schoolYearConfig: {
      id: 'sy1',
      householdId: 'hh1',
      requiredDays: 180,
      requiredHours: null,
      startDate: '2025-09-01',
      endDate: '2026-06-15',
    },
    attendanceSummary: {
      daysPresent: 150,
      totalMinutes: 0,
      rangeStart: '2025-09-01',
      rangeEnd: '2026-06-15',
    },
    subjectCoverage: [],
    artifactFlags: {
      hasAnnualAssessment: false,
      hasPortfolioEvidence: false,
      hasNotarizedDeclaration: false,
    },
    ...overrides,
  }
}

describe('runStatusEngine', () => {
  it('returns green when attendance meets verified ruleset', () => {
    const result = runStatusEngine(baseInput({
      attendanceSummary: { daysPresent: 180, totalMinutes: 0, rangeStart: '2025-09-01', rangeEnd: '2026-06-15' },
    }))
    expect(result.status).toBe('green')
    expect(result.isSelfReported).toBe(false)
    expect(result.belowLegalFloorWarning).toBeNull()
  })

  it('returns yellow when attendance is between 85% and 100% of requirement', () => {
    const result = runStatusEngine(baseInput({
      attendanceSummary: { daysPresent: 160, totalMinutes: 0, rangeStart: '2025-09-01', rangeEnd: '2026-06-15' },
    }))
    expect(result.status).toBe('yellow')
    expect(result.reasons.length).toBeGreaterThan(0)
  })

  it('returns red when attendance is below 85% of requirement', () => {
    const result = runStatusEngine(baseInput({
      attendanceSummary: { daysPresent: 100, totalMinutes: 0, rangeStart: '2025-09-01', rangeEnd: '2026-06-15' },
    }))
    expect(result.status).toBe('red')
  })

  it('marks isSelfReported when ruleset is null', () => {
    const result = runStatusEngine(baseInput({ ruleset: null }))
    expect(result.isSelfReported).toBe(true)
    expect(result.provenance).toBeNull()
  })

  it('marks isSelfReported when ruleset isVerified=false', () => {
    const result = runStatusEngine(baseInput({
      ruleset: {
        id: 'rs2',
        state: 'TX',
        pathwayKey: 'independent',
        requirementType: 'attendance_days',
        value: 180,
        unit: 'days',
        sourceUrl: null,
        lastVerifiedAt: null,
        isVerified: false,
      },
    }))
    expect(result.isSelfReported).toBe(true)
  })

  it('uses schoolYearConfig requiredDays as floor when ruleset is null', () => {
    const result = runStatusEngine(baseInput({
      ruleset: null,
      schoolYearConfig: {
        id: 'sy1',
        householdId: 'hh1',
        requiredDays: 170,
        requiredHours: null,
        startDate: '2025-09-01',
        endDate: '2026-06-15',
      },
      attendanceSummary: { daysPresent: 170, totalMinutes: 0, rangeStart: '2025-09-01', rangeEnd: '2026-06-15' },
    }))
    expect(result.status).toBe('green')
    expect(result.isSelfReported).toBe(true)
  })

  it('warns when household target is below legal floor', () => {
    const result = runStatusEngine(baseInput({
      schoolYearConfig: {
        id: 'sy1',
        householdId: 'hh1',
        requiredDays: 170,
        requiredHours: null,
        startDate: '2025-09-01',
        endDate: '2026-06-15',
      },
      attendanceSummary: { daysPresent: 170, totalMinutes: 0, rangeStart: '2025-09-01', rangeEnd: '2026-06-15' },
    }))
    // ruleset requires 180, schoolYear says 170 → should warn
    expect(result.belowLegalFloorWarning).not.toBeNull()
    expect(result.belowLegalFloorWarning).toMatch(/170/)
  })

  it('applies override value when present', () => {
    const result = runStatusEngine(baseInput({
      overrides: [{
        id: 'ov1',
        householdId: 'hh1',
        schoolYearId: 'sy1',
        requirementType: 'attendance_days',
        overrideValue: 150,
        appliedAt: '2026-01-01',
      }],
      attendanceSummary: { daysPresent: 150, totalMinutes: 0, rangeStart: '2025-09-01', rangeEnd: '2026-06-15' },
    }))
    // override reduces required days to 150; 150/150 = 100% → green
    expect(result.status).toBe('green')
  })

  it('precedence: never silently merges ruleset and school-year — labels source', () => {
    const result = runStatusEngine(baseInput())
    // When ruleset is verified, provenance should reference it
    expect(result.provenance).toContain('TX')
  })

  it('populates missingData when attendance summary has no data', () => {
    const result = runStatusEngine(baseInput({
      attendanceSummary: { daysPresent: 0, totalMinutes: 0, rangeStart: '', rangeEnd: '' },
      ruleset: null,
      schoolYearConfig: {
        id: 'sy1',
        householdId: 'hh1',
        requiredDays: null,
        requiredHours: null,
        startDate: '',
        endDate: '',
      },
    }))
    expect(result.missingData.length).toBeGreaterThan(0)
  })
})
