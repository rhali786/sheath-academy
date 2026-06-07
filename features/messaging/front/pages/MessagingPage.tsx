'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { MessageSquarePlus, Users } from 'lucide-react'
import { MessagingProvider, useMessagingContext } from '@/features/messaging/front/context/MessagingContext'
import { ConversationList } from '@/features/messaging/front/components/ConversationList'
import { NewMessageModal } from '@/features/messaging/front/components/NewMessageModal'
import { NewGroupModal } from '@/features/messaging/front/components/NewGroupModal'
import { useSession } from 'next-auth/react'
import type { Conversation } from '@/features/messaging/types'

const ThreadView = dynamic(
  () => import('@/features/messaging/front/components/ThreadView').then((m) => ({ default: m.ThreadView })),
  { ssr: false },
)

function MessagingPageInner() {
  const { selectedConversationId, setSelectedConversationId } = useMessagingContext()
  const { data: session } = useSession()
  const currentUserId = session?.user?.userId ?? ''

  const [showNewMessage, setShowNewMessage] = useState(false)
  const [showNewGroup, setShowNewGroup] = useState(false)
  const [listKey, setListKey] = useState(0)

  const handleConversationCreated = (conv: Conversation) => {
    setShowNewMessage(false)
    setShowNewGroup(false)
    setListKey((k) => k + 1)
    setSelectedConversationId(conv.id)
  }

  const handleBack = () => setSelectedConversationId(null)

  return (
    <div data-testid="messaging-page" className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="page-title mb-0">Messages</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewMessage(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-forest-900 px-4 py-2 text-sm font-medium text-white hover:bg-forest-800"
            aria-label="New message"
          >
            <MessageSquarePlus className="h-4 w-4" />
            Message
          </button>
          <button
            onClick={() => setShowNewGroup(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            aria-label="New group"
          >
            <Users className="h-4 w-4" />
            Group
          </button>
        </div>
      </div>

      <div
        data-testid="messaging-shell"
        className="card-lg flex h-[calc(100vh-var(--app-header-height)-7rem)] min-h-[28rem] overflow-hidden border border-slate-200 p-0"
      >
        <div
          data-testid="conversation-list-pane"
          className={`flex w-full flex-shrink-0 flex-col border-r border-slate-200 bg-white md:w-80 ${
            selectedConversationId ? 'hidden md:flex' : 'flex'
          }`}
        >
          <ConversationList
            key={listKey}
            selectedConversationId={selectedConversationId}
            onSelect={setSelectedConversationId}
            currentUserId={currentUserId}
          />
        </div>

        <div
          data-testid="thread-pane"
          className={`flex min-w-0 flex-1 flex-col overflow-hidden ${
            selectedConversationId ? 'flex' : 'hidden md:flex'
          }`}
        >
          {selectedConversationId ? (
            <ThreadView
              conversationId={selectedConversationId}
              currentUserId={currentUserId}
              onBack={handleBack}
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center bg-slate-50 px-6 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white text-forest-700 shadow-sm">
                <MessageSquarePlus className="h-7 w-7" />
              </div>
              <p className="text-base font-medium text-slate-700">Select a conversation</p>
              <p className="mt-1 max-w-sm text-sm text-slate-500">
                Choose a thread from the left, or start a new message with someone in your household.
              </p>
            </div>
          )}
        </div>
      </div>

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
