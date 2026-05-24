import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import type { Alert } from '@/features/alerts/types'
import { getAlerts } from '@/features/alerts/server/service'

export async function GET(request: Request): Promise<NextResponse<ApiResponse<Alert[]>>> {
  const { searchParams } = new URL(request.url)
  const childId = searchParams.get('childId') ?? undefined
  const date = searchParams.get('date') ?? undefined
  const startDate = searchParams.get('startDate') ?? undefined
  const endDate = searchParams.get('endDate') ?? undefined
  const type = searchParams.get('type') ?? undefined
  const status = searchParams.get('status') ?? undefined

  const { householdId } = getRequestAuthCtx()
  let alerts = await getAlerts(householdId, childId)

  if (date) {
    alerts = alerts.filter(a => a.date === date)
  }

  if (startDate) {
    alerts = alerts.filter(a => (a.date ?? '') >= startDate)
  }

  if (endDate) {
    alerts = alerts.filter(a => (a.date ?? '') <= endDate)
  }

  if (type) {
    alerts = alerts.filter(a => a.type === type)
  }

  if (status) {
    alerts = alerts.filter(a => a.status === status)
  }

  return NextResponse.json({
    status: 'success',
    data: alerts,
    message: 'Alerts retrieved',
    timestamp: new Date().toISOString(),
  })
}
