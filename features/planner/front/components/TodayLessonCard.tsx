'use client'

import { useEffect, useState } from 'react'
import { plannerApi } from '@/features/planner/front/services/api'
import type { LessonTask, LessonTaskStatus } from '@/features/planner/types'

function mondayOfWeek(today: string): string {
  const d = new Date(`${today}T00:00:00`)
  const dayOfWeek = d.getDay()
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  d.setDate(d.getDate() - daysFromMonday)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

const STATUS_BADGE: Record<LessonTaskStatus, { label: string; cls: string } | null> = {
  not_started: null,
  completed: { label: 'Done', cls: 'bg-green-100 text-green-700' },
  skipped: { label: 'Skipped', cls: 'bg-amber-100 text-amber-700' },
}

interface TodayLessonCardProps {
  childId: string
  today: string
  /** When provided, skips the internal fetch and uses these lessons directly. */
  externalLessons?: LessonTask[]
}

export function TodayLessonCard({ childId, today, externalLessons }: TodayLessonCardProps) {
  const [fetchedLessons, setFetchedLessons] = useState<LessonTask[]>([])
  const [isLoading, setIsLoading] = useState(externalLessons === undefined)
  const [error, setError] = useState<string | null>(null)

  const formattedToday = new Date(`${today}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  useEffect(() => {
    if (externalLessons !== undefined) return

    let cancelled = false

    const doFetch = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const week = mondayOfWeek(today)
        const all = await plannerApi.getLessons(week, [childId])
        if (!cancelled) {
          setFetchedLessons(all.filter(l => l.dueDate === today))
        }
      } catch {
        if (!cancelled) {
          setError("Could not load today's lessons.")
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    doFetch()
    return () => { cancelled = true }
  }, [childId, today, externalLessons])

  const lessons = externalLessons !== undefined
    ? externalLessons.filter(l => l.dueDate === today && l.childId === childId)
    : fetchedLessons

  const loading = externalLessons !== undefined ? false : isLoading

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Today — {formattedToday}</h3>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-5 bg-slate-100 rounded animate-pulse" />
          ))}
        </div>
      )}

      {!loading && error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {!loading && !error && lessons.length === 0 && (
        <p className="text-sm text-slate-400">No lessons scheduled for today.</p>
      )}

      {!loading && !error && lessons.length > 0 && (
        <ul className="space-y-2">
          {lessons.map(lesson => {
            const badge = STATUS_BADGE[lesson.status]
            return (
              <li
                key={lesson.id}
                className={`flex items-center justify-between gap-2 py-1.5 border-b border-slate-50 last:border-0 ${
                  lesson.status !== 'not_started' ? 'opacity-60' : ''
                }`}
              >
                <span className={`text-sm ${lesson.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                  {lesson.title}
                </span>
                {badge && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${badge.cls}`}>
                    {badge.label}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
