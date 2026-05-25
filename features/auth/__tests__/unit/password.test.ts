import {
  hashPassword,
  verifyPassword,
  normalizeEmail,
  normalizeUsername,
  validateSignupInput,
} from '@/features/auth/server/password'
import { checkPasswordStrength, isPasswordStrong } from '@/features/auth/shared/passwordValidation'

describe('normalizeEmail', () => {
  test('lowercases and trims', () => {
    expect(normalizeEmail('  Parent@Example.COM  ')).toBe('parent@example.com')
  })
})

describe('normalizeUsername', () => {
  test('lowercases and trims', () => {
    expect(normalizeUsername('  Ahmad_99  ')).toBe('ahmad_99')
  })
})

describe('hashPassword / verifyPassword', () => {
  test('verifies a correct password', async () => {
    const hash = await hashPassword('mypassword123')
    expect(await verifyPassword('mypassword123', hash)).toBe(true)
  })

  test('rejects a wrong password', async () => {
    const hash = await hashPassword('mypassword123')
    expect(await verifyPassword('wrongpassword', hash)).toBe(false)
  })

  test('produces different hashes for the same password (random salt)', async () => {
    const h1 = await hashPassword('samepassword')
    const h2 = await hashPassword('samepassword')
    expect(h1).not.toBe(h2)
  })

  test('returns false for a malformed hash', async () => {
    expect(await verifyPassword('password', 'not-a-valid-hash')).toBe(false)
  })
}, 15000)

describe('checkPasswordStrength', () => {
  test('all criteria met for a strong password', () => {
    const s = checkPasswordStrength('Str0ng!Pass')
    expect(s).toEqual({ minLength: true, uppercase: true, lowercase: true, digit: true, special: true })
  })

  test('minLength false for short password', () => {
    expect(checkPasswordStrength('Abc1!').minLength).toBe(false)
  })

  test('uppercase false when missing', () => {
    expect(checkPasswordStrength('abc123!def').uppercase).toBe(false)
  })

  test('lowercase false when missing', () => {
    expect(checkPasswordStrength('ABC123!DEF').lowercase).toBe(false)
  })

  test('digit false when missing', () => {
    expect(checkPasswordStrength('AbcDef!ghi').digit).toBe(false)
  })

  test('special false when missing', () => {
    expect(checkPasswordStrength('Abcdef1234').special).toBe(false)
  })
})

describe('isPasswordStrong', () => {
  test('returns true for strong password', () => {
    expect(isPasswordStrong('Str0ng!Pass#1')).toBe(true)
  })

  test('rejects all-lowercase with digits', () => {
    expect(isPasswordStrong('12345678ab')).toBe(false)
  })

  test('rejects password without special character', () => {
    expect(isPasswordStrong('Password1234')).toBe(false)
  })

  test('rejects short password even if otherwise strong', () => {
    expect(isPasswordStrong('Abc1!')).toBe(false)
  })
})

describe('validateSignupInput', () => {
  const valid = {
    name: 'Ahmed Ali',
    email: 'ahmed@example.com',
    username: 'ahmed_ali',
    password: 'Secur3!Pass#',
    confirmPassword: 'Secur3!Pass#',
  }

  test('passes for valid input', () => {
    expect(validateSignupInput(valid).valid).toBe(true)
  })

  test('requires name', () => {
    const r = validateSignupInput({ ...valid, name: '' })
    expect(r.valid).toBe(false)
    expect(r.errors.name).toBeDefined()
  })

  test('requires valid email', () => {
    const r = validateSignupInput({ ...valid, email: 'notanemail' })
    expect(r.valid).toBe(false)
    expect(r.errors.email).toBeDefined()
  })

  test('requires username at least 3 chars', () => {
    const r = validateSignupInput({ ...valid, username: 'ab' })
    expect(r.valid).toBe(false)
    expect(r.errors.username).toBeDefined()
  })

  test('rejects username with invalid chars', () => {
    const r = validateSignupInput({ ...valid, username: 'bad username!' })
    expect(r.valid).toBe(false)
    expect(r.errors.username).toBeDefined()
  })

  test('rejects weak password (no uppercase, no special char)', () => {
    const r = validateSignupInput({ ...valid, password: 'password123', confirmPassword: 'password123' })
    expect(r.valid).toBe(false)
    expect(r.errors.password).toBeDefined()
  })

  test('rejects short password', () => {
    const r = validateSignupInput({ ...valid, password: 'Abc1!', confirmPassword: 'Abc1!' })
    expect(r.valid).toBe(false)
    expect(r.errors.password).toBeDefined()
  })

  test('rejects mismatched confirm password', () => {
    const r = validateSignupInput({ ...valid, confirmPassword: 'different' })
    expect(r.valid).toBe(false)
    expect(r.errors.confirmPassword).toBeDefined()
  })
})
