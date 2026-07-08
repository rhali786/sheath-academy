'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { complianceApi } from '@/features/compliance/front/services/api'
import type { ComplianceDeadline, StatusEngineResult } from '@/features/compliance/types'

function statusColor(status: StatusEngineResult['status']) {
  if (status === 'green') return 'bg-forest-50 border-forest-200'
  if (status === 'yellow') return 'bg-amber-50 border-amber-200'
  return 'bg-red-50 border-red-200'
}

function statusDotColor(status: StatusEngineResult['status']) {
  if (status === 'green') return 'bg-forest-600'
  if (status === 'yellow') return 'bg-amber-500'
  return 'bg-red-500'
}

function statusTextColor(status: StatusEngineResult['status']) {
  if (status === 'green') return 'text-forest-700'
  if (status === 'yellow') return 'text-amber-700'
  return 'text-red-600'
}

function statusLabel(status: StatusEngineResult['status']) {
  if (status === 'green') return 'On track'
  if (status === 'yellow') return 'Needs attention'
  return 'Action required'
}

/** Provenance subline: "Self-reported" unless a verified ruleset supplies a real pathway. */
function provenanceLabel(result: StatusEngineResult): string {
  if (result.isSelfReported || !result.provenance) return 'Self-reported'
  return result.provenance
}

/** "2026-08-15" → "15 Aug" (day-first, matching the prototype's "due 15 Aug"). */
function formatDue(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

/**
 * The single most useful action for the current status, deep-linked to where the
 * user actually fixes it. Driven by the first unmet checklist item so the CTA
 * matches what's wrong (short days → log attendance, etc.).
 */
function primaryAction(result: StatusEngineResult): { label: string; href: string } {
  const unmet = result.checks.find(c => !c.met)?.label.toLowerCase() ?? ''
  if (unmet.includes('day') || unmet.includes('attendance')) return { label: 'Log attendance', href: '/attendance' }
  if (unmet.includes('subject')) return { label: 'Plan lessons', href: '/lessons' }
  if (unmet.includes('evidence')) return { label: 'Add evidence', href: '/portfolio' }
  return { label: 'Review compliance', href: '/compliance' }
}

/** Earliest not-completed deadline by dueDate, or null when none are outstanding. */
function nextDeadline(deadlines: ComplianceDeadline[]): ComplianceDeadline | null {
  const pending = deadlines.filter(d => !d.isCompleted)
  if (pending.length === 0) return null
  return [...pending].sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]
}

function ComplianceIcon() {
  return (
    <svg className="w-[19px] h-[19px] text-forest-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function CardHeader() {
  return (
    <div className="flex items-center gap-2 mb-4">
      <ComplianceIcon />
      <h3 className="text-[14.5px] font-bold text-slate-900">Compliance</h3>
    </div>
  )
}

function CardShell({ children, testId }: { children: React.ReactNode; testId: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5" data-testid={testId}>
      <CardHeader />
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
        <p className="text-sm text-slate-500 mb-3">
          Configure a school year to track your homeschool compliance status.
        </p>
        <Link
          href="/compliance"
          data-testid="compliance-cta"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-forest-900 text-white text-xs font-semibold rounded-lg hover:bg-forest-800 transition-colors"
        >
          Set up compliance
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </CardShell>
    )
  }

  const deadline = nextDeadline(deadlines)

  return (
    <div
      data-testid="compliance-status-card"
      className={`rounded-xl shadow-sm border p-5 ${statusColor(result.status)}`}
    >
      <CardHeader />
      <div className="flex items-center gap-3">
        <span className={`h-3 w-3 rounded-full flex-shrink-0 ${statusDotColor(result.status)}`} aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className={`font-semibold leading-tight ${statusTextColor(result.status)}`}>{statusLabel(result.status)}</p>
          <p className="text-[11.5px] text-slate-500 mt-0.5">{provenanceLabel(result)}</p>
        </div>
      </div>

      {result.checks.length > 0 && (
        <ul className="mt-3.5 mb-3 flex flex-col gap-1.5" data-testid="compliance-checklist">
          {result.checks.map((check, i) => (
            <li key={i} className="flex items-start gap-2 text-[12.5px] text-slate-600">
              <span
                aria-hidden="true"
                className={`font-bold leading-5 ${check.met ? 'text-forest-600' : 'text-amber-600'}`}
              >
                {check.met ? '✓' : '✕'}
              </span>
              <span>{check.label}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 pt-3 border-t border-slate-200/60">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Next deadline</p>
        {deadline ? (
          <p className="text-[13px] font-semibold text-slate-700">
            {deadline.label} — <span className="text-amber-700 font-bold">due {formatDue(deadline.dueDate)}</span>
          </p>
        ) : (
          <p className="text-sm text-slate-400">No upcoming deadlines</p>
        )}
      </div>

      {result.status !== 'green' && (() => {
        const action = primaryAction(result)
        const guidance = result.nextActions[0]
        return (
          <div className="mt-3 pt-3 border-t border-slate-200/60">
            {guidance && <p className="text-[12.5px] text-slate-600 mb-2">{guidance}</p>}
            <Link
              href={action.href}
              data-testid="compliance-cta"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-forest-900 text-white text-xs font-semibold rounded-lg hover:bg-forest-800 transition-colors"
            >
              {action.label}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )
      })()}
    </div>
  )
}
