import { and, eq, gte, lte } from 'drizzle-orm'
import { getDb } from '@/features/lib/server/db'
import {
  attendanceEvents,
  schoolYears,
  complianceRulesets,
  householdComplianceConfig,
  complianceOverrides,
  complianceDeadlines,
  complianceSubmissions,
} from '@/db/schema'
import type {
  StatusEngineInput,
  ComplianceRuleset,
  ComplianceDeadline,
  ComplianceOverride,
  ComplianceSubmission,
  SubmissionStatus,
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
 * Returns active ruleset for the household by joining household_compliance_config
 * → compliance_rulesets. Returns null if no config row exists.
 */
export async function getActiveRuleset(
  householdId: string,
): Promise<ComplianceRuleset | null> {
  const db = getDb()
  const rows = await db
    .select()
    .from(complianceRulesets)
    .innerJoin(
      householdComplianceConfig,
      eq(householdComplianceConfig.activeRulesetId, complianceRulesets.id),
    )
    .where(eq(householdComplianceConfig.householdId, householdId))
    .limit(1)

  if (rows.length === 0) return null

  const row = rows[0].compliance_rulesets
  return {
    id: row.id,
    state: row.state,
    pathwayKey: row.pathwayKey,
    requirementType: row.requirementType,
    value: row.value != null ? Number(row.value) : null,
    unit: row.unit,
    sourceUrl: row.sourceUrl ?? null,
    lastVerifiedAt: row.lastVerifiedAt != null ? row.lastVerifiedAt.toISOString() : null,
    isVerified: row.isVerified,
  }
}

/**
 * Returns compliance deadlines for the household + school year.
 */
export async function listDeadlines(
  householdId: string,
  schoolYearId: string,
): Promise<ComplianceDeadline[]> {
  const db = getDb()
  const rows = await db
    .select()
    .from(complianceDeadlines)
    .where(
      and(
        eq(complianceDeadlines.householdId, householdId),
        eq(complianceDeadlines.schoolYearId, schoolYearId),
      ),
    )

  return rows.map(row => ({
    id: row.id,
    householdId: row.householdId,
    schoolYearId: row.schoolYearId,
    label: row.label,
    dueDate: row.dueDate,
    isCompleted: row.isCompleted,
    requirementType: row.requirementType,
  }))
}

/**
 * Returns submission tracker entries for the household + school year.
 */
export async function listSubmissions(
  householdId: string,
  schoolYearId: string,
): Promise<ComplianceSubmission[]> {
  const db = getDb()
  const rows = await db
    .select()
    .from(complianceSubmissions)
    .where(
      and(
        eq(complianceSubmissions.householdId, householdId),
        eq(complianceSubmissions.schoolYearId, schoolYearId),
      ),
    )

  return rows.map(row => ({
    id: row.id,
    householdId: row.householdId,
    schoolYearId: row.schoolYearId,
    status: row.status as SubmissionStatus,
    submittedAt: row.submittedAt != null ? row.submittedAt.toISOString() : null,
    acceptedAt: row.acceptedAt != null ? row.acceptedAt.toISOString() : null,
    snapshotJson: (row.snapshotJson as Record<string, unknown> | null) ?? null,
  }))
}

/**
 * Creates a new compliance deadline for the household + school year.
 */
export async function createDeadline(
  householdId: string,
  input: {
    schoolYearId: string
    label: string
    dueDate: string
    requirementType: string
  },
): Promise<ComplianceDeadline> {
  const db = getDb()
  const now = new Date()
  const id = `deadline_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

  await db.insert(complianceDeadlines).values({
    id,
    householdId,
    schoolYearId: input.schoolYearId,
    label: input.label,
    dueDate: input.dueDate,
    isCompleted: false,
    requirementType: input.requirementType,
    createdAt: now,
    updatedAt: now,
  })

  return {
    id,
    householdId,
    schoolYearId: input.schoolYearId,
    label: input.label,
    dueDate: input.dueDate,
    isCompleted: false,
    requirementType: input.requirementType,
  }
}

/**
 * Marks a compliance deadline as completed.
 * Thin wrapper over updateDeadline — kept for callers that only toggle completion.
 */
export async function markDeadlineComplete(
  id: string,
  householdId: string,
): Promise<void> {
  await updateDeadline(id, householdId, { isCompleted: true })
}

/**
 * Patches a compliance deadline (label/dueDate/requirementType and/or completion),
 * scoped to the owning household. Returns the updated row, or null when none matched.
 */
export async function updateDeadline(
  id: string,
  householdId: string,
  patch: {
    label?: string
    dueDate?: string
    requirementType?: string
    isCompleted?: boolean
  },
): Promise<ComplianceDeadline | null> {
  const db = getDb()
  const updates: Record<string, unknown> = { updatedAt: new Date() }
  if (patch.label !== undefined) updates.label = patch.label
  if (patch.dueDate !== undefined) updates.dueDate = patch.dueDate
  if (patch.requirementType !== undefined) updates.requirementType = patch.requirementType
  if (patch.isCompleted !== undefined) updates.isCompleted = patch.isCompleted

  const [row] = await db
    .update(complianceDeadlines)
    .set(updates)
    .where(and(eq(complianceDeadlines.id, id), eq(complianceDeadlines.householdId, householdId)))
    .returning()

  if (!row) return null
  return {
    id: row.id,
    householdId: row.householdId,
    schoolYearId: row.schoolYearId,
    label: row.label,
    dueDate: row.dueDate,
    isCompleted: row.isCompleted,
    requirementType: row.requirementType,
  }
}

/**
 * Hard-delete a compliance deadline scoped to the household. Returns true when removed.
 */
export async function deleteDeadline(id: string, householdId: string): Promise<boolean> {
  const db = getDb()
  const removed = await db
    .delete(complianceDeadlines)
    .where(and(eq(complianceDeadlines.id, id), eq(complianceDeadlines.householdId, householdId)))
    .returning({ id: complianceDeadlines.id })
  return removed.length > 0
}

/**
 * Creates a new compliance submission entry.
 */
export async function createSubmission(
  householdId: string,
  input: {
    schoolYearId: string
    status?: SubmissionStatus
  },
): Promise<ComplianceSubmission> {
  const db = getDb()
  const now = new Date()
  const id = `submission_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  const status: SubmissionStatus = input.status ?? 'drafted'

  await db.insert(complianceSubmissions).values({
    id,
    householdId,
    schoolYearId: input.schoolYearId,
    status,
    submittedAt: null,
    acceptedAt: null,
    snapshotJson: null,
    createdAt: now,
    updatedAt: now,
  })

  return {
    id,
    householdId,
    schoolYearId: input.schoolYearId,
    status,
    submittedAt: null,
    acceptedAt: null,
    snapshotJson: null,
  }
}

/**
 * Updates the status (and optional timestamps/snapshot) of an existing submission.
 */
export async function updateSubmissionStatus(
  id: string,
  householdId: string,
  status: SubmissionStatus,
  extra?: {
    submittedAt?: Date | null
    acceptedAt?: Date | null
    snapshotJson?: Record<string, unknown> | null
  },
): Promise<ComplianceSubmission | null> {
  const db = getDb()
  const now = new Date()

  const patch: Record<string, unknown> = { status, updatedAt: now }
  if (extra?.submittedAt !== undefined) patch.submittedAt = extra.submittedAt
  if (extra?.acceptedAt !== undefined) patch.acceptedAt = extra.acceptedAt
  if (extra?.snapshotJson !== undefined) patch.snapshotJson = extra.snapshotJson

  await db
    .update(complianceSubmissions)
    .set(patch)
    .where(and(eq(complianceSubmissions.id, id), eq(complianceSubmissions.householdId, householdId)))

  const rows = await db
    .select()
    .from(complianceSubmissions)
    .where(and(eq(complianceSubmissions.id, id), eq(complianceSubmissions.householdId, householdId)))
    .limit(1)

  if (rows.length === 0) return null
  const row = rows[0]
  return {
    id: row.id,
    householdId: row.householdId,
    schoolYearId: row.schoolYearId,
    status: row.status as SubmissionStatus,
    submittedAt: row.submittedAt != null ? row.submittedAt.toISOString() : null,
    acceptedAt: row.acceptedAt != null ? row.acceptedAt.toISOString() : null,
    snapshotJson: (row.snapshotJson as Record<string, unknown> | null) ?? null,
  }
}

/**
 * Hard-delete a compliance submission scoped to the household. Returns true when removed.
 */
export async function deleteSubmission(id: string, householdId: string): Promise<boolean> {
  const db = getDb()
  const removed = await db
    .delete(complianceSubmissions)
    .where(and(eq(complianceSubmissions.id, id), eq(complianceSubmissions.householdId, householdId)))
    .returning({ id: complianceSubmissions.id })
  return removed.length > 0
}

/**
 * Lists all platform compliance rulesets (reference rows, no householdId) so the
 * config picker has a source of selectable rulesets.
 */
export async function listRulesets(): Promise<ComplianceRuleset[]> {
  const db = getDb()
  const rows = await db.select().from(complianceRulesets)
  return rows.map(row => ({
    id: row.id,
    state: row.state,
    pathwayKey: row.pathwayKey,
    requirementType: row.requirementType,
    value: row.value != null ? Number(row.value) : null,
    unit: row.unit,
    sourceUrl: row.sourceUrl ?? null,
    lastVerifiedAt: row.lastVerifiedAt != null ? row.lastVerifiedAt.toISOString() : null,
    isVerified: row.isVerified,
  }))
}

/**
 * Upserts the household compliance config (activeRulesetId + pathwayKey).
 */
export async function setHouseholdComplianceConfig(
  householdId: string,
  input: { activeRulesetId?: string | null; pathwayKey?: string | null },
): Promise<void> {
  const db = getDb()
  const now = new Date()

  await db
    .insert(householdComplianceConfig)
    .values({
      householdId,
      activeRulesetId: input.activeRulesetId ?? null,
      pathwayKey: input.pathwayKey ?? null,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: householdComplianceConfig.householdId,
      set: {
        activeRulesetId: input.activeRulesetId ?? null,
        pathwayKey: input.pathwayKey ?? null,
        updatedAt: now,
      },
    })
}

/**
 * Assembles StatusEngineInput from existing tables.
 * Now includes real ruleset and overrides from compliance tables.
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

  const ruleset = await getActiveRuleset(householdId)

  const overrideRows = await getDb()
    .select()
    .from(complianceOverrides)
    .where(
      and(
        eq(complianceOverrides.householdId, householdId),
        eq(complianceOverrides.schoolYearId, schoolYearId),
      ),
    )

  const overrides: ComplianceOverride[] = overrideRows.map(row => ({
    id: row.id,
    householdId: row.householdId,
    schoolYearId: row.schoolYearId,
    requirementType: row.requirementType,
    overrideValue: Number(row.overrideValue),
    reason: row.reason ?? undefined,
    appliedAt: row.appliedAt.toISOString(),
  }))

  return {
    ruleset,
    overrides,
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
