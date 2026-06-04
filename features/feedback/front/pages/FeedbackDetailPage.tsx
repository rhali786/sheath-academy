'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import type { FeedbackRow } from '@/features/feedback/types'
import { getUserFeedback, approveAdminFeedback } from '../services/api'

const SENTIMENT_LABEL: Record<string, string> = {
  bad: 'Bad 😣',
  poor: 'Poor 😕',
  okay: 'Okay 😐',
  good: 'Good 🙂',
  great: 'Great 😄',
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  submitted: { bg: 'bg-slate-100', text: 'text-slate-700' },
  reviewed: { bg: 'bg-blue-100', text: 'text-blue-700' },
  awaiting_approval: { bg: 'bg-amber-100', text: 'text-amber-700' },
  in_pr: { bg: 'bg-purple-100', text: 'text-purple-700' },
  in_qa: { bg: 'bg-orange-100', text: 'text-orange-700' },
  shipped: { bg: 'bg-green-100', text: 'text-green-700' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-700' },
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-slate-800">{value}</p>
    </div>
  )
}

export function FeedbackDetailPage({ id }: { id: string }) {
  const [row, setRow] = useState<FeedbackRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [approving, setApproving] = useState(false)

  const session = useSession()
  const isAdmin = session.data?.user?.isAdmin === true

  useEffect(() => {
    getUserFeedback(id)
      .then(data => {
        setRow(data)
        setError(null)
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load feedback'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleApprove() {
    if (!row) return
    setApproving(true)
    try {
      await approveAdminFeedback(row.id)
      setRow(prev =>
        prev ? { ...prev, status: 'reviewed', adminApprovedAt: new Date().toISOString() } : prev
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approval failed')
    } finally {
      setApproving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="animate-pulse space-y-4">
          <div className="bg-slate-200 h-8 rounded w-32" />
          <div className="bg-slate-200 h-40 rounded-lg" />
          <div className="bg-slate-200 h-24 rounded-lg" />
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
  const sentimentLabel = SENTIMENT_LABEL[row.sentiment] ?? row.sentiment

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5 py-4">
      <div>
        <Link href="/feedback" className="text-sm text-slate-500 hover:text-slate-700">
          ← Back to my feedback
        </Link>
        <div className="flex items-start justify-between gap-4 mt-2">
          <h1 className="page-title">Feedback detail</h1>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 ${statusColor.bg} ${statusColor.text}`}
          >
            {row.status.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      {/* Core submission fields */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <KV label="Page" value={row.pagePath} />
          <KV label="Submitted" value={new Date(row.createdAt).toLocaleString()} />
          <KV label="Sentiment" value={sentimentLabel} />
        </div>
        {row.message && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Your message</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{row.message}</p>
          </div>
        )}
      </div>

      {/* Classification */}
      {(row.feedbackType || row.featureArea || row.confidence || row.riskLevel) && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Classification</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {row.feedbackType && <KV label="Type" value={row.feedbackType} />}
            {row.featureArea && <KV label="Feature area" value={row.featureArea} />}
            {row.confidence && <KV label="Confidence" value={row.confidence} />}
            {row.riskLevel && <KV label="Risk" value={row.riskLevel} />}
          </div>
        </div>
      )}

      {/* Duplicate callout */}
      {row.duplicateOfFeedbackId && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800">
            This feedback was merged into{' '}
            <Link
              href={`/feedback/${row.duplicateOfFeedbackId}`}
              className="font-semibold underline hover:text-amber-900"
            >
              another submission
            </Link>
            .
          </p>
        </div>
      )}

      {/* In review / PR */}
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
              <p className="text-xs font-semibold text-purple-700 mb-1">How to test</p>
              <p className="text-sm text-purple-800 whitespace-pre-wrap">{row.uatInstructions}</p>
            </div>
          )}
        </div>
      )}

      {/* Shipped */}
      {row.versionResolved && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
          <p className="text-sm font-semibold text-green-900">Shipped in {row.versionResolved}</p>
          {row.changelogEntryLabel && <p className="text-sm text-green-700">{row.changelogEntryLabel}</p>}
          {row.changelogEntryUserCredit && (
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-green-200">
              <KV label="Credit" value={row.changelogEntryUserCredit} />
            </div>
          )}
        </div>
      )}

      {/* Admin-only section */}
      {isAdmin && (
        <div className="bg-slate-50 border border-slate-300 rounded-lg p-5 space-y-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Admin details</p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <KV label="User email" value={row.userEmail} />
            {row.householdName && <KV label="Household" value={row.householdName} />}
          </div>

          {row.recommendation && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Claude recommendation</p>
              <p className="mt-2 text-sm text-blue-900 whitespace-pre-wrap">{row.recommendation}</p>
            </div>
          )}

          {(row.adminApprovedAt || row.adminApprovedByUserId) && (
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-200">
              {row.adminApprovedAt && (
                <KV label="Approved at" value={new Date(row.adminApprovedAt).toLocaleString()} />
              )}
              {row.adminApprovedByUserId && (
                <KV label="Approved by" value={row.adminApprovedByUserId} />
              )}
            </div>
          )}

          {row.status === 'awaiting_approval' && !row.adminApprovedAt && (
            <div className="pt-3 border-t border-slate-200">
              <button
                onClick={handleApprove}
                disabled={approving}
                aria-label="Approve this feedback for planning"
                className="px-4 py-2 bg-forest-700 text-white text-sm font-medium rounded-lg hover:bg-forest-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {approving ? 'Approving…' : 'Approve for planning'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
