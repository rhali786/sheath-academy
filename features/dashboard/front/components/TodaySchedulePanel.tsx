'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { DaySchedule } from '@/features/schedule/types'
import type { SubjectCourse } from '@/features/subjects/types'
import { getScheduleFooterCounts } from '@/features/schedule/lib/scheduleFooterCounts'
import { ScheduleTimeline } from '@/features/schedule/front/components/ScheduleTimeline'

interface TodaySchedulePanelProps {
  schedule: DaySchedule
  currentTime: string
  subjects?: SubjectCourse[]
}

export function TodaySchedulePanel({ schedule, currentTime, subjects }: TodaySchedulePanelProps) {
  const [liveSchedule, setLiveSchedule] = useState(schedule)
  const calendarHref = `/plan/schedule?date=${schedule.date}`

  useEffect(() => {
    setLiveSchedule(schedule)
  }, [schedule])

  const { scheduledCount, plannedCount } = getScheduleFooterCounts(liveSchedule.entries ?? [])

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-5" data-testid="today-schedule-panel">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-900">Today&apos;s Schedule</h2>
        <Link href={calendarHref} className="text-sm font-medium text-forest-900 hover:underline">
          View Full Calendar
        </Link>
      </div>

      <ScheduleTimeline
        schedule={liveSchedule}
        currentTime={currentTime}
        subjects={subjects}
        onScheduleChange={setLiveSchedule}
      />

      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
        <Link
          href="/learning-time"
          data-testid="start-learning-time"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-forest-900 text-white text-sm font-semibold rounded-lg hover:bg-forest-800 transition-colors"
        >
          ▶ Start learning time
        </Link>
        <p className="text-xs text-slate-400" data-testid="schedule-footer-counts">
          {scheduledCount} of {plannedCount} items scheduled
          {' · '}
          <Link href="/plan" className="text-forest-900 hover:underline">
            View Day&apos;s Plan
          </Link>
        </p>
      </div>
    </section>
  )
}
