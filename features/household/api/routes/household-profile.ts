import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { NextResponse } from 'next/server'
import type { ApiResponse, HouseholdProfile, DayOfWeek, DayLoadPreference, DateDisplayPreference } from '@/features/lib/types'
import { LOGO_PRESET_KEYS } from '@/features/lib/types'
import { updateHouseholdName, updateHouseholdTimezone, updateHouseholdLogoPreset } from '@/features/household/server/repository'
import {
  getAllHouseholdSettings,
  setHouseholdSetting,
} from '@/features/settings/server/repository'
import { getDb } from '@/features/lib/server/db'
import { households } from '@/db/schema'
import { eq } from 'drizzle-orm'

const DAYS_OF_WEEK: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const DAY_LOADS: DayLoadPreference[] = ['Off', 'Light', 'Normal', 'Heavy']
const DATE_DISPLAYS: DateDisplayPreference[] = ['gregorian', 'gregorian-hijri-en', 'bilingual']

type HouseholdRow = typeof households.$inferSelect

function profileFromRowAndSettings(row: HouseholdRow, settings: Record<string, unknown>): HouseholdProfile {
  return {
    id: row.id,
    workspaceId: row.id,
    familyName: row.name,
    logoPreset: row.logoPreset ?? undefined,
    timezone: row.timezone ?? undefined,
    weekStartDay: (settings['weekStartDay'] as DayOfWeek) ?? undefined,
    schoolDays: (settings['schoolDays'] as DayOfWeek[]) ?? undefined,
    dayLoad: (settings['dayLoad'] as Partial<Record<DayOfWeek, DayLoadPreference>>) ?? undefined,
    reportingName: (settings['reportingName'] as string) ?? undefined,
    dateDisplay: (settings['dateDisplay'] as DateDisplayPreference) ?? undefined,
    jumuahLeaveWindow: (settings['jumuahLeaveWindow'] as string) ?? undefined,
    jumuahReturnWindow: (settings['jumuahReturnWindow'] as string) ?? undefined,
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
  }
}

export async function GET(): Promise<NextResponse<ApiResponse<HouseholdProfile | null>>> {
  try {
    const { householdId } = getRequestAuthCtx()
    const db = getDb()
    const [rows, settings] = await Promise.all([
      db.select().from(households).where(eq(households.id, householdId)).limit(1),
      getAllHouseholdSettings(householdId),
    ])
    if (!rows[0]) {
      return NextResponse.json({ status: 'success', data: null, message: 'No household profile', timestamp: new Date().toISOString() })
    }
    const profile = profileFromRowAndSettings(rows[0], settings)
    return NextResponse.json({ status: 'success', data: profile, message: 'Household profile retrieved', timestamp: new Date().toISOString() })
  } catch {
    return NextResponse.json({ status: 'success', data: null, message: 'No household profile', timestamp: new Date().toISOString() })
  }
}

export async function POST(request: Request): Promise<NextResponse<ApiResponse<HouseholdProfile | null>>> {
  const body = await request.json()
  const familyName = (body?.familyName ?? '').trim()
  if (!familyName) {
    return NextResponse.json(
      { status: 'error', data: null, message: 'familyName is required', timestamp: new Date().toISOString() },
      { status: 400 },
    )
  }

  try {
    const { householdId } = getRequestAuthCtx()
    const updated = await updateHouseholdName(householdId, familyName)
    if (!updated) {
      return NextResponse.json(
        { status: 'error', data: null, message: 'Failed to create household profile', timestamp: new Date().toISOString() },
        { status: 500 },
      )
    }
    const settings = await getAllHouseholdSettings(householdId)
    const profile = profileFromRowAndSettings(updated, settings)
    return NextResponse.json(
      { status: 'success', data: profile, message: 'Household created', timestamp: new Date().toISOString() },
      { status: 201 },
    )
  } catch {
    return NextResponse.json(
      { status: 'error', data: null, message: 'Failed to create household profile', timestamp: new Date().toISOString() },
      { status: 401 },
    )
  }
}

export async function PUT(request: Request): Promise<NextResponse> {
  const body = await request.json()

  const patch: Partial<Omit<HouseholdProfile, 'id' | 'workspaceId' | 'createdAt'>> = {}

  const familyName = (body?.familyName ?? '').trim()
  if (familyName) patch.familyName = familyName

  if (body?.weekStartDay !== undefined) {
    if (!DAYS_OF_WEEK.includes(body.weekStartDay)) {
      return NextResponse.json({ status: 'error', data: null, message: `weekStartDay must be one of: ${DAYS_OF_WEEK.join(', ')}`, timestamp: new Date().toISOString() }, { status: 400 })
    }
    patch.weekStartDay = body.weekStartDay
  }

  if (body?.schoolDays !== undefined) {
    if (!Array.isArray(body.schoolDays) || body.schoolDays.some((d: unknown) => !DAYS_OF_WEEK.includes(d as DayOfWeek))) {
      return NextResponse.json({ status: 'error', data: null, message: 'schoolDays must be an array of valid day names', timestamp: new Date().toISOString() }, { status: 400 })
    }
    patch.schoolDays = body.schoolDays
  }

  if (body?.dayLoad !== undefined) {
    const entries = Object.entries(body.dayLoad as Record<string, unknown>)
    for (const [day, load] of entries) {
      if (!DAYS_OF_WEEK.includes(day as DayOfWeek) || !DAY_LOADS.includes(load as DayLoadPreference)) {
        return NextResponse.json({ status: 'error', data: null, message: 'dayLoad contains invalid day or load value', timestamp: new Date().toISOString() }, { status: 400 })
      }
    }
    patch.dayLoad = body.dayLoad
  }

  if (body?.reportingName !== undefined) patch.reportingName = String(body.reportingName).trim() || undefined
  if (body?.timezone !== undefined) patch.timezone = String(body.timezone).trim() || undefined

  if (body?.dateDisplay !== undefined) {
    if (!DATE_DISPLAYS.includes(body.dateDisplay)) {
      return NextResponse.json({ status: 'error', data: null, message: `dateDisplay must be one of: ${DATE_DISPLAYS.join(', ')}`, timestamp: new Date().toISOString() }, { status: 400 })
    }
    patch.dateDisplay = body.dateDisplay
  }

  if (body?.jumuahLeaveWindow !== undefined) patch.jumuahLeaveWindow = String(body.jumuahLeaveWindow).trim() || undefined
  if (body?.jumuahReturnWindow !== undefined) patch.jumuahReturnWindow = String(body.jumuahReturnWindow).trim() || undefined

  if (body?.logoPreset !== undefined) {
    if (!LOGO_PRESET_KEYS.includes(body.logoPreset)) {
      return NextResponse.json({ status: 'error', data: null, message: `logoPreset must be one of: ${LOGO_PRESET_KEYS.join(', ')}`, timestamp: new Date().toISOString() }, { status: 400 })
    }
    patch.logoPreset = body.logoPreset
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ status: 'error', data: null, message: 'No valid fields provided for update', timestamp: new Date().toISOString() }, { status: 400 })
  }

  try {
    const { householdId } = getRequestAuthCtx()
    if (patch.familyName) await updateHouseholdName(householdId, patch.familyName)
    if (patch.timezone) await updateHouseholdTimezone(householdId, patch.timezone)
    if (patch.logoPreset !== undefined) await updateHouseholdLogoPreset(householdId, patch.logoPreset)
    const settingsKeys = ['weekStartDay', 'schoolDays', 'dayLoad', 'reportingName', 'dateDisplay', 'jumuahLeaveWindow', 'jumuahReturnWindow'] as const
    for (const key of settingsKeys) {
      if (patch[key] !== undefined) {
        await setHouseholdSetting(householdId, key, patch[key] as unknown)
      }
    }
    return await GET()
  } catch {
    return NextResponse.json({ status: 'error', data: null, message: 'Failed to update household profile', timestamp: new Date().toISOString() }, { status: 500 })
  }
}
