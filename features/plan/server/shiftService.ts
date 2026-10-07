import { listLessonTaskRows, updateLessonDatesIfUnchanged, type LessonDatesChange } from '@/features/plan/server/repository'
import { getActiveSchoolYear } from '@/features/school-year/server/service'
import { getHouseholdSetting } from '@/features/settings/server/repository'
import { DEFAULT_SCHOOL_DAYS } from '@/features/plan/utils/schoolDays'
import { remapDates, type SchoolCalendar } from '@/features/plan/utils/schoolCalendar'
import type { DayOfWeek } from '@/features/lib/types'
import type {
  LessonDateMove,
  ShiftApplyResult,
  ShiftLessonsRequest,
  ShiftPreview,
} from '@/features/plan/types'

/** Request was well-formed JSON but cannot be served (unknown break, no school year, …). */
export class ShiftRequestError extends Error {}

const VALID_DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

/** Household school days from Settings → Household (the source the planner already uses). */
async function loadSchoolDays(householdId: string): Promise<DayOfWeek[]> {
  const stored = await getHouseholdSetting(householdId, 'schoolDays')
  if (Array.isArray(stored)) {
    const days = stored.filter((d): d is DayOfWeek => VALID_DAYS.includes(d as DayOfWeek))
    if (days.length > 0) return days
  }
  return DEFAULT_SCHOOL_DAYS
}

export async function previewShift(householdId: string, request: ShiftLessonsRequest): Promise<ShiftPreview> {
  const [schoolDays, activeYear] = await Promise.all([
    loadSchoolDays(householdId),
    getActiveSchoolYear(householdId),
  ])
  const breaks = activeYear?.breaks ?? []

  let fromDate: string
  let before: SchoolCalendar
  let after: SchoolCalendar
  let offset: number

  if (request.mode === 'break') {
    if (!activeYear) throw new ShiftRequestError('There is no active school year')
    const target = breaks.find(b => b.id === request.breakId)
    if (!target) throw new ShiftRequestError('That break is not on the active school year')
    fromDate = target.startDate
    before = { schoolDays, breaks: breaks.filter(b => b.id !== target.id) }
    after = { schoolDays, breaks }
    offset = 0
  } else {
    fromDate = request.fromDate!
    before = after = { schoolDays, breaks }
    offset = request.schoolDays!
  }

  const rows = (await listLessonTaskRows(householdId, { status: 'not_started', startDate: fromDate }))
    .filter(r => r.status === 'not_started' && r.dueDate != null && r.dueDate >= fromDate)
    .filter(r => !request.learnerIds?.length || request.learnerIds.includes(r.learnerId))
    .filter(r => !request.subjectIds?.length || (r.subjectId != null && request.subjectIds.includes(r.subjectId)))

  const dates = rows.flatMap(r => (r.plannedStartDate ? [r.dueDate!, r.plannedStartDate] : [r.dueDate!]))
  const remapped = remapDates(dates, { before, after, offset })

  const moves: LessonDateMove[] = []
  for (const r of rows) {
    const from = { dueDate: r.dueDate!, plannedStartDate: r.plannedStartDate ?? null }
    const to = {
      dueDate: remapped.get(from.dueDate)!,
      plannedStartDate: from.plannedStartDate ? remapped.get(from.plannedStartDate)! : null,
    }
    if (to.dueDate === from.dueDate && to.plannedStartDate === from.plannedStartDate) continue
    moves.push({ id: r.id, learnerId: r.learnerId, subjectId: r.subjectId ?? null, title: r.title, from, to })
  }

  moves.sort((a, b) => a.from.dueDate.localeCompare(b.from.dueDate) || a.title.localeCompare(b.title))

  const countsByLearner: Record<string, number> = {}
  for (const m of moves) countsByLearner[m.learnerId] = (countsByLearner[m.learnerId] ?? 0) + 1

  const schoolYearEnd = activeYear?.endDate ?? null
  const pastYearEndCount = schoolYearEnd ? moves.filter(m => m.to.dueDate > schoolYearEnd).length : 0

  return { moves, countsByLearner, pastYearEndCount, schoolYearEnd }
}

export async function applyShift(
  householdId: string,
  moves: Pick<LessonDateMove, 'id' | 'from' | 'to'>[],
): Promise<ShiftApplyResult> {
  const changes: LessonDatesChange[] = moves.map(m => ({ id: m.id, from: m.from, to: m.to }))
  return updateLessonDatesIfUnchanged(householdId, changes)
}
