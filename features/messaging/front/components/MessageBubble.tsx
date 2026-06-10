'use client'

import React from 'react'
import type { Message } from '@/features/messaging/types'
import { Avatar } from '@/features/messaging/front/components/Avatar'
import { formatRelativeTime } from '@/features/messaging/front/lib/formatRelativeTime'

interface MessageBubbleProps {
  message: Message
  direction: 'incoming' | 'outgoing'
  /** First message of a same-sender run: show avatar + name, add top spacing. */
  firstOfGroup?: boolean
  senderName?: string | null
  senderEmail?: string
}

export function MessageBubble({
  message,
  direction,
  firstOfGroup = true,
  senderName,
  senderEmail,
}: MessageBubbleProps) {
  const isOutgoing = direction === 'outgoing'

  return (
    <div
      data-testid={`message-bubble-${message.id}`}
      data-direction={direction}
      className={`group flex items-end gap-2 ${isOutgoing ? 'justify-end' : 'justify-start'} ${
        firstOfGroup ? 'mt-3' : 'mt-0.5'
      }`}
    >
      {!isOutgoing && (
        firstOfGroup
          ? <Avatar name={senderName} email={senderEmail} size="sm" />
          : <div className="h-8 w-8 flex-shrink-0" aria-hidden="true" />
      )}

      <div className={`flex max-w-[75%] flex-col ${isOutgoing ? 'items-end' : 'items-start'}`}>
        {!isOutgoing && firstOfGroup && senderName && (
          <span className="mb-1 px-1 text-xs font-medium text-slate-500">{senderName}</span>
        )}
        <div
          className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
            isOutgoing
              ? 'rounded-br-md bg-forest-600 text-white'
              : 'rounded-bl-md border border-slate-200 bg-white text-slate-900'
          }`}
        >
          {message.body}
        </div>
        <span
          data-testid={`message-timestamp-${message.id}`}
          className="mt-1 px-1 text-[11px] text-slate-400 opacity-0 transition-opacity group-hover:opacity-100"
        >
          {formatRelativeTime(message.createdAt)}
        </span>
      </div>
    </div>
  )
}
