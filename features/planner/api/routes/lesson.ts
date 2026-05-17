import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import type { LessonTask } from '@/features/planner/types'
import { getLessonTask, updateLessonTask, completeLessonTask, deleteLessonTask } from '@/features/planner/server/service'

export async function GET(id: string): Promise<NextResponse<ApiResponse<LessonTask | null>>> {
  const lesson = getLessonTask(id)

  if (!lesson) {
    return NextResponse.json(
      {
        status: 'error',
        data: null,
        message: 'Lesson not found',
        timestamp: new Date().toISOString(),
      },
      { status: 404 }
    )
  }

  return NextResponse.json({
    status: 'success',
    data: lesson,
    message: 'Lesson retrieved',
    timestamp: new Date().toISOString(),
  })
}

export async function PUT(id: string, request: Request): Promise<NextResponse<ApiResponse<LessonTask | null>>> {
  const lesson = getLessonTask(id)
  if (!lesson) {
    return NextResponse.json(
      {
        status: 'error',
        data: null,
        message: 'Lesson not found',
        timestamp: new Date().toISOString(),
      },
      { status: 404 }
    )
  }

  const body = await request.json()

  const updated = updateLessonTask(id, {
    title: body.title !== undefined ? body.title.trim() : undefined,
    description: body.description !== undefined ? body.description.trim() : undefined,
    dueDate: body.dueDate,
    order: body.order,
  })

  return NextResponse.json({
    status: 'success',
    data: updated,
    message: 'Lesson updated',
    timestamp: new Date().toISOString(),
  })
}

export async function COMPLETE(id: string, request?: Request): Promise<NextResponse<ApiResponse<LessonTask | null>>> {
  const lesson = getLessonTask(id)
  if (!lesson) {
    return NextResponse.json(
      {
        status: 'error',
        data: null,
        message: 'Lesson not found',
        timestamp: new Date().toISOString(),
      },
      { status: 404 }
    )
  }

  let status: 'completed' | 'skipped' = 'completed'
  if (request) {
    try {
      const body = await request.json()
      if (body?.status === 'skipped') {
        status = 'skipped'
      }
    } catch {
      // No body or invalid JSON — default to 'completed'
    }
  }

  const updated = completeLessonTask(id, status)

  return NextResponse.json({
    status: 'success',
    data: updated,
    message: status === 'skipped' ? 'Lesson marked as skipped' : 'Lesson marked as complete',
    timestamp: new Date().toISOString(),
  })
}

export async function DELETE(id: string): Promise<NextResponse<ApiResponse<null>>> {
  const deleted = deleteLessonTask(id)

  if (!deleted) {
    return NextResponse.json(
      {
        status: 'error',
        data: null,
        message: 'Lesson not found',
        timestamp: new Date().toISOString(),
      },
      { status: 404 }
    )
  }

  return NextResponse.json({
    status: 'success',
    data: null,
    message: 'Lesson deleted',
    timestamp: new Date().toISOString(),
  })
}
