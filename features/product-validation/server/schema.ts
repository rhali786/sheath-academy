import type { CreateProductValidationInput, ValidationPriceBucket } from '../types'

export interface ValidationError {
  field: string
  message: string
}

const SCORE_FIELDS = [
  'previousPainScore',
  'improvementScore',
  'easeScore',
  'trustScore',
  'retentionScore',
  'payScore',
  'referralScore',
  'positioningClarityScore',
] as const

const REQUIRED_TEXT_FIELDS = [
  'replacedWhat',
  'mostUseful',
  'confusingOrBurdensome',
  'mustHaveChange',
  'lostAccessReaction',
  'recommendTo',
  'referralMessage',
] as const

const VALID_PRICE_BUCKETS: ValidationPriceBucket[] = [
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

const VALID_RESPONDENT_TYPES = [
  'homeschool_family',
  'tutor',
  'program_operator',
  'other',
] as const

const VALID_USAGE_DURATIONS = [
  'under_10_minutes',
  'one_session',
  'one_day',
  'one_week',
  'multiple_weeks',
] as const

const VALID_FEATURE_AREAS = [
  'dashboard',
  'attendance',
  'plan_lessons',
  'quran',
  'arabic',
  'islamic_studies',
  'portfolio',
  'records_reports',
  'alerts',
  'other',
] as const

function isValidScore(value: unknown): boolean {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 5
  )
}

export function validateCreateProductValidationInput(
  input: CreateProductValidationInput,
): ValidationError[] {
  const errors: ValidationError[] = []

  const email = (input.respondentEmail ?? '').trim()
  if (!email) {
    errors.push({ field: 'respondentEmail', message: 'Email is required' })
  }

  if (!VALID_RESPONDENT_TYPES.includes(input.respondentType)) {
    errors.push({ field: 'respondentType', message: 'Invalid respondent type' })
  }

  if (!VALID_USAGE_DURATIONS.includes(input.usageDuration)) {
    errors.push({ field: 'usageDuration', message: 'Invalid usage duration' })
  }

  if (!Array.isArray(input.usedFeatureAreas) || input.usedFeatureAreas.length === 0) {
    errors.push({
      field: 'usedFeatureAreas',
      message: 'Select at least one feature area',
    })
  } else {
    for (const area of input.usedFeatureAreas) {
      if (!VALID_FEATURE_AREAS.includes(area)) {
        errors.push({ field: 'usedFeatureAreas', message: `Invalid feature area: ${area}` })
        break
      }
    }
  }

  for (const field of SCORE_FIELDS) {
    if (!isValidScore(input[field])) {
      errors.push({ field, message: 'Score must be an integer from 1 to 5' })
    }
  }

  if (!VALID_PRICE_BUCKETS.includes(input.reasonableMonthlyPriceBucket)) {
    errors.push({
      field: 'reasonableMonthlyPriceBucket',
      message: 'Invalid price bucket',
    })
  }

  for (const field of REQUIRED_TEXT_FIELDS) {
    const value = (input[field] ?? '').trim()
    if (!value) {
      errors.push({ field, message: 'This field is required' })
    }
  }

  if (typeof input.mayContact !== 'boolean') {
    errors.push({ field: 'mayContact', message: 'Contact consent is required' })
  }
  if (typeof input.mayQuoteAnonymized !== 'boolean') {
    errors.push({
      field: 'mayQuoteAnonymized',
      message: 'Anonymized quote consent is required',
    })
  }
  if (typeof input.mayQuoteWithName !== 'boolean') {
    errors.push({
      field: 'mayQuoteWithName',
      message: 'Named quote consent is required',
    })
  }

  return errors
}
