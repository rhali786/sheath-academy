export type ValidationRespondentType =
  | 'homeschool_family'
  | 'tutor'
  | 'program_operator'
  | 'other'

export type ValidationUsageDuration =
  | 'under_10_minutes'
  | 'one_session'
  | 'one_day'
  | 'one_week'
  | 'multiple_weeks'

export type ValidationPriceBucket =
  | '0'
  | '5'
  | '10'
  | '15'
  | '20'
  | '30'
  | '50'
  | '75'
  | '100_plus'

export type ValidationFeatureArea =
  | 'dashboard'
  | 'attendance'
  | 'plan_lessons'
  | 'quran'
  | 'arabic'
  | 'islamic_studies'
  | 'portfolio'
  | 'records_reports'
  | 'alerts'
  | 'other'

export interface ProductValidationResponse {
  id: string
  userId: string
  householdId?: string
  respondentName?: string
  respondentEmail: string
  respondentType: ValidationRespondentType
  householdOrProgramType?: string
  usageDuration: ValidationUsageDuration
  usedFeatureAreas: ValidationFeatureArea[]
  previousPainScore: number
  improvementScore: number
  easeScore: number
  trustScore: number
  retentionScore: number
  payScore: number
  referralScore: number
  positioningClarityScore: number
  reasonableMonthlyPriceBucket: ValidationPriceBucket
  pricingNotes?: string
  replacedWhat: string
  mostUseful: string
  confusingOrBurdensome: string
  mustHaveChange: string
  lostAccessReaction: string
  recommendTo: string
  referralMessage: string
  additionalNotes?: string
  mayContact: boolean
  mayQuoteAnonymized: boolean
  mayQuoteWithName: boolean
  forkTestFitScore: number
  createdAt: string
  updatedAt: string
}

/** Client/API payload before server attaches identity and computed score. */
export type CreateProductValidationInput = Omit<
  ProductValidationResponse,
  'id' | 'userId' | 'householdId' | 'forkTestFitScore' | 'createdAt' | 'updatedAt'
>

export interface ProductValidationSummary {
  totalResponses: number
  averageForkTestFitScore: number | null
  averagePreviousPainScore: number | null
  averageImprovementScore: number | null
  averageEaseScore: number | null
  averageTrustScore: number | null
  averageRetentionScore: number | null
  averagePayScore: number | null
  averageReferralScore: number | null
  averagePositioningClarityScore: number | null
  priceBucketCounts: Record<ValidationPriceBucket, number>
  mayContactCount: number
  mayQuoteAnonymizedCount: number
  mayQuoteWithNameCount: number
}
