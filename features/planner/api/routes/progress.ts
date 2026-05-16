import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import { getLessons } from '@/features/planner/server/service'
import { getStudentProfiles } from '@/features/children/server/service'
import { getSubjects } from '@/features/subjects/server/service'
import { computeProgressBySubject, type SubjectProgressSummary } from '@/features/planner/utils/progressBySubject'

export async function GET(request: Request): Promise<NextResponse<ApiResponse<SubjectProgressSummary[]>>> {
  const url = new URL(request.url)
  const scope = url.searchParams.get('scope')
  const start = url.searchParams.get('start')
  const end = url.searchParams.get('end')
  const childId = url.searchParams.get('childId')

  if (!scope || (scope !== 'week' && scope !== 'year')) {
    return NextResponse.json(
      { status: 'error', data: [], message: 'scope must be "week" or "year"', timestamp: new Date().toISOString() },
      { status: 400 }
    )
  }

  if (!start || !end) {
    return NextResponse.json(
      { status: 'error', data: [], message: 'start and end date params are required', timestamp: new Date().toISOString() },
      { status: 400 }
    )
  }

  const lessons = getLessons()
  const children = getStudentProfiles()
  const subjects = getSubjects()

  const childNames: Record<string, string> = Object.fromEntries(children.map(c => [c.id, c.name]))
  const subjectNames: Record<string, string> = Object.fromEntries(subjects.map(s => [s.id, s.name]))

  const childIdFilter = childId ? [childId] : null

  const summaries = computeProgressBySubject(
    lessons,
    { start, end },
    childIdFilter,
    childNames,
    subjectNames,
    scope
  )

  return NextResponse.json({
    status: 'success',
    data: summaries,
    message: 'Progress summaries retrieved',
    timestamp: new Date().toISOString(),
  })
}
