/**
 * useSelectedChild — reads sessionStorage synchronously on first render so
 * DashboardProvider does not double-fetch after hydration.
 */
import { renderHook, act } from '@testing-library/react'
import { useSelectedChild } from '@/features/dashboard/front/hooks/useSelectedChild'

const STORAGE_KEY = 'sheath.selectedChildId'

afterEach(() => {
  sessionStorage.clear()
  jest.clearAllMocks()
})

describe('useSelectedChild', () => {
  test('returns null when sessionStorage has no value', () => {
    const { result } = renderHook(() => useSelectedChild())
    expect(result.current[0]).toBeNull()
  })

  test('reads the stored value synchronously on first render — no extra render needed', () => {
    sessionStorage.setItem(STORAGE_KEY, 'child_abc')
    const { result } = renderHook(() => useSelectedChild())
    // Value must be present on the first render, not after an effect tick
    expect(result.current[0]).toBe('child_abc')
  })

  test('setter writes the new id to sessionStorage', () => {
    const { result } = renderHook(() => useSelectedChild())
    act(() => { result.current[1]('child_xyz') })
    expect(result.current[0]).toBe('child_xyz')
    expect(sessionStorage.getItem(STORAGE_KEY)).toBe('child_xyz')
  })

  test('setter with null removes the key from sessionStorage', () => {
    sessionStorage.setItem(STORAGE_KEY, 'child_abc')
    const { result } = renderHook(() => useSelectedChild())
    act(() => { result.current[1](null) })
    expect(result.current[0]).toBeNull()
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  test('setter with empty string removes the key', () => {
    sessionStorage.setItem(STORAGE_KEY, 'child_abc')
    const { result } = renderHook(() => useSelectedChild())
    act(() => { result.current[1]('') })
    expect(result.current[0]).toBeNull()
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  test('handles sessionStorage read errors gracefully', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage blocked')
    })
    expect(() => renderHook(() => useSelectedChild())).not.toThrow()
    const { result } = renderHook(() => useSelectedChild())
    expect(result.current[0]).toBeNull()
  })
})
