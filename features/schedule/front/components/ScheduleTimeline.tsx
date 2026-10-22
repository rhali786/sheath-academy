'use client'

import { useMemo, useState } from 'react'
import { Check, ChevronRight, Pencil } from 'lucide-react'
import type { DaySchedule, LessonScheduleEntry, ScheduleEntry } from '@/features/schedule/types'
import type { SubjectCourse } from '@/features/subjects/types'
import type { StudentProfile } from '@/features/lib/types'
import { getEntryTimelineStatus, type TimelineDisplayStatus } from '@/features/schedule/lib/timelineStatus'
import { groupTimelineEntries, type TimelineItem } from '@/features/schedule/lib/groupTimelineEntries'
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
  /**
   * Opens the editor for a lesson, in place. Without it rows have no pencil: the old
   * fallback jumped to /lessons?editId=, which no screen uses any more (UAT 8.2).
   */
  onEditLesson?: (id: string) => void
  /** Shows "Mark done" on lessons not yet done or skipped (a learner's My day). */
  onMarkDone?: (id: string) => void
  /**
   * Every learner in view ("All children"). When given, each lesson row names its learner(s)
   * and a shared lesson's copies at the same time are one row (feedback d0d386a4).
   */
  learners?: Pick<StudentProfile, 'id' | 'name'>[]
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

function LearnerChips({
  copies,
  currentTime,
  learnerNames,
  showStatus,
}: {
  copies: LessonScheduleEntry[]
  currentTime: string
  learnerNames: Map<string, string>
  showStatus: boolean
}) {
  return (
    <ul aria-label="Learners" className="flex flex-wrap gap-1 mt-1">
      {copies.map(copy => {
        const name = learnerNames.get(copy.lesson.childId) ?? 'Learner'
        const status = getEntryTimelineStatus(copy, currentTime)
        const label = showStatus && status !== 'none' ? STATUS_LABEL[status] : null
        return (
          <li
            key={copy.id}
            aria-label={label ? `${name}: ${label}` : name}
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${label && status !== 'none' ? STATUS_PILL[status] : 'bg-slate-100 text-slate-600'}`}
          >
            {name}
            {label && <span aria-hidden="true"> · {label}</span>}
          </li>
        )
      })}
    </ul>
  )
}

function TimelineRow({
  entry,
  copies,
  currentTime,
  subjectsById,
  learnerNames,
  isLast,
  onEditLesson,
  onMarkDone,
}: {
  entry: ScheduleEntry
  copies: LessonScheduleEntry[]
  currentTime: string
  subjectsById: Map<string, SubjectCourse>
  learnerNames?: Map<string, string>
  isLast: boolean
  onEditLesson?: (id: string) => void
  onMarkDone?: (id: string) => void
}) {
  const copyStatuses = new Set(copies.map(c => getEntryTimelineStatus(c, currentTime)))
  // A shared row whose learners are at different stages shows each one's status on their chip.
  const mixedStatus = copyStatuses.size > 1
  const status = mixedStatus ? 'none' : getEntryTimelineStatus(entry, currentTime)
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
                {learnerNames && copies.length > 0 && (
                  <LearnerChips
                    copies={copies}
                    currentTime={currentTime}
                    learnerNames={learnerNames}
                    showStatus={mixedStatus}
                  />
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <StatusPill status={status} />
                {isLesson && onMarkDone && entry.lesson.status !== 'completed' && entry.lesson.status !== 'skipped' && (
                  <button
                    type="button"
                    onClick={() => onMarkDone(entry.lesson.id)}
                    aria-label={`Mark ${entry.lesson.title} done`}
                    className="px-2 py-1 rounded-md text-xs font-medium border border-slate-200 text-slate-600 hover:bg-forest-50 hover:text-forest-900 transition-colors"
                  >
                    Mark done
                  </button>
                )}
                {isLesson && onEditLesson && (
                  <button
                    onClick={() => onEditLesson(entry.lesson.id)}
                    aria-label="Edit lesson"
                    className="p-1 rounded text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
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
  onEditLesson,
  onMarkDone,
  learners,
}: ScheduleTimelineProps) {
  const [schedule, setSchedule] = useState(initialSchedule)
  // A new schedule from the parent (e.g. refetched after an edit) replaces any local
  // "adjust day" changes. Without this the timeline kept drawing its first schedule
  // until a page reload (UAT 3.8).
  const [prevInitialSchedule, setPrevInitialSchedule] = useState(initialSchedule)
  if (initialSchedule !== prevInitialSchedule) {
    setPrevInitialSchedule(initialSchedule)
    setSchedule(initialSchedule)
  }

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

  const learnerNames = useMemo(
    () => (learners ? new Map(learners.map(l => [l.id, l.name])) : undefined),
    [learners],
  )

  // Shared lessons merge into one row only when rows name their learners.
  const items: TimelineItem[] = learnerNames
    ? groupTimelineEntries(entries)
    : entries.map(entry => ({ entry, copies: entry.kind === 'lesson' ? [entry] : [] }))

  if (entries.length === 0) {
    return (
      <p className="text-sm text-slate-400" data-testid="schedule-timeline-empty">
        No items scheduled for today.
      </p>
    )
  }

  return (
    <div data-testid="schedule-timeline">
      {items.map(({ entry, copies }, index) => (
        <TimelineRow
          key={entry.id}
          entry={entry}
          copies={copies}
          currentTime={currentTime}
          subjectsById={subjectsById}
          learnerNames={learnerNames}
          isLast={index === items.length - 1}
          onEditLesson={onEditLesson}
          onMarkDone={onMarkDone}
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
