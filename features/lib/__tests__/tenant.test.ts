import { devTenantContext, type TenantContext } from '../server/tenant'

describe('devTenantContext', () => {
  const originalEnv = process.env

  afterEach(() => {
    process.env = originalEnv
  })

  it('returns a TenantContext with userId, householdId, and timezone', () => {
    const ctx = devTenantContext()
    expect(ctx).toHaveProperty('userId')
    expect(ctx).toHaveProperty('householdId')
    expect(ctx).toHaveProperty('timezone')
  })

  it('uses DEV_SEED_USER_EMAIL as userId when set', () => {
    process.env = { ...originalEnv, DEV_SEED_USER_EMAIL: 'test@example.com' }
    const ctx = devTenantContext()
    expect(ctx.userId).toBe('test@example.com')
  })

  it('falls back to dev@sheathacademy.ai when DEV_SEED_USER_EMAIL is not set', () => {
    process.env = { ...originalEnv, DEV_SEED_USER_EMAIL: undefined }
    const ctx = devTenantContext()
    expect(ctx.userId).toBe('dev@sheathacademy.ai')
  })

  it('returns a non-empty householdId', () => {
    const ctx = devTenantContext()
    expect(ctx.householdId.length).toBeGreaterThan(0)
  })

  it('returns a valid IANA timezone string', () => {
    const ctx = devTenantContext()
    // Verify it's a usable timezone string by using it with Intl
    expect(() => new Intl.DateTimeFormat('en', { timeZone: ctx.timezone })).not.toThrow()
  })
})

describe('TenantContext type shape', () => {
  it('is assignable from a plain object with the required fields', () => {
    // Compile-time type check via assignment
    const ctx: TenantContext = {
      userId: 'user-1',
      householdId: 'household-1',
      timezone: 'UTC',
    }
    expect(ctx.userId).toBe('user-1')
    expect(ctx.householdId).toBe('household-1')
    expect(ctx.timezone).toBe('UTC')
  })
})
