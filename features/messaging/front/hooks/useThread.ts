'use client'

import { useState, useEffect, useRef } from 'react'
import type { Message } from '@/features/messaging/types'
import { getConversation, getMessages } from '@/features/messaging/front/services/api'

export interface UseThreadResult {
  messages: Message[]
  loading: boolean
  error: string | null
}

export function useThread(conversationId: string): UseThreadResult {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const cursorRef = useRef<string | null>(null)
  const seenRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    let active = true
    cursorRef.current = null
    seenRef.current = new Set()
    setMessages([])
    setLoading(true)
    setError(null)

    const initialLoad = async () => {
      try {
        const res = await getConversation(conversationId)
        if (!active) return
        const initial = res.data.messages
        const newSeen = new Set(initial.map((m) => m.id))
        seenRef.current = newSeen
        cursorRef.current = initial.length > 0 ? initial[initial.length - 1].id : null
        setMessages(initial)
        setLoading(false)
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Failed to load thread')
        setLoading(false)
      }
    }

    const poll = async () => {
      if (!active) return
      try {
        const after = cursorRef.current ?? undefined
        const res = await getMessages(conversationId, after)
        if (!active) return
        const incoming = res.data.messages.filter((m) => !seenRef.current.has(m.id))
        if (incoming.length > 0) {
          incoming.forEach((m) => seenRef.current.add(m.id))
          cursorRef.current = incoming[incoming.length - 1].id
          setMessages((prev) => [...prev, ...incoming])
        }
      } catch {}
    }

    void initialLoad().then(() => {
      if (!active) return
    })

    const id = setInterval(() => void poll(), 3000)

    return () => {
      active = false
      clearInterval(id)
    }
  }, [conversationId])

  return { messages, loading, error }
}
