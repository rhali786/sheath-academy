/** @jest-environment node */

jest.mock('@/features/auth/auth', () => ({
  auth: jest.fn(),
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
import { getLearner } from '@/features/children/server/repository'
import {
  getAuthCtx,
  requireAuthCtx,
  assertOwnership,
  unauthorizedResponse,
  setupRequiredResponse,
} from '@/features/auth/server/context'
import {
  getRequestAuthCtx,
  runWithAuthCtx,
  tryGetRequestAuthCtx,
} from '@/features/auth/server/requestAuth'
import { NotFoundError } from '@/features/auth/server/errors'
import { SEED_AUTH_CTX } from '@/features/auth/__tests__/helpers'

const mockAuth = auth as jest.Mock
const mockGetLearner = getLearner as jest.Mock

const JWT_SESSION = {
  user: {
    email: 'a@example.com',
    userId: 'u1',
    householdId: 'hh1',
    timezone: 'UTC',
  },
}

beforeEach(() => {
  mockAuth.mockReset()
  mockGetLearner.mockReset()
})

describe('getAuthCtx', () => {
  test('returns null when no session exists', async () => {
    mockAuth.mockResolvedValue(null)
    await expect(getAuthCtx()).resolves.toBeNull()
  })

  test('returns JWT tenant claims when session has userId and householdId', async () => {
    mockAuth.mockResolvedValue(JWT_SESSION)
    const result = await getAuthCtx()
    expect(result).toEqual({
      userId: 'u1',
      householdId: 'hh1',
      email: 'a@example.com',
      timezone: 'UTC',
    })
    expect(mockAuth).toHaveBeenCalledTimes(1)
  })

  test('returns request-scoped ctx without calling auth when inside API dispatch', async () => {
    const scoped = {
      userId: 'scoped-user',
      householdId: 'scoped-hh',
      email: 'scoped@example.com',
      timezone: 'America/New_York',
    }
    await runWithAuthCtx(scoped, async () => {
      await expect(getAuthCtx()).resolves.toEqual(scoped)
      expect(mockAuth).not.toHaveBeenCalled()
    })
  })

  test('returns null when session email exists but tenant claims are missing', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'a@example.com' } })
    await expect(getAuthCtx()).resolves.toBeNull()
  })
})

describe('requestAuth', () => {
  test('getRequestAuthCtx throws outside API dispatch', () => {
    expect(() => getRequestAuthCtx()).toThrow(/outside API dispatch/)
  })

  test('tryGetRequestAuthCtx returns undefined outside dispatch', () => {
    expect(tryGetRequestAuthCtx()).toBeUndefined()
  })

  test('runWithAuthCtx exposes ctx to nested async calls', async () => {
    const ctx = { userId: 'u1', householdId: 'hh1', email: 'a@example.com' }
    await runWithAuthCtx(ctx, async () => {
      expect(getRequestAuthCtx()).toEqual(ctx)
      await Promise.resolve()
      expect(tryGetRequestAuthCtx()).toEqual(ctx)
    })
  })
})

describe('requireAuthCtx', () => {
  test('returns 401 when no session', async () => {
    mockAuth.mockResolvedValue(null)
    const result = await requireAuthCtx({} as import('next/server').NextRequest)
    expect(result).toBeInstanceOf(Response)
    expect((result as Response).status).toBe(401)
  })

  test('returns 403 setup_required when householdId is missing from JWT', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'b@example.com', userId: 'u2' } })
    const result = await requireAuthCtx({} as import('next/server').NextRequest)
    expect((result as Response).status).toBe(403)
    const body = await (result as Response).json()
    expect(body.code).toBe('setup_required')
  })

  test('returns AuthCtx when JWT has tenant claims', async () => {
    mockAuth.mockResolvedValue(JWT_SESSION)
    const result = await requireAuthCtx({} as import('next/server').NextRequest)
    expect(result).toEqual({
      userId: 'u1',
      householdId: 'hh1',
      email: 'a@example.com',
      timezone: 'UTC',
    })
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
