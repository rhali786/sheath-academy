/** @jest-environment jsdom */
import { renderHook, act } from '@testing-library/react'
import { useConversations } from '@/features/messaging/front/hooks/useConversations'
import * as api from '@/features/messaging/front/services/api'

jest.mock('@/features/messaging/front/services/api')

const mockListConversations = api.listConversations as jest.MockedFunction<typeof api.listConversations>

const conv = {
  id: 'conv_1', type: 'direct' as const, title: null, createdByUserId: 'u1',
  lastMessageAt: null, settings: null, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  unreadCount: 0, lastMessage: null, participants: [],
}

beforeEach(() => {
  mockListConversations.mockImplementation(async () => ({
    status: 'success', data: { conversations: [conv] }, message: '', timestamp: '',
  }))
})

afterEach(() => {
  jest.clearAllMocks()
})

describe('useConversations', () => {
  it('fetches on mount and returns conversations', async () => {
    const { result } = renderHook(() => useConversations())
    expect(result.current.loading).toBe(true)
    await act(async () => {})
    expect(result.current.loading).toBe(false)
    expect(result.current.conversations).toHaveLength(1)
    expect(result.current.conversations[0].id).toBe('conv_1')
  })

  it('sets error on failure', async () => {
    mockListConversations.mockImplementation(async () => { throw new Error('Server error') })
    const { result } = renderHook(() => useConversations())
    await act(async () => {})
    expect(result.current.error).toBe('Server error')
  })

  it('reload re-fetches the list', async () => {
    const { result } = renderHook(() => useConversations())
    await act(async () => {})
    expect(mockListConversations).toHaveBeenCalledTimes(1)
    await act(async () => { result.current.reload() })
    expect(mockListConversations).toHaveBeenCalledTimes(2)
  })
})
