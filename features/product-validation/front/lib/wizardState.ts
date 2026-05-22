import type {
  CreateProductValidationInput,
  ValidationFeatureArea,
  ValidationPriceBucket,
  ValidationRespondentType,
  ValidationUsageDuration,
} from '@/features/product-validation/types'

export const TOTAL_STEPS = 6

export const SECTION_LABELS = [
  'Context',
  'Previous pain',
  'Benefit & friction',
  'Trust & records',
  'Retention & price',
  'Positioning & consent',
] as const

export const FEATURE_AREA_OPTIONS: { value: ValidationFeatureArea; label: string }[] = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'attendance', label: 'Attendance' },
  { value: 'plan_lessons', label: 'Plan / Lessons' },
  { value: 'quran', label: 'Quran' },
  { value: 'arabic', label: 'Arabic' },
  { value: 'islamic_studies', label: 'Islamic Studies' },
  { value: 'portfolio', label: 'Portfolio' },
  { value: 'records_reports', label: 'Records / Reports' },
  { value: 'alerts', label: 'Alerts' },
  { value: 'other', label: 'Other' },
]

const SCORE_FIELDS = [
  'previousPainScore',
  'improvementScore',
  'easeScore',
  'trustScore',
  'retentionScore',
  'payScore',
  'referralScore',
  'positioningClarityScore',
  'reasonableMonthlyPriceBucket',
] as const

/** Wizard draft — scores nullable until each step is completed. */
export type WizardFormState = Omit<CreateProductValidationInput, (typeof SCORE_FIELDS)[number]> & {
  previousPainScore: number | null
  improvementScore: number | null
  easeScore: number | null
  trustScore: number | null
  retentionScore: number | null
  payScore: number | null
  referralScore: number | null
  positioningClarityScore: number | null
  reasonableMonthlyPriceBucket: ValidationPriceBucket | null
}

export function initialWizardState(email = ''): WizardFormState {
  return {
    respondentName: '',
    respondentEmail: email,
    respondentType: 'homeschool_family',
    householdOrProgramType: '',
    usageDuration: 'one_week',
    usedFeatureAreas: [],
    previousPainScore: null,
    improvementScore: null,
    easeScore: null,
    trustScore: null,
    retentionScore: null,
    payScore: null,
    referralScore: null,
    positioningClarityScore: null,
    reasonableMonthlyPriceBucket: '15',
    pricingNotes: '',
    replacedWhat: '',
    mostUseful: '',
    confusingOrBurdensome: '',
    mustHaveChange: '',
    lostAccessReaction: '',
    recommendTo: '',
    referralMessage: '',
    additionalNotes: '',
    mayContact: false,
    mayQuoteAnonymized: false,
    mayQuoteWithName: false,
  }
}

export function validateWizardStep(step: number, state: WizardFormState): string[] {
  const errors: string[] = []
  const trim = (s: string) => s.trim()

  if (step === 1) {
    if (!trim(state.respondentEmail)) errors.push('Email is required')
    if (!state.respondentType) errors.push('Respondent type is required')
    if (!state.usageDuration) errors.push('Usage duration is required')
    if (state.usedFeatureAreas.length === 0) errors.push('Select at least one area you used')
  }
  if (step === 2) {
    if (state.previousPainScore === null) errors.push('Pain score is required')
    if (!trim(state.replacedWhat)) errors.push('Please describe what Sheath Academy replaced')
  }
  if (step === 3) {
    if (state.improvementScore === null) errors.push('Improvement score is required')
    if (state.easeScore === null) errors.push('Ease score is required')
    if (!trim(state.mostUseful)) errors.push('Most useful part is required')
    if (!trim(state.confusingOrBurdensome)) errors.push('Confusing or burdensome part is required')
  }
  if (step === 4) {
    if (state.trustScore === null) errors.push('Trust score is required')
    if (!trim(state.mustHaveChange)) errors.push('Must-have change is required')
  }
  if (step === 5) {
    if (state.retentionScore === null) errors.push('Retention score is required')
    if (state.payScore === null) errors.push('Pay score is required')
    if (state.referralScore === null) errors.push('Referral score is required')
    if (!state.reasonableMonthlyPriceBucket) errors.push('Price range is required')
    if (!trim(state.lostAccessReaction)) errors.push('Lost-access reaction is required')
    if (!trim(state.recommendTo)) errors.push('Recommendation target is required')
    if (!trim(state.referralMessage)) errors.push('Referral message is required')
  }
  if (step === 6) {
    if (state.positioningClarityScore === null) errors.push('Positioning clarity score is required')
  }

  return errors
}

export function toCreateInput(state: WizardFormState): CreateProductValidationInput {
  return {
    respondentName: state.respondentName?.trim() || undefined,
    respondentEmail: state.respondentEmail.trim(),
    respondentType: state.respondentType as ValidationRespondentType,
    householdOrProgramType: state.householdOrProgramType?.trim() || undefined,
    usageDuration: state.usageDuration as ValidationUsageDuration,
    usedFeatureAreas: state.usedFeatureAreas,
    previousPainScore: state.previousPainScore!,
    improvementScore: state.improvementScore!,
    easeScore: state.easeScore!,
    trustScore: state.trustScore!,
    retentionScore: state.retentionScore!,
    payScore: state.payScore!,
    referralScore: state.referralScore!,
    positioningClarityScore: state.positioningClarityScore!,
    reasonableMonthlyPriceBucket: state.reasonableMonthlyPriceBucket!,
    pricingNotes: state.pricingNotes?.trim() || undefined,
    replacedWhat: state.replacedWhat.trim(),
    mostUseful: state.mostUseful.trim(),
    confusingOrBurdensome: state.confusingOrBurdensome.trim(),
    mustHaveChange: state.mustHaveChange.trim(),
    lostAccessReaction: state.lostAccessReaction.trim(),
    recommendTo: state.recommendTo.trim(),
    referralMessage: state.referralMessage.trim(),
    additionalNotes: state.additionalNotes?.trim() || undefined,
    mayContact: state.mayContact,
    mayQuoteAnonymized: state.mayQuoteAnonymized,
    mayQuoteWithName: state.mayQuoteWithName,
  }
}
