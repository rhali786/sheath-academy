import { NextResponse } from 'next/server'
import type { ApiResponse, Task } from '@/features/lib/types'
import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { completeLessonTaskRow, getLessonTaskRow } from '@/features/plan/server/repository'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Task>>> {
  const { householdId } = getRequestAuthCtx()
  const { completed } = await request.json()
  const { id } = await params
  const status = completed ? 'completed' : 'not_started'

  const row = await completeLessonTaskRow(id, householdId, status === 'completed' ? 'completed' : 'skipped')
  if (!row) {
    return NextResponse.json(
      {
        status: 'error',
        data: {} as Task,
        message: 'Task not found',
        timestamp: new Date().toISOString(),
      },
      { status: 404 }
    )
  }

  return NextResponse.json({
    status: 'success',
    data: {
      id: row.id,
      childId: row.learnerId,
      subject: row.subjectId ?? '',
      description: row.title,
      status: row.status,
      completed: row.status === 'completed',
    },
    message: 'Task updated',
    timestamp: new Date().toISOString(),
  })
}
