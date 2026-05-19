import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import type { LessonTask } from '@/features/plan/types'
import { getLessons, createLessonTask } from '@/features/plan/server/service'

function formatLocalDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

function getWeekRange(weekStr: string): { start: string; end: string } | null {
  // Use T00:00:00 (no Z) so the date is parsed in local time, not UTC
  const d = new Date(`${weekStr}T00:00:00`)
  if (isNaN(d.getTime())) return null

  // Snap to Monday of the given week
  const dayOfWeek = d.getDay()
  const offsetToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(d)
  monday.setDate(d.getDate() + offsetToMonday)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  return { start: formatLocalDate(monday), end: formatLocalDate(sunday) }
}

export async function GET(request: Request): Promise<NextResponse<ApiResponse<LessonTask[] | null>>> {
  const url = new URL(request.url)
  const week = url.searchParams.get('week')
  const childIds = url.searchParams.get('childIds')
  const subjectIds = url.searchParams.get('subjectIds')

  // Validate and parse week param
  let weekRange: { start: string; end: string } | null = null
  if (week) {
    weekRange = getWeekRange(week)
    if (!weekRange) {
      return NextResponse.json(
        {
          status: 'error',
          data: null,
          message: 'Invalid week parameter — expected YYYY-MM-DD',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      )
    }
  }

  const childIdArray = childIds ? childIds.split(',').filter(Boolean) : undefined
  const subjectIdArray = subjectIds ? subjectIds.split(',').filter(Boolean) : undefined

  let lessons = getLessons()

  if (weekRange) {
    lessons = lessons.filter(l => l.dueDate >= weekRange!.start && l.dueDate <= weekRange!.end)
  }

  if (childIdArray && childIdArray.length > 0) {
    lessons = lessons.filter(l => childIdArray.includes(l.childId))
  }

  if (subjectIdArray && subjectIdArray.length > 0) {
    lessons = lessons.filter(l => subjectIdArray.includes(l.subjectId))
  }

  return NextResponse.json({
    status: 'success',
    data: lessons,
    message: 'Lessons retrieved',
    timestamp: new Date().toISOString(),
  })
}

export async function POST(request: Request): Promise<NextResponse<ApiResponse<LessonTask | null>>> {
  const body = await request.json()

  const { childId, subjectId, title, dueDate, description } = body

  if (!childId || !subjectId || !title?.trim() || !dueDate) {
    return NextResponse.json(
      {
        status: 'error',
        data: null,
        message: 'childId, subjectId, title, and dueDate are required',
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    )
  }

  const lesson = createLessonTask({
    childId,
    subjectId,
    householdId: body.householdId || '',
    title: title.trim(),
    description: description?.trim() || undefined,
    dueDate,
    status: body.status ?? 'not_started',
    order: body.order || 0,
    estimatedDuration: body.estimatedDuration,
    lessonType: body.lessonType,
  })

  if (!lesson) {
    return NextResponse.json(
      {
        status: 'error',
        data: null,
        message: 'Invalid childId or subjectId',
        timestamp: new Date().toISOString(),
      },
      { status: 404 }
    )
  }

  return NextResponse.json(
    {
      status: 'success',
      data: lesson,
      message: 'Lesson created',
      timestamp: new Date().toISOString(),
    },
    { status: 201 }
  )
}
