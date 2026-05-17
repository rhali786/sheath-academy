'use client'

import { useEffect, useState } from 'react'
import { plannerApi } from '@/features/plan/front/services/api'
import type { LessonTask, LessonTaskStatus } from '@/features/plan/types'

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
  const [localStatuses, setLocalStatuses] = useState<Record<string, LessonTaskStatus>>({})

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

  const baseLessons = externalLessons !== undefined
    ? externalLessons.filter(l => l.dueDate === today && l.childId === childId)
    : fetchedLessons

  const lessons = baseLessons.map(l =>
    localStatuses[l.id] !== undefined
      ? { ...l, status: localStatuses[l.id] }
      : l
  )

  const loading = externalLessons !== undefined ? false : isLoading

  async function handleAction(lesson: LessonTask, status: 'completed' | 'skipped') {
    // Optimistic update
    setLocalStatuses(prev => ({ ...prev, [lesson.id]: status }))
    try {
      await plannerApi.completeLesson(lesson.id, status)
    } catch {
      // Revert on failure
      setLocalStatuses(prev => {
        const next = { ...prev }
        delete next[lesson.id]
        return next
      })
    }
  }

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
            const isPending = lesson.status === 'not_started'
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
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {badge && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.cls}`}>
                      {badge.label}
                    </span>
                  )}
                  {isPending && (
                    <>
                      <button
                        onClick={() => handleAction(lesson, 'completed')}
                        className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
                      >
                        Mark done
                      </button>
                      <button
                        onClick={() => handleAction(lesson, 'skipped')}
                        className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors"
                      >
                        Skip
                      </button>
                    </>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
