import type { SchoolYear } from '@/features/school-year/types'
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
  data: { name: string; startDate: string; endDate: string; isActive?: boolean }
): SchoolYear {
  if (!data.name?.trim()) {
    throw new Error('name is required')
  }
  if (data.startDate >= data.endDate) {
    throw new Error('endDate must be after startDate')
  }

  const workspace = getWorkspace()
  const workspaceId = workspace?.id ?? ''

  const year: SchoolYear = {
    id: generateSchoolYearId(),
    workspaceId,
    name: data.name.trim(),
    startDate: data.startDate,
    endDate: data.endDate,
    isActive: data.isActive ?? false,
    createdAt: new Date().toISOString(),
  }
  return schoolYearsStore.insert(year)
}

export function updateSchoolYear(
  id: string,
  patch: Partial<Pick<SchoolYear, 'name' | 'startDate' | 'endDate' | 'isActive'>>
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
