import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import type { AttendanceSummary } from '@/features/attendance/types'
import { getAttendanceSummary } from '@/features/attendance/server/service'


export async function GET(request: Request): Promise<NextResponse<ApiResponse<AttendanceSummary | null>>> {
  const url = new URL(request.url)
  const childId = url.searchParams.get('childId')

  if (!childId) {
    return NextResponse.json(
      { status: 'error', data: null, message: 'childId is required', timestamp: new Date().toISOString() },
      { status: 400 },
    )
  }

  const startDate = url.searchParams.get('startDate') ?? undefined
  const endDate = url.searchParams.get('endDate') ?? undefined

  try {
    const { householdId } = getRequestAuthCtx()
    const summary = await getAttendanceSummary(householdId, childId, startDate, endDate)
    return NextResponse.json({
      status: 'success',
      data: summary,
      message: 'Attendance summary retrieved',
      timestamp: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json(
      { status: 'error', data: null, message: 'Failed to load attendance summary', timestamp: new Date().toISOString() },
      { status: 500 },
    )
  }
}
