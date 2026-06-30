'use client'

import { useCallback, useEffect, useState } from 'react'
import { GraduationCap, AlertCircle, CheckCircle2, TrendingDown, BookOpen, ChevronDown, ChevronRight, Plus, Pencil, Trash2, SlidersHorizontal } from 'lucide-react'
import { gradebookApi } from '@/features/gradebook/front/services/api'
import { InlineConfirm } from '@/features/lib/front/components/InlineConfirm'
import { InlineSuccess } from '@/features/lib/front/components/InlineSuccess'
import type { GradebookSummary, NeedsAttentionItem, Score, ScoreState, SubjectGradeResult, GradingScale, AggregationRule, AggregationStrategy } from '@/features/gradebook/types'

const AGGREGATION_STRATEGIES: { value: AggregationStrategy; label: string }[] = [
  { value: 'average', label: 'Average' },
  { value: 'most_recent', label: 'Most recent' },
  { value: 'highest', label: 'Highest' },
]

// Default A–F bands used when authoring a new grading scale.
const DEFAULT_NEW_SCALE_BANDS = [
  { minPercent: 90, letter: 'A', gpaPoints: 4 },
  { minPercent: 80, letter: 'B', gpaPoints: 3 },
  { minPercent: 70, letter: 'C', gpaPoints: 2 },
  { minPercent: 60, letter: 'D', gpaPoints: 1 },
  { minPercent: 0, letter: 'F', gpaPoints: 0 },
]

const STATE_OPTIONS: { value: ScoreState; label: string }[] = [
  { value: 'graded', label: 'Graded' },
  { value: 'complete', label: 'Complete' },
  { value: 'not_graded', label: 'Not graded' },
  { value: 'missing', label: 'Missing' },
  { value: 'excused', label: 'Excused' },
]

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

/** occurredAt may arrive as a full ISO timestamp (from the DB) or a date-only string. */
function formatScoreDate(occurredAt: string): string {
  const d = new Date(occurredAt.length === 10 ? `${occurredAt}T00:00:00` : occurredAt)
  if (Number.isNaN(d.getTime())) return occurredAt
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface ScoreFormValues {
  state: ScoreState
  numericValue: number | null
  occurredAt: string
  comment: string
}

function ScoreForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: { state: ScoreState; numericValue: number | null; occurredAt: string; comment?: string }
  submitLabel: string
  onSubmit: (values: ScoreFormValues) => Promise<void>
  onCancel: () => void
}) {
  const [state, setState] = useState<ScoreState>(initial?.state ?? 'graded')
  const [numericValue, setNumericValue] = useState(initial?.numericValue != null ? String(initial.numericValue) : '')
  const [occurredAt, setOccurredAt] = useState(initial?.occurredAt ?? todayISO())
  const [comment, setComment] = useState(initial?.comment ?? '')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (state === 'graded' && (numericValue === '' || Number.isNaN(Number(numericValue)))) {
      setError('Enter a score (0–100) for graded entries.')
      return
    }
    setPending(true)
    try {
      await onSubmit({
        state,
        numericValue: state === 'graded' ? Number(numericValue) : null,
        occurredAt,
        comment: comment.trim(),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save. Please try again.')
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 mt-1">
      <div className="flex flex-wrap gap-2">
        <label className="flex flex-col text-xs text-slate-500">
          State
          <select
            aria-label="Score state"
            value={state}
            onChange={e => setState(e.target.value as ScoreState)}
            className="mt-0.5 rounded border border-slate-300 px-2 py-1 text-sm text-slate-700"
          >
            {STATE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
        {state === 'graded' && (
          <label className="flex flex-col text-xs text-slate-500">
            Score
            <input
              aria-label="Numeric score"
              type="number"
              min={0}
              max={100}
              value={numericValue}
              onChange={e => setNumericValue(e.target.value)}
              className="mt-0.5 w-20 rounded border border-slate-300 px-2 py-1 text-sm text-slate-700"
            />
          </label>
        )}
        <label className="flex flex-col text-xs text-slate-500">
          Date
          <input
            aria-label="Score date"
            type="date"
            value={occurredAt.slice(0, 10)}
            onChange={e => setOccurredAt(e.target.value)}
            className="mt-0.5 rounded border border-slate-300 px-2 py-1 text-sm text-slate-700"
          />
        </label>
      </div>
      <input
        aria-label="Score comment"
        type="text"
        placeholder="Comment (optional)"
        value={comment}
        onChange={e => setComment(e.target.value)}
        className="w-full rounded border border-slate-300 px-2 py-1 text-sm text-slate-700"
      />
      {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-500 hover:text-slate-700 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-forest-900 px-3 py-1 text-xs font-medium text-white hover:bg-forest-800 disabled:opacity-50"
        >
          {pending ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}

function ScoreHistory({ learnerId, subjectId }: { learnerId: string; subjectId: string }) {
  const [scores, setScores] = useState<Score[] | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoadError(false)
    gradebookApi.getScores(learnerId, subjectId)
      .then(res => setScores(res.data))
      .catch(() => { setScores([]); setLoadError(true) })
  }, [learnerId, subjectId])

  useEffect(() => { load() }, [load])

  async function handleAdd(values: ScoreFormValues) {
    await gradebookApi.createScore({ learnerId, subjectId, ...values, comment: values.comment || undefined })
    setShowAddForm(false)
    setSuccess('Score added')
    load()
  }

  async function handleEdit(id: string, values: ScoreFormValues) {
    await gradebookApi.updateScore(id, { ...values, comment: values.comment })
    setEditingId(null)
    setSuccess('Score updated')
    load()
  }

  async function handleDelete(id: string) {
    await gradebookApi.deleteScore(id)
    setConfirmDeleteId(null)
    setSuccess('Score deleted')
    load()
  }

  return (
    <div className="pl-6 pt-1 space-y-2">
      <div className="flex items-center justify-between">
        {scores === null
          ? <span className="text-xs text-slate-400 animate-pulse">Loading…</span>
          : <span className="text-xs text-slate-400">{scores.length === 0 ? 'No scored attempts yet.' : 'Score history'}</span>}
        <button
          type="button"
          data-testid={`add-score-toggle-${subjectId}`}
          onClick={() => { setShowAddForm(v => !v); setEditingId(null) }}
          className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-0.5 text-xs text-forest-700 hover:bg-forest-50"
        >
          <Plus className="w-3 h-3" /> {showAddForm ? 'Cancel' : 'Add score'}
        </button>
      </div>

      {loadError && <p className="text-xs text-red-600" role="alert">Could not load scores. Please try again.</p>}

      {success && (
        <InlineSuccess message={success} onDismiss={() => setSuccess(null)} />
      )}

      {showAddForm && (
        <div data-testid={`add-score-form-${subjectId}`}>
          <ScoreForm submitLabel="Add score" onSubmit={handleAdd} onCancel={() => setShowAddForm(false)} />
        </div>
      )}

      {scores !== null && scores.length > 0 && (
        <ul className="space-y-1 border-l-2 border-forest-100">
          {scores.map(score => (
            <li key={score.id} className="text-xs text-slate-600 pl-2">
              {editingId === score.id ? (
                <ScoreForm
                  submitLabel="Save"
                  initial={{ state: score.state, numericValue: score.numericValue, occurredAt: score.occurredAt.slice(0, 10), comment: score.comment }}
                  onSubmit={values => handleEdit(score.id, values)}
                  onCancel={() => setEditingId(null)}
                />
              ) : confirmDeleteId === score.id ? (
                <InlineConfirm
                  message="Delete this score?"
                  detail={`${formatScoreDate(score.occurredAt)} · ${score.state === 'graded' ? `${score.numericValue}%` : score.state}`}
                  confirmLabel="Delete"
                  onConfirm={() => handleDelete(score.id)}
                  onCancel={() => setConfirmDeleteId(null)}
                />
              ) : (
                <div className="flex items-center gap-2 py-0.5">
                  <span className="text-slate-400 w-12 flex-shrink-0">{formatScoreDate(score.occurredAt)}</span>
                  {score.state === 'graded' && score.numericValue !== null ? (
                    <span className={gradeLetter(score.numericValue >= 90 ? 'A' : score.numericValue >= 80 ? 'B' : score.numericValue >= 70 ? 'C' : 'F') ?? ''}>
                      {score.numericValue}%
                    </span>
                  ) : (
                    <span className="badge-amber capitalize">{score.state}</span>
                  )}
                  {score.comment && <span className="text-slate-400 truncate flex-1">{score.comment}</span>}
                  <button
                    type="button"
                    aria-label="Edit score"
                    onClick={() => { setEditingId(score.id); setShowAddForm(false) }}
                    className="ml-auto text-slate-400 hover:text-forest-700"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    aria-label="Delete score"
                    onClick={() => setConfirmDeleteId(score.id)}
                    className="text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function gradeLetter(letter: string | null) {
  if (!letter) return null
  const map: Record<string, string> = {
    A: 'badge-green',
    B: 'badge-green',
    C: 'badge-amber',
    D: 'badge-amber',
    F: 'badge-red',
  }
  return map[letter] ?? 'badge-amber'
}

function NeedsAttentionQueue({ items }: { items: NeedsAttentionItem[] }) {
  if (items.length === 0) {
    return (
      <div
        data-testid="gradebook-all-caught-up"
        className="flex items-center gap-2 text-sm text-forest-700 bg-forest-50 border border-forest-100 rounded-xl px-4 py-3"
      >
        <CheckCircle2 className="w-4 h-4 text-forest-600 flex-shrink-0" />
        <span>All caught up — no subjects need attention right now.</span>
      </div>
    )
  }

  return (
    <div data-testid="gradebook-needs-attention" className="card p-4 space-y-2">
      <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-amber-500" />
        Needs attention
      </h3>
      <ul className="space-y-1">
        {items.slice(0, 5).map(item => (
          <li key={item.subjectId} className="flex items-center gap-2 text-sm text-slate-600">
            <span className={`badge-${item.reason === 'missing' ? 'amber' : 'red'}`}>
              {item.reason === 'missing' ? 'Missing' : item.reason === 'decaying' ? 'Needs review' : 'No scores'}
            </span>
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

interface GradebookConfig {
  scales: GradingScale[]
  rules: AggregationRule[]
  onReload: () => void
}

function SubjectConfigPanel({ subject, config }: { subject: SubjectGradeResult; config: GradebookConfig }) {
  const [creditHours, setCreditHours] = useState(subject.creditHours != null ? String(subject.creditHours) : '')
  const [isFormalCourse, setIsFormalCourse] = useState(subject.isFormalCourse ?? false)
  const [termModel, setTermModel] = useState(subject.termModel ?? '')
  const [gradingScaleId, setGradingScaleId] = useState(subject.gradingScaleId ?? '')
  const [aggregationRuleId, setAggregationRuleId] = useState(subject.aggregationRuleId ?? '')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    setError(null)
    setPending(true)
    try {
      await gradebookApi.updateSubjectConfig(subject.subjectId, {
        creditHours: creditHours === '' ? null : Number(creditHours),
        isFormalCourse,
        termModel: termModel || null,
        gradingScaleId: gradingScaleId || null,
        aggregationRuleId: aggregationRuleId || null,
      })
      config.onReload()
    } catch {
      setError('Could not save course config. Please try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div data-testid={`subject-config-${subject.subjectId}`} className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 pl-6 text-left">
      <div className="flex flex-wrap gap-3">
        <label className="flex flex-col text-xs text-slate-500">
          Credit hours
          <input aria-label="Credit hours" type="number" min={0} step="0.5" value={creditHours} onChange={e => setCreditHours(e.target.value)} className="mt-0.5 w-20 rounded border border-slate-300 px-2 py-1 text-sm" />
        </label>
        <label className="flex flex-col text-xs text-slate-500">
          Term model
          <input aria-label="Term model" type="text" placeholder="semester" value={termModel} onChange={e => setTermModel(e.target.value)} className="mt-0.5 w-28 rounded border border-slate-300 px-2 py-1 text-sm" />
        </label>
        <label className="flex items-center gap-1 text-xs text-slate-600 self-end pb-1">
          <input aria-label="Formal course" type="checkbox" checked={isFormalCourse} onChange={e => setIsFormalCourse(e.target.checked)} className="rounded border-slate-300" />
          Formal course
        </label>
      </div>
      <div className="flex flex-wrap gap-3">
        <label className="flex flex-col text-xs text-slate-500">
          Grading scale
          <select aria-label="Grading scale" value={gradingScaleId} onChange={e => setGradingScaleId(e.target.value)} className="mt-0.5 rounded border border-slate-300 px-2 py-1 text-sm">
            <option value="">Default (A–F)</option>
            {config.scales.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col text-xs text-slate-500">
          Aggregation rule
          <select aria-label="Aggregation rule" value={aggregationRuleId} onChange={e => setAggregationRuleId(e.target.value)} className="mt-0.5 rounded border border-slate-300 px-2 py-1 text-sm">
            <option value="">Average (default)</option>
            {config.rules.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </label>
      </div>
      {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
      <div className="flex justify-end">
        <button type="button" onClick={save} disabled={pending} className="rounded-lg bg-forest-900 px-3 py-1 text-xs font-medium text-white hover:bg-forest-800 disabled:opacity-50">{pending ? 'Saving…' : 'Save config'}</button>
      </div>
    </div>
  )
}

function GradebookConfigManager({ config }: { config: GradebookConfig }) {
  const [open, setOpen] = useState(false)
  const [scaleName, setScaleName] = useState('')
  const [ruleName, setRuleName] = useState('')
  const [ruleStrategy, setRuleStrategy] = useState<AggregationStrategy>('average')
  const [confirmDelete, setConfirmDelete] = useState<{ kind: 'scale' | 'rule'; id: string } | null>(null)

  async function addScale() {
    if (!scaleName.trim()) return
    await gradebookApi.createGradingScale(scaleName.trim(), DEFAULT_NEW_SCALE_BANDS)
    setScaleName('')
    config.onReload()
  }
  async function addRule() {
    if (!ruleName.trim()) return
    await gradebookApi.createAggregationRule(ruleName.trim(), ruleStrategy)
    setRuleName('')
    config.onReload()
  }
  async function doDelete() {
    if (!confirmDelete) return
    if (confirmDelete.kind === 'scale') await gradebookApi.deleteGradingScale(confirmDelete.id)
    else await gradebookApi.deleteAggregationRule(confirmDelete.id)
    setConfirmDelete(null)
    config.onReload()
  }

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-slate-400" /> Grading scales &amp; aggregation rules
        </h2>
        <button type="button" data-testid="toggle-grading-config" onClick={() => setOpen(v => !v)} className="text-xs text-forest-700 hover:text-forest-900 underline underline-offset-2">
          {open ? 'Hide' : 'Manage'}
        </button>
      </div>

      {open && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500">Grading scales</p>
            <ul className="space-y-1">
              {config.scales.map(s => (
                <li key={s.id} className="flex items-center justify-between text-sm text-slate-700">
                  <span className="truncate">{s.name}</span>
                  <button type="button" aria-label={`Delete grading scale ${s.name}`} onClick={() => setConfirmDelete({ kind: 'scale', id: s.id })} className="text-slate-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-1">
              <input aria-label="New grading scale name" type="text" placeholder="Scale name" value={scaleName} onChange={e => setScaleName(e.target.value)} className="flex-1 rounded border border-slate-300 px-2 py-1 text-xs" />
              <button type="button" onClick={addScale} className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-forest-700 hover:bg-forest-50 flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500">Aggregation rules</p>
            <ul className="space-y-1">
              {config.rules.map(r => (
                <li key={r.id} className="flex items-center justify-between text-sm text-slate-700">
                  <span className="truncate">{r.name} <span className="text-xs text-slate-400">({r.strategy})</span></span>
                  <button type="button" aria-label={`Delete aggregation rule ${r.name}`} onClick={() => setConfirmDelete({ kind: 'rule', id: r.id })} className="text-slate-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-1">
              <input aria-label="New aggregation rule name" type="text" placeholder="Rule name" value={ruleName} onChange={e => setRuleName(e.target.value)} className="flex-1 rounded border border-slate-300 px-2 py-1 text-xs" />
              <select aria-label="New aggregation rule strategy" value={ruleStrategy} onChange={e => setRuleStrategy(e.target.value as AggregationStrategy)} className="rounded border border-slate-300 px-1 py-1 text-xs">
                {AGGREGATION_STRATEGIES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <button type="button" onClick={addRule} className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-forest-700 hover:bg-forest-50 flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
            </div>
          </div>

          {confirmDelete && (
            <div className="sm:col-span-2">
              <InlineConfirm
                message={`Delete this ${confirmDelete.kind === 'scale' ? 'grading scale' : 'aggregation rule'}?`}
                confirmLabel="Delete"
                onConfirm={doDelete}
                onCancel={() => setConfirmDelete(null)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function LearnerCard({ summary, config }: { summary: GradebookSummary; config: GradebookConfig }) {
  const hasSubjects = summary.subjects.length > 0
  const hasGpa = summary.gpa.unweighted !== null
  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(null)
  const [configSubjectId, setConfigSubjectId] = useState<string | null>(null)

  function toggleSubject(subjectId: string) {
    setExpandedSubjectId(prev => prev === subjectId ? null : subjectId)
  }

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-100 text-forest-800 font-semibold text-sm">
            {summary.learnerName[0]}
          </span>
          <div>
            <p className="font-semibold text-slate-900">{summary.learnerName}</p>
            <p className="text-xs text-slate-400 capitalize">{summary.gradeBand.replace('_', '/')}</p>
          </div>
        </div>
        {hasGpa && (
          <div className="text-right">
            <p className="text-xs text-slate-400">GPA</p>
            <p className="text-lg font-bold text-forest-700" data-testid={`gpa-${summary.learnerId}`}>
              {summary.gpa.unweighted!.toFixed(1)}
            </p>
          </div>
        )}
      </div>

      {!hasSubjects ? (
        <div
          data-testid={`learner-empty-${summary.learnerName.toLowerCase()}`}
          className="text-sm text-slate-400 italic py-2"
        >
          No subjects graded yet — add subjects to start tracking progress.
        </div>
      ) : (
        <div className="space-y-1">
          {summary.subjects.map(subject => {
            const isExpanded = expandedSubjectId === subject.subjectId
            return (
              <div key={subject.subjectId}>
                <button
                  type="button"
                  data-testid={`subject-row-${summary.learnerId}-${subject.subjectId}`}
                  onClick={() => toggleSubject(subject.subjectId)}
                  className="w-full flex items-center justify-between gap-2 py-1 rounded hover:bg-slate-50 transition-colors text-left"
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isExpanded
                      ? <ChevronDown className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      : <ChevronRight className="w-3 h-3 text-slate-400 flex-shrink-0" />
                    }
                    <BookOpen className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="text-sm text-slate-700 truncate">{subject.label}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {subject.needsReview && (
                      <TrendingDown className="w-3.5 h-3.5 text-amber-500" aria-label="Needs review" />
                    )}
                    {subject.gradeLetter ? (
                      <span className={gradeLetter(subject.gradeLetter) ?? ''}>
                        {subject.gradeLetter}
                        {subject.pointsAverage !== null && (
                          <span className="ml-1 text-xs opacity-70">
                            ({subject.pointsAverage.toFixed(0)}%)
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="badge-amber">No grade</span>
                    )}
                  </div>
                </button>
                {isExpanded && (
                  <div data-testid={`score-history-${summary.learnerId}-${subject.subjectId}`}>
                    <div className="pl-6 pt-1">
                      <button
                        type="button"
                        data-testid={`course-config-toggle-${subject.subjectId}`}
                        onClick={() => setConfigSubjectId(prev => prev === subject.subjectId ? null : subject.subjectId)}
                        className="flex items-center gap-1 text-xs text-forest-700 hover:text-forest-900"
                      >
                        <SlidersHorizontal className="w-3 h-3" /> {configSubjectId === subject.subjectId ? 'Hide course config' : 'Course config'}
                      </button>
                    </div>
                    {configSubjectId === subject.subjectId && (
                      <SubjectConfigPanel subject={subject} config={config} />
                    )}
                    <ScoreHistory learnerId={summary.learnerId} subjectId={subject.subjectId} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function GradebookPage() {
  const [summaries, setSummaries] = useState<GradebookSummary[]>([])
  const [scales, setScales] = useState<GradingScale[]>([])
  const [rules, setRules] = useState<AggregationRule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const needsAttention: NeedsAttentionItem[] = summaries.flatMap(s =>
    s.needsAttentionSubjects.map(subjectId => {
      const subject = s.subjects.find(sub => sub.subjectId === subjectId)
      return {
        subjectId,
        label: subject?.label ?? subjectId,
        reason: (subject?.gradeLetter === null ? 'missing' : 'no_scores') as NeedsAttentionItem['reason'],
      }
    })
  ).slice(0, 5)

  const loadConfig = useCallback(() => {
    Promise.all([gradebookApi.getGradingScales(), gradebookApi.getAggregationRules()])
      .then(([scalesRes, rulesRes]) => {
        setScales(scalesRes.data)
        setRules(rulesRes.data)
      })
      .catch(() => { /* config is optional — leave defaults */ })
  }, [])

  const reloadSummaries = useCallback(() => {
    gradebookApi.getSummaries('').then(res => setSummaries(res.data)).catch(() => {})
  }, [])

  useEffect(() => {
    gradebookApi.getSummaries('').then(res => {
      setSummaries(res.data)
      setLoading(false)
    }).catch(() => {
      setError('Could not load gradebook. Please try again.')
      setLoading(false)
    })
    loadConfig()
  }, [loadConfig])

  const config: GradebookConfig = {
    scales,
    rules,
    onReload: () => { reloadSummaries(); loadConfig() },
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4" data-testid="gradebook-loading">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card h-32 bg-slate-100" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4" data-testid="gradebook-error">
        <div className="card p-6 text-center space-y-2">
          <AlertCircle className="w-6 h-6 text-red-400 mx-auto" />
          <p className="text-sm text-slate-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6">
      <div className="flex items-center gap-3">
        <GraduationCap className="w-6 h-6 text-forest-700" />
        <h1 className="page-title">Gradebook</h1>
      </div>

      <NeedsAttentionQueue items={needsAttention} />

      <GradebookConfigManager config={config} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {summaries.map(summary => (
          <LearnerCard key={summary.learnerId} summary={summary} config={config} />
        ))}
      </div>
    </div>
  )
}
