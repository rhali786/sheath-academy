import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/messages'),
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn() })),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}))

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: {
      user: {
        id: 'dev-bypass@example.com',
        userId: 'user-me',
        name: 'Test User',
        email: 'test@example.com',
      },
    },
    status: 'authenticated',
  })),
}))

import { useSession } from 'next-auth/react'

// Mock the messaging API service
jest.mock('@/features/messaging/front/services/api', () => ({
  listConversations: jest.fn(),
  getConversation: jest.fn(),
  sendMessage: jest.fn(),
  getMessages: jest.fn(),
  markRead: jest.fn(),
  getUnread: jest.fn(),
  createDirectConversation: jest.fn(),
  createGroupConversation: jest.fn(),
  addParticipant: jest.fn(),
  removeParticipant: jest.fn(),
  getAttachmentUrl: jest.fn((id: string) => `/api/messaging/attachments/${id}`),
}))

import {
  listConversations,
  getConversation,
  sendMessage,
  getMessages,
  markRead,
  createDirectConversation,
  createGroupConversation,
} from '@/features/messaging/front/services/api'

const mockListConversations = listConversations as jest.Mock
const mockGetConversation = getConversation as jest.Mock
const mockSendMessage = sendMessage as jest.Mock
const mockGetMessages = getMessages as jest.Mock
const mockMarkRead = markRead as jest.Mock
const mockCreateDirect = createDirectConversation as jest.Mock
const mockCreateGroup = createGroupConversation as jest.Mock
const mockUseSession = useSession as jest.Mock

import type { ConversationSummary, Message, ConversationParticipant } from '@/features/messaging/types'

function makeConversation(overrides: Partial<ConversationSummary> = {}): ConversationSummary {
  return {
    id: 'conv-1',
    type: 'direct',
    title: null,
    createdByUserId: 'user-other',
    lastMessageAt: '2026-06-06T10:00:00Z',
    settings: null,
    createdAt: '2026-06-06T09:00:00Z',
    updatedAt: '2026-06-06T10:00:00Z',
    unreadCount: 2,
    lastMessage: { body: 'Hello there', senderUserId: 'user-other' },
    participants: [
      { userId: 'user-me', userName: 'Test User', userEmail: 'test@example.com', role: 'member' },
      { userId: 'user-other', userName: 'Other Person', userEmail: 'other@example.com', role: 'member' },
    ],
    ...overrides,
  }
}

function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 'msg-1',
    conversationId: 'conv-1',
    senderUserId: 'user-other',
    senderName: 'Other Person',
    body: 'Hello there',
    createdAt: '2026-06-06T10:00:00Z',
    attachmentIds: [],
    ...overrides,
  }
}

// We need to import after mocks are set up
// Use lazy imports to ensure mocks are applied
let ConversationListComponent: React.ComponentType<any>
let ThreadView: React.ComponentType<any>
let Composer: React.ComponentType<any>
let NewMessageModal: React.ComponentType<any>
let NewGroupModal: React.ComponentType<any>
let MessagingPage: React.ComponentType<any>

beforeAll(async () => {
  ConversationListComponent = (await import('@/features/messaging/front/components/ConversationList')).ConversationList
  ThreadView = (await import('@/features/messaging/front/components/ThreadView')).ThreadView
  Composer = (await import('@/features/messaging/front/components/Composer')).Composer
  NewMessageModal = (await import('@/features/messaging/front/components/NewMessageModal')).NewMessageModal
  NewGroupModal = (await import('@/features/messaging/front/components/NewGroupModal')).NewGroupModal
  MessagingPage = (await import('@/features/messaging/front/pages/MessagingPage')).MessagingPage
})

beforeEach(() => {
  mockListConversations.mockReset()
  mockGetConversation.mockReset()
  mockSendMessage.mockReset()
  mockGetMessages.mockReset()
  mockMarkRead.mockReset()
  mockCreateDirect.mockReset()
  mockCreateGroup.mockReset()

  // Default: never-resolving promise for getMessages (prevents polling side effects)
  mockGetMessages.mockReturnValue(new Promise(() => {}))
  mockMarkRead.mockResolvedValue({ data: { ok: true }, status: 'success', message: '', timestamp: '' })
})

// ── ConversationList ──────────────────────────────────────────────────────────

describe('ConversationList', () => {
  it('renders loading skeleton', async () => {
    mockListConversations.mockReturnValue(new Promise(() => {}))

    await act(async () => {
      render(<ConversationListComponent />)
    })

    expect(screen.getByTestId('conversation-list-loading')).toBeInTheDocument()
  })

  it("renders empty state: 'No conversations yet'", async () => {
    mockListConversations.mockResolvedValue({
      data: { conversations: [] },
      status: 'success',
      message: '',
      timestamp: '',
    })

    await act(async () => {
      render(<ConversationListComponent />)
    })

    await waitFor(() => {
      expect(screen.getByText(/no conversations yet/i)).toBeInTheDocument()
    })
  })

  it('renders error state with retry', async () => {
    mockListConversations.mockRejectedValue(new Error('Network error'))

    await act(async () => {
      render(<ConversationListComponent />)
    })

    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  it('renders populated list of conversations', async () => {
    const conv = makeConversation()
    mockListConversations.mockResolvedValue({
      data: { conversations: [conv] },
      status: 'success',
      message: '',
      timestamp: '',
    })

    await act(async () => {
      render(<ConversationListComponent currentUserId="user-me" />)
    })

    await waitFor(() => {
      expect(screen.getByTestId('conversation-list')).toBeInTheDocument()
    })
    // Should show participant name for direct conversation (not current user)
    expect(screen.getByText(/other person/i)).toBeInTheDocument()
    expect(screen.queryByText(/^test user$/i)).not.toBeInTheDocument()
    expect(screen.getByTestId('conversation-timestamp-conv-1')).toBeInTheDocument()
    expect(screen.getAllByTestId('message-avatar').length).toBeGreaterThan(0)
  })

  it('shows the other participant when session.userId differs from session.user.id', async () => {
    mockUseSession.mockImplementation(() => ({
      data: {
        user: {
          id: 'dev-bypass@example.com',
          userId: 'user-me',
          name: 'Test User',
          email: 'test@example.com',
        },
      },
      status: 'authenticated',
    }))

    const conv = makeConversation()
    mockListConversations.mockResolvedValue({
      data: { conversations: [conv] },
      status: 'success',
      message: '',
      timestamp: '',
    })

    await act(async () => {
      render(<MessagingPage />)
    })

    await waitFor(() => {
      expect(screen.getByText(/other person/i)).toBeInTheDocument()
    })
    expect(screen.queryByText(/^test user$/i)).not.toBeInTheDocument()
  })
})

// ── ThreadView + markRead ─────────────────────────────────────────────────────

describe('Selecting a conversation renders ThreadView and fires markRead', () => {
  it('renders thread view and calls markRead on mount', async () => {
    const conv = makeConversation()
    const msg = makeMessage()
    mockListConversations.mockResolvedValue({
      data: { conversations: [conv] },
      status: 'success',
      message: '',
      timestamp: '',
    })
    mockGetConversation.mockResolvedValue({
      data: { conversation: conv, messages: [msg], participants: conv.participants },
      status: 'success',
      message: '',
      timestamp: '',
    })

    const setSelected = jest.fn()

    await act(async () => {
      render(
        <ThreadView
          conversationId="conv-1"
          onBack={() => {}}
        />
      )
    })

    await waitFor(() => {
      expect(screen.getByTestId('thread-view')).toBeInTheDocument()
    })
    expect(mockMarkRead).toHaveBeenCalledWith('conv-1')
    expect(screen.getByTestId('message-bubble-msg-1')).toHaveAttribute('data-direction', 'incoming')
    expect(screen.getByTestId('message-timestamp-msg-1')).toBeInTheDocument()
  })
})

// ── Composer ─────────────────────────────────────────────────────────────────

describe('Composer send calls sendMessage and appends the message', () => {
  it('calls sendMessage when send button is clicked', async () => {
    const newMsg = makeMessage({ id: 'msg-2', body: 'test message' })
    mockSendMessage.mockResolvedValue({
      data: newMsg,
      status: 'success',
      message: '',
      timestamp: '',
    })

    const onMessageSent = jest.fn()

    await act(async () => {
      render(<Composer conversationId="conv-1" onMessageSent={onMessageSent} />)
    })

    const input = screen.getByTestId('composer-input')
    await act(async () => {
      fireEvent.change(input, { target: { value: 'test message' } })
    })

    const sendButton = screen.getByTestId('composer-send')
    await act(async () => {
      fireEvent.click(sendButton)
    })

    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith('conv-1', 'test message')
    })
    expect(onMessageSent).toHaveBeenCalledWith(newMsg)
  })
})

// ── NewMessageModal ───────────────────────────────────────────────────────────

describe('NewMessageModal', () => {
  it('household tab lists household members (mocked GET /api/household/members)', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            members: [
              { userId: 'user-abc', name: 'Alice', email: 'alice@example.com' },
              { userId: 'user-me', name: 'Test User', email: 'test@example.com' },
            ],
          },
          status: 'success',
          message: '',
          timestamp: '',
        }),
    })
    // Set fetch mock before render so useEffect sees it
    const origFetch = global.fetch
    global.fetch = fetchMock as any

    const onClose = jest.fn()
    const onCreated = jest.fn()

    await act(async () => {
      render(<NewMessageModal onClose={onClose} onCreated={onCreated} currentUserId="user-me" />)
    })

    await waitFor(() => {
      // Should show Alice but not current user (filtered out)
      expect(screen.getByText('Alice')).toBeInTheDocument()
    }, { timeout: 3000 })
    expect(screen.queryByText('Test User')).not.toBeInTheDocument()

    global.fetch = origFetch
  })

  it("email tab shows 'No account found' on unknown email", async () => {
    const fetchMock = jest.fn()
      // First call: household members
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: { members: [] },
            status: 'success',
            message: '',
            timestamp: '',
          }),
      })
    const origFetch = global.fetch
    global.fetch = fetchMock as any

    const onClose = jest.fn()
    const onCreated = jest.fn()
    mockCreateDirect.mockRejectedValue(new Error('No account found'))

    await act(async () => {
      render(<NewMessageModal onClose={onClose} onCreated={onCreated} currentUserId="user-me" />)
    })

    // Switch to email tab
    const emailTab = screen.getByRole('button', { name: /by email/i })
    await act(async () => {
      fireEvent.click(emailTab)
    })

    const emailInput = screen.getByPlaceholderText(/email/i)
    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'unknown@example.com' } })
    })

    const startBtn = screen.getByRole('button', { name: /start conversation/i })
    await act(async () => {
      fireEvent.click(startBtn)
    })

    await waitFor(() => {
      expect(screen.getByText(/no account found/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    global.fetch = origFetch
  })
})

// ── NewGroupModal ─────────────────────────────────────────────────────────────

describe('NewGroupModal', () => {
  it('requires title + at least 1 participant before creating', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            members: [
              { userId: 'user-abc', name: 'Alice', email: 'alice@example.com' },
            ],
          },
          status: 'success',
          message: '',
          timestamp: '',
        }),
    })
    const origFetch = global.fetch
    global.fetch = fetchMock as any

    const onClose = jest.fn()
    const onCreated = jest.fn()

    await act(async () => {
      render(<NewGroupModal onClose={onClose} onCreated={onCreated} currentUserId="user-me" />)
    })

    // Try to create without filling required fields (no title, no participants selected)
    const createBtn = screen.getByRole('button', { name: /create group/i })
    await act(async () => {
      fireEvent.click(createBtn)
    })

    // Should not have called API
    expect(mockCreateGroup).not.toHaveBeenCalled()
    // Should show validation error message (the text "Group title is required")
    expect(screen.getByText('Group title is required')).toBeInTheDocument()

    global.fetch = origFetch
  })
})

// ── Creating a conversation refreshes the visible list ────────────────────────

describe('MessagingPage — creating a conversation shows it in the list', () => {
  it('adds the new direct conversation to the list after creation', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: { members: [{ userId: 'user-other', name: 'Other Person', email: 'other@example.com' }] },
          status: 'success',
          message: '',
          timestamp: '',
        }),
    })
    const origFetch = global.fetch
    global.fetch = fetchMock as any

    const newConv = makeConversation({ id: 'conv-new' })

    // First load: no conversations yet. After creation, the list includes the new one.
    mockListConversations
      .mockResolvedValueOnce({
        data: { conversations: [] },
        status: 'success',
        message: '',
        timestamp: '',
      })
      .mockResolvedValue({
        data: { conversations: [newConv] },
        status: 'success',
        message: '',
        timestamp: '',
      })
    mockCreateDirect.mockResolvedValue({
      data: newConv,
      status: 'success',
      message: '',
      timestamp: '',
    })
    mockGetConversation.mockResolvedValue({
      data: { conversation: newConv, messages: [], participants: newConv.participants },
      status: 'success',
      message: '',
      timestamp: '',
    })

    await act(async () => {
      render(<MessagingPage />)
    })

    await waitFor(() => {
      expect(screen.getByTestId('conversation-list-empty')).toBeInTheDocument()
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /new message/i }))
    })

    await waitFor(() => {
      expect(screen.getByText('Other Person')).toBeInTheDocument()
    })
    await act(async () => {
      fireEvent.click(screen.getByText('Other Person'))
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /start conversation/i }))
    })

    await waitFor(() => {
      expect(screen.getByTestId(`conversation-item-${newConv.id}`)).toBeInTheDocument()
    })

    global.fetch = origFetch
  })
})

// ── Admin / member controls ───────────────────────────────────────────────────

describe('Non-admin member sees no add/remove controls but sees Leave button', () => {
  it('shows Leave button but not add/remove for non-admin member', async () => {
    const conv = makeConversation({
      id: 'conv-group',
      type: 'group',
      title: 'Study Group',
      createdByUserId: 'user-other',
      participants: [
        { userId: 'user-me', userName: 'Test User', userEmail: 'test@example.com', role: 'member' },
        { userId: 'user-other', userName: 'Admin Person', userEmail: 'admin@example.com', role: 'admin' },
      ],
    })
    mockGetConversation.mockResolvedValue({
      data: {
        conversation: conv,
        messages: [],
        participants: [
          {
            id: 'p1',
            conversationId: 'conv-group',
            userId: 'user-me',
            role: 'member',
            lastReadAt: null,
            joinedAt: '2026-06-06T09:00:00Z',
            leftAt: null,
            userName: 'Test User',
            userEmail: 'test@example.com',
          },
          {
            id: 'p2',
            conversationId: 'conv-group',
            userId: 'user-other',
            role: 'admin',
            lastReadAt: null,
            joinedAt: '2026-06-06T09:00:00Z',
            leftAt: null,
            userName: 'Admin Person',
            userEmail: 'admin@example.com',
          },
        ] as ConversationParticipant[],
      },
      status: 'success',
      message: '',
      timestamp: '',
    })

    await act(async () => {
      render(
        <ThreadView
          conversationId="conv-group"
          currentUserId="user-me"
          onBack={() => {}}
        />
      )
    })

    await waitFor(() => {
      expect(screen.getByTestId('thread-view')).toBeInTheDocument()
    })

    // Leave button should be present
    expect(screen.getByRole('button', { name: /leave/i })).toBeInTheDocument()
    // Add participant button should NOT be present
    expect(screen.queryByRole('button', { name: /add participant|add member/i })).not.toBeInTheDocument()
  })
})
