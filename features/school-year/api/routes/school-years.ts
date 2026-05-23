import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import type { SchoolYear } from '@/features/school-year/types'
import { getSchoolYears, getActiveSchoolYear, createSchoolYear } from '@/features/school-year/server/service'

export async function GET(): Promise<NextResponse<ApiResponse<SchoolYear[]>>> {
  const { householdId } = getRequestAuthCtx()
  const years = await getSchoolYears(householdId)
  return NextResponse.json({
    status: 'success',
    data: years,
    message: 'School years retrieved',
    timestamp: new Date().toISOString(),
  })
}

export async function GET_ACTIVE(): Promise<NextResponse<ApiResponse<SchoolYear | null>>> {
  const { householdId } = getRequestAuthCtx()
  const year = await getActiveSchoolYear(householdId)
  return NextResponse.json({
    status: 'success',
    data: year,
    message: year ? 'Active school year retrieved' : 'No active school year',
    timestamp: new Date().toISOString(),
  })
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json()
  const { name, startDate, endDate, isActive } = body

  if (!name?.trim()) {
    return NextResponse.json(
      {
        status: 'error',
        data: null,
        message: 'name is required',
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    )
  }

  if (!startDate || !endDate) {
    return NextResponse.json(
      {
        status: 'error',
        data: null,
        message: 'startDate and endDate are required',
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    )
  }

  if (startDate >= endDate) {
    return NextResponse.json(
      {
        status: 'error',
        data: null,
        message: 'endDate must be after startDate',
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    )
  }

  const effectiveActive = typeof isActive === 'boolean' ? isActive : true

  const { householdId } = getRequestAuthCtx()
  const year = await createSchoolYear(householdId, {
    name: name.trim(),
    startDate,
    endDate,
    isActive: effectiveActive,
    requiredDays: body.requiredDays,
    requiredHours: body.requiredHours,
    trackingMethod: body.trackingMethod,
    schoolDays: body.schoolDays,
    breaks: body.breaks,
    termStructure: body.termStructure,
  })

  return NextResponse.json(
    {
      status: 'success',
      data: year,
      message: 'School year created',
      timestamp: new Date().toISOString(),
    },
    { status: 201 }
  )
}
