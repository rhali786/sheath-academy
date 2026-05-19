import type {
  Resource,
  ResourceType,
  VerificationStatus,
  PaceInput,
  PaceResult,
  GenerateLessonsInput,
  GeneratedLesson,
} from '@/features/resources/types'
import { resourcesStore } from './store'
import { generateResourceId } from './ids'

// ── Pacing ────────────────────────────────────────────────────────────────────

/**
 * Calculates reading pace for a resource.
 *
 * - If only `totalPages` + `scheduledDays` provided → returns `pagesPerDay`.
 * - If `completedPages` + `scheduledDaysRemaining` also provided → returns
 *   `pagesPerDayNeeded` and `isOnTrack` compared to original pace.
 */
export function calculatePace(input: PaceInput): PaceResult {
  const { totalPages, scheduledDays, completedPages, scheduledDaysRemaining } = input
  const result: PaceResult = {}

  if (scheduledDays && scheduledDays > 0) {
    result.pagesPerDay = totalPages / scheduledDays
  }

  if (completedPages !== undefined && scheduledDaysRemaining && scheduledDaysRemaining > 0) {
    const remaining = totalPages - completedPages
    result.pagesPerDayNeeded = remaining / scheduledDaysRemaining

    if (result.pagesPerDay !== undefined) {
      result.isOnTrack = result.pagesPerDayNeeded <= result.pagesPerDay
    }
  }

  return result
}

// ── Lesson generation ─────────────────────────────────────────────────────────

/**
 * Generates lesson stubs for a resource, distributed across school days.
 * Each lesson gets a `dueDate` by advancing through school days (Mon–Fri).
 */
export function generateLessons(input: GenerateLessonsInput): GeneratedLesson[] {
  const { resource, strategy, chapters, schoolDays, startDate } = input

  let count = 0
  switch (strategy) {
    case 'byChapter':
      count = chapters ?? resource.totalChapters ?? 0
      break
    case 'byLesson':
      count = resource.totalLessons ?? 0
      break
    case 'byPage':
      count = resource.totalPages ?? 0
      break
    default:
      count = chapters ?? resource.totalLessons ?? resource.totalPages ?? 0
  }

  if (count === 0) return []

  // Advance through weekdays starting from startDate
  const start = startDate ? new Date(startDate) : new Date()
  const lessons: GeneratedLesson[] = []

  // Pre-compute school day dates (skip weekends)
  const schoolDayDates: string[] = []
  const cursor = new Date(start)
  while (schoolDayDates.length < schoolDays) {
    const dow = cursor.getDay() // 0=Sun, 6=Sat
    if (dow !== 0 && dow !== 6) {
      schoolDayDates.push(
        `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`
      )
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  for (let i = 0; i < count; i++) {
    const dayIndex = i < schoolDayDates.length ? i : schoolDayDates.length - 1
    const dueDate = schoolDayDates[dayIndex]

    lessons.push({
      title: `${resource.title} — ${strategyLabel(strategy)} ${i + 1}`,
      dueDate,
      order: i + 1,
      description: `${resource.title} ${strategyLabel(strategy)} ${i + 1}`,
    })
  }

  return lessons
}

function strategyLabel(strategy: GenerateLessonsInput['strategy']): string {
  switch (strategy) {
    case 'byChapter': return 'Chapter'
    case 'byLesson':  return 'Lesson'
    case 'byPage':    return 'Page'
    case 'bySurah':   return 'Surah'
    case 'byModule':  return 'Module'
  }
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

export function createResource(data: {
  workspaceId: string
  title: string
  resourceType: ResourceType
  publisher?: string
  author?: string
  edition?: string
  gradeLevel?: string
  subjectCategory?: string
  isbn?: string
  totalPages?: number
  totalLessons?: number
  totalChapters?: number
}): Resource {
  const now = new Date().toISOString()
  const resource: Resource = {
    id: generateResourceId(),
    verificationStatus: 'user-submitted',
    createdAt: now,
    updatedAt: now,
    ...data,
  }
  return resourcesStore.insert(resource)
}

export function getResource(id: string): Resource | undefined {
  return resourcesStore.getById(id)
}

export function listResources(workspaceId?: string): Resource[] {
  const all = resourcesStore.getAll()
  if (!workspaceId) return all
  return all.filter(r => r.workspaceId === workspaceId)
}

export function updateVerificationStatus(
  id: string,
  status: VerificationStatus,
): Resource | null {
  return resourcesStore.update(id, { verificationStatus: status, updatedAt: new Date().toISOString() })
}
