'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { DaySchedule } from '@/features/schedule/types'
import type { SubjectCourse } from '@/features/subjects/types'
import { getScheduleFooterCounts } from '@/features/schedule/lib/scheduleFooterCounts'
import { ScheduleTimeline } from '@/features/schedule/front/components/ScheduleTimeline'
import { EditLessonModal } from '@/features/dashboard/front/components/EditLessonModal'
import { QuickStartByCourseList } from '@/features/learning-time/front/components/QuickStartByCourseList'

interface TodaySchedulePanelProps {
  schedule: DaySchedule
  currentTime: string
  subjects?: SubjectCourse[]
  /** Selected learner, if any. Enables inline quick-start; without it we link to /learning-time. */
  learnerId?: string | null
  /** Called after a lesson is saved via the inline edit popup, so the caller can refetch. */
  onLessonSaved?: () => void
}

export function TodaySchedulePanel({ schedule, currentTime, subjects, learnerId, onLessonSaved }: TodaySchedulePanelProps) {
  const [liveSchedule, setLiveSchedule] = useState(schedule)
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null)
  const [startedSession, setStartedSession] = useState(false)
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
        onEditLesson={setEditingLessonId}
      />

      <div className="mt-4 pt-3 border-t border-slate-100">
        {learnerId ? (
          startedSession ? (
            <p className="text-sm text-forest-700" data-testid="quick-start-started">
              Session started — <Link href="/learning-time" className="underline">open Learning Time</Link> to view it.
            </p>
          ) : (
            <QuickStartByCourseList
              learnerId={learnerId}
              allSubjects={subjects ?? []}
              onStarted={() => setStartedSession(true)}
            />
          )
        ) : (
          <Link
            href="/learning-time"
            data-testid="start-learning-time"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-forest-900 text-white text-sm font-semibold rounded-lg hover:bg-forest-800 transition-colors"
          >
            ▶ Start learning time
          </Link>
        )}
        <p className="text-xs text-slate-400 mt-3" data-testid="schedule-footer-counts">
          {scheduledCount} of {plannedCount} items scheduled
          {' · '}
          <Link href="/plan" className="text-forest-900 hover:underline">
            View Day&apos;s Plan
          </Link>
        </p>
      </div>

      {editingLessonId && (
        <EditLessonModal
          lessonId={editingLessonId}
          onClose={() => setEditingLessonId(null)}
          onSaved={() => onLessonSaved?.()}
        />
      )}
    </section>
  )
}
