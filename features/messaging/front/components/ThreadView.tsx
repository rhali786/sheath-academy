'use client'

import React, { useEffect, useCallback, useRef, useState } from 'react'
import { ArrowLeft, MessageCircle, UserPlus } from 'lucide-react'
import { useThread } from '@/features/messaging/front/hooks/useThread'
import { markRead, removeParticipant } from '@/features/messaging/front/services/api'
import { InlineConfirm } from '@/features/lib/front/components/InlineConfirm'
import { Composer } from '@/features/messaging/front/components/Composer'
import { Avatar } from '@/features/messaging/front/components/Avatar'
import { MessageBubble } from '@/features/messaging/front/components/MessageBubble'
import { formatDaySeparator } from '@/features/messaging/front/lib/formatRelativeTime'

interface ThreadViewProps {
  conversationId: string
  currentUserId?: string
  onBack?: () => void
  onAddParticipant?: () => void
}

export function ThreadView({ conversationId, currentUserId, onBack, onAddParticipant }: ThreadViewProps) {
  const { messages, participants, conversation, loading, error } = useThread(conversationId)
  const [leaveConfirm, setLeaveConfirm] = useState(false)
  const [localMessages, setLocalMessages] = useState(messages)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    markRead(conversationId).catch(() => {})
  }, [conversationId])

  useEffect(() => {
    if (messages.length > 0) {
      markRead(conversationId).catch(() => {})
    }
    setLocalMessages(messages)
  }, [messages, conversationId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: 'auto', block: 'end' })
  }, [localMessages.length])

  const handleMessageSent = useCallback((msg: any) => {
    setLocalMessages((prev) => [...prev, msg])
  }, [])

  const handleLeave = useCallback(async () => {
    if (!currentUserId) return
    await removeParticipant(conversationId, currentUserId)
    onBack?.()
  }, [conversationId, currentUserId, onBack])

  const myParticipant = participants.find((p) => p.userId === currentUserId)
  const isAdmin = myParticipant?.role === 'admin'

  const otherParticipant = participants.find((p) => p.userId !== currentUserId)
  const headerTitle = conversation?.type === 'group'
    ? (conversation.title || 'Group')
    : (otherParticipant?.userName || otherParticipant?.userEmail || 'Conversation')

  const headerSubtitle = conversation?.type === 'group'
    ? `${participants.length} members`
    : 'Direct message'

  const headerAvatar = conversation?.type === 'group'
    ? { name: conversation.title, email: conversation.id }
    : { name: otherParticipant?.userName, email: otherParticipant?.userEmail }

  if (loading) {
    return (
      <div data-testid="thread-view-loading" className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-lg animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex space-x-3">
              <div className="h-8 w-8 rounded-full bg-slate-200" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-2/3 rounded bg-slate-200" />
                <div className="h-3 w-1/3 rounded bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div data-testid="thread-view-error" className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <p className="mb-2 text-sm text-red-600">Failed to load messages</p>
        <p className="text-xs text-slate-500">{error}</p>
      </div>
    )
  }

  return (
    <div data-testid="thread-view" className="flex h-full flex-col bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="mr-1 inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900 md:hidden"
              aria-label="Back to conversations"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <Avatar name={headerAvatar.name} email={headerAvatar.email} size="md" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900">{headerTitle}</p>
            <p className="truncate text-xs text-slate-500">{headerSubtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={onAddParticipant}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-forest-700 hover:bg-forest-50"
              aria-label="Add participant"
            >
              <UserPlus className="h-4 w-4" />
              Add
            </button>
          )}
          {currentUserId && !leaveConfirm && (
            <button
              onClick={() => setLeaveConfirm(true)}
              className="rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-red-50 hover:text-red-600"
            >
              Leave
            </button>
          )}
        </div>
      </div>

      {currentUserId && leaveConfirm && (
        <div className="border-b border-slate-200 px-4 py-3">
          <InlineConfirm
            message="Leave this conversation?"
            confirmLabel="Leave"
            onConfirm={handleLeave}
            onCancel={() => setLeaveConfirm(false)}
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto bg-slate-50 px-4 py-4">
        {localMessages.length === 0 ? (
          <div data-testid="thread-empty" className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-forest-700 shadow-sm">
              <MessageCircle className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-slate-700">No messages yet</p>
            <p className="mt-1 text-sm text-slate-500">Say hello to start the conversation</p>
          </div>
        ) : (
          <>
            {localMessages.map((msg, index) => {
              const isOutgoing = msg.senderUserId === currentUserId
              const previous = localMessages[index - 1]
              const daySeparator = formatDaySeparator(msg.createdAt)
              const prevDaySeparator = previous ? formatDaySeparator(previous.createdAt) : null
              const newDay = daySeparator !== prevDaySeparator
              const firstOfGroup = newDay || !previous || previous.senderUserId !== msg.senderUserId

              return (
                <React.Fragment key={msg.id}>
                  {newDay && (
                    <div data-testid="day-separator" className="flex items-center justify-center py-3">
                      <span className="rounded-full bg-slate-200/70 px-3 py-1 text-xs font-medium text-slate-500">
                        {daySeparator}
                      </span>
                    </div>
                  )}
                  <MessageBubble
                    message={msg}
                    direction={isOutgoing ? 'outgoing' : 'incoming'}
                    firstOfGroup={firstOfGroup}
                    senderName={msg.senderName}
                    senderEmail={participants.find((p) => p.userId === msg.senderUserId)?.userEmail}
                  />
                </React.Fragment>
              )
            })}
            <div ref={bottomRef} aria-hidden="true" />
          </>
        )}
      </div>

      <Composer conversationId={conversationId} onMessageSent={handleMessageSent} />
    </div>
  )
}
