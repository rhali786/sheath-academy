'use client'

import { useEffect, useState } from 'react'
import { learningTimeApi } from '@/features/learning-time/front/services/api'
import { formatElapsed } from '@/features/learning-time/front/lib/formatElapsed'
import { useHousehold } from '@/features/household/front/context'
import type { LearningTimeSession, Outcome } from '@/features/learning-time/types'

interface SessionHistoryListProps {
  learnerId: string
}

const OUTCOME_LABELS: Record<Outcome, string> = {
  complete: 'Complete',
  partial: 'Partial',
  abandoned: 'Abandoned',
}

export function SessionHistoryList({ learnerId }: SessionHistoryListProps) {
  const { allSubjects } = useHousehold()
  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState<LearningTimeSession[]>([])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    learningTimeApi.list({ learnerId })
      .then(res => {
        if (cancelled) return
        setSessions(res.data)
      })
      .catch(() => {
        if (!cancelled) setSessions([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [learnerId])

  const sorted = [...sessions].sort((a, b) => (b.endedAt ?? '').localeCompare(a.endedAt ?? ''))

  function subjectName(subjectId: string | null): string {
    if (!subjectId) return 'No subject'
    return allSubjects.find(s => s.id === subjectId)?.name ?? 'No subject'
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Recent sessions</h2>
      {loading ? (
        <p className="text-sm text-slate-500" data-testid="session-history-loading">Loading…</p>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-slate-500" data-testid="session-history-empty">No completed sessions yet</p>
      ) : (
        <ul className="divide-y divide-slate-100" data-testid="session-history-list">
          {sorted.map(session => (
            <li key={session.id} className="py-2 flex items-center justify-between gap-4 text-sm">
              <span className="text-slate-500 w-24 shrink-0">
                {session.endedAt ? new Date(session.endedAt).toLocaleDateString() : ''}
              </span>
              <span className="text-slate-900 flex-1">{subjectName(session.subjectId)}</span>
              <span className="text-slate-500 font-mono">{formatElapsed(session.elapsedSeconds)}</span>
              <span className="text-slate-500 w-20 text-right">
                {session.outcome ? OUTCOME_LABELS[session.outcome] : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
