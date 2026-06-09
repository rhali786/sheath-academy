/** @jest-environment node */

jest.mock('@/features/auth/server/requestAuth', () => {
  const { mockRequestAuthModule } = require('@/features/auth/__tests__/helpers')
  return mockRequestAuthModule({ householdId: 'hh_test', userId: 'user_test', timezone: 'UTC' })
})

jest.mock('@/features/subjects/server/rollover', () => ({
  rolloverCourses: jest.fn(),
}))

import { rolloverCourses } from '@/features/subjects/server/rollover'
import { POST } from '@/features/subjects/api/routes/rollover'

const mockRollover = rolloverCourses as jest.Mock

beforeEach(() => {
  mockRollover.mockReset()
})

describe('POST /api/subjects/rollover', () => {
  it('returns 400 when fromYearId or toYearId missing', async () => {
    const req = new Request('http://localhost/api/subjects/rollover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromYearId: 'sy_1' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    expect(mockRollover).not.toHaveBeenCalled()
  })

  it('returns success with created courses', async () => {
    mockRollover.mockResolvedValue([
      {
        id: 'subject_new',
        learnerIds: ['l1'],
        learnerId: 'l1',
        name: 'Math',
        category: 'Math',
        schoolYearId: 'sy_to',
        isActive: true,
        sortOrder: 0,
        createdAt: new Date(),
      },
    ])

    const req = new Request('http://localhost/api/subjects/rollover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromYearId: 'sy_from', toYearId: 'sy_to', courseIds: ['subject_old'] }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.status).toBe('success')
    expect(body.data).toHaveLength(1)
    expect(mockRollover).toHaveBeenCalledWith('hh_test', 'sy_from', 'sy_to', ['subject_old'])
  })
})
