import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import type { LessonTask } from '@/features/plan/types'
import { listLessonTaskRows } from '@/features/plan/server/repository'
import type { LessonTaskRow } from '@/features/plan/server/repository'
import { listLearners } from '@/features/children/server/repository'
import { listSubjectRows } from '@/features/subjects/server/repository'
import { computeProgressBySubject, type SubjectProgressSummary } from '@/features/plan/utils/progressBySubject'
import { getHouseholdContext } from '@/features/lib/server/tenant'

function rowToLesson(r: LessonTaskRow): LessonTask {
  return {
    id: r.id, childId: r.learnerId, subjectId: r.subjectId ?? '', householdId: r.householdId,
    title: r.title, description: r.description ?? undefined, dueDate: r.dueDate ?? '',
    status: (r.status as LessonTask['status']) ?? 'not_started', order: r.sortOrder,
    createdAt: r.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: r.updatedAt?.toISOString() ?? new Date().toISOString(),
  }
}

export async function GET(request: Request): Promise<NextResponse<ApiResponse<SubjectProgressSummary[]>>> {
  const url = new URL(request.url)
  const scope = url.searchParams.get('scope')
  const start = url.searchParams.get('start')
  const end = url.searchParams.get('end')
  const childId = url.searchParams.get('childId')

  if (!scope || (scope !== 'week' && scope !== 'year')) {
    return NextResponse.json({ status: 'error', data: [], message: 'scope must be "week" or "year"', timestamp: new Date().toISOString() }, { status: 400 })
  }
  if (!start || !end) {
    return NextResponse.json({ status: 'error', data: [], message: 'start and end date params are required', timestamp: new Date().toISOString() }, { status: 400 })
  }

  try {
    const { householdId } = await getHouseholdContext()
    const [rows, learners, subjectRows] = await Promise.all([
      listLessonTaskRows(householdId, { learnerId: childId ?? undefined, startDate: start, endDate: end }),
      listLearners(householdId),
      listSubjectRows(householdId),
    ])

    const lessons = rows.map(rowToLesson)
    const childNames = Object.fromEntries(learners.map(l => [l.id, l.name]))
    const subjectNames = Object.fromEntries(subjectRows.map(s => [s.id, s.name]))
    const childIdFilter = childId ? [childId] : null

    const summaries = computeProgressBySubject(lessons, { start, end }, childIdFilter, childNames, subjectNames, scope)
    return NextResponse.json({ status: 'success', data: summaries, message: 'Progress summaries retrieved', timestamp: new Date().toISOString() })
  } catch {
    return NextResponse.json({ status: 'success', data: [], message: 'Progress summaries retrieved', timestamp: new Date().toISOString() })
  }
}
