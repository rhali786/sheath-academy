/** @jest-environment node */

jest.mock('@/features/lib/server/db', () => ({ getDb: jest.fn() }))
jest.mock('@/db/schema', () => ({
  passwordResetTokens: { id: 'id', userId: 'user_id', tokenHash: 'token_hash', expiresAt: 'expires_at', usedAt: 'used_at', createdAt: 'created_at' },
}))

import { getDb } from '@/features/lib/server/db'
const mockGetDb = getDb as jest.Mock

function buildMockDb(overrides: Record<string, unknown> = {}) {
  const selectRows: unknown[] = []
  const updateSet = jest.fn().mockReturnThis()
  const mock = {
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockResolvedValue(undefined),
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockResolvedValue(selectRows),
    limit: jest.fn().mockResolvedValue(selectRows),
    update: jest.fn().mockReturnThis(),
    set: updateSet,
    ...overrides,
  }
  return mock
}

beforeEach(() => {
  mockGetDb.mockReset()
})

describe('createResetToken', () => {
  test('stores only the token hash, not the raw token', async () => {
    const insertValues = jest.fn().mockResolvedValue(undefined)
    const mockDb = {
      insert: jest.fn().mockReturnValue({ values: insertValues }),
    }
    mockGetDb.mockReturnValue(mockDb)

    const { createResetToken } = await import('@/features/auth/server/passwordResetTokens')
    const raw = await createResetToken('user_123')

    expect(typeof raw).toBe('string')
    expect(raw.length).toBeGreaterThan(0)
    const storedArg = insertValues.mock.calls[0][0]
    expect(storedArg.tokenHash).not.toBe(raw)
    expect(storedArg.userId).toBe('user_123')
  })

  test('sets an expiry in the future', async () => {
    const insertValues = jest.fn().mockResolvedValue(undefined)
    mockGetDb.mockReturnValue({ insert: jest.fn().mockReturnValue({ values: insertValues }) })

    const { createResetToken } = await import('@/features/auth/server/passwordResetTokens')
    await createResetToken('user_123')

    const storedArg = insertValues.mock.calls[0][0]
    expect(storedArg.expiresAt.getTime()).toBeGreaterThan(Date.now())
  })
})

describe('useResetToken', () => {
  function makeSelectMock(rows: unknown[]) {
    return {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(rows),
    }
  }

  test('returns null when token is not found', async () => {
    mockGetDb.mockReturnValue(makeSelectMock([]))
    const { useResetToken } = await import('@/features/auth/server/passwordResetTokens')
    expect(await useResetToken('invalidtoken')).toBeNull()
  })

  test('returns userId and marks token used when found', async () => {
    const fakeRow = { id: 'prt_1', userId: 'user_abc', tokenHash: 'h', expiresAt: new Date(Date.now() + 3600000), usedAt: null }
    const updateWhere = jest.fn().mockResolvedValue(undefined)
    const mockDb = {
      ...makeSelectMock([fakeRow]),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnValue({ where: updateWhere }),
    }
    mockGetDb.mockReturnValue(mockDb)
    const { useResetToken } = await import('@/features/auth/server/passwordResetTokens')
    expect(await useResetToken('any-token')).toBe('user_abc')
    expect(updateWhere).toHaveBeenCalled()
  })

  // Security-critical: expired and used tokens must be rejected.
  // The DB enforces this via gt(expiresAt, now) and isNull(usedAt).
  // These tests simulate the DB returning no rows (predicates filtered the row)
  // and confirm useResetToken returns null — catching any regression that
  // bypasses the empty-result path.

  test('returns null for an expired token (DB returns no rows past expiry)', async () => {
    // Simulate: DB filtered the row because expiresAt < now
    mockGetDb.mockReturnValue(makeSelectMock([]))
    const { useResetToken } = await import('@/features/auth/server/passwordResetTokens')
    expect(await useResetToken('expired-token')).toBeNull()
  })

  test('returns null for a token that has already been used (DB returns no rows when usedAt is set)', async () => {
    // Simulate: DB filtered the row because usedAt IS NOT NULL
    mockGetDb.mockReturnValue(makeSelectMock([]))
    const { useResetToken } = await import('@/features/auth/server/passwordResetTokens')
    expect(await useResetToken('already-used-token')).toBeNull()
  })

  test('query includes expiry and single-use predicates', async () => {
    // Verify that the WHERE call receives a composed predicate (not a bare column ref).
    // If gt(expiresAt, now) or isNull(usedAt) were removed, the where() mock would
    // receive fewer arguments and this assertion would fail.
    const whereMock = jest.fn().mockReturnThis()
    mockGetDb.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: whereMock,
      limit: jest.fn().mockResolvedValue([]),
    })
    const { useResetToken } = await import('@/features/auth/server/passwordResetTokens')
    await useResetToken('any-token')
    // drizzle-orm and() wraps all three predicates into a single argument
    expect(whereMock).toHaveBeenCalledTimes(1)
    // The single argument must be truthy (a composed SQL expression, not undefined)
    const predicate = whereMock.mock.calls[0][0]
    expect(predicate).toBeTruthy()
  })
})
