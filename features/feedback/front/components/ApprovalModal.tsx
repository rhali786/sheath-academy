'use client'

import { useState } from 'react'

interface ApprovalModalProps {
  feedbackId: string
  feedbackMessage: string | undefined
  onConfirm: (id: string) => Promise<void>
  onCancel: () => void
}

export function ApprovalModal({ feedbackId, feedbackMessage, onConfirm, onCancel }: ApprovalModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    setIsSubmitting(true)
    setError(null)
    try {
      await onConfirm(feedbackId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40" onClick={onCancel}>
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="approval-title"
      >
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 id="approval-title" className="text-lg font-semibold text-slate-900">
            Approve feedback
          </h2>
        </div>

        <div className="px-6 py-4 space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to approve this feedback for processing?
          </p>
          {feedbackMessage && (
            <div className="bg-slate-50 p-3 rounded border border-slate-200">
              <p className="text-sm text-slate-700 line-clamp-3">{feedbackMessage}</p>
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-forest-900 rounded-lg hover:bg-forest-800 disabled:opacity-50"
          >
            {isSubmitting ? 'Approving…' : 'Approve'}
          </button>
        </div>
      </div>
    </div>
  )
}
