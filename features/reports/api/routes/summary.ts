import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import type { RecordsReport } from '@/features/reports/types'
import { getRecordsReport } from '@/features/reports/server/service'

export async function GET(request: Request): Promise<NextResponse<ApiResponse<RecordsReport | null>>> {
  const url = new URL(request.url)
  const childId = url.searchParams.get('childId') ?? undefined
  const startDate = url.searchParams.get('startDate') ?? undefined
  const endDate = url.searchParams.get('endDate') ?? undefined

  if (!childId) {
    return NextResponse.json(
      {
        status: 'error',
        data: null,
        message: 'childId is required',
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    )
  }

  try {
    const report = getRecordsReport({ childId, startDate, endDate })
    return NextResponse.json({
      status: 'success',
      data: report,
      message: 'Records report generated',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        data: null,
        message: error instanceof Error ? error.message : 'Failed to generate records report',
        timestamp: new Date().toISOString(),
      },
      { status: 404 }
    )
  }
}
