import { NextResponse } from 'next/server'
import type { ApiResponse, Alert } from '@/features/lib/types'
import { getAlerts } from '@/features/dashboard/server/service'

export async function GET(): Promise<NextResponse<ApiResponse<Alert[]>>> {
  const alerts = getAlerts()

  const response: ApiResponse<Alert[]> = {
    status: 'success',
    data: alerts,
    message: 'Alerts retrieved',
    timestamp: new Date().toISOString(),
  }

  return NextResponse.json(response)
}
