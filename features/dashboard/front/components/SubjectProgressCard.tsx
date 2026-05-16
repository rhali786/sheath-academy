'use client'

import { useEffect, useState } from 'react'
import { plannerApi } from '@/features/planner/front/services/api'
import type { SubjectProgressSummary } from '@/features/planner/utils/progressBySubject'

function getCurrentWeekRange(): { start: string; end: string } {
  const today = new Date()
  const dow = today.getDay()
  const daysFromMonday = dow === 0 ? 6 : dow - 1
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysFromMonday)
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6)
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return { start: fmt(monday), end: fmt(sunday) }
}

interface Props {
  childId?: string
}

export function SubjectProgressCard({ childId }: Props = {}) {
  const [summaries, setSummaries] = useState<SubjectProgressSummary[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    setSummaries(null)
    setError(false)
    const range = getCurrentWeekRange()
    plannerApi.getProgress('week', range, childId)
      .then(data => { if (active) setSummaries(data) })
      .catch(() => { if (active) setError(true) })
    return () => { active = false }
  }, [childId])

  if (error) {
    return (
      <div className="rounded-xl border border-red-100 bg-white p-4 text-sm text-red-600">
        Failed to load progress data.
      </div>
    )
  }

  if (summaries === null) {
    return (
      <div className="rounded-xl border bg-white p-4 text-sm text-gray-400">
        Loading progress...
      </div>
    )
  }

  if (summaries.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-4 text-sm text-gray-400">
        No lessons planned this week.
      </div>
    )
  }

  const byChild = new Map<string, SubjectProgressSummary[]>()
  for (const s of summaries) {
    const g = byChild.get(s.childId) ?? []
    g.push(s)
    byChild.set(s.childId, g)
  }

  return (
    <div className="rounded-xl border bg-white divide-y">
      <div className="px-4 py-3 font-semibold text-slate-800 text-sm">This Week by Subject</div>
      {Array.from(byChild.entries()).map(([, rows]) => (
        <div key={rows[0].childId} className="px-4 py-3">
          <div className="font-medium text-slate-600 text-xs uppercase tracking-wide mb-2">
            {rows[0].childName}
          </div>
          <div className="space-y-2">
            {rows.map(row => (
              <div key={row.subjectId} className="flex items-center gap-2">
                <span className="flex-1 text-sm text-slate-700">{row.subjectName}</span>
                <span className="text-xs text-slate-400">
                  {row.completedCount}/{row.plannedCount}
                </span>
                <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-forest-600 rounded-full"
                    style={{ width: `${Math.round(row.completionRate * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
