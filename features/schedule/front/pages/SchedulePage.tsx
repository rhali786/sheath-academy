'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { plannerApi } from '@/features/plan/front/services/api'
import { buildDailySchedule } from '@/features/schedule/server/service'
import { ScheduleTimeline } from '@/features/schedule/front/components/ScheduleTimeline'
import { useHousehold } from '@/features/household/front/context'
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

function getCurrentTime(): string {
  const n = new Date()
  return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`
}

export function SchedulePage() {
  const searchParams = useSearchParams()
  const { allSubjects } = useHousehold()
  const [lessons, setLessons] = useState<LessonTask[]>([])
  const [loading, setLoading] = useState(true)

  const selectedDate = useMemo(() => {
    const p = searchParams.get('date')
    return isValidDateParam(p) ? p : todayStr()
  }, [searchParams])

  useEffect(() => {
    setLoading(true)
    plannerApi
      .getLessons(undefined, undefined, undefined, selectedDate, selectedDate)
      .then(data => setLessons(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [selectedDate])

  const schedule: DaySchedule = useMemo(() => ({
    ...buildDailySchedule(lessons, {
      startTime: '08:30',
      transitionMinutes: 10,
      defaultDurationMinutes: 30,
      includeSyntheticBreaks: true,
    }),
    date: selectedDate,
  }), [lessons, selectedDate])

  return (
    <div className="max-w-5xl mx-auto px-4 py-8" data-testid="schedule-page">
      <h1 className="page-title">
        Today&apos;s Schedule
        <span className="text-sm font-normal text-slate-400 ml-2">{selectedDate}</span>
      </h1>

      <div className="bg-white rounded-xl border border-slate-200 p-5 mt-6">
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
    </div>
  )
}
