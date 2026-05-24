'use client'

import { Fragment, useEffect, useState } from 'react'
import { productValidationApi } from '@/features/product-validation/front/services/api'
import type {
  ProductValidationResponse,
  ProductValidationSummary,
} from '@/features/product-validation/types'

const PRICE_LABELS: Record<string, string> = {
  '0': '$0',
  '5': '$5',
  '10': '$10',
  '15': '$15',
  '20': '$20',
  '30': '$30',
  '50': '$50',
  '75': '$75',
  '100_plus': '$100+',
}

export function AdminValidationSummary() {
  const [summary, setSummary] = useState<ProductValidationSummary | null>(null)
  const [responses, setResponses] = useState<ProductValidationResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [s, list] = await Promise.all([
          productValidationApi.getSummary(),
          productValidationApi.listResponses(),
        ])
        if (!cancelled) {
          setSummary(s)
          setResponses(list)
        }
      } catch (e) {
        if (!cancelled) {
          const status = (e as { status?: number }).status
          if (status === 403) {
            setError('You do not have access to product validation metrics.')
          } else {
            setError(e instanceof Error ? e.message : 'Failed to load metrics')
          }
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return <p className="text-sm text-slate-500">Loading product validation metrics…</p>
  }

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        data-testid="admin-validation-forbidden"
      >
        {error}
      </div>
    )
  }

  if (!summary || summary.totalResponses === 0) {
    return (
      <p className="text-sm text-slate-500" data-testid="admin-validation-empty">
        No validation responses yet.
      </p>
    )
  }

  return (
    <section data-testid="admin-validation-section" className="space-y-8">
      <p className="text-sm text-slate-500">
        Fork Test Framework responses from signed-in users. Open text is shown beside scores.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard label="Responses" value={String(summary.totalResponses)} />
        <MetricCard
          label="Fork Test Fit (avg)"
          value={summary.averageForkTestFitScore?.toFixed(2) ?? '—'}
          help="Weighted score from pain, improvement, ease, trust, retention, pay, referral, and clarity (0–10)."
        />
        <MetricCard
          label="Previous pain (avg)"
          value={summary.averagePreviousPainScore?.toFixed(2) ?? '—'}
          help="How painful the problem was before Sheath (0 = none, 10 = severe)."
        />
        <MetricCard
          label="Improvement (avg)"
          value={summary.averageImprovementScore?.toFixed(2) ?? '—'}
          help="How much the product improved their homeschool workflow (0–10)."
        />
        <MetricCard label="Contact OK" value={String(summary.mayContactCount)} />
        <MetricCard
          label="OK to quote anonymously"
          value={String(summary.mayQuoteAnonymizedCount)}
        />
        <MetricCard
          label="OK to quote with name"
          value={String(summary.mayQuoteWithNameCount)}
        />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-2">Price bucket distribution</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(summary.priceBucketCounts)
            .filter(([, n]) => n > 0)
            .map(([bucket, count]) => (
              <span
                key={bucket}
                className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700"
              >
                {PRICE_LABELS[bucket] ?? bucket}: {count}
              </span>
            ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full text-xs text-left">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wide">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Fit</th>
              <th className="px-3 py-2">Pain</th>
              <th className="px-3 py-2">Price</th>
              <th className="px-3 py-2">Contact</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {responses.map(r => (
              <Fragment key={r.id}>
                <tr className="border-t border-slate-100">
                  <td className="px-3 py-2 whitespace-nowrap">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2">{r.respondentType.replace(/_/g, ' ')}</td>
                  <td className="px-3 py-2 font-semibold tabular-nums">{r.forkTestFitScore}</td>
                  <td className="px-3 py-2 tabular-nums">{r.previousPainScore}</td>
                  <td className="px-3 py-2">{PRICE_LABELS[r.reasonableMonthlyPriceBucket]}</td>
                  <td className="px-3 py-2">{r.mayContact ? 'Yes' : 'No'}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      className="text-forest-900 font-medium hover:underline"
                      aria-expanded={expandedId === r.id}
                      onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                    >
                      {expandedId === r.id ? 'Hide' : 'View'}
                    </button>
                  </td>
                </tr>
                {expandedId === r.id && (
                  <tr className="border-t border-slate-50 bg-slate-50/50">
                    <td colSpan={7} className="px-4 py-3 text-sm text-slate-600 space-y-2">
                      <p><strong>Replaced:</strong> {r.replacedWhat}</p>
                      <p><strong>Most useful:</strong> {r.mostUseful}</p>
                      <p><strong>Confusing:</strong> {r.confusingOrBurdensome}</p>
                      <p><strong>Must-have:</strong> {r.mustHaveChange}</p>
                      <p><strong>Lost access:</strong> {r.lostAccessReaction}</p>
                      <p><strong>Recommend to:</strong> {r.recommendTo}</p>
                      <p><strong>Message:</strong> {r.referralMessage}</p>
                      {r.pricingNotes && <p><strong>Pricing notes:</strong> {r.pricingNotes}</p>}
                      {r.additionalNotes && <p><strong>Notes:</strong> {r.additionalNotes}</p>}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function MetricCard({ label, value, help }: { label: string; value: string; help?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 px-4 py-3 shadow-sm" title={help}>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-bold text-slate-900 tabular-nums mt-0.5">{value}</p>
      {help && <p className="text-[10px] text-slate-400 mt-1 leading-snug">{help}</p>}
    </div>
  )
}
