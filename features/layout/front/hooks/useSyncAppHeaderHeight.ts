'use client'

import { useEffect, type RefObject } from 'react'
import { setAppHeaderHeight, clearAppHeaderHeight } from '@/features/layout/lib/appHeaderHeight'

export function useSyncAppHeaderHeight(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const el = ref.current
    if (!el) return

    const sync = () => setAppHeaderHeight(el.offsetHeight)

    sync()

    const ro = new ResizeObserver(sync)
    ro.observe(el)

    return () => {
      ro.disconnect()
      clearAppHeaderHeight()
    }
  }, [ref])
}
