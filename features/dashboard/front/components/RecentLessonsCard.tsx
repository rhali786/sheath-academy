'use client'

import { useEffect, useState } from 'react'
import { plannerApi } from '@/features/plan/front/services/api'
import type { LessonTask } from '@/features/plan/types'

interface Props {
  childId?: string
  limit?: number
}

export function RecentLessonsCard({ childId, limit = 5 }: Props) {
  const [lessons, setLessons] = useState<LessonTask[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    setLessons(null)
    setError(false)
    plannerApi.getHistory({ childId, limit })
      .then(data => { if (active) setLessons(data) })
      .catch(() => { if (active) setError(true) })
    return () => { active = false }
  }, [childId, limit])

  if (error) {
    return (
      <div className="rounded-xl border border-red-100 bg-white p-4 text-sm text-red-600">
        Failed to load lesson history.
      </div>
    )
  }

  if (lessons === null) {
    return (
      <div className="rounded-xl border bg-white p-4 text-sm text-gray-400">
        Loading history...
      </div>
    )
  }

  if (lessons.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-4 text-sm text-gray-400">
        No completed lessons yet.
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-white divide-y">
      <div className="px-4 py-3 font-semibold text-slate-800 text-sm">Recently Completed</div>
      <ul>
        {lessons.map(lesson => (
          <li key={lesson.id} className="px-4 py-2.5 flex items-center justify-between gap-4">
            <span className="text-sm text-slate-700 truncate flex-1">{lesson.title}</span>
            <span className="text-xs text-slate-400 shrink-0">{lesson.dueDate}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
