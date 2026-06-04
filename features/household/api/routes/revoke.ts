import { NextResponse } from 'next/server'
import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import {
  getMembership,
  getInvitationById,
  markInvitationRevoked,
} from '@/features/household/server/repository'

export async function POST(request: Request): Promise<NextResponse> {
  const auth = getRequestAuthCtx()
  const body = await request.json().catch(() => ({}))
  const { invitationId } = body as { invitationId?: string }

  if (!invitationId || typeof invitationId !== 'string') {
    return NextResponse.json({ status: 'error', message: 'invitationId is required' }, { status: 400 })
  }

  const membership = await getMembership(auth.householdId, auth.userId)
  if (!membership || membership.role !== 'owner') {
    return NextResponse.json({ status: 'error', message: 'Forbidden' }, { status: 403 })
  }

  const invitation = await getInvitationById(invitationId)
  if (!invitation) {
    return NextResponse.json({ status: 'error', message: 'Invitation not found' }, { status: 404 })
  }

  if (invitation.householdId !== auth.householdId) {
    return NextResponse.json({ status: 'error', message: 'Forbidden' }, { status: 403 })
  }

  await markInvitationRevoked(invitationId)

  return NextResponse.json({
    status: 'success',
    data: {},
    message: '',
    timestamp: new Date().toISOString(),
  })
}
