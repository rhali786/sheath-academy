'use client'

import React, { useEffect, useCallback, useState } from 'react'
import { MessageList, Message } from '@chatscope/chat-ui-kit-react'
import { useThread } from '@/features/messaging/front/hooks/useThread'
import { markRead, removeParticipant, getConversation } from '@/features/messaging/front/services/api'
import type { ConversationParticipant } from '@/features/messaging/types'
import { Composer } from '@/features/messaging/front/components/Composer'

interface ThreadViewProps {
  conversationId: string
  currentUserId?: string
  onBack?: () => void
  onAddParticipant?: () => void
}

export function ThreadView({ conversationId, currentUserId, onBack, onAddParticipant }: ThreadViewProps) {
  const { messages, loading, error } = useThread(conversationId)
  const [participants, setParticipants] = useState<ConversationParticipant[]>([])
  const [convTitle, setConvTitle] = useState<string | null>(null)
  const [convType, setConvType] = useState<'direct' | 'group'>('direct')
  const [leaving, setLeaving] = useState(false)
  const [leaveConfirm, setLeaveConfirm] = useState(false)
  const [localMessages, setLocalMessages] = useState(messages)

  // Load participants and conversation meta
  useEffect(() => {
    let active = true
    getConversation(conversationId)
      .then((res) => {
        if (!active) return
        setParticipants(res.data.participants)
        setConvTitle(res.data.conversation.title)
        setConvType(res.data.conversation.type)
      })
      .catch(() => {})
    return () => { active = false }
  }, [conversationId])

  // Mark read on mount and on new messages
  useEffect(() => {
    markRead(conversationId).catch(() => {})
  }, [conversationId])

  useEffect(() => {
    if (messages.length > 0) {
      markRead(conversationId).catch(() => {})
    }
    setLocalMessages(messages)
  }, [messages, conversationId])

  const handleMessageSent = useCallback((msg: any) => {
    setLocalMessages((prev) => [...prev, msg])
  }, [])

  const handleLeave = useCallback(async () => {
    if (!currentUserId) return
    setLeaving(true)
    try {
      await removeParticipant(conversationId, currentUserId)
      onBack?.()
    } catch {
      setLeaving(false)
      setLeaveConfirm(false)
    }
  }, [conversationId, currentUserId, onBack])

  const myParticipant = participants.find((p) => p.userId === currentUserId)
  const isAdmin = myParticipant?.role === 'admin'

  const headerTitle = convType === 'group'
    ? (convTitle || 'Group')
    : (() => {
        const other = participants.find((p) => p.userId !== currentUserId)
        return other?.userName || other?.userEmail || 'Conversation'
      })()

  if (loading) {
    return (
      <div data-testid="thread-view-loading" className="flex-1 flex items-center justify-center p-8">
        <div className="animate-pulse space-y-3 w-full max-w-lg">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex space-x-3">
              <div className="rounded-full bg-gray-200 h-8 w-8" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-2/3" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div data-testid="thread-view-error" className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <p className="text-red-600 text-sm mb-2">Failed to load messages</p>
        <p className="text-gray-500 text-xs">{error}</p>
      </div>
    )
  }

  return (
    <div data-testid="thread-view" className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="text-gray-600 hover:text-gray-900 mr-1"
              aria-label="Back to conversations"
            >
              ←
            </button>
          )}
          <span className="font-semibold text-gray-900">{headerTitle}</span>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={onAddParticipant}
              className="text-sm text-forest-600 hover:text-forest-800"
              aria-label="Add participant"
            >
              + Add
            </button>
          )}
          {currentUserId && (
            <>
              {leaveConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Leave this conversation?</span>
                  <button
                    onClick={handleLeave}
                    disabled={leaving}
                    className="text-sm text-red-600 hover:text-red-800 font-medium"
                  >
                    {leaving ? 'Leaving…' : 'Confirm'}
                  </button>
                  <button
                    onClick={() => setLeaveConfirm(false)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setLeaveConfirm(true)}
                  className="text-sm text-gray-500 hover:text-red-600"
                >
                  Leave
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
        {localMessages.length === 0 ? (
          <div data-testid="thread-empty" className="text-center text-gray-400 text-sm mt-8">
            No messages yet — say hello!
          </div>
        ) : (
          <MessageList>
            {localMessages.map((msg) => (
              <Message
                key={msg.id}
                model={{
                  message: msg.body,
                  sentTime: msg.createdAt,
                  sender: msg.senderName || msg.senderUserId,
                  direction: msg.senderUserId === currentUserId ? 'outgoing' : 'incoming',
                  position: 'single',
                }}
              />
            ))}
          </MessageList>
        )}
      </div>

      {/* Composer */}
      <Composer conversationId={conversationId} onMessageSent={handleMessageSent} />
    </div>
  )
}
