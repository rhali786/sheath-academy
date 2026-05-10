import { memoryAdapter, clearAdapterState } from '@/features/auth/lib/memoryAdapter'

beforeEach(() => {
  clearAdapterState()
})

describe('memoryAdapter — verification tokens', () => {
  const token = {
    identifier: 'parent@example.com',
    token: 'tok_abc123',
    expires: new Date(Date.now() + 15 * 60 * 1000),
  }

  test('createVerificationToken stores and returns the token', async () => {
    const result = await memoryAdapter.createVerificationToken!(token)
    expect(result).toEqual(token)
  })

  test('useVerificationToken returns token and removes it (single-use)', async () => {
    await memoryAdapter.createVerificationToken!(token)
    const result = await memoryAdapter.useVerificationToken!({
      identifier: token.identifier,
      token: token.token,
    })
    expect(result).toEqual(token)

    // second call must return null — token consumed
    const second = await memoryAdapter.useVerificationToken!({
      identifier: token.identifier,
      token: token.token,
    })
    expect(second).toBeNull()
  })

  test('useVerificationToken returns null for unknown token', async () => {
    const result = await memoryAdapter.useVerificationToken!({
      identifier: 'parent@example.com',
      token: 'does_not_exist',
    })
    expect(result).toBeNull()
  })

  test('useVerificationToken returns null when identifier does not match', async () => {
    await memoryAdapter.createVerificationToken!(token)
    const result = await memoryAdapter.useVerificationToken!({
      identifier: 'wrong@example.com',
      token: token.token,
    })
    expect(result).toBeNull()
    // original token must still be present (not consumed on mismatch)
    const retry = await memoryAdapter.useVerificationToken!({
      identifier: token.identifier,
      token: token.token,
    })
    expect(retry).toEqual(token)
  })
})

describe('memoryAdapter — users', () => {
  const newUser = {
    email: 'parent@example.com',
    emailVerified: null as Date | null,
    name: 'Test Parent',
    image: null as string | null,
  }

  test('createUser returns user with generated id', async () => {
    const user = await memoryAdapter.createUser!(newUser)
    expect(user.id).toBeTruthy()
    expect(user.email).toBe(newUser.email)
  })

  test('getUser returns created user by id', async () => {
    const created = await memoryAdapter.createUser!(newUser)
    const fetched = await memoryAdapter.getUser!(created.id)
    expect(fetched).toEqual(created)
  })

  test('getUser returns null for unknown id', async () => {
    const result = await memoryAdapter.getUser!('unknown')
    expect(result).toBeNull()
  })

  test('getUserByEmail returns user matching email', async () => {
    const created = await memoryAdapter.createUser!(newUser)
    const fetched = await memoryAdapter.getUserByEmail!(newUser.email)
    expect(fetched).toEqual(created)
  })

  test('getUserByEmail returns null when no match', async () => {
    const result = await memoryAdapter.getUserByEmail!('nobody@example.com')
    expect(result).toBeNull()
  })

  test('updateUser merges fields and returns updated user', async () => {
    const created = await memoryAdapter.createUser!(newUser)
    const updated = await memoryAdapter.updateUser!({ id: created.id, name: 'Updated Name' })
    expect(updated.name).toBe('Updated Name')
    expect(updated.email).toBe(newUser.email)
  })

  test('clearAdapterState wipes all users and tokens', async () => {
    await memoryAdapter.createUser!(newUser)
    clearAdapterState()
    const result = await memoryAdapter.getUserByEmail!(newUser.email)
    expect(result).toBeNull()
  })
})
