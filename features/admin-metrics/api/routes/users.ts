import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import type { AdminMetricsUsersResult, FeatureArea, DropOffSignal } from '@/features/admin-metrics/types'
import { requireAdminApi } from '@/features/admin-metrics/server/requireAdminApi'
import { getAdminMetricsUsers } from '@/features/admin-metrics/server/service'
import { parsePeriodFromSearchParams } from '@/features/admin-metrics/server/metrics'

export async function GET(request: Request): Promise<Response> {
  const gate = await requireAdminApi(request)
  if (!gate.ok) return gate.response

  const { searchParams } = new URL(request.url)
  const period = parsePeriodFromSearchParams(searchParams)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '50', 10) || 50))

  const data = await getAdminMetricsUsers({
    periodStart: period.periodStart,
    periodEnd: period.periodEnd,
    activeOnly: searchParams.get('activeOnly') === 'true',
    featureArea: (searchParams.get('featureArea') as FeatureArea | null) ?? undefined,
    dropOff: (searchParams.get('dropOff') as DropOffSignal | null) ?? undefined,
    workspaceId: searchParams.get('workspaceId') ?? undefined,
    search: searchParams.get('search')?.trim() || undefined,
    page,
    pageSize,
  })

  return NextResponse.json({
    status: 'success',
    data,
    message: 'Admin metrics users retrieved',
    timestamp: new Date().toISOString(),
  } satisfies ApiResponse<AdminMetricsUsersResult>)
}
