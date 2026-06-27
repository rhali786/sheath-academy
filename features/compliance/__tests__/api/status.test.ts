/** @jest-environment node */

jest.mock('@/features/auth/server/requestAuth', () => {
  const { mockRequestAuthModule } = require('@/features/auth/__tests__/helpers')
  return mockRequestAuthModule({ householdId: 'hh_test', userId: 'user_test', timezone: 'UTC' })
})

jest.mock('@/features/compliance/server/repository', () => ({
  getComplianceStatusInput: jest.fn(),
}))

import { getComplianceStatusInput } from '@/features/compliance/server/repository'
import { GET } from '@/features/compliance/api/routes/status'
import type { StatusEngineInput } from '@/features/compliance/types'

const mockGetInput = getComplianceStatusInput as jest.Mock

function makeInput(): StatusEngineInput {
  return {
    ruleset: null,
    overrides: [],
    schoolYearConfig: {
      id: 'sy_1',
      householdId: 'hh_test',
      requiredDays: 180,
      requiredHours: null,
      startDate: '2025-08-01',
      endDate: '2026-05-31',
    },
    attendanceSummary: {
      daysPresent: 150,
      totalMinutes: 0,
      rangeStart: '2025-08-01',
      rangeEnd: '2026-05-31',
    },
    subjectCoverage: [],
    artifactFlags: {
      hasAnnualAssessment: false,
      hasPortfolioEvidence: false,
      hasNotarizedDeclaration: false,
    },
  }
}

beforeEach(() => { mockGetInput.mockReset() })

describe('GET /api/compliance/status', () => {
  it('returns 400 when schoolYearId is missing', async () => {
    const res = await GET(new Request('http://localhost/api/compliance/status'))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.status).toBe('error')
  })

  it('returns status engine result with isSelfReported and provenance', async () => {
    mockGetInput.mockResolvedValue(makeInput())
    const res = await GET(new Request('http://localhost/api/compliance/status?schoolYearId=sy_1'))
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(['green', 'yellow', 'red']).toContain(body.data.status)
    expect(Array.isArray(body.data.reasons)).toBe(true)
    expect(Array.isArray(body.data.nextActions)).toBe(true)
    expect(body.data.isSelfReported).toBe(true)
  })

  it('includes informational disclaimer in message', async () => {
    mockGetInput.mockResolvedValue(makeInput())
    const res = await GET(new Request('http://localhost/api/compliance/status?schoolYearId=sy_1'))
    const body = await res.json()
    expect(body.message).toContain('not legal advice')
  })

  it('returns 500 when repository throws', async () => {
    mockGetInput.mockRejectedValue(new Error('db error'))
    const res = await GET(new Request('http://localhost/api/compliance/status?schoolYearId=sy_1'))
    expect(res.status).toBe(500)
  })
})
