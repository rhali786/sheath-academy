/** @jest-environment node */

jest.mock('@/features/auth/auth', () => ({
  auth: jest.fn(),
}))

jest.mock('@/features/auth/server/context', () => {
  const actual = jest.requireActual('@/features/auth/server/context')
  return { ...actual, getAuthCtx: jest.fn() }
})

jest.mock('@/features/admin-metrics/server/service', () => ({
  getAdminMetricsSummary: jest.fn().mockResolvedValue({
    periodStart: '2026-05-01', periodEnd: '2026-05-31',
    activeUsers: 2, activeFamilies: 2, learnersCreated: 3,
    sessionsLogged: 10, completionEvents: 5, deenRecordsCreated: 8,
    evidenceItemsCreated: 4, reportsGenerated: 0,
    previousPeriodComparison: { activeUsersDelta: 0, sessionsDelta: 0, evidenceReportsDelta: 0 },
  }),
  getAdminMetricsUsers: jest.fn().mockResolvedValue({ rows: [], total: 0, page: 1, pageSize: 50 }),
}))

import { auth } from '@/features/auth/auth'
import { getAuthCtx } from '@/features/auth/server/context'
import { seedAuthCtx } from '@/features/auth/__tests__/helpers'
import { GET as GETSummary } from '@/features/admin-metrics/api/routes/summary'
import { GET as GETUsers } from '@/features/admin-metrics/api/routes/users'

const mockAuth = auth as jest.Mock
const mockGetAuthCtx = getAuthCtx as jest.Mock

describe('Admin metrics API', () => {
  const originalAdmin = process.env.ADMIN_EMAIL

  beforeEach(() => {
    mockGetAuthCtx.mockResolvedValue(seedAuthCtx({ email: 'admin@test.com' }))
    process.env.ADMIN_EMAIL = 'admin@test.com'
    mockAuth.mockResolvedValue({ user: { id: 'admin', email: 'admin@test.com' } })
  })

  afterAll(() => {
    process.env.ADMIN_EMAIL = originalAdmin
  })

  test('admin can fetch summary and get success', async () => {
    const res = await GETSummary(new Request('http://localhost/api/admin/metrics/summary?periodStart=2026-05-01&periodEnd=2026-05-31'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data).toBeDefined()
  })

  test('non-admin receives 403', async () => {
    mockGetAuthCtx.mockResolvedValue(seedAuthCtx({ email: 'parent@test.com' }))
    mockAuth.mockResolvedValue({ user: { id: 'x', email: 'parent@test.com' } })
    const res = await GETSummary(new Request('http://localhost/api/admin/metrics/summary'))
    expect(res.status).toBe(403)
  })

  test('unauthenticated receives 401', async () => {
    mockGetAuthCtx.mockResolvedValue(null)
    const res = await GETSummary(new Request('http://localhost/api/admin/metrics/summary'))
    expect(res.status).toBe(401)
  })

  test('users endpoint returns rows array', async () => {
    const res = await GETUsers(new Request('http://localhost/api/admin/metrics/users?periodStart=2026-05-01&periodEnd=2026-05-31'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body.data.rows)).toBe(true)
  })
})
