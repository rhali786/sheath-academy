import { NextResponse } from 'next/server'
import type { ApiResponse, LessonTask } from '@/features/lib/types'
import { getLessons, createLessonTask } from '@/features/planner/server/service'

export async function GET(request: Request): Promise<NextResponse<ApiResponse<LessonTask[]>>> {
  const url = new URL(request.url)
  const childIds = url.searchParams.get('childIds')
  const subjectIds = url.searchParams.get('subjectIds')

  // Parse comma-separated IDs into arrays
  const childIdArray = childIds ? childIds.split(',').filter(Boolean) : undefined
  const subjectIdArray = subjectIds ? subjectIds.split(',').filter(Boolean) : undefined

  // Get all lessons
  let lessons = getLessons()

  // Apply filters
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

  // Validate required fields
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

  // Create lesson (service validates childId and subjectId)
  const lesson = createLessonTask({
    childId,
    subjectId,
    householdId: body.householdId || '', // TODO: Get from context
    title: title.trim(),
    description: description?.trim() || undefined,
    dueDate,
    isCompleted: false,
    order: body.order || 0,
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
