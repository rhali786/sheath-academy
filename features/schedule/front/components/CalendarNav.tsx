'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useHousehold } from '@/features/household/front/context'
import { getCalendarRange } from '@/features/schedule/front/lib/calendarRange'
import type { ViewMode } from '@/features/schedule/front/lib/calendarRange'

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function isValidDateParam(s: string | null): s is string {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const [y, m, d] = s.split('-').map(Number)
  const p = new Date(y, m - 1, d)
  return `${p.getFullYear()}-${String(p.getMonth() + 1).padStart(2, '0')}-${String(p.getDate()).padStart(2, '0')}` === s
}

function isValidViewMode(s: string | null): s is ViewMode {
  return s === 'day' || s === 'week' || s === 'month'
}

const VIEWS: { mode: ViewMode; label: string }[] = [
  { mode: 'day', label: 'Day' },
  { mode: 'week', label: 'Week' },
  { mode: 'month', label: 'Month' },
]

export function CalendarNav() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { householdProfile } = useHousehold()

  const selectedDate = (() => {
    const p = searchParams.get('date')
    return isValidDateParam(p) ? p : todayStr()
  })()

  const viewMode: ViewMode = (() => {
    const v = searchParams.get('view')
    return isValidViewMode(v) ? v : 'day'
  })()

  const weekStartDay = householdProfile?.weekStartDay === 'Sunday' ? 'Sunday' : 'Monday'
  const range = getCalendarRange(selectedDate, viewMode, weekStartDay)

  function navigate(date: string, view: ViewMode) {
    router.push(`?date=${date}&view=${view}`)
  }

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap" data-testid="calendar-nav">
      {/* Prev / Next / Today */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(range.navigatePrev, viewMode)}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-forest-500 focus:ring-offset-2 transition-colors"
          aria-label="Previous"
        >
          ← Previous
        </button>
        <button
          onClick={() => navigate(range.navigateNext, viewMode)}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-forest-500 focus:ring-offset-2 transition-colors"
          aria-label="Next"
        >
          Next →
        </button>
        <button
          onClick={() => navigate(todayStr(), viewMode)}
          className="px-4 py-2 text-sm font-medium text-white bg-forest-900 border border-forest-900 rounded-lg hover:bg-forest-800 focus:outline-none focus:ring-2 focus:ring-forest-500 focus:ring-offset-2 transition-colors"
          aria-label="Today"
        >
          Today
        </button>
      </div>

      {/* Day / Week / Month switcher */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1" role="group" aria-label="View mode">
        {VIEWS.map(({ mode, label }) => {
          const isActive = viewMode === mode
          return (
            <button
              key={mode}
              onClick={() => navigate(selectedDate, mode)}
              aria-pressed={isActive}
              className={[
                'px-4 py-1.5 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-forest-500 focus:ring-offset-1',
                isActive
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900',
              ].join(' ')}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
