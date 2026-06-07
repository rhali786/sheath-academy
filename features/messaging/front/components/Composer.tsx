'use client'

import React, { useRef, useState } from 'react'
import { Paperclip, Send } from 'lucide-react'
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
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    const trimmed = text.trim()
    if (!trimmed || sending) return

    setSending(true)
    try {
      const res = await sendMessage(conversationId, trimmed)
      onMessageSent?.(res.data)
      setText('')
    } catch {
      // keep draft on failure
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
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
    <div data-testid="composer" className="border-t border-slate-200 bg-white px-4 py-3">
      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-forest-700 hover:bg-forest-50"
          aria-label="Attach image"
        >
          <Paperclip className="h-5 w-5" />
        </button>

        <div className="flex min-w-0 flex-1 items-end gap-2 rounded-2xl border border-forest-100 bg-forest-50 px-4 py-2 shadow-sm">
          <textarea
            data-testid="composer-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            rows={1}
            className="max-h-32 min-h-[1.5rem] w-full resize-none bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="button"
            data-testid="composer-send"
            onClick={() => void handleSend()}
            disabled={sending || !text.trim()}
            className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-forest-900 text-white hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>

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
