import { NextResponse } from 'next/server'
import type { ApiResponse, HouseholdProfile } from '@/features/lib/types'
import {
  createHouseholdProfile,
  getHouseholdProfile,
  getWorkspace,
  updateHouseholdProfile,
} from '@/features/household/server/service'

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
  const familyName = (body?.familyName ?? '').trim()
  if (!familyName) {
    return NextResponse.json(
      { status: 'error', data: null, message: 'familyName is required', timestamp: new Date().toISOString() },
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
    profile = createHouseholdProfile(workspace.id, familyName)
    return NextResponse.json({
      status: 'success',
      data: profile,
      message: 'Household profile created',
      timestamp: new Date().toISOString(),
    })
  }
  const updated = updateHouseholdProfile(familyName)
  if (!updated) {
    return NextResponse.json(
      { status: 'error', data: null, message: 'No household profile found', timestamp: new Date().toISOString() },
      { status: 404 }
    )
  }
  return NextResponse.json({
    status: 'success',
    data: updated,
    message: 'Household name updated',
    timestamp: new Date().toISOString(),
  })
}
