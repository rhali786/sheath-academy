/** @jest-environment node */

jest.mock('@/features/auth/server/requestAuth', () => {
  const { mockRequestAuthModule } = require('@/features/auth/__tests__/helpers')
  return mockRequestAuthModule({ householdId: 'hh_test', userId: 'user_test', timezone: 'UTC' })
})

jest.mock('@/features/badges/server/repository', () => ({
  listBadgeCollection: jest.fn(),
  listBadgeAwards: jest.fn(),
}))

import { listBadgeCollection, listBadgeAwards } from '@/features/badges/server/repository'
import { GET as getCollection } from '@/features/badges/api/routes/collection'
import { GET as getAwards } from '@/features/badges/api/routes/awards'

const mockCollection = listBadgeCollection as jest.Mock
const mockAwards = listBadgeAwards as jest.Mock

beforeEach(() => { mockCollection.mockReset(); mockAwards.mockReset() })

describe('GET /api/badges/collection', () => {
  it('returns 400 when learnerId is missing', async () => {
    const res = await getCollection(new Request('http://localhost/api/badges/collection'))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.status).toBe('error')
  })

  it('returns empty collection', async () => {
    mockCollection.mockResolvedValue([])
    const res = await getCollection(new Request('http://localhost/api/badges/collection?learnerId=l1'))
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data).toEqual([])
    expect(mockCollection).toHaveBeenCalledWith('hh_test', 'l1')
  })

  it('returns collection items with shape', async () => {
    const item = {
      definition: { id: 'bd_1', title: 'Quran Reader', emblemKey: 'quran-reader', isStarter: true, enabled: true, gradeBands: ['g5_8'], verificationRequirement: 'parent', criteria: '', description: '', householdId: null, visibility: 'platform' },
      award: null,
      isEarned: false,
    }
    mockCollection.mockResolvedValue([item])
    const res = await getCollection(new Request('http://localhost/api/badges/collection?learnerId=l1'))
    const body = await res.json()
    expect(body.data[0]).toMatchObject({ isEarned: false, award: null })
  })
})

describe('GET /api/badges/awards', () => {
  it('returns 400 when learnerId is missing', async () => {
    const res = await getAwards(new Request('http://localhost/api/badges/awards'))
    expect(res.status).toBe(400)
  })

  it('returns empty awards array', async () => {
    mockAwards.mockResolvedValue([])
    const res = await getAwards(new Request('http://localhost/api/badges/awards?learnerId=l1'))
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data).toEqual([])
  })
})
