'use client'

import { useEffect, useState } from 'react'
import { listAdminFeedback } from '@/features/feedback/front/services/api'
import type { FeedbackRow, FeedbackSentiment } from '@/features/feedback/types'

const SENTIMENT_DISPLAY: Record<FeedbackSentiment, { emoji: string; label: string; className: string }> = {
  bad:  { emoji: '😣', label: 'Bad',  className: 'bg-red-50 text-red-700'    },
  poor: { emoji: '😕', label: 'Poor', className: 'bg-orange-50 text-orange-700' },
  okay: { emoji: '😐', label: 'Okay', className: 'bg-slate-50 text-slate-600'   },
  good: { emoji: '🙂', label: 'Good', className: 'bg-emerald-50 text-emerald-700' },
  great:{ emoji: '😄', label: 'Great',className: 'bg-green-50 text-green-700'  },
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export function AdminFeedbackSection() {
  const [rows, setRows] = useState<FeedbackRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)

  useEffect(() => {
    listAdminFeedback()
      .then(data => setRows(data))
      .catch(err => {
        if ((err as { status?: number }).status === 403) {
          setForbidden(true)
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load feedback')
        }
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <p className="text-sm text-slate-500" data-testid="admin-feedback-loading">
        Loading feedback…
      </p>
    )
  }

  if (forbidden) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        data-testid="admin-feedback-forbidden"
      >
        You do not have access to user feedback.
      </div>
    )
  }

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800"
        data-testid="admin-feedback-error"
      >
        {error}
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm text-slate-500 py-4" data-testid="admin-feedback-empty">
        No feedback submitted yet.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-100" data-testid="admin-feedback-table">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
            <th className="px-4 py-3 whitespace-nowrap">Date</th>
            <th className="px-4 py-3 whitespace-nowrap">Page</th>
            <th className="px-4 py-3 whitespace-nowrap">User</th>
            <th className="px-4 py-3 whitespace-nowrap">Sentiment</th>
            <th className="px-4 py-3">Message</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.map(row => {
            const s = SENTIMENT_DISPLAY[row.sentiment] ?? SENTIMENT_DISPLAY.okay
            return (
              <tr key={row.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                  {formatDate(row.createdAt)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-slate-700">
                  {row.pagePath}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                  {row.userEmail}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${s.className}`}>
                    {s.emoji} {s.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                  {row.message ?? <span className="text-slate-300">—</span>}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
