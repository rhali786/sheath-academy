import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import type { UsageEvent } from '@/features/admin-metrics/types'
import { requireAdminApi } from '@/features/admin-metrics/server/requireAdminApi'
import { listAdminUsageEvents } from '@/features/admin-metrics/server/service'
import { parsePeriodFromSearchParams } from '@/features/admin-metrics/server/metrics'

export async function GET(request: Request): Promise<Response> {
  const gate = await requireAdminApi(request)
  if (!gate.ok) return gate.response

  const { searchParams } = new URL(request.url)
  const period = parsePeriodFromSearchParams(searchParams)
  const limit = Math.min(500, parseInt(searchParams.get('limit') ?? '100', 10) || 100)
  const data = await listAdminUsageEvents(period.periodStart, period.periodEnd, limit)

  return NextResponse.json({
    status: 'success',
    data,
    message: 'Usage events retrieved',
    timestamp: new Date().toISOString(),
  } satisfies ApiResponse<UsageEvent[]>)
}
