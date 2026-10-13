/** @jest-environment node */

jest.mock('@/features/auth/auth', () => ({
  auth: jest.fn(),
}))

jest.mock('@/features/children/server/repository', () => ({
  getLearnerByUserId: jest.fn(),
}))

import { auth } from '@/features/auth/auth'
import { getLearnerByUserId } from '@/features/children/server/repository'
import { GET, POST } from '@/app/api/[...slug]/route'

const mockAuth = auth as jest.Mock
const mockGetLearnerByUserId = getLearnerByUserId as jest.Mock

describe('Protected API choke point', () => {
  test('returns 401 JSON when no session', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await GET(
      new Request('http://localhost/api/dashboard/summary'),
      { params: Promise.resolve({ slug: ['dashboard', 'summary'] }) },
    )
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.status).toBe('error')
    expect(body.data).toBeNull()
  })
})

/**
 * Item 11 — proves the learner role gate is actually *wired into* the dispatcher,
 * not merely implemented. features/auth/__tests__/learnerPolicy.test.ts covers the
 * policy's decisions; these cover that every request passes through it.
 */
describe('Learner role gate is wired into the API choke point', () => {
  function sessionAs(role: string) {
    return {
      user: {
        email: 'learner.x@no-email.local',
        userId: 'user_learner',
        householdId: 'hh_a',
        memberships: [{ householdId: 'hh_a', householdName: 'Test', role }],
      },
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetLearnerByUserId.mockResolvedValue({ id: 'learner_self' })
  })

  test('403s a learner reading household-wide gradebook summaries', async () => {
    mockAuth.mockResolvedValue(sessionAs('learner'))
    const res = await GET(
      new Request('http://localhost/api/gradebook/summaries'),
      { params: Promise.resolve({ slug: ['gradebook', 'summaries'] }) },
    )
    expect(res.status).toBe(403)
  })

  test('403s a learner trying to create a course', async () => {
    mockAuth.mockResolvedValue(sessionAs('learner'))
    const res = await POST(
      new Request('http://localhost/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Math', category: 'Math' }),
      }),
      { params: Promise.resolve({ slug: ['subjects'] }) },
    )
    expect(res.status).toBe(403)
  })

  test('does NOT gate an owner on the same route', async () => {
    mockAuth.mockResolvedValue(sessionAs('owner'))
    const res = await GET(
      new Request('http://localhost/api/gradebook/summaries'),
      { params: Promise.resolve({ slug: ['gradebook', 'summaries'] }) },
    )
    expect(res.status).not.toBe(403)
    expect(mockGetLearnerByUserId).not.toHaveBeenCalled()
  })
})
