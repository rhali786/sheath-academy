/**
 * Unit tests for useIslamicReminderSettings hook
 * TDD: written before implementation
 */

import { renderHook, act } from '@testing-library/react'
import { useIslamicReminderSettings } from '@/features/islamic-calendar/front/lib/useIslamicReminderSettings'
import type { IslamicEventName } from '@/features/islamic-calendar/types'

const STORAGE_KEY = 'islamicReminderSettings'

const ALL_EVENTS: IslamicEventName[] = [
  'Ramadan', 'Eid al-Fitr', 'Eid al-Adha',
  'Day of Arafah', 'Ashura', 'White Days', 'Sacred Month',
]

describe('useIslamicReminderSettings', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('defaults all events to enabled when localStorage is empty', () => {
    const { result } = renderHook(() => useIslamicReminderSettings())
    ALL_EVENTS.forEach(name => {
      expect(result.current.enabled[name]).toBe(true)
    })
  })

  it('toggle sets a specific event to false', () => {
    const { result } = renderHook(() => useIslamicReminderSettings())
    act(() => {
      result.current.toggle('Ramadan')
    })
    expect(result.current.enabled['Ramadan']).toBe(false)
    // Other events remain enabled
    expect(result.current.enabled['Eid al-Fitr']).toBe(true)
  })

  it('toggle twice restores the event to true', () => {
    const { result } = renderHook(() => useIslamicReminderSettings())
    act(() => {
      result.current.toggle('Ashura')
    })
    expect(result.current.enabled['Ashura']).toBe(false)
    act(() => {
      result.current.toggle('Ashura')
    })
    expect(result.current.enabled['Ashura']).toBe(true)
  })

  it('persists state to localStorage on toggle', () => {
    const { result } = renderHook(() => useIslamicReminderSettings())
    act(() => {
      result.current.toggle('Ramadan')
    })
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    expect(stored['Ramadan']).toBe(false)
  })

  it('restores persisted state on re-initialisation', () => {
    // Simulate prior state in localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ Ramadan: false, 'Eid al-Fitr': true }))
    const { result } = renderHook(() => useIslamicReminderSettings())
    // Saved values are restored
    expect(result.current.enabled['Ramadan']).toBe(false)
    expect(result.current.enabled['Eid al-Fitr']).toBe(true)
    // Events not in saved state default to true
    expect(result.current.enabled['Ashura']).toBe(true)
  })
})
