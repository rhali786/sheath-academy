'use client'

import React from 'react'
import { MessageSquare } from 'lucide-react'
import type { ConversationSummary } from '@/features/messaging/types'
import { useConversations } from '@/features/messaging/front/hooks/useConversations'
import { Avatar } from '@/features/messaging/front/components/Avatar'
import { formatRelativeTime } from '@/features/messaging/front/lib/formatRelativeTime'

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

function getConversationAvatar(conv: ConversationSummary, currentUserId?: string) {
  if (conv.type === 'group') {
    return { name: conv.title, email: conv.id }
  }
  const other = conv.participants.find((p) => p.userId !== currentUserId)
  return { name: other?.userName, email: other?.userEmail }
}

export function ConversationList({ selectedConversationId, onSelect, currentUserId }: ConversationListProps) {
  const { conversations, loading, error, reload } = useConversations()

  if (loading) {
    return (
      <div data-testid="conversation-list-loading" className="space-y-3 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex animate-pulse space-x-3">
            <div className="h-10 w-10 rounded-full bg-slate-200" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-3 w-3/4 rounded bg-slate-200" />
              <div className="h-3 w-1/2 rounded bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div data-testid="conversation-list-error" className="p-6 text-center">
        <p className="mb-3 text-sm text-red-600">Failed to load conversations</p>
        <button
          onClick={reload}
          className="rounded-lg bg-forest-900 px-4 py-2 text-sm font-medium text-white hover:bg-forest-800"
        >
          Retry
        </button>
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div data-testid="conversation-list-empty" className="flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-forest-50 text-forest-700">
          <MessageSquare className="h-6 w-6" />
        </div>
        <p className="text-sm font-medium text-slate-700">No conversations yet — start one</p>
        <p className="mt-1 text-sm text-slate-500">Use Message or Group above</p>
      </div>
    )
  }

  return (
    <div data-testid="conversation-list" className="overflow-y-auto">
      {conversations.map((conv) => {
        const label = getConversationLabel(conv, currentUserId)
        const avatar = getConversationAvatar(conv, currentUserId)
        const isSelected = conv.id === selectedConversationId
        const isUnread = conv.unreadCount > 0
        const timestamp = conv.lastMessageAt ? formatRelativeTime(conv.lastMessageAt) : ''

        return (
          <button
            key={conv.id}
            data-testid={`conversation-item-${conv.id}`}
            onClick={() => onSelect?.(conv.id)}
            className={`w-full border-b border-l-4 border-slate-100 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
              isSelected ? 'border-l-forest-600 bg-forest-50' : 'border-l-transparent bg-white'
            }`}
          >
            <div className="flex items-start gap-3">
              <Avatar name={avatar.name} email={avatar.email} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`truncate text-sm ${
                      isUnread ? 'font-bold text-slate-900' : 'font-medium text-slate-800'
                    }`}
                  >
                    {label}
                  </span>
                  {timestamp && (
                    <span
                      data-testid={`conversation-timestamp-${conv.id}`}
                      className={`flex-shrink-0 text-xs ${
                        isUnread ? 'font-semibold text-forest-700' : 'text-slate-400'
                      }`}
                    >
                      {timestamp}
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center justify-between gap-2">
                  {conv.lastMessage ? (
                    <p
                      className={`truncate text-xs ${
                        isUnread ? 'font-medium text-slate-700' : 'text-slate-500'
                      }`}
                    >
                      {conv.lastMessage.body}
                    </p>
                  ) : (
                    <p className="truncate text-xs italic text-slate-400">No messages yet</p>
                  )}
                  {isUnread && (
                    <span
                      data-testid={`unread-badge-${conv.id}`}
                      className="badge badge-green flex-shrink-0 min-w-[1.25rem] justify-center px-2"
                    >
                      {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
