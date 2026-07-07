/** @jest-environment node */

jest.mock('@/features/auth/server/requestAuth', () => {
  const { mockRequestAuthModule } = require('@/features/auth/__tests__/helpers')
  return mockRequestAuthModule({ householdId: 'hh_test', userId: 'user_test', timezone: 'UTC' })
})

jest.mock('@/features/compliance/server/repository', () => ({
  listRulesets: jest.fn(),
  setHouseholdComplianceConfig: jest.fn(),
}))

import { listRulesets, setHouseholdComplianceConfig } from '@/features/compliance/server/repository'
import { GET } from '@/features/compliance/api/routes/rulesets'
import { PUT } from '@/features/compliance/api/routes/config'

const mockList = listRulesets as jest.Mock
const mockSetConfig = setHouseholdComplianceConfig as jest.Mock

beforeEach(() => { mockList.mockReset(); mockSetConfig.mockReset() })

describe('GET /api/compliance/rulesets', () => {
  it('returns the list of rulesets', async () => {
    mockList.mockResolvedValue([{ id: 'r1', state: 'TX', pathwayKey: 'p', requirementType: 'days', value: 180, unit: 'days', sourceUrl: null, lastVerifiedAt: null, isVerified: true }])
    const res = await GET(new Request('http://localhost/api/compliance/rulesets'))
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data).toHaveLength(1)
    expect(body.data[0].state).toBe('TX')
  })

  it('returns empty array when none', async () => {
    mockList.mockResolvedValue([])
    const res = await GET(new Request('http://localhost/api/compliance/rulesets'))
    const body = await res.json()
    expect(body.data).toEqual([])
  })
})

describe('PUT /api/compliance/config', () => {
  it('sets the active ruleset and pathway', async () => {
    mockSetConfig.mockResolvedValue(undefined)
    const res = await PUT(new Request('http://localhost/api/compliance/config', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activeRulesetId: 'r1', pathwayKey: 'umbrella' }),
    }))
    expect(res.status).toBe(200)
    expect(mockSetConfig).toHaveBeenCalledWith('hh_test', { activeRulesetId: 'r1', pathwayKey: 'umbrella' })
  })

  it('clears config when nulls passed', async () => {
    mockSetConfig.mockResolvedValue(undefined)
    const res = await PUT(new Request('http://localhost/api/compliance/config', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }))
    expect(res.status).toBe(200)
    expect(mockSetConfig).toHaveBeenCalledWith('hh_test', { activeRulesetId: null, pathwayKey: null })
  })
})
