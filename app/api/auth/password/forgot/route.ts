import { NextResponse } from 'next/server'
import { getUserByIdentifier } from '@/features/auth/server/repository'
import { createResetToken } from '@/features/auth/server/passwordResetTokens'
import { sendPasswordResetEmail } from '@/features/auth/server/email'

const GENERIC_SUCCESS = { status: 'success', message: 'If this account can receive email, a reset link has been sent.' }

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(GENERIC_SUCCESS)
  }

  const identifier = String(body.identifier ?? '').trim()
  if (!identifier) return NextResponse.json(GENERIC_SUCCESS)

  try {
    const user = await getUserByIdentifier(identifier)
    if (user?.email) {
      const rawToken = await createResetToken(user.id)
      await sendPasswordResetEmail(user.email, rawToken).catch(() => {
        // Swallow send errors — always return generic success to avoid enumeration.
      })
    }
  } catch {
    // Swallow all errors — caller always gets generic success.
  }

  return NextResponse.json(GENERIC_SUCCESS)
}
