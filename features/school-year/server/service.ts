import type { SchoolYear, DayOfWeek, SchoolBreak, SchoolYearProgress } from '@/features/school-year/types'
import { calculatePlannedDaysLocal } from '@/features/school-year/front/lib/calculateDays'

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
 * Uses schoolDays from the year if set, otherwise defaults to Mon–Fri.
 */
export function getSchoolYearProgress(schoolYearId: string): SchoolYearProgress | null {
  const year = schoolYearsStore.getById(schoolYearId)
  if (!year) return null

  const schoolDays = year.schoolDays ?? ['mon', 'tue', 'wed', 'thu', 'fri']
  const breaks = year.breaks ?? []

  const totalDays = calculatePlannedDaysLocal({
    startDate: year.startDate,
    endDate: year.endDate,
    schoolDays,
    breaks,
  })

  // Compute day number as of today
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
  // Approximate weekNumber as ceil of dayNumber / schoolDays.length per week
  // (uses 5-day week assumption for simplicity)
  const daysPerWeek = schoolDays.length || 5
  const weekNumber = Math.min(Math.ceil(dayNumber / daysPerWeek), totalWeeks)

  return { dayNumber, totalDays, weekNumber, totalWeeks }
}
import { schoolYearsStore } from './store'
import { SEED_SCHOOL_YEARS } from './seed'
import { generateSchoolYearId, resetIdCounter } from './ids'
import { getWorkspace } from '@/features/household/server/service'

export function getSchoolYears(): SchoolYear[] {
  return schoolYearsStore.getAll()
}

export function getActiveSchoolYear(): SchoolYear | null {
  return schoolYearsStore.getAll().find(y => y.isActive) ?? null
}

export function getSchoolYear(id: string): SchoolYear | null {
  return schoolYearsStore.getById(id) ?? null
}

export function createSchoolYear(
  data: { name: string; startDate: string; endDate: string; isActive?: boolean; requiredDays?: number; requiredHours?: number; trackingMethod?: SchoolYear['trackingMethod']; schoolDays?: SchoolYear['schoolDays']; breaks?: SchoolYear['breaks']; termStructure?: SchoolYear['termStructure'] }
): SchoolYear {
  if (!data.name?.trim()) {
    throw new Error('name is required')
  }
  if (data.startDate >= data.endDate) {
    throw new Error('endDate must be after startDate')
  }

  const workspace = getWorkspace()
  const workspaceId = workspace?.id ?? ''

  const isActive = data.isActive ?? false
  if (isActive) {
    for (const existing of [...schoolYearsStore.getAll()]) {
      if (existing.isActive) {
        schoolYearsStore.update(existing.id, { isActive: false })
      }
    }
  }

  const year: SchoolYear = {
    id: generateSchoolYearId(),
    workspaceId,
    name: data.name.trim(),
    startDate: data.startDate,
    endDate: data.endDate,
    isActive,
    createdAt: new Date().toISOString(),
    ...(data.requiredDays !== undefined && { requiredDays: data.requiredDays }),
    ...(data.requiredHours !== undefined && { requiredHours: data.requiredHours }),
    ...(data.trackingMethod !== undefined && { trackingMethod: data.trackingMethod }),
    ...(data.schoolDays !== undefined && { schoolDays: data.schoolDays }),
    ...(data.breaks !== undefined && { breaks: data.breaks }),
    ...(data.termStructure !== undefined && { termStructure: data.termStructure }),
  }
  return schoolYearsStore.insert(year)
}

export function updateSchoolYear(
  id: string,
  patch: Partial<Pick<SchoolYear, 'name' | 'startDate' | 'endDate' | 'isActive' | 'requiredDays' | 'requiredHours' | 'trackingMethod' | 'schoolDays' | 'breaks' | 'termStructure'>>
): SchoolYear | null {
  const existing = schoolYearsStore.getById(id)
  if (!existing) return null

  const startDate = patch.startDate ?? existing.startDate
  const endDate = patch.endDate ?? existing.endDate
  if (startDate >= endDate) {
    throw new Error('endDate must be after startDate')
  }

  const allowedPatch: Partial<SchoolYear> = {}
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

  return schoolYearsStore.update(id, allowedPatch)
}

export function activateSchoolYear(id: string): SchoolYear | null {
  const target = schoolYearsStore.getById(id)
  if (!target) return null

  // Deactivate all others
  schoolYearsStore.getAll().forEach(y => {
    if (y.id !== id && y.isActive) {
      schoolYearsStore.update(y.id, { isActive: false })
    }
  })

  return schoolYearsStore.update(id, { isActive: true })
}

export function resetStore(): void {
  schoolYearsStore.reset(SEED_SCHOOL_YEARS)
  resetIdCounter()
}

/** Seeds school years for tests that need to pre-populate store state. */
export function seedSchoolYears(years: SchoolYear[]): void {
  schoolYearsStore.reset(years)
}
