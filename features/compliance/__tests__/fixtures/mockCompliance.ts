import type {
  ComplianceRuleset,
  ComplianceDeadline,
  ComplianceSubmission,
  StatusEngineResult,
  SchoolYearConfig,
  AttendanceSummary,
} from '@/features/compliance/types'
import { SEED_IDS } from '@/features/lib/seedIds'

export const mockRuleset: ComplianceRuleset = {
  id: 'ruleset_fix_tx_001',
  state: 'TX',
  pathwayKey: 'independent',
  requirementType: 'attendance_days',
  value: 180,
  unit: 'days',
  sourceUrl: 'https://tea.texas.gov/academics/special-student-populations/home-school',
  lastVerifiedAt: '2026-01-15',
  isVerified: true,
}

export const mockSchoolYearConfig: SchoolYearConfig = {
  id: SEED_IDS.schoolYear,
  householdId: SEED_IDS.household,
  requiredDays: 180,
  requiredHours: null,
  startDate: '2025-09-01',
  endDate: '2026-06-15',
}

export const mockAttendanceSummary: AttendanceSummary = {
  daysPresent: 142,
  totalMinutes: 71000,
  rangeStart: '2025-09-01',
  rangeEnd: '2026-06-15',
}

// Illustrative status result (Layer 1 — from fixture data only)
export const mockStatusResult: StatusEngineResult = {
  status: 'yellow',
  reasons: [
    '142 of 180 days present — 38 more needed',
    'TX – independent pathway (verified 2026-01-15)',
  ],
  nextActions: [
    'Record 38 more school days to reach your requirement',
  ],
  missingData: [],
  checks: [
    { label: '142 / 180 days logged', met: false },
    { label: 'All required subjects covered', met: true },
    { label: 'Portfolio evidence on file', met: true },
  ],
  isSelfReported: false,
  belowLegalFloorWarning: null,
  provenance: 'TX – independent pathway (verified 2026-01-15)',
}

export const mockDeadlines: ComplianceDeadline[] = [
  {
    id: 'deadline_fix_001',
    householdId: SEED_IDS.household,
    schoolYearId: SEED_IDS.schoolYear,
    label: 'Annual Assessment Submission',
    dueDate: '2026-06-30',
    isCompleted: false,
    requirementType: 'annual_assessment',
  },
  {
    id: 'deadline_fix_002',
    householdId: SEED_IDS.household,
    schoolYearId: SEED_IDS.schoolYear,
    label: 'Declaration of Intent',
    dueDate: '2026-09-01',
    isCompleted: true,
    requirementType: 'declaration_of_intent',
  },
]

export const mockSubmissions: ComplianceSubmission[] = [
  {
    id: 'sub_fix_001',
    householdId: SEED_IDS.household,
    schoolYearId: SEED_IDS.schoolYear,
    status: 'accepted',
    submittedAt: '2025-09-15T09:00:00Z',
    acceptedAt: '2025-09-20T14:00:00Z',
    snapshotJson: { state: 'TX', pathway: 'independent', daysRequired: 180 },
  },
]
