'use client'

import { useState, useCallback } from 'react'
import type { IslamicEventName } from '@/features/islamic-calendar/types'

const STORAGE_KEY = 'islamicReminderSettings'

const ALL_EVENTS: IslamicEventName[] = [
  'Ramadan', 'Eid al-Fitr', 'Eid al-Adha',
  'Day of Arafah', 'Ashura', 'White Days', 'Sacred Month',
]

function readFromStorage(): Partial<Record<IslamicEventName, boolean>> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Partial<Record<IslamicEventName, boolean>>
  } catch {
    return {}
  }
}

function buildEnabled(
  saved: Partial<Record<IslamicEventName, boolean>>,
): Record<IslamicEventName, boolean> {
  return Object.fromEntries(
    ALL_EVENTS.map(name => [name, saved[name] ?? true])
  ) as Record<IslamicEventName, boolean>
}

export interface IslamicReminderSettings {
  enabled: Record<IslamicEventName, boolean>
  toggle: (name: IslamicEventName) => void
}

export function useIslamicReminderSettings(): IslamicReminderSettings {
  const [enabled, setEnabled] = useState<Record<IslamicEventName, boolean>>(
    () => buildEnabled(readFromStorage())
  )

  const toggle = useCallback((name: IslamicEventName) => {
    setEnabled(prev => {
      const next = { ...prev, [name]: !prev[name] }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // localStorage unavailable (SSR or private mode) — state still works in-memory
      }
      return next
    })
  }, [])

  return { enabled, toggle }
}
