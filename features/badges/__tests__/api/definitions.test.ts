/** @jest-environment node */

jest.mock('@/features/auth/server/requestAuth', () => {
  const { mockRequestAuthModule } = require('@/features/auth/__tests__/helpers')
  return mockRequestAuthModule({ householdId: 'hh_test', userId: 'user_test', timezone: 'UTC' })
})

jest.mock('@/features/badges/server/repository', () => ({
  listBadgeDefinitions: jest.fn(),
  getBadgeSettings: jest.fn(),
}))

import { listBadgeDefinitions, getBadgeSettings } from '@/features/badges/server/repository'
import { GET as getDefinitions } from '@/features/badges/api/routes/definitions'
import { GET as getSettings } from '@/features/badges/api/routes/settings'

const mockDefs = listBadgeDefinitions as jest.Mock
const mockSettings = getBadgeSettings as jest.Mock

function makeDefinition(id = 'bd_1') {
  return {
    id,
    householdId: null,
    title: 'Quran Reader',
    description: 'Read Quran daily for 30 days',
    criteria: 'Complete 30 Quran sessions',
    emblemKey: 'quran-reader',
    gradeBands: ['g5_8'],
    verificationRequirement: 'parent',
    isStarter: true,
    enabled: true,
    visibility: 'platform',
  }
}

beforeEach(() => { mockDefs.mockReset(); mockSettings.mockReset() })

describe('GET /api/badges/definitions', () => {
  it('returns empty array when no definitions', async () => {
    mockDefs.mockResolvedValue([])
    const res = await getDefinitions(new Request('http://localhost/api/badges/definitions'))
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data).toEqual([])
  })

  it('returns definitions with correct shape', async () => {
    mockDefs.mockResolvedValue([makeDefinition()])
    const res = await getDefinitions(new Request('http://localhost/api/badges/definitions'))
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data).toHaveLength(1)
    expect(body.data[0]).toMatchObject({ id: 'bd_1', title: 'Quran Reader', isStarter: true })
  })
})

describe('GET /api/badges/settings', () => {
  it('returns default settings', async () => {
    mockSettings.mockResolvedValue({ householdId: 'hh_test', platformBadgesEnabled: true })
    const res = await getSettings(new Request('http://localhost/api/badges/settings'))
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data).toMatchObject({ platformBadgesEnabled: true })
  })
})
