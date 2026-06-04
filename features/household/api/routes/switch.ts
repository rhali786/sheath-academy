import { NextResponse } from 'next/server'
import { getAuthCtx } from '@/features/auth/server/context'
import { getMembership, getHouseholdById } from '@/features/household/server/repository'
import { setUserSetting } from '@/features/settings/server/repository'

export async function POST(request: Request): Promise<NextResponse> {
  const ctx = await getAuthCtx()
  if (!ctx) {
    return NextResponse.json({ status: 'error', data: null, message: 'Unauthorized', timestamp: new Date().toISOString() }, { status: 401 })
  }

  let body: { householdId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ status: 'error', data: null, message: 'Invalid JSON', timestamp: new Date().toISOString() }, { status: 400 })
  }

  const { householdId } = body
  if (!householdId || typeof householdId !== 'string') {
    return NextResponse.json({ status: 'error', data: null, message: 'householdId is required', timestamp: new Date().toISOString() }, { status: 400 })
  }

  const membership = await getMembership(householdId, ctx.userId)
  if (!membership) {
    return NextResponse.json({ status: 'error', data: null, message: 'Not a member of this household', timestamp: new Date().toISOString() }, { status: 403 })
  }

  const household = await getHouseholdById(householdId)
  if (!household) {
    return NextResponse.json({ status: 'error', data: null, message: 'Household not found', timestamp: new Date().toISOString() }, { status: 404 })
  }

  await setUserSetting(ctx.userId, 'active_household_id', householdId)

  return NextResponse.json({
    status: 'success',
    data: { householdId: household.id, timezone: household.timezone },
    message: 'Active household updated',
    timestamp: new Date().toISOString(),
  })
}
