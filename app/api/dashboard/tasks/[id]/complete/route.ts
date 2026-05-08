import { NextResponse } from 'next/server'
import type { ApiResponse, Task } from '@/features/lib/types'
import { getTasks, updateTask } from '@/features/lib/server/dataStore'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Task>>> {
  const { completed } = await request.json()
  const { id } = await params
  const taskId = id

  updateTask(taskId, completed)
  const tasks = getTasks()
  const updatedTask = tasks.find(t => t.id === taskId)

  if (!updatedTask) {
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

  const response: ApiResponse<Task> = {
    status: 'success',
    data: updatedTask,
    message: 'Task updated',
    timestamp: new Date().toISOString(),
  }

  return NextResponse.json(response)
}
