'use client'

import React, { useRef } from 'react'
import { MessageInput } from '@chatscope/chat-ui-kit-react'
import { sendMessage } from '@/features/messaging/front/services/api'
import type { Message } from '@/features/messaging/types'

interface ComposerProps {
  conversationId: string
  onMessageSent?: (message: Message) => void
}

const MAX_ATTACHMENT_SIZE = 1024 * 1024 // 1MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export function Composer({ conversationId, onMessageSent }: ComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSend = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    try {
      const res = await sendMessage(conversationId, trimmed)
      onMessageSent?.(res.data)
    } catch {}
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_ATTACHMENT_SIZE) {
      alert('Image must be 1MB or smaller')
      e.target.value = ''
      return
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      alert('Only image files (JPEG, PNG, GIF, WebP) are allowed')
      e.target.value = ''
      return
    }
    // TODO: upload attachment and include in message
  }

  return (
    <div data-testid="composer" className="border-t border-gray-200 bg-white">
      <MessageInput
        placeholder="Type a message…"
        onSend={handleSend}
        attachButton={false}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        data-testid="composer-file-input"
      />
    </div>
  )
}
