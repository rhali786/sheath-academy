/** @jest-environment node */

import {
  getAuthCtx,
  requireAuthCtx,
  assertOwnership,
  unauthorizedResponse,
  setupRequiredResponse,
} from '@/features/auth/server/context'
import { NotFoundError } from '@/features/auth/server/errors'
import { SEED_AUTH_CTX } from '@/features/auth/__tests__/helpers'
import { SEED_IDS } from '@/features/lib/seedIds'
import { createStudentProfile, resetStore as resetChildrenStore } from '@/features/children/server/service'

jest.mock('@/features/auth/auth', () => ({
  auth: jest.fn(),
}))

jest.mock('@/features/lib/server/db', () => ({
  isPostgresMode: jest.fn(() => false),
}))

jest.mock('@/features/lib/server/tenant', () => ({
  resolveTenant: jest.fn(),
}))

jest.mock('@/features/household/server/service', () => ({
  getHouseholdProfile: jest.fn(),
}))

import { auth } from '@/features/auth/auth'
import { getHouseholdProfile } from '@/features/household/server/service'

const mockAuth = auth as jest.Mock
const mockGetHouseholdProfile = getHouseholdProfile as jest.Mock

beforeEach(() => {
  resetChildrenStore()
  mockAuth.mockReset()
  mockGetHouseholdProfile.mockReset()
})

describe('getAuthCtx', () => {
  test('returns null when no session exists', async () => {
    mockAuth.mockResolvedValue(null)
    await expect(getAuthCtx()).resolves.toBeNull()
  })

  test('returns userId and householdId for user with an existing household', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user_a', email: 'a@example.com' },
    })
    mockGetHouseholdProfile.mockReturnValue({
      id: SEED_IDS.household,
      workspaceId: SEED_IDS.workspace,
      familyName: 'Test',
      createdAt: new Date().toISOString(),
    })
    await expect(getAuthCtx()).resolves.toEqual({
      userId: 'user_a',
      householdId: SEED_IDS.household,
    })
  })

  test('returns empty householdId for new user with no household row yet', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user_new', email: 'new@example.com' },
    })
    mockGetHouseholdProfile.mockReturnValue(null)
    await expect(getAuthCtx()).resolves.toEqual({
      userId: 'user_new',
      householdId: '',
    })
  })
})

describe('requireAuthCtx', () => {
  test('returns 401 Response when no session', async () => {
    mockAuth.mockResolvedValue(null)
    const result = await requireAuthCtx({} as import('next/server').NextRequest)
    expect(result).toBeInstanceOf(Response)
    expect((result as Response).status).toBe(401)
    const body = await (result as Response).json()
    expect(body.status).toBe('error')
  })

  test('returns 403 setup_required when householdId is empty', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user_new', email: 'new@example.com' },
    })
    mockGetHouseholdProfile.mockReturnValue(null)
    const result = await requireAuthCtx({} as import('next/server').NextRequest)
    expect(result).toBeInstanceOf(Response)
    expect((result as Response).status).toBe(403)
    const body = await (result as Response).json()
    expect(body.code).toBe('setup_required')
  })
})

describe('assertOwnership — learner', () => {
  test('resolves for a learner owned by the session household', async () => {
    const profile = createStudentProfile({
      householdId: SEED_AUTH_CTX.householdId,
      name: 'Owned',
      gradeLabel: 'G1',
      username: 'owned',
      password: 'p',
    })
    await expect(
      assertOwnership(SEED_AUTH_CTX, 'learner', profile.id),
    ).resolves.toBeUndefined()
  })

  test('throws NotFoundError for a learner from a different household', async () => {
    const foreign = createStudentProfile({
      householdId: 'other_household',
      name: 'Foreign',
      gradeLabel: 'G2',
      username: 'foreign',
      password: 'p',
    })
    await expect(
      assertOwnership(SEED_AUTH_CTX, 'learner', foreign.id),
    ).rejects.toThrow(NotFoundError)
  })
})

describe('response helpers', () => {
  test('unauthorizedResponse returns 401 JSON', async () => {
    const res = unauthorizedResponse()
    expect(res.status).toBe(401)
  })

  test('setupRequiredResponse returns 403 with setup_required code', async () => {
    const res = setupRequiredResponse()
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.code).toBe('setup_required')
  })
})
