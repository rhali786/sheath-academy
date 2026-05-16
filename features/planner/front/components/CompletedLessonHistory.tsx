'use client'

import { useEffect, useState } from 'react'
import { plannerApi } from '@/features/planner/front/services/api'
import type { LessonTask } from '@/features/lib/types'
import type { LessonHistoryOptions } from '@/features/planner/utils/completedLessonHistory'

interface Props {
  childId?: string
  subjectId?: string
  limit?: number
}

export function CompletedLessonHistory({ childId, subjectId, limit }: Props) {
  const [lessons, setLessons] = useState<LessonTask[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    setLessons(null)
    setError(false)
    const opts: LessonHistoryOptions = {}
    if (childId) opts.childId = childId
    if (subjectId) opts.subjectId = subjectId
    if (limit !== undefined) opts.limit = limit
    plannerApi.getHistory(opts)
      .then(data => { if (active) setLessons(data) })
      .catch(() => { if (active) setError(true) })
    return () => { active = false }
  }, [childId, subjectId, limit])

  if (error) {
    return (
      <div className="rounded-lg border p-4 text-sm text-red-600">
        Failed to load lesson history.
      </div>
    )
  }

  if (lessons === null) {
    return (
      <div className="rounded-lg border p-4 text-sm text-gray-500">
        Loading history...
      </div>
    )
  }

  if (lessons.length === 0) {
    return (
      <div className="rounded-lg border p-4 text-sm text-gray-500">
        No completed lessons yet.
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-white divide-y">
      <div className="px-4 py-3 font-semibold text-gray-800 text-sm">Completed Lessons</div>
      <ul>
        {lessons.map(lesson => (
          <li key={lesson.id} className="px-4 py-3 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-800 truncate">{lesson.title}</div>
            </div>
            <span className="text-xs text-gray-400 shrink-0">{lesson.dueDate}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
