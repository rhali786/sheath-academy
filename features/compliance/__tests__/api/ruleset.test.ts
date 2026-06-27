/** @jest-environment node */

jest.mock('@/features/auth/server/requestAuth', () => {
  const { mockRequestAuthModule } = require('@/features/auth/__tests__/helpers')
  return mockRequestAuthModule({ householdId: 'hh_test', userId: 'user_test', timezone: 'UTC' })
})

jest.mock('@/features/compliance/server/repository', () => ({
  getActiveRuleset: jest.fn(),
  listDeadlines: jest.fn(),
  listSubmissions: jest.fn(),
}))

import { getActiveRuleset, listDeadlines, listSubmissions } from '@/features/compliance/server/repository'
import { GET as getRuleset } from '@/features/compliance/api/routes/ruleset'
import { GET as getDeadlines } from '@/features/compliance/api/routes/deadlines'
import { GET as getSubmissions } from '@/features/compliance/api/routes/submissions'

const mockRuleset = getActiveRuleset as jest.Mock
const mockDeadlines = listDeadlines as jest.Mock
const mockSubmissions = listSubmissions as jest.Mock

beforeEach(() => { mockRuleset.mockReset(); mockDeadlines.mockReset(); mockSubmissions.mockReset() })

describe('GET /api/compliance/ruleset', () => {
  it('returns null when no ruleset configured', async () => {
    mockRuleset.mockResolvedValue(null)
    const res = await getRuleset(new Request('http://localhost/api/compliance/ruleset'))
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data).toBeNull()
  })

  it('returns ruleset object when found', async () => {
    const ruleset = {
      id: 'rs_1', state: 'TX', pathwayKey: 'independent',
      requirementType: 'attendance_days', value: 180,
      unit: 'days', sourceUrl: 'https://tea.texas.gov',
      lastVerifiedAt: '2026-01-01', isVerified: true,
    }
    mockRuleset.mockResolvedValue(ruleset)
    const res = await getRuleset(new Request('http://localhost/api/compliance/ruleset'))
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data).toMatchObject({ state: 'TX', isVerified: true })
  })
})

describe('GET /api/compliance/deadlines', () => {
  it('returns 400 when schoolYearId missing', async () => {
    const res = await getDeadlines(new Request('http://localhost/api/compliance/deadlines'))
    expect(res.status).toBe(400)
  })

  it('returns empty array when no deadlines', async () => {
    mockDeadlines.mockResolvedValue([])
    const res = await getDeadlines(new Request('http://localhost/api/compliance/deadlines?schoolYearId=sy_1'))
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data).toEqual([])
  })
})

describe('GET /api/compliance/submissions', () => {
  it('returns 400 when schoolYearId missing', async () => {
    const res = await getSubmissions(new Request('http://localhost/api/compliance/submissions'))
    expect(res.status).toBe(400)
  })

  it('returns empty array when no submissions', async () => {
    mockSubmissions.mockResolvedValue([])
    const res = await getSubmissions(new Request('http://localhost/api/compliance/submissions?schoolYearId=sy_1'))
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data).toEqual([])
  })
})
