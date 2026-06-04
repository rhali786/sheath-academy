import { NextResponse } from 'next/server'
import {
  getInvitationByTokenHash,
  markInvitationAccepted,
  upsertUserByEmail,
  addMember,
} from '@/features/household/server/repository'
import { hashInvitationToken } from '@/features/household/server/invitationTokens'

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json().catch(() => ({}))
  const { token } = body as { token?: string }

  if (!token || typeof token !== 'string') {
    return NextResponse.json({ status: 'error', message: 'token is required' }, { status: 400 })
  }

  const tokenHash = hashInvitationToken(token)
  const invitation = await getInvitationByTokenHash(tokenHash)

  if (!invitation) {
    return NextResponse.json({ status: 'error', message: 'Invitation not found' }, { status: 404 })
  }

  if (invitation.status !== 'pending' || invitation.expiresAt < new Date()) {
    return NextResponse.json({ status: 'error', message: 'Invitation is no longer valid' }, { status: 410 })
  }

  const user = await upsertUserByEmail(invitation.email, undefined, undefined)
  await addMember(invitation.householdId, user.id, invitation.role as 'owner' | 'member')
  await markInvitationAccepted(invitation.id)

  return NextResponse.json({
    status: 'success',
    data: { householdId: invitation.householdId },
    message: '',
    timestamp: new Date().toISOString(),
  })
}
