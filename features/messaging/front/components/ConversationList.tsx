'use client'

import React from 'react'
import type { ConversationSummary } from '@/features/messaging/types'
import { useConversations } from '@/features/messaging/front/hooks/useConversations'

interface ConversationListProps {
  selectedConversationId?: string | null
  onSelect?: (id: string) => void
  currentUserId?: string
}

function getConversationLabel(conv: ConversationSummary, currentUserId?: string): string {
  if (conv.type === 'group' && conv.title) return conv.title
  if (conv.type === 'direct') {
    const other = conv.participants.find((p) => p.userId !== currentUserId)
    return other?.userName || other?.userEmail || 'Unknown'
  }
  return conv.title || 'Unnamed'
}

export function ConversationList({ selectedConversationId, onSelect, currentUserId }: ConversationListProps) {
  const { conversations, loading, error, reload } = useConversations()

  if (loading) {
    return (
      <div data-testid="conversation-list-loading" className="p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse flex space-x-3">
            <div className="rounded-full bg-gray-200 h-10 w-10" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-3 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div data-testid="conversation-list-error" className="p-4 text-center">
        <p className="text-red-600 text-sm mb-3">Failed to load conversations</p>
        <button
          onClick={reload}
          className="text-sm text-forest-600 underline hover:text-forest-800"
        >
          Retry
        </button>
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div data-testid="conversation-list-empty" className="p-6 text-center text-gray-500 text-sm">
        No conversations yet — start one
      </div>
    )
  }

  return (
    <div data-testid="conversation-list" className="divide-y divide-gray-100 overflow-y-auto">
      {conversations.map((conv) => {
        const label = getConversationLabel(conv, currentUserId)
        const isSelected = conv.id === selectedConversationId
        return (
          <button
            key={conv.id}
            data-testid={`conversation-item-${conv.id}`}
            onClick={() => onSelect?.(conv.id)}
            className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
              isSelected ? 'bg-forest-50 border-l-2 border-forest-600' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <span className="font-medium text-sm text-gray-900 truncate flex-1">{label}</span>
              {conv.unreadCount > 0 && (
                <span
                  data-testid={`unread-badge-${conv.id}`}
                  className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-forest-600 rounded-full flex-shrink-0"
                >
                  {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                </span>
              )}
            </div>
            {conv.lastMessage && (
              <p className="text-xs text-gray-500 truncate mt-0.5">{conv.lastMessage.body}</p>
            )}
          </button>
        )
      })}
    </div>
  )
}
