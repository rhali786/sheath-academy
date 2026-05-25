import { NextResponse } from 'next/server'
import { useResetToken } from '@/features/auth/server/passwordResetTokens'
import { hashPassword } from '@/features/auth/server/password'
import { updateUserPassword } from '@/features/auth/server/repository'

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ status: 'error', message: 'Invalid request body' }, { status: 400 })
  }

  const token = String(body.token ?? '').trim()
  const password = String(body.password ?? '')
  const confirmPassword = String(body.confirmPassword ?? '')

  if (!token) {
    return NextResponse.json({ status: 'error', message: 'Reset token is required.' }, { status: 400 })
  }
  if (!password || password.length < 8) {
    return NextResponse.json({ status: 'error', message: 'Password must be at least 8 characters.' }, { status: 422 })
  }
  if (password !== confirmPassword) {
    return NextResponse.json({ status: 'error', message: 'Passwords do not match.' }, { status: 422 })
  }

  const userId = await useResetToken(token)
  if (!userId) {
    return NextResponse.json({ status: 'error', message: 'Reset link is invalid or has expired.' }, { status: 400 })
  }

  const passwordHash = await hashPassword(password)
  await updateUserPassword(userId, passwordHash)

  return NextResponse.json({ status: 'success', message: 'Password updated.' })
}
