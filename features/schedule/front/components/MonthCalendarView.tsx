'use client'

import { useRouter } from 'next/navigation'
import type { LessonTask } from '@/features/plan/types'

interface MonthCalendarViewProps {
  days: string[]
  lessonsByDate: Map<string, LessonTask[]>
  focusedMonth: string
  loading?: boolean
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function dayNumber(dateStr: string): number {
  return parseInt(dateStr.slice(8), 10)
}

function isInMonth(dateStr: string, focusedMonth: string): boolean {
  return dateStr.startsWith(focusedMonth)
}

export function MonthCalendarView({ days, lessonsByDate, focusedMonth, loading = false }: MonthCalendarViewProps) {
  const router = useRouter()

  if (loading) {
    return <p className="text-sm text-slate-400 py-4">Loading…</p>
  }

  function goToDay(date: string) {
    router.push(`?date=${date}&view=day`)
  }

  // Split days into weeks of 7
  const weeks: string[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  return (
    <div data-testid="month-calendar-view">
      {/* Weekday header row */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAY_LABELS.map(label => (
          <div key={label} className="text-center text-xs font-semibold text-slate-500 py-2">
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        {weeks.map((week, wi) => (
          <div key={wi} className={`grid grid-cols-7 ${wi < weeks.length - 1 ? 'border-b border-slate-200' : ''}`}>
            {week.map(date => {
              const inMonth = isInMonth(date, focusedMonth)
              const lessons = lessonsByDate.get(date) ?? []
              const dayNum = dayNumber(date)

              return (
                <div
                  key={date}
                  data-testid="month-day-cell"
                  data-lead-trail={!inMonth}
                  onClick={inMonth ? () => goToDay(date) : undefined}
                  className={[
                    'min-h-[72px] p-2 border-r border-slate-200 last:border-r-0 flex flex-col gap-1',
                    inMonth
                      ? 'bg-white cursor-pointer hover:bg-slate-50 transition-colors'
                      : 'bg-slate-50 cursor-default',
                  ].join(' ')}
                >
                  <span
                    data-testid={inMonth ? `month-day-${dayNum}` : undefined}
                    className={[
                      'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full',
                      inMonth ? 'text-slate-800' : 'text-slate-300',
                    ].join(' ')}
                  >
                    {dayNum}
                  </span>

                  {inMonth && lessons.length > 0 && (
                    <span className="text-xs text-forest-700 bg-forest-50 rounded px-1.5 py-0.5 font-medium leading-tight">
                      {lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
