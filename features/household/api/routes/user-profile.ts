import { NextResponse } from 'next/server'
import { requireAuthCtx } from '@/features/auth/server/context'
import { updateUserName } from '@/features/household/server/repository'

export async function PUT(request: Request): Promise<NextResponse> {
  const ctx = await requireAuthCtx(request as Parameters<typeof requireAuthCtx>[0])
  if (ctx instanceof Response) return ctx as NextResponse

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ status: 'error', data: null, message: 'Invalid JSON', timestamp: new Date().toISOString() }, { status: 400 })
  }

  if (typeof body !== 'object' || body === null || !('name' in body)) {
    return NextResponse.json({ status: 'error', data: null, message: 'name field is required', timestamp: new Date().toISOString() }, { status: 400 })
  }

  const { name } = body as Record<string, unknown>
  if (name !== null && name !== undefined && typeof name !== 'string') {
    return NextResponse.json({ status: 'error', data: null, message: 'name must be a string', timestamp: new Date().toISOString() }, { status: 400 })
  }

  const trimmed = typeof name === 'string' ? name.trim() : null
  await updateUserName(ctx.userId, trimmed || null)

  return NextResponse.json({
    status: 'success',
    data: { name: trimmed || null },
    message: 'Profile updated',
    timestamp: new Date().toISOString(),
  })
}
