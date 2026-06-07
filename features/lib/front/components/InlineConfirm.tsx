'use client'

import { useState } from 'react'
import { Check, X } from 'lucide-react'

type Tone = 'danger' | 'warning'

interface Props {
  message: string
  detail?: string
  confirmLabel?: string
  pendingLabel?: string
  cancelLabel?: string
  tone?: Tone
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

const TONE_BORDER: Record<Tone, string> = {
  danger: 'border-red-200',
  warning: 'border-amber-200',
}

const TONE_TEXT: Record<Tone, string> = {
  danger: 'text-red-700',
  warning: 'text-amber-700',
}

const TONE_CONFIRM: Record<Tone, string> = {
  danger: 'bg-red-600 hover:bg-red-700',
  warning: 'bg-amber-600 hover:bg-amber-700',
}

export function InlineConfirm({
  message,
  detail,
  confirmLabel = 'Delete',
  pendingLabel = 'Working…',
  cancelLabel = 'Cancel',
  tone = 'danger',
  onConfirm,
  onCancel,
}: Props) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    setError(null)
    setPending(true)
    try {
      await onConfirm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div
      role="group"
      aria-label={message}
      className={`border ${TONE_BORDER[tone]} rounded-lg p-4 bg-white space-y-3`}
    >
      <p className={`text-sm font-medium ${TONE_TEXT[tone]}`}>{message}</p>
      {detail && <p className="text-xs text-gray-500">{detail}</p>}
      {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          aria-label={cancelLabel}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5 border border-slate-200 rounded-lg transition-colors disabled:opacity-50"
        >
          <X className="w-3 h-3" /> {cancelLabel}
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={pending}
          aria-label={confirmLabel}
          className={`flex items-center gap-1 text-xs text-white ${TONE_CONFIRM[tone]} px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50`}
        >
          <Check className="w-3 h-3" /> {pending ? pendingLabel : confirmLabel}
        </button>
      </div>
    </div>
  )
}
