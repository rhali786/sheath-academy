'use client'

import type { DaySchedule } from '@/features/schedule/types'
import type { SubjectCourse } from '@/features/subjects/types'
import { ScheduleTimeline } from '@/features/schedule/front/components/ScheduleTimeline'

interface SchedulePageProps {
  schedule: DaySchedule
  subjects?: SubjectCourse[]
}

function getCurrentTime(): string {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

export function SchedulePage({ schedule, subjects = [] }: SchedulePageProps) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8" data-testid="schedule-page">
      <h1 className="page-title">
        Today&apos;s Schedule
        <span className="text-sm font-normal text-slate-400 ml-2">{schedule.date}</span>
      </h1>

      <div className="bg-white rounded-xl border border-slate-200 p-5 mt-6">
        <ScheduleTimeline
          schedule={schedule}
          currentTime={getCurrentTime()}
          subjects={subjects}
          showAdjustDay
        />
      </div>
    </div>
  )
}
