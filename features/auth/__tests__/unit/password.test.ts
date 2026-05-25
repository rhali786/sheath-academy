import {
  hashPassword,
  verifyPassword,
  normalizeEmail,
  normalizeUsername,
  validateSignupInput,
} from '@/features/auth/server/password'

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

describe('validateSignupInput', () => {
  const valid = {
    name: 'Ahmed Ali',
    email: 'ahmed@example.com',
    username: 'ahmed_ali',
    password: 'password123',
    confirmPassword: 'password123',
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

  test('requires password at least 8 chars', () => {
    const r = validateSignupInput({ ...valid, password: 'short', confirmPassword: 'short' })
    expect(r.valid).toBe(false)
    expect(r.errors.password).toBeDefined()
  })

  test('rejects mismatched confirm password', () => {
    const r = validateSignupInput({ ...valid, confirmPassword: 'different' })
    expect(r.valid).toBe(false)
    expect(r.errors.confirmPassword).toBeDefined()
  })
})
