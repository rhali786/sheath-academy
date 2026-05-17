'use client'

import { useEffect, useState } from 'react'
import { plannerApi } from '@/features/plan/front/services/api'
import type { SubjectProgressSummary } from '@/features/plan/utils/progressBySubject'

interface Props {
  scope: 'week' | 'year'
  dateRange: { start: string; end: string }
  childId?: string
}

export function ProgressBySubjectCard({ scope, dateRange, childId }: Props) {
  const [summaries, setSummaries] = useState<SubjectProgressSummary[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    setSummaries(null)
    setError(false)
    plannerApi.getProgress(scope, dateRange, childId)
      .then(data => { if (active) setSummaries(data) })
      .catch(() => { if (active) setError(true) })
    return () => { active = false }
  }, [scope, dateRange.start, dateRange.end, childId])

  if (error) {
    return (
      <div className="rounded-lg border p-4 text-sm text-red-600">
        Failed to load progress data.
      </div>
    )
  }

  if (summaries === null) {
    return (
      <div className="rounded-lg border p-4 text-sm text-gray-500">
        Loading progress...
      </div>
    )
  }

  if (summaries.length === 0) {
    return (
      <div className="rounded-lg border p-4 text-sm text-gray-500">
        No lessons planned for this period.
      </div>
    )
  }

  // Group by child
  const byChild = new Map<string, SubjectProgressSummary[]>()
  for (const s of summaries) {
    const group = byChild.get(s.childId) ?? []
    group.push(s)
    byChild.set(s.childId, group)
  }

  return (
    <div className="rounded-lg border bg-white divide-y">
      <div className="px-4 py-3 font-semibold text-gray-800 text-sm">
        Progress by Subject — {scope === 'week' ? 'This Week' : 'School Year'}
      </div>
      {Array.from(byChild.entries()).map(([, rows]) => {
        const childName = rows[0].childName
        return (
          <div key={rows[0].childId} className="px-4 py-3">
            <div className="font-medium text-gray-700 mb-2">{childName}</div>
            <div className="space-y-2">
              {rows.map(row => (
                <div key={row.subjectId} className="flex items-center gap-3">
                  <span className="flex-1 text-sm text-gray-600">{row.subjectName}</span>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <span className="font-medium text-green-700">{row.completedCount}</span>
                    <span>/</span>
                    <span>{row.plannedCount}</span>
                  </div>
                  <div className="w-20 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${Math.round(row.completionRate * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-8 text-right">
                    {Math.round(row.completionRate * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
