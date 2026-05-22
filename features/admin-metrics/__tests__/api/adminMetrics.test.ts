/** @jest-environment node */

jest.mock('@/features/auth/auth', () => ({
  auth: jest.fn(),
}))

jest.mock('@/features/lib/server/db', () => ({
  isPostgresMode: jest.fn(() => false),
}))

jest.mock('@/features/auth/server/context', () => {
  const actual = jest.requireActual('@/features/auth/server/context')
  return { ...actual, getAuthCtx: jest.fn() }
})

import { auth } from '@/features/auth/auth'
import { getAuthCtx } from '@/features/auth/server/context'
import { seedAuthCtx } from '@/features/auth/__tests__/helpers'
import { GET as GETSummary } from '@/features/admin-metrics/api/routes/summary'
import { GET as GETUsers } from '@/features/admin-metrics/api/routes/users'
import { resetMemoryUsageEvents, seedMemoryUsageEvents } from '@/features/admin-metrics/server/store'
import type { UsageEvent } from '@/features/admin-metrics/types'

const mockAuth = auth as jest.Mock
const mockGetAuthCtx = getAuthCtx as jest.Mock

describe('Admin metrics API', () => {
  const originalAdmin = process.env.ADMIN_EMAIL

  beforeEach(() => {
    resetMemoryUsageEvents()
    mockGetAuthCtx.mockResolvedValue(seedAuthCtx())
    process.env.ADMIN_EMAIL = 'admin@test.com'
    mockAuth.mockResolvedValue({ user: { id: 'admin', email: 'admin@test.com' } })
    seedMemoryUsageEvents([
      {
        id: 'u1',
        eventType: 'learner_created',
        userId: 'user_1',
        householdId: 'household_seed_001',
        featureArea: 'learners',
        occurredAt: '2026-05-15T12:00:00Z',
      },
    ] as UsageEvent[])
  })

  afterAll(() => {
    process.env.ADMIN_EMAIL = originalAdmin
  })

  test('admin can fetch summary', async () => {
    const res = await GETSummary(
      new Request('http://localhost/api/admin/metrics/summary?periodStart=2026-05-01&periodEnd=2026-05-31'),
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.learnersCreated).toBeGreaterThanOrEqual(1)
  })

  test('non-admin receives 403', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'x', email: 'parent@test.com' } })
    const res = await GETSummary(new Request('http://localhost/api/admin/metrics/summary'))
    expect(res.status).toBe(403)
  })

  test('unauthenticated receives 401', async () => {
    mockGetAuthCtx.mockResolvedValue(null)
    const res = await GETSummary(new Request('http://localhost/api/admin/metrics/summary'))
    expect(res.status).toBe(401)
  })

  test('users endpoint returns rows', async () => {
    const res = await GETUsers(
      new Request('http://localhost/api/admin/metrics/users?periodStart=2026-05-01&periodEnd=2026-05-31'),
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.rows).toBeDefined()
    expect(Array.isArray(body.data.rows)).toBe(true)
  })
})
