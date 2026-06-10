'use client'

import { useCallback, useState } from 'react'
import type { NavModuleId } from '@/features/layout/lib/navConfig'

const KEY_PREFIX = 'sheath.module.lastHref.'

function readStorage(moduleId: NavModuleId): string | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(KEY_PREFIX + moduleId)
    return raw || null
  } catch {
    return null
  }
}

export function useModuleLastDestination(
  moduleId: NavModuleId,
): [string | null, (href: string) => void] {
  const [lastHref, setLastHref] = useState<string | null>(() => readStorage(moduleId))

  const setDestination = useCallback(
    (href: string) => {
      setLastHref(href)
      if (typeof window === 'undefined') return
      try {
        sessionStorage.setItem(KEY_PREFIX + moduleId, href)
      } catch {
        /* ignore quota / private mode */
      }
    },
    [moduleId],
  )

  return [lastHref, setDestination]
}
