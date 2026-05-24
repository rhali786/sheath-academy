import type { DayOfWeek, SchoolBreak, SchoolYear, SchoolYearProgress } from '@/features/school-year/types'
import { calculatePlannedDaysLocal } from '@/features/school-year/front/lib/calculateDays'
import {
  activateSchoolYearRow,
  createSchoolYearRow,
  getActiveSchoolYearRow,
  getSchoolYearRow,
  listSchoolYearRows,
  mapSchoolYearRow,
  updateSchoolYearRow,
  type SchoolYearInput,
  type SchoolYearPatch,
} from './repository'

/**
 * Counts planned school days between startDate and endDate (inclusive),
 * excluding any days that fall within a break and any day not in schoolDays.
 */
export function calculatePlannedSchoolDays(params: {
  startDate: string
  endDate: string
  schoolDays: DayOfWeek[]
  breaks?: SchoolBreak[]
}): number {
  return calculatePlannedDaysLocal(params)
}

/**
 * Returns day/week progress for the given school year.
 * Uses schoolDays from the year if set, otherwise defaults to Mon-Fri.
 */
export async function getSchoolYearProgress(
  householdId: string,
  schoolYearId: string,
): Promise<SchoolYearProgress | null> {
  const year = await getSchoolYear(householdId, schoolYearId)
  if (!year) return null

  const schoolDays = year.schoolDays ?? ['mon', 'tue', 'wed', 'thu', 'fri']
  const breaks = year.breaks ?? []

  const totalDays = calculatePlannedDaysLocal({
    startDate: year.startDate,
    endDate: year.endDate,
    schoolDays,
    breaks,
  })

  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  let dayNumber = 0
  if (todayStr >= year.startDate) {
    const effectiveEnd = todayStr <= year.endDate ? todayStr : year.endDate
    dayNumber = calculatePlannedDaysLocal({
      startDate: year.startDate,
      endDate: effectiveEnd,
      schoolDays,
      breaks,
    })
  }

  const totalWeeks = Math.ceil(totalDays / schoolDays.length) || 0
  const daysPerWeek = schoolDays.length || 5
  const weekNumber = Math.min(Math.ceil(dayNumber / daysPerWeek), totalWeeks)

  return { dayNumber, totalDays, weekNumber, totalWeeks }
}

export async function getSchoolYears(householdId: string): Promise<SchoolYear[]> {
  const rows = await listSchoolYearRows(householdId)
  return rows.map(mapSchoolYearRow)
}

export async function getActiveSchoolYear(householdId: string): Promise<SchoolYear | null> {
  const row = await getActiveSchoolYearRow(householdId)
  return row ? mapSchoolYearRow(row) : null
}

export async function getSchoolYear(householdId: string, id: string): Promise<SchoolYear | null> {
  const row = await getSchoolYearRow(id, householdId)
  return row ? mapSchoolYearRow(row) : null
}

export async function createSchoolYear(
  householdId: string,
  data: SchoolYearInput,
): Promise<SchoolYear> {
  if (!data.name?.trim()) {
    throw new Error('name is required')
  }
  if (data.startDate >= data.endDate) {
    throw new Error('endDate must be after startDate')
  }

  const row = await createSchoolYearRow(householdId, {
    ...data,
    name: data.name.trim(),
    isActive: data.isActive ?? false,
  })
  return mapSchoolYearRow(row)
}

export async function updateSchoolYear(
  householdId: string,
  id: string,
  patch: SchoolYearPatch,
): Promise<SchoolYear | null> {
  const existing = await getSchoolYear(householdId, id)
  if (!existing) return null

  const startDate = patch.startDate ?? existing.startDate
  const endDate = patch.endDate ?? existing.endDate
  if (startDate >= endDate) {
    throw new Error('endDate must be after startDate')
  }

  const allowedPatch: SchoolYearPatch = {}
  if (patch.name !== undefined) allowedPatch.name = patch.name.trim()
  if (patch.startDate !== undefined) allowedPatch.startDate = patch.startDate
  if (patch.endDate !== undefined) allowedPatch.endDate = patch.endDate
  if (patch.isActive !== undefined) allowedPatch.isActive = patch.isActive
  if (patch.requiredDays !== undefined) allowedPatch.requiredDays = patch.requiredDays
  if (patch.requiredHours !== undefined) allowedPatch.requiredHours = patch.requiredHours
  if (patch.trackingMethod !== undefined) allowedPatch.trackingMethod = patch.trackingMethod
  if (patch.schoolDays !== undefined) allowedPatch.schoolDays = patch.schoolDays
  if (patch.breaks !== undefined) allowedPatch.breaks = patch.breaks
  if (patch.termStructure !== undefined) allowedPatch.termStructure = patch.termStructure

  const row = await updateSchoolYearRow(id, householdId, allowedPatch)
  return row ? mapSchoolYearRow(row) : null
}

export async function activateSchoolYear(
  householdId: string,
  id: string,
): Promise<SchoolYear | null> {
  const target = await getSchoolYear(householdId, id)
  if (!target) return null

  const row = await activateSchoolYearRow(id, householdId)
  return row ? mapSchoolYearRow(row) : null
}
