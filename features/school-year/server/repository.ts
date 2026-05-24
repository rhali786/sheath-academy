import { and, eq } from 'drizzle-orm'
import { schoolYears } from '@/db/schema'
import { getDb } from '@/features/lib/server/db'
import type { DayOfWeek, SchoolBreak, SchoolYear, TermStructure, TrackingMethod } from '../types'

export type SchoolYearRow = typeof schoolYears.$inferSelect

export interface SchoolYearInput {
  name: string
  startDate: string
  endDate: string
  isActive?: boolean
  requiredDays?: number
  requiredHours?: number
  trackingMethod?: TrackingMethod
  schoolDays?: DayOfWeek[]
  breaks?: SchoolBreak[]
  termStructure?: TermStructure
}

export type SchoolYearPatch = Partial<SchoolYearInput>

export function mapSchoolYearRow(row: SchoolYearRow): SchoolYear {
  return {
    id: row.id,
    workspaceId: row.householdId,
    name: row.name,
    startDate: row.startDate,
    endDate: row.endDate,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    ...(row.requiredDays !== null && { requiredDays: row.requiredDays }),
    ...(row.requiredHours !== null && { requiredHours: row.requiredHours }),
    ...(row.trackingMethod !== null && { trackingMethod: row.trackingMethod as TrackingMethod }),
    ...(row.schoolDays !== null && { schoolDays: row.schoolDays as DayOfWeek[] }),
    ...(row.breaks !== null && { breaks: row.breaks as SchoolBreak[] }),
    ...(row.termStructure !== null && { termStructure: row.termStructure as TermStructure }),
  }
}

export async function listSchoolYearRows(householdId: string): Promise<SchoolYearRow[]> {
  const db = getDb()
  return db.select().from(schoolYears).where(eq(schoolYears.householdId, householdId))
}

export async function getActiveSchoolYearRow(householdId: string): Promise<SchoolYearRow | null> {
  const db = getDb()
  const rows = await db
    .select()
    .from(schoolYears)
    .where(and(eq(schoolYears.householdId, householdId), eq(schoolYears.isActive, true)))
    .limit(1)
  return rows[0] ?? null
}

export async function getSchoolYearRow(id: string, householdId: string): Promise<SchoolYearRow | null> {
  const db = getDb()
  const rows = await db
    .select()
    .from(schoolYears)
    .where(and(eq(schoolYears.id, id), eq(schoolYears.householdId, householdId)))
    .limit(1)
  return rows[0] ?? null
}

export async function createSchoolYearRow(
  householdId: string,
  input: SchoolYearInput,
): Promise<SchoolYearRow> {
  const db = getDb()
  const now = new Date()
  const isActive = input.isActive ?? false

  if (isActive) {
    await db
      .update(schoolYears)
      .set({ isActive: false, updatedAt: now })
      .where(and(eq(schoolYears.householdId, householdId), eq(schoolYears.isActive, true)))
  }

  const rows = await db
    .insert(schoolYears)
    .values({
      id: `schoolyear_${Date.now()}`,
      householdId,
      name: input.name,
      startDate: input.startDate,
      endDate: input.endDate,
      isActive,
      requiredDays: input.requiredDays ?? null,
      requiredHours: input.requiredHours ?? null,
      trackingMethod: input.trackingMethod ?? null,
      schoolDays: input.schoolDays ?? null,
      breaks: input.breaks ?? null,
      termStructure: input.termStructure ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning()

  return rows[0]
}

export async function updateSchoolYearRow(
  id: string,
  householdId: string,
  patch: SchoolYearPatch,
): Promise<SchoolYearRow | null> {
  const db = getDb()
  const update: Partial<SchoolYearRow> = { updatedAt: new Date() }

  if (patch.name !== undefined) update.name = patch.name
  if (patch.startDate !== undefined) update.startDate = patch.startDate
  if (patch.endDate !== undefined) update.endDate = patch.endDate
  if (patch.isActive !== undefined) update.isActive = patch.isActive
  if (patch.requiredDays !== undefined) update.requiredDays = patch.requiredDays
  if (patch.requiredHours !== undefined) update.requiredHours = patch.requiredHours
  if (patch.trackingMethod !== undefined) update.trackingMethod = patch.trackingMethod
  if (patch.schoolDays !== undefined) update.schoolDays = patch.schoolDays
  if (patch.breaks !== undefined) update.breaks = patch.breaks
  if (patch.termStructure !== undefined) update.termStructure = patch.termStructure

  if (patch.isActive === true) {
    await db
      .update(schoolYears)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(schoolYears.householdId, householdId), eq(schoolYears.isActive, true)))
  }

  const rows = await db
    .update(schoolYears)
    .set(update)
    .where(and(eq(schoolYears.id, id), eq(schoolYears.householdId, householdId)))
    .returning()
  return rows[0] ?? null
}

export async function activateSchoolYearRow(
  id: string,
  householdId: string,
): Promise<SchoolYearRow | null> {
  return updateSchoolYearRow(id, householdId, { isActive: true })
}
