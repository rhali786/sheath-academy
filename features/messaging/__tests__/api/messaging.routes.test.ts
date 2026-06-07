/** @jest-environment node */

jest.mock('@/features/auth/server/requestAuth', () => {
  const { mockRequestAuthModule } = require('@/features/auth/__tests__/helpers')
  return mockRequestAuthModule({ userId: 'user_a', householdId: 'hh_a', email: 'a@test.com' })
})

jest.mock('@/features/messaging/server/service', () => {
  class MessagingError extends Error {
    status: number
    constructor(status: number, message: string) {
      super(message)
      this.status = status
      this.name = 'MessagingError'
    }
  }
  return {
    MessagingError,
    openDirectConversation: jest.fn(),
    assertConversationParticipant: jest.fn(),
    assertConversationAdmin: jest.fn(),
    getUnreadCount: jest.fn(),
  }
})

jest.mock('@/features/messaging/server/repository', () => ({
  listConversationsForUser: jest.fn(),
  getConversationForUser: jest.fn(),
  loadConversationDetailForUser: jest.fn(),
  insertMessage: jest.fn(),
  listMessagesAfter: jest.fn(),
  markRead: jest.fn(),
  addParticipant: jest.fn(),
  removeParticipant: jest.fn(),
  selfLeave: jest.fn(),
  getAttachment: jest.fn(),
  getActiveParticipant: jest.fn(),
  createGroupConversation: jest.fn(),
}))

jest.mock('@/features/messaging/api/attachmentUtils', () => ({
  resolveAttachmentConversation: jest.fn(),
}))

import {
  MessagingError,
  openDirectConversation,
  assertConversationParticipant,
  assertConversationAdmin,
  getUnreadCount,
} from '@/features/messaging/server/service'
import {
  insertMessage,
  listMessagesAfter,
  addParticipant,
  selfLeave,
  getAttachment,
  listConversationsForUser,
  getConversationForUser,
  loadConversationDetailForUser,
} from '@/features/messaging/server/repository'
import { resolveAttachmentConversation } from '@/features/messaging/api/attachmentUtils'
import { POST as postConversations } from '@/features/messaging/api/routes/conversations'
import { GET as getConversationDetail } from '@/features/messaging/api/routes/conversation-detail'
import {
  GET as getMessages,
  POST as postMessage,
} from '@/features/messaging/api/routes/conversation-messages'
import {
  POST as postParticipants,
  DELETE as deleteParticipant,
} from '@/features/messaging/api/routes/conversation-participants'
import { GET as getAttachmentRoute } from '@/features/messaging/api/routes/attachments'
import { GET as getUnread } from '@/features/messaging/api/routes/unread'

const mockOpenDirectConversation = jest.mocked(openDirectConversation)
const mockAssertConversationParticipant = jest.mocked(assertConversationParticipant)
const mockAssertConversationAdmin = jest.mocked(assertConversationAdmin)
const mockGetUnreadCount = jest.mocked(getUnreadCount)
const mockInsertMessage = jest.mocked(insertMessage)
const mockListMessagesAfter = jest.mocked(listMessagesAfter)
const mockAddParticipant = jest.mocked(addParticipant)
const mockSelfLeave = jest.mocked(selfLeave)
const mockGetAttachment = jest.mocked(getAttachment)
const mockListConversationsForUser = jest.mocked(listConversationsForUser)
const mockGetConversationForUser = jest.mocked(getConversationForUser)
const mockLoadConversationDetailForUser = jest.mocked(loadConversationDetailForUser)
const mockResolveAttachmentConversation = jest.mocked(resolveAttachmentConversation)

function makeRequest(method: string, url: string, body?: unknown): Request {
  return new Request(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  mockAssertConversationParticipant.mockResolvedValue(undefined)
  mockAssertConversationAdmin.mockResolvedValue(undefined)
  mockSelfLeave.mockResolvedValue(undefined)
  mockAddParticipant.mockResolvedValue(undefined)
})

// ── 1. POST /conversations {email} unknown user → friendly 404 ────────────────

describe('POST /conversations — direct via email', () => {
  it('returns 404 with a friendly message when email matches no account', async () => {
    mockOpenDirectConversation.mockRejectedValue(
      new MessagingError(404, 'No account found for that email'),
    )
    const req = makeRequest('POST', 'http://localhost/api/messaging/conversations', {
      type: 'direct',
      target: { email: 'nobody@test.com' },
    })
    const res = await postConversations(req)
    const body = await res.json()
    expect(res.status).toBe(404)
    expect(body.status).toBe('error')
    expect(body.message).toMatch(/no account/i)
  })

  it('does not create a user when email is unknown', async () => {
    mockOpenDirectConversation.mockRejectedValue(
      new MessagingError(404, 'No account found for that email'),
    )
    const req = makeRequest('POST', 'http://localhost/api/messaging/conversations', {
      type: 'direct',
      target: { email: 'nobody@test.com' },
    })
    await postConversations(req)
    // openDirectConversation was called (it threw), but no user-creation side-effect
    expect(mockOpenDirectConversation).toHaveBeenCalledWith('user_a', { email: 'nobody@test.com' })
  })

  it('routes a {type: "direct", target: {userId}} body to openDirectConversation with a userId target', async () => {
    mockOpenDirectConversation.mockResolvedValue({ id: 'conv_1', type: 'direct' })
    const req = makeRequest('POST', 'http://localhost/api/messaging/conversations', {
      type: 'direct',
      target: { userId: 'user_b' },
    })
    const res = await postConversations(req)
    expect(res.status).toBe(200)
    expect(mockOpenDirectConversation).toHaveBeenCalledWith('user_a', { userId: 'user_b' })
  })

  it('returns 400 when a direct request has no target', async () => {
    const req = makeRequest('POST', 'http://localhost/api/messaging/conversations', {
      type: 'direct',
    })
    const res = await postConversations(req)
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.message).toMatch(/target user/i)
  })
})

// ── 1b. GET /conversations/:id — detail payload includes participants ─────────

describe('GET /conversations/:id', () => {
  it('returns participants alongside conversation and messages, matching the client contract', async () => {
    const summary = {
      id: 'conv_1',
      type: 'direct' as const,
      title: null,
      participants: [
        { userId: 'user_a', role: 'member', userName: 'A', userEmail: 'a@test.com' },
        { userId: 'user_b', role: 'member', userName: 'B', userEmail: 'b@test.com' },
      ],
    }
    mockLoadConversationDetailForUser.mockResolvedValue({
      conversation: summary as any,
      messages: [],
      participants: summary.participants,
    })
    mockListMessagesAfter.mockResolvedValue([])

    const req = makeRequest('GET', 'http://localhost/api/messaging/conversations/conv_1')
    const res = await getConversationDetail(req, 'conv_1')
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.conversation.id).toBe('conv_1')
    expect(body.data.participants).toEqual(summary.participants)
    expect(mockLoadConversationDetailForUser).toHaveBeenCalledWith('user_a', 'conv_1')
    expect(mockListConversationsForUser).not.toHaveBeenCalled()
    expect(mockAssertConversationParticipant).not.toHaveBeenCalled()
    expect(mockListMessagesAfter).not.toHaveBeenCalled()
  })

  it('returns 404 when the conversation is not found for the caller', async () => {
    mockLoadConversationDetailForUser.mockResolvedValue(null)

    const req = makeRequest('GET', 'http://localhost/api/messaging/conversations/conv_missing')
    const res = await getConversationDetail(req, 'conv_missing')
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.message).toMatch(/not found/i)
    expect(mockListConversationsForUser).not.toHaveBeenCalled()
  })
})

// ── 2. POST /conversations/:id/messages by non-participant → 403 ──────────────

describe('POST /conversations/:id/messages — authorization', () => {
  it('returns 403 when the caller is not a participant', async () => {
    mockAssertConversationParticipant.mockRejectedValue(
      new MessagingError(403, 'Not a participant of this conversation'),
    )
    const req = makeRequest(
      'POST',
      'http://localhost/api/messaging/conversations/conv_1/messages',
      { body: 'hello' },
    )
    const res = await postMessage(req, 'conv_1')
    const body = await res.json()
    expect(res.status).toBe(403)
    expect(body.status).toBe('error')
    expect(mockInsertMessage).not.toHaveBeenCalled()
  })
})

// ── 3. POST /conversations/:id/participants by non-admin → 403 ────────────────

describe('POST /conversations/:id/participants — admin only', () => {
  it('returns 403 when the caller is not an admin', async () => {
    mockAssertConversationAdmin.mockRejectedValue(
      new MessagingError(403, 'Admin role required for this action'),
    )
    const req = makeRequest(
      'POST',
      'http://localhost/api/messaging/conversations/conv_1/participants',
      { userId: 'user_b' },
    )
    const res = await postParticipants(req, 'conv_1')
    const body = await res.json()
    expect(res.status).toBe(403)
    expect(body.status).toBe('error')
    expect(mockAddParticipant).not.toHaveBeenCalled()
  })
})

// ── 4. DELETE /conversations/:id/participants/:userId (self) → 200 ────────────

describe('DELETE /conversations/:id/participants/:userId — self-leave', () => {
  it('returns 200 when a member leaves their own participation', async () => {
    const req = makeRequest(
      'DELETE',
      'http://localhost/api/messaging/conversations/conv_1/participants/user_a',
    )
    // user_a === auth.userId, so self-leave path is taken
    const res = await deleteParticipant(req, 'conv_1', 'user_a')
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.status).toBe('success')
    expect(mockSelfLeave).toHaveBeenCalledWith('conv_1', 'user_a')
    expect(mockAssertConversationAdmin).not.toHaveBeenCalled()
  })
})

// ── 5. GET /conversations/:id/messages?after= — incremental payload ───────────

describe('GET /conversations/:id/messages', () => {
  it('returns an incremental payload with messages array', async () => {
    const FAKE_MESSAGES = [
      {
        id: 'msg_2',
        conversationId: 'conv_1',
        senderUserId: 'user_b',
        body: 'hello',
        reactions: null,
        createdAt: new Date('2025-01-01T00:00:01Z'),
      },
    ]
    mockListMessagesAfter.mockResolvedValue(FAKE_MESSAGES as any)

    const req = makeRequest(
      'GET',
      'http://localhost/api/messaging/conversations/conv_1/messages?after=msg_0',
    )
    const res = await getMessages(req, 'conv_1')
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.status).toBe('success')
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.data[0]).toMatchObject({ id: 'msg_2', body: 'hello' })
    expect(mockListMessagesAfter).toHaveBeenCalledWith('conv_1', 'msg_0', expect.any(Number))
  })
})

// ── 6. GET /attachments/:id — participant guard + streaming ───────────────────

describe('GET /attachments/:id', () => {
  const FAKE_ATTACHMENT = {
    id: 'att_1',
    messageId: 'msg_1',
    mimeType: 'image/png',
    data: Buffer.from('fake-png-bytes'),
    kind: 'image',
    sizeBytes: 14,
    createdAt: new Date(),
  }

  beforeEach(() => {
    mockGetAttachment.mockResolvedValue(FAKE_ATTACHMENT as any)
    mockResolveAttachmentConversation.mockResolvedValue('conv_1')
  })

  it('returns 403 when the caller is not a participant of the owning conversation', async () => {
    mockAssertConversationParticipant.mockRejectedValue(
      new MessagingError(403, 'Not a participant of this conversation'),
    )
    const req = makeRequest('GET', 'http://localhost/api/messaging/attachments/att_1')
    const res = await getAttachmentRoute(req, 'att_1')
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.status).toBe('error')
  })

  it('returns bytes with the correct Content-Type for a participant', async () => {
    const req = makeRequest('GET', 'http://localhost/api/messaging/attachments/att_1')
    const res = await getAttachmentRoute(req, 'att_1')

    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('image/png')
    const bytes = await res.arrayBuffer()
    expect(Buffer.from(bytes)).toEqual(FAKE_ATTACHMENT.data)
  })

  it('returns 404 when attachment does not exist', async () => {
    mockGetAttachment.mockResolvedValue(null)
    const req = makeRequest('GET', 'http://localhost/api/messaging/attachments/no_such_att')
    const res = await getAttachmentRoute(req, 'no_such_att')
    expect(res.status).toBe(404)
  })
})

// ── 7. GET /unread — returns { count } ───────────────────────────────────────

describe('GET /unread', () => {
  it('returns { count } with the total unread count', async () => {
    mockGetUnreadCount.mockResolvedValue(5)
    const res = await getUnread()
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.status).toBe('success')
    expect(body.data).toEqual({ count: 5 })
    expect(mockGetUnreadCount).toHaveBeenCalledWith('user_a')
  })

  it('returns { count: 0 } when there are no unread messages', async () => {
    mockGetUnreadCount.mockResolvedValue(0)
    const res = await getUnread()
    const body = await res.json()
    expect(body.data.count).toBe(0)
  })
})
