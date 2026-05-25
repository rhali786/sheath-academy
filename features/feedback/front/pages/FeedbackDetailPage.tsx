'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { FeedbackRow } from '@/features/feedback/types'
import { getUserFeedback } from '../services/api'

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

export function FeedbackDetailPage({ id }: { id: string }) {
  const [row, setRow] = useState<FeedbackRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getUserFeedback(id)
      .then(data => {
        setRow(data)
        setError(null)
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load feedback'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="animate-pulse space-y-4">
          <div className="bg-slate-200 h-8 rounded w-32" />
          <div className="bg-slate-200 h-40 rounded-lg" />
        </div>
      </div>
    )
  }

  if (error || !row) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Link href="/feedback" className="text-sm text-slate-500 hover:text-slate-700 mb-4 inline-block">
          ← Back
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error ?? 'Not found'}
        </div>
      </div>
    )
  }

  const statusColor = STATUS_COLORS[row.status] ?? STATUS_COLORS.submitted
  const emoji = SENTIMENT_EMOJI[row.sentiment] ?? '😐'

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 py-4">
      <div>
        <Link href="/feedback" className="text-sm text-slate-500 hover:text-slate-700">
          ← Back
        </Link>
        <h1 className="page-title mt-2">Feedback detail</h1>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl flex-shrink-0">{emoji}</span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">{row.pagePath}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {new Date(row.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 ${statusColor.bg} ${statusColor.text}`}>
            {row.status.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Message */}
        {row.message && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Your message</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{row.message}</p>
          </div>
        )}

        {/* Metadata */}
        {(row.feedbackType || row.featureArea || row.confidence || row.riskLevel) && (
          <div className="flex flex-wrap gap-2">
            {row.feedbackType && (
              <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded">{row.feedbackType}</span>
            )}
            {row.featureArea && (
              <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded">{row.featureArea}</span>
            )}
            {row.confidence && (
              <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded">Confidence: {row.confidence}</span>
            )}
            {row.riskLevel && (
              <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded">Risk: {row.riskLevel}</span>
            )}
          </div>
        )}
      </div>

      {/* PR info */}
      {row.prNumber && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-2">
          <p className="text-sm font-semibold text-purple-900">In review — PR #{row.prNumber}</p>
          {row.previewUrl && (
            <a
              href={row.previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-purple-700 hover:underline inline-block"
            >
              Open preview →
            </a>
          )}
          {row.uatInstructions && (
            <div className="pt-2 border-t border-purple-200">
              <p className="text-xs font-semibold text-purple-700 mb-1">UAT Instructions</p>
              <p className="text-sm text-purple-800 whitespace-pre-wrap">{row.uatInstructions}</p>
            </div>
          )}
        </div>
      )}

      {/* Shipped */}
      {row.versionResolved && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-green-900">
            Shipped in {row.versionResolved}
          </p>
          {row.changelogLabel && (
            <p className="text-sm text-green-700 mt-1">{row.changelogLabel}</p>
          )}
        </div>
      )}
    </div>
  )
}
