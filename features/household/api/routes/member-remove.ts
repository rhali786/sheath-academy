import { NextResponse } from 'next/server'
import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { getMembership, removeMember } from '@/features/household/server/repository'

export async function DELETE(request: Request): Promise<NextResponse> {
  const auth = getRequestAuthCtx()
  const body = await request.json().catch(() => ({}))
  const { userId } = body as { userId?: string }

  if (!userId || typeof userId !== 'string') {
    return NextResponse.json({ status: 'error', message: 'userId is required' }, { status: 400 })
  }

  const requesterMembership = await getMembership(auth.householdId, auth.userId)
  if (!requesterMembership || requesterMembership.role !== 'owner') {
    return NextResponse.json({ status: 'error', message: 'Forbidden' }, { status: 403 })
  }

  if (userId === auth.userId) {
    return NextResponse.json({ status: 'error', message: 'Cannot remove yourself' }, { status: 422 })
  }

  const targetMembership = await getMembership(auth.householdId, userId)
  if (!targetMembership) {
    return NextResponse.json({ status: 'error', message: 'Member not found' }, { status: 404 })
  }

  await removeMember(auth.householdId, userId)

  return NextResponse.json({
    status: 'success',
    data: {},
    message: '',
    timestamp: new Date().toISOString(),
  })
}
