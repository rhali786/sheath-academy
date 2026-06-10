import { renderHook, act } from '@testing-library/react'
import { useModuleLastDestination } from '@/features/layout/front/hooks/useModuleLastDestination'

const KEY = 'sheath.module.lastHref.planbook'

describe('useModuleLastDestination', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  test('stores and reads sessionStorage key per module id', () => {
    const { result } = renderHook(() => useModuleLastDestination('planbook'))
    expect(result.current[0]).toBeNull()

    act(() => {
      result.current[1]('/lessons')
    })

    expect(result.current[0]).toBe('/lessons')
    expect(sessionStorage.getItem(KEY)).toBe('/lessons')
  })

  test('returns null when sessionStorage.getItem throws', () => {
    const getItem = Storage.prototype.getItem
    Storage.prototype.getItem = jest.fn(() => {
      throw new Error('quota')
    })

    const { result } = renderHook(() => useModuleLastDestination('planbook'))
    expect(result.current[0]).toBeNull()

    Storage.prototype.getItem = getItem
  })

  test('setDestination silently ignores sessionStorage.setItem failures', () => {
    const setItem = Storage.prototype.setItem
    Storage.prototype.setItem = jest.fn(() => {
      throw new Error('quota')
    })

    const { result } = renderHook(() => useModuleLastDestination('planbook'))
    act(() => {
      result.current[1]('/lessons')
    })
    expect(result.current[0]).toBe('/lessons')

    Storage.prototype.setItem = setItem
  })
})
