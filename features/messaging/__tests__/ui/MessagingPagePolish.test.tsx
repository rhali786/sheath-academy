'use strict'
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
  getMessages,
  markRead,
} from '@/features/messaging/front/services/api'

const mockListConversations = listConversations as jest.Mock
const mockGetConversation = getConversation as jest.Mock
const mockGetMessages = getMessages as jest.Mock
const mockMarkRead = markRead as jest.Mock
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
    unreadCount: 0,
    lastMessage: null,
    participants: [
      { userId: 'user-me', userName: 'Test User', userEmail: 'test@example.com', role: 'member' },
      { userId: 'user-other', userName: 'Other Person', userEmail: 'other@example.com', role: 'member' },
    ],
    ...overrides,
  }
}

function makeParticipants(): ConversationParticipant[] {
  return [
    {
      id: 'p1',
      conversationId: 'conv-1',
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
      conversationId: 'conv-1',
      userId: 'user-other',
      role: 'member',
      lastReadAt: null,
      joinedAt: '2026-06-06T09:00:00Z',
      leftAt: null,
      userName: 'Other Person',
      userEmail: 'other@example.com',
    },
  ]
}

// Lazy-loaded components (ensures mocks are applied before import)
let MessagingPage: React.ComponentType<any>
let ThreadView: React.ComponentType<any>

beforeAll(async () => {
  MessagingPage = (await import('@/features/messaging/front/pages/MessagingPage')).MessagingPage
  ThreadView = (await import('@/features/messaging/front/components/ThreadView')).ThreadView
})

beforeEach(() => {
  mockListConversations.mockReset()
  mockGetConversation.mockReset()
  mockGetMessages.mockReset()
  mockMarkRead.mockReset()

  // Default: never-resolving promise for getMessages (prevents polling side effects)
  mockGetMessages.mockReturnValue(new Promise(() => {}))
  mockMarkRead.mockResolvedValue({ data: { ok: true }, status: 'success', message: '', timestamp: '' })
})

// ── MessagingPage empty state ─────────────────────────────────────────────────

describe('MessagingPage renders empty state', () => {
  it("renders 'No conversations yet — start one' when conversation list is empty", async () => {
    mockListConversations.mockResolvedValue({
      data: { conversations: [] },
      status: 'success',
      message: '',
      timestamp: '',
    })

    await act(async () => {
      render(<MessagingPage />)
    })

    await waitFor(() => {
      expect(screen.getByText(/no conversations yet.*start one/i)).toBeInTheDocument()
    })
    expect(screen.getByTestId('messaging-shell')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /messages/i })).toHaveClass('page-title')
  })
})

// ── MessagingPage error state ─────────────────────────────────────────────────

describe('MessagingPage renders error state with retry button when conversation load fails', () => {
  it('shows error message and a Retry button when listConversations fails', async () => {
    mockListConversations.mockRejectedValue(new Error('Network failure'))

    await act(async () => {
      render(<MessagingPage />)
    })

    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })
})

// ── MessagingPage conversation labels ─────────────────────────────────────────

describe('MessagingPage conversation list labels', () => {
  it('shows the other participant using session.user.userId, not session.user.id', async () => {
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
    mockListConversations.mockResolvedValue({
      data: { conversations: [makeConversation()] },
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

// ── ThreadView data loading ───────────────────────────────────────────────────

describe('ThreadView data loading', () => {
  it('calls getConversation only once on mount (via useThread)', async () => {
    const conv = makeConversation()
    mockGetConversation.mockResolvedValue({
      data: {
        conversation: conv,
        messages: [],
        participants: makeParticipants(),
      },
      status: 'success',
      message: '',
      timestamp: '',
    })

    await act(async () => {
      render(<ThreadView conversationId="conv-1" currentUserId="user-me" onBack={() => {}} />)
    })

    await waitFor(() => {
      expect(screen.getByTestId('thread-view')).toBeInTheDocument()
    })
    expect(mockGetConversation).toHaveBeenCalledTimes(1)
  })
})

// ── ThreadView empty state ────────────────────────────────────────────────────

describe('ThreadView renders empty state when no messages', () => {
  it('shows an empty state message when the conversation has no messages', async () => {
    const conv = makeConversation()
    mockGetConversation.mockResolvedValue({
      data: {
        conversation: conv,
        messages: [],
        participants: makeParticipants(),
      },
      status: 'success',
      message: '',
      timestamp: '',
    })

    await act(async () => {
      render(<ThreadView conversationId="conv-1" currentUserId="user-me" onBack={() => {}} />)
    })

    await waitFor(() => {
      expect(screen.getByTestId('thread-empty')).toBeInTheDocument()
    })
    expect(screen.getByTestId('composer-input')).toBeInTheDocument()
    expect(screen.getByTestId('composer-send')).toBeInTheDocument()
  })
})

// ── ThreadView error state ────────────────────────────────────────────────────

describe('ThreadView renders error state when thread load fails', () => {
  it('shows error state when getConversation rejects', async () => {
    mockGetConversation.mockRejectedValue(new Error('Thread load error'))

    await act(async () => {
      render(<ThreadView conversationId="conv-1" currentUserId="user-me" onBack={() => {}} />)
    })

    await waitFor(() => {
      expect(screen.getByTestId('thread-view-error')).toBeInTheDocument()
    })
    expect(screen.getByText(/failed to load messages/i)).toBeInTheDocument()
  })
})

// ── Mobile single-pane ────────────────────────────────────────────────────────

describe('Mobile: single-pane behavior', () => {
  it('shows ConversationList when no conversation is selected', async () => {
    mockListConversations.mockResolvedValue({
      data: { conversations: [] },
      status: 'success',
      message: '',
      timestamp: '',
    })

    await act(async () => {
      render(<MessagingPage />)
    })

    // The conversation-list pane must not have the 'hidden' class when no conversation selected
    await waitFor(() => {
      const listPane = screen.getByTestId('conversation-list-pane')
      expect(listPane).toBeInTheDocument()
      // Should NOT have hidden md:flex (i.e. the pane is visible when nothing selected)
      expect(listPane.className).not.toMatch(/^hidden/)
    })
  })

  it('shows ThreadView with back button when a conversation is selected', async () => {
    const conv = makeConversation()
    mockListConversations.mockResolvedValue({
      data: { conversations: [conv] },
      status: 'success',
      message: '',
      timestamp: '',
    })
    mockGetConversation.mockResolvedValue({
      data: {
        conversation: conv,
        messages: [],
        participants: makeParticipants(),
      },
      status: 'success',
      message: '',
      timestamp: '',
    })

    await act(async () => {
      render(<MessagingPage />)
    })

    // Wait for conversation list to populate
    await waitFor(() => {
      expect(screen.getByTestId(`conversation-item-${conv.id}`)).toBeInTheDocument()
    })

    // Click the conversation to select it
    await act(async () => {
      fireEvent.click(screen.getByTestId(`conversation-item-${conv.id}`))
    })

    // Thread pane should now be visible
    await waitFor(() => {
      const threadPane = screen.getByTestId('thread-pane')
      expect(threadPane).toBeInTheDocument()
      expect(threadPane.className).not.toMatch(/^hidden/)
    })

    // Back button should be present
    expect(screen.getByRole('button', { name: /back to conversations/i })).toBeInTheDocument()
  })
})
