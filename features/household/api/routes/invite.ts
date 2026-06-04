import { NextResponse } from 'next/server'
import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import {
  getMembership,
  createInvitation,
  getHouseholdById,
  getUserById,
} from '@/features/household/server/repository'
import { createInvitationToken } from '@/features/household/server/invitationTokens'
import { sendInvitationEmail } from '@/features/auth/server/email'
import { displayName } from '@/features/lib/displayName'

export async function POST(request: Request): Promise<NextResponse> {
  const auth = getRequestAuthCtx()
  const body = await request.json().catch(() => ({}))
  const { email, role = 'member' } = body as { email?: string; role?: string }

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ status: 'error', message: 'email is required' }, { status: 400 })
  }

  const membership = await getMembership(auth.householdId, auth.userId)
  if (!membership || membership.role !== 'owner') {
    return NextResponse.json({ status: 'error', message: 'Forbidden' }, { status: 403 })
  }

  const resolvedRole = role === 'owner' ? 'owner' : 'member'
  const { raw, hash, expiresAt } = createInvitationToken()

  const invitation = await createInvitation({
    householdId: auth.householdId,
    email,
    role: resolvedRole,
    tokenHash: hash,
    expiresAt,
    invitedByUserId: auth.userId,
  })

  // Resolve human-friendly labels so the email reads "You've been invited to
  // join <Family Name>" rather than leaking the household id / a generic name.
  const [household, inviter] = await Promise.all([
    getHouseholdById(auth.householdId),
    getUserById(auth.userId),
  ])

  await sendInvitationEmail({
    to: email,
    rawToken: raw,
    householdName: household?.name ?? 'your household',
    inviterName: inviter ? displayName(inviter) : undefined,
  })

  return NextResponse.json({
    status: 'success',
    data: { invitationId: invitation.id },
    message: '',
    timestamp: new Date().toISOString(),
  })
}
