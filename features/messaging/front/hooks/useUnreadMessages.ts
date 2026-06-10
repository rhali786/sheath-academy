'use client'

import { useState, useEffect } from 'react'
import { getUnread } from '@/features/messaging/front/services/api'

export function useUnreadMessages(): { count: number } {
  const [count, setCount] = useState(0)

  useEffect(() => {
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
  }, [])

  return { count }
}
