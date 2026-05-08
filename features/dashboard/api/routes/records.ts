import { NextResponse } from 'next/server'
import type { ApiResponse, DashboardRecord } from '@/features/lib/types'
import { getRecords } from '@/features/lib/server/dataStore'

export async function GET(): Promise<NextResponse<ApiResponse<DashboardRecord[]>>> {
  const records = getRecords()

  const response: ApiResponse<DashboardRecord[]> = {
    status: 'success',
    data: records,
    message: 'Records retrieved',
    timestamp: new Date().toISOString(),
  }

  return NextResponse.json(response)
}
