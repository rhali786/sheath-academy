/** @jest-environment node */

jest.mock('@/features/auth/auth', () => ({
  auth: jest.fn(),
}))

jest.mock('@/features/lib/server/tenant', () => ({
  resolveTenant: jest.fn(),
}))

jest.mock('@/features/children/server/repository', () => ({
  getLearner: jest.fn(),
}))

jest.mock('@/features/plan/server/repository', () => ({
  getLessonTaskRow: jest.fn(),
}))

jest.mock('@/features/attendance/server/repository', () => ({
  getAttendanceEvent: jest.fn(),
}))

jest.mock('@/features/quran/server/repository', () => ({
  getQuranSessionRow: jest.fn(),
}))

jest.mock('@/features/portfolio/server/repository', () => ({
  getEvidenceRow: jest.fn(),
}))

import { auth } from '@/features/auth/auth'
import { resolveTenant } from '@/features/lib/server/tenant'
import { getLearner } from '@/features/children/server/repository'
import {
  getAuthCtx,
  requireAuthCtx,
  assertOwnership,
  unauthorizedResponse,
  setupRequiredResponse,
} from '@/features/auth/server/context'
import { NotFoundError } from '@/features/auth/server/errors'
import { SEED_AUTH_CTX } from '@/features/auth/__tests__/helpers'

const mockAuth = auth as jest.Mock
const mockResolveTenant = resolveTenant as jest.Mock
const mockGetLearner = getLearner as jest.Mock

beforeEach(() => {
  mockAuth.mockReset()
  mockResolveTenant.mockReset()
  mockGetLearner.mockReset()
})

describe('getAuthCtx', () => {
  test('returns null when no session exists', async () => {
    mockAuth.mockResolvedValue(null)
    await expect(getAuthCtx()).resolves.toBeNull()
  })

  test('returns userId and householdId when session and tenant resolve', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', email: 'a@example.com' } })
    mockResolveTenant.mockResolvedValue({ userId: 'u1', householdId: 'hh1', timezone: 'UTC' })
    const result = await getAuthCtx()
    expect(result).toEqual({ userId: 'u1', householdId: 'hh1', timezone: 'UTC' })
  })

  test('returns null when resolveTenant throws', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', email: 'a@example.com' } })
    mockResolveTenant.mockRejectedValue(new Error('DB error'))
    await expect(getAuthCtx()).resolves.toBeNull()
  })
})

describe('requireAuthCtx', () => {
  test('returns 401 when no session', async () => {
    mockAuth.mockResolvedValue(null)
    const result = await requireAuthCtx({} as import('next/server').NextRequest)
    expect(result).toBeInstanceOf(Response)
    expect((result as Response).status).toBe(401)
  })

  test('returns 403 setup_required when householdId is empty', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u2', email: 'b@example.com' } })
    mockResolveTenant.mockResolvedValue({ userId: 'u2', householdId: '', timezone: 'UTC' })
    const result = await requireAuthCtx({} as import('next/server').NextRequest)
    expect((result as Response).status).toBe(403)
    const body = await (result as Response).json()
    expect(body.code).toBe('setup_required')
  })
})

describe('assertOwnership — learner', () => {
  test('resolves when learner exists in session household', async () => {
    mockGetLearner.mockResolvedValue({ id: 'learner_1', householdId: SEED_AUTH_CTX.householdId })
    await expect(assertOwnership(SEED_AUTH_CTX, 'learner', 'learner_1')).resolves.toBeUndefined()
  })

  test('throws NotFoundError when learner is not found', async () => {
    mockGetLearner.mockResolvedValue(null)
    await expect(assertOwnership(SEED_AUTH_CTX, 'learner', 'no_such_learner')).rejects.toThrow(NotFoundError)
  })

  test('throws NotFoundError for empty entityId', async () => {
    await expect(assertOwnership(SEED_AUTH_CTX, 'learner', '')).rejects.toThrow(NotFoundError)
  })
})

describe('response helpers', () => {
  test('unauthorizedResponse returns 401', () => {
    expect(unauthorizedResponse().status).toBe(401)
  })

  test('setupRequiredResponse returns 403 with setup_required code', async () => {
    const res = setupRequiredResponse()
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.code).toBe('setup_required')
  })
})
