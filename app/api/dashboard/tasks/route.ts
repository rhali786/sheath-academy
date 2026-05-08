import { NextResponse } from 'next/server'
import type { ApiResponse, Task } from '@/lib/types'
import { getTasks } from '@/lib/server/dataStore'

export async function GET(): Promise<NextResponse<ApiResponse<Task[]>>> {
  const tasks = getTasks()

  const response: ApiResponse<Task[]> = {
    status: 'success',
    data: tasks,
    message: 'Tasks retrieved',
    timestamp: new Date().toISOString(),
  }

  return NextResponse.json(response)
}
