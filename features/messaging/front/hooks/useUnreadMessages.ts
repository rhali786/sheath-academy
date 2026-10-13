'use client'

import { useState, useEffect } from 'react'
import { getUnread } from '@/features/messaging/front/services/api'

/** `enabled: false` never polls: messaging is parent-only, so a learner would get a 403 every 15 s. */
export function useUnreadMessages({ enabled = true }: { enabled?: boolean } = {}): { count: number } {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!enabled) return
    let active = true

    const poll = async () => {
      try {
        const res = await getUnread()
        if (active) setCount(res.data.count)
      } catch {}
    }

    void poll()
    const id = setInterval(() => void poll(), 15000)

    return () => {
      active = false
      clearInterval(id)
    }
  }, [enabled])

  return { count }
}
