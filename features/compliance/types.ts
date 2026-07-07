export type ComplianceStatus = 'green' | 'yellow' | 'red'
export type RulesetVerification = 'verified' | 'unverified' | 'unknown'
export type PathwayKey = 'umbrella' | 'independent' | 'church' | 'state' | string

export interface ComplianceRuleset {
  id: string
  state: string
  pathwayKey: PathwayKey
  requirementType: string
  value: number | null
  unit: 'days' | 'hours' | string
  sourceUrl: string | null
  lastVerifiedAt: string | null
  isVerified: boolean
}

export interface ComplianceOverride {
  id: string
  householdId: string
  schoolYearId: string
  requirementType: string
  overrideValue: number
  reason?: string
  appliedAt: string
}

export interface SchoolYearConfig {
  id: string
  householdId: string
  requiredDays: number | null
  requiredHours: number | null
  startDate: string
  endDate: string
}

export interface AttendanceSummary {
  daysPresent: number
  totalMinutes: number
  rangeStart: string
  rangeEnd: string
}

export interface SubjectCoverage {
  subjectId: string
  label: string
  lessonsCompleted: number
  lessonsPlanned: number
}

export interface ArtifactFlags {
  hasAnnualAssessment: boolean
  hasPortfolioEvidence: boolean
  hasNotarizedDeclaration: boolean
}

export interface StatusEngineInput {
  ruleset: ComplianceRuleset | null
  overrides: ComplianceOverride[]
  schoolYearConfig: SchoolYearConfig
  attendanceSummary: AttendanceSummary
  subjectCoverage: SubjectCoverage[]
  artifactFlags: ArtifactFlags
}

export interface StatusEngineResult {
  status: ComplianceStatus
  reasons: string[]
  nextActions: string[]
  missingData: string[]
  /** When ruleset is unverified/null, verdict is self-reported */
  isSelfReported: boolean
  /** When household target < legal floor */
  belowLegalFloorWarning: string | null
  provenance: string | null
}

// ─── Deadline ─────────────────────────────────────────────────────────────────

export interface ComplianceDeadline {
  id: string
  householdId: string
  schoolYearId: string
  label: string
  dueDate: string
  isCompleted: boolean
  requirementType: string
}

// ─── Submission tracker ───────────────────────────────────────────────────────

export type SubmissionStatus = 'drafted' | 'sent' | 'accepted'

export interface ComplianceSubmission {
  id: string
  householdId: string
  schoolYearId: string
  status: SubmissionStatus
  submittedAt: string | null
  acceptedAt: string | null
  snapshotJson: Record<string, unknown> | null
}
