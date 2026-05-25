'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import type { FeedbackRow } from '@/features/feedback/types'
import { listUserFeedback } from '../services/api'

const SENTIMENT_EMOJI: Record<string, string> = {
  bad: '😣',
  poor: '😕',
  okay: '😐',
  good: '🙂',
  great: '😄',
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  submitted: { bg: 'bg-slate-100', text: 'text-slate-700' },
  classified: { bg: 'bg-blue-100', text: 'text-blue-700' },
  awaiting_approval: { bg: 'bg-amber-100', text: 'text-amber-700' },
  in_pr: { bg: 'bg-purple-100', text: 'text-purple-700' },
  in_qa: { bg: 'bg-orange-100', text: 'text-orange-700' },
  shipped: { bg: 'bg-green-100', text: 'text-green-700' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-700' },
}

export function FeedbackHubPage() {
  const [rows, setRows] = useState<FeedbackRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const session = useSession()
  const isAdmin = session.data?.user?.isAdmin === true

  useEffect(() => {
    listUserFeedback()
      .then(data => {
        setRows(data)
        setError(null)
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load feedback'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-slate-200 h-24 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 py-4">
      <div>
        <h1 className="page-title">{isAdmin ? 'All feedback' : 'My feedback'}</h1>
        <p className="text-sm text-slate-600 mt-1">{rows.length} items</p>
      </div>

      {rows.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center">
          <p className="text-slate-600">No feedback submitted yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(row => {
            const statusColor = STATUS_COLORS[row.status] ?? STATUS_COLORS.submitted
            const emoji = SENTIMENT_EMOJI[row.sentiment] ?? '😐'
            return (
              <Link
                key={row.id}
                href={`/feedback/${row.id}`}
                className="block bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl flex-shrink-0">{emoji}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{row.pagePath}</p>
                      {row.message && (
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{row.message}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(row.createdAt).toLocaleString()}
                      </p>
                      {isAdmin && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          {row.userEmail}{row.householdName ? ` · ${row.householdName}` : ''}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusColor.bg} ${statusColor.text}`}>
                      {row.status.replace(/_/g, ' ')}
                    </span>
                    {row.prNumber && (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded font-medium">
                        PR #{row.prNumber}
                      </span>
                    )}
                    {row.versionResolved && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded font-medium">
                        v{row.versionResolved}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
