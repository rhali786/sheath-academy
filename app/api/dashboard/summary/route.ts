import { NextResponse } from 'next/server'
import type { ApiResponse, DashboardMetrics } from '@/features/lib/types'

export async function GET(): Promise<NextResponse<ApiResponse<DashboardMetrics>>> {
  const metrics: DashboardMetrics = {
    attendanceReady: '3/5',
    lessonsPlanned: 2,
    needsAttention: 2,
    quranLogged: '1 session',
    portfolioItems: 1,
  }

  const response: ApiResponse<DashboardMetrics> = {
    status: 'success',
    data: metrics,
    message: 'Dashboard summary retrieved',
    timestamp: new Date().toISOString(),
  }

  return NextResponse.json(response)
}
