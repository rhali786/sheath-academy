import { NextResponse } from 'next/server'
import type { ApiResponse, Task } from '@/features/lib/types'
import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { listLessonTaskRows } from '@/features/plan/server/repository'

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export async function GET(request: Request): Promise<NextResponse<ApiResponse<Task[]>>> {
  const { householdId } = getRequestAuthCtx()
  const { searchParams } = new URL(request.url)
  const childId = searchParams.get('childId') ?? undefined

  const today = todayStr()
  const rows = await listLessonTaskRows(householdId, {
    learnerId: childId,
    startDate: today,
    endDate: today,
  })

  const tasks: Task[] = rows.map(row => ({
    id: row.id,
    childId: row.learnerId,
    subject: row.subjectId ?? '',
    description: row.title,
    status: row.status,
    completed: row.status === 'completed',
  }))

  return NextResponse.json({
    status: 'success',
    data: tasks,
    message: 'Tasks retrieved',
    timestamp: new Date().toISOString(),
  })
}
