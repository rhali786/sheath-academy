import { seedAuthCtx } from '@/features/auth/__tests__/helpers'
import {
  createProductValidationResponse,
  getProductValidationSummary,
  ProductValidationValidationError,
} from '@/features/product-validation/server/service'
import { resetProductValidationStore } from '@/features/product-validation/server/store'
import { resetProductValidationIdCounter } from '@/features/product-validation/server/ids'
import type { CreateProductValidationInput } from '@/features/product-validation/types'

function validInput(): CreateProductValidationInput {
  return {
    respondentEmail: 'parent@example.com',
    respondentType: 'homeschool_family',
    usageDuration: 'one_week',
    usedFeatureAreas: ['dashboard', 'attendance'],
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
    lostAccessReaction: 'Revert',
    recommendTo: 'Friends',
    referralMessage: 'Use this',
    mayContact: true,
    mayQuoteAnonymized: true,
    mayQuoteWithName: false,
  }
}

describe('product-validation service', () => {
  beforeEach(() => {
    resetProductValidationStore()
    resetProductValidationIdCounter()
  })

  test('creates response with server-computed forkTestFitScore', () => {
    const record = createProductValidationResponse(
      seedAuthCtx(),
      validInput(),
      'session@example.com',
    )
    expect(record.id).toMatch(/^pvr_/)
    expect(record.forkTestFitScore).toBe(4)
    expect(record.respondentEmail).toBe('session@example.com')
    expect(record.householdId).toBe(seedAuthCtx().householdId)
  })

  test('allows multiple responses per user', () => {
    const ctx = seedAuthCtx()
    createProductValidationResponse(ctx, validInput(), 'a@b.com')
    createProductValidationResponse(ctx, validInput(), 'a@b.com')
    expect(getProductValidationSummary().totalResponses).toBe(2)
  })

  test('throws validation error for invalid input', () => {
    expect(() =>
      createProductValidationResponse(
        seedAuthCtx(),
        { ...validInput(), payScore: 0 },
        'a@b.com',
      ),
    ).toThrow(ProductValidationValidationError)
  })
})
