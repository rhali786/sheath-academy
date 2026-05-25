import { scrypt, timingSafeEqual, randomBytes, type ScryptOptions } from 'crypto'
import { checkPasswordStrength, isPasswordStrong } from '@/features/auth/shared/passwordValidation'
export { checkPasswordStrength, isPasswordStrong } from '@/features/auth/shared/passwordValidation'
export type { PasswordStrength } from '@/features/auth/shared/passwordValidation'

function scryptAsync(password: string, salt: string, keylen: number, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keylen, options, (err, derived) => {
      if (err) reject(err)
      else resolve(derived)
    })
  })
}

const SCRYPT_N = 16384
const SCRYPT_R = 8
const SCRYPT_P = 1
const KEY_LEN = 64
const SALT_LEN = 16

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LEN).toString('hex')
  const derived = (await scryptAsync(password, salt, KEY_LEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P })) as Buffer
  return `scrypt:${SCRYPT_N}:${SCRYPT_R}:${SCRYPT_P}:${salt}:${derived.toString('hex')}`
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split(':')
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false
  const [, N, r, p, salt, hashHex] = parts
  try {
    const derived = (await scryptAsync(password, salt, KEY_LEN, {
      N: parseInt(N, 10),
      r: parseInt(r, 10),
      p: parseInt(p, 10),
    })) as Buffer
    const stored = Buffer.from(hashHex, 'hex')
    if (derived.length !== stored.length) return false
    return timingSafeEqual(derived, stored)
  } catch {
    return false
  }
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase()
}

export interface SignupInput {
  name: string
  email: string
  username: string
  password: string
  confirmPassword: string
}

export interface ValidationResult {
  valid: boolean
  errors: Record<string, string>
}

export function validateSignupInput(data: SignupInput): ValidationResult {
  const errors: Record<string, string> = {}

  if (!data.name.trim()) errors.name = 'Name is required.'
  if (!data.email.trim()) {
    errors.email = 'Email is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.email = 'Enter a valid email address.'
  }

  if (!data.username.trim()) {
    errors.username = 'Username is required.'
  } else if (data.username.trim().length < 3) {
    errors.username = 'Username must be at least 3 characters.'
  } else if (!/^[a-zA-Z0-9_-]+$/.test(data.username.trim())) {
    errors.username = 'Username may only contain letters, numbers, hyphens, and underscores.'
  }

  if (!data.password) {
    errors.password = 'Password is required.'
  } else if (!isPasswordStrong(data.password)) {
    errors.password = 'Password does not meet the requirements below.'
  }

  if (!data.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password.'
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.'
  }

  return { valid: Object.keys(errors).length === 0, errors }
}
