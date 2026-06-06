/** @jest-environment jsdom */
import { renderHook, act } from '@testing-library/react'
import { useThread } from '@/features/messaging/front/hooks/useThread'
import * as api from '@/features/messaging/front/services/api'

jest.mock('@/features/messaging/front/services/api')

const mockGetConversation = api.getConversation as jest.MockedFunction<typeof api.getConversation>
const mockGetMessages = api.getMessages as jest.MockedFunction<typeof api.getMessages>

const msg1 = { id: 'msg_1', conversationId: 'conv_1', senderUserId: 'u1', senderName: 'Alice', body: 'Hello', createdAt: '2026-01-01T00:00:00Z', attachmentIds: [] }
const msg2 = { id: 'msg_2', conversationId: 'conv_1', senderUserId: 'u2', senderName: 'Bob', body: 'World', createdAt: '2026-01-01T00:01:00Z', attachmentIds: [] }

const baseConversation = {
  id: 'conv_1', type: 'direct' as const, title: null, createdByUserId: 'u1',
  lastMessageAt: null, settings: null, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  unreadCount: 0, lastMessage: null, participants: [],
}

beforeEach(() => {
  jest.useFakeTimers()
  mockGetConversation.mockImplementation(async () => ({
    status: 'success',
    data: { conversation: baseConversation, messages: [msg1], participants: [] },
    message: '',
    timestamp: '',
  }))
  mockGetMessages.mockImplementation(async () => ({
    status: 'success',
    data: { messages: [], hasMore: false },
    message: '',
    timestamp: '',
  }))
})

afterEach(() => {
  jest.useRealTimers()
  jest.clearAllMocks()
})

describe('useThread', () => {
  it('loads initial messages from getConversation on mount', async () => {
    const { result } = renderHook(() => useThread('conv_1'))
    expect(result.current.loading).toBe(true)
    await act(async () => {})
    expect(result.current.loading).toBe(false)
    expect(result.current.messages).toHaveLength(1)
    expect(result.current.messages[0].id).toBe('msg_1')
  })

  it('appends new messages from poll without replacing existing messages', async () => {
    mockGetMessages.mockImplementation(async (_convId, after) => {
      if (after === 'msg_1') {
        return { status: 'success', data: { messages: [msg2], hasMore: false }, message: '', timestamp: '' }
      }
      return { status: 'success', data: { messages: [], hasMore: false }, message: '', timestamp: '' }
    })

    const { result } = renderHook(() => useThread('conv_1'))
    await act(async () => {})
    expect(result.current.messages).toHaveLength(1)

    await act(async () => {
      jest.advanceTimersByTime(3000)
    })

    expect(result.current.messages).toHaveLength(2)
    expect(result.current.messages[0].id).toBe('msg_1')
    expect(result.current.messages[1].id).toBe('msg_2')
  })

  it('advances the after cursor to the last received message id', async () => {
    mockGetMessages
      .mockImplementationOnce(async (_convId, after) => {
        if (after === 'msg_1') {
          return { status: 'success', data: { messages: [msg2], hasMore: false }, message: '', timestamp: '' }
        }
        return { status: 'success', data: { messages: [], hasMore: false }, message: '', timestamp: '' }
      })
      .mockImplementation(async () => ({ status: 'success', data: { messages: [], hasMore: false }, message: '', timestamp: '' }))

    const { result: _ } = renderHook(() => useThread('conv_1'))
    await act(async () => {})

    await act(async () => { jest.advanceTimersByTime(3000) })
    await act(async () => { jest.advanceTimersByTime(3000) })

    const calls = mockGetMessages.mock.calls
    expect(calls[0][1]).toBe('msg_1')
    expect(calls[1][1]).toBe('msg_2')
  })

  it('does not duplicate messages when poll returns already-seen ids', async () => {
    mockGetMessages.mockImplementation(async () => ({
      status: 'success',
      data: { messages: [msg1], hasMore: false },
      message: '',
      timestamp: '',
    }))

    const { result } = renderHook(() => useThread('conv_1'))
    await act(async () => {})
    await act(async () => { jest.advanceTimersByTime(3000) })

    expect(result.current.messages).toHaveLength(1)
  })

  it('sets error on failure', async () => {
    mockGetConversation.mockImplementation(async () => { throw new Error('Network error') })

    const { result } = renderHook(() => useThread('conv_1'))
    await act(async () => {})
    expect(result.current.error).toBe('Network error')
  })
})
