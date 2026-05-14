import { NextResponse } from 'next/server'
import type { LessonTask } from '@/features/lesson-tasks/types'
import { getLessonTask, updateLessonTask, deleteLessonTask } from '@/features/lesson-tasks/server/service'

interface ApiResponse<T> {
  status: 'success' | 'error'
  data: T
  message: string
  timestamp: string
}

export function GET(id: string): NextResponse<ApiResponse<LessonTask | null>> {
  const task = getLessonTask(id)

  if (!task) {
    return NextResponse.json(
      {
        status: 'error',
        data: null,
        message: 'Lesson task not found',
        timestamp: new Date().toISOString(),
      },
      { status: 404 }
    )
  }

  return NextResponse.json({
    status: 'success',
    data: task,
    message: 'Lesson task retrieved',
    timestamp: new Date().toISOString(),
  })
}

export async function PATCH(id: string, request: Request): Promise<NextResponse> {
  const existing = getLessonTask(id)
  if (!existing) {
    return NextResponse.json(
      {
        status: 'error',
        data: null,
        message: 'Lesson task not found',
        timestamp: new Date().toISOString(),
      },
      { status: 404 }
    )
  }

  const body = await request.json()
  const updated = updateLessonTask(id, body)

  if (!updated) {
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

  return NextResponse.json({
    status: 'success',
    data: updated,
    message: 'Lesson task updated',
    timestamp: new Date().toISOString(),
  })
}

export function DELETE(id: string): NextResponse {
  const deleted = deleteLessonTask(id)

  if (!deleted) {
    return NextResponse.json(
      {
        status: 'error',
        data: null,
        message: 'Lesson task not found',
        timestamp: new Date().toISOString(),
      },
      { status: 404 }
    )
  }

  return NextResponse.json({
    status: 'success',
    data: null,
    message: 'Lesson task deleted',
    timestamp: new Date().toISOString(),
  })
}
