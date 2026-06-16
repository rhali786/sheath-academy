import type {
  Resource,
  ResourceType,
  VerificationStatus,
  PaceInput,
  PaceResult,
  GenerateLessonsInput,
  GeneratedLesson,
} from '@/features/resources/types'
import {
  createResourceRow,
  getResourceRow,
  listResourceRows,
  mapResourceRow,
  updateResourceVerificationRow,
  type CreateResourceInput,
} from './repository'

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
  const { resource, strategy, chapters, schoolDays, startDate, cadence, cadenceDays } = input

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

  const start = startDate ? parseLocalDate(startDate) : new Date()
  const lessons: GeneratedLesson[] = []
  const dueDates = computeDueDates(count, schoolDays, start, cadence, cadenceDays)

  for (let i = 0; i < count; i++) {
    const dueDate = dueDates[i]

    lessons.push({
      title: `${resource.title} — ${strategyLabel(strategy)} ${i + 1}`,
      dueDate,
      order: i + 1,
      description: `${resource.title} ${strategyLabel(strategy)} ${i + 1}`,
    })
  }

  return lessons
}

/**
 * Computes `count` due dates starting from `start`, according to `cadence`:
 * - 'weekly': steps 7 calendar days apart from `start`
 * - 'everyNDays': steps `cadenceDays` calendar days apart from `start`
 * - 'schoolDay' (default/undefined): steps through weekdays (Mon–Fri) only,
 *   distributed across `schoolDays`, repeating the last day if `count > schoolDays`
 */
function computeDueDates(
  count: number,
  schoolDays: number,
  start: Date,
  cadence: GenerateLessonsInput['cadence'],
  cadenceDays: GenerateLessonsInput['cadenceDays'],
): string[] {
  if (cadence === 'weekly' || cadence === 'everyNDays') {
    const stepDays = cadence === 'weekly' ? 7 : Math.max(1, cadenceDays ?? 1)
    const dates: string[] = []
    const cursor = new Date(start)
    for (let i = 0; i < count; i++) {
      dates.push(formatDate(cursor))
      cursor.setDate(cursor.getDate() + stepDays)
    }
    return dates
  }

  // Default: 'schoolDay' — advance through weekdays (Mon–Fri) only
  const schoolDayDates: string[] = []
  const cursor = new Date(start)
  while (schoolDayDates.length < schoolDays) {
    const dow = cursor.getDay() // 0=Sun, 6=Sat
    if (dow !== 0 && dow !== 6) {
      schoolDayDates.push(formatDate(cursor))
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  const dates: string[] = []
  for (let i = 0; i < count; i++) {
    const dayIndex = i < schoolDayDates.length ? i : schoolDayDates.length - 1
    dates.push(schoolDayDates[dayIndex])
  }
  return dates
}

function formatDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/**
 * Parses an ISO date string (YYYY-MM-DD) as a local-time Date, avoiding the
 * UTC-midnight-shifts-to-previous-local-day issue with `new Date('YYYY-MM-DD')`
 * in negative-UTC-offset timezones.
 */
function parseLocalDate(isoDate: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate)
  if (match) {
    const [, year, month, day] = match
    return new Date(Number(year), Number(month) - 1, Number(day))
  }
  return new Date(isoDate)
}

/**
 * Maps a generated lesson stub to the payload shape expected by
 * `plannerApi.createLesson` (see features/plan/types.ts LessonTask).
 */
export function mapGeneratedLessonToTaskInput(
  lesson: GeneratedLesson,
  context: {
    childId: string
    subjectId: string
    householdId: string
    resourceLink?: string
  },
): {
  childId: string
  subjectId: string
  householdId: string
  title: string
  description?: string
  dueDate: string
  status: 'not_started'
  order: number
  resourceLink?: string
} {
  return {
    childId: context.childId,
    subjectId: context.subjectId,
    householdId: context.householdId,
    title: lesson.title,
    description: lesson.description,
    dueDate: lesson.dueDate,
    status: 'not_started',
    order: lesson.order,
    resourceLink: context.resourceLink,
  }
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

export async function createResource(
  householdId: string,
  data: CreateResourceInput,
): Promise<Resource> {
  const row = await createResourceRow(householdId, data)
  return mapResourceRow(row)
}

export async function getResource(id: string, householdId: string): Promise<Resource | undefined> {
  const row = await getResourceRow(id, householdId)
  return row ? mapResourceRow(row) : undefined
}

export async function listResources(householdId: string): Promise<Resource[]> {
  const rows = await listResourceRows(householdId)
  return rows.map(mapResourceRow)
}

export async function updateVerificationStatus(
  id: string,
  householdId: string,
  status: VerificationStatus,
): Promise<Resource | null> {
  const row = await updateResourceVerificationRow(id, householdId, status)
  return row ? mapResourceRow(row) : null
}
