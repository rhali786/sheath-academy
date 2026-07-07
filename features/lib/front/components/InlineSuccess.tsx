'use client'

import { useEffect, useRef, useState } from 'react'
import { CheckCircle, X } from 'lucide-react'

interface ActionProps {
  label: string
  onAction: () => void
}

interface Props {
  message: string
  dismissAfterMs?: number
  onDismiss?: () => void
  /** Optional undo/action button. When set, auto-dismiss defaults to 8000ms. */
  action?: ActionProps
}

export function InlineSuccess({ message, dismissAfterMs, onDismiss, action }: Props) {
  const resolvedDismissMs = dismissAfterMs ?? (action ? 8000 : 3000)
  const [visible, setVisible] = useState(true)
  const onDismissRef = useRef(onDismiss)
  onDismissRef.current = onDismiss

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      onDismissRef.current?.()
    }, resolvedDismissMs)
    return () => clearTimeout(timer)
  }, [resolvedDismissMs])

  if (!visible) return null

  function handleDismiss() {
    setVisible(false)
    onDismissRef.current?.()
  }

  return (
    <div
      role="status"
      className="flex items-center justify-between gap-3 border border-green-200 rounded-lg p-3 bg-green-50"
    >
      <div className="flex items-center gap-2 text-sm text-green-700">
        <CheckCircle className="w-4 h-4 flex-shrink-0" />
        <span>{message}</span>
      </div>
      <div className="flex items-center gap-1">
        {action && (
          <button
            type="button"
            onClick={() => {
              action.onAction()
              handleDismiss()
            }}
            className="text-xs font-medium text-green-700 hover:text-green-900 underline underline-offset-2 transition-colors px-1"
          >
            {action.label}
          </button>
        )}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="text-green-600 hover:text-green-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
