'use client'

import { useEffect, useState } from 'react'
import { GraduationCap, AlertCircle, CheckCircle2, TrendingDown, BookOpen } from 'lucide-react'
import { gradebookApi } from '@/features/gradebook/front/services/api'
import type { GradebookSummary, NeedsAttentionItem } from '@/features/gradebook/types'

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

function LearnerCard({ summary }: { summary: GradebookSummary }) {
  const hasSubjects = summary.subjects.length > 0
  const hasGpa = summary.gpa.unweighted !== null

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
        <div className="space-y-2">
          {summary.subjects.map(subject => (
            <div key={subject.subjectId} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
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
            </div>
          ))}
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
      <div className="page-shell" data-testid="gradebook-loading">
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
      <div className="page-shell" data-testid="gradebook-error">
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
