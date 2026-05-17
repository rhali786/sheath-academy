import { NextResponse } from 'next/server'
import type { ApiResponse, Alert } from '@/features/lib/types'
import { getAlerts } from '@/features/dashboard/server/service'
import { getStudentProfiles } from '@/features/children/server/service'

export async function GET(): Promise<NextResponse<ApiResponse<Alert[]>>> {
  const archivedIds = new Set(
    getStudentProfiles().filter(p => !p.isActive).map(p => p.id)
  )
  const alerts = getAlerts().filter(
    a => a.childId === null || !archivedIds.has(a.childId)
  )

  const response: ApiResponse<Alert[]> = {
    status: 'success',
    data: alerts,
    message: 'Alerts retrieved',
    timestamp: new Date().toISOString(),
  }

  return NextResponse.json(response)
}
