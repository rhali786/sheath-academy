import { NextResponse } from 'next/server'
import type { ApiResponse, Alert } from '@/features/lib/types'
import { getAlerts } from '@/features/alerts/server/service'

export async function GET(request: Request): Promise<NextResponse<ApiResponse<Alert[]>>> {
  const { searchParams } = new URL(request.url)
  const childId = searchParams.get('childId') ?? undefined

  const alerts = getAlerts(childId)

  const response: ApiResponse<Alert[]> = {
    status: 'success',
    data: alerts,
    message: 'Alerts retrieved',
    timestamp: new Date().toISOString(),
  }

  return NextResponse.json(response)
}
