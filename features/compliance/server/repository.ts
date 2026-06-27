import { and, eq, gte, lte } from 'drizzle-orm'
import { getDb } from '@/features/lib/server/db'
import { attendanceEvents, schoolYears } from '@/db/schema'
import type {
  StatusEngineInput,
  ComplianceRuleset,
  ComplianceDeadline,
  ComplianceSubmission,
  AttendanceSummary,
  SchoolYearConfig,
} from '@/features/compliance/types'

async function getSchoolYear(
  schoolYearId: string,
  householdId: string,
): Promise<SchoolYearConfig | null> {
  const db = getDb()
  const rows = await db
    .select()
    .from(schoolYears)
    .where(and(eq(schoolYears.id, schoolYearId), eq(schoolYears.householdId, householdId)))
  if (rows.length === 0) return null
  const row = rows[0]
  return {
    id: row.id,
    householdId: row.householdId,
    requiredDays: row.requiredDays ?? null,
    requiredHours: row.requiredHours ?? null,
    startDate: row.startDate,
    endDate: row.endDate,
  }
}

async function getAttendanceSummary(
  householdId: string,
  startDate: string,
  endDate: string,
): Promise<AttendanceSummary> {
  const db = getDb()
  const rows = await db
    .select()
    .from(attendanceEvents)
    .where(
      and(
        eq(attendanceEvents.householdId, householdId),
        gte(attendanceEvents.attendanceDate, startDate),
        lte(attendanceEvents.attendanceDate, endDate),
      ),
    )

  const present = rows.filter(r => r.status === 'present' && !r.voidedAt)
  const daysPresent = present.length
  const totalMinutes = present.reduce((sum, r) => sum + (r.minutes ?? 0), 0)

  return { daysPresent, totalMinutes, rangeStart: startDate, rangeEnd: endDate }
}

/**
 * Assembles StatusEngineInput from existing tables.
 * compliance_rulesets and overrides tables are created in Layer 3; returns null/[] until then.
 */
export async function getComplianceStatusInput(
  householdId: string,
  schoolYearId: string,
): Promise<StatusEngineInput> {
  const schoolYear = await getSchoolYear(schoolYearId, householdId)

  const config: SchoolYearConfig = schoolYear ?? {
    id: schoolYearId,
    householdId,
    requiredDays: null,
    requiredHours: null,
    startDate: '',
    endDate: '',
  }

  const attendance =
    config.startDate && config.endDate
      ? await getAttendanceSummary(householdId, config.startDate, config.endDate)
      : { daysPresent: 0, totalMinutes: 0, rangeStart: '', rangeEnd: '' }

  return {
    ruleset: null,
    overrides: [],
    schoolYearConfig: config,
    attendanceSummary: attendance,
    subjectCoverage: [],
    artifactFlags: {
      hasAnnualAssessment: false,
      hasPortfolioEvidence: false,
      hasNotarizedDeclaration: false,
    },
  }
}

/**
 * Returns active ruleset for the household.
 * compliance_rulesets table created in Layer 3; returns null until then.
 */
export async function getActiveRuleset(
  _householdId: string,
): Promise<ComplianceRuleset | null> {
  return null
}

/**
 * Returns compliance deadlines for the school year.
 * compliance_deadlines table created in Layer 3; returns [] until then.
 */
export async function listDeadlines(
  _householdId: string,
  _schoolYearId: string,
): Promise<ComplianceDeadline[]> {
  return []
}

/**
 * Returns submission tracker entries for the school year.
 * compliance_submissions table created in Layer 3; returns [] until then.
 */
export async function listSubmissions(
  _householdId: string,
  _schoolYearId: string,
): Promise<ComplianceSubmission[]> {
  return []
}
