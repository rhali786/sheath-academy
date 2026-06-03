'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import type { FeedbackRow } from '@/features/feedback/types'
import { ApprovalModal } from '../components/ApprovalModal'

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

export function AdminFeedbackPage() {
  const [rows, setRows] = useState<FeedbackRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [filters, setFilters] = useState({
    status: '',
    confidence: '',
    riskLevel: '',
    feedbackType: '',
    featureArea: '',
  })

  const fetchFeedback = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filters.status) params.set('status', filters.status)
    if (filters.confidence) params.set('confidence', filters.confidence)
    if (filters.riskLevel) params.set('riskLevel', filters.riskLevel)
    if (filters.feedbackType) params.set('feedbackType', filters.feedbackType)
    if (filters.featureArea) params.set('featureArea', filters.featureArea)

    try {
      const response = await fetch(`/api/admin/feedback?${params.toString()}`)
      const data = await response.json()
      if (data.status === 'success') {
        setRows(data.data)
        setError(null)
      } else {
        setError(data.message)
      }
    } catch (err) {
      setError('Failed to load feedback')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchFeedback()
  }, [fetchFeedback])

  const handleApprove = async (id: string) => {
    const response = await fetch(`/api/admin/feedback/${id}/approve`, { method: 'POST' })
    const data = await response.json()
    if (data.status === 'success') {
      setRows(rows.map(r => (r.id === id ? { ...r, status: 'classified', adminApprovedAt: new Date().toISOString() } : r)))
      setSelectedId(null)
    } else {
      throw new Error(data.message)
    }
  }

  const selectedFeedback = selectedId ? rows.find(r => r.id === selectedId) : null
  const statusCounts = rows.reduce<Record<string, number>>((counts, row) => {
    counts[row.status] = (counts[row.status] ?? 0) + 1
    return counts
  }, {})
  const queueSummary = [
    { label: 'Needs approval', detail: `${statusCounts.awaiting_approval ?? 0} awaiting approval` },
    { label: 'Classified', detail: `${statusCounts.classified ?? 0} classified` },
    { label: 'Submitted', detail: `${statusCounts.submitted ?? 0} submitted` },
    { label: 'In review', detail: `${(statusCounts.in_pr ?? 0) + (statusCounts.in_qa ?? 0)} in review` },
    { label: 'Shipped', detail: `${statusCounts.shipped ?? 0} shipped` },
    { label: 'Cancelled', detail: `${statusCounts.cancelled ?? 0} cancelled` },
  ]

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-slate-200 h-32 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Error: {error}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 py-4">
      <div>
        <h1 className="page-title">Feedback queue</h1>
        <p className="text-sm text-slate-600 mt-1">{rows.length} feedback items</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {queueSummary.map((item) => (
          <div key={item.label} className="rounded-lg border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
            <p className="mt-1 text-sm text-slate-700">{item.detail}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Filters</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <input
            type="text"
            placeholder="Feature area"
            value={filters.featureArea}
            onChange={e => setFilters({ ...filters, featureArea: e.target.value })}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-400"
            data-testid="filter-feature-area"
          />
          <select
            value={filters.status}
            onChange={e => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-400"
            data-testid="filter-status"
          >
            <option value="">All statuses</option>
            <option value="submitted">Submitted</option>
            <option value="classified">Classified</option>
            <option value="awaiting_approval">Awaiting approval</option>
            <option value="in_pr">In PR</option>
            <option value="shipped">Shipped</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={filters.confidence}
            onChange={e => setFilters({ ...filters, confidence: e.target.value })}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-400"
            data-testid="filter-confidence"
          >
            <option value="">All confidence</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            value={filters.riskLevel}
            onChange={e => setFilters({ ...filters, riskLevel: e.target.value })}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-400"
            data-testid="filter-risk-level"
          >
            <option value="">All risk</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <select
            value={filters.feedbackType}
            onChange={e => setFilters({ ...filters, feedbackType: e.target.value })}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-400"
            data-testid="filter-feedback-type"
          >
            <option value="">All types</option>
            <option value="bug">Bug</option>
            <option value="enhancement">Enhancement</option>
            <option value="ux">UX</option>
            <option value="copy">Copy</option>
            <option value="performance">Performance</option>
            <option value="question">Question</option>
          </select>
        </div>
      </div>

      {/* Feedback list */}
      {rows.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center">
          <p className="text-slate-600">No feedback found matching your filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map(row => {
            const statusColor = STATUS_COLORS[row.status] || STATUS_COLORS.submitted
            const emoji = SENTIMENT_EMOJI[row.sentiment] || '😐'
            return (
              <div
                key={row.id}
                className="bg-white border border-slate-200 rounded-lg p-5 space-y-3 hover:shadow-md transition-shadow"
                data-testid={`feedback-item-${row.id}`}
              >
                {/* Header: sentiment, path, status */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{emoji}</span>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 truncate">{row.pagePath}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(row.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${statusColor.bg} ${statusColor.text}`}>
                    {row.status.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Message */}
                {row.message && (
                  <p className="text-sm text-slate-700 line-clamp-2">{row.message}</p>
                )}

                {(row.status === 'classified' || row.status === 'awaiting_approval') && row.recommendation && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Claude recommendation</p>
                    <p className="mt-1 text-sm text-blue-900 whitespace-pre-wrap">{row.recommendation}</p>
                  </div>
                )}

                {/* Metadata badges */}
                <div className="flex flex-wrap gap-2">
                  {row.feedbackType && (
                    <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded">
                      {row.feedbackType}
                    </span>
                  )}
                  {row.featureArea && (
                    <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded">
                      {row.featureArea}
                    </span>
                  )}
                  {row.confidence && (
                    <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded">
                      Confidence: {row.confidence}
                    </span>
                  )}
                  {row.riskLevel && (
                    <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded">
                      Risk: {row.riskLevel}
                    </span>
                  )}
                </div>

                {/* Submitter info */}
                <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-100">
                  <div className="text-xs text-slate-500 min-w-0">
                    <span className="font-medium text-slate-700">{row.userEmail}</span>
                    {row.householdName && (
                      <span className="ml-2 text-slate-400">· {row.householdName}</span>
                    )}
                  </div>
                  <Link
                    href={`/feedback/${row.id}`}
                    className="text-xs text-forest-700 hover:underline whitespace-nowrap flex-shrink-0"
                  >
                    View detail →
                  </Link>
                </div>

                {/* UAT instructions */}
                {row.uatInstructions && (
                  <details className="text-sm">
                    <summary className="cursor-pointer font-medium text-slate-700 hover:text-slate-900">
                      UAT Instructions
                    </summary>
                    <div className="mt-2 bg-slate-50 p-3 rounded text-slate-700 whitespace-pre-wrap">
                      {row.uatInstructions}
                    </div>
                  </details>
                )}

                {/* PR info */}
                {row.prNumber && (
                  <div className="text-sm bg-slate-50 p-3 rounded space-y-1">
                    <p className="font-medium text-slate-900">PR #{row.prNumber}</p>
                    {row.previewUrl && (
                      <a href={row.previewUrl} target="_blank" rel="noopener noreferrer" className="text-forest-600 hover:underline text-xs">
                        Preview →
                      </a>
                    )}
                  </div>
                )}

                {/* Shipped version */}
                {row.versionResolved && (
                  <div className="text-sm bg-green-50 border border-green-200 p-3 rounded">
                    <span className="font-medium text-green-800">Shipped</span>
                    <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded font-medium">
                      v{row.versionResolved}
                    </span>
                  </div>
                )}

                {/* Action button */}
                {row.status === 'awaiting_approval' && (
                  <button
                    onClick={() => setSelectedId(row.id)}
                    className="mt-2 px-4 py-2 bg-forest-900 text-white text-sm font-medium rounded-lg hover:bg-forest-800 transition-colors"
                    data-testid={`approve-button-${row.id}`}
                  >
                    Approve for planning
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Approval modal */}
      {selectedFeedback && (
        <ApprovalModal
          feedbackId={selectedFeedback.id}
          feedbackMessage={selectedFeedback.message || undefined}
          onConfirm={handleApprove}
          onCancel={() => setSelectedId(null)}
        />
      )}
    </div>
  )
}
