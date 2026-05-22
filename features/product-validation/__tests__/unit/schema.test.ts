import { validateCreateProductValidationInput } from '@/features/product-validation/server/schema'
import type { CreateProductValidationInput } from '@/features/product-validation/types'

function validInput(
  overrides: Partial<CreateProductValidationInput> = {},
): CreateProductValidationInput {
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
    ...overrides,
  }
}

describe('validateCreateProductValidationInput', () => {
  it('accepts valid input', () => {
    expect(validateCreateProductValidationInput(validInput())).toHaveLength(0)
  })

  it('rejects score below 1', () => {
    const errors = validateCreateProductValidationInput(
      validInput({ previousPainScore: 0 }),
    )
    expect(errors.some(e => e.field === 'previousPainScore')).toBe(true)
  })

  it('rejects score above 5', () => {
    const errors = validateCreateProductValidationInput(
      validInput({ easeScore: 6 }),
    )
    expect(errors.some(e => e.field === 'easeScore')).toBe(true)
  })

  it('rejects non-integer scores', () => {
    const errors = validateCreateProductValidationInput(
      validInput({ payScore: 3.5 }),
    )
    expect(errors.some(e => e.field === 'payScore')).toBe(true)
  })

  it('rejects invalid price bucket', () => {
    const errors = validateCreateProductValidationInput(
      validInput({ reasonableMonthlyPriceBucket: '99' as CreateProductValidationInput['reasonableMonthlyPriceBucket'] }),
    )
    expect(errors.some(e => e.field === 'reasonableMonthlyPriceBucket')).toBe(true)
  })

  it('rejects empty required open text after trim', () => {
    const errors = validateCreateProductValidationInput(
      validInput({ replacedWhat: '   ' }),
    )
    expect(errors.some(e => e.field === 'replacedWhat')).toBe(true)
  })

  it('rejects empty usedFeatureAreas', () => {
    const errors = validateCreateProductValidationInput(
      validInput({ usedFeatureAreas: [] }),
    )
    expect(errors.some(e => e.field === 'usedFeatureAreas')).toBe(true)
  })
})
