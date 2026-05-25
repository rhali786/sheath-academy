'use client'

import { useCallback, useState } from 'react'

const STORAGE_KEY = 'sheath.selectedChildId'

function readStorageSync(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw || null
  } catch {
    return null
  }
}

export function useSelectedChild(): [string | null, (id: string | null) => void] {
  const [selectedChildId, setState] = useState<string | null>(readStorageSync)

  const setSelectedChildId = useCallback((id: string | null) => {
    setState(id || null)
    if (typeof window === 'undefined') return
    try {
      if (id === null || id === '') {
        sessionStorage.removeItem(STORAGE_KEY)
      } else {
        sessionStorage.setItem(STORAGE_KEY, id)
      }
    } catch {
      /* ignore quota / private mode */
    }
  }, [])

  return [selectedChildId, setSelectedChildId]
}
