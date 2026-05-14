import { NextResponse } from 'next/server'
import type { LessonTask } from '@/features/lesson-tasks/types'
import { getLessonTasks, createLessonTask } from '@/features/lesson-tasks/server/service'

interface ApiResponse<T> {
  status: 'success' | 'error'
  data: T
  message: string
  timestamp: string
}

export async function GET(request: Request): Promise<NextResponse<ApiResponse<LessonTask[]>>> {
  const url = new URL(request.url)
  const childId = url.searchParams.get('childId') ?? undefined
  const subjectId = url.searchParams.get('subjectId') ?? undefined
  const date = url.searchParams.get('date') ?? undefined

  const tasks = getLessonTasks({ childId, subjectId, date })

  return NextResponse.json({
    status: 'success',
    data: tasks,
    message: 'Lesson tasks retrieved',
    timestamp: new Date().toISOString(),
  })
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json()

  const task = createLessonTask({
    childId: body.childId ?? '',
    subjectId: body.subjectId ?? '',
    title: body.title ?? '',
    date: body.date ?? '',
    status: body.status,
    notes: body.notes,
    resourceLink: body.resourceLink,
  })

  if (!task) {
    return NextResponse.json(
      {
        status: 'error',
        data: null,
        message: 'Invalid input: check required fields, entity references, and formats',
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    )
  }

  return NextResponse.json(
    {
      status: 'success',
      data: task,
      message: 'Lesson task created',
      timestamp: new Date().toISOString(),
    },
    { status: 201 }
  )
}
