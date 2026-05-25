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
  test('returns null when token is not found', async () => {
    const mockDb = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
    }
    mockGetDb.mockReturnValue(mockDb)

    const { useResetToken } = await import('@/features/auth/server/passwordResetTokens')
    const result = await useResetToken('invalidtoken')
    expect(result).toBeNull()
  })

  test('returns userId and marks token used when found', async () => {
    const fakeRow = { id: 'prt_1', userId: 'user_abc', tokenHash: 'h', expiresAt: new Date(Date.now() + 3600000), usedAt: null }
    const updateWhere = jest.fn().mockResolvedValue(undefined)
    const mockDb = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([fakeRow]),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnValue({ where: updateWhere }),
    }
    mockGetDb.mockReturnValue(mockDb)

    const { createResetToken } = await import('@/features/auth/server/passwordResetTokens')
    // We can't easily produce a valid hash match without real DB, but test the return path directly
    // by ensuring mark-used fires when rows are found:
    const result = await import('@/features/auth/server/passwordResetTokens')
    // Re-test via useResetToken with mocked rows returned:
    mockGetDb.mockReturnValue(mockDb)
    const userId = await result.useResetToken('any-token')
    expect(userId).toBe('user_abc')
    expect(updateWhere).toHaveBeenCalled()
  })
})
