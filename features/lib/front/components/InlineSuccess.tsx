'use client'

import { useEffect, useRef, useState } from 'react'
import { CheckCircle, X } from 'lucide-react'

interface Props {
  message: string
  dismissAfterMs?: number
  onDismiss?: () => void
}

export function InlineSuccess({ message, dismissAfterMs = 3000, onDismiss }: Props) {
  const [visible, setVisible] = useState(true)
  const onDismissRef = useRef(onDismiss)
  onDismissRef.current = onDismiss

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      onDismissRef.current?.()
    }, dismissAfterMs)
    return () => clearTimeout(timer)
  }, [dismissAfterMs])

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
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss"
        className="text-green-600 hover:text-green-800 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
