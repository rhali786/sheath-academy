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
  /**
   * A second destructive choice shown before the main one, e.g. "Just Hawa" next to
   * "All learners in this group". Outlined so the two are distinguishable.
   */
  secondaryAction?: { label: string; onConfirm: () => void | Promise<void> }
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
  secondaryAction,
}: Props) {
  const [pendingChoice, setPendingChoice] = useState<'primary' | 'secondary' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const pending = pendingChoice !== null

  async function run(choice: 'primary' | 'secondary', action: () => void | Promise<void>) {
    setError(null)
    setPendingChoice(choice)
    try {
      await action()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setPendingChoice(null)
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
        {secondaryAction && (
          <button
            type="button"
            onClick={() => run('secondary', secondaryAction.onConfirm)}
            disabled={pending}
            aria-label={secondaryAction.label}
            className={`flex items-center gap-1 text-xs ${TONE_TEXT[tone]} bg-white border ${TONE_BORDER[tone]} hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50`}
          >
            {pendingChoice === 'secondary' ? pendingLabel : secondaryAction.label}
          </button>
        )}
        <button
          type="button"
          onClick={() => run('primary', onConfirm)}
          disabled={pending}
          aria-label={confirmLabel}
          className={`flex items-center gap-1 text-xs text-white ${TONE_CONFIRM[tone]} px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50`}
        >
          <Check className="w-3 h-3" /> {pendingChoice === 'primary' ? pendingLabel : confirmLabel}
        </button>
      </div>
    </div>
  )
}
