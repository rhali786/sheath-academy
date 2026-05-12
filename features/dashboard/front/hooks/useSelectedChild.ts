'use client'

import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'sheath.selectedChildId'

export function useSelectedChild(): [string | null, (id: string | null) => void] {
  const [selectedChildId, setState] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (raw === null || raw === '') {
        setState(null)
      } else {
        setState(raw)
      }
    } catch {
      setState(null)
    }
  }, [])

  const setSelectedChildId = useCallback((id: string | null) => {
    setState(id)
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
