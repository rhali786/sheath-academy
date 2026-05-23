import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import type { SchoolYear } from '@/features/school-year/types'
import { getSchoolYear, updateSchoolYear, activateSchoolYear } from '@/features/school-year/server/service'
import { getHouseholdContext } from '@/features/lib/server/tenant'

export async function GET(id: string): Promise<NextResponse<ApiResponse<SchoolYear | null>>> {
  const { householdId } = await getHouseholdContext()
  const year = await getSchoolYear(householdId, id)

  if (!year) {
    return NextResponse.json(
      {
        status: 'error',
        data: null,
        message: 'School year not found',
        timestamp: new Date().toISOString(),
      },
      { status: 404 }
    )
  }

  return NextResponse.json({
    status: 'success',
    data: year,
    message: 'School year retrieved',
    timestamp: new Date().toISOString(),
  })
}

export async function PUT(id: string, request: Request): Promise<NextResponse> {
  const body = await request.json()

  const { householdId } = await getHouseholdContext()
  const existing = await getSchoolYear(householdId, id)
  if (!existing) {
    return NextResponse.json(
      {
        status: 'error',
        data: null,
        message: 'School year not found',
        timestamp: new Date().toISOString(),
      },
      { status: 404 }
    )
  }

  const startDate = body.startDate ?? existing.startDate
  const endDate = body.endDate ?? existing.endDate

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

  try {
    const updated = await updateSchoolYear(householdId, id, {
      name: body.name,
      startDate: body.startDate,
      endDate: body.endDate,
      isActive: body.isActive,
      requiredDays: body.requiredDays,
      requiredHours: body.requiredHours,
      trackingMethod: body.trackingMethod,
      schoolDays: body.schoolDays,
      breaks: body.breaks,
      termStructure: body.termStructure,
    })

    return NextResponse.json({
      status: 'success',
      data: updated,
      message: 'School year updated',
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Update failed'
    return NextResponse.json(
      {
        status: 'error',
        data: null,
        message,
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    )
  }
}

export async function ACTIVATE(id: string): Promise<NextResponse> {
  const { householdId } = await getHouseholdContext()
  const existing = await getSchoolYear(householdId, id)
  if (!existing) {
    return NextResponse.json(
      {
        status: 'error',
        data: null,
        message: 'School year not found',
        timestamp: new Date().toISOString(),
      },
      { status: 404 }
    )
  }

  const activated = await activateSchoolYear(householdId, id)

  return NextResponse.json({
    status: 'success',
    data: activated,
    message: 'School year activated',
    timestamp: new Date().toISOString(),
  })
}
