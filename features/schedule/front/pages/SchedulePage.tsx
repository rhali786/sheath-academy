'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { plannerApi } from '@/features/plan/front/services/api'
import { buildDailySchedule } from '@/features/schedule/server/service'
import { ScheduleTimeline } from '@/features/schedule/front/components/ScheduleTimeline'
import { useHousehold } from '@/features/household/front/context'
import { useLearner } from '@/features/layout/front/context/LearnerContext'
import { getCalendarRange } from '@/features/schedule/front/lib/calendarRange'
import { isOffDay } from '@/features/plan/utils/schoolDays'
import { CalendarNav } from '@/features/schedule/front/components/CalendarNav'
import { WeekCalendarView } from '@/features/schedule/front/components/WeekCalendarView'
import { MonthCalendarView } from '@/features/schedule/front/components/MonthCalendarView'
import { ScheduleAttendanceCapture } from '@/features/schedule/front/components/ScheduleAttendanceCapture'
import type { ViewMode } from '@/features/schedule/front/lib/calendarRange'
import type { LessonTask } from '@/features/plan/types'
import type { DaySchedule } from '@/features/schedule/types'

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

function getCurrentTime(): string {
  const n = new Date()
  return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`
}

function groupByDate(lessons: LessonTask[]): Map<string, LessonTask[]> {
  const map = new Map<string, LessonTask[]>()
  for (const lesson of lessons) {
    const key = lesson.dueDate
    const existing = map.get(key) ?? []
    existing.push(lesson)
    map.set(key, existing)
  }
  return map
}

export function SchedulePage() {
  const searchParams = useSearchParams()
  const { allSubjects, householdProfile, studentProfiles } = useHousehold()
  const { selectedChildId } = useLearner()
  const [lessons, setLessons] = useState<LessonTask[]>([])
  const [loading, setLoading] = useState(true)

  const selectedDate = useMemo(() => {
    const p = searchParams.get('date')
    return isValidDateParam(p) ? p : todayStr()
  }, [searchParams])

  const viewMode: ViewMode = useMemo(() => {
    const v = searchParams.get('view')
    return isValidViewMode(v) ? v : 'day'
  }, [searchParams])

  const weekStartDay = householdProfile?.weekStartDay === 'Sunday' ? 'Sunday' : 'Monday'

  const selectedDateIsOffDay = useMemo(
    () => isOffDay(new Date(`${selectedDate}T00:00:00`).getDay(), householdProfile?.schoolDays),
    [selectedDate, householdProfile?.schoolDays],
  )

  const range = useMemo(
    () => getCalendarRange(selectedDate, viewMode, weekStartDay),
    [selectedDate, viewMode, weekStartDay],
  )

  useEffect(() => {
    setLoading(true)
    const childIds = selectedChildId ? [selectedChildId] : undefined
    plannerApi
      .getLessons(undefined, childIds, undefined, range.startDate, range.endDate)
      .then(data => setLessons(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [range.startDate, range.endDate, selectedChildId])

  const lessonsByDate = useMemo(() => groupByDate(lessons), [lessons])

  const schedule: DaySchedule = useMemo(() => ({
    ...buildDailySchedule(lessonsByDate.get(selectedDate) ?? [], {
      startTime: '08:30',
      transitionMinutes: 10,
      defaultDurationMinutes: 30,
      includeSyntheticBreaks: true,
    }),
    date: selectedDate,
  }), [lessonsByDate, selectedDate])

  return (
    <div className="max-w-5xl mx-auto px-4 py-8" data-testid="schedule-page">
      <div className="flex items-center justify-between mb-2">
        <h1 className="page-title mb-0">
          Schedule
          <span className="text-sm font-normal text-slate-400 ml-2">{selectedDate}</span>
        </h1>
        {viewMode === 'day' && selectedDateIsOffDay && (
          <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
            Off day
          </span>
        )}
      </div>

      <div className="mt-4 mb-6">
        <CalendarNav />
      </div>

      {viewMode === 'day' && (
        <>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            {loading ? (
              <p className="text-sm text-slate-400 py-4">Loading…</p>
            ) : (
              <ScheduleTimeline
                schedule={schedule}
                currentTime={getCurrentTime()}
                subjects={allSubjects}
                showAdjustDay
              />
            )}
          </div>
          {householdProfile?.id && (
            <ScheduleAttendanceCapture
              selectedDate={selectedDate}
              householdId={householdProfile.id}
              studentProfiles={studentProfiles}
            />
          )}
        </>
      )}

      {viewMode === 'week' && (
        <WeekCalendarView
          days={range.days}
          lessonsByDate={lessonsByDate}
          loading={loading}
        />
      )}

      {viewMode === 'month' && (
        <MonthCalendarView
          days={range.days}
          lessonsByDate={lessonsByDate}
          focusedMonth={range.focusedMonth}
          loading={loading}
        />
      )}
    </div>
  )
}
