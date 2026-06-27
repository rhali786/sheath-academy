'use client'

import { useEffect, useState } from 'react'
import { GraduationCap, AlertCircle, CheckCircle2, TrendingDown, BookOpen, ChevronDown, ChevronRight } from 'lucide-react'
import { gradebookApi } from '@/features/gradebook/front/services/api'
import type { GradebookSummary, NeedsAttentionItem, Score } from '@/features/gradebook/types'

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

function ScoreHistory({ learnerId, subjectId }: { learnerId: string; subjectId: string }) {
  const [scores, setScores] = useState<Score[] | null>(null)

  useEffect(() => {
    gradebookApi.getScores(learnerId, subjectId).then(res => setScores(res.data))
  }, [learnerId, subjectId])

  if (scores === null) {
    return <p className="text-xs text-slate-400 py-1 pl-6 animate-pulse">Loading…</p>
  }
  if (scores.length === 0) {
    return <p className="text-xs text-slate-400 py-1 pl-6">No scored attempts yet.</p>
  }
  return (
    <ul className="mt-1 space-y-1 pl-6 border-l-2 border-forest-100">
      {scores.map(score => {
        const dateStr = new Date(`${score.occurredAt}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        return (
          <li key={score.id} className="text-xs text-slate-600 flex items-center gap-2 py-0.5">
            <span className="text-slate-400 w-12 flex-shrink-0">{dateStr}</span>
            {score.state === 'graded' && score.numericValue !== null ? (
              <span className={gradeLetter(score.numericValue >= 90 ? 'A' : score.numericValue >= 80 ? 'B' : score.numericValue >= 70 ? 'C' : 'F') ?? ''}>
                {score.numericValue}%
              </span>
            ) : (
              <span className="badge-amber capitalize">{score.state}</span>
            )}
            {score.comment && <span className="text-slate-400 truncate">{score.comment}</span>}
          </li>
        )
      })}
    </ul>
  )
}

function LearnerCard({ summary }: { summary: GradebookSummary }) {
  const hasSubjects = summary.subjects.length > 0
  const hasGpa = summary.gpa.unweighted !== null
  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(null)

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

  useEffect(() => {
    gradebookApi.getSummaries('').then(res => {
      setSummaries(res.data)
      setLoading(false)
    }).catch(() => {
      setError('Could not load gradebook. Please try again.')
      setLoading(false)
    })
  }, [])

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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {summaries.map(summary => (
          <LearnerCard key={summary.learnerId} summary={summary} />
        ))}
      </div>
    </div>
  )
}
