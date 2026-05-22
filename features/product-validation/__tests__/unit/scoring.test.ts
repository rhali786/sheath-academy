import {
  calculateForkTestFitScore,
  buildProductValidationSummary,
} from '@/features/product-validation/server/scoring'
import type { ProductValidationResponse } from '@/features/product-validation/types'

describe('calculateForkTestFitScore', () => {
  it('returns weighted score rounded to 2 decimals for all fives', () => {
    expect(
      calculateForkTestFitScore({
        previousPainScore: 5,
        improvementScore: 5,
        easeScore: 5,
        trustScore: 5,
        retentionScore: 5,
        payScore: 5,
        referralScore: 5,
        positioningClarityScore: 5,
      }),
    ).toBe(5)
  })

  it('matches plan weights for a mixed sample', () => {
    const score = calculateForkTestFitScore({
      previousPainScore: 4,
      improvementScore: 5,
      easeScore: 3,
      trustScore: 4,
      retentionScore: 5,
      payScore: 2,
      referralScore: 4,
      positioningClarityScore: 3,
    })
    expect(score).toBe(4)
  })
})

describe('buildProductValidationSummary', () => {
  function row(
    overrides: Partial<ProductValidationResponse> = {},
  ): ProductValidationResponse {
    return {
      id: 'pvr_1',
      userId: 'u1',
      respondentEmail: 'a@b.com',
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
      replacedWhat: 'x',
      mostUseful: 'y',
      confusingOrBurdensome: 'z',
      mustHaveChange: 'a',
      lostAccessReaction: 'b',
      recommendTo: 'c',
      referralMessage: 'd',
      mayContact: true,
      mayQuoteAnonymized: true,
      mayQuoteWithName: false,
      forkTestFitScore: 4,
      createdAt: '2026-05-22T12:00:00.000Z',
      updatedAt: '2026-05-22T12:00:00.000Z',
      ...overrides,
    }
  }

  it('returns empty aggregates when there are no responses', () => {
    const summary = buildProductValidationSummary([])
    expect(summary.totalResponses).toBe(0)
    expect(summary.averageForkTestFitScore).toBeNull()
    expect(summary.mayContactCount).toBe(0)
    expect(summary.priceBucketCounts['15']).toBe(0)
  })

  it('calculates averages counts and price distribution', () => {
    const summary = buildProductValidationSummary([
      row({ reasonableMonthlyPriceBucket: '15', mayContact: true, mayQuoteWithName: false }),
      row({
        id: 'pvr_2',
        reasonableMonthlyPriceBucket: '30',
        previousPainScore: 2,
        improvementScore: 2,
        easeScore: 2,
        trustScore: 2,
        retentionScore: 2,
        payScore: 2,
        referralScore: 2,
        positioningClarityScore: 2,
        forkTestFitScore: 2,
        mayContact: false,
        mayQuoteAnonymized: false,
        mayQuoteWithName: true,
      }),
    ])
    expect(summary.totalResponses).toBe(2)
    expect(summary.averagePreviousPainScore).toBe(3)
    expect(summary.priceBucketCounts['15']).toBe(1)
    expect(summary.priceBucketCounts['30']).toBe(1)
    expect(summary.mayContactCount).toBe(1)
    expect(summary.mayQuoteAnonymizedCount).toBe(1)
    expect(summary.mayQuoteWithNameCount).toBe(1)
  })
})
