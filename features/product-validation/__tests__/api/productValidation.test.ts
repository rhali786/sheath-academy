/** @jest-environment node */

jest.mock('@/features/auth/auth', () => ({
  auth: jest.fn(),
}))

jest.mock('@/features/auth/server/context', () => {
  const actual = jest.requireActual('@/features/auth/server/context')
  return { ...actual, getAuthCtx: jest.fn() }
})

jest.mock('@/features/product-validation/server/repository', () => ({
  insertProductValidationResponse: jest.fn(async (r: unknown) => r),
  listProductValidationResponseRows: jest.fn(async () => []),
  getProductValidationResponseRow: jest.fn(async () => null),
  buildProductValidationSummaryFromDb: jest.fn(async () => ({
    totalResponses: 0,
    averageForkTestFitScore: null,
    averagePreviousPainScore: null,
    averageImprovementScore: null,
    averageEaseScore: null,
    averageTrustScore: null,
    averageRetentionScore: null,
    averagePayScore: null,
    averageReferralScore: null,
    averagePositioningClarityScore: null,
    priceBucketCounts: {},
    mayContactCount: 0,
    mayQuoteAnonymizedCount: 0,
    mayQuoteWithNameCount: 0,
  })),
}))

import { auth } from '@/features/auth/auth'
import { getAuthCtx } from '@/features/auth/server/context'
import { seedAuthCtx } from '@/features/auth/__tests__/helpers'
import { POST, GET } from '@/features/product-validation/api/routes/responses'
import { GET as GETSummary } from '@/features/product-validation/api/routes/summary'
import type { CreateProductValidationInput } from '@/features/product-validation/types'

const mockAuth = auth as jest.Mock
const mockGetAuthCtx = getAuthCtx as jest.Mock

function validBody(overrides: Partial<CreateProductValidationInput> = {}) {
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
    reasonableMonthlyPriceBucket: '15' as const,
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
    ...overrides,
  } as CreateProductValidationInput
}

beforeEach(() => {
  mockGetAuthCtx.mockResolvedValue(seedAuthCtx())
  mockAuth.mockResolvedValue({ user: { id: 'test-user', email: 'parent@example.com' } })
})

describe('POST /api/product-validation/responses', () => {
  test('returns 401 when not authenticated', async () => {
    mockGetAuthCtx.mockResolvedValue(null)
    const res = await POST(new Request('http://localhost/api/product-validation/responses', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(validBody()),
    }))
    expect(res.status).toBe(401)
  })

  test('returns 400 when required field missing', async () => {
    const body = validBody()
    const { respondentEmail, ...withoutEmail } = body as Record<string, unknown>
    const res = await POST(new Request('http://localhost/api/product-validation/responses', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(withoutEmail),
    }))
    expect(res.status).toBe(400)
  })

  test('returns 201 with valid body', async () => {
    const res = await POST(new Request('http://localhost/api/product-validation/responses', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(validBody()),
    }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('success')
  })
})

describe('GET /api/product-validation/responses', () => {
  test('returns list (empty from stub) when admin', async () => {
    process.env.ADMIN_EMAIL = 'admin@test.com'
    mockAuth.mockResolvedValue({ user: { id: 'admin', email: 'admin@test.com' } })
    const res = await GET(new Request('http://localhost/api/product-validation/responses'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(Array.isArray(body.data)).toBe(true)
  })
})

describe('GET /api/product-validation/summary', () => {
  test('returns summary shape', async () => {
    process.env.ADMIN_EMAIL = 'admin@test.com'
    mockAuth.mockResolvedValue({ user: { id: 'admin', email: 'admin@test.com' } })
    const res = await GETSummary(new Request('http://localhost/api/product-validation/summary'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveProperty('totalResponses')
  })
})
