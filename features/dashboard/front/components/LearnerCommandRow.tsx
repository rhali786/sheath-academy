'use client'

import type { StudentProfile } from '@/features/lib/types'

export interface LearnerCommandRowMetrics {
  /** Percentage of recorded attendance days this week that were "present"; null when nothing recorded. */
  attendancePercent: number | null
  lessonsCompleted: number
  /** Lessons due today for this learner; 0 means "no lessons scheduled today" (renders as no-data, not 0/0). */
  lessonsTotal: number
  /** Gradebook overallMastery (composer-safe current grade); null when the learner has no scored subjects. */
  currentGrade: number | null
}

interface LearnerCommandRowProps {
  learner: StudentProfile
  metrics: LearnerCommandRowMetrics
  onSelect: (childId: string) => void
}

export function LearnerCommandRow({ learner, metrics, onSelect }: LearnerCommandRowProps) {
  const { attendancePercent, lessonsCompleted, lessonsTotal, currentGrade } = metrics

  return (
    <button
      type="button"
      onClick={() => onSelect(learner.id)}
      data-testid={`learner-command-row-${learner.id}`}
      className="w-full flex items-center justify-between gap-4 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
    >
      <span className="font-semibold text-slate-800 text-sm truncate">{learner.name}</span>
      <span className="flex items-center gap-4 text-sm text-slate-600 shrink-0">
        <span className="flex flex-col items-end" data-testid={`learner-command-row-${learner.id}-attendance`}>
          <span className="tabular-nums">{attendancePercent === null ? '—' : `${attendancePercent}%`}</span>
          <span className="text-[10px] uppercase tracking-wide text-slate-400">Attendance</span>
        </span>
        <span className="flex flex-col items-end" data-testid={`learner-command-row-${learner.id}-lessons`}>
          <span className="tabular-nums">{lessonsTotal === 0 ? '—' : `${lessonsCompleted}/${lessonsTotal}`}</span>
          <span className="text-[10px] uppercase tracking-wide text-slate-400">Today</span>
        </span>
        <span className="flex flex-col items-end" data-testid={`learner-command-row-${learner.id}-grade`}>
          <span className="tabular-nums">{currentGrade === null ? '—' : currentGrade}</span>
          <span className="text-[10px] uppercase tracking-wide text-slate-400">Grade</span>
        </span>
      </span>
    </button>
  )
}
