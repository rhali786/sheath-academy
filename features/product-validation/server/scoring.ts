import type {
  ProductValidationResponse,
  ProductValidationSummary,
  ValidationPriceBucket,
} from '../types'

const PRICE_BUCKETS: ValidationPriceBucket[] = [
  '0',
  '5',
  '10',
  '15',
  '20',
  '30',
  '50',
  '75',
  '100_plus',
]

export interface ForkTestScoreInput {
  previousPainScore: number
  improvementScore: number
  easeScore: number
  trustScore: number
  retentionScore: number
  payScore: number
  referralScore: number
  positioningClarityScore: number
}

export function calculateForkTestFitScore(input: ForkTestScoreInput): number {
  const raw =
    input.previousPainScore * 0.15 +
    input.improvementScore * 0.2 +
    input.easeScore * 0.1 +
    input.trustScore * 0.15 +
    input.retentionScore * 0.15 +
    input.payScore * 0.1 +
    input.referralScore * 0.1 +
    input.positioningClarityScore * 0.05
  return Math.round(raw * 100) / 100
}

function average(values: number[]): number | null {
  if (values.length === 0) return null
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100
}

function emptyPriceBucketCounts(): Record<ValidationPriceBucket, number> {
  return Object.fromEntries(PRICE_BUCKETS.map(b => [b, 0])) as Record<
    ValidationPriceBucket,
    number
  >
}

export function buildProductValidationSummary(
  responses: ProductValidationResponse[],
): ProductValidationSummary {
  const priceBucketCounts = emptyPriceBucketCounts()

  let mayContactCount = 0
  let mayQuoteAnonymizedCount = 0
  let mayQuoteWithNameCount = 0

  for (const r of responses) {
    priceBucketCounts[r.reasonableMonthlyPriceBucket] += 1
    if (r.mayContact) mayContactCount += 1
    if (r.mayQuoteAnonymized) mayQuoteAnonymizedCount += 1
    if (r.mayQuoteWithName) mayQuoteWithNameCount += 1
  }

  return {
    totalResponses: responses.length,
    averageForkTestFitScore: average(responses.map(r => r.forkTestFitScore)),
    averagePreviousPainScore: average(responses.map(r => r.previousPainScore)),
    averageImprovementScore: average(responses.map(r => r.improvementScore)),
    averageEaseScore: average(responses.map(r => r.easeScore)),
    averageTrustScore: average(responses.map(r => r.trustScore)),
    averageRetentionScore: average(responses.map(r => r.retentionScore)),
    averagePayScore: average(responses.map(r => r.payScore)),
    averageReferralScore: average(responses.map(r => r.referralScore)),
    averagePositioningClarityScore: average(
      responses.map(r => r.positioningClarityScore),
    ),
    priceBucketCounts,
    mayContactCount,
    mayQuoteAnonymizedCount,
    mayQuoteWithNameCount,
  }
}
