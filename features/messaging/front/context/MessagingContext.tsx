'use client'

import React, { createContext, useState, useContext, ReactNode } from 'react'
import type { ConversationSummary } from '@/features/messaging/types'
import { useConversations } from '@/features/messaging/front/hooks/useConversations'

interface MessagingContextType {
  conversations: ConversationSummary[]
  loading: boolean
  error: string | null
  reload: () => void
  selectedConversationId: string | null
  setSelectedConversationId: (id: string | null) => void
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined)

export function MessagingProvider({ children }: { children: ReactNode }) {
  const { conversations, loading, error, reload } = useConversations()
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)

  return (
    <MessagingContext.Provider value={{ conversations, loading, error, reload, selectedConversationId, setSelectedConversationId }}>
      {children}
    </MessagingContext.Provider>
  )
}

export function useMessagingContext(): MessagingContextType {
  const ctx = useContext(MessagingContext)
  if (!ctx) throw new Error('useMessagingContext must be used within MessagingProvider')
  return ctx
}
