/** @jest-environment node */

jest.mock('../../server/repository', () => ({
  getActiveParticipant: jest.fn(),
  createDirectConversation: jest.fn(),
  getUserByEmail: jest.fn(),
  getUnreadTotal: jest.fn(),
}))

import {
  assertConversationParticipant,
  assertConversationAdmin,
  openDirectConversation,
  getUnreadCount,
  MessagingError,
} from '../../server/service'
import {
  getActiveParticipant,
  createDirectConversation,
  getUserByEmail,
  getUnreadTotal,
} from '../../server/repository'

const mockGetActiveParticipant = getActiveParticipant as jest.Mock
const mockCreateDirectConversation = createDirectConversation as jest.Mock
const mockGetUserByEmail = getUserByEmail as jest.Mock
const mockGetUnreadTotal = getUnreadTotal as jest.Mock

beforeEach(() => {
  mockGetActiveParticipant.mockReset()
  mockCreateDirectConversation.mockReset()
  mockGetUserByEmail.mockReset()
  mockGetUnreadTotal.mockReset()
})

// ── 1. assertConversationParticipant ──────────────────────────────────────────

describe('assertConversationParticipant', () => {
  it('throws MessagingError(403) when user is not an active participant', async () => {
    mockGetActiveParticipant.mockResolvedValue(null)
    await expect(assertConversationParticipant('conv_1', 'user_x')).rejects.toThrow(MessagingError)
    await expect(assertConversationParticipant('conv_1', 'user_x')).rejects.toMatchObject({
      status: 403,
    })
  })

  it('resolves without error when user is an active participant', async () => {
    mockGetActiveParticipant.mockImplementation(async () => ({
      id: 'cp_1',
      role: 'member',
      leftAt: null,
    }))
    await expect(assertConversationParticipant('conv_1', 'user_a')).resolves.toBeUndefined()
  })
})

// ── 2. assertConversationAdmin ────────────────────────────────────────────────

describe('assertConversationAdmin', () => {
  it('throws MessagingError(403) when user is not a participant', async () => {
    mockGetActiveParticipant.mockResolvedValue(null)
    await expect(assertConversationAdmin('conv_1', 'user_x')).rejects.toThrow(MessagingError)
    await expect(assertConversationAdmin('conv_1', 'user_x')).rejects.toMatchObject({ status: 403 })
  })

  it('throws MessagingError(403) when user is a member (not admin)', async () => {
    mockGetActiveParticipant.mockImplementation(async () => ({
      id: 'cp_1',
      role: 'member',
      leftAt: null,
    }))
    await expect(assertConversationAdmin('conv_1', 'user_b')).rejects.toThrow(MessagingError)
    await expect(assertConversationAdmin('conv_1', 'user_b')).rejects.toMatchObject({ status: 403 })
  })

  it('resolves without error when user is admin', async () => {
    mockGetActiveParticipant.mockImplementation(async () => ({
      id: 'cp_1',
      role: 'admin',
      leftAt: null,
    }))
    await expect(assertConversationAdmin('conv_1', 'user_a')).resolves.toBeUndefined()
  })
})

// ── 3. openDirectConversation — dedupe path via service ───────────────────────

describe('openDirectConversation', () => {
  const fakeConv = { id: 'conv_42', type: 'direct', title: null, createdByUserId: 'user_a' }

  it('delegates to createDirectConversation with a userId target', async () => {
    mockCreateDirectConversation.mockResolvedValue(fakeConv)
    const result = await openDirectConversation('user_a', { userId: 'user_b' })
    expect(mockCreateDirectConversation).toHaveBeenCalledWith('user_a', 'user_b')
    expect(result).toBe(fakeConv)
  })

  it('returns the same conversation on repeated calls for the same pair (dedupe via repo)', async () => {
    mockCreateDirectConversation.mockResolvedValue(fakeConv)
    const first = await openDirectConversation('user_a', { userId: 'user_b' })
    const second = await openDirectConversation('user_a', { userId: 'user_b' })
    expect(first.id).toBe(second.id)
    expect(mockCreateDirectConversation).toHaveBeenCalledTimes(2)
  })

  it('resolves by email when the email maps to a known user', async () => {
    mockGetUserByEmail.mockImplementation(async () => ({ id: 'user_b', email: 'b@test.com' }))
    mockCreateDirectConversation.mockResolvedValue(fakeConv)
    const result = await openDirectConversation('user_a', { email: 'b@test.com' })
    expect(mockGetUserByEmail).toHaveBeenCalledWith('b@test.com')
    expect(mockCreateDirectConversation).toHaveBeenCalledWith('user_a', 'user_b')
    expect(result).toBe(fakeConv)
  })

  it('throws MessagingError(404) and does not create a conversation for an unknown email', async () => {
    mockGetUserByEmail.mockImplementation(async () => null)
    await expect(
      openDirectConversation('user_a', { email: 'nobody@test.com' }),
    ).rejects.toThrow(MessagingError)
    await expect(
      openDirectConversation('user_a', { email: 'nobody@test.com' }),
    ).rejects.toMatchObject({ status: 404 })
    expect(mockCreateDirectConversation).not.toHaveBeenCalled()
  })

  it('throws MessagingError(400) and does not create a conversation when targeting self by userId', async () => {
    await expect(
      openDirectConversation('user_a', { userId: 'user_a' }),
    ).rejects.toMatchObject({ status: 400, message: expect.stringMatching(/cannot start a conversation with yourself/i) })
    expect(mockCreateDirectConversation).not.toHaveBeenCalled()
  })

  it('throws MessagingError(400) and does not create a conversation when targeting self by email', async () => {
    mockGetUserByEmail.mockImplementation(async () => ({ id: 'user_a', email: 'a@test.com' }))
    await expect(
      openDirectConversation('user_a', { email: 'a@test.com' }),
    ).rejects.toMatchObject({ status: 400, message: expect.stringMatching(/cannot start a conversation with yourself/i) })
    expect(mockCreateDirectConversation).not.toHaveBeenCalled()
  })
})

// ── 4. getUnreadCount — unread math via service ───────────────────────────────

describe('getUnreadCount', () => {
  it('delegates to getUnreadTotal and returns the count', async () => {
    mockGetUnreadTotal.mockImplementation(async () => 7)
    const count = await getUnreadCount('user_a')
    expect(mockGetUnreadTotal).toHaveBeenCalledWith('user_a')
    expect(count).toBe(7)
  })

  it('returns 0 when user has no unread messages', async () => {
    mockGetUnreadTotal.mockImplementation(async () => 0)
    const count = await getUnreadCount('user_a')
    expect(count).toBe(0)
  })
})
