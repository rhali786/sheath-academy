'use client'

import { useRouter } from 'next/navigation'
import type { LessonTask } from '@/features/plan/types'

interface WeekCalendarViewProps {
  days: string[]
  lessonsByDate: Map<string, LessonTask[]>
  loading?: boolean
}

function formatDayLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function WeekCalendarView({ days, lessonsByDate, loading = false }: WeekCalendarViewProps) {
  const router = useRouter()

  if (loading) {
    return <p className="text-sm text-slate-400 py-4">Loading…</p>
  }

  function goToDay(date: string) {
    router.push(`?date=${date}&view=day`)
  }

  return (
    <div className="space-y-3" data-testid="week-calendar-view">
      {days.map(date => {
        const dayLessons = lessonsByDate.get(date) ?? []

        return (
          <div key={date} className="bg-white rounded-xl border border-slate-200 overflow-hidden" data-testid="week-day-section">
            <button
              onClick={() => goToDay(date)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200 hover:bg-slate-100 transition-colors text-left"
              data-testid="week-day-header"
              aria-label={`View ${date}`}
            >
              <span className="text-sm font-semibold text-slate-800">{formatDayLabel(date)}</span>
              {dayLessons.length > 0 && (
                <span className="text-xs font-medium text-slate-500 bg-slate-200 rounded-full px-2 py-0.5">
                  {dayLessons.length} {dayLessons.length === 1 ? 'lesson' : 'lessons'}
                </span>
              )}
            </button>

            <div className="px-4 py-2">
              {dayLessons.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">No lessons scheduled</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {dayLessons.map(lesson => (
                    <li key={lesson.id}>
                      <button
                        onClick={() => goToDay(date)}
                        className="w-full flex items-center gap-3 py-2 text-left hover:bg-slate-50 rounded transition-colors"
                      >
                        <span className="text-sm text-slate-800 font-medium flex-1">{lesson.title}</span>
                        <span className="text-xs text-slate-400 shrink-0">{lesson.estimatedDuration ?? '—'}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
