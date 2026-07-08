'use client'

import { ChevronRight } from 'lucide-react'
import type { StudentProfile } from '@/features/lib/types'
import { gradeFromBands } from '@/features/gradebook/server/aggregation'
import { childColors } from '@/features/dashboard/front/theme'

export interface LearnerCommandRowMetrics {
  /** Percentage of school-year-to-date recorded attendance days that were "present"; null when nothing recorded. */
  attendancePercent: number | null
  lessonsCompleted: number
  /** Lessons due today for this learner; 0 renders as "0 / 0", not a blank dash. */
  lessonsTotal: number
  /** Gradebook overallMastery (composer-safe current grade); null when the learner has no scored subjects. */
  currentGrade: number | null
}

interface LearnerCommandRowProps {
  learner: StudentProfile
  metrics: LearnerCommandRowMetrics
  onSelect: (childId: string) => void
  /** Row position among active learners — alternates the avatar color, matching QuranStreak / LearnerSwitcher. */
  colorIndex?: number
}

/** Shared grid so the header row and every learner row line up column-for-column. */
export const LEARNER_ROW_GRID = 'grid grid-cols-[minmax(0,210px)_repeat(3,1fr)_28px] gap-3 items-center'

function toneForPercent(percent: number): { text: string; bar: string } {
  if (percent >= 90) return { text: 'text-green-700', bar: 'bg-green-500' }
  if (percent < 60) return { text: 'text-amber-700', bar: 'bg-amber-500' }
  return { text: 'text-slate-900', bar: 'bg-forest-600' }
}

function Bar({ percent, tone }: { percent: number; tone: string }) {
  return (
    <div className="h-1.5 w-full max-w-[130px] rounded-full bg-slate-100 overflow-hidden mt-1.5">
      <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} />
    </div>
  )
}

export function LearnerCommandRow({ learner, metrics, onSelect, colorIndex = 0 }: LearnerCommandRowProps) {
  const { attendancePercent, lessonsCompleted, lessonsTotal, currentGrade } = metrics
  const initials = learner.avatarInitials ?? learner.name.slice(0, 1).toUpperCase()
  const avatarColor = childColors[colorIndex % childColors.length]
  const grade = currentGrade === null ? null : gradeFromBands(currentGrade)
  const gradeRounded = currentGrade === null ? null : Math.round(currentGrade)
  const attendanceShown = attendancePercent ?? 0
  const attendanceTone = toneForPercent(attendanceShown)
  const lessonsPercent = lessonsTotal > 0 ? (lessonsCompleted / lessonsTotal) * 100 : 0
  const lessonsTone = toneForPercent(lessonsPercent)

  return (
    <button
      type="button"
      onClick={() => onSelect(learner.id)}
      data-testid={`learner-command-row-${learner.id}`}
      className={`w-full ${LEARNER_ROW_GRID} px-4 py-3 text-left hover:bg-forest-50 transition-colors`}
    >
      <span className="flex items-center gap-3 min-w-0">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white text-sm font-bold"
          style={{ backgroundColor: avatarColor }}
          aria-hidden="true"
        >
          {initials}
        </span>
        <span className="min-w-0">
          <span className="block font-semibold text-slate-800 text-sm truncate">{learner.name}</span>
          <span className="block text-xs text-slate-400 truncate">{learner.gradeLabel}</span>
        </span>
      </span>

      <span data-testid={`learner-command-row-${learner.id}-attendance`}>
        <span className={`block text-lg font-bold tabular-nums ${attendanceTone.text}`}>
          {attendanceShown}%
        </span>
        <Bar percent={attendanceShown} tone={attendanceTone.bar} />
      </span>

      <span data-testid={`learner-command-row-${learner.id}-lessons`}>
        <span className={`block text-lg font-bold tabular-nums ${lessonsTone.text}`}>
          {lessonsCompleted} <span className="text-sm font-medium text-slate-400">/ {lessonsTotal}</span>
        </span>
        <Bar percent={lessonsPercent} tone={lessonsTone.bar} />
      </span>

      <span data-testid={`learner-command-row-${learner.id}-grade`}>
        {grade === null ? (
          <span className="text-lg font-bold text-slate-300">—</span>
        ) : (
          <span className="inline-flex items-center rounded-lg border border-forest-200 bg-forest-50 px-2.5 py-1 text-sm font-bold text-forest-700 tabular-nums">
            {grade.letter} · {gradeRounded}%
          </span>
        )}
      </span>

      <ChevronRight className="h-4 w-4 text-slate-300 justify-self-center" aria-hidden="true" />
    </button>
  )
}
