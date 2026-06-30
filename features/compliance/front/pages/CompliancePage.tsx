'use client'

import { useEffect, useState } from 'react'
import { ShieldCheck, AlertCircle, CheckCircle2, Clock, FileText, Info, ExternalLink, Plus, Pencil, Trash2 } from 'lucide-react'
import { complianceApi } from '@/features/compliance/front/services/api'
import type { DeadlineInput } from '@/features/compliance/front/services/api'
import { InlineConfirm } from '@/features/lib/front/components/InlineConfirm'
import { InlineSuccess } from '@/features/lib/front/components/InlineSuccess'
import { useHousehold } from '@/features/household/front/context'
import type {
  StatusEngineResult,
  ComplianceRuleset,
  ComplianceDeadline,
  ComplianceSubmission,
  SubmissionStatus,
} from '@/features/compliance/types'

const REQUIREMENT_TYPES = ['filing', 'notification', 'assessment', 'portfolio', 'other']

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

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

function RulesetCard({
  ruleset,
  rulesets,
  onSetConfig,
}: {
  ruleset: ComplianceRuleset | null
  rulesets: ComplianceRuleset[]
  onSetConfig: (input: { activeRulesetId: string | null; pathwayKey: string | null }) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [selectedId, setSelectedId] = useState(ruleset?.id ?? '')
  const [pathwayKey, setPathwayKey] = useState(ruleset?.pathwayKey ?? '')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    setError(null)
    setPending(true)
    try {
      await onSetConfig({
        activeRulesetId: selectedId || null,
        pathwayKey: pathwayKey || null,
      })
      setEditing(false)
    } catch {
      setError('Could not save ruleset. Please try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="card p-4 space-y-3" data-testid="compliance-ruleset">
      <div className="flex items-center justify-between">
        {ruleset ? (
          <div>
            <p className="font-semibold text-slate-900">{ruleset.state} — {ruleset.pathwayKey} pathway</p>
            <p className="text-sm text-slate-600 mt-0.5">{ruleset.value} {ruleset.unit} required</p>
          </div>
        ) : (
          <p className="text-sm text-slate-500">No state ruleset configured yet.</p>
        )}
        <button
          type="button"
          onClick={() => setEditing(v => !v)}
          className="text-xs text-forest-700 hover:text-forest-900 underline underline-offset-2"
        >
          {editing ? 'Cancel' : ruleset ? 'Change' : 'Set ruleset'}
        </button>
      </div>

      {ruleset && !editing && (
        <span className={ruleset.isVerified ? 'badge-green' : 'badge-amber'}>
          {ruleset.isVerified ? 'Verified' : 'Unverified'}
        </span>
      )}

      {!editing && ruleset?.sourceUrl && (
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

      {editing && (
        <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <label className="flex flex-col text-xs text-slate-500">
            Active ruleset
            <select
              aria-label="Active ruleset"
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              className="mt-0.5 rounded border border-slate-300 px-2 py-1 text-sm text-slate-700"
            >
              <option value="">— None —</option>
              {rulesets.map(r => (
                <option key={r.id} value={r.id}>{r.state} — {r.pathwayKey} ({r.value} {r.unit})</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-xs text-slate-500">
            Pathway
            <input
              aria-label="Pathway key"
              type="text"
              value={pathwayKey}
              onChange={e => setPathwayKey(e.target.value)}
              placeholder="e.g. umbrella"
              className="mt-0.5 rounded border border-slate-300 px-2 py-1 text-sm text-slate-700"
            />
          </label>
          {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={save}
              disabled={pending}
              className="rounded-lg bg-forest-900 px-3 py-1 text-xs font-medium text-white hover:bg-forest-800 disabled:opacity-50"
            >
              {pending ? 'Saving…' : 'Save ruleset'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function DeadlineForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: { label: string; dueDate: string; requirementType: string }
  submitLabel: string
  onSubmit: (values: { label: string; dueDate: string; requirementType: string }) => Promise<void>
  onCancel: () => void
}) {
  const [label, setLabel] = useState(initial?.label ?? '')
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? todayISO())
  const [requirementType, setRequirementType] = useState(initial?.requirementType ?? 'filing')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!label.trim()) {
      setError('A label is required.')
      return
    }
    setPending(true)
    try {
      await onSubmit({ label: label.trim(), dueDate, requirementType })
    } catch {
      setError('Could not save. Please try again.')
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <input
        aria-label="Deadline label"
        type="text"
        placeholder="Deadline label"
        value={label}
        onChange={e => setLabel(e.target.value)}
        className="w-full rounded border border-slate-300 px-2 py-1 text-sm text-slate-700"
      />
      <div className="flex flex-wrap gap-2">
        <label className="flex flex-col text-xs text-slate-500">
          Due date
          <input
            aria-label="Due date"
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            className="mt-0.5 rounded border border-slate-300 px-2 py-1 text-sm text-slate-700"
          />
        </label>
        <label className="flex flex-col text-xs text-slate-500">
          Type
          <select
            aria-label="Requirement type"
            value={requirementType}
            onChange={e => setRequirementType(e.target.value)}
            className="mt-0.5 rounded border border-slate-300 px-2 py-1 text-sm text-slate-700 capitalize"
          >
            {REQUIREMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
      </div>
      {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} disabled={pending} className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-500 hover:text-slate-700 disabled:opacity-50">Cancel</button>
        <button type="submit" disabled={pending} className="rounded-lg bg-forest-900 px-3 py-1 text-xs font-medium text-white hover:bg-forest-800 disabled:opacity-50">{pending ? 'Saving…' : submitLabel}</button>
      </div>
    </form>
  )
}

function DeadlineTimeline({
  deadlines,
  schoolYearId,
  onCreate,
  onUpdate,
  onDelete,
}: {
  deadlines: ComplianceDeadline[]
  schoolYearId: string | null
  onCreate: (values: { label: string; dueDate: string; requirementType: string }) => Promise<void>
  onUpdate: (id: string, patch: Partial<Pick<ComplianceDeadline, 'label' | 'dueDate' | 'requirementType' | 'isCompleted'>>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  return (
    <div data-testid="compliance-deadlines" className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" />
          Upcoming deadlines
        </h3>
        {schoolYearId && (
          <button
            type="button"
            data-testid="add-deadline-toggle"
            onClick={() => { setShowAddForm(v => !v); setEditingId(null) }}
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-0.5 text-xs text-forest-700 hover:bg-forest-50"
          >
            <Plus className="w-3 h-3" /> {showAddForm ? 'Cancel' : 'Add deadline'}
          </button>
        )}
      </div>

      {!schoolYearId && (
        <p className="text-xs text-amber-700">Set up a school year to manage deadlines.</p>
      )}

      {showAddForm && schoolYearId && (
        <div data-testid="add-deadline-form">
          <DeadlineForm
            submitLabel="Add deadline"
            onSubmit={async values => { await onCreate(values); setShowAddForm(false) }}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {deadlines.length === 0 ? (
        <p className="text-sm text-slate-400">No deadlines configured.</p>
      ) : (
        <ul className="space-y-2">
          {deadlines.map(d => (
            <li key={d.id} className="text-sm">
              {editingId === d.id ? (
                <DeadlineForm
                  submitLabel="Save"
                  initial={{ label: d.label, dueDate: d.dueDate, requirementType: d.requirementType }}
                  onSubmit={async values => { await onUpdate(d.id, values); setEditingId(null) }}
                  onCancel={() => setEditingId(null)}
                />
              ) : confirmDeleteId === d.id ? (
                <InlineConfirm
                  message="Delete this deadline?"
                  detail={`${d.label} · due ${d.dueDate}`}
                  confirmLabel="Delete"
                  onConfirm={async () => { await onDelete(d.id); setConfirmDeleteId(null) }}
                  onCancel={() => setConfirmDeleteId(null)}
                />
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      type="button"
                      aria-label={d.isCompleted ? 'Reopen deadline' : 'Mark deadline complete'}
                      onClick={() => onUpdate(d.id, { isCompleted: !d.isCompleted })}
                      className="flex-shrink-0"
                    >
                      {d.isCompleted
                        ? <CheckCircle2 className="w-4 h-4 text-forest-500" />
                        : <Clock className="w-4 h-4 text-slate-400 hover:text-forest-500" />
                      }
                    </button>
                    <span className={d.isCompleted ? 'text-slate-400 line-through truncate' : 'text-slate-700 truncate'}>
                      {d.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-slate-400">{d.dueDate}</span>
                    <button type="button" aria-label="Edit deadline" onClick={() => { setEditingId(d.id); setShowAddForm(false) }} className="text-slate-400 hover:text-forest-700">
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button type="button" aria-label="Delete deadline" onClick={() => setConfirmDeleteId(d.id)} className="text-slate-400 hover:text-red-600">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const NEXT_STATUS: Record<SubmissionStatus, SubmissionStatus | null> = {
  drafted: 'sent',
  sent: 'accepted',
  accepted: null,
}
const NEXT_STATUS_LABEL: Record<SubmissionStatus, string> = {
  drafted: 'Mark sent',
  sent: 'Mark accepted',
  accepted: '',
}

function SubmissionsTracker({
  submissions,
  schoolYearId,
  onCreate,
  onAdvance,
  onDelete,
}: {
  submissions: ComplianceSubmission[]
  schoolYearId: string | null
  onCreate: () => Promise<void>
  onAdvance: (id: string, next: SubmissionStatus) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  return (
    <div data-testid="compliance-submissions" className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-400" />
          Submission tracker
        </h3>
        {schoolYearId && (
          <button
            type="button"
            data-testid="add-submission"
            onClick={() => onCreate()}
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-0.5 text-xs text-forest-700 hover:bg-forest-50"
          >
            <Plus className="w-3 h-3" /> New submission
          </button>
        )}
      </div>

      {submissions.length === 0 ? (
        <p className="text-sm text-slate-400">No submissions yet.</p>
      ) : (
        <ul className="space-y-2">
          {submissions.map(s => (
            <li key={s.id} className="text-sm">
              {confirmDeleteId === s.id ? (
                <InlineConfirm
                  message="Delete this submission?"
                  confirmLabel="Delete"
                  onConfirm={async () => { await onDelete(s.id); setConfirmDeleteId(null) }}
                  onCancel={() => setConfirmDeleteId(null)}
                />
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-700">
                    {s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : 'Draft'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={s.status === 'accepted' ? 'badge-green' : 'badge-amber'}>{s.status}</span>
                    {NEXT_STATUS[s.status] && (
                      <button
                        type="button"
                        onClick={() => onAdvance(s.id, NEXT_STATUS[s.status]!)}
                        className="rounded-lg border border-slate-200 px-2 py-0.5 text-xs text-forest-700 hover:bg-forest-50"
                      >
                        {NEXT_STATUS_LABEL[s.status]}
                      </button>
                    )}
                    <button type="button" aria-label="Delete submission" onClick={() => setConfirmDeleteId(s.id)} className="text-slate-400 hover:text-red-600">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
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
  const [rulesets, setRulesets] = useState<ComplianceRuleset[]>([])
  const [deadlines, setDeadlines] = useState<ComplianceDeadline[]>([])
  const [submissions, setSubmissions] = useState<ComplianceSubmission[]>([])
  const [schoolYearId, setSchoolYearId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const householdId = householdProfile?.id ?? ''

  // Reloads the household-scoped, year-scoped data after a mutation.
  async function reload(yearForQuery: string) {
    const [rulesetRes, deadlinesRes, submissionsRes] = await Promise.all([
      complianceApi.getRuleset(householdId),
      complianceApi.getDeadlines(householdId, yearForQuery),
      complianceApi.getSubmissions(householdId, yearForQuery),
    ])
    setRuleset(rulesetRes.data)
    setDeadlines(deadlinesRes.data)
    setSubmissions(submissionsRes.data)
  }

  useEffect(() => {
    if (!householdId) return
    let cancelled = false
    ;(async () => {
      try {
        const activeYearId = await complianceApi.getActiveSchoolYearId()
        const yearForQuery = activeYearId ?? 'current'
        const [statusRes, rulesetRes, deadlinesRes, submissionsRes, rulesetsRes] = await Promise.all([
          complianceApi.getStatus(householdId, yearForQuery),
          complianceApi.getRuleset(householdId),
          complianceApi.getDeadlines(householdId, yearForQuery),
          complianceApi.getSubmissions(householdId, yearForQuery),
          complianceApi.getRulesets(),
        ])
        if (cancelled) return
        setSchoolYearId(activeYearId)
        setStatusResult(statusRes.data)
        setRuleset(rulesetRes.data)
        setDeadlines(deadlinesRes.data)
        setSubmissions(submissionsRes.data)
        setRulesets(rulesetsRes.data)
        setLoading(false)
      } catch {
        if (cancelled) return
        setError('Could not load compliance data. Please try again.')
        setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [householdId])

  const yearForQuery = schoolYearId ?? 'current'

  async function handleCreateDeadline(values: { label: string; dueDate: string; requirementType: string }) {
    if (!schoolYearId) return
    const input: DeadlineInput = { schoolYearId, ...values }
    await complianceApi.createDeadline(input)
    setSuccess('Deadline added')
    await reload(yearForQuery)
  }
  async function handleUpdateDeadline(id: string, patch: Partial<Pick<ComplianceDeadline, 'label' | 'dueDate' | 'requirementType' | 'isCompleted'>>) {
    await complianceApi.updateDeadline(id, patch)
    setSuccess('Deadline updated')
    await reload(yearForQuery)
  }
  async function handleDeleteDeadline(id: string) {
    await complianceApi.deleteDeadline(id)
    setSuccess('Deadline deleted')
    await reload(yearForQuery)
  }
  async function handleCreateSubmission() {
    if (!schoolYearId) return
    await complianceApi.createSubmission(schoolYearId)
    setSuccess('Submission created')
    await reload(yearForQuery)
  }
  async function handleAdvanceSubmission(id: string, next: SubmissionStatus) {
    await complianceApi.updateSubmissionStatus(id, next)
    setSuccess('Submission updated')
    await reload(yearForQuery)
  }
  async function handleDeleteSubmission(id: string) {
    await complianceApi.deleteSubmission(id)
    setSuccess('Submission deleted')
    await reload(yearForQuery)
  }
  async function handleSetConfig(input: { activeRulesetId: string | null; pathwayKey: string | null }) {
    await complianceApi.setConfig(input)
    setSuccess('Ruleset updated')
    await reload(yearForQuery)
  }

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

      {success && (
        <InlineSuccess message={success} onDismiss={() => setSuccess(null)} />
      )}

      <StatusHero result={statusResult} />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-4">
          <RulesetCard ruleset={ruleset} rulesets={rulesets} onSetConfig={handleSetConfig} />
          <SubmissionsTracker
            submissions={submissions}
            schoolYearId={schoolYearId}
            onCreate={handleCreateSubmission}
            onAdvance={handleAdvanceSubmission}
            onDelete={handleDeleteSubmission}
          />
        </div>
        <DeadlineTimeline
          deadlines={deadlines}
          schoolYearId={schoolYearId}
          onCreate={handleCreateDeadline}
          onUpdate={handleUpdateDeadline}
          onDelete={handleDeleteDeadline}
        />
      </div>

      <LegalDisclaimer />
    </div>
  )
}
