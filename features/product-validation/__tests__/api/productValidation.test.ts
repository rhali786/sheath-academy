/** @jest-environment node */

jest.mock('@/features/auth/auth', () => ({
  auth: jest.fn(),
}))

jest.mock('@/features/auth/server/context', () => {
  const actual = jest.requireActual('@/features/auth/server/context')
  return {
    ...actual,
    getAuthCtx: jest.fn(),
  }
})

import { auth } from '@/features/auth/auth'
import { getAuthCtx } from '@/features/auth/server/context'
import { seedAuthCtx } from '@/features/auth/__tests__/helpers'
import { POST, GET } from '@/features/product-validation/api/routes/responses'
import { GET as GETSummary } from '@/features/product-validation/api/routes/summary'
import { resetProductValidationStore } from '@/features/product-validation/server/store'
import { resetProductValidationIdCounter } from '@/features/product-validation/server/ids'
import type { CreateProductValidationInput } from '@/features/product-validation/types'

const mockAuth = auth as jest.Mock
const mockGetAuthCtx = getAuthCtx as jest.Mock

function validBody(
  overrides: Partial<CreateProductValidationInput & { forkTestFitScore?: number }> = {},
) {
  const { forkTestFitScore, ...rest } = overrides
  return {
    respondentEmail: 'parent@example.com',
    respondentType: 'homeschool_family',
    usageDuration: 'one_week',
    usedFeatureAreas: ['dashboard'],
    previousPainScore: 4,
    improvementScore: 5,
    easeScore: 3,
    trustScore: 4,
    retentionScore: 5,
    payScore: 2,
    referralScore: 4,
    positioningClarityScore: 3,
    reasonableMonthlyPriceBucket: '15',
    replacedWhat: 'Spreadsheets',
    mostUseful: 'Planner',
    confusingOrBurdensome: 'Setup',
    mustHaveChange: 'Reports',
    lostAccessReaction: 'Revert to paper',
    recommendTo: 'Co-op parents',
    referralMessage: 'Try this',
    mayContact: true,
    mayQuoteAnonymized: false,
    mayQuoteWithName: false,
    ...(forkTestFitScore !== undefined ? { forkTestFitScore } : {}),
    ...rest,
  }
}

describe('POST /api/product-validation/responses', () => {
  const originalAdminEmail = process.env.ADMIN_EMAIL

  beforeEach(() => {
    resetProductValidationStore()
    resetProductValidationIdCounter()
    mockGetAuthCtx.mockResolvedValue(seedAuthCtx())
    mockAuth.mockResolvedValue({
      user: { id: 'test-user', email: 'parent@example.com' },
    })
  })

  afterAll(() => {
    process.env.ADMIN_EMAIL = originalAdminEmail
  })

  test('returns 401 when not authenticated', async () => {
    mockGetAuthCtx.mockResolvedValue(null)
    const res = await POST(
      new Request('http://localhost/api/product-validation/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBody()),
      }),
    )
    expect(res.status).toBe(401)
  })

  test('creates a response for signed-in user', async () => {
    const res = await POST(
      new Request('http://localhost/api/product-validation/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBody()),
      }),
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data.userId).toBe('test-user')
    expect(body.data.householdId).toBe(seedAuthCtx().householdId)
    expect(body.data.forkTestFitScore).toBe(4)
  })

  test('allows multiple submissions by the same user', async () => {
    await POST(
      new Request('http://localhost/api/product-validation/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBody()),
      }),
    )
    const res = await POST(
      new Request('http://localhost/api/product-validation/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBody({ mostUseful: 'Attendance' })),
      }),
    )
    expect(res.status).toBe(200)
    process.env.ADMIN_EMAIL = 'admin@test.com'
    mockAuth.mockResolvedValue({
      user: { id: 'admin', email: 'admin@test.com' },
    })
    const listRes = await GET(
      new Request('http://localhost/api/product-validation/responses'),
    )
    const listBody = await listRes.json()
    expect(listBody.data).toHaveLength(2)
  })

  test('rejects missing required score', async () => {
    const res = await POST(
      new Request('http://localhost/api/product-validation/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBody({ previousPainScore: undefined as unknown as number })),
      }),
    )
    expect(res.status).toBe(400)
  })

  test('rejects invalid score range', async () => {
    const res = await POST(
      new Request('http://localhost/api/product-validation/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBody({ payScore: 9 })),
      }),
    )
    expect(res.status).toBe(400)
  })

  test('rejects invalid price bucket', async () => {
    const res = await POST(
      new Request('http://localhost/api/product-validation/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          validBody({
            reasonableMonthlyPriceBucket: '99' as CreateProductValidationInput['reasonableMonthlyPriceBucket'],
          }),
        ),
      }),
    )
    expect(res.status).toBe(400)
  })

  test('rejects missing required open text', async () => {
    const res = await POST(
      new Request('http://localhost/api/product-validation/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBody({ replacedWhat: '  ' })),
      }),
    )
    expect(res.status).toBe(400)
  })

  test('ignores client-supplied forkTestFitScore', async () => {
    const res = await POST(
      new Request('http://localhost/api/product-validation/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBody({ forkTestFitScore: 1 })),
      }),
    )
    const body = await res.json()
    expect(body.data.forkTestFitScore).toBe(4)
  })
})

describe('GET admin product-validation endpoints', () => {
  beforeEach(() => {
    resetProductValidationStore()
    resetProductValidationIdCounter()
    mockGetAuthCtx.mockResolvedValue(seedAuthCtx())
    process.env.ADMIN_EMAIL = 'admin@test.com'
  })

  test('summary returns 403 for non-admin', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'user@test.com' } })
    const res = await GETSummary(
      new Request('http://localhost/api/product-validation/summary'),
    )
    expect(res.status).toBe(403)
  })

  test('summary returns aggregates for admin', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'admin@test.com' } })
    await POST(
      new Request('http://localhost/api/product-validation/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBody()),
      }),
    )
    const res = await GETSummary(
      new Request('http://localhost/api/product-validation/summary'),
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.totalResponses).toBe(1)
    expect(body.data.averageForkTestFitScore).toBe(4)
  })

  test('list rejects non-admin', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'user@test.com' } })
    const res = await GET(
      new Request('http://localhost/api/product-validation/responses'),
    )
    expect(res.status).toBe(403)
  })
})
