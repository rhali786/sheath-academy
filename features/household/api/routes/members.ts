import { NextResponse } from 'next/server'
import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { listMembersWithUsers, listInvitationsForHousehold } from '@/features/household/server/repository'

export async function GET(): Promise<NextResponse> {
  const auth = getRequestAuthCtx()
  const members = await listMembersWithUsers(auth.householdId)
  return NextResponse.json({
    status: 'success',
    data: { members },
    message: '',
    timestamp: new Date().toISOString(),
  })
}

export async function getInvitations(): Promise<NextResponse> {
  const auth = getRequestAuthCtx()
  const invitations = await listInvitationsForHousehold(auth.householdId)
  return NextResponse.json({
    status: 'success',
    data: { invitations },
    message: '',
    timestamp: new Date().toISOString(),
  })
}
