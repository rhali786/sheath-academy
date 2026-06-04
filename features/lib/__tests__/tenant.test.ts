jest.mock('@/features/household/server/repository', () => ({
  upsertUserByEmail: jest.fn(),
  listHouseholdsForUser: jest.fn(),
  upsertHouseholdForUser: jest.fn(),
  getPendingInvitationsForEmail: jest.fn(),
  addMember: jest.fn(),
}))

jest.mock('@/features/settings/server/repository', () => ({
  getUserSetting: jest.fn(),
  setUserSetting: jest.fn(),
}))

import { devTenantContext, resolveTenant, type TenantContext } from '../server/tenant'
import {
  upsertUserByEmail,
  listHouseholdsForUser,
  upsertHouseholdForUser,
  getPendingInvitationsForEmail,
  addMember,
} from '@/features/household/server/repository'
import { getUserSetting, setUserSetting } from '@/features/settings/server/repository'

const mockUpsertUserByEmail = jest.mocked(upsertUserByEmail)
const mockListHouseholdsForUser = jest.mocked(listHouseholdsForUser)
const mockUpsertHouseholdForUser = jest.mocked(upsertHouseholdForUser)
const mockGetPendingInvitationsForEmail = jest.mocked(getPendingInvitationsForEmail)
const mockAddMember = jest.mocked(addMember)
const mockGetUserSetting = jest.mocked(getUserSetting)

const USER = { id: 'user_1', email: 'a@test.com', name: 'Alice' }
const HH_A = { householdId: 'hh_a', householdName: 'Household A', timezone: 'America/New_York', role: 'owner' as const, userId: 'user_1' }
const HH_B = { householdId: 'hh_b', householdName: 'Household B', timezone: 'America/Chicago', role: 'member' as const, userId: 'user_1' }

beforeEach(() => {
  jest.clearAllMocks()
  mockUpsertUserByEmail.mockResolvedValue(USER as any)
  mockGetPendingInvitationsForEmail.mockResolvedValue([])
  mockGetUserSetting.mockResolvedValue(undefined)
  mockAddMember.mockResolvedValue({} as any)
})

describe('resolveTenant', () => {
  it('throws when session has no email', async () => {
    await expect(resolveTenant(null)).rejects.toThrow('Unauthenticated')
    await expect(resolveTenant({ user: {} })).rejects.toThrow('Unauthenticated')
  })

  it('creates a new household for a brand-new user with no memberships', async () => {
    mockListHouseholdsForUser.mockResolvedValue([])
    const newHh = { id: 'hh_new', timezone: 'America/New_York' }
    mockUpsertHouseholdForUser.mockResolvedValue(newHh)

    const result = await resolveTenant({ user: { email: 'a@test.com', name: 'Alice' } })

    expect(mockUpsertHouseholdForUser).toHaveBeenCalledWith(USER.id)
    expect(result.userId).toBe(USER.id)
    expect(result.householdId).toBe('hh_new')
    expect(result.memberships).toHaveLength(1)
  })

  it('uses the only membership when user has exactly one', async () => {
    mockListHouseholdsForUser.mockResolvedValue([HH_A])

    const result = await resolveTenant({ user: { email: 'a@test.com' } })

    expect(mockUpsertHouseholdForUser).not.toHaveBeenCalled()
    expect(result.householdId).toBe('hh_a')
    expect(result.memberships).toHaveLength(1)
  })

  it('returns all memberships when user belongs to multiple households', async () => {
    mockListHouseholdsForUser.mockResolvedValue([HH_A, HH_B])

    const result = await resolveTenant({ user: { email: 'a@test.com' } })

    expect(result.memberships).toHaveLength(2)
  })

  it('uses the saved active_household_id when it is a valid membership', async () => {
    mockListHouseholdsForUser.mockResolvedValue([HH_A, HH_B])
    mockGetUserSetting.mockResolvedValue('hh_b')

    const result = await resolveTenant({ user: { email: 'a@test.com' } })

    expect(result.householdId).toBe('hh_b')
    expect(result.timezone).toBe('America/Chicago')
  })

  it('falls back to first membership when saved active_household_id is not a valid membership', async () => {
    mockListHouseholdsForUser.mockResolvedValue([HH_A, HH_B])
    mockGetUserSetting.mockResolvedValue('hh_stale_or_removed')

    const result = await resolveTenant({ user: { email: 'a@test.com' } })

    expect(result.householdId).toBe('hh_a')
  })

  it('accepts pending invitations for this email before resolving memberships', async () => {
    const pendingInvite = { householdId: 'hh_invited', role: 'member', id: 'inv_1' }
    mockGetPendingInvitationsForEmail.mockResolvedValue([pendingInvite])
    mockListHouseholdsForUser.mockResolvedValue([HH_A, { ...HH_B, householdId: 'hh_invited' }])

    await resolveTenant({ user: { email: 'a@test.com' } })

    expect(mockAddMember).toHaveBeenCalledWith('hh_invited', USER.id, 'member')
  })
})



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
