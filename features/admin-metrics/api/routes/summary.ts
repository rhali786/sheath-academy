import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import type { AdminMetricsSummary } from '@/features/admin-metrics/types'
import { requireAdminApi } from '@/features/admin-metrics/server/requireAdminApi'
import { getAdminMetricsSummary } from '@/features/admin-metrics/server/service'
import { parsePeriodFromSearchParams } from '@/features/admin-metrics/server/metrics'

export async function GET(request: Request): Promise<Response> {
  const gate = await requireAdminApi(request)
  if (!gate.ok) return gate.response

  const { searchParams } = new URL(request.url)
  const period = parsePeriodFromSearchParams(searchParams)
  const data = await getAdminMetricsSummary(period.periodStart, period.periodEnd)

  return NextResponse.json({
    status: 'success',
    data,
    message: 'Admin metrics summary retrieved',
    timestamp: new Date().toISOString(),
  } satisfies ApiResponse<AdminMetricsSummary>)
}
