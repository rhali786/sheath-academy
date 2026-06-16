'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { learningTimeApi } from '@/features/learning-time/front/services/api'
import type { LearningTimeSession } from '@/features/learning-time/types'

interface LearningTimeEntryProps {
  learnerId: string | null
  learnerName?: string
}

function formatElapsed(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const hrs = Math.floor(s / 3600)
  const mins = Math.floor((s % 3600) / 60)
  const secs = s % 60
  const mm = String(mins).padStart(2, '0')
  const ss = String(secs).padStart(2, '0')
  return hrs > 0 ? `${hrs}:${mm}:${ss}` : `${mm}:${ss}`
}

export function LearningTimeEntry({ learnerId, learnerName }: LearningTimeEntryProps) {
  const [active, setActive] = useState<LearningTimeSession | null>(null)

  useEffect(() => {
    if (!learnerId) {
      setActive(null)
      return
    }
    let cancelled = false
    learningTimeApi.getActive(learnerId)
      .then(res => {
        if (!cancelled) setActive(res.data)
      })
      .catch(() => {
        if (!cancelled) setActive(null)
      })
    return () => { cancelled = true }
  }, [learnerId])

  return (
    <div className="bg-white rounded-xl shadow-sm p-5" data-testid="learning-time-entry">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Learning Time</p>
      <Link
        href="/learning-time"
        data-testid="learning-time-link"
        className="inline-block px-4 py-2 bg-forest-900 text-white text-sm font-medium rounded-lg hover:bg-forest-800 transition-colors"
      >
        {active
          ? `Resume session — ${learnerName ?? 'Learner'}, ${formatElapsed(active.elapsedSeconds)}`
          : 'Start Learning Time'}
      </Link>
    </div>
  )
}
