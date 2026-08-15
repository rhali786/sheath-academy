'use client'

import { useEffect, useState } from 'react'
import { learningTimeApi } from '@/features/learning-time/front/services/api'
import { plannerApi } from '@/features/plan/front/services/api'
import type { CreateSessionInput, LearningTimeSession } from '@/features/learning-time/types'
import type { LessonTask } from '@/features/plan/types'
import type { RecurringScheduleBlock, SubjectCourse } from '@/features/subjects/types'
import type { DayOfWeek } from '@/features/lib/types'

const DURATION_LABELS: Record<string, string> = {
  '15min': '15 min',
  '30min': '30 min',
  '45min': '45 min',
  '1hr': '1 hr',
  custom: 'Custom',
}

function durationLabel(duration: string | undefined): string {
  if (!duration) return 'No duration set'
  return DURATION_LABELS[duration] ?? duration
}

const DAY_ORDER: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function formatTime12(time: string): string {
  const [h, m] = time.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return time
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

/**
 * Finds the soonest upcoming { day, time } across a course's recurringSchedule blocks,
 * relative to `now` — today (if its time hasn't passed) or the next matching day this week/next.
 * Pure and does not auto-generate lesson instances (out of scope for Wave 3 part 2).
 */
function nextScheduledOccurrence(
  schedule: RecurringScheduleBlock[] | undefined,
  now: Date,
): { day: DayOfWeek; time: string } | null {
  if (!schedule || schedule.length === 0) return null
  const todayIndex = now.getDay()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()

  let best: { daysAhead: number; startTime: string; day: DayOfWeek } | null = null
  for (const block of schedule) {
    for (const day of block.daysOfWeek) {
      const dayIndex = DAY_ORDER.indexOf(day)
      if (dayIndex === -1) continue
      let daysAhead = (dayIndex - todayIndex + 7) % 7
      const [h, m] = block.startTime.split(':').map(Number)
      const startMinutes = (h || 0) * 60 + (m || 0)
      if (daysAhead === 0 && startMinutes <= nowMinutes) daysAhead = 7 // today's slot already passed
      if (
        !best ||
        daysAhead < best.daysAhead ||
        (daysAhead === best.daysAhead && block.startTime < best.startTime)
      ) {
        best = { daysAhead, startTime: block.startTime, day }
      }
    }
  }
  if (!best) return null
  return { day: best.day, time: formatTime12(best.startTime) }
}

const secondaryButtonClass = 'px-4 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50'

interface QuickStartByCourseListProps {
  learnerId: string
  /** Current-school-year courses; only courses enrolling learnerId are shown. */
  allSubjects: SubjectCourse[]
  onStarted: (session: LearningTimeSession) => void
  /** Wrapper class, e.g. for spacing/border in the host layout. Not applied when the list is empty (nothing renders). */
  className?: string
}

/**
 * "Quick start by course" — one-click start of a stopwatch session for a course, without any
 * extra configuration step. Shared between the Learning Time page (NowCard) and the Dashboard's
 * Today panel so starting a session doesn't require leaving the Dashboard.
 */
export function QuickStartByCourseList({ learnerId, allSubjects, onStarted, className }: QuickStartByCourseListProps) {
  const [lessons, setLessons] = useState<LessonTask[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    plannerApi.getLessons(undefined, [learnerId], undefined)
      .then(result => {
        if (cancelled) return
        setLessons(result.filter(l => l.status === 'not_started'))
      })
      .catch(() => {
        if (!cancelled) setLessons([])
      })
    return () => { cancelled = true }
  }, [learnerId])

  const courses = allSubjects
    .filter(s => (s.learnerIds ?? []).includes(learnerId))
    .map(s => {
      const nextLesson = lessons
        .filter(l => l.subjectId === s.id)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]
      const nextScheduled = nextScheduledOccurrence(s.recurringSchedule, new Date())
      return { id: s.id, name: s.name, duration: nextLesson?.estimatedDuration, nextScheduled }
    })

  async function handleStart(course: { id: string; name: string }) {
    setError(null)
    try {
      const input: CreateSessionInput = {
        learnerId,
        timeChannelType: 'stopwatch',
        subjectId: course.id,
      }
      const created = await learningTimeApi.createSession(input)
      const started = await learningTimeApi.transition(created.data.id, { action: 'start' })
      onStarted(started.data)
    } catch {
      setError('Failed to start session. Please try again.')
    }
  }

  if (courses.length === 0) return null

  return (
    <div className={className} data-testid="quick-start-list">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Quick start by course</p>
      <ul className="space-y-2">
        {courses.map(qc => (
          <li key={qc.id} className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">{qc.name}</p>
              <p className="text-xs text-slate-400" data-testid={`quick-start-duration-${qc.id}`}>
                {durationLabel(qc.duration)}
              </p>
              {qc.nextScheduled && (
                <p className="text-xs text-slate-400" data-testid={`quick-start-next-scheduled-${qc.id}`}>
                  Next scheduled: {qc.nextScheduled.day} {qc.nextScheduled.time}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => handleStart(qc)}
              data-testid={`quick-start-course-${qc.id}`}
              className={secondaryButtonClass}
            >
              Start
            </button>
          </li>
        ))}
      </ul>
      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
    </div>
  )
}
