'use client'

import React, { createContext, useState, useContext, ReactNode } from 'react'

interface MessagingContextType {
  selectedConversationId: string | null
  setSelectedConversationId: (id: string | null) => void
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined)

export function MessagingProvider({ children }: { children: ReactNode }) {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)

  return (
    <MessagingContext.Provider value={{ selectedConversationId, setSelectedConversationId }}>
      {children}
    </MessagingContext.Provider>
  )
}

export function useMessagingContext(): MessagingContextType {
  const ctx = useContext(MessagingContext)
  if (!ctx) throw new Error('useMessagingContext must be used within MessagingProvider')
  return ctx
}
