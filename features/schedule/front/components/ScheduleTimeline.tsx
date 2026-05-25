'use client'

import { useMemo, useState } from 'react'
import { Check, ChevronRight } from 'lucide-react'
import type { DaySchedule, ScheduleEntry } from '@/features/schedule/types'
import type { SubjectCourse } from '@/features/subjects/types'
import { getEntryTimelineStatus, type TimelineDisplayStatus } from '@/features/schedule/lib/timelineStatus'
import {
  getBreakEntryStyle,
  getSubjectScheduleStyleBySubjectId,
} from '@/features/schedule/front/lib/subjectScheduleIcons'
import { ScheduleAdjustDay } from './ScheduleAdjustDay'

interface ScheduleTimelineProps {
  schedule: DaySchedule
  currentTime: string
  subjects?: SubjectCourse[]
  showAdjustDay?: boolean
  onScheduleChange?: (schedule: DaySchedule) => void
}

const STATUS_PILL: Record<Exclude<TimelineDisplayStatus, 'none'>, string> = {
  completed: 'bg-green-100 text-green-700',
  in_progress: 'bg-blue-100 text-blue-700',
  planned: 'bg-slate-100 text-slate-600',
  skipped: 'bg-amber-100 text-amber-700',
}

const STATUS_LABEL: Record<Exclude<TimelineDisplayStatus, 'none'>, string> = {
  completed: 'Completed',
  in_progress: 'In Progress',
  planned: 'Planned',
  skipped: 'Skipped',
}

function formatTime12(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 || 12
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`
}

function StatusPill({ status }: { status: TimelineDisplayStatus }) {
  if (status === 'none') return null
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_PILL[status]}`}
      data-testid={`timeline-status-${status}`}
    >
      {status === 'completed' && <Check className="h-3 w-3" aria-hidden="true" />}
      {status === 'in_progress' && <ChevronRight className="h-3 w-3" aria-hidden="true" />}
      {STATUS_LABEL[status]}
    </span>
  )
}

function TimelineRow({
  entry,
  currentTime,
  subjectsById,
  isLast,
}: {
  entry: ScheduleEntry
  currentTime: string
  subjectsById: Map<string, SubjectCourse>
  isLast: boolean
}) {
  const status = getEntryTimelineStatus(entry, currentTime)
  const isLesson = entry.kind === 'lesson'
  const style = isLesson
    ? getSubjectScheduleStyleBySubjectId(entry.lesson.subjectId, subjectsById)
    : getBreakEntryStyle(entry.kind)
  const Icon = style.Icon
  const title = isLesson ? entry.lesson.title : entry.title
  const subtitle = isLesson ? entry.lesson.description : undefined
  const isActive = status === 'in_progress'

  return (
    <div className="flex gap-3" data-testid={`timeline-entry-${entry.id}`}>
      <div className="flex flex-col items-center w-14 shrink-0 pt-0.5">
        <span className="text-xs font-medium text-slate-500 tabular-nums">{formatTime12(entry.startTime)}</span>
        <span className={`mt-2 h-2.5 w-2.5 rounded-full ${isActive ? style.dotClass : 'bg-slate-200'}`} />
        {!isLast && <span className="flex-1 w-px bg-slate-200 mt-1 min-h-[2rem]" aria-hidden="true" />}
      </div>
      <div className={`flex-1 pb-5 min-w-0 ${isActive ? 'rounded-lg bg-slate-50/80 -mx-1 px-1' : ''}`}>
        <div className="flex items-start gap-3">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${style.iconBgClass}`}
            aria-hidden="true"
          >
            <Icon className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{title}</p>
                {subtitle && (
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{subtitle}</p>
                )}
              </div>
              <StatusPill status={status} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ScheduleTimeline({
  schedule: initialSchedule,
  currentTime,
  subjects = [],
  showAdjustDay = true,
  onScheduleChange,
}: ScheduleTimelineProps) {
  const [schedule, setSchedule] = useState(initialSchedule)

  function handleScheduleChange(next: DaySchedule) {
    setSchedule(next)
    onScheduleChange?.(next)
  }

  const subjectsById = useMemo(() => {
    const map = new Map<string, SubjectCourse>()
    for (const s of subjects) map.set(s.id, s)
    return map
  }, [subjects])

  const entries = schedule.entries ?? schedule.blocks.map(b => ({
    kind: 'lesson' as const,
    id: b.id,
    lesson: b.lesson,
    startTime: b.startTime,
    endTime: b.endTime,
    durationMinutes: b.durationMinutes,
    instructionMode: b.instructionMode,
    flexibilityState: b.flexibilityState,
  }))

  if (entries.length === 0) {
    return (
      <p className="text-sm text-slate-400" data-testid="schedule-timeline-empty">
        No items scheduled for today.
      </p>
    )
  }

  return (
    <div data-testid="schedule-timeline">
      {entries.map((entry, index) => (
        <TimelineRow
          key={entry.id}
          entry={entry}
          currentTime={currentTime}
          subjectsById={subjectsById}
          isLast={index === entries.length - 1}
        />
      ))}

      {showAdjustDay && (
        <ScheduleAdjustDay
          schedule={schedule}
          currentTime={currentTime}
          onScheduleChange={handleScheduleChange}
        />
      )}
    </div>
  )
}
