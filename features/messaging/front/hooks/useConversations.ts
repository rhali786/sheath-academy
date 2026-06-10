'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ConversationSummary } from '@/features/messaging/types'
import { listConversations } from '@/features/messaging/front/services/api'

export interface UseConversationsResult {
  conversations: ConversationSummary[]
  loading: boolean
  error: string | null
  reload: () => void
}

export function useConversations(): UseConversationsResult {
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)

    const fetch = async () => {
      try {
        const res = await listConversations()
        if (!active) return
        setConversations(res.data.conversations)
        setLoading(false)
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Failed to load conversations')
        setLoading(false)
      }
    }

    void fetch()
    return () => { active = false }
  }, [tick])

  const reload = useCallback(() => setTick((t) => t + 1), [])

  return { conversations, loading, error, reload }
}
