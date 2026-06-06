'use client'

import React, { useState } from 'react'
import { MessagingProvider, useMessagingContext } from '@/features/messaging/front/context/MessagingContext'
import { ConversationList } from '@/features/messaging/front/components/ConversationList'
import { ThreadView } from '@/features/messaging/front/components/ThreadView'
import { NewMessageModal } from '@/features/messaging/front/components/NewMessageModal'
import { NewGroupModal } from '@/features/messaging/front/components/NewGroupModal'
import { useSession } from 'next-auth/react'
import type { Conversation } from '@/features/messaging/types'

function MessagingPageInner() {
  const { conversations, loading, error, reload, selectedConversationId, setSelectedConversationId } = useMessagingContext()
  const { data: session } = useSession()
  const currentUserId = (session?.user as any)?.id ?? ''

  const [showNewMessage, setShowNewMessage] = useState(false)
  const [showNewGroup, setShowNewGroup] = useState(false)

  const handleConversationCreated = (conv: Conversation) => {
    setShowNewMessage(false)
    setShowNewGroup(false)
    reload()
    setSelectedConversationId(conv.id)
  }

  const handleBack = () => setSelectedConversationId(null)

  return (
    <div data-testid="messaging-page" className="flex h-full overflow-hidden">
      {/* Left pane: conversation list */}
      {/* On mobile: hidden when a conversation is selected */}
      <div
        data-testid="conversation-list-pane"
        className={`
          flex flex-col w-full md:w-80 border-r border-gray-200 bg-white flex-shrink-0
          ${selectedConversationId ? 'hidden md:flex' : 'flex'}
        `}
      >
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h1 className="text-lg font-semibold text-gray-900">Messages</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNewMessage(true)}
              className="text-sm text-forest-600 hover:text-forest-800 font-medium"
              aria-label="New message"
            >
              + Message
            </button>
            <button
              onClick={() => setShowNewGroup(true)}
              className="text-sm text-forest-600 hover:text-forest-800 font-medium"
              aria-label="New group"
            >
              + Group
            </button>
          </div>
        </div>

        <ConversationList
          selectedConversationId={selectedConversationId}
          onSelect={setSelectedConversationId}
          currentUserId={currentUserId}
        />
      </div>

      {/* Right pane: thread or placeholder */}
      <div
        data-testid="thread-pane"
        className={`
          flex-1 flex flex-col overflow-hidden
          ${selectedConversationId ? 'flex' : 'hidden md:flex'}
        `}
      >
        {selectedConversationId ? (
          <ThreadView
            conversationId={selectedConversationId}
            currentUserId={currentUserId}
            onBack={handleBack}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Select a conversation to start messaging
          </div>
        )}
      </div>

      {/* Modals */}
      {showNewMessage && (
        <NewMessageModal
          onClose={() => setShowNewMessage(false)}
          onCreated={handleConversationCreated}
          currentUserId={currentUserId}
        />
      )}
      {showNewGroup && (
        <NewGroupModal
          onClose={() => setShowNewGroup(false)}
          onCreated={handleConversationCreated}
          currentUserId={currentUserId}
        />
      )}
    </div>
  )
}

export function MessagingPage() {
  return (
    <MessagingProvider>
      <MessagingPageInner />
    </MessagingProvider>
  )
}
