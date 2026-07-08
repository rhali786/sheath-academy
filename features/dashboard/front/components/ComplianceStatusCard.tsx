'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { complianceApi } from '@/features/compliance/front/services/api'
import type { ComplianceDeadline, StatusEngineResult } from '@/features/compliance/types'

function statusColor(status: StatusEngineResult['status']) {
  if (status === 'green') return 'bg-forest-50 border-forest-200'
  if (status === 'yellow') return 'bg-amber-50 border-amber-200'
  return 'bg-red-50 border-red-200'
}

function statusIcon(status: StatusEngineResult['status']) {
  if (status === 'green') return <CheckCircle2 className="w-5 h-5 text-forest-600" />
  return <AlertCircle className={`w-5 h-5 ${status === 'yellow' ? 'text-amber-500' : 'text-red-500'}`} />
}

function statusLabel(status: StatusEngineResult['status']) {
  if (status === 'green') return 'On track'
  if (status === 'yellow') return 'Needs attention'
  return 'Action required'
}

/** Earliest not-completed deadline by dueDate, or null when none are outstanding. */
function nextDeadline(deadlines: ComplianceDeadline[]): ComplianceDeadline | null {
  const pending = deadlines.filter(d => !d.isCompleted)
  if (pending.length === 0) return null
  return [...pending].sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]
}

function CardShell({ children, testId }: { children: React.ReactNode; testId: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5" data-testid={testId}>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Compliance</p>
      {children}
    </div>
  )
}

export function ComplianceStatusCard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [hasSchoolYear, setHasSchoolYear] = useState(true)
  const [result, setResult] = useState<StatusEngineResult | null>(null)
  const [deadlines, setDeadlines] = useState<ComplianceDeadline[]>([])

  const load = useCallback(() => {
    setLoading(true)
    setError(false)
    complianceApi.getActiveSchoolYearId()
      .then(async schoolYearId => {
        if (!schoolYearId) {
          setHasSchoolYear(false)
          setLoading(false)
          return
        }
        const [statusRes, deadlinesRes] = await Promise.all([
          complianceApi.getStatus('', schoolYearId),
          complianceApi.getDeadlines('', schoolYearId),
        ])
        setHasSchoolYear(true)
        setResult(statusRes.data)
        setDeadlines(deadlinesRes.data)
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <CardShell testId="compliance-status-card-loading">
        <div className="space-y-2 animate-pulse">
          <div className="h-4 bg-slate-100 rounded w-3/4" />
          <div className="h-4 bg-slate-100 rounded w-1/2" />
          <div className="h-4 bg-slate-100 rounded w-2/3" />
        </div>
      </CardShell>
    )
  }

  if (error) {
    return (
      <CardShell testId="compliance-status-card-error">
        <p className="text-sm text-slate-500 mb-3">Couldn&apos;t load compliance status.</p>
        <button
          type="button"
          onClick={load}
          className="px-3 py-1.5 bg-forest-900 text-white text-xs font-medium rounded-lg hover:bg-forest-800 transition-colors"
        >
          Retry
        </button>
      </CardShell>
    )
  }

  if (!hasSchoolYear || !result) {
    return (
      <CardShell testId="compliance-status-card-empty">
        <p className="text-sm text-slate-900 font-semibold mb-1">Set up compliance</p>
        <p className="text-sm text-slate-500">
          Configure a school year to track your homeschool compliance status.
        </p>
      </CardShell>
    )
  }

  const deadline = nextDeadline(deadlines)

  return (
    <div
      data-testid="compliance-status-card"
      className={`rounded-xl shadow-sm border p-5 ${statusColor(result.status)}`}
    >
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Compliance</p>
      <div className="flex items-start gap-3">
        {statusIcon(result.status)}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900">{statusLabel(result.status)}</p>
          {result.reasons.map((reason, i) => (
            <p key={i} className="text-sm text-slate-600 mt-0.5">{reason}</p>
          ))}
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-slate-200/60">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-0.5">Next deadline</p>
        {deadline ? (
          <p className="text-sm text-slate-700">{deadline.label} — due {deadline.dueDate}</p>
        ) : (
          <p className="text-sm text-slate-400">No upcoming deadlines</p>
        )}
      </div>
    </div>
  )
}
