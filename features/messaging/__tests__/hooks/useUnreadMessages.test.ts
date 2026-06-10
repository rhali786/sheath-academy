/** @jest-environment jsdom */
import { renderHook, act } from '@testing-library/react'
import { useUnreadMessages } from '@/features/messaging/front/hooks/useUnreadMessages'
import * as api from '@/features/messaging/front/services/api'

jest.mock('@/features/messaging/front/services/api')

const mockGetUnread = api.getUnread as jest.MockedFunction<typeof api.getUnread>

beforeEach(() => {
  jest.useFakeTimers()
  mockGetUnread.mockImplementation(async () => ({ status: 'success', data: { count: 3 }, message: '', timestamp: '' }))
})

afterEach(() => {
  jest.useRealTimers()
  jest.clearAllMocks()
})

describe('useUnreadMessages', () => {
  it('fetches on mount and returns count', async () => {
    const { result } = renderHook(() => useUnreadMessages())
    await act(async () => {})
    expect(result.current.count).toBe(3)
  })

  it('polls every 15 seconds', async () => {
    mockGetUnread
      .mockImplementationOnce(async () => ({ status: 'success', data: { count: 1 }, message: '', timestamp: '' }))
      .mockImplementation(async () => ({ status: 'success', data: { count: 5 }, message: '', timestamp: '' }))

    const { result } = renderHook(() => useUnreadMessages())
    await act(async () => {})
    expect(result.current.count).toBe(1)

    await act(async () => {
      jest.advanceTimersByTime(15000)
    })
    expect(result.current.count).toBe(5)
  })

  it('does not double-register timers on re-render', async () => {
    const { rerender } = renderHook(() => useUnreadMessages())
    await act(async () => {})
    rerender()
    await act(async () => {
      jest.advanceTimersByTime(15000)
    })
    // one initial call + one poll, not two polls from doubled interval
    expect(mockGetUnread).toHaveBeenCalledTimes(2)
  })

  it('clears interval on unmount', async () => {
    const { unmount } = renderHook(() => useUnreadMessages())
    await act(async () => {})
    unmount()
    await act(async () => {
      jest.advanceTimersByTime(15000)
    })
    // no additional call after unmount
    expect(mockGetUnread).toHaveBeenCalledTimes(1)
  })
})
