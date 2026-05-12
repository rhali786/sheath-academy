import { NextResponse } from 'next/server'
import type { ApiResponse, ChildProgress } from '@/features/lib/types'
import { getProgressData, getChildren } from '@/features/dashboard/server/service'

export async function GET(): Promise<NextResponse<ApiResponse<Record<string, ChildProgress>>>> {
  const progressDataRaw = getProgressData()
  const children = getChildren()

  const progressData: Record<string, ChildProgress> = {}

  for (const child of children) {
    const subjects = progressDataRaw[child.id] || []
    progressData[child.id] = {
      childName: child.name,
      subjects,
    }
  }

  const response: ApiResponse<Record<string, ChildProgress>> = {
    status: 'success',
    data: progressData,
    message: 'Progress data retrieved',
    timestamp: new Date().toISOString(),
  }

  return NextResponse.json(response)
}
