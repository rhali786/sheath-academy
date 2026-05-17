import { NextResponse } from 'next/server'
import type { ApiResponse, HouseholdProfile, DayOfWeek, DayLoadPreference, DateDisplayPreference } from '@/features/lib/types'
import {
  createHouseholdProfile,
  getHouseholdProfile,
  getWorkspace,
  updateHouseholdProfile,
} from '@/features/household/server/service'

const DAYS_OF_WEEK: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const DAY_LOADS: DayLoadPreference[] = ['Off', 'Light', 'Normal', 'Heavy']
const DATE_DISPLAYS: DateDisplayPreference[] = ['gregorian', 'gregorian-hijri-en', 'bilingual']

export async function GET(): Promise<NextResponse<ApiResponse<HouseholdProfile | null>>> {
  const profile = getHouseholdProfile()
  return NextResponse.json({
    status: 'success',
    data: profile,
    message: 'Household profile retrieved',
    timestamp: new Date().toISOString(),
  })
}

export async function PUT(request: Request): Promise<NextResponse> {
  const body = await request.json()

  const patch: Partial<Omit<HouseholdProfile, 'id' | 'workspaceId' | 'createdAt'>> = {}

  const familyName = (body?.familyName ?? '').trim()
  if (familyName) patch.familyName = familyName

  if (body?.weekStartDay !== undefined) {
    if (!DAYS_OF_WEEK.includes(body.weekStartDay)) {
      return NextResponse.json(
        { status: 'error', data: null, message: `weekStartDay must be one of: ${DAYS_OF_WEEK.join(', ')}`, timestamp: new Date().toISOString() },
        { status: 400 }
      )
    }
    patch.weekStartDay = body.weekStartDay
  }

  if (body?.schoolDays !== undefined) {
    if (!Array.isArray(body.schoolDays) || body.schoolDays.some((d: unknown) => !DAYS_OF_WEEK.includes(d as DayOfWeek))) {
      return NextResponse.json(
        { status: 'error', data: null, message: 'schoolDays must be an array of valid day names', timestamp: new Date().toISOString() },
        { status: 400 }
      )
    }
    patch.schoolDays = body.schoolDays
  }

  if (body?.dayLoad !== undefined) {
    const entries = Object.entries(body.dayLoad as Record<string, unknown>)
    for (const [day, load] of entries) {
      if (!DAYS_OF_WEEK.includes(day as DayOfWeek) || !DAY_LOADS.includes(load as DayLoadPreference)) {
        return NextResponse.json(
          { status: 'error', data: null, message: 'dayLoad contains invalid day or load value', timestamp: new Date().toISOString() },
          { status: 400 }
        )
      }
    }
    patch.dayLoad = body.dayLoad
  }

  if (body?.reportingName !== undefined) patch.reportingName = String(body.reportingName).trim() || undefined
  if (body?.timezone !== undefined) patch.timezone = String(body.timezone).trim() || undefined

  if (body?.dateDisplay !== undefined) {
    if (!DATE_DISPLAYS.includes(body.dateDisplay)) {
      return NextResponse.json(
        { status: 'error', data: null, message: `dateDisplay must be one of: ${DATE_DISPLAYS.join(', ')}`, timestamp: new Date().toISOString() },
        { status: 400 }
      )
    }
    patch.dateDisplay = body.dateDisplay
  }

  if (body?.jumuahLeaveWindow !== undefined) patch.jumuahLeaveWindow = String(body.jumuahLeaveWindow).trim() || undefined
  if (body?.jumuahReturnWindow !== undefined) patch.jumuahReturnWindow = String(body.jumuahReturnWindow).trim() || undefined

  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      { status: 'error', data: null, message: 'No valid fields provided for update', timestamp: new Date().toISOString() },
      { status: 400 }
    )
  }

  let profile = getHouseholdProfile()
  if (!profile) {
    const workspace = getWorkspace()
    if (!workspace) {
      return NextResponse.json(
        { status: 'error', data: null, message: 'No household profile found', timestamp: new Date().toISOString() },
        { status: 404 }
      )
    }
    profile = createHouseholdProfile(workspace.id, patch.familyName || 'My Household')
    const remaining = { ...patch }
    delete remaining.familyName
    if (Object.keys(remaining).length > 0) {
      profile = updateHouseholdProfile(remaining) ?? profile
    }
    return NextResponse.json({
      status: 'success',
      data: profile,
      message: 'Household profile created',
      timestamp: new Date().toISOString(),
    })
  }

  const updated = updateHouseholdProfile(patch)
  if (!updated) {
    return NextResponse.json(
      { status: 'error', data: null, message: 'No household profile found', timestamp: new Date().toISOString() },
      { status: 404 }
    )
  }
  return NextResponse.json({
    status: 'success',
    data: updated,
    message: 'Household profile updated',
    timestamp: new Date().toISOString(),
  })
}
