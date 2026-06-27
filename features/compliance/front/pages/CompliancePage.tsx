'use client'

import { useEffect, useState } from 'react'
import { ShieldCheck, AlertCircle, CheckCircle2, Clock, FileText, Info, ExternalLink } from 'lucide-react'
import { complianceApi } from '@/features/compliance/front/services/api'
import { useHousehold } from '@/features/household/front/context'
import type {
  StatusEngineResult,
  ComplianceRuleset,
  ComplianceDeadline,
  ComplianceSubmission,
} from '@/features/compliance/types'

function statusColor(status: StatusEngineResult['status']) {
  if (status === 'green') return 'bg-forest-50 border-forest-200'
  if (status === 'yellow') return 'bg-amber-50 border-amber-200'
  return 'bg-red-50 border-red-200'
}

function statusIcon(status: StatusEngineResult['status']) {
  if (status === 'green') return <CheckCircle2 className="w-5 h-5 text-forest-600" />
  if (status === 'yellow') return <AlertCircle className="w-5 h-5 text-amber-500" />
  return <AlertCircle className="w-5 h-5 text-red-500" />
}

function statusLabel(status: StatusEngineResult['status']) {
  if (status === 'green') return 'On track'
  if (status === 'yellow') return 'Needs attention'
  return 'Action required'
}

function StatusHero({ result }: { result: StatusEngineResult }) {
  return (
    <div
      data-testid="compliance-status-hero"
      className={`card border p-5 space-y-4 ${statusColor(result.status)}`}
    >
      <div className="flex items-center gap-3">
        {statusIcon(result.status)}
        <div>
          <p className="font-semibold text-slate-900">{statusLabel(result.status)}</p>
          {result.reasons.filter(r => !r.includes('verified')).map((reason, i) => (
            <p key={i} className="text-sm text-slate-600 mt-0.5">{reason}</p>
          ))}
        </div>
      </div>

      {result.nextActions.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Next actions</p>
          <ul className="space-y-1">
            {result.nextActions.map((action, i) => (
              <li key={i} className="text-sm text-slate-700 flex gap-2">
                <span className="text-slate-400 flex-shrink-0">→</span>
                {action}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.provenance && (
        <div data-testid="compliance-provenance" className="text-xs text-slate-400 flex items-center gap-1">
          <Info className="w-3.5 h-3.5" />
          Source: {result.provenance}
        </div>
      )}

      {result.isSelfReported && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          Self-reported — no verified state ruleset on file. Verdict reflects your household target only.
        </div>
      )}

      {result.belowLegalFloorWarning && (
        <div className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {result.belowLegalFloorWarning}
        </div>
      )}
    </div>
  )
}

function IllustrativeBanner() {
  return (
    <div
      data-testid="compliance-illustrative-banner"
      className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
    >
      <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <div>
        <p className="font-medium">Sample data — not computed from your records yet.</p>
        <p className="text-amber-700 mt-0.5 text-xs">
          This status will reflect your real attendance once attendance data and state rules are configured (coming in the next update).
        </p>
      </div>
    </div>
  )
}

function RulesetCard({ ruleset }: { ruleset: ComplianceRuleset | null }) {
  if (!ruleset) {
    return (
      <div className="card p-4 text-sm text-slate-500">
        No state ruleset configured. Contact your state authority or add one manually.
      </div>
    )
  }

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-slate-900">{ruleset.state} — {ruleset.pathwayKey} pathway</p>
          <p className="text-sm text-slate-600 mt-0.5">
            {ruleset.value} {ruleset.unit} required
          </p>
        </div>
        <span className={ruleset.isVerified ? 'badge-green' : 'badge-amber'}>
          {ruleset.isVerified ? 'Verified' : 'Unverified'}
        </span>
      </div>
      {ruleset.lastVerifiedAt && (
        <p className="text-xs text-slate-400">Last verified: {ruleset.lastVerifiedAt}</p>
      )}
      {ruleset.sourceUrl && (
        <a
          href={ruleset.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-forest-600 hover:text-forest-800 flex items-center gap-1"
        >
          <ExternalLink className="w-3 h-3" />
          View source
        </a>
      )}
    </div>
  )
}

function DeadlineTimeline({ deadlines }: { deadlines: ComplianceDeadline[] }) {
  return (
    <div data-testid="compliance-deadlines" className="card p-4 space-y-3">
      <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
        <Clock className="w-4 h-4 text-slate-400" />
        Upcoming deadlines
      </h3>
      {deadlines.length === 0 ? (
        <p className="text-sm text-slate-400">No deadlines configured.</p>
      ) : (
        <ul className="space-y-2">
          {deadlines.map(d => (
            <li key={d.id} className="flex items-center justify-between gap-2 text-sm">
              <div className="flex items-center gap-2">
                {d.isCompleted
                  ? <CheckCircle2 className="w-4 h-4 text-forest-500 flex-shrink-0" />
                  : <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                }
                <span className={d.isCompleted ? 'text-slate-400 line-through' : 'text-slate-700'}>
                  {d.label}
                </span>
              </div>
              <span className="text-xs text-slate-400 flex-shrink-0">{d.dueDate}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function SubmissionsTracker({ submissions }: { submissions: ComplianceSubmission[] }) {
  return (
    <div data-testid="compliance-submissions" className="card p-4 space-y-3">
      <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
        <FileText className="w-4 h-4 text-slate-400" />
        Submission tracker
      </h3>
      {submissions.length === 0 ? (
        <p className="text-sm text-slate-400">No submissions yet.</p>
      ) : (
        <ul className="space-y-2">
          {submissions.map(s => (
            <li key={s.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="text-slate-700">
                {s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : 'Draft'}
              </span>
              <span className={
                s.status === 'accepted' ? 'badge-green' :
                s.status === 'sent' ? 'badge-amber' : 'badge-amber'
              }>
                {s.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function LegalDisclaimer() {
  return (
    <div
      data-testid="compliance-legal-disclaimer"
      className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500"
    >
      <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
      <p>Informational only, not legal advice. Requirements shown are for reference and should be verified with your state authority before relying on them.</p>
    </div>
  )
}

export function CompliancePage() {
  const { householdProfile } = useHousehold()
  const [statusResult, setStatusResult] = useState<StatusEngineResult | null>(null)
  const [ruleset, setRuleset] = useState<ComplianceRuleset | null>(null)
  const [deadlines, setDeadlines] = useState<ComplianceDeadline[]>([])
  const [submissions, setSubmissions] = useState<ComplianceSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const householdId = householdProfile?.id ?? ''
  const schoolYearId = 'current'

  useEffect(() => {
    if (!householdId) return
    Promise.all([
      complianceApi.getStatus(householdId, schoolYearId),
      complianceApi.getRuleset(householdId),
      complianceApi.getDeadlines(householdId, schoolYearId),
      complianceApi.getSubmissions(householdId, schoolYearId),
    ]).then(([statusRes, rulesetRes, deadlinesRes, submissionsRes]) => {
      setStatusResult(statusRes.data)
      setRuleset(rulesetRes.data)
      setDeadlines(deadlinesRes.data)
      setSubmissions(submissionsRes.data)
      setLoading(false)
    }).catch(() => {
      setError('Could not load compliance data. Please try again.')
      setLoading(false)
    })
  }, [householdId])

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4" data-testid="compliance-loading">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="card h-24 bg-slate-100" />)}
        </div>
      </div>
    )
  }

  if (error || !statusResult) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4" data-testid="compliance-error">
        <div className="card p-6 text-center space-y-2">
          <AlertCircle className="w-6 h-6 text-red-400 mx-auto" />
          <p className="text-sm text-slate-600">{error ?? 'Unknown error'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="w-6 h-6 text-forest-700" />
        <h1 className="page-title">Compliance</h1>
      </div>

      <IllustrativeBanner />

      <StatusHero result={statusResult} />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-4">
          <RulesetCard ruleset={ruleset} />
          <SubmissionsTracker submissions={submissions} />
        </div>
        <DeadlineTimeline deadlines={deadlines} />
      </div>

      <LegalDisclaimer />
    </div>
  )
}
