import { NextResponse } from 'next/server'
import { validateSignupInput, hashPassword, normalizeEmail, normalizeUsername } from '@/features/auth/server/password'
import { createCredentialUser, getUserByEmail, getUserByIdentifier } from '@/features/auth/server/repository'

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ status: 'error', message: 'Invalid request body' }, { status: 400 })
  }

  const input = {
    name: String(body.name ?? ''),
    email: String(body.email ?? ''),
    username: String(body.username ?? ''),
    password: String(body.password ?? ''),
    confirmPassword: String(body.confirmPassword ?? ''),
  }

  const { valid, errors } = validateSignupInput(input)
  if (!valid) {
    return NextResponse.json({ status: 'error', message: 'Validation failed', errors }, { status: 422 })
  }

  const emailNorm = normalizeEmail(input.email)
  const usernameNorm = normalizeUsername(input.username)

  const existingByEmail = await getUserByEmail(emailNorm)
  if (existingByEmail) {
    return NextResponse.json(
      { status: 'error', message: 'Validation failed', errors: { email: 'An account with this email already exists.' } },
      { status: 422 },
    )
  }

  const existingByUsername = await getUserByIdentifier(usernameNorm)
  if (existingByUsername) {
    return NextResponse.json(
      { status: 'error', message: 'Validation failed', errors: { username: 'This username is already taken.' } },
      { status: 422 },
    )
  }

  const passwordHash = await hashPassword(input.password)
  await createCredentialUser({ name: input.name, email: emailNorm, username: input.username, passwordHash })

  return NextResponse.json(
    { status: 'success', message: 'Account created.' },
    { status: 201 },
  )
}
